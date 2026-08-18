import type { CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber, fmtPercent } from "../format";
import { fvAnnuity, npv, irr as irrSolve, fvGrowthSeries } from "./finance-helpers";

const RMD_TABLE: Record<number, number> = {
  72: 27.4, 73: 26.5, 74: 25.5, 75: 24.6, 76: 23.7, 77: 22.9, 78: 22.0, 79: 21.1,
  80: 20.2, 81: 19.4, 82: 18.5, 83: 17.7, 84: 16.8, 85: 16.0, 86: 15.2, 87: 14.4,
  88: 13.7, 89: 12.9, 90: 12.2, 91: 11.5, 92: 10.8, 93: 10.1, 94: 9.5, 95: 8.9,
  96: 8.4, 97: 7.8, 98: 7.3, 99: 6.8, 100: 6.4,
};

const financialInvesting: CalculatorDefinition[] = [
  {
    slug: "investment-calculator",
    title: "Investment Calculator",
    category: "financial",
    shortDescription: "Project investment growth with contributions, and see the inflation-adjusted value.",
    seoDescription: "Calculate the future value of an investment with regular contributions, and its purchasing power after inflation.",
    formulaSummary: "FV = P(1+r)^t + PMT×[((1+r)^t−1)/r], adjusted for inflation",
    fields: [
      { name: "initial", label: "Initial Investment", type: "number", unit: "$", defaultValue: 5000, min: 0 },
      { name: "monthlyContribution", label: "Monthly Contribution", type: "number", unit: "$", defaultValue: 250, min: 0 },
      { name: "years", label: "Time Horizon", type: "number", unit: "years", defaultValue: 15, min: 0 },
      { name: "returnPercent", label: "Expected Annual Return", type: "number", unit: "%", defaultValue: 8, step: 0.1 },
      { name: "inflationPercent", label: "Expected Inflation", type: "number", unit: "%", defaultValue: 3, step: 0.1, min: 0 },
    ],
    calculate: (i) => {
      const months = n(i.years) * 12;
      const im = n(i.returnPercent) / 100 / 12;
      const fv = n(i.initial) * Math.pow(1 + im, months) + fvAnnuity(n(i.monthlyContribution), im, months);
      const real = fv / Math.pow(1 + n(i.inflationPercent) / 100, n(i.years));
      const contributed = n(i.initial) + n(i.monthlyContribution) * months;
      return {
        results: [
          { label: "Future Value", value: fmtCurrency(fv), emphasis: true },
          { label: "Inflation-Adjusted Value (today's $)", value: fmtCurrency(real) },
          { label: "Total Contributed", value: fmtCurrency(contributed) },
          { label: "Investment Growth", value: fmtCurrency(fv - contributed) },
        ],
        growthSeries: fvGrowthSeries(n(i.initial), n(i.monthlyContribution), n(i.returnPercent), n(i.years)),
        chartCaption: `Inflation at ${fmtNumber(n(i.inflationPercent))}%/yr means your ${fmtCurrency(fv)} nest egg only buys what ${fmtCurrency(real)} buys today.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator", "retirement-calculator"],
  },
  {
    slug: "cd-calculator",
    title: "CD Calculator",
    category: "financial",
    shortDescription: "Calculate the maturity value of a certificate of deposit.",
    seoDescription: "Calculate the maturity value and interest earned on a certificate of deposit (CD) given the APY, term and compounding frequency.",
    formulaSummary: "A = P(1 + r/n)^(nt)",
    fields: [
      { name: "deposit", label: "Deposit Amount", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "apyPercent", label: "APY", type: "number", unit: "%", defaultValue: 4.5, step: 0.01 },
      { name: "termMonths", label: "Term", type: "number", unit: "months", defaultValue: 12, min: 1 },
      { name: "compounding", label: "Compounding", type: "select", defaultValue: "365", options: [
        { value: "12", label: "Monthly" }, { value: "4", label: "Quarterly" }, { value: "365", label: "Daily" },
      ] },
    ],
    calculate: (i) => {
      const cn = n(i.compounding, 365);
      const t = n(i.termMonths, 12) / 12;
      const maturity = n(i.deposit) * Math.pow(1 + n(i.apyPercent) / 100 / cn, cn * t);
      return {
        results: [
          { label: "Maturity Value", value: fmtCurrency(maturity), emphasis: true },
          { label: "Interest Earned", value: fmtCurrency(maturity - n(i.deposit)) },
        ],
        growthSeries: fvGrowthSeries(n(i.deposit), 0, n(i.apyPercent), t),
        chartCaption: `Your ${fmtCurrency(n(i.deposit))} deposit grows to ${fmtCurrency(maturity)} by the time it matures, with no further deposits needed.`,
      };
    },
    relatedSlugs: ["compound-interest-calculator", "savings-calculator"],
  },
  {
    slug: "bond-calculator",
    title: "Bond Calculator",
    category: "financial",
    shortDescription: "Calculate a bond's price and current yield from its coupon and market rate.",
    seoDescription: "Calculate a bond's fair price and current yield given face value, coupon rate, years to maturity and the market discount rate.",
    formulaSummary: "Price = Σ coupon/(1+r)^t + face value/(1+r)^n",
    fields: [
      { name: "faceValue", label: "Face Value", type: "number", unit: "$", defaultValue: 1000, min: 0 },
      { name: "couponPercent", label: "Annual Coupon Rate", type: "number", unit: "%", defaultValue: 5, step: 0.01 },
      { name: "years", label: "Years to Maturity", type: "number", defaultValue: 10, min: 1 },
      { name: "marketRatePercent", label: "Market (Discount) Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
    ],
    calculate: (i) => {
      const face = n(i.faceValue);
      const coupon = face * (n(i.couponPercent) / 100);
      const yrs = Math.round(n(i.years, 10));
      const r = n(i.marketRatePercent) / 100;
      let price = 0;
      for (let t = 1; t <= yrs; t++) price += coupon / Math.pow(1 + r, t);
      price += face / Math.pow(1 + r, yrs);
      const currentYield = (coupon / price) * 100;
      const totalCouponIncome = coupon * yrs;
      return {
        results: [
          { label: "Bond Price", value: fmtCurrency(price), emphasis: true },
          { label: "Current Yield", value: fmtPercent(currentYield) },
          { label: "Annual Coupon Payment", value: fmtCurrency(coupon) },
        ],
        notes: [price > face ? "Trading at a premium (market rate below coupon rate)." : price < face ? "Trading at a discount (market rate above coupon rate)." : "Trading at par."],
        breakdown: [
          { label: "Face Value (Principal)", value: face, displayValue: fmtCurrency(face) },
          { label: "Total Coupon Income", value: totalCouponIncome, displayValue: fmtCurrency(totalCouponIncome) },
        ],
        chartCaption: `Over ${yrs} years, this bond pays out ${fmtCurrency(totalCouponIncome)} in coupons on top of returning your ${fmtCurrency(face)} principal at maturity.`,
      };
    },
    relatedSlugs: ["cd-calculator", "present-value-calculator"],
  },
  {
    slug: "mutual-fund-calculator",
    title: "Mutual Fund Calculator",
    category: "financial",
    shortDescription: "Project mutual fund growth net of the expense ratio.",
    seoDescription: "Calculate mutual fund growth with regular contributions, net of the annual expense ratio.",
    formulaSummary: "Net rate = expected return − expense ratio",
    fields: [
      { name: "initial", label: "Initial Investment", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "monthlyContribution", label: "Monthly Contribution", type: "number", unit: "$", defaultValue: 300, min: 0 },
      { name: "years", label: "Time Horizon", type: "number", unit: "years", defaultValue: 20, min: 0 },
      { name: "returnPercent", label: "Expected Gross Annual Return", type: "number", unit: "%", defaultValue: 8, step: 0.1 },
      { name: "expenseRatioPercent", label: "Expense Ratio", type: "number", unit: "%", defaultValue: 0.6, step: 0.01, min: 0 },
    ],
    calculate: (i) => {
      const netRate = Math.max(0, n(i.returnPercent) - n(i.expenseRatioPercent));
      const months = n(i.years) * 12;
      const im = netRate / 100 / 12;
      const fv = n(i.initial) * Math.pow(1 + im, months) + fvAnnuity(n(i.monthlyContribution), im, months);
      const grossIm = n(i.returnPercent) / 100 / 12;
      const fvGross = n(i.initial) * Math.pow(1 + grossIm, months) + fvAnnuity(n(i.monthlyContribution), grossIm, months);
      return {
        results: [
          { label: "Future Value (net of fees)", value: fmtCurrency(fv), emphasis: true },
          { label: "Lost to Fees Over Time", value: fmtCurrency(fvGross - fv) },
          { label: "Net Annual Return", value: fmtPercent(netRate) },
        ],
        growthSeries: fvGrowthSeries(n(i.initial), n(i.monthlyContribution), netRate, n(i.years)),
        chartCaption: `A ${fmtNumber(n(i.expenseRatioPercent))}% expense ratio doesn't sound like much, but compounded over ${n(i.years)} years it quietly costs you ${fmtCurrency(fvGross - fv)}.`,
      };
    },
    relatedSlugs: ["investment-calculator", "roi-calculator"],
  },
  {
    slug: "roth-ira-calculator",
    title: "Roth IRA Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Project your tax-free Roth IRA balance at retirement.",
    seoDescription: "Estimate your Roth IRA balance at retirement from current balance, annual contributions and expected return — withdrawals are tax-free.",
    formulaSummary: "FV = Balance(1+r)^t + Contributions grown at r",
    fields: [
      { name: "currentAge", label: "Current Age", type: "number", defaultValue: 28, min: 16, max: 80 },
      { name: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, min: 16, max: 80 },
      { name: "currentBalance", label: "Current Balance", type: "number", unit: "$", defaultValue: 8000, min: 0 },
      { name: "annualContribution", label: "Annual Contribution", type: "number", unit: "$", defaultValue: 7000, min: 0, help: "2024 IRS limit: $7,000 ($8,000 if 50+)" },
      { name: "returnPercent", label: "Expected Annual Return", type: "number", unit: "%", defaultValue: 7, step: 0.1 },
    ],
    calculate: (i) => {
      const years = Math.max(0, n(i.retirementAge, 65) - n(i.currentAge, 28));
      const r = n(i.returnPercent) / 100;
      const fv = n(i.currentBalance) * Math.pow(1 + r, years) + n(i.annualContribution) * ((Math.pow(1 + r, years) - 1) / r);
      return {
        results: [
          { label: "Balance at Retirement (tax-free)", value: fmtCurrency(fv), emphasis: true },
          { label: "Total Contributed", value: fmtCurrency(n(i.currentBalance) + n(i.annualContribution) * years) },
        ],
        notes: ["Qualified Roth withdrawals in retirement are entirely tax-free — unlike a traditional IRA."],
        growthSeries: fvGrowthSeries(n(i.currentBalance), n(i.annualContribution) / 12, n(i.returnPercent), years),
        chartCaption: `Projected Roth IRA growth from age ${fmtNumber(n(i.currentAge, 28), 0)} to ${fmtNumber(n(i.retirementAge, 65), 0)} — every dollar in this chart comes out tax-free.`,
      };
    },
    relatedSlugs: ["ira-calculator", "retirement-calculator"],
  },
  {
    slug: "ira-calculator",
    title: "Traditional IRA Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Project your pre-tax IRA balance and its after-tax value at withdrawal.",
    seoDescription: "Estimate your traditional IRA balance at retirement and its after-tax value once withdrawals are taxed as income.",
    formulaSummary: "FV = Balance(1+r)^t + Contributions grown at r; After-tax = FV × (1 − tax rate)",
    fields: [
      { name: "currentAge", label: "Current Age", type: "number", defaultValue: 28, min: 16, max: 80 },
      { name: "retirementAge", label: "Retirement Age", type: "number", defaultValue: 65, min: 16, max: 80 },
      { name: "currentBalance", label: "Current Balance", type: "number", unit: "$", defaultValue: 8000, min: 0 },
      { name: "annualContribution", label: "Annual Contribution", type: "number", unit: "$", defaultValue: 7000, min: 0 },
      { name: "returnPercent", label: "Expected Annual Return", type: "number", unit: "%", defaultValue: 7, step: 0.1 },
      { name: "withdrawalTaxPercent", label: "Tax Rate at Withdrawal", type: "number", unit: "%", defaultValue: 22, min: 0, max: 60 },
    ],
    calculate: (i) => {
      const years = Math.max(0, n(i.retirementAge, 65) - n(i.currentAge, 28));
      const r = n(i.returnPercent) / 100;
      const fv = n(i.currentBalance) * Math.pow(1 + r, years) + n(i.annualContribution) * ((Math.pow(1 + r, years) - 1) / r);
      const afterTax = fv * (1 - n(i.withdrawalTaxPercent) / 100);
      return {
        results: [
          { label: "Balance at Retirement (pre-tax)", value: fmtCurrency(fv), emphasis: true },
          { label: "After-Tax Value", value: fmtCurrency(afterTax), emphasis: true },
        ],
        notes: ["Traditional IRA contributions may be tax-deductible now, but withdrawals are taxed as ordinary income in retirement."],
        growthSeries: fvGrowthSeries(n(i.currentBalance), n(i.annualContribution) / 12, n(i.returnPercent), years),
        chartCaption: `Projected pre-tax balance growth to retirement — remember ${fmtPercent(n(i.withdrawalTaxPercent))} of whatever's left goes to taxes on the way out.`,
      };
    },
    relatedSlugs: ["roth-ira-calculator", "rmd-calculator"],
  },
  {
    slug: "rmd-calculator",
    title: "RMD Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Calculate your Required Minimum Distribution from a retirement account.",
    seoDescription: "Calculate your Required Minimum Distribution (RMD) from a traditional IRA or 401(k) using the IRS Uniform Lifetime Table.",
    formulaSummary: "RMD = account balance ÷ IRS life-expectancy factor",
    fields: [
      { name: "balance", label: "Account Balance (as of Dec 31 last year)", type: "number", unit: "$", defaultValue: 500000, min: 0 },
      { name: "age", label: "Your Age This Year", type: "number", defaultValue: 75, min: 72, max: 100, step: 1 },
    ],
    calculate: (i) => {
      const age = Math.min(100, Math.max(72, Math.round(n(i.age, 75))));
      const factor = RMD_TABLE[age] ?? 6.4;
      const rmd = n(i.balance) / factor;
      const windowStart = Math.min(Math.max(72, age - 2), 95);
      const tableRows = Array.from({ length: 6 }, (_, idx) => windowStart + idx)
        .filter((a) => a <= 100)
        .map((a) => {
          const f = RMD_TABLE[a] ?? 6.4;
          return [String(a), fmtNumber(f, 1), fmtCurrency(n(i.balance) / f)];
        });
      return {
        results: [
          { label: "Required Minimum Distribution", value: fmtCurrency(rmd), emphasis: true },
          { label: "IRS Life Expectancy Factor", value: fmtNumber(factor, 1) },
        ],
        notes: ["Uses the IRS Uniform Lifetime Table. A different table applies if your sole beneficiary is a spouse more than 10 years younger."],
        table: { headers: ["Age", "Life Expectancy Factor", "RMD (same balance)"], rows: tableRows },
        chartCaption: `The IRS factor shrinks every year, so the required distribution grows even if your balance doesn't.`,
      };
    },
    relatedSlugs: ["ira-calculator"],
  },
  {
    slug: "present-value-calculator",
    title: "Present Value Calculator",
    category: "financial",
    shortDescription: "Calculate the present value of a future lump sum.",
    seoDescription: "Calculate the present value (today's worth) of a future lump sum, given a discount rate.",
    formulaSummary: "PV = FV / (1+r)^t",
    fields: [
      { name: "futureValue", label: "Future Value", type: "number", unit: "$", defaultValue: 25000, min: 0 },
      { name: "ratePercent", label: "Discount Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "years", label: "Years", type: "number", defaultValue: 10, min: 0 },
    ],
    calculate: (i) => {
      const pv = n(i.futureValue) / Math.pow(1 + n(i.ratePercent) / 100, n(i.years));
      return {
        results: [{ label: "Present Value", value: fmtCurrency(pv), emphasis: true }],
        formula: "PV = FV / (1+r)^t",
        compare: [
          { label: `Future Value (in ${fmtNumber(n(i.years), 0)}yr)`, value: n(i.futureValue), displayValue: fmtCurrency(n(i.futureValue)) },
          { label: "Present Value (today)", value: pv, displayValue: fmtCurrency(pv), highlight: true },
        ],
        chartCaption: `At a ${fmtPercent(n(i.ratePercent))} discount rate, ${fmtCurrency(n(i.futureValue))} that far in the future is only worth ${fmtCurrency(pv)} in today's dollars.`,
      };
    },
    relatedSlugs: ["future-value-calculator", "bond-calculator"],
  },
  {
    slug: "future-value-calculator",
    title: "Future Value Calculator",
    category: "financial",
    shortDescription: "Calculate the future value of a lump sum plus regular contributions.",
    seoDescription: "Calculate the future value of a present amount plus optional regular contributions, compounded over time.",
    formulaSummary: "FV = PV(1+r)^t + PMT×[((1+r)^t−1)/r]",
    fields: [
      { name: "presentValue", label: "Present Value", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "monthlyContribution", label: "Monthly Contribution", type: "number", unit: "$", defaultValue: 100, min: 0 },
      { name: "ratePercent", label: "Annual Rate", type: "number", unit: "%", defaultValue: 6, step: 0.01 },
      { name: "years", label: "Years", type: "number", defaultValue: 10, min: 0 },
    ],
    calculate: (i) => {
      const months = n(i.years) * 12;
      const im = n(i.ratePercent) / 100 / 12;
      const fv = n(i.presentValue) * Math.pow(1 + im, months) + fvAnnuity(n(i.monthlyContribution), im, months);
      return {
        results: [{ label: "Future Value", value: fmtCurrency(fv), emphasis: true }],
        formula: "FV = PV(1+r)^t + PMT×[((1+r)^t−1)/r]",
        growthSeries: fvGrowthSeries(n(i.presentValue), n(i.monthlyContribution), n(i.ratePercent), n(i.years)),
        chartCaption: `Tap any bar to see the projected balance at that point in the ${n(i.years)}-year timeline.`,
      };
    },
    relatedSlugs: ["present-value-calculator", "compound-interest-calculator"],
  },
  {
    slug: "irr-calculator",
    title: "IRR Calculator",
    category: "financial",
    shortDescription: "Calculate the internal rate of return on a series of cash flows.",
    seoDescription: "Calculate the internal rate of return (IRR) and net present value (NPV) for an initial investment and a series of cash flows.",
    formulaSummary: "IRR = rate where NPV(cash flows) = 0",
    fields: [
      { name: "initialInvestment", label: "Initial Investment (outflow)", type: "number", unit: "$", defaultValue: 50000, min: 0 },
      { name: "cashFlows", label: "Cash Flows by Period (comma separated)", type: "text", defaultValue: "12000, 15000, 18000, 20000, 22000" },
    ],
    calculate: (i) => {
      const flows = (i.cashFlows || "").split(",").map((s) => Number(s.trim())).filter((v) => Number.isFinite(v));
      if (flows.length === 0) return { results: [], error: "Enter at least one cash flow, e.g. 12000, 15000, 18000" };
      const rate = irrSolve(n(i.initialInvestment), flows);
      if (rate === null) return { results: [], error: "No IRR found in a reasonable range — check your cash flow signs and amounts." };
      let cumulative = -n(i.initialInvestment);
      const rows: string[][] = [["0", fmtCurrency(-n(i.initialInvestment)), fmtCurrency(cumulative)]];
      flows.forEach((cf, idx) => {
        cumulative += cf;
        rows.push([String(idx + 1), fmtCurrency(cf), fmtCurrency(cumulative)]);
      });
      return {
        results: [
          { label: "IRR", value: fmtPercent(rate * 100), emphasis: true },
          { label: "NPV at 0%", value: fmtCurrency(npv(0, n(i.initialInvestment), flows)) },
        ],
        table: { headers: ["Period", "Cash Flow", "Cumulative Cash Flow"], rows },
        chartCaption: `An IRR of ${fmtPercent(rate * 100)} is the discount rate at which this cash flow stream breaks exactly even.`,
      };
    },
    relatedSlugs: ["payback-period-calculator", "roi-calculator"],
  },
  {
    slug: "payback-period-calculator",
    title: "Payback Period Calculator",
    category: "financial",
    shortDescription: "Calculate how long it takes to recover an investment from its cash flows.",
    seoDescription: "Calculate the payback period — how many years it takes for an investment's cash flows to recover the initial cost.",
    formulaSummary: "Cumulative cash flow reaches the initial investment",
    fields: [
      { name: "initialInvestment", label: "Initial Investment", type: "number", unit: "$", defaultValue: 40000, min: 0 },
      { name: "cashFlows", label: "Annual Cash Flows (comma separated)", type: "text", defaultValue: "10000, 10000, 12000, 12000, 15000" },
    ],
    calculate: (i) => {
      const flows = (i.cashFlows || "").split(",").map((s) => Number(s.trim())).filter((v) => Number.isFinite(v));
      if (flows.length === 0) return { results: [], error: "Enter at least one annual cash flow." };
      let cumulative = -n(i.initialInvestment);
      let paybackYear = -1;
      const rows: string[][] = [["0", fmtCurrency(-n(i.initialInvestment)), fmtCurrency(cumulative)]];
      for (let idx = 0; idx < flows.length; idx++) {
        const prev = cumulative;
        cumulative += flows[idx];
        rows.push([String(idx + 1), fmtCurrency(flows[idx]), fmtCurrency(cumulative)]);
        if (prev < 0 && cumulative >= 0 && paybackYear === -1) {
          paybackYear = idx + -prev / flows[idx];
        }
      }
      if (paybackYear === -1) {
        return {
          results: [{ label: "Payback Period", value: "Not recovered within given cash flows" }],
          table: { headers: ["Year", "Cash Flow", "Cumulative Cash Flow"], rows },
        };
      }
      return {
        results: [{ label: "Payback Period", value: `${fmtNumber(paybackYear, 2)} years`, emphasis: true }],
        table: { headers: ["Year", "Cash Flow", "Cumulative Cash Flow"], rows },
        chartCaption: `Cumulative cash flow crosses zero at ${fmtNumber(paybackYear, 2)} years — that's when the investment has fully paid for itself.`,
      };
    },
    relatedSlugs: ["irr-calculator", "roi-calculator"],
  },
  {
    slug: "average-return-calculator",
    title: "Average Return Calculator",
    category: "financial",
    shortDescription: "Calculate the arithmetic and geometric (CAGR) average of a series of yearly returns.",
    seoDescription: "Calculate the arithmetic mean return and geometric mean (CAGR) from a series of annual investment returns.",
    formulaSummary: "Geometric mean = [Π(1+r_i)]^(1/n) − 1",
    fields: [{ name: "returns", label: "Yearly Returns % (comma separated)", type: "text", defaultValue: "12, -8, 20, 5, 15" }],
    calculate: (i) => {
      const returns = (i.returns || "").split(",").map((s) => Number(s.trim())).filter((v) => Number.isFinite(v));
      if (returns.length === 0) return { results: [], error: "Enter at least one yearly return percentage." };
      const arithmetic = returns.reduce((a, b) => a + b, 0) / returns.length;
      const product = returns.reduce((a, r) => a * (1 + r / 100), 1);
      const geometric = (Math.pow(product, 1 / returns.length) - 1) * 100;
      const best = Math.max(...returns);
      const worst = Math.min(...returns);
      return {
        results: [
          { label: "Arithmetic Average Return", value: fmtPercent(arithmetic) },
          { label: "Geometric Average Return (CAGR)", value: fmtPercent(geometric), emphasis: true },
        ],
        notes: ["The geometric average is the more accurate measure of actual compounded investment performance over multiple years."],
        compare: [
          { label: "Best Year", value: best, displayValue: fmtPercent(best) },
          { label: "Worst Year", value: worst, displayValue: fmtPercent(worst) },
          { label: "Geometric Average (CAGR)", value: geometric, displayValue: fmtPercent(geometric), highlight: true },
        ],
        chartCaption: `Returns swung from ${fmtPercent(best)} in the best year to ${fmtPercent(worst)} in the worst — the CAGR of ${fmtPercent(geometric)} is what you actually earned smoothed over the whole period.`,
      };
    },
    relatedSlugs: ["roi-calculator"],
  },
  {
    slug: "annuity-calculator",
    title: "Annuity Calculator",
    category: "financial",
    shortDescription: "Calculate the future value of a series of fixed periodic payments.",
    seoDescription: "Calculate the future value of an ordinary annuity or annuity due from a fixed payment, interest rate and number of periods.",
    formulaSummary: "FV = PMT × [((1+i)^n − 1)/i], ×(1+i) if annuity due",
    fields: [
      { name: "payment", label: "Payment Per Period", type: "number", unit: "$", defaultValue: 500, min: 0 },
      { name: "ratePercent", label: "Interest Rate Per Period", type: "number", unit: "%", defaultValue: 0.5, step: 0.01 },
      { name: "periods", label: "Number of Periods", type: "number", defaultValue: 120, min: 1 },
      { name: "type", label: "Type", type: "select", defaultValue: "ordinary", options: [{ value: "ordinary", label: "Ordinary (end of period)" }, { value: "due", label: "Annuity Due (start of period)" }] },
    ],
    calculate: (i) => {
      const r = n(i.ratePercent) / 100;
      const periods = n(i.periods, 120);
      let fv = fvAnnuity(n(i.payment), r, periods);
      if (i.type === "due") fv *= 1 + r;
      const numYears = Math.max(1, Math.ceil(periods / 12));
      const growthSeries = Array.from({ length: numYears }, (_, idx) => {
        const y = idx + 1;
        const periodsElapsed = Math.min(periods, y * 12);
        let value = fvAnnuity(n(i.payment), r, periodsElapsed);
        if (i.type === "due") value *= 1 + r;
        return { label: `Yr ${y}`, value, displayValue: fmtCurrency(value) };
      });
      return {
        results: [
          { label: "Future Value", value: fmtCurrency(fv), emphasis: true },
          { label: "Total Contributed", value: fmtCurrency(n(i.payment) * periods) },
        ],
        growthSeries,
        chartCaption: `Steady ${fmtCurrency(n(i.payment))} payments compound into ${fmtCurrency(fv)} by the end of the term.`,
      };
    },
    relatedSlugs: ["annuity-payout-calculator", "future-value-calculator"],
  },
  {
    slug: "annuity-payout-calculator",
    title: "Annuity Payout Calculator",
    category: "financial",
    shortDescription: "Calculate the fixed periodic payout a lump sum can provide.",
    seoDescription: "Calculate the fixed periodic payment a lump sum can generate over a set number of periods at a given interest rate.",
    formulaSummary: "PMT = PV × r / (1 − (1+r)^−n)",
    fields: [
      { name: "presentValue", label: "Lump Sum", type: "number", unit: "$", defaultValue: 250000, min: 0 },
      { name: "ratePercent", label: "Interest Rate Per Period", type: "number", unit: "%", defaultValue: 0.4, step: 0.01 },
      { name: "periods", label: "Number of Periods", type: "number", defaultValue: 240, min: 1 },
    ],
    calculate: (i) => {
      const r = n(i.ratePercent) / 100;
      const nper = n(i.periods, 240);
      const pmt = r === 0 ? n(i.presentValue) / nper : (n(i.presentValue) * r) / (1 - Math.pow(1 + r, -nper));
      const totalPaidOut = pmt * nper;
      const interestEarned = Math.max(0, totalPaidOut - n(i.presentValue));
      return {
        results: [
          { label: "Payment Per Period", value: fmtCurrency(pmt), emphasis: true },
          { label: "Total Paid Out", value: fmtCurrency(totalPaidOut) },
        ],
        breakdown: [
          { label: "Original Lump Sum", value: n(i.presentValue), displayValue: fmtCurrency(n(i.presentValue)) },
          { label: "Interest Earned Over Payout", value: interestEarned, displayValue: fmtCurrency(interestEarned) },
        ],
        chartCaption: `Your lump sum stretches into ${fmtCurrency(totalPaidOut)} in total payouts — ${fmtCurrency(interestEarned)} of that is interest earned along the way, not just your original money coming back.`,
      };
    },
    relatedSlugs: ["annuity-calculator", "pension-calculator"],
  },
  {
    slug: "pension-calculator",
    title: "Pension Calculator",
    category: "financial",
    shortDescription: "Estimate a defined-benefit pension payout from salary and years of service.",
    seoDescription: "Estimate an annual and monthly defined-benefit pension payout from final average salary, years of service and accrual rate.",
    formulaSummary: "Annual pension = final average salary × years of service × accrual rate",
    fields: [
      { name: "finalAvgSalary", label: "Final Average Salary", type: "number", unit: "$", defaultValue: 85000, min: 0 },
      { name: "yearsOfService", label: "Years of Service", type: "number", defaultValue: 25, min: 0 },
      { name: "accrualRatePercent", label: "Accrual Rate", type: "number", unit: "% per year", defaultValue: 1.8, step: 0.1 },
    ],
    calculate: (i) => {
      const annual = n(i.finalAvgSalary) * n(i.yearsOfService) * (n(i.accrualRatePercent) / 100);
      const baseYears = n(i.yearsOfService, 25);
      const tableRows = [-10, -5, 0, 5, 10]
        .map((delta) => baseYears + delta)
        .filter((ys) => ys >= 1)
        .map((ys) => {
          const a = n(i.finalAvgSalary) * ys * (n(i.accrualRatePercent) / 100);
          return [fmtNumber(ys, 0), fmtCurrency(a), fmtCurrency(a / 12)];
        });
      return {
        results: [
          { label: "Estimated Annual Pension", value: fmtCurrency(annual), emphasis: true },
          { label: "Estimated Monthly Pension", value: fmtCurrency(annual / 12) },
        ],
        notes: ["Accrual rate and formula vary widely by plan — check your plan's specific benefit formula for an exact figure."],
        table: { headers: ["Years of Service", "Annual Pension", "Monthly Pension"], rows: tableRows },
        chartCaption: `Every extra year of service raises your pension by ${fmtCurrency(n(i.finalAvgSalary) * (n(i.accrualRatePercent) / 100))} a year — this table shows the payout at nearby service lengths.`,
      };
    },
    relatedSlugs: ["social-security-calculator", "retirement-calculator"],
  },
  {
    slug: "social-security-calculator",
    title: "Social Security Calculator",
    category: "financial",
    jurisdiction: "US",
    shortDescription: "Estimate your monthly Social Security benefit at different claiming ages.",
    seoDescription: "Estimate how claiming Social Security early or late changes your monthly benefit compared to your full retirement age amount.",
    formulaSummary: "Reduced ~5/9–5/12% per month early; increased ~2/3% per month delayed (up to 70)",
    fields: [
      { name: "fraBenefit", label: "Benefit at Full Retirement Age", type: "number", unit: "$/mo", defaultValue: 2200, min: 0 },
      { name: "fullRetirementAge", label: "Full Retirement Age", type: "number", defaultValue: 67, min: 65, max: 67 },
      { name: "claimingAge", label: "Age You Plan to Claim", type: "number", defaultValue: 65, min: 62, max: 70, step: 1 },
    ],
    calculate: (i) => {
      const fra = n(i.fullRetirementAge, 67);
      const claim = n(i.claimingAge, 65);
      const benefitAtAge = (claimAge: number) => {
        const diff = Math.round((claimAge - fra) * 12);
        let b = n(i.fraBenefit);
        if (diff < 0) {
          const early = Math.abs(diff);
          const first36 = Math.min(36, early) * (5 / 9 / 100);
          const beyond36 = Math.max(0, early - 36) * (5 / 12 / 100);
          b *= 1 - first36 - beyond36;
        } else if (diff > 0) {
          b *= 1 + diff * (2 / 3 / 100);
        }
        return b;
      };
      const benefit = benefitAtAge(claim);
      const compareAges = Array.from(new Set([62, fra, 70, claim]));
      const compare = compareAges.map((age) => ({
        label: age === fra ? `Full Retirement (${fmtNumber(age, 0)})` : `Age ${fmtNumber(age, 0)}`,
        value: benefitAtAge(age),
        displayValue: fmtCurrency(benefitAtAge(age)),
        highlight: age === claim,
      }));
      return {
        results: [{ label: `Monthly Benefit at Age ${fmtNumber(claim, 0)}`, value: fmtCurrency(benefit), emphasis: true }],
        notes: ["Simplified estimate using standard SSA early/delayed retirement adjustment rules — your actual benefit depends on your full earnings record."],
        compare,
        chartCaption: `Claiming at ${fmtNumber(claim, 0)} instead of your full retirement age of ${fmtNumber(fra, 0)} changes your monthly check by ${fmtCurrency(Math.abs(benefit - n(i.fraBenefit)))} — the difference locks in for life.`,
      };
    },
    relatedSlugs: ["pension-calculator", "retirement-calculator"],
  },
  {
    slug: "retirement-calculator",
    title: "Retirement Calculator",
    category: "financial",
    shortDescription: "Project your total retirement savings and a sustainable annual withdrawal.",
    seoDescription: "Project your retirement savings balance and estimate a sustainable annual withdrawal using the 4% rule.",
    formulaSummary: "Sustainable withdrawal ≈ balance × 4% (the '4% rule')",
    fields: [
      { name: "currentSavings", label: "Current Retirement Savings", type: "number", unit: "$", defaultValue: 60000, min: 0 },
      { name: "monthlyContribution", label: "Monthly Contribution", type: "number", unit: "$", defaultValue: 800, min: 0 },
      { name: "yearsToRetirement", label: "Years to Retirement", type: "number", defaultValue: 25, min: 0 },
      { name: "returnPercent", label: "Expected Annual Return", type: "number", unit: "%", defaultValue: 7, step: 0.1 },
      { name: "desiredAnnualIncome", label: "Desired Annual Retirement Income", type: "number", unit: "$", defaultValue: 60000, min: 0 },
    ],
    calculate: (i) => {
      const months = n(i.yearsToRetirement) * 12;
      const im = n(i.returnPercent) / 100 / 12;
      const fv = n(i.currentSavings) * Math.pow(1 + im, months) + fvAnnuity(n(i.monthlyContribution), im, months);
      const sustainable = fv * 0.04;
      const gap = n(i.desiredAnnualIncome) - sustainable;
      return {
        results: [
          { label: "Projected Savings at Retirement", value: fmtCurrency(fv), emphasis: true },
          { label: "Sustainable Annual Withdrawal (4% rule)", value: fmtCurrency(sustainable), emphasis: true },
          { label: gap > 0 ? "Annual Income Shortfall" : "Annual Income Surplus", value: fmtCurrency(Math.abs(gap)) },
        ],
        notes: ["The 4% rule is a widely used rule of thumb, not a guarantee — actual sustainable withdrawal rates depend on market conditions and retirement length."],
        growthSeries: fvGrowthSeries(n(i.currentSavings), n(i.monthlyContribution), n(i.returnPercent), n(i.yearsToRetirement)),
        chartCaption:
          gap > 0
            ? `At this savings rate, your projected income falls ${fmtCurrency(gap)} short of your ${fmtCurrency(n(i.desiredAnnualIncome))} goal each year in retirement.`
            : `Your projected savings clear your ${fmtCurrency(n(i.desiredAnnualIncome))} income goal with ${fmtCurrency(Math.abs(gap))} to spare each year.`,
      };
    },
    relatedSlugs: ["retirement-401k-calculator", "social-security-calculator"],
  },
  {
    slug: "margin-calculator",
    title: "Margin Calculator",
    category: "financial",
    shortDescription: "Calculate buying power and borrowed amount when trading on margin.",
    seoDescription: "Calculate your total buying power and the amount borrowed when trading stocks on margin.",
    formulaSummary: "Buying power = cash deposited ÷ margin requirement",
    fields: [
      { name: "cashDeposited", label: "Cash Deposited", type: "number", unit: "$", defaultValue: 10000, min: 0 },
      { name: "marginRequirementPercent", label: "Margin Requirement", type: "number", unit: "%", defaultValue: 50, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const buyingPower = n(i.cashDeposited) / (n(i.marginRequirementPercent, 50) / 100);
      const borrowed = buyingPower - n(i.cashDeposited);
      return {
        results: [
          { label: "Total Buying Power", value: fmtCurrency(buyingPower), emphasis: true },
          { label: "Amount Borrowed", value: fmtCurrency(borrowed) },
        ],
        notes: ["Trading on margin amplifies both gains and losses, and brokers can issue a margin call requiring more cash."],
        breakdown: [
          { label: "Your Equity (Cash Deposited)", value: n(i.cashDeposited), displayValue: fmtCurrency(n(i.cashDeposited)) },
          { label: "Borrowed on Margin", value: Math.max(0, borrowed), displayValue: fmtCurrency(borrowed) },
        ],
        chartCaption: `Your ${fmtCurrency(n(i.cashDeposited))} in cash controls ${fmtCurrency(buyingPower)} in buying power — the rest, ${fmtCurrency(borrowed)}, is borrowed from your broker.`,
      };
    },
    relatedSlugs: ["roi-calculator"],
  },
  {
    slug: "depreciation-calculator",
    title: "Depreciation Calculator",
    category: "financial",
    shortDescription: "Calculate straight-line and declining-balance depreciation for an asset.",
    seoDescription: "Calculate annual depreciation for a business asset using the straight-line or double-declining-balance method.",
    formulaSummary: "Straight-line = (cost − salvage) ÷ life",
    fields: [
      { name: "cost", label: "Asset Cost", type: "number", unit: "$", defaultValue: 40000, min: 0 },
      { name: "salvageValue", label: "Salvage Value", type: "number", unit: "$", defaultValue: 5000, min: 0 },
      { name: "usefulLifeYears", label: "Useful Life", type: "number", unit: "years", defaultValue: 7, min: 1 },
    ],
    calculate: (i) => {
      const cost = n(i.cost);
      const salvage = n(i.salvageValue);
      const life = n(i.usefulLifeYears, 7);
      const straightLine = (cost - salvage) / life;
      const dbRate = 2 / life;
      const decliningYear1 = cost * dbRate;
      const wholeLife = Math.max(1, Math.round(life));
      const growthSeries = Array.from({ length: wholeLife }, (_, idx) => {
        const y = idx + 1;
        const value = Math.max(salvage, cost - straightLine * y);
        return { label: `Yr ${y}`, value, displayValue: fmtCurrency(value) };
      });
      return {
        results: [
          { label: "Straight-Line Annual Depreciation", value: fmtCurrency(straightLine), emphasis: true },
          { label: "Double-Declining Balance (Year 1)", value: fmtCurrency(Math.min(decliningYear1, cost - salvage)) },
          { label: "Book Value After Year 1 (straight-line)", value: fmtCurrency(cost - straightLine) },
        ],
        growthSeries,
        chartCaption: `Book value declines by ${fmtCurrency(straightLine)} every year under straight-line depreciation, from ${fmtCurrency(cost)} down to its ${fmtCurrency(salvage)} salvage value.`,
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "gdp-calculator",
    title: "GDP Calculator",
    category: "financial",
    shortDescription: "Calculate GDP using the expenditure approach.",
    seoDescription: "Calculate Gross Domestic Product (GDP) using the expenditure approach: consumption, investment, government spending and net exports.",
    formulaSummary: "GDP = C + I + G + (X − M)",
    fields: [
      { name: "consumption", label: "Consumption (C)", type: "number", unit: "$", defaultValue: 14000000000000, min: 0 },
      { name: "investment", label: "Investment (I)", type: "number", unit: "$", defaultValue: 3500000000000, min: 0 },
      { name: "government", label: "Government Spending (G)", type: "number", unit: "$", defaultValue: 3800000000000, min: 0 },
      { name: "exports", label: "Exports (X)", type: "number", unit: "$", defaultValue: 2100000000000, min: 0 },
      { name: "imports", label: "Imports (M)", type: "number", unit: "$", defaultValue: 3200000000000, min: 0 },
    ],
    calculate: (i) => {
      const netExports = n(i.exports) - n(i.imports);
      const gdp = n(i.consumption) + n(i.investment) + n(i.government) + netExports;
      const pct = (v: number) => fmtPercent((v / gdp) * 100, 1);
      const table = {
        headers: ["Component", "Amount", "% of GDP"],
        rows: [
          ["Consumption (C)", fmtCurrency(n(i.consumption), "USD", 0), pct(n(i.consumption))],
          ["Investment (I)", fmtCurrency(n(i.investment), "USD", 0), pct(n(i.investment))],
          ["Government Spending (G)", fmtCurrency(n(i.government), "USD", 0), pct(n(i.government))],
          ["Net Exports (X − M)", fmtCurrency(netExports, "USD", 0), pct(netExports)],
          ["GDP (Total)", fmtCurrency(gdp, "USD", 0), "100%"],
        ],
      };
      return {
        results: [{ label: "GDP", value: fmtCurrency(gdp, "USD", 0), emphasis: true }],
        formula: "GDP = C + I + G + (X − M)",
        table,
        chartCaption: netExports < 0
          ? `Consumption is the biggest driver of this GDP figure — net exports are negative, meaning imports (${fmtCurrency(n(i.imports), "USD", 0)}) outweigh exports (${fmtCurrency(n(i.exports), "USD", 0)}).`
          : `Consumption is typically the biggest driver of GDP, with net exports adding ${fmtCurrency(netExports, "USD", 0)} on top.`,
      };
    },
    relatedSlugs: ["inflation-calculator"],
  },
];

export default financialInvesting;
