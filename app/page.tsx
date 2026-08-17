import Link from "next/link";
import { ALL_CALCULATORS, CATEGORIES, POPULAR_SLUGS, calculatorsByCategory, getCalculator, previewValue } from "@/lib/calculators/registry";
import { UNIT_CATEGORIES, allUnitPairs } from "@/lib/units";
import SearchBox from "@/components/layout/SearchBox";
import ScientificCalculatorKeypad from "@/components/calculator/ScientificCalculatorKeypad";

export default function Home() {
  const popular = POPULAR_SLUGS.map((s) => getCalculator(s)).filter((c) => !!c);
  const converterPageCount = allUnitPairs().length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <section className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            {ALL_CALCULATORS.length}+ free calculators. Every one shows its work.
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
            Financial, health, math and everyday calculators with the formula and steps shown, a shareable link for every result, local history with no
            account, dark mode, and zero interstitial ads.
          </p>
          <div className="mt-8 max-w-xl">
            <SearchBox />
          </div>
          <p className="mt-3 max-w-xl text-xs text-zinc-400 dark:text-zinc-600">
            Press <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-800">Ctrl</kbd> +{" "}
            <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 font-mono dark:border-zinc-700 dark:bg-zinc-800">K</kbd> anywhere on
            the site to jump straight to a calculator.
          </p>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">Live scientific calculator</span>
            <Link href="/math/scientific-calculator" className="text-xs font-medium text-zinc-500 hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Open full page ↗
            </Link>
          </div>
          <div className="rotate-1 rounded-[28px] bg-zinc-900 p-3 shadow-2xl shadow-zinc-900/20 dark:bg-black">
            <ScientificCalculatorKeypad />
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
          {popular.map((c) => {
            const preview = previewValue(c!);
            return (
              <Link
                key={c!.slug}
                href={`/${c!.category}/${c!.slug}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
                    {c!.title[0]}
                  </span>
                </div>
                <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">{c!.title}</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c!.shortDescription}</p>
                {preview && (
                  <span className="mt-3 inline-block rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {preview}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Browse by category</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={`/${cat.key}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
                {cat.title[0]}
              </span>
              <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">{cat.title}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{calculatorsByCategory(cat.key).length} calculators</p>
            </Link>
          ))}
          <Link
            href="/convert"
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
              U
            </span>
            <h3 className="mt-3 font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">Unit Converters</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {UNIT_CATEGORIES.length} categories · {converterPageCount} conversion pairs
            </p>
          </Link>
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-teal-200 bg-teal-50 p-6 dark:border-teal-900 dark:bg-teal-950/30">
        <h2 className="font-semibold text-teal-900 dark:text-teal-300">Built to fix what other calculator sites get wrong</h2>
        <ul className="mt-3 grid gap-2 text-sm text-teal-800 sm:grid-cols-2 dark:text-teal-400">
          <li>✓ Every result shows the formula and step-by-step work</li>
          <li>✓ Shareable permalinks — send someone your exact inputs</li>
          <li>✓ Compare saved scenarios side-by-side, free</li>
          <li>✓ Dark mode, keyboard-accessible, no interstitial ads</li>
          <li>✓ No email, no signup, ever — not even to save your history</li>
          <li>✓ Embed any calculator on your own site, free and unlimited</li>
        </ul>
        <p className="mt-4 border-t border-teal-200 pt-4 text-sm text-teal-900 dark:border-teal-900 dark:text-teal-300">
          <strong>Every calculation runs entirely in your browser.</strong> Nothing you type is ever sent to a server — not your income, not your
          health numbers, not your mortgage details. No account means there&rsquo;s nothing about you to store in the first place.
        </p>
      </section>
    </div>
  );
}
