import type { CalculatorDefinition } from "./types";
import { n, fmtCurrency, fmtNumber } from "../format";
import {
  employeeNI,
  incomeTax,
  employerNI,
  corporationTax,
  dividendTax,
  bandedPropertyTax,
  redundancyWeeks,
  statutoryNoticeWeeksFromEmployer,
  REDUNDANCY_WEEKLY_PAY_CAP,
  REDUNDANCY_MAX_YEARS,
  type StampDutyBand,
} from "./uk-tax-helpers";

const RATES_AS_OF = "6 April 2026 (tax year 2026/27)";

/** Walks the same banded-rate logic as bandedPropertyTax(), but returns a row per band
 *  instead of just the total — so the property-tax calculators can show exactly which
 *  slice of the price was taxed at which rate, instead of a single opaque total. */
function sdltBandRows(price: number, bands: StampDutyBand[], surchargePercent = 0): string[][] {
  const rows: string[][] = [];
  let lower = 0;
  for (const b of bands) {
    if (price > lower) {
      const amountInBand = Math.min(price, b.upTo) - lower;
      const effectiveRate = b.rate + surchargePercent / 100;
      const taxInBand = amountInBand * effectiveRate;
      rows.push([
        b.upTo === Infinity ? `Above ${fmtCurrency(lower, "GBP", 0)}` : `${fmtCurrency(lower, "GBP", 0)} – ${fmtCurrency(b.upTo, "GBP", 0)}`,
        `${fmtNumber(effectiveRate * 100, 1)}%`,
        fmtCurrency(amountInBand, "GBP", 0),
        fmtCurrency(taxInBand, "GBP", 0),
      ]);
    }
    lower = b.upTo;
    if (price <= b.upTo) break;
  }
  return rows;
}

const uk: CalculatorDefinition[] = [
  {
    slug: "uk-notice-period-calculator",
    title: "UK Notice Period Calculator",
    category: "financial",
    shortDescription: "Find the statutory minimum notice period and compare it to a contractual one.",
    seoDescription: "Calculate the UK statutory minimum notice period an employer or employee must give, and compare it against a contractual notice period.",
    formulaSummary: "Employer→employee: 1 week per year of service (capped at 12). Employee→employer: 1 week flat.",
    jurisdiction: "UK",
    ratesAsOf: RATES_AS_OF,
    fields: [
      { name: "direction", label: "Notice From", type: "select", defaultValue: "employer", options: [
        { value: "employer", label: "Employer to employee" },
        { value: "employee", label: "Employee to employer" },
      ] },
      { name: "yearsOfService", label: "Length of Continuous Service", type: "number", unit: "years", defaultValue: 4, min: 0, step: 0.25 },
      { name: "contractualWeeks", label: "Contractual Notice (if any)", type: "number", unit: "weeks", defaultValue: 4, min: 0 },
    ],
    calculate: (i) => {
      const years = n(i.yearsOfService, 4);
      const statutory = i.direction === "employee" ? (years < 1 / 12 ? 0 : 1) : statutoryNoticeWeeksFromEmployer(years);
      const contractual = n(i.contractualWeeks);
      const applicable = Math.max(statutory, contractual);
      return {
        results: [
          { label: "Notice Period That Applies", value: `${fmtNumber(applicable, 1)} weeks`, emphasis: true },
          { label: "Statutory Minimum", value: `${fmtNumber(statutory, 1)} weeks` },
          { label: "Contractual Notice Entered", value: `${fmtNumber(contractual, 1)} weeks` },
        ],
        notes: [
          "Whichever is longer — statutory or contractual — is what legally applies. Statutory minimums come from the Employment Rights Act 1996 s.86.",
          "This is general guidance, not legal advice — some contracts or circumstances (gross misconduct, etc.) change what applies.",
        ],
        compare: [
          { label: "Statutory Minimum", value: statutory, displayValue: `${fmtNumber(statutory, 1)} weeks`, highlight: statutory >= contractual },
          { label: "Contractual Notice", value: contractual, displayValue: `${fmtNumber(contractual, 1)} weeks`, highlight: contractual > statutory },
        ],
        chartCaption:
          statutory === contractual
            ? `Statutory and contractual notice happen to match at ${fmtNumber(applicable, 1)} weeks — that's what applies.`
            : statutory > contractual
              ? `The statutory minimum (${fmtNumber(statutory, 1)} weeks) beats the contractual figure entered (${fmtNumber(contractual, 1)} weeks) — the law sets a floor the contract can't undercut.`
              : `The contractual notice entered (${fmtNumber(contractual, 1)} weeks) is more generous than the statutory minimum (${fmtNumber(statutory, 1)} weeks), so the contract is what applies.`,
      };
    },
    relatedSlugs: ["uk-redundancy-pay-calculator"],
    content: {
      intro: [
        "Notice periods come up at two very different moments, and this calculator handles both: an employer working out what they're obliged to give someone whose role is ending, and an employee checking what they owe before handing in their resignation. Either way, the question is the same — what's the legal floor, and does the contract actually beat it?",
        "UK law sets a statutory minimum notice period under the Employment Rights Act 1996, but it isn't the same for both directions, and it isn't fixed — it scales with how long someone's been continuously employed. A contract can promise more than the statutory minimum, but it can never promise less; whichever number is longer is the one that legally applies.",
        "Because this is often checked in the middle of a resignation or a difficult redundancy conversation, everything you enter — years of service, whether it's your notice or theirs — stays in the browser. Nothing is saved or sent anywhere, so you can work out where you stand before you've said anything to anyone.",
      ],
      howItWorks: [
        "When an employer is giving notice to an employee, the statutory minimum is one week for each full year of continuous service, up to a cap of 12 weeks after 12 years or more — so someone with 3 years' service is owed at least 3 weeks, but someone with 20 years is still only owed 12.",
        "When an employee is giving notice to an employer, the statutory minimum is a flat one week, regardless of how long they've worked there — as long as they've been employed for at least one month. Under one month's service, there's no statutory minimum notice at all.",
        "Whichever figure — statutory or contractual — comes out higher is what actually applies, because a contract is legally allowed to improve on the statutory floor but never allowed to undercut it. That's why this calculator asks for the contractual notice too and compares the two directly.",
      ],
      faq: [
        {
          q: "How much notice does my employer legally have to give me?",
          a: "At minimum, one week for each full year of continuous service, capped at 12 weeks once you've worked there 12 years or more. Your contract may specify a longer notice period, in which case the longer figure is the one that applies.",
        },
        {
          q: "Do I have to give my employer more than a week's notice?",
          a: "The statutory minimum for an employee resigning is just one week, once you've been there over a month. Many contracts require more — a month is common for professional roles — and if yours does, that contractual figure is what you're bound by, not the one-week statutory floor.",
        },
        {
          q: "What notice period applies if my contract doesn't mention one?",
          a: "The statutory minimum applies by default whenever a contract is silent on notice, or whenever the contract tries to specify less than the statutory minimum — the law sets a floor no agreement can go under.",
        },
        {
          q: "Does my notice period increase every year I stay at the same job?",
          a: "Yes, on the employer-to-employee side — it rises by a week for every additional full year of continuous service, until it hits the 12-week cap. It doesn't increase further no matter how many additional years you work after that.",
        },
        {
          q: "Can my employer make me leave immediately and pay me instead of working my notice?",
          a: "Yes, if your contract includes a payment in lieu of notice (PILON) clause, or if you both agree to it. You're still entitled to be paid for the notice period either way — the difference is whether you work it or receive the equivalent pay instead.",
        },
      ],
    },
  },
  {
    slug: "uk-redundancy-pay-calculator",
    title: "UK Statutory Redundancy Pay Calculator",
    category: "financial",
    shortDescription: "Calculate your UK statutory redundancy payment from age, service and weekly pay.",
    seoDescription: "Calculate UK statutory redundancy pay using the age-banded formula (0.5/1/1.5 weeks per year of service), the current weekly pay cap, and the 20-year service cap.",
    formulaSummary: "Weeks banded by age each year of service (under 22: 0.5, 22–40: 1, 41+: 1.5) × capped weekly pay",
    jurisdiction: "UK",
    ratesAsOf: RATES_AS_OF,
    fields: [
      { name: "age", label: "Current Age", type: "number", defaultValue: 45, min: 16, max: 75 },
      { name: "yearsOfService", label: "Full Years of Continuous Service", type: "number", defaultValue: 12, min: 0, max: 40, step: 1 },
      { name: "weeklyPay", label: "Gross Weekly Pay", type: "number", unit: "£", defaultValue: 600, min: 0 },
    ],
    calculate: (i) => {
      const age = n(i.age, 45);
      const years = n(i.yearsOfService, 12);
      if (years < 2) {
        return {
          results: [{ label: "Statutory Redundancy Pay", value: "£0", emphasis: true }],
          notes: ["You need at least 2 full years of continuous service to qualify for statutory redundancy pay."],
        };
      }
      const weeklyPayCapped = Math.min(n(i.weeklyPay, 600), REDUNDANCY_WEEKLY_PAY_CAP);
      const weeks = redundancyWeeks(age, years);
      const payout = weeks * weeklyPayCapped;

      // Re-walk the same age-banding the payout is built from, just to split it into
      // segments for the chart — the math here mirrors redundancyWeeks() exactly.
      const cappedYears = Math.min(REDUNDANCY_MAX_YEARS, Math.floor(years));
      let under22Years = 0, midYears = 0, olderYears = 0;
      for (let k = 1; k <= cappedYears; k++) {
        const ageInThatYear = age - (cappedYears - k);
        if (ageInThatYear < 22) under22Years++;
        else if (ageInThatYear <= 40) midYears++;
        else olderYears++;
      }
      const olderValue = olderYears * 1.5 * weeklyPayCapped;
      const midValue = midYears * 1 * weeklyPayCapped;
      const under22Value = under22Years * 0.5 * weeklyPayCapped;

      return {
        results: [
          { label: "Statutory Redundancy Pay", value: fmtCurrency(payout, "GBP"), emphasis: true },
          { label: "Weeks' Pay Owed", value: fmtNumber(weeks, 1) },
          { label: "Weekly Pay Used (capped)", value: fmtCurrency(weeklyPayCapped, "GBP") },
        ],
        notes: [
          `Weekly pay is capped at £${REDUNDANCY_WEEKLY_PAY_CAP} regardless of your actual earnings — this cap is reviewed every 6 April.`,
          "Years of service beyond 20 don't count further. This is the statutory floor — your employer's contractual/enhanced redundancy scheme, if they have one, may pay more.",
          "Each year of service is banded by your age during that year, not just your current age, matching how GOV.UK calculates it.",
        ],
        breakdown: [
          { label: "Service at age 41+ (1.5 wks/yr)", value: olderValue, displayValue: fmtCurrency(olderValue, "GBP") },
          { label: "Service age 22–40 (1 wk/yr)", value: midValue, displayValue: fmtCurrency(midValue, "GBP") },
          { label: "Service under 22 (0.5 wks/yr)", value: under22Value, displayValue: fmtCurrency(under22Value, "GBP") },
        ].filter((seg) => seg.value > 0),
        chartCaption: `Your ${fmtNumber(weeks, 1)}-week payout is built year by year — each year of service earns more weeks' pay the older you were during that particular year, so later years of a long career count for more than early ones.`,
      };
    },
    relatedSlugs: ["uk-notice-period-calculator"],
    content: {
      intro: [
        "This one gets used at a specific, unpleasant moment: HR or a manager has just said the word 'redundancy', and before any meeting or letter arrives, you want to know roughly what you're owed. Statutory redundancy pay isn't a flat figure — it depends on your age, your length of service, and your weekly pay, banded together in a way that isn't obvious from a payslip.",
        "The formula rewards long service more heavily the older you were during each year of it, which is why two people with the same total years can end up with quite different payouts. This calculator walks through the age-banding year by year rather than just applying one multiplier to your whole service history, so the number matches what GOV.UK's own calculator would produce.",
        "Redundancy conversations are stressful enough without creating a paper trail before anything is confirmed. Your age, salary and service history stay in the browser — nothing is saved, logged, or sent anywhere, so you can find out where you stand before you've told anyone you're checking.",
      ],
      howItWorks: [
        "Every full year of continuous service earns a number of weeks' pay that depends on how old you were during that particular year, not your age now: under 22 earns half a week per year, 22 to 40 earns one week per year, and 41 or older earns one and a half weeks per year. A 20-year career is walked backward year by year, so a long-serving employee's earliest years (when they were younger) are banded differently from their most recent ones.",
        "Only the most recent 20 years of continuous service count — anything before that is ignored entirely, however long the full career actually was.",
        "The weekly pay used in the calculation is capped at a government-set maximum that's reviewed every 6 April, regardless of what you actually earn — so a well-paid employee's payout is based on the capped figure, not their real weekly wage, once they're above it.",
        "You need at least two full years of continuous service to qualify for statutory redundancy pay at all — under that, the statutory entitlement is zero, whatever your age or pay.",
      ],
      faq: [
        {
          q: "How is statutory redundancy pay calculated in the UK?",
          a: "It's built from weeks' pay per year of continuous service, with the number of weeks per year set by how old you were during that specific year (rising at 22 and again at 41), multiplied by your weekly pay up to a capped maximum, using at most the most recent 20 years of service.",
        },
        {
          q: "Is there a cap on weekly pay for redundancy purposes?",
          a: "Yes — the government sets a maximum weekly pay figure used in the calculation, reviewed every 6 April, and your actual weekly earnings above that cap simply aren't counted, however much more you actually earn.",
        },
        {
          q: "Do all my years of service count, even from decades ago?",
          a: "Only the most recent 20 years of continuous service are used in the statutory formula — years before that are excluded, even for a very long career at the same employer.",
        },
        {
          q: "Is statutory redundancy pay taxed?",
          a: "Statutory redundancy pay is tax-free up to a set threshold (most people's statutory entitlement falls well within it), though any separate contractual/enhanced redundancy payment on top may be taxed differently — check with the specific scheme.",
        },
        {
          q: "What if my employer offers more than the statutory minimum?",
          a: "Many employers run an enhanced or contractual redundancy scheme that pays more than the statutory floor — this calculator only shows the legal minimum you're entitled to regardless of what any individual employer chooses to offer on top.",
        },
        {
          q: "Do I qualify for statutory redundancy pay at all?",
          a: "You generally need at least two full years of continuous service with the employer making you redundant; under two years, there's no statutory redundancy entitlement even if the role is genuinely redundant.",
        },
      ],
    },
  },
  {
    slug: "umbrella-vs-limited-company-calculator",
    title: "Umbrella vs. Limited Company Take-Home Calculator",
    category: "financial",
    shortDescription: "Compare your net take-home pay contracting via an umbrella company vs. your own limited company.",
    seoDescription: "Compare UK contractor take-home pay between an umbrella company (PAYE, Employer's NI, Apprenticeship Levy, margin) and a limited company (Corporation Tax, salary/dividend split).",
    formulaSummary: "Umbrella: assignment income minus levy, margin, Employer's NI, then income tax + employee NI. Ltd: revenue minus expenses/salary/Employer's NI, Corporation Tax on profit, dividend tax on distributions.",
    jurisdiction: "UK",
    ratesAsOf: RATES_AS_OF,
    fields: [
      { name: "rateType", label: "Rate Type", type: "select", defaultValue: "daily", options: [{ value: "daily", label: "Day rate" }, { value: "hourly", label: "Hourly rate" }] },
      { name: "rate", label: "Rate", type: "number", unit: "£", defaultValue: 450, min: 0 },
      { name: "unitsPerWeek", label: "Days/Hours Worked Per Week", type: "number", defaultValue: 5, min: 1, max: 80 },
      { name: "weeksPerYear", label: "Weeks Worked Per Year", type: "number", defaultValue: 46, min: 1, max: 52, help: "Most contractors use ~46–48 to allow for holiday and gaps between contracts" },
      { name: "ir35Status", label: "IR35 Status (as you understand it)", type: "select", defaultValue: "outside", options: [{ value: "outside", label: "Outside IR35" }, { value: "inside", label: "Inside IR35" }] },
      { name: "umbrellaMarginWeekly", label: "Umbrella Margin", type: "number", unit: "£/week", defaultValue: 25, min: 0 },
      { name: "ltdSalary", label: "Ltd Company Director's Salary", type: "number", unit: "£/year", defaultValue: 12570, min: 0 },
      { name: "ltdAccountancyMonthly", label: "Ltd Company Accountancy Fee", type: "number", unit: "£/month", defaultValue: 100, min: 0 },
    ],
    calculate: (i) => {
      const rate = n(i.rate, 450);
      const units = n(i.unitsPerWeek, 5);
      const weeks = n(i.weeksPerYear, 46);
      const assignmentIncome = rate * units * weeks;

      // --- Umbrella route ---
      const marginAnnual = n(i.umbrellaMarginWeekly, 25) * weeks;
      const apprenticeshipLevy = 0.005 * assignmentIncome;
      const umbrellaEmployerNI = employerNI(assignmentIncome - marginAnnual - apprenticeshipLevy);
      const umbrellaGrossTaxablePay = Math.max(0, assignmentIncome - marginAnnual - apprenticeshipLevy - umbrellaEmployerNI);
      const umbrellaIncomeTax = incomeTax(umbrellaGrossTaxablePay);
      const umbrellaNI = employeeNI(umbrellaGrossTaxablePay);
      const umbrellaTakeHome = umbrellaGrossTaxablePay - umbrellaIncomeTax - umbrellaNI;

      // --- Limited company route ---
      const ltdSalary = n(i.ltdSalary, 12570);
      const ltdExpenses = n(i.ltdAccountancyMonthly, 100) * 12;
      const ltdEmployerNI = employerNI(ltdSalary);
      const profitBeforeTax = Math.max(0, assignmentIncome - ltdExpenses - ltdSalary - ltdEmployerNI);
      const corpTax = corporationTax(profitBeforeTax);
      const dividendsAvailable = Math.max(0, profitBeforeTax - corpTax);
      const salaryIncomeTax = incomeTax(ltdSalary);
      const salaryNI = employeeNI(ltdSalary);
      const divTax = dividendTax(dividendsAvailable, ltdSalary);
      const ltdTakeHome = ltdSalary - salaryIncomeTax - salaryNI + dividendsAvailable - divTax;

      const results = [
        { label: "Umbrella — Annual Take-Home", value: fmtCurrency(umbrellaTakeHome, "GBP"), emphasis: true },
        { label: "Limited Company — Annual Take-Home", value: fmtCurrency(ltdTakeHome, "GBP"), emphasis: true },
        { label: "Difference", value: fmtCurrency(Math.abs(ltdTakeHome - umbrellaTakeHome), "GBP") },
        { label: "Umbrella — Employer's NI + Levy + Margin Deducted", value: fmtCurrency(umbrellaEmployerNI + apprenticeshipLevy + marginAnnual, "GBP") },
        { label: "Ltd — Corporation Tax + Employer's NI", value: fmtCurrency(corpTax + ltdEmployerNI, "GBP") },
      ];
      const notes = [
        "This is an illustrative estimate, not tax advice — real umbrella payslips and accountant fee structures vary.",
        i.ir35Status === "inside"
          ? "You've selected 'inside IR35' — if this engagement is genuinely inside IR35, the limited-company route loses most of its tax advantage in practice (the fee-payer must deduct tax/NI similarly to employment), so umbrella is usually simpler with a similar real-world outcome. This calculator still shows the raw Ltd company numbers assuming full dividend extraction, which overstates the Ltd advantage for a genuinely inside-IR35 contract."
          : "Outside-IR35 comparison shown — this is where the limited company route's tax efficiency genuinely applies.",
        "We don't determine your IR35 status — see the IR35 Factors Checklist for the main factors, and get a professional assessment for a real engagement.",
      ];
      const compare = [
        { label: "Umbrella — Annual Take-Home", value: umbrellaTakeHome, displayValue: fmtCurrency(umbrellaTakeHome, "GBP"), highlight: umbrellaTakeHome >= ltdTakeHome },
        { label: "Limited Company — Annual Take-Home", value: ltdTakeHome, displayValue: fmtCurrency(ltdTakeHome, "GBP"), highlight: ltdTakeHome > umbrellaTakeHome },
      ];
      const better = ltdTakeHome > umbrellaTakeHome ? "Limited Company" : umbrellaTakeHome > ltdTakeHome ? "Umbrella" : null;
      const chartCaption = better
        ? `On these numbers, ${better} leaves you with ${fmtCurrency(Math.abs(ltdTakeHome - umbrellaTakeHome), "GBP")} more in your pocket each year — but see the IR35 note above before treating that gap as guaranteed.`
        : "Both routes land on essentially the same annual take-home for these numbers.";
      return { results, notes, compare, chartCaption };
    },
    relatedSlugs: ["ir35-factors-checklist", "salary-calculator"],
    content: {
      intro: [
        "This is the calculator contractors reach for right before signing an umbrella company registration or setting up a limited company — the decision that shapes every payslip afterward. The two routes tax the same day rate completely differently: an umbrella company runs you through PAYE with Employer's National Insurance and a weekly margin taken off the top, while a limited company lets you take a small salary and the rest as dividends, taxed under a different set of rules entirely.",
        "The gap between the two can be a few thousand pounds a year or barely anything at all, depending heavily on your rate, how many weeks you actually work, and — critically — your IR35 status on the specific engagement. This tool runs both routes side by side on your actual numbers instead of a generic rule of thumb like 'limited company is always better'.",
        "Contract rates and take-home pay are sensitive numbers you're often comparing before you've committed to either route. Everything you enter runs in your browser only — nothing is saved or sent anywhere, so you can model both options honestly before telling an umbrella provider or an accountant anything.",
      ],
      howItWorks: [
        "Umbrella route: your day/hour rate is first reduced by the umbrella's weekly margin and the 0.5% Apprenticeship Levy, then Employer's National Insurance is deducted from what's left (the umbrella technically pays this as your employer, but it comes out of your assignment rate either way). What remains is your gross taxable pay, which then goes through ordinary Income Tax bands and employee National Insurance — the same as any employee.",
        "Limited company route: your company pays a modest director's salary (commonly set near the Income Tax personal allowance, since salary attracts Employer's NI once it clears a low secondary threshold), deducts allowable expenses and Employer's NI on that salary, then pays Corporation Tax on whatever profit is left. What survives Corporation Tax can be distributed as dividends, which are taxed separately from salary — at lower rates, but stacked on top of your salary income to work out which dividend tax band applies.",
        "Corporation Tax itself isn't a single flat rate: profits up to £50,000 pay the small-profits rate, profits above £250,000 pay the main rate, and profits in between get marginal relief that tapers smoothly from one to the other, so the effective rate rises gradually through that middle band rather than jumping at a cliff-edge.",
        "IR35 status changes everything: this comparison assumes a genuinely outside-IR35 limited company can fully use the salary/dividend split. If an engagement is actually inside IR35, the fee-payer must deduct tax and NI at source similarly to employment, which erases most of the limited company's tax advantage in practice — the raw numbers shown here would then overstate what a real inside-IR35 limited company contract actually nets.",
      ],
      faq: [
        {
          q: "Is a limited company always more tax-efficient than an umbrella company?",
          a: "Usually only if the engagement is genuinely outside IR35 — that's what lets you take most of your income as dividends taxed at lower rates than salary. Inside IR35, tax is deducted at source in a way that closely mirrors employment, so the limited company advantage mostly disappears.",
        },
        {
          q: "Why does the umbrella company deduct Employer's National Insurance from my pay?",
          a: "Because the umbrella company is legally your employer and Employer's NI is its cost to bear — but since umbrella companies aren't otherwise profiting from your assignment rate, that cost is effectively funded from the rate the client is paying for your work, so it reduces what reaches you.",
        },
        {
          q: "What salary should I pay myself through a limited company?",
          a: "Many contractors set it near the Income Tax personal allowance — high enough to build National Insurance contribution record, but low enough to minimise Employer's and employee NI, with the rest of their income taken as dividends. This is a general pattern, not personal advice — an accountant can confirm what fits your situation.",
        },
        {
          q: "How is dividend tax different from Income Tax on salary?",
          a: "Dividends have their own separate rate bands, generally lower than equivalent Income Tax rates, but they still stack on top of your other income to determine which dividend band applies — plus dividends carry no National Insurance at all, unlike salary.",
        },
        {
          q: "What does 'inside IR35' actually mean for my take-home pay?",
          a: "It means HMRC (or the fee-payer, under current off-payroll working rules) treats the engagement as employment for tax purposes, so tax and NI are deducted from your limited company's income much as they would be under PAYE, regardless of how you structure salary and dividends afterward.",
        },
        {
          q: "Does this calculator tell me if I'm inside or outside IR35?",
          a: "No — that determination depends on the specific working practices of the engagement, not on the umbrella-vs-limited-company comparison itself. Use the IR35 Factors Checklist to walk through the main factors, and get a professional assessment for a real contract.",
        },
      ],
    },
  },
  {
    slug: "ir35-factors-checklist",
    title: "IR35 Factors Checklist",
    category: "financial",
    shortDescription: "Walk through the main factors that determine IR35 status — an educational guide, not a determination.",
    seoDescription: "A guided walkthrough of the main factors HMRC and tribunals weigh for IR35 status — control, substitution, mutuality of obligation and more — for education, not a legal determination.",
    formulaSummary: "Weighted indicative lean across the recognized case-law factors — not a formula, not a determination",
    jurisdiction: "UK",
    ratesAsOf: RATES_AS_OF,
    fields: [
      { name: "control", label: "Does the client control HOW, WHEN and WHERE you do the work, in detail?", type: "select", defaultValue: "no", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "substitution", label: "Could you send a genuine substitute, without the client needing to approve them beyond reasonable checks?", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "mutuality", label: "Is the client obliged to keep offering work, and are you obliged to accept it, beyond the current agreed work?", type: "select", defaultValue: "no", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "financialRisk", label: "Do you bear financial risk — e.g. fixing mistakes at your own cost, or quoting a fixed price?", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "equipment", label: "Do you provide your own major equipment or tools for this work?", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "integration", label: "Are you integrated into the client's organisation — e.g. line-managed, on their org chart, using their email signature?", type: "select", defaultValue: "no", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
      { name: "multipleClients", label: "Do you work for multiple clients concurrently and market your services generally?", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "partial", label: "Partially" }, { value: "no", label: "No" }] },
    ],
    calculate: (i) => {
      const weight = (v: string) => (v === "yes" ? 1 : v === "partial" ? 0.5 : 0);
      // Positive score leans "outside" IR35; negative leans "inside".
      const score =
        weight(i.substitution) + weight(i.financialRisk) + weight(i.equipment) + weight(i.multipleClients) -
        (weight(i.control) + weight(i.mutuality) + weight(i.integration));
      let lean = "Borderline — factors are mixed";
      if (score >= 2) lean = "Leans outside IR35";
      else if (score <= -2) lean = "Leans inside IR35";
      return {
        results: [{ label: "Indicative Lean", value: lean, emphasis: true }, { label: "Factor Score", value: fmtNumber(score, 1) }],
        notes: [
          "This is an educational guide to the main factors HMRC and tribunals weigh (control, substitution, mutuality of obligation, financial risk, equipment, integration, and working for multiple clients) — it is NOT a status determination.",
          "No online tool — including this one and HMRC's own CEST tool — can give a legally binding answer. CEST itself has been widely criticized by tax and legal commentators as oversimplified.",
          "For a real engagement, use HMRC's CEST tool as a starting point and get a professional IR35 assessment — the financial consequences of getting this wrong (unpaid tax, NI, penalties) can be significant.",
        ],
        gauge: {
          value: score,
          min: -3,
          max: 4,
          valueLabel: fmtNumber(score, 1),
          zones: [
            { label: "Leans inside IR35", to: -2, barClass: "bg-rose-400 dark:bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
            { label: "Borderline", to: 2, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Leans outside IR35", to: 4, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
          ],
        },
        chartCaption: `Your answers score ${fmtNumber(score, 1)} on a scale from -3 (strongly employee-like) to +4 (strongly self-employed-like) — landing in the "${lean.replace("Leans ", "").replace(" — factors are mixed", "")}" zone.`,
      };
    },
    relatedSlugs: ["umbrella-vs-limited-company-calculator"],
    content: {
      intro: [
        "Contractors reach for this before agreeing a new engagement, or when a client's working practices have changed enough that last year's assumptions no longer feel safe. IR35 status isn't decided by a single question — it's built from a handful of factors that HMRC and employment tribunals have weighed in case after case, and this walkthrough puts the main ones in front of you in plain language instead of legal phrasing.",
        "None of the individual factors is decisive on its own; what matters is the overall picture they build together, which is exactly why HMRC's own CEST tool and this checklist both work by combining several answers rather than asking one yes/no question. This tool gives you an indicative lean, not a verdict — think of it as a way to spot which factors are working against you before you commit to a contract structure.",
        "IR35 status touches genuinely sensitive territory — your working relationship with a specific client, named or not. Every answer you give here stays in your browser only; nothing is submitted, logged, or tied to an account, so you can think through your actual working practices honestly.",
      ],
      howItWorks: [
        "The factors fall into two groups. Employee-like indicators (working under detailed client control, being obliged to accept ongoing work with no genuine right of refusal, and being integrated into the client's organisation as if you were staff) push toward 'inside IR35'. Self-employed-like indicators (a genuine, unrestricted right of substitution, bearing real financial risk, providing your own equipment, and working for multiple clients concurrently) push toward 'outside IR35'.",
        "This checklist weights your answers across those factors and produces an indicative lean rather than a score with legal meaning — case law has repeatedly shown that these factors are weighed together and in context, not simply added up, so a strong showing on one factor can be outweighed by a weak one elsewhere.",
        "Mutuality of obligation and control are generally treated as the two factors courts return to most often, but substitution rights have also proven decisive in several leading cases — which is part of why no automated tool, including HMRC's own CEST, can turn this into a guaranteed answer.",
      ],
      faq: [
        {
          q: "What is IR35 and who does it affect?",
          a: "IR35 is UK tax legislation aimed at contractors who work through their own limited company but whose actual working relationship with the client resembles employment. If an engagement is caught by it, income from that engagement is taxed broadly as if it were employment income, rather than benefiting from the salary/dividend structure of a limited company.",
        },
        {
          q: "What's the single biggest factor in determining IR35 status?",
          a: "There isn't one — tribunals have repeatedly stressed that no single factor is decisive on its own. Control, substitution, and mutuality of obligation tend to carry the most weight, but the full working picture, taken together, is what actually determines status.",
        },
        {
          q: "Who decides my IR35 status — me, my client, or HMRC?",
          a: "Under current off-payroll working rules, medium and large private-sector clients (and all public-sector clients) are generally responsible for determining status and issuing a Status Determination Statement; for engagements with small private-sector clients, the contractor's own limited company typically remains responsible.",
        },
        {
          q: "Is HMRC's CEST tool reliable?",
          a: "CEST is HMRC's own tool and its outcome is generally accepted by HMRC where the questions are answered accurately, but it has been widely criticised by tax professionals and tribunals for oversimplifying factors like mutuality of obligation. It's a reasonable starting point, not a substitute for a full assessment on a complex engagement.",
        },
        {
          q: "Can I be inside IR35 on one contract and outside on another?",
          a: "Yes — IR35 status is assessed per engagement, based on that specific contract's terms and actual working practices, not as a general label attached to you or your company. The same contractor can be outside IR35 on one client's terms and inside on another's.",
        },
        {
          q: "What happens if I get my IR35 status wrong?",
          a: "If HMRC later determines an engagement should have been treated as inside IR35 and wasn't, the consequences can include backdated tax and National Insurance, interest, and penalties — which is why a borderline result here is worth following up with a professional assessment before signing.",
        },
      ],
    },
  },
  {
    slug: "uk-stamp-duty-calculator",
    title: "UK Stamp Duty Calculator (England, Scotland, Wales)",
    category: "financial",
    shortDescription: "Calculate Stamp Duty (SDLT), LBTT or LTT for a property purchase in England/NI, Scotland or Wales.",
    seoDescription: "Calculate property transaction tax for England/Northern Ireland (SDLT), Scotland (LBTT) or Wales (LTT), with first-time-buyer relief and additional-property surcharges.",
    formulaSummary: "Banded rates by region, with first-time-buyer relief and additional-property surcharges",
    jurisdiction: "UK",
    ratesAsOf: RATES_AS_OF,
    fields: [
      { name: "region", label: "Region", type: "select", defaultValue: "england", options: [
        { value: "england", label: "England / Northern Ireland (SDLT)" },
        { value: "scotland", label: "Scotland (LBTT)" },
        { value: "wales", label: "Wales (LTT)" },
      ] },
      { name: "price", label: "Purchase Price", type: "number", unit: "£", defaultValue: 350000, min: 0 },
      { name: "buyerType", label: "Buyer Type", type: "select", defaultValue: "standard", options: [
        { value: "standard", label: "Standard (moving home)" },
        { value: "firstTimeBuyer", label: "First-time buyer" },
        { value: "additionalProperty", label: "Additional property (second home / buy-to-let)" },
      ] },
      { name: "nonUkResident", label: "Non-UK resident surcharge (England/NI only)", type: "select", defaultValue: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }], showIf: (i) => i.region === "england" },
    ],
    calculate: (i) => {
      const price = n(i.price, 350000);
      const isFTB = i.buyerType === "firstTimeBuyer";
      const isAdditional = i.buyerType === "additionalProperty";

      if (i.region === "scotland") {
        const nilBand = isFTB ? 175000 : 145000;
        const bands = [
          { upTo: nilBand, rate: 0 },
          { upTo: 250000, rate: 0.02 },
          { upTo: 325000, rate: 0.05 },
          { upTo: 750000, rate: 0.1 },
          { upTo: Infinity, rate: 0.12 },
        ];
        const tax = bandedPropertyTax(price, bands, isAdditional ? 8 : 0);
        return {
          results: [{ label: "Land and Buildings Transaction Tax (LBTT)", value: fmtCurrency(tax, "GBP"), emphasis: true }],
          notes: [isAdditional ? "Includes the 8% Additional Dwelling Supplement (ADS)." : "", isFTB ? "Includes first-time buyer relief (nil band raised to £175,000)." : ""].filter(Boolean),
          table: { headers: ["Price Band", "Rate", "Amount in Band", "Tax in Band"], rows: sdltBandRows(price, bands, isAdditional ? 8 : 0) },
          chartCaption: `LBTT is banded like income tax — only the slice of the price inside each band is taxed at that band's rate, so ${fmtCurrency(tax, "GBP", 0)} works out to about ${fmtNumber((tax / Math.max(1, price)) * 100, 1)}% of the full price, not the top band's rate.`,
        };
      }

      if (i.region === "wales") {
        const bands = [
          { upTo: 225000, rate: 0 },
          { upTo: 400000, rate: 0.06 },
          { upTo: 750000, rate: 0.075 },
          { upTo: 1500000, rate: 0.1 },
          { upTo: Infinity, rate: 0.12 },
        ];
        const tax = bandedPropertyTax(price, bands, isAdditional ? 4 : 0);
        return {
          results: [{ label: "Land Transaction Tax (LTT)", value: fmtCurrency(tax, "GBP"), emphasis: true }],
          notes: [
            "Wales has no separate first-time-buyer relief — the standard nil band already covers most starter purchases.",
            isAdditional ? "Additional-property surcharge shown as an approximate +4 percentage points — verify the exact current higher-rate bands at gov.wales before relying on this for a purchase decision." : "",
          ].filter(Boolean),
          table: { headers: ["Price Band", "Rate", "Amount in Band", "Tax in Band"], rows: sdltBandRows(price, bands, isAdditional ? 4 : 0) },
          chartCaption: `LTT is banded like income tax — only the slice of the price inside each band is taxed at that band's rate, so ${fmtCurrency(tax, "GBP", 0)} works out to about ${fmtNumber((tax / Math.max(1, price)) * 100, 1)}% of the full price, not the top band's rate.`,
        };
      }

      // England / Northern Ireland (SDLT)
      let bands;
      if (isFTB && price <= 500000) {
        bands = [
          { upTo: 300000, rate: 0 },
          { upTo: 500000, rate: 0.05 },
          { upTo: 925000, rate: 0.05 },
          { upTo: 1500000, rate: 0.1 },
          { upTo: Infinity, rate: 0.12 },
        ];
      } else {
        bands = [
          { upTo: 125000, rate: 0 },
          { upTo: 250000, rate: 0.02 },
          { upTo: 925000, rate: 0.05 },
          { upTo: 1500000, rate: 0.1 },
          { upTo: Infinity, rate: 0.12 },
        ];
      }
      const surcharge = (isAdditional ? 5 : 0) + (i.nonUkResident === "yes" ? 2 : 0);
      const tax = bandedPropertyTax(price, bands, surcharge);
      return {
        results: [{ label: "Stamp Duty Land Tax (SDLT)", value: fmtCurrency(tax, "GBP"), emphasis: true }],
        notes: [
          isFTB ? (price <= 500000 ? "First-time buyer relief applied (0% up to £300,000)." : "Purchase price is above £500,000 — first-time buyer relief doesn't apply, standard rates used.") : "",
          isAdditional ? "Includes the 5% additional-property surcharge." : "",
          i.nonUkResident === "yes" ? "Includes the 2% non-UK-resident surcharge." : "",
        ].filter(Boolean),
        table: { headers: ["Price Band", "Rate", "Amount in Band", "Tax in Band"], rows: sdltBandRows(price, bands, surcharge) },
        chartCaption: `SDLT is banded like income tax — only the slice of the price inside each band is taxed at that band's rate, so ${fmtCurrency(tax, "GBP", 0)} works out to about ${fmtNumber((tax / Math.max(1, price)) * 100, 1)}% of the full price, not the top band's rate.`,
      };
    },
    relatedSlugs: ["mortgage-calculator-uk", "mortgage-calculator"],
    content: {
      intro: [
        "This is the number that lands right before you make an offer — the tax bill on top of the purchase price that isn't part of the mortgage and has to be found in cash. England and Northern Ireland call it Stamp Duty Land Tax, Scotland calls it Land and Buildings Transaction Tax, and Wales calls it Land Transaction Tax; all three tax the same kind of purchase but with different bands, different thresholds, and different relief rules, so a price that's affordable in one nation's tax regime can land quite differently in another's.",
        "First-time buyers and people buying an additional property (a second home or a buy-to-let) are treated very differently from someone simply moving house, and non-UK residents face a further surcharge in England — this calculator walks through whichever combination applies to you rather than showing one generic rate.",
        "A property price and purchase type can say a lot about your finances before an offer is even accepted. Nothing entered here — the price, the region, whether it's a first home or an additional property — is sent anywhere or saved; it's calculated entirely in your browser so you can work out the real cost before you've told an estate agent or a lender anything.",
      ],
      howItWorks: [
        "All three taxes — SDLT, LBTT and LTT — work as banded, progressive taxes on the purchase price, the same structural idea as Income Tax: each slice of the price that falls within a band is taxed at that band's rate, and only the portion above a threshold moves into the next, higher-rate band. A price that pushes into a higher band doesn't get taxed entirely at that top rate — only the excess above the threshold does.",
        "First-time buyer relief raises the nil-rate starting band in England/NI and Scotland, so a genuine first-time buyer pays nothing on a larger slice of the price than someone who's owned property before — though in England this relief only applies up to a price ceiling, above which standard rates apply to the whole purchase. Wales doesn't operate a separate first-time-buyer relief; its standard nil band is simply set to cover most starter purchases already.",
        "Buying an additional property — a second home, holiday home, or buy-to-let — adds a surcharge on top of the standard band rates in all three nations, applied as extra percentage points across every band rather than just the top one. England also adds a separate surcharge for non-UK-resident buyers, which can stack on top of the additional-property surcharge if both apply.",
        "Because the bands and thresholds differ by nation and are set independently by HM Treasury, the Scottish Government and the Welsh Government, the same purchase price can result in three different tax bills depending purely on where in the UK the property sits.",
      ],
      faq: [
        {
          q: "How is Stamp Duty actually calculated — is it one rate on the whole price?",
          a: "No — it's banded like Income Tax. Only the portion of the purchase price that falls inside each band is taxed at that band's rate, so the effective overall rate is always lower than the top band's headline rate, especially for prices only just into a higher band.",
        },
        {
          q: "Do first-time buyers pay less Stamp Duty?",
          a: "In England/NI and Scotland, yes — first-time buyer relief raises the nil-rate threshold, so more of the price is taxed at 0%. In England this relief has a price ceiling above which it stops applying entirely; Wales doesn't run a separate first-time-buyer relief scheme.",
        },
        {
          q: "How much extra do I pay for a second home or buy-to-let?",
          a: "Each nation adds a surcharge — extra percentage points applied across every band, not just the top one — on top of the standard rates for anyone who'll own more than one residential property after completing. The exact surcharge percentage differs by nation.",
        },
        {
          q: "Is property tax the same across England, Scotland, Wales and Northern Ireland?",
          a: "No — England and Northern Ireland share Stamp Duty Land Tax, Scotland has its own Land and Buildings Transaction Tax, and Wales has Land Transaction Tax. Each is set independently with its own bands and thresholds, so identical purchase prices can produce different tax bills depending on the nation.",
        },
        {
          q: "Do non-UK residents pay more Stamp Duty?",
          a: "In England (and Northern Ireland), yes — a non-UK-resident surcharge applies on top of the standard bands, and it can stack with the additional-property surcharge if both apply to the same purchase. Scotland and Wales don't operate an equivalent residency-based surcharge.",
        },
        {
          q: "When does Stamp Duty actually have to be paid?",
          a: "It's due shortly after completion — normally within 14 days in England/NI, and similarly tight windows in Scotland and Wales — and is usually handled by your conveyancing solicitor as part of completion, rather than something you pay directly yourself.",
        },
      ],
    },
  },
];

export default uk;
