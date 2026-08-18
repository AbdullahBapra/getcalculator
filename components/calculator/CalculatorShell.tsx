"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getCalculator } from "@/lib/calculators/registry";
import type { CalcOutput, FieldDef } from "@/lib/calculators/types";
import { relabelCurrency, getCurrency } from "@/lib/currency";
import { useCurrency } from "@/components/currency/CurrencyContext";
import CurrencySwitcher from "@/components/currency/CurrencySwitcher";
import { getHistory, addHistoryEntry, clearHistory as clearHistoryStorage, type HistoryEntry } from "@/lib/history";
import Field from "./Field";
import AnimatedNumber from "./AnimatedNumber";
import ResultChart from "./ResultChart";
import ResultGauge from "./ResultGauge";
import ResultGrowthChart from "./ResultGrowthChart";
import ResultCompare from "./ResultCompare";
import ResultTable from "./ResultTable";

interface Props {
  slug: string;
}

const EMPTY_OUTPUT: CalcOutput = { results: [] };

export default function CalculatorShell({ slug }: Props) {
  const def = getCalculator(slug);
  const { currency: displayCurrency } = useCurrency();

  const defaults = useMemo(() => {
    const d: Record<string, string> = {};
    for (const f of def?.fields ?? []) d[f.name] = String(f.defaultValue ?? "");
    return d;
  }, [def]);

  const [inputs, setInputs] = useState<Record<string, string>>(defaults);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Client-only sync: prefill inputs from a shared permalink's query string and
    // restore this device's saved history — deferred to after mount so server and
    // client markup match (URL/localStorage aren't available during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHydrated(true);
    try {
      const params = new URLSearchParams(window.location.search);
      if ([...params.keys()].length > 0) {
        setInputs((prev) => {
          const next = { ...prev };
          for (const f of def?.fields ?? []) {
            const v = params.get(f.name);
            if (v !== null) next[f.name] = v;
          }
          return next;
        });
      }
      setHistory(getHistory(slug));
    } catch {
      // private browsing / corrupted storage — ignore, defaults still work
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const output: CalcOutput = useMemo(() => {
    if (!def) return EMPTY_OUTPUT;
    try {
      return def.calculate(inputs);
    } catch {
      return { results: [], error: "Something went wrong with these inputs — double-check the values." };
    }
  }, [def, inputs]);

  const handleChange = useCallback((name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  }, []);

  // A brief "just updated" ring around the result card on every change — purely a
  // presentation flag (a boolean CSS class), never touches the actual computed value,
  // so it can't introduce a calculation bug even if this logic is wrong.
  const [pulse, setPulse] = useState(false);
  const prevResultRef = useRef<string | null>(null);
  useEffect(() => {
    const primary = output.results.find((r) => r.emphasis) ?? output.results[0];
    const current = primary ? `${primary.value}${primary.unit ?? ""}` : (output.error ?? null);
    if (prevResultRef.current !== null && prevResultRef.current !== current) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 700);
      prevResultRef.current = current;
      return () => clearTimeout(t);
    }
    prevResultRef.current = current;
  }, [output]);

  if (!def) return null;

  // Currency is a free-floating unit for most calculators (tip %, discount, loan math,
  // budgeting) — swapping the symbol is a pure relabel, not a conversion, because the
  // number the user typed already means "in whatever currency I'm working in." That's
  // NOT true for calculators tied to one country's actual tax code (US brackets, UK
  // stamp duty bands) — those stay fixed to their native currency, no picker shown.
  const canSwapCurrency = !def.jurisdiction;
  const hasMoneyFields = def.fields.some((f) => f.unit === "$");
  const currencySymbol = getCurrency(displayCurrency)?.symbol ?? "$";
  const showCurrencyPicker = canSwapCurrency && hasMoneyFields;

  const visibleFields = def.fields.filter((f) => !f.showIf || f.showIf(inputs));
  const displayFields: FieldDef[] =
    showCurrencyPicker && displayCurrency !== "USD"
      ? visibleFields.map((f) => (f.unit === "$" ? { ...f, unit: currencySymbol } : f))
      : visibleFields;
  const wideField = (name: string) => ["numbers", "courses", "items", "ip"].includes(name);
  const primaryResult = output.results.find((r) => r.emphasis) ?? output.results[0];
  const secondaryResults = output.results.filter((r) => r !== primaryResult);

  /** Re-labels a money result like "$1,199.10" into the selected display currency with
   *  the SAME number — "$1,199.10" becomes "€1,199.10", not an FX-converted amount.
   *  Falls back to the original string for non-money results or fixed-currency calculators. */
  function displayValue(value: string): string {
    if (!showCurrencyPicker || displayCurrency === "USD") return value;
    return relabelCurrency(value, displayCurrency) ?? value;
  }

  function saveToHistory() {
    if (output.error) return;
    const summary = output.results[0] ? `${output.results[0].label}: ${output.results[0].value}` : "Saved calculation";
    setHistory(addHistoryEntry(slug, inputs, summary));
  }

  function restoreEntry(entry: HistoryEntry) {
    setInputs((prev) => ({ ...prev, ...entry.inputs }));
  }

  function clearHistory() {
    setHistory([]);
    clearHistoryStorage(slug);
  }

  function flashCopied(what: string) {
    setCopied(what);
    setTimeout(() => setCopied(null), 1800);
  }

  function shareLink() {
    if (!def) return;
    const params = new URLSearchParams();
    for (const f of def.fields) if (inputs[f.name]) params.set(f.name, inputs[f.name]);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard
      ?.writeText(url)
      .then(() => flashCopied("link"))
      .catch(() => {});
  }

  function copyResult() {
    const text = output.results.map((r) => `${r.label}: ${displayValue(r.value)}${r.unit ? ` ${r.unit}` : ""}`).join("\n");
    navigator.clipboard
      ?.writeText(text)
      .then(() => flashCopied("result"))
      .catch(() => {});
  }

  return (
    // minmax(0, …) on both tracks, not just 1.1fr/1fr — without it a grid item is never
    // allowed to shrink below its content's intrinsic width, so one wide nowrap result
    // (e.g. hundreds of comma-separated random numbers) blows out the whole grid track,
    // and with it the page, into a giant horizontal scroll instead of scrolling locally.
    // Below lg this is a plain stacked flex column (order utilities need a flex/grid
    // container to do anything) so the sticky primary result, the form, and the rest of
    // the result cards can be reordered independently of their source order — a real
    // calculator app shows its live display above the keypad, not below it, so the
    // result comes first and stays pinned under the header while you edit the inputs
    // beneath it. At lg+ this reverts to the original two-column side-by-side layout via
    // explicit grid placement, since both sides are already fully visible there.
    <div className="flex flex-col gap-6 lg:grid lg:items-start lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <div
        className={`min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition-shadow sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/60 ${pulse ? "result-pulse" : ""} order-1 sticky top-[70px] z-20 lg:static lg:order-2 lg:col-start-2 lg:row-start-1`}
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-50 font-mono text-sm font-bold text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">
            =
          </span>
          <span className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            {output.error ? "Error" : primaryResult?.label ?? "Result"}
          </span>
        </div>
        <div className="mt-2 overflow-x-auto pl-[38px] font-mono text-4xl font-bold text-nowrap tabular-nums text-teal-600 sm:text-[42px] dark:text-teal-400">
          {output.error ? (
            <span className="text-lg font-semibold text-red-600 dark:text-red-400">{output.error}</span>
          ) : primaryResult ? (
            <AnimatedNumber value={`${displayValue(primaryResult.value)}${primaryResult.unit ? ` ${primaryResult.unit}` : ""}`} />
          ) : (
            <span className="text-zinc-300 dark:text-zinc-700">—</span>
          )}
        </div>
      </div>

      <div className="order-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:order-1 lg:col-start-1 lg:row-start-1 lg:row-span-2 dark:border-zinc-800 dark:bg-zinc-900/60">
        {showCurrencyPicker && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Currency for this calculator</span>
            <CurrencySwitcher />
          </div>
        )}
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          {displayFields.map((f) => (
            // A convertPair field's big text-2xl input plus its embedded unit-toggle
            // pill needs more room than a half-width grid cell has to give — squeezed
            // into one column, the pill's reserved padding leaves almost no space for
            // the digits themselves, so the value renders cropped. Always give it the
            // full row.
            <div key={f.name} className={wideField(f.name) || f.convertPair ? "sm:col-span-2" : ""}>
              <Field field={f} value={inputs[f.name] ?? ""} onChange={handleChange} allInputs={inputs} />
            </div>
          ))}
        </form>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveToHistory}
            className="min-h-[44px] rounded-full bg-teal-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-500"
          >
            Save to history
          </button>
          <button
            type="button"
            onClick={shareLink}
            className="min-h-[44px] rounded-full border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {copied === "link" ? "Link copied!" : "Copy shareable link"}
          </button>
        </div>
      </div>

      <div className="order-3 flex min-w-0 flex-col gap-4 lg:col-start-2 lg:row-start-2">
        {!output.error && output.breakdown && output.breakdown.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Breakdown</div>
            <ResultChart segments={output.breakdown.map((s) => ({ ...s, displayValue: displayValue(s.displayValue) }))} />
            {output.chartCaption && (
              <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.chartCaption}
              </p>
            )}
          </div>
        )}

        {!output.error && output.gauge && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Where this falls</div>
            <ResultGauge {...output.gauge} />
            {output.chartCaption && (
              <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.chartCaption}
              </p>
            )}
          </div>
        )}

        {!output.error && output.growthSeries && output.growthSeries.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Growth over time</div>
            <ResultGrowthChart points={output.growthSeries.map((p) => ({ ...p, displayValue: displayValue(p.displayValue) }))} />
            {output.chartCaption && (
              <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.chartCaption}
              </p>
            )}
          </div>
        )}

        {!output.error && output.compare && output.compare.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">How this compares</div>
            <ResultCompare items={output.compare.map((c) => ({ ...c, displayValue: displayValue(c.displayValue) }))} />
            {output.chartCaption && (
              <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.chartCaption}
              </p>
            )}
          </div>
        )}

        {!output.error && output.table && output.table.rows.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="mb-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Breakdown table</div>
            <ResultTable headers={output.table.headers} rows={output.table.rows.map((row) => row.map((cell) => displayValue(cell)))} />
            {output.chartCaption && (
              <p className="mt-4 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.chartCaption}
              </p>
            )}
          </div>
        )}

        {!output.error && (secondaryResults.length > 0 || (output.notes && output.notes.length > 0) || output.results.length > 0) && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            {secondaryResults.length > 0 && (
              <ul className="flex flex-col gap-2">
                {secondaryResults.map((r) => (
                  <li key={r.label} className="flex items-baseline justify-between gap-4">
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">{r.label}</span>
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                      {displayValue(r.value)}
                      {r.unit ? ` ${r.unit}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {output.notes && output.notes.length > 0 && (
              <div className="mt-3 flex flex-col gap-1.5 rounded-lg bg-teal-50 px-3 py-2.5 text-xs leading-relaxed text-teal-800 dark:bg-teal-950/30 dark:text-teal-300">
                {output.notes.map((note, idx) => (
                  <p key={idx}>{note}</p>
                ))}
              </div>
            )}
            {output.results.length > 0 && (
              <button type="button" onClick={copyResult} className="-ml-2 mt-2 inline-block min-h-11 px-2 py-3 text-xs font-medium leading-none text-teal-700 hover:underline dark:text-teal-400">
                {copied === "result" ? "Copied!" : "Copy result"}
              </button>
            )}
          </div>
        )}

        {(output.steps?.length || output.formula) && !output.error && (
          <details className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" open>
            <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold text-zinc-800 marker:content-none [&::-webkit-details-marker]:hidden dark:text-zinc-200">
              <span className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-50 text-xs text-teal-600 dark:bg-teal-950/50 dark:text-teal-400">ƒ</span>
                Show your work
              </span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-zinc-400 transition-transform duration-200 group-open:rotate-180"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </summary>
            {output.formula && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2.5 dark:bg-zinc-800">
                <span className="shrink-0 font-mono text-xs font-semibold text-teal-500 dark:text-teal-400">ƒ(x) =</span>
                <p className="overflow-x-auto font-mono text-xs text-zinc-700 dark:text-zinc-300">{output.formula}</p>
              </div>
            )}
            {output.steps && (
              <ol className="mt-4 flex flex-col">
                {output.steps.map((s, idx) => (
                  <li key={idx} className="relative flex gap-3 pb-4 last:pb-0">
                    {idx < output.steps!.length - 1 && (
                      <span className="absolute top-6 left-[11px] w-px bg-teal-200 dark:bg-teal-900" style={{ height: "calc(100% - 8px)" }} aria-hidden="true" />
                    )}
                    <span className="relative z-10 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-teal-100 text-[11px] font-bold text-teal-700 dark:bg-teal-900/60 dark:text-teal-300">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{s}</span>
                  </li>
                ))}
              </ol>
            )}
          </details>
        )}

        {hydrated && history.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Your recent calculations</h3>
              <div className="flex items-center gap-3">
                <Link href="/history" className="text-xs font-medium text-teal-600 hover:underline dark:text-teal-400">
                  View all history
                </Link>
                <button type="button" onClick={clearHistory} className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                  Clear
                </button>
              </div>
            </div>
            <ul className="mt-2 flex flex-col gap-1.5">
              {history.map((h) => (
                <li key={h.id}>
                  <button
                    type="button"
                    onClick={() => restoreEntry(h)}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    {h.summary} <span className="text-zinc-400 dark:text-zinc-600">— {new Date(h.timestamp).toLocaleString()}</span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-zinc-400 dark:text-zinc-600">Saved only on this device — no account needed.</p>
          </div>
        )}
      </div>
    </div>
  );
}
