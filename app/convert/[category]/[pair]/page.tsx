import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { allUnitPairs, findPair, getUnit, getUnitCategory, convert } from "@/lib/units";
import { fmtNumber } from "@/lib/format";
import UnitConverterWidget from "@/components/calculator/UnitConverterWidget";

export function generateStaticParams() {
  return allUnitPairs().map((p) => ({ category: p.category, pair: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ category: string; pair: string }> }): Promise<Metadata> {
  const { category, pair } = await params;
  const cat = getUnitCategory(category);
  const p = cat && findPair(cat, pair);
  if (!cat || !p) return {};
  const from = getUnit(cat, p.from)!;
  const to = getUnit(cat, p.to)!;
  return {
    title: `${from.label} to ${to.label} Converter`,
    description: `Convert ${from.label.toLowerCase()} to ${to.label.toLowerCase()} instantly, plus a full ${cat.title.toLowerCase()} converter for every other unit.`,
    alternates: { canonical: `/convert/${cat.key}/${pair}` },
  };
}

export default async function ConversionPairPage({ params }: { params: Promise<{ category: string; pair: string }> }) {
  const { category, pair } = await params;
  const cat = getUnitCategory(category);
  const p = cat && findPair(cat, pair);
  if (!cat || !p) notFound();
  const from = getUnit(cat, p.from)!;
  const to = getUnit(cat, p.to)!;
  const oneUnit = convert(cat, from.id, to.id, 1);
  const reverseSlug = `${to.id}-to-${from.id}`;

  const rows = [1, 5, 10, 25, 50, 100].map((v) => ({ v, r: convert(cat, from.id, to.id, v) }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <nav className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/convert" className="hover:text-teal-600 dark:hover:text-teal-400">
          Converters
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/convert/${cat.key}`} className="hover:text-teal-600 dark:hover:text-teal-400">
          {cat.title}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-zinc-700 dark:text-zinc-300">
          {from.label} to {to.label}
        </span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {from.label} to {to.label} Converter
      </h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        1 {from.label} ({from.abbr}) = {fmtNumber(oneUnit, 8)} {to.label} ({to.abbr})
      </p>

      <div className="mt-8">
        <UnitConverterWidget categoryKey={cat.key} initialFrom={from.id} initialTo={to.id} />
      </div>

      <div className="mt-8 overflow-x-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          Quick reference: {from.label} to {to.label}
        </h2>
        <table className="mt-3 w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.v} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-1.5 pr-4 text-zinc-500 dark:text-zinc-400">
                  {row.v} {from.abbr}
                </td>
                <td className="py-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  {fmtNumber(row.r, 6)} {to.abbr}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        Going the other way?{" "}
        <Link href={`/convert/${cat.key}/${reverseSlug}`} className="text-teal-600 hover:underline dark:text-teal-400">
          Convert {to.label.toLowerCase()} to {from.label.toLowerCase()}
        </Link>
        .
      </p>
    </div>
  );
}
