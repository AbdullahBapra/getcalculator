import type { CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { monthlyPayment, pvAnnuity, loanBreakdown, fvGrowthSeries } from "./finance-helpers";
import { FX_TO_USD, CURRENCY_OPTIONS, getCurrency } from "../currency";

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
/** Same bracket walk as progressiveTax(), but surfaced as a row-per-bracket reference
 *  table instead of just a single total — this is the real "show your work" for a
 *  progressive tax system: which slice of income was taxed at which rate. */
function bracketTable(income: number, brackets: Bracket[]): { headers: string[]; rows: string[][] } {
  const rows: string[][] = [];
  let lower = 0;
  for (const b of brackets) {
    const upper = Math.min(income, b.upTo);
    if (upper > lower) {
      const taxableInBracket = upper - lower;
      rows.push([
        b.upTo === Infinity ? `Over ${fmtCurrency(lower)}` : `${fmtCurrency(lower)} – ${fmtCurrency(b.upTo)}`,
        fmtPercent(b.rate * 100),
        fmtCurrency(taxableInBracket),
        fmtCurrency(taxableInBracket * b.rate),
      ]);
    }
    lower = b.upTo;
    if (income <= b.upTo) break;
  }
  return { headers: ["Bracket", "Rate", "Taxed at This Rate", "Tax Owed"], rows };
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
      const interestEarned = total - p;
      return {
        results: [
          { label: "Interest Earned", value: fmtCurrency(interestEarned), emphasis: true },
          { label: "Total Amount", value: fmtCurrency(total) },
        ],
        breakdown: [
          { label: "Principal", value: p, displayValue: fmtCurrency(p) },
          { label: "Interest Earned", value: interestEarned, displayValue: fmtCurrency(interestEarned) },
        ],
        chartCaption: `Of the ${fmtCurrency(total)} you end up with, ${fmtCurrency(p)} is what you put in — the rest, ${fmtCurrency(interestEarned)}, is interest ${i.mode === "simple" ? "earned at a flat rate every year" : "compounding on top of itself"}.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator", "simple-interest-calculator"],
    content: {
      intro: [
        "The naive way to estimate interest is to multiply the rate by the years and call it done — and for simple interest, that's exactly right. But most real accounts don't work that way: banks, bonds and loans typically compound, meaning each period's interest gets added to the balance and then itself starts earning interest. Over a few years the gap between the two methods is small; over a decade or two it's often the difference between doubling your money and not.",
        "This calculator runs both models side by side so you can see the actual dollar gap, not just the concept. It's the tool people reach for when comparing a savings account's advertised rate to what they'd naively expect, or when a homework problem or a real quote needs the interest isolated from the principal.",
        "Everything runs in your browser — the principal you type in, whatever it represents, never leaves your device or gets logged anywhere.",
      ],
      howItWorks: [
        "Simple interest uses I = P × r × t: the rate applies only to the original principal, every year, for the life of the investment or loan — a flat, linear amount of interest each period.",
        "Compound interest uses A = P × (1 + r)ᵗ: after each year's interest is added, next year's interest is calculated on the new, larger balance. That's why the compound total pulls further ahead of simple interest the longer the money sits — it's earning interest on interest, not just on the original amount.",
      ],
      faq: [
        {
          q: "What's the actual difference between simple and compound interest?",
          a: "Simple interest is always calculated on the original principal, so it grows by the same dollar amount every year. Compound interest is recalculated on the growing balance each period, so the dollar amount it adds increases over time even at the same rate.",
        },
        {
          q: "Is compound interest always better for me as a saver?",
          a: "Yes, when you're the one earning it — compounding grows your balance faster than simple interest at the same rate. It's the opposite when you're the one paying it, which is why compounding debt like credit card balances is worth avoiding.",
        },
        {
          q: "Does compounding frequency (monthly vs. annually) matter?",
          a: "It does — more frequent compounding periods produce a slightly higher total for the same annual rate, since interest starts earning its own interest sooner. This calculator compounds annually; a quote that compounds monthly or daily will land a bit higher than what's shown here for the same stated rate.",
        },
        {
          q: "Why does my bank's advertised rate not match what I calculate by hand?",
          a: "Banks usually advertise an APY (annual percentage yield), which already bakes in compounding frequency, rather than a bare interest rate. Multiplying a bare rate by years the way simple interest works will usually undershoot what a compounding account actually pays.",
        },
      ],
    },
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
        const totalInterest = n(i.targetPayment) * nper - loanAmt;
        return {
          results: [{ label: "Loan Amount Supported", value: fmtCurrency(loanAmt), emphasis: true }],
          ...loanBreakdown(loanAmt, totalInterest),
        };
      }
      const pmt = monthlyPayment(n(i.principal), r, nper);
      const totalInterest = pmt * nper - n(i.principal);
      return {
        results: [{ label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true }],
        ...loanBreakdown(n(i.principal), totalInterest),
      };
    },
    relatedSlugs: ["loan-calculator"],
    content: {
      intro: [
        "Most loan calculators only answer one question: given a loan amount, what's the payment? But real budgeting often starts from the other end — you know what you can afford each month, and need to know how much loan that actually supports. Getting that backwards, by guessing a loan amount and hoping the payment fits, is how people end up house- or car-shopping above their real budget.",
        "This calculator solves it either direction from the same amortization math, so it works for both the person trying to size a loan and the person already holding a quote and wanting to double-check it. It's aimed at anyone comparing offers on a car, personal loan, or any other fixed-rate installment debt before signing anything.",
        "All the math runs locally in your browser — the loan amount, the target payment, and the rate you're shopping never leave your device.",
      ],
      howItWorks: [
        "Solving for the payment uses the standard amortization formula directly: M = P × [r(1+r)ⁿ] / [(1+r)ⁿ − 1], where r is the monthly interest rate and n is the number of monthly payments.",
        "Solving for the loan amount runs the same relationship in reverse — it's the present value of a fixed monthly payment at that rate over that term, which is why a target payment field appears instead of a loan amount field when you switch modes.",
      ],
      faq: [
        {
          q: "How much loan can I afford on a set monthly budget?",
          a: "Switch to 'Loan Amount' mode and enter your target monthly payment along with the rate and term you expect — the calculator works backward from your payment to the loan size it supports.",
        },
        {
          q: "Why do the two modes give different-looking numbers for the same inputs?",
          a: "They don't disagree — they're the same formula run in opposite directions. A given loan amount at a given rate and term always implies exactly one payment, and a given payment at that same rate and term always implies exactly one loan amount.",
        },
        {
          q: "Does this include taxes, fees or insurance in the payment?",
          a: "No — this is pure loan-payment math on the principal, rate and term you enter. For a mortgage specifically, with property tax, insurance and HOA folded in, use the dedicated mortgage calculator instead.",
        },
        {
          q: "Why does a longer term lower my payment but not necessarily save me money?",
          a: "A longer term spreads the same principal over more payments, shrinking each one — but it also means more months of interest accruing on a balance that shrinks more slowly, so total interest paid over the life of the loan is usually higher.",
        },
      ],
    },
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
      const years = n(i.years, 10);
      if (i.mode === "payment") {
        const growthOfPv = n(i.pv) * Math.pow(1 + r, nper);
        const neededFromPmt = n(i.targetFv) - growthOfPv;
        const pmt = Math.max(0, r === 0 ? neededFromPmt / nper : (neededFromPmt * r) / (Math.pow(1 + r, nper) - 1));
        return {
          results: [{ label: "Required Monthly Payment", value: fmtCurrency(pmt), emphasis: true }],
          growthSeries: fvGrowthSeries(n(i.pv), pmt, n(i.ratePercent), years),
          chartCaption: `Contributing ${fmtCurrency(pmt)}/mo at ${fmtNumber(n(i.ratePercent))}% traces this path from ${fmtCurrency(n(i.pv))} today up to your ${fmtCurrency(n(i.targetFv))} goal by year ${Math.max(1, Math.round(years))}.`,
        };
      }
      const fv = n(i.pv) * Math.pow(1 + r, nper) + (r === 0 ? n(i.pmt) * nper : n(i.pmt) * ((Math.pow(1 + r, nper) - 1) / r));
      return {
        results: [{ label: "Future Value", value: fmtCurrency(fv), emphasis: true }],
        growthSeries: fvGrowthSeries(n(i.pv), n(i.pmt), n(i.ratePercent), years),
        chartCaption: `Starting from ${fmtCurrency(n(i.pv))} and adding ${fmtCurrency(n(i.pmt))}/mo, this is the balance building year by year toward ${fmtCurrency(fv)}. Tap any bar to see that year's value.`,
      };
    },
    relatedSlugs: ["future-value-calculator", "present-value-calculator"],
    content: {
      intro: [
        "'Time value of money' is the finance-textbook name for a simple idea: a dollar today is worth more than a dollar later, because a dollar today can be invested and start growing. This calculator applies that idea two ways — projecting what a lump sum plus regular contributions grows into, or working backward from a savings goal to figure out what monthly contribution actually gets you there.",
        "It's the same math behind retirement projections, education-fund planning, and any 'how much do I need to save per month' question — the kind of calculation that's easy to get roughly right in your head and easy to get precisely wrong, since compounding on the contributions themselves is not intuitive.",
        "Your savings goal, your current balance, and how much you're setting aside stay on your device — nothing here is transmitted or stored anywhere.",
      ],
      howItWorks: [
        "Future value combines two growing pieces: your starting balance compounding on its own at FV = PV(1+r)ⁿ, plus a stream of monthly contributions compounding as they're added, using the annuity growth formula PMT × [((1+r)ⁿ−1)/r]. The two are added together for the total.",
        "Solving for the required payment runs that same relationship backward: it subtracts what your starting balance alone will grow to from your target, then figures out the level monthly contribution that closes the remaining gap by the same target date.",
      ],
      faq: [
        {
          q: "How much do I need to save each month to hit a specific goal?",
          a: "Switch to 'Payment Needed to Reach a Goal', enter your target future value, current savings, expected rate and timeframe — the calculator solves for the monthly contribution that gets your balance there by that date.",
        },
        {
          q: "Does this calculator account for inflation?",
          a: "No — the future value shown is in nominal dollars at your assumed growth rate, not adjusted for the falling purchasing power of money over time. For that adjustment, run the result through the inflation calculator separately.",
        },
        {
          q: "What's the difference between this and a compound interest calculator?",
          a: "A basic compound interest calculator usually only grows a single lump sum. This one adds a recurring monthly contribution on top, which is closer to how most people actually save — an initial balance plus ongoing deposits.",
        },
        {
          q: "What rate of return should I assume for a realistic projection?",
          a: "That depends entirely on where the money sits — a savings account, bonds and a diversified stock portfolio have very different long-run return profiles and risk. Try a conservative and an optimistic rate side by side rather than trusting a single number.",
        },
      ],
    },
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
        table: bracketTable(n(i.taxableIncome), brackets),
        chartCaption: `Your income isn't taxed at one flat rate — each bracket only taxes the dollars that fall inside it, which is why your ${fmtPercent(effective)} effective rate lands well below your ${fmtPercent(marginalRate * 100)} marginal (top) rate.`,
      };
    },
    relatedSlugs: ["take-home-pay-calculator", "salary-calculator"],
    content: {
      intro: [
        "The most common misunderstanding about US federal income tax is thinking your whole income gets taxed at your top bracket's rate. It doesn't. The federal system is progressive and marginal: income is sliced into brackets, and each slice is taxed only at that bracket's rate — moving into a higher bracket only raises the rate on the income above that threshold, never on the dollars you already earned below it.",
        "This calculator walks your income through the actual bracket structure so you can see your marginal rate (what the next dollar you earn is taxed at) alongside your effective rate (what you actually pay as a share of your whole income) — two numbers that are often confused for each other but usually differ substantially.",
        "It's built for anyone estimating a tax bill before filing, sanity-checking a paycheck withholding, or just trying to understand where a raise actually lands them. Income numbers are about as sensitive as financial data gets, so every calculation runs locally in your browser — nothing you enter here is sent anywhere or stored.",
      ],
      howItWorks: [
        "The calculator walks your taxable income through each bracket from the bottom up. The first slice of income (up to the first threshold) is taxed at the lowest rate; the next slice (between the first and second thresholds) is taxed at the next rate, and so on, stopping once your income is fully accounted for — the bracket table above the results shows exactly which slice was taxed at which rate.",
        "Your marginal rate is simply the rate on the bracket your last dollar of income falls into. Your effective rate is total tax divided by total income — a blended average that's always lower than your marginal rate whenever more than one bracket is involved, which for most incomes, it is.",
      ],
      faq: [
        {
          q: "Why is my effective tax rate lower than my tax bracket?",
          a: "Because only the income inside your top bracket is taxed at that bracket's rate — every dollar below it was already taxed at the lower rates for its own bracket. Your effective rate blends all of those rates together, so it always comes out below your marginal (top) bracket rate.",
        },
        {
          q: "If a raise pushes me into a higher bracket, will I take home less overall?",
          a: "No — that's a common myth. Only the portion of income that falls above the new bracket threshold is taxed at the higher rate; every dollar you were already earning keeps being taxed the same as before, so a raise never reduces your total take-home pay.",
        },
        {
          q: "Does this include the standard deduction or tax credits?",
          a: "No — this estimates tax on taxable income directly, after any deductions you'd already have applied. Your actual bill will differ once the standard deduction (or itemized deductions) and any credits you qualify for are factored in.",
        },
        {
          q: "Does this account for state income tax?",
          a: "No, this is federal only. State income tax rules vary enormously — some states have no income tax at all, others have their own progressive brackets or a flat rate — so a state estimate needs to come from a separate, state-specific calculation.",
        },
        {
          q: "What's the difference between filing single and married filing jointly here?",
          a: "Married filing jointly uses wider bracket thresholds than filing single, roughly (though not exactly) double in most brackets, which is why combining two incomes under joint brackets doesn't simply add each partner's single-filer tax together.",
        },
      ],
    },
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
      const monthly = annual / 12;
      return {
        results: [
          { label: "Hourly", value: fmtCurrency(hourly) },
          { label: "Weekly", value: fmtCurrency(hourly * hours) },
          { label: "Monthly", value: fmtCurrency(monthly) },
          { label: "Annual", value: fmtCurrency(annual), emphasis: true },
        ],
        growthSeries: Array.from({ length: 12 }, (_, idx) => {
          const month = idx + 1;
          const cumulative = monthly * month;
          return { label: `Mo ${month}`, value: cumulative, displayValue: fmtCurrency(cumulative) };
        }),
        chartCaption: `Your pay builds up to ${fmtCurrency(annual)} over the year — each bar shows how much you've earned cumulatively by that month. Tap any bar to check the running total.`,
      };
    },
    relatedSlugs: ["take-home-pay-calculator", "income-tax-calculator"],
    content: {
      intro: [
        "Comparing pay across an hourly rate, a salary offer, and a monthly budget sounds like simple division, but it's a common place to get the math quietly wrong — dividing an annual salary by 12 for a monthly figure works fine, but going the other way, from hourly to annual, depends entirely on how many hours a week and weeks a year you actually work, not just a flat 40×52 assumption.",
        "This calculator converts in every direction using the hours and weeks you actually specify, which matters for anyone comparing a job offer quoted hourly against one quoted as an annual salary, part-time workers whose weeks aren't a clean 52, or anyone budgeting monthly off a pay stub that doesn't obviously divide by 12.",
        "Your pay details stay local to your browser — nothing about your income or employer is transmitted or logged anywhere.",
      ],
      faq: [
        {
          q: "How do I convert an hourly rate to an annual salary?",
          a: "Multiply the hourly rate by the hours you work per week, then by the weeks you actually work per year — not always 52, if you take unpaid time off. This calculator does that multiplication for you and also shows the weekly and monthly figures along the way.",
        },
        {
          q: "Why does my annual salary not divide evenly by 12 to match my monthly paycheck?",
          a: "It should for salaried pay, but hourly pay is different — a rate is often converted from an annual assumption using a standard 52-week year, so if you don't actually work all 52 weeks, your real annual and monthly totals will land lower than a naive division suggests.",
        },
        {
          q: "Does this calculator show take-home pay after taxes?",
          a: "No, these are gross figures before any tax withholding, deductions or benefits are subtracted. Run the annual figure through the income tax calculator to estimate what actually reaches your bank account.",
        },
        {
          q: "What weeks-per-year number should I use if I get two weeks of paid vacation?",
          a: "Paid vacation still counts as a worked, paid week for this purpose — use 52 if your time off is paid, and only lower the figure to account for unpaid leave, since that's the time you genuinely aren't being paid for.",
        },
      ],
    },
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
      const apr = monthlyRate * 12 * 100;
      return {
        results: [{ label: "Annual Interest Rate (APR)", value: fmtPercent(apr), emphasis: true }],
        gauge: {
          value: apr,
          min: 0,
          max: 30,
          valueLabel: fmtNumber(apr, 1),
          zones: [
            { label: "Excellent", to: 6, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Good", to: 10, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Fair", to: 16, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "High", to: 22, barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Very High", to: 30, barClass: "bg-rose-500 dark:bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
          ],
        },
        chartCaption: `A ${fmtPercent(apr)} rate on this loan is where it lands among typical consumer loan rates — well-qualified borrowers on secured loans usually land near the low end, unsecured or subprime rates push toward the high end.`,
      };
    },
    relatedSlugs: ["loan-calculator", "apr-calculator"],
    content: {
      intro: [
        "Sometimes you know everything about a loan except the one number that matters most for comparing it: the actual interest rate. A dealer or private seller quotes a monthly payment and a term, or an old loan statement lists a balance and payment but no rate — either way, you're missing the figure you'd need to shop it against other offers.",
        "This calculator works backward from what you do know — the loan amount, the payment, and the term — to the rate that reconciles them, which is exactly the situation anyone verifying a financing offer or reconstructing an old loan's terms runs into.",
        "Nothing about the loan you're checking — amount, payment, or term — is sent off your device; the whole search runs locally in your browser.",
      ],
      howItWorks: [
        "There's no algebraic formula that solves directly for the interest rate given a payment, loan amount and term — the standard payment formula can't be rearranged that way. Instead, this calculator searches for it numerically: it repeatedly tests a candidate rate, computes the payment that rate would produce, and narrows the range up or down until the computed payment converges on the one you entered.",
        "That search (a binary search, sometimes called bisection) typically needs only a few dozen iterations to close in on a rate accurate to many decimal places, which is why it returns instantly despite having no closed-form shortcut.",
      ],
      faq: [
        {
          q: "Why isn't there a simple formula to solve for the interest rate directly?",
          a: "The standard loan payment formula has the rate embedded inside an exponent in a way that can't be isolated algebraically. Rates are instead found by iterative search — trying candidate rates and homing in on the one that produces your actual payment — which is standard practice in finance software, not a shortcut.",
        },
        {
          q: "How accurate is a rate found this way compared to the loan's real APR?",
          a: "Very accurate for the payment math itself — the search converges to many decimal places. It reflects the loan's interest rate assuming standard monthly amortization; it won't capture separate items like origination fees, which affect true APR but not the base payment formula.",
        },
        {
          q: "Can I use this to find a credit card's interest rate from my statement?",
          a: "Not reliably — credit cards don't amortize on a fixed schedule the way installment loans do, since balances, minimum payments and additional charges change month to month. This calculator assumes a fixed payment and fixed term, which fits an auto loan, personal loan or similar far better.",
        },
        {
          q: "Why does a small change in my monthly payment shift the calculated rate so much?",
          a: "Because interest compounds over every remaining payment, a modest difference in the payment amount can imply a meaningfully different rate, especially over longer terms where more payments carry that compounding effect.",
        },
      ],
    },
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
        compare: [
          { label: "Combined Tax as Two Singles", value: taxSingle, displayValue: fmtCurrency(taxSingle) },
          { label: "Tax Filing Jointly", value: taxMarried, displayValue: fmtCurrency(taxMarried), highlight: true },
        ],
        chartCaption:
          diff > 0
            ? `Filing jointly costs ${fmtCurrency(diff)} more than the two of you would have paid filing single — a marriage penalty, usually from combined income pushing into higher brackets.`
            : `Filing jointly saves ${fmtCurrency(Math.abs(diff))} compared to filing single separately — a marriage bonus, common when one partner earns notably more than the other.`,
      };
    },
    relatedSlugs: ["income-tax-calculator"],
    content: {
      intro: [
        "It's a genuinely common assumption that married filing jointly simply doubles the single-filer brackets, so two incomes combined would owe exactly what they'd owe filing separately as singles. That's mostly, but not exactly, true — some joint brackets are less than double their single equivalents, which is exactly the gap that creates a marriage penalty or bonus depending on how the two incomes compare.",
        "This calculator runs both scenarios — each partner's income taxed separately at single rates, versus the combined income taxed once at married rates — side by side, so couples can see which way it actually cuts for their specific numbers rather than relying on a rule of thumb.",
        "Both partners' incomes stay on your device for this comparison — nothing about either income is sent anywhere or stored.",
      ],
      faq: [
        {
          q: "What causes a marriage penalty?",
          a: "It typically shows up when both partners earn similar, substantial incomes — combining them under joint brackets can push the combined total into higher brackets sooner than either partner would have hit filing separately as a single.",
        },
        {
          q: "What causes a marriage bonus instead?",
          a: "It's most common when one partner earns significantly more than the other, or one partner has little or no income — the lower earner's income effectively gets taxed at a lower bracket by being combined with the higher earner's, under wider joint brackets, than it would if filed alone.",
        },
        {
          q: "Is it ever possible to file separately after marrying to avoid a penalty?",
          a: "Married filing separately is a real filing status, but it usually results in a higher combined tax bill than filing jointly, not a lower one — it exists mainly for cases where separating liability matters more than minimizing tax, like some legal or student-loan-repayment situations.",
        },
        {
          q: "Does this account for deductions and credits that change with filing status?",
          a: "No — this compares the raw progressive bracket math only, on taxable income as entered. Several credits and deduction limits actually do shift with filing status in ways not modeled here, so a real return can diverge further from this estimate than the brackets alone suggest.",
        },
      ],
    },
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
      const exemptAmount = Math.min(n(i.estateValue), n(i.exemption));
      const netToHeirs = Math.max(0, taxable - tax);
      return {
        results: [
          { label: "Taxable Estate", value: fmtCurrency(taxable) },
          { label: "Estimated Estate Tax", value: fmtCurrency(tax), emphasis: true },
        ],
        notes: ["Federal only — many states also levy their own estate or inheritance tax with much lower exemptions."],
        breakdown: [
          { label: "Protected by Exemption", value: exemptAmount, displayValue: fmtCurrency(exemptAmount) },
          { label: "Passes to Heirs (after tax)", value: netToHeirs, displayValue: fmtCurrency(netToHeirs) },
          { label: "Estate Tax", value: tax, displayValue: fmtCurrency(tax) },
        ],
        chartCaption:
          taxable > 0
            ? `${fmtCurrency(exemptAmount)} of the estate passes tax-free under the exemption; of the remaining ${fmtCurrency(taxable)} taxable portion, ${fmtCurrency(tax)} goes to estate tax and ${fmtCurrency(netToHeirs)} still reaches your heirs.`
            : `The entire ${fmtCurrency(exemptAmount)} estate falls under the exemption, so no federal estate tax is owed.`,
      };
    },
    relatedSlugs: ["income-tax-calculator"],
    content: {
      intro: [
        "'Estate tax' gets confused with 'inheritance tax' constantly, but they're not the same thing, and the federal version is far narrower than most people assume — it only applies to the portion of an estate's value above a large exemption threshold, so the overwhelming majority of estates in the US owe nothing at the federal level at all.",
        "This calculator estimates what's owed above that exemption at the flat statutory rate, which is the number that matters for high-net-worth estate planning, or simply for understanding why the exemption threshold gets discussed so much in estate-planning conversations.",
        "Estate values are sensitive family financial information — this runs entirely in your browser, with nothing about the estate or its value sent anywhere.",
      ],
      howItWorks: [
        "Unlike income tax, federal estate tax above the exemption is effectively a flat rate on the excess, not a set of progressive brackets — the exemption acts like a large deduction, and only the value above it is taxed, at the rate you enter (statutorily 40% above the exemption in recent years).",
      ],
      faq: [
        {
          q: "Do most people's estates actually owe federal estate tax?",
          a: "No — the federal exemption is set high enough that the vast majority of estates fall entirely below it and owe nothing. It typically becomes relevant only for larger estates, and the exact threshold changes periodically, so check the current figure rather than assuming last year's number still applies.",
        },
        {
          q: "Is estate tax the same as inheritance tax?",
          a: "No. Federal estate tax is levied on the estate itself before assets are distributed, based on its total value. A number of states separately levy an inheritance tax on what heirs receive, often with much lower exemptions and rates that can depend on the heir's relationship to the deceased.",
        },
        {
          q: "Does giving gifts before death reduce estate tax?",
          a: "It can, within limits — large lifetime gifts count against the same overall exemption used at death (the lifetime exemption is unified across gifts and estate), though smaller gifts under an annual per-recipient exclusion generally don't count against it at all.",
        },
        {
          q: "Do all states follow the same estate tax exemption as the federal government?",
          a: "No — a number of states levy their own separate estate or inheritance tax with exemption thresholds well below the federal one, so an estate that owes nothing federally can still owe state-level tax depending on where the deceased lived.",
        },
      ],
    },
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
        ...loanBreakdown(n(i.balance), totalInterest),
      };
    },
    relatedSlugs: ["credit-card-payoff-calculator"],
    content: {
      intro: [
        "A minimum payment feels responsible — you're paying something every month, the balance isn't growing out of control, the statement doesn't flag anything urgent. But because the minimum is usually calculated as a small percentage of whatever the current balance happens to be, it shrinks right along with the balance, which stretches payoff out for years and lets interest compound against you the entire time.",
        "This calculator simulates paying only the minimum, month by month, until the balance actually reaches zero, so you see the real payoff timeline and total interest cost — not a rough estimate, but the same kind of month-by-month math your card issuer runs internally.",
        "It's aimed at anyone carrying a revolving balance who wants to know what 'just paying the minimum' is actually costing them before deciding whether to commit to a faster, fixed payoff plan instead.",
        "Your balance and rate never leave your browser — credit card debt is not something anyone wants tied to their identity on a server they don't control.",
      ],
      howItWorks: [
        "Each month, interest is charged on the current balance at the card's APR divided by 12. The minimum payment is then calculated as a percentage of that balance (with a dollar floor, since issuers won't let the minimum drop below a set amount) — that payment covers the new interest first, and whatever's left over chips away at principal.",
        "Because the payment is recalculated as a shrinking percentage of a shrinking balance, the dollar amount you pay drops over time too — which is exactly why minimum-only payoff drags on so long: the payment gets smaller precisely as the balance needs it to stay the same or grow to make real progress.",
      ],
      faq: [
        {
          q: "Why does paying only the minimum take so long to pay off a balance?",
          a: "Because the minimum payment shrinks along with the balance, less and less real progress gets made against principal each month, even as interest keeps accruing on whatever's left — it's a payment schedule that decelerates exactly when it should be holding steady or increasing.",
        },
        {
          q: "How do credit card issuers actually calculate the minimum payment?",
          a: "Most set it as a small percentage of the statement balance — often in the low single digits — with a minimum dollar floor so very small balances don't produce a near-zero payment. That's the same structure modeled here.",
        },
        {
          q: "Why do card statements show a 'minimum payment warning' box?",
          a: "Card issuers are required to disclose how long minimum-only payments would take to clear the balance and how much interest that would cost, precisely because the real cost is so much higher than it feels — this calculator produces the same kind of estimate.",
        },
        {
          q: "What's the difference between this and the credit card payoff calculator?",
          a: "This one models minimum-only payments, which change every month as the balance shrinks. The payoff calculator instead works from a fixed payment amount you choose, showing how much faster and cheaper a steady, committed payment gets you to zero.",
        },
      ],
    },
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
        compare: [
          { label: "Current Combined Min. Payments", value: currentMonthlyEstimate, displayValue: fmtCurrency(currentMonthlyEstimate), highlight: currentMonthlyEstimate <= newPayment },
          { label: "New Consolidated Payment", value: newPayment, displayValue: fmtCurrency(newPayment), highlight: newPayment < currentMonthlyEstimate },
        ],
        chartCaption:
          newPayment < currentMonthlyEstimate
            ? `Consolidating drops your monthly outlay by ${fmtCurrency(currentMonthlyEstimate - newPayment)} — but check the new term length, since a lower payment can still mean more total interest if it's stretched out longer.`
            : `Consolidating actually raises your monthly payment by ${fmtCurrency(newPayment - currentMonthlyEstimate)} here — it may still be worth it for a lower rate or a simpler single bill, but it isn't cheaper month-to-month.`,
      };
    },
    relatedSlugs: ["debt-payoff-calculator", "credit-card-calculator"],
    content: {
      intro: [
        "Juggling several balances at different rates makes it hard to answer a simple question: is rolling everything into one consolidation loan actually cheaper? The individual minimum payments add up to some total, the new loan has its own rate and term, and comparing them by eye usually undersells how much the term length of the new loan matters.",
        "This calculator adds up your current debts and estimates what you're roughly paying toward them now, then compares that to the single amortized payment a consolidation loan at a new rate and term would produce — the two numbers people actually want side by side before applying for anything.",
        "It's built for anyone weighing a debt consolidation loan or balance-transfer offer against what they're currently juggling across multiple cards or loans.",
        "None of the balances or rates you enter are sent anywhere — the comparison runs entirely in your browser.",
      ],
      faq: [
        {
          q: "Does debt consolidation always save money?",
          a: "Not automatically — it depends on whether the new rate is meaningfully lower than your current blended rate and how long the new term runs. A lower monthly payment from a longer term can still mean paying more in total interest, even while easing month-to-month cash flow.",
        },
        {
          q: "Is a lower monthly payment always a sign consolidation is worth it?",
          a: "No — a lower payment is often achieved simply by stretching the term out longer, which can increase total interest paid even as it reduces the immediate monthly burden. Compare total cost over the full term, not just the monthly figure.",
        },
        {
          q: "Is debt consolidation the same thing as a balance transfer?",
          a: "They're related but not identical. A balance transfer moves card debt onto a new card, often with an introductory low or 0% rate for a limited time. Consolidation typically means a personal loan that pays off multiple debts and replaces them with one fixed-term installment payment.",
        },
        {
          q: "How is my current combined payment estimated if I don't know my real minimums?",
          a: "This calculator approximates each debt's minimum payment as roughly 3% of its balance (with a small floor), a common structure for card minimums — use your actual statement minimums instead for an exact comparison if you have them.",
        },
      ],
    },
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
        compare: [
          { label: "Standard Plan Payment", value: standardPmt, displayValue: fmtCurrency(standardPmt) },
          { label: "Income-Based Plan Payment", value: incomeBasedPmt, displayValue: fmtCurrency(incomeBasedPmt), highlight: incomeBasedPmt < standardPmt },
        ],
        chartCaption:
          incomeBasedPmt < standardPmt
            ? `Income-based payments are ${fmtCurrency(standardPmt - incomeBasedPmt)}/mo lighter right now — but a smaller payment means the balance takes longer to shrink, so it usually costs more in total interest.`
            : `Income-based payments would actually be higher here — the standard plan is both cheaper and faster in this case.`,
      };
    },
    relatedSlugs: ["student-loan-calculator"],
    content: {
      intro: [
        "A standard loan repayment plan sets one fixed payment for the life of the loan, sized to pay it off by a set date. Income-based repayment flips that: the payment is set as a share of your income instead, which can be a lot more manageable month to month, but it comes at a real cost most people underestimate — a smaller payment slows how fast the principal actually shrinks.",
        "This calculator puts both plans side by side using the same loan balance and rate, so the trade-off is visible in real numbers rather than an abstract 'lower payment is better' assumption — useful for anyone weighing federal student loan repayment options or any other loan that offers an income-linked plan.",
        "Your loan balance and income figures stay local — nothing here is transmitted or stored on a server.",
      ],
      faq: [
        {
          q: "What is income-based repayment?",
          a: "It's a repayment structure, most common with federal student loans, where the monthly payment is set as a percentage of your income rather than as a fixed amount calculated to pay off the loan by a specific date.",
        },
        {
          q: "Does a lower income-based payment cost more in total over time?",
          a: "Often, yes — a smaller payment means less of each month's payment goes toward principal, so the balance shrinks more slowly and accrues interest for longer, typically increasing total interest paid over the life of the loan compared to the standard plan.",
        },
        {
          q: "When does income-based repayment make sense despite costing more overall?",
          a: "When the standard fixed payment genuinely doesn't fit your current budget — a lower payment that keeps you current and out of default is usually worth more than a lower total cost you can't actually afford to pay.",
        },
        {
          q: "Does this model loan forgiveness after a set number of years?",
          a: "No — many income-based plans include forgiveness of any remaining balance after a set number of years of payments, which can change the real total cost substantially. This calculator only compares the two payment amounts and their standard-plan cost; it doesn't model forgiveness provisions.",
        },
      ],
    },
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
        ...loanBreakdown(n(i.principal), total - n(i.principal)),
      };
    },
    relatedSlugs: ["college-cost-calculator", "repayment-calculator"],
    content: {
      intro: [
        "A student loan is a standard fixed-rate installment loan under the hood, but it carries a few quirks that make a plain payment estimate easy to get wrong — interest can start accruing while you're still in school on unsubsidized loans, and the balance you actually begin repaying is often larger than what you originally borrowed once that accrued interest capitalizes.",
        "This calculator computes the monthly payment and total interest on a student loan balance the same way it would for any amortizing loan, which is the right starting point once you know your actual balance at the start of repayment — whether that's your original borrowed amount or a larger, interest-inflated figure.",
        "It's built for graduates or current students mapping out what repayment will actually look like, and for anyone comparing repayment term lengths before committing to one.",
        "Your loan balance and rate stay on your device — none of it is sent anywhere or logged.",
      ],
      faq: [
        {
          q: "Does this calculator account for interest that accrues while I'm still in school?",
          a: "No — enter your balance as of when repayment actually begins. Unsubsidized federal loans and most private loans accrue interest during school, and if that interest capitalizes (gets added to principal) before repayment starts, your real starting balance will be higher than what you originally borrowed.",
        },
        {
          q: "What's the difference between this and the loan repayment calculator?",
          a: "This one shows the standard fixed-payment amortization for a single term you choose. The repayment calculator compares that standard plan against an income-based plan, useful if you're deciding between the two rather than just sizing the standard payment.",
        },
        {
          q: "Does a longer repayment term always mean paying more interest?",
          a: "Generally yes, for a fixed rate — a longer term lowers the monthly payment but keeps the balance outstanding, and accruing interest, for more months, which usually increases total interest paid over the life of the loan.",
        },
        {
          q: "Should I use my loan's stated interest rate or its capitalized-balance-adjusted rate?",
          a: "Use the actual rate on your promissory note or servicer statement — that's the rate applied to your outstanding balance going forward, regardless of how that balance got to its current size.",
        },
      ],
    },
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
        growthSeries: perYear.map((cost, idx) => ({ label: `Yr ${idx + 1}`, value: cost, displayValue: fmtCurrency(cost) })),
        chartCaption: `Even though tuition inflation is applied at the same ${fmtNumber(inflation * 100)}%/yr the whole way, each year of college costs more than the last just from starting later — tap a bar to see that year's cost.`,
      };
    },
    relatedSlugs: ["student-loan-calculator", "savings-calculator"],
    content: {
      intro: [
        "Projecting future college costs with a single inflation rate seems straightforward, but there's a detail that trips people up: tuition inflation doesn't stop compounding once a student enrolls. Every year of a four-year degree is that many years further from today, so even at a flat inflation rate, senior year costs noticeably more than freshman year — it's not four copies of the same inflated number.",
        "This calculator compounds the current annual cost forward for each individual year of enrollment, not just up to the year school starts, so the total reflects that year-over-year climb realistically instead of understating it with one flat multiplier.",
        "It's aimed at parents and students trying to project a real savings target years before enrollment, when the sticker price you're comparing against is today's, not the one you'll actually be billed.",
        "The cost figures you enter stay in your browser — nothing about your college planning is sent anywhere.",
      ],
      howItWorks: [
        "Each year of college gets its own compounding exponent: year one of enrollment compounds for (years until enrollment) years, year two compounds for one year more than that, and so on through the last year — because each successive year of school is that much further in the future from today.",
        "The total is the sum of all those individually-inflated yearly costs, not the first year's inflated cost multiplied by the number of years — which is why the total climbs faster than a naive single-year estimate times four would suggest.",
      ],
      faq: [
        {
          q: "Why does the last year of college cost more than the first year at the same inflation rate?",
          a: "Because it's further in the future. The first year of school is only compounded up to the enrollment date, but each following year is that much later still, so it keeps compounding through more years of inflation even though the annual rate never changes.",
        },
        {
          q: "What's a realistic college cost inflation rate to assume?",
          a: "Tuition inflation has historically run higher than general consumer inflation over long stretches, though the rate varies by school type and year. Running the numbers at a couple of different rates — a conservative one and a higher one — gives a more useful range than trusting a single figure.",
        },
        {
          q: "Does this include room, board, books and other costs, or just tuition?",
          a: "Whatever you enter as the current annual cost is what gets projected — if you want total cost of attendance rather than tuition alone, use a total cost-of-attendance figure as your starting input.",
        },
        {
          q: "How much should I be saving now based on this projection?",
          a: "Once you have the projected total, the finance/TVM calculator can work backward from that as a target future value to the monthly savings contribution needed to reach it by enrollment.",
        },
      ],
    },
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
        compare: [
          { label: "Cash Rebate — Total Cost", value: rebateTotal, displayValue: fmtCurrency(rebateTotal), highlight: rebateTotal < lowRateTotal },
          { label: "Low Interest — Total Cost", value: lowRateTotal, displayValue: fmtCurrency(lowRateTotal), highlight: lowRateTotal <= rebateTotal },
        ],
        chartCaption: `Over the full ${term}-month loan, ${rebateTotal < lowRateTotal ? "the cash rebate" : "the low-interest offer"} costs ${fmtCurrency(Math.abs(rebateTotal - lowRateTotal))} less — the rebate shrinks what you finance, while the low rate shrinks what that financing costs.`,
      };
    },
    relatedSlugs: ["auto-loan-calculator"],
    content: {
      intro: [
        "Car dealers routinely offer a choice between a cash rebate (with standard financing) or a below-market low interest rate (with no rebate), and it's genuinely not obvious from the sticker numbers alone which one actually costs less — the answer depends on the vehicle price, the rate gap between the two offers, and the loan term, not just which discount sounds bigger.",
        "This calculator runs the total cost of both financing paths side by side — the rebate reducing what you finance versus the low rate reducing what that financing costs — so the comparison is a real total-dollar number instead of a guess about which incentive is 'worth more.'",
        "It's aimed squarely at car buyers staring at exactly this choice on a purchase agreement, before signing either option.",
        "Vehicle price and financing details you enter never leave your browser.",
      ],
      faq: [
        {
          q: "Is the cash rebate or the low interest rate usually the better deal?",
          a: "It depends on the numbers — a bigger rate gap between the two offers tends to favor the low-rate option, while a shorter loan term (which limits how much the rate difference can compound) tends to favor the cash rebate. There's no universal answer; that's exactly what this calculator compares.",
        },
        {
          q: "Does the loan term length change which option is cheaper?",
          a: "Yes, significantly — a longer term gives the low interest rate more time to compound its advantage, while a shorter term gives interest less time to matter at all, which can tip the comparison toward the cash rebate instead.",
        },
        {
          q: "Can I negotiate the vehicle price down and still take the low interest rate?",
          a: "Sometimes, though dealers often tie the low rate offer to the listed price and treat any price negotiation as forfeiting it — always confirm directly with the dealer which parts of an offer are actually negotiable together.",
        },
        {
          q: "Are there other costs this comparison doesn't include?",
          a: "Yes — this compares only the financing math (price, rebate and rate) over the loan term. Sales tax, registration fees, and any dealer add-ons aren't included and can shift the real total cost of either path.",
        },
      ],
    },
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
        breakdown: [
          { label: "Depreciation", value: depreciationFee, displayValue: fmtCurrency(depreciationFee) },
          { label: "Finance Fee", value: financeFee, displayValue: fmtCurrency(financeFee) },
          { label: "Sales Tax", value: tax, displayValue: fmtCurrency(tax) },
        ],
        chartCaption: `${fmtNumber((depreciationFee / (base + tax)) * 100, 0)}% of your lease payment is just the car's depreciation over the term — the rest is the finance fee (interest on the lease) and sales tax layered on top.`,
      };
    },
    relatedSlugs: ["lease-calculator", "auto-loan-calculator"],
    content: {
      intro: [
        "Lease math looks nothing like loan math, and that's exactly why lease payments feel opaque — instead of a familiar interest rate, dealers quote a 'money factor,' a small decimal that doesn't look like a percentage at all, and the payment itself is really two separate pieces (depreciation and a finance charge) stapled together rather than one amortized number.",
        "This calculator breaks a lease payment into those actual pieces — what you're paying for the car's depreciation over the lease term, what you're paying in finance charges on top, and the tax layered onto both — so a lease quote can be checked line by line instead of taken on faith.",
        "It's built for anyone comparing a lease offer against buying, or checking a dealer's quoted payment against the underlying negotiated price, residual and money factor.",
        "The price, residual and rate details you enter stay in your browser and are never sent anywhere.",
      ],
      howItWorks: [
        "The depreciation fee is the car's expected loss in value over the lease — negotiated price minus residual value, spread evenly across the lease term. The finance fee is calculated from the 'money factor' (a small decimal, typically the equivalent APR divided by 2400) applied to the sum of the capitalized cost and residual value. Sales tax, where applicable, is then applied on top of both combined.",
        "Money factor and APR describe the same underlying interest cost in different units — multiplying a money factor by 2400 converts it to something close to an equivalent annual percentage rate, which is what this calculator's rate field represents before converting back to a money factor internally.",
      ],
      faq: [
        {
          q: "What is a money factor and how is it different from an interest rate?",
          a: "A money factor is the lease-industry way of expressing the finance charge, shown as a small decimal (like 0.00208) instead of a percentage. Multiplying it by 2400 converts it to roughly the equivalent APR, which is easier to compare against loan rates you're used to seeing.",
        },
        {
          q: "What is residual value and why does it matter so much?",
          a: "Residual value is what the leasing company expects the car to be worth at the end of the lease term, usually expressed as a percentage of MSRP. A higher residual means less projected depreciation for you to pay for during the lease, which directly lowers the monthly payment.",
        },
        {
          q: "Why is sales tax applied to the monthly payment instead of the full car price?",
          a: "Many states tax lease payments only on the amount actually being paid each month (depreciation plus finance charge), rather than on the vehicle's full purchase price the way a cash sale or loan typically is — though the exact rule varies by state.",
        },
        {
          q: "Is leasing cheaper than buying?",
          a: "Not inherently — leasing typically produces a lower monthly payment because you're only paying for the car's depreciation over the term rather than its full value, but you don't build any equity and have mileage and condition limits, so the better financial choice depends on how long you keep vehicles and how much you drive.",
        },
      ],
    },
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
      const fromSymbol = getCurrency(i.from)?.symbol ?? "";
      const toSymbol = getCurrency(i.to)?.symbol ?? "";
      return {
        results: [{ label: `${i.from} → ${i.to}`, value: fmtNumber(converted, 2), emphasis: true }],
        notes: ["Uses a static illustrative rate snapshot, not a live feed — check a live source (like your bank) before transacting."],
        steps: [
          `${i.from} → USD: ${fmtNumber(n(i.amount), 2)} × ${fmtNumber(fromRate, 4)} = ${fmtNumber(usd, 2)} USD`,
          `USD → ${i.to}: ${fmtNumber(usd, 2)} ÷ ${fmtNumber(toRate, 4)} = ${fmtNumber(converted, 2)} ${i.to}`,
          "Every conversion here routes through USD as a common unit, which is also how most real-world currency conversions work under the hood.",
        ],
        // Same real value, shown in both units side by side — the same "one quantity,
        // two representations" idea as the site's kg/lb and cm/in convertPair fields,
        // just for currency instead of physical units.
        compare: [
          { label: `In ${i.from}`, value: n(i.amount), displayValue: `${fromSymbol}${fmtNumber(n(i.amount), 2)}` },
          { label: `In ${i.to}`, value: converted, displayValue: `${toSymbol}${fmtNumber(converted, 2)}`, highlight: true },
        ],
        chartCaption: `${fromSymbol}${fmtNumber(n(i.amount), 2)} ${i.from} and ${toSymbol}${fmtNumber(converted, 2)} ${i.to} represent the same value at this rate snapshot — just denominated in different currencies.`,
      };
    },
    relatedSlugs: [],
    content: {
      intro: [
        "Converting between currencies looks like a single division, but the naive version — just dividing by 'the exchange rate' — hides an important detail: most cross-currency conversions, including the ones banks and card networks actually run, quietly pass through a common reference currency (usually the US dollar) rather than having a direct rate between every pair of currencies.",
        "This calculator does the same thing explicitly: it converts your amount into US dollars first, then from dollars into the target currency, and shows both legs of that conversion so the math isn't a black box.",
        "It's meant for quick estimates — travel budgeting, sizing up a foreign price tag, or converting a number for comparison — not for anything you're about to actually transact, since it uses a static illustrative rate snapshot rather than a live market feed.",
        "The amount and currencies you're converting stay in your browser; nothing is sent to any external service.",
      ],
      faq: [
        {
          q: "Is this calculator using live, current exchange rates?",
          a: "No — it uses a static, illustrative rate snapshot for estimating purposes. Exchange rates move continuously in real markets, so check a live source like your bank, card issuer, or a financial data provider before actually exchanging or transacting.",
        },
        {
          q: "Why does the conversion route through USD instead of converting directly?",
          a: "Routing through a common reference currency (the US dollar, by far the most widely used one) is how most real-world currency conversion actually works under the hood, since maintaining a direct rate between every possible currency pair isn't practical. This calculator mirrors that approach explicitly.",
        },
        {
          q: "Why is the rate I get here different from what my bank or card charged me?",
          a: "Banks and card networks add their own margin or fee on top of the underlying market rate, and use their own live rate at the moment of the transaction — both of which will differ from this calculator's static snapshot rate.",
        },
        {
          q: "Can I use this to convert cryptocurrency?",
          a: "No — this covers major world fiat currencies only, using the currency list built into the calculator.",
        },
      ],
    },
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
      const wholeYears = Math.max(1, Math.round(years));
      const base = i.mode === "past" ? result : n(i.amount);
      const growthSeries = Array.from({ length: wholeYears }, (_, idx) => {
        const y = idx + 1;
        const value = base * Math.pow(rate, y);
        return { label: `Yr ${y}`, value, displayValue: fmtCurrency(value) };
      });
      return {
        results: [{ label: i.mode === "past" ? "Equivalent Value in the Past" : "Equivalent Value in the Future", value: fmtCurrency(result), emphasis: true }],
        growthSeries,
        chartCaption:
          i.mode === "past"
            ? `${fmtCurrency(result)} back then had the same buying power as ${fmtCurrency(n(i.amount))} today — this traces how it would have grown dollar-for-dollar at ${fmtNumber(n(i.inflationPercent, 3))}%/yr inflation to reach today's value.`
            : `At ${fmtNumber(n(i.inflationPercent, 3))}%/yr inflation, ${fmtCurrency(n(i.amount))} needs to grow to ${fmtCurrency(result)} just to buy the same things in year ${wholeYears} — tap a bar to see any year along the way.`,
      };
    },
    relatedSlugs: ["gdp-calculator"],
    content: {
      intro: [
        "A dollar figure by itself doesn't mean much across time — $10,000 today buys a very different basket of goods than $10,000 did twenty years ago, and will buy a different one again twenty years from now. Inflation erodes purchasing power steadily, which is easy to state as a fact and easy to underestimate as a number, since the effect compounds year over year rather than adding up in a straight line.",
        "This calculator projects that erosion (or growth, run in reverse) in either direction: what a sum today will effectively be worth in the future given an assumed inflation rate, or what a past amount would be worth in today's purchasing power.",
        "It's used for things like adjusting an old salary or price for comparison to today, sanity-checking whether a fixed pension or savings goal will keep pace with rising costs, or just building intuition for how much a given inflation rate actually matters over a decade or more.",
        "The amounts and timeframes you enter stay on your device and are never transmitted anywhere.",
      ],
      faq: [
        {
          q: "What's a realistic inflation rate to assume for a long-term projection?",
          a: "Historical average inflation has generally run in the low single digits annually over long stretches in most developed economies, though it varies notably by period and country. Running the same projection at a couple of different rates gives a more honest range than trusting one assumed number.",
        },
        {
          q: "What's the difference between this and a CPI-based inflation calculator?",
          a: "A calculator built on actual historical CPI (Consumer Price Index) data reflects what inflation genuinely was in specific past years. This one instead projects forward or backward using one constant assumed rate you choose, which is useful for planning but isn't a historical record.",
        },
        {
          q: "How does this relate to the interest or compound interest calculators on this site?",
          a: "The underlying math is identical to compound growth — inflation compounds the cost of things the same way interest compounds a balance. The difference is just framing: one shrinks purchasing power, the other grows an account balance.",
        },
        {
          q: "Should I use this to figure out if my savings are keeping up with inflation?",
          a: "It's a reasonable way to get a feel for it — project your savings goal forward at your expected investment return, and separately project today's cost of living forward at your assumed inflation rate, then compare the two.",
        },
      ],
    },
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
      const totalPay = commission + n(i.baseSalary);
      return {
        results: [
          { label: "Commission Earned", value: fmtCurrency(commission), emphasis: true },
          { label: "Total Pay", value: fmtCurrency(totalPay) },
        ],
        breakdown: [
          { label: "Base Salary", value: n(i.baseSalary), displayValue: fmtCurrency(n(i.baseSalary)) },
          { label: "Commission Earned", value: commission, displayValue: fmtCurrency(commission) },
        ],
        chartCaption:
          n(i.baseSalary) > 0
            ? `Commission makes up ${fmtNumber((commission / Math.max(1, totalPay)) * 100, 0)}% of this period's total pay — the rest is your fixed base salary.`
            : `This period's entire pay is commission — there's no base salary cushioning it, so it rises and falls directly with sales.`,
      };
    },
    relatedSlugs: ["salary-calculator"],
    content: {
      intro: [
        "Commission pay is simple in concept — a percentage of what you sold — but it stops feeling simple the moment you're trying to project a full paycheck that blends a base salary with variable commission, or comparing an offer that's commission-only against one with a safety-net base underneath it.",
        "This calculator does that blend directly: commission earned on a given sale amount, added to whatever base salary applies for the period, so the total pay figure is the one that actually matters for budgeting.",
        "It's aimed at sales roles sizing up a paycheck or comparing job offers with different base/commission splits, where the headline commission rate alone doesn't tell the whole story.",
        "Your sale figures and pay structure stay in your browser and aren't sent anywhere.",
      ],
      faq: [
        {
          q: "How is commission usually calculated?",
          a: "Most straightforwardly as a flat percentage of the sale amount, which is what this calculator models. Many real commission plans are more complex — tiered rates that increase past certain thresholds, or commission only on profit margin rather than sale price — so treat a flat-rate estimate as a starting point, not a guarantee.",
        },
        {
          q: "Is commission taxed differently from a regular salary?",
          a: "For federal withholding purposes, commission is generally treated as supplemental wages, which can be withheld at a different flat rate than regular salary — but the actual tax owed at year-end depends on your total annual income, not on how any one paycheck was withheld.",
        },
        {
          q: "What's the difference between commission-only and base-plus-commission pay?",
          a: "Commission-only pay rises and falls entirely with sales performance, with no floor in a slow period. Base-plus-commission provides a guaranteed minimum every pay period regardless of sales, with commission added on top — generally lower risk, often with a somewhat lower commission rate to offset the base.",
        },
        {
          q: "Does this handle tiered or graduated commission rates?",
          a: "No — this applies a single flat commission rate to the full sale amount. If your plan pays a higher rate above a certain sales threshold, calculate each tier's portion separately and add the results together.",
        },
      ],
    },
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
      const finalPrice = n(i.originalPrice) - savings;
      return {
        results: [
          { label: "You Save", value: fmtCurrency(savings), emphasis: true },
          { label: "Final Price", value: fmtCurrency(finalPrice), emphasis: true },
        ],
        breakdown: [
          { label: "Final Price", value: finalPrice, displayValue: fmtCurrency(finalPrice) },
          { label: "You Save", value: savings, displayValue: fmtCurrency(savings) },
        ],
        chartCaption: `Of the original ${fmtCurrency(n(i.originalPrice))} price, ${fmtNumber(n(i.percentOff, 30))}% off means ${fmtCurrency(savings)} stays in your pocket and ${fmtCurrency(finalPrice)} is what you actually pay.`,
      };
    },
    relatedSlugs: ["discount-calculator"],
    content: {
      intro: [
        "Percentage discounts are quick to eyeball but easy to get slightly wrong doing mental math at the register, especially with an odd percentage or an odd price — and the mistake compounds fast if you're stacking multiple discounts, since a second percent-off applies to the already-discounted price, not the original.",
        "This calculator gives the exact savings amount and final price for a single discount, useful for checking a sale tag, comparing two different percent-off deals on similarly priced items, or just skipping the mental math.",
        "Everything you enter here — the price, the discount — stays in your browser.",
      ],
      faq: [
        {
          q: "How do you calculate a percent-off discount by hand?",
          a: "Multiply the original price by the discount percentage (as a decimal) to get the amount saved, then subtract that from the original price for the final cost — for example, 30% off $50 saves $15, for a final price of $35.",
        },
        {
          q: "If two discounts are stacked, do the percentages just add together?",
          a: "No — stacked percentage discounts apply sequentially, each to the already-reduced price, not to the original. 20% off followed by another 10% off is not the same as 30% off in one step; it works out to a slightly smaller total discount.",
        },
        {
          q: "Is percent off calculated on the pre-tax or post-tax price?",
          a: "That depends on the store, but discounts are most commonly applied to the pre-tax price, with sales tax then calculated on the reduced amount — check the receipt or store policy if it matters for your comparison.",
        },
        {
          q: "How do I work out what percentage off a sale actually is, if I only know the original and sale prices?",
          a: "Subtract the sale price from the original price, divide that difference by the original price, then multiply by 100 — that gives you the percent-off figure the store is advertising.",
        },
      ],
    },
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
      const trueApr = aprMonthly * 12 * 100;
      return {
        results: [
          { label: "True APR", value: fmtPercent(trueApr), emphasis: true },
          { label: "Stated Rate", value: fmtPercent(n(i.statedRatePercent)) },
          { label: "Monthly Payment", value: fmtCurrency(payment) },
        ],
        notes: ["APR is higher than the stated rate because fees reduce what you actually receive while you still pay based on the full loan amount."],
        compare: [
          { label: "Stated Rate", value: n(i.statedRatePercent), displayValue: fmtPercent(n(i.statedRatePercent)) },
          { label: "True APR", value: trueApr, displayValue: fmtPercent(trueApr), highlight: true },
        ],
        chartCaption: `The ${fmtCurrency(n(i.fees))} in upfront fees is why the true cost of borrowing, ${fmtPercent(trueApr)}, runs higher than the ${fmtPercent(n(i.statedRatePercent))} rate advertised on the loan.`,
      };
    },
    relatedSlugs: ["interest-rate-calculator", "loan-calculator"],
    content: {
      intro: [
        "The interest rate a lender advertises and the true cost of borrowing from them aren't the same number the moment fees enter the picture. Upfront fees — origination charges, points, processing fees — reduce how much money you actually receive while you still make payments calculated on the full loan amount, which means the effective rate you're really paying is higher than the stated rate on the note.",
        "APR (annual percentage rate) is the standardized way of expressing that true cost, folding fees into an equivalent interest rate so loans with different fee structures can actually be compared apples-to-apples. This calculator computes it directly from a loan amount, stated rate, upfront fees and term.",
        "It's meant for anyone comparing loan offers that look similar on their headline rate but differ in fees, or trying to understand why a lender's disclosed APR runs higher than the rate quoted verbally.",
        "The loan details you enter are never sent anywhere — the calculation runs entirely in your browser.",
      ],
      howItWorks: [
        "The monthly payment is first calculated from the stated (nominal) rate on the full loan amount, the normal way. But you don't actually receive the full loan amount — fees are subtracted upfront, so your real net proceeds are lower.",
        "True APR is the rate at which that same monthly payment, discounted back to a present value, equals your actual net proceeds rather than the full loan amount — found the same way the interest rate calculator finds an unknown rate: an iterative numerical search rather than a direct formula, since APR with fees folded in has no closed-form solution either.",
      ],
      faq: [
        {
          q: "Why is APR higher than the interest rate a lender quotes?",
          a: "Because APR accounts for upfront fees on top of the stated interest rate — fees reduce what you actually receive while your payments are still calculated on the full loan amount, which effectively raises the true cost of borrowing above the bare interest rate.",
        },
        {
          q: "Does APR include every fee a lender might charge?",
          a: "Only the fees factored into the calculation — this tool uses whatever you enter as upfront fees. Real-world APR disclosures are supposed to include most finance-related charges by regulation, but not always every possible fee (like a late payment fee), so read the loan's actual disclosure carefully.",
        },
        {
          q: "Is APR the right number to compare two loan offers?",
          a: "Generally yes, more so than the stated rate alone — since APR standardizes for fees, it's the number designed specifically for comparing loans that might otherwise look similar on their headline rate but differ in upfront cost.",
        },
        {
          q: "Why can't APR with fees be solved with a simple formula the way a basic payment can?",
          a: "Once fees change the net proceeds while payments stay based on the full loan amount, the rate that reconciles the two is embedded in an equation that can't be algebraically isolated — so it's found the same way an unknown interest rate is: by iteratively testing rates until the numbers converge.",
        },
      ],
    },
  },
];

export default financialTax;
