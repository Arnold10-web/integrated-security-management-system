# ISCMS — Business Development Manager (Marketing & Sales): Findings Log

Manual review (screenshots), role: Business Development Manager (Ivan Ssebana). Complements ISCMS-Role-Based-Test-Plan.md and the other department findings files.

---

## Findings Log

| # | What's off | Why it matters | Severity | Suggested fix |
|---|---|---|---|---|
| M1 | This single dashboard is one continuous scroll covering: lead pipeline, lead source analytics, follow-up radar, campaign analytics, acquisition/funnel charts, collections & payment reminders, client contracts & approvals, campaign budget approvals, client complaints, and guard availability by region | That's nine distinct working areas stacked on one page. Even where each section is individually reasonable, this is well past what a home dashboard should hold — it reads like every module got appended to one page rather than organized into a working structure | Significant | This is the strongest candidate yet for genuine sub-navigation (see open question below) — split into logical pages: Pipeline (leads + follow-ups), Campaigns (social/budget analytics), Contracts & Collections, Complaints — with the top-level dashboard showing only aggregate summaries of each, matching the pattern already applied to the GM dashboard. |
| M2 | "Closed Won Revenue: UGX 0" and "0% Funnel Close Rate" are both displayed prominently near the top, with no time-period or sample-size context — and the entire pipeline currently totals 5 leads | A brand-new pipeline with 5 leads showing "0%" reads as alarming or as a broken system, when it may simply be too early to have a close rate yet. Stark negative-looking metrics without context can mislead whoever's scanning the dashboard | Minor / Polish | Add a qualifier — "0% (based on 5 leads)" or a date range — so the number is legible as "early stage," not "failing." |
| M3 | "Campaign Budget Approvals" is a full-width section on the BDM's dashboard, explicitly noting "Finance Manager approves; budgets >10M UGX additionally require GM final approval" — i.e. BDM has zero decision authority here | Same principle as the GM/HR findings: a role's dashboard should show what needs *their* decision. A whole section for an approval chain the BDM can't act on is space that could go to something they do own | Minor / Polish | Compress to a one-line status ("2 campaigns pending Finance approval") rather than a full panel, unless BDM needs to track it closely for other reasons. |
| M4 | An "Approve Step" button appears on at least one client contract card in the BDM's view | Worth confirming rather than assuming: does the BDM genuinely hold approval authority at some step of the contract chain (e.g. initiating/validating before it reaches Finance), or is this the same kind of shared-component leak found on the HR dashboards (H11, R3/R4) where an action meant for a different role renders on everyone's screen? | **Needs verification** | Confirm intended contract-approval chain and who each button should actually be visible to. |
| M5 | Complaint cards show a numeric field (e.g. "4") next to the "Resolve" button, alongside a separate star rating shown lower in the card (e.g. ★★☆☆☆ 2/5) | Two different-looking rating representations on the same card, and it's unclear whether the numeric field is an editable input (can BDM re-score the complaint?) or a static display that happens to be styled like an input box | **Needs verification** | Clarify what the numeric field does; if it's not meant to be edited, style it as read-only rather than as a bordered input field. |

---

## What's working well
- **Reassign / Follow-up model matches the RBAC design exactly**: only the BDM can reassign a lead's ownership; each Supervisor-owned lead only advances via its owner. Confirms the pipeline-ownership decision made earlier is implemented correctly here.
- **Self-documenting cross-department panels**: "Guard Availability by Region" is explicitly labeled *"Aggregate view shared with Marketing for pipeline planning"*, and Client Complaints is labeled *"Marketing owns the resolution; ratings mirror to the client site."* Both explain *why* this cross-department data is on the BDM's dashboard. This is exactly the kind of self-documentation the HR dashboards are missing (e.g. nothing explains why Records Officer sees Disciplinary Actions) — worth using as the template when fixing those.

---

## Recommended enhancements — Sales Pipeline Stage Funnel
You said the structure is good but want it more interactive and detailed. Concrete ideas, roughly in priority order:

1. **Fix truncated names first** — company names ("Acacia Em...", "Kampala C...", "Namanve...", "Bwera Bor...") and owner names ("Sales and Marketi...") are cut off on every card with no way to see the full text without opening edit. At minimum add a hover tooltip showing the full value; better, let the card grow slightly or wrap the name to two lines rather than truncating.
2. **Make the card itself open a detail view.** Right now the only actions are Edit (pencil), Delete (trash), Reassign, and Follow-up. Clicking the lead's name/company should open a full detail panel — the same modal pattern already used elsewhere in the app (e.g. the appraisal certificate popup). That turns the board from "a list of cards" into something you can actually work a deal from. Suggested contents for that panel:
   - **Header:** company name (in full, not truncated), contact name and title, current stage, deal value
   - **Source & ownership:** lead source tag, current owner, date captured, days in current stage
   - **Activity timeline:** every stage change, reassignment, and follow-up logged chronologically — who did what, when
   - **Notes:** free-text field for the owner to log call outcomes, objections, next steps — visible history, not just the latest note
   - **Next action:** the scheduled follow-up date/type, editable inline, feeding the Follow-up Radar
   - **Contact details:** phone/email if captured, so the owner doesn't need to leave the modal to reach out
   - **Actions available from the panel itself:** advance stage (if owner), reassign (if BDM), mark closed won/lost with a required reason (Closed Lost already captures a reason on the card — bring that into the modal as a proper field, not an afterthought)
3. **Drag-and-drop stage advancement** for the assigned owner, instead of relying only on the Reassign button for movement. Since the model is already owner-based (only the owner advances their lead), dragging your own card rightward is a natural, faster interaction than whatever the current advance-stage mechanism is (not shown in the screenshots — worth checking what it currently is).
4. **Show "days in this stage" on each card.** A lead sitting in Qualified for 3 days versus 30 days is a very different situation, and right now there's no way to spot a stalling deal at a glance.
5. **Surface an expected close date or next-action date directly on the card**, not just via the separate Follow-up button — and connect it to the Follow-up Radar section below so a scheduled follow-up actually shows up there instead of the two feeling disconnected (Follow-up Radar currently shows "No follow-ups scheduled" even though there are 5 open leads).
6. **Add stage-level filtering/sorting** — by owner, by source, or by value — once the pipeline has more than 5 leads, scanning six columns of undifferentiated cards won't scale. Doesn't need to be built now, but worth planning the card data model so filtering is easy to add later.
7. **Small visual polish**: a subtle color accent per stage (beyond the neutral card background) helps the eye jump straight to "what's new" vs "what's about to close" without reading every label.

---

## Open question — the "Marketing & Sales" dropdown — RESOLVED
The dropdown holds two genuinely distinct pages: **Client & Sites CRM** (won clients, their site posts, staffing levels, SLA health) and **Marketing & Sales** (the lead pipeline page already reviewed). These don't overlap — the dropdown is doing real navigational work, not duplicating anything. So M1's fix isn't "remove the dropdown," it's "keep the dropdown, and use the same split logic to break the Marketing & Sales landing page's nine sections into their own homes" — collections/contracts/complaints arguably belong closer to Client & Sites CRM (they're about won clients) rather than sitting on the lead-pipeline page.

---

## Client & Sites CRM — Findings

Overall: another well-built screen, similar quality bar to the Records Officer's Identity Cards page — good stat cards, a real chart, and site cards with genuinely useful detail (shift breakdown, armed/unarmed split, site contact).

| # | What's off | Why it matters | Severity | Suggested fix |
|---|---|---|---|---|
| M8 | Every site post card sampled (Gulu Sugar Corp Estate, Mbarara Regional Warehouse, Uganda Telecom Towers, Shell Uganda Fuel Depot) shows populated day/night guard numbers and an armed/unarmed split, yet every one is tagged "Not Deployed" | If the numbers represent guards that are actually posted, "Not Deployed" contradicts that. If they're target/planned numbers rather than an actual roster, that's not obvious from the card — it reads as "6 guards are here" when it may mean "6 guards are needed" | Significant (ties directly into the site-survey question below) | Once the guard-count source is settled (see below), label the numbers accordingly — "Required staffing: 6 day / 4 night" for a not-yet-deployed site vs. "Currently deployed: 6 day / 4 night" once guards are actually posted. Same numbers, different meaning, needs different wording. |
| M9 | "Won by Patricia Akello" attribution tag appears on 2 of 4 sampled site cards (Gulu Sugar, Uganda Telecom) but not on the other two (Mbarara, Shell Uganda) | Inconsistent — either not every won site has this data captured, or it's not rendering reliably. A nice feature (crediting the BDM who won the client) that should show consistently or not at all | Minor | Confirm whether missing tags reflect real missing data or a rendering gap. |
| M10 | "SLA Health Distribution" donut shows a single unbroken green ring with an "8" label floating outside it, unconnected to any legend | With 8/8 sites compliant, the chart is currently just "one full green circle," which doesn't yet demonstrate whether the chart can show a real distribution (e.g. what does a non-compliant segment look like — different color? Where does the legend live?). Hard to judge whether this is well-designed until there's an actual mix to display | Minor / needs more data to judge | Worth testing with a deliberately non-compliant test site to confirm the chart reads clearly once it's not 100% one color. |

---

## Brainstorm — who determines guard staffing numbers for a new site post?

You raised a real workflow question: Marketing wins the client, but Operations is the one who should actually survey the site and determine how many guards (and how many armed) it needs — not Marketing typing numbers into the onboarding form from a sales conversation.

Worth noting: **you already have a survey step built elsewhere in the system.** The Victoria Logistics contract (Client Contracts & Approvals, reviewed earlier) shows a "SITE SURVEY · 2026-08-02 · BY EMMA MUWONGE" note with real operational judgment in it — perimeter fence condition, access point count, existing CCTV, and a staffing recommendation ("5 day + 3 night guards sufficient with K9 at peak season"). That's exactly the kind of assessment that should be producing the Day Guards/Night Guards/Armed Quota numbers — and it's clearly not something Marketing is positioned to judge (fence integrity, access points, and armed-coverage need are security/operational calls, not sales ones).

So the recommendation is **not** to move surveying to Marketing — it's to connect the two things you already have instead of leaving them separate:

1. **Marketing's part of onboarding stays administrative only**: Client Organization, Site Post Name, Address, Zone/Region, Contact Person, Contact Phone — the facts a BDM actually knows from winning the deal.
2. **Winning the client triggers an Operations site survey task** (the same mechanism already producing the Victoria Logistics note), rather than Marketing guessing staffing numbers.
3. **The survey's output populates Day Guards / Night Guards / Armed Quota / K9 requirement** on the site post — either automatically once Operations submits it, or with Operations required to confirm/sign off before the site post leaves "Not Deployed" status (this also resolves M8: the numbers only appear once they're real, or are clearly marked provisional until they are).
4. If Marketing genuinely needs to enter *preliminary* numbers for early contract drafting (e.g. before the survey happens, to give the client a ballpark), keep that as an explicitly separate "Estimated" field, distinct from the confirmed "Required Staffing" field the survey produces — so the two are never confused for each other.

This keeps each role doing what they're actually positioned to judge, and reuses a workflow (the site survey) that's clearly already part of the system's design rather than inventing a new one.

---

## Onboarding Form ("Onboard New Client Site Post") — UX Recommendations
The form itself is clean, but a few things would make it hold up better as it's used:

1. **Group fields into sections** rather than one flat list — e.g. "Client & Site Details" (Organization, Site Name, Address, Zone, Region), "Staffing Requirements" (Day/Night Guards, Armed Quota, Day/Night Shift Armed, K9 checkbox), "Site Contact" (Person, Phone). This also gives you a natural place to apply the brainstorm above — e.g. grey out or label the Staffing Requirements section "Pending Operations survey" until that step is complete.
2. **Numeric fields (Day Guards: 6, Night Guards: 6, Armed Quota: 2) aren't clearly marked as examples** the way the text fields are ("e.g. Standard Chartered"). Right now it's ambiguous whether "6" is a placeholder hint or a pre-filled default someone could accidentally submit without changing. Add "e.g." to these too, or leave them genuinely blank.
3. **No required-field indication** apart from Region being explicitly marked "(optional)" — if everything else is mandatory, mark that consistently (asterisks or a legend), rather than implying it only through the one exception.
4. **Consider linking to the client's contract** if one already exists in Client Contracts & Approvals, rather than re-entering client/site details that may already be on file there — reduces duplicate data entry and keeps the two records in sync.
