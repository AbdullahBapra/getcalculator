// Shared math used across every financial calculator module, so loan/annuity/NPV
// logic is written once and reused rather than re-derived per calculator.
import type { BreakdownSegment, CalcOutput } from "./types";
import { fmtCurrency, fmtNumber } from "../format";

/** Standard amortizing-loan periodic payment. r = periodic rate, nper = number of periods. */
export function monthlyPayment(principal: number, r: number, nper: number): number {
  if (principal <= 0 || nper <= 0) return 0;
  if (r === 0) return principal / nper;
  return (principal * r * Math.pow(1 + r, nper)) / (Math.pow(1 + r, nper) - 1);
}

/** Future value of a series of equal periodic contributions (ordinary annuity). */
export function fvAnnuity(payment: number, r: number, nper: number): number {
  if (nper <= 0) return 0;
  if (r === 0) return payment * nper;
  return payment * ((Math.pow(1 + r, nper) - 1) / r);
}

/** Present value of a series of equal periodic payments (ordinary annuity). */
export function pvAnnuity(payment: number, r: number, nper: number): number {
  if (nper <= 0) return 0;
  if (r === 0) return payment * nper;
  return payment * ((1 - Math.pow(1 + r, -nper)) / r);
}

/** Remaining balance on an amortizing loan after `paid` of `nper` periods. */
export function remainingBalance(principal: number, r: number, nper: number, paid: number): number {
  if (r === 0) return Math.max(0, principal * (1 - paid / nper));
  const pmt = monthlyPayment(principal, r, nper);
  const bal = principal * Math.pow(1 + r, paid) - pmt * ((Math.pow(1 + r, paid) - 1) / r);
  return Math.max(0, bal);
}

/** Iteratively simulate paying off a balance with a fixed payment. Returns null if the payment never covers interest. */
export function payoffMonths(balance: number, aprPercent: number, payment: number): { months: number; totalInterest: number } | null {
  const r = aprPercent / 100 / 12;
  let bal = balance;
  let months = 0;
  let totalInterest = 0;
  const maxMonths = 1200;
  if (payment <= bal * r) return null;
  while (bal > 0 && months < maxMonths) {
    const interest = bal * r;
    bal = bal + interest - payment;
    if (bal < 0) bal = 0;
    totalInterest += interest;
    months++;
  }
  return { months, totalInterest };
}

/** Iteratively simulate paying off a balance with a fixed payment; returns months + total interest as a CalcOutput. */
export function payoffCalc(balance: number, aprPercent: number, payment: number): CalcOutput {
  const result = payoffMonths(balance, aprPercent, payment);
  if (!result) {
    return {
      results: [{ label: "Result", value: "Never pays off" }],
      error: "This payment doesn't cover the monthly interest — the balance will never be paid off. Increase your monthly payment.",
    };
  }
  const { months, totalInterest } = result;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  const r = aprPercent / 100 / 12;
  return {
    results: [
      { label: "Time to Pay Off", value: `${years}y ${remMonths}m (${months} months)`, emphasis: true },
      { label: "Total Interest Paid", value: fmtCurrency(totalInterest) },
      { label: "Total Paid", value: fmtCurrency(balance + totalInterest) },
    ],
    steps: [
      `Monthly interest rate = ${fmtNumber(aprPercent)}% ÷ 12 = ${fmtNumber(r * 100, 4)}%`,
      `Simulated month-by-month: interest = balance × monthly rate, then the payment reduces the balance, until it reaches $0.`,
      `Result: ${months} months, ${fmtCurrency(totalInterest)} in total interest.`,
    ],
    ...loanBreakdown(balance, totalInterest),
  };
}

/** Net present value of an initial outflow followed by a series of periodic cash flows. */
export function npv(rate: number, initialOutflow: number, flows: number[]): number {
  let total = -initialOutflow;
  flows.forEach((cf, idx) => {
    total += cf / Math.pow(1 + rate, idx + 1);
  });
  return total;
}

/** Internal rate of return via bisection on NPV(rate) = 0. Returns null if no sign change is found. */
export function irr(initialOutflow: number, flows: number[]): number | null {
  let lo = -0.99;
  let hi = 10;
  const f = (r: number) => npv(r, initialOutflow, flows);
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-6) return mid;
    if (f(lo) * fm < 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/** Standard "principal vs. interest" donut-chart breakdown + a plain-language caption —
 *  shared by every loan-shaped calculator (personal, student, boat, RV, motorcycle,
 *  debt consolidation, ...) so each one gets the same visual/explanation quality
 *  without re-deriving the sentence by hand. `extra`, if given, is an additional slice
 *  (e.g. sales tax on an auto loan) folded into the same chart. */
export function loanBreakdown(principal: number, totalInterest: number, extra?: { label: string; value: number }): { breakdown: BreakdownSegment[]; chartCaption: string } {
  const breakdown: BreakdownSegment[] = [
    { label: "Principal", value: principal, displayValue: fmtCurrency(principal) },
    { label: "Total Interest", value: Math.max(0, totalInterest), displayValue: fmtCurrency(totalInterest) },
  ];
  if (extra && extra.value > 0) breakdown.push({ label: extra.label, value: extra.value, displayValue: fmtCurrency(extra.value) });
  const chartCaption =
    principal > 0
      ? `For every dollar borrowed, you pay back ${fmtCurrency((principal + Math.max(0, totalInterest)) / principal)} — interest adds ${fmtNumber((Math.max(0, totalInterest) / principal) * 100, 0)}% on top.`
      : `Interest of ${fmtCurrency(totalInterest)} on top of the amount borrowed.`;
  return { breakdown, chartCaption };
}

/** Year-by-year future-value series (monthly compounding + monthly contributions) — the
 *  data behind the "growth over time" bar chart, shared by every investment/retirement
 *  calculator that projects a balance forward, so each one doesn't recompute its own loop. */
export function fvGrowthSeries(initial: number, monthlyContribution: number, annualRatePercent: number, years: number): { label: string; value: number; displayValue: string }[] {
  const monthlyRate = annualRatePercent / 100 / 12;
  const wholeYears = Math.max(1, Math.round(years));
  return Array.from({ length: wholeYears }, (_, idx) => {
    const y = idx + 1;
    const value = initial * Math.pow(1 + monthlyRate, y * 12) + fvAnnuity(monthlyContribution, monthlyRate, y * 12);
    return { label: `Yr ${y}`, value, displayValue: fmtCurrency(value) };
  });
}

/** Bisection search for the largest `price` where cost(price) <= target (cost assumed increasing in price). */
export function solveMaxByBisection(target: number, cost: (x: number) => number, lo: number, hi: number): number {
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cost(mid) > target) hi = mid;
    else lo = mid;
  }
  return lo;
}
