import type { CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { monthlyPayment, remainingBalance, solveMaxByBisection, payoffCalc, payoffMonths, loanBreakdown } from "./finance-helpers";

/** Sample amortization schedule rows (year, cumulative principal paid, cumulative interest
 *  paid, remaining balance), thinned to every `stepYears` years plus the final year — the
 *  data behind the amortization table, so we don't dump 360 monthly rows on the user. */
function amortizationScheduleSample(principal: number, monthlyRate: number, payment: number, stepYears = 5, maxMonths = 600): string[][] {
  const rows: string[][] = [];
  let balance = principal;
  let cumPrincipal = 0;
  let cumInterest = 0;
  let month = 0;
  let lastYearShown = 0;
  while (balance > 0.005 && month < maxMonths) {
    const interest = balance * monthlyRate;
    let principalPaid = payment - interest;
    if (principalPaid > balance) principalPaid = balance;
    balance = Math.max(0, balance - principalPaid);
    cumPrincipal += principalPaid;
    cumInterest += interest;
    month++;
    const isYearEnd = month % 12 === 0;
    const isFinal = balance <= 0.005 || month >= maxMonths;
    if (isYearEnd || isFinal) {
      const year = Math.ceil(month / 12);
      if (year !== lastYearShown && (year % stepYears === 0 || isFinal)) {
        rows.push([`Year ${year}`, fmtCurrency(cumPrincipal), fmtCurrency(cumInterest), fmtCurrency(balance)]);
        lastYearShown = year;
      }
    }
  }
  return rows;
}

const financialLoans: CalculatorDefinition[] = [
  {
    slug: "house-affordability-calculator",
    title: "House Affordability Calculator",
    category: "financial",
    shortDescription: "Find the maximum home price you can afford based on income and debts.",
    seoDescription: "Calculate the maximum home price you can afford from your income, existing debts, down payment and target debt-to-income ratio.",
    formulaSummary: "Max payment = income × DTI limit − existing debts; solved for home price",
    fields: [
      { name: "annualIncome", label: "Annual Gross Income", type: "number", unit: "$", defaultValue: 90000, min: 0 },
      { name: "monthlyDebts", label: "Other Monthly Debt Payments", type: "number", unit: "$", defaultValue: 400, min: 0 },
      { name: "downPayment", label: "Down Payment", type: "number", unit: "$", defaultValue: 30000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01, min: 0 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "dtiLimitPercent", label: "Max Debt-to-Income Ratio", type: "number", unit: "%", defaultValue: 36, min: 1, max: 60 },
      { name: "taxInsPercent", label: "Property Tax + Insurance (annual, % of price)", type: "number", unit: "%", defaultValue: 1.5, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const maxMonthly = Math.max(0, (n(i.annualIncome) / 12) * (n(i.dtiLimitPercent, 36) / 100) - n(i.monthlyDebts));
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.termYears, 30) * 12;
      const down = n(i.downPayment);
      const taxInsMonthlyRate = n(i.taxInsPercent) / 100 / 12;
      const price = solveMaxByBisection(
        maxMonthly,
        (x) => monthlyPayment(Math.max(0, x - down), r, nper) + x * taxInsMonthlyRate,
        down,
        down + 5000000
      );
      const loanAmount = Math.max(0, price - down);
      return {
        results: [
          { label: "Max Affordable Home Price", value: fmtCurrency(price), emphasis: true },
          { label: "Max Monthly Payment (PITI budget)", value: fmtCurrency(maxMonthly) },
          { label: "Loan Amount", value: fmtCurrency(loanAmount) },
        ],
        notes: [`Assumes property tax + insurance ≈ ${fmtNumber(n(i.taxInsPercent))}% of home price per year. Lenders' exact DTI rules vary.`],
        breakdown: [
          { label: "Down Payment", value: down, displayValue: fmtCurrency(down) },
          { label: "Loan Amount", value: loanAmount, displayValue: fmtCurrency(loanAmount) },
        ],
        chartCaption: `Your income and debts support a home up to ${fmtCurrency(price)} — ${fmtCurrency(down)} of that is your down payment, the rest is financed.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "debt-ratio-calculator"],
  },
  {
    slug: "refinance-calculator",
    title: "Refinance Calculator",
    category: "financial",
    shortDescription: "See your new payment, monthly savings and breakeven point on a refinance.",
    seoDescription: "Compare your current mortgage to a refinance offer — new monthly payment, monthly savings and the breakeven point on closing costs.",
    formulaSummary: "Breakeven months = closing costs ÷ monthly savings",
    fields: [
      { name: "currentBalance", label: "Current Loan Balance", type: "number", unit: "$", defaultValue: 280000, min: 0 },
      { name: "currentRatePercent", label: "Current Interest Rate", type: "number", unit: "%", defaultValue: 7.2, step: 0.01 },
      { name: "remainingYears", label: "Years Remaining", type: "number", unit: "years", defaultValue: 27, min: 1 },
      { name: "newRatePercent", label: "New Interest Rate", type: "number", unit: "%", defaultValue: 6.2, step: 0.01 },
      { name: "newTermYears", label: "New Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "closingCosts", label: "Closing Costs", type: "number", unit: "$", defaultValue: 4500, min: 0 },
    ],
    calculate: (i) => {
      const bal = n(i.currentBalance);
      const currentPmt = monthlyPayment(bal, n(i.currentRatePercent) / 100 / 12, n(i.remainingYears) * 12);
      const newPmt = monthlyPayment(bal, n(i.newRatePercent) / 100 / 12, n(i.newTermYears) * 12);
      const savings = currentPmt - newPmt;
      const breakeven = savings > 0 ? n(i.closingCosts) / savings : Infinity;
      return {
        results: [
          { label: "New Monthly Payment", value: fmtCurrency(newPmt), emphasis: true },
          { label: "Monthly Savings", value: fmtCurrency(savings), emphasis: true },
          { label: "Breakeven on Closing Costs", value: Number.isFinite(breakeven) ? `${fmtNumber(breakeven, 1)} months` : "Never (no savings)" },
        ],
        steps: [`Current payment ${fmtCurrency(currentPmt)} − new payment ${fmtCurrency(newPmt)} = ${fmtCurrency(savings)}/mo saved`],
        compare: [
          { label: "Current Payment", value: currentPmt, displayValue: fmtCurrency(currentPmt) },
          { label: "New Payment", value: newPmt, displayValue: fmtCurrency(newPmt), highlight: newPmt < currentPmt },
        ],
        chartCaption:
          savings >= 0
            ? `Refinancing drops your payment from ${fmtCurrency(currentPmt)} to ${fmtCurrency(newPmt)} — saving ${fmtCurrency(savings)}/mo.`
            : `This offer raises your payment from ${fmtCurrency(currentPmt)} to ${fmtCurrency(newPmt)} — ${fmtCurrency(-savings)}/mo more.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "mortgage-payoff-calculator"],
  },
  {
    slug: "rent-vs-buy-calculator",
    title: "Rent vs. Buy Calculator",
    category: "financial",
    shortDescription: "Compare the total cost of renting vs. buying over a number of years.",
    seoDescription: "Compare the net cost of renting vs. buying a home over your expected time in the property, including equity built and appreciation.",
    formulaSummary: "Net buy cost = cash outlay − home equity at exit",
    fields: [
      { name: "monthlyRent", label: "Monthly Rent", type: "number", unit: "$", defaultValue: 2000, min: 0 },
      { name: "homePrice", label: "Home Price", type: "number", unit: "$", defaultValue: 400000, min: 0 },
      { name: "downPaymentPercent", label: "Down Payment", type: "number", unit: "%", defaultValue: 20, min: 0, max: 100 },
      { name: "ratePercent", label: "Mortgage Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "yearsToStay", label: "Years You'll Stay", type: "number", unit: "years", defaultValue: 7, min: 1 },
      { name: "appreciationPercent", label: "Annual Home Appreciation", type: "number", unit: "%", defaultValue: 3, step: 0.1 },
      { name: "taxMaintPercent", label: "Annual Tax + Maintenance", type: "number", unit: "% of price", defaultValue: 2.5, step: 0.1 },
    ],
    calculate: (i) => {
      const price = n(i.homePrice);
      const down = price * (n(i.downPaymentPercent, 20) / 100);
      const loan = price - down;
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.termYears, 30) * 12;
      const pmt = monthlyPayment(loan, r, nper);
      const years = n(i.yearsToStay, 7);
      const monthsStayed = Math.min(nper, years * 12);
      const totalPI = pmt * monthsStayed;
      const taxMaint = price * (n(i.taxMaintPercent) / 100) * years;
      const futureValue = price * Math.pow(1 + n(i.appreciationPercent) / 100, years);
      const balanceLeft = remainingBalance(loan, r, nper, monthsStayed);
      const equity = futureValue - balanceLeft;
      const netBuyCost = down + totalPI + taxMaint - equity;
      const rentCost = n(i.monthlyRent) * 12 * years;
      return {
        results: [
          { label: `Net Cost of Buying (${years}y)`, value: fmtCurrency(netBuyCost), emphasis: true },
          { label: `Cost of Renting (${years}y)`, value: fmtCurrency(rentCost), emphasis: true },
          { label: netBuyCost < rentCost ? "Buying is cheaper by" : "Renting is cheaper by", value: fmtCurrency(Math.abs(rentCost - netBuyCost)) },
          { label: "Home Equity Built", value: fmtCurrency(equity) },
        ],
        notes: ["A simplified comparison — ignores rent growth, investment returns on the money not tied up in a down payment, and selling costs."],
        compare: [
          { label: "Net Cost of Buying", value: netBuyCost, displayValue: fmtCurrency(netBuyCost), highlight: netBuyCost < rentCost },
          { label: "Cost of Renting", value: rentCost, displayValue: fmtCurrency(rentCost), highlight: rentCost < netBuyCost },
        ],
        chartCaption: `Over ${years} years, ${netBuyCost < rentCost ? "buying" : "renting"} comes out ahead by ${fmtCurrency(Math.abs(rentCost - netBuyCost))}.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "rent-calculator"],
  },
  {
    slug: "down-payment-calculator",
    title: "Down Payment Calculator",
    category: "financial",
    shortDescription: "Calculate the down payment amount and resulting loan size for a home purchase.",
    seoDescription: "Calculate your down payment amount from a percentage or a dollar amount, and see the resulting loan amount and PMI implications.",
    formulaSummary: "Down payment = home price × down payment %",
    fields: [
      { name: "homePrice", label: "Home Price", type: "number", unit: "$", defaultValue: 350000, min: 0 },
      { name: "downPaymentPercent", label: "Down Payment", type: "number", unit: "%", defaultValue: 10, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const price = n(i.homePrice);
      const pct = n(i.downPaymentPercent, 10);
      const down = price * (pct / 100);
      const loan = price - down;
      return {
        results: [
          { label: "Down Payment", value: fmtCurrency(down), emphasis: true },
          { label: "Loan Amount", value: fmtCurrency(loan) },
        ],
        notes: pct < 20 ? ["Down payments under 20% typically require private mortgage insurance (PMI) on conventional loans."] : undefined,
        breakdown: [
          { label: "Down Payment", value: down, displayValue: fmtCurrency(down) },
          { label: "Loan Amount", value: loan, displayValue: fmtCurrency(loan) },
        ],
        chartCaption: `You're financing ${fmtNumber(100 - pct, 0)}% of the price — putting ${fmtCurrency(down)} down on a ${fmtCurrency(price)} home.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "house-affordability-calculator"],
  },
  {
    slug: "fha-loan-calculator",
    title: "FHA Loan Calculator",
    category: "financial",
    shortDescription: "Estimate FHA mortgage payments including upfront and monthly mortgage insurance.",
    seoDescription: "Calculate your FHA loan monthly payment including the upfront and annual mortgage insurance premium (MIP).",
    formulaSummary: "Total loan = base loan + financed upfront MIP",
    fields: [
      { name: "homePrice", label: "Home Price", type: "number", unit: "$", defaultValue: 300000, min: 0 },
      { name: "downPaymentPercent", label: "Down Payment", type: "number", unit: "%", defaultValue: 3.5, min: 3.5, max: 100, step: 0.1 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "upfrontMipPercent", label: "Upfront MIP", type: "number", unit: "%", defaultValue: 1.75, step: 0.01 },
      { name: "annualMipPercent", label: "Annual MIP", type: "number", unit: "%", defaultValue: 0.55, step: 0.01 },
    ],
    calculate: (i) => {
      const loanAmount = n(i.homePrice) * (1 - n(i.downPaymentPercent, 3.5) / 100);
      const upfrontMip = loanAmount * (n(i.upfrontMipPercent) / 100);
      const totalLoan = loanAmount + upfrontMip;
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.termYears, 30) * 12;
      const pi = monthlyPayment(totalLoan, r, nper);
      const monthlyMip = (totalLoan * (n(i.annualMipPercent) / 100)) / 12;
      return {
        results: [
          { label: "Principal & Interest", value: fmtCurrency(pi), emphasis: true },
          { label: "Monthly MIP", value: fmtCurrency(monthlyMip) },
          { label: "Total Monthly Payment", value: fmtCurrency(pi + monthlyMip), emphasis: true },
          { label: "Upfront MIP (financed)", value: fmtCurrency(upfrontMip) },
        ],
        breakdown: [
          { label: "Principal & Interest", value: pi, displayValue: fmtCurrency(pi) },
          { label: "Monthly MIP", value: monthlyMip, displayValue: fmtCurrency(monthlyMip) },
        ],
        chartCaption: `FHA's mortgage insurance premium adds ${fmtCurrency(monthlyMip)} to every payment — on top of the ${fmtCurrency(upfrontMip)} upfront MIP already rolled into your loan.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "va-mortgage-calculator"],
  },
  {
    slug: "va-mortgage-calculator",
    title: "VA Mortgage Calculator",
    category: "financial",
    shortDescription: "Estimate a VA loan payment including the VA funding fee.",
    seoDescription: "Calculate your VA loan monthly payment including the VA funding fee, with $0 down payment support.",
    formulaSummary: "Total loan = base loan + financed funding fee",
    fields: [
      { name: "homePrice", label: "Home Price", type: "number", unit: "$", defaultValue: 300000, min: 0 },
      { name: "downPaymentPercent", label: "Down Payment", type: "number", unit: "%", defaultValue: 0, min: 0, max: 100, step: 0.1 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.25, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "fundingFeePercent", label: "VA Funding Fee", type: "number", unit: "%", defaultValue: 2.15, step: 0.01, help: "2.15% for first-time use with 0% down; varies by down payment and use" },
    ],
    calculate: (i) => {
      const loanAmount = n(i.homePrice) * (1 - n(i.downPaymentPercent) / 100);
      const fundingFee = loanAmount * (n(i.fundingFeePercent) / 100);
      const totalLoan = loanAmount + fundingFee;
      const pi = monthlyPayment(totalLoan, n(i.ratePercent) / 100 / 12, n(i.termYears, 30) * 12);
      return {
        results: [
          { label: "Monthly Payment (P&I)", value: fmtCurrency(pi), emphasis: true },
          { label: "VA Funding Fee (financed)", value: fmtCurrency(fundingFee) },
          { label: "Total Loan Amount", value: fmtCurrency(totalLoan) },
        ],
        breakdown: [
          { label: "Base Loan Amount", value: loanAmount, displayValue: fmtCurrency(loanAmount) },
          { label: "VA Funding Fee", value: fundingFee, displayValue: fmtCurrency(fundingFee) },
        ],
        chartCaption: `Rolling the funding fee into the loan means you're financing ${fmtCurrency(fundingFee)} extra — ${fmtNumber((fundingFee / totalLoan) * 100, 1)}% of your total loan is fee, not home.`,
      };
    },
    relatedSlugs: ["fha-loan-calculator", "mortgage-calculator"],
  },
  {
    slug: "home-equity-loan-calculator",
    title: "Home Equity Loan Calculator",
    category: "financial",
    shortDescription: "Find your available home equity and the payment on a home equity loan.",
    seoDescription: "Calculate your available home equity and the monthly payment on a fixed-rate home equity loan.",
    formulaSummary: "Available equity = home value × max LTV% − mortgage balance",
    fields: [
      { name: "homeValue", label: "Home Value", type: "number", unit: "$", defaultValue: 450000, min: 0 },
      { name: "mortgageBalance", label: "Current Mortgage Balance", type: "number", unit: "$", defaultValue: 220000, min: 0 },
      { name: "loanAmount", label: "Desired Loan Amount", type: "number", unit: "$", defaultValue: 50000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 8.5, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 10, min: 1 },
      { name: "maxLtvPercent", label: "Lender's Max LTV", type: "number", unit: "%", defaultValue: 85, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const availableEquity = Math.max(0, n(i.homeValue) * (n(i.maxLtvPercent, 85) / 100) - n(i.mortgageBalance));
      const pmt = monthlyPayment(n(i.loanAmount), n(i.ratePercent) / 100 / 12, n(i.termYears, 10) * 12);
      return {
        results: [
          { label: "Available Equity", value: fmtCurrency(availableEquity), emphasis: true },
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
        ],
        notes: n(i.loanAmount) > availableEquity ? ["Your requested loan amount exceeds the available equity at this lender's max LTV."] : undefined,
        compare: [
          { label: "Available Equity", value: availableEquity, displayValue: fmtCurrency(availableEquity) },
          { label: "Requested Loan Amount", value: n(i.loanAmount), displayValue: fmtCurrency(n(i.loanAmount)), highlight: n(i.loanAmount) <= availableEquity },
        ],
        chartCaption:
          n(i.loanAmount) <= availableEquity
            ? `Your ${fmtCurrency(n(i.loanAmount))} request fits comfortably within the ${fmtCurrency(availableEquity)} of equity available at this lender's max LTV.`
            : `Your ${fmtCurrency(n(i.loanAmount))} request exceeds the ${fmtCurrency(availableEquity)} of available equity by ${fmtCurrency(n(i.loanAmount) - availableEquity)}.`,
      };
    },
    relatedSlugs: ["heloc-calculator"],
  },
  {
    slug: "heloc-calculator",
    title: "HELOC Calculator",
    category: "financial",
    shortDescription: "Find your available credit line and interest-only draw-period payment.",
    seoDescription: "Calculate your available HELOC credit line and the interest-only payment during the draw period.",
    formulaSummary: "Interest-only payment = balance drawn × rate ÷ 12",
    fields: [
      { name: "homeValue", label: "Home Value", type: "number", unit: "$", defaultValue: 450000, min: 0 },
      { name: "mortgageBalance", label: "Current Mortgage Balance", type: "number", unit: "$", defaultValue: 220000, min: 0 },
      { name: "drawAmount", label: "Amount You Plan to Draw", type: "number", unit: "$", defaultValue: 40000, min: 0 },
      { name: "ratePercent", label: "Variable Interest Rate", type: "number", unit: "%", defaultValue: 9, step: 0.01 },
      { name: "maxLtvPercent", label: "Lender's Max CLTV", type: "number", unit: "%", defaultValue: 85, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const availableCredit = Math.max(0, n(i.homeValue) * (n(i.maxLtvPercent, 85) / 100) - n(i.mortgageBalance));
      const interestOnly = (n(i.drawAmount) * (n(i.ratePercent) / 100)) / 12;
      return {
        results: [
          { label: "Available Credit Line", value: fmtCurrency(availableCredit), emphasis: true },
          { label: "Interest-Only Payment (draw period)", value: fmtCurrency(interestOnly), emphasis: true },
        ],
        notes: ["HELOC rates are variable — this payment will change if the rate changes. Repayment-period payments are higher once principal is included."],
        compare: [
          { label: "Available Credit Line", value: availableCredit, displayValue: fmtCurrency(availableCredit) },
          { label: "Amount You Plan to Draw", value: n(i.drawAmount), displayValue: fmtCurrency(n(i.drawAmount)), highlight: n(i.drawAmount) <= availableCredit },
        ],
        chartCaption:
          n(i.drawAmount) <= availableCredit
            ? `You're planning to draw ${fmtCurrency(n(i.drawAmount))} of the ${fmtCurrency(availableCredit)} credit line available to you.`
            : `Your planned draw of ${fmtCurrency(n(i.drawAmount))} exceeds the ${fmtCurrency(availableCredit)} credit line available at this lender's max CLTV.`,
      };
    },
    relatedSlugs: ["home-equity-loan-calculator"],
  },
  {
    slug: "rental-property-calculator",
    title: "Rental Property Calculator",
    category: "financial",
    shortDescription: "Estimate cash flow, cap rate and cash-on-cash return for a rental property.",
    seoDescription: "Calculate monthly cash flow, cap rate and cash-on-cash return for a rental property investment.",
    formulaSummary: "Cap rate = NOI ÷ price; Cash-on-cash = annual cash flow ÷ cash invested",
    fields: [
      { name: "purchasePrice", label: "Purchase Price", type: "number", unit: "$", defaultValue: 250000, min: 0 },
      { name: "downPaymentPercent", label: "Down Payment", type: "number", unit: "%", defaultValue: 25, min: 0, max: 100 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 7, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "monthlyRent", label: "Monthly Rent", type: "number", unit: "$", defaultValue: 2200, min: 0 },
      { name: "monthlyExpenses", label: "Monthly Expenses (tax, insurance, maintenance)", type: "number", unit: "$", defaultValue: 500, min: 0 },
      { name: "vacancyPercent", label: "Vacancy Rate", type: "number", unit: "%", defaultValue: 5, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const price = n(i.purchasePrice);
      const down = price * (n(i.downPaymentPercent, 25) / 100);
      const loan = price - down;
      const pi = monthlyPayment(loan, n(i.ratePercent) / 100 / 12, n(i.termYears, 30) * 12);
      const effectiveRent = n(i.monthlyRent) * (1 - n(i.vacancyPercent) / 100);
      const noiMonthly = effectiveRent - n(i.monthlyExpenses);
      const cashFlow = noiMonthly - pi;
      const capRate = ((noiMonthly * 12) / price) * 100;
      const cashOnCash = down > 0 ? ((cashFlow * 12) / down) * 100 : NaN;
      return {
        results: [
          { label: "Monthly Cash Flow", value: fmtCurrency(cashFlow), emphasis: true },
          { label: "Cap Rate", value: fmtPercent(capRate) },
          { label: "Cash-on-Cash Return", value: fmtPercent(cashOnCash), emphasis: true },
          { label: "Monthly P&I", value: fmtCurrency(pi) },
        ],
        breakdown: [
          { label: "Operating Expenses", value: n(i.monthlyExpenses), displayValue: fmtCurrency(n(i.monthlyExpenses)) },
          { label: "Mortgage P&I", value: pi, displayValue: fmtCurrency(pi) },
          { label: "Net Cash Flow", value: Math.max(0, cashFlow), displayValue: fmtCurrency(cashFlow) },
        ],
        chartCaption: `Of the ${fmtCurrency(effectiveRent)}/mo in expected rent (after vacancy), ${fmtCurrency(n(i.monthlyExpenses))} covers expenses and ${fmtCurrency(pi)} covers the mortgage — leaving ${fmtCurrency(cashFlow)} in cash flow.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "roi-calculator"],
  },
  {
    slug: "personal-loan-calculator",
    title: "Personal Loan Calculator",
    category: "financial",
    shortDescription: "Calculate the payment and total cost of a personal loan, including an origination fee.",
    seoDescription: "Calculate the monthly payment and total cost of a personal loan, including any origination fee.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 12000, min: 0 },
      { name: "ratePercent", label: "Interest Rate (APR)", type: "number", unit: "%", defaultValue: 11, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 36, min: 1 },
      { name: "originationFeePercent", label: "Origination Fee", type: "number", unit: "%", defaultValue: 3, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const principal = n(i.principal);
      const fee = principal * (n(i.originationFeePercent) / 100);
      const pmt = monthlyPayment(principal, n(i.ratePercent) / 100 / 12, n(i.termMonths, 36));
      const netDisbursed = principal - fee;
      const totalInterest = pmt * n(i.termMonths, 36) - principal;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
          { label: "Origination Fee", value: fmtCurrency(fee) },
          { label: "You Receive", value: fmtCurrency(netDisbursed) },
          { label: "Total Cost of Loan", value: fmtCurrency(pmt * n(i.termMonths, 36)) },
        ],
        ...loanBreakdown(principal, totalInterest, { label: "Origination Fee", value: fee }),
      };
    },
    relatedSlugs: ["loan-calculator", "business-loan-calculator"],
  },
  {
    slug: "boat-loan-calculator",
    title: "Boat Loan Calculator",
    category: "financial",
    shortDescription: "Calculate the monthly payment on a boat loan.",
    seoDescription: "Calculate your monthly boat loan payment from price, down payment, interest rate and term.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "boatPrice", label: "Boat Price", type: "number", unit: "$", defaultValue: 45000, min: 0 },
      { name: "downPayment", label: "Down Payment", type: "number", unit: "$", defaultValue: 9000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 8, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 120, min: 1 },
    ],
    calculate: (i) => {
      const principal = Math.max(0, n(i.boatPrice) - n(i.downPayment));
      const pmt = monthlyPayment(principal, n(i.ratePercent) / 100 / 12, n(i.termMonths, 120));
      const totalInterest = pmt * n(i.termMonths, 120) - principal;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
          { label: "Total Interest", value: fmtCurrency(totalInterest) },
        ],
        ...loanBreakdown(principal, totalInterest),
      };
    },
    relatedSlugs: ["auto-loan-calculator", "loan-calculator"],
  },
  {
    slug: "lease-calculator",
    title: "Lease Calculator",
    category: "financial",
    shortDescription: "Estimate a monthly lease payment from asset value, residual value and money factor.",
    seoDescription: "Calculate a monthly lease payment from asset value, residual value, lease term and interest rate (converted to money factor).",
    formulaSummary: "Payment = depreciation fee + finance fee",
    fields: [
      { name: "assetValue", label: "Asset Value (negotiated price)", type: "number", unit: "$", defaultValue: 35000, min: 0 },
      { name: "residualPercent", label: "Residual Value", type: "number", unit: "% of asset value", defaultValue: 55, min: 0, max: 100 },
      { name: "ratePercent", label: "Interest Rate (APR)", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "termMonths", label: "Lease Term", type: "number", unit: "months", defaultValue: 36, min: 1 },
    ],
    calculate: (i) => {
      const value = n(i.assetValue);
      const residual = value * (n(i.residualPercent, 55) / 100);
      const term = n(i.termMonths, 36);
      const moneyFactor = n(i.ratePercent) / 2400;
      const depreciationFee = (value - residual) / term;
      const financeFee = (value + residual) * moneyFactor;
      const payment = depreciationFee + financeFee;
      return {
        results: [
          { label: "Monthly Lease Payment", value: fmtCurrency(payment), emphasis: true },
          { label: "Depreciation Portion", value: fmtCurrency(depreciationFee) },
          { label: "Finance (Rent Charge) Portion", value: fmtCurrency(financeFee) },
          { label: "Residual Value", value: fmtCurrency(residual) },
        ],
        notes: [`Money factor ≈ APR ÷ 2400 = ${fmtNumber(moneyFactor, 5)}`],
        breakdown: [
          { label: "Depreciation", value: depreciationFee, displayValue: fmtCurrency(depreciationFee) },
          { label: "Finance Charge", value: financeFee, displayValue: fmtCurrency(financeFee) },
        ],
        chartCaption: `${fmtNumber((financeFee / Math.max(1, payment)) * 100, 0)}% of every lease payment is pure finance charge — money you'd skip entirely by paying cash.`,
      };
    },
    relatedSlugs: ["auto-loan-calculator"],
  },
  {
    slug: "business-loan-calculator",
    title: "Business Loan Calculator",
    category: "financial",
    shortDescription: "Calculate the monthly payment on a business loan, including an origination fee.",
    seoDescription: "Calculate the monthly payment and total cost of a business loan, including any origination fee.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 75000, min: 0 },
      { name: "ratePercent", label: "Interest Rate (APR)", type: "number", unit: "%", defaultValue: 9.5, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 60, min: 1 },
      { name: "originationFeePercent", label: "Origination Fee", type: "number", unit: "%", defaultValue: 2, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const principal = n(i.principal);
      const fee = principal * (n(i.originationFeePercent) / 100);
      const pmt = monthlyPayment(principal, n(i.ratePercent) / 100 / 12, n(i.termMonths, 60));
      const totalInterest = pmt * n(i.termMonths, 60) - principal;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
          { label: "Origination Fee", value: fmtCurrency(fee) },
          { label: "Total Cost of Loan", value: fmtCurrency(pmt * n(i.termMonths, 60) + fee) },
        ],
        ...loanBreakdown(principal, totalInterest, { label: "Origination Fee", value: fee }),
      };
    },
    relatedSlugs: ["personal-loan-calculator", "loan-calculator"],
  },
  {
    slug: "mortgage-calculator-uk",
    title: "UK Mortgage Calculator",
    category: "financial",
    jurisdiction: "UK",
    shortDescription: "Estimate a UK mortgage payment and Stamp Duty Land Tax (SDLT).",
    seoDescription: "Calculate a UK mortgage monthly repayment and estimate Stamp Duty Land Tax (SDLT) on the purchase.",
    formulaSummary: "England/NI SDLT bands (standard residential rates)",
    fields: [
      { name: "purchasePrice", label: "Purchase Price", type: "number", unit: "£", defaultValue: 350000, min: 0 },
      { name: "deposit", label: "Deposit", type: "number", unit: "£", defaultValue: 70000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 5.5, step: 0.01 },
      { name: "termYears", label: "Term", type: "number", unit: "years", defaultValue: 25, min: 1 },
    ],
    calculate: (i) => {
      const price = n(i.purchasePrice);
      const loan = Math.max(0, price - n(i.deposit));
      const pmt = monthlyPayment(loan, n(i.ratePercent) / 100 / 12, n(i.termYears, 25) * 12);
      const bands = [
        { upTo: 250000, rate: 0 },
        { upTo: 925000, rate: 0.05 },
        { upTo: 1500000, rate: 0.1 },
        { upTo: Infinity, rate: 0.12 },
      ];
      let sdlt = 0;
      let lower = 0;
      for (const b of bands) {
        const upper = Math.min(price, b.upTo);
        if (upper > lower) sdlt += (upper - lower) * b.rate;
        lower = b.upTo;
        if (price <= b.upTo) break;
      }
      const totalInterest = pmt * n(i.termYears, 25) * 12 - loan;
      return {
        results: [
          { label: "Monthly Repayment", value: `£${fmtNumber(pmt)}`, emphasis: true },
          { label: "Estimated Stamp Duty (SDLT)", value: `£${fmtNumber(sdlt)}` },
          { label: "Loan (Mortgage) Amount", value: `£${fmtNumber(loan)}` },
        ],
        notes: ["Standard England/NI residential SDLT bands shown — first-time buyer relief, Scotland (LBTT) and Wales (LTT) use different bands."],
        breakdown: [
          { label: "Loan Amount", value: loan, displayValue: `£${fmtNumber(loan)}` },
          { label: "Total Interest", value: totalInterest, displayValue: `£${fmtNumber(totalInterest)}` },
        ],
        chartCaption: `Over ${n(i.termYears, 25)} years you'll pay back £${fmtNumber(loan + totalInterest)} on a £${fmtNumber(loan)} loan — interest alone adds ${fmtNumber((totalInterest / Math.max(1, loan)) * 100, 0)}%.`,
      };
    },
    relatedSlugs: ["mortgage-calculator"],
  },
  {
    slug: "canadian-mortgage-calculator",
    title: "Canadian Mortgage Calculator",
    category: "financial",
    shortDescription: "Calculate a Canadian mortgage payment using semi-annual compounding.",
    seoDescription: "Calculate a Canadian mortgage payment — Canadian fixed rates compound semi-annually by law, unlike the US convention.",
    formulaSummary: "Effective monthly rate derived from semi-annual compounding",
    fields: [
      { name: "principal", label: "Mortgage Amount", type: "number", unit: "$", defaultValue: 400000, min: 0 },
      { name: "ratePercent", label: "Nominal Annual Rate", type: "number", unit: "%", defaultValue: 5.5, step: 0.01 },
      { name: "termYears", label: "Amortization Period", type: "number", unit: "years", defaultValue: 25, min: 1 },
    ],
    calculate: (i) => {
      const iSemi = n(i.ratePercent) / 2 / 100;
      const effectiveAnnual = Math.pow(1 + iSemi, 2) - 1;
      const monthlyRate = Math.pow(1 + effectiveAnnual, 1 / 12) - 1;
      const nper = n(i.termYears, 25) * 12;
      const pmt = monthlyPayment(n(i.principal), monthlyRate, nper);
      const totalInterest = pmt * nper - n(i.principal);
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(pmt), emphasis: true },
          { label: "Effective Annual Rate", value: fmtPercent(effectiveAnnual * 100) },
        ],
        notes: ["Canadian law requires fixed mortgage rates to compound semi-annually — this gives a slightly different monthly rate than the US convention of monthly compounding."],
        ...loanBreakdown(n(i.principal), totalInterest),
      };
    },
    relatedSlugs: ["mortgage-calculator"],
  },
  {
    slug: "mortgage-amortization-calculator",
    title: "Mortgage Amortization Calculator",
    category: "financial",
    shortDescription: "See how extra payments shorten your mortgage and cut total interest.",
    seoDescription: "Calculate how much time and interest you save by making extra monthly payments on your mortgage.",
    formulaSummary: "Iterative amortization with an extra principal payment each month",
    fields: [
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 320000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01 },
      { name: "termYears", label: "Loan Term", type: "number", unit: "years", defaultValue: 30, min: 1 },
      { name: "extraMonthly", label: "Extra Monthly Payment", type: "number", unit: "$", defaultValue: 200, min: 0 },
    ],
    calculate: (i) => {
      const principal = n(i.principal);
      const r = n(i.ratePercent) / 100 / 12;
      const nper = n(i.termYears, 30) * 12;
      const basePmt = monthlyPayment(principal, r, nper);
      const withExtra = payoffMonths(principal, n(i.ratePercent), basePmt + n(i.extraMonthly));
      const withoutExtra = payoffMonths(principal, n(i.ratePercent), basePmt);
      if (!withExtra || !withoutExtra) return { results: [], error: "Enter a valid payment that covers the monthly interest." };
      const scheduleRows = amortizationScheduleSample(principal, r, basePmt + n(i.extraMonthly));
      return {
        results: [
          { label: "Standard Payoff Time", value: `${(withoutExtra.months / 12).toFixed(1)} years` },
          { label: "Payoff Time With Extra Payment", value: `${(withExtra.months / 12).toFixed(1)} years`, emphasis: true },
          { label: "Interest Saved", value: fmtCurrency(withoutExtra.totalInterest - withExtra.totalInterest), emphasis: true },
          { label: "Standard Monthly Payment", value: fmtCurrency(basePmt) },
        ],
        table: { headers: ["Year", "Principal Paid", "Interest Paid", "Remaining Balance"], rows: scheduleRows },
        chartCaption: `Sample years from your amortization schedule with the extra ${fmtCurrency(n(i.extraMonthly))}/mo payment applied — principal paid, interest paid and remaining balance, year by year.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "mortgage-payoff-calculator"],
  },
  {
    slug: "mortgage-payoff-calculator",
    title: "Mortgage Payoff Calculator",
    category: "financial",
    shortDescription: "See how much sooner you'll be mortgage-free by paying extra each month.",
    seoDescription: "Calculate how many months and how much interest you'll save by paying extra toward your mortgage principal each month.",
    formulaSummary: "Iterative amortization with an extra principal payment",
    fields: [
      { name: "balance", label: "Remaining Balance", type: "number", unit: "$", defaultValue: 210000, min: 0 },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01 },
      { name: "remainingMonths", label: "Months Remaining", type: "number", unit: "months", defaultValue: 240, min: 1 },
      { name: "extraMonthly", label: "Extra Monthly Payment", type: "number", unit: "$", defaultValue: 250, min: 0 },
    ],
    calculate: (i) => {
      const balance = n(i.balance);
      const r = n(i.ratePercent) / 100 / 12;
      const basePmt = monthlyPayment(balance, r, n(i.remainingMonths, 240));
      return payoffCalc(balance, n(i.ratePercent), basePmt + n(i.extraMonthly));
    },
    relatedSlugs: ["mortgage-amortization-calculator", "mortgage-calculator"],
  },
  {
    slug: "rent-calculator",
    title: "Rent Affordability Calculator",
    category: "financial",
    shortDescription: "Find how much rent you can comfortably afford based on your income.",
    seoDescription: "Calculate how much rent you can afford based on your monthly income and the standard 30% rent-to-income guideline.",
    formulaSummary: "Max rent = monthly income × target rent-to-income %",
    fields: [
      { name: "monthlyIncome", label: "Gross Monthly Income", type: "number", unit: "$", defaultValue: 5500, min: 0 },
      { name: "targetPercent", label: "Target Rent-to-Income Ratio", type: "number", unit: "%", defaultValue: 30, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const maxRent = n(i.monthlyIncome) * (n(i.targetPercent, 30) / 100);
      const targetPercent = n(i.targetPercent, 30);
      return {
        results: [{ label: "Recommended Max Rent", value: fmtCurrency(maxRent), emphasis: true }],
        notes: ["The 30% rule is a common guideline, not a hard rule — some housing markets and lenders use up to 40%."],
        gauge: {
          value: targetPercent,
          min: 0,
          max: 60,
          valueLabel: `${fmtNumber(targetPercent, 0)}% of income`,
          zones: [
            { label: "Affordable (≤30%)", to: 30, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Cost-Burdened (30–50%)", to: 50, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Severely Cost-Burdened (>50%)", to: 60, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `Budgeting ${fmtNumber(targetPercent, 0)}% of income for rent leaves ${fmtCurrency(n(i.monthlyIncome) - maxRent)}/mo for everything else.`,
      };
    },
    relatedSlugs: ["rent-vs-buy-calculator", "budget-calculator"],
  },
  {
    slug: "real-estate-calculator",
    title: "Real Estate Investment Calculator",
    category: "financial",
    shortDescription: "Estimate profit and ROI on a buy-renovate-sell real estate deal.",
    seoDescription: "Calculate profit and return on investment for a real estate flip, including purchase, renovation, holding and selling costs.",
    formulaSummary: "ROI = profit ÷ total investment × 100",
    fields: [
      { name: "purchasePrice", label: "Purchase Price", type: "number", unit: "$", defaultValue: 180000, min: 0 },
      { name: "renovationCost", label: "Renovation Cost", type: "number", unit: "$", defaultValue: 35000, min: 0 },
      { name: "holdingCosts", label: "Holding Costs (tax, insurance, loan interest)", type: "number", unit: "$", defaultValue: 6000, min: 0 },
      { name: "sellingPrice", label: "Expected Selling Price", type: "number", unit: "$", defaultValue: 265000, min: 0 },
      { name: "sellingCostsPercent", label: "Selling Costs", type: "number", unit: "%", defaultValue: 7, min: 0 },
    ],
    calculate: (i) => {
      const totalInvestment = n(i.purchasePrice) + n(i.renovationCost) + n(i.holdingCosts);
      const netProceeds = n(i.sellingPrice) * (1 - n(i.sellingCostsPercent) / 100);
      const profit = netProceeds - totalInvestment;
      const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : NaN;
      return {
        results: [
          { label: "Net Profit", value: fmtCurrency(profit), emphasis: true },
          { label: "ROI", value: fmtPercent(roi), emphasis: true },
          { label: "Total Investment", value: fmtCurrency(totalInvestment) },
          { label: "Net Sale Proceeds", value: fmtCurrency(netProceeds) },
        ],
        breakdown: [
          { label: "Purchase Price", value: n(i.purchasePrice), displayValue: fmtCurrency(n(i.purchasePrice)) },
          { label: "Renovation Cost", value: n(i.renovationCost), displayValue: fmtCurrency(n(i.renovationCost)) },
          { label: "Holding Costs", value: n(i.holdingCosts), displayValue: fmtCurrency(n(i.holdingCosts)) },
        ],
        chartCaption: `Your ${fmtCurrency(totalInvestment)} total investment breaks down into purchase, renovation and holding costs — against a projected ${fmtCurrency(netProceeds)} in net sale proceeds.`,
      };
    },
    relatedSlugs: ["roi-calculator", "rental-property-calculator"],
  },
  {
    slug: "debt-ratio-calculator",
    title: "Debt-to-Income Ratio Calculator",
    category: "financial",
    shortDescription: "Calculate your debt-to-income ratio and see how lenders view it.",
    seoDescription: "Calculate your debt-to-income (DTI) ratio from monthly debt payments and gross income, with lender guidance.",
    formulaSummary: "DTI = total monthly debt payments ÷ gross monthly income × 100",
    fields: [
      { name: "monthlyDebts", label: "Total Monthly Debt Payments", type: "number", unit: "$", defaultValue: 1200, min: 0 },
      { name: "grossMonthlyIncome", label: "Gross Monthly Income", type: "number", unit: "$", defaultValue: 6000, min: 0.01 },
    ],
    calculate: (i) => {
      const dti = (n(i.monthlyDebts) / n(i.grossMonthlyIncome, 0.01)) * 100;
      let category = "Excellent";
      if (dti > 43) category = "High — may struggle to qualify for a mortgage";
      else if (dti > 36) category = "Borderline — some lenders may hesitate";
      else if (dti > 20) category = "Good";
      return {
        results: [
          { label: "Debt-to-Income Ratio", value: fmtPercent(dti), emphasis: true },
          { label: "Lender View", value: category, emphasis: true },
        ],
        notes: ["Most mortgage lenders want DTI at or below 36–43%, depending on the loan program."],
        gauge: {
          value: dti,
          min: 0,
          max: 80,
          valueLabel: fmtPercent(dti),
          zones: [
            { label: "Excellent (≤20%)", to: 20, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Good (20–36%)", to: 36, barClass: "bg-emerald-500 dark:bg-emerald-400", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Borderline (36–43%)", to: 43, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "High (>43%)", to: 80, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `Your DTI of ${fmtPercent(dti)} falls in the "${category}" range — most mortgage lenders want it at or below 36–43%.`,
      };
    },
    relatedSlugs: ["house-affordability-calculator"],
  },
];

export default financialLoans;
