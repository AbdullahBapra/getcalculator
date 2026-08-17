// Shared math used across every financial calculator module, so loan/annuity/NPV
// logic is written once and reused rather than re-derived per calculator.
import type { CalcOutput } from "./types";
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

/** Bisection search for the largest `price` where cost(price) <= target (cost assumed increasing in price). */
export function solveMaxByBisection(target: number, cost: (x: number) => number, lo: number, hi: number): number {
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (cost(mid) > target) hi = mid;
    else lo = mid;
  }
  return lo;
}
