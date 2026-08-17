// Site-wide currency infrastructure: a shared rate snapshot, conversion, and a parser
// that recovers {code, amount} from an already-formatted result string like "$1,199.10"
// or "£7,500.00" — so the display-currency switcher can show a converted equivalent
// without every calculator needing to be rewritten to carry raw currency metadata.
import { fmtCurrency } from "@/lib/format";

export interface CurrencyDef {
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCIES: CurrencyDef[] = [
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "JPY", symbol: "¥", label: "Japanese Yen" },
  { code: "CAD", symbol: "CA$", label: "Canadian Dollar" },
  { code: "AUD", symbol: "AU$", label: "Australian Dollar" },
  { code: "CHF", symbol: "CHF", label: "Swiss Franc" },
  { code: "CNY", symbol: "¥", label: "Chinese Yuan" },
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "PKR", symbol: "₨", label: "Pakistani Rupee" },
  { code: "MXN", symbol: "MX$", label: "Mexican Peso" },
  { code: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { code: "NZD", symbol: "NZ$", label: "New Zealand Dollar" },
  { code: "SGD", symbol: "S$", label: "Singapore Dollar" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "BRL", symbol: "R$", label: "Brazilian Real" },
];

// Static, illustrative FX snapshot (USD base) — not a live feed. Shared by the Currency
// Calculator and the site-wide display-currency switcher, so both stay in sync.
export const FX_TO_USD: Record<string, number> = {
  USD: 1, EUR: 1.08, GBP: 1.27, JPY: 0.0064, CAD: 0.73, AUD: 0.66,
  CHF: 1.12, CNY: 0.14, INR: 0.012, PKR: 0.0036, MXN: 0.05, AED: 0.27,
  NZD: 0.6, SGD: 0.74, ZAR: 0.055, BRL: 0.17,
};

export const CURRENCY_OPTIONS = CURRENCIES.map((c) => ({ value: c.code, label: `${c.code} (${c.symbol})` }));

export function getCurrency(code: string): CurrencyDef | undefined {
  return CURRENCIES.find((c) => c.code === code);
}

export function convertAmount(amount: number, from: string, to: string): number {
  const fromRate = FX_TO_USD[from] ?? 1;
  const toRate = FX_TO_USD[to] ?? 1;
  return (amount * fromRate) / toRate;
}

// Currency symbols that can appear in a calculator's already-formatted result string,
// mapped back to an ISO code. Longest/most specific patterns first so e.g. "CA$" isn't
// mis-parsed as a plain "$".
const SYMBOL_PATTERNS: { code: string; pattern: string }[] = [
  { code: "GBP", pattern: "£" },
  { code: "EUR", pattern: "€" },
  { code: "USD", pattern: "$" },
];

/** Recover {code, amount} from a formatted string like "$1,199.10" or "-£500.00". */
export function parseCurrencyValue(text: string): { code: string; amount: number } | null {
  for (const { code, pattern } of SYMBOL_PATTERNS) {
    if (text.includes(pattern)) {
      const numeric = text.replace(/[^0-9.-]/g, "");
      const amount = Number(numeric);
      return Number.isFinite(amount) ? { code, amount } : null;
    }
  }
  return null;
}

export function formatConverted(amount: number, fromCode: string, toCode: string): string {
  return fmtCurrency(convertAmount(amount, fromCode, toCode), toCode);
}

/** Re-label an already-formatted money string in a new currency, keeping the SAME number —
 *  no FX math. Use this for calculators where "currency" is just a unit (tip %, discount,
 *  loan math, budgeting): the user typed "60" meaning 60 of whatever currency they're
 *  working in, so the honest move is to relabel, not pretend we converted their input. */
export function relabelCurrency(formattedValue: string, toCode: string): string | null {
  const parsed = parseCurrencyValue(formattedValue);
  if (!parsed) return null;
  return fmtCurrency(parsed.amount, toCode);
}
