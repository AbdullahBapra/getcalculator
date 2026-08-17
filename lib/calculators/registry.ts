import type { CalculatorDefinition, CategoryKey, CategoryMeta } from "./types";
import { fuzzySearch } from "../search";
import financial from "./financial";
import financialLoans from "./financial-loans";
import financialInvesting from "./financial-investing";
import financialTax from "./financial-tax";
import health from "./health";
import health2 from "./health-2";
import math from "./math";
import math2 from "./math-2";
import everyday from "./everyday";
import everyday2 from "./everyday-2";
import novelty from "./novelty";
import uk from "./uk";

export const CATEGORIES: CategoryMeta[] = [
  { key: "financial", title: "Financial", description: "Mortgages, loans, interest, tax, retirement and everyday money math." },
  { key: "health", title: "Health & Fitness", description: "BMI, calories, body composition, pregnancy and training calculators." },
  { key: "math", title: "Math", description: "Algebra, geometry, statistics and number tools, every one with the steps shown." },
  { key: "everyday", title: "Everyday", description: "Dates, time, grades, passwords and other everyday utility calculators." },
];

// Shared "most-visited" list — used on the homepage grid and echoed as quick links in
// the footer, so both stay in sync from one place instead of two hardcoded lists.
export const POPULAR_SLUGS = [
  "mortgage-calculator",
  "bmi-calculator",
  "percentage-calculator",
  "compound-interest-calculator",
  "age-calculator",
  "tip-calculator",
  "calorie-calculator",
  "loan-calculator",
];

export const ALL_CALCULATORS: CalculatorDefinition[] = [
  ...financial,
  ...financialLoans,
  ...financialInvesting,
  ...financialTax,
  ...health,
  ...health2,
  ...math,
  ...math2,
  ...everyday,
  ...everyday2,
  ...novelty,
  ...uk,
];

const BY_SLUG = new Map(ALL_CALCULATORS.map((c) => [c.slug, c]));

export function getCalculator(slug: string): CalculatorDefinition | undefined {
  return BY_SLUG.get(slug);
}

export function getCategory(key: string): CategoryMeta | undefined {
  return CATEGORIES.find((c) => c.key === key);
}

export function calculatorsByCategory(category: CategoryKey): CalculatorDefinition[] {
  return ALL_CALCULATORS.filter((c) => c.category === category).sort((a, b) => a.title.localeCompare(b.title));
}

export function relatedCalculators(def: CalculatorDefinition, max = 4): CalculatorDefinition[] {
  const explicit = (def.relatedSlugs ?? []).map((s) => BY_SLUG.get(s)).filter((c): c is CalculatorDefinition => !!c);
  if (explicit.length >= max) return explicit.slice(0, max);
  const sameCategory = calculatorsByCategory(def.category).filter((c) => c.slug !== def.slug && !explicit.includes(c));
  return [...explicit, ...sameCategory].slice(0, max);
}

export function searchCalculators(query: string, max = 12): CalculatorDefinition[] {
  return fuzzySearch(ALL_CALCULATORS, query, max);
}

/** Runs a calculator against its own field defaults and returns its headline result as a
 *  short display string — e.g. "$2,022.62" — for the small preview chip on listing cards.
 *  Pure display sugar around the calculator's existing calculate(); no new calculation
 *  logic. Returns null rather than throwing if a calculator's defaults don't resolve. */
export function previewValue(def: CalculatorDefinition): string | null {
  try {
    const inputs: Record<string, string> = {};
    for (const f of def.fields) inputs[f.name] = String(f.defaultValue ?? "");
    const out = def.calculate(inputs);
    if (out.error) return null;
    const primary = out.results.find((r) => r.emphasis) ?? out.results[0];
    if (!primary) return null;
    return `${primary.value}${primary.unit ? ` ${primary.unit}` : ""}`;
  } catch {
    return null;
  }
}
