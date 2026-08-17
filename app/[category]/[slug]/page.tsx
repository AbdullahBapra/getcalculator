import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ALL_CALCULATORS, getCalculator, getCategory, relatedCalculators } from "@/lib/calculators/registry";
import CalculatorShell from "@/components/calculator/CalculatorShell";
import SimpleCalculatorKeypad from "@/components/calculator/SimpleCalculatorKeypad";
import ScientificCalculatorKeypad from "@/components/calculator/ScientificCalculatorKeypad";
import AbacusWidget from "@/components/calculator/AbacusWidget";
import DartsScorerWidget from "@/components/calculator/DartsScorerWidget";
import RatesBanner from "@/components/calculator/RatesBanner";
import PoweredBy from "@/components/calculator/PoweredBy";
import PreferredSourceButton from "@/components/calculator/PreferredSourceButton";

export function generateStaticParams() {
  return ALL_CALCULATORS.map((c) => ({ category: c.category, slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const def = getCalculator(slug);
  if (!def) return {};
  return {
    title: def.title,
    description: def.seoDescription,
    alternates: { canonical: `/${def.category}/${def.slug}` },
  };
}

export default async function CalculatorPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const def = getCalculator(slug);
  if (!def || def.category !== category) notFound();

  const related = relatedCalculators(def);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: def.title,
    applicationCategory: "CalculatorApplication",
    operatingSystem: "Any (Web)",
    description: def.seoDescription,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href={`/${def.category}`} className="capitalize hover:text-teal-600 dark:hover:text-teal-400">
          {def.category}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{def.title}</span>
      </nav>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-wide text-teal-600 dark:text-teal-400">{getCategory(def.category)?.title}</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{def.title}</h1>
          <p className="mt-2 max-w-3xl text-zinc-600 dark:text-zinc-400">{def.seoDescription}</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href={`/embed-calculators?calc=${def.slug}#embed-tool`}
            className="flex min-h-11 items-center rounded-full border border-teal-200 px-4 text-sm font-medium text-teal-700 transition hover:border-teal-300 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-400 dark:hover:bg-teal-950/40"
          >
            Embed this tool
          </Link>
          <PreferredSourceButton />
        </div>
      </div>

      <div className="mt-6">
        <RatesBanner jurisdiction={def.jurisdiction} asOf={def.ratesAsOf} />
      </div>

      <div className="mt-2">
        {def.widget === "keypad-scientific" ? (
          <ScientificCalculatorKeypad />
        ) : def.widget === "keypad-basic" ? (
          <SimpleCalculatorKeypad />
        ) : def.widget === "abacus" ? (
          <AbacusWidget />
        ) : def.widget === "darts-scorer" ? (
          <DartsScorerWidget />
        ) : (
          <CalculatorShell slug={def.slug} />
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Related calculators</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <Link
                key={r.slug}
                href={`/${r.category}/${r.slug}`}
                className="rounded-full border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
              >
                {r.title}
              </Link>
            ))}
          </div>
        </div>
      )}

      <PoweredBy />
    </div>
  );
}
