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
    content: {
      intro: [
        "A mortgage payment is almost never just the loan itself. Lenders quote you an interest rate, but the number that actually leaves your bank account every month is principal and interest plus a slice of your property tax bill, your homeowner's insurance, and — if you're buying a condo or in a planned community — an HOA fee on top. This calculator adds up all four so the number you see here is the number you'd actually budget for, not just the loan math.",
        "It's built for the two moments people actually use a mortgage calculator: sizing up how much house a given monthly budget can support before you go house-hunting, and sanity-checking a real quote a lender just sent you against your own numbers.",
        "Every field stays on your device. Your home price, your income situation, the address you're eyeing — none of it is sent anywhere or logged, so you can run the real numbers for a house you haven't told anyone you're looking at yet.",
      ],
      howItWorks: [
        "Principal and interest use the standard amortization formula: M = P × [r(1+r)ⁿ] / [(1+r)ⁿ − 1], where P is the loan amount (home price minus down payment), r is your annual rate divided by 12, and n is the total number of monthly payments over the loan term.",
        "Property tax and homeowner's insurance are usually billed annually or semi-annually, but most lenders collect a monthly slice of both into an escrow account so there's no surprise bill — this calculator divides your annual figures by 12 and adds them to principal and interest to match what actually shows up on a real mortgage statement.",
      ],
      faq: [
        {
          q: "How much of my mortgage payment is actually interest?",
          a: "Early in the loan, most of it. On a 30-year loan the first payments are overwhelmingly interest, and the split only tips toward principal as the balance shrinks — the breakdown chart above the results shows exactly what split applies to your numbers.",
        },
        {
          q: "Does this include PMI (private mortgage insurance)?",
          a: "Not automatically. PMI typically applies when your down payment is under 20% of the home price; if it applies to you, add your monthly PMI estimate to the HOA fee field so it's included in the total — it uses the same flat monthly-add math.",
        },
        {
          q: "Why is my total monthly payment higher than the loan calculator down the hall says?",
          a: "A plain loan calculator usually shows principal and interest only. This one adds property tax, insurance, and HOA on top, because that's what actually gets withdrawn from your account each month on a real mortgage.",
        },
        {
          q: "What's a realistic property tax number to use if I don't know the exact one?",
          a: "Property tax rates vary enormously by county — anywhere from well under 1% to over 2% of a home's value per year is normal in the US. If you don't have a real number yet, search the county assessor's site for the specific address; it's public record and far more accurate than a national average.",
        },
        {
          q: "Should I put more down to lower this payment, or invest the difference?",
          a: "That depends on your mortgage rate versus what you'd realistically earn investing the cash instead — there's no universal answer. What this calculator can do is show you the exact payment difference at a few down-payment amounts so you're comparing real numbers instead of a rule of thumb.",
        },
      ],
    },
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
    content: {
      intro: [
        "A loan calculator answers a narrower question than it looks like: not \"what's my payment,\" but \"what does this specific rate and term actually cost me before I sign anything.\" It runs the same fixed-rate amortization math used for mortgages and car loans, but stripped down — no taxes, no insurance, no trade-in — so it works for personal loans, student loans, business loans, or any installment debt where the whole payment is just principal and interest.",
        "People reach for it in two moments: before applying, to compare what a $20,000 personal loan at 8% actually costs against paying from savings or using a 0% intro-APR credit card offer; and after getting a quote, to check whether the payment a lender advertised actually matches the rate and term they quoted — a useful catch, since origination fees and rounding sometimes make a real payment differ slightly from the advertised numbers.",
        "The loan amount, the rate, and why you're borrowing are your business, not this site's — nothing you enter here is sent anywhere or stored, so you can shop and compare offers without leaving a trail of exactly how much you're trying to borrow.",
      ],
      howItWorks: [
        "Every fixed-rate installment loan amortizes the same way: each payment is split between interest (the current balance times the periodic rate) and principal (whatever's left of the payment). Early payments skew heavily toward interest because the balance is still large; later payments skew toward principal as the balance shrinks — the total payment itself stays flat the whole time.",
      ],
      faq: [
        {
          q: "What's the difference between this and a mortgage calculator?",
          a: "The math is identical — the same amortization formula — but a mortgage calculator also folds in property tax, homeowner's insurance and HOA fees, since those show up on a real mortgage bill. This one is for loans where the payment really is just principal and interest.",
        },
        {
          q: "Does this include origination fees or other lender charges?",
          a: "No — it calculates payment and interest from the rate and term alone. If your lender charges an origination fee, that's typically deducted from what you receive or rolled into the balance, so ask for the loan's APR (which includes fees) rather than just the interest rate for an apples-to-apples comparison.",
        },
        {
          q: "Why is my actual payment slightly different from what this shows?",
          a: "Small differences usually come from rounding conventions, a slightly different day-count method, or fees baked into the lender's payment. Large differences usually mean the rate or term you entered doesn't match what you were actually approved for — double check the loan documents.",
        },
        {
          q: "What loan term minimizes the total interest I pay?",
          a: "The shortest term you can comfortably afford. A shorter term means a higher monthly payment but far less total interest, since you're carrying the balance for less time — try the same loan amount at a few different terms here to see exactly how much that trade-off is worth in dollars.",
        },
        {
          q: "Should I pay off a loan early if I can?",
          a: "Paying extra toward principal reduces the interest you'll pay over the life of the loan, but check your loan agreement first — some personal and business loans carry a prepayment penalty that can offset the savings.",
        },
      ],
    },
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
    content: {
      intro: [
        "Car financing has more moving parts than a straight loan. The number on the sticker isn't what you actually finance — sales tax gets added, then a down payment and any trade-in value get subtracted, and the loan is written against whatever's left. This calculator runs that whole chain instead of just amortizing a flat number, so you can see exactly how a $6,000 trade-in or a 7% state sales tax rate moves your monthly payment, not just the final total.",
        "It's built for the point right before you sign: checking the finance office's numbers against your own, or deciding whether a bigger down payment or a shorter term is worth negotiating for before you're sitting across the desk from a salesperson.",
        "The vehicle price, your trade-in value, and how much you're putting down never leave your device — you can run real numbers on a car you're about to negotiate for without any of it being logged anywhere.",
      ],
      howItWorks: [
        "Most states charge sales tax on the vehicle price and roll that tax into the amount you finance rather than requiring it upfront in cash — so the loan principal here is price plus tax, minus your down payment and trade-in value, not just price minus down payment. That's a meaningfully bigger number to finance than people often expect when they first sit down to negotiate.",
      ],
      faq: [
        {
          q: "Does sales tax get added before or after my trade-in is subtracted?",
          a: "Tax is calculated on the vehicle price first, then your down payment and trade-in are subtracted from price-plus-tax to get the amount financed. Some states actually reduce the taxable amount by your trade-in value — check your state's rule, since that can meaningfully change the tax owed.",
        },
        {
          q: "Should I put my trade-in toward the down payment or take a longer term instead?",
          a: "Applying trade-in value reduces the amount financed either way — the real choice is term length. A shorter term with the same trade-in applied saves substantially more in interest than stretching the same reduced balance over more months.",
        },
        {
          q: "Why is my dealer's payment quote different from this calculator's number?",
          a: "Dealer financing often bundles in fees (documentation, dealer prep) or a marked-up interest rate versus what you'd get pre-approved for elsewhere. If the gap is more than a few dollars, ask for an itemized breakdown of what's in their number.",
        },
        {
          q: "Is it better to get pre-approved by a bank or finance through the dealer?",
          a: "Getting pre-approved first gives you a real rate to compare against and negotiating leverage — dealers can sometimes beat it, but you won't know unless you have your own number to hold them to.",
        },
        {
          q: "How much does a shorter loan term actually save on interest?",
          a: "Often more than people expect, since auto loan APRs on longer terms (72-84 months) also tend to run higher than shorter ones. Try the same vehicle price and rate at 48 vs 72 months here to see the real interest difference, not just the payment difference.",
        },
      ],
    },
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
    content: {
      intro: [
        "Compounding is the whole reason this calculator exists as something separate from a simple multiplication: interest earned in year one starts earning its own interest in year two, so an account's real growth curve bends upward instead of climbing in a straight line. A back-of-envelope estimate (just rate times years times principal) badly understates long horizons — $10,000 at 7% for 20 years isn't $24,000, it's closer to $38,700, and the gap is entirely compounding.",
        "It's used by long-term savers and investors projecting where a lump sum plus recurring monthly contributions will land years or decades out, by people comparing how much compounding frequency (daily vs. monthly vs. annual) actually matters, and by anyone who's heard the phrase \"compound interest is the eighth wonder of the world\" and wants to see their own numbers instead of someone else's example.",
        "Your balance, your contribution amount, your timeline to a goal — none of it is sent anywhere or stored. The math runs entirely in your browser, so you can project real numbers for a real financial decision without creating a record of what you're planning.",
      ],
      howItWorks: [
        "The principal grows on its own compounding schedule — A = P(1 + r/n)ⁿᵗ, where n is how many times per year interest compounds. Going from annual to monthly compounding makes a real difference on paper; going from monthly to daily makes almost none, since the extra compounding periods are tiny fractions of the rate applied very slightly more often.",
        "Monthly contributions are treated separately as an ordinary annuity, compounding monthly regardless of the compounding frequency you picked for the lump sum, since recurring deposits are inherently a monthly event. The two growth streams (initial principal and ongoing contributions) are calculated independently, then added together for the total.",
      ],
      faq: [
        {
          q: "What's the actual difference between compound interest and simple interest?",
          a: "Simple interest is calculated only on the original principal every period, so it grows in a straight line. Compound interest is calculated on the principal plus all interest already earned, so it grows on an upward curve — the longer the time horizon, the bigger that gap gets.",
        },
        {
          q: "Does compounding monthly vs. daily actually matter?",
          a: "Barely, in practice. The jump from annual to monthly compounding is the one that meaningfully changes your total; going from monthly to daily typically changes the result by well under 1% over most realistic time horizons.",
        },
        {
          q: "How much difference do small monthly contributions really make?",
          a: "More than intuition suggests, because every contribution gets its own compounding runway — a dollar contributed in year one compounds for the full period, while a dollar contributed in year nineteen barely compounds at all. Run the numbers with and without the monthly contribution field to see the gap for your own timeline.",
        },
        {
          q: "What interest rate should I use to estimate stock market growth?",
          a: "There's no single right answer, but a common long-run reference point for a diversified US stock portfolio before inflation is around 7-10% annually — and that figure includes years of sharp losses smoothed out over decades, not a steady year-by-year return.",
        },
        {
          q: "Why doesn't my result match the \"Rule of 72\" estimate?",
          a: "The Rule of 72 (divide 72 by your rate to estimate years to double) is a quick mental shortcut, not an exact formula — it's most accurate for annual compounding around 6-10% and drifts further off at very high or low rates, or with contributions added along the way.",
        },
      ],
    },
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
    content: {
      intro: [
        "Simple interest is deliberately the boring version of interest math: I = P × r × t, with no compounding at all, so the interest owed or earned only ever depends on the original principal, never on interest that's already accrued. Most everyday borrowing and saving — credit cards, typical savings accounts, most mortgages — actually compounds, but simple interest still shows up in specific places: some short-term consumer and auto loans are structured this way, as are many promissory notes and bonds that pay a fixed coupon.",
        "It's used most by people checking a specific claim: a loan document that says \"simple interest,\" a finance class problem set, or a private loan between individuals where the terms were agreed as a flat rate times time rather than anything compounding.",
        "The principal, rate and time period you enter stay in your browser — useful if you're checking the math on a private loan or note you'd rather not run through someone else's spreadsheet.",
      ],
      faq: [
        {
          q: "What's the real difference between simple and compound interest?",
          a: "Simple interest applies the rate to the original principal every period, so it grows in a straight line. Compound interest applies the rate to principal plus all interest already earned, so it grows faster the longer it runs — over short periods the two are close, but they diverge a lot over years.",
        },
        {
          q: "Do banks actually use simple interest on savings accounts?",
          a: "Almost never for consumer savings accounts — those compound, usually daily or monthly, even if the advertised rate is quoted annually. Simple interest is more common in structured loan products, bonds, and short-term notes than in everyday deposit accounts.",
        },
        {
          q: "Is a \"simple interest\" car loan the same thing as this calculation?",
          a: "Conceptually related but not identical — a simple interest auto loan usually still charges interest on a monthly amortizing basis where extra or early payments reduce future interest, rather than a single flat I = P×r×t figure calculated once for the whole term.",
        },
        {
          q: "How do I calculate simple interest for less than a full year?",
          a: "Convert your time period to years first — enter 0.5 for six months, or 0.25 for a quarter — and the same I = P × r × t formula applies, since t doesn't have to be a whole number.",
        },
        {
          q: "Why does simple interest total less than compound interest over the same period?",
          a: "Because compound interest earns returns on its own previously earned interest and simple interest never does — the two produce identical results only for a single compounding period, and compound interest pulls ahead every period after that.",
        },
      ],
    },
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
    content: {
      intro: [
        "This is the goal-planning version of interest math: given a starting balance, a regular monthly deposit, and an interest rate, what will actually be sitting in the account by a target date. Because interest compounds on the initial deposit and on every contribution you make along the way, a modest recurring deposit ends up mattering more than most people expect over a long enough stretch — the gap between \"money I personally put in\" and \"money that's actually there\" is the entire point of running the calculation instead of just adding up your deposits.",
        "It's built for goal-driven saving: an emergency fund target, a house down payment by a certain year, a wedding or a big trip, or simply checking whether a bank's advertised rate on a high-yield savings account actually gets you to a number you care about by the date you need it.",
        "Your target amount, your current balance, and how much you're setting aside each month are exactly the kind of numbers people don't want floating around — none of it leaves your device or gets logged anywhere.",
      ],
      howItWorks: [
        "Banks usually advertise a savings account's rate as APY (annual percentage yield), which already bakes in the effect of compounding — that's the number to enter here as the annual interest rate, since it reflects what you'll actually earn rather than a simpler quoted rate that ignores compounding frequency.",
      ],
      faq: [
        {
          q: "How much should I have in savings before I start investing?",
          a: "A common rule of thumb is 3-6 months of essential expenses in an accessible savings account before directing extra money toward investments, since savings needs to be there when you need it, not subject to market swings.",
        },
        {
          q: "What interest rate should I enter for a high-yield savings account?",
          a: "Use the account's advertised APY, not a rougher \"interest rate\" figure — APY already accounts for compounding frequency, so it's the number that matches how the balance will actually grow.",
        },
        {
          q: "Does this account for FDIC insurance limits?",
          a: "No — this is pure growth math. FDIC insurance covers up to $250,000 per depositor, per bank, per ownership category; if your projected balance is approaching that at a single bank, it's worth knowing that limit exists, though it doesn't change how much your money grows.",
        },
        {
          q: "How long will it actually take to reach my savings goal?",
          a: "Enter your goal as the target and adjust the time field up or down until the future balance matches it — that tells you directly how many years of the deposit amount you entered it takes to get there.",
        },
        {
          q: "Is APY the same thing as the interest rate I should enter here?",
          a: "For this calculator, yes — enter the APY. It's the figure that already reflects compounding, which is exactly what this tool is modeling.",
        },
      ],
    },
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
    content: {
      intro: [
        "The salary in a job offer and the amount that actually lands in your checking account are two different numbers, and the gap between them is bigger than most people expect. Before you see a dollar, pre-tax deductions like 401(k) contributions and health insurance premiums come out, then federal and state income tax withholding and FICA (Social Security and Medicare) take another cut, and finally any post-tax deductions are subtracted. This calculator walks a gross salary through all of that to land on what actually hits your account per paycheck.",
        "It gets used most when comparing job offers with different salaries and pay frequencies, when trying to figure out what a raise actually adds to a paycheck after taxes eat into it, or when building a budget and needing a real net number instead of the gross figure quoted in an offer letter.",
        "Your salary is one of the more sensitive numbers you'll type into a website — this one never leaves your browser, so you can compare two competing offers side by side without either employer, or anyone else, ever knowing the numbers involved.",
      ],
      howItWorks: [
        "Rather than replicating the full federal and state tax bracket system — which changes by year, filing status, state, and deduction choices — this calculator asks for a single effective tax rate covering your combined federal, state, and FICA burden. The most reliable source for that number is a recent pay stub: divide the total taxes withheld by your gross pay for that period to get your real effective rate.",
        "Pre-tax deductions (401(k), traditional IRA contributions, health/dental/vision premiums taken pre-tax, HSA contributions) reduce your taxable income before the tax rate is applied, which is why they save more than post-tax deductions of the same dollar amount — post-tax deductions come out only after tax has already been calculated.",
      ],
      faq: [
        {
          q: "What counts as a pre-tax deduction?",
          a: "Common ones are traditional 401(k) or 403(b) contributions, health/dental/vision insurance premiums when your employer runs them pre-tax, HSA and FSA contributions, and traditional (not Roth) retirement account deductions taken through payroll.",
        },
        {
          q: "How do I find my actual effective tax rate?",
          a: "Look at a recent pay stub and divide total taxes withheld (federal, state, Social Security, Medicare combined) by your gross pay for that period — that ratio is your real effective rate, more accurate than guessing from a tax bracket table.",
        },
        {
          q: "Why doesn't this match my actual paycheck exactly?",
          a: "This uses one flat effective rate rather than the IRS's tiered bracket system, filing-status rules, and any tax credits you might qualify for, so it's an estimate rather than a payroll-exact figure — useful for comparison, less precise than an actual pay stub.",
        },
        {
          q: "Does the effective tax rate already include Social Security and Medicare?",
          a: "It should — enter your combined federal income tax, state income tax (if any), and FICA (Social Security + Medicare, currently 7.65% combined for most employees) as one blended percentage for the most accurate result.",
        },
        {
          q: "Does pay frequency change how much tax I owe?",
          a: "No — your total annual tax bill is the same whether you're paid weekly, biweekly, semimonthly or monthly. Pay frequency only changes how that same annual amount is divided into individual paychecks.",
        },
      ],
    },
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
    content: {
      intro: [
        "Sales tax is one of the most inconsistent numbers in everyday US shopping — unlike VAT in most other countries, it's set at the state level and often layered with county and city rates on top, so the same $100 purchase can owe anywhere from nothing to well over $10 depending on where you're standing. This calculator handles both directions of that math: adding tax to a price you're about to pay, or working backward from a total on a receipt to figure out what the item actually cost before tax.",
        "It gets used at two different moments: before checkout, to estimate what a cart will actually cost once tax is added, and after the fact, to back out the pre-tax price from a receipt — useful for expense reports, splitting a purchase with someone, or just double-checking a total looks right.",
        "Neither what you're buying nor how much you're spending is sent anywhere — the tax math runs entirely in your browser, so you can check a receipt or estimate a big purchase without it touching a server.",
      ],
      howItWorks: [
        "Adding tax is straightforward multiplication: tax = price × rate. Working backward from a tax-included total is where people trip up — you can't just subtract the tax rate from the total, because the rate applies to the pre-tax price, not the total. The correct approach divides the total by (1 + rate) to recover the pre-tax price, then the tax is whatever's left over.",
      ],
      faq: [
        {
          q: "Why can't I just subtract the tax rate from a receipt total to get the pre-tax price?",
          a: "Because the tax rate was applied to the smaller, pre-tax number, not the total — subtracting the percentage from the total overstates the tax. Dividing the total by (1 + rate) is the correct way to recover the original price.",
        },
        {
          q: "Do all US states charge sales tax?",
          a: "No — five states (Alaska, Delaware, Montana, New Hampshire, and Oregon) have no statewide sales tax, though Alaska allows local municipalities to charge their own. Every other state sets a base rate, and most also allow counties and cities to add more on top.",
        },
        {
          q: "Is the sales tax rate the same on everything I buy in a state?",
          a: "Often not — many states exempt or reduce the rate on groceries, prescription medication, or clothing, and some apply different rates to restaurant meals versus retail goods. The rate you enter here should match the specific category of what you're buying.",
        },
        {
          q: "How do I find the exact combined sales tax rate for my area?",
          a: "Search your state's department of revenue site for local rate lookups by address or zip code — combined state, county, and city rates can vary by more than a percentage point between neighboring towns.",
        },
        {
          q: "What's the difference between sales tax and VAT?",
          a: "US sales tax is charged once, at the final point of sale to the consumer, and is usually shown separately from the sticker price. VAT is collected at each stage of production but ultimately paid by the consumer too — and in most VAT countries, the price you see already includes it.",
        },
      ],
    },
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
    content: {
      intro: [
        "VAT (value-added tax) works differently from US sales tax in a way that trips people up constantly: it's collected at every stage of production, not just the final sale, and — critically — the price you see on a shelf in most VAT countries already includes it. That means the everyday question isn't usually \"how much tax gets added\" but \"how much of what I'm already paying is VAT,\" which is the reverse of how most Americans are used to thinking about sales tax.",
        "It's used by online shoppers and freelancers invoicing clients in VAT countries who need to add VAT to a net price, by businesses reconciling receipts where VAT needs to be extracted for accounting or reclaim purposes, and by travelers trying to work out how much of a purchase is VAT they might be able to claim back at the airport.",
        "The prices and invoice amounts you run through this are yours to work with privately — nothing about what you're buying, selling, or invoicing is transmitted anywhere, the calculation happens entirely on your device.",
      ],
      howItWorks: [
        "Adding VAT to a net (pre-tax) price is simple multiplication: gross = net × (1 + rate). Extracting VAT from a gross price that already includes it is different — dividing by (1 + rate) recovers the net price, and the VAT amount is the difference between the two. This second calculation is the one people get wrong most often, since a gross price of $120 at 20% VAT does not mean $24 of VAT; it means the net price was $100 and $20 of VAT was added.",
      ],
      faq: [
        {
          q: "What's the actual difference between VAT and US sales tax?",
          a: "VAT is collected incrementally at each stage of a product's supply chain and is typically already included in the displayed price. US sales tax is collected once, at the final sale to the consumer, and is usually added on top of the sticker price at checkout rather than baked into it.",
        },
        {
          q: "Can tourists get a VAT refund?",
          a: "In many countries, yes — non-residents can often reclaim VAT on goods they're taking home, usually by keeping receipts and filing paperwork at the airport before departure, though minimum purchase amounts and eligible categories vary a lot by country.",
        },
        {
          q: "Why do VAT rates differ across products and countries?",
          a: "Most countries with VAT set a standard rate for most goods and services but apply reduced rates (or zero-rate) to categories like food, books, or children's clothing, and every country sets its own standard rate — it's not a single global figure.",
        },
        {
          q: "How do I calculate the price before VAT was added?",
          a: "Divide the VAT-inclusive price by 1 plus the VAT rate as a decimal — for a $120 price at 20% VAT, that's $120 ÷ 1.20 = $100 net price, with $20 being the VAT portion.",
        },
        {
          q: "Do businesses pay VAT, or does it only fall on the final customer?",
          a: "Businesses collect and remit VAT at each stage but typically reclaim the VAT they paid on their own purchases, so the actual cost lands on the final consumer, who can't reclaim it — that's what makes it a consumption tax in practice, despite passing through business hands along the way.",
        },
      ],
    },
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
    content: {
      intro: [
        "A percentage-off discount is simple in isolation, but two things trip people up in practice: stacked discounts don't add together the way they look like they should, and \"25% off\" reads very differently once you see the actual dollar amount saved versus what you're still paying. This calculator turns a percentage discount into the real numbers — what you save, what you pay, and what the final price is once sales tax is added back on top of the discounted price.",
        "It's used mid-shop, comparing a flat percentage discount against a competing offer, checking a cashier's math on a marked-down item, or figuring out whether a \"30% off\" sale is actually a better deal than a smaller discount on an already-cheaper item elsewhere.",
        "What you're buying and what you're paying for it stay on your device — the discount math runs entirely in your browser, with nothing about your shopping sent anywhere or logged.",
      ],
      howItWorks: [
        "One thing worth knowing before combining coupons: stacked percentage discounts don't add together. Two discounts of 25% and 10% don't total 35% off — the second discount applies to the already-discounted price, so the combined savings is actually 32.5% off the original. Each discount multiplies the remaining price rather than subtracting from the original percentage.",
      ],
      faq: [
        {
          q: "If I have two discounts, do they just add together?",
          a: "No — each discount applies to the price after the previous one, not to the original price, so two 25% and 10% discounts combine to about 32.5% off total, not 35%. Apply them one at a time to see the real final price.",
        },
        {
          q: "Is a percentage-off discount or a flat dollar-off discount usually the better deal?",
          a: "It depends entirely on the original price — a percentage discount saves more on expensive items, while a flat dollar amount saves more on cheap ones. Compare the actual dollar savings, not just which number looks bigger.",
        },
        {
          q: "How do I figure out the original price if I only know the sale price and discount percentage?",
          a: "Divide the sale price by (1 minus the discount as a decimal) — a $60 sale price after a 25% discount means the original price was $60 ÷ 0.75 = $80.",
        },
        {
          q: "Does sales tax get calculated on the original price or the discounted price?",
          a: "Almost always on the discounted price — tax is charged on what you actually pay, not the pre-discount sticker price, which is why this calculator applies tax after the discount is subtracted.",
        },
        {
          q: "What counts as a genuinely good discount versus a marketing gimmick?",
          a: "There's no universal threshold, but a discount off an artificially inflated \"original\" price isn't a real deal — compare the sale price to what the item has actually sold for recently elsewhere, not just the percentage claimed on the tag.",
        },
      ],
    },
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
    content: {
      intro: [
        "Tipping math sounds trivial until you're doing it at a table with four other people, a bill that doesn't split evenly, and a phone calculator that can't remember what percentage you settled on. This calculator handles both halves of the problem at once: the tip amount and total for the whole bill, and — if you're splitting — exactly what each person owes, tip included.",
        "It gets used at the actual moment of paying a check: settling up a group dinner, figuring out what a fair tip looks like for a delivery order, or just double-checking that 18% or 20% mental math before handing over a card.",
        "The bill amount and who you're eating with are nobody's business but yours — the split and tip math happens entirely on your device, nothing about your dinner is sent anywhere.",
      ],
      faq: [
        {
          q: "What's a standard tip percentage in the US?",
          a: "For sit-down restaurant service, 15-20% is the typical range, with 18-20% common for good service. Delivery, bartenders, and other service situations often have their own separate norms.",
        },
        {
          q: "Should I tip on the pre-tax or post-tax bill amount?",
          a: "Etiquette guides generally recommend tipping on the pre-tax subtotal, since sales tax isn't money the restaurant or server actually earned — though tipping on the post-tax total is common in practice and won't raise eyebrows.",
        },
        {
          q: "How do I split a bill fairly when people ordered very different amounts?",
          a: "An even split (what this calculator does) is simplest but not always fair if orders varied a lot — for an itemized split, add up each person's actual items first, then apply the tip percentage to each person's individual subtotal.",
        },
        {
          q: "Is tipping expected outside the United States?",
          a: "It varies enormously by country — some places include service in the bill by law or custom and tipping extra is unusual or even considered odd, while others follow US-style norms. It's worth checking local custom before assuming 18-20% applies everywhere.",
        },
        {
          q: "Should I tip on takeout or counter-service orders?",
          a: "There's no universal rule — many people tip a smaller percentage (or a flat few dollars) for takeout than for full table service, reflecting the lighter service involved, but it's a personal and increasingly debated choice rather than a fixed standard.",
        },
      ],
    },
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
    content: {
      intro: [
        "Credit card debt is revolving, high-interest, and structured in a way that makes the minimum payment almost useless as a payoff strategy — card APRs regularly run 20% or higher, and the minimum is often calculated as a small percentage of the balance, so it barely outpaces the interest accruing that same month. This calculator shows what actually happens at a fixed monthly payment you choose, not the minimum the statement suggests: how many months to zero, and the real total interest cost.",
        "It's used by anyone staring at a card balance trying to decide what to actually pay each month — comparing what happens at $150 versus $300 a month, or checking how much a promotional 0% balance transfer period would actually save before the rate reverts.",
        "Your balance and how much debt you're carrying are not information you want floating around — this runs entirely in your browser, so you can plan a real payoff strategy without your card balance touching a server anywhere.",
      ],
      howItWorks: [
        "Unlike a fixed-term loan, a credit card balance doesn't amortize on a schedule — the payoff time depends entirely on the payment you choose. Each month, interest is charged on the current balance at APR ÷ 12, that interest is added, then your payment is subtracted; the calculation repeats month by month until the balance hits zero, which is why the total time isn't a clean formula but an iterative countdown.",
        "This is also why minimum payments trap people: card issuers often set the minimum as roughly 1-3% of the balance, and on a high-APR card that can be barely more than the interest accruing that month — the balance limps downward for years instead of shrinking meaningfully.",
      ],
      faq: [
        {
          q: "Why does my credit card minimum payment barely reduce the balance?",
          a: "Minimum payments are usually set as a small percentage of the balance, and at a typical 20%+ APR, a large share of that minimum goes straight to interest — leaving only a small sliver actually reducing what you owe.",
        },
        {
          q: "What happens if I only ever pay the minimum?",
          a: "The payoff stretches out for years, sometimes decades, and the total interest paid can end up exceeding the original balance — because the minimum shrinks along with the balance, so the payoff pace keeps slowing down rather than staying constant.",
        },
        {
          q: "How much faster is a fixed payment above the minimum?",
          a: "Often dramatically faster — try entering the same balance and APR at your current minimum versus a higher fixed amount here to see the real difference in months and total interest; even $50-100 more a month typically cuts years off a high-APR balance.",
        },
        {
          q: "Does paying more than the minimum lower my interest rate?",
          a: "No — your APR is set by the card issuer and doesn't change based on how much you pay, unless you specifically negotiate it or move the balance to a lower-rate card. Paying more just reduces the balance interest accrues on, faster.",
        },
        {
          q: "Is it worth doing a balance transfer to a 0% APR card?",
          a: "Often yes if you can pay off most or all of the balance during the promotional period, since 0% interest means every dollar of your payment reduces principal — just factor in any balance transfer fee (commonly 3-5% of the amount moved) and know what the rate reverts to afterward.",
        },
      ],
    },
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
    content: {
      intro: [
        "Any debt with a balance, an interest rate, and a payment you control — a personal loan, a medical bill on a payment plan, an older auto loan you're paying extra on — can be projected the same way: how many months until it's gone, and how much of what you pay is actually interest versus principal. This calculator runs that projection for any fixed-payment debt, not just credit cards, so you can plan a real payoff timeline instead of just watching a balance shrink month to month.",
        "It's most useful when you're juggling more than one debt and deciding where extra money should go — comparing how much faster a higher payment clears a specific balance, or checking what a debt actually costs in total interest if you stick to the minimum required payment versus paying more aggressively.",
        "Balances, interest rates, and how much debt you're carrying are exactly the kind of numbers people don't want stored anywhere — this calculator runs entirely in your browser, with nothing about your debt situation sent anywhere or logged.",
      ],
      howItWorks: [
        "Two common strategies guide which debt to attack first when you have several: the debt avalanche pays extra toward whichever balance has the highest interest rate first, which minimizes total interest paid mathematically. The debt snowball pays extra toward the smallest balance first regardless of rate, which clears individual debts faster and can be easier to stick with psychologically. Run each of your debts through this calculator individually to compare both approaches with your real numbers.",
      ],
      faq: [
        {
          q: "What's the difference between the debt avalanche and debt snowball methods?",
          a: "Avalanche targets the highest-interest debt first and saves the most money overall. Snowball targets the smallest balance first, which builds momentum by clearing individual debts faster even if it costs slightly more in total interest — the better choice depends on whether you're more motivated by the math or by visible progress.",
        },
        {
          q: "How much do extra payments actually save on a loan or debt?",
          a: "Often more than expected, since every extra dollar goes straight to principal and stops accruing interest for every remaining month of the loan. Try the same balance and rate at your current payment versus a higher one here to see the real dollar difference.",
        },
        {
          q: "Should I always pay off the highest-interest debt first?",
          a: "Mathematically, yes — it minimizes total interest paid across all your debts. But if a smaller, lower-interest balance is close to being paid off, clearing it first for a psychological win is a legitimate reason to deviate from pure math.",
        },
        {
          q: "Why does this ask for a monthly payment instead of a target payoff date?",
          a: "Because payment amount and payoff time trade off against each other — enter a payment and see how long it takes, then adjust the payment up or down until the resulting timeline matches a payoff date you're aiming for.",
        },
        {
          q: "Does paying biweekly instead of monthly actually help pay off debt faster?",
          a: "It can, mainly because biweekly payments (26 half-payments a year) add up to one extra full payment annually compared to monthly payments — but the bigger factor is always the total dollar amount paid per year, not the frequency it's split into.",
        },
      ],
    },
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
    content: {
      intro: [
        "A 401(k) projection has one moving part that most retirement math doesn't: the employer match, which is money added to your account that isn't yours until you contribute enough to claim it. Someone contributing 3% of salary to capture a full 3% match is effectively earning a guaranteed 100% return on that portion before the market does anything at all — this calculator adds your contributions, the match you're actually capturing, and decades of compounding together to project a realistic balance at retirement.",
        "It's used by people deciding what contribution percentage to set going into a new job, checking whether they're contributing enough to get the full employer match, or just wanting to see what a current savings rate realistically turns into by the time they retire.",
        "Your salary, your current balance, and your retirement timeline are private financial details — none of it is sent anywhere or stored, the whole projection runs on your device so you can plan around real numbers without creating a record of your retirement savings.",
      ],
      howItWorks: [
        "This assumes a dollar-for-dollar employer match up to whatever percentage of salary you specify, which is one of the most common match structures but not the only one — some employers match 50 cents per dollar, or match a different formula entirely, so check your specific plan documents rather than assuming this covers your exact match.",
        "The IRS sets an annual limit on how much you personally can contribute to a 401(k), separate from and not counting employer match contributions — that limit adjusts most years for inflation, so check the current year's figure directly with your plan provider rather than assuming a fixed number.",
      ],
      faq: [
        {
          q: "What's a good percentage of my salary to contribute to a 401(k)?",
          a: "A common starting guideline is to contribute at least enough to capture the full employer match, then work toward 10-15% of salary total (including the match) over time — but the right number depends heavily on your age, other savings, and retirement timeline.",
        },
        {
          q: "Am I leaving money on the table if I don't contribute enough to get the full match?",
          a: "Yes — an employer match you don't claim is compensation you're simply not collecting. If your employer matches up to 3% of salary and you're only contributing 1%, you're giving up the other 2% entirely, which this calculator's employer match line makes visible.",
        },
        {
          q: "Is there a limit to how much I can put into a 401(k) each year?",
          a: "Yes, the IRS sets an annual employee contribution limit that's separate from employer match dollars and typically adjusts for inflation most years — check the current limit with your plan provider or the IRS directly, since it changes over time.",
        },
        {
          q: "What annual return rate should I use for a realistic projection?",
          a: "There's no guaranteed number, but a commonly used long-run reference for a diversified stock-heavy portfolio before inflation is in the 6-8% range — run the projection at a couple of different rates to see how sensitive your outcome is to that assumption.",
        },
        {
          q: "Should I choose a Roth or a traditional 401(k)?",
          a: "Traditional contributions reduce your taxable income now and are taxed on withdrawal in retirement; Roth contributions are taxed now but grow and withdraw tax-free. Generally, Roth tends to favor people who expect to be in a similar or higher tax bracket in retirement — but this calculator doesn't model that tax difference, so treat it separately from the growth projection here.",
        },
      ],
    },
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
    content: {
      intro: [
        "The 50/30/20 rule — popularized by Senator Elizabeth Warren in a personal finance book she co-wrote before her political career — is a starting framework, not a precise formula: 50% of take-home pay toward needs, 30% toward wants, and 20% toward savings and extra debt payoff. Its value is speed — it turns one number, your monthly take-home pay, into three spending targets in seconds, without requiring you to categorize every line item first.",
        "It's used most by people building their very first budget who need a quick starting point before getting into a detailed line-by-line plan, and by anyone checking a rough sanity read on whether their current spending is wildly out of proportion in one category.",
        "Your income is exactly the kind of number that shouldn't be sitting on someone else's server — this split is calculated entirely in your browser, so you can plan around your real take-home pay without it being logged anywhere.",
      ],
      howItWorks: [
        "The categories aren't always obvious. \"Needs\" generally means the things you'd struggle to live without short-term — rent or mortgage, utilities, groceries, minimum debt payments, insurance. \"Wants\" covers everything optional even if it feels routine — dining out, subscriptions, entertainment, upgraded versions of things a cheaper option would also satisfy. The line is genuinely blurry for things like a cell phone plan or a car payment, and reasonable people categorize them differently — the framework is meant as a rough guide, not a strict audit.",
      ],
      faq: [
        {
          q: "What actually counts as a \"need\" versus a \"want\"?",
          a: "Needs are things you can't reasonably cut without real hardship — housing, utilities, groceries, minimum debt payments, basic transportation. Wants are things that improve life but aren't essential — restaurants, streaming subscriptions, upgraded versions of a need. Some expenses, like a car payment or phone plan, sit in a gray area and reasonable people split them differently.",
        },
        {
          q: "What if my needs already take up more than 50% of my income?",
          a: "This is common, especially in high cost-of-living areas — it's a sign the 50/30/20 split may not be realistic for your situation right now, not a personal failure. A more flexible ratio, or focusing on reducing a specific large need like housing, is often more useful than forcing the 50% target.",
        },
        {
          q: "Should I use gross income or take-home pay for this calculation?",
          a: "Take-home pay (after taxes and deductions) — the 50/30/20 rule is meant to allocate money you actually have available to spend, not your gross salary before taxes are taken out.",
        },
        {
          q: "Is 50/30/20 the best budgeting method to use?",
          a: "It's one popular method, not a universal best — zero-based budgeting (assigning every dollar a job) and envelope budgeting are common alternatives that give more granular control at the cost of more upkeep. 50/30/20 trades precision for simplicity, which makes it a reasonable starting point rather than a permanent system.",
        },
        {
          q: "Does the 20% savings category include retirement contributions?",
          a: "Typically yes — the savings and debt payoff category is meant to cover retirement contributions, emergency fund building, and any extra (non-minimum) debt payments, all bundled into that one 20% target.",
        },
      ],
    },
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
    content: {
      intro: [
        "Return on investment answers a simple question — how much did I gain relative to what I put in — but the raw percentage alone can be misleading without one more piece of context: how long it took. A 40% return sounds identical whether it happened in six months or six years, and those two outcomes are nowhere near equally good. This calculator gives both the raw ROI and, when you provide a holding period, the annualized figure that actually makes different investments comparable.",
        "It's used to evaluate almost anything with a defined start and end value: a stock position, a real estate flip, a small business investment, or even a large one-off purchase like a car or equipment being judged by resale or savings generated — anywhere there's a clear initial cost and a final value to compare it against.",
        "Investment amounts and returns are private financial details by nature — this calculator runs the entire comparison in your browser, so you can evaluate a real deal or a real portfolio position without any of those numbers being sent anywhere.",
      ],
      howItWorks: [
        "Raw ROI is a simple ratio: (final value − initial value) ÷ initial value, expressed as a percentage — it tells you the total return over the entire holding period, however long that was. Annualized ROI answers a different question: what constant yearly rate, compounding every year, would produce the same result over that same period? It's calculated as (final ÷ initial)^(1/years) − 1, which is the same math behind CAGR (compound annual growth rate) — and it's the number that lets you fairly compare a two-year investment against a ten-year one.",
      ],
      faq: [
        {
          q: "What counts as a good ROI on an investment?",
          a: "It depends entirely on the asset type, risk level, and time horizon — there's no single benchmark. A long-run diversified stock portfolio commonly returns somewhere around 7-10% annualized before inflation, but real estate, small business, and other investments carry different typical ranges and different risk.",
        },
        {
          q: "Why does annualized ROI matter if I already know the total ROI?",
          a: "Total ROI doesn't account for how long the money was tied up, so it can't be compared fairly across investments with different holding periods. A 50% total return over 10 years is a much weaker result than 50% over 2 years, even though the raw ROI number looks identical.",
        },
        {
          q: "Does ROI account for taxes, fees, or inflation?",
          a: "No — this calculates a straightforward return based on the initial and final values you enter. Capital gains taxes, transaction or management fees, and inflation all reduce the real, spendable return and aren't factored in automatically, so keep that in mind when comparing to other goals.",
        },
        {
          q: "How is ROI different from CAGR?",
          a: "ROI (as a raw figure) measures total return over the whole period regardless of length. CAGR — which is what the annualized ROI figure here calculates — smooths that same total return into an equivalent constant yearly rate, making it the more useful number for comparing investments held for different lengths of time.",
        },
        {
          q: "Can ROI be negative, and what does that mean?",
          a: "Yes — a negative ROI simply means the final value was lower than the initial investment, i.e. a loss. An ROI of -25% means you'd have 75% of your original investment left if you sold at that final value.",
        },
      ],
    },
  },
];

export default financial;
