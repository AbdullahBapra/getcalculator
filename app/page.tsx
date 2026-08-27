import Link from "next/link";
import { ALL_CALCULATORS, CATEGORIES, POPULAR_SLUGS, calculatorsByCategory, getCalculator, previewValue } from "@/lib/calculators/registry";
import { allUnitPairs } from "@/lib/units";
import SearchBox from "@/components/layout/SearchBox";
import ScientificCalculatorKeypad from "@/components/calculator/ScientificCalculatorKeypad";
import CalculatorCard from "@/components/calculator/CalculatorCard";

export default function Home() {
  const popular = POPULAR_SLUGS.map((s) => getCalculator(s)).filter((c) => !!c);
  const converterPageCount = allUnitPairs().length;

  // Same "show the breakdown" idea the calculators themselves are built around,
  // pointed at the site's own catalog — browsing categories becomes one more chart
  // instead of five identical link tiles.
  const catCounts = [
    ...CATEGORIES.map((c) => ({ key: c.key, href: `/${c.key}`, title: c.title, count: calculatorsByCategory(c.key).length })),
    { key: "convert", href: "/convert", title: "Unit Converters", count: converterPageCount },
  ];
  const catTotal = catCounts.reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <h1 className="fade-in-up text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            {ALL_CALCULATORS.length}+ free calculators.
            <br />
            Every one{" "}
            <span className="relative inline-block whitespace-nowrap">
              shows its work.
              {/* A hand-drawn underline instead of a stock highlight box — the one bit
                  of "designed" flourish on the page, drawing the eye to the actual
                  differentiator (not a decoration for its own sake). */}
              <svg viewBox="0 0 300 18" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-2 left-0 h-3 w-full text-teal-400 dark:text-teal-600">
                <path
                  d="M2 12 C 60 4, 140 3, 150 8 C 165 14, 240 15, 298 6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100}
                  style={{ animation: "draw-underline 900ms 500ms ease-out forwards" }}
                />
              </svg>
            </span>
          </h1>
          <p className="fade-in-up mt-5 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400" style={{ animationDelay: "80ms" }}>
            Financial, health, math and everyday calculators with the formula and steps shown, a shareable link for every result, local history with no
            account, dark mode, and zero interstitial ads.
          </p>
          <div className="fade-in-up mt-8 max-w-xl" style={{ animationDelay: "160ms" }}>
            <SearchBox rotatingPlaceholders={["mortgage calculator", "BMI", "tip calculator", "percentage change", "loan payoff"]} />
          </div>
          <p className="fade-in-up mt-3 max-w-xl text-xs text-zinc-400 dark:text-zinc-600" style={{ animationDelay: "240ms" }}>
            Press <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-800">Ctrl</kbd> +{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-800">K</kbd> anywhere on
            the site to jump straight to a calculator.
          </p>
        </div>

        <div className="fade-in-up" style={{ animationDelay: "120ms" }}>
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">Live scientific calculator</span>
            <Link href="/math/scientific-calculator" className="text-xs font-medium text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Open full page ↗
            </Link>
          </div>
          <div className="relative">
            <span className="absolute -top-2.5 -right-2.5 z-20 flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-teal-700 shadow-md dark:bg-zinc-900 dark:text-teal-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-teal-500" />
              </span>
              LIVE
            </span>
            <div className="relative rotate-1 overflow-hidden rounded-[28px] bg-zinc-900 p-3 dark:bg-black">
              <ScientificCalculatorKeypad />
              {/* One-time diagonal light streak on load, clipped to the rounded frame —
                  a nod to a screen catching the light, not a looping distraction. */}
              <div className="shine-sweep pointer-events-none absolute inset-y-0 -left-1/3 z-10 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 flex flex-wrap justify-center gap-2">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={`/${cat.key}`}
            className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
          >
            {cat.title}
          </Link>
        ))}
        <Link
          href="/convert"
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
        >
          Unit Converters
        </Link>
      </section>

      <section className="mt-14">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Popular calculators</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((c) => (
            <CalculatorCard
              key={c!.slug}
              href={`/${c!.category}/${c!.slug}`}
              title={c!.title}
              description={c!.shortDescription}
              preview={previewValue(c!)}
            />
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Browse by category</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {catCounts.map((cat, i) => {
            const pct = (cat.count / catTotal) * 100;
            return (
              <Link
                key={cat.key}
                href={cat.href}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
              >
                <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-50 bg-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
                <span className="font-[family-name:var(--font-logo)] text-4xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">{cat.count}</span>
                <h3 className="mt-1 text-sm font-semibold text-zinc-700 group-hover:text-teal-700 dark:text-zinc-300 dark:group-hover:text-teal-400">
                  {cat.title}
                </h3>
                {/* The category grid is its own tiny "breakdown chart" — each bar's
                   length is that category's real share of the whole catalog, the same
                   idea every calculator result on the site is built around. */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="cat-bar-grow h-full rounded-full bg-teal-500 dark:bg-teal-400"
                    style={{ width: `${pct}%`, animationDelay: `${i * 70}ms` }}
                  />
                </div>
                <span className="mt-1.5 text-[11px] text-zinc-400 dark:text-zinc-600">{pct.toFixed(0)}% of the catalog</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="relative mt-16 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <div className="p-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 font-mono text-sm font-bold text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
              =
            </span>
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">What every other calculator site gets wrong</h2>
          </div>

          <div className="mt-5 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {[
              ["Buries the answer under ads and a wall of text", "Every result shows the formula and the step-by-step work"],
              ["One static page you can't hand to anyone", "A shareable permalink for every single calculation"],
              ["No way to weigh two options against each other", "Compare saved scenarios side-by-side, free"],
              ["A signup wall just to save one number", "No email, no signup, ever — not even for history"],
              ["Sends what you type back to a server somewhere", "Runs entirely in your browser, always"],
              ["Embedding it anywhere costs you", "Embed any calculator on your own site, free and unlimited"],
            ].map(([bad, good], i) => (
              <div key={i} className="flex flex-col gap-1.5 text-sm">
                <span className="flex items-start gap-2 text-zinc-400 line-through decoration-zinc-300 dark:text-zinc-600 dark:decoration-zinc-700">
                  <span className="mt-0.5 shrink-0 text-xs">✕</span>
                  {bad}
                </span>
                <span className="flex items-start gap-2 font-medium text-zinc-800 dark:text-zinc-200">
                  <span className="mt-0.5 shrink-0 text-teal-600 dark:text-teal-400">✓</span>
                  {good}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="calc-card-tape relative bg-zinc-50 px-6 pt-4 pb-5 text-sm text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
          <strong className="text-zinc-800 dark:text-zinc-200">Every calculation runs entirely in your browser.</strong> Nothing you type is ever
          sent to a server — not your income, not your health numbers, not your mortgage details. No account means there&rsquo;s nothing about you
          to store in the first place.
        </div>
      </section>
    </div>
  );
}
