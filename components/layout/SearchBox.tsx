"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { searchCalculators } from "@/lib/calculators/registry";

interface Props {
  className?: string;
  /** When set, the placeholder types out each example, pauses, deletes it, and moves to
   *  the next — purely cosmetic on an empty, unfocused box, and only used on the
   *  homepage hero. It only ever touches the `placeholder` attribute, never `value`, so
   *  it can't interfere with anything the person actually types. */
  rotatingPlaceholders?: string[];
}

const DEFAULT_PLACEHOLDER = "Search 205 calculators…";

export default function SearchBox({ className = "", rotatingPlaceholders }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const results = useMemo(() => searchCalculators(query, 8), [query]);

  useEffect(() => {
    if (!rotatingPlaceholders || rotatingPlaceholders.length === 0) return;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;
    let phraseIndex = 0;

    function typePhrase() {
      const phrase = `Try "${rotatingPlaceholders![phraseIndex]}"…`;
      let charIndex = 0;
      const typeChar = () => {
        if (cancelled) return;
        charIndex++;
        setPlaceholder(phrase.slice(0, charIndex));
        timeoutId = setTimeout(charIndex < phrase.length ? typeChar : () => (timeoutId = setTimeout(eraseChar, 1500)), 45);
      };
      const eraseChar = () => {
        if (cancelled) return;
        charIndex--;
        setPlaceholder(phrase.slice(0, charIndex));
        if (charIndex > 0) {
          timeoutId = setTimeout(eraseChar, 22);
        } else {
          phraseIndex = (phraseIndex + 1) % rotatingPlaceholders!.length;
          timeoutId = setTimeout(typePhrase, 350);
        }
      };
      typeChar();
    }

    timeoutId = setTimeout(typePhrase, 700);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [rotatingPlaceholders]);

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
        placeholder={placeholder}
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
