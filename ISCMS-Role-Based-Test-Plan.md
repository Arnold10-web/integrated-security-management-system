# ISCMS Role-Based Test Plan
**Purpose:** Verify that each role's actual system access matches the finalized RBAC decisions, and flag any UI/UX friction along the way. Designed to be run by a browsing agent (Claude for Chrome, Gemini in Chrome, browser-use, etc.) or a human tester, one role at a time.

**How to use this doc:**
1. Provide the agent with test credentials for the role being tested.
2. Give it one "Role Block" at a time (don't run all roles in one session — keep scope tight so failures are traceable).
3. For each task: record **Actual result**, mark **Pass/Fail**, and log any UI/UX issue using the audit lens from the earlier prompt (clarity, consistency, feedback/state, error prevention, navigation, role-fit).
4. Anything marked Fail or flagged goes into a findings log (template at the bottom).

---

## Setup checklist (before testing starts)
- [ ] One test account per role below, with realistic seed data (existing contracts, leads, guards, requisitions) so screens aren't empty
- [ ] Confirm test environment is isolated from production data
- [ ] Agent/tester has this doc plus login credentials per role
- [ ] Decide whether to test one role per session or chain roles (e.g. OM creates deployment order → RM fulfills it) in a single session where a flow spans roles

---

## Priority flows (flagged UI/UX issues — test these first)

### Flow 1: Deployment Order (Operations Manager → Regional Manager)
| Step | Role | Task | Expected | 
|---|---|---|---|
| 1 | Operations Manager | Create a deployment order specifying guard count needed for a site | Order is created and routed to the correct Regional Manager; OM should NOT be able to pick specific guards |
| 2 | Regional Manager | View incoming deployment order | Order appears in RM's queue with clear status (pending/new) |
| 3 | Regional Manager | Select specific guards to fulfill the order | RM can assign named guards; order status updates |
| 4 | Operations Manager | Check status of the order they created | OM can see it was fulfilled, and by whom/which guards |

**UX focus:** this was explicitly flagged as needing improvement — pay attention to whether the handoff between OM and RM is visible/trackable, whether either role gets confirmation/notification, and whether it's obvious what "done" looks like.

### Flow 2: Guard Recruitment → Training → Deployment Lifecycle
| Step | Role | Task | Expected |
|---|---|---|---|
| 1 | Operations Manager | Log a headcount need / participate in candidate selection | OM has a way to record interview/selection decision |
| 2 | HR Assistant | Capture biodata, enroll candidate | Guard record created, stage = ENROLLED |
| 3 | HR Assistant | Hand guard to Operations | Stage updates to HANDED_TO_OPERATIONS |
| 4 | Operations Manager | Send guard to Training School | Stage updates to IN_TRAINING; Training Officer is notified (real in-app notification, not just a status change) |
| 5 | Training Officer | Mark guard as passed out | Stage updates to PASSED_OUT; Operations Manager is notified |
| 6 | Operations Manager | Decide region for deployment | Region assignment recorded |
| 7 | Regional Manager | Deploy guard to a specific site | Stage updates to DEPLOYED; guard record shows assigned site |

**UX focus:** flagged for improvement — check whether the current stage is visible at a glance to each role (not just in a raw status field), whether notifications actually fire, and whether any role can skip a stage they shouldn't be able to (e.g. HR sending straight to Training School bypassing OM).

### Flow 3: Campaign & Sales Pipeline
| Step | Role | Task | Expected |
|---|---|---|---|
| 1 | Sales Supervisor | Manually log a lead, selecting a source (website/X/LinkedIn/TikTok/referral) | Lead created with mandatory source field; supervisor is the owner |
| 2 | Sales Supervisor | Advance the lead through pipeline stages | Only the owner can advance stage |
| 3 | BDM | Attempt to directly edit a stage on a lead they don't own | Should be blocked/not possible — BDM's only lever is reassignment |
| 4 | BDM | Reassign a lead from one Supervisor to another | Reassignment succeeds; new owner can now advance it |
| 5 | Sales Supervisor | Attempt to reassign their own lead to another Supervisor | Should be blocked — reassignment is BDM-only |
| 6 | Accountant | Prepare a campaign budget request | Request created, routed to Finance Manager |
| 7 | Finance Manager | Approve campaign budget | Approval finalizes the budget |

**UX focus:** flagged for a "much better" UI/UX — check whether pipeline stage and lead ownership are visually obvious, whether the source-channel breakdown is easy to filter/view in analytics, and whether the reassignment action is discoverable for BDM but correctly hidden/disabled for Supervisors.

---

## Role-by-role RBAC spot checks

For each row: attempt the task and confirm the system enforces the expected boundary (both that permitted actions work AND that forbidden actions are actually blocked, not just hidden in the UI).

| Role | Task to attempt | Expected result |
|---|---|---|
| General Manager | View Directorate + Reports & Analytics | Full access |
| General Manager | Try to *view* a pending contract (not approve) | Should only get Approve action, not a general browse/view of Contracts module |
| General Manager | Approve a contract ≥100M UGX | Allowed; try below threshold too — confirm threshold logic |
| General Manager | Access any other module (Finance, HR, Operations, etc.) directly | Should be blocked — GM has no direct module access outside Directorate/Reports/approvals |
| General Manager | Approve an Administration requisition | Allowed (any department's requisition, any amount) |
| Director | Try to approve anything | Should be impossible everywhere — pure oversight, zero approval power |
| Director | View Directorate module | Read-only access confirmed |
| Operations Manager | Try to add a weapon to the Armoury | Should be blocked |
| Operations Manager | Try to create a Fleet/vehicle record | Should be blocked |
| Operations Manager | Try to perform HR CRUD (e.g. edit a guard's HR record directly) | Should be blocked |
| Operations Manager | Approve/Reject/Void a contract at the Operations validation step | Allowed |
| Regional Manager | Delegate shift scheduling to an Inspector | Allowed |
| Regional Manager | Delegate a leave-request approval to an Inspector | Should be blocked — RM must handle first approval personally |
| Inspector | Submit a patrol inspection record directly | Allowed |
| Inspector | Approve a leave request or disciplinary action | Should be blocked |
| Site In-Charge | View/manage attendance and incidents for their own site | Allowed |
| Site In-Charge | View or act on another site's data | Should be blocked |
| IT Officer | Grant a temporary "acting" privilege (e.g. HR Assistant acting as HR Manager) | Allowed, and should be clearly time-bound/revocable |
| HR Assistant | Prepare/document a disciplinary case | Allowed |
| HR Assistant | Finalize a disciplinary case | Should be blocked — HR Manager only |
| HR Manager | Finalize disciplinary case, sign off performance review, forward leave to GM | Allowed |
| Records Officer | Issue ID card (photo + signature capture) | Allowed |
| Administrative Officer | Try to create a client site | Should be blocked |
| Administrative Officer | Submit their own requisition | Allowed, routes to GM like any other department |
| Accountant | Screen/prepare an invoice or expense before approval | Allowed |
| Accountant | Approve their own prepared invoice/expense | Should be blocked — Finance Manager approves |
| Assistant Accountant | Enter transaction-level data | Allowed |
| Assistant Accountant | Reconcile or approve | Should be blocked — that's Accountant/Finance Manager scope |
| Cashier | Initiate a loan or salary advance disbursement | Allowed, routes to Finance Manager for approval |
| Cashier | Disburse without Finance Manager approval | Should be blocked |
| Finance Manager | Review/approve every invoice and expense regardless of amount | Allowed |
| Internal Auditor | Access financial records for periodic review | Allowed (read access) |
| Investigations Officer (either of the two) | Pick up and handle any case | Allowed — confirm no senior/lead gating exists in the UI |
| Marketing | Receive and view an overdue-invoice notification | Notification appears; Marketing cannot edit the invoice itself |
| Marketing | Receive a website-submitted client complaint and escalate to Investigations | Allowed |

---

## Findings log template
Use this per issue found (whether a hard RBAC failure or a UI/UX friction point):

| Field | Detail |
|---|---|
| Role/flow | |
| Task | |
| Expected | |
| Actual | |
| Type | RBAC failure / UI-UX friction / Both |
| Severity | Blocker / Significant / Minor / Polish |
| Screenshot or step-by-step description | |
| Suggested fix | |

---

## Notes on running this with a browsing agent
- Feed one Role Block (or one Priority Flow) per task instruction — don't ask the agent to "test everything," it'll skim.
- Explicitly tell the agent to attempt the *forbidden* actions too, not just the allowed ones — RBAC bugs usually show up as "the button that shouldn't exist is clickable," which an agent won't check unless told to.
- Ask it to note not just pass/fail but *how* a blocked action fails — a clean "you don't have permission" message is very different from a broken page or a silent no-op, and that distinction matters for UX quality even when the security boundary technically holds.
