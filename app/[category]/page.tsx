import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, calculatorsByCategory, getCategory, previewValue } from "@/lib/calculators/registry";
import CalculatorCard from "@/components/calculator/CalculatorCard";

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ category: c.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const meta = getCategory(category);
  if (!meta) return {};
  return {
    title: `${meta.title} Calculators`,
    description: meta.description,
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const meta = getCategory(category);
  if (!meta) notFound();
  const calculators = calculatorsByCategory(meta.key);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{meta.title} Calculators</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">{meta.description}</p>

      {/* The header has no persistent category nav by design (see Header.tsx), so once
         you're on a category page there's otherwise no way to switch to another one
         without going all the way back to the homepage. This row is that switcher. */}
      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => {
          const active = c.key === meta.key;
          return (
            <Link
              key={c.key}
              href={`/${c.key}`}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                active
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-zinc-300 bg-white text-zinc-700 hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
              }`}
            >
              {c.title}
            </Link>
          );
        })}
        <Link
          href="/convert"
          className="rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
        >
          Unit Converters
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((c) => (
          <CalculatorCard
            key={c.slug}
            href={`/${c.category}/${c.slug}`}
            title={c.title}
            description={c.shortDescription}
            preview={previewValue(c)}
            headingLevel="h2"
          />
        ))}
      </div>
    </div>
  );
}
