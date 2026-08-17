// Shared UK tax/employment math for the UK employment & property calculators.
// Figures below reflect rates researched for tax year 2026/27 (see UK_IRELAND_VERTICAL_PLAN.md
// for sources: gov.uk, HMRC, Revenue Scotland, gov.wales). These are law-driven and change on
// a schedule (income tax/NI thresholds typically each 6 April; SDLT/LBTT/LTT bands can change
// at any Budget) — every calculator using these should show the RatesBanner "current as of" note.

/** Generic progressive band calculator: thresholds are cumulative upper bounds, rates align 1:1. */
export function taxAtBands(income: number, thresholds: number[], rates: number[]): number {
  let tax = 0;
  let lower = 0;
  for (let i = 0; i < thresholds.length; i++) {
    const upper = thresholds[i];
    if (income > lower) {
      tax += (Math.min(income, upper) - lower) * rates[i];
    }
    lower = upper;
    if (income <= upper) break;
  }
  return tax;
}

// 2026/27 UK income tax bands (England/NI/Wales — Scotland has its own separate bands, not modeled here).
export const UK_INCOME_TAX_THRESHOLDS = [12570, 50270, 125140, Infinity];
export const UK_INCOME_TAX_RATES = [0, 0.2, 0.4, 0.45];

// 2026/27 Class 1 employee National Insurance bands.
export const UK_EMPLOYEE_NI_THRESHOLDS = [12570, 50270, Infinity];
export const UK_EMPLOYEE_NI_RATES = [0, 0.08, 0.02];

export function employeeNI(income: number): number {
  return taxAtBands(income, UK_EMPLOYEE_NI_THRESHOLDS, UK_EMPLOYEE_NI_RATES);
}
export function incomeTax(income: number): number {
  return taxAtBands(income, UK_INCOME_TAX_THRESHOLDS, UK_INCOME_TAX_RATES);
}

/** Employer's NI: 15% above the £5,000/year secondary threshold (from April 2025). */
export function employerNI(pay: number): number {
  return 0.15 * Math.max(0, pay - 5000);
}

/** Corporation Tax with marginal relief between the £50k small-profits rate and £250k main rate. */
export function corporationTax(profit: number): number {
  if (profit <= 0) return 0;
  if (profit <= 50000) return profit * 0.19;
  if (profit > 250000) return profit * 0.25;
  const marginalRelief = (250000 - profit) * (3 / 200);
  return profit * 0.25 - marginalRelief;
}

/** Dividend tax, stacked on top of salary/other income, with the £500 dividend allowance
 *  applied to whichever band the first £500 of dividends falls into. */
export function dividendTax(dividendAmount: number, otherIncomeGross: number): number {
  const thresholds = [12570, 50270, 125140, Infinity];
  const rates = [0, 0.0875, 0.3375, 0.3935];
  let pos = otherIncomeGross;
  let remaining = dividendAmount;
  let allowanceLeft = 500;
  let tax = 0;
  let lower = 0;
  for (let i = 0; i < thresholds.length && remaining > 0; i++) {
    const upper = thresholds[i];
    if (pos < upper) {
      const capacity = upper - Math.max(pos, lower);
      const amountInBand = Math.min(remaining, capacity);
      const allowanceUsed = Math.min(allowanceLeft, amountInBand);
      allowanceLeft -= allowanceUsed;
      tax += (amountInBand - allowanceUsed) * rates[i];
      remaining -= amountInBand;
      pos += amountInBand;
    }
    lower = upper;
  }
  return tax;
}

export interface StampDutyBand {
  upTo: number;
  rate: number;
}
/** Generic SDLT/LBTT/LTT-style band calculator: tax = sum over bands of (portion in band) × (rate + surcharge). */
export function bandedPropertyTax(price: number, bands: StampDutyBand[], surchargePercent = 0): number {
  let tax = 0;
  let lower = 0;
  for (const b of bands) {
    if (price > lower) {
      tax += (Math.min(price, b.upTo) - lower) * (b.rate + surchargePercent / 100);
    }
    lower = b.upTo;
    if (price <= b.upTo) break;
  }
  return tax;
}

// Statutory redundancy pay: weekly pay cap effective 6 April 2026.
export const REDUNDANCY_WEEKLY_PAY_CAP = 751;
export const REDUNDANCY_MAX_YEARS = 20;

/** Weeks of statutory redundancy pay owed, banding each year of service by the employee's age
 *  DURING that year (counting backward from the current age), per the age-banded formula. */
export function redundancyWeeks(currentAge: number, yearsOfService: number): number {
  const cappedYears = Math.min(REDUNDANCY_MAX_YEARS, Math.floor(yearsOfService));
  let weeks = 0;
  for (let k = 1; k <= cappedYears; k++) {
    // k=1 is the oldest counted year, k=cappedYears is the most recent (current) year.
    const ageInThatYear = currentAge - (cappedYears - k);
    if (ageInThatYear < 22) weeks += 0.5;
    else if (ageInThatYear <= 40) weeks += 1;
    else weeks += 1.5;
  }
  return weeks;
}

/** Statutory minimum notice an EMPLOYER must give an EMPLOYEE (Employment Rights Act 1996 s.86). */
export function statutoryNoticeWeeksFromEmployer(yearsOfService: number): number {
  if (yearsOfService < 1 / 12) return 0; // under 1 month service: no statutory minimum
  if (yearsOfService < 2) return 1;
  return Math.min(12, Math.floor(yearsOfService));
}
