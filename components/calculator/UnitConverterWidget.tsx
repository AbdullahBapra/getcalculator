"use client";

import { useMemo, useState } from "react";
import { convert, getUnitCategory, type UnitCategoryKey } from "@/lib/units";
import { fmtNumber } from "@/lib/format";
import { useFullscreen } from "./useFullscreen";
import FullscreenButton from "./FullscreenButton";

interface Props {
  categoryKey: UnitCategoryKey;
  initialFrom?: string;
  initialTo?: string;
}

export default function UnitConverterWidget({ categoryKey, initialFrom, initialTo }: Props) {
  const { ref, isFullscreen, supported, toggle } = useFullscreen<HTMLDivElement>();
  const category = getUnitCategory(categoryKey);
  const [value, setValue] = useState("1");
  const [fromUnit, setFromUnit] = useState(initialFrom ?? category?.units[0]?.id ?? "");
  const [toUnit, setToUnit] = useState(initialTo ?? category?.units[1]?.id ?? category?.units[0]?.id ?? "");

  const result = useMemo(() => {
    if (!category) return NaN;
    return convert(category, fromUnit, toUnit, Number(value));
  }, [category, fromUnit, toUnit, value]);

  if (!category) return null;

  function swap() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }

  // text-base (16px), not text-sm — iOS Safari auto-zooms the page on focus for any
  // input/select under 16px; this widget renders on every converter page (200+).
  const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

  return (
    <div ref={ref} className={isFullscreen ? "flex h-full w-full items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950" : ""}>
      <div className={isFullscreen ? "w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" : "rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"}>
      {supported && (
        <div className="mb-3 flex justify-end">
          <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">From</label>
          <input
            type="number"
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className={selectClass}
          />
          <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} className={selectClass}>
            {category.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({u.abbr})
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={swap}
          aria-label="Swap units"
          title="Swap units"
          className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 16V4M7 4L3 8M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4" />
          </svg>
        </button>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">To</label>
          {/* Same dark LCD-style display used by every calculator on the site —
              recalculates live on every keystroke, no "convert" button needed. */}
          <div className="overflow-x-auto rounded-lg bg-zinc-900 px-3 py-2.5 text-right font-mono text-lg font-semibold text-white dark:bg-black">
            {Number.isFinite(result) ? fmtNumber(result, 6) : <span className="text-zinc-600">—</span>}
          </div>
          <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} className={selectClass}>
            {category.units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} ({u.abbr})
              </option>
            ))}
          </select>
        </div>
      </div>

      {Number.isFinite(result) && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          {value || 0} {category.units.find((u) => u.id === fromUnit)?.label} = <strong className="text-zinc-800 dark:text-zinc-200">{fmtNumber(result, 6)}</strong>{" "}
          {category.units.find((u) => u.id === toUnit)?.label}
        </p>
      )}
      </div>
    </div>
  );
}
