"use client";

import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "./CurrencyContext";

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value)}
      aria-label="Display currency"
      title="Show a converted equivalent for money results in this currency"
      // text-base (16px), not text-sm — iOS Safari auto-zooms the page on focus for any
      // select/input under 16px, same rule as the number fields in Field.tsx.
      className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-base text-zinc-700 outline-none transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} {c.symbol}
        </option>
      ))}
    </select>
  );
}
