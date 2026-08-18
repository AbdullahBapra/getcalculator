"use client";

import { useEffect, useState } from "react";

interface Item {
  label: string;
  value: number;
  displayValue: string;
  highlight?: boolean;
}

/** Two (or a few) numbers sized up side by side as horizontal bars scaled to the
 *  largest value — for "this vs. that" results (before/after, you vs. the average,
 *  option A vs. option B) where neither a donut (not parts of a whole) nor a gauge
 *  (not a position on a range) is the right shape. Bars grow in from the left on
 *  mount; the `highlight` item (if any) gets the brand teal, the rest stay neutral
 *  so the comparison reads at a glance instead of everything competing for attention. */
export default function ResultCompare({ items }: { items: Item[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Plain useEffect, not requestAnimationFrame — see ResultChart.tsx for why.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const max = Math.max(...items.map((it) => Math.abs(it.value)), 1);

  return (
    <ul className="flex flex-col gap-3">
      {items.map((it, i) => {
        const widthPct = Math.max(2, (Math.abs(it.value) / max) * 100);
        return (
          <li key={i}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-zinc-600 dark:text-zinc-400">{it.label}</span>
              <span className={`shrink-0 font-semibold ${it.highlight ? "text-teal-700 dark:text-teal-400" : "text-zinc-800 dark:text-zinc-200"}`}>
                {it.displayValue}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className={`h-full rounded-full transition-[width] duration-700 ease-out ${it.highlight ? "bg-teal-500 dark:bg-teal-400" : "bg-zinc-400 dark:bg-zinc-600"}`}
                style={{ width: mounted ? `${widthPct}%` : "0%", transitionDelay: `${i * 100}ms` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
