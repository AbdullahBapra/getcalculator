"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_CALCULATORS } from "@/lib/calculators/registry";
import { fuzzySearch } from "@/lib/search";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const results = useMemo(() => fuzzySearch(ALL_CALCULATORS, query, 8), [query]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    // The mobile bottom tab bar's Search button has no keyboard shortcut to press, so
    // it opens this same palette via a plain window event instead — keeps this
    // component the single source of truth for the open state, no prop drilling.
    function onExternalOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("gc:open-search", onExternalOpen);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("gc:open-search", onExternalOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      // Reset the dialog's own state when it opens — tied to the open/close toggle
      // itself, not derivable from props, so this has to live in an effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      setSelected(0);
      // Focus after the overlay mounts.
      const t = setTimeout(() => inputRef.current?.focus(), 10);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    // Keep the highlighted row in bounds as the result list changes underneath it.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(0);
  }, [query]);

  function go(idx: number) {
    const item = results[idx];
    if (!item) return;
    setOpen(false);
    router.push(`/${item.category}/${item.slug}`);
  }

  function onKeyDownInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(results.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(selected);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-24 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div
        role="dialog"
        aria-label="Search calculators"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDownInput}
          placeholder="Search 205 calculators… (try a typo, we'll still find it)"
          aria-label="Search calculators"
          className="w-full border-b border-zinc-200 px-5 py-4 text-base text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <ul className="max-h-80 overflow-y-auto py-2">
          {query.trim() === "" ? (
            <li className="px-5 py-3 text-sm text-zinc-400 dark:text-zinc-600">Start typing to search every calculator on the site.</li>
          ) : results.length === 0 ? (
            <li className="px-5 py-3 text-sm text-zinc-400 dark:text-zinc-600">No calculators match &ldquo;{query}&rdquo;.</li>
          ) : (
            results.map((r, idx) => (
              <li key={r.slug}>
                <button
                  type="button"
                  onMouseEnter={() => setSelected(idx)}
                  onClick={() => go(idx)}
                  className={`flex w-full items-center justify-between px-5 py-2.5 text-left text-sm ${
                    idx === selected ? "bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300" : "text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{r.title}</span>
                  <span className="text-xs capitalize text-zinc-400 dark:text-zinc-600">{r.category}</span>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          <span>↑↓ to navigate · Enter to open</span>
          <span>Esc to close</span>
        </div>
      </div>
    </div>
  );
}
