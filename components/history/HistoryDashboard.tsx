"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ALL_CALCULATORS, CATEGORIES } from "@/lib/calculators/registry";
import { getAllHistory, renameHistoryEntry, deleteHistoryEntry, clearHistory, type GlobalHistoryEntry } from "@/lib/history";
import ScenarioCompareView from "./ScenarioCompareView";

const MAX_COMPARE = 3;
function compareKey(e: GlobalHistoryEntry) {
  return `${e.slug}:${e.id}`;
}

const CALCULATOR_LOOKUP = ALL_CALCULATORS.map((c) => ({ slug: c.slug, title: c.title, category: c.category }));

function restoreUrl(entry: GlobalHistoryEntry): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(entry.inputs)) if (value) params.set(key, value);
  const qs = params.toString();
  return `/${entry.category}/${entry.slug}${qs ? `?${qs}` : ""}`;
}

export default function HistoryDashboard() {
  const [entries, setEntries] = useState<GlobalHistoryEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [compareMode, setCompareMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  useEffect(() => {
    // Client-only: reads localStorage across every calculator, so this can only happen
    // after mount — there's nothing to render on the server for a personal history page.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEntries(getAllHistory(CALCULATOR_LOOKUP));
  }, []);

  const filtered = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (!q) return true;
      return e.calculatorTitle.toLowerCase().includes(q) || e.summary.toLowerCase().includes(q) || e.label?.toLowerCase().includes(q);
    });
  }, [entries, query, categoryFilter]);

  function startRename(entry: GlobalHistoryEntry) {
    setRenamingId(entry.id);
    setRenameValue(entry.label ?? "");
  }
  function commitRename(entry: GlobalHistoryEntry) {
    const next = renameHistoryEntry(entry.slug, entry.id, renameValue.trim());
    setEntries((prev) => (prev ? prev.map((e) => (e.id === entry.id && e.slug === entry.slug ? { ...e, label: next.find((n) => n.id === entry.id)?.label } : e)) : prev));
    setRenamingId(null);
  }
  function remove(entry: GlobalHistoryEntry) {
    deleteHistoryEntry(entry.slug, entry.id);
    setEntries((prev) => (prev ? prev.filter((e) => !(e.id === entry.id && e.slug === entry.slug)) : prev));
  }
  function clearAll() {
    if (!entries) return;
    const slugs = new Set(entries.map((e) => e.slug));
    slugs.forEach((slug) => clearHistory(slug));
    setEntries([]);
  }

  // Comparison only makes sense between saved runs of the SAME calculator — once one
  // is selected, only that calculator's other entries become selectable.
  const selectedSlug = entries?.find((e) => selectedKeys.includes(compareKey(e)))?.slug ?? null;
  const compareEntries = (entries ?? []).filter((e) => selectedKeys.includes(compareKey(e)));

  function toggleSelect(entry: GlobalHistoryEntry) {
    const key = compareKey(entry);
    setSelectedKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (selectedSlug && entry.slug !== selectedSlug) return prev; // different calculator — not comparable
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, key];
    });
  }
  function exitCompareMode() {
    setCompareMode(false);
    setSelectedKeys([]);
    setShowCompare(false);
  }

  if (entries === null) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading your history…</p>;
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900/60">
        <p className="text-zinc-600 dark:text-zinc-400">No saved calculations yet.</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
          Open any calculator, run a calculation, and hit <span className="font-medium">Save to history</span> — it&rsquo;ll show up here, across
          every calculator on the site.
        </p>
        <Link href="/" className="mt-4 inline-block rounded-full bg-teal-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-500">
          Browse calculators
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your history…"
          aria-label="Search history"
          className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => (compareMode ? exitCompareMode() : setCompareMode(true))}
          className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
            compareMode
              ? "border-teal-600 bg-teal-600 text-white hover:bg-teal-500"
              : "border-zinc-300 text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
        >
          {compareMode ? "Cancel compare" : "Compare scenarios"}
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-400 dark:hover:bg-red-950/30"
        >
          Clear all history
        </button>
      </div>

      {compareMode && (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {selectedSlug
              ? `Pick up to ${MAX_COMPARE} saved runs of the same calculator to compare — other calculators are grayed out.`
              : "Check 2–3 saved runs of the same calculator to compare them side by side."}
          </p>
          {selectedKeys.length >= 2 && (
            <button
              type="button"
              onClick={() => setShowCompare(true)}
              className="rounded-full bg-teal-600 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-teal-500"
            >
              Compare {selectedKeys.length} selected
            </button>
          )}
        </div>
      )}

      {showCompare && compareEntries.length >= 2 && (
        <div className="mt-4">
          <ScenarioCompareView entries={compareEntries} onClose={() => setShowCompare(false)} />
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">No history matches your search.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {filtered.map((entry) => {
            const key = compareKey(entry);
            const disabledForCompare = compareMode && !!selectedSlug && entry.slug !== selectedSlug && !selectedKeys.includes(key);
            return (
            <li
              key={key}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                selectedKeys.includes(key)
                  ? "border-teal-400 bg-teal-50/50 dark:border-teal-700 dark:bg-teal-950/20"
                  : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60"
              } ${disabledForCompare ? "opacity-40" : ""}`}
            >
              {compareMode && (
                <input
                  type="checkbox"
                  checked={selectedKeys.includes(key)}
                  disabled={disabledForCompare || (!selectedKeys.includes(key) && selectedKeys.length >= MAX_COMPARE)}
                  onChange={() => toggleSelect(entry)}
                  aria-label={`Select ${entry.calculatorTitle} scenario for comparison`}
                  className="h-4 w-4 shrink-0 accent-teal-600"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[11px] font-medium text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                    {entry.calculatorTitle}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">{new Date(entry.timestamp).toLocaleString()}</span>
                </div>
                {renamingId === entry.id ? (
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && commitRename(entry)}
                      placeholder="Name this calculation…"
                      className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button type="button" onClick={() => commitRename(entry)} className="text-xs font-medium text-teal-600 dark:text-teal-400">
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="mt-1 truncate text-sm text-zinc-700 dark:text-zinc-300">
                    {entry.label && <span className="font-medium">{entry.label}: </span>}
                    {entry.summary}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-3 text-xs font-medium">
                <Link href={restoreUrl(entry)} className="text-teal-600 hover:underline dark:text-teal-400">
                  Open
                </Link>
                <button type="button" onClick={() => startRename(entry)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                  Rename
                </button>
                <button type="button" onClick={() => remove(entry)} className="text-zinc-400 hover:text-red-600 dark:hover:text-red-400">
                  Delete
                </button>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      <p className="mt-6 text-xs text-zinc-400 dark:text-zinc-600">
        Saved only on this device, in this browser — no account, no login, nothing sent to a server. Clearing your browser data or switching
        devices will lose it.
      </p>
    </div>
  );
}
