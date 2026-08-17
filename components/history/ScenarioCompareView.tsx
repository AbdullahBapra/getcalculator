"use client";

import { getCalculator } from "@/lib/calculators/registry";
import type { GlobalHistoryEntry } from "@/lib/history";

export default function ScenarioCompareView({ entries, onClose }: { entries: GlobalHistoryEntry[]; onClose: () => void }) {
  if (entries.length === 0) return null;
  const def = getCalculator(entries[0].slug);
  if (!def) return null;

  const outputs = entries.map((e) => {
    try {
      return def.calculate(e.inputs);
    } catch {
      return { results: [], error: "Could not recompute this scenario." };
    }
  });

  // Union of every result label seen across scenarios, in first-seen order — some
  // scenarios may have different conditional fields active, so not every row applies
  // to every column.
  const labels: string[] = [];
  outputs.forEach((o) => o.results.forEach((r) => { if (!labels.includes(r.label)) labels.push(r.label); }));

  return (
    <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm dark:border-teal-900 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          Comparing {entries.length} scenarios — {def.title}
        </h2>
        <button type="button" onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
          Close
        </button>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">Result</th>
              {entries.map((e, i) => (
                <th key={`${e.slug}-${e.id}`} className="p-2 text-left font-medium text-zinc-800 dark:text-zinc-200">
                  {e.label || `Scenario ${i + 1}`}
                  <div className="text-xs font-normal text-zinc-400 dark:text-zinc-600">{new Date(e.timestamp).toLocaleDateString()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {labels.map((label) => (
              <tr key={label} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="p-2 text-zinc-500 dark:text-zinc-400">{label}</td>
                {outputs.map((o, i) => {
                  const r = o.results.find((row) => row.label === label);
                  return (
                    <td key={i} className="p-2 font-medium text-zinc-800 dark:text-zinc-200">
                      {r ? `${r.value}${r.unit ? ` ${r.unit}` : ""}` : <span className="text-zinc-300 dark:text-zinc-700">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-zinc-400 dark:text-zinc-600">
        Each scenario is recalculated fresh from its saved inputs — not just its saved summary — so this stays accurate even if you&rsquo;re
        comparing a scenario saved a while ago.
      </p>
    </div>
  );
}
