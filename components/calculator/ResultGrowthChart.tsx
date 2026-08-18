"use client";

import { useEffect, useState } from "react";

interface Point {
  label: string;
  value: number;
  displayValue: string;
}

/** A year-by-year growth chart — for results that are a TRAJECTORY (a balance compounding
 *  over time) rather than a static split. Bars grow in on mount instead of the donut's
 *  draw-in, since "growing upward" is literally what the data means here. Hovering (or
 *  tapping, on touch) any bar shows that year's value — this is the one chart on the
 *  site you can actually interrogate instead of just look at. */
export default function ResultGrowthChart({ points }: { points: Point[] }) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    // Plain useEffect, not requestAnimationFrame — see ResultChart.tsx for why.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const max = Math.max(...points.map((p) => p.value), 1);
  // Thin the x-axis labels so they don't collide on a 20+ point series — always keep
  // the first and last, spread the rest out.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  return (
    <div>
      <div className="flex h-36 items-end gap-1">
        {points.map((p, i) => {
          const heightPct = Math.max(2, (p.value / max) * 100);
          const isActive = active === i;
          return (
            <div
              key={i}
              className="group relative flex h-full flex-1 cursor-pointer flex-col items-center justify-end"
              onMouseEnter={() => setActive(i)}
              onMouseLeave={() => setActive(null)}
              onClick={() => setActive(isActive ? null : i)}
            >
              {isActive && (
                <div className="absolute bottom-full z-10 mb-1.5 rounded-lg bg-zinc-900 px-2 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900">
                  {p.label}: {p.displayValue}
                </div>
              )}
              <div
                className={`w-full rounded-t-sm transition-all duration-700 ease-out ${isActive ? "bg-teal-500 dark:bg-teal-400" : "bg-teal-500/70 group-hover:bg-teal-500 dark:bg-teal-400/60 dark:group-hover:bg-teal-400"}`}
                style={{ height: mounted ? `${heightPct}%` : "0%", transitionDelay: `${i * 25}ms` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
        {points.map((p, i) => (
          <div key={i} className="flex-1 text-center">
            {i % labelEvery === 0 || i === points.length - 1 ? p.label : ""}
          </div>
        ))}
      </div>
    </div>
  );
}
