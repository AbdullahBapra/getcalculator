"use client";

import { useEffect, useState } from "react";

interface Zone {
  label: string;
  /** upper bound of this zone on the value's scale */
  to: number;
  barClass: string;
  textClass: string;
}

interface Props {
  value: number;
  min: number;
  max: number;
  zones: Zone[];
  valueLabel: string;
}

/** A spectrum bar with a sliding marker — for results that mean "where do I fall on a
 *  range" (BMI, body fat %, debt-to-income) rather than "parts of a whole." A donut
 *  would be the wrong shape for this kind of answer; this is a fever-chart, not a pie. */
export default function ResultGauge({ value, min, max, zones, valueLabel }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // Plain useEffect, not requestAnimationFrame — see ResultChart.tsx for why.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const clamped = Math.min(max, Math.max(min, value));
  const pct = ((clamped - min) / (max - min)) * 100;
  const activeZone = zones.find((z) => value <= z.to) ?? zones[zones.length - 1];

  return (
    <div>
      <div className="relative pt-7">
        <div
          className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-[left] duration-700 ease-out"
          style={{ left: `${mounted ? pct : 0}%` }}
        >
          <span className="rounded-full bg-zinc-900 px-2 py-1 text-xs font-bold whitespace-nowrap text-white shadow dark:bg-white dark:text-zinc-900">
            {valueLabel}
          </span>
          <span className="-mt-1 h-2 w-2 rotate-45 bg-zinc-900 dark:bg-white" />
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {zones.map((z, i) => {
            const prevTo = i > 0 ? zones[i - 1].to : min;
            const widthPct = ((Math.min(max, z.to) - Math.max(min, prevTo)) / (max - min)) * 100;
            return <div key={i} className={`h-full ${z.barClass}`} style={{ width: `${Math.max(0, widthPct)}%` }} />;
          })}
        </div>
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
        {zones.map((z, i) => (
          <span key={i}>{z.label}</span>
        ))}
      </div>
      <p className={`mt-3 text-sm font-semibold ${activeZone.textClass}`}>{activeZone.label}</p>
    </div>
  );
}
