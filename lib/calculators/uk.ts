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
} from "./uk-tax-helpers";

const RATES_AS_OF = "6 April 2026 (tax year 2026/27)";

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
      };
    },
    relatedSlugs: ["uk-redundancy-pay-calculator"],
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
      };
    },
    relatedSlugs: ["uk-notice-period-calculator"],
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
      return { results, notes };
    },
    relatedSlugs: ["ir35-factors-checklist", "salary-calculator"],
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
      };
    },
    relatedSlugs: ["umbrella-vs-limited-company-calculator"],
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
      };
    },
    relatedSlugs: ["mortgage-calculator-uk", "mortgage-calculator"],
  },
];

export default uk;
