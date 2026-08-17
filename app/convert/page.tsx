import Link from "next/link";
import type { Metadata } from "next";
import { UNIT_CATEGORIES } from "@/lib/units";

export const metadata: Metadata = {
  title: "Unit Converters",
  description: "Convert between length, weight, temperature, time, speed and volume units — one engine, every pair of units.",
};

export default function ConvertIndexPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Unit Converters</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Pick a category to convert between any two units instantly, or jump straight to a specific conversion like{" "}
        <Link href="/convert/length/feet-to-meters" className="text-teal-600 hover:underline dark:text-teal-400">
          feet to meters
        </Link>
        .
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {UNIT_CATEGORIES.map((c) => (
          <Link
            key={c.key}
            href={`/convert/${c.key}`}
            className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
          >
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{c.units.length} units · {c.units.length * (c.units.length - 1)} conversions</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
