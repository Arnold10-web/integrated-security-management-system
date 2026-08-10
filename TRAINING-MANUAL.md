# ISCMS — Integrated Security Company Management System
## User Training Manual

> A practical, role-by-role guide to how ISCMS works, what each job role can do
> in the system, and the key workflows that keep the company running.
> Written for system users at every level — from guards to the General Manager.

---

## 1. Welcome to ISCMS

**ISCMS (Integrated Security Company Management System)** is the company's single
operations platform. It brings the whole business — people, sites, vehicles,
weapons, dogs, clients, money, and paperwork — into one secure system.

Everything in ISCMS is **role-based**: the screens you see and the buttons you can
press depend entirely on **who you are** (your role) in the company. No role can
do another role's job in the system. This is deliberate — it protects the company
and it protects you, because the system always knows who did what and when.

### What the system manages (at a glance)

| Area | What it covers |
|---|---|
| **Operations** | Guard lifecycle, rosters, deployments, armoury, K9 unit, patrol inspections, sites |
| **Human Resources** | Guard records, recruitment, training, leave, performance reviews, disciplinary actions |
| **Marketing & Sales** | Leads, client sites, contracts, campaigns, complaints, collections follow-up |
| **Finance** | Invoices, collections, cashier disbursements, expenses, reminders |
| **Fleet** | Vehicles, drivers, fuel, trips, maintenance |
| **Investigations** | Incident reporting, investigations, escalation |
| **Administration** | General office requisitions, GM approval inbox |
| **IT & Systems** | Users, roles, acting privileges, workflows, documents |
| **Reports & Analytics** | Company-wide KPIs (read-only) |

---

## 2. How the system works

ISCMS is a **web application**. You open it in your browser (Chrome or Edge
recommended). The login page accepts your **company email** and **password**.

### Two layers of security (this is important)

Every action in ISCMS is checked **twice**:

1. **The menu layer (client):** you only see the modules your role is allowed to
   open. A Cashier will never even see the HR menu.
2. **The server layer (API):** even if someone tried to type a web address
   directly, the server independently refuses any action your role is not
   allowed to perform. This means security does **not** depend on people simply
   "not clicking the wrong thing."

Result: a user **cannot** approve, edit, or even open something their role is
not entitled to — regardless of how they try.

### User accounts, passwords & "acting" roles

- Log in with **email + password**. The IT Officer creates and manages accounts.
- A user's **role** (e.g. "Regional Manager") is fixed to the account.
- **Acting privileges:** the IT Officer can temporarily grant a user a second
  role (e.g. an HR Assistant "acting as" HR Manager) for a **set time limit**.
  The system shows a banner while acting is active, and the temporary powers
  expire automatically. You never share passwords to cover for someone — use
  acting privileges instead.

### In-app notifications (the bell)

The **bell icon** in the top bar shows your notifications. Unread items have a
red counter. Notifications are **stored permanently** in the system — they
survive a browser refresh or a new device. Click an item to mark it read, use
the check-mark to mark all read. Notifications tell you when something needs
your attention (e.g. an approval is waiting, a guard passed out of training).

---

## 3. The modules at a glance

| Module | Who typically uses it | Purpose |
|---|---|---|
| **Executive Directorate** | GM, Director | Company-wide KPI dashboard |
| **Operations** | OM, RM, Armorer, K9, Training Officer, Fleet | Rosters, pipeline, armoury, K9, patrols |
| **Investigations** | Investigations Officer, OM, RM | Incident register & resolution |
| **Human Resources** | HR Manager, HR Assistant, Records Officer | Guard records, leave, disciplinary |
| **Client & Sites CRM** | BDM, Sales Supervisor, OM | Client sites |
| **Marketing & Sales** | BDM, Sales Supervisor | Leads, campaigns, collections |
| **Finance & Cashier** | FM, Accountant, Cashier, etc. | Invoices, cashier, expenses |
| **Fleet** | Fleet Manager, OM, RM | Vehicles & drivers |
| **Administration** | Administrative Officer | Requisitions |
| **IT** | IT Officer | Users, roles, acting, workflows |
| **Guard Portal** | Guard Officer, Guards | Guard self-service |
| **Recruitment** | HR, OM | Job postings & candidates |
| **Performance Reviews** | HR, OM, RM | Guard appraisals |
| **Documents** | HR, IT | Central document store |
| **Workflow Engine** | IT | Business-process automation |
| **Reports & Analytics** | Directorate, OM | Charts & KPIs (read-only) |

---

## 4. Roles and how they work

Below is every role, what it can do, and the golden rules it must follow.

### 4.1 General Manager (GM)

**Purpose:** company-wide leadership and **final approval** authority.

- Sees the **Executive Directorate** dashboard and **Reports & Analytics**.
- Appears in modules **only where an approval is waiting for them**:
  - **Contracts** — final approval (≥ 100M UGX step) and **voiding** contracts.
  - **Expenses** — approval above 10M UGX.
  - **Campaign budgets** — approval above 10M UGX.
  - **Leave requests** — final step.
  - **Requisitions** — every requisition needs GM approval/rejection.
- The GM has **no general browsing rights** in Finance, HR, Operations, etc. The
  system brings the approval *to* you — you do not go hunting for it.

**Golden rules:**
- Your power is **approval only**. You never create day-to-day records.
- Only you can **void** a contract — always with a **reason** (the system demands it).
- Only you (or the Director) can open Reports for cross-department oversight.

### 4.2 Director

**Purpose:** pure oversight. The "eyes of the board."

- Full **view** of the Directorate dashboard and Reports & Analytics.
- **No approval power anywhere.** No editing of business records.

**Golden rule:** Director is **read-only everywhere**. If you need a record
changed, tell the owning department — never change it yourself.

### 4.3 Operations Manager (OM)

**Purpose:** head of the field — runs the guard pipeline, deployments, and
incident response. Also the company's **analytics-minded overseer**.

- **Analytics:** OM can open **Reports & Analytics** and view KPIs for every
  region — an informed, cross-region view (this is their "oversight" role).
- **Read-only** (view) on: Armoury, K9, Fleet, Training cohorts, Sites, Leads,
  HR records, Marketing, and Guard records (they cannot create them).
- **Full control** (hands-on) on:
  - **Rosters & patrol inspections**
  - **Incidents** — can log and handle incidents
  - **Deployment orders** — *Step 1*: OM issues the order stating **how many**
    guards a site needs
  - **Recruitment** — OM is personally involved in interviewing/selecting recruits
  - **Guard appraisals (performance reviews)**
- **Contract rule (important):** the OM does **not** approve or void contracts.
  Before a contract goes to the GM, the OM contributes **site survey** information
  (site feasibility / staffing assessment) only.

**Key workflow — the guard pipeline (Step 1):**
OM identifies a headcount need, interviews recruits, then the lifecycle begins
(see §5.1). OM personally sends guards to the Training School.

### 4.4 Regional Manager (RM)

**Purpose:** runs a region. Hands-on control of everything within their region.

- **Full control** on regional rosters, deployments, K9 and patrol work **within
  their own region only**. The system blocks an RM from touching another region.
- **Deployment orders — Step 2:** the OM issues an order with a headcount; the RM
  of the matching region **selects which specific guards** fill it.
- **First approval** on **leave requests** and **disciplinary actions** (the chain
  always starts with the RM).
- **No** access to the Sites module.

**Golden rule:** you approve and deploy **only within your region**. The system
enforces this — don't try to work around it.

### 4.5 Inspector (rank, not a job title)

A promoted guard who supervises zones and personally logs **patrol inspections**.
Sits between RM and Site In-Charge.

### 4.6 Site In-Charge

One per client site. Oversees the guards stationed at that site.

### 4.7 Guard

A deployed security officer with an assigned site.

- Uses the **Guard Portal** to view own records, submit **leave requests**
  (chain: RM → Ops → HR → GM), and manage personal details.

### 4.8 Armorer

**Purpose:** owns the armoury.

- **Full control** of armoury items, issue/return logging, weapon state.
- Can view guard records (to issue weapons to the right person).
- Every weapon issue/return is logged with dates and who handled it.

### 4.9 K9 Supervisor & K9 Handler

**Purpose:** the canine unit.

- **K9 Supervisor:** full control of dogs, health inspections, deployments, and
  pairing handlers.
- **K9 Handler:** manages their own dog records and deployments.
- OM can **view** (not edit) K9 records.

### 4.10 Fleet Manager

**Purpose:** owns vehicles, drivers, fuel, trips and maintenance.

- **Full control** over fleet records (create vehicles/drivers, licence
  approvals, fuel logs, maintenance).
- OM/RM have view-only access.

### 4.11 Training Officer

**Purpose:** runs the Academy.

- **Full control** of training cohorts and recruit trainees; marks recruits
  **passed out**.
- **No** rights over deployed guards or HR records.

### 4.12 HR Manager

**Purpose:** owns people records and hiring.

- **Full control** of guard records (enrollment is HR-only), recruitment,
  performance reviews, leave, disciplinary actions, documents.
- **Only** the HR Manager can record a final **termination**.
- Recruits a guard after the OM's interview selection (§5.1 step 2).

### 4.13 HR Assistant / Records Officer

- **HR Assistant:** helps run HR (enrollment, leave, recruitment).
- **Records Officer:** manages **ID-card data** only — can update ID card fields,
  photos and signatures. Cannot change a guard's name, bank details, etc.

### 4.14 Business Development Manager (BDM)

**Purpose:** wins clients.

- **Full control** of **leads** (create, update, move through the 5-stage
  pipeline) and **client sites**.
- **Lead ownership:** only the **owner** of a lead can move its stage. If a lead
  stalls, only the BDM can **reassign** it (to a Supervisor or take it over
  themselves). No other role edits a lead they don't own.
- Creates **Draft client contracts** (step 1 of the contract chain).
- Can send **payment reminders** on invoices (collections follow-up) and view
  the read-only collections list.
- Lead **source is mandatory** (LinkedIn, X/TikTok, Expo, Direct Mail, Website…)
  — this drives marketing analytics.

### 4.15 Sales & Marketing Supervisor

**Purpose:** works leads and campaigns under the BDM.

- **Full control** of leads they own, campaigns (budget requests), complaints.
- Can trigger **payment reminders** and view collections.
- Same ownership rule as the BDM: only the lead owner moves the stage.

### 4.16 Finance Manager (FM)

**Purpose:** controls money. Holds the **approval** powers for finance.

- **Full control** of invoices and expenses (create/edit), plus the
  **approve** actions that no one else can do:
  - **Invoice approval** — invoices are created **Draft**; only the FM approves
    and "sends" them (Draft → Pending). No invoice is billed until FM approves.
  - **Cashier disbursement** — a Cashier records a disbursement as
    **"Pending Approval"**; only the FM **approves (disburses)** or **rejects** it.
- View on marketing/campaigns (budget visibility).

**Golden rules:**
- You are the **only** person who can approve an invoice or a cash payout.
- The Accountant can edit the ledger but **cannot approve** — never "borrow"
  their account to do your approvals.

### 4.17 Accountant

- **Full control** of the finance ledger (invoices, expenses) — creates and edits
  records — but **cannot approve** invoices or cashier transactions.

### 4.18 Assistant Accountant

- **View only** on finance records. Supports the Accountant without editing rights.

### 4.19 Cashier

- **Full control** of the **finance** module to record cash transactions, but:
  - A disbursement entered by a Cashier sits in **"Pending Approval"** until the
    FM approves it.
  - The Cashier **cannot** approve or reject any transaction.

### 4.20 Internal Auditor

- **View only** across finance and audit logs. The company's check — can inspect
  everything but changes nothing.

### 4.21 Investigations Officer

- **Full control** of incidents: logs incidents, opens **investigations**
  (status → Under Investigation), escalates, resolves.
- **Only** the Investigations Officer can open an investigation.

### 4.22 Administrative Officer

- **Full control** of office **requisitions**. Every requisition is then routed
  to the **GM for approval/rejection** (the GM inbox).

### 4.23 Guard Officer

- Runs the **Guard Portal**: guard self-service, check-in/check-out oversight,
  incident reporting — scoped to their own site only.

### 4.24 IT Officer

**Purpose:** runs the system.

- **Full control** of IT: users, roles/privileges, acting privileges, workflow
  engine, documents.
- **Only** the IT Officer can create user accounts and grant **acting privileges**
  (time-limited role delegation). IT cannot grant itself acting powers or an
  executive role.
- Can **view** all modules for support, but does not do departmental work.

---

## 5. The core workflows (end to end)

### 5.1 The guard lifecycle — "recruit to deployed" (6 steps)

This is the single, no-shortcuts path every guard follows:

| Step | Who acts | System stage | What happens |
|---|---|---|---|
| **1** | Operations Manager | *Recruit Intake* (pre-record) | OM identifies the headcount need, interviews and selects recruits |
| **2** | HR Manager / Assistant | `ENROLLED` | HR captures biodata, NIN, bank & ID fields; the guard record is created |
| **3** | HR | `HANDED_TO_OPERATIONS` | HR hands the recruit to Operations |
| **4** | Operations Manager | `IN_TRAINING` | OM sends the recruit to the Training School |
| **5** | Training Officer | `PASSED_OUT` | Training Officer trains and marks pass-out — **OM is notified** |
| **6** | Regional Manager | `DEPLOYED` | RM deploys the guard to a specific site |

You can watch all six steps as cards on the **Guard Deployment Pipeline** screen.
Desertion is recorded by Operations at any stage; final termination is always an
HR Manager action.

### 5.2 Deployment orders (two steps, two owners)

1. **Operations Manager** issues the order: which **site**, how **many** guards,
   shift type, start/end dates. Status = **Open**.
2. **Regional Manager** of the matching region fills it: selects **which specific
   guards** (capped at the requested headcount). Status becomes **Assigned**, then
   **Filled** when the count is met — the chosen guards are automatically marked
   **Deployed**.

The order card shows progress: *Step 1 Ops issues · Step 2 RM fills*.

### 5.3 Client contract chain (BD → Finance → GM)

1. **BDM** creates the contract → **Draft**.
2. Finance reviews → **Pending GM Approval**.
3. **GM** gives final approval (≥ 100M UGX step). **Only the GM voids** a contract,
   and voiding always requires a written reason.
4. The **OM contributes a site survey** (feasibility/staffing) to support the
   contract — but has **no approval or void** rights.

### 5.4 Invoicing & collections (Finance + Marketing)

1. **Accountant/FM** creates the invoice → status **Draft** (nothing is billed yet).
2. **FM approves** the invoice → it becomes **Pending** (sent to client).
3. **Marketing (BDM/Supervisor)** follows up: sends **payment reminders** (SMS via
   Africa's Talking + email via SendGrid) on sent invoices; the reminder is
   **logged permanently** in the system.
4. **Marketing** tracks overdue money in the **Collections** view (read-only).
5. When the client pays, the **Cashier** records it.

### 5.5 Cashier disbursements (Cashier records, FM approves)

1. **Cashier** records the payment/disbursement → **"Pending Approval"**.
2. **Finance Manager** approves (→ **Disbursed**) or rejects (→ **Rejected**).
   The approver's name and timestamp are recorded.

### 5.6 Leave requests (4-step chain)

Guard applies → **Regional Manager** approves first → **Operations** → **HR
review** → **GM** final approval.

### 5.7 Incidents & investigations

Anyone with rights logs an **incident** (Open) → **Investigations Officer** opens
an investigation (Under Investigation) → escalated if needed → **resolved/closed**
with the outcome recorded.

### 5.8 Requisitions (Admin creates, GM approves)

**Administrative Officer** raises a requisition → it lands in the **GM inbox**
highlighted → GM approves or rejects with a reason. No threshold: every
requisition goes to the GM.

### 5.9 Website leads & complaints

- The company **website** posts enquiries straight into ISCMS as leads with
  source = **Website**.
- Public complaints arrive via a **public intake endpoint** (rate-limited and
  sanitized) and are routed to Marketing for handling.

---

## 6. Approval powers — who can say yes (summary)

| Action | Who can do it | Notes |
|---|---|---|
| Approve & send an invoice | **Finance Manager only** | Invoices start as Draft |
| Approve/reject cashier disbursement | **Finance Manager only** | Cashier creates "Pending Approval" |
| Final contract approval / void | **General Manager only** | Void always needs a reason |
| Expense / campaign budget ≥ 10M | **General Manager** | |
| Reassign a lead | **BDM only** | Owner-only stage moves |
| Approve a requisition | **General Manager** | Every requisition |
| First leave approval | **Regional Manager** | Chain RM → Ops → HR → GM |
| Open an investigation | **Investigations Officer only** | |
| Final termination of a guard | **HR Manager only** | |
| Move a guard's lifecycle stage | HR / OM / RM / Training Officer | Per the 6-step table |
| Create a user / grant acting | **IT Officer only** | Acting is time-limited |

**Remember:** if a role is not on this list for an action, that role **cannot**
do it — the server enforces it, not just the menu.

---

## 7. Good practices for every user

- **Never share your password.** Use the IT Officer's *acting privileges* if you
  need temporary extra powers.
- **Read before you click.** Approvals, voiding and terminations ask for reasons
  — and are recorded with your name. That is a feature, not a nuisance.
- **Keep dates and notes accurate.** The company runs reports off this data.
- **Notifications are evidence.** A reminder, an approval, a hand-over — all are
  stored permanently. If it matters, it is in the system.
- **Stay in your region/scope.** Regional Managers work their own region; the
  system blocks the rest.
- **Use the Reports module for oversight.** It is read-only and safe to browse —
  use it before asking others for numbers.

---

## 8. Getting help

- **Account / password / acting privileges:** contact the **IT Officer**.
- **Data mistakes (HR, Operations, Finance):** tell the owning department —
  only they can edit their records.
- **Process questions:** your department head, or this manual.

---

## Appendix A — Demo login accounts

The demo/training environment comes pre-seeded with one account per role. All
accounts use the same password: **`password123`**.

To try the system as a specific role, log in with that role's email.

| Role | Demo email |
|---|---|
| General Manager | `sarah.akello@iscms.ug` |
| Director | `daniel.mugisha@iscms.ug` |
| HR Manager | `grace.nakato@iscms.ug` |
| HR Assistant | `rebecca.nansubuga@iscms.ug` |
| Records Officer | `agnes.nantege@iscms.ug` |
| Business Development Manager | `ivan.ssebana@iscms.ug` |
| Sales & Marketing Supervisor (Kampala) | `patricia.akello@iscms.ug` |
| Sales & Marketing Supervisor (Mbarara) | `kenneth.tumusiime@iscms.ug` |
| Operations Manager | `emma.muwonge@iscms.ug` |
| Regional Manager (Mbarara) | `peter.okello@iscms.ug` |
| Regional Manager (Gulu) | `betty.auma@iscms.ug` |
| Fleet Manager | `francis.ogwang@iscms.ug` |
| Training Officer | `james.wamala@iscms.ug` |
| Investigations Officer | `henry.kiyingi@iscms.ug` |
| Guard Officer | `tom.ssemakula@iscms.ug` |
| Armorer | `joseph.ochieng@iscms.ug` |
| K9 Supervisor | `diana.alowo@iscms.ug` |
| K9 Handler | `peter.okot@iscms.ug` |
| Finance Manager | `david.ssenyonga@iscms.ug` |
| Accountant | `martha.kemigisha@iscms.ug` |
| Assistant Accountant | `sandra.namutebi@iscms.ug` |
| Internal Auditor | `agnes.tumusiime@iscms.ug` |
| Cashier | `winnie.nabukenya@iscms.ug` |
| Administrative Officer | `alice.nabatanzi@iscms.ug` |
| IT Officer | `joseph.kizza@iscms.ug` |

### A suggested walkthrough route (trainers)

For a guided tour of the role interactions, log in in this order. The route
follows a guard from recruitment to deployment (the 6-step lifecycle), then
walks the money side.

1. **Operations Manager** (`emma.muwonge@iscms.ug`) — open Operations and study
   the **Guard Deployment Pipeline** (the 6-step path). This is the map of
   everything that follows; no order is issued yet because there are no
   deployed guards to fill it.
2. **HR Manager** (`grace.nakato@iscms.ug`) — **enroll** a new guard (stage
   `ENROLLED`) and **hand them over to Operations** (`HANDED_TO_OPERATIONS`).
   Open the **notification bell**.
3. **Operations Manager** — **send the guard to the Training School**
   (`IN_TRAINING`), the OM's step in the pipeline.
4. **Training Officer** (`james.wamala@iscms.ug`) — mark the recruit **passed
   out** (`PASSED_OUT`); watch the OM receive an in-app notification.
5. **Operations Manager** — now that guards are available, **issue a deployment
   order** (Step 1 of the two-step flow): pick a site and a headcount.
6. **Regional Manager** (`betty.auma@iscms.ug`) — **fill the order** (Step 2):
   assign the passed-out guards from the region pool → they become `DEPLOYED`.
7. **Accountant** (`martha.kemigisha@iscms.ug`) — create an invoice (**Draft**),
   then show that the FM is the only one who can **approve & send** it.
8. **Finance Manager** (`david.ssenyonga@iscms.ug`) — approve the invoice, and
   approve a Cashier's **pending** disbursement.
9. **Business Development Manager** (`ivan.ssebana@iscms.ug`) — open Marketing,
   view the **Collections** tab, and trigger a **payment reminder**.
10. **General Manager** (`sarah.akello@iscms.ug`) — open Reports & Analytics and
   the GM approvals (requisitions) inbox.

> **Tip:** after `npm run seed` / a fresh database, re-run the seed if accounts
> are missing. Reset each account's password from the IT module if needed.
