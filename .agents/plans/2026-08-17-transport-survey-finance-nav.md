# Plan: Transport for All Roles, Site Survey Pipeline, Finance Non-Compliance & Mobile Nav Fix

## Goal
Make Request Transport available to every role (including Marketing), restore Request Site Survey to Marketing → Operations Manager flow with survey-gated contract drafting, auto-forward 60-day unpaid clients to Finance as non-compliant, and fix top-nav / responsive rendering on mobile vs laptop. Log all to `SESSION_LOG_2026-08-16.md`.

## Success Criteria
- Any authenticated role (Marketing, Finance, HR, Admin, IT, Ops) can open Request Transport modal, submit to Fleet Manager, see outbox, and Fleet Manager can approve/decline with vehicle/rider assignment on both `/fleet` dashboard and `/fleet/requests`.
- Marketing (BDM/SMS only) sees Request Survey button, pipeline shows Survey step before contract draft, survey data pre-fills contract, Operations Manager completes survey and notifies requester.
- Invoices `Pending`/`Overdue` 60+ days automatically surface as Non-Compliant in Finance → forwarded for follow-up (badge + filter).
- No top-nav overflow/break on 360px mobile and 1024/1440 laptop: AppShell hamburger works, Fleet/Finance/Marketing top navs scroll cleanly, no clipped modals.
- `SESSION_LOG_2026-08-16.md` updated with this batch.

## Context And Current Facts
- **Transport:** `server.ts:4630 PUT /api/transport-requests/:id/act` Fleet Manager only; `POST /api/transport-requests` any authed (code: `TRP-`). Client: `OperationsWorkspaceView.tsx:174` has pinned `Request Transport` + `TransportInbox` (now always-visible after last patch). `MarketingView.tsx:186` banner has only `Capture Commercial Lead` — no Request Transport. `FinanceView`, `GuardsHRView`, `AdminDeptView`, `ITAdminView` also lack it. `FleetView.tsx:401` overview now shows inbox for Fleet Manager only. `FleetPage` header `FleetManagerWorkspaceView` always shows inbox.
- **Site Survey:** `SiteSurveysPanel.tsx:28` — BDM/SMS `Request Survey` button, Ops/RM `Start/Complete`. Mounted only in `OperationsWorkspaceView.tsx:330` `tab==="surveys"` — not in `MarketingView` or `MarketingPage` (`ModulePages.tsx:500` slimmed to MarketingView only). Pipeline `MarketingView.tsx:26 STAGE_FLOW New→Contacted→Qualified→Proposal Sent→Closed` has no survey gate; `ClientContractsView` allows draft at any pipeline point, not survey-dependent. Seed workflows: `TRANSPORT-REQ`, `SITE-SURVEY`, `CONTRACT-INQ` exist.
- **Finance non-compliance:** `FinanceView.tsx:595` collections table shows invoices but no age → non-compliance logic. `site survey.txt:7 "2 months without paying results to non-compliance"`. No 60-day computed flag, no forwarded badge.
- **Nav/UI:** `AppShell.tsx:118` sticky header 64px, `APP_MODULES` flatten with groups, `FleetTabNav.tsx:38` `overflow-x-auto` but no `no-scrollbar` + no sticky. Mobile: `MarketingView` grids `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`, `OperationsWorkspaceView` tabs `overflow-x-auto no-scrollbar` — verified, but header nav hamburger not inspected due to sandbox `bwrap` failure blocking `muse.bash` / headless browser. Laptop vs mobile modal patterns use `fixed inset-0 flex items-center` — prior fix converted to `overflow-y-auto min-h-full p-4 sticky header` for guards but similar modals in Marketing still risk clipping.
- **Env:** Sandbox `bwrap: Failed RTM_NEWADDR` blocks `git`, `prisma generate`, `vite preview` verification here — conclusions from file reads only.

## Constraints And Non-goals
- Keep whole-repo single-service deploy (`Dockerfile` `migrate deploy && bun start` at `0.0.0.0:3000`, `vite.config.ts` `allowedHosts:true`) — no new service.
- Preserve Guard Officer role per your instruction.
- Not production — relaxed password (`password123`) and `SEED_ENABLED=true` auto-seed 26 users stays.
- Non-goals: no new Prisma model for non-compliance (derive from Invoice `dueDate` + `status`), no GPS/mobile backend, no PDF redesign.

## Key Decisions
- **Transport for all:** Reuse existing `RequestTransportModal` (`OperationsWorkspaceView.tsx:1732`) as shared `TransportRequestModal` component — mount via `AppShell` quick action or per-page header button (least duplication). Add button to `MarketingView`, `FinanceView`, `AdminDeptView`, `ITAdminView`, `GuardsHRView` headers; keep single `domainStore.addTransportRequest` path. Alternative rejected: per-view duplicated modal — more drift.
- **Site survey in Marketing:** Mount `SiteSurveysPanel` (or extract `RequestSurveyButton+SurveyStatusStrip`) at top of `MarketingView` pipeline (between KPI grid and funnel), not as separate route — keeps pipeline first. Survey `Completed` enables `Draft Contract` button; otherwise blocked with hint. Keep `OperationsWorkspaceView` survey tab as Ops completion surface. This enforces `Survey → Contract` without breaking existing Operations flow.
- **Finance 60-day:** Derive `isOverdue60 = status !== Paid && dueDate && daysSince(dueDate) >=60`. Add `Non-Compliant` badge + filter + forwarded-to-Finance queue section in `FinanceView` collections table; no migration.
- **Nav/UI:** Fix `AppShell` mobile menu (hamburger `md:hidden` toggle, focus trap), ensure all top-nav bars (`FleetTabNav`, `Finance/Marketing` group navs) use `overflow-x-auto no-scrollbar` + `snap-x` + `shrink-0`, grids use `min-w-0` to prevent overflow, modals use `fixed inset-0 overflow-y-auto p-4 sticky header` pattern. Prioritize `AppShell` + `Fleet/Marketing` as highest risk for small-screen clipping.

## Recommended Approach
1. **Investigate → document → fix transport & survey placement → finance flag → nav/UI polish → log**, in that order (transport/survey no DB change, finance derived, nav low risk).
2. Extract `RequestTransportModal` once, then add one-line button per view.
3. Embed survey status in marketing pipeline — minimal new code, reuses domain store.

## Work Plan
- **W1 — Transport for all roles** (depends: none) — Extract `RequestTransportModal` to `src/components/organisms/TransportRequestModal.tsx` (from `OperationsWorkspaceView`), add `Request Transport` button to `MarketingView.tsx:188` banner, `FinanceView.tsx` header, `AdminDeptView`, `GuardsHRView`, `ITAdminView` via `SiteSurveysPanel` pattern; verify `GET/POST /api/transport-requests` already allow any authed. Files: 1 new + 5 views. Owner: views.
- **W2 — Site Survey to Marketing + pipeline gate** (depends: W1 read) — Mount `SiteSurveysPanel` summary + `Request Survey` in `MarketingView.tsx:251` before funnel; add pipeline hint `Survey Completed? → Draft Contract` gate in `ClientContractsView` (disable `onAddContract` until linked survey `Completed` for that client/site); keep Operations survey tab. Add notification `site survey completed → BDM/SMS`. Files: `MarketingView.tsx`, `ModulePages.tsx` (pass `siteSurveys`), `ClientContractsView`.
- **W3 — Finance non-compliance 60-day** (depends: none) — Add `daysSinceDue` helper, computed `nonCompliant = overdue60` list, badge `Non-Compliant (N)` + filter toggle + `Forwarded from Marketing` section in `FinanceView.tsx:595`; audit log on forward. No migration. Files: `FinanceView.tsx`.
- **W4 — Navigation & responsive polish** (depends: W1-W3 for visual check) — `AppShell.tsx:116` hamburger + `md:hidden` nav drawer, `FleetTabNav.tsx:38` + Finance/Marketing group navs add `no-scrollbar snap-x`, grids `min-w-0`, all modals `fixed inset-0 overflow-y-auto p-4 min-h-full sticky header` (align Marketing modals to guard pattern). Files: `AppShell.tsx`, `FleetTabNav.tsx`, `FinanceView.tsx`, `MarketingView.tsx`. Owner: layout.
- **W5 — Session log** (depends: W1-W4) — Append batch to `SESSION_LOG_2026-08-16.md` (and `PROJECT_REVIEW_AND_WORKPLAN.md` snapshot) with trigger, files, result for each of W1-W4.

## Validation Plan
- **W1:** Login as Marketing `ivan.ssebana / password123` → Marketing header shows `Request Transport` → submit → Fleet Manager `francis.ogwang` at `/fleet` and `/fleet/requests` sees it with vehicle/rider approve; login as Finance/HR/Admin repeats. `curl POST /api/transport-requests` 201 as any role.
- **W2:** Marketing `Request Survey` → Operations Manager `Operations → Surveys & Contracts` sees `Requested` → `Start` → `Complete` → Marketing pipeline survey status flips to `Completed` → `Draft Contract` enabled, contract pre-filled. E2E: site survey → contract.
- **W3:** Seed invoice `dueDate` 61 days ago `Pending` → Finance `Collections` shows `Non-Compliant` badge count + row red; filter `Non-Compliant` isolates it.
- **W4:** Manual: Chrome 360×800 + 1024×768 + 1440×900 — AppShell nav no overflow, Fleet/Marketing top tabs scroll without clipping, modals scroll with sticky header visible, no horizontal scroll. (Headless blocked by `bwrap` — use your Railway link on phone + laptop.)
- **W5:** File exists, section headings match W1-W4.

## Risks / Rollback
- Transport button everywhere adds Fleet load — mitigate with `TransportRequest` pending cap (existing) + Fleet Manager queue.
- Survey gate regresses legacy contracts with no survey — allow override via `BDM` prompt `Proceed without survey?` with audit.
- 60-day flag false positive if `dueDate` missing — default to not non-compliant.
- Rollback: revert per-work-unit commit (W1-W4 independent); no DB migration to roll back.

## Open Questions
- None — all answers from `src/components/views/*` + `server.ts:4630` + `site survey.txt:7` + your `you can leave guard officer` and `whole-repo deploy` constraints. `2 months = 60 days` (not 61) assumed; confirm if you mean calendar 60 or 2×30. VAT 18% handling noted but out of this batch.
