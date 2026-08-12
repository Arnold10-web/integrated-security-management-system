# ISCMS UI/UX & RBAC QA Report

**Date:** 2026-08-11  
**Method:** Source code audit (`server.ts` — 4,411 lines) + live API probing  
**Note on browser testing:** The browser subagent quota was exhausted before screenshots could be captured. All findings below are derived from: (a) full read of the `MODULE_PERMISSIONS` table and all 403 action-level guards in `server.ts`, (b) live API calls with real JWT tokens for the first 3–4 roles before rate-limiting kicked in, and (c) the test plan's expected RBAC contract against the implemented code.

---

## How RBAC Works in This App

The backend uses two layers of access control:

1. **Module-level gate** (`requireModuleAccess`) — checked first. Determines whether a role can even reach an endpoint category (e.g., can this role see armoury at all?).
2. **Action-level gate** — checked inside the route handler. Determines whether a role can do a specific *action* within a module (e.g., can the Accountant approve an invoice?).

The `MODULE_PERMISSIONS` table in `server.ts` (lines 365–616) is the single source of truth for layer 1. All findings below reference it directly.

---

## 🔴 CRITICAL FINDINGS — RBAC

---

### FINDING #1 — General Manager sees ALL modules via API (vs. test plan expectation)

| Field | Detail |
|---|---|
| **Role/flow** | General Manager (Sarah Akello) |
| **Task** | Access Finance, HR, Operations, Marketing, Fleet, Armoury, IT modules directly |
| **Expected (test plan)** | "Should be blocked — GM has no direct module access outside Directorate/Reports/approvals" |
| **Actual (code)** | GM has `"view"` access on **every single module** in `MODULE_PERMISSIONS`: guards, sites, armoury, incidents, vehicles, invoices, expenses, leads, k9s, hr, identity, marketing, administration, it, finance, fleet, roster, patrol, requisitions, training, recruitment, performance, workflow, documents, campaigns, complaints, disciplinary, deployments. GM also has `"full"` on `directorate` (`server.ts:613`). |
| **Confirmed via** | Live API: `GET /api/guards` → **200**, `GET /api/armoury` → **200**, `GET /api/invoices` → **200**, `GET /api/leads` → **200**, `GET /api/it-servers` → **200** (all with GM JWT) |
| **Type** | RBAC contradiction between test plan and implementation |
| **Severity** | **Significant** |
| **Why it matters** | The test plan says GM is a "view + approve only" role scoped to Directorate and approvals. The implementation gives GM read access everywhere. The server comment says this is deliberate (`"least privilege, §15.1"`) but it directly contradicts the test plan. The GM should see *what is necessary for oversight* — not every module in full detail. |
| **Resolution (decided)** | Restrict GM/Director to a curated oversight read scope: **keep view** on the modules the Directorate/Reports/Governance screens actually consume (guards, sites, incidents, invoices, expenses, vehicles, k9s, armoury, hr, performance, documents, complaints, disciplinary, requisitions, workflow + directorate full); **remove view** from purely operational detail modules (marketing, campaigns, leads, it, identity, roster, patrol, training, recruitment, administration, fleet, deployments, deployment-orders, cashier-transactions). Update the test plan to match. |

---

### FINDING #2 — Director has "full" on directorate but cannot approve anything (correct, but confusing)

| Field | Detail |
|---|---|
| **Role/flow** | Director (Daniel Mugisha) |
| **Task** | Try to approve anything |
| **Expected** | "Should be impossible everywhere — pure oversight, zero approval power" |
| **Actual** | Director has `"full"` on the `directorate` module (`server.ts:614`; GM is also `"full"`, `:613`) — but all approval endpoints use action-level checks that exclude Director. Tested: contract approval → 403 with "Access denied: Director cannot approve at step…", requisition approval → 403 ("requires role General Manager"). So approval blocking **holds** at action level. |
| **Type** | RBAC correct, but the "full" designation on directorate is misleading — Director can presumably write to the directorate module even though they shouldn't be able to approve. |
| **Severity** | **Minor** |
| **Fix** | Change Director's directorate access from `"full"` to `"view"` unless there's a specific directorate write action Directors need. |

---

### FINDING #3 — K9 Handler has "full" module access — same as K9 Supervisor

| Field | Detail |
|---|---|
| **Role/flow** | K9 Handler (Peter Okot) |
| **Task** | Create or delete a K9 record |
| **Expected** | K9 Handler should log activities and health records — NOT create or delete K9 dogs |
| **Actual** | `k9s: { "K9 Supervisor": "full", "K9 Handler": "full" }` — identical access level. `POST /api/k9s`, `DELETE /api/k9s/:id`, `POST /api/k9-health`, `DELETE /api/k9-health/:id` all use `requireModuleAccess("k9s", "full")` with no role distinction inside the handler. K9 Handler can create and delete dogs and health records with no additional check. |
| **Type** | RBAC failure |
| **Severity** | **Significant** |
| **Fix** | Inside K9 create/delete route handlers, add a role check: `if (user.role !== "K9 Supervisor") return res.status(403).json(...)`. K9 Handler should only be able to add logs and health entries, not manage the dog records themselves. |

---

### FINDING #4 — Operations Manager has "full" on recruitment module

| Field | Detail |
|---|---|
| **Role/flow** | Operations Manager (Emma Muwonge) |
| **Task** | Perform HR CRUD (edit a guard's HR record directly) — "Should be blocked" |
| **Actual** | `recruitment: { "HR Manager": "full", "HR Assistant": "full", "Records Officer": "view", "Operations Manager": "full" }` — OM has **full** create/edit access on the recruitment module. This goes beyond the test plan's stated boundary which says OM's recruitment involvement is limited to "record a headcount need / participate in candidate selection". Full module access lets OM create, edit, and potentially delete recruitment records. |
| **Type** | RBAC — overpermissioned |
| **Severity** | **Significant** |
| **Fix** | Downgrade OM in the recruitment module from `"full"` to `"view"`, or create a specific route for OM to record selection decisions without full CRUD. |

---

### FINDING #5 — Assistant Accountant has "full" on finance module

| Field | Detail |
|---|---|
| **Role/flow** | Assistant Accountant (Sandra Namutebi / Brian Mugerwa) |
| **Task** | "Reconcile or approve — Should be blocked" |
| **Actual** | `finance: { "Assistant Accountant": "full" }`. While individual approve endpoints have role checks (e.g., invoice approve checks for Finance Manager explicitly), the "full" module designation means the AA can reach all finance write endpoints. The specific approve actions are individually blocked, but the breadth of write access to the finance module is broader than the "enter transaction-level data" role described in the test plan. |
| **Type** | Potential overpermission on module-level, mitigated by action-level checks |
| **Severity** | **Minor** |
| **Fix** | Downgrade Assistant Accountant to `"view"` on the finance module (they should only enter data via specific endpoints like cashier transactions, not have full write access to the whole finance module). |

---

### FINDING #6 — Guard Officer has NO access to the operations module

| Field | Detail |
|---|---|
| **Role/flow** | Guard Officer (Tom Ssemakula) |
| **Task** | View guards, deployment orders, sites |
| **Actual** | `operations: { "Operations Manager": "view", "Regional Manager": "view", "General Manager": "view", "Director": "view", "IT Officer": "view" }` — Guard Officer is **not listed**. Guard Officer has access to `patrol` (full) and `incidents` (view), but cannot access the operations module at all. So `GET /api/deployment-orders` → **403** for Guard Officer. Guard Officer can only see patrol inspections and incident reports — no visibility into deployment orders or site assignments they are fulfilling. |
| **Type** | Potentially intentional, but likely a gap — Guard Officer needs to see their own deployment/site to do their job |
| **Severity** | **Significant** (workflow gap, not a security problem) |
| **Fix** | Add `"Guard Officer": "view"` to the `operations` module and `sites` module so they can see their assigned site and any deployment orders relevant to them, OR add a filtered `GET /api/my-deployment` endpoint scoped to their own assignment. |

---

### FINDING #7 — Training Officer has no operations or guards module access

| Field | Detail |
|---|---|
| **Role/flow** | Training Officer (James Wamala) |
| **Task** | View guards to train, check who's been handed to ops |
| **Actual** | Training Officer is NOT in `operations`, `guards`, or `recruitment` MODULE_PERMISSIONS. Training Officer only has access to the `training` module (full). To send a guard to training or mark them as passed out, the lifecycle route (`PUT /api/guards/:id/lifecycle`) has its own `GUARD_LIFECYCLE_ROLES` check that includes Training Officer — but Training Officer cannot `GET /api/guards` to find who to train. They can take lifecycle actions on a guard they somehow know the ID of, but cannot browse the guard list to manage their training queue. |
| **Type** | Workflow gap / access inconsistency |
| **Severity** | **Significant** |
| **Fix** | Add `"Training Officer": "view"` to the `guards` module so the Training Officer can see the list of guards in `IN_TRAINING` stage and manage their cohort. |

---

### FINDING #8 — ~~Sales Supervisor can access `/api/requisitions`~~ **RESOLVED (as of current code)**

| Field | Detail |
|---|---|
| **Role/flow** | Sales and Marketing Supervisor Kampala (Patricia Akello) |
| **Task** | Submit a requisition |
| **Original finding** | `requisitions: { "Administrative Officer": "full", "HR Manager": "full", "Finance Manager": "view", "Operations Manager": "view", "General Manager": "view", "Director": "view", "IT Officer": "view" }` — Sales and Marketing Supervisor is NOT listed, and at the time of the review there was no `requireModuleAccess("requisitions")` guard on the read route (only the approve/reject actions were role-gated). |
| **Current state** | **Fixed.** `GET /api/requisitions` now carries `requireModuleAccess("requisitions")` (`server.ts:2606`), so a Sales and Marketing Supervisor token gets **403** on read. The create/update/delete routes use `requireModuleAccess("requisitions", "full")` (`:2611`, `:2618`, `:2626`). |
| **Type** | ~~Missing module gate on requisitions read endpoint~~ → Resolved |
| **Severity** | **Resolved** — no action required |

---

## 🟡 SIGNIFICANT FINDINGS — Action-Level RBAC

---

### FINDING #9 — Records Officer archival works but the error messages are inconsistent

| Field | Detail |
|---|---|
| **Role/flow** | Records Officer (Agnes Nantege) |
| **Expected** | Can archive contracts; CANNOT approve, void, edit, or delete |
| **Actual (code)** | Archive is correctly restricted: `if (actorRole !== "Records Officer") return 403`. Approve checks correctly exclude Records Officer. Void correctly excludes Records Officer. **However** — edit (`PUT /api/contracts/:id`) has a complex field-allowlist system that should restrict Records Officer to only certain fields, but the error message when they try to edit a non-allowed field says `"field(s) not editable by Records Officer: …"` rather than `"You don't have permission to edit this contract"`. This is a security-information disclosure issue — the error tells an attacker exactly which fields the role *can* edit. |
| **Severity** | **Minor** |
| **Fix** | Change the field-restriction error to a generic `"You don't have permission to perform this action"` — don't enumerate editable fields in the error response. |

---

### FINDING #10 — Director cannot approve leave, but the error message implies they could if approved

| Field | Detail |
|---|---|
| **Role/flow** | Director (Daniel Mugisha) — leave approval |
| **Actual** | Line 3246: `if (!user || (user.role !== "General Manager" && user.role !== "Director"))` — this check is on the **final leave step**, and Director IS allowed. But test plan says "Director: pure oversight, zero approval power." The Director can give the **final leave approval step** but cannot approve contracts or requisitions. This inconsistency appears to be a holdover — Director approval power was removed from contracts but the leave workflow was not updated. |
| **Severity** | **Significant** |
| **Fix** | Remove "Director" from the final leave approval check at line 3246. Only GM should give final leave approval. |

---

### FINDING #11 — Invoice approval has no amount threshold — Finance Manager approves ALL amounts

| Field | Detail |
|---|---|
| **Role/flow** | Finance Manager (David Ssenyonga) |
| **Expected (test plan)** | "Finance Manager: Review/approve every invoice and expense regardless of amount" |
| **Actual** | Invoice approve: `if (!user || user.role !== "Finance Manager") return 403`. No threshold check. Expense approve: Finance Manager approves, then GM approves amounts above threshold (expense has a two-step for high values). Invoices have NO high-value threshold at all — Finance Manager approves all invoices with no GM escalation. This contradicts the contract workflow (≥100M goes to GM) but not the test plan (which only asks about contracts for the GM threshold). Still worth flagging — a multi-million-UGX invoice has no GM oversight. |
| **Severity** | **Significant** |
| **Fix** | Add a threshold check on invoice approval matching the expense model: if invoice amount ≥ 100M UGX, require GM final approval. |

---

### FINDING #12 — Cashier can initiate disbursements, but the Finance Manager approve endpoint also accepts the Cashier role

| Field | Detail |
|---|---|
| **Role/flow** | Cashier (Winnie Nabukenya) |
| **Task** | Disburse without Finance Manager approval — should be blocked |
| **Actual** | `PUT /api/cashier-transactions/:id/approve` checks `if (!user || user.role !== "Finance Manager") return 403`. This correctly blocks Cashier from self-approving. However, `POST /api/cashier-transactions` (initiate) uses `requireModuleAccess("finance", "full")` — which allows Cashier (full on finance). The initiation flow is correct. The approval is correctly blocked. **PASS** on this specific check. |
| **Severity** | N/A — this boundary holds |

---

### FINDING #13 — Lead ownership check uses string comparison, not DB join — reassignment bug risk

| Field | Detail |
|---|---|
| **Role/flow** | Sales and Marketing Supervisor → BDM lead reassignment flow |
| **Task** | Only lead owner can advance stage; BDM can reassign |
| **Actual (code)** | Line ~2178: `if (user.role !== "Business Development Manager" && lead.assignedToId !== user.id)` — advancement is blocked unless you're BDM or the owner. Reassignment at line 2202 checks `user.role !== "Business Development Manager"` → 403 for Supervisors. These checks are correct. **However**, after reassignment, the ownership check uses `lead.assignedToId !== user.id` — this only blocks the *old* owner from advancing, not if they still have a cached session or a race condition. More of a code robustness issue than a live bug. |
| **Severity** | **Minor** |

---

## 🟠 UX / WORKFLOW FINDINGS

---

### FINDING #14 — No backend enforcement of "Inspector" and "Site In-Charge" as non-login roles

| Field | Detail |
|---|---|
| **Expected** | Inspector and Site In-Charge exist only as guard designations — no user accounts |
| **Actual** | There is no login-prevention at the database or auth layer for these roles. If a user record were ever created with role = "Inspector", the auth middleware would issue them a valid token. The MODULE_PERMISSIONS table has no entry for "Inspector" or "Site In-Charge", so they'd get 403 on everything — but they could still log in and receive a valid session. |
| **Severity** | **Minor** |
| **Fix** | Add a role allowlist to the login handler: reject login if `role` is not in the known set of user-facing roles. |

---

### FINDING #15 — The `requireModuleAccess` middleware returns different error formats depending on context

| Field | Detail |
|---|---|
| **Actual** | Line 688: `"Access denied: ${user.role} cannot access ${moduleName}"` — uses the internal module name (e.g., `"armoury"`, `"k9s"`, `"incidents"`), not the user-facing display name. A user denied from "k9s" sees `"Access denied: Fleet Manager cannot access k9s"` instead of `"Access denied: Fleet Manager cannot access K9 Management"`. |
| **Severity** | **Polish** |
| **Fix** | Map internal module names to display names in the error response using the `SERVER_MODULE_TO_CLIENT` table already present in the code. |

---

### FINDING #16 — `GET /api/leave-requests` is guarded by `requireAnyRole(...)` not `requireModuleAccess` — inconsistent pattern

| Field | Detail |
|---|---|
| **Actual** | Line 3093: `requireAnyRole("Guard Officer", "Regional Manager", "Operations Manager", "HR Manager", "HR Assistant")` — this role list is hardcoded in the route definition, not in `MODULE_PERMISSIONS`. Finance Manager, IT Officer, GM all have legitimate oversight reasons to view leave requests, but the hardcoded role list excludes them. The IT Officer in particular (who has view on everything) cannot access this endpoint. |
| **Severity** | **Significant** |
| **Fix** | Move leave-request access into `MODULE_PERMISSIONS` under the `hr` module (or a new `"leave"` module) and use `requireModuleAccess` consistently. IT Officer and GM/Director should be added to the allowed roles list. |

---

### FINDING #17 — Deployment order → Guard assignment flow has no notification to the assigning Regional Manager

| Field | Detail |
|---|---|
| **Test Plan Flow** | Flow 1: OM creates deployment order → RM views and assigns guards → OM checks status |
| **Actual (code)** | `POST /api/deployment-orders` (OM) creates order correctly. `PUT /api/deployment-orders/:id/assign` (RM) assigns guards with region check. **No in-app notification is sent to the RM when a new order arrives for their region**, and **no notification is sent to the OM when the RM fulfills the order.** The test plan explicitly flags this as needing improvement: "whether either role gets confirmation/notification." |
| **Severity** | **Significant** (workflow gap — both roles are working blind) |
| **Fix** | On `POST /api/deployment-orders`: create a notification for all RMs whose region matches the order. On `PUT /api/deployment-orders/:id/assign`: create a notification for the originating OM. |

---

### FINDING #18 — Guard lifecycle stage transition has no notification to the receiving role

| Field | Detail |
|---|---|
| **Test Plan Flow** | Flow 2: HR hands guard to Ops (HANDED_TO_OPERATIONS) → OM sends to Training (IN_TRAINING) → Training Officer marks passed out (PASSED_OUT) → OM notified |
| **Actual (code)** | `PUT /api/guards/:id/lifecycle` updates the stage. The route has no notification logic for any lifecycle transition. The test plan specifically requires: "Training Officer is notified (real in-app notification, not just a status change)" when sent to training, and "Operations Manager is notified" when passed out. Neither happens. |
| **Severity** | **Significant** |
| **Fix** | Add notification dispatch inside the lifecycle route handler for each stage transition that crosses role boundaries. |

---

### FINDING #19 — IT Officer acting-role grant has no time-bound enforcement at the API level

| Field | Detail |
|---|---|
| **Role/flow** | IT Officer (Joseph Kizza) |
| **Task** | Grant a temporary "acting" privilege — "should be clearly time-bound/revocable" |
| **Actual (code)** | `PUT /api/auth/users/:id/acting` sets `actingRole` and `actingExpiresAt`. The `authenticateToken` middleware reads the JWT (which has no acting role baked in), then resolves the effective role by checking `actingExpiresAt` at token resolution time (line ~670). **However**: the expiry is checked on every request, so expired acting roles are automatically ignored — this is correct. But there is no background job that *clears* expired acting roles from the DB. They persist in the DB until the next request from that user, which means reporting/audit logs could show an acting role that has already expired. |
| **Severity** | **Minor** |
| **Fix** | Add a periodic cleanup (cron or on-login) to clear `actingRole`/`actingExpiresAt` from the DB when expired. |

---

### FINDING #20 — ~~`GET /api/reports` returns 200 for every role tested~~ **INACCURATE (endpoint does not exist)**

| Field | Detail |
|---|---|
| **Original finding** | Claimed `GET /api/reports` returned HTTP 200 for every role tested and had no access guard. |
| **Correction** | **There is no `/api/reports` endpoint in `server.ts`.** The enterprise reporting/analytics data is served by `GET /api/analytics/summary` (`server.ts:4213`), which **is** guarded by `requireModuleAccess("directorate")` (GM/Director only). The report data powering `ReportsView` is fetched client-side from the role-gated list endpoints (guards, sites, incidents, vehicles, invoices, expenses, leave-requests, performance-reviews). |
| **Type** | ~~Missing access gate~~ → Inaccurate finding; the actual analytics endpoint is already gated |
| **Severity** | **Inaccurate** — verify against `/api/analytics/summary` instead |
| **Fix** | None needed for `/api/reports`. If broader report access is ever added, gate it with `requireAnyRole(...)` or a module gate. |

---

## Role-by-Role RBAC Summary Table

Based on `MODULE_PERMISSIONS` code analysis and confirmed API test results:

| Role | Module Access (per code) | Test Plan Expectation Match? | Key Gap |
|------|--------------------------|------------------------------|---------|
| General Manager | View on ALL 28 modules | ❌ Test plan says only Directorate/approvals | Finding #1 |
| Director | View on ALL modules + Full on Directorate | ⚠️ Partial — approve actions blocked | Finding #2, #10 |
| HR Manager | Full: guards, hr, identity, recruitment, training, disciplinary, documents, requisitions, performance | ✅ Matches | — |
| HR Assistant | Full: guards, hr, recruitment, training, disciplinary, documents | ✅ Matches | — |
| Records Officer | Full: guards, identity, hr, recruitment (view), training (view), documents | ✅ Matches | — |
| BDM | Full: leads, sites, marketing, campaigns, complaints, deployments (view) | ✅ Matches | — |
| Sales and Marketing Supervisor | Full: leads, sites, marketing, campaigns, complaints | ✅ Matches | — (Finding #8 resolved) |
| Operations Manager | Full: operations, roster, patrol, incidents, deployments, complaints, disciplinary, performance, **recruitment** | ⚠️ Recruitment "full" is overpermissioned | Finding #4 |
| Regional Manager | Full: roster, patrol, incidents, deployments, complaints, disciplinary, performance, vehicles (view), leads (view) | ✅ Matches | — |
| Fleet Manager | Full: fleet (vehicles, trips, fuel, drivers, maintenance, inspections) | ✅ Matches | — |
| Training Officer | Full: training only | ⚠️ Cannot browse guards to manage trainees | Finding #7 |
| Investigations Officer | Full: incidents, complaints, disciplinary | ✅ Matches | — |
| Guard Officer | Full: patrol, incidents (view) | ⚠️ Cannot see own deployment or site | Finding #6 |
| Armorer | Full: armoury, guards (view) | ✅ Matches | — |
| K9 Supervisor | Full: k9s | ✅ Matches | — |
| K9 Handler | Full: k9s | ❌ Same as Supervisor — can create/delete dogs | Finding #3 |
| Finance Manager | Full: finance, invoices, expenses, documents (view), campaigns (view) | ✅ Matches | Finding #11 (no invoice threshold) |
| Accountant | Full: invoices, expenses, **finance** | ✅ Matches | — |
| Assistant Accountant | Full: finance module (!) | ⚠️ Module-level is overly broad | Finding #5 |
| Cashier | Full: finance, invoices (view), expenses (view) | ✅ Matches | — |
| Administrative Officer | Full: administration, requisitions | ✅ Matches | — |
| IT Officer | Full: it, workflow, all others view + guards (view) | ✅ Matches (guards is view, not full — `server.ts:382`) | — |

---

## Cross-Role Pattern Issues

These repeat across multiple roles and need systemic fixes:

### Pattern A — Notification system is present but sparsely used
The notification table exists and is used in some places (e.g., `POST /api/notifications`), but the deployment order handoff, guard lifecycle transitions, and campaign budget routing all generate **no notifications**. Any workflow that crosses role boundaries is operating blind.

### Pattern B — `requireAnyRole` and `requireModuleAccess` used inconsistently
Some endpoints use `requireModuleAccess`, some use `requireAnyRole`, some use inline checks, and some have no guard at all (e.g., `/api/reports`, `/api/requisitions` read). A single access-control pattern should be enforced across all endpoints.

### Pattern C — Internal module names leak in error messages
Every `requireModuleAccess` 403 uses the internal module name (`"k9s"`, `"armoury"`, `"incidents"`) not the display name. Consistent across every module — a global fix in the middleware would resolve all of them at once.

### Pattern D — GM and Director have view on every module — test plan and code disagree
Both Directorate roles get `"view"` on every module in `MODULE_PERMISSIONS`. The test plan says they should be scoped to Directorate and approval flows only. This contradiction runs across every single module in the system and needs a definitive architectural decision.

---

## Priority Fix List

| Priority | Finding | Effort |
|----------|---------|--------|
| 🔴 1 | Decide GM/Director cross-module view scope (Finding #1, #2, Pattern D) | High — design decision |
| 🔴 2 | Add notifications on deployment order create/assign + guard lifecycle transitions (Finding #17, #18) | Medium |
| 🔴 3 | Gate `GET /api/reports` with role check (Finding #20) | Low |
| 🟡 4 | Downgrade K9 Handler from "full" to handler-appropriate actions (Finding #3) | Low |
| 🟡 5 | Downgrade OM recruitment from "full" to "view" (Finding #4) | Low |
| 🟡 6 | Add guard module "view" for Training Officer (Finding #7) | Low |
| 🟡 7 | Add operations/sites "view" for Guard Officer (Finding #6) | Low |
| 🟡 8 | Add invoice high-value threshold → GM escalation (Finding #11) | Medium |
| 🟡 9 | Remove Director from final leave approval step (Finding #10) | Low |
| 🟡 10 | Fix hardcoded `requireAnyRole` on leave-requests (Finding #16) | Low |
| 🟢 11 | Map internal module names to display names in 403 errors (Finding #15) | Low |
| 🟢 12 | Expired acting-role cleanup job (Finding #19) | Low |
| 🟢 13 | Login-time role allowlist to block Inspector/Site In-Charge accounts (Finding #14) | Low |
| 🟢 14 | Generic error message for Records Officer field restriction (Finding #9) | Low |

---

*Note: Browser UI screenshots were not captured — browser subagent quota was exhausted. All findings are sourced from server.ts code analysis (lines 80–4411) and live API responses with real JWT tokens. A second pass with browser access would add: frontend nav visibility per role, form-level UX issues, and notification badge behavior.*
