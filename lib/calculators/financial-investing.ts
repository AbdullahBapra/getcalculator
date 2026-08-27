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
    content: {
      intro: [
        "This calculator splits your projected balance into two numbers that get conflated far too often: the future value your account statement will actually show, and what that balance can actually buy once inflation has quietly taken a bite out of it. A projection that only shows the first number makes a 20-year plan look better than it really is.",
        "It's built for the moment you're deciding how hard to push a savings goal that's still years off — sizing up a down payment fund, a college account, or an early-retirement date — and want to see what a given monthly contribution and a realistic return assumption actually turn into, rather than eyeballing it.",
        "Every field here stays in your browser. There's no account to make and nothing about your savings amount, your return assumption, or your goal gets sent anywhere — handy when the numbers you're testing are basically your entire financial plan and you'd rather not hand that to a random website.",
      ],
      howItWorks: [
        "The future value is two pieces added together: your initial balance compounding on its own at the expected return over the full time horizon, plus your monthly contributions growing as an ordinary annuity, where each deposit compounds for whatever time remains after it goes in.",
        "The inflation-adjusted figure takes that nominal future value and divides it by (1 + inflation rate) raised to the number of years, which converts tomorrow's dollars back into today's purchasing power — the honest way to compare a future balance against your current cost of living.",
      ],
      faq: [
        {
          q: "What's a realistic annual return to assume for a stock-heavy portfolio?",
          a: "Long-run US stock market averages have historically landed in the 7-10% nominal range before inflation, though any single decade can look very different. Many planners use a more conservative 6-8% for long-horizon projections precisely because assuming the best-case average tends to overstate what you'll actually end up with.",
        },
        {
          q: "Why does the inflation-adjusted number matter if I'm not spending the money yet?",
          a: "Because the goal you're saving for — a house, tuition, a retirement lifestyle — will cost more in future dollars too. Comparing your nominal future value against today's prices makes the goal look easier to hit than it actually is.",
        },
        {
          q: "Does this calculator account for capital gains taxes?",
          a: "No — it projects pre-tax growth. Taxable brokerage accounts owe capital gains tax on growth when sold, while tax-advantaged accounts like IRAs and 401(k)s defer or eliminate that depending on the account type, so your actual take-home figure depends heavily on where this money is held.",
        },
        {
          q: "How much difference does contributing monthly actually make versus investing a lump sum?",
          a: "Regular contributions add up through their own compounding, but a lump sum invested earlier has more total time in the market working for it. Try zeroing out the monthly contribution and comparing the future value against your current inputs to see the gap for your own numbers.",
        },
        {
          q: "Is a higher expected return always the better assumption to plan around?",
          a: "No — using an overly optimistic return to plan a goal is a common way to under-save. It's usually safer to run this calculator at a conservative return and treat any extra growth as a buffer rather than something to count on.",
        },
      ],
    },
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
    content: {
      intro: [
        "A CD's advertised APY already bakes in compounding, so multiplying the rate by the deposit and the term in years overstates or understates what you'll actually get depending on how often the bank compounds — daily, monthly or quarterly compounding all produce slightly different maturity values from the same headline APY. This calculator does the actual compounding math instead of the rough version.",
        "It's the tool for comparing two CD offers that look close on paper — a 12-month CD at one rate against an 18-month CD at a slightly lower one, say — where the real difference is finding out which term and rate combination actually leaves you with more money at maturity, not just which APY number is bigger.",
        "Nothing you type here leaves your browser. You can plug in the exact deposit amount and rate from an offer you're considering without creating an account anywhere or having that number tied to your identity.",
      ],
      faq: [
        {
          q: "How is CD interest actually calculated?",
          a: "Using A = P(1 + r/n)^(nt), where P is your deposit, r is the APY, n is how many times per year the bank compounds, and t is the term in years. Banks typically compound CDs daily or monthly, which is why the compounding-frequency setting here changes the maturity value.",
        },
        {
          q: "Is APY the same as the interest rate?",
          a: "No. The interest rate is the stated annual rate before compounding; APY (annual percentage yield) already reflects compounding and is the number that determines what you actually earn — always compare CDs on APY, not the raw rate.",
        },
        {
          q: "What happens if I withdraw from a CD before it matures?",
          a: "Almost every CD charges an early withdrawal penalty, typically a forfeiture of some number of months' worth of interest, which can eat into principal on a short-term CD if you withdraw soon after opening it. Check the specific penalty terms before assuming this calculator's maturity value is guaranteed money.",
        },
        {
          q: "Is a CD better than a high-yield savings account?",
          a: "A CD locks in today's rate for the full term, which is an advantage if rates are expected to fall and a disadvantage if they rise, while a savings account's rate can move at any time but gives you liquidity a CD doesn't. Neither is universally better — it depends on your rate outlook and whether you'll need the cash before maturity.",
        },
        {
          q: "Does compounding frequency actually make a meaningful difference?",
          a: "At typical CD rates and terms, the difference between daily and monthly compounding is usually small — a few dollars on a modest deposit — but it grows with a larger balance and a longer term, which is why it's worth checking rather than assuming it's negligible.",
        },
      ],
    },
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
    content: {
      intro: [
        "A bond's face value and its price are two different numbers, and confusing them is the single most common bond mistake — a $1,000-face bond can trade well above or below $1,000 depending on how its coupon rate compares to what new bonds are currently paying. This calculator discounts every future coupon payment, plus the face value returned at maturity, back to today's dollars to find the price that's actually fair given current market rates.",
        "This is the calculator for the moment you're looking at a bond quote and trying to work out whether it's priced fairly relative to prevailing rates, or comparing a bond you already hold against what it would be worth if rates have moved since you bought it — both come down to the same present-value math.",
        "The numbers you enter — your bond holdings, the rates you're evaluating — never leave your browser. There's no account needed to run the math on a position you're actually considering.",
      ],
      howItWorks: [
        "Bond price is the sum of two present-value calculations: every future coupon payment discounted back at the market rate, plus the face value (returned at maturity) discounted back over the full term. When the market rate rises above the bond's coupon rate, future cash flows are worth less today and the bond prices below face value — a discount. When the market rate falls below the coupon rate, the bond prices above face value — a premium.",
        "Current yield, shown alongside price, is simply the annual coupon payment divided by the current price — it's a rougher measure than yield to maturity since it ignores the gain or loss you'd realize by holding to maturity at a price different from face value.",
      ],
      faq: [
        {
          q: "Why would a bond trade for more than its face value?",
          a: "When a bond's coupon rate is higher than the current market rate for similar bonds, investors are willing to pay a premium above face value to lock in that above-market income stream — the price rises until the yield matches the market.",
        },
        {
          q: "What's the difference between current yield and yield to maturity?",
          a: "Current yield only looks at annual coupon income relative to the current price; yield to maturity accounts for that plus any gain or loss between what you paid and the face value you'll get back at maturity. YTM is the more complete picture of your actual return if you hold to maturity.",
        },
        {
          q: "Why does a bond's price move in the opposite direction of interest rates?",
          a: "A bond's coupon payments are fixed at issuance. When market rates rise, newly issued bonds pay more, so an older bond with a lower fixed coupon becomes less attractive and must trade at a lower price to offer a competitive yield — and vice versa when rates fall.",
        },
        {
          q: "Is a higher coupon rate always a better bond?",
          a: "Not by itself — a high coupon just means more income now, but it doesn't tell you if the price you're paying is fair relative to that income and the bond's risk. Comparing price and current yield against the market rate, like this calculator does, is a better test than the coupon rate alone.",
        },
        {
          q: "Does this account for a bond being called early or defaulting?",
          a: "No — this is a standard fixed-schedule bond pricing model that assumes every coupon and the face value get paid exactly as scheduled. Callable bonds and credit risk both change the real picture and aren't reflected here.",
        },
      ],
    },
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
    content: {
      intro: [
        "An expense ratio looks tiny on a fund fact sheet — often well under 1% — which is exactly why it's easy to ignore, but it's charged every single year on your entire balance, not just what you contribute, so it compounds against you the same way returns compound for you. This calculator subtracts the expense ratio from your expected return and shows what that quietly costs you in dollar terms over the full time horizon.",
        "It's built for the decision a lot of people never actually run the numbers on: comparing a low-cost index fund against a similar actively managed fund with a higher expense ratio, or checking what an old 401(k)'s fund lineup is really costing you compared to a cheaper option you could roll it into.",
        "Your contribution amount, fund choice and return assumptions stay on your device — nothing is sent to a server or logged, so you can compare real funds you're actually deciding between without creating an account anywhere.",
      ],
      faq: [
        {
          q: "How much does a 1% expense ratio really cost over time?",
          a: "More than it sounds like — a 1% annual fee compounds against your balance for decades, and on a long horizon it can consume a meaningful fraction of your total growth, not just 1% of a single year's return. This calculator's 'lost to fees' figure shows that exact dollar cost for your own numbers.",
        },
        {
          q: "What's considered a low expense ratio for a mutual fund?",
          a: "Broad index funds commonly charge well under 0.2%, while actively managed funds often run from around 0.5% up past 1%. There's no universal 'good' number, but a materially higher fee needs to be justified by materially better performance, which is uncommon over long periods.",
        },
        {
          q: "Does the expense ratio come out of my account as a separate charge?",
          a: "No — it's typically deducted directly from the fund's returns before the price you see, not billed to you separately. That's exactly why it's easy to overlook: you never see a line-item fee, you just quietly earn a lower return than the fund's gross performance.",
        },
        {
          q: "Is a higher expense ratio ever worth it?",
          a: "Sometimes, if a fund gives you access to a strategy or asset class you genuinely can't get cheaply elsewhere. But for a plain diversified stock or bond fund, a low-cost option usually performs comparably or better over the long run once fees are accounted for.",
        },
        {
          q: "Are there other fund costs besides the expense ratio?",
          a: "Yes — sales loads (front-end or back-end commissions), trading costs inside the fund, and account or advisory fees from wherever you hold it can all add up separately from the expense ratio itself. This calculator only models the expense ratio, so a fund with a load could cost more than shown here.",
        },
      ],
    },
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
    content: {
      intro: [
        "The headline number here — your projected balance at retirement — actually understates the real advantage of a Roth IRA, because every dollar of growth shown in this projection comes out tax-free in retirement, unlike a regular brokerage account where you'd owe capital gains tax on that same growth. Ignoring that when comparing account types is a common way to undervalue the Roth.",
        "This is the calculator for deciding how much to route into a Roth versus a traditional account, or for checking whether your current contribution rate is actually on pace to hit a retirement number you have in mind — a real decision anyone with earned income and a Roth-eligible income level runs into every year they contribute.",
        "Your age, balance and contribution numbers are processed entirely in your browser. There's no login and nothing about your retirement savings gets sent anywhere, which matters given how personal that number is.",
      ],
      howItWorks: [
        "The projection compounds your current balance forward at the expected return for the number of years until retirement, then adds your annual contributions growing as their own annuity — each year's contribution compounds for whatever time is left before your target retirement age.",
        "Unlike a traditional IRA, there's no tax adjustment applied to the final figure: because Roth contributions are made with after-tax money, qualified withdrawals in retirement owe no further income tax, so the future value shown here is already the number you'd actually get to keep.",
      ],
      faq: [
        {
          q: "What's the actual difference between a Roth IRA and a traditional IRA?",
          a: "A Roth is funded with money you've already paid income tax on, and qualified withdrawals in retirement are tax-free. A traditional IRA typically gives you a tax deduction now, but withdrawals in retirement are taxed as ordinary income. Which is better depends mainly on whether you expect your tax rate to be higher or lower in retirement than it is today.",
        },
        {
          q: "Is there an income limit to contribute to a Roth IRA?",
          a: "Yes — the IRS phases out your ability to contribute directly once your modified adjusted gross income crosses a threshold that's adjusted periodically, and it differs by filing status. Above the phase-out range, a 'backdoor Roth' conversion is a common workaround, but the direct contribution limit mechanism is what actually caps this calculator's annual contribution field.",
        },
        {
          q: "Can I withdraw Roth IRA contributions before retirement without penalty?",
          a: "Your original contributions (not the earnings) can generally be withdrawn at any time without tax or penalty, since you already paid tax on that money going in. Withdrawing the earnings portion early is a different story and usually triggers both tax and a penalty unless an exception applies.",
        },
        {
          q: "Does a Roth IRA have required minimum distributions?",
          a: "No — unlike a traditional IRA or 401(k), the original account owner never has to take RMDs from a Roth IRA during their lifetime, which is one reason it's also a useful vehicle for money you may not need to touch in retirement.",
        },
        {
          q: "How much can contributing early instead of late actually change this number?",
          a: "Substantially — a contribution made in your 20s has decades more time to compound than the identical dollar contributed in your 40s. Try shifting the current age in this calculator by even five or ten years to see how much that head start is actually worth for your own numbers.",
        },
      ],
    },
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
    content: {
      intro: [
        "The pre-tax balance a traditional IRA projects is not the number you'll actually get to spend — every withdrawal in retirement is taxed as ordinary income, so the real comparison against other savings isn't the balance itself but what's left after your withdrawal-year tax bill. This calculator shows both figures side by side instead of leaving you to do that subtraction yourself.",
        "It's for the same decision the Roth calculator handles from the other side: whether to put new contributions into a traditional account (tax break now, taxed withdrawals later) or a Roth (no break now, tax-free later) — and for checking what an old traditional 401(k) or IRA balance is actually worth once withdrawal-year taxes are factored in.",
        "Everything you enter runs locally in your browser — your balance, your contribution rate, your assumed tax rate at withdrawal never leave your device, since none of that needs to touch a server just to run a projection.",
      ],
      howItWorks: [
        "The pre-tax balance compounds the same way any IRA projection does: your current balance grows at the expected return for the years remaining, and annual contributions compound as their own annuity on top of that.",
        "The after-tax figure then applies your entered withdrawal tax rate directly to that pre-tax balance, treating the whole thing as if withdrawn and taxed in one lump — a simplification, since real retirees usually withdraw gradually across tax brackets, but it's a useful stand-in for comparing account types on equal footing.",
      ],
      faq: [
        {
          q: "Why is a traditional IRA's future value shown pre-tax?",
          a: "Because contributions (and growth) haven't been taxed yet — the IRS collects income tax when you actually withdraw the money in retirement, not when it goes in or grows. The pre-tax balance is what your statement will show, but it isn't spendable money until tax is applied.",
        },
        {
          q: "Is a traditional IRA contribution always tax-deductible?",
          a: "Not always — if you (or your spouse) are covered by a workplace retirement plan, the deduction phases out above certain income levels, though you can generally still contribute on a non-deductible basis. Check your specific eligibility before assuming the full contribution reduces this year's taxable income.",
        },
        {
          q: "What tax rate should I use for the 'tax rate at withdrawal' field?",
          a: "Your marginal tax rate in retirement, which depends on your total retirement income and the tax brackets at that time — neither of which is fully knowable today. A reasonable approach is to run this at a couple of different rates (your current bracket and a lower one) to see the range of outcomes rather than betting on one number.",
        },
        {
          q: "Should I choose a traditional IRA or a Roth IRA?",
          a: "The traditional account tends to win if you expect to be in a lower tax bracket in retirement than you are now (common if your working-years income is high); the Roth tends to win in the opposite case. Running both calculators with the same contribution numbers is the most direct way to compare them for your own situation.",
        },
        {
          q: "Do traditional IRAs have required minimum distributions?",
          a: "Yes — unlike a Roth, the IRS requires you to start withdrawing (and paying tax on) a minimum amount each year once you reach the RMD age, whether or not you actually need the money. The RMD calculator linked below works out that required amount from your balance.",
        },
      ],
    },
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
    content: {
      intro: [
        "The IRS doesn't let a traditional IRA or 401(k) grow tax-deferred forever — once you reach RMD age, it forces a minimum withdrawal every year, calculated by dividing your prior year-end balance by a life-expectancy factor from the Uniform Lifetime Table. That factor shrinks a little every year you age, which is the part people miss: even a balance that stays perfectly flat produces a growing required withdrawal, and skipping it or underpaying it triggers a steep IRS excise tax on the shortfall.",
        "This is the calculator for the specific chore that shows up every year once you're retired and holding tax-deferred accounts: figuring out the exact dollar amount you're required to pull out before the December 31 deadline, so you can plan the tax hit and decide whether to take more than the minimum.",
        "Your account balance and age are personal enough that you probably don't want them sitting on a server somewhere — everything here runs in your browser, with no login and nothing saved beyond the tab you're looking at.",
      ],
      howItWorks: [
        "The RMD is your account balance as of December 31 of the prior year, divided by the IRS life-expectancy factor for your age this year — a smaller factor at older ages divides into a larger required amount, which is why the table below shows the requirement climbing over time even off an unchanged balance.",
        "This calculator uses the IRS Uniform Lifetime Table, the one that applies to the large majority of account owners. A different, more generous table applies only if your sole beneficiary is a spouse more than 10 years younger than you.",
      ],
      faq: [
        {
          q: "What happens if I don't take my full RMD by the deadline?",
          a: "The IRS charges an excise tax on the amount you failed to withdraw — historically as high as 50%, though recent law changes have reduced it in many cases. It's a genuinely steep penalty, so missing or shorting an RMD is one of the costliest retirement-account mistakes to make.",
        },
        {
          q: "Do Roth IRAs have required minimum distributions?",
          a: "Not during the original owner's lifetime — RMDs apply to traditional IRAs, 401(k)s and similar pre-tax accounts, but a Roth IRA is exempt for as long as the original account holder is alive, which is one reason people convert balances to Roth before RMD age.",
        },
        {
          q: "Can I take my RMD from just one account if I have several?",
          a: "For IRAs, yes — you can calculate each IRA's RMD separately and then withdraw the total from any one IRA or combination of them. Workplace plans like 401(k)s are different and generally require the RMD to come out of that specific plan.",
        },
        {
          q: "Does the RMD amount count as taxable income?",
          a: "Yes — an RMD from a traditional account is taxed as ordinary income in the year you take it, same as any other withdrawal. It's not a penalty in itself; the penalty only applies to the portion you fail to withdraw.",
        },
        {
          q: "Can I take more than my RMD in a given year?",
          a: "Yes — the RMD is only a floor, not a cap. Taking more is common if you need the cash or are managing your tax bracket across years, but any withdrawal above the minimum doesn't reduce what you're required to take in future years.",
        },
      ],
    },
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
    content: {
      intro: [
        "A dollar promised ten years from now isn't worth a dollar today — it's worth less, because money you have now can be invested and grow, while money you're owed later can't. Present value answers the actual question: given a discount rate that reflects what you could otherwise earn, what would you need to invest today to end up with that future amount? Comparing a future sum to its face value instead of its present value is how people overvalue delayed payouts.",
        "This is the math behind deciding between a lump sum now and a larger payment later — an inheritance you could take now or in installments, a lawsuit settlement offering a smaller amount today or a larger structured payout, or valuing a bond or pension promise by discounting its future payments back to what they're actually worth today.",
        "The future amount and rate you're testing stay local to your browser — there's no account required and nothing about the settlement, payout or investment you're evaluating gets sent anywhere.",
      ],
      faq: [
        {
          q: "What discount rate should I use for a present value calculation?",
          a: "It should reflect what you could realistically earn on the money elsewhere at similar risk — often a savings rate, bond yield, or expected investment return depending on the comparison you're making. A higher discount rate always produces a lower present value, since it assumes your money could grow faster elsewhere.",
        },
        {
          q: "Why does present value decrease as the time horizon gets longer?",
          a: "Because the discount rate is applied compounding, year after year — the further out a future payment sits, the more years of assumed growth you're giving up by not having it now, so its value today keeps shrinking the further away it is.",
        },
        {
          q: "Is present value the same as inflation adjustment?",
          a: "They're related but not identical. Present value discounts a future sum by an opportunity-cost rate to find its worth today; adjusting for inflation strips out the effect of rising prices specifically. Depending on the discount rate you choose, present value can implicitly reflect inflation, investment return, or both.",
        },
        {
          q: "How is present value used to price a bond or annuity?",
          a: "Both are valued by discounting every future cash flow — coupon payments, an annuity payment, or a final lump sum — back to today at a market-appropriate rate and summing the results. That's exactly the calculation this tool performs for a single future amount.",
        },
        {
          q: "Would I rather take a smaller lump sum now or a larger amount later?",
          a: "Discount the later amount back to today using a rate close to what you could actually earn on the lump sum, then compare the two present values directly. If the discounted future amount is smaller than the lump sum on offer, taking the money now is the better deal in pure financial terms.",
        },
      ],
    },
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
    content: {
      intro: [
        "Future value is the mirror image of present value: instead of discounting a future sum back to today, you're compounding what you have (or plan to add) forward to see what it becomes. The naive version — multiplying an annual rate by the number of years — badly understates the real number, because it ignores that growth in early years goes on to earn its own growth in later years.",
        "This is the general-purpose version of the compounding math that shows up everywhere in personal finance: sizing up a lump sum sitting in an account, layering in a recurring contribution, and seeing where the combination lands after a given number of years at an assumed rate — useful whether you're modeling a brokerage account, a savings goal, or just sanity-checking a projection someone else gave you.",
        "Everything you enter — your balance, contribution amount, rate assumption — is calculated right in your browser and never transmitted anywhere, so there's no account to set up just to run a projection.",
      ],
      howItWorks: [
        "The total future value is built from two compounding pieces added together: your present value growing on its own at the stated rate for the full term, and your monthly contributions growing as an annuity, where each individual deposit compounds for whatever time remains after it's made.",
      ],
      faq: [
        {
          q: "Why is future value higher than just adding up my contributions?",
          a: "Because each dollar you put in keeps earning returns on itself for the rest of the time horizon — that's compounding. Future value captures the total, including all that reinvested growth, while simply summing contributions ignores it entirely.",
        },
        {
          q: "How much does the annual rate actually change the result over a long horizon?",
          a: "A lot more than the percentage-point difference suggests — because compounding is exponential, a rate that's a couple of points higher can produce a dramatically larger future value over 20-30 years. Try nudging the rate up or down a point or two in this calculator to see the effect for your own numbers.",
        },
        {
          q: "Does it matter whether I contribute monthly or annually?",
          a: "Slightly — contributing more frequently means each dollar starts compounding a bit sooner on average, which produces a modestly higher future value than making the same total contribution once a year. The effect is real but usually small compared to the rate and time horizon.",
        },
        {
          q: "What's a reasonable rate to use if I'm not sure?",
          a: "It depends entirely on what the money is invested in — a savings account or CD might use 3-5%, a diversified stock portfolio has historically averaged closer to 7-10% before inflation. Using a rate that matches where the money actually sits gives a far more useful projection than a generic guess.",
        },
      ],
    },
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
    content: {
      intro: [
        "A simple return percentage treats every dollar of cash flow as if it landed on the same day, but real investments pay out unevenly over years — a big return in year 5 isn't worth the same as the same dollar amount in year 1. Internal rate of return solves for the single discount rate at which the present value of every future cash flow exactly equals your initial outlay, which is what makes it comparable across investments with completely different payout timing.",
        "This is the calculator for comparing investments that don't pay out on a neat schedule — a rental property with irregular cash flows, a business expansion project, a private investment with staggered distributions — where you need one number that accounts for both the size and the timing of what comes back to you, not just the total.",
        "The investment amount and cash flow figures you're testing are calculated locally and never leave your browser — useful when the numbers involved are for a deal you haven't committed to yet and would rather not have tied to your identity anywhere.",
      ],
      howItWorks: [
        "IRR is found by solving for the rate at which net present value equals zero — in other words, the rate that makes the discounted value of every future cash flow exactly offset your initial investment. There's no closed-form formula for this, so it's solved iteratively by testing rates until NPV converges to zero.",
        "A higher IRR means the investment's cash flows are worth more relative to what you put in, discounted for timing. Comparing an IRR to your required rate of return (sometimes called a hurdle rate) is the standard way to judge whether a project clears the bar.",
      ],
      faq: [
        {
          q: "What counts as a 'good' IRR?",
          a: "It depends entirely on what you're comparing it against — your cost of capital, what you could earn on a similarly risky alternative, or a hurdle rate you've set for the type of investment. There's no universal good number; an IRR is only meaningful relative to what else you could do with the money.",
        },
        {
          q: "Why might this calculator say no IRR was found?",
          a: "IRR requires at least one sign change in the cash flow stream — an initial outflow followed by inflows, typically. If the cash flows never cross zero at any reasonable rate, or if there are multiple sign changes that produce more than one mathematically valid IRR, the solver can fail to converge on a single answer.",
        },
        {
          q: "What's the difference between IRR and NPV?",
          a: "NPV gives you a dollar amount — the value created above your required return, at a rate you specify. IRR gives you a percentage — the rate at which the investment breaks exactly even. NPV is generally considered the more reliable metric for comparing investments of different sizes; IRR is more intuitive but can be misleading when comparing projects of very different scale.",
        },
        {
          q: "Can an investment have more than one IRR?",
          a: "Yes, if the cash flow stream changes sign more than once (outflow, then inflow, then another outflow, for example), the math can produce multiple valid solutions. That's an edge case worth watching for in projects with cash calls partway through, like a real estate deal with a later capital improvement.",
        },
      ],
    },
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
    content: {
      intro: [
        "Payback period answers a narrower but very practical question than IRR or NPV: not how profitable an investment is overall, but simply how long until the cash coming back in adds up to what you put in. It's a risk-and-liquidity check as much as a return measure — the sooner you break even, the less time your capital is exposed and the sooner you can redeploy it elsewhere.",
        "This is the calculator business owners and project evaluators reach for when comparing options with different upfront costs and cash flow patterns — new equipment, a store expansion, a software investment — where getting your capital back sooner is itself a meaningful advantage, independent of the total return.",
        "The investment cost and projected cash flows you're testing here stay in your browser. There's no account required to model a project you're still evaluating and haven't committed real numbers to anywhere else.",
      ],
      howItWorks: [
        "The calculator tracks cumulative cash flow starting from the negative initial investment, adding each period's cash flow until the running total crosses zero. The payback period is the point that happens — including a fractional year, calculated from how far into that period the crossing occurs, not just the whole year it lands in.",
      ],
      faq: [
        {
          q: "What's considered a good payback period?",
          a: "It varies a lot by industry and the size of the investment — a piece of equipment might be expected to pay back in 1-3 years, while a larger capital project might reasonably take 5-10. There's no universal benchmark; what matters is comparing it against your own threshold or against competing uses of the same capital.",
        },
        {
          q: "What's the main weakness of payback period as a metric?",
          a: "It ignores everything that happens after the payback point and doesn't account for the time value of money — a project with a fast payback but weak returns afterward can look better than a project with a slightly longer payback but much stronger long-term returns. It's best used alongside IRR or NPV, not instead of them.",
        },
        {
          q: "What does it mean if payback period isn't reached at all?",
          a: "It means the cumulative cash flows you entered never recover the initial investment within the time frame given — either the project takes longer than you've modeled, or as entered it never actually breaks even. Extending the cash flow list or reconsidering the assumptions is the next step.",
        },
        {
          q: "Is payback period the same as return on investment?",
          a: "No — payback period measures time to recover your capital, while ROI measures overall profitability as a percentage. A short payback period doesn't guarantee a high overall return, and a strong ROI doesn't guarantee a fast payback; they're answering different questions.",
        },
      ],
    },
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
    content: {
      intro: [
        "Averaging a series of yearly returns the simple way — adding them up and dividing by the number of years — gives you the arithmetic mean, and it's almost always higher than what you actually earned. The geometric mean (CAGR) accounts for the fact that returns compound on each other and that volatility itself drags down compounded results, which is why a portfolio that gained 20% one year and lost 20% the next isn't back to even, even though the arithmetic average of those two numbers is zero.",
        "This is the calculator for the moment you're looking at a fund's year-by-year performance history and want the honest single number — checking whether an investment's marketed 'average return' matches what you'd actually have earned holding it, or comparing your own portfolio's real multi-year performance against a benchmark.",
        "The return figures you enter are processed entirely in your browser. There's no account needed to check your own performance numbers or a fund's history against each other.",
      ],
      howItWorks: [
        "The arithmetic average simply sums the entered yearly returns and divides by the count — straightforward, but it doesn't reflect compounding. The geometric average multiplies together (1 + each year's return), takes the nth root for the number of years, and subtracts 1 — this is the rate that, applied consistently every year, would have produced the same ending value as the actual sequence of ups and downs.",
      ],
      faq: [
        {
          q: "Why is the geometric average always lower than the arithmetic average?",
          a: "Because volatility itself is a drag on compounded returns — a loss requires a proportionally larger subsequent gain just to break even (a 50% loss needs a 100% gain to recover), so any sequence of returns that isn't perfectly steady compounds to less than the simple average would suggest. The bigger the swings, the wider the gap between the two figures.",
        },
        {
          q: "Which average should I actually use to judge investment performance?",
          a: "The geometric average (CAGR) — it's the number that reflects what a dollar invested at the start actually grew to by the end, accounting for compounding. The arithmetic average is more useful in narrower statistical contexts, like estimating a single typical year's return, but it overstates realized multi-year performance.",
        },
        {
          q: "Why do fund marketing materials sometimes show a higher return than I actually experienced?",
          a: "Often because they're citing an arithmetic average of yearly returns, or a return calculated over a specific favorable window, rather than your personal experience shaped by when you bought in and how volatile the ride was. Comparing the geometric average against your own actual account statements is the more honest check.",
        },
        {
          q: "Does the order of the yearly returns matter for the calculation?",
          a: "No — the geometric average is a product of the same set of factors regardless of the order they occurred in, so shuffling the years produces the identical average. Order does matter, however, if you're also adding or withdrawing money along the way, which this simple average doesn't account for.",
        },
      ],
    },
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
    content: {
      intro: [
        "An annuity, in the mathematical sense, is just a series of equal payments made at regular intervals — a fixed contribution to a savings plan, a structured settlement, or level premiums building toward a payout. This calculator finds what that stream of payments grows to by the end, which is a different and easy-to-underestimate number from just multiplying the payment by the number of periods, since each payment compounds for whatever time remains after it's made.",
        "This is the general building-block calculation behind a lot of retirement math: figuring out what regular payments into an annuity contract, a savings plan, or any fixed periodic investment will actually be worth once the interest earned along the way is accounted for, not just the raw total contributed.",
        "The payment amount, rate and time period you're testing stay in your browser — no account, no data sent anywhere, just the math run locally on the numbers you're actually considering.",
      ],
      howItWorks: [
        "For an ordinary annuity, each payment is assumed to land at the end of its period, so the very last payment earns no interest at all while the first payment compounds for almost the full term. An annuity due assumes payments land at the start of each period instead, so every payment gets one extra period of compounding — which is why the annuity-due future value is always slightly higher for the same inputs.",
      ],
      faq: [
        {
          q: "What's the difference between an ordinary annuity and an annuity due?",
          a: "It's just a question of timing — an ordinary annuity assumes payments happen at the end of each period (common for loan payments), while an annuity due assumes payments happen at the start (common for rent or insurance premiums). Because annuity-due payments start compounding sooner, they produce a slightly higher future value for the same payment, rate and number of periods.",
        },
        {
          q: "How is this different from a lump-sum future value calculation?",
          a: "A lump sum grows as a single amount compounding continuously from day one. An annuity is a series of separate payments, each starting its own compounding clock on the date it's made — so the math sums up many smaller compounding calculations instead of one large one.",
        },
        {
          q: "Does increasing the number of periods always increase the future value proportionally?",
          a: "No — it increases faster than proportionally, because more periods means more total compounding time, not just more payments. Doubling the number of periods roughly doubles your total contributions but more than doubles the future value, especially at a meaningfully positive interest rate.",
        },
        {
          q: "What real-world products work like the annuity modeled here?",
          a: "Contributing a fixed amount to a retirement account every period, paying level premiums into certain insurance and annuity contracts, or making equal deposits into a sinking fund all follow this same fixed-payment, fixed-rate math — this calculator models the accumulation phase, not a payout stream.",
        },
      ],
    },
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
    content: {
      intro: [
        "Dividing a lump sum by the number of payments you want it to last for badly understates what you can actually withdraw each period, because it ignores that the remaining balance keeps earning interest while you draw it down. This calculator solves for the fixed periodic payment a lump sum can sustain over a set number of periods at a given rate, so the balance runs out exactly on schedule rather than early or with money left over.",
        "This is the math behind converting a lump sum — a pension buyout, an inherited IRA, an annuity purchase, retirement savings you want to spend down on a schedule — into a predictable paycheck-like income stream, and it's the calculation an insurance company runs in reverse when it prices an annuity contract's payout rate.",
        "The lump sum and rate you're testing are calculated locally in your browser. There's no login required to model a payout on retirement savings or a settlement you're actually deciding what to do with.",
      ],
      howItWorks: [
        "The payment amount is solved so that the lump sum, drawn down by that fixed payment every period while the remaining balance keeps earning interest, reaches exactly zero after the specified number of periods — neither running out early nor leaving a surplus.",
        "Because the balance keeps earning interest throughout the payout, the total amount paid out over the full term is typically more than the original lump sum — the difference shown as interest earned is money the balance generated along the way, not just your principal being handed back to you.",
      ],
      faq: [
        {
          q: "Why is my total payout more than the original lump sum?",
          a: "Because the remaining balance keeps earning interest throughout the payout period, not just sitting frozen — every period you haven't withdrawn, that money is still working. The gap between total paid out and the original lump sum is that accumulated interest.",
        },
        {
          q: "What happens if the interest rate is zero?",
          a: "With no interest, the calculation is simple: the lump sum is divided evenly across the number of periods, since there's no growth to help stretch it further. Any positive rate lets each payment be a bit larger than that simple division, since the balance is still earning while it's drawn down.",
        },
        {
          q: "How is this related to how insurance companies price annuities?",
          a: "It's essentially the same calculation run by an insurer, using their own assumed interest rate (and, for a life annuity, mortality assumptions) to determine what payout they can offer for a given premium. A commercial annuity quote will typically differ from this calculator's output because it also builds in fees and mortality risk pooling.",
        },
        {
          q: "What's the difference between this and a pension payout?",
          a: "This calculator assumes a fixed lump sum, rate and a specific number of periods you choose. A defined-benefit pension payout is instead determined by a plan's benefit formula — usually salary and years of service — rather than being solved from an account balance, which is what the pension calculator is built for.",
        },
      ],
    },
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
    content: {
      intro: [
        "A defined-benefit pension doesn't work like a savings account you can just check the balance of — it's a formula, usually your final average salary multiplied by your years of service and a plan-specific accrual rate, that determines a guaranteed annual payout rather than a lump sum you own outright. Not knowing that formula is why so many people reach retirement with only a vague sense of what their pension will actually pay.",
        "This calculator is for anyone with access to a traditional pension — many public-sector employees, union workers, and a shrinking but real slice of private-sector employees — who wants to estimate their payout at their current service length, or see how staying a few more years actually moves the number, using the formula their specific plan is built on.",
        "Your salary, years of service and the resulting payout estimate stay in your browser. There's no account required and nothing about your compensation or your pension's value gets sent anywhere, which matters for a number this tied to your employment history.",
      ],
      howItWorks: [
        "The core formula multiplies three things together: your final average salary (often the average of your highest-earning several years, not just your last paycheck), your total years of service, and the plan's accrual rate — a percentage that represents how much annual pension you earn per year worked. The table below shows how the payout shifts with a handful of years more or less service, holding salary and accrual rate constant.",
      ],
      faq: [
        {
          q: "What is 'final average salary' exactly?",
          a: "It's typically the average of your highest-earning consecutive years of service — often the final three or five years, though the exact window varies by plan — not simply your salary in your very last year. Check your plan's specific definition, since it directly determines the input to this calculator.",
        },
        {
          q: "What is an accrual rate and where do I find mine?",
          a: "It's the percentage of final average salary you earn per year of service, and it's set by your specific pension plan — commonly somewhere around 1-2.5% per year, though plans vary widely. Your plan's summary plan description or benefits office is the authoritative source for your actual rate.",
        },
        {
          q: "Does working a few extra years really make a meaningful difference to my pension?",
          a: "Often yes, and for two reasons at once: more years of service directly increases the years-of-service term in the formula, and staying longer frequently also raises your final average salary if you're still receiving raises. The comparison table shows both effects combined for a range of service lengths.",
        },
        {
          q: "Is a pension the same as a 401(k)?",
          a: "No — a 401(k) is a defined-contribution account where you own a balance that depends on what was contributed and how it grew; a pension is a defined-benefit promise where the employer guarantees a specific payout formula regardless of how any underlying investments perform. They carry very different risk: with a pension, the employer bears the investment risk.",
        },
        {
          q: "Can I take my pension as a lump sum instead of monthly payments?",
          a: "Some plans offer that option, converting the promised income stream into a present-value lump sum using the plan's own actuarial assumptions. Whether that's a better deal than the monthly annuity depends on your own life expectancy assumptions and what return you could realistically earn managing that lump sum yourself.",
        },
      ],
    },
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
    content: {
      intro: [
        "Social Security doesn't pay the same monthly amount no matter when you start claiming it — your benefit is anchored to your full retirement age (FRA) amount, then permanently reduced for every month you claim early or increased for every month you delay past FRA, up to age 70. Treating the FRA figure as the only number that matters overlooks that claiming timing alone can swing your monthly check by a large percentage, locked in for life.",
        "This is the calculator for the decision nearly every future retiree eventually faces: claim as soon as eligible at 62 for a smaller check sooner, wait until full retirement age, or delay to 70 for the largest possible monthly benefit — a decision with real tradeoffs around income needs, health, and other savings, not just around the raw dollar figure.",
        "Your benefit estimate and claiming plans stay entirely in your browser — nothing about your projected Social Security income, which is about as sensitive a retirement number as there is, gets sent anywhere or requires an account to check.",
      ],
      howItWorks: [
        "Starting from your benefit at full retirement age, this calculator applies the SSA's standard adjustment: claiming early reduces the benefit by roughly 5/9 of 1% per month for the first 36 months early, then 5/12 of 1% per month beyond that; claiming after FRA increases it by roughly 2/3 of 1% per month, up to age 70 (delaying further adds nothing).",
        "The comparison table shows your benefit at age 62, your full retirement age, age 70, and whatever claiming age you enter, so you can see the full range side by side rather than just one number in isolation.",
      ],
      faq: [
        {
          q: "What's the actual difference between claiming at 62 versus waiting until 70?",
          a: "The gap is substantial — claiming at the earliest possible age locks in a meaningfully reduced check compared to your full retirement age amount, while waiting until 70 delivers a meaningfully larger one, and the difference compounds over what could be decades of payments. This calculator's comparison table shows the exact percentages for your own benefit amount.",
        },
        {
          q: "Is it ever smarter to claim early even though the check is smaller?",
          a: "Sometimes — claiming early can make sense if you have a shorter life expectancy, need the income now, or want to preserve other retirement savings from being drawn down early. It's a genuinely personal decision, not just a math problem, since the 'right' answer depends heavily on how long you actually end up collecting.",
        },
        {
          q: "How is my full retirement age determined?",
          a: "It's set by the SSA based on your birth year — it has gradually shifted from 65 toward 67 for people born in more recent years. Your specific FRA determines both the reference point this calculator starts from and exactly how many months of early or delayed adjustment apply at any claiming age.",
        },
        {
          q: "Does this calculator give my exact Social Security benefit?",
          a: "No — it's a simplified estimate that applies the standard claiming-age adjustment to a benefit figure you provide. Your actual FRA benefit depends on your full lifetime earnings record, which the Social Security Administration calculates directly and shows on your personal statement.",
        },
        {
          q: "Does delaying benefits past age 70 increase them further?",
          a: "No — the delayed retirement credit stops accruing at age 70, so there's no additional benefit to waiting past that point. Claiming exactly at 70 captures the full increase without leaving any further growth on the table.",
        },
      ],
    },
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
    content: {
      intro: [
        "A retirement savings goal is really two numbers stapled together, and treating them as one is how plans go wrong: the balance you'll have by a given age, and whether that balance can actually sustain the income you want without running out. This calculator projects both — your future balance from current savings and ongoing contributions, and a sustainable annual withdrawal using the widely-cited 4% rule — then shows the gap between what that produces and what you've said you want to live on.",
        "This is the calculator for the moment you're trying to answer 'am I actually on track,' whether that's a first real look at retirement numbers in your 30s or 40s, or a check-in closer to retirement to see whether your current contribution rate closes the gap between projected income and desired income before you get there.",
        "Your savings balance, contribution rate and income goal are about as personal as financial numbers get, and none of it leaves your browser — there's no account needed to see where your own retirement plan actually stands.",
      ],
      howItWorks: [
        "The projected balance compounds your current savings at the expected return for the years remaining, and adds monthly contributions growing as their own annuity on top. The sustainable withdrawal then applies the 4% rule — a rule of thumb suggesting a retirement portfolio can support an initial withdrawal of about 4% of its balance annually, adjusted for inflation each year after, with a reasonably low risk of running out over a typical retirement length.",
        "The shortfall or surplus figure is just your desired annual income compared against that 4%-rule withdrawal — a positive gap means the current trajectory isn't yet generating your target income, a negative one means it clears it with room to spare.",
      ],
      faq: [
        {
          q: "Is the 4% rule still considered reliable?",
          a: "It's a widely used starting point, originally based on historical US market returns over rolling 30-year retirement periods, but it's a rule of thumb rather than a guarantee — actual safe withdrawal rates depend on the sequence of market returns you actually experience, how long your retirement lasts, and your portfolio mix. Many planners treat 4% as a reasonable starting estimate to stress-test, not a fixed promise.",
        },
        {
          q: "What should I do if this calculator shows a shortfall?",
          a: "The main levers are increasing your monthly contribution, extending your years to retirement, adjusting your desired income downward, or revisiting your return assumption — try adjusting each one individually in this calculator to see which has the biggest effect on closing your specific gap.",
        },
        {
          q: "Does this include Social Security or pension income?",
          a: "No — this projects only the savings balance you enter and its sustainable withdrawal. Social Security, a pension, or other guaranteed income sources would reduce how much you actually need to draw from savings, so your real income gap is likely smaller than this calculator shows on its own.",
        },
        {
          q: "How does inflation affect this projection?",
          a: "The projected balance and return assumption here are nominal, not inflation-adjusted, so the future dollar figures will buy less than the same number today. The 4% rule already assumes inflation-adjusted withdrawals each year after the first, but the growth projection itself doesn't separately strip out inflation.",
        },
        {
          q: "Is a higher expected return assumption always better for planning?",
          a: "No — an overly optimistic return makes a plan look more on-track than it really is. It's generally safer to run this calculator with a conservative return assumption and treat any better-than-expected performance as a buffer rather than something to count on.",
        },
      ],
    },
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
    content: {
      intro: [
        "Trading on margin means borrowing part of your position from your broker, which is why buying power ends up larger than the cash you actually deposited — and why the gains and losses that follow are calculated against that larger borrowed position, not just your own money. Treating margin buying power as if it were all your own capital is how the risk gets underestimated.",
        "This is the calculator for working out exactly how much leverage a margin account gives you before placing a trade — how much you can actually control with a given cash deposit at your broker's margin requirement, and how much of that position is money you're borrowing rather than money you own.",
        "The cash amount and margin terms you're testing are calculated locally in your browser. There's no account or login needed just to check the math on a trade you're sizing up.",
      ],
      faq: [
        {
          q: "How does margin actually amplify gains and losses?",
          a: "Because your percentage gain or loss is measured against the full position size, not just your cash deposit. A price move that would be a modest percentage change on an unleveraged position becomes a much larger percentage change on your actual equity when a portion of the position is borrowed.",
        },
        {
          q: "What is a margin call?",
          a: "It's a broker's demand for additional cash or securities when your account equity falls below a required maintenance level, usually because the position has lost value. If you can't meet it, the broker can sell your holdings without further notice to bring the account back into compliance.",
        },
        {
          q: "What determines the margin requirement percentage?",
          a: "It's set by a combination of regulatory minimums and individual broker policy, and it can vary by the specific security — more volatile or less liquid securities often carry a higher margin requirement, meaning less buying power per dollar of cash deposited.",
        },
        {
          q: "Do I pay interest on the amount I borrow on margin?",
          a: "Yes — brokers charge interest on the borrowed portion of a margin position, typically accruing daily, which is a real ongoing cost that eats into returns the longer a leveraged position is held open.",
        },
        {
          q: "Is trading on margin a good idea for a beginner?",
          a: "Generally not recommended — margin amplifies losses just as much as gains, and a bad move can wipe out your equity faster than an unleveraged position would, potentially even leaving you owing money beyond your original deposit. It's a tool typically reserved for experienced traders who understand and can tolerate that added risk.",
        },
      ],
    },
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
    content: {
      intro: [
        "An asset's purchase price isn't what it's worth on the books a year later — depreciation spreads that cost down to a salvage value over its useful life, and which method you use to spread it changes both your annual expense and your taxable income, sometimes substantially. Assuming straight-line depreciation is the only option, when a business asset might be better matched to an accelerated method, is a common way to miss real tax planning value.",
        "This is the calculator for a small business owner or bookkeeper working out annual depreciation on equipment, a vehicle, or other business property — figuring out what to expense this year, what the asset's book value will be afterward, and how straight-line depreciation compares to an accelerated method like double-declining balance.",
        "The asset cost and useful life you enter run entirely in your browser. There's no login required to model depreciation on equipment or property your business hasn't even purchased yet.",
      ],
      howItWorks: [
        "Straight-line depreciation is the simplest method: subtract the salvage value (what the asset will be worth at the end of its useful life) from its cost, then divide evenly across the useful life in years — the same dollar amount is expensed every year.",
        "Double-declining balance is an accelerated method that applies a fixed rate — double the straight-line rate — to the asset's remaining book value each year, rather than to its original cost. That front-loads more depreciation into the earliest years and less into later years, which some businesses prefer since newer assets often lose value and usefulness faster than older ones.",
      ],
      faq: [
        {
          q: "What's the difference between straight-line and double-declining-balance depreciation?",
          a: "Straight-line expenses the same fixed dollar amount every year of the asset's useful life. Double-declining balance expenses a much larger amount in the earliest years and progressively less later on, because it applies a fixed rate to the shrinking book value rather than the original cost each year.",
        },
        {
          q: "How do I choose a salvage value for an asset?",
          a: "It should reflect a realistic estimate of what the asset could be sold for once its useful life is over — sometimes based on resale data for similar equipment, sometimes set to zero for assets with no meaningful resale value. It's an estimate, not a guarantee, and can be revised if actual conditions change.",
        },
        {
          q: "Does depreciation actually affect my cash flow?",
          a: "Not directly — depreciation is a non-cash accounting expense that spreads out a cost you already paid for when you bought the asset. It does affect your taxable income, though, and lower taxable income can mean a real cash tax savings even though depreciation itself isn't a cash outflow.",
        },
        {
          q: "Why would a business choose an accelerated depreciation method over straight-line?",
          a: "Mainly to front-load the tax deduction into earlier years, which can be valuable if a business wants to reduce taxable income sooner rather than later, or if the asset genuinely loses most of its value and usefulness early in its life, like certain technology or vehicles.",
        },
        {
          q: "Is book value the same as market value?",
          a: "No — book value is simply cost minus accumulated depreciation on the accounting records, while market value is what the asset would actually sell for. The two can diverge significantly, especially for assets that hold value better (or worse) than their depreciation schedule assumes.",
        },
      ],
    },
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
    content: {
      intro: [
        "GDP isn't one number pulled from a single source — it's built from four components added together: consumption, investment, government spending, and net exports (exports minus imports). The expenditure approach used here is one of several ways economists arrive at the same total, and seeing GDP broken into these pieces explains a lot that the headline figure alone doesn't, like why a country can have strong consumption but weak overall growth once a trade deficit is subtracted out.",
        "This is the calculator for a student working through a macroeconomics problem set, or anyone trying to sanity-check how a change in one component — a jump in government spending, a widening trade deficit — actually flows through to the total, using the same C + I + G + (X − M) formula taught in intro economics.",
        "The figures you enter are computed right in your browser, with no account or server round-trip needed just to work through a GDP problem or check a homework answer.",
      ],
      howItWorks: [
        "Each of the four components is added directly: consumption (household spending), investment (business spending on capital, plus residential construction and inventory changes), and government spending are summed, and net exports — exports minus imports — is added on top, since imports represent spending on foreign-produced goods and are subtracted back out to keep GDP measuring only domestic production.",
        "The percentage breakdown shows what share of total GDP each component represents, which is often more informative than the raw dollar figures — consumption is typically the largest share of GDP in most developed economies, for instance.",
      ],
      faq: [
        {
          q: "Why are imports subtracted in the GDP formula?",
          a: "Because consumption, investment and government spending figures already include money spent on imported goods, and GDP is meant to measure only domestic production. Subtracting imports removes that foreign-produced spending back out, leaving a net exports figure that reflects only the trade balance's actual contribution.",
        },
        {
          q: "What's the difference between the expenditure approach and other ways of calculating GDP?",
          a: "The expenditure approach sums spending (C + I + G + net exports); the income approach instead sums all income earned in producing that output (wages, profits, rents, and so on); a third, the production approach, sums value added at each stage of production. All three should theoretically arrive at the same total GDP figure, just measured from different angles.",
        },
        {
          q: "Does a negative net exports figure mean the economy is doing poorly?",
          a: "Not necessarily — a trade deficit (importing more than exporting) reduces GDP's net exports term, but it doesn't automatically mean weak overall growth if strong domestic consumption and investment are more than making up for it. Net exports is one component among four, not a standalone verdict on economic health.",
        },
        {
          q: "What's the difference between nominal and real GDP?",
          a: "Nominal GDP is measured in current prices, so it can rise just from inflation even if actual output doesn't grow. Real GDP adjusts for price changes to isolate the actual change in the quantity of goods and services produced — this calculator computes a nominal-style total from the figures entered, without an inflation adjustment.",
        },
        {
          q: "What counts as 'investment' in the GDP formula?",
          a: "It's a specific economic definition, not everyday investing — it means business spending on capital like equipment and structures, residential construction, and changes in inventories. It does not include buying stocks or bonds, which is a transfer of existing assets rather than spending on newly produced output.",
        },
      ],
    },
  },
];

export default financialInvesting;
