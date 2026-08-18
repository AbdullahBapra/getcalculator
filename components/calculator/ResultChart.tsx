"use client";

import { useEffect, useState } from "react";

interface Segment {
  label: string;
  value: number;
  displayValue: string;
}

// A single, consistent teal-forward palette (not a rainbow) so this stays visually part
// of the same site instead of introducing new brand colors — an amber accent only for a
// 3rd/4th segment, where a pure-teal ring would start to blur two segments together.
const PALETTE = [
  { stroke: "stroke-teal-600 dark:stroke-teal-400", dot: "bg-teal-600 dark:bg-teal-400" },
  { stroke: "stroke-teal-300 dark:stroke-teal-700", dot: "bg-teal-300 dark:bg-teal-700" },
  { stroke: "stroke-amber-400 dark:stroke-amber-500", dot: "bg-amber-400 dark:bg-amber-500" },
  { stroke: "stroke-zinc-300 dark:stroke-zinc-600", dot: "bg-zinc-300 dark:bg-zinc-600" },
];

const R = 56;
const STROKE = 16;
const SIZE = 132;
const CIRCUMFERENCE = 2 * Math.PI * R;

/** An animated donut-chart breakdown — draws itself in on mount rather than appearing
 *  instantly, using the classic SVG stroke-dasharray trick (render at 0, then let a CSS
 *  transition animate it out to the real value). Purely a visualization of numbers the
 *  calculator already computed; it has no logic of its own that could disagree with the
 *  actual result. */
export default function ResultChart({ segments }: { segments: Segment[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Plain useEffect, not requestAnimationFrame — rAF is tied to the compositor's
    // paint cycle and simply never fires for a page that isn't actively being painted
    // (a backgrounded tab, a non-visible preview pane), which would leave this chart
    // stuck permanently undrawn. useEffect's scheduling doesn't have that dependency.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  if (total <= 0) return null;

  // Pure reduce (not a mutated `let` inside the map below) so nothing gets reassigned
  // during render — each arc's own length plus a running dash-offset, computed as an
  // immutable accumulator instead of a side effect.
  const arcs = segments.reduce<{ len: number; dashOffset: number; cumulative: number }[]>((acc, seg) => {
    const prevCumulative = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    const frac = Math.max(0, seg.value) / total;
    const len = frac * CIRCUMFERENCE;
    return [...acc, { len, dashOffset: -prevCumulative, cumulative: prevCumulative + len }];
  }, []);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90 shrink-0" role="img" aria-label="Breakdown chart">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-zinc-100 dark:stroke-zinc-800" />
        {segments.map((seg, i) => {
          const { len, dashOffset } = arcs[i];
          const palette = PALETTE[i % PALETTE.length];
          return (
            <circle
              key={i}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="butt"
              className={`${palette.stroke} transition-[stroke-dasharray] duration-[900ms] ease-out`}
              strokeDasharray={mounted ? `${len} ${CIRCUMFERENCE - len}` : `0 ${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              style={{ transitionDelay: `${i * 120}ms` }}
            />
          );
        })}
      </svg>
      <ul className="flex w-full flex-1 flex-col gap-2.5">
        {segments.map((seg, i) => {
          const pct = Math.round((Math.max(0, seg.value) / total) * 100);
          const palette = PALETTE[i % PALETTE.length];
          return (
            <li key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${palette.dot}`} />
                <span className="truncate">{seg.label}</span>
              </span>
              <span className="shrink-0 font-semibold text-zinc-800 dark:text-zinc-200">
                {seg.displayValue} <span className="font-normal text-zinc-400 dark:text-zinc-500">· {pct}%</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
