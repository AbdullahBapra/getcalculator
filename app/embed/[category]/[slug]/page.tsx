import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_CALCULATORS, getCalculator } from "@/lib/calculators/registry";
import CalculatorShell from "@/components/calculator/CalculatorShell";
import SimpleCalculatorKeypad from "@/components/calculator/SimpleCalculatorKeypad";
import ScientificCalculatorKeypad from "@/components/calculator/ScientificCalculatorKeypad";
import AbacusWidget from "@/components/calculator/AbacusWidget";
import DartsScorerWidget from "@/components/calculator/DartsScorerWidget";
import RatesBanner from "@/components/calculator/RatesBanner";
import PoweredBy from "@/components/calculator/PoweredBy";

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
    // Embeds are a copy of the real page rendered inside someone else's site — index the
    // canonical page, not this one, so we're not competing with ourselves in search.
    robots: { index: false, follow: true },
  };
}

export default async function EmbedCalculatorPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const { category, slug } = await params;
  const def = getCalculator(slug);
  if (!def || def.category !== category) notFound();

  return (
    <div className="mx-auto max-w-2xl px-3 py-3">
      <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{def.title}</h1>
      <RatesBanner jurisdiction={def.jurisdiction} asOf={def.ratesAsOf} />
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
      <PoweredBy compact />
    </div>
  );
}
