"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getCalculator } from "@/lib/calculators/registry";
import type { CalcOutput, FieldDef } from "@/lib/calculators/types";
import { relabelCurrency, getCurrency } from "@/lib/currency";
import { useCurrency } from "@/components/currency/CurrencyContext";
import CurrencySwitcher from "@/components/currency/CurrencySwitcher";
import { getHistory, addHistoryEntry, clearHistory as clearHistoryStorage, type HistoryEntry } from "@/lib/history";
import Field from "./Field";

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
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
        {showCurrencyPicker && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800/60">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">Currency for this calculator</span>
            <CurrencySwitcher />
          </div>
        )}
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          {displayFields.map((f) => (
            <div key={f.name} className={wideField(f.name) ? "sm:col-span-2" : ""}>
              <Field field={f} value={inputs[f.name] ?? ""} onChange={handleChange} />
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

      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-7 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" aria-live="polite">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
            {output.error ? "Error" : primaryResult?.label ?? "Result"}
          </div>
          <div className="mt-2 overflow-x-auto whitespace-nowrap font-mono text-4xl font-bold tabular-nums text-teal-600 sm:text-[42px] dark:text-teal-400">
            {output.error ? (
              <span className="text-lg font-semibold text-red-600 dark:text-red-400">{output.error}</span>
            ) : primaryResult ? (
              `${displayValue(primaryResult.value)}${primaryResult.unit ? ` ${primaryResult.unit}` : ""}`
            ) : (
              <span className="text-zinc-300 dark:text-zinc-700">—</span>
            )}
          </div>
        </div>

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
          <details className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60" open>
            <summary className="cursor-pointer text-sm font-semibold text-zinc-800 dark:text-zinc-200">Show your work</summary>
            {output.formula && (
              <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">{output.formula}</p>
            )}
            {output.steps && (
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
                {output.steps.map((s, idx) => (
                  <li key={idx}>{s}</li>
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
