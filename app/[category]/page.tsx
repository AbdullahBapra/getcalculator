import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CATEGORIES, calculatorsByCategory, getCategory, previewValue } from "@/lib/calculators/registry";

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

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {calculators.map((c) => {
          const preview = previewValue(c);
          return (
            <Link
              key={c.slug}
              href={`/${c.category}/${c.slug}`}
              className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-sm font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
                {c.title[0]}
              </span>
              <h2 className="mt-3 font-semibold text-zinc-900 group-hover:text-teal-700 dark:text-zinc-100 dark:group-hover:text-teal-400">{c.title}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.shortDescription}</p>
              {preview && (
                <span className="mt-3 inline-block rounded-md bg-zinc-100 px-2 py-1 font-mono text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {preview}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
