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
    content: {
      intro: [
        "Most affordability rules of thumb are just a multiple of salary — \"buy a home worth 3x your income\" — and they fall apart the moment you have a car payment, student loans, or credit card debt, because they never look at what's already coming out of your paycheck. This calculator works the way an underwriter actually does: it takes your income and existing monthly debts, applies a debt-to-income ceiling, and solves backward for the highest home price whose payment still fits under that ceiling.",
        "It's the calculator to run before you start touring homes or talking to a lender — so the price range you're shopping in is one you can actually qualify for, not one a listing site's search filter happened to suggest.",
        "Your income, your debts, and how close to the edge your finances are — none of that needs to leave your browser to get an answer. The math runs locally, so you can find your real number before a loan officer ever sees your pay stubs.",
      ],
      howItWorks: [
        "The calculator first finds your maximum monthly housing payment: your gross monthly income times your target debt-to-income ratio, minus the debt payments you already carry. From there it searches for the home price whose principal, interest, estimated tax, and insurance payment lands exactly on that budget — testing prices up and down until the payment matches, the same backward approach a pre-approval worksheet uses.",
      ],
      faq: [
        {
          q: "What debt-to-income ratio should I use for this calculator?",
          a: "36% is the conventional-loan comfort zone most lenders start from, but many will go up to 43-45% with strong credit, and some government-backed programs allow more. Try a couple of DTI values here to see how much the affordable price moves.",
        },
        {
          q: "Why does this give a different number than the mortgage calculator?",
          a: "This calculator starts from your income and works backward to a price; the mortgage calculator starts from a price you already have in mind and works forward to a payment. Run both — if they disagree, your income-based ceiling is the more conservative number to shop with.",
        },
        {
          q: "Does this include closing costs?",
          a: "No — it estimates the home price your monthly budget supports, not the cash you need on hand. Closing costs typically run 2-5% of the loan amount and are a separate upfront expense on top of your down payment.",
        },
        {
          q: "What counts as a monthly debt payment here?",
          a: "Recurring obligations that show up on your credit report — car loans, student loans, minimum credit card payments, personal loans, and other mortgages or child support. Utilities, groceries, and subscriptions aren't counted because lenders don't count them either.",
        },
        {
          q: "Is 36% DTI a hard rule I need to hit?",
          a: "No, it's a common lender guideline, not a law — actual limits vary by loan program, credit score, and lender. Treat the result here as a well-informed estimate to shop with, not a guaranteed approval amount.",
        },
      ],
    },
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
    content: {
      intro: [
        "A lower rate doesn't automatically mean a refinance is worth it — closing costs on a refi typically run a few thousand dollars, and until your monthly savings pay that back, you're actually behind. This calculator compares your current payment to a new offer and tells you the one number that actually matters: how many months until the refinance breaks even.",
        "It's built for the moment a rate drops, a lender sends an unsolicited offer, or your credit score improves enough to qualify for something better — anyone deciding whether switching loans is worth the paperwork and the closing costs, or just noise.",
        "You can run a real offer against your real mortgage balance without it becoming a hard inquiry or a call from a loan officer — the numbers stay in your browser until you decide the deal is worth pursuing.",
      ],
      faq: [
        {
          q: "How long do I need to stay in my home for a refinance to be worth it?",
          a: "At minimum, longer than the breakeven month this calculator shows you. If you might sell or move before that point, the closing costs likely won't be recovered, even if the new rate is genuinely lower.",
        },
        {
          q: "Does refinancing reset my mortgage and cost me equity?",
          a: "It resets your loan's clock, not your home equity — the equity you've built stays yours. But if you refinance into a new 30-year term after years of paying down a shorter one, you'll be back near the start of an amortization schedule, paying mostly interest again for a while.",
        },
        {
          q: "What closing costs should I actually enter here?",
          a: "Include the lender's origination fee, appraisal, title insurance, and any points you're paying to buy down the rate — most refinances land in the 2-5% of loan amount range, though it varies by lender and state.",
        },
        {
          q: "Is refinancing worth it for just a 0.5-1% rate drop?",
          a: "It depends entirely on your closing costs versus how long you'll keep the loan — a small rate drop on a large, long-remaining balance can still save real money over years. Let the breakeven-month result answer this for your specific numbers rather than a generic threshold.",
        },
        {
          q: "How is a cash-out refinance different from what this calculates?",
          a: "This assumes you're refinancing your existing balance only. A cash-out refinance borrows more than you currently owe and hands you the difference — enter that larger amount as your new loan balance to estimate that scenario's payment instead.",
        },
      ],
    },
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
    content: {
      intro: [
        "Comparing rent to a mortgage payment side by side is the comparison most people make, and it's also the wrong one — a mortgage payment builds equity you keep, while rent doesn't, and a home's value can also rise while you own it. This calculator nets all of that out: your total cash outlay to buy (down payment, payments, taxes and maintenance) against the equity you'd actually have if you sold at the end of your time horizon, compared to what renting the same years would have cost.",
        "It's most useful for the decision that's genuinely close — someone who's rented for years wondering if buying finally makes sense, or someone relocating for a job who isn't sure how long they'll actually stay, since the length of time you stay is usually the single biggest factor in which option wins.",
        "It's also the kind of comparison people run quietly, long before they're ready to tell a landlord or a realtor anything — every number here stays local to your device, so you can model a decision you haven't made yet without leaving a trail.",
      ],
      howItWorks: [
        "The 'net cost of buying' adds up your down payment, every principal-and-interest payment made during your stay, and estimated annual tax plus maintenance — then subtracts the equity you'd walk away with: the home's appreciated value minus whatever mortgage balance is still left. The cost of renting is simply your monthly rent times the same number of months, for an apples-to-apples comparison over the same time horizon.",
        "This is deliberately a simplified model — it doesn't factor in rent increasing year over year, what you could have earned investing the money that instead went into a down payment, or the real estate agent commission and closing costs you'd pay when selling. Treat the result as a strong directional signal, not a precise forecast.",
      ],
      faq: [
        {
          q: "How many years do I need to stay for buying to beat renting?",
          a: "There's no universal number — it depends on your down payment, mortgage rate, and local appreciation, which is exactly why this calculator solves it for your own inputs. As a general pattern, longer stays favor buying because closing costs and the early, interest-heavy years of a mortgage get amortized over more time.",
        },
        {
          q: "Does this account for selling costs when I eventually sell the home?",
          a: "Not automatically — real estate commissions and closing costs on a sale typically run 6-10% of the sale price combined, and that isn't subtracted from the equity figure here. Mentally shave that off your equity number for a more conservative comparison.",
        },
        {
          q: "What if my rent will go up over the years I'm comparing?",
          a: "This calculator assumes flat rent for the full period, which understates the true cost of renting long-term. If you expect meaningful rent increases, the real gap in buying's favor is likely wider than what's shown here.",
        },
        {
          q: "Is it fair to ignore what I could have earned investing my down payment instead?",
          a: "It's a real cost of buying that this calculator doesn't include — the opportunity cost of tying up cash in a down payment instead of investing it elsewhere. If you have a specific expected return in mind, it's worth comparing separately against your home's projected appreciation rate.",
        },
        {
          q: "Is renting ever the financially smarter choice even long-term?",
          a: "Yes, especially in markets where home prices are high relative to rent, or where you genuinely don't know how long you'll stay. Run this with your actual local numbers rather than assuming buying always wins — the math genuinely goes either way depending on your market and timeline.",
        },
      ],
    },
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
    content: {
      intro: [
        "The down payment number people quote — 20% — is a convention, not a requirement, and the percentage you actually put down changes two things at once: how much you're financing and whether you'll be paying for private mortgage insurance on top of it. This calculator turns a target percentage into the actual dollar amount and the loan size that results, so you can see the real tradeoff between a bigger upfront payment and a smaller loan.",
        "It's typically the first calculation a buyer runs, before mortgage rates or monthly payments even enter the picture — figuring out what cash is actually needed to open the door to a given home price.",
        "Whether you're weighing 5% down against 20% down on a home you haven't made an offer on yet, the numbers you test here never leave your device.",
      ],
      faq: [
        {
          q: "How much down payment do I actually need to buy a house?",
          a: "Conventional loans allow as little as 3% down for qualified buyers, FHA loans allow 3.5%, and VA loans can go to 0% down for eligible veterans — 20% isn't a minimum, it's the threshold that avoids private mortgage insurance.",
        },
        {
          q: "What happens if I put down less than 20%?",
          a: "On a conventional loan, you'll typically pay private mortgage insurance (PMI) as a monthly add-on until your equity reaches roughly 20%, at which point you can usually request it be removed. FHA loans have their own separate mortgage insurance rules that work differently and often last longer.",
        },
        {
          q: "Is putting 20% down always the smartest move?",
          a: "Not necessarily — it avoids PMI, but tying up more cash in a down payment means less liquidity and less to invest elsewhere. Whether it's worth it depends on your PMI cost, your other financial priorities, and how comfortable you are being less liquid.",
        },
        {
          q: "How does a bigger down payment change my loan amount?",
          a: "Dollar for dollar — every extra dollar you put down is a dollar you don't have to borrow, which lowers both your loan amount and, in turn, your monthly principal and interest payment on a mortgage calculator.",
        },
      ],
    },
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
    content: {
      intro: [
        "FHA loans exist to make homeownership reachable with a lower down payment and more forgiving credit requirements than most conventional loans — but that access comes with mortgage insurance premium (MIP) attached in two separate pieces, an upfront charge rolled into the loan and a monthly charge added to every payment. This calculator adds up both, because the upfront MIP alone can add thousands to your loan balance that a quick mental estimate would miss.",
        "It's built for buyers using or considering an FHA loan specifically — often first-time buyers, or anyone whose credit score or down payment savings don't yet clear the bar for a conventional loan.",
        "Since the numbers behind an FHA application — your down payment savings, your credit situation — are exactly the kind of thing people research privately before talking to a lender, everything here runs in your browser and nowhere else.",
      ],
      howItWorks: [
        "The upfront MIP is a percentage of your base loan amount, charged once and typically financed directly into the loan rather than paid in cash — so it increases the total amount you're borrowing and, in turn, your principal and interest payment. The annual MIP is a smaller percentage of that same (larger) loan balance, divided by 12 and added to every monthly payment as long as it applies.",
      ],
      faq: [
        {
          q: "What is FHA MIP and how is it different from PMI on a conventional loan?",
          a: "Both protect the lender if you default, but FHA's mortgage insurance premium (MIP) is charged in two parts — an upfront fee and an ongoing monthly fee — while conventional PMI is monthly only. FHA MIP rates and rules are also set by the government, not the lender.",
        },
        {
          q: "Can I ever remove FHA mortgage insurance?",
          a: "It depends on your down payment: put down 10% or more and MIP typically drops off after 11 years; put down less than 10% and it generally stays for the life of the loan. Many FHA borrowers eventually refinance into a conventional loan once they've built enough equity, specifically to shed MIP.",
        },
        {
          q: "What's the minimum down payment for an FHA loan?",
          a: "3.5% for borrowers with a credit score of 580 or above — one of the lowest minimums of any mainstream loan program, which is the main reason FHA loans are popular with first-time buyers.",
        },
        {
          q: "Is an FHA loan cheaper than a conventional loan overall?",
          a: "Not always — FHA loans often have a lower interest rate but higher, longer-lasting insurance costs than conventional PMI, so the total cost comparison depends heavily on your credit score and down payment. Running both this calculator and the standard mortgage calculator with matching inputs is the only way to compare your specific numbers.",
        },
      ],
    },
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
    content: {
      intro: [
        "A VA loan's headline feature — $0 down for eligible veterans and active-duty service members — makes it easy to assume there's no extra cost involved, but most borrowers still pay a VA funding fee that gets rolled into the loan balance. This calculator adds that fee to the base loan so the payment you see reflects what you'll actually owe, not just the home price minus your down payment.",
        "It's for veterans, active-duty members, and eligible surviving spouses comparing a VA loan against conventional financing, especially when deciding whether a $0-down purchase is really the better deal once the funding fee is accounted for.",
        "Your service details and loan numbers don't need to go through a VA lender's portal just to get a rough estimate — this runs entirely in your browser first.",
      ],
      howItWorks: [
        "The funding fee is a percentage of your base loan amount that varies by your down payment size and whether it's your first time using your VA loan benefit — generally, a larger down payment and first-time use both lower the fee. Like FHA's upfront MIP, it's typically financed into the loan rather than paid in cash, which is why the total loan amount ends up larger than the home price minus your down payment.",
      ],
      faq: [
        {
          q: "Who is exempt from paying the VA funding fee?",
          a: "Veterans receiving VA disability compensation, and certain surviving spouses of veterans who died in service or from a service-connected disability, are typically exempt. Check your Certificate of Eligibility or with the VA directly to confirm your status before assuming either way.",
        },
        {
          q: "Does a bigger down payment lower the VA funding fee?",
          a: "Yes — the fee tiers down as your down payment increases, with the lowest fee tier generally kicking in around 10% down. Enter a few different down payment percentages here to see how much that actually saves on the fee itself.",
        },
        {
          q: "Is a VA loan better than a conventional loan?",
          a: "For eligible borrowers it's often cheaper overall, since it allows $0 down with no monthly private mortgage insurance — the funding fee is a one-time cost rather than an ongoing monthly one. Whether it beats a specific conventional offer still depends on the rates and terms both lenders quote you.",
        },
        {
          q: "Can I pay the VA funding fee in cash instead of financing it?",
          a: "Yes, it can be paid out of pocket at closing instead of rolled into the loan — doing so keeps your loan balance (and your monthly payment) lower, at the cost of more cash due upfront.",
        },
      ],
    },
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
    content: {
      intro: [
        "Home equity is the gap between what your house is worth and what you still owe on it, but that gap isn't the same as what you can borrow — lenders cap how much of it they'll let you access, usually to 80-85% of your home's value combined with your existing mortgage. This calculator applies that cap first, so the equity figure you see is what a lender would actually approve, not just the paper number from a home value estimate.",
        "It's built for homeowners who already know what they want to borrow for — a renovation, consolidating higher-rate debt, a major expense — and need to know two things before they apply: whether their equity actually covers it, and what the fixed monthly payment would look like at a given rate and term.",
        "Home value estimates and mortgage balances are exactly the kind of numbers people would rather test privately before a lender's online form starts a credit inquiry — this calculator runs entirely in your browser, so nothing here is submitted anywhere.",
      ],
      howItWorks: [
        "Available equity is your home's value times the lender's maximum loan-to-value percentage, minus what you still owe on your primary mortgage — that's the ceiling on what any home equity loan or line of credit could reach, combined with your existing mortgage. The monthly payment then uses the standard fixed-rate amortization formula, since unlike a HELOC, a home equity loan is disbursed as one lump sum and repaid on a set schedule from day one.",
      ],
      faq: [
        {
          q: "What's the difference between a home equity loan and a HELOC?",
          a: "A home equity loan gives you one lump sum at a fixed rate with a fixed payment from the start. A HELOC is a revolving credit line you draw from as needed, usually at a variable rate, with interest-only payments during an initial draw period.",
        },
        {
          q: "How much of my home equity can I actually borrow?",
          a: "Most lenders cap combined borrowing (your existing mortgage plus the new loan) at 80-85% of your home's appraised value, though some go higher for borrowers with strong credit. The remaining 15-20% stays as a cushion the lender requires, not equity you can tap.",
        },
        {
          q: "Is a home equity loan the same as a second mortgage?",
          a: "Yes — a home equity loan is a second mortgage in every practical sense: it's a separate lien on your home, sits behind your primary mortgage in repayment priority, and puts your home up as collateral just like your first mortgage does.",
        },
        {
          q: "Can I get a home equity loan with less than 20% equity in my home?",
          a: "It's possible with some lenders if your combined loan-to-value still stays under their max, but options narrow quickly below 20% equity, and rates tend to be less favorable. Run your numbers here first to see if you clear a lender's typical 80-85% CLTV threshold at all.",
        },
        {
          q: "Is home equity loan interest tax deductible?",
          a: "Only if the loan proceeds are used to buy, build, or substantially improve the home securing the loan, under current US tax rules — using the money for debt consolidation or other expenses generally doesn't qualify. Confirm your specific situation with a tax professional before assuming either way.",
        },
      ],
    },
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
    content: {
      intro: [
        "A HELOC doesn't hand you a lump sum the way a home equity loan does — it opens a revolving credit line against your home's equity that you draw from as needed, much like a credit card but secured by your house and priced far lower. This calculator estimates two things: the credit line a lender would likely approve based on your home value and mortgage balance, and the interest-only payment you'd owe on whatever you've actually drawn during the draw period.",
        "It's useful for homeowners who don't want to borrow a fixed amount upfront — someone financing a renovation in phases, or wanting a standing cushion of available credit for expenses that haven't fully materialized yet.",
        "Because a HELOC application usually means a hard credit pull and a formal appraisal, running your numbers here first — privately, with nothing sent off your device — is a way to gut-check whether it's even worth starting that process.",
      ],
      howItWorks: [
        "Available credit uses the same loan-to-value math a lender applies: your home's value times their maximum combined loan-to-value percentage, minus your existing mortgage balance. The payment shown is interest-only on the amount you've drawn, because that's how most HELOCs bill during the draw period — once that period ends, the loan converts to a repayment schedule that includes principal, and the payment rises accordingly.",
      ],
      faq: [
        {
          q: "What happens to my HELOC payment when the draw period ends?",
          a: "It typically jumps, sometimes substantially, because payments switch from interest-only to fully amortizing principal-and-interest over the remaining repayment period. Ask your lender for that specific repayment-period payment estimate before you rely on the interest-only number long-term.",
        },
        {
          q: "Is a HELOC rate always variable?",
          a: "Almost always, yes — HELOCs are typically tied to a benchmark rate like the prime rate, so your payment can rise or fall as that benchmark moves, unlike a fixed-rate home equity loan. Some lenders offer a fixed-rate conversion option on all or part of the balance.",
        },
        {
          q: "How much can I borrow with a HELOC?",
          a: "Your credit line is generally capped by your lender's maximum combined loan-to-value, typically 80-85% of your home's value minus your existing mortgage — the same ceiling this calculator applies. Your income and credit profile also factor into final approval.",
        },
        {
          q: "What's the difference between a HELOC and a home equity loan?",
          a: "A HELOC is a revolving line you draw from over time at a variable rate; a home equity loan disburses one fixed amount upfront at a fixed rate with a fixed payment. Use a HELOC when you're unsure of the total you'll need, and a home equity loan when you know the exact amount and want payment certainty.",
        },
        {
          q: "Can my HELOC credit line be reduced or frozen by the lender?",
          a: "Yes — lenders can reduce or freeze a HELOC if your home's value drops significantly or your financial situation changes, since it's a form of open-ended credit rather than a fixed disbursed loan. This is worth knowing before treating a HELOC as a guaranteed source of funds.",
        },
      ],
    },
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
    content: {
      intro: [
        "\"Rent minus mortgage\" is the math most first-time landlords do in their head, and it's missing most of what actually determines whether a rental is a good investment — vacancy, maintenance, and how much cash you actually put down versus how much the bank financed. This calculator produces the three numbers investors actually compare: monthly cash flow, cap rate, and cash-on-cash return, the last of which accounts for leverage in a way a simple rent-minus-payment estimate never does.",
        "It's for anyone sizing up a specific listing before making an offer — aspiring landlords running their first deal, or experienced investors comparing several properties against each other using the same consistent metrics.",
        "The address, the rent estimate, the numbers you're testing against a listing you haven't made an offer on — none of it needs to go through a listing site's own lead-capture calculator. Everything here stays in your browser.",
      ],
      howItWorks: [
        "Net operating income (NOI) is your effective rent — monthly rent reduced by an assumed vacancy rate — minus operating expenses like tax, insurance, and maintenance, but before the mortgage payment. Cap rate divides annualized NOI by the purchase price, giving a leverage-free measure of the property's return regardless of how it's financed. Cash-on-cash return instead divides your actual annual cash flow (NOI minus mortgage payment) by the cash you put in — your down payment — which is why it moves a lot more with your financing choices than cap rate does.",
      ],
      faq: [
        {
          q: "What's a good cap rate for a rental property?",
          a: "It varies by market — competitive metro areas often see cap rates in the 4-6% range, while higher-risk or slower-growth markets can offer 8-10%+. Compare a property's cap rate against similar properties in the same local market rather than a single national benchmark.",
        },
        {
          q: "What's the difference between cap rate and cash-on-cash return?",
          a: "Cap rate ignores financing entirely and measures the property's own return; cash-on-cash return factors in your mortgage and down payment, showing the return on the actual cash you invested. Two identical properties can have the same cap rate but very different cash-on-cash returns depending on how much leverage you use.",
        },
        {
          q: "Should I include my mortgage payment in the cap rate calculation?",
          a: "No — cap rate is deliberately calculated before financing costs, using net operating income only, so it can be compared fairly across properties regardless of how each buyer finances the purchase. Your mortgage payment factors into cash flow and cash-on-cash return instead.",
        },
        {
          q: "What counts as a monthly operating expense here?",
          a: "Property tax, insurance, routine maintenance, and typically an allowance for property management if you won't self-manage — recurring costs of owning and operating the property, separate from the mortgage payment itself.",
        },
        {
          q: "How much vacancy rate should I assume for a rental property?",
          a: "5% is a common baseline assumption, roughly equivalent to being vacant about two and a half weeks a year, but local rental demand, tenant turnover, and property condition can push this meaningfully higher or lower. Check local market vacancy data for your specific area if you have it.",
        },
      ],
    },
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
    content: {
      intro: [
        "The amount you're approved for on a personal loan and the amount that actually lands in your account are often two different numbers, because many lenders subtract an origination fee before disbursing the rest — a detail that's easy to miss when you're comparing a rate on a lender's landing page. This calculator shows all three figures at once: your monthly payment, what you'll actually receive after the fee, and the total cost of the loan over its full term.",
        "It's built for the moment you're comparing personal loan offers — often for debt consolidation, an unexpected expense, or a big purchase you'd rather not put on a credit card — and want to see past the advertised rate to what a specific offer really costs.",
        "You can run the exact numbers from an offer you got in your inbox or through a lender's site without creating an account or triggering a credit check — this calculator works entirely from what you type in, right in your browser.",
      ],
      faq: [
        {
          q: "Do personal loans have prepayment penalties?",
          a: "Most don't — the majority of personal loan lenders let you pay off the balance early with no penalty, but it's not universal, so check your specific loan agreement before assuming you can pay it off ahead of schedule without a fee.",
        },
        {
          q: "What's a good interest rate for a personal loan?",
          a: "It depends heavily on your credit score — borrowers with excellent credit often see rates in the high single digits, while fair or below-average credit can push rates into the 20-30%+ range. Compare any offer you get against your own credit tier rather than a flat market average.",
        },
        {
          q: "Does the origination fee come out of my loan balance or get charged separately?",
          a: "Typically it's subtracted from the loan before you receive it — you're still on the hook for repaying the full loan amount, including the fee, even though you never actually see that portion of the cash. This calculator's \"You Receive\" figure reflects that gap.",
        },
        {
          q: "Is a personal loan better than a credit card for consolidating debt?",
          a: "Usually, if your credit card APRs are high and variable — a personal loan gives you a fixed rate and a fixed payoff date, which most revolving credit cards don't. Compare the personal loan's total cost here against what continuing to carry the card balances would actually cost you in interest.",
        },
        {
          q: "Will checking my rate for a personal loan hurt my credit score?",
          a: "Many lenders offer a rate check using a soft credit pull that doesn't affect your score — it's only the formal application, after you accept an offer, that typically triggers a hard inquiry. Confirm which type of check a lender is doing before you submit anything.",
        },
      ],
    },
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
    content: {
      intro: [
        "Boat loans get compared to car loans more often than they should be — the terms stretch much longer (a 15 or 20-year term isn't unusual for a larger boat, versus 5-7 for a typical car loan), and that longer term changes the monthly payment math in ways a car-loan mental model won't predict correctly. This calculator runs the actual amortization for whatever price, down payment, rate, and term you're considering, so you're working from a real number instead of a guess based on auto financing.",
        "It's for anyone shopping a boat purchase — sizing up what a specific listing would actually cost per month before walking into a dealer's financing office or a marine lender's application.",
        "The price you're actually considering, and how much you're planning to put down, can stay off a dealer's lead form until you're ready — this calculator runs the numbers locally, in your browser.",
      ],
      faq: [
        {
          q: "How long can I finance a boat for?",
          a: "Terms commonly range from 5 years on smaller or used boats up to 15-20 years on larger new boats, considerably longer than typical auto loan terms. A longer term lowers your monthly payment but increases total interest paid over the life of the loan.",
        },
        {
          q: "Do boat loans have higher interest rates than car loans?",
          a: "Often yes, somewhat — boats are considered a higher-risk, more discretionary asset than cars by many lenders, and rates can run a point or two above comparable auto loan rates, though this varies by lender, credit profile, and whether it's a new or used boat.",
        },
        {
          q: "Is a down payment required for a boat loan?",
          a: "Most marine lenders expect some down payment, commonly in the 10-20% range, especially for larger loan amounts — a $0-down boat loan is far less common than a $0-down auto loan offer.",
        },
        {
          q: "Can I finance a used boat the same way as a new one?",
          a: "Yes, though used boat loans sometimes carry a slightly higher rate or shorter maximum term than new-boat financing, and the lender may require a marine survey (a boat's version of a home inspection) before approving the loan.",
        },
        {
          q: "Does a marine lender require insurance on a financed boat?",
          a: "Almost always — lenders typically require proof of boat insurance for the life of the loan, similar to how a mortgage lender requires homeowner's insurance, since the boat is the collateral securing the loan.",
        },
      ],
    },
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
    content: {
      intro: [
        "Car dealers quote lease terms in a \"money factor\" instead of an interest rate, and that's not an industry accident — a money factor like 0.00250 looks small and harmless, and most shoppers never convert it to the roughly 6% APR it actually represents. This calculator does that conversion for you and breaks the payment into its two real components: a depreciation charge for the value the car loses while you have it, and a finance charge for the privilege of leasing instead of buying outright.",
        "It's for anyone comparing a lease offer against buying, or comparing lease quotes from different dealers, who wants to see the real numbers behind the payment instead of just the bottom-line monthly figure a salesperson quotes.",
        "The negotiated price and terms you're testing don't need to go through a dealer's own payment estimator to get an honest answer — this runs entirely in your browser.",
      ],
      howItWorks: [
        "The depreciation fee is simply the value the car is expected to lose over the lease — asset value minus residual value — divided evenly across the lease term in months. The finance fee (sometimes called the \"rent charge\") is the money factor applied to the sum of the asset value and residual value; converting money factor to an approximate APR is done by multiplying it by 2400, which is the reverse of how this calculator derives the money factor from the rate you enter.",
      ],
      faq: [
        {
          q: "What is a money factor and how do I convert it to APR?",
          a: "A money factor is the lease-industry way of expressing the finance charge, usually shown as a small decimal like 0.00208. Multiply it by 2400 to get the approximate equivalent APR — a 0.00208 money factor is roughly a 5% APR.",
        },
        {
          q: "Why is a lease payment lower than a loan payment for the same car?",
          a: "Because a lease only charges you for the portion of the car's value you actually use — the depreciation between the negotiated price and the residual value — plus a finance charge, rather than financing the car's full price the way a purchase loan does.",
        },
        {
          q: "What is residual value and who decides it?",
          a: "Residual value is the car's predicted worth at the end of the lease, set by the leasing company (often the manufacturer's captive finance arm) using depreciation models for that specific make and model. A higher residual value generally means a lower monthly payment, since there's less value being depreciated over the lease.",
        },
        {
          q: "Can I negotiate the money factor or residual value on a lease?",
          a: "The money factor is often negotiable, especially with strong credit — ask for the \"buy rate\" money factor before any dealer markup is added. Residual value is typically set by the leasing company's formula and is much harder to negotiate directly.",
        },
        {
          q: "What happens if I go over the mileage limit on a lease?",
          a: "You'll typically owe a per-mile overage fee at lease-end, often 15-30 cents per mile depending on the leasing company — factor your realistic annual mileage into the lease terms upfront if you tend to drive more than average.",
        },
      ],
    },
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
    content: {
      intro: [
        "Business loan offers span a wide range of structures — bank term loans, online lender products, SBA-backed loans — and they vary enormously in origination fees, which many owners overlook while comparing rates alone. This calculator adds the origination fee into the total cost of the loan, so you're comparing what an offer actually costs your business, not just the headline interest rate.",
        "It's for small business owners evaluating financing for working capital, equipment, expansion, or a cash flow gap, especially when comparing multiple lender offers that structure their fees differently.",
        "Business financials aren't something most owners want sitting in a lender's marketing database before they've decided anything — this calculator keeps every number local to your browser, with nothing submitted anywhere.",
      ],
      faq: [
        {
          q: "What credit score do I need to qualify for a business loan?",
          a: "It depends on the lender type — traditional banks often want 680+ personal and business credit, while online lenders and some SBA-backed products work with scores in the low-to-mid 600s, usually at a higher rate to offset the risk.",
        },
        {
          q: "How is a business loan different from an SBA loan?",
          a: "An SBA loan is partially guaranteed by the U.S. Small Business Administration, which lets banks offer better rates and longer terms than they otherwise would for a similar-risk business — but SBA loans typically take longer to fund and require more documentation than a standard bank or online business loan.",
        },
        {
          q: "What's a typical interest rate on a small business loan?",
          a: "It varies widely by lender and your business's financial profile — bank and SBA loans often land in the high single digits to low teens, while online lenders and merchant cash advances can run substantially higher, sometimes into the 30-90%+ range when expressed as an APR.",
        },
        {
          q: "Do I need collateral to get a business loan?",
          a: "Many term loans and SBA loans require collateral or a personal guarantee, especially for larger amounts, though some online lenders offer unsecured loans (typically at higher rates) based mainly on revenue and cash flow.",
        },
        {
          q: "Can I deduct business loan interest on my taxes?",
          a: "Generally yes — interest paid on a loan used for legitimate business purposes is typically tax-deductible as a business expense, but confirm your specific situation with a tax professional, since how the loan proceeds are used matters.",
        },
      ],
    },
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
    content: {
      intro: [
        "A UK mortgage quote hides a second, often-overlooked cost — Stamp Duty Land Tax, charged in bands against the purchase price, which can add tens of thousands of pounds on top of your deposit and doesn't show up anywhere in a lender's headline repayment figure. This calculator works out both halves together: your monthly repayment on the mortgage itself, and an estimate of the SDLT due on completion, using the standard England/Northern Ireland residential bands.",
        "It's built for UK home buyers sizing up a purchase — working out what a specific property actually costs to buy and repay before making an offer or speaking to a mortgage broker.",
        "Deposit size, the property price you're actually considering — the kind of numbers people would rather test privately before a mortgage broker's affordability tool logs an enquiry. This calculator runs entirely in your browser.",
      ],
      howItWorks: [
        "SDLT is charged in bands, not as a flat percentage of the full price — the portion of the price in each band is taxed at that band's own rate, similar to how income tax bands work, which is why the effective rate on the whole purchase is always lower than the top band's rate. The mortgage repayment itself uses the standard amortization formula applied to the loan amount (purchase price minus deposit) over the chosen term.",
      ],
      faq: [
        {
          q: "Do first-time buyers pay less Stamp Duty in the UK?",
          a: "Yes — first-time buyer relief typically raises the nil-rate threshold, meaning first-time buyers pay no SDLT on a larger initial portion of the price than this calculator's standard bands assume. This calculator shows the standard residential bands; check current first-time buyer relief separately if it applies to you.",
        },
        {
          q: "Is Stamp Duty different in Scotland and Wales?",
          a: "Yes — Scotland charges Land and Buildings Transaction Tax (LBTT) and Wales charges Land Transaction Tax (LTT), both with their own separate bands and rates from the England/Northern Ireland SDLT bands shown here.",
        },
        {
          q: "What's the difference between a fixed-rate and tracker mortgage in the UK?",
          a: "A fixed-rate mortgage locks your interest rate for an agreed period, typically 2-5 years, so your payment doesn't change even if the Bank of England base rate moves. A tracker mortgage moves directly with that base rate plus a set margin, so your payment can rise or fall over the same period.",
        },
        {
          q: "How much deposit do I need for a UK mortgage?",
          a: "5% is the typical minimum for many mainstream lenders, though the best rates are usually reserved for deposits of 25% or more — a larger deposit lowers your loan-to-value ratio, which directly improves the rates you'll be offered.",
        },
        {
          q: "Does this include the additional-property Stamp Duty surcharge?",
          a: "No — this calculator applies standard residential bands only. Buy-to-let purchases and second homes typically carry an additional SDLT surcharge on top of the standard bands, which isn't reflected in this estimate.",
        },
      ],
    },
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
    content: {
      intro: [
        "Plug a Canadian mortgage rate into a US-style calculator and you'll get a payment that's subtly wrong, because Canadian law requires fixed mortgage rates to compound semi-annually, not monthly the way US mortgages conventionally do — the same quoted rate produces a slightly different effective monthly rate depending on which convention is used. This calculator applies the Canadian semi-annual compounding rule correctly, so the payment it shows matches what a Canadian lender would actually quote.",
        "It's built for homebuyers and homeowners in Canada working out a mortgage payment, or comparing a lender's quoted rate against their own estimate, where getting the compounding convention right actually changes the number.",
        "Your mortgage amount, the rate you're comparing, the amortization you're testing — none of it needs to go through a bank's own calculator or trigger a follow-up call from a mortgage specialist. This runs entirely on your device.",
      ],
      howItWorks: [
        "Canadian fixed mortgage rates are, by law, compounded semi-annually rather than monthly. This calculator first converts the nominal annual rate to an effective annual rate using semi-annual compounding, then converts that effective annual rate into the equivalent monthly rate used in the standard amortization formula — a small but legally mandated difference from how a US mortgage calculator would handle the same nominal rate.",
      ],
      faq: [
        {
          q: "Why is my Canadian mortgage rate compounded semi-annually instead of monthly?",
          a: "It's a legal requirement under Canadian law for fixed-rate mortgages, not a lender's choice — this produces a slightly lower effective rate than monthly compounding would at the same nominal rate, which is why using a US-style calculator on a Canadian mortgage gives a slightly inaccurate payment.",
        },
        {
          q: "What's the difference between amortization period and mortgage term in Canada?",
          a: "The amortization period (often 25 years) is the total time to pay off the loan; the term (often 5 years) is how long your current rate and conditions are locked in before you renew, typically with a new lender negotiation or rate. You can renew multiple times over one amortization period.",
        },
        {
          q: "Do I need mortgage default insurance (CMHC) in Canada?",
          a: "It's mandatory on most mortgages with a down payment under 20% of the home's purchase price, added as a premium that's typically rolled into the mortgage principal — similar in purpose to US PMI, but administered federally rather than through private insurers.",
        },
        {
          q: "Is a fixed or variable rate mortgage better in Canada?",
          a: "It depends on your risk tolerance and the rate environment — fixed rates offer payment certainty for the term, while variable rates can be cheaper over time historically but expose you to payment changes if the lender's prime rate moves. There's no universally correct choice; it comes down to your own comfort with payment uncertainty.",
        },
        {
          q: "How much does semi-annual compounding actually cost me compared to monthly?",
          a: "The difference is small per payment — typically a few dollars a month on an average mortgage — but it's a real, legally required difference, and this calculator's effective annual rate figure shows you the exact gap for your specific numbers.",
        },
      ],
    },
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
    content: {
      intro: [
        "Amortization schedules are built so that early payments go almost entirely to interest and barely touch the principal — which is exactly why even a modest extra payment applied in those early years has an outsized effect on how much interest you end up paying overall. This calculator runs your full amortization with and without an extra monthly payment, showing the actual years and dollars it saves rather than a rough rule of thumb.",
        "It's for homeowners deciding whether extra payments are worth prioritizing over other goals — paying down a mortgage faster versus investing that same money elsewhere, or simply wanting to see the real payoff-date impact of a specific extra amount before committing to it.",
        "Your loan balance, your rate, how much extra you're actually able to put toward it — these are numbers worth testing privately before deciding, and this calculator never sends them anywhere; everything runs in your browser.",
      ],
      howItWorks: [
        "Every extra dollar you pay goes straight to principal, which means every future month's interest is calculated on a smaller balance — the effect compounds over the life of the loan rather than staying flat. This calculator simulates the amortization month by month with your extra payment included, tracking the payoff date and total interest, and compares that against the standard schedule with no extra payment to isolate exactly what the extra payment is worth.",
      ],
      faq: [
        {
          q: "Does paying an extra $100-200 a month on my mortgage really make a big difference?",
          a: "Often yes, more than people expect — because that extra amount reduces principal directly and every future interest calculation is based on the lower balance, the compounding effect over 20-30 years can shave years off the loan and save tens of thousands in interest. Run your own numbers here to see the actual figure for your loan.",
        },
        {
          q: "Should I make one extra payment a year or split it across all 12 months?",
          a: "Mathematically, spreading extra payments across the year saves slightly more interest than one lump sum at year-end, since the balance is reduced sooner on average. In practice the difference is small — whichever is easier for you to actually stick with consistently matters more than the marginal timing gain.",
        },
        {
          q: "Is there a penalty for paying off my mortgage early?",
          a: "Most US mortgages originated in recent years don't have prepayment penalties, but it's not universal — check your loan documents or ask your servicer directly before assuming extra payments are penalty-free.",
        },
        {
          q: "Do I need to tell my lender to apply extra payments to principal?",
          a: "Usually yes — many servicers apply extra amounts to the next month's payment by default rather than directly to principal unless you specify otherwise, often through an online portal option or a note with your payment. Confirm with your servicer that extra payments are actually being applied the way you intend.",
        },
        {
          q: "How much faster will I pay off my mortgage with extra payments?",
          a: "It depends on your balance, rate, and how much extra you add — this calculator shows your exact standard payoff time against the accelerated one, side by side, using your real loan numbers instead of a generic estimate.",
        },
      ],
    },
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
    content: {
      intro: [
        "If you're already years into a mortgage, the question isn't what a new loan would look like — it's how much sooner you could be done with the one you have, and how much interest that actually saves, starting from exactly where your loan stands today. This calculator takes your current remaining balance and time left, rather than the original loan terms, and shows the payoff date and interest savings if you added a set amount to every payment from here forward.",
        "It's for homeowners partway through a mortgage who are weighing an extra payment against other uses for that money — deciding whether accelerating the mortgage is worth it, using their loan's actual current numbers instead of a generic 30-year example.",
        "Your current balance, how many months you have left, how much extra you're actually considering — none of it needs to be run through your servicer's site to get an answer. This stays private to your device.",
      ],
      faq: [
        {
          q: "How much faster can I pay off my mortgage by adding extra to each payment?",
          a: "It depends on your current balance, rate, and months remaining — this calculator runs your specific numbers rather than a generic estimate, since the impact of an extra payment differs a lot depending on how much interest-heavy time is left on your loan.",
        },
        {
          q: "Is it smarter to pay extra on my mortgage or invest that money instead?",
          a: "It depends on your mortgage rate compared to what you'd realistically earn investing — paying down a 7% mortgage is a guaranteed 7% return, while investment returns aren't guaranteed. There's no universal answer, but comparing your mortgage rate against a realistic expected investment return is the right framework.",
        },
        {
          q: "Do extra mortgage payments need to be marked 'apply to principal'?",
          a: "Often yes — many servicers default to applying extra amounts toward your next scheduled payment rather than directly reducing principal unless you specify otherwise. Check with your servicer, since this affects how much of the extra payment actually accelerates your payoff.",
        },
        {
          q: "What if I can only afford a small extra amount each month?",
          a: "Even a modest extra payment compounds meaningfully over years, since it reduces the balance that all future interest is calculated on. Try a few smaller amounts in this calculator to see the real tradeoff between what's affordable and how much time and interest it actually saves.",
        },
        {
          q: "Will paying off my mortgage early hurt my credit score?",
          a: "It can cause a small, typically temporary dip, since it closes a long-standing account and slightly changes your credit mix — but this effect is usually minor and short-lived compared to the interest savings from paying off the loan sooner.",
        },
      ],
    },
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
    content: {
      intro: [
        "The \"spend 30% of your income on rent\" guideline gets repeated so often it's treated as a rule, but it's really a rough housing-cost-burden threshold, originally tied to US federal housing assistance standards, applied here to your own income to give you a concrete target number rather than a vague percentage. This calculator converts that percentage into an actual dollar figure — and a couple of alternates — so you have a real number to compare listings against.",
        "It's for apartment hunters and anyone budgeting a move, especially useful before you start filtering listings by price so the range you're searching in is one that's actually sustainable against your income.",
        "How much you make and how much you're willing to spend on rent are numbers worth keeping private while you're still figuring out your budget — this calculator runs the math locally, without sending anything to a listing site or a lender.",
      ],
      faq: [
        {
          q: "Where does the 30% rent rule actually come from?",
          a: "It traces back to US federal housing policy, which uses 30% of income spent on housing as the standard threshold for being considered \"cost-burdened.\" It became a popular budgeting guideline over time, even though it wasn't originally designed as personal financial advice.",
        },
        {
          q: "Is the 30% rule based on gross income or take-home pay?",
          a: "It's conventionally applied to gross (pre-tax) income, which is also what this calculator uses — worth keeping in mind, since 30% of your gross income is a noticeably larger dollar amount than 30% of what actually lands in your bank account after taxes.",
        },
        {
          q: "What if I live in a city where 30% of my income isn't realistic for rent?",
          a: "In many high cost-of-living metro areas, spending 35-45%+ of income on rent is common in practice, even though it exceeds the traditional guideline. Use this calculator's target percentage field to model a more realistic ratio for your specific market rather than forcing the standard 30%.",
        },
        {
          q: "What counts as income for this calculation?",
          a: "Most landlords and this calculator assume gross monthly income from stable sources — salary, regular self-employment income, or other consistent earnings. Landlords often specifically want to see it verified through pay stubs or tax returns.",
        },
        {
          q: "Is it better to spend less than 30% on rent if I can afford more?",
          a: "Generally, yes, from a savings standpoint — the less of your income tied up in fixed housing costs, the more flexibility you have for savings, debt payoff, or unexpected expenses. The 30% figure is a common ceiling, not a target to spend up to.",
        },
      ],
    },
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
    content: {
      intro: [
        "Selling price minus purchase price feels like profit, but it isn't — renovation costs, months of holding costs while the property isn't earning anything, and selling costs (agent commissions, closing costs) all eat into that gap before anything counts as real profit. This calculator adds up the full cost side of a flip and nets it against realistic sale proceeds, so the ROI figure it shows reflects what you'd actually walk away with, not the naive sale-minus-purchase number.",
        "It's for real estate investors and house flippers evaluating a specific deal — sizing up a fixer-upper before making an offer, or double-checking the math on a deal already in progress against the renovation budget and timeline actually panning out.",
        "The purchase price you're considering, the renovation budget, the numbers on a deal you haven't committed to yet — none of it needs to leave your browser to get a real answer.",
      ],
      howItWorks: [
        "Total investment adds purchase price, renovation cost, and holding costs (property tax, insurance, and loan interest while you own it) into one figure. Net sale proceeds take your expected selling price and subtract selling costs — typically agent commissions and closing costs, often estimated around 6-8% combined. ROI is simply profit (net proceeds minus total investment) divided by total investment, expressed as a percentage.",
      ],
      faq: [
        {
          q: "What's a good ROI for a house flip?",
          a: "Many experienced flippers target 15-20%+ ROI on a deal to account for the risk and effort involved, though the right target depends on your market, financing costs, and how much of the work you're doing yourself versus hiring out.",
        },
        {
          q: "What counts as a holding cost on a flip?",
          a: "Property tax, insurance, utilities, and loan interest (if the purchase or renovation is financed) for every month you own the property before it sells — costs that accrue whether or not the renovation is finished, which is why a longer-than-planned timeline directly erodes profit.",
        },
        {
          q: "Why are selling costs so high on a flip?",
          a: "Real estate agent commissions alone typically run 5-6% of the sale price, split between buyer's and seller's agents, and closing costs add more on top — combined, 7-10% of the sale price going to selling costs is a realistic assumption, not a worst case.",
        },
        {
          q: "Should I include financing costs like loan interest in this calculation?",
          a: "Yes, if you're financing the purchase or renovation — loan interest paid during the holding period is a real cost of the deal and belongs in your holding costs figure, since it directly reduces your actual profit.",
        },
        {
          q: "How do I get an accurate renovation cost estimate before buying?",
          a: "A contractor walkthrough before you close, or before your inspection contingency expires, is the most reliable way — rough per-square-foot estimates from online guides are useful for an initial screen but can be significantly off for a property with hidden issues.",
        },
      ],
    },
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
    content: {
      intro: [
        "Debt-to-income ratio is one number, but it's the number that decides whether a mortgage lender says yes or no before they even look at your credit score in detail — it measures how much of your gross income is already committed to debt payments, leaving lenders a picture of how much room you actually have for a new payment. This calculator computes your DTI and tells you where it falls against the thresholds lenders actually use.",
        "It's for anyone preparing to apply for a mortgage, auto loan, or any other major financing — a way to see your DTI the way an underwriter will, before it shows up as a surprise on a loan application.",
        "Your income and debt numbers are personal enough that most people would rather check this privately before a lender's pre-qualification form asks for them — this calculator runs entirely in your browser.",
      ],
      faq: [
        {
          q: "What's the difference between front-end and back-end DTI?",
          a: "Front-end DTI only counts housing costs (the mortgage payment itself) against income; back-end DTI, which this calculator computes, counts all monthly debt payments — housing, car loans, student loans, credit cards, and more. Mortgage lenders typically look at both, but back-end DTI is usually the harder threshold to clear.",
        },
        {
          q: "What DTI do I need to qualify for a mortgage?",
          a: "Most conventional lenders prefer back-end DTI at or below 36%, though many will approve up to 43-45% with strong credit and compensating factors, and some government-backed loan programs allow more. There's no single universal cutoff — it varies by lender and loan type.",
        },
        {
          q: "Does DTI include the new mortgage payment I'm applying for?",
          a: "When a lender calculates your DTI for a mortgage application, yes — they add the proposed new mortgage payment into your total monthly debts. This calculator lets you do the same by entering your current debts plus an estimated new payment to see where you'd land.",
        },
        {
          q: "Can I lower my DTI quickly before applying for a loan?",
          a: "Paying down or paying off a revolving debt like a credit card balance is usually the fastest lever, since it removes that minimum payment from your total immediately. Increasing income moves the ratio too, but obviously on a much longer timeline than debt payoff.",
        },
        {
          q: "Does my DTI ratio affect my credit score?",
          a: "No — DTI isn't a factor in your credit score itself, which is based on your credit report data like payment history and credit utilization. DTI is a separate metric lenders calculate manually from your income and debts specifically to judge how much new debt you can reasonably take on.",
        },
      ],
    },
  },
];

export default financialLoans;
