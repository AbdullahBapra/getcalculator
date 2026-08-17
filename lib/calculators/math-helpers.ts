// Shared math used across every math calculator module.

export function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) [a, b] = [b, a % b];
  return a || 1;
}
export function lcm(a: number, b: number): number {
  return Math.abs(Math.round(a) * Math.round(b)) / gcd(a, b);
}
export function factorial(k: number): number {
  if (k < 0 || k > 170) return NaN;
  let r = 1;
  for (let i = 2; i <= k; i++) r *= i;
  return r;
}
export function parseNumberList(raw: string): number[] {
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(Number)
    .filter((v) => Number.isFinite(v));
}
export function computeStats(values: number[]) {
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = count ? sum / count : NaN;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(count / 2);
  const median = count ? (count % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2) : NaN;
  const freq = new Map<number, number>();
  values.forEach((v) => freq.set(v, (freq.get(v) ?? 0) + 1));
  const maxFreq = Math.max(0, ...freq.values());
  const modes = maxFreq > 1 ? [...freq.entries()].filter(([, c]) => c === maxFreq).map(([v]) => v) : [];
  const range = count ? sorted[count - 1] - sorted[0] : NaN;
  const variancePop = count ? values.reduce((a, v) => a + (v - mean) ** 2, 0) / count : NaN;
  const varianceSample = count > 1 ? values.reduce((a, v) => a + (v - mean) ** 2, 0) / (count - 1) : NaN;
  return {
    count,
    sum,
    mean,
    median,
    modes,
    range,
    stdDevPop: Math.sqrt(variancePop),
    stdDevSample: Math.sqrt(varianceSample),
    varianceSample,
  };
}
// erf approximation (Abramowitz & Stegun 7.1.26) for the z-score / p-value percentile
export function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}
export function normalCdf(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}
