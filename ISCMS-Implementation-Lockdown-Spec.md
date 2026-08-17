# ISCMS — Implementation Lockdown Spec

**Purpose:** This is the single, final source of truth for how ISCMS is *supposed* to behave — organizational structure, RBAC, and every workflow chain — reconciled against the current build. It supersedes anything in the existing project docs (`Integrated Security Company.md`, `PROJECT_REVIEW_AND_WORKPLAN.md`, etc.) where they conflict with what's below. Written to be handed directly to whoever (human or AI agent) implements the remaining fixes before Monday's UAT.

Each section states the **rule**, then, where relevant, a **Known Gap** — what the current build (per the project status doc reviewed this session) actually does instead, so implementation effort goes to the right place first.

---

## 0. Implementation Approach — Reconcile, Don't Rebuild

**This is not a rebuild-from-scratch instruction.** Treat the current codebase as the starting point and this document as the target state, then reconcile the two:

- **Already matches this spec?** Leave it alone. Don't touch working code just because this document restates what it already does.
- **Conflicts with this spec** (wrong approver, wrong chain, wrong threshold, etc.)? Fix it to match — these are the "Known Gap" notes called out throughout.
- **Genuine duplication or unnecessary cruft** (e.g. the duplicate hero banners on Identity Cards, HR-area widgets rendering on roles that shouldn't see them, the bypass "Issue Warning" button)? Remove it — flagged explicitly where known.
- **Exists in the system, works fine, but was never discussed in this spec?** Leave it in place. Silence on something here means this conversation didn't get to it — not that it's wrong. Only remove something because it actively conflicts with a rule stated above, never merely because it isn't mentioned.

When in doubt whether something falls in the "undiscussed but fine" bucket versus the "cruft to remove" bucket, the safer default is to preserve it and flag it for a follow-up decision rather than delete it outright.

---

## 1. Organizational Structure

**Flat, independent departments — all report directly to Directorate/GM. No department sits inside another.**

```
Directorate (Director, General Manager)
├── Operations
├── Fleet                  ← now independent (was nested under Operations)
├── Investigations
├── HR
├── Marketing / Sales
├── Finance
├── Administration
└── IT
```

- **Director:** pure oversight. Zero approval power, zero operational access, anywhere, ever.
- **General Manager:** the executive on the ground. Sole approver on Contracts, Requisitions, Expenses, Campaign Budgets (see §2). Full access to Directorate + Reports & Analytics. No CRUD in any department's day-to-day operations.

**Ranks vs. Roles:** Within Operations, front-line personnel hold a **rank**, not a system-login role: `Guard → Site In-Charge → Inspector → Regional Manager`. Operations Manager is a management position, not part of this rank progression. **Rank-as-login-role (giving Site In-Charge, Inspector, and Guard their own system accounts) is explicitly paused** — not in scope for this build. Do not create User accounts for these; they remain attributes on the Guard record for now.

**Terminology corrections:**
- Drop "field ladder" — the correct term is **rank**.
- Drop "Guard Officer" entirely — it does not correspond to anything decided. If it exists as a `UserRole` value, delete it.

### Known Gap
- Current `UserRole` enum includes `Guard Officer`, which maps to nothing in this spec — remove it.
- `src/constants/organization.ts` / project docs still describe the org chart as *"Operations (incl. Fleet)"*. Fleet must be split out as its own top-level department everywhere this is defined (org chart data, module/nav grouping, department counts).

---

## 2. No-Threshold Approvals (Directorate)

**General Manager is the sole approver, with no amount-based threshold, on:**
- Contracts (all — client and staff)
- Requisitions (from any department, including Administration's own)
- Expenses
- Campaign Budgets

There is no split between "GM approves above X" and "someone else approves below X" anywhere in this list. Any existing threshold logic (e.g. 10M/100M UGX gates) on these four should be removed.

### Known Gap
- Current contract approve chain is `BD → Finance → GM`, gated only above 100M UGX. Needs to become GM-only, no threshold, no Finance step (see §6).

---

## 3. Operations Department

**Operations Manager (OM):**
- Direct reports: Regional Manager, Armorer, K9 Unit Lead (K9 Supervisor), Training Officer. (**Fleet Manager is no longer a direct report** — Fleet is independent, see §1.)
- Role is KPI/analytics oversight across regions — **not** operational CRUD. OM cannot add armoury items, manage K9 records, touch Fleet, or manage HR records directly.
- Issues deployment orders (headcount needed); **Regional Manager** selects which specific guards fill each order.
- **Zero contract authority** — no approve, no reject, no void, ever (see §6). If OM needs contract info, he submits a Contract Inquiry to Records Officer (see §6).
- **Requests site surveys? No.** Marketing always requests the survey (see §6); OM only conducts/contributes to it. OM should have a **read-only history/log of site surveys he's conducted**, for accountability.
- IT module access: view-only at most, no broader access.

**Regional Manager:**
- Oversees the rank ladder (Inspector → Site In-Charge → Guard) at their own region only.
- Has **no authority** over other departments' staff physically located at their regional office (finance, marketing, etc. stay under their own department heads).
- First approval step on leave requests and disciplinary actions originating in their region (Inspector has no approval role in either).
- Can delegate non-sensitive work (e.g. shift scheduling) down to Inspector; not sensitive work.

**Inspector (rank):** personally logs/submits patrol inspection records directly — not just reviewing Site In-Charge reports.

**Site In-Charge (rank):** handles attendance/check-in oversight and incident reporting, scoped strictly to their own site.

**Guard record:** must carry an assigned site (ties check-in/attendance to a specific Site In-Charge's location).

### Guard Lifecycle (canonical path — final)
1. Operations mobilizes/recruits candidates in the field. **This phase is entirely off-system — nothing is recorded until the recruit physically reaches the organization.**
2. On arrival, **HR captures biodata and enrolls** the guard (stage `ENROLLED`) — this is the actual point a guard record first exists in the system.
3. HR hands the guard to Operations (stage `HANDED_TO_OPERATIONS`).
4. OM sends the guard to Training School (stage `IN_TRAINING`); Training School is notified.
5. Training Officer trains and marks pass-out (stage `PASSED_OUT`); OM is notified. Training School UI should support surfacing top performers/qualifications from the cohort — this deserves a genuine UI upgrade, not just a pass/fail log.
6. OM decides which region needs the guard; **Regional Manager** deploys to a specific site (stage `DEPLOYED`).

All lifecycle-stage transitions must fire real in-app notifications (Training Officer → OM on guards received/passed out), not informal channels.

### Recruitment (non-guard roles)
- **Guard positions:** HR posts/screens, builds shortlist → **OM personally interviews and selects** from the shortlist → HR finalizes hiring, captures biodata, enrolls.
- **Non-guard roles** (drivers, office staff): HR handles the pipeline end-to-end, no OM involvement.

### Guard Transfers
OM initiates/approves the transfer (operational decision). HR (Assistant) then updates the guard's HR record to reflect it (status, region, history) — HR documents, doesn't initiate.

### Known Gap
- Verify Fleet Manager has already been removed as an OM direct report in whatever config currently lists this.

---

## 4. Fleet Department (independent)

Owns Vehicles, Trips, Fuel Logs, Maintenance, Drivers, Inspections, Breakdowns — full CRUD, unchanged from current build.

### Transport Request Flow — final
1. **Requester:** any full-time operational staff member, **including the General Manager**. **Directors excluded** (not on-site staff).
2. Request lands in the **Fleet Manager's** inbox.
3. Fleet Manager checks driver/vehicle/rider availability and **assigns**: vehicle *or* motorcycle, driver *or* rider, and the vehicle/motorcycle's plate number.
4. **Approve:** requester is notified the request was approved with the assigned details.
5. **Decline:** Fleet Manager must give a reason via an interactive form — **dropdown of common reasons** (e.g. no driver available, vehicle in maintenance) **plus a custom/free-text option** if nothing in the list fits.
6. Every action (request, assignment, approval, decline + reason) is audit-logged.

This matches the existing Transport Request feature closely — confirm the decline-reason UI has the dropdown+custom pattern; add it if it's currently free-text-only or missing.

---

## 5. HR Department

**HR Manager vs. HR Assistant split** (mirrors Finance's Accountant/Assistant Accountant pattern):
- **HR Assistant:** day-to-day data entry — guard record updates (including transfer reflections), recruitment shortlisting, leave-review step, preparing/documenting disciplinary cases before HR Manager finalizes.
- **HR Manager:** sign-off/escalation authority only — contract issue/void (staff contracts), final disciplinary authority, final performance-review sign-off, forwards leave to GM.
- **Guard lifecycle stage sign-off:** either HR Manager or HR Assistant can do this (not Manager-exclusive).
- **Disciplinary finalization:** HR Manager only, strictly.

**Records Officer** (unchanged, full ownership):
- ID issuance interface (photo + signature capture, ID numbers).
- Personnel file / contract archiving (contracts are confidential — not broadly visible to the org; see §6).
- Fields Contract Inquiry requests (see §6).
- Nav should **not** include "Recruitment & Staffing" or "Performance Reviews" — instead, both feed Records Officer via the existing Identity Cards **"Pending Records Issuance"** queue: a newly enrolled guard lands there automatically, and a promotion changing a guard's printed designation should trigger a "reissue required" entry — without exposing review scores/comments/case detail.

**Leave workflow:** `Submit → HR Manager approves → [staff only, optional] GM approves → Approved`. HR Assistant is not an approver. Reject-with-reason available at any step.
- **Requester is the General Manager, or another department manager at HR Manager's own level:** HR Manager still processes the approval step, but **cannot deny it** — for these requesters, HR Manager's approval is a formality/audit-log entry, not a real gate. HR Manager's actual denial authority only applies to leave requests from staff genuinely subordinate to them. The only person who truly outranks HR Manager is the General Manager.

**Leave balance tracking:** currently incomplete (entitlement/taken/balance render as blank dashes) — needs real data wired in, this is a required fix, not cosmetic polish.

**Disciplinary case UI:** HR Manager currently can't see the actual charge sheet/incident narrative before deciding a case — needs the incident origin and who-did-what visible before judgment is rendered.

**Staff Appraisal:** should auto-surface the guard's disciplinary history for the review period, so a lenient evaluator can't unknowingly omit it.

**New ID card requirements:**
- Photo/signature capture: phone, or a smartphone/webcam/camera connected to a PC — no dedicated hardware purchase needed.
- ID template **auto-populates from the database record** — no manual typing of name, force number, etc.
- Fields set manually at issuance: issuing date, expiry date, issuer's signature, holder's signature.
- **Guard IDs:** simple — printed/laminated only, no smart card (cost + uncertain tenure).
- **Permanent staff:** plastic cards.

### Known Gap
- The one-click "Issue Warning" button on every Personnel Directory row bypasses the formal disciplinary chain (Investigations Officer → Regional Manager → Operations Manager → HR sign-off) — **remove it**. Disciplinary actions should only originate from the guard's individual profile page.
- Guard Lifecycle, Guard Deployment Pipeline, and Disciplinary Actions widgets currently render identically (shared component) across HR Manager, HR Assistant, *and Records Officer* dashboards — Records Officer shouldn't see these at all; this is the likely root cause of most HR-area dashboard clutter findings.
- Test/seed data ("Persist Test Guard") is currently visible in the Personnel Directory — strip before UAT.
- Identity Cards page currently renders two near-duplicate hero banners with repeated stats/wording.

---

## 6. Contract Chain (Client Contracts) — FINAL

```
Marketing wins the client
   → Marketing requests a Site Survey from Operations
       (survey = pure risk assessment: what does the site need — nothing beyond that)
   → Marketing drafts the contract from template + survey data
   → General Manager reviews and approves
       (SOLE approver, ALL contracts, no threshold — no Finance step in this chain)
   → Contract signed (client copy + org copy)
   → Records Officer holds/archives (confidential — not broadly visible)
```

- **Operations Manager has zero approve/reject/void authority on contracts, period.**
- **Finance is not part of the standard chain at all** — except for the GM-absence fallback below.
- **General Manager absence — Finance Manager stand-in:** this goes through the **acting-privilege system** (§11), not a separate standing permission. When GM is on leave: HR Manager requests IT Officer to grant Finance Manager acting-GM privileges → IT executes, audit-logged. This requires **one narrow, explicit exception** to the acting-privilege system's "no executive targets" rule: General Manager specifically, and only to Finance Manager specifically. Do not open executive-acting generally to any role.

### Contract Inquiry (confidentiality mechanism)
Since contracts are confidential and not broadly visible, anyone who needs contract information without full contract access submits an inquiry:

`Requester asks (Confirmation | Full Copy) → Records Officer inbox → responds with a downloadable PDF → requester's outbox shows the response`

**Confirmed requester list (final):** General Manager, Operations Manager, Finance Manager, HR Manager. (Internal Auditor was proposed but explicitly left out for now.)

This maps directly onto the existing Contract Inquiry feature — likely just needs the requester role list confirmed/updated, not new construction.

### Staff Contract Chain (HR — unchanged)
`HR Assistant drafts → HR Manager issues → Active` (HR Manager can void with reason; Records Officer archives).

### Known Gap
- Current Contracts endpoint approve action is `BD → Finance → GM` gated at ≥100M UGX — needs to become GM-sole-approver, no threshold, Finance and BD removed from the approval action entirely (Marketing/BD still *drafts*, just doesn't *approve*).
- Confirm the acting-privilege exception (GM→Finance Manager only) is scoped narrowly and doesn't accidentally open executive-acting more broadly.

---

## 7. Marketing / Sales Department

- Lead source is a **mandatory field at creation**: website, X, LinkedIn, TikTok, referral, etc.
- **Only Website gets automatic lead capture** (contact form integration). All other channels are manually logged by staff via the required source dropdown.
- **Pipeline ownership model:** each lead has one owner (a Supervisor, or BDM for leads they personally work). Only the owner advances that lead's stage. BDM's oversight is exercised by **reassigning ownership**, not editing another person's lead directly. Reassignment is **BDM-only** — a Supervisor cannot reassign their own lead to another Supervisor.
- **Campaign budget approval:** Accountant screens/prepares, Finance Manager gives final approval. **No threshold** (matches Contracts/Requisitions/Expenses).
- **Complaint intake:** clients submit via a website form → Marketing notified → Marketing can escalate/refer to Investigations Officer for conduct/integrity issues.
- **Client site onboarding:** guard staffing numbers (day/night guards, armed quota) come from an Operations site survey — not typed directly by Marketing. Marketing's onboarding form stays administrative-only: client org, site name, address, zone/region, contact.

### Wanted UI improvements (flagged, not yet scoped in detail)
- Sales Pipeline Stage Funnel: fix truncated company/owner names on cards, make cards open a full detail view (contact history, notes, activity log), add drag-and-drop stage advancement (owner-only), show days-in-stage, connect follow-up scheduling to the Follow-up Radar.
- BDM dashboard currently crams nine sections into one scroll (pipeline, lead analytics, follow-ups, campaigns, funnel charts, collections, contracts, budget approvals, complaints) — needs restructuring, likely distributing content between the BDM dashboard and the separate Marketing & Sales / Client & Sites CRM pages (both pages are legitimate, not redundant).

---

## 8. Finance Department

- **Invoicing:** Accountant creates → Finance Manager approves before it's sent to client → automated SMS + email payment reminders tied to due date (e.g. 3 days before, on due date, 7/14/30 days overdue). Marketing is notified when an invoice goes overdue (relationship follow-up), but Finance owns the invoice/payment data itself.
- **Cashier transactions:** Loan and Salary Advance stay as **separate** types (not merged). Cashier initiates disbursement request → Finance Manager approves → Cashier disburses and logs. Every disbursement requires Finance Manager approval, no threshold.
- **Accountant vs. Assistant Accountant split:** Assistant Accountant = transaction-level data entry/recording; Accountant = reconciliation, reporting, screening/preparing items before Finance Manager approval.
- **Internal Auditor:** reviews financial records a few times a week — periodic, not continuous.
- **Finance Manager:** reviews every invoice/expense personally, no threshold. GM's check only applies via the no-threshold rules in §2.
- **Finance Manager as GM stand-in** on contracts: see §6/§11.

---

## 9. Administration Department

- Administrative Officer's scope: inventory/administrative matters. **No rights to create a client site.**
- **Requisitions:** any department (including Administration itself) submits a requisition → goes directly to **General Manager** for approval, no threshold, no Administrative Officer approval gate in between. GM needs a clear cross-department requisitions inbox.
- Data-sharing: HR pulls stock-inventory data from Administrative Officer, and loans/rent/food data from Cashier (Finance).

---

## 10. Investigations Department

- Two Investigations Officers are **peers** — either can handle any case, no senior/lead distinction.
- Collaborates with Operations on incidents, but this should surface in Operations' workspace as a **single "Incidents" tab/section**, not a full nested Investigations department view inside the Ops workspace.
- Receives escalated complaints from Marketing for conduct/integrity issues (see §7).

---

## 11. IT Department & Acting Privileges

**IT Officer scope (unchanged):** user creation, roles/privileges, system-wide oversight.

**Acting-privilege mechanism — final design:**
1. **HR Manager initiates** the request — who needs coverage, for which role, and why.
2. **IT Officer executes** the grant — does not decide independently, acts on HR's instruction.
3. **Full audit trail** on both sides: that HR Manager requested it, and that IT Officer granted it on that request.
4. **Additive, not a swap:** the covering person keeps their own role's full capabilities *and* gains the covered role's capabilities simultaneously — they don't lose their own job while covering someone else's.
5. **Attribution stays honest:** every decision made while acting is recorded and displayed as made by *that person, acting in that role* — e.g. "Approved by [name], Acting General Manager" — visible in the audit log **and** wherever that decision is shown elsewhere (contract record, approval history), not buried in a log only IT can see.
6. **Executive-target exception:** the general rule excludes executive roles as acting-privilege targets. **One narrow exception:** General Manager may be covered, and only by Finance Manager specifically (see §6) — not opened to any executive/any role generally.

### Known Gap
- Confirm the current acting-privilege implementation enforces additive (not swap) capability and produces the "Acting [Role]" attribution on the decisions themselves, not just in an internal audit table.

---

## 12. UI/UX Fixes Required (cross-department)

- **Root cause identified:** several HR-area dashboards (HR Manager, HR Assistant, Records Officer) render from one shared dashboard template rather than role-specific widgets — this is why Records Officer sees Disciplinary Actions/Guard Lifecycle/Deployment Pipeline widgets that aren't in her scope. Fixing the template to be role-aware likely resolves multiple findings at once.
- **GM dashboard:** repetition in analytics (guard counts, revenue shown multiple times), executive attention items buried below analytics rather than surfaced first. Proposed principle: GM's home dashboard shows only aggregates/exceptions needed for oversight; operational detail stays within each department's own page. No department needs to hand GM full visibility — Administration surfaces logistics info, Investigations surfaces incident info, and so on, at summary level only.
- **General wording issue:** some role dashboards have repetitive, oddly-phrased agent-generated section labels (e.g. "operations department decided by the operations manager") — needs a copy pass across all role dashboards once the structural fixes above land.
- **Incidents:** own tab/section within Operations workspace, not a full nested Investigations tab (§10).

---

## 13. Explicitly Deferred / Future Work — do not build now

- Rank-as-login-role (Site In-Charge, Inspector, Guard getting their own system accounts) — revisit after biodata/enrollment is stable in production use.
- Contract e-stamp / enhanced signature validity verification — review what the current stylus/touch signature capture actually does first, decide after.
- Document upload usage review + legacy paper-record migration (old contracts, etc.) — get the working system live first; migration will mix document upload and direct data entry, to be scoped later.
- ISCMS ↔ QuickBooks integration/sync for Finance — not addressed, noted only.

---

## 14. Priority Order for Remaining Implementation Work

Given Monday's UAT, suggested build order:

1. **Contract chain correction** (§6) — remove BD/Finance from the approve action, make GM sole no-threshold approver. High-impact, currently wrong in a way testers will hit immediately.
2. **Role list cleanup** (§1) — remove "Guard Officer," confirm Fleet's independence is reflected in org/nav config everywhere.
3. **No-threshold rollout** (§2) — Expenses and Campaign Budgets, alongside Contracts/Requisitions.
4. **Acting-privilege refinements** (§11) — HR-initiated request flow, additive capability, attribution display, narrow GM/Finance Manager exception.
5. **Transport decline-reason UI** (§4) — dropdown + custom reason.
6. **HR dashboard role-specific widgets** (§5/§12) — likely the single highest-leverage UI fix given how many findings trace back to it.
7. Everything else in §5, §7, §12 as time allows before Monday; §13 stays parked.

---

*Compiled from the full working session reconciling ISCMS's intended design against its current build. Where this document conflicts with existing project markdown files, this document is authoritative.*
