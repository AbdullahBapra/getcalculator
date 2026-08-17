import type { CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { monthlyPayment, pvAnnuity } from "./finance-helpers";
import { FX_TO_USD, CURRENCY_OPTIONS } from "../currency";

interface Bracket {
  upTo: number;
  rate: number;
}
// 2024 US federal income tax brackets (simplified — ignores standard deduction, credits, state tax).
const BRACKETS_SINGLE: Bracket[] = [
  { upTo: 11600, rate: 0.1 },
  { upTo: 47150, rate: 0.12 },
  { upTo: 100525, rate: 0.22 },
  { upTo: 191950, rate: 0.24 },
  { upTo: 243725, rate: 0.32 },
  { upTo: 609350, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];
const BRACKETS_MARRIED: Bracket[] = [
  { upTo: 23200, rate: 0.1 },
  { upTo: 94300, rate: 0.12 },
  { upTo: 201050, rate: 0.22 },
  { upTo: 383900, rate: 0.24 },
  { upTo: 487450, rate: 0.32 },
  { upTo: 731200, rate: 0.35 },
  { upTo: Infinity, rate: 0.37 },
];
function progressiveTax(income: number, brackets: Bracket[]): { tax: number; marginalRate: number } {
  let tax = 0;
  let lower = 0;
  let marginalRate = brackets[0].rate;
  for (const b of brackets) {
    const upper = Math.min(income, b.upTo);
    if (upper > lower) {
      tax += (upper - lower) * b.rate;
      marginalRate = b.rate;
    }
    lower = b.upTo;
    if (income <= b.upTo) break;
  }
  return { tax, marginalRate };
}

const financialTax: CalculatorDefinition[] = [
  {
    slug: "interest-calculator",
    title: "Interest Calculator",
    category: "financial",
    shortDescription: "Calculate interest earned using simple or compound interest.",
    seoDescription: "Calculate interest earned on a principal amount using either simple or compound interest.",
    formulaSummary: "Simple: I = Prt · Compound: A = P(1+r/n)^(nt)",
    fields: [
      { name: "principal", label: "Principal", type: "number", unit: "$", defaultValue: 8000, min: 0 },
      { name: "ratePercent", label: "Annual Rate", type: "number", unit: "%", defaultValue: 5, step: 0.01 },
      { name: "years", label: "Time", type: "number", unit: "years", defaultValue: 5, min: 0 },
      { name: "mode", label: "Interest Type", type: "select", defaultValue: "compound", options: [{ value: "simple", label: "Simple" }, { value: "compound", label: "Compound (annually)" }] },
    ],
    calculate: (i) => {
      const p = n(i.principal), r = n(i.ratePercent) / 100, t = n(i.years);
      const total = i.mode === "simple" ? p * (1 + r * t) : p * Math.pow(1 + r, t);
      return {
        results: [
          { label: "Interest Earned", value: fmtCurrency(total - p), emphasis: true },
          { label: "Total Amount", value: fmtCurrency(total) },
        ],
      };
    },
    relatedSlugs: ["compound-interest-calculator", "simple-interest-calculator"],
  },
  {
    slug: "payment-calculator",
    title: "Payment Calculator",
    category: "financial",
    shortDescription: "Solve for the loan payment, or the loan amount a target payment supports.",
    seoDescription: "Calculate a loan's monthly payment from its amount, or the loan amount a target monthly payment can support.",
    formulaSummary: "M = P × [r(1+r)^n]/[(1+r)^n−1]",
    fields: [
      { name: "mode", label: "Solve For", type: "select", defaultValue: "payment", options: [{ value: "payment", label: "Monthly Payment" }, { value: "loanAmount", label: "Loan Amount" }] },
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 25000, min: 0, showIf: (i) => i.mode !== "loanAmount" },
      { name: "targetPayment", label: "Target Monthly Payment", type: "number", unit: "$", defaultValue: 500, min: 0, showIf: (i) => i.mode === "loanAmount" },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 7, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 60, min: 1 },
    ],
    calculate: (i) => {
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.termMonths, 60);
      if (i.mode === "loanAmount") {
        const loanAmt = pvAnnuity(n(i.targetPayment), r, nper);
        return { results: [{ label: "Loan Amount Supported", value: fmtCurrency(loanAmt), emphasis: true }] };
      }
      const pmt = monthlyPayment(n(i.principal), r, nper);
      return { results: [{ label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true }] };
    },
    relatedSlugs: ["loan-calculator"],
  },
  {
    slug: "finance-calculator",
    title: "Finance Calculator (TVM)",
    category: "financial",
    shortDescription: "Solve for future value, or the payment needed to reach a savings goal.",
    seoDescription: "A time-value-of-money calculator: find the future value of savings, or the monthly payment needed to reach a target amount.",
    formulaSummary: "FV = PV(1+r)^n + PMT×[((1+r)^n−1)/r]",
    fields: [
      { name: "mode", label: "Solve For", type: "select", defaultValue: "futureValue", options: [{ value: "futureValue", label: "Future Value" }, { value: "payment", label: "Payment Needed to Reach a Goal" }] },
      { name: "pv", label: "Present Value", type: "number", unit: "$", defaultValue: 5000, min: 0 },
      { name: "pmt", label: "Monthly Payment", type: "number", unit: "$", defaultValue: 200, min: 0, showIf: (i) => i.mode !== "payment" },
      { name: "targetFv", label: "Target Future Value", type: "number", unit: "$", defaultValue: 50000, min: 0, showIf: (i) => i.mode === "payment" },
      { name: "ratePercent", label: "Annual Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "years", label: "Years", type: "number", defaultValue: 10, min: 0.1 },
    ],
    calculate: (i) => {
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.years, 10) * 12;
      if (i.mode === "payment") {
        const growthOfPv = n(i.pv) * Math.pow(1 + r, nper);
        const neededFromPmt = n(i.targetFv) - growthOfPv;
        const pmt = r === 0 ? neededFromPmt / nper : (neededFromPmt * r) / (Math.pow(1 + r, nper) - 1);
        return { results: [{ label: "Required Monthly Payment", value: fmtCurrency(Math.max(0, pmt)), emphasis: true }] };
      }
      const fv = n(i.pv) * Math.pow(1 + r, nper) + (r === 0 ? n(i.pmt) * nper : n(i.pmt) * ((Math.pow(1 + r, nper) - 1) / r));
      return { results: [{ label: "Future Value", value: fmtCurrency(fv), emphasis: true }] };
    },
    relatedSlugs: ["future-value-calculator", "present-value-calculator"],
  },
  {
    slug: "income-tax-calculator",
    title: "Income Tax Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Estimate US federal income tax using 2024 marginal tax brackets.",
    seoDescription: "Estimate your US federal income tax, marginal rate and effective rate using 2024 IRS tax brackets.",
    formulaSummary: "Progressive brackets — each dollar taxed at the rate for its bracket",
    fields: [
      { name: "taxableIncome", label: "Taxable Income", type: "number", unit: "$", defaultValue: 75000, min: 0 },
      { name: "filingStatus", label: "Filing Status", type: "select", defaultValue: "single", options: [{ value: "single", label: "Single" }, { value: "married", label: "Married Filing Jointly" }] },
    ],
    calculate: (i) => {
      const brackets = i.filingStatus === "married" ? BRACKETS_MARRIED : BRACKETS_SINGLE;
      const { tax, marginalRate } = progressiveTax(n(i.taxableIncome), brackets);
      const effective = n(i.taxableIncome) > 0 ? (tax / n(i.taxableIncome)) * 100 : 0;
      return {
        results: [
          { label: "Estimated Federal Tax", value: fmtCurrency(tax), emphasis: true },
          { label: "Marginal Tax Rate", value: fmtPercent(marginalRate * 100) },
          { label: "Effective Tax Rate", value: fmtPercent(effective) },
        ],
        notes: ["2024 US federal brackets on taxable income — ignores the standard deduction, credits and state tax, so your actual bill will differ."],
      };
    },
    relatedSlugs: ["take-home-pay-calculator", "salary-calculator"],
  },
  {
    slug: "salary-calculator",
    title: "Salary Calculator",
    category: "financial",
    shortDescription: "Convert between hourly, weekly, monthly and annual pay.",
    seoDescription: "Convert your pay between hourly, weekly, monthly and annual amounts.",
    formulaSummary: "Annual = hourly × hours/week × weeks/year",
    fields: [
      { name: "amount", label: "Amount", type: "number", unit: "$", defaultValue: 30, min: 0 },
      { name: "payType", label: "This Is My", type: "select", defaultValue: "hourly", options: [{ value: "hourly", label: "Hourly Rate" }, { value: "annual", label: "Annual Salary" }] },
      { name: "hoursPerWeek", label: "Hours Per Week", type: "number", defaultValue: 40, min: 1, max: 100 },
      { name: "weeksPerYear", label: "Weeks Worked Per Year", type: "number", defaultValue: 50, min: 1, max: 52 },
    ],
    calculate: (i) => {
      const hours = n(i.hoursPerWeek, 40);
      const weeks = n(i.weeksPerYear, 50);
      const annual = i.payType === "annual" ? n(i.amount) : n(i.amount) * hours * weeks;
      const hourly = i.payType === "hourly" ? n(i.amount) : annual / (hours * weeks);
      return {
        results: [
          { label: "Hourly", value: fmtCurrency(hourly) },
          { label: "Weekly", value: fmtCurrency(hourly * hours) },
          { label: "Monthly", value: fmtCurrency(annual / 12) },
          { label: "Annual", value: fmtCurrency(annual), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["take-home-pay-calculator", "income-tax-calculator"],
  },
  {
    slug: "interest-rate-calculator",
    title: "Interest Rate Calculator",
    category: "financial",
    shortDescription: "Solve for a loan's interest rate from its payment, amount and term.",
    seoDescription: "Calculate the interest rate on a loan given the loan amount, monthly payment and term.",
    formulaSummary: "Solved numerically: the rate where the standard payment formula matches your payment",
    fields: [
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 20000, min: 0.01 },
      { name: "payment", label: "Monthly Payment", type: "number", unit: "$", defaultValue: 450, min: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 48, min: 1 },
    ],
    calculate: (i) => {
      const principal = n(i.principal, 0.01);
      const payment = n(i.payment, 0.01);
      const nper = n(i.termMonths, 48);
      if (payment * nper <= principal) return { results: [], error: "This payment and term don't cover the principal — increase the payment or term." };
      let lo = 0, hi = 1;
      for (let iter = 0; iter < 80; iter++) {
        const mid = (lo + hi) / 2;
        const pmt = monthlyPayment(principal, mid, nper);
        if (pmt > payment) hi = mid;
        else lo = mid;
      }
      const monthlyRate = (lo + hi) / 2;
      return { results: [{ label: "Annual Interest Rate (APR)", value: fmtPercent(monthlyRate * 12 * 100), emphasis: true }] };
    },
    relatedSlugs: ["loan-calculator", "apr-calculator"],
  },
  {
    slug: "marriage-tax-calculator",
    title: "Marriage Tax Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "See if filing jointly creates a marriage bonus or penalty vs filing single.",
    seoDescription: "Compare combined federal tax filing jointly as a married couple vs. each partner filing single, to reveal a marriage bonus or penalty.",
    formulaSummary: "Compare tax(income1)+tax(income2) as single vs tax(combined) as married",
    fields: [
      { name: "income1", label: "Partner 1 Taxable Income", type: "number", unit: "$", defaultValue: 65000, min: 0 },
      { name: "income2", label: "Partner 2 Taxable Income", type: "number", unit: "$", defaultValue: 65000, min: 0 },
    ],
    calculate: (i) => {
      const taxSingle = progressiveTax(n(i.income1), BRACKETS_SINGLE).tax + progressiveTax(n(i.income2), BRACKETS_SINGLE).tax;
      const taxMarried = progressiveTax(n(i.income1) + n(i.income2), BRACKETS_MARRIED).tax;
      const diff = taxMarried - taxSingle;
      return {
        results: [
          { label: "Combined Tax if Both Filed Single", value: fmtCurrency(taxSingle) },
          { label: "Tax Filing Jointly", value: fmtCurrency(taxMarried), emphasis: true },
          { label: diff > 0 ? "Marriage Penalty" : "Marriage Bonus", value: fmtCurrency(Math.abs(diff)), emphasis: true },
        ],
        notes: ["2024 federal brackets only — ignores deductions, credits and state tax."],
      };
    },
    relatedSlugs: ["income-tax-calculator"],
  },
  {
    slug: "estate-tax-calculator",
    title: "Estate Tax Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Estimate federal estate tax owed above the exemption threshold.",
    seoDescription: "Estimate federal estate tax on an estate's value above the current lifetime exemption amount.",
    formulaSummary: "Tax = max(0, estate − exemption) × 40%",
    fields: [
      { name: "estateValue", label: "Gross Estate Value", type: "number", unit: "$", defaultValue: 8000000, min: 0 },
      { name: "exemption", label: "Exemption Amount", type: "number", unit: "$", defaultValue: 13610000, min: 0, help: "2024 federal exemption: $13.61M per individual" },
      { name: "ratePercent", label: "Tax Rate Above Exemption", type: "number", unit: "%", defaultValue: 40, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const taxable = Math.max(0, n(i.estateValue) - n(i.exemption));
      const tax = taxable * (n(i.ratePercent, 40) / 100);
      return {
        results: [
          { label: "Taxable Estate", value: fmtCurrency(taxable) },
          { label: "Estimated Estate Tax", value: fmtCurrency(tax), emphasis: true },
        ],
        notes: ["Federal only — many states also levy their own estate or inheritance tax with much lower exemptions."],
      };
    },
    relatedSlugs: ["income-tax-calculator"],
  },
  {
    slug: "credit-card-calculator",
    title: "Credit Card Interest Calculator",
    category: "financial",
    shortDescription: "See the real cost of only making minimum payments on a card balance.",
    seoDescription: "Calculate how much a credit card balance really costs if you only make minimum payments — total interest and payoff time.",
    formulaSummary: "Minimum payment recalculated each month as a % of the remaining balance",
    fields: [
      { name: "balance", label: "Current Balance", type: "number", unit: "$", defaultValue: 6000, min: 0 },
      { name: "aprPercent", label: "APR", type: "number", unit: "%", defaultValue: 24, step: 0.1, min: 0 },
      { name: "minPaymentPercent", label: "Minimum Payment", type: "number", unit: "% of balance", defaultValue: 3, min: 0.5, step: 0.1 },
      { name: "minPaymentFloor", label: "Minimum Payment Floor", type: "number", unit: "$", defaultValue: 25, min: 0 },
    ],
    calculate: (i) => {
      const r = n(i.aprPercent) / 100 / 12;
      let bal = n(i.balance);
      let months = 0;
      let totalInterest = 0;
      const maxMonths = 1200;
      while (bal > 0.01 && months < maxMonths) {
        const interest = bal * r;
        const payment = Math.max(n(i.minPaymentFloor), bal * (n(i.minPaymentPercent, 2) / 100));
        const applied = Math.min(payment, bal + interest);
        bal = bal + interest - applied;
        totalInterest += interest;
        months++;
      }
      if (months >= maxMonths) return { results: [], error: "At this minimum payment rate, the balance won't realistically pay off — increase the payment percentage." };
      return {
        results: [
          { label: "Time to Pay Off (minimum payments only)", value: `${(months / 12).toFixed(1)} years (${months} months)`, emphasis: true },
          { label: "Total Interest Paid", value: fmtCurrency(totalInterest), emphasis: true },
        ],
        notes: ["This is why credit card issuers are required to show a 'minimum payment warning' on statements — it usually costs far more than a fixed payoff plan."],
      };
    },
    relatedSlugs: ["credit-card-payoff-calculator"],
  },
  {
    slug: "debt-consolidation-calculator",
    title: "Debt Consolidation Calculator",
    category: "financial",
    shortDescription: "Compare your current debts to a single consolidated loan payment.",
    seoDescription: "Compare the combined payment on multiple debts to a single consolidation loan's payment.",
    formulaSummary: "Consolidated payment = amortized payment on the total balance at the new rate",
    fields: [
      { name: "debts", label: "Debts as balance:rate% pairs", type: "text", defaultValue: "8000:22, 5000:19, 3000:24", help: "e.g. 8000:22 means an $8,000 balance at 22% APR" },
      { name: "consolidationRatePercent", label: "New Consolidation Loan Rate", type: "number", unit: "%", defaultValue: 12, step: 0.1 },
      { name: "termMonths", label: "New Loan Term", type: "number", unit: "months", defaultValue: 48, min: 1 },
    ],
    calculate: (i) => {
      const pairs = (i.debts || "").split(",").map((s) => s.trim()).filter(Boolean);
      let totalBalance = 0;
      let currentMonthlyEstimate = 0;
      for (const p of pairs) {
        const [balStr, rateStr] = p.split(":");
        const bal = Number(balStr?.trim());
        const rate = Number(rateStr?.trim());
        if (!Number.isFinite(bal) || !Number.isFinite(rate)) continue;
        totalBalance += bal;
        currentMonthlyEstimate += Math.max(25, bal * 0.03); // typical card minimum-payment approximation
      }
      if (totalBalance === 0) return { results: [], error: "Enter at least one valid balance:rate pair, e.g. 8000:22" };
      const newPayment = monthlyPayment(totalBalance, n(i.consolidationRatePercent) / 100 / 12, n(i.termMonths, 48));
      return {
        results: [
          { label: "Total Debt", value: fmtCurrency(totalBalance) },
          { label: "Estimated Current Combined Min. Payments", value: fmtCurrency(currentMonthlyEstimate) },
          { label: "New Consolidated Payment", value: fmtCurrency(newPayment), emphasis: true },
          { label: newPayment < currentMonthlyEstimate ? "Monthly Savings" : "Monthly Increase", value: fmtCurrency(Math.abs(currentMonthlyEstimate - newPayment)) },
        ],
        notes: ["Current combined payment is estimated using a typical 3%-of-balance minimum — use your real statement minimums for an exact comparison."],
      };
    },
    relatedSlugs: ["debt-payoff-calculator", "credit-card-calculator"],
  },
  {
    slug: "repayment-calculator",
    title: "Loan Repayment Calculator",
    category: "financial",
    shortDescription: "Compare a standard fixed payment to an income-based payment plan.",
    seoDescription: "Compare a standard fixed-term loan repayment to an income-based repayment plan.",
    formulaSummary: "Standard: amortized payment. Income-based: % of monthly income.",
    fields: [
      { name: "principal", label: "Loan Balance", type: "number", unit: "$", defaultValue: 35000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "termYears", label: "Standard Term", type: "number", unit: "years", defaultValue: 10, min: 1 },
      { name: "monthlyIncome", label: "Monthly Income (for income-based plan)", type: "number", unit: "$", defaultValue: 4000, min: 0 },
      { name: "incomeSharePercent", label: "Income-Based Payment Share", type: "number", unit: "%", defaultValue: 10, min: 1, max: 25 },
    ],
    calculate: (i) => {
      const standardPmt = monthlyPayment(n(i.principal), n(i.ratePercent) / 100 / 12, n(i.termYears, 10) * 12);
      const incomeBasedPmt = n(i.monthlyIncome) * (n(i.incomeSharePercent, 10) / 100);
      return {
        results: [
          { label: "Standard Plan Payment", value: fmtCurrency(standardPmt), emphasis: true },
          { label: "Income-Based Plan Payment", value: fmtCurrency(incomeBasedPmt), emphasis: true },
        ],
        notes: ["Income-based payments may extend your payoff timeline and increase total interest compared to the standard plan."],
      };
    },
    relatedSlugs: ["student-loan-calculator"],
  },
  {
    slug: "student-loan-calculator",
    title: "Student Loan Calculator",
    category: "financial",
    shortDescription: "Calculate your monthly student loan payment and total interest.",
    seoDescription: "Calculate the monthly payment and total interest on a student loan given its balance, rate and repayment term.",
    formulaSummary: "M = P × [r(1+r)^n]/[(1+r)^n−1]",
    fields: [
      { name: "principal", label: "Loan Balance", type: "number", unit: "$", defaultValue: 30000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01 },
      { name: "termYears", label: "Repayment Term", type: "number", unit: "years", defaultValue: 10, min: 1 },
    ],
    calculate: (i) => {
      const pmt = monthlyPayment(n(i.principal), n(i.ratePercent) / 100 / 12, n(i.termYears, 10) * 12);
      const total = pmt * n(i.termYears, 10) * 12;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
          { label: "Total Interest", value: fmtCurrency(total - n(i.principal)) },
          { label: "Total Paid", value: fmtCurrency(total) },
        ],
      };
    },
    relatedSlugs: ["college-cost-calculator", "repayment-calculator"],
  },
  {
    slug: "college-cost-calculator",
    title: "College Cost Calculator",
    category: "financial",
    shortDescription: "Project the total cost of college after tuition inflation.",
    seoDescription: "Project the future cost of college for a given number of years, accounting for college cost inflation.",
    formulaSummary: "Future cost = current cost × (1+inflation)^years",
    fields: [
      { name: "currentAnnualCost", label: "Current Annual Cost", type: "number", unit: "$", defaultValue: 28000, min: 0 },
      { name: "yearsUntilEnrollment", label: "Years Until Enrollment", type: "number", defaultValue: 10, min: 0 },
      { name: "yearsInCollege", label: "Years in College", type: "number", defaultValue: 4, min: 1, max: 8 },
      { name: "inflationPercent", label: "College Cost Inflation", type: "number", unit: "%", defaultValue: 5, step: 0.1 },
    ],
    calculate: (i) => {
      const inflation = n(i.inflationPercent, 5) / 100;
      const startYear = n(i.yearsUntilEnrollment, 10);
      let total = 0;
      const perYear: number[] = [];
      for (let k = 0; k < n(i.yearsInCollege, 4); k++) {
        const cost = n(i.currentAnnualCost) * Math.pow(1 + inflation, startYear + k);
        perYear.push(cost);
        total += cost;
      }
      return {
        results: [
          { label: "First-Year Cost (inflated)", value: fmtCurrency(perYear[0] ?? 0), emphasis: true },
          { label: `Total Cost (${n(i.yearsInCollege, 4)} years)`, value: fmtCurrency(total), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["student-loan-calculator", "savings-calculator"],
  },
  {
    slug: "cash-back-or-low-interest-calculator",
    title: "Cash Back or Low Interest Calculator",
    category: "financial",
    shortDescription: "Compare a manufacturer's cash rebate to a low-interest financing offer.",
    seoDescription: "Compare taking a cash-back rebate with standard financing vs. a low-interest loan on the full price, to see which costs less.",
    formulaSummary: "Compare total cost of two financing paths",
    fields: [
      { name: "vehiclePrice", label: "Vehicle Price", type: "number", unit: "$", defaultValue: 32000, min: 0 },
      { name: "cashRebate", label: "Cash Rebate", type: "number", unit: "$", defaultValue: 2000, min: 0 },
      { name: "standardRatePercent", label: "Standard Rate (with rebate)", type: "number", unit: "%", defaultValue: 7.5, step: 0.01 },
      { name: "lowRatePercent", label: "Low Rate (no rebate)", type: "number", unit: "%", defaultValue: 2.9, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 60, min: 1 },
    ],
    calculate: (i) => {
      const price = n(i.vehiclePrice);
      const term = n(i.termMonths, 60);
      const rebatePmt = monthlyPayment(price - n(i.cashRebate), n(i.standardRatePercent) / 100 / 12, term);
      const lowRatePmt = monthlyPayment(price, n(i.lowRatePercent) / 100 / 12, term);
      const rebateTotal = rebatePmt * term;
      const lowRateTotal = lowRatePmt * term;
      return {
        results: [
          { label: "Cash Rebate Option — Total Cost", value: fmtCurrency(rebateTotal), emphasis: true },
          { label: "Low Interest Option — Total Cost", value: fmtCurrency(lowRateTotal), emphasis: true },
          { label: "Cheaper Option", value: rebateTotal < lowRateTotal ? "Cash Rebate" : "Low Interest Financing", emphasis: true },
        ],
      };
    },
    relatedSlugs: ["auto-loan-calculator"],
  },
  {
    slug: "auto-lease-calculator",
    title: "Auto Lease Calculator",
    category: "financial",
    shortDescription: "Calculate a car lease's monthly payment from cap cost, residual and money factor.",
    seoDescription: "Calculate your monthly car lease payment from negotiated price, down payment, residual value, money factor and sales tax.",
    formulaSummary: "Payment = depreciation fee + finance fee + tax",
    fields: [
      { name: "negotiatedPrice", label: "Negotiated Price", type: "number", unit: "$", defaultValue: 30000, min: 0 },
      { name: "downPayment", label: "Down Payment (cap cost reduction)", type: "number", unit: "$", defaultValue: 2000, min: 0 },
      { name: "residualPercent", label: "Residual Value", type: "number", unit: "% of MSRP", defaultValue: 58, min: 0, max: 100 },
      { name: "msrp", label: "MSRP", type: "number", unit: "$", defaultValue: 33000, min: 0 },
      { name: "ratePercent", label: "Interest Rate (APR equivalent)", type: "number", unit: "%", defaultValue: 5, step: 0.01 },
      { name: "termMonths", label: "Lease Term", type: "number", unit: "months", defaultValue: 36, min: 1 },
      { name: "salesTaxPercent", label: "Sales Tax", type: "number", unit: "%", defaultValue: 7, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const capCost = n(i.negotiatedPrice) - n(i.downPayment);
      const residual = n(i.msrp) * (n(i.residualPercent, 58) / 100);
      const term = n(i.termMonths, 36);
      const moneyFactor = n(i.ratePercent) / 2400;
      const depreciationFee = (capCost - residual) / term;
      const financeFee = (capCost + residual) * moneyFactor;
      const base = depreciationFee + financeFee;
      const tax = base * (n(i.salesTaxPercent) / 100);
      return {
        results: [
          { label: "Monthly Payment (before tax)", value: fmtCurrency(base) },
          { label: "Total Monthly Payment", value: fmtCurrency(base + tax), emphasis: true },
          { label: "Residual Value", value: fmtCurrency(residual) },
        ],
      };
    },
    relatedSlugs: ["lease-calculator", "auto-loan-calculator"],
  },
  {
    slug: "currency-calculator",
    title: "Currency Calculator",
    category: "financial",
    shortDescription: "Convert between major world currencies using an indicative exchange-rate snapshot.",
    seoDescription: "Convert an amount between major world currencies using a static exchange-rate snapshot.",
    formulaSummary: "Converted = amount ÷ rate(from→USD) × rate(to→USD)",
    fields: [
      { name: "amount", label: "Amount", type: "number", defaultValue: 100, min: 0 },
      { name: "from", label: "From", type: "select", defaultValue: "USD", options: CURRENCY_OPTIONS },
      { name: "to", label: "To", type: "select", defaultValue: "EUR", options: CURRENCY_OPTIONS },
    ],
    calculate: (i) => {
      const fromRate = FX_TO_USD[i.from] ?? 1;
      const toRate = FX_TO_USD[i.to] ?? 1;
      const usd = n(i.amount) * fromRate;
      const converted = usd / toRate;
      return {
        results: [{ label: `${i.from} → ${i.to}`, value: fmtNumber(converted, 2), emphasis: true }],
        notes: ["Uses a static illustrative rate snapshot, not a live feed — check a live source (like your bank) before transacting."],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "inflation-calculator",
    title: "Inflation Calculator",
    category: "financial",
    shortDescription: "See what an amount of money will be worth in the future, or was worth in the past.",
    seoDescription: "Calculate the future purchasing power of money given an assumed inflation rate, or its equivalent value in the past.",
    formulaSummary: "Future value = amount × (1+inflation)^years",
    fields: [
      { name: "mode", label: "Direction", type: "select", defaultValue: "future", options: [{ value: "future", label: "What will this be worth in the future?" }, { value: "past", label: "What was this worth in the past?" }] },
      { name: "amount", label: "Amount", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "years", label: "Years", type: "number", defaultValue: 10, min: 0 },
      { name: "inflationPercent", label: "Average Annual Inflation", type: "number", unit: "%", defaultValue: 3, step: 0.1 },
    ],
    calculate: (i) => {
      const rate = 1 + n(i.inflationPercent, 3) / 100;
      const years = n(i.years);
      const result = i.mode === "past" ? n(i.amount) / Math.pow(rate, years) : n(i.amount) * Math.pow(rate, years);
      return {
        results: [{ label: i.mode === "past" ? "Equivalent Value in the Past" : "Equivalent Value in the Future", value: fmtCurrency(result), emphasis: true }],
      };
    },
    relatedSlugs: ["gdp-calculator"],
  },
  {
    slug: "commission-calculator",
    title: "Commission Calculator",
    category: "financial",
    shortDescription: "Calculate sales commission and total pay.",
    seoDescription: "Calculate commission earned on a sale, plus total pay when combined with a base salary.",
    formulaSummary: "Commission = sale amount × commission rate",
    fields: [
      { name: "saleAmount", label: "Sale Amount", type: "number", unit: "$", defaultValue: 15000, min: 0 },
      { name: "commissionPercent", label: "Commission Rate", type: "number", unit: "%", defaultValue: 6, step: 0.1 },
      { name: "baseSalary", label: "Base Salary (this period, optional)", type: "number", unit: "$", defaultValue: 0, min: 0 },
    ],
    calculate: (i) => {
      const commission = n(i.saleAmount) * (n(i.commissionPercent) / 100);
      return {
        results: [
          { label: "Commission Earned", value: fmtCurrency(commission), emphasis: true },
          { label: "Total Pay", value: fmtCurrency(commission + n(i.baseSalary)) },
        ],
      };
    },
    relatedSlugs: ["salary-calculator"],
  },
  {
    slug: "percent-off-calculator",
    title: "Percent Off Calculator",
    category: "financial",
    shortDescription: "Quickly calculate a sale price after a percentage discount.",
    seoDescription: "Calculate the final price after a percent-off discount.",
    formulaSummary: "Final price = original × (1 − percent off)",
    fields: [
      { name: "originalPrice", label: "Original Price", type: "number", unit: "$", defaultValue: 50, min: 0 },
      { name: "percentOff", label: "Percent Off", type: "number", unit: "%", defaultValue: 30, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const savings = n(i.originalPrice) * (n(i.percentOff, 30) / 100);
      return {
        results: [
          { label: "You Save", value: fmtCurrency(savings), emphasis: true },
          { label: "Final Price", value: fmtCurrency(n(i.originalPrice) - savings), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["discount-calculator"],
  },
  {
    slug: "apr-calculator",
    title: "APR Calculator",
    category: "financial",
    shortDescription: "Calculate the true APR of a loan once fees are included.",
    seoDescription: "Calculate a loan's true annual percentage rate (APR) once upfront fees are factored into the cost of borrowing.",
    formulaSummary: "APR is the rate that equates the payment to the net proceeds after fees",
    fields: [
      { name: "loanAmount", label: "Loan Amount", type: "number", unit: "$", defaultValue: 20000, min: 0.01 },
      { name: "statedRatePercent", label: "Stated (Nominal) Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "fees", label: "Upfront Fees", type: "number", unit: "$", defaultValue: 500, min: 0 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 60, min: 1 },
    ],
    calculate: (i) => {
      const loan = n(i.loanAmount, 0.01);
      const nper = n(i.termMonths, 60);
      const nominalR = n(i.statedRatePercent) / 100 / 12;
      const payment = monthlyPayment(loan, nominalR, nper);
      const netProceeds = loan - n(i.fees);
      if (netProceeds <= 0) return { results: [], error: "Fees can't exceed the loan amount." };
      let lo = 0, hi = 1;
      for (let iter = 0; iter < 80; iter++) {
        const mid = (lo + hi) / 2;
        const pv = pvAnnuity(payment, mid, nper);
        if (pv < netProceeds) hi = mid;
        else lo = mid;
      }
      const aprMonthly = (lo + hi) / 2;
      return {
        results: [
          { label: "True APR", value: fmtPercent(aprMonthly * 12 * 100), emphasis: true },
          { label: "Stated Rate", value: fmtPercent(n(i.statedRatePercent)) },
          { label: "Monthly Payment", value: fmtCurrency(payment) },
        ],
        notes: ["APR is higher than the stated rate because fees reduce what you actually receive while you still pay based on the full loan amount."],
      };
    },
    relatedSlugs: ["interest-rate-calculator", "loan-calculator"],
  },
];

export default financialTax;
