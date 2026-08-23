# Session Log — 2026-08-21

**Scope:** Two features requested by the user — (1) server- and client-side pagination "where it necessitates", and (2) a universal self-service **My Leave** section for every role with days-spent/remaining tracking against a **21-day annual entitlement**. Plus a full backend↔frontend integration verification pass, repair of pre-existing compile breakage that blocked verification, UI/UX polish, and this documentation.

---

## 1. Pagination (backward-compatible envelope)

**Contract:** list endpoints ignore `?page=`/`?limit=` unless at least one is present. With params → `{ data, total, page, pages }`; without → the original full array, so no existing client breaks.

**Server (`server.ts`):**
* Helpers after `actorRoleLabel`: `DEFAULT_PAGE_SIZE = 25`, `MAX_PAGE_SIZE = 200`, `parseListPagination(req)`, `hasListPagination(req)`, `paginatedEnvelope(rows, total, page, limit)`.
* Envelope branches added to: `GET /api/guards`, `/api/incidents` (in-memory slice after region filter), `/api/invoices`, `/api/contracts` (with `contractEffectiveStatus` mapping), `/api/armoury-logs`, `/api/patrol-inspections`, `/api/roster`, `/api/audit-logs` (legacy cap `take:200` kept for non-paginated calls), `/api/notifications` (OR userId/targetRole where), `/api/leave-requests` (preserves RM/Guard Officer scoping via `visible` var).

**Client:**
* New molecule `src/components/molecules/Pagination.tsx` — prev/next + numbered window with ellipses, "Showing x–y of z" summary; exported from `molecules/index.ts`.
* Wired into `LeaveRequestPanel` (9/page cards), `GuardsTable` (12/page, both spreadsheet & grid views), `AuditLogsView` (15/page). All three reset to page 1 when filters/search change.
* `guardsStore.ts` already tolerated both array and envelope shapes — unchanged.

## 2. My Leave — universal self-service (21-day entitlement)

**Schema/migration:** `LeaveRequest` gained `category String @default("guard")` ("staff" | "guard"), `requesterUserId String?`, `requesterRole String?` + indexes on `requesterUserId`, `category`, `status`. Migration `prisma/migrations/20260821080000_staff_leave_self_service/` applied via `prisma migrate deploy`; client regenerated.

**Server:**
* `ANNUAL_LEAVE_ENTITLEMENT_DAYS = 21` (was 30). `computeLeaveBalance` is now year-scoped (prior Approved leaves counted only within the current calendar year).
* New `computeUserLeaveSummary(userId)` → `{ year, entitlement, taken, pending, remaining }`; pending counts Pending HR/GM, taken counts Approved.
* `POST /api/leave-requests`: body without `guardId` (or `selfService:true`) takes the **self-service branch** — creates a `category:"staff"` request for the authenticated user (`guardId = user.id` so balance queries stay uniform, force number falls back to the user's or `STAFF-<id>`), routes through the same HR → optional-GM approval chain, notifies HR Manager, writes audit log. **Annual Leave exceeding remaining balance → HTTP 400** with an explanatory message. The legacy guard-cover branch (with `guardId`) is untouched.
* `GET /api/my/leave` — own staff requests plus any guard-leave linked to the user's guard record; returns `{ requests[], summary }`; supports the pagination envelope (`{...envelope, summary}`).
* `DELETE /api/leave-requests/:id` — owner withdrawal while still pending (HR Manager / RM may also withdraw); cancels the linked Approval row and audits.

**Client:**
* `src/components/organisms/MyLeaveSection.tsx` — entitlement/spent/pending/remaining stat cards, request modal (type, dates, auto-computed duration, reason, contact address, live balance check that blocks over-balance Annual submissions before hitting the server), history table with per-request balance snapshot and Withdraw action, paginated.
* `domainApi.myLeave.{summary,request,cancel}`; `MyLeaveSummary` type exported.
* Nav/routing: `my_leave` module added to `APP_MODULES` (HR group, Calendar icon); `getAllowedModuleIds` now appends `my_leave` to every role's set (single-line change instead of editing ~23 role arrays); route `/my-leave` → `MyLeavePage` in `ModulePages.tsx`/`App.tsx`.
* Types: `LeaveRequest` extended with optional `category`, `requesterUserId`, `requesterRole`.
* `domainStore.addLeaveRequest` strips `guardId` from the synced body when `category === "staff"` so store callers hit the self-service branch too.
* Entitlement constants updated 30 → 21 in `GuardsHRView.approveL` and `domainStore.computeMockLeaveBalance`.

## 3. Integration verification (live server + seeded DB)

All exercised against `npx tsx server.ts` on :3000 with real logins:

| Check | Result |
|---|---|
| HR Manager `GET /api/my/leave` | `{ requests:[], summary:{2026, 21, 0, 0, 21} }` |
| Self-service POST (no guardId) | created `category:"staff"`, `requesterRole:"HR Manager"`, status Pending HR Approval |
| Summary after request | `pending:5, remaining:16` |
| Over-balance Annual (17 > 16) | HTTP 400 `Insufficient annual leave balance…` |
| Withdraw own pending | 200; summary back to `remaining:21` |
| Records Officer (no `leave` module) My Leave + POST | works — Sick Leave created as staff category (universal access proven) |
| Guards `?page=1&limit=5` | `{data:5,total:12,page:1,pages:3}`; without params → legacy array(12) |
| leave-requests / audit-logs / notifications / incidents / invoices / contracts / armoury-logs / patrol-inspections / roster envelopes | all correct (RBAC denials respected for out-of-scope roles) |
| Regression: guard-cover POST with guardId | still creates `category:"guard"` request through old path |
| `npm run lint` (tsc --noEmit) | clean |
| `npm run build` (vite + esbuild server bundle) | clean |

## 4. Pre-existing breakage fixed (was blocking typecheck)

Committed at HEAD without typechecking; all repaired:

* `src/components/views/MarketingView.tsx` — malformed JSX from the tab-split commit: three `&& (` conditionals (pipeline funnel block, campaigns table block, collections block) had sibling elements / JSX comments directly inside the parens. Wrapped each in fragments `<>…</>`.
* `src/routes/digitalContracts.ts`, `digitalContractTemplates.ts`, `digitalSigning.ts`, `src/utils/contractIdGenerator.ts` — Prisma v6-style `new PrismaClient({ datasourceUrl })` on a v7 driver-adapter client; migrated to `new PrismaPg({ connectionString })` + `new PrismaClient({ adapter })` matching `server.ts`.
* `src/routes/digitalContractTemplates.ts` — `pdfContractTemplate.create` missing required `pdfFilePath`; placeholder `""` now populated immediately after `storeTemplatePdf` (pre-existing create→update flow).
* `src/routes/digitalSigning.ts` — `contract.template.filePath` → `pdfFilePath`; `.then((m) => …)` containing awaits made `async`.
* `src/constants/modules.ts` — duplicate `CreditCard` lucide import removed.
* `src/components/organisms/EmbeddedSigningWidget.tsx` — `iframeRef.current?.reload()` (nonexistent API) → reassigns `iframe.src` to retry.
* `FinanceView.tsx` / `MarketingView.tsx` transport forms — FormData string cast to the `"Car" | "Motorcycle" | "Any"` union.

## 5. UI/UX polish

* `LeaveRequestPanel` cards now badge each request **"Staff Self-Service"** (purple) vs **"Guard Cover"** (slate); relief-officer row hidden for staff requests, replaced by "Requested By: <role>".
* `Pagination` molecule shared across leave cards, guards register/grid, audit ledger — consistent density and disabled states.

## 7. Formal disciplinary charge sheet (afternoon)

**Schema** — `DisciplinaryAction` + migration `20260821110000_disciplinary_charge_sheet`: `hearingDate`, `employeeResponse`, `responseRecordedBy`, `responseRecordedAt`, `resolutionNotes`, `rejectedBy`, `rejectedAt`, `archivedPdfPath` (all `String?`). Frontend type extended with display-only enrichment fields (`guardDesignation`, `guardSite`, `priorHistory[]`, linked incident/complaint titles).

**Server (`server.ts`)**
* `GET /api/disciplinary` now supports the pagination envelope.
* `generateChargeSheetPdf(actionId)` — pdf-lib document: header w/ force number, particulars, offence category + catalogue entry, incident/complaint linkage, hearing details, employee response, approval trail, prior history, signature blocks.
* `PUT /api/disciplinary/:id/response` — **Investigations Officer only**; zod-validated `{hearingDate?, employeeResponse}`; audit-logged.
* Chain guards (HTTP 400 on out-of-turn transitions): RM requires `Initiated`, Ops requires `Pending Ops Approval`, HR requires `Pending HR Approval`; reject blocked once `Finalized`.
* Due-process gate: HR finalize of a **Category 1** offence or **Suspension/Termination/Desertion** without a recorded employee response → 400.
* On finalize: canonical PDF written to `uploads/chargesheet_<actionCode>.pdf`, auto-filed as `Document(category:"Disciplinary", referenceType:"DisciplinaryAction")` with sha256 checksum, `archivedPdfPath` set. PDF failure is non-fatal (logged).
* Reject persists `resolutionNotes/rejectedBy/rejectedAt` + audit log (previously notes were dropped).
* `API_RATE_LIMIT_MAX` env override added to the global limiter (dev/load-testing convenience; default unchanged).

**Frontend**
* New organism `ChargeSheetModal.tsx`: formal viewer (particulars, linkage, hearing/response, trail, rejection info), browser-print window with auto-print, "Archived PDF" download when filed.
* `DisciplinaryPanel` rewritten: duplicate action-type select removed; Ops approve button condition fixed (`"Pending Regional Approval"` never matched); IO→RM→Ops→HR step-progress dots on cards; initiation form gains incident/complaint linkage dropdowns + inline prior-record strip; IO response capture form; rejected cards show reviewer/notes; per-card Charge Sheet view/print + archived-PDF link.
* `domainStore.recordChargeSheetResponse(id, {hearingDate?, employeeResponse})`.
* Appraisal modal already surfaced disciplinary history (verified — spec §148 satisfied, no change needed).

**Live e2e verified** (seeded DB): initiate Cat 1 Termination w/ incident link → early HR finalize 400 (chain) → Ops out-of-turn 400 → finalize without response 400 (gate) → IO records response → RM → Ops → HR finalize → PDF `%PDF-1.7` in `uploads/`, Document visible to Records Officer in vault, guard auto-Terminated with reason/date, audit rows across HR/Ops/Finance. Reject flow: notes persisted; rejecting finalized case 400. Duplicate Document from pre-guard testing removed.

## 8. Known follow-ups (not done here)

* Client-side views still fetch full lists then filter locally except where wired above; converting more consumers to the envelope is incremental and safe.
* `GET /api/my/leave` links guard records by `linkedUserId` or exact name match; if guard↔user linking gains a first-class FK, revisit.
* Mock/demo mode (`useApi=false`) still uses local balance math (now 21) — acceptable until demo data is retired.
* Charge-sheet PDF uses standard fonts (no embedded logo/signature images); signatures remain name/date lines pending scanned-signature assets.
* Warning Letter quick-issue from Personnel Directory still bypasses the chain (pre-existing; flagged in Lockdown Spec Known Gap).


---

## Follow-up session (2026-08-23): Guard → Security Officer rename + employment contracts

**Rename (complete):**
* Schema migration `20260821131202_security_officer_rename` applied; DB reset + reseeded via `prisma migrate reset --force` + `npm run seed` (26 users / 12 officers / 8 sites / 19 contracts).
* server.ts swept to zero non-`securityOfficer` "guard" identifiers/strings; all five officer mutation routes now resolve by `forceNumber` first via `resolveSecurityOfficer(key)` with record-id fallback.
* Frontend: 40+ files of type/interface renames, 11 component/hook/store file renames (git mv), domainApi namespace `securityOfficers`, `/api/security-officers` paths, `guardsStore.ts`→`securityOfficersStore.ts`.
* Tests updated: module key `"guards"`→`"security_officers"`, endpoints, payload keys (`guardIds`→`forceNumbers`, `reportedByGuard`→`reportedBySecurityOfficer`, designation `"Guard"`→`"Security Officer"`), dashboard metric keys (`result.securityOfficers`, `duplicates.removed.securityOfficers`, `executiveAttention.suspendedSecurityOfficers`, `individualMetrics.securityOfficerStrength`). **194/194 pass.**

**Incident & repair (documented for posterity):** an over-broad rename regex truncated quoted strings ending in " Security Officer(s)" to empty strings across ~30 files (role values, designation enums, permission keys, chart names, org chart). Repaired via quote-aware tokenizer pass + per-literal restoration against HEAD; duplicate object keys from `guardId→forceNumber` collisions removed. Verified clean by `tsc`, full test suite and grep sweeps.

**Employment contracts ("Contract for Guards"):** see Part 5 of PROJECT_REVIEW_AND_WORKPLAN.md for the full description. Live e2e: two officers taken through draft → officer sign → HR sign (+witness) → Fully Signed; `%PDF-1.7` written to uploads/, vault Document with sha256 checksum visible, repeat-create → 400, re-sign → 404/409. Status trail fixed mid-session: officer-sign now sets `Pending HR Signature` (type union extended).

**Docs:** workplan Part 5 added; TEST_LOGINS.md role renamed.

* Addendum: `prisma/enrichRegions.ts` (standalone regional-enrichment script, not covered by the seed sweep) was also migrated to the renamed schema — `prisma.securityOfficer`, enum-name designations/statuses (`K9_Handler`, `UnderInvestigation`, `Attention_Needed`), `assignedToForceNumber`, `reportedBySecurityOfficer`, `assignedSecurityOfficerForceNumbers`, `activeSecurityOfficersCount`, DateTime `joinDate`/`incidentDate`/contract dates. Verified by a full idempotent run: 156 officers / 51 sites / 65 incidents / 139 rosters / 26 contracts / 13 disciplinary across all regions.
