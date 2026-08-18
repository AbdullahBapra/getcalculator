import type { CalcOutput, CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { monthlyPayment, fvAnnuity, payoffCalc, fvGrowthSeries } from "./finance-helpers";

const financial: CalculatorDefinition[] = [
  {
    slug: "mortgage-calculator",
    title: "Mortgage Calculator",
    category: "financial",
    shortDescription: "Estimate your monthly mortgage payment, including taxes, insurance and HOA.",
    seoDescription:
      "Calculate your monthly mortgage payment from home price, down payment, interest rate and term, with property tax, insurance and HOA included.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "homePrice", label: "Home Price", type: "number", unit: "$", defaultValue: 400000, min: 0 },
      { name: "downPayment", label: "Down Payment", type: "number", unit: "$", defaultValue: 80000, min: 0 },
      { name: "termYears", label: "Loan Term", type: "select", defaultValue: "30", options: [
        { value: "15", label: "15 years" },
        { value: "20", label: "20 years" },
        { value: "30", label: "30 years" },
      ] },
      { name: "ratePercent", label: "Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01, min: 0 },
      { name: "propertyTaxAnnual", label: "Annual Property Tax", type: "number", unit: "$", defaultValue: 3600, min: 0 },
      { name: "homeInsuranceAnnual", label: "Annual Home Insurance", type: "number", unit: "$", defaultValue: 1500, min: 0 },
      { name: "hoaMonthly", label: "Monthly HOA Fee", type: "number", unit: "$", defaultValue: 0, min: 0 },
    ],
    calculate: (i) => {
      const principal = Math.max(0, n(i.homePrice) - n(i.downPayment));
      const nper = n(i.termYears, 30) * 12;
      const r = n(i.ratePercent) / 100 / 12;
      const pi = monthlyPayment(principal, r, nper);
      const escrow = (n(i.propertyTaxAnnual) + n(i.homeInsuranceAnnual)) / 12 + n(i.hoaMonthly);
      const totalMonthly = pi + escrow;
      const totalPaid = pi * nper;
      const totalInterest = totalPaid - principal;
      return {
        results: [
          { label: "Principal & Interest", value: fmtCurrency(pi), emphasis: true },
          { label: "Taxes, Insurance & HOA", value: fmtCurrency(escrow) },
          { label: "Total Monthly Payment", value: fmtCurrency(totalMonthly), emphasis: true },
          { label: "Loan Amount", value: fmtCurrency(principal) },
          { label: "Total Interest Paid", value: fmtCurrency(totalInterest) },
          { label: "Total Paid Over Loan", value: fmtCurrency(totalPaid + n(i.downPayment)) },
        ],
        formula: "M = P × [r(1+r)^n] / [(1+r)^n − 1], where r is the monthly rate and n the number of payments",
        steps: [
          `Loan amount P = ${fmtCurrency(n(i.homePrice))} − ${fmtCurrency(n(i.downPayment))} down = ${fmtCurrency(principal)}`,
          `Monthly rate r = ${fmtNumber(n(i.ratePercent), 3)}% ÷ 12 = ${fmtNumber(r * 100, 4)}%`,
          `Number of payments n = ${n(i.termYears, 30)} years × 12 = ${nper}`,
          `M = ${fmtCurrency(principal)} × [r(1+r)^${nper}] / [(1+r)^${nper} − 1] = ${fmtCurrency(pi)}`,
          `Add taxes/insurance/HOA of ${fmtCurrency(escrow)}/mo → total monthly payment ${fmtCurrency(totalMonthly)}`,
        ],
        breakdown: [
          { label: "Principal & Interest", value: pi, displayValue: fmtCurrency(pi) },
          { label: "Taxes, Insurance & HOA", value: escrow, displayValue: fmtCurrency(escrow) },
        ],
        chartCaption:
          escrow > 0
            ? `Taxes, insurance and HOA add ${fmtCurrency(escrow)} on top of the loan payment itself — ${fmtNumber((escrow / totalMonthly) * 100, 0)}% of what you'll actually pay each month.`
            : `No property tax, insurance or HOA entered — your full monthly payment is just principal and interest.`,
      };
    },
    relatedSlugs: ["loan-calculator", "refinance-calculator", "amortization-basics"],
    keywords: ["mortgage", "home loan", "monthly payment"],
  },
  {
    slug: "loan-calculator",
    title: "Loan Calculator",
    category: "financial",
    shortDescription: "Work out the monthly payment and total interest on any fixed-rate loan.",
    seoDescription: "Calculate the monthly payment, total interest and total cost of any fixed-rate installment loan.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "principal", label: "Loan Amount", type: "number", unit: "$", defaultValue: 20000, min: 0 },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 8, step: 0.01, min: 0 },
      { name: "termMonths", label: "Loan Term", type: "number", unit: "months", defaultValue: 48, min: 1 },
    ],
    calculate: (i) => {
      const p = n(i.principal);
      const nper = n(i.termMonths, 1);
      const r = n(i.ratePercent) / 100 / 12;
      const m = monthlyPayment(p, r, nper);
      const totalPaid = m * nper;
      const totalInterest = totalPaid - p;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(m), emphasis: true },
          { label: "Total Interest", value: fmtCurrency(totalInterest) },
          { label: "Total Cost of Loan", value: fmtCurrency(totalPaid) },
        ],
        formula: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
        steps: [
          `Monthly rate r = ${fmtNumber(n(i.ratePercent), 3)}% ÷ 12 = ${fmtNumber(r * 100, 4)}%`,
          `M = ${fmtCurrency(p)} × [r(1+r)^${nper}] / [(1+r)^${nper} − 1] = ${fmtCurrency(m)}`,
          `Total paid = ${fmtCurrency(m)} × ${nper} months = ${fmtCurrency(totalPaid)}`,
          `Total interest = ${fmtCurrency(totalPaid)} − ${fmtCurrency(p)} = ${fmtCurrency(totalInterest)}`,
        ],
        breakdown: [
          { label: "Principal", value: p, displayValue: fmtCurrency(p) },
          { label: "Total Interest", value: totalInterest, displayValue: fmtCurrency(totalInterest) },
        ],
        chartCaption: `For every dollar you borrow, you'll pay back ${fmtCurrency(totalPaid / Math.max(1, p))} — interest adds ${fmtNumber((totalInterest / Math.max(1, p)) * 100, 0)}% on top of what you borrowed.`,
      };
    },
    relatedSlugs: ["mortgage-calculator", "auto-loan-calculator", "compound-interest-calculator"],
  },
  {
    slug: "auto-loan-calculator",
    title: "Auto Loan Calculator",
    category: "financial",
    shortDescription: "Estimate your car payment including trade-in, down payment and sales tax.",
    seoDescription: "Calculate your monthly car payment from vehicle price, down payment, trade-in value, sales tax and loan term.",
    formulaSummary: "M = P × [r(1+r)^n] / [(1+r)^n − 1]",
    fields: [
      { name: "vehiclePrice", label: "Vehicle Price", type: "number", unit: "$", defaultValue: 32000, min: 0 },
      { name: "downPayment", label: "Down Payment", type: "number", unit: "$", defaultValue: 4000, min: 0 },
      { name: "tradeIn", label: "Trade-in Value", type: "number", unit: "$", defaultValue: 0, min: 0 },
      { name: "salesTaxPercent", label: "Sales Tax", type: "number", unit: "%", defaultValue: 7, step: 0.01, min: 0 },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 6.5, step: 0.01, min: 0 },
      { name: "termMonths", label: "Loan Term", type: "number", unit: "months", defaultValue: 60, min: 1 },
    ],
    calculate: (i) => {
      const price = n(i.vehiclePrice);
      const tax = price * (n(i.salesTaxPercent) / 100);
      const principal = Math.max(0, price + tax - n(i.downPayment) - n(i.tradeIn));
      const nper = n(i.termMonths, 1);
      const r = n(i.ratePercent) / 100 / 12;
      const m = monthlyPayment(principal, r, nper);
      const totalPaid = m * nper;
      return {
        results: [
          { label: "Monthly Payment", value: fmtCurrency(m), emphasis: true },
          { label: "Amount Financed", value: fmtCurrency(principal) },
          { label: "Sales Tax", value: fmtCurrency(tax) },
          { label: "Total Interest", value: fmtCurrency(totalPaid - principal) },
          { label: "Total Cost", value: fmtCurrency(totalPaid + n(i.downPayment) + n(i.tradeIn)) },
        ],
        steps: [
          `Sales tax = ${fmtCurrency(price)} × ${fmtNumber(n(i.salesTaxPercent))}% = ${fmtCurrency(tax)}`,
          `Amount financed = price + tax − down payment − trade-in = ${fmtCurrency(principal)}`,
          `Monthly payment M = ${fmtCurrency(principal)} × [r(1+r)^${nper}] / [(1+r)^${nper} − 1] = ${fmtCurrency(m)}`,
        ],
        breakdown: [
          { label: "Amount Financed", value: principal, displayValue: fmtCurrency(principal) },
          { label: "Total Interest", value: totalPaid - principal, displayValue: fmtCurrency(totalPaid - principal) },
          { label: "Sales Tax", value: tax, displayValue: fmtCurrency(tax) },
        ],
        chartCaption: `Sales tax alone adds ${fmtCurrency(tax)} to the price before you even start financing — and interest tacks on another ${fmtCurrency(totalPaid - principal)} over the life of the loan.`,
      };
    },
    relatedSlugs: ["loan-calculator", "lease-calculator"],
  },
  {
    slug: "compound-interest-calculator",
    title: "Compound Interest Calculator",
    category: "financial",
    shortDescription: "See how your savings grow with compounding and optional monthly contributions.",
    seoDescription: "Calculate compound interest growth on an initial balance plus optional monthly contributions.",
    formulaSummary: "A = P(1 + r/n)^(nt) + contributions",
    fields: [
      { name: "principal", label: "Initial Balance", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "monthlyContribution", label: "Monthly Contribution", type: "number", unit: "$", defaultValue: 200, min: 0 },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 7, step: 0.01, min: 0 },
      { name: "years", label: "Time to Grow", type: "number", unit: "years", defaultValue: 20, min: 0 },
      { name: "compoundsPerYear", label: "Compounding", type: "select", defaultValue: "12", options: [
        { value: "1", label: "Annually" },
        { value: "4", label: "Quarterly" },
        { value: "12", label: "Monthly" },
        { value: "365", label: "Daily" },
      ] },
    ],
    calculate: (i) => {
      const p = n(i.principal);
      const rate = n(i.ratePercent) / 100;
      const years = n(i.years);
      const cn = n(i.compoundsPerYear, 12);
      const principalFv = p * Math.pow(1 + rate / cn, cn * years);
      const monthlyRate = rate / 12;
      const months = years * 12;
      const contribFv = fvAnnuity(n(i.monthlyContribution), monthlyRate, months);
      const totalFv = principalFv + contribFv;
      const totalContributed = p + n(i.monthlyContribution) * months;
      const interestEarned = totalFv - totalContributed;
      const wholeYears = Math.max(1, Math.round(years));
      const growthSeries = Array.from({ length: wholeYears }, (_, idx) => {
        const y = idx + 1;
        const balanceAtY = p * Math.pow(1 + rate / cn, cn * y) + fvAnnuity(n(i.monthlyContribution), monthlyRate, y * 12);
        return { label: `Yr ${y}`, value: balanceAtY, displayValue: fmtCurrency(balanceAtY) };
      });
      return {
        results: [
          { label: "Future Value", value: fmtCurrency(totalFv), emphasis: true },
          { label: "Total Contributed", value: fmtCurrency(totalContributed) },
          { label: "Interest Earned", value: fmtCurrency(interestEarned) },
        ],
        formula: "A = P(1 + r/n)^(nt), contributions grow as an ordinary annuity",
        steps: [
          `Principal growth: ${fmtCurrency(p)} × (1 + ${fmtNumber(rate * 100)}%/${cn})^(${cn}×${years}) = ${fmtCurrency(principalFv)}`,
          n(i.monthlyContribution) > 0
            ? `Contributions growth: ${fmtCurrency(n(i.monthlyContribution))}/mo for ${months} months at ${fmtNumber(monthlyRate * 100, 4)}%/mo = ${fmtCurrency(contribFv)}`
            : "No recurring contribution entered.",
          `Total future value = ${fmtCurrency(principalFv)} + ${fmtCurrency(contribFv)} = ${fmtCurrency(totalFv)}`,
        ],
        growthSeries,
        chartCaption:
          totalContributed > 0
            ? `${fmtNumber((interestEarned / Math.max(1, totalFv)) * 100, 0)}% of your final balance is money you never had to put in yourself — that's compounding doing the work. Tap any bar to see that year's balance.`
            : `Every dollar of this balance came from compounding, since nothing was contributed. Tap any bar to see that year's balance.`,
      };
    },
    relatedSlugs: ["savings-calculator", "simple-interest-calculator", "retirement-401k-calculator"],
  },
  {
    slug: "simple-interest-calculator",
    title: "Simple Interest Calculator",
    category: "financial",
    shortDescription: "Calculate interest earned or owed with simple (non-compounding) interest.",
    seoDescription: "Calculate simple interest and total repayment amount from principal, rate and time.",
    formulaSummary: "I = P × r × t",
    fields: [
      { name: "principal", label: "Principal", type: "number", unit: "$", defaultValue: 5000, min: 0 },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 5, step: 0.01, min: 0 },
      { name: "years", label: "Time", type: "number", unit: "years", defaultValue: 3, min: 0 },
    ],
    calculate: (i) => {
      const p = n(i.principal);
      const r = n(i.ratePercent) / 100;
      const t = n(i.years);
      const interest = p * r * t;
      const wholeYears = Math.max(1, Math.round(t));
      const annualInterest = p * r;
      const growthSeries = Array.from({ length: wholeYears }, (_, idx) => {
        const y = idx + 1;
        const value = p + annualInterest * Math.min(y, t);
        return { label: `Yr ${y}`, value, displayValue: fmtCurrency(value) };
      });
      return {
        results: [
          { label: "Interest", value: fmtCurrency(interest), emphasis: true },
          { label: "Total Amount", value: fmtCurrency(p + interest) },
        ],
        formula: "I = P × r × t",
        steps: [`I = ${fmtCurrency(p)} × ${fmtNumber(r * 100)}% × ${t} years = ${fmtCurrency(interest)}`],
        growthSeries,
        chartCaption:
          annualInterest > 0
            ? `Simple interest adds the same flat ${fmtCurrency(annualInterest)} every year — unlike compound interest, none of it earns interest of its own. Tap any bar to see that year's balance.`
            : `With no interest rate entered, the balance stays flat at ${fmtCurrency(p)} the whole time.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator"],
  },
  {
    slug: "savings-calculator",
    title: "Savings Calculator",
    category: "financial",
    shortDescription: "Project how a savings account grows with regular deposits.",
    seoDescription: "Calculate the future value of a savings account given an initial deposit, regular contributions and interest rate.",
    formulaSummary: "FV = P(1+i)^n + PMT × [((1+i)^n − 1)/i]",
    fields: [
      { name: "initialDeposit", label: "Initial Deposit", type: "number", unit: "$", defaultValue: 1000, min: 0 },
      { name: "monthlyDeposit", label: "Monthly Deposit", type: "number", unit: "$", defaultValue: 300, min: 0 },
      { name: "ratePercent", label: "Annual Interest Rate", type: "number", unit: "%", defaultValue: 4, step: 0.01, min: 0 },
      { name: "years", label: "Time", type: "number", unit: "years", defaultValue: 10, min: 0 },
    ],
    calculate: (i) => {
      const p = n(i.initialDeposit);
      const pmt = n(i.monthlyDeposit);
      const months = n(i.years) * 12;
      const im = n(i.ratePercent) / 100 / 12;
      const fv = p * Math.pow(1 + im, months) + fvAnnuity(pmt, im, months);
      const contributed = p + pmt * months;
      return {
        results: [
          { label: "Future Balance", value: fmtCurrency(fv), emphasis: true },
          { label: "Total Deposited", value: fmtCurrency(contributed) },
          { label: "Interest Earned", value: fmtCurrency(fv - contributed) },
        ],
        steps: [
          `Monthly rate = ${fmtNumber(n(i.ratePercent))}% ÷ 12 = ${fmtNumber(im * 100, 4)}%`,
          `FV = ${fmtCurrency(p)}(1+i)^${months} + ${fmtCurrency(pmt)}×[((1+i)^${months}−1)/i] = ${fmtCurrency(fv)}`,
        ],
        growthSeries: fvGrowthSeries(p, pmt, n(i.ratePercent), n(i.years)),
        chartCaption:
          contributed > 0
            ? `${fmtNumber((Math.max(0, fv - contributed) / Math.max(1, fv)) * 100, 0)}% of your final balance is interest, not money you deposited. Tap any bar to see that year's projected balance.`
            : `Every dollar of this balance is interest, since nothing was deposited. Tap any bar to see that year's projected balance.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator", "budget-calculator"],
  },
  {
    slug: "take-home-pay-calculator",
    title: "Take-Home Pay Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Estimate your net paycheck from gross salary, pre-tax deductions and your effective tax rate.",
    seoDescription: "Estimate net take-home pay per paycheck from gross annual salary, pre-tax deductions and an effective tax rate.",
    formulaSummary: "Net = (Gross − Pre-tax deductions) × (1 − tax rate) − Post-tax deductions",
    fields: [
      { name: "grossAnnualSalary", label: "Gross Annual Salary", type: "number", unit: "$", defaultValue: 75000, min: 0 },
      { name: "payFrequency", label: "Pay Frequency", type: "select", defaultValue: "biweekly", options: [
        { value: "weekly", label: "Weekly (52/yr)" },
        { value: "biweekly", label: "Biweekly (26/yr)" },
        { value: "semimonthly", label: "Semimonthly (24/yr)" },
        { value: "monthly", label: "Monthly (12/yr)" },
      ] },
      { name: "preTaxDeductionsAnnual", label: "Pre-tax Deductions (401k, insurance)", type: "number", unit: "$/yr", defaultValue: 4000, min: 0 },
      { name: "effectiveTaxRatePercent", label: "Effective Tax Rate (fed+state+FICA)", type: "number", unit: "%", defaultValue: 24, step: 0.1, min: 0, max: 60 },
      { name: "postTaxDeductionsAnnual", label: "Post-tax Deductions", type: "number", unit: "$/yr", defaultValue: 0, min: 0 },
    ],
    calculate: (i) => {
      const periodsMap: Record<string, number> = { weekly: 52, biweekly: 26, semimonthly: 24, monthly: 12 };
      const periods = periodsMap[i.payFrequency] ?? 26;
      const gross = n(i.grossAnnualSalary);
      const taxable = Math.max(0, gross - n(i.preTaxDeductionsAnnual));
      const tax = taxable * (n(i.effectiveTaxRatePercent) / 100);
      const netAnnual = taxable - tax - n(i.postTaxDeductionsAnnual);
      const preTaxDed = n(i.preTaxDeductionsAnnual);
      const postTaxDed = n(i.postTaxDeductionsAnnual);
      const breakdown = [
        { label: "Take-Home Pay", value: Math.max(0, netAnnual), displayValue: fmtCurrency(netAnnual) },
        { label: "Taxes", value: Math.max(0, tax), displayValue: fmtCurrency(tax) },
        ...(preTaxDed > 0 ? [{ label: "Pre-tax Deductions", value: preTaxDed, displayValue: fmtCurrency(preTaxDed) }] : []),
        ...(postTaxDed > 0 ? [{ label: "Post-tax Deductions", value: postTaxDed, displayValue: fmtCurrency(postTaxDed) }] : []),
      ];
      return {
        results: [
          { label: "Net Pay Per Paycheck", value: fmtCurrency(netAnnual / periods), emphasis: true },
          { label: "Net Annual Pay", value: fmtCurrency(netAnnual) },
          { label: "Estimated Annual Tax", value: fmtCurrency(tax) },
          { label: "Taxable Income", value: fmtCurrency(taxable) },
        ],
        notes: [
          "This uses one flat effective tax rate you provide (your combined federal + state + FICA rate) rather than IRS brackets, since those vary by state, filing status and year. Check a recent pay stub for your real effective rate.",
        ],
        steps: [
          `Taxable income = ${fmtCurrency(gross)} − ${fmtCurrency(n(i.preTaxDeductionsAnnual))} pre-tax deductions = ${fmtCurrency(taxable)}`,
          `Estimated tax = ${fmtCurrency(taxable)} × ${fmtNumber(n(i.effectiveTaxRatePercent))}% = ${fmtCurrency(tax)}`,
          `Net annual = ${fmtCurrency(taxable)} − ${fmtCurrency(tax)} − ${fmtCurrency(n(i.postTaxDeductionsAnnual))} = ${fmtCurrency(netAnnual)}`,
          `Per paycheck (${periods}/yr) = ${fmtCurrency(netAnnual)} ÷ ${periods} = ${fmtCurrency(netAnnual / periods)}`,
        ],
        breakdown,
        chartCaption:
          gross > 0
            ? `Of every dollar of gross salary, ${fmtNumber((Math.max(0, netAnnual) / gross) * 100, 0)}¢ actually reaches your pocket — the rest goes to taxes and deductions before you ever see it.`
            : `Enter a gross salary to see how it splits between take-home pay, taxes and deductions.`,
      };
    },
    relatedSlugs: ["salary-calculator", "budget-calculator"],
  },
  {
    slug: "sales-tax-calculator",
    title: "Sales Tax Calculator",
    category: "financial",
    shortDescription: "Find the tax amount and total price, or back out the pre-tax price from a total.",
    seoDescription: "Calculate sales tax amount and total price, or work backward from a tax-included total to the pre-tax price.",
    formulaSummary: "Tax = Price × rate",
    fields: [
      { name: "mode", label: "I have the...", type: "select", defaultValue: "pre", options: [
        { value: "pre", label: "Price before tax" },
        { value: "post", label: "Total price (tax included)" },
      ] },
      { name: "amount", label: "Amount", type: "number", unit: "$", defaultValue: 100, min: 0 },
      { name: "ratePercent", label: "Sales Tax Rate", type: "number", unit: "%", defaultValue: 7.25, step: 0.01, min: 0 },
    ],
    calculate: (i) => {
      const rate = n(i.ratePercent) / 100;
      const amount = n(i.amount);
      if (i.mode === "post") {
        const preTax = amount / (1 + rate);
        const tax = amount - preTax;
        return {
          results: [
            { label: "Price Before Tax", value: fmtCurrency(preTax), emphasis: true },
            { label: "Tax Amount", value: fmtCurrency(tax) },
          ],
          steps: [`Pre-tax price = ${fmtCurrency(amount)} ÷ (1 + ${fmtNumber(n(i.ratePercent))}%) = ${fmtCurrency(preTax)}`],
          breakdown: [
            { label: "Price Before Tax", value: preTax, displayValue: fmtCurrency(preTax) },
            { label: "Tax Amount", value: tax, displayValue: fmtCurrency(tax) },
          ],
          chartCaption: `${fmtNumber(rate * 100, 2)}% of this total, ${fmtCurrency(tax)}, is sales tax — the rest, ${fmtCurrency(preTax)}, is the actual price of the item.`,
        };
      }
      const tax = amount * rate;
      return {
        results: [
          { label: "Tax Amount", value: fmtCurrency(tax), emphasis: true },
          { label: "Total Price", value: fmtCurrency(amount + tax) },
        ],
        steps: [`Tax = ${fmtCurrency(amount)} × ${fmtNumber(n(i.ratePercent))}% = ${fmtCurrency(tax)}`],
        breakdown: [
          { label: "Pre-Tax Price", value: amount, displayValue: fmtCurrency(amount) },
          { label: "Tax Amount", value: tax, displayValue: fmtCurrency(tax) },
        ],
        chartCaption: `Sales tax adds ${fmtCurrency(tax)} on top of the ${fmtCurrency(amount)} price — ${fmtNumber(rate * 100, 2)}% more than the sticker price.`,
      };
    },
    relatedSlugs: ["vat-calculator", "discount-calculator", "tip-calculator"],
  },
  {
    slug: "vat-calculator",
    title: "VAT Calculator",
    category: "financial",
    shortDescription: "Add or remove VAT from a price.",
    seoDescription: "Calculate VAT to add to a net price, or extract the VAT already included in a gross price.",
    formulaSummary: "Gross = Net × (1 + VAT rate)",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "add", options: [
        { value: "add", label: "Add VAT to net price" },
        { value: "remove", label: "Extract VAT from gross price" },
      ] },
      { name: "amount", label: "Amount", type: "number", unit: "$", defaultValue: 100, min: 0 },
      { name: "vatRatePercent", label: "VAT Rate", type: "number", unit: "%", defaultValue: 20, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const rate = n(i.vatRatePercent) / 100;
      const amount = n(i.amount);
      if (i.mode === "remove") {
        const net = amount / (1 + rate);
        const vat = amount - net;
        return {
          results: [
            { label: "Net (excl. VAT)", value: fmtCurrency(net), emphasis: true },
            { label: "VAT Amount", value: fmtCurrency(vat) },
          ],
          steps: [`Net = ${fmtCurrency(amount)} ÷ (1 + ${fmtNumber(n(i.vatRatePercent))}%) = ${fmtCurrency(net)}`],
          breakdown: [
            { label: "Pre-Tax Price", value: net, displayValue: fmtCurrency(net) },
            { label: "VAT Amount", value: vat, displayValue: fmtCurrency(vat) },
          ],
          chartCaption: `Of the ${fmtCurrency(amount)} total, ${fmtCurrency(vat)} is VAT — the pre-tax price is really ${fmtCurrency(net)}.`,
        };
      }
      const vat = amount * rate;
      return {
        results: [
          { label: "VAT Amount", value: fmtCurrency(vat), emphasis: true },
          { label: "Gross (incl. VAT)", value: fmtCurrency(amount + vat) },
        ],
        steps: [`VAT = ${fmtCurrency(amount)} × ${fmtNumber(n(i.vatRatePercent))}% = ${fmtCurrency(vat)}`],
        breakdown: [
          { label: "Pre-Tax Price", value: amount, displayValue: fmtCurrency(amount) },
          { label: "VAT Amount", value: vat, displayValue: fmtCurrency(vat) },
        ],
        chartCaption: `VAT adds ${fmtCurrency(vat)} on top of the ${fmtCurrency(amount)} net price — ${fmtNumber(rate * 100, 2)}% more than the pre-tax price.`,
      };
    },
    relatedSlugs: ["sales-tax-calculator"],
  },
  {
    slug: "discount-calculator",
    title: "Discount Calculator",
    category: "financial",
    shortDescription: "Work out the sale price after a percentage discount, with optional tax.",
    seoDescription: "Calculate the discount amount and final sale price from an original price and discount percentage.",
    formulaSummary: "Sale price = Original × (1 − discount%)",
    fields: [
      { name: "originalPrice", label: "Original Price", type: "number", unit: "$", defaultValue: 80, min: 0 },
      { name: "discountPercent", label: "Discount", type: "number", unit: "%", defaultValue: 25, step: 0.1, min: 0, max: 100 },
      { name: "salesTaxPercent", label: "Sales Tax (optional)", type: "number", unit: "%", defaultValue: 0, step: 0.01, min: 0 },
    ],
    calculate: (i) => {
      const original = n(i.originalPrice);
      const discountAmt = original * (n(i.discountPercent) / 100);
      const salePrice = original - discountAmt;
      const tax = salePrice * (n(i.salesTaxPercent) / 100);
      return {
        results: [
          { label: "You Save", value: fmtCurrency(discountAmt), emphasis: true },
          { label: "Sale Price", value: fmtCurrency(salePrice), emphasis: true },
          { label: "Final Price (incl. tax)", value: fmtCurrency(salePrice + tax) },
        ],
        steps: [
          `Discount = ${fmtCurrency(original)} × ${fmtNumber(n(i.discountPercent))}% = ${fmtCurrency(discountAmt)}`,
          `Sale price = ${fmtCurrency(original)} − ${fmtCurrency(discountAmt)} = ${fmtCurrency(salePrice)}`,
        ],
        breakdown: [
          { label: "Amount Paid", value: salePrice, displayValue: fmtCurrency(salePrice) },
          { label: "Amount Saved", value: discountAmt, displayValue: fmtCurrency(discountAmt) },
          ...(tax > 0 ? [{ label: "Sales Tax", value: tax, displayValue: fmtCurrency(tax) }] : []),
        ],
        chartCaption:
          original > 0
            ? `The discount saves you ${fmtNumber((discountAmt / original) * 100, 0)}% of the original price — ${fmtCurrency(discountAmt)} off a ${fmtCurrency(original)} item.`
            : `Enter an original price to see how much the discount saves.`,
      };
    },
    relatedSlugs: ["sales-tax-calculator", "percentage-calculator"],
  },
  {
    slug: "tip-calculator",
    title: "Tip Calculator",
    category: "financial",
    shortDescription: "Split the bill and calculate the tip per person.",
    seoDescription: "Calculate tip amount, total bill, and the amount each person owes when splitting a check.",
    formulaSummary: "Tip = Bill × tip%",
    fields: [
      { name: "billAmount", label: "Bill Amount", type: "number", unit: "$", defaultValue: 60, min: 0 },
      { name: "tipPercent", label: "Tip", type: "number", unit: "%", defaultValue: 18, step: 1, min: 0 },
      { name: "numPeople", label: "Split Between", type: "number", unit: "people", defaultValue: 1, min: 1, step: 1 },
    ],
    calculate: (i) => {
      const bill = n(i.billAmount);
      const tip = bill * (n(i.tipPercent) / 100);
      const total = bill + tip;
      const people = Math.max(1, n(i.numPeople, 1));
      return {
        results: [
          { label: "Tip Amount", value: fmtCurrency(tip), emphasis: true },
          { label: "Total Bill", value: fmtCurrency(total), emphasis: true },
          { label: "Per Person", value: fmtCurrency(total / people) },
          { label: "Tip Per Person", value: fmtCurrency(tip / people) },
        ],
        steps: [
          `Tip = ${fmtCurrency(bill)} × ${fmtNumber(n(i.tipPercent))}% = ${fmtCurrency(tip)}`,
          `Total = ${fmtCurrency(bill)} + ${fmtCurrency(tip)} = ${fmtCurrency(total)}`,
          people > 1 ? `Split ${people} ways → ${fmtCurrency(total / people)} each` : "Not split — one payer.",
        ],
        breakdown: [
          { label: "Bill", value: bill, displayValue: fmtCurrency(bill) },
          { label: "Tip", value: tip, displayValue: fmtCurrency(tip) },
        ],
        chartCaption:
          people > 1
            ? `Split ${people} ways, each person pays ${fmtCurrency(total / people)} — ${fmtCurrency(tip / people)} of that is tip.`
            : `The tip adds ${fmtNumber(n(i.tipPercent))}% on top of the bill — ${fmtCurrency(tip)} on a ${fmtCurrency(bill)} check.`,
      };
    },
    relatedSlugs: ["sales-tax-calculator", "discount-calculator"],
  },
  {
    slug: "credit-card-payoff-calculator",
    title: "Credit Card Payoff Calculator",
    category: "financial",
    shortDescription: "Find out how long it will take to pay off a card balance at a fixed monthly payment.",
    seoDescription: "Calculate how many months it takes to pay off a credit card balance and the total interest paid at a given APR and monthly payment.",
    formulaSummary: "Iterative amortization: interest = balance × (APR/12) each month",
    fields: [
      { name: "balance", label: "Current Balance", type: "number", unit: "$", defaultValue: 4500, min: 0 },
      { name: "aprPercent", label: "APR", type: "number", unit: "%", defaultValue: 22, step: 0.1, min: 0 },
      { name: "monthlyPayment", label: "Monthly Payment", type: "number", unit: "$", defaultValue: 200, min: 0 },
    ],
    calculate: (i) => payoffCalc(n(i.balance), n(i.aprPercent), n(i.monthlyPayment)),
    relatedSlugs: ["debt-payoff-calculator", "credit-card-calculator"],
  },
  {
    slug: "debt-payoff-calculator",
    title: "Debt Payoff Calculator",
    category: "financial",
    shortDescription: "See how long any fixed-payment debt takes to pay off and the total interest paid.",
    seoDescription: "Calculate the payoff timeline and total interest for any loan or debt paid off with a fixed monthly payment.",
    formulaSummary: "Iterative amortization: interest = balance × (rate/12) each month",
    fields: [
      { name: "balance", label: "Debt Balance", type: "number", unit: "$", defaultValue: 15000, min: 0 },
      { name: "aprPercent", label: "Interest Rate (APR)", type: "number", unit: "%", defaultValue: 12, step: 0.1, min: 0 },
      { name: "monthlyPayment", label: "Monthly Payment", type: "number", unit: "$", defaultValue: 400, min: 0 },
    ],
    calculate: (i) => payoffCalc(n(i.balance), n(i.aprPercent), n(i.monthlyPayment)),
    relatedSlugs: ["credit-card-payoff-calculator", "debt-consolidation-calculator"],
  },
  {
    slug: "retirement-401k-calculator",
    title: "401(k) Retirement Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Project your 401(k) balance at retirement, including employer match.",
    seoDescription: "Estimate your 401(k) balance at retirement from current savings, contribution rate, employer match and expected return.",
    formulaSummary: "FV = Balance(1+i)^n + Contributions × [((1+i)^n − 1)/i]",
    fields: [
      { name: "currentAge", label: "Current Age", type: "number", defaultValue: 30, min: 16, max: 80 },
      { name: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, min: 16, max: 80 },
      { name: "currentBalance", label: "Current 401(k) Balance", type: "number", unit: "$", defaultValue: 20000, min: 0 },
      { name: "annualSalary", label: "Annual Salary", type: "number", unit: "$", defaultValue: 70000, min: 0 },
      { name: "contributionPercent", label: "Your Contribution", type: "number", unit: "%", defaultValue: 6, step: 0.5, min: 0, max: 100 },
      { name: "employerMatchPercent", label: "Employer Match (up to)", type: "number", unit: "% of salary", defaultValue: 3, step: 0.5, min: 0 },
      { name: "returnPercent", label: "Expected Annual Return", type: "number", unit: "%", defaultValue: 7, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const months = Math.max(0, (n(i.retirementAge, 65) - n(i.currentAge, 30)) * 12);
      const monthlySalary = n(i.annualSalary) / 12;
      const employeeMonthly = monthlySalary * (n(i.contributionPercent) / 100);
      const employerMonthly = monthlySalary * (Math.min(n(i.contributionPercent), n(i.employerMatchPercent)) / 100);
      const totalMonthly = employeeMonthly + employerMonthly;
      const im = n(i.returnPercent) / 100 / 12;
      const fv = n(i.currentBalance) * Math.pow(1 + im, months) + fvAnnuity(totalMonthly, im, months);
      const contributed = n(i.currentBalance) + totalMonthly * months;
      return {
        results: [
          { label: "Balance at Retirement", value: fmtCurrency(fv), emphasis: true },
          { label: "Your Monthly Contribution", value: fmtCurrency(employeeMonthly) },
          { label: "Employer Match (monthly)", value: fmtCurrency(employerMonthly) },
          { label: "Total Contributed", value: fmtCurrency(contributed) },
          { label: "Investment Growth", value: fmtCurrency(fv - contributed) },
        ],
        notes: ["Assumes a dollar-for-dollar employer match up to the percentage you enter — check your plan's actual match formula."],
        steps: [
          `Months until retirement = (${n(i.retirementAge, 65)} − ${n(i.currentAge, 30)}) × 12 = ${months}`,
          `Combined monthly contribution = ${fmtCurrency(employeeMonthly)} + ${fmtCurrency(employerMonthly)} = ${fmtCurrency(totalMonthly)}`,
          `FV = ${fmtCurrency(n(i.currentBalance))}(1+i)^${months} + contributions grown at ${fmtNumber(n(i.returnPercent))}%/yr = ${fmtCurrency(fv)}`,
        ],
        growthSeries: fvGrowthSeries(n(i.currentBalance), totalMonthly, n(i.returnPercent), months / 12),
        chartCaption: `The employer match alone contributes ${fmtCurrency(employerMonthly * months)} over your career — money you'd leave on the table by not contributing enough to claim it.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator", "savings-calculator"],
  },
  {
    slug: "budget-calculator",
    title: "50/30/20 Budget Calculator",
    category: "financial",
    shortDescription: "Split your take-home pay into needs, wants and savings using the 50/30/20 rule.",
    seoDescription: "Apply the 50/30/20 budgeting rule to your monthly take-home pay to split spending across needs, wants and savings.",
    formulaSummary: "Needs 50% · Wants 30% · Savings 20%",
    fields: [
      { name: "monthlyIncome", label: "Monthly Take-Home Pay", type: "number", unit: "$", defaultValue: 4500, min: 0 },
    ],
    calculate: (i) => {
      const income = n(i.monthlyIncome);
      const needs = income * 0.5;
      const wants = income * 0.3;
      const savings = income * 0.2;
      return {
        results: [
          { label: "Needs (50%)", value: fmtCurrency(needs), emphasis: true },
          { label: "Wants (30%)", value: fmtCurrency(wants), emphasis: true },
          { label: "Savings & Debt Payoff (20%)", value: fmtCurrency(savings), emphasis: true },
        ],
        notes: ["A popular starting-point budget split (Elizabeth Warren's 50/30/20 rule) — adjust the ratios to fit your situation."],
        steps: [
          `Needs = ${fmtCurrency(income)} × 50% = ${fmtCurrency(needs)}`,
          `Wants = ${fmtCurrency(income)} × 30% = ${fmtCurrency(wants)}`,
          `Savings & Debt Payoff = ${fmtCurrency(income)} × 20% = ${fmtCurrency(savings)}`,
        ],
        breakdown: [
          { label: "Needs", value: needs, displayValue: fmtCurrency(needs) },
          { label: "Wants", value: wants, displayValue: fmtCurrency(wants) },
          { label: "Savings & Debt Payoff", value: savings, displayValue: fmtCurrency(savings) },
        ],
        chartCaption: `On ${fmtCurrency(income)} a month, the 50/30/20 rule points ${fmtCurrency(needs)} to needs, ${fmtCurrency(wants)} to wants, and ${fmtCurrency(savings)} to savings or debt payoff.`,
      };
    },
    relatedSlugs: ["savings-calculator", "take-home-pay-calculator"],
  },
  {
    slug: "roi-calculator",
    title: "ROI Calculator",
    category: "financial",
    shortDescription: "Calculate return on investment, with optional annualized return.",
    seoDescription: "Calculate the return on investment (ROI) and annualized ROI from an initial and final investment value.",
    formulaSummary: "ROI = (Final − Initial) / Initial × 100",
    fields: [
      { name: "initialValue", label: "Initial Investment", type: "number", unit: "$", defaultValue: 10000, min: 0.01 },
      { name: "finalValue", label: "Final Value", type: "number", unit: "$", defaultValue: 14000, min: 0 },
      { name: "years", label: "Holding Period (optional)", type: "number", unit: "years", defaultValue: 3, min: 0 },
    ],
    calculate: (i) => {
      const initial = n(i.initialValue, 0.01) || 0.01;
      const final = n(i.finalValue);
      const roi = ((final - initial) / initial) * 100;
      const years = n(i.years);
      const annualized = years > 0 ? (Math.pow(final / initial, 1 / years) - 1) * 100 : undefined;
      const results: CalcOutput["results"] = [
        { label: "Net Gain / Loss", value: fmtCurrency(final - initial), emphasis: true },
        { label: "ROI", value: fmtPercent(roi), emphasis: true },
      ];
      if (annualized !== undefined) results.push({ label: "Annualized ROI", value: fmtPercent(annualized) });
      return {
        results,
        formula: "ROI = (Final − Initial) / Initial × 100",
        steps: [`ROI = (${fmtCurrency(final)} − ${fmtCurrency(initial)}) / ${fmtCurrency(initial)} × 100 = ${fmtPercent(roi)}`],
        compare: [
          { label: "Initial Investment", value: initial, displayValue: fmtCurrency(initial) },
          { label: "Final Value", value: final, displayValue: fmtCurrency(final), highlight: final >= initial },
        ],
        chartCaption:
          final >= initial
            ? `Your investment grew from ${fmtCurrency(initial)} to ${fmtCurrency(final)} — a gain of ${fmtPercent(roi)}.`
            : `Your investment fell from ${fmtCurrency(initial)} to ${fmtCurrency(final)} — a loss of ${fmtPercent(Math.abs(roi))}.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator"],
  },
];

export default financial;
