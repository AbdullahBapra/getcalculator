"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fuzzySearch } from "@/lib/search";

interface Item {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  financial: "Financial",
  health: "Health & Fitness",
  math: "Math",
  everyday: "Everyday",
};

export default function EmbedCalculatorList({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    return fuzzySearch(items, query, items.length);
  }, [items, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const item of filtered) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={`Filter ${items.length} calculators…`}
        aria-label="Filter embeddable calculators"
        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2.5 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />

      {filtered.length === 0 && <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">No calculators match &ldquo;{query}&rdquo;.</p>}

      <div className="mt-6 flex flex-col gap-8">
        {[...grouped.entries()].map(([category, list]) => (
          <div key={category}>
            <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">{CATEGORY_LABEL[category] ?? category}</h2>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((item) => (
                <Link
                  key={item.slug}
                  href={`/embed-calculators?calc=${item.slug}#embed-tool`}
                  className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 transition hover:border-teal-400 hover:text-teal-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
