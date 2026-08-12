# ISCMS — General Manager Dashboard: Findings Log & Information Architecture

Manual review (screenshots), role: General Manager. Complements ISCMS-Role-Based-Test-Plan.md.

---

## Findings Log

| # | What's off | Why it matters | Severity | Suggested fix |
|---|---|---|---|---|
| F1 | Guard count shown 3x: "Active Post Deployment" (7/14) in top strip, "Guard Strength" (14, 7 on duty) in Analytics, then repeated again in "Guard Status Distribution" chart | Same fact re-verified three times costs the GM scanning time and creates false signal that these might be three different numbers | Minor | Pick one canonical summary card + one detail chart. Drop the third. |
| F2 | Revenue shown 3x: "Revenue Collection" card (24%, 18.5M of 78.1M) → "Revenue by Invoice Status" chart restates paid amount → overdue figure (22M) resurfaces again in "Items Requiring Executive Attention" | Same as F1 — redundant confirmation instead of new information | Minor | Keep the overdue figure only in "Executive Attention" (it's the actionable one); let the Analytics chart be the only place showing the full paid/pending/overdue breakdown. |
| F3 | "Active Security Alerts" (2 Open) in top strip duplicates "Incidents" (2 open, 0 critical) in Analytics section just below | Different label, same number — reads as two separate issues at a glance | Minor | Merge into one metric, or clearly differentiate if they're genuinely tracking different things (confirm with data source first). |
| F4 | "Items Requiring Executive Attention" (the one section that actually needs a GM decision) sits *below* two full sections of analytics | For an oversight role, what needs a decision should be the first thing seen, not the last thing after scrolling past descriptive stats | Significant | Move directly under the header, above all analytics. |
| F5 | "Departmental Leadership & RBAC" (static names/titles) sits inline with live metrics, between the attention items and the client sites list | Static reference data breaks the visual rhythm of a live-metrics dashboard; doesn't help a decision | Minor / Polish | Move to its own "Org" page or collapse to a link ("View department heads →"). |
| F6 | "Field Rank Distribution" chart: 3 of 5 categories (Armorer, Site In-Charge, Inspector) are flat zero bars | Takes equal visual space as fully-populated charts while conveying almost nothing | Polish | Hide zero-value categories by default, or collapse into "Other ranks: 0". |
| F7 | "Deployed Client Sites" list mixes real-looking client names (Nakumatt Jubilee Mall, Bank of East Africa HQ) with what appear to be test/seed entries ("RBAC-TEST-SITE", "RBAC-TEST-SITE-2") | Test data visible alongside real client data undermines trust in the whole screen while evaluating it, and risks shipping to a demo/client-facing context by accident | Significant | Confirm this is dev-only seed data; add an environment filter or banner so test records never render in a view a real GM would see. |
| F8 | Every sampled site shows "0 armed" guards (RBAC-TEST-SITE-2: 0/0, Nakumatt: 0 armed/4 unarmed, Bank of East Africa: 0 armed/6 unarmed) — yet the earlier "Armed Posture by Region" chart shows populated bars (up to ~30) per region | Either the per-site armed count is broken/not wired up, or the regional chart is aggregating from a different (possibly stale) source — worth confirming which is correct before either number is trusted | **Needs verification** (flag as potential data-integrity issue, not confirmed) | Backend check: trace both the per-site armed/unarmed count and the "Armed Posture by Region" chart to confirm they read from the same source. |
| F9 | "Live Audit Telemetry" raw event feed (exact login timestamps, individual firearm serial numbers, who issued what to whom) sits at the very bottom of the GM dashboard | This is operational/granular audit detail — appropriate for an audit/compliance page, not an executive oversight view. A GM doesn't need "Mossberg Shotgun ARM-SHT-012 issued at 05:40:12," they need to know if there's an anomaly worth reviewing | Significant | Replace with an aggregate: "X security-relevant events in the last 24h, X flagged for review" with a link to the full log on a dedicated Audit page. |

---

## Cross-Department Information Architecture

The underlying issue behind several findings above (and the core of what you flagged): **the GM dashboard is currently showing department-level operational data, not cross-department oversight data.** The fix isn't just visual cleanup — it's picking a consistent rule for what belongs on the GM home screen versus what belongs inside each department's own page.

**Proposed rule:** something belongs on the GM home dashboard only if it answers *"does the GM need to know this to make a decision or notice a problem across the business,"* not *"is this something someone in that department works with."* Duty rosters, individual maintenance logs, or line-item invoices are department execution detail — useful to the person doing the work, noise to someone overseeing seven departments at once. Aggregates, trends, and exceptions are what earn a place on the home screen; task lists don't, even if they're the department's most-used feature on their own page.

Applying that to what you described:

| Department | Belongs on GM home dashboard | Stays in the department's own page |
|---|---|---|
| **Operations** | Regional performance overview (guard strength, deployment coverage % by region), active incidents by region, **guard deployment pipeline** (counts moving through recruitment → training → deployment, and where bottlenecks are) | Duty rosters, shift scheduling, individual guard assignments, patrol logs |
| **Fleet** | Fleet utilization %, vehicles currently down / out of service, fleet-related incidents | Maintenance schedules, fuel logs, individual vehicle assignment/mileage history |
| **Human Resources** | Headcount, attrition/turnover trend, count of approvals pending GM sign-off (e.g. leave escalations, finalized disciplinary cases) | Individual employee records, leave calendars, case-level disciplinary detail, biodata |
| **Finance** | Revenue collection %, overdue invoice total (already present — keep, this is correctly pitched) | Invoice-by-invoice detail, transaction ledger, individual client billing history |
| **Marketing & Sales** | Pipeline value and conversion rate at aggregate level, lead volume by source | Individual lead records, campaign task lists, day-to-day pipeline management |
| **IT & Systems** | Security alert count, system uptime/status (already present via "Active Security Alerts" — keep) | Raw audit telemetry (see F9), access logs, individual event-level records |

This gives you a defensible answer for each department represented in the nav: the GM sees the number that tells them *whether that department is healthy right now*, and clicks through to that department's page only when they need to act on it — rather than the home dashboard trying to be every department's page compressed into one scroll.

One follow-up worth deciding: does this rule hold for **all** departments in the nav (Investigations, Administration, Client CRM, etc.), or are there one or two where the GM genuinely needs deeper visibility by design — e.g. because there's no department head trusted to self-manage, or because it's a newly launched function you want to watch closely? Worth listing any such exceptions explicitly, so the rule stays a deliberate design choice rather than something that gets quietly violated the next time someone adds a widget.
