"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { searchCalculators } from "@/lib/calculators/registry";

export default function SearchBox({ className = "" }: { className?: string }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const results = useMemo(() => searchCalculators(query, 8), [query]);

  return (
    <div className={`relative ${className}`}>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search 205 calculators…"
        aria-label="Search calculators"
        // text-base (16px), not text-sm — iOS Safari auto-zooms the page on focus for any
        // input under 16px; this box sits in the header on every page, so it matters everywhere.
        className="w-full rounded-full border border-zinc-300 bg-white px-4 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
      />
      {open && query.trim() && (
        <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {results.length === 0 ? (
            <li className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">No calculators match &ldquo;{query}&rdquo;.</li>
          ) : (
            results.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/${r.category}/${r.slug}`}
                  className="block px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {r.title}
                  <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">{r.category}</span>
                </Link>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
