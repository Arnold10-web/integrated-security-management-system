# ISCMS — Project Review & Workplan (Consolidated)

**Date:** 2026-08-16
**Origin:** This document consolidates two previously separate working references into one:
- `PROJECT_REVIEW.md` (2026-08-14) — static, read-only code review of the whole repository.
- `WORKFLOW-PLAN.md` (2026-08-13 session log) — role-centric workspace & workflow blueprint plus its implementation history.

**Purpose:** A single source that (A) records what the system was criticized for and what the remediation priorities are, and (B) defines how the role-centric workspace/workflow model is *supposed* to behave and what has been built toward it. The former live tracker `CURRENT_STATUS.md` no longer exists in the working tree (as of 2026-08-16 verification); this document is now the sole consolidated record.

---

# Part 1 — Code Review & Remediation

> Produced 2026-08-14 by Muse Code (automated review via static inspection — sandbox `bwrap` unavailable, so no `bash`/`build`/`test` execution; all findings from reading `package.json`, `server.ts`, `prisma/schema.prisma`, `src/**`, `tests/**`, `vite.config.ts`, etc.). Items marked **Fixed/Improved/Partial** reflect the status at the time of writing (2026-08-16); the former `CURRENT_STATUS.md` tracker no longer exists.

## 1.0 TL;DR — The 10 things that would block this from going to production

| # | Finding | Status now |
|---|---|---|
| 1 | **Monomolithic `server.ts`** (~3k+ lines, everything from auth to armoury) | **Partial** — `src/server/` boundary exists, not yet wired |
| 2 | **Stringly-typed data model** — most Prisma enums/statuses/dates are free-form `String` | **Partial** — 12+ Prisma enums introduced; key dates moved to `DateTime` (e.g. `joinDate`, `actingExpiresAt`) but many biodata/ID-card dates remain `String` |
| 3 | **Dual source of truth (mockData ↔ DB)** — demo mode runs off `mockData.ts`; `useApi` writes are fire-and-forget | **By design** — demo vs API mode; `syncApi` error swallowing remains |
| 4 | **RBAC defined three times, already diverging** (`MODULE_PERMISSIONS`, `getAllowedModuleIds`, `getPermissionsForRole`) | **Fixed** — single `src/config/permissions.ts` + `check:rbac` gate |
| 5 | **Auth is localStorage JWT, 24 h, no refresh, no httpOnly cookie** | **Fixed** — 15m JWT + rotating refresh + httpOnly cookies (localStorage Bearer kept as secondary path) |
| 6 | **Force Number allocator is a full table scan with a race** | **Fixed** — `ForceNumberSequence` transaction |
| 7 | **Store god-objects** — `domainStore.ts` (~800+ lines, 80+ actions) with side-effects inside state updates | **Partial** — `guardsStore.ts` extracted; `domainStore.ts` still large |
| 8 | **No real test coverage** — 5 test files, mock fixtures not DB contracts | **Improved** — 194 tests incl. 144 RBAC + engine flows; API integration tests against a disposable Postgres still missing |
| 9 | **Security middleware permissive where it matters** — CSP `unsafe-inline`/`unsafe-eval`, rate limit 1000/15min, uploads check extension not content | **Fixed** — strict prod CSP, tightened limiters, upload MIME sniff |
| 10 | **Build/deploy story ad-hoc** — `react-example` name, Vite in both dep sets, Vite imported by server in prod, no Dockerfile/healthcheck/graceful shutdown | **Fixed** — clean build script, systemd + nginx runbooks, hardening checklist; no Dockerfile |

Fix 1–4 were the gate before feature work; the rest have been staged.

## 1.1 Architecture — What the System Wants to Be vs. What It Is

### What works
- **Domain is well-understood.** The org model (`src/constants/organization.ts`) — Directorate / Operations / Investigations (independent) / HR / Marketing / Finance / Admin / IT — is explicit and consistent with `src/types.ts`'s 23-role union. The hierarchy *is* the spec; that is a strong foundation.
- **Prisma + Postgres + `@prisma/adapter-pg`** is a sound choice for v7. Generator emits to `src/generated/prisma` and the datasource is env-configured — correct for Prisma Postgres / Compute.
- **Separation intent is right:** `constants/modules` → route catalog → department groups; `rbacService` → presentation gates; Express → enforcement gates. GM/Director get `view` not `full` on operational modules.

### What is not right
- **`server.ts` is a god file.** Auth, 40+ CRUD endpoints, Zod schemas, RBAC tables, file uploads, force-number allocation, seed, and Vite dev-server wiring all live in one file. No router modules, no controller/service layer, no `src/server/**`.
- **`domainStore.ts` is the frontend twin-god.** 385-line interface, 80+ actions, `syncApi(...).catch(()=>{})` sprinkled into every mutation. It imports `useAuthStore`, `useAuditStore`, `useNotificationStore` and calls `audit()` + `notif()` *inside* state updates — side-effects with no rollback if the API call fails.
- **No API layer boundary.** `src/services/apiClient.ts` / `domainApi.ts` exist but `domainStore` mostly bypasses them via the generic `syncApi` helper. Pagination, optimistic updates, and cache invalidation are all missing — every `GET /api/guards` loads the whole table and filtering happens client-side.
- **`server.ts` imports Vite at runtime** (`createViteServer`), tying prod to a dev dependency.
- **No request context / dependency injection.** `prisma` is a module-global singleton; no `req.prisma` / `req.user` typing beyond `(req as any).user`; `prisma` is never `$disconnect()`-ed on `SIGTERM`.

**Recommendation:** split `server.ts` into `src/server/{app.ts, routers/*.ts, services/*.ts, middleware/*.ts}` behind a single `createApp(prisma, config)` factory. Make `domainStore` a thin query-cache and move `audit`/`notif` to middleware/interceptors.

## 1.2 Data Model — `prisma/schema.prisma`

### What works
- 30+ models covering a genuinely complex domain (Guards, Sites, Armoury, Fleet, K9, Finance, HR, Campaigns, Workflows, Contracts, etc.) without over-normalization — pragmatic for a first vertical.
- Guard lifecycle (`GuardLifecycleStage` enum) and custom role / permission overrides match the product narrative.

### What is not right (with current status)
1. **Types are strings where they must be enums** — `User.role`, `Guard.status`, `Guard.designation`, `ClientSite.slaStatus`, `ArmouryItem.condition`, `Invoice.status`, `LeaveRequest.status`, `Contract.status`, `Vehicle.status`, and ~20 more were `String`. **→ Partial**: 12+ Prisma enums introduced (`GuardStatus`, `GuardDesignation`, `ContractStatus`, etc.); `User.role`/`User.status` and some status fields remain `String` by design.
2. **Dates are strings** — `joinDate`, `startDate`, `endDate`, `leave.*`, `contract.endDate`, `audit.timestamp`, `user.actingExpiresAt` were `String`; lexicographic sorting and client-parsing risk. **→ Partial**: key dates moved to `DateTime` (`Guard.joinDate`, `User.actingExpiresAt`/`actingGrantedAt`, `Guard.desertionDate`); ID-card/biodata dates (`idCardIssuedDate`, `dateOfBirth` on `User`/`Guard`) remain `String`.
3. **Missing relations / foreign keys** — bare `String` FKs with no `@relation`, no `onDelete`/`onUpdate` (Guard.region, DutyRoster.guardId/siteId, ArmouryLog.guardId, K9Log.k9Id, VehicleTripLog.vehicleId, LeaveRequest.guardId, Contract.relatedForceNumber). `User.forceNumber`/`Guard.forceNumber` are separate uniques, not company-wide. **→ Partial**: force number now atomically allocated via `ForceNumberSequence`; FK/relation work remains.
4. **`Guard` is a 70-field table** — a biodata dump sharing the hot read path (privacy: NIN, TIN, NSSF, bankAccount, relatives). **→ Fixed**: `GuardBiodata` PII split. Staff biodata now mirrors this on `User` (2026-08-16 feature batch).
5. **Index & query discipline** — only `Contract.endDate` had `@@index`; list endpoints did full scans + in-memory filters. **→ Fixed**: harden-indexes migration; DB push-down queries.
6. **Misc** — `DeploymentOrder.assignedGuardIds`/`CustomRoleDefinition.allowedModules` are `String[]` (consider join tables); `Document.mimeType`/`filePath` lack checksum/bytes; `AuditLog.timestamp: String` duplicates `createdAt`.

## 1.3 Backend — `server.ts`

### 1.3.1 Security (with current status)
| Area | Finding | Status |
|---|---|---|
| Helmet CSP | `scriptSrc` allowed `unsafe-inline`+`unsafe-eval` in non-prod; prod omitted CSP | **Fixed** — strict prod CSP |
| CORS | Single-origin allow-list `localhost:5173` | Tightened |
| Rate limiting | `1000 req/15min` global | **Fixed** — brute-force limiter added |
| JWT | `expiresIn:"24h"`, localStorage bearer, no refresh/revocation | **Fixed** — 15m JWT + rotating hashed refresh tokens + jti revocation + per-request DB revalidation |
| Passwords | `bcrypt.hash(...,10)`, `min(6)` rule | Acceptable; breached-password check could be added |
| File uploads | Extension-only allow-list; `GET /uploads/:filename` traversal risk | **Fixed** — MIME sniff + traversal guards + `nosniff` |
| JSON body | `limit:"10mb"` | Could be tightened |
| Auth duality | Three RBAC enforcement styles coexisted | **Fixed** — normalized to `requireModuleAccess` single source |
| Secrets | `DATABASE_URL!` non-null asserted, no startup env schema | Add `zod` env schema |

### 1.3.2 Validation & error handling
- Schemas locally correct but incomplete (no NIN/phone/force-number formats). `seedDatabase` fire-and-forget with no `.catch`; `syncApi(...).catch(()=>{})` hides failures. No centralized `errorHandler` middleware (an error in `fileFilter` becomes a 500). **→ Improved**: modular `src/server/middleware/upload.ts` added; centralization of errors still partial.

### 1.3.3 Force Number — `nextForceNumber()`
Scanned **entire** Driver/Guard/User tables, computed `max` in-process, racy under concurrency. **→ Fixed**: `ForceNumberSequence` table + transaction. (2026-08-16: `forceNumber` is now the single canonical identity — `guardCode` fully removed.)

### 1.3.4 API design
- No versioning (`/api/*`), no OpenAPI/contract (client `src/types.ts` vs server `z` schemas diverge in optionality), inconsistent pagination/filters (contracts recompute `contractEffectiveStatus` in JS), `GET /uploads/:filename` returns any UUID-named file with no ownership check.

## 1.4 RBAC — The Triple-Definition Problem

The product promise is *least-privilege by department (§15.1)*; the mechanism was fractured in code:
1. **`server.ts: MODULE_PERMISSIONS`** — authoritative Express table (30+ modules × ~23 roles).
2. **`src/constants/modules.ts: getAllowedModuleIds()`** — client navigation gate, *coarser* than server.
3. **`src/services/rbacService.ts: getPermissionsForRole()`** — third encoding with a too-permissive fallback.

**Observed divergences (spot-checked):** Armorer → `guards:view`/`armoury:full` (server) vs `["operations"]` (modules) vs `full` on armoury/operations/inventory (rbacService). IT Officer treated as omnipotent in `FULL_EDIT_ROLES`. Guard Officer default-return privilege escalation path. **Custom permissions** key by client module id while server keys by server module name via a manually-maintained, incomplete mapping.

**→ Fixed:** RBAC normalized to a single source (`src/config/permissions.ts`) with the `check:rbac` drift gate (`npm run check:rbac`). Per-user overrides are still an opaque `Json` blob (an auditable `UserPermissionGrant` table remains a recommendation).

## 1.5 Frontend

### What works
- **Vite + React 19 + React Router 7 + Tailwind 4** coherent modern stack; `@tailwindcss/vite` and `@vitejs/plugin-react` correctly wired.
- **Zustand stores** lightweight; **department-first navigation** (`APP_MODULE_GROUPS`) gives every role a coherent home.

### What is not right
- **Mock-first, not API-first** — `authStore` ships `users: initialUsers`; `hydrateSession` trusts `localStorage` without hitting `/api/auth/me`; `loginWithApi` flips `useApi` *after* login. An attacker who can write `localStorage` can impersonate any mock user.
- **State is not owned** — `GuardsHRView` keeps its own `leaves`/`apprs`/`contracts`/`remits` local state in parallel to `domainStore` props (double-source, easy to de-sync).
- **No loading / error / empty states**; `syncApi` failures swallowed so the UI optimistically shows the new entity forever.
- **ID & cost generation client-side and brittle** — `id: "grd-"+Date.now()`, client-count-based `SL-2026-###`, `CTR-${Date.now()}`. Let the server allocate codes.
- **CSV export unsafe** — `exportCSV` concatenated unescaped quotes; leading `= + - @` formula injection. **→ Fixed**: `sanitizeCsvValue` + `exportUtils.downloadCsv`.
- **Props are enormous** — `GuardsHRView` takes 18 props; factor out a `can(role, action)` hook.
- **Type drift** — `LeaveRequest.status` union vs Prisma default `"Pending Regional Approval"`, `StaffAppraisal.status` vs `PerformanceReview.status`.
- **Styling functional but inconsistent** — hardcoded Tailwind colors duplicating the design system; `motion`/`recharts`/`docx`/`file-saver`/`dompurify` possibly dead weight (verify with `depcheck`).
- **Accessibility & i18n missing** — no `aria-*` on Lucide icons, no keyboard traps tested for modals, no `en-UG` currency formatting, dates are bare `YYYY-MM-DD`.

## 1.6 Auth & Session

- **Storage:** `localStorage` persists *identity*, not proof; move to httpOnly `Secure` cookie + CSRF token, or at least `sessionStorage`. **→ Fixed (cookies now primary; localStorage Bearer kept as secondary path; `authService` TODO notes cookie-only migration).**
- **Idle timeout:** 30-min client timer only; server still honors JWT lifetime. Server-side idle enforcement still a gap.
- **Acting delegation (§5.4):** well-designed feature, but state in `User.actingRole/actingExpiresAt` strings snapshotted into JWT at login; no re-validation middleware, no background expiry cleanup. **→ Improved**: expiry moved to `DateTime` (acting-privilege request flow added, `20260815202353_acting_privilege_requests`); per-request re-validation now in the auth middleware.
- **Status check:** server's `authenticateToken` now re-checks `User.status` per request (a suspended user's JWT no longer keeps working).
- **Password policy:** `min(6)`, no complexity/history/lockout — rate limiter is not a substitute.

## 1.7 Code Quality & Maintainability

- Duplication: guard forms (`GuardsHRView` local state vs `useGuardForm`), RBAC tables (now single-source), contract/approval `action === "approve"/"issue"/"archive"` patterns implemented ad-hoc per route.
- Long functions & magic strings: `contractAllowedEditFields` enumerates allowed fields with no shared type; `MODULE_DISPLAY_NAMES` hand-synced.
- Dead code & misnamed deps: `package.json` `name:"react-example"`, `version:"0.0.0"`, `vite` in both dep sets.
- No shared validation between `createGuardSchema` (server) and `useGuardForm` (client).
- Error codes are human strings only — add machine-parseable `code: "FORBIDDEN_MODULE"` for i18n/client branching.
- Git hygiene: no `.env.example` (now added); `uploads/` gitignore; `src/generated/prisma` ignored (correct).

## 1.8 Operational Excellence / DevX / Tooling

- `tsconfig.json` strict; `src` is the only `include` so root `server.ts` was unchecked by `lint` **→ Partial** (`tsc --noEmit` covers whole project; `lint:eslint` covers `src` only, not `server.ts`/`scripts`).
- `vitest.config.ts` minimal; `testTimeout:20000`/`fileParallelism:false` suggests papering over slow/flaky tests. Add coverage thresholds + per-file isolated Postgres schema.
- `vite.config.ts` alias `"@": "."` → repo root (unusual); `DISABLE_HMR` watch toggle is an agent-edits workaround.
- Scripts: `lint` was `tsc --noEmit` only **→ now** + `lint:eslint`, `format`, `prisma:validate`, `check:rbac`.
- Env: no `NODE_ENV` guard on `/api/auth/seed` beyond runtime 404; seed users share `password123` (credential stuffing risk on leaked seed DB).
- Deploy: `esbuild` bundle drops `server.ts`'s `fs`/`path` relative assumptions; containers must run with `WORKDIR` matching repo root. No Dockerfile/healthz/graceful shutdown. **→ Fixed**: `deploy/DEPLOY.md`, `deploy/iscms.service`, `deploy/HARDENING.md`; still no Dockerfile.

## 1.9 Testing

- **Exists:** `security-rbac.test.ts`, `permission-overrides.test.ts`, `force-number.test.ts`, `module-access.test.ts`, `dashboard/consolidateMetrics.test.ts`.
- **Missing:** API integration tests that boot `app` + a test Postgres per role (the hardest, most important test); property test for force-number concurrency; contract test for acting-role expiry; upload traversal/MIME tests; audit-log invariant tests; perf test for `GET /api/guards` at 10k rows.
- **Mock vs DB:** tests run `environment:"node"` with no DB — they exercise `rbacService.ts`/`modules.ts`, not the Express middleware that enforces them.

## 1.10 Documentation

- Prisma header + force-number block comments are excellent inline docs — keep that style and extend to an ADR log (`docs/adr/001-rbac-triple-definition.md`, etc.).
- Missing: API contract (OpenAPI), RBAC decision-tree diagram, threat model, PII retention policy (NIN/TIN/bank), `CONTRIBUTING.md` explaining the mock-vs-API (`useApi`) duality.

## 1.11 Prioritized Remediation — Do This Next

### P0 — Before any demo to an external stakeholder
1. **Normalize RBAC** — single source `config/permissions.ts`, generate server + client maps, failing drift test. **→ Done** (`check:rbac`).
2. **Shrink types at the DB boundary** — Prisma enums for `Guard.status`, `LeaveRequest.status`, `Contract.status`; convert date strings to `DateTime`; backfill migration. **→ Partial** (12+ enums + key DateTime fields; biodata/ID-card dates remain `String` — see §1.2).
3. **Fix auth storage & session lifetime** — httpOnly cookie or `15m` + refresh; `authenticateToken` re-checks `User.status` + acting expiry per request. **→ Done** (15m JWT + rotating refresh + httpOnly; per-request revalidation).
4. **De-monolith `server.ts` + `domainStore.ts`** — extract routers/services, remove `syncApi().catch(()=>{})` silencers, surface errors/loading states. **→ Partial** (`src/server/` scaffolded, not wired).

### P1 — Before production deploy
5. **Force number as a sequenced transaction** — `ForceNumberSequence` + `$transaction`. **→ Done**.
6. **Upload hardening** — MIME sniff, storage outside `process.cwd()`, signed URLs, `Content-Disposition: attachment`. **→ Done** (modular `upload.ts` middleware).
7. **Indexes & query push-down** — `@@index([region])`, `where:{region}`. **→ Done** (harden-indexes migration).
8. **Real API integration tests** with disposable Postgres covering every `MODULE_PERMISSIONS` cell. **→ Pending.**

### P2 — Quality of life
9. ESLint + Prettier + `prisma validate` + `depcheck`; fix `package.json` name/version; dedupe `vite`. **→ Done** (lint:eslint/format/prisma:validate added).
10. `healthz`, graceful shutdown, structured JSON logging (`pino`), OpenAPI from Zod. **→ Pending.**
11. Split `Guard` biodata into a restricted table gated by HR Manager / Records Officer. **→ Done** (`GuardBiodata` split).

## 1.12 Positive Notes — What to Keep

- **Organizational modeling** is unusually thoughtful (field ladder `Guard → Site In-Charge → Inspector → RM`; investigations as independent dept).
- **Prisma v7 + adapter-pg** is current; generator output path clean; 13-region seed idiomatic.
- **Acting delegation** is a rare, well-designed feature — keep it, just move expiry to `DateTime` + middleware re-check (done).
- **Department-first navigation** and `getDefaultPathForRole` give each role a coherent home.
- **Security intent is present** (`helmet`, `cors`, `rateLimit`, `bcrypt`, `zod`) — the issues were tuning, not absence.

---

# Part 2 — Workflow & Workspace Blueprint

> Single working reference for the **role-centric workspace** replan. Replaces the module-centric navigation model: every role lands on a curated workspace of panels — owned full-CRUD where they command, read-only summaries + request actions elsewhere. No role is ever handed another department's module through navigation.

## 2.1 Architecture principles

1. **Workflow Engine is the single source of truth** for every approval chain. Entity status is derived from the linked `Approval`.
2. **Three-tier access**: `none` (invisible), `summary` (curated read-only projection + allowed request/verify actions), `full` (owner CRUD). Enforced server-side via summary endpoints — a non-owner literally cannot fetch the full dataset.
3. **Cross-department work is typed requests** flowing through the engine (TransportRequest, ContractInquiry, SiteSurvey) — this is why no role needs another module's CRUD.
4. **Client mirrors server**: one `actOnApproval` path, always synced. No dual logic.
5. **Workflow definitions are data, not code** — configured in the IT Workflow Engine UI, seeded with defaults, department-configurable.

## 2.2 Locked decisions

| Decision | Outcome |
|---|---|
| Leave | Submit → **HR Manager** approves (staff & guards; HR Assistant is NOT an approver). **GM optionally** adds final approval for *staff* leave only. Regional/Ops steps removed. |
| Contracts | No Ops approval step. Chain: **Site Survey** (Ops/RM fills) → Marketing drafts from survey data → Finance validates → GM (≥100M) → Active. |
| Contract value | Visible to Operations Manager in his view-only snapshot. |
| Contract access | **No self-service search for anyone.** All contract information goes through the **Records Officer inquiry** path (interactive form → RO searches → responds with confirmation or browser print-to-PDF). |
| Contract PDF | Browser print-to-PDF (existing contract-template pattern). |
| Requests | Typed models (TransportRequest, ContractInquiry, SiteSurvey) with zod validation + workflow linkage. |
| Requisitions | **Interactive form available to any staff** (IT, Records Officer, HR, Finance, Ops, …). **Final approver is the General Manager** for all requisitions. |
| Ops workspace | `/operations` is a **single tabbed workspace** (Overview, Deployments, Personnel, Armoury, Canine Unit, Patrols, Surveys & Contracts, Oversight, Reports). No dropdown menus — the top nav is flattened. Ops Manager owns **only Deployment Order CRUD + Guard Lifecycle transitions**; Armoury/K9/Patrol are log-only actions there. Armorer / K9 Supervisor / Training Officer get dedicated CRUD views via role-branching on `/operations`. Regional Manager sees the same workspace region-scoped. |

## 2.3 Operations Manager workspace (the centerpiece)

| Section | Tier | Data source | Shows | Actions |
|---|---|---|---|---|
| Command Strip | full | derived | Shifts filled today, on duty vs required, open deployment orders, open incidents, pending approvals | jump-to-section |
| Regions Command | full | RegionalOffice + derived | Region cards: RM, active guards, shifts filled %, checked-in, open incidents, open deployment orders, vault status | drill → RegionDashboardView; Issue Deployment Order |
| Deployment Orders | full | DeploymentOrder | Open→filled pipeline, headcount vs assigned per region | create / track fill |
| Shifts & Attendance | full | DutyRoster | Per-site: scheduled vs checked-in, on-time/late, overtime | add/edit shifts (owned) |
| Guard Lifecycle Board | full | Guard.lifecycleStage | ENROLLED→HANDED→TRAINING→PASSED→DEPLOYED with counts | stage transitions |
| Training Academy Oversight | summary | TrainingCohort/RecruitTrainee | In-training, qualified/pass-out, competency split | view (Training Officer owns CRUD) |
| Investigations Collaboration | summary | DisciplinaryAction, Incident, Complaint | Conduct flags, charge sheets, incidents, referrals | add notes/evidence, escalate; never finalize (IO owns) |
| Fleet Readiness | summary | Fleet/Transport | Vehicles, motorcycles, drivers, riders counts; available-to-move; alerts | **Request Transport** |
| Armoury Status | summary | ArmouryItem + ArmouryLog | Total/available/issued, who-holds-which-serial-when, alerts | view only (Armorer owns) |
| K9 Readiness | summary | K9Dog + K9Log | Active dogs, handlers, vet flags, deployments | view only (K9 Supervisor owns) |
| Site Surveys | full | SiteSurvey | Survey requests from Marketing, in-progress/completed, reports | fill survey, submit, **generate report** |
| Contracts Snapshot | summary | Contract | Active/expiring contracts for their sites **incl. value** | **Inquiry → Records Officer** |
| Staff & Client Analytics | summary | PerformanceReview, sites, invoices | Their staff appraisal ratings; per-site coverage vs SLA, incidents, contract value | view |
| Recruitment Pipeline | summary | JobPosting/Candidate | Open guard positions, candidates in training → deployable | view only |
| Activity & Audit Feed | summary | AuditLog | Recent actions on their entities | view |

## 2.4 Key workflows

### 1. Site Survey → Contract (contract enabler)
```
Marketing (lead/client site) ─Request Site Survey─► Ops Manager / Regional Manager (region-scoped)
   ▲                                                         │
   │  interactive multi-step form: client & site identity,    │
   │  premises type, perimeter, entry points, risk level,     │
   │  high-value assets, armed/unarmed day+night guards,      │
   │  equipment (CCTV, lighting, radio), K9 need, patrol      │
   │  vehicle need, access hours, recommendation              │
   │                                                          ▼
   └── Site Survey Report (print-to-PDF) ◄── Submit ── Completed
                    │
                    ▼
   BDM/SMS drafts contract from survey data → Finance validates → GM (≥100M) → Active
```

### 2. Transport Request (any staff → Fleet Manager)
```
Any role ─interactive form: destination, purpose, date/time, return, vehicle type, passengers─►
   TransportRequest (Pending Fleet) ─► Fleet Manager inbox ─► Grant (assign driver + vehicle,
                                                               or rider + motorcycle)
                                                              or Decline (reason)
Requester sees live status in outbox; granted → assigned driver/vehicle; available-to-move decrements.
```

### 3. Contract Inquiry (Records Officer path only)
```
Requester ─interactive form: client, site, search hints, purpose (confirm exists | full copy)─►
   ContractInquiry (Pending) ─► Records Officer inbox ─► Respond: Confirmation or Contract PDF ─► requester outbox
```

### 4. Leave (HR-owned)
```
Guard/Staff submits ─► HR Manager approves ─► [staff only, optional] GM approves ─► Approved
Rejected at any step with reason. No Regional/Ops/Assistant steps.
```

### 5. Requisition (any staff → GM)
```
Any staff ─interactive form: item description, quantity, estimated cost, priority, department─►
   AdminRequisition (Pending Approval) ─► General Manager approves/rejects ─► Approved → Procured / Rejected
```

## 2.5 Data model additions

- **SiteSurvey** — clientName, siteName, region, status (Requested → In Progress → Completed), requestedBy, surveyedBy, survey fields (JSON + key columns), reportPath.
- **TransportRequest** — requestCode, requestedBy, destination, purpose, travelDate/Time, returnTime, vehicleType (Car/Motorcycle/Any), passengers, status (Pending Fleet → Approved/Declined), assignedVehicleId, assignedDriverId, assignedRiderId, declinedReason, approvalId.
- **ContractInquiry** — inquiryCode, requestedBy, clientName, siteName, searchHints, purpose (Confirmation | Full Copy), status (Pending → Answered), respondedBy, responseType, responsePath.
- **WorkflowStep** — add `approverRoles` (set), `optional`, `regionScoped`, `condition`.
- **Approval** — add real relation to Workflow, `regionScope`, `decidedBy`, `decidedAt`, status enum.

## 2.6 Engine hardening (P0)

- Client `actOnApproval` must call `PUT /api/approvals/:id/act` and reconcile with the server response. **→ Done** (optimistic update + rollback on error).
- Add `DELETE /api/workflows/:id`. **→ Done**.
- Act route: add `requireModuleAccess("workflow")`, approver-set matching, region scoping, correct actorName. **→ Done**.
- Seed default workflows (leave, contract, disciplinary, expense, campaign, requisition, transport). **→ Done**.

## 2.7 Phase plan

| Phase | Scope | Status |
|---|---|---|
| **P0** | Engine hardening + seeding; three-tier RBAC; summary-endpoint infra; workspace panel framework + inbox/outbox | ✅ |
| **P1** | Ops workspace v1: Regions Command + Fleet Readiness + full Transport Request flow + Inbox/Outbox | ✅ |
| **P2** | Site Survey workflow + report generation + contract-draft linkage | ✅ |
| **P3** | Leave realignment + Contracts Snapshot + Records Officer inquiry flow | ✅ |
| **P4** | Ops deep panels: Lifecycle, Training competency, Shifts & Attendance, Deployments, Armoury/K9/Investigations collaboration, Analytics, Audit feed | ✅ |
| **P5** | Fleet Manager / Records Officer / Investigations workspaces + notifications engine | ✅ |
| **P6** | Marketing, Finance, Directorate, Administration overhauls + cleanup + full RBAC tests | ✅ |

## 2.8 Department roadmaps (next after Operations)

- **Marketing**: workspace with lead pipeline (owned), campaign budget approvals (FM→GM), site-survey requests outbox, client-site creation from Closed-Won leads, complaint ownership (owned).
- **Finance**: invoices (owned), expenses (FM→GM), cashier (owned), contracts valuation step (summary), transport requests, requisition approvals visibility, payroll-prep summaries.
- **Directorate**: consolidated KPI dashboard (existing `ConsolidatedDashboardMetrics`), company-wide approvals inbox (GM final sign-off surfaces), department exception alerts, region rollups.
- **Administration**: inventory/uniforms/shoes (owned), **requisitions intake + status tracking**, asset issuance to guards.
- **Requisitions**: interactive form surfaced in every workspace; single GM final approval; status tracking (Pending Approval → Approved → Procured / Rejected).

---

# Part 3 — Implementation Status (session log)

> Historical record of how the blueprint was built, session by session. Snapshot of the working tree at the time of writing (2026-08-16); no separate `CURRENT_STATUS.md` exists — this document is now the live reference.

## Session 1 — engine + transport backend (P0)
- **Schema**: `WorkflowStep` + `approverRoles` (JSON), `optional`, `regionScoped`, `condition`; `Approval` + `regionScope`, `decidedBy`, `decidedAt`, `meta` (JSON); new `TransportRequest` model. Migration `20260813123917_workflow_engine_v2_transport` applied.
- **server.ts** — workflow engine hardened: `POST /api/workflows` accepts new step fields; `DELETE /api/workflows/:id`; `POST /api/approvals` accepts `regionScope`/`meta`; `PUT /api/approvals/:id/act` now `requireModuleAccess("workflow")`, approver-set matching, region-scoping from `dbUser.region`, persists `decidedBy`/`decidedAt`, records audit with real actor name, supports optional-step skip. Helpers: `approverRolesOf()`, `safeJson()`.
- **Transport Request flow**: `GET /api/transport-requests` (broad module allow-list), `POST` (any authenticated, `TRP-` code, audit), `PUT .../act` (Fleet Manager only; approve requires `assignedVehicle`, decline requires `reason`).
- **Requisitions opened to any staff**: `GET`/`POST /api/requisitions` no longer role-restricted.
- **Client wiring**: `src/types.ts` types; `src/services/domainApi.ts` `approvals.act()` + `transportRequests`; `src/stores/domainStore.ts` `actOnApproval` now optimistic-then-sync with rollback + `addTransportRequest`/`actOnTransportRequest`; hydrate wired.
- **Seed**: `defaultWorkflows` upserted — LEAVE-REQ, CONTRACT-CLI, DISCIPLINE, EXPENSE, CAMPAIGN-BUDGET, REQUISITION (GM final), TRANSPORT-REQ (Fleet Manager).

## Session 1 — Ops workspace UI (P1 core)
- **`OperationsWorkspaceView.tsx`** (new): Regions Command (region cards with drill → Region Dashboard), Fleet Readiness, My Requests outbox, Transport Inbox (Fleet Manager only), Request Transport + New Requisition modals (any authenticated role).
- **`ModulePages.tsx`**: `OperationsPage` renders the workspace as landing (deep modules preserved below a divider); `FleetPage` shows shared `TransportInbox` for Fleet Manager.

### Verified (session 1)
`npm run lint` passes; `npx prisma generate` + `npm run seed` passes (26 users); `npm run test` 159 passed / 2 pre-existing rounding failures in `dashboard/consolidateMetrics.test.ts` (66.67 vs 67); `test:rbac` 117 passed.

## Session 2 — P2/P3 core + GM workspace
- **Site Survey workflow (P2)**: `SiteSurvey` model (surveyCode, clientName, siteName, region, status Requested→In Progress→Completed→Cancelled, requestedBy/Name/Department, surveyedBy, survey fields, reportPath). Migration `20260813130158_workflow_engine_v3_site_survey_contract_inquiry`. Server: `GET /api/site-surveys`, `POST` (any authenticated, `SS-` code), `PUT :id/start` + `:id/complete` (Ops Manager / Regional Manager, region-scoped), `PUT :id/cancel`. Client: type, `domainApi.siteSurveys`, store actions + hydrate. UI: `SiteSurveysPanel.tsx` — request modal, role-gated start/complete/cancel, completed cards, **Print Report** (browser print-to-PDF). Mounted on Operations page.
- **Contract Inquiry (P3)**: `ContractInquiry` model (inquiryCode, requestedBy/Name, requesterDepartment, clientName, siteName, searchHints, purpose Confirmation|Full Copy, status Pending→Answered, respondedBy, responseType, responseNotes, responsePath, respondedAt). Server: `GET/POST /api/contract-inquiries`, `PUT .../respond` (**Records Officer only**). UI: `ContractInquiryPanel.tsx` — RO inbox + everyone-else outbox. Mounted on Identity (Records) and Directorate pages.
- **Contracts Snapshot (P3)**: `ContractsSnapshotPanel.tsx` — Ops Manager sees active/expiring client contracts incl. value UGX (region-scoped), with Contract Inquiry launcher (no self-service search). Mounted on Operations page.
- **GM workspace**: `GeneralManagerWorkspaceView.tsx` — requisition approve/reject (GM final), engine approvals inbox (region-filtered), company posture snapshot. Added `workflow` to GM/Director `getAllowedModuleIds`.
- **Leave realignment (partial)**: `PUT /api/leave-requests/:id/hr-approve` now **HR Manager only**.
- **Seed**: SITE-SURVEY (Ops Manager + Regional Manager, regionScoped) and CONTRACT-INQ (Records Officer) workflows upserted.

### Verified (session 2)
Lint + seed pass; test 159 / 2 pre-existing; migration status clean; live API smoke on port 3100 (survey POST → start → complete, inquiry → RO respond, GM 403); **Ops nav realignment** — Ops Manager now sees only Operations (+ Fleet, Reports), Regional Manager only Operations (+ Fleet); HR/Marketing/Investigations tabs removed from Ops top-nav.

## Session 4 — leave realignment + identity + P4/P5/P6 core
- **P3 full Leave realignment**: submit → HR Manager → optional GM on the engine (`createLeaveApproval`/`actOnLeaveApproval`), HR Assistant 403, legacy regional/ops routes 410, reject engine-backed. Verified live.
- **forceNumber canonical identity**: `Guard.forceNumber @unique` + migration `20260814120000_add_guard_force_number` (backfill = guardCode); guard create defaults forceNumber to guardCode; graduation sets it; seed assigns PSG026/001–012 (guards) and PSG026/101–126 (staff users); `nextForceNumber` scans `Guard.forceNumber`.
- **P4 Ops deep panels** (`OpsDeepPanels.tsx`): Command Strip, Deployment Orders, Shifts & Attendance, Guard Lifecycle Board, Training Academy Oversight, Investigations Collaboration, Armoury Status, K9 Readiness, Staff & Client Analytics, Recruitment Pipeline, Activity & Audit Feed — keyed by force number.
- **P5 workspaces**: Fleet Manager Workspace, Records Officer Workspace, Investigations Workspace + notifications engine wired on leave submit/approve/reject/advance, transport submit/act, site survey submit/complete (→ draft contract notify), contract inquiry submit/respond, requisition submit/approve/reject.
- **P6 Directorate**: Regional Rollup & Exceptions section in `GeneralManagerWorkspaceView`.
- **P6 RBAC tests** (`security-rbac.test.ts`, 144 passing): force-number guard enrolment, leave engine, transport act, contract inquiry respond, site survey act, requisitions.

## Session 5 — P6 department overhauls
- `DeptOverhauls.tsx`: MarketingWorkspaceStrip (pipeline KPIs, conversion), FinanceWorkspaceStrip (cash position, receivables, overdue, pending approvals), AdministrationWorkspaceStrip (requisition queue, GM-final note) mounted on respective pages; AdminDeptView requester defaults to the signed-in user.

## Session 6 — nav flattening + Ops workspace v2
- **Nav flattened**: `AppShell.tsx` renders every module as a flat nav item with group separators; Utilities group removed; `reports` module deleted from `APP_MODULES` (ReportsView embedded as a workspace tab); `documents` moved into HR/Records group.
- **Ops workspace rewritten as tabbed** (`OperationsWorkspaceView.tsx`): 9 tabs — Overview, Deployments, Personnel, Armoury, Canine Unit, Patrols, Surveys & Contracts, Oversight, Reports. Pinned quick actions (Request Transport, New Requisition). Includes Deployment Order creation/assign, Guard Lifecycle transitions, log-only armoury/K9/patrol modals, My Requests outbox, Transport Inbox, embedded ReportsView. Regional Managers see region-scoped view.
- **Region scoping** (`OpsDeepPanels.tsx`): `inRegion` helper + `region` prop on CommandStrip, DeploymentOrdersPanel, ShiftsAttendancePanel, GuardLifecycleBoard, InvestigationsCollaboration, StaffClientAnalytics.
- **OperationsPage role-branching**: Training Officer → `TrainingSchoolView`, Armorer → `ArmouryView`, K9 Supervisor/Handler → `K9UnitView`; everyone else → `OperationsWorkspaceView`.
- **Notifications**: requester notified on transport/requisition submit, in addition to existing approve/reject/stage-change alerts.
- **Docs trimmed**: removed 9 stale artifacts (IMPROVEMENT_LOG.md, five ISCMS-*-Findings, iscms_qa_report.md, ISCMS-Role-Based-Test-Plan.md, TRAINING-MANUAL.md).

### Verified (session 6)
`npm run lint` (`tsc --noEmit`) passes.

## Operational notes
- After any `schema.prisma` change, run `npx prisma generate` before `npm run seed` / server start (client output: `src/generated/prisma`).

---

# Part 4 — Feature batch 2026-08-16 (records identity overhaul)

> Latest work on top of the review + blueprint (snapshot at 2026-08-16).

- **`forceNumber` is the single system-wide identifier** — `guardCode` column dropped from the Prisma schema (3 migrations: drop `guardCode`, rename relief/contract `guardCode` references) and removed from active application code (seed, server, types, hooks/stores/utils, ~25 components, tests). Migration history still contains `guardCode` for rollback/audit. Snapshot columns (LeaveRequest/DisciplinaryAction/CashierTransaction/PerformanceReview) and `Contract.relatedForceNumber` carry `forceNumber`.
- **Staff personnel files live on `User`** — migration `20260816130200_add_user_staff_id_and_biodata` added full guard-style biodata + `photoUrl`/`signatureUrl` + plastic-ID fields; `GET /api/auth/users` widened to `requireAnyModuleAccess("it","hr","identity")`.
- **Two ID-card types** in `IdentityCardPrintModal`: guard paper ID → CR80 PDF via `jspdf`; staff → 300-DPI PVC PNG. Both draw the logo on canvas, back side carries return wording + `COMPANY_RETURN_LOCATION`/`COMPANY_CONTACT`, issuance auto-fills issued=today / expiry=+3y client- and server-side (`PUT /api/guards/:id/issue-id`, new `PUT /api/auth/users/:id/issue-id` — Records Officer only, audit-logged).
- **Camera quality bump**: `IdCaptureCamera` captures 1200×1500 px (4:5) JPEG 0.95.
- **Records Officer 90-day expiry alerts** in `RecordsOfficerWorkspace` (guard IDs, staff IDs, contracts).
- **HR Staff module + Payroll placeholder**: new Staff tab (searchable register + personnel file + issue/print card) and Payroll "Coming Soon" tab (HR Manager/HR Assistant only) in `GuardsHRView`; `StaffBiodataModal` reuses the 6-tab guard capture pattern; `authStore.issueStaffId` calls `issueStaffIdApi` + local update.
- **Verification (at time of writing):** 194/194 tests, `tsc --noEmit` 0 errors, `vite build` OK, live API round-trips OK, no `guardCode` references in active application code (migrations retain history).

---

*This document merges the 2026-08-14 static review and the 2026-08-13 workflow blueprint + session log. Snapshot dated 2026-08-16; no separate `CURRENT_STATUS.md` is maintained.*
