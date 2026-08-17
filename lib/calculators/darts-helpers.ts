// Shared darts checkout logic used by both the fallback form definition
// and the live DartsScorerWidget.
export interface DartOption {
  label: string;
  value: number;
  isDouble: boolean;
}

export const DART_OPTIONS: DartOption[] = [];
for (let k = 1; k <= 20; k++) DART_OPTIONS.push({ label: `S${k}`, value: k, isDouble: false });
DART_OPTIONS.push({ label: "Bull (25)", value: 25, isDouble: false });
for (let k = 1; k <= 20; k++) DART_OPTIONS.push({ label: `D${k}`, value: k * 2, isDouble: true });
DART_OPTIONS.push({ label: "D-Bull (50)", value: 50, isDouble: true });
for (let k = 1; k <= 20; k++) DART_OPTIONS.push({ label: `T${k}`, value: k * 3, isDouble: false });

export const DOUBLES = DART_OPTIONS.filter((d) => d.isDouble);
export const BOGEY_SCORES = new Set([169, 168, 166, 165, 163, 162, 159]);

export function findCheckout(score: number): DartOption[] | null {
  if (score < 2 || score > 170 || BOGEY_SCORES.has(score)) return null;
  const oneDart = DOUBLES.find((d) => d.value === score);
  if (oneDart) return [oneDart];
  for (const first of DART_OPTIONS) {
    const rem = score - first.value;
    const finishDouble = DOUBLES.find((d) => d.value === rem);
    if (finishDouble) return [first, finishDouble];
  }
  for (const first of DART_OPTIONS) {
    for (const second of DART_OPTIONS) {
      const rem = score - first.value - second.value;
      const finishDouble = DOUBLES.find((d) => d.value === rem);
      if (finishDouble) return [first, second, finishDouble];
    }
  }
  return null;
}
