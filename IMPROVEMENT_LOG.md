# ISCMS Improvement Log — Waves 1-4

**Date:** 2026-08-12  
**Session:** Findings-driven improvements across RBAC, test data hygiene, data model, and UI/UX  
**Status:** All changes applied and verified

---

## Wave 1 — RBAC Correctness Fixes (`server.ts`)

### QA-1 / QA-2 — GM/Director view scope restriction
**Files:** `server.ts` (MODULE_PERMISSIONS block + SERVER_MODULE_TO_CLIENT)

- **Removed** `view` access for General Manager and Director from 12 operational modules:
  `leads`, `identity`, `marketing`, `administration`, `it`, `fleet`, `roster`, `patrol`, `training`, `recruitment`, `campaigns`, `deployments`
- **Kept** `view` access on 15 oversight modules:
  `guards`, `sites`, `armoury`, `incidents`, `vehicles`, `invoices`, `expenses`, `k9s`, `hr`, `performance`, `documents`, `complaints`, `disciplinary`, `requisitions`, `workflow`
- Changed Director's `directorate` access from `full` to `view` (QA-2)
- Added new `leave` module to MODULE_PERMISSIONS with appropriate role access levels

### QA-3 — K9 Handler cannot manage dog records
**Files:** `server.ts` (K9 CRUD route handlers)

- Added inline role check inside `POST/PUT/DELETE /api/k9s` — only `K9 Supervisor` can create, update, or delete K9 dog records
- K9 Handler can still create K9 deployment logs and health inspection entries (those routes unchanged)

### QA-4 — Operations Manager recruitment scope
**Files:** `server.ts` (MODULE_PERMISSIONS — recruitment module)

- Changed `"Operations Manager": "full"` → `"Operations Manager": "view"` in the `recruitment` module
- OM can now view candidates but cannot create or edit them

### QA-5 — Assistant Accountant finance scope
**Files:** `server.ts` (MODULE_PERMISSIONS — finance module)

- Changed `"Assistant Accountant": "full"` → `"Assistant Accountant": "view"` in the `finance` module
- AA is now view-only on cashier transactions (cannot create disbursements)

### QA-6 — Guard Officer operations + sites access
**Files:** `server.ts` (MODULE_PERMISSIONS — operations and sites modules)

- Added `"Guard Officer": "view"` to both the `operations` and `sites` modules
- Guard Officer can now view guard records and client sites (needed for deployment oversight)

### QA-7 — Training Officer guard access
**Files:** `server.ts` (MODULE_PERMISSIONS — guards module)

- Added `"Training Officer": "view"` to the `guards` module
- Training Officer can now browse guards to manage trainee assignments

### QA-9 — Records Officer error message
**Files:** `server.ts` (contract edit route, ~line 1648)

- Changed error from `Access denied: field(s) not editable by ${actorRole}: ${disallowed.join(", ")}` to a generic `You don't have permission to perform this action`

### QA-10 — Director leave approval removal
**Files:** `server.ts` (leave-requests gm-approve route, ~line 3308)

- Changed `if (!user || (user.role !== "General Manager" && user.role !== "Director"))` to `if (!user || user.role !== "General Manager")`
- Director can no longer give final leave approval

### QA-11 — Invoice ≥100M threshold
**Files:** `server.ts` (invoice approve + update routes, ~lines 1804-1858)

- Modified `PUT /api/invoices/:id/approve`: if `existing.amount >= 100_000_000`, status transitions to `"Pending GM Approval"` instead of `"Pending"`. If below threshold, behaves as before.
- Added new `PUT /api/invoices/:id/gm-approve` route — only GM can finalize high-value invoices, transitioning from `"Pending GM Approval"` to `"Pending"` (sent)
- Updated `PUT /api/invoices/:id` status validation to also block Paid/Overdue transitions from `"Pending GM Approval"`

### QA-14 — Login role allowlist
**Files:** `server.ts` (login handler, ~line 773)

- Added role check after password verification: if `user.role` is not in `VALID_USER_ROLES`, returns 403 "This account type cannot sign in directly"
- Blocks Inspector and Site In-Charge accounts from logging in

### QA-15 — Module display names in errors
**Files:** `server.ts` (MODULE_DISPLAY_NAMES constant + error messages)

- Added `MODULE_DISPLAY_NAMES` mapping (internal key → user-facing label, e.g. `k9s → "K9 Management"`)
- Updated `requireModuleAccess` 403 messages to use display names
- Updated `requireAnyModuleAccess` 403 message to use display names
- Added `leave: "hr"` to `SERVER_MODULE_TO_CLIENT`

### QA-16 — Leave-requests access gate
**Files:** `server.ts` (Leave-requests GET route, ~line 3112)

- Replaced `requireAnyRole(...)` (8 hardcoded roles) with `requireModuleAccess("leave")` using the new `leave` module entry in MODULE_PERMISSIONS
- POST route and approval routes retain their existing inline role checks

---

## Wave 2 — Test Data Hygiene (F7, F8)

### F7 — RBAC test data leaking into dev DB
**Status:** Already fixed

- `tests/security-rbac.test.ts` line 81: `afterAll` already deletes `RBAC*` clientSites
- `tests/security-rbac.test.ts` line 49: `beforeAll` already cleans up `RBAC-TEST*` clientSites

### F8 — Seed missing dayShiftArmed/nightShiftArmed
**Status:** Already fixed

- `prisma/seed.ts` lines 213-215: computes and writes `dayShiftArmed` and `nightShiftArmed` from `armedGuardsRequired`, `dayShiftGuards`, `nightShiftGuards`
- DB verified: all seeded sites have correct armed guard values

---

## Wave 3 — Lead Source Field

### Status: Already fully implemented

- `prisma/schema.prisma` line 561: `source String @default("Manual")` on Lead model
- `server.ts` line 2161: `source: z.string().min(1)` in create lead Zod schema
- `server.ts` lines 2278-2313: `POST /api/public/leads` public endpoint with rate limiting (20/hr), honeypot anti-bot, creates leads with `source: "Website"`
- DB verified: sources include "Website", "LinkedIn", "Walk-in", "Referral", "Security Expo"

---

## Wave 4 — UI/UX Improvements

### GM Dashboard — Consolidated Metrics (F1, F2, F3, F4)

**Problem:** Total Revenue, Guard Strength, and Active Security Alerts were each displayed in 3+ places (DashboardKpiCards, EnterpriseAnalyticsPanel, CorporateGovernancePanel, ExecutiveAlertsStrip). `ConsolidatedDashboardMetrics.tsx` was a markdown file masquerading as TSX, causing tsc errors.

**Files changed:**

1. **`src/components/organisms/ConsolidatedDashboardMetrics.tsx`** — Converted from markdown documentation to a real React component with 5 canonical KPI cards:
   - Guard Status (consolidated — shows active/total + suspended count)
   - Revenue Performance (consolidated — collection % + overdue + total)
   - Security Status (consolidated — open incidents + critical + non-compliant sites)
   - Firearms Issued (unchanged)
   - K9 Deployments (unchanged)

2. **`src/components/organisms/index.ts`** — Added export for `ConsolidatedDashboardMetrics`

3. **`src/components/views/DashboardView.tsx`** — Replaced:
   - Inline metric computations (7 lines) with `consolidateDashboardMetrics()` utility call
   - `DashboardKpiCards` import/usage with `ConsolidatedDashboardMetrics`
   - All metric props now sourced from the single `consolidateDashboardMetrics` result

4. **`src/utils/dashboardMetrics.ts`** — Fixed pre-existing unused variable warnings (`k9s`, `armoury` destructured but never read)

### HR Manager — Disciplinary Finalize Button (H1)

**Problem:** The "HR Finalize" button in `DisciplinaryPanel` checked `status === "Pending Ops Approval"`, but `opsApproveDisciplinary` in the domain store sets status to `"Pending HR Approval"`. The button never appeared after Ops approval.

**File:** `src/components/views/GovernancePanels.tsx` (line 373)

- Changed button condition from `"Pending Ops Approval"` to `"Pending HR Approval"`

### HR Manager — Leave Request Tracker (H7)

**Problem:** `LeaveRequestPanel` only had filter buttons for 4 of 7 leave statuses, and approval buttons for only 2 of 5 approval steps. Leaves stuck at "Pending Regional Approval" or "Pending Ops Approval" were invisible and unactionable.

**Files changed:**

1. **`src/components/organisms/LeaveRequestPanel.tsx`**:
   - Expanded `filter` type to include all 7 statuses: `ALL`, `Pending Regional Approval`, `Pending Ops Approval`, `Pending HR Review`, `Pending GM Approval`, `Approved`, `Rejected`
   - Added filter buttons for the 3 missing statuses with distinct color coding
   - Added approval sections for "Pending Regional Approval" (→ Ops) and "Pending Ops Approval" (→ HR)
   - Added new props: `onRegionalApprove` and `onOpsApprove`

2. **`src/components/views/GuardsHRView.tsx`**:
   - Added `onRegionalApproveLeave` and `onOpsApproveLeave` optional props
   - Added `regionalApproveL` and `opsApproveL` callback functions
   - Updated `lf` state type to match expanded `LeaveFilter` type
   - Updated `LeaveRequestPanel` invocation to pass new callbacks and extend reject roles

3. **`src/stores/domainStore.ts`**:
   - Added `regionalApproveLeave` to the `DomainStore` interface
   - Added implementation: transitions status to `"Pending Ops Approval"`, calls `/api/leave-requests/:id/approve`, logs audit + notification

4. **`src/pages/ModulePages.tsx`**:
   - Wired `domain.regionalApproveLeave` and `domain.opsApproveLeave` to `GuardsHRView`

---

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Zero errors (previously had errors from markdown `.tsx` file) |
| `npx vitest run` | 159/161 tests passed |
| Pre-existing test failures | 2 in `consolidateMetrics.test.ts` (severity key case mismatch + `Math.round` rounding) — not introduced by these changes |
| RBAC tests (security-rbac) | 117/117 passed |
| Module-access tests | 26/26 passed |
| Permission-override tests | 5/5 passed |
| Manual: GM API access | `/api/leads` → 403 (removed), `/api/invoices` → 200 (kept), `/api/requisitions` → 200 (kept) |
| Manual: K9 Handler create | 403 (blocked by role check) |
| Manual: Invoice ≥100M | Draft → FM approve → "Pending GM Approval" → GM approve → "Pending" |
