# ISCMS RBAC & Workflow Realignment — Working Findings

> Living document from department-by-department Q&A sessions realigning the ISCMS system's actual role/access/workflow behavior with intended real-world design. Update this file as each department is completed.

**Status:** Pass COMPLETE — all 8 departments walked through and finalised. Post-pass Q&A (2026-08-09) locked in corrections & an implementation plan: OM has **no contract approval/void rights** (site-survey support only, GM-only void), **Marketing-led payment reminders**, **QuickBooks = separate system**, and a phased implementation plan (§9).

---

## 0. Continuation Prompt (use this if a session gets cut off)

If a chat session runs out of context before this document is fully updated, paste the prompt below into a new session (with this markdown file uploaded) to pick up exactly where things left off, for any department/role.

```text
We're continuing a role-by-role RBAC and workflow realignment for the ISCMS system.
Attached is our working findings document (ISCMS-RBAC-Realignment-Findings.md).

Read the "Status" line and the "Open Items" section first to see what's done,
what's in progress, and what's next.

For the CURRENT department/role in progress (or the next one in the Open Items
list if none is in progress):
1. Summarize what's already been decided for it, from the doc.
2. Ask me a focused question (one or two options at a time, not open-ended) to
   nail down the next undecided thing: what each specific role in that
   department actually does day-to-day, what module access level they should
   have (Full / Create+Edit / View / Approve / Own-record only / None), what
   approval chain steps they own, and how a record's lifecycle moves through
   the system end to end for that department's core workflow.
3. After I answer, update this markdown document directly (don't just tell me
   the answer — write it into the relevant section, and update the Status line
   and Open Items list).
4. Keep questions short and use multiple-choice options where possible, since
   I'm answering by voice/dictation and typing is hard for me.
5. When one role or workflow question is fully resolved, move to the next one
   in that same department before jumping to a different department.
6. When a whole department is done, mark it ✅ in the Status line and ask
   which department to tackle next.

Do this for every remaining department in "Open Items", one role at a time,
until the whole system's RBAC and workflow design is fully documented.
```

---

## 1. Directorate (Finalized)

| Role | Access |
|---|---|
| **General Manager** | Full on Directorate + Reports & Analytics. **Approve-only** (not general View) on: Contracts (≥100M UGX step, + void), Expenses (>10M UGX step), Campaign Budgets (>10M UGX step), Leave Requests (final step), and finance-approval items generally. **None** on all other modules (Finance, HR, Operations, Marketing, Client CRM, Fleet, Administration, IT, Recruitment, Documents, Performance Reviews, Workflow, Guard Portal) — no general browsing access, only shows up where an approval is pending. |
| **Director** | Full on Directorate (view only) + Reports & Analytics. **None** on everything else — pure oversight, zero approval power ever. |

**Behavior rule:** When a GM approval item is pending (contract/expense/campaign/leave), GM sees the *whole module's list* with their pending item(s) highlighted — not an isolated inbox view.

**Open flag:** Reports & Analytics needs to be comprehensive enough to cover Finance/HR/Operations/Marketing/Fleet/Administration/Performance Reviews KPIs, since it's now Directorate's *only* visibility into those departments (given GM/Director hold None elsewhere).

---

## 2. Operations Department (Mostly Finalized)

### 2.1 Reporting structure (confirmed)

```
Operations Manager
├── Regional Manager
│     └── Inspector (rank — supervises zones; NOT "Zone Inspector")
│           └── Site In-Charge (one per site)
│                 └── Guard (assigned site)
├── Armorer
├── K9 Unit Lead
│     └── K9 Handler
├── Fleet Manager
└── Training Officer
```

### 2.2 Operations Manager

- **Role is analytics/KPI dashboard only** — informed oversight of what's happening across regions, not hands-on doing.
- **No CRUD rights** in: Armoury, K9, Fleet, Training, site-level ops, HR module. IT access reduced/removed (view-only at most).
- Cannot create vehicles/Fleet records (stays with Fleet Manager).
- **Client contracts (CORRECTED 2026-08-09):** OM is **out of contract approval/voiding entirely**. Before a contract reaches the GM, OM contributes **supporting information only** — e.g. carrying out a **site survey** (site feasibility/staffing assessment). **Only the General Manager approves or voids contracts** (≥100M UGX step; void always requires a mandatory reason, matching the system-wide void-with-reason pattern).
- **Finance approvals:** the GM holds finance-approval powers, not the OM (correction from an earlier draft note).
- **Deployment orders:** OM issues the order specifying **how many** guards are needed; Regional Manager selects **which specific guards** fill it.
  - 🔧 **UI/UX flag:** the deployment-order flow needs visible improvement — this is a priority documentation/design item.
- **Recruitment/training lifecycle — confirmed canonical single path (always goes through OM, no shortcuts):**
  1. OM identifies headcount need and is **personally involved in interviewing/selecting** recruit candidates (not just requesting a number — HR does not run hiring end-to-end alone).
  2. HR captures biodata and enrolls the guard → stage `ENROLLED`.
  3. HR hands the guard to Operations → stage `HANDED_TO_OPERATIONS`.
  4. OM sends the guard to the Training School → stage `IN_TRAINING`; Training School is notified.
  5. Training Officer trains and marks pass-out → stage `PASSED_OUT`; **OM is notified via a real in-app notification.**
  6. OM decides which region; Regional Manager deploys the guard to a specific site → stage `DEPLOYED`.
  - 🔧 **UI/UX flag:** the guard lifecycle view needs visible improvement — priority documentation/design item.

### 2.3 Regional Manager

- Keeps **hands-on Full control** of region operations: rosters, K9, deployments (region-scoped).
- Patrol inspections = physically moving between client sites to check guards are on duty/working. Handled by **both** RM and Inspector.
- Can **delegate non-sensitive work** down to the Inspector (e.g. scheduling guard shifts) — not sensitive work.
- **First approval step** on Leave Requests and Disciplinary Actions stays solely with RM — Inspector has no approval role in either chain.
- No access to the Sites module (unchanged from current build).

### 2.4 Inspector (rank, not a job title — a promoted Guard)

- Supervises zones.
- **Personally logs/submits patrol inspection records directly** (not merely reviewing Site In-Charge reports).
- Sits below Regional Manager, above Site In-Charge. Distinct rank from Site In-Charge — not interchangeable.

### 2.5 Site In-Charge

- One per site.
- Handles **both** attendance/check-in oversight **and** incident reporting — but scoped strictly to their own site, nothing beyond it.

### 2.6 Guard

- Own-record only (check in/out, own leave, own incidents).
- **Guard record now carries an assigned site** — ties check-in/attendance to a specific location under a Site In-Charge.

### 2.7 Armorer / K9 Unit Lead / K9 Handler / Fleet Manager / Training Officer

- **Confirmed unchanged** from current documented build — each fully owns their own module (Armoury; K9 records/health/handler-pairing/deployment; Fleet — vehicles/drivers/fuel/maintenance/licence approval; Training cohorts/recruits/pass-out).
- K9 Handler stays own-dog-only for deployment logs; views health records.

### 2.8 Cross-department reconfirmations surfaced during the Operations pass (no changes — just re-verified)

- **IT Officer:** scope stays as-is — user creation, roles/privileges, system-wide oversight.
- **Records Officer (HR):** owns the **entire ID card issuance interface** — reconfirmed as HR's, not IT's.
- **Administrative Officer:** has **no rights to create a client site**; scope is inventory/administrative matters only.
- **Data-sharing flows:** HR pulls stock-inventory data from the Administrative Officer, and loans/rent/food data from the Cashier (Cashier sits organizationally under **Finance**, not HR).

---

## 3. Marketing / Sales Department (In Progress)

### 3.1 UI/UX goal
- Campaign management and Sales Pipeline views need a significantly improved UI/UX experience (not further specified yet — treat as a design priority alongside the Operations UI/UX flags above).

### 3.2 Lead source tracking (new requirement)
- **Gap identified:** the current `Lead` model has no source/channel field — only `Campaign` has a `channel` field. To deliver lead-source analytics, `Lead` needs its own source field.
- **Source is mandatory at creation** — every lead must have a source picked when logged: Website, X, LinkedIn, TikTok, referral, etc.
- **Leads enter the system two ways:**
  1. **Manual entry** by Sales and Marketing Supervisor / BDM staff — covers X, LinkedIn, TikTok, referral, walk-in, etc. Staff picks the source from a required dropdown.
  2. **Automatic capture** — **confirmed: Website only.** A website contact form integration auto-creates a lead with `source: "Website"`.
- **Decision on social platforms (X/LinkedIn/TikTok):** deliberately **not** building automatic API capture for these. Rationale: social platform APIs require app review, tokens, webhooks, and ongoing maintenance per platform — not justified at this system's scale. Manual source-tagging by staff gives 100% reliable reporting at zero integration cost. Revisit later only if social ad spend grows enough to justify it.

### 3.3 Analytics requirement
- Need lead analytics broken down by source channel (Website vs. X vs. LinkedIn vs. TikTok vs. others) — feeds into the Campaign/Sales Pipeline UI/UX rework above.

### 3.4 Business Development Manager vs. Sales and Marketing Supervisor (pipeline ownership)

- **BDM personally works some leads** (e.g. big-ticket/high-value ones) — not a pure oversight role.
- **Pipeline stage progression: owner-based model** (industry-standard CRM practice, à la Salesforce/HubSpot):
  - Every lead has exactly **one owner** — a Sales and Marketing Supervisor, or the BDM if they're personally working it.
  - **Stage set (confirmed 2026-08-09):** New → Contacted → Qualified → Proposal Sent → Closed Won / Closed Lost.
  - **Only the lead's owner can advance its stage** (New → Contacted → … → Closed Won, etc.). This keeps every stage change attributable to whoever is actually working the deal, which is what makes pipeline reporting trustworthy.
  - **BDM's oversight/control mechanism is reassignment, not direct editing** — BDM can reassign a lead's ownership to a different Supervisor, or take it over themselves, at any time (e.g. a stalled deal, escalation, staffing change). Once reassigned, the new owner is the one who moves the stage. BDM never directly edits a stage on a lead they don't own.
  - **CONFIRMED: reassignment is BDM-only** — a Sales and Marketing Supervisor cannot reassign their own lead to another Supervisor; only BDM can move lead ownership.

### 3.5 Campaign Budget & Complaint Handling (combined with Finance touchpoints)

- **Campaign budget approval chain confirmed:** Sales and Marketing Supervisor / BDM propose → **Accountant screens/prepares the request first** → **Finance Manager gives final approval** → if budget > 10M UGX, additionally routes to **GM** for final sign-off. (Mirrors the Expense approval flow exactly.)
- **Complaint intake — SCOPE CHANGE:** clients submit complaints via a **form on the company website** → **Marketing is notified** → Marketing can **escalate/refer** the complaint details to the **Investigations Officer** for conduct/integrity issues.
  - ⚠️ **Important:** this activates what the current constitution (§12) marks as **FUTURE-ONLY** — the client-facing complaint intake portal was explicitly not yet built. This is now a confirmed, in-scope requirement, not a future item.
  - **Implementation note (confirmed 2026-08-09):** the company website is a **separate public site** that POSTs to an ISCMS **public receiving endpoint** (rate-limited + sanitized, honeypot). ISCMS does not host the client form itself — it exposes the API and handles routing/notifications.
  - Resolution flow otherwise unchanged: Marketing resolves service-quality complaints directly (satisfaction rating 1–5 mirrored to the linked ClientSite); conduct/integrity complaints get referred to Investigations and linked to an incident.

---

## 4. Finance Department (In Progress)

- **Campaign budget approval:** Accountant screens/prepares → Finance Manager gives final approval → >10M UGX also routes to GM. (Same pattern as expenses.)
- **Invoicing & collections digitization (confirmed):**
  - Accountant creates the invoice → **Finance Manager approves before it's sent** to the client (mirrors expense/campaign-budget pattern — consistent sign-off on all outbound client-facing money documents).
  - **Automated SMS + email payment reminders** tied to the invoice due date: e.g. 3 days before due, on the due date, then at 7/14/30 days overdue. Recommended stack: a local SMS gateway (e.g. Africa's Talking for Uganda) + a standard email service (SendGrid/SES).
  - **Collections model (CORRECTED 2026-08-09 — Marketing-led with guardrails):** automated payment reminders (SMS + email on the due-date schedule) **originate from Marketing**, branded with the client's **account manager name** — system-driven, so the schedule never slips and no staff manual work is required. **Finance is the status authority** — the *only* writer of invoice/payment status.
  - **Guardrails (confirmed):** Marketing gets **view-only** access to invoice due/overdue status (a read-only collections view) for relationship-level follow-up; any **dispute, credit decision, or service suspension returns to the Finance Manager**; the reminder engine logs under Finance's module so the FM still sees collections health in reporting.
- **QuickBooks decision (2026-08-09):** ISCMS and QuickBooks stay **separate systems of record** — no sync is built. Documented decision; revisit only if reconciliation overhead grows enough to justify an integration.
- **Cashier transactions:**
  - **Loan and Salary Advance stay as SEPARATE transaction types** (explicitly not merged, despite terminology overlap).
  - **Disbursement flow:** Cashier initiates the request → **Finance Manager approves** → Cashier disburses and logs. Applies to loans and salary advances — every disbursement requires Finance Manager approval; no amount-threshold complexity for now.

- **Accountant vs. Assistant Accountant split (recommendation given, confirmed by silence/proceeding):** split by **function, not amount**, to avoid overwhelming the Accountant.
  - **Assistant Accountant:** transaction-level data entry/recording — both in ISCMS and QuickBooks.
  - **Accountant:** reconciliation, reporting, and screening/preparing items (invoices, expenses, campaign budgets) before they go to the Finance Manager.
  - **Note:** the whole Finance department currently works largely in **QuickBooks** day-to-day, and everyone in the department has QuickBooks access. **Decision (2026-08-09):** ISCMS and QuickBooks stay **separate systems of record** — no sync built (see the QuickBooks decision bullet above).
- **Internal Auditor:** reviews financial records **a few times a week** — periodic, not continuous real-time review, and not purely reactive/flagged-issue-only.
- **Finance Manager review scope confirmed:** FM personally reviews **every** invoice and expense, no threshold — the GM's additional approval step only kicks in above the existing 10M UGX (expenses/campaigns) / 100M UGX (contracts) thresholds. Reaffirms current system design.

---

## 5. HR, Administration & Investigations

### 5.1 HR — Full role-by-role pass (CONFIRMED)

- **Guard transfers:** the **Operations Manager initiates/approves** the transfer (which region/site) — an operational deployment decision, matching OM's existing role. **HR (Assistant) updates the guard's HR record** afterward to reflect it (status, region, history) — HR documents, doesn't initiate.
- **HR Manager vs. HR Assistant split** (mirrors the Accountant/Assistant Accountant pattern from Finance, to avoid overwhelming the Manager):
  - **HR Assistant:** day-to-day data entry — guard record updates, reflecting transfers/status changes, recruitment shortlisting, the HR leave-review step, and **preparing/documenting disciplinary cases** before the HR Manager finalizes.
  - **HR Manager:** sign-off/escalation authority only — contract issue/void, **final disciplinary authority** (sole finalizer), final performance-review sign-off, forwards leave to GM. Kept out of day-to-day data entry.
- **Records Officer:** unchanged — full ownership of the ID issuance interface (photo + signature capture, ID numbers) plus personnel file/contract archiving.
- **Recruitment overlap with Operations Manager** (see §5.1 recommendation — recommended but not yet explicitly re-confirmed after the Manager/Assistant split above): HR posts jobs and shortlists → **OM personally interviews/selects for guard positions** → HR finalizes hiring, captures biodata, enrolls. Non-guard roles stay fully HR-owned.

### 5.2 Administration — Requisition approval chain (SCOPE CHANGE)

- **CONFIRMED:** requisitions are approved by the **General Manager** — not the Finance Manager, and **no cost threshold** — every requisition regardless of amount goes to GM for approval.
- Any department can submit a requisition (the `AdminRequisition` model already has a `department` field) — a requisitioning department is requesting **GM approval directly**, not asking the Administrative Officer for approval. The Administrative Officer's own purchases also requisition and wait for GM approval, same as any other department.
- ⚠️ **Scope change:** this contradicts the current Directorate design, where GM holds **None** access on the Administration module. GM now needs an actual approval role in Administration (a requisitions inbox), not just Reports & Analytics visibility.
- Needed: a clear **GM-facing view/inbox** to see and approve pending requisitions across all departments (consistent with the "GM sees the whole module list with pending items highlighted" pattern already established for Directorate).

### 5.3 Investigations — Team structure

- **CONFIRMED:** the department currently has **2 Investigations Officers**, not 1 as originally documented.
- They are **peers** — either can handle any case, no senior/lead distinction between them.
- Remains an independent department (not under Operations), reporting to Directorate — unchanged from v2.8.

### 5.4 IT Department (Finalized)

- **IT Officer:** confirmed as currently documented — Full control on IT module, Users, Custom Roles, and Regions (exclusive to this role); View-only on every other module for troubleshooting; never creates or approves business records elsewhere.
- **New capability confirmed:** IT Officer can grant **temporary elevated/"acting" privileges** to a subordinate — e.g. an HR Assistant acting as HR Manager while the HR Manager is on leave. This is a time-bound delegation feature managed by the IT Officer (via the existing Custom Roles mechanism, or a new "Acting Role" assignment with an expiry tied to the leave period).

---

## 6. Directorate — Final Revisit (Finalized)

One change surfaced from the rest of the pass: since **every requisition (Administration) now routes to the General Manager for approval** (§5.2), GM needs real access to that module.

| Role | Access |
|---|---|
| **General Manager** | Full on Directorate + Reports & Analytics. **Approve-only** on: Contracts (≥100M UGX step, +void), Expenses (>10M UGX step), Campaign Budgets (>10M UGX step), Leave Requests (final step), **and now Administration (requisitions — every one, no threshold)**. **None** on all other modules (Finance, HR, Operations, Marketing, Client CRM, Fleet, IT, Recruitment, Documents, Performance Reviews, Workflow, Guard Portal). |
| **Director** | Unchanged — Full on Directorate (view only) + Reports & Analytics. None on everything else, including Administration — pure oversight, zero approval power. |

Everything else about the original Directorate design (§1) stays exactly as finalized — this is the only correction.

---

## 7. Pass Status: COMPLETE

All departments have been walked through in this realignment pass: **Directorate, Operations, Marketing/Sales, Finance, HR, Administration, Investigations, IT.**

---

## 8. Open Items / Not Yet Resolved (Remaining Follow-Ups)

Resolved during the pass or in the post-pass session (2026-08-09):

- [x] Confirm exact scope of Operations Manager's contract Approve/Reject/Void → **RESOLVED:** OM has **no** contract approval or void rights; only the **GM approves or voids** (mandatory void reason). OM contributes supporting site-survey info only (§2.2).
- [x] Directorate revisit: GM Administration approval role → **RESOLVED:** GM now holds approve-only on Administration (requisitions, every one, no threshold) with a requisitions inbox; access matrix updated in §6.
- [x] Finance: ISCMS ↔ QuickBooks integration question → **RESOLVED:** separate systems of record, no sync (§4).
- [x] IT department walk-through → **RESOLVED:** finalized in §5.4.
- [x] Final Directorate revisit → **RESOLVED:** see §6.

Still open (now tracked as implementation phases in §9):

- [ ] Deployment-order step: concrete UI/UX redesign (OM issues headcount request → RM assigns specific guards) — Phase 4.
- [ ] Guard lifecycle view: concrete UI/UX redesign to visualize the 6-step recruitment→deployment path clearly — Phase 4.
- [ ] Marketing/Sales: campaign budget UI/UX and complaint-handling UI/UX for BDM/Supervisor — Phase 2.
- [ ] Lead `source` field + lead-source analytics (confirmed requirement, §3.2–3.3) — Phase 2.
- [x] GM requisitions inbox implementation (confirmed, §5.2) — Phase 1. **DONE 2026-08-09:** GM-only approve/reject endpoints (`/api/requisitions/:id/approve|reject`, every requisition no threshold), AdminDeptView pending-highlight + approve/reject UI, `rejectedBy/rejectionReason/approvedBy/approvedAt` fields, tests.
- [x] Contract realignment — GM-only approve/void + OM site-survey supporting info (§2.2). **DONE 2026-08-09:** chain now `BD → Finance → GM (≥100M) → Done`; OM approve/void stripped, `survey` action added; `siteSurvey*` fields; tests.
- [x] IT "acting privileges" time-bound delegation capability (confirmed, §5.4). **DONE 2026-08-09:** `actingRole/actingExpiresAt/actingGrantedBy/actingGrantedAt` on User; IT Officer grant/revoke endpoints (`PUT|DELETE /api/auth/users/:id/acting`, full-IT only, self-grant/IT-Officer/executive guards); effective role resolved at login and signed into the JWT; client `getEffectiveRole` + AppShell acting banner + ITAdminView `ActingPrivilegeModal`; tests.
- [x] Durable (DB-persisted) in-app notifications — Phase 5. **DONE 2026-08-09:** `Notification` model (userId/targetRole/type/title/message/module/readAt), `GET|POST /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id`; the client `notificationStore` hydrates on login/mount and every existing toast trigger (`domainStore.notif`) now persists to the DB via the bell's `addNotification`; ownership enforced server-side (user-scoped vs role-scoped).
- [ ] Payment reminder engine (Marketing-origin, Africa's Talking + SendGrid) — Phase 3.

---

## 9. Implementation Plan (confirmed 2026-08-09)

Phased buildout decided in the post-pass Q&A session. Global naming: the **Transport module is renamed "Fleet"** everywhere (module id `transport` → `fleet`).

**Phase 0 — Doc & naming:** findings-doc corrections (this doc), Transport→Fleet rename across codebase.
**Phase 1 — RBAC & access:** GM requisitions inbox (§5.2); contract realignment — GM-only approve/void + OM site-survey supporting info (§2.2); IT acting-privileges delegation (§5.4); consolidate view-level role gating onto the shared `rbacService`. **1a–1d DONE 2026-08-09** (requisitions inbox, contract realignment, acting privileges, view gating consolidation — `GovernancePanels` canManage/canMove, `SystemWalkthroughModal`, `GuardDeploymentPipeline`, `OperationsView` training-gate now route through `isRoleIn` + shared role sets incl. new `DEPLOYMENT_OPERATIONS_ROLES`).
**Phase 2 — Marketing/Sales:** Lead `source` field (mandatory); website lead intake endpoint (source "Website"); owner-based pipeline with BDM-only reassignment (5-stage set); lead-source analytics; public complaint intake endpoint; campaign-budget & complaint-handling UI/UX. **DONE 2026-08-09** (source required + website intake + owner pipeline + BDM-only reassign + source analytics in `MarketingView` + `/api/public/complaints` + campaign budget approval UI).
**Phase 3 — Finance & Marketing-led collections:** invoice approval before send; Marketing-origin reminder engine (Africa's Talking SMS + SendGrid email, keys in `.env`); Marketing view-only collections view; cashier disbursement FM-approval flow; Accountant/Assistant access split. **DONE 2026-08-09** (invoices created `Draft`, FM-only `approve` → `Pending`/sent; `POST /api/invoices/:id/remind` logging `Reminder` rows with graceful skip when `.env` keys absent; `GET /api/collections` read-only for Finance+Marketing + Collections tab in `MarketingView`; `CashierTransaction` `Pending Approval → Disbursed/Rejected` with FM-only `approve`/`reject`; `invoices`/`expenses` access split — Assistant Accountant/Cashier/Internal Auditor view-only, Accountant edits ledger but cannot approve).
**Phase 4 — Operations UI/UX:** deployment-order two-step redesign; guard lifecycle 6-step view; OM analytics-only oversight verification. **DONE 2026-08-09** (deployment orders: explicit `Step 1 Ops issues → Step 2 RM fills` progress on every order + headcount-capped assign picker; `GuardDeploymentPipeline` now renders the full 6-step canonical path incl. a Recruit-Intake lead-in node with per-step numbering; OM granted the read-only Reports/analytics module and verified view-only on Armoury/K9/Fleet/Training/sites/leads/HR/marketing with hands-on ownership confined to incidents, deployment orders & guard lifecycle — 11 new tests).
**Phase 5 — Durable notifications:** `Notification` model, server endpoints, persist all notification triggers. **DONE 2026-08-09** (`prisma/migrations/20260809205654_phase5_durable_notifications`; `Notification` model; `GET|POST /api/notifications`, `PUT /api/notifications/:id/read`, `PUT /api/notifications/read-all`, `DELETE /api/notifications/:id`; `notificationStore` hydrates from the server and every `domainStore.notif` trigger persists via the bell `addNotification`; server-side ownership enforcement for user-scoped vs role-scoped rows — 8 new tests, 153 total).
**Verification:** Prisma migration + seed update; new tests (GM requisition approval, mandatory lead source, owner-only stage advance, BDM-only reassignment, invoice pre-send approval, notification persistence, fleet rename); `npm run lint` + `npm test`.

---

*Generated from the ISCMS RBAC realignment working sessions. Cross-reference: `/areas/iscms-rbac-realignment.md` (session memory).*
