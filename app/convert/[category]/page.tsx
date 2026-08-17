import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UNIT_CATEGORIES, getUnitCategory } from "@/lib/units";
import UnitConverterWidget from "@/components/calculator/UnitConverterWidget";

export function generateStaticParams() {
  return UNIT_CATEGORIES.map((c) => ({ category: c.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  const cat = getUnitCategory(category);
  if (!cat) return {};
  return {
    title: `${cat.title} Converter`,
    description: `Convert between any ${cat.units.length} ${cat.title.toLowerCase()} units instantly, with every conversion pair available as its own page.`,
  };
}

export default async function ConverterCategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const cat = getUnitCategory(category);
  if (!cat) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/convert" className="hover:text-teal-600 dark:hover:text-teal-400">
          Converters
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">{cat.title}</span>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{cat.title} Converter</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Convert between any of the {cat.units.length} units below. All values convert through {cat.baseLabel} internally for consistent precision.
      </p>

      <div className="mt-8">
        <UnitConverterWidget categoryKey={cat.key} />
      </div>

      <div className="mt-10">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">Common {cat.title.toLowerCase()} conversions</h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3 lg:grid-cols-4">
          {cat.units.flatMap((from) =>
            cat.units
              .filter((to) => to.id !== from.id)
              .map((to) => (
                <Link
                  key={`${from.id}-${to.id}`}
                  href={`/convert/${cat.key}/${from.id}-to-${to.id}`}
                  className="text-zinc-600 hover:text-teal-600 hover:underline dark:text-zinc-400 dark:hover:text-teal-400"
                >
                  {from.label} to {to.label}
                </Link>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
