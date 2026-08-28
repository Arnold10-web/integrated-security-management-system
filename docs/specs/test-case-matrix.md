# ISCMS — UAT Test-Case Scenario Matrix

Covers every process, workflow, RBAC boundary, and completed UAT item (master-spec §14.2).
Each scenario lists the owning role(s), the steps, and the **expected outcome**. Backend-endpoint
references and role/route inventory are derived from the codebase (`server.ts`, `src/routes/`,
`src/config/permissions.ts`, `src/constants/modules.ts`).

Legend:
- **P** positive (happy path) · **N** negative (rejection/failure) · **E** edge/boundary · **R** RBAC/least-privilege
- **A** covered by an automated test (`npm test`) · **M** manual frontend scenario

---

## 1. Auth, Sessions & Account Lifecycle

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| A-01 | P/A | any | Valid login with correct credentials | JWT issued; redirect to role default landing; session recorded |
| A-02 | N/A | any | Wrong password / unknown email | 401; login attempt logged; brute-force window active |
| A-03 | N | any | > 20 login failures in 15 min (prod) / 1000 (test) | 429 rate-limited; IP reported in IT console |
| A-04 | P/A | any | Token refresh | New JWT via `POST /api/auth/refresh`; session preserved |
| A-05 | P/A | any | Logout | Session invalidated; subsequent protected call returns 401/403 |
| A-06 | R/A | IT Officer | Non-IT role calls `POST /api/auth/register` / `/api/users` | 403 — provisioning is IT-only |
| A-07 | P/M | IT Officer | Create a new user login | 201; user appears in IT console; receives initial password notice |
| A-08 | E/M | IT Officer | Update a user account (roles/status) | 200; updated; appropriate audit entry written |
| A-09 | P/M | IT Officer | Manage session: list/teminate my-sessions and user sessions | Active sessions listed; terminated session token fails on next use |
| A-10 | P/A | IT Officer | Delete a security officer (DB-level) | `DELETE /api/security-officers/:id` succeeds (IT only); row removed |
| A-11 | A | any role | Hit a protected route with no/invalid/expired token | 401 Unauthorized |

## 2. RBAC & Least Privilege (module access)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| R-01 | R/A | per module | For each module, owner role reads it | 200 + array (module-access test matrix) |
| R-02 | R/A | outsider | Role outside module reads it | 403 (module-access test matrix) |
| R-03 | P/M | IT Officer | Grant per-user module override | `getEffectiveModuleIds` includes override; user lands on that module |
| R-04 | P/M | IT Officer | Remove module override | Access removed; effective set returns to role defaults |
| R-05 | E/M | IT Officer | Create custom role definition | Saved; appears in custom-role catalog |
| R-06 | R/M | IT Officer | Non-IT role manages regions/custom roles/scheduler | 403 — IT-only writes |
| R-07 | R/M | Regional Manager | Cross-region data access | Lists filtered by `user.region`; no leakage (scoping test) |

## 3. Acting Privileges (§26.9)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| AP-01 | P/M | HR Manager | Request acting role with expiry | Request created (Pending); IT queue lists it |
| AP-02 | P/M | IT Officer | Execute an acting request | Request resolved; `effectiveRoleFor` honors substitution; user sees "Acting as …" |
| AP-03 | P/M | IT Officer | Deny an acting request | Request Denied; role unchanged |
| AP-04 | P/M | IT Officer | Remove an active acting privilege | `DELETE /api/auth/users/:id/acting`; role reverts to base |
| AP-05 | R/M | IT Officer | Acting privileges exercised on a decision | Decision attributed to acting role (audit + UI), not internal table only |
| AP-06 | E/M | HR Manager | Request acting for IT Officer / Director | 403 — `DELEGABLE_ROLES` excludes IT Officer & Director |
| AP-07 | M | any acting | Non-acting role renders "Acting as …" | NOT displayed (introduced honest `isActing` guard in ContractsPanel) |

## 4. Security Officers, Lifecycle, ID Cards & Contracts

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| SO-01 | P/A | HR Manager/Asst | Register a security officer (with force number) | 201; row persisted; in directory & DB |
| SO-02 | N/A | Fleet Manager | Register a security officer | 403 — HR roles only |
| SO-03 | P/A | HR roles | Persistence: create officer, list again | Officer appears in subsequent read (DB source of truth) |
| SO-04 | P/M | Training Officer | Advance lifecycle to IN_TRAINING/PASSED_OUT | Allowed only for those stages |
| SO-05 | N/M | Training Officer | Advance lifecycle to DEPLOYED / TERMINATED | 403 — only HR Manager for termination |
| SO-06 | P/M | Operations/Regional | Deployment order assign from PASSED_OUT pool | Officer → DEPLOYED; site marked deployed |
| SO-07 | P/M | HR Manager | Issue ID card | Card status PENDING → ISSUED; visible on Identity page |
| SO-08 | M | Records Officer | Identity Cards page (post-cleanup) | Single authoritative section — no duplicate hero banner |
| SO-09 | P/M | HR Manager | Archive a security officer | Archived flag set; excluded from active directory |
| SO-10 | P/M | HR Manager | Probation tracking: set outcome at 3-month mark | Status transitions to "Approved Employee"; probation field updated |
| SO-11 | P/M | HR/Records | Employment contract draft + officer on-screen sign + HR sign | Draft → Pending Officer Signature → Pending HR → finalized; PDF filed with checksum |
| SO-12 | E/M | Officer | Sign an employment contract | Signature captured/stored; HR sees next step |
| SO-13 | M | Records Officer | Contract Inquiry answer | Records Officer resolves a vault inquiry; requester notified |

### Personnel Directory seed-data note (UAT 18)
The Personnel Directory intentionally renders realistic demo/seed data to showcase the app; it is
fully DB/seed-backed and is replaced with live data on real deployment. Defensive fallback literals
(e.g. `"SG-2024-001"`) are behind guards and are not shown for real records.

## 5. Sites, Surveys & Client Contracts

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| CS-01 | P/M | BD Manager | Create a client site | 201; listed in Clients & Sites CRM |
| CS-02 | P/M | BD/Sales | Request a site survey | Notification to Operations Manager; request pending |
| CS-03 | P/M | Ops/Regional | Start a survey | Status → In Progress (region-scoped) |
| CS-04 | P/M | Ops/Regional | Complete a survey (fill form) | Survey complete; Draft client contract auto-created |
| CS-05 | P/M | BD/Sales | Create client contract | Draft (GM approval step) |
| CS-06 | P/M | GM | Approve client contract | Contract → Active (no BD/Finance approval step) |
| CS-07 | R/M | Finance Manager | Approve a client contract | Not a step — Finance Manager's role there is signing only (§9.8), not approval |
| CS-08 | E/M | any | Contract read access | 200 for `CONTRACT_READ_ROLES`; 403 otherwise |

## 6. Staff Contracts, Remittances & Approvals Hub

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| SC-01 | P/M | HR Manager/Asst | Create a staff contract draft | Draft |
| SC-02 | P/M | HR Manager | Issue a staff contract | Activated; officer status aligns |
| SC-03 | M | GM | Approvals Hub lists all pending items (Contracts/Requisitions/Expenses/Campaigns) | Full list — no threshold-filtered subset |
| SC-04 | E/M | HR Manager | Staff contract originator outside HR | 403 — originators gated |
| SC-05 | P/M | HR Manager | Append-era legacy approval duplicate behaviors | Both legacy and current endpoints behave (back-compat) |

## 7. Incidents & Investigations

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| IN-01 | P/M | any full | Report an incident | Created; `reportedBySecurityOfficer` attribution stored & displayed |
| IN-02 | P/M | Investigations | Mark incident under investigation | Status updated; audit entry |
| IN-03 | P/M | Investigations | Escalate / Ops-close / Resolve | Status transitions per chain; notified parties updated |
| IN-04 | E/M | any | Audit trail on an incident | Every transition writes `audit("Incident …")`; visible trail |
| IN-05 | A | HR Manager | Non-incident role reports/alters | 403 — incident write gated |

## 8. Invoices, Collections & Payment Reminders (Finance-led — UAT 14)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| FI-01 | P/M | Finance | Create invoice (Draft) | 201; Draft state |
| FI-02 | P/M | Finance Mgr | Approve invoice < UGX 100M | Draft → Pending |
| FI-03 | P/M | Finance Mgr | Approve invoice ≥ UGX 100M | → Pending GM Approval; GM approves → Pending |
| FI-04 | P/M | Finance/BD/Sales | Send payment reminder | `POST /api/invoices/:id/remind`; reminder recorded; invoice flagged |
| FI-05 | M | Finance Manager | Payment Reminders & Receivables Follow-up section (Finance-led) | Section lives under Finance; "Send Reminder" available on Pending/Overdue |
| FI-06 | N/M | Marketing | Access payment reminders in Marketing module | Removed — no collections/reminder UI in Marketing |
| FI-07 | P/M | scheduler | Daily 08:00 Payment Reminder Dispatch | Pending/Overdue invoices reminded automatically; Finance Manager notified |
| FI-08 | P/M | Cashier | Batch cashier transactions; Finance Mgr approves/rejects | Pending → Disbursed/Rejected |

## 9. Expenses, Requisitions, Campaigns (no-threshold)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| EX-01 | P/A | Finance | Submit expense with any amount | 201; no amount split anywhere in UI/API |
| EX-02 | P/M | GM | Approve expense | Approved (GM-only); audit entry |
| EX-03 | N/M | GM | Reject expense with reason | Rejected; reason recorded/displayed |
| EX-04 | P/M | any | Submit requisition | Created; GM queue lists it |
| EX-05 | P/M | GM | Approve/reject requisition with reason | Approve → fulfilled; reject with reason returned |
| EX-06 | P/M | BD/Sales | Create/update campaign budget | Budget edit resets to Pending Finance Approval; GM approves |
| EX-07 | N/M | GM | Approvals Hub lists expenses/campaigns/requisitions | Full list present — not threshold-filtered |

## 10. Fleet & Transport

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| FT-01 | P/M | Fleet Manager | Register vehicle/driver | 201; listed in fleet register |
| FT-02 | P/M | Fleet | Log trip/fuel/driver/inspection/breakdown | Created; fuel/maintenance/driver approvals by Fleet Manager |
| FT-03 | P/M | any staff | Submit transport request | Pending; Fleet Manager queue |
| FT-04 | P/M | Fleet Manager | Approve + assign vehicle/driver/rider | Approved; assignment recorded |
| FT-05 | P/M | Fleet Manager | Decline with reason | Declined; reason captured (transport decline UI) |

## 11. Leave & Appraisals

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| LV-01 | P/M | any staff | Submit leave request | Created (SO self-service or officer-based) |
| LV-02 | P/M | HR Manager | Approve Security Officer leave | Approved directly (SO HR step is final) |
| LV-03 | P/M | HR Manager | Approve non-SO leave | → Pending GM Approval |
| LV-04 | P/M | GM | Final approve leave | Approved |
| LV-05 | N/M | any | Withdraw an already-approved request | 403 — pending only |
| LV-06 | E/M | legacy | Call removed `/approve`/`/ops-approve` endpoints | 410 Gone — client tolerates |
| LV-07 | P/M | HR Manager/Asst | Create appraisal for a security officer | Appraisal stored; feedback surfaces on profile |

## 12. Disciplinary Chain (no bypass)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| DC-01 | P/M | any | Initiate disciplinary action | Initiated (originates from officer profile, not a row button) |
| DC-02 | P/M | Regional Mgr | Regional approval | Initiated → Pending Ops Approval |
| DC-03 | P/M | Ops Mgr | Ops approval | → Pending HR Approval |
| DC-04 | P/M | Investigations | Record hearing + employee response | Response recorded |
| DC-05 | P/M | HR Manager | Finalize (with Category 1/custodial response) | Auto-generates charge-sheet PDF; applies Warning/Suspension/Termination/Desertion |
| DC-06 | N/M | HR Manager | Finalize without required employee response | Blocked until response recorded |
| DC-07 | N/M | any | One-click "Issue Warning" bypass on directory row | Removed — no bypass of the chain |

## 13. Training, Pass-out, Curriculum (§9.14, §9.15)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| TR-01 | P/M | Training Officer | Manage cohorts/trainees; graduate trainee | Graduate → PASSED_OUT |
| TR-02 | P/M | Training Officer | Draft curriculum/course outline per cohort | Saved (training curriculum module) |
| TR-03 | P/M | Training+ | Generate pass-out certificates | PDF generated; stored in Records vault; Ops Manager notified |
| TR-04 | R/M | non-Training | Read/write curriculum & certificates | Read gated to Training/Records/Ops; writes Training |

## 14. Armoury & K9

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| AR-01 | P/M | Armorer | Issue armoury item | Log created |
| AR-02 | P/M | Armorer | Return armoury item | Return recorded; stock updated |
| AR-03 | P/M | K9 Supervisor/Handler | Register K9, log duty, log health | Created; reflected in K9 unit views |

## 15. Recruitment, Documents, Biometrics

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| RC-01 | P/M | HR | Post job, manage candidates | Candidate Hired → auto-creates Driver record |
| RC-02 | P/M | HR/Records | Upload document (multer ≤10 MB, allowed ext) | Stored in vault; HR-category gated to `HR_DOC_ROLES` |
| RC-03 | N/M | any | Upload disallowed type / oversized | Rejected |
| RC-04 | P/M | HR/Records | Enroll + verify fingerprint; export ISO CBEFF | Enrollment verified; CBEFF export generated |

## 16. Employee Portal & Peaceful Exit

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| EP-01 | P/M | Security Officer | Employee Portal: contract status, job description, contract PDF download | All three rendered for the officer (not GM/Director) |
| EP-02 | P/M | HR Manager | Initiate peaceful-exit clearance | Clearance started; items listed |
| EP-03 | P/M | HR/Armorer/Records/IT/Ops/Fleet/Finance | Sign off clearance items | Item signoff recorded; officer exits once all complete |

## 17. Notifications & Sounds (UAT 13)

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| NO-01 | P/M | any | New in-app notification arrives | Toast/bell unread badge updates; Web-Audio chime plays by default |
| NO-02 | M | any | Toggle notification sound off for own user | Preference persisted (`iscms.notificationSound.<userId>`, default on); no chime |
| NO-03 | M | any | Mark individual / read-all notifications | Unread count resets; read state persisted |
| NO-04 | P/M | any | Notification driven by a workflow (approval, incident, reminder) | Targeted role notified via `notifyRole` |

## 18. Scheduled / Automated Jobs

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| CJ-01 | M | IT Officer | Nightly encrypted DB snapshot & backup (00:00) | Snapshot archived; IT Officer notified |
| CJ-02 | M | IT Officer | Endpoint vulnerability scan (6-hourly) | SSL/CORS/routes posture check result; notified |
| CJ-03 | M | IT Officer | Dormant account & session purge (Sunday) | Accounts inactive >90 days suspended; notified |
| CJ-04 | M | IT Officer | Support-ticket SLA escalation (15-min) | Open IT tickets vs SLA evaluated; escalation flagged |
| CJ-05 | A/M | Finance Mgr | Payment Reminder Dispatch (08:00 daily) | Pending/Overdue invoices reminded; `reminder` rows written |
| CJ-06 | P/M | IT Officer | Scheduler admin: create job, run on-demand, view run history/summary | CRUD + run + history + summary all work; invalid cron rejected |

## 19. IT Console & Administration

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| IT-01 | P/M | IT Officer | Manage servers/tickets/assets; terminate sessions | CRUD works; session termination effective |
| IT-02 | P/M | IT Officer | View login-attempts, system-health, audit-logs | Readable; every important action traceable |
| IT-03 | R/M | IT Officer | Audit log read access | IT/Internal Auditor/GM/Director read; others 403 |
| IT-04 | P/M | IT Officer | Manage regions | CRUD; writes IT-only; scoping honored downstream |

## 20. Reporting & Directorate

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| DT-01 | P/M | GM/Director | Executive dashboard summary | KPIs (officers/staff/clients) render with clean copy (post-copy-pass) |
| DT-02 | P/M | GM | Approvals Hub | All pending items across contract/requisition/expense/campaign |
| DT-03 | P/M | Internal Auditor | Analytics summary / reports | KPI data returned (`/api/analytics/summary`) for Directorate |

## 21. Cross-Cutting UX & Feedback

| ID | Type | Role | Scenario | Expected outcome |
|----|------|------|----------|------------------|
| UX-01 | M | any | Perform a destructive action | ConfirmationDialog shown before action |
| UX-02 | M | any | Perform any action | Success/error Feedback shown after result |
| UX-03 | M | any | Identity Cards page | No duplicate hero banners (single section) |
| UX-04 | M | any | Dashboard labels | Copy pass applied — no awkward/repetitive agent phrasing |

---

## Coverage Notes
- **Automated** (`npm test`, server on `NODE_ENV=test`): A-02..A-06, R-01, R-02, SO-01..SO-03, EX-01 —
  the existing security/RBAC/persistence suite plus module-access matrix.
- **Manual/backlog matrices** (M) are the UAT walkthrough for the remaining modules.
- **Completed UAT items (master-spec §14.2)** are referenced: 4 (acting honesty, §3/AP-07), 6 (HR role-gated widgets),
  8 (employee portal), 9 (probation), 10 (pass-out), 11 (training curriculum), 12 (UX dialogs/feedback),
  13 (notification sounds, §17/NO-02), 14 (payment-reminder migration, §8/FI-05..07), 15 (assistant accountant access),
  16 (incident attribution, §7/IN-01..04), 17 (VAT toggle), 18 (cosmetic cleanup, §§4/21).
