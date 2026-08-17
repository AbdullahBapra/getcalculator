# GetCalculator.online — Innovation & Differentiation Plan

**Status: SHIPPED (2026-08-16).** Every Tier 1 item, all three Tier 2 items, and the Tier 3 #8 "Phase A only" guardrail are implemented and verified (clean build, clean lint, targeted correctness tests on every new piece of logic). Tier 3 #9 (bank integration) remains a deliberate non-goal, not built.

**What shipped:**
- **Trust/messaging**: homepage hero + footer now say explicitly that nothing ever leaves the browser, no email/signup ever, plus a Ctrl/Cmd+K hint; `/embed-calculators` now names the $5–19+/month paid competitors it's free against.
- **Fuzzy, typo-tolerant search** (`lib/search.ts`) replacing the old exact-substring match — powers the header search box, the embed-calculators filter, and a new **Ctrl/Cmd+K command palette** (`CommandPalette.tsx`) reachable from anywhere on the site except inside embeds. Caught and fixed a real scoring bug during verification (the word "calculator" appearing in ~every title was drowning out meaningful matches via ties).
- **Scenario Compare** — the most validated feature from the research. From `/history`, select 2–3 saved runs of the *same* calculator and get a live-recomputed side-by-side table (`ScenarioCompareView.tsx`), not just a replay of old saved text.
- **Mobile input polish** — every field now uses 16px+ font (fixes the iOS Safari auto-zoom-on-focus bug) and 44px-ish touch targets, directly answering the HN mobile-input complaints.
- **Voice input** — a feature-detected mic button on every number field site-wide (not hand-picked calculators), with a small word-to-number parser (`lib/voice.ts`) for browsers that transcribe spoken numbers as words instead of digits.

**Not built, on purpose:** real LLM-based natural-language parsing (Tier 3 #8's Phase B — no demand signal yet to justify a first server dependency and recurring cost) and bank/account integration (Tier 3 #9 — contradicts the privacy-first identity that's the strongest asset the research surfaced).

---

**Original proposal below, kept for reference. (Original status line: PROPOSAL — nothing in this document has been implemented. Written for review/approval before any code changes.)**

## Research honesty note (read first)

You asked for Reddit + social media research specifically. **Reddit was completely inaccessible** to the research tooling — every reddit.com URL and search query hit a hard block or bot-wall, including logged-out search. Twitter/X returned nothing either. This is a real gap, not a "searched and found nothing" result — if Reddit sentiment specifically matters, it needs a human with a logged-in session to pull it. What follows in Part 1 uses the closest verifiable substitutes I could actually reach: Hacker News complaint/discussion threads, the Bogleheads forum, and review aggregators. It's weaker evidence than real Reddit data would be, but everything cited below is a real, sourced, dated thread — nothing is invented.

---

## Part 1: What people actually complain about (verified sources only)

| Complaint | Source | Note |
|---|---|---|
| "SEO farms with one useful tool buried under ads, or they want your email before you can do basic math" | [HN, Nov 2025](https://news.ycombinator.com/item?id=46686251) | Sharper than "ads" — **email-gating** is the specific new complaint. We already don't do this. |
| Bad mobile UI, "no visible cursor," outdated input methods, confusing result formatting | [HN](https://news.ycombinator.com/item?id=44491938) | Two independent HN threads raised mobile input UX specifically. |
| No in-site search across hundreds of tools; losing your inputs when switching calculators | Same HN thread | We have header search; worth strengthening. |
| A calculator app sending crash telemetry: *"The crashes on my computer do not belong to you"* — users expect a calculator to be fully local/offline and are unsettled when it phones home | [HN](https://news.ycombinator.com/item?id=43066953) | **Directly validates our architecture** — zero server calls for any calculation, ever. This is a real, defensible trust story, not marketing spin. |
| calculator.net scored 5/50 and 27/100 on ability to handle calculus/graphing tasks | [academichelp.net review](https://academichelp.net/math-solvers/calculator-net-review.html) | Testing it outside its intended use case (it's not a symbolic math solver) — directionally interesting, not rigorous. Validates that our real Scientific Calculator keypad (already built) is a genuine gap-filler. |
| online-calculator.com has **zero** findable public discussion anywhere I could reach | — | Genuine empty result — the site has essentially no public footprint, positive or negative. |

**Bottom line from Part 1:** nothing here overturns what we already knew (ads, no history, no show-work), but it sharpens one thing into a real asset — **"nothing you type ever leaves your device" is a validated trust point**, backed by a real complaint about a competitor doing the opposite, and it's already true of our architecture. We've been under-selling it.

---

## Part 2: What paid competitors charge for (this is the useful part)

Across every paid product examined — Monarch Money, BiggerPockets Pro, Boldin (formerly NewRetirement), TaxCaster→TurboTax, embeddable-widget SaaS (Calconic, Outgrow, involve.me) — **one pattern holds with zero exceptions found**: nobody paywalls the basic calculation itself. They all keep core math free and charge for one of three specific layers:

1. **Scenario saving/comparison** (Monarch Plus $199/yr, BiggerPockets Pro $390/yr, a dedicated "Mortgage Calculator + Compare" app, PaycheckCity's dual-salary compare)
2. **AI-assisted natural-language guidance** (Boldin PlannerPlus $144/yr — the strongest single example found, combining AI guidance + scenario comparison + account aggregation in one paid tier)
3. **Live bank/account data integration** (Monarch, Copilot, Boldin — all via Plaid, all paid-tier only; **zero free calculator sites found offering this at all**)

Separately: an entire **embeddable-widget SaaS category exists charging $5–19+/month with impression/lead caps** (Calconic, Outgrow, involve.me) for exactly the feature we just gave away free and uncapped. That's a concrete, quantifiable thing to say out loud in our own marketing.

---

## Part 3: What we should actually build — prioritized

### Tier 1 — build now (validated by research, cheap, fits our existing architecture)

**1. Scenario Compare.** Let a user save 2–3 variations of the *same* calculator's inputs and view results side-by-side (e.g. 15-yr vs 30-yr mortgage; two job offers' take-home pay via Umbrella vs Ltd). This is the single most validated "table stakes" feature in the whole research pass — Monarch, BiggerPockets, Boldin, PaycheckCity, TaxSlayer, and a dedicated mortgage-compare app all do it — and **no free calculator site does**. It's a real, ownable gap. Cheap to build: it's a new view over data we already collect (History), not a new data model. Concretely: a "Compare" button on the History page that lets you pick 2–3 saved entries *for the same calculator* and renders them as parallel columns.

**2. Say the privacy story out loud.** We already have the strongest trust story in the research (zero network calls, no accounts, nothing ever leaves the device) and we're not saying it anywhere prominent. Add a clear, specific line to the homepage hero and footer — not generic "we respect your privacy" filler, but the actual specific claim: *"Every calculation runs entirely in your browser. Nothing you type is ever sent to a server — not your income, not your health data, not your mortgage numbers."* Zero engineering cost; it's true today.

**3. Market the free embed against its paid competitors.** Add one line to `/embed-calculators`: something like *"Tools like this typically cost $5–19+/month with a capped number of views. Ours is free, unlimited, forever."* Zero engineering cost, directly quantified by Part 2's research.

**4. Lean harder into "no email, no signup, ever."** Now a named, specific complaint (not just "ads"), and it's already true of every feature we've built (History, embeds, currency — all zero-signup). Add it to the same homepage trust line as #2.

### Tier 2 — worth doing, moderate cost

**5. Voice input on a handful of calculators** (Simple Calculator, Tip Calculator, unit converters) via the browser's built-in Web Speech API — no server, no API cost, just a mic button that dictates a number into a field. Evidence of demand is thin (a few small open-source projects, nothing at scale), but competition is essentially zero and the engineering cost is low. Positioned as a nice-to-have differentiator, not a core bet.

**6. A keyboard command palette** (Ctrl/Cmd+K → fuzzy-search all 205 calculators, jump straight to one). Directly answers the HN complaint about "no in-site search across hundreds of tools" more strongly than our current header search box, and reads as a "this team is serious about engineering" signal to technical visitors specifically (brokers, developers — exactly who we want embedding our widgets).

**7. Mobile input UX audit.** Two separate HN threads called out mobile-specific input problems (no visible cursor, bad number entry). Worth a dedicated pass over `Field.tsx` and touch targets rather than a new feature — numeric keypad triggering, larger tap targets, sticky "done" affordance.

### Tier 3 — bigger bets, need an explicit decision from you

**8. AI-assisted "just describe what you want" input.** This is the one genuinely new, high-ceiling idea in the research — Boldin charges $12/mo specifically for AI-guided natural-language interaction, and nothing free does this. But it's a real architectural shift: it's our **first server-side dependency and first recurring per-query cost** (LLM API calls) in a codebase that has been 100% static/client-side and free to run so far. Also a real correctness risk — misrouting someone's plain-English question to the wrong calculator, or garbling their inputs, would actively damage the trust story we just spent Tier 1 building. **My recommendation: don't jump straight to real LLM parsing.** Phase A: upgrade existing search to fuzzy/typo-tolerant matching against calculator titles+descriptions (cheap, client-side, no new cost). Phase B: only add real AI parsing later, and only if Phase A's search analytics show people frequently typing free-text queries that don't match anything — i.e., let real demand justify the cost before we take it on.

**9. Live bank/account integration (Plaid, etc.) — recommend explicitly NOT doing this.** It's a real, confirmed gap in the free-calculator market (Part 2), but it directly contradicts the privacy-first identity we just validated as our strongest asset (Part 1 + Tier 1 #2), and it's a massive compliance/security/liability lift — PII handling, financial data storage, security posture — completely disproportionate to what this project is. Naming this as a deliberate non-goal, not an oversight.

---

## What I need from you before touching any code

1. Sign off on Tier 1 (all four are cheap/fast — I'd suggest just doing all four together as one pass).
2. Pick which Tier 2 items are worth it, if any, or defer all three.
3. Confirm the Tier 3 #8 phased approach (cheap search upgrade now, real AI parsing only if demand shows up later) rather than jumping straight to an LLM integration.
4. Confirm #9 (no bank integration) as a deliberate non-goal, not something to revisit.
