# UK/Ireland Employment & Property Calculators — Strategic Assessment & Implementation Plan

**Status: Phase 1 + Phase 2 SHIPPED (2026-08-16).** Production build verified: 430 static pages, 0 TypeScript/lint errors, 21/21 correctness checks pass against hand-computed values and the researched source figures.

Built: UK Notice Period Calculator, UK Statutory Redundancy Pay Calculator, Umbrella vs. Limited Company Take-Home Calculator, IR35 Factors Checklist (reframed as educational, not a determination — see rationale below), UK Stamp Duty Calculator (England/NI, Scotland, Wales). All five live under `/financial/`, tagged `jurisdiction: "UK"` with a `RatesBanner` showing "rates current as of 6 April 2026 (tax year 2026/27)". Also retroactively tagged the pre-existing clearly-US-specific tax/retirement calculators (`jurisdiction: "US"`) — income tax, marriage tax, estate tax, RMD, Roth IRA, IRA, Social Security, 401(k), take-home pay — plus the existing UK mortgage calculator. Note: this tagging pass covered the obviously-US-only tax calculators, not a full audit of all 200+ pre-existing calculators.

Ireland remains deferred per the plan below. New shared infrastructure: `lib/calculators/uk-tax-helpers.ts` (progressive band tax, employee/employer NI, Corporation Tax with marginal relief, dividend tax stacking, generic SDLT-style banded property tax, age-banded redundancy formula, statutory notice), the `jurisdiction`/`ratesAsOf` fields on `CalculatorDefinition`, and the reusable `RatesBanner` component.

---

**Original proposal below, kept for reference.**

## Verdict up front

**Partial yes.** Two of the four pitched calculators are genuinely strong opportunities that match the "give away what's currently gated behind a sales funnel" thesis. One is a good-but-less-differentiated build (a free official version already exists). One — IR35 — should **not** be built as pitched ("IR35 Calculator" giving an inside/outside answer), because that reproduces the exact flaw that HMRC's own official tool is criticized for. Details below, then a phased plan.

## What the research actually found (full sourced report available on request; summarized here)

| Item | Is it a clean calculation? | Is it really "gated" today? | Verdict |
|---|---|---|---|
| **Statutory Redundancy Pay** | Yes — deterministic formula: age-banded weeks (0.5/1/1.5 per year of service, capped at 20 years) × capped weekly pay. Cap updates every 6 April (currently £751/week → max £22,530). | **No.** GOV.UK already publishes an official free calculator. | Build it — low risk, easy, good for completeness and internal linking — but it's not "inheriting gated demand," it's competing with an already-free government tool. |
| **Notice Period** | Yes — statutory minimum is 1 week per full year of service (capped at 12 weeks), compared against contractual notice, whichever is longer. | No official standalone calculator that I found, but it's simple enough that it's not really gated anywhere either. | Build it — cheap to build, pairs naturally with redundancy pay. |
| **Stamp Duty (SDLT/LBTT/LTT)** | Yes, but it's actually **three separate tax systems** (England/NI, Scotland, Wales) with different bands, reliefs, and surcharges, each of which can move independently at any Budget/fiscal event (the SDLT nil-band already reverted from £250k to £125k on 1 April 2025). | Partially — MoneyHelper (government-backed) has one, but the rest of the field is estate agents, conveyancers and lenders using it as a soft lead-gen page. | Worth building for completeness/SEO, but it's the *original* mortgage-adjacent example, not the sharpest "we broke the gate" story — expect moderate competition from established niche sites. |
| **IR35 status** | **No.** It's a multi-factor legal judgment (control, substitution, mutuality of obligation, financial risk) — not a formula. HMRC's own official tool (CEST) is a ~15-minute questionnaire, not a calculator, and is widely criticized by tax/legal commentators as oversimplified; usage has reportedly dropped sharply as businesses turn to paid specialist assessments instead. | Yes, heavily — the entire niche (ContractorCalculator, Caroola, etc.) is contractor-accountancy firms using "IR35 calculators" as lead-gen into paid assessments. | **Do not build a binary "IR35 Calculator."** That would out-CEST CEST — same flaw, no added credibility. See reframe below. |
| **Umbrella vs Ltd take-home** | Yes — a clean side-by-side numeric comparison (Employer's NI, Apprenticeship Levy, umbrella margin vs. Corporation Tax + salary/dividend split). Recent rule changes (Employer's NI rose to 15% and its threshold dropped in April 2025; a new agency/end-client liability shift for umbrella PAYE compliance lands April 2026) mean **most existing tools may not have caught up yet** — a real opening to be more current than incumbents. | Yes, heavily — same contractor-accountancy lead-gen pattern as IR35. | **This is the standout opportunity in the set.** Clean math, genuinely gated today, and a timing edge from recent legislation. |

**One honest caveat on the original pitch's "high CPC" claim:** I have no way to independently verify UK search volume or CPC for these terms (no keyword-research tool available). The competitive landscape — multiple accountancy/legal firms actively investing in and maintaining free calculators in this space — is a reasonable *proxy* for real demand, but it's inference, not measured data. Worth doing real keyword research (Ahrefs/SEMrush/GSC once the site has some) before over-indexing on this vertical.

## Why this changes the shape of the build, not just the content

Everything we've built so far (200 calculators) is US-centric and uses fixed, rarely-changing formulas (BMI doesn't change; the quadratic formula doesn't change). This vertical is different in a way that matters architecturally:

1. **Numbers here have an expiry date.** The redundancy cap changes every April by law. SDLT bands can change at any Budget with no fixed schedule. A calculator that's silently wrong after a rate change is worse than not having it. We don't have any "this data changes over time" infrastructure yet — everything is a hardcoded constant.
2. **Getting it wrong has real stakes.** A wrong BMI reading is a shrug. A wrong stamp duty figure affects a decision worth tens of thousands of pounds; a wrong take-home comparison affects someone's actual contract choice. This needs sharper disclaimers than our current generic footer note, and inline citations to gov.uk/Revenue Scotland/gov.wales.
3. **This is our first non-US content.** We don't currently label anything as region-specific — "Income Tax Calculator" quietly assumes US brackets with no flag saying so. Adding UK calculators surfaces that gap; I'd rather fix it once, generally, than bolt on a one-off "UK" label.

## Proposed implementation plan

### Phase 1 — build now (low risk, high confidence, ships first)
1. **UK Notice Period Calculator** — statutory vs. contractual, whichever is longer.
2. **UK Statutory Redundancy Pay Calculator** — age-banded formula, current cap, clear "this is the legal floor, not your employer's enhanced scheme if they have one" note.
3. **Umbrella vs. Limited Company Take-Home Comparator** — the priority build. Inputs: day/hourly rate, contract length, IR35 status *assumption* (user states it — we don't determine it). Outputs: side-by-side net take-home for both routes, reflecting current Employer's NI/Levy/margin vs. Corporation Tax/dividend tax.

### Phase 2 — build next (moderate complexity)
4. **UK Stamp Duty Calculator**, properly scoped as three regimes: England/NI (SDLT), Scotland (LBTT), Wales (LTT) — each with first-time-buyer relief and additional-property surcharge toggles, not one England-only approximation like the simplified version already buried inside our existing `mortgage-calculator-uk`.

### Reframed, not cancelled
5. **"IR35 Factors Checklist"** (not "Calculator") — a guided walkthrough of the real multi-factor test (control, substitution, MOO, financial risk, integration), producing an indicative lean with explicit, prominent language that this is educational, not a determination, plus a link to HMRC's CEST and advice to get a paid assessment for an actual engagement. This is the honest version of what the pitch wanted, without the credibility risk of a fake-precise yes/no answer.

### Deferred
6. **Ireland** — explicitly phase 2+ later, not simultaneous. It's a genuinely different legal/tax system (Ireland's statutory redundancy is "2 weeks + a bonus week per year of service," not the UK's age-banded formula; Irish Stamp Duty is a single-rate-band system, not three regional ones). Bundling "UK/Ireland" together in one build doubles the research and QA burden for one label. Ship UK first, validate it's worth the maintenance commitment, then decide on Ireland.

## New platform infrastructure this requires (needs your sign-off — architectural, not content)

- **A `jurisdiction` tag** on `CalculatorDefinition` (e.g. `"US"`, `"UK"`, `"Global"`), defaulting existing calculators to `"US"` or `"Global"` as appropriate. This lets us be honest that "Income Tax Calculator" is US-only, and later supports a "Browse UK calculators" filter as this vertical grows.
- **A reusable "rates current as of [date/tax year]" banner component**, attached to any calculator whose constants are law-driven and time-sensitive (redundancy cap, SDLT bands, NI rates). This is a real, ongoing maintenance commitment on our side — realistically an annual review at minimum, an ad-hoc one whenever a Budget changes something — not a one-time build. Worth being honest with yourself about that before committing to the vertical.
- **Sharper legal disclaimers** on this whole category specifically — "not legal, financial, or tax advice — consult a qualified UK employment solicitor / accountant / conveyancer" — beyond our current generic footer line.

## What I need from you before I touch any code

1. Confirm the Phase 1 scope (Notice Period, Redundancy Pay, Umbrella vs Ltd) is right, or reprioritize.
2. Confirm you're OK with the IR35 reframe (checklist, not calculator) — this is a credibility/liability call, not just a naming preference.
3. Sign off on the `jurisdiction` tag + rates-banner infrastructure, since it changes the shared type contract and touches existing calculators, not just new ones.
4. Confirm Ireland stays deferred.

Once you've weighed in, I'll pull exact current source figures (already have them above from gov.uk/HMRC/Revenue Scotland/gov.wales, current as of this research pass) and build Phase 1.
