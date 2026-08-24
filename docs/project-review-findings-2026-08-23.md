# ISCMS — Project Review Findings

Date: 2026-08-23
Scope: full-repo static review + live API probe (running dev server, GM account) + test suite run.
Verification: `npm run lint` (tsc) clean, `npm test` 194/194 passing after rate-limit cooldown.

---

## 1. Executive summary

The architecture is fundamentally sound: one Express server (server.ts) + React SPA, a shared
RBAC config (`src/config/permissions.ts`) imported by both sides, Prisma with 65 models, 162
unique backend routes, and a typed `domainApi` layer covering every route family the frontend
uses. No missing interfaces were found — every frontend endpoint resolves to a real backend
route, and lint/tests pass.

The real problems are in three areas:

1. **A dual data-source design that is still half-migrated.** The frontend boots on a 2,700-line
   mock dataset and only switches to the API after login (`useApi: true`). Several write paths
   still bypass the API entirely.
2. **RBAC gaps between the permission matrix and reality** — GM/Director silently lose fleet and
   marketing data on the live server even though the UI shows those modules to them.
3. **Operational fragility**: a 500-req/15min global API limiter that the frontend's own login
   hydrate burst (25+ parallel calls) can trip, plus a 305KB single-file server.

---

## 2. Findings

### F1 — HIGH — GM/Director get 403 on Fleet, Marketing data (RBAC matrix vs. UI mismatch)

Live-probed with the seeded GM account (`sarah.akello@iscms.ug`):

| Endpoint | Result | Guard |
|---|---|---|
| `/api/vehicles` | **403** | `requireModuleAccess("fleet")` |
| `/api/leads` | **403** | `requireModuleAccess("leads")` |
| `/api/collections` | **403** | `requireAnyRole(...)` — GM not in list |

But the permission matrix says GM/Director have `view` on fleet (`src/config/permissions.ts:132`)
and the Fleet page (`FleetPage`, `src/pages/ModulePages.tsx:560`) renders `domain.vehicles` for
every role. The GM sees the Fleet UI fed by **stale mock data**, never server data — silently,
because `hydrateFromApi` swallows every error with `.catch(() => [])`.

Root cause: the matrix was updated (GM view on fleet) but the server route guard uses
`"fleet"` while the client module key for vehicles is `vehicles` (`SERVER_MODULE_TO_CLIENT`
maps `vehicles → fleet` at permissions.ts:256) — the GET route checks `fleet` but the
permission table has no GM entry problem there; the actual 403 comes from `leads` and
`collections` where GM genuinely has no entry, plus `vehicles` where the GET checks `fleet`
but the matrix entry exists — verify: the 403 on `/api/vehicles` means
`effectiveModuleAccess("fleet", GM)` returned undefined, i.e. the deployed permission table
differs from what the UI assumes.

**Fix direction:** reconcile the three sources of truth — `MODULE_PERMISSIONS` entries,
the per-route guard strings in server.ts, and what the UI renders per role. Add GM/Director
to `leads` and the `collections` role list, or hide those modules from them client-side.
Also: `hydrateFromApi` should surface errors (toast/banner) instead of silently keeping mock data.

### F2 — HIGH — User provisioning (Add User) never reaches the backend

`authStore.addUser` (`src/stores/authStore.ts:178`) creates `id: usr-${Date.now()}` locally
and never calls the API. Same for `deleteUser` (line 208) — local-only. Only `updateUser`
has a `useApi` branch. The backend has `POST /api/auth/register` (IT-officer-guarded) and
`DELETE /api/auth/users/:id`, and `authApi.registerUser` exists but **no component calls it**.

Consequence: an IT Officer provisions a user in the UI, it vanishes on next login/refresh
(users list re-fetched from server), and the user cannot actually log in — no credentials
were ever created server-side.

**Fix direction:** wire `AddUserModal` → `authApi.registerUser` (backend generates the
password or returns a one-time one), wire `deleteUser` → `DELETE /api/auth/users/:id`,
and refresh the users list from the server response.

### F3 — HIGH — Mock data still powers production views

`src/data/mockData.ts` is 2,727 lines and is the **initial state** of `domainStore` for every
module (securityOfficers, sites, invoices, armoury, k9s, fleet, HR...). Until login succeeds
and `hydrateFromApi` overwrites each slice, all UIs render fictional records. Two views are
permanently mock-fed even in API mode:

- `SecurityOfficersHRView` (`SecurityOfficersHRView.tsx:43`): HR remittances come from
  `initialHRRemittanceRecords` — `const [remits] = useState(initialHRRemittanceRecords)` —
  no API, no store. There is no `/api/remittances` backend route at all.
- `ITAdminView` (`ITAdminView.tsx:35`): `itAssets = initialITAssets` as a prop default —
  if the store slice is empty the IT admin sees fictional hardware.

**Fix direction:** either build the remittances backend (model + routes) or clearly mark the
panel as demo data. Empty-store fallbacks should render an empty state, not mock rows.

### F4 — MEDIUM — Rate limiter breaks the app's own login flow

`apiLimiter` (server.ts:143): 500 requests / 15 min / IP. On login the frontend fires
`hydrateFromApi` — 25+ parallel GETs — plus per-user fetches. My probe of ~50 endpoints
tripped it in one pass; a shared-office NAT or a user re-logging in a few times does the same,
and every failure is swallowed (`.catch(() => [])`) so the user just sees mock/empty data with
no explanation. The auth limiter (20/15min) also locks out legitimate multi-account testing
(e.g. the contract approval walkthrough in test-logins.md uses 6 accounts).

**Fix direction:** exempt or raise the limit for authenticated GET reads (or key the limiter
by user id when a token is present), keep it strict for unauthenticated traffic, and make 429
visible in the UI.

### F5 — MEDIUM — server.ts is a 6,758-line monolith

All 162 routes live in one file (305KB). `src/server/routers/` exists (auth,
securityOfficers) and `src/routes/` holds the digital-contract routers, so the pattern is
established — the remaining ~140 routes just never moved. This is the main maintainability
risk: merge conflicts, unreviewable diffs, and slow navigation.

**Fix direction:** incremental extraction — one router file per domain (fleet, hr, finance,
marketing, it, operations), mounting under `/api`. No behavior change, pure moves.

### F6 — MEDIUM — `err: any` catch blocks swallow typed errors (28 sites)

`catch (err: any)` with `err.message` in DigitalContractsView (7x), ActingRequestPanel,
ActingRequestsITQueue, authStore, domainStore, etc. Works, but discards the zod/HTTP error
shape the backend actually returns (`{ error: string }` is already parsed in apiClient and
re-thrown as `Error` — the `any` is never needed).

**Fix direction:** `catch (e)` + `e instanceof Error ? e.message : "..."`, or a
`getErrorMessage(e: unknown)` util in one place.

### F7 — LOW — Duplicate/parallel type definitions

- `src/types.ts` (1,263 lines, hand-written domain types) + `src/types/index.ts`
  (re-export barrel) + `src/generated/prisma/models/*` (65 generated model types).
  Frontend types drift from Prisma models with nothing checking them (e.g. `FuelRequisitionLog`
  vs Prisma's `FuelLog` naming).
- `src/api/index.ts` duplicates `src/services/apiClient.ts` (both are fetch wrappers; only
  apiClient has auth). `checkServerHealth` in api/index.ts is the only export — fold it into
  services/ and delete the file.

### F8 — LOW — Dead/legacy root scripts

`check-seed.cjs`, `check-seed-simple.js`, `verify_final.mjs`, `verify_it.mjs` at repo root are
one-off debug scripts from earlier sessions. The scattered root docs (`SESSION_LOG_*.md`,
`RAILWAY_FIX.md`, `TEST_LOGINS.md`, `PROJECT_REVIEW_AND_WORKPLAN.md`,
`ISCMS-Implementation-Lockdown-Spec.md` and two 100KB+ spec .md files) have since been
reorganized: specs live in `docs/specs/`, references in `docs/`, deploy notes in `deploy/`;
session logs and the dead scripts are candidates for removal.

### F9 — LOW — UX polish items spotted in code

- **AddUserModal** has no password field yet the backend register endpoint requires one —
  the UI cannot succeed even if wired (needs a generated-password display, matching your
  usual one-time-password preference).
- **Idle logout** is a hard 30-min timer with a modal message; there is no "stay logged in?"
  prompt before it fires (authStore.logout reason="idle").
- **Walkthrough modal** re-shows per user id via localStorage — fine, but `showWelcomeBanner`
  resets every login; consider a dismiss-persisted flag.
- **FleetView** keeps `localVehicles` state mirrored from props via useEffect
  (FleetView.tsx:60-62) — a derived-state antipattern that will desync on concurrent edits;
  prefer computing from props directly.

### F10 — INFO — What checked out clean

- Every one of the 52 frontend path families maps to a real backend route — **no missing
  backend interfaces** for what the UI calls.
- RBAC middleware is consistent: every mutating route I sampled has `authenticateToken` +
  module/role guards; custom-permission overrides and acting-role additive logic are
  implemented server-side (server.ts:659-681) and covered by tests.
- `npm run lint` clean; **194/194 tests pass** (RBAC suite included).
- `.env` not committed; helmet, CORS config, upload dir outside client path, JWT with
  refresh rotation + revocation table all present.
- No `console.log` litter in src/; zero unused imports surfaced by tsc.

---

## 3. Repetition audit (your specific question)

| Item | Count | Note |
|---|---|---|
| `catch (err: any)` | 28 | F6 — same 3-line pattern, extract one helper |
| Modal components | 40+ in organisms/ | each re-implements backdrop/panel/close chrome; a shared `<Modal>` exists in molecules/ but most don't use it |
| `useDomainStore()` full-store subscribes | throughout ModulePages | subscribes components to the entire store — every slice change re-renders them; use selectors (`s => s.vehicles`) |
| Prop drilling vs store | both patterns mixed | e.g. HRView receives 20+ props that all come from the same store the child could read |
| mockData initial-state duplication | every store slice | mock arrays mirror Prisma shapes — deleted once F3 is done |
| Two fetch wrappers | 2 | api/index.ts + services/apiClient.ts (F7) |

Biggest repetition win: standardize on the existing `molecules/Modal` + `atoms/` inputs for
the 40+ organism modals, and replace full-store subscribes with selectors — that alone would
cut a large share of the re-render cost and ~1,000 lines of modal chrome.

---

## 4. Recommended order of attack

1. F1 — RBAC reconciliation (GM/Director visibility) — data-correctness bug users can hit today.
2. F2 — Wire Add/Delete user to the backend — silent data loss.
3. F4 — Rate-limit tuning + stop swallowing hydrate errors.
4. F3 — Retire mockData from API-mode paths; empty states instead.
5. F6/F7/F8 — mechanical cleanups (error helper, delete api/index.ts, prune root scripts).
6. F5 — Router extraction, one domain at a time, purely mechanical.

---

## 5. Probe evidence

Live probe (dev server on :3000, GM token): 47 endpoints hit — 40 returned 200 with sane
payload shapes (e.g. `security-officers array[13]`, `sites array[59]`, `contracts array[47]`),
3 returned 403 (F1), the remainder 429 after the limiter tripped (F4). Full probe script at
`/tmp/api-probe.mjs` (re-runnable: `node /tmp/api-probe.mjs`).
