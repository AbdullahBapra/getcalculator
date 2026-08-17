"use client";

import { useMemo, useState, useEffect } from "react";
import { buildEmbedSnippet, embedUrlFor, embedHeightFor } from "@/lib/embed";
import { fuzzySearch } from "@/lib/search";

export interface EmbedPickerItem {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  widget?: string;
}

export default function EmbedPicker({ items }: { items: EmbedPickerItem[] }) {
  const [selectedSlug, setSelectedSlug] = useState(items[0]?.slug ?? "");
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // Deep-linked from a calculator's own "Embed this tool" button, or from the list
    // below on this same page — both just set a ?calc= param. Reading window.location
    // directly (instead of next/navigation's useSearchParams) avoids requiring a
    // Suspense boundary around this component on an otherwise fully static page.
    const requested = new URLSearchParams(window.location.search).get("calc");
    if (requested && items.some((i) => i.slug === requested)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSlug(requested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 205 options grouped into a native <select> is a lot to scroll through to find one
  // calculator by eye — this filters the list shown in the dropdown as you type, same
  // fuzzy/typo-tolerant matching as the header search and command palette, while still
  // leaving the dropdown itself as the actual selection control.
  const filteredItems = useMemo(() => {
    const q = query.trim();
    if (!q) return items;
    return fuzzySearch(items, q, items.length);
  }, [items, query]);

  const grouped = useMemo(() => {
    const byCategory = new Map<string, EmbedPickerItem[]>();
    for (const item of filteredItems) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return byCategory;
  }, [filteredItems]);

  useEffect(() => {
    // Keep the selection in sync with what's actually visible in the (now filtered)
    // dropdown — otherwise typing a search could leave the select showing a value with
    // no matching <option>, which renders blank and desyncs the code/preview from view.
    if (filteredItems.length > 0 && !filteredItems.some((i) => i.slug === selectedSlug)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedSlug(filteredItems[0].slug);
    }
  }, [filteredItems, selectedSlug]);

  const selected = items.find((i) => i.slug === selectedSlug) ?? filteredItems[0] ?? items[0];
  const snippet = selected ? buildEmbedSnippet(selected.category, selected.slug, selected.title, selected.widget) : "";
  const previewUrl = selected ? embedUrlFor(selected.category, selected.slug) : "";
  const previewHeight = selected ? Math.min(embedHeightFor(selected.widget), 420) : 420;

  function copySnippet() {
    navigator.clipboard
      ?.writeText(snippet)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      })
      .catch(() => {});
  }

  function selectAndUpdateUrl(slug: string) {
    setSelectedSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("calc", slug);
    window.history.replaceState(null, "", url);
  }

  if (!selected) return null;

  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-xl">
        <label htmlFor="embed-calc-search" className="mb-2 block text-center text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Search calculators
        </label>
        <div className="relative">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            id="embed-calc-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Filter ${items.length} calculators by name…`}
            className="w-full rounded-full border border-zinc-300 bg-white py-3 pr-4 pl-10 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div>
            <label htmlFor="embed-calc-select" className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Calculator
            </label>
            {filteredItems.length === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No calculators match &ldquo;{query}&rdquo;.</p>
            ) : (
              <select
                id="embed-calc-select"
                value={selectedSlug}
                onChange={(e) => selectAndUpdateUrl(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {[...grouped.entries()].map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((i) => (
                      <option key={i.slug} value={i.slug}>
                        {i.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>
          <div>
            <div className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">Embed code</div>
            <pre className="overflow-x-auto rounded-lg bg-zinc-900 px-3 py-3 text-xs whitespace-pre-wrap break-all text-zinc-200 dark:bg-black">
              <code>{snippet}</code>
            </pre>
          </div>
          <button
            type="button"
            onClick={copySnippet}
            className="min-h-11 rounded-full bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-500"
          >
            {copied ? "Copied!" : "Copy embed code"}
          </button>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">Live preview</div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800">
              <iframe key={selected.slug} src={previewUrl} width="100%" height={previewHeight} loading="lazy" title={`${selected.title} preview`} className="block" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
