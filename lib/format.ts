// Formatting helpers shared by every calculator module.

export function n(input: string | undefined, fallback = 0): number {
  if (input === undefined || input === "") return fallback;
  const v = Number(input);
  return Number.isFinite(v) ? v : fallback;
}

export function fmtNumber(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
}

export function fmtCurrency(value: number, currency = "USD", digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  try {
    return value.toLocaleString("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    return `${currency} ${fmtNumber(value, digits)}`;
  }
}

export function fmtPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  return `${fmtNumber(value, digits)}%`;
}

export function round(value: number, digits = 2): number {
  const f = Math.pow(10, digits);
  return Math.round((value + Number.EPSILON) * f) / f;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
