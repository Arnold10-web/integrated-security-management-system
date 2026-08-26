# UI Text & Tooltip Quality Guidelines

**Scope:** all user-facing text in the ISCMS interface — headings, labels, buttons, empty states,
captions, badges, and tooltips. These are the standards applied in the Training School workspace
(`TrainingSchoolWorkspace.tsx`, `TrainingPipelineView.tsx`) and the identity-card modal
(`IdentityCardPrintModal.tsx`); apply them to every new screen and when touching existing copy.

---

## 1. Principles

1. **Every string earns its place.** If removing a sentence changes nothing for the user, remove it.
2. **Explain what happens, not what the screen is.** "Pass Out" is obvious on the button; *what pass-out does* belongs in its tooltip.
3. **Right size, right place:** short labels on controls; one-line context under section titles; full explanations in tooltips or help modals.
4. **Never state the obvious.** Don't write "Click Receive to receive" or label a search box "Search Box".
5. **Empty states must tell the user what to do next**, not just that it's empty.

---

## 2. What counts as generic/obvious text (remove or rewrite)

| Pattern | Bad example | Fix |
|---|---|---|
| Restating the control | Button `Receive` + caption "Use this button to receive" | Delete the caption |
| Empty filler | "No officers in this view." | Say why it's empty and what to do: "No recruits have been sent yet. Officers appear here once Operations sends them to the school." |
| Redundant status words | "Incoming Queue — Action Required … 3 new" | The amber panel + count already say it: "Incoming Queue … 3 waiting" |
| Duplicated KPI captions | Card "Under Training / Active pipeline" where the number already implies activity | Drop the caption; move the definition into a tooltip |
| Signatures of the obvious | Footer: "No 'Create Recruit' in this role…" repeated under every tab | State it once where relevant (e.g. banner), or as a tooltip on a disabled action |
| Self-identifying headers | Section title + paragraph both saying "Cohorts" | Title names it; paragraph explains what you can do there |

## 3. Copy rules

### Labels & buttons
- Sentence case for buttons ("Receive & Admit"), uppercase only via CSS tracking classes.
- Verb-first on actions: **Save**, **Receive**, **Pass Out**, **Create Intake Cohort**.
- Never end a button with "…" unless it opens a chooser/modal.
- One concept per word: pick "recruit", "officer", or "trainee" per screen and stay consistent (Training School uses *officer* for lifecycle records, *recruit trainee* for assessment records).

### Descriptions
- Under a section title: one line, max ~140 chars, saying **what you can do here**, not what the section is called.
  - Good: "Create intakes, assign instructors, and track cohort progress."
  - Bad: "This is the cohorts section of the training school."

### Empty states — three cases, always contextual
1. **Filtered view empty** → "No recruits match this filter."
2. **Genuinely no data yet** → explain origin + next step: "No assessment records yet. Recruit records are created when Operations enrolls them."
3. **Data exists but not shown** → "All officers accounted for." / "All records shown."
Decide with real conditions (`query || filter !== "ALL"` vs total count) rather than one static string.

### Numbers & dates
- KPI cards show the number large; qualifiers live in the tooltip, not as a sub-caption.
- Dates render through `formatDate` (dd MMM yyyy); ISO strings never reach the user.

---

## 4. Tooltip guidelines

Tooltips carry the explanation that would clutter the visible UI. Use native `title=""` attributes (consistent with existing code); no JS tooltip libraries.

### When to add a tooltip
- **Destructive or consequential actions** — spell out exactly what will happen:
  - Pass Out → *"Graduate this officer — marks them Passed Out with today's date, adds pass-out certifications, and returns them to Operations for deployment"*
- **Domain terms a new user may not know** (force number, cohort, reception, lifecycle stage).
- **KPI definitions** — how the number is computed/scoped:
  - Awaiting Reception → *"Officers sent here by Operations and waiting to be received into a cohort"*
- **Disabled buttons** — always explain what's missing: *"Capture the holder's photo, holder signature and issuer signature first"*.
- **Navigation tabs** — what work lives behind them (see TrainingSchoolWorkspace `TABS[].tooltip`).
- **Abbreviated columns** — e.g. "Avg Score" → mean of drill, marksmanship, theory.

### When NOT to add a tooltip
- The label is already self-explanatory (Cancel, Save, Search).
- The information is critical for safety/compliance — put it visibly on screen, never hover-only.
- Mobile-only flows (no hover): anything essential must also be visible text.

### Writing style for tooltips
- Max ~150 chars; sentence case; no trailing period needed on fragments.
- Structure: **what it does** → optional **side effects** → optional **who acts next**.
  - "Admit into training — officer moves to the Under Training list"
- No repetition of the button's own verb as the first word if the button is adjacent ("Receive" → don't start tooltip with "Receive").

---

## 5. Document & certificate text (print output)

- Company name and legal lines come from `src/constants/branding.ts` — never hardcode variants.
- Certificates/ID cards use formal register, full dates ("24 August 2026"), and stable reference formats
  (e.g. certificate ref `PSG-PO-<yyyymmdd>-<forcenumber>`).
- Placeholder-tolerant layout: reserved logo plate keeps geometry stable if branding assets are missing;
  text never shifts based on asset presence.

---

## 6. Review checklist (before shipping UI text)

- [ ] No sentence that restates an adjacent label/button
- [ ] Every empty state says why it's empty and/or what to do next
- [ ] Consequential actions have tooltips describing outcomes
- [ ] Disabled controls explain what's missing
- [ ] KPI numbers have definition tooltips instead of redundant captions
- [ ] Terminology consistent within the screen (officer vs recruit vs trainee)
- [ ] No ISO date strings or raw enum values leaking into the UI
- [ ] Branding/legal strings sourced from `constants/branding.ts`
- [ ] Copy passes the "read aloud" test — would you say this sentence to a user?
