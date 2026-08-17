# GetCalculator — Execution Plan

## Build status (2026-08-14, updated after full gap-closing pass)

**Shipped and verified** (production build: **423 static pages**, 0 TypeScript errors, 0 lint errors):

- **199 calculators** across financial (76), health (31), math (40), everyday (52) — this closes essentially the entire gap identified in section 5b against calculator.net's 204 and online-calculator.com's exclusive tools (darts checkout, abacus, patio, ring size).
- Plus the unit-converter engine: 6 category hubs × 208 static "X to Y" pages = 214 more pages.
- **424 static pages total**, all `generateStaticParams`-prerendered, 0 TypeScript errors, 0 ESLint errors/warnings.
- Code stayed maintainable at this scale via shared helper modules per category (`finance-helpers.ts`, `health-helpers.ts`, `math-helpers.ts`) so loan math, BMR/weight-unit handling, and stats/erf functions are written once and reused across ~15 files instead of copy-pasted.
- Notable engineering highlights added in this pass: a real recursive-descent expression parser for the Scientific Calculator (no `eval`), a brute-force darts checkout solver, the 2021 CKD-EPI race-free GFR equation, IRR via bisection on NPV, Canadian semi-annual-compounding mortgage math, and 2024 US federal tax brackets for income/marriage-tax calculators.

<details>
<summary>Original MVP build status (superseded, kept for history)</summary>

**Shipped and verified** (production build: 289 static pages, 0 TypeScript errors, 0 lint errors):

- Platform engine: `lib/calculators/types.ts` (shared contract), `lib/calculators/registry.ts` (central manifest), `lib/units.ts` (generic unit-conversion engine — one template drives 208 static "X to Y" pages across length/weight/temperature/time/speed/volume).
- **62 hand-built calculators** with formulas verified against standard references, each with "show your work" steps:
  - Financial (16): mortgage, loan, auto loan, compound interest, simple interest, savings, take-home pay, sales tax, VAT, discount, tip, credit card payoff, debt payoff, 401(k) retirement, 50/30/20 budget, ROI.
  - Health (12): BMI, BMR, calorie/TDEE (×2), body fat (US Navy), lean body mass, ideal weight, macro split, pace, pregnancy due date, BAC, target heart rate, one-rep max.
  - Math (21): percentage, fraction, quadratic formula, GCF/LCM, statistics, standard deviation, mean/median/mode, percent error, exponent, root, log, ratio, triangle, Pythagorean theorem, circle, area, volume, probability, permutation/combination, z-score, rounding, base converter, scientific notation.
  - Everyday (12): age, date difference/arithmetic, time duration, hours & overtime pay, GPA, grade, password generator, random number generator, dice roller, love calculator, IP subnet, day of the week.
- Every calculator gets, for free from the shared `CalculatorShell`: shareable permalinks (query-string prefill), local per-device history (no login), copy-result, dark mode, keyboard-accessible fields, formula/steps disclosure panel — the direct answer to the competitor pain points found in research (no "show your work", no save/share, no dark mode, ad-walled UX).
- Unit converter engine generates 208 SEO landing pages (6 categories × unit pairs) plus 6 interactive category converters — replicates online-calculator.com's long-tail mechanism without hand-authoring any of it.
- Site shell: header with live search, category nav, footer, homepage hub, `sitemap.ts` (auto-includes all 289 routes), `robots.ts`.

**Not yet done** (tracked for the next pass):
- The remaining ~140 calculator.net slugs not yet ported (mostly narrower financial variants — FHA/VA/HELOC loans, bond/CD/annuity calculators — and health/math long-tail like GFR, molarity, matrix calculator). Adding one is now a ~20–60 line data file in `lib/calculators/*.ts` plus a registry import; no new UI code needed.
- Automated unit tests (Vitest) for the calculation functions — formulas were verified against standard references during writing but don't yet have regression tests.
- Live currency exchange rates for a currency converter (deferred — needs either a paid API key or an accepted static-rate disclaimer).
- Full accessibility audit pass (keyboard/screen-reader labels are in place by construction via `<label>`/`aria-live`, but not yet audited with a screen reader).
- `next.config.ts` still has the default config — Cache Components (`cacheComponents: true`) wasn't enabled since every page is already static via `generateStaticParams` with no runtime data fetching, so there was nothing to gain from it yet; revisit if a live-data feature (e.g. currency rates) is added later.

</details>

**Still open after the full 198-calculator pass:**
- Automated unit tests (Vitest) — formulas were verified against standard references during writing but still have no regression tests. Highest-value next step given the volume of financial/medical formulas now shipped.
- Live currency exchange rates (currency-calculator uses a static illustrative snapshot, clearly disclosed).
- A handful of calculator.net long-tail pages remain unported by design rather than omission — e.g. per-scenario duplicates like "percent-off" vs "discount" were consolidated rather than built twice; a few ultra-niche ones (weight-watchers-points exact proprietary formula, shoe-size-conversion regional tables) were built as clearly-labeled approximations rather than exact replicas since the originals aren't public.
- Full accessibility audit with a real screen reader (labels/aria-live are in place by construction, not yet audited).

Research + build plan for a modern calculator hub to compete with [calculator.net](https://www.calculator.net) and [online-calculator.com](https://www.online-calculator.com). Project lives at `D:\calculator\getcalculator` — a fresh Next.js 16.3.1 (App Router, React 19, Tailwind v4) project, currently just the `create-next-app` scaffold.

---

## 1. Competitor extraction

### 1a. calculator.net — ~140 calculators found across 4 categories (site claims ~200 total)

**Financial (71)**
Mortgage, Amortization, Mortgage Payoff, House Affordability, Rent, Debt-to-Income Ratio, Real Estate, Refinance, Rental Property, APR, FHA Loan, VA Mortgage, Home Equity Loan, HELOC, Down Payment, Rent vs Buy, Auto Loan, Cash Back or Low Interest, Auto Lease, Interest, Investment, Finance, Compound Interest, Interest Rate, Savings, Simple Interest, CD, Bond, Mutual Fund, Average Return, IRR, ROI, Payback Period, Present Value, Future Value, Retirement, 401K, Pension, Social Security, Annuity, Annuity Payout, Roth IRA, IRA, RMD, Income Tax, Salary, Marriage Tax, Estate Tax, Take-Home-Paycheck, Loan, Payment, Currency, Inflation, Sales Tax, Credit Card, Credit Card Payoff, Debt Payoff, Debt Consolidation, Repayment, Student Loan, College Cost, VAT, Depreciation, Margin, Discount, Business Loan, Personal Loan, Boat Loan, Lease, Budget, Commission.

**Fitness & Health (28)**
BMI, Calorie, Body Fat, BMR, Ideal Weight, Pace, Army Body Fat, Lean Body Mass, Healthy Weight, Calories Burned, One Rep Max, Target Heart Rate, Pregnancy, Pregnancy Weight Gain, Pregnancy Conception, Due Date, Ovulation, Conception, Period, Macro, Carbohydrate, Protein, Fat Intake, TDEE, GFR, Body Type, Body Surface Area, BAC.

**Math (38)**
Scientific, Fraction, Percentage, Random Number Generator, Percent Error, Exponent, Binary, Hex, Half-Life, Quadratic Formula, Log, Ratio, Root, LCM, GCF, Factor, Rounding, Matrix, Scientific Notation, Big Number, Standard Deviation, Number Sequence, Sample Size, Probability, Statistics, Mean/Median/Mode/Range, Permutation & Combination, Z-score, Confidence Interval, Triangle, Volume, Slope, Area, Distance, Circle, Surface Area, Pythagorean Theorem, Right Triangle.

**Other / Everyday (~54)**
Age, Date, Time, Hours, Time Card, Time Zone, Time Duration, Day Counter, Day of the Week, Concrete, BTU, Square Footage, Stair, Roofing, Tile, Mulch, Gravel, Height, Conversion, GDP, Density, Mass, Weight, Speed, Molarity, Molecular Weight, Roman Numeral Converter, Voltage Drop, Resistor, Ohm's Law, Electricity, IP Subnet, Password Generator, Bandwidth, Base64 Encode/Decode, URL Encode/Decode, GPA, Grade, Bra Size, Shoe Size Conversion, Tip, Golf Handicap, Sleep, Wind Chill, Heat Index, Dew Point, Fuel Cost, Gas Mileage, Horsepower, Engine Horsepower, Mileage, Tire Size, Dice Roller, Love Calculator.

### 1b. online-calculator.com — smaller, converter-heavy

Full Screen Calculator, Scientific Calculator, Simple Calculator, Percentage Calculator, BMI Calculator, Patio Calculator, Darts Calculator, Online Abacus, plus a large bank of unit converters (length, weight, volume, temperature, speed, time) each with dozens of scenario sub-pages (KG↔Pounds, Miles↔KM, Celsius↔Fahrenheit, etc.), a Ring Size Converter, and Circle Tools. Positions itself as a lighter, converter-first tool, not a finance/health hub.

**Combined universe to draw from: ~180 unique calculator concepts.**

---

## 2. What users complain about / where competitors are weak

| Pain point | Evidence | Opportunity |
|---|---|---|
| Intrusive full-page/interstitial ads that block the calculator on mobile | App-store review pattern, general reviews | Non-blocking ad placement, no interstitials, generous free tier |
| Dated, cluttered, early-2000s UI; not mobile-first | Visual inspection of both sites; low aesthetic scores in reviews | Modern responsive UI, big tap targets, instant results, dark mode |
| No "show your work" — results with no formula/steps shown | AcademicHelp review scored calculator.net 27/100 for student/professional robustness, citing weak transparency of method | Every calculator shows the formula used + step-by-step breakdown, collapsible |
| No calculation history, no save/share of a result | Calculator.net has no login/session state at all | Local history (no login needed) + shareable permalink with pre-filled inputs (`?loan=250000&rate=6.5`) |
| No graphing / weak higher math | Reviewers note "limited coverage in higher mathematics and absence of graph-building" vs Omni/Desmos | Add a graphing calculator and step-by-step equation solver as a differentiator |
| US-centric assumptions (currency, tax brackets, units) | Tax/mortgage/loan calculators are US-only; no localization | Multi-currency + multi-country tax/loan variants (start with US/UK/CA/PK/IN/EU), auto-detect locale for units (imperial vs metric) |
| No API / embeddable widgets for other sites | Neither competitor exposes this | Public JSON calc API + embeddable `<iframe>`/web-component widgets — SEO backlinks + a monetizable dev product |
| Fragmented experience — no dashboard linking related calculators | E.g. mortgage, budget, and retirement live as isolated pages | "Money planner" style bundles that chain 2-3 calculators into one flow |
| No accessibility investment visible | No ARIA/keyboard-nav signals on legacy markup | WCAG 2.2 AA target from day one: keyboard-operable keypad, screen-reader labeled outputs, focus states |
| SEO strategy still wins big (200+ pages ranking on long-tail "X calculator" and "convert X to Y" queries) | Ahrefs: FreeConvert grew 380K→1.5M monthly organic visits on "convert X to Y"; niche long-tail queries have low difficulty, high potential | Every calculator gets its own indexable, statically-generated page with unique title/meta/schema — this is non-negotiable for traffic |

**Net positioning:** *GetCalculator = calculator.net's breadth, Omni Calculator's polish and explanations, without the ad-wall, with save/share/history, and with an API.*

---

## 3. Technical architecture (Next.js 16 specifics — verified against `node_modules/next/dist/docs`)

This project runs Next 16.3.1, which has real breaking changes from what training data assumes — confirmed via the docs mirror:

- **Cache Components / `cacheComponents: true`** is the new caching model (replaces `experimental.ppr` / `experimental.dynamicIO` / route-segment cache config). Data fetching is dynamic by default; opt individual components/functions into caching with the `"use cache"` directive, `cacheLife`, `cacheTag`. Enable this in `next.config.ts` — it gives us a static shell per calculator page (formula, SEO copy, related-calculator links) that's prerendered, while the interactive calculator widget streams in.
- **Route conventions unchanged at the file level** (`app/[segment]/page.tsx`, route groups `(group)`, private folders `_folder`, dynamic `[slug]`), so the URL/IA plan below is safe.
- Metadata file conventions (`sitemap.ts`, `robots.ts`, `opengraph-image.tsx`) are generateable in code — use these for the 180-page sitemap instead of a static XML file.

**Proposed structure:**
```
app/
  (marketing)/page.tsx                 → homepage, category grid, search
  (marketing)/[category]/page.tsx      → category index (financial, health, math, everyday, converters)
  (marketing)/[category]/[slug]/page.tsx → individual calculator (static shell + client island)
  api/calc/[slug]/route.ts             → JSON calculation API (mirrors client logic, for the public API product)
  sitemap.ts, robots.ts

lib/
  calculators/
    <slug>.ts        → pure calculation function + zod input schema + unit tests (one file per calculator, no UI)
    registry.ts       → central manifest: slug, category, title, formula description, related slugs — drives routing, sitemap, search, related-calculator links
  format.ts, currency.ts, units.ts

components/
  calculator/CalculatorShell.tsx   → shared layout: inputs, result card, "show steps" toggle, share/permalink, history drawer
  calculator/[Widget].tsx           → per-calculator input UI (thin — logic stays in lib/calculators)
```

Key architectural rule: **calculation logic is pure, framework-free, and unit-tested** in `lib/calculators/*`, so it can be reused by the page (server-rendered initial result), the client widget (live recompute), and the public API route without duplication.

---

## 4. Feature checklist (differentiators baked into the shared `CalculatorShell`, not per-calculator)

- [ ] Instant client-side calculation, no page reload
- [ ] "Show steps"/formula panel on every calculator (addresses the #1 credibility gap vs competitors)
- [ ] Shareable permalink that pre-fills inputs via query params
- [ ] Local (no-login) calculation history per calculator, stored in `localStorage`
- [ ] Copy/export result (copy as text, download as CSV/PDF for finance calculators)
- [ ] Dark mode (system-aware)
- [ ] Related-calculators rail driven by `registry.ts`
- [ ] Unit toggle (metric/imperial) where relevant, locale-aware default
- [ ] Non-blocking ad slots only (no interstitials); optional ad-free via a light "Plus" tier later
- [ ] Full keyboard operability + screen-reader labels on every input/output
- [ ] JSON-LD `SoftwareApplication` + `FAQPage` schema per calculator page

---

## 5. Phased rollout

**Phase 0 — Foundation (this week)**
- Read the specific Next 16 guides that affect us before coding: `caching`, `use-cache` directive, `metadata-and-og-images`, `route-handlers` (already sampled above).
- Design system: Tailwind v4 tokens, light/dark theme, `CalculatorShell` component, keypad component.
- Build `lib/calculators/registry.ts` schema and the dynamic route skeleton.
- Pick and wire the stack: state (URL + localStorage, no heavy client state lib needed), forms/validation (zod), testing (Vitest for the pure calc functions).

**Phase 1 — MVP: 20 highest-traffic calculators** (cover each category so the site doesn't look empty, prioritized by known search volume)
Mortgage, Loan, Auto Loan, Compound Interest, Percentage, BMI, Calorie, Age, Date, Scientific, Fraction, GPA, Tip, Sales Tax, Salary/Take-Home Pay, Discount, Unit Conversion (length/weight/temp), Password Generator, Random Number Generator, Love Calculator (low-effort, high-search novelty traffic).

**Phase 2 — Category completion (Financial, Math, Health)**
Fill out the remaining ~130 calculators from the extracted list, batched by category, reusing `CalculatorShell` so each new calculator is mostly "define the formula + inputs" work.

**Phase 3 — Differentiators**
Graphing calculator, calculator "bundles" (money-planner flow chaining mortgage+budget+retirement), multi-country tax/loan variants, public calc API + embeddable widget, accessibility audit pass.

**Phase 4 — Growth**
SEO content pass (unique explainer copy, FAQ schema per page), internal linking via `registry.ts` related-calculators, sitemap submission, performance budget (Core Web Vitals), analytics + A/B on ad placement vs conversion.

---

## 5b. Gap analysis — what calculator.net / online-calculator.com have that we don't (yet)

Built so far: 62 calculators + the unit-converter engine (208 pages). Checked against the full verified competitor lists from section 1.

### calculator.net — Financial: 16 of 94 built, 78 missing
Built: Mortgage, Loan, Auto Loan, Compound Interest, Simple Interest, Savings, Take-Home Pay, Sales Tax, VAT, Discount, Tip, Credit Card Payoff, Debt Payoff, 401(k), Budget (50/30/20), ROI.

Missing: Interest (generic), Payment, Retirement (income-projection style), Amortization (standalone schedule view), Investment, Currency, Inflation, Finance (generic), Mortgage Payoff, Income Tax, Salary, Interest Rate, House Affordability, Rent, Marriage Tax, Estate Tax, Pension, Social Security, Annuity, Annuity Payout, Credit Card (generic), Debt Consolidation, Repayment, Student Loan, College Cost, CD, Bond, Mutual Fund, Roth IRA, IRA, RMD, Cash Back or Low Interest, Auto Lease, Depreciation, Average Return, Margin, Business Loan, Debt-to-Income Ratio, Real Estate, Personal Loan, Boat Loan, Lease, Refinance, Rental Property, IRR, APR, FHA Loan, VA Mortgage, Home Equity Loan, HELOC, Down Payment, Rent vs Buy, Payback Period, Present Value, Future Value, Commission, UK Mortgage, Canadian Mortgage, Mortgage Amortization, Percent Off, GDP.

### calculator.net — Health & Fitness: 13 of 28 built, 15 missing
Built: BMI, Calorie, Body Fat, BMR, Macro, Ideal Weight, Due Date, Pace, Lean Body Mass, One Rep Max, Target Heart Rate, TDEE, BAC.

Missing: Pregnancy (full trimester tracker), Pregnancy Weight Gain, Pregnancy Conception, Army Body Fat, Carbohydrate (standalone), Healthy Weight, Calories Burned, Protein (standalone), Fat Intake (standalone), Ovulation, Conception, Period, GFR, Body Type, Body Surface Area, Anorexic BMI, Weight Watchers Points, Overweight.

### calculator.net — Math: ~23 of 44 built, ~21 missing
Built: Fraction, Percentage, Triangle, Volume, Standard Deviation, Random Number Generator, Percent Error, Exponent, Binary/Hex (merged into Base Converter), Quadratic Formula, Log, Area, Probability, Statistics, Mean/Median/Mode/Range, Permutation & Combination, Z-score, Ratio, Circle, Pythagorean Theorem, Root, LCM/GCF (merged), Rounding, Scientific Notation.

Missing: Scientific (full keypad calculator), Number Sequence, Half-Life, Slope, Sample Size, Confidence Interval, Distance (2-point coordinate distance), Surface Area (3D solids), Right Triangle (angle-focused solver), Factor / Prime Factorization, Matrix, Big Number, Basic Calculator (plain keypad), Long Division, P-Value, Common Factor (distinct page).

### calculator.net — Everyday/Other: 12 of 38 built, 26 missing
Built: Age, Date, Hours, GPA, Grade, IP Subnet, Password Generator, Dice Roller, Love, Time Duration, Day of the Week, plus Conversion (our converter engine covers this whole bucket).

Missing: Time (standalone), Height, Concrete, Bra Size, Fuel Cost, Voltage Drop, BTU, Square Footage, Time Card, Time Zone, Gas Mileage, Horsepower, Engine Horsepower, Stair, Resistor, Ohm's Law, Electricity, Shoe Size Conversion, Mileage, Density, Molarity, Molecular Weight, Roman Numeral Converter, Golf Handicap, Sleep, Tire Size, Roofing, Tile, Mulch, Gravel, Wind Chill, Heat Index, Dew Point, Bandwidth, Base64 Encode/Decode, URL Encode/Decode.

### online-calculator.com — unique tools we don't have
Their converters (length/weight/temperature/time/speed/volume) are already matched — our engine covers that ground with a cleaner mechanism. Their standalone tools we haven't built: Scientific Calculator (full keypad), Simple/Full-Screen Calculator (basic keypad), Online Abacus (kids' teaching tool), Darts Calculator (score/checkout tracker), Patio Calculator (area + material cost), Ring Size Converter.

### Bottom line
**~139 calculator.net calculators + 6 online-calculator.com novelty tools are not yet built.** None require new architecture — each is a ~20–60 line entry in the existing `lib/calculators/*.ts` pattern. Recommended next batch (highest search-traffic gaps): Income Tax, Salary, Amortization (standalone), Currency, Rent, House Affordability, Student Loan, CD, Bond, IRA/Roth IRA from Financial; Pregnancy, Calories Burned, Ovulation from Health; a full Scientific Calculator keypad and Matrix Calculator from Math; BTU, Square Footage, Fuel Cost, Time Zone from Everyday.

## 6. Immediate next steps

1. Confirm scope for Phase 1 (the 20-calculator MVP list above) and category/URL naming (e.g. `/financial/mortgage-calculator` vs `/mortgage-calculator`).
2. Scaffold `lib/calculators/registry.ts`, the `CalculatorShell`, and the dynamic route, then implement calculator #1 (recommend: **Percentage Calculator** — simplest, validates the whole pipeline) end-to-end as the template for the rest.
3. Set up Vitest for calculation-function unit tests before mass-producing calculators.

Ready to start Phase 0 scaffolding and the first calculator on your go-ahead.
