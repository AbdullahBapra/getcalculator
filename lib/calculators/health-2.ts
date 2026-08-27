import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { unitFields, heightCm, weightKg, kgToLb, sexField } from "./health-helpers";
import { inCmPair, cmInPair, ftInCmPair } from "./convert-hints";

function parseDateUTC(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}
function bmiOf(kg: number, cm: number): number {
  const m = cm / 100;
  return kg / (m * m);
}

const MET_ACTIVITIES: Record<string, number> = {
  walking: 3.5,
  jogging: 7,
  running: 9.8,
  cycling: 7.5,
  swimming: 6,
  weightTraining: 5,
  yoga: 2.5,
  hiking: 6,
  dancing: 4.8,
  basketball: 6.5,
};

const health2: CalculatorDefinition[] = [
  {
    slug: "pregnancy-calculator",
    title: "Pregnancy Calculator",
    category: "health",
    shortDescription: "Track gestational age, trimester and due date from your last period.",
    seoDescription: "Calculate your current pregnancy week, trimester, estimated conception date and due date from your last menstrual period.",
    formulaSummary: "Due date = LMP + 280 days; conception ≈ LMP + 14 days",
    fields: [{ name: "lmp", label: "First Day of Last Period", type: "date", defaultValue: "" }],
    calculate: (i) => {
      const lmp = parseDateUTC(i.lmp);
      if (!lmp) return { results: [], error: "Enter the first day of your last period." };
      const today = new Date();
      const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      const daysAlong = Math.floor((todayUtc - lmp.getTime()) / 86400000);
      const week = Math.floor(daysAlong / 7);
      const day = daysAlong % 7;
      const trimester = week < 13 ? "First" : week < 27 ? "Second" : "Third";
      const due = new Date(lmp.getTime() + 280 * 86400000);
      const conception = new Date(lmp.getTime() + 14 * 86400000);
      const showGauge = daysAlong >= 0 && daysAlong <= 300;
      return {
        results: [
          { label: "Current Gestational Age", value: daysAlong >= 0 ? `${week} weeks, ${day} days` : "Not started yet", emphasis: true },
          { label: "Trimester", value: daysAlong >= 0 && daysAlong < 294 ? trimester : "—" },
          { label: "Estimated Conception Date", value: fmtDate(conception) },
          { label: "Estimated Due Date", value: fmtDate(due), emphasis: true },
        ],
        ...(showGauge
          ? {
              gauge: {
                value: daysAlong / 7,
                min: 0,
                max: 42,
                valueLabel: `${week}w ${day}d`,
                zones: [
                  { label: "1st Trimester", to: 13, barClass: "bg-pink-300 dark:bg-pink-500", textClass: "text-pink-600 dark:text-pink-400" },
                  { label: "2nd Trimester", to: 27, barClass: "bg-fuchsia-400 dark:bg-fuchsia-500", textClass: "text-fuchsia-600 dark:text-fuchsia-400" },
                  { label: "3rd Trimester", to: 42, barClass: "bg-purple-500 dark:bg-purple-400", textClass: "text-purple-600 dark:text-purple-400" },
                ],
              },
              chartCaption: `You're ${week} weeks, ${day} days along — ${trimester.toLowerCase()} trimester — with full term (40 weeks) ${
                daysAlong <= 280 ? `about ${Math.max(0, 40 - week)} weeks away` : "already reached"
              }.`,
            }
          : {}),
      };
    },
    relatedSlugs: ["due-date-calculator", "pregnancy-weight-gain-calculator"],
    content: {
      intro: [
        "Doctors don't typically date a pregnancy from conception, because most people don't know the exact day it happened — they date it from the first day of your last menstrual period (LMP) instead, then count forward. That's what this tool does: enter your LMP and it works out how many weeks and days along you are today, which trimester that puts you in, and a due date, using the same LMP-based counting convention used at a first prenatal visit.",
        "It's worth being upfront about what this number is and isn't. A due date from LMP alone assumes a textbook 28-day cycle with ovulation on day 14, which isn't true for everyone — an early dating ultrasound is what actually refines it in real prenatal care. Treat the date here as a starting estimate, not a fixed appointment on the calendar.",
        "People use this in the early weeks before a first ultrasound has confirmed anything, to get a rough sense of timing, or just to double check the math a midwife or app gave them. It's informational only, not a substitute for care from an OB or midwife who can confirm dates with an actual scan.",
        "Because a last-period date is about as personal as data gets, everything here runs locally in your browser — nothing about your cycle, your due date, or the fact that you're even pregnant is transmitted anywhere or stored on a server.",
      ],
      howItWorks: [
        "The due date comes from Naegele's rule: add 280 days (40 weeks) to the first day of your last period. It's a clinical convention, not a precise prediction — only a small share of babies actually arrive on the exact calculated date.",
        "Conception is estimated separately at LMP + 14 days, based on a typical mid-cycle ovulation. If your cycles run shorter or longer than 28 days, your actual ovulation — and true conception date — likely falls on a different day than this estimate.",
      ],
      faq: [
        { q: "How accurate is a due date calculated from my last period?", a: "It's a reasonable starting estimate assuming a 28-day cycle, but only roughly 1 in 20 pregnancies deliver on the exact calculated date — most babies arrive within about two weeks either side of it. A first-trimester ultrasound is generally considered more accurate for dating." },
        { q: "Why does my doctor's due date differ from this calculator's?", a: "Providers often adjust the LMP-based date after an early ultrasound measures the fetus directly, which is more precise than counting from your last period, especially if your cycles aren't a consistent 28 days." },
        { q: "How is gestational age counted if I don't know exactly when I conceived?", a: "Gestational age is measured from the first day of your last period, not from conception — so in the medical sense you're already considered about 2 weeks pregnant at the moment of actual conception." },
        { q: "What week does each trimester start?", a: "The first trimester runs through week 13, the second through week 27, and the third from week 28 to full term around week 40 — this calculator places your current week into whichever trimester it falls in." },
        { q: "Can I use this calculator if my periods are irregular?", a: "You can, but the estimate will be less reliable — LMP-based dating assumes fairly consistent cycles, so with irregular periods an ultrasound-based due date from your provider will be noticeably more accurate than this calculation." },
      ],
    },
  },
  {
    slug: "pregnancy-weight-gain-calculator",
    title: "Pregnancy Weight Gain Calculator",
    category: "health",
    shortDescription: "Find the recommended pregnancy weight gain range for your pre-pregnancy BMI.",
    seoDescription: "Calculate the IOM-recommended total pregnancy weight gain range based on your pre-pregnancy BMI.",
    formulaSummary: "IOM guidelines by pre-pregnancy BMI category",
    fields: [...unitFields],
    calculate: (i) => {
      const kg = weightKg(i);
      const cm = heightCm(i);
      const bmi = bmiOf(kg, cm);
      let range = [11.5, 16];
      let category = "Normal weight";
      if (bmi < 18.5) { range = [12.5, 18]; category = "Underweight"; }
      else if (bmi >= 25 && bmi < 30) { range = [7, 11.5]; category = "Overweight"; }
      else if (bmi >= 30) { range = [5, 9]; category = "Obese"; }
      const toLb = (kgv: number) => kgv * 2.20462;
      const mid = (range[0] + range[1]) / 2;
      const milestones: { label: string; frac: number }[] = [
        { label: "Week 0", frac: 0 },
        { label: "Week 13 (End T1)", frac: 0.1 },
        { label: "Week 27 (End T2)", frac: 0.45 },
        { label: "Week 40 (Full Term)", frac: 1 },
      ];
      return {
        results: [
          { label: "Pre-Pregnancy BMI", value: fmtNumber(bmi, 1) },
          { label: "Category", value: category },
          { label: "Recommended Total Gain", value: `${fmtNumber(range[0])}–${fmtNumber(range[1])} kg (${fmtNumber(toLb(range[0]))}–${fmtNumber(toLb(range[1]))} lb)`, emphasis: true },
        ],
        notes: ["Based on Institute of Medicine (IOM) guidelines for a single pregnancy — twins/multiples have higher targets. Always follow your provider's specific guidance."],
        growthSeries: milestones.map((m) => ({
          label: m.label,
          value: mid * m.frac,
          displayValue: `${fmtNumber(mid * m.frac, 1)} kg`,
        })),
        chartCaption: `Most of a healthy ${fmtNumber(mid, 1)} kg gain builds up in the second and third trimester, not the first — this shows a typical week-by-week pace for the "${category}" category.`,
      };
    },
    relatedSlugs: ["pregnancy-calculator", "bmi-calculator"],
    content: {
      intro: [
        "Weight gain guidance during pregnancy isn't one-size-fits-all — how much is considered healthy depends heavily on the weight you started at. This calculator takes your pre-pregnancy height and weight, works out your pre-pregnancy BMI category, and returns the Institute of Medicine (IOM)'s recommended total gain range for that category, plus a rough week-by-week pacing curve.",
        "These ranges are population-level guidelines, not a target you need to hit exactly. Real pregnancies vary — nausea, appetite changes, activity level, and the pregnancy itself (twins gain differently than a single baby) all move the number, and a provider tracking your specific pregnancy is a better authority than any calculator on what's healthy for you.",
        "It's mainly useful early on, when you're trying to understand what a 'normal' trajectory even looks like, or partway through when you want to sanity-check whether your gain so far is roughly on pace — without having to dig up the IOM tables yourself.",
        "Pre-pregnancy weight is sensitive information a lot of people would rather not type into a random web form. This one never leaves your device — no account, no server, no record of what you entered.",
      ],
      howItWorks: [
        "The IOM bases its recommended range on your pre-pregnancy BMI category — underweight, normal weight, overweight, or obese — because starting from a higher or lower BMI changes how much additional weight is considered healthy for both parent and baby.",
        "The week-by-week curve isn't linear: it assumes most of the gain happens in the second and third trimester rather than the first, since first-trimester gain is typically minimal (sometimes even a loss, if nausea is significant) and the pace usually picks up notably after week 13.",
      ],
      faq: [
        { q: "How much weight should I gain during pregnancy?", a: "It depends on your pre-pregnancy BMI — the IOM recommends roughly 25-35 lb (11.5-16 kg) for a normal-weight BMI, more for underweight, and less for overweight or obese starting points, all for a single pregnancy." },
        { q: "Is it normal to gain weight unevenly across pregnancy?", a: "Yes — most people gain very little in the first trimester and gain faster through the second and third, so a flat month-by-month pace isn't the expected pattern." },
        { q: "Do twins change the recommended weight gain range?", a: "Yes, considerably — multiples come with higher IOM-recommended ranges than this single-pregnancy calculator shows, so treat this tool as inapplicable if you're carrying more than one baby and ask your provider for the multiples-specific range." },
        { q: "What if I'm gaining more or less than the recommended range?", a: "A single measurement outside the range isn't automatically a problem — trends over time matter more than any one weigh-in, and your prenatal provider is best placed to say whether your specific pattern needs attention." },
        { q: "Does pre-pregnancy BMI actually matter for a healthy pregnancy?", a: "It's one factor providers use to individualize weight-gain guidance, since both too little and too much gain relative to starting BMI are associated with different pregnancy risks — it isn't the only factor, but it's why the recommended range isn't the same for everyone." },
      ],
    },
  },
  {
    slug: "pregnancy-conception-calculator",
    title: "Pregnancy Conception Calculator",
    category: "health",
    shortDescription: "Estimate your conception date from your due date.",
    seoDescription: "Estimate the likely conception date and last menstrual period from a known or expected due date.",
    formulaSummary: "Conception ≈ due date − 266 days; LMP ≈ due date − 280 days",
    fields: [{ name: "dueDate", label: "Due Date", type: "date", defaultValue: "" }],
    calculate: (i) => {
      const due = parseDateUTC(i.dueDate);
      if (!due) return { results: [], error: "Enter a due date." };
      const conception = new Date(due.getTime() - 266 * 86400000);
      const lmp = new Date(due.getTime() - 280 * 86400000);
      return {
        results: [
          { label: "Estimated Conception Date", value: fmtDate(conception), emphasis: true },
          { label: "Estimated Last Period (LMP)", value: fmtDate(lmp) },
        ],
        steps: [
          `Due date − 266 days ≈ conception date → ${fmtDate(conception)}`,
          `Due date − 280 days ≈ start of your last period → ${fmtDate(lmp)}`,
        ],
        // Three dates in chronological order is a timeline, not a magnitude to chart —
        // a small table reads more honestly than forcing them into a bar/gauge.
        table: {
          headers: ["Milestone", "Estimated Date"],
          rows: [
            ["Last Menstrual Period", fmtDate(lmp)],
            ["Conception", fmtDate(conception)],
            ["Due Date", fmtDate(due)],
          ],
        },
        chartCaption: "These three dates all fall out of the same 280-day pregnancy estimate, just anchored at different points along it.",
      };
    },
    relatedSlugs: ["due-date-calculator", "ovulation-calculator"],
    content: {
      intro: [
        "This one runs the usual pregnancy dating math backwards. Instead of starting from your last period and calculating forward to a due date, you start from a due date — whether it's one your provider gave you or one you're just curious about — and this works back to an estimated conception date and an estimated start date for your last period.",
        "Because the standard due-date convention (Naegele's rule) is built on a 280-day estimate from the last period and a 266-day estimate from conception, the numbers here are exactly as approximate as the due date you put in. If your due date came from an early ultrasound rather than LMP alone, the back-calculated LMP shown here may not match the actual first day of your last period.",
        "People typically reach for this after they already have a due date in hand — from a provider, an app, or a pregnancy test result — and want to sanity-check roughly when conception happened, or figure out which date to answer when a form asks for their last period.",
        "Nothing you enter here — the due date, the dates it calculates back to — is sent off your device or stored anywhere. It's just arithmetic that happens in your browser.",
      ],
      faq: [
        { q: "How do you calculate conception date from a due date?", a: "Subtract 266 days from the due date — that's the standard 280-day pregnancy length minus the roughly 14 days between the start of a last period and typical ovulation/conception." },
        { q: "Why would I need to know my last menstrual period if I already have a due date?", a: "Prenatal intake forms and other pregnancy calculators often ask for LMP specifically, so working backward from a known due date is the easiest way to fill that in if you don't remember the actual date." },
        { q: "Is the conception date from this calculator exact?", a: "No — it assumes ovulation happened exactly 14 days after the start of your last period, which is typical for a 28-day cycle but shifts earlier or later for shorter or longer cycles." },
        { q: "My due date came from an ultrasound — will the backward-calculated dates still be accurate?", a: "They'll be less reliable in that case, since ultrasound dating is based on measuring the fetus directly rather than assuming a standard 28-day cycle, so the back-calculated LMP may not match your actual last period." },
      ],
    },
  },
  {
    slug: "army-body-fat-calculator",
    title: "Army Body Fat Calculator",
    category: "health",
    shortDescription: "Estimate body fat percentage using the U.S. Army tape-test method.",
    seoDescription: "Estimate body fat percentage using the U.S. Army circumference-based tape test method.",
    formulaSummary: "Circumference-based (same method family as the U.S. Navy formula)",
    fields: [
      sexField,
      { name: "heightIn", label: "Height", type: "number", unit: "in", defaultValue: 70, min: 1, convertPair: inCmPair("heightIn") },
      { name: "neckIn", label: "Neck", type: "number", unit: "in", defaultValue: 15, min: 1, convertPair: inCmPair("neckIn") },
      { name: "waistIn", label: "Waist (at navel)", type: "number", unit: "in", defaultValue: 34, min: 1, convertPair: inCmPair("waistIn") },
      { name: "hipIn", label: "Hip", type: "number", unit: "in", defaultValue: 38, min: 0, showIf: (i) => i.sex === "female", convertPair: inCmPair("hipIn") },
    ],
    calculate: (i) => {
      const height = n(i.heightIn, 70);
      const neck = n(i.neckIn, 15);
      const waist = n(i.waistIn, 34);
      const hip = n(i.hipIn, 38);
      let bf: number;
      if (i.sex === "female") {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(height)) - 450;
      } else {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
      }
      const isFemale = i.sex === "female";
      return {
        results: [{ label: "Estimated Body Fat", value: `${fmtNumber(bf, 1)}%`, emphasis: true }],
        notes: ["Official Army Body Composition Program standards vary by age and sex — this gives the same style of tape-test estimate, not an official pass/fail determination."],
        gauge: {
          value: bf,
          min: 0,
          max: isFemale ? 45 : 38,
          valueLabel: `${fmtNumber(bf, 1)}%`,
          zones: isFemale
            ? [
                { label: "Essential", to: 13, barClass: "bg-sky-300 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
                { label: "Athletic", to: 20, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
                { label: "Fitness", to: 24, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
                { label: "Acceptable", to: 31, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
                { label: "Obese", to: 45, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
              ]
            : [
                { label: "Essential", to: 5, barClass: "bg-sky-300 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
                { label: "Athletic", to: 13, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
                { label: "Fitness", to: 17, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
                { label: "Acceptable", to: 24, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
                { label: "Obese", to: 38, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
              ],
        },
        chartCaption: `Healthy body-fat ranges differ by sex — this places your ${fmtNumber(bf, 1)}% estimate against typical categories for ${isFemale ? "women" : "men"}.`,
      };
    },
    relatedSlugs: ["body-fat-calculator"],
    content: {
      intro: [
        "The U.S. Army estimates body fat percentage with a tape measure rather than calipers or a scan — a few circumference measurements (neck, waist, and hip for women) plugged into a logarithmic formula. It's the same method family as the Navy body-fat formula, and this calculator reproduces that math so you can see roughly where the tape-test method would place you.",
        "It's an estimate, not a lab measurement. Circumference-based formulas can be thrown off by where exactly you measure, how tightly you pull the tape, and individual differences in body shape that the formula doesn't account for — a DEXA scan or hydrostatic weighing will generally be more accurate if precision actually matters to you.",
        "It's used by people preparing for military fitness standards who want to check their numbers before an official tape test, and by anyone curious about a circumference-based body fat estimate as an alternative to a BMI number or a caliper reading.",
        "Everything is computed right in your browser — the numbers you're tracking, whatever the reason, never leave your device.",
      ],
      howItWorks: [
        "The Army formula (like the Navy's) uses the log of your waist circumference minus your neck circumference, adjusted by height, to estimate body fat — for women, hip circumference is added into the waist-minus-neck term because fat distribution differs by sex.",
        "That's why the field set changes depending on the sex you select: the male formula only needs neck, waist, and height, while the female formula also needs a hip measurement — using the wrong formula for your body type will meaningfully skew the estimate.",
      ],
      faq: [
        { q: "How accurate is the Army tape test for body fat?", a: "It's reasonably consistent for population-level screening but can be off by several percentage points for a given individual compared to a DEXA scan, especially for people with atypical fat distribution or muscle mass — measurement technique also matters a lot." },
        { q: "Where exactly should I measure my waist for this calculator?", a: "The Army standard measures waist circumference at the level of the navel, not at the narrowest point of the torso, so measure there for a result that matches the same convention this formula uses." },
        { q: "Why does the calculator ask for hip measurement only for women?", a: "The female version of the formula incorporates hip circumference because body fat tends to distribute differently by sex, and adding hip measurement into the equation makes the estimate more accurate for typical female body composition." },
        { q: "Does this match the official Army Body Composition Program pass/fail standard?", a: "It uses the same style of tape-test formula, but official standards also factor in age and specific compliance rules that this calculator doesn't apply — treat this as a same-method estimate, not an official determination." },
        { q: "Why is my tape-test result different from a body fat scale reading?", a: "Bioelectrical impedance scales and circumference-based tape formulas use entirely different measurement principles and often disagree by several percentage points for the same person — neither is a lab-grade measurement." },
      ],
    },
  },
  {
    slug: "carbohydrate-calculator",
    title: "Carbohydrate Calculator",
    category: "health",
    shortDescription: "Calculate a daily carbohydrate target from your calorie goal.",
    seoDescription: "Calculate your recommended daily carbohydrate intake in grams from your total daily calorie target.",
    formulaSummary: "Carb grams = calories × carb % ÷ 4",
    fields: [
      { name: "dailyCalories", label: "Daily Calorie Target", type: "number", unit: "kcal", defaultValue: 2200, min: 0 },
      { name: "carbPercent", label: "Carbs Share of Calories", type: "number", unit: "%", defaultValue: 45, min: 5, max: 75 },
    ],
    calculate: (i) => {
      const totalCalories = n(i.dailyCalories, 2200);
      const grams = (totalCalories * (n(i.carbPercent, 45) / 100)) / 4;
      const carbCalories = grams * 4;
      const restCalories = Math.max(0, totalCalories - carbCalories);
      return {
        results: [{ label: "Daily Carbohydrate Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }],
        breakdown: [
          { label: "From Carbs", value: carbCalories, displayValue: `${fmtNumber(grams, 0)} g (${fmtNumber(carbCalories, 0)} kcal)` },
          { label: "Rest of Your Calories", value: restCalories, displayValue: `${fmtNumber(restCalories, 0)} kcal` },
        ],
        chartCaption: `At ${fmtNumber(n(i.carbPercent, 45), 0)}% of calories, carbs supply ${fmtNumber(grams, 0)}g — the remaining ${fmtNumber(restCalories, 0)} kcal is left for protein and fat.`,
      };
    },
    relatedSlugs: ["macro-calculator", "protein-calculator"],
    content: {
      intro: [
        "Carbohydrate needs are usually expressed as a share of total calories rather than a fixed gram number, since they scale with how much you're eating overall. This calculator takes your daily calorie target and a carb percentage and converts it into grams — the number that actually shows up on food labels and in most tracking apps.",
        "There's no single 'correct' carb percentage that applies to everyone — it depends on activity level, personal preference, and any specific dietary approach you're following, from lower-carb to endurance-athlete-high-carb. This tool doesn't tell you which percentage is right for you; it just does the gram conversion once you've picked one.",
        "It's aimed at anyone building out a macro target for tracking purposes — someone following a specific diet plan, an athlete matching carb intake to training load, or anyone who's been told a percentage target and needs it in grams to actually log meals.",
        "All the math happens locally — your calorie target and whatever dietary approach you're following stay on your device.",
      ],
      faq: [
        { q: "How do I convert carb percentage to grams per day?", a: "Multiply your daily calorie target by the carb percentage, then divide by 4 — carbohydrates provide 4 calories per gram, so that division converts the calorie share into the actual gram amount." },
        { q: "What percentage of calories should come from carbs?", a: "The general Acceptable Macronutrient Distribution Range (AMDR) for carbs is about 45-65% of total calories for most adults, though specific goals — endurance training, low-carb approaches — can reasonably fall outside that range." },
        { q: "Why does this calculator use 4 calories per gram for carbs?", a: "That's the standard Atwater conversion factor for carbohydrates, the same figure used on nutrition labels to calculate calories from the grams of carbohydrate listed." },
        { q: "Is a low-carb diet the same as this calculator showing a lower gram target?", a: "Not necessarily — commonly cited low-carb ranges (under roughly 130g or so per day) are considerably below the standard 45% AMDR share, so you'd need to enter a noticeably lower percentage than the default to model a genuinely low-carb target." },
      ],
    },
  },
  {
    slug: "healthy-weight-calculator",
    title: "Healthy Weight Calculator",
    category: "health",
    shortDescription: "Find the healthy weight range for your height based on BMI.",
    seoDescription: "Calculate the healthy weight range for your height using the standard 18.5–24.9 BMI range.",
    formulaSummary: "Weight range = BMI(18.5 to 24.9) × height(m)²",
    fields: [
      { name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 3 },
      { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11, convertPair: ftInCmPair("heightFt", "heightIn") },
    ],
    calculate: (i) => {
      const cm = n(i.heightFt, 5) * 30.48 + n(i.heightIn, 9) * 2.54;
      const m = cm / 100;
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      return {
        results: [
          { label: "Healthy Weight Range", value: `${fmtNumber(lowKg, 1)}–${fmtNumber(highKg, 1)} kg (${fmtNumber(kgToLb(lowKg), 1)}–${fmtNumber(kgToLb(highKg), 1)} lb)`, emphasis: true },
        ],
        compare: [
          { label: "Lower End (BMI 18.5)", value: lowKg, displayValue: `${fmtNumber(lowKg, 1)} kg (${fmtNumber(kgToLb(lowKg), 1)} lb)` },
          { label: "Upper End (BMI 24.9)", value: highKg, displayValue: `${fmtNumber(highKg, 1)} kg (${fmtNumber(kgToLb(highKg), 1)} lb)`, highlight: true },
        ],
        chartCaption: `For your height, a healthy weight spans about ${fmtNumber(highKg - lowKg, 1)} kg — anywhere in that window keeps your BMI in the normal range.`,
      };
    },
    relatedSlugs: ["bmi-calculator", "ideal-weight-calculator"],
    content: {
      intro: [
        "This calculator flips the usual BMI question around. Instead of taking your weight and height and telling you your BMI, it takes your height and works out the full span of weights — from a BMI of 18.5 up to 24.9 — that would count as the 'normal' BMI category. The result is a range, not a single target number.",
        "BMI itself is a blunt instrument — it doesn't distinguish muscle from fat, and a bodybuilder and a sedentary person of the same height can land at very different points in this range for very different reasons. Treat the range as a population-level reference point, not a personal prescription for what you specifically should weigh.",
        "It's a quick way to see where a 'healthy' BMI actually falls in pounds or kilograms for your own height, without doing the algebra yourself or reverse-engineering it from a BMI chart.",
        "The height you enter is processed right in your browser and never saved or sent anywhere — there's nothing to look up later, because nothing leaves your device.",
      ],
      howItWorks: [
        "The range comes from solving the BMI formula for weight instead of BMI: weight = BMI × height(m)², run once at BMI 18.5 for the lower bound and once at BMI 24.9 for the upper bound.",
      ],
      faq: [
        { q: "How is the healthy weight range calculated for a given height?", a: "It plugs your height into the BMI formula twice, solving for weight at a BMI of 18.5 (the low end of normal) and again at 24.9 (the high end), which gives the full range considered normal-BMI for that height." },
        { q: "Does this range account for muscle mass?", a: "No — BMI-based ranges can't distinguish muscle from fat, so a muscular person may fall above this range while carrying a healthy amount of body fat. Body composition measures are more informative than BMI alone in that case." },
        { q: "Is the middle of the range the ideal weight to aim for?", a: "Not necessarily — this shows the full span the BMI system labels 'normal,' not a single optimal number. Where you personally should sit within that range depends on frame, muscle mass, and other factors this calculator doesn't measure." },
        { q: "Why does the range change so much between short and tall people?", a: "Because weight scales with the square of height in the BMI formula, so even a small height difference shifts the healthy-weight window by several pounds or kilograms at each end." },
      ],
    },
  },
  {
    slug: "calories-burned-calculator",
    title: "Calories Burned Calculator",
    category: "health",
    shortDescription: "Estimate calories burned during exercise using MET values.",
    seoDescription: "Estimate calories burned during an activity based on its MET value, your body weight and the duration.",
    formulaSummary: "kcal/min = MET × 3.5 × weight(kg) ÷ 200",
    fields: [
      { name: "activity", label: "Activity", type: "select", defaultValue: "running", options: Object.keys(MET_ACTIVITIES).map((k) => ({ value: k, label: k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()) })) },
      ...unitFields,
      { name: "minutes", label: "Duration", type: "number", unit: "minutes", defaultValue: 30, min: 1 },
    ],
    calculate: (i) => {
      const met = MET_ACTIVITIES[i.activity] ?? 7;
      const kg = weightKg(i);
      const kcalPerMin = (met * 3.5 * kg) / 200;
      const minutes = n(i.minutes, 30);
      const total = kcalPerMin * minutes;
      const restTotal = ((1.0 * 3.5 * kg) / 200) * minutes;
      const activityLabel = (i.activity ?? "running").replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
      return {
        results: [{ label: "Calories Burned", value: `${fmtNumber(total, 0)} kcal`, emphasis: true }],
        compare: [
          { label: activityLabel, value: total, displayValue: `${fmtNumber(total, 0)} kcal`, highlight: true },
          { label: "Just Sitting (same time)", value: restTotal, displayValue: `${fmtNumber(restTotal, 0)} kcal` },
        ],
        chartCaption: `About ${fmtNumber(Math.max(0, total - restTotal), 0)} kcal of that came specifically from being active rather than sitting still for the same ${fmtNumber(minutes, 0)} minutes.`,
      };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
    content: {
      intro: [
        "This estimates how many calories a given activity burns using MET values — a standard research measure of how many times harder an activity works your body compared to sitting still. Pick an activity, enter your weight and how long you did it, and it multiplies out an estimate for that session.",
        "MET-based estimates are averages drawn from studies of typical adults doing an activity at a typical pace — your actual burn shifts with intensity, terrain, fitness level, and body composition, so treat the number as a reasonable ballpark rather than something a metabolic cart measured directly.",
        "It's a fast way to put a number on a workout — for logging in a food/exercise tracker, deciding how much to eat back after a hard session, or just satisfying curiosity about whether that hike burned more than the run you skipped instead.",
        "Your weight and workout details are calculated locally in the browser and aren't stored or sent anywhere, so there's no account or log tying your activity history to you.",
      ],
      howItWorks: [
        "Calories per minute come from the formula MET × 3.5 × weight(kg) ÷ 200, a standard conversion that turns a MET value into an actual energy-expenditure rate for your specific body weight.",
        "The 'just sitting' comparison uses a MET of 1.0 (resting metabolic baseline) over the same duration, so you can see how much of the total burn is actually attributable to the activity itself versus calories you'd have burned anyway just existing.",
      ],
      faq: [
        { q: "What is a MET value?", a: "MET stands for metabolic equivalent of task — it's a multiple of your resting energy expenditure, so a MET of 7 means an activity burns roughly 7 times what sitting quietly would over the same time." },
        { q: "How accurate are calories-burned estimates from MET values?", a: "They're population averages, not individualized measurements — actual burn varies with your fitness level, effort, and body composition, so treat the number as a reasonable estimate rather than an exact figure." },
        { q: "Does more body weight mean more calories burned for the same activity?", a: "Yes — the formula scales directly with weight, since moving a heavier body through the same activity takes more energy, which is why the calculator asks for your weight before estimating a total." },
        { q: "Why does the calculator show what I'd burn 'just sitting' for comparison?", a: "Because total calories burned during a workout includes calories you'd have burned anyway at rest — subtracting that baseline shows the calories genuinely attributable to the activity itself." },
      ],
    },
  },
  {
    slug: "protein-calculator",
    title: "Protein Calculator",
    category: "health",
    shortDescription: "Calculate your daily protein target based on body weight and activity goal.",
    seoDescription: "Calculate your recommended daily protein intake in grams based on body weight and training goal.",
    formulaSummary: "Protein grams = weight(kg) × factor (0.8–2.2 g/kg)",
    fields: [
      ...unitFields,
      { name: "goal", label: "Goal", type: "select", defaultValue: "active", options: [
        { value: "sedentary", label: "Sedentary (0.8 g/kg)" },
        { value: "active", label: "Active / general fitness (1.2 g/kg)" },
        { value: "muscle", label: "Muscle building (1.8 g/kg)" },
        { value: "athlete", label: "Endurance/strength athlete (2.2 g/kg)" },
      ] },
    ],
    calculate: (i) => {
      const factors: Record<string, number> = { sedentary: 0.8, active: 1.2, muscle: 1.8, athlete: 2.2 };
      const kg = weightKg(i);
      const grams = kg * (factors[i.goal] ?? 1.2);
      const baseline = kg * 0.8;
      return {
        results: [{ label: "Daily Protein Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }],
        compare: [
          { label: "Sedentary Baseline (0.8 g/kg)", value: baseline, displayValue: `${fmtNumber(baseline, 0)} g` },
          { label: "Your Target", value: grams, displayValue: `${fmtNumber(grams, 0)} g`, highlight: true },
        ],
        chartCaption:
          grams > baseline
            ? `Your goal calls for about ${fmtNumber(grams - baseline, 0)}g more protein per day than the minimum sedentary baseline.`
            : `Your target lines up with the minimum sedentary baseline for your body weight.`,
      };
    },
    relatedSlugs: ["macro-calculator", "carbohydrate-calculator"],
    content: {
      intro: [
        "Protein needs scale with body weight rather than total calories, so this calculator asks for your weight and a goal — sedentary, generally active, building muscle, or serious athletic training — and multiplies by a gram-per-kilogram factor appropriate to that goal.",
        "The factors used here (0.8 to 2.2 g/kg) span a wide research-backed range, but individual needs still vary with training volume, age, and how much muscle you're carrying — this is a reasonable starting target, not a number your body strictly requires down to the gram.",
        "People use it to set a daily protein target for tracking apps, to check whether a diet plan's protein number matches their actual goal, or to see how much a 'muscle building' target differs from the bare minimum most bodies need to function.",
        "Body weight is exactly the kind of number people don't love typing into random sites — this one runs the whole calculation locally, with nothing saved or transmitted.",
      ],
      faq: [
        { q: "How much protein do I need per day?", a: "It depends heavily on your goal — sedentary adults often do fine around 0.8 g/kg of body weight, while people building muscle or training seriously typically benefit from more, up to roughly 1.6-2.2 g/kg according to common sports-nutrition guidance." },
        { q: "Is more protein always better for building muscle?", a: "No — protein needs plateau; intake well beyond roughly 2.2 g/kg generally doesn't add extra muscle-building benefit and just displaces calories that could go toward carbs or fat." },
        { q: "Why does the calculator use body weight instead of total calories?", a: "Protein requirements track lean body mass and activity level more closely than they track total calorie intake, which is why grams-per-kilogram of body weight is the standard way nutrition guidance expresses protein targets." },
        { q: "What's the difference between the 'active' and 'muscle building' goals here?", a: "The 'active' factor (1.2 g/kg) reflects general fitness and everyday activity, while 'muscle building' (1.8 g/kg) reflects the higher intake commonly recommended to support resistance training and hypertrophy specifically." },
        { q: "Does this protein target include protein from all food sources?", a: "Yes — the gram target represents total daily protein intake, so it's meant to be compared against your combined intake from meals, snacks, and any supplements, not any single source alone." },
      ],
    },
  },
  {
    slug: "fat-intake-calculator",
    title: "Fat Intake Calculator",
    category: "health",
    shortDescription: "Calculate a daily fat intake target from your calorie goal.",
    seoDescription: "Calculate your recommended daily dietary fat intake in grams from your total daily calorie target.",
    formulaSummary: "Fat grams = calories × fat % ÷ 9",
    fields: [
      { name: "dailyCalories", label: "Daily Calorie Target", type: "number", unit: "kcal", defaultValue: 2200, min: 0 },
      { name: "fatPercent", label: "Fat Share of Calories", type: "number", unit: "%", defaultValue: 30, min: 10, max: 50 },
    ],
    calculate: (i) => {
      const fatPercent = n(i.fatPercent, 30);
      const grams = (n(i.dailyCalories) * (fatPercent / 100)) / 9;
      return {
        results: [{ label: "Daily Fat Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }],
        gauge: {
          value: fatPercent,
          min: 10,
          max: 50,
          valueLabel: `${fmtNumber(fatPercent, 0)}%`,
          zones: [
            { label: "Low Fat", to: 20, barClass: "bg-sky-300 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "AMDR Range", to: 35, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "High Fat", to: 50, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
          ],
        },
        chartCaption: `The Acceptable Macronutrient Distribution Range (AMDR) for fat is 20–35% of calories — your ${fmtNumber(fatPercent, 0)}% target works out to ${fmtNumber(grams, 0)}g per day.`,
      };
    },
    relatedSlugs: ["macro-calculator", "carbohydrate-calculator"],
    content: {
      intro: [
        "Fat is the most calorie-dense macronutrient, so a small percentage shift here moves a noticeable number of grams. This calculator takes your daily calorie target and a fat percentage and converts it into the grams figure that actually appears on nutrition labels.",
        "There's no universal 'right' fat percentage — it depends on the overall diet you're following, and lower-fat and higher-fat approaches can both fit within a healthy eating pattern. This tool just does the conversion; the percentage you pick is up to you or whatever plan you're following.",
        "It's typically used alongside a carb or protein calculator to fill out a full macro breakdown, or by anyone who's been given a fat percentage target and needs it converted into grams for meal tracking.",
        "The calculation happens entirely in your browser — your calorie goals and dietary details aren't logged or sent anywhere.",
      ],
      faq: [
        { q: "How do I convert fat percentage into grams per day?", a: "Multiply your daily calorie target by the fat percentage, then divide by 9 — fat provides 9 calories per gram, roughly double carbs or protein, so that's the conversion factor used." },
        { q: "What percentage of calories should come from fat?", a: "The Acceptable Macronutrient Distribution Range (AMDR) commonly cited for fat is about 20-35% of total calories for adults, though specific diet approaches can reasonably fall outside that band." },
        { q: "Why does fat use 9 calories per gram instead of 4?", a: "Fat is more energy-dense per gram than carbohydrate or protein, which each provide about 4 calories per gram — this is a basic property of the macronutrient, not a rounding choice, and it's why fat gram targets look smaller than carb or protein targets at the same calorie share." },
        { q: "Is a low-fat diet unhealthy?", a: "Not inherently — very low fat intake can risk deficiencies in fat-soluble vitamins and essential fatty acids over time, which is part of why the AMDR sets a floor around 20% rather than allowing fat to go arbitrarily low." },
      ],
    },
  },
  {
    slug: "ovulation-calculator",
    title: "Ovulation Calculator",
    category: "health",
    shortDescription: "Estimate your ovulation date and fertile window.",
    seoDescription: "Estimate your ovulation date and most fertile days from the first day of your last period and cycle length.",
    formulaSummary: "Ovulation ≈ LMP + (cycle length − 14)",
    fields: [
      { name: "lmp", label: "First Day of Last Period", type: "date", defaultValue: "" },
      { name: "cycleLength", label: "Average Cycle Length", type: "number", unit: "days", defaultValue: 28, min: 20, max: 45 },
    ],
    calculate: (i) => {
      const lmp = parseDateUTC(i.lmp);
      if (!lmp) return { results: [], error: "Enter the first day of your last period." };
      const cycle = n(i.cycleLength, 28);
      const ovulation = new Date(lmp.getTime() + (cycle - 14) * 86400000);
      const fertileStart = new Date(ovulation.getTime() - 5 * 86400000);
      const fertileEnd = new Date(ovulation.getTime() + 1 * 86400000);
      const ovulationDay = cycle - 14;
      const fertileStartDay = ovulationDay - 5;
      const fertileEndDay = ovulationDay + 1;
      return {
        results: [
          { label: "Estimated Ovulation Date", value: fmtDate(ovulation), emphasis: true },
          { label: "Fertile Window", value: `${fmtDate(fertileStart)} – ${fmtDate(fertileEnd)}`, emphasis: true },
        ],
        gauge: {
          value: ovulationDay,
          min: 1,
          max: cycle,
          valueLabel: `Day ${ovulationDay}`,
          zones: [
            { label: "Pre-Fertile", to: Math.max(1, fertileStartDay - 1), barClass: "bg-zinc-300 dark:bg-zinc-600", textClass: "text-zinc-600 dark:text-zinc-400" },
            { label: "Fertile Window", to: fertileEndDay, barClass: "bg-rose-400 dark:bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
            { label: "Luteal Phase", to: cycle, barClass: "bg-violet-400 dark:bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
          ],
        },
        chartCaption: `Ovulation lands around day ${ovulationDay} of your ${cycle}-day cycle — the days just before it and the day after are your most fertile window.`,
      };
    },
    relatedSlugs: ["conception-calculator", "period-calculator"],
    content: {
      intro: [
        "Ovulation typically happens about 14 days before your next period starts, not 14 days after your last one began — so this calculator uses the first day of your last period plus your average cycle length to work backward and estimate both the ovulation date and the several days around it considered your fertile window.",
        "This is a statistical estimate built on a typical luteal phase length, not a measurement of what's actually happening in your body that cycle. Cycle length varies month to month for most people, stress and illness can shift ovulation earlier or later, and this calculator has no way to detect any of that — it just does the standard date math.",
        "It's commonly used by people trying to conceive who want to time things around their most fertile days, or by anyone tracking their cycle who wants a quick estimate without switching to a dedicated app.",
        "Fertility timing is deeply personal information, so nothing you enter here is transmitted or stored — the estimate is generated and shown to you entirely within your own browser.",
      ],
      howItWorks: [
        "Ovulation is estimated at (cycle length − 14) days after the start of your last period — the 14-day figure is the typical luteal phase (the time between ovulation and the next period), which tends to be more consistent across people than the follicular phase that precedes it.",
        "The fertile window spans from five days before estimated ovulation through the day after, reflecting that sperm can survive several days in the reproductive tract while the egg itself is viable for roughly a day after release.",
      ],
      faq: [
        { q: "How is ovulation date calculated from cycle length?", a: "It's estimated as your cycle length minus 14 days, counted from the first day of your last period — the 14-day figure represents a typical luteal phase, the relatively fixed stretch between ovulation and your next period." },
        { q: "Why does the fertile window start before the estimated ovulation day?", a: "Sperm can survive in the reproductive tract for several days, so intercourse in the days leading up to ovulation can still result in conception even though the egg itself hasn't been released yet." },
        { q: "Does this work if my cycles are irregular?", a: "Less reliably — this method assumes a fairly consistent luteal phase length and a cycle length you can average, so noticeably irregular cycles make the ovulation estimate considerably less precise." },
        { q: "Is ovulation always exactly 14 days before my next period?", a: "No, 14 days is a population average — the luteal phase commonly ranges from about 10 to 16 days for different individuals, so your personal timing may shift the actual ovulation date from this estimate." },
        { q: "Can this calculator tell me if I'm actually ovulating?", a: "No — it only estimates timing based on date math. Ovulation predictor kits, basal body temperature tracking, or a healthcare provider can give you information about whether ovulation is actually occurring, which this calculator cannot." },
      ],
    },
  },
  {
    slug: "conception-calculator",
    title: "Conception Calculator",
    category: "health",
    shortDescription: "Estimate your most likely conception date.",
    seoDescription: "Estimate your most likely conception date based on your last period and cycle length.",
    formulaSummary: "Conception ≈ ovulation date",
    fields: [
      { name: "lmp", label: "First Day of Last Period", type: "date", defaultValue: "" },
      { name: "cycleLength", label: "Average Cycle Length", type: "number", unit: "days", defaultValue: 28, min: 20, max: 45 },
    ],
    calculate: (i) => {
      const lmp = parseDateUTC(i.lmp);
      if (!lmp) return { results: [], error: "Enter the first day of your last period." };
      const conception = new Date(lmp.getTime() + (n(i.cycleLength, 28) - 14) * 86400000);
      const due = new Date(conception.getTime() + 266 * 86400000);
      return {
        results: [
          { label: "Most Likely Conception Date", value: fmtDate(conception), emphasis: true },
          { label: "Estimated Due Date", value: fmtDate(due) },
        ],
        steps: [
          `Last period + (cycle length − 14) ≈ ovulation/conception → ${fmtDate(conception)}`,
          `Conception + 266 days ≈ due date → ${fmtDate(due)}`,
        ],
        table: {
          headers: ["Milestone", "Estimated Date"],
          rows: [
            ["Last Menstrual Period", fmtDate(lmp)],
            ["Conception (ovulation)", fmtDate(conception)],
            ["Due Date", fmtDate(due)],
          ],
        },
        chartCaption: `At a ${n(i.cycleLength, 28)}-day cycle, ovulation (and likely conception) falls about ${n(i.cycleLength, 28) - 14} days after your last period started.`,
      };
    },
    relatedSlugs: ["ovulation-calculator", "due-date-calculator"],
    content: {
      intro: [
        "This estimates your most likely conception date forward from your last period and average cycle length, rather than backward from a due date — the two approaches land on the same underlying math but start from different known information, so use whichever date you actually have on hand.",
        "The estimate assumes conception happens on the day of ovulation, which itself is only approximated from a typical 14-day luteal phase. Real cycles shift month to month, so treat the date shown as a likely window rather than a single confirmed day.",
        "It's most useful for people trying to conceive who want to connect a known last-period date to an estimated conception date and a rough due date in one step, without doing the ovulation math separately first.",
        "Everything here is calculated locally in your browser. Conception timing isn't the kind of thing most people want sitting in some company's database, so nothing you type is stored or sent anywhere.",
      ],
      howItWorks: [
        "Conception is estimated at (cycle length − 14) days after your last period started — the same ovulation-timing logic used across cycle-based fertility calculators, since conception can only happen around ovulation.",
        "The due date is then projected 266 days past that estimated conception date, which is the standard pregnancy-length convention used clinically (equivalent to 280 days from the last period for a 28-day cycle).",
      ],
      faq: [
        { q: "How accurate is a conception date estimated from cycle length?", a: "It's a reasonable estimate for people with fairly regular cycles, but it depends on assuming a consistent ~14-day luteal phase — actual ovulation timing varies enough between people and even cycle to cycle that this should be treated as an approximate window." },
        { q: "What's the difference between this and the pregnancy conception calculator?", a: "This one works forward from your last period and cycle length; the pregnancy conception calculator works backward from a known or expected due date. Use whichever starting date you actually have." },
        { q: "Why does a longer cycle push the conception date later?", a: "Because ovulation happens roughly 14 days before your next period regardless of cycle length, a longer cycle means more days pass between the start of your last period and ovulation, shifting the estimated conception date correspondingly later." },
        { q: "Can I use this to confirm I'm pregnant?", a: "No — this only estimates dates based on cycle math and doesn't detect pregnancy itself. A pregnancy test or a healthcare provider is what actually confirms whether conception occurred." },
      ],
    },
  },
  {
    slug: "period-calculator",
    title: "Period Calculator",
    category: "health",
    shortDescription: "Predict your next few period start dates.",
    seoDescription: "Predict your next several menstrual period start dates from your last period and average cycle length.",
    formulaSummary: "Next period ≈ last period + cycle length",
    fields: [
      { name: "lmp", label: "First Day of Last Period", type: "date", defaultValue: "" },
      { name: "cycleLength", label: "Average Cycle Length", type: "number", unit: "days", defaultValue: 28, min: 20, max: 45 },
      { name: "count", label: "Predict Next", type: "number", unit: "cycles", defaultValue: 3, min: 1, max: 12, step: 1 },
    ],
    calculate: (i) => {
      const lmp = parseDateUTC(i.lmp);
      if (!lmp) return { results: [], error: "Enter the first day of your last period." };
      const cycle = n(i.cycleLength, 28);
      const count = Math.round(n(i.count, 3));
      const results = Array.from({ length: count }, (_, idx) => {
        const d = new Date(lmp.getTime() + cycle * (idx + 1) * 86400000);
        return { label: `Predicted Period ${idx + 1}`, value: fmtDate(d), emphasis: idx === 0 };
      });
      const today = new Date();
      const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      const rows = Array.from({ length: count }, (_, idx) => {
        const d = new Date(lmp.getTime() + cycle * (idx + 1) * 86400000);
        const daysUntil = Math.round((d.getTime() - todayUtc) / 86400000);
        return [`Cycle ${idx + 1}`, fmtDate(d), daysUntil >= 0 ? `${daysUntil} days` : "Past"];
      });
      return {
        results,
        table: { headers: ["Cycle", "Predicted Date", "Days Until"], rows },
        chartCaption: `Predictions assume a steady ${cycle}-day cycle — real cycles vary, so treat dates further out as rougher estimates.`,
      };
    },
    relatedSlugs: ["ovulation-calculator"],
    content: {
      intro: [
        "This projects your next several period start dates by repeatedly adding your average cycle length to the first day of your last period — a simple forward projection rather than anything that accounts for the natural variation most cycles have from month to month.",
        "The further out a prediction sits, the less reliable it is. Cycle length isn't perfectly constant for most people, so while the very next predicted date is usually reasonably close, predictions three, six, or twelve cycles out can drift noticeably from what actually happens.",
        "It's a quick way to get a rough calendar of upcoming period dates for planning purposes — travel, events, or just knowing roughly when to expect the next one — without maintaining a dedicated cycle-tracking app.",
        "Menstrual cycle data is sensitive by any measure, so this runs entirely client-side: nothing about your cycle history or predicted dates is sent off your device or stored anywhere.",
      ],
      faq: [
        { q: "How does this calculator predict future period dates?", a: "It adds your average cycle length to the start date of your last period repeatedly, once for each cycle you ask it to predict, producing a simple straight-line projection rather than one that adapts to natural month-to-month variation." },
        { q: "Why might my actual period differ from the predicted date?", a: "Cycle length naturally varies for most people due to stress, illness, travel, hormonal changes, and other factors this calculator has no way to account for — it only projects forward using one fixed average length." },
        { q: "How many cycles ahead should I trust these predictions?", a: "Treat the nearest one or two predictions as the most reliable, since small variations in actual cycle length compound with each cycle projected further into the future." },
        { q: "What if my cycle length varies a lot from month to month?", a: "This calculator's single-average approach will be less useful for you — consider tracking a few recent cycles' actual lengths and using your typical range rather than relying heavily on far-out predictions." },
        { q: "Is this the same as an ovulation prediction?", a: "No — this predicts period start dates specifically. For estimated ovulation and fertile-window dates, the ovulation calculator applies a different calculation based on a typical luteal phase length." },
      ],
    },
  },
  {
    slug: "gfr-calculator",
    title: "GFR Calculator",
    category: "health",
    shortDescription: "Estimate kidney function (eGFR) using the 2021 CKD-EPI creatinine equation.",
    seoDescription: "Estimate glomerular filtration rate (eGFR) using the race-free 2021 CKD-EPI creatinine equation.",
    formulaSummary: "2021 CKD-EPI creatinine equation",
    fields: [
      sexField,
      { name: "age", label: "Age", type: "number", unit: "years", defaultValue: 50, min: 18, max: 110 },
      { name: "creatinine", label: "Serum Creatinine", type: "number", unit: "mg/dL", defaultValue: 1.0, step: 0.01, min: 0.1 },
    ],
    calculate: (i) => {
      const age = n(i.age, 50);
      const scr = n(i.creatinine, 1);
      let gfr: number;
      if (i.sex === "female") {
        const k = 0.7;
        const alpha = scr <= k ? -0.241 : -1.2;
        gfr = 142 * Math.pow(scr / k, alpha) * Math.pow(0.9938, age) * 1.012;
      } else {
        const k = 0.9;
        const alpha = scr <= k ? -0.302 : -1.2;
        gfr = 142 * Math.pow(scr / k, alpha) * Math.pow(0.9938, age);
      }
      let stage = "Normal (Stage 1)";
      if (gfr < 15) stage = "Kidney failure (Stage 5)";
      else if (gfr < 30) stage = "Severely decreased (Stage 4)";
      else if (gfr < 45) stage = "Moderately-severely decreased (Stage 3b)";
      else if (gfr < 60) stage = "Mildly-moderately decreased (Stage 3a)";
      else if (gfr < 90) stage = "Mildly decreased (Stage 2)";
      return {
        results: [
          { label: "Estimated GFR", value: `${fmtNumber(gfr, 0)} mL/min/1.73m²`, emphasis: true },
          { label: "CKD Stage", value: stage, emphasis: true },
        ],
        notes: ["Uses the 2021 CKD-EPI race-free creatinine equation. This is a screening estimate, not a diagnosis — discuss results with a clinician."],
        gauge: {
          value: gfr,
          min: 0,
          max: 120,
          valueLabel: fmtNumber(gfr, 0),
          zones: [
            { label: "Stage 5", to: 15, barClass: "bg-red-500 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "Stage 4", to: 30, barClass: "bg-orange-500 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Stage 3b", to: 45, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Stage 3a", to: 60, barClass: "bg-yellow-400 dark:bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
            { label: "Stage 2", to: 90, barClass: "bg-lime-400 dark:bg-lime-500", textClass: "text-lime-600 dark:text-lime-400" },
            { label: "Normal", to: 120, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
          ],
        },
        chartCaption: `An eGFR of ${fmtNumber(gfr, 0)} mL/min/1.73m² places you in the "${stage}" range.`,
      };
    },
    relatedSlugs: ["bmi-calculator"],
    content: {
      intro: [
        "Glomerular filtration rate (GFR) estimates how well your kidneys are filtering blood, and this calculator reproduces the 2021 CKD-EPI creatinine equation — the current standard, race-free formula used in most U.S. labs — from your age, sex, and a serum creatinine value you'd typically get from a routine blood test.",
        "This is an estimate built from a lab number you already have, not a new diagnostic test. eGFR from a single creatinine reading can be thrown off by dehydration, recent muscle-heavy exercise, muscle mass itself, and other factors your doctor accounts for when interpreting results — a single number here isn't a diagnosis of kidney disease.",
        "People typically use this after getting bloodwork back to understand what the creatinine number on a lab report actually translates to in eGFR terms and CKD stage, or to track how a result compares to a previous one.",
        "You need a specific creatinine value from a real blood draw to use this meaningfully, but the number itself is calculated locally — nothing about your labs is transmitted or saved anywhere outside your own device.",
      ],
      howItWorks: [
        "The 2021 CKD-EPI equation uses your creatinine relative to a sex-specific reference value (kappa), raised to a power that differs depending on whether your creatinine is above or below that reference — then adjusted by an age-based decay factor, since kidney function typically declines gradually with age.",
        "The 2021 version removed the race coefficient used in earlier CKD-EPI formulas, following recommendations that race-based adjustments weren't clinically justified — this calculator uses only age, sex, and creatinine, matching current U.S. lab standard practice.",
      ],
      faq: [
        { q: "What is a normal eGFR result?", a: "An eGFR of 90 or above is generally considered normal kidney function (Stage 1 if other kidney damage markers are present, or simply normal otherwise) — values below that are grouped into progressively lower CKD stages, though a single reading isn't diagnostic on its own." },
        { q: "Why does this calculator ask for sex but not race?", a: "It implements the 2021 CKD-EPI creatinine equation, which removed the race coefficient present in the older 2009 version after evaluation found race-based adjustment wasn't clinically well justified — sex is still a factor because average muscle mass and creatinine production differ by sex." },
        { q: "Can a single creatinine test accurately diagnose kidney disease?", a: "Not on its own — creatinine and eGFR can fluctuate with hydration, recent exercise, and diet, so clinicians typically look at trends across multiple tests and often confirm findings with additional markers before diagnosing CKD." },
        { q: "What can cause a falsely low or high eGFR reading?", a: "Dehydration, high muscle mass, recent intense exercise, and certain medications can all shift creatinine levels temporarily without reflecting an actual change in kidney function, which is one reason a single reading is interpreted cautiously." },
        { q: "What should I do if my eGFR result is low?", a: "Discuss it with a healthcare provider — this calculator can tell you what stage a creatinine value falls into by the standard formula, but it can't evaluate your overall clinical picture or recommend next steps the way a doctor can." },
      ],
    },
  },
  {
    slug: "body-type-calculator",
    title: "Body Type Calculator",
    category: "health",
    shortDescription: "Estimate your body frame type (somatotype) from your wrist size and height.",
    seoDescription: "Estimate whether you have an ectomorph, mesomorph, or endomorph body frame from your height and wrist circumference.",
    formulaSummary: "Height ÷ wrist circumference ratio thresholds",
    fields: [
      sexField,
      { name: "heightCm", label: "Height", type: "number", unit: "cm", defaultValue: 175, min: 1, convertPair: cmInPair("heightCm") },
      { name: "wristCm", label: "Wrist Circumference", type: "number", unit: "cm", defaultValue: 16, min: 1, convertPair: cmInPair("wristCm") },
    ],
    calculate: (i) => {
      const ratio = n(i.heightCm, 175) / n(i.wristCm, 16);
      const thresholds = i.sex === "female" ? [10.75, 11.5] : [10.4, 11.1];
      let type = "Mesomorph (athletic frame)";
      if (ratio > thresholds[1]) type = "Ectomorph (slender frame)";
      else if (ratio < thresholds[0]) type = "Endomorph (broader frame)";
      const gaugeMax = Math.max(12.5, thresholds[1] + 1);
      return {
        results: [{ label: "Estimated Body Type", value: type, emphasis: true }],
        notes: ["A rough frame-size estimate based on the height-to-wrist ratio method — not a precise medical classification."],
        gauge: {
          value: ratio,
          min: 9,
          max: gaugeMax,
          valueLabel: fmtNumber(ratio, 2),
          zones: [
            { label: "Endomorph", to: thresholds[0], barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Mesomorph", to: thresholds[1], barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Ectomorph", to: gaugeMax, barClass: "bg-indigo-400 dark:bg-indigo-500", textClass: "text-indigo-600 dark:text-indigo-400" },
          ],
        },
        chartCaption: `Your height-to-wrist ratio of ${fmtNumber(ratio, 2)} places you toward the ${type.split(" ")[0]} end of the frame-size spectrum.`,
      };
    },
    relatedSlugs: ["lean-body-mass-calculator"],
    content: {
      intro: [
        "This estimates a body frame type — ectomorph, mesomorph, or endomorph — from the ratio of your height to your wrist circumference, a simple proxy some fitness circles use for bone frame size rather than actual body fat or muscle content.",
        "The three-category somatotype system originated in mid-20th-century physique research and isn't a precise medical classification — most real bodies are some blend of the three categories rather than a clean fit into one, and this wrist-ratio method is a rough shortcut, not a measurement of your actual skeletal structure.",
        "It's mostly used informally in fitness contexts to get a general sense of natural body frame — some people use it to set expectations around muscle-gain or fat-loss goals, on the idea that frame size affects how a body tends to respond to training.",
        "Height and wrist measurements aren't especially sensitive, but the calculation still runs entirely in your browser with nothing recorded or transmitted.",
      ],
      howItWorks: [
        "The ratio is simply height divided by wrist circumference — a higher ratio (larger height relative to a slender wrist) leans ectomorph, while a lower ratio (relatively thick wrist for the height) leans endomorph, with mesomorph in between.",
        "Thresholds differ by sex because average bone structure and typical wrist-to-height proportions differ between men and women, so the same ratio number can map to a different category depending on which sex-specific threshold set is applied.",
      ],
      faq: [
        { q: "What do ectomorph, mesomorph, and endomorph actually mean?", a: "They're a mid-20th-century classification of general body frame: ectomorph describes a naturally slender frame, mesomorph a naturally athletic/muscular frame, and endomorph a naturally broader frame — they describe frame tendency, not fitness level or body fat directly." },
        { q: "How accurate is the wrist-to-height ratio method?", a: "It's a rough, informal proxy rather than a validated medical measurement — actual frame size involves bone structure and joint measurements this simple ratio doesn't fully capture, so treat the result as a general indication, not a precise classification." },
        { q: "Can I change my body type through diet or exercise?", a: "Bone frame itself doesn't change much in adulthood, but body composition (muscle and fat) absolutely does — many people use somatotype loosely to describe overall physique goals even though the underlying frame classification is meant to be more fixed." },
        { q: "Why does the calculator ask for sex before giving a result?", a: "Because typical wrist-to-height proportions differ between men and women, using sex-specific thresholds gives a more meaningful category placement than applying one universal cutoff to everyone." },
      ],
    },
  },
  {
    slug: "body-surface-area-calculator",
    title: "Body Surface Area Calculator",
    category: "health",
    shortDescription: "Calculate body surface area using the Mosteller formula (used for drug dosing).",
    seoDescription: "Calculate body surface area (BSA) in square meters using the Mosteller formula, commonly used for medication dosing.",
    formulaSummary: "BSA = √(height(cm) × weight(kg) / 3600)",
    fields: [...unitFields],
    calculate: (i) => {
      const bsa = Math.sqrt((heightCm(i) * weightKg(i)) / 3600);
      const reference = 1.73;
      return {
        results: [{ label: "Body Surface Area", value: `${fmtNumber(bsa, 2)} m²`, emphasis: true }],
        formula: "BSA = √(height(cm) × weight(kg) / 3600)",
        compare: [
          { label: "Your BSA", value: bsa, displayValue: `${fmtNumber(bsa, 2)} m²`, highlight: true },
          { label: "Standard Reference (1.73 m²)", value: reference, displayValue: `${fmtNumber(reference, 2)} m²` },
        ],
        chartCaption: `Drug doses are often standardized to a 1.73 m² "reference" adult — yours is ${bsa < reference ? "smaller" : "larger"} by ${fmtNumber(Math.abs(bsa - reference), 2)} m².`,
      };
    },
    relatedSlugs: ["bmi-calculator"],
    content: {
      intro: [
        "Body surface area (BSA) estimates the total area of your skin in square meters, calculated here with the Mosteller formula from your height and weight. It's a clinical measurement, most commonly used to scale medication doses — particularly chemotherapy — more precisely than a flat dose or a weight-only dose would.",
        "This calculator reproduces the formula for informational purposes, but BSA-based dosing in real clinical settings is determined and verified by a physician or pharmacist, never by a self-service calculator — do not use this output to adjust or self-manage any actual medication dose.",
        "It's used by clinicians and students who want a quick BSA reference calculation, or by anyone curious how their own BSA compares to the standard 1.73 m² reference adult that many dosing formulas and lab-value normalizations are built around.",
        "Height and weight are calculated locally in your browser here, with nothing saved or sent off your device.",
      ],
      howItWorks: [
        "The Mosteller formula is BSA = √(height(cm) × weight(kg) / 3600) — a simpler square-root formula that's widely used in practice because it's easy to compute correctly while remaining close to more complex historical formulas like Du Bois across most adult body sizes.",
        "The 1.73 m² reference figure shown for comparison represents a standardized 'average' adult body surface area, a benchmark against which many drug doses and some lab values (like eGFR) are traditionally normalized.",
      ],
      faq: [
        { q: "What is body surface area used for?", a: "It's most commonly used in medicine to calculate drug doses — especially chemotherapy and some other high-precision medications — more accurately than dosing by weight alone, since BSA correlates better with certain physiological processes like blood volume and metabolic rate." },
        { q: "Is this calculator safe to use for determining my medication dose?", a: "No — actual medication dosing must be calculated and verified by a physician or pharmacist using clinical protocols. This calculator is for general informational and educational reference only." },
        { q: "What is the Mosteller formula and why is it used?", a: "It's a simplified square-root formula for estimating BSA from height and weight, popular because it's easy to compute by hand or calculator while staying close to the results of older, more complex formulas like Du Bois for most adult sizes." },
        { q: "Why is 1.73 m² used as a reference?", a: "It represents a standardized 'typical adult' body surface area that many medical formulas and lab value normalizations (like eGFR results) are built around, letting results be compared on a consistent scale regardless of an individual's actual size." },
      ],
    },
  },
  {
    slug: "anorexic-bmi-calculator",
    title: "Anorexic BMI Calculator",
    category: "health",
    shortDescription: "Calculate BMI with detailed underweight severity categories.",
    seoDescription: "Calculate BMI with finer-grained underweight severity categories (mild, moderate, severe thinness).",
    formulaSummary: "BMI = weight(kg) / height(m)²",
    fields: [...unitFields],
    calculate: (i) => {
      const bmi = bmiOf(weightKg(i), heightCm(i));
      let category = "Normal weight";
      if (bmi < 16) category = "Severe thinness";
      else if (bmi < 17) category = "Moderate thinness";
      else if (bmi < 18.5) category = "Mild thinness";
      else if (bmi >= 25) category = "Above normal weight";
      return {
        results: [
          { label: "BMI", value: fmtNumber(bmi, 1), emphasis: true },
          { label: "Category", value: category, emphasis: true },
        ],
        notes: [
          "A low BMI alone doesn't diagnose an eating disorder. If you or someone you know is struggling, the National Eating Disorders Association helpline (US) is 1-800-931-2237.",
        ],
        gauge: {
          value: bmi,
          min: 12,
          max: 32,
          valueLabel: fmtNumber(bmi, 1),
          zones: [
            { label: "Severe", to: 16, barClass: "bg-rose-600 dark:bg-rose-500", textClass: "text-rose-700 dark:text-rose-400" },
            { label: "Moderate", to: 17, barClass: "bg-orange-500 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Mild", to: 18.5, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Normal", to: 25, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Above Normal", to: 32, barClass: "bg-slate-400 dark:bg-slate-500", textClass: "text-slate-600 dark:text-slate-400" },
          ],
        },
        chartCaption: `A BMI of ${fmtNumber(bmi, 1)} falls in the "${category}" category — remember BMI alone never confirms or rules out an eating disorder.`,
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
    content: {
      intro: [
        "This is a standard BMI calculation with one difference: instead of a single 'underweight' bucket below 18.5, it splits that range into mild, moderate, and severe thinness categories — the same finer breakdown used in some clinical contexts for classifying low body weight.",
        "BMI is a simple height-and-weight ratio, and like any BMI number it says nothing about muscle mass, bone density, or overall health, and a low BMI reading alone does not diagnose an eating disorder or any specific medical condition — clinical diagnosis involves far more than a single number.",
        "It's used by people who want a more granular read on where a low BMI falls, including clinicians, researchers, and individuals monitoring weight for medical reasons — the extra categories are simply a finer lens on the same underlying BMI math, not a different or more advanced test.",
        "Weight and height can be sensitive numbers to enter anywhere, particularly here — this calculator runs entirely in your browser, with nothing saved or transmitted.",
      ],
      faq: [
        { q: "What BMI counts as severe thinness?", a: "This calculator labels a BMI under 16 as severe thinness, 16 to 17 as moderate thinness, and 17 to 18.5 as mild thinness — these are the same threshold bands used in some clinical classification systems for underweight status." },
        { q: "Does a low BMI mean someone has an eating disorder?", a: "No — a low BMI alone is not a diagnosis. Eating disorders are diagnosed by qualified professionals based on a much broader clinical picture, not a single weight-and-height ratio." },
        { q: "Is BMI a reliable measure for everyone?", a: "No — BMI doesn't account for muscle mass, frame size, or body composition, so it can misclassify very muscular or naturally slight-framed individuals at either end of the scale." },
        { q: "What should I do if I'm concerned about my own or someone else's weight?", a: "Reach out to a healthcare provider. If you or someone you know may be struggling with disordered eating, the National Eating Disorders Association helpline (US) is 1-800-931-2237 — support is available and this calculator is not a substitute for it." },
      ],
    },
  },
  {
    slug: "weight-watchers-points-calculator",
    title: "Food Points Calculator",
    category: "health",
    shortDescription: "Estimate a points value for a food from its calories, sugar, saturated fat and protein.",
    seoDescription: "Estimate a diet-tracking points value for a food based on calories, sugar, saturated fat and protein content.",
    formulaSummary: "An unofficial approximation of points-style food scoring systems",
    fields: [
      { name: "calories", label: "Calories", type: "number", defaultValue: 250, min: 0 },
      { name: "sugarG", label: "Sugar", type: "number", unit: "g", defaultValue: 8, min: 0 },
      { name: "satFatG", label: "Saturated Fat", type: "number", unit: "g", defaultValue: 3, min: 0 },
      { name: "proteinG", label: "Protein", type: "number", unit: "g", defaultValue: 10, min: 0 },
    ],
    calculate: (i) => {
      const caloriePts = n(i.calories) * 0.0305;
      const sugarPts = n(i.sugarG) * 0.0803;
      const satFatPts = n(i.satFatG) * 0.275;
      const proteinCredit = n(i.proteinG) * 0.0225;
      const points = caloriePts + sugarPts + satFatPts - proteinCredit;
      return {
        results: [{ label: "Estimated Points", value: fmtNumber(Math.max(0, points), 0), emphasis: true }],
        notes: ["An independent approximation for educational use — not affiliated with or identical to any commercial points-based program's proprietary formula."],
        breakdown: [
          { label: "From Calories", value: caloriePts, displayValue: fmtNumber(caloriePts, 1) },
          { label: "From Sugar", value: sugarPts, displayValue: fmtNumber(sugarPts, 1) },
          { label: "From Saturated Fat", value: satFatPts, displayValue: fmtNumber(satFatPts, 1) },
        ],
        chartCaption: `Before the ${fmtNumber(proteinCredit, 1)}-point protein credit is subtracted, this is what drives the score up.`,
      };
    },
    relatedSlugs: ["calorie-calculator"],
    content: {
      intro: [
        "This gives a rough points-style score for a food based on its calories, sugar, saturated fat, and protein — the same general ingredients that popular points-based diet tracking systems weigh when scoring a food, combined here into an independent approximation.",
        "This is not any commercial program's actual proprietary formula, and it isn't affiliated with or endorsed by one — the real formulas used by branded points systems aren't publicly published, so this is an educational approximation built from publicly known scoring factors, not a guaranteed match to any specific app's number.",
        "People use it as a quick estimate when they don't have access to an official app, or want a general sense of how a food's calories, sugar, and fat content trade off against its protein content in a points-style score.",
        "The nutrition numbers you enter are calculated locally in your browser and never sent anywhere or stored.",
      ],
      faq: [
        { q: "Is this the same as an official points-based diet program's score?", a: "No — this is an independent, unofficial approximation built from publicly known scoring factors like calories, sugar, saturated fat, and protein. It is not affiliated with any specific commercial program and won't necessarily match its exact proprietary numbers." },
        { q: "Why does protein lower the score?", a: "Points-style scoring systems typically give a credit for protein content, since foods higher in protein tend to be more satiating relative to their calorie content — that credit is subtracted from the calorie/sugar/fat portion of the score here." },
        { q: "Can the estimated points value be negative?", a: "The calculator floors the result at zero, since a food's points score conceptually can't go below that even if the protein credit outweighs the calorie, sugar, and fat contributions in the underlying math." },
        { q: "Why do sugar and saturated fat count against the score more than plain calories?", a: "This approximation weights sugar and saturated fat more heavily per gram than plain calories, reflecting the general design pattern of points-style systems that nudge toward less-processed, lower-sugar, lower-saturated-fat food choices rather than just tracking raw calorie count." },
      ],
    },
  },
  {
    slug: "overweight-calculator",
    title: "Overweight Calculator",
    category: "health",
    shortDescription: "Find out how much above a healthy BMI range your current weight is.",
    seoDescription: "Calculate how many pounds or kilograms above the healthy BMI range (18.5–24.9) your current weight is.",
    formulaSummary: "Excess weight = current weight − weight at BMI 24.9",
    fields: [...unitFields],
    calculate: (i) => {
      const kg = weightKg(i);
      const cm = heightCm(i);
      const bmi = bmiOf(kg, cm);
      const m = cm / 100;
      const healthyMaxKg = 24.9 * m * m;
      const excess = kg - healthyMaxKg;
      return {
        results: [
          { label: "Current BMI", value: fmtNumber(bmi, 1), emphasis: true },
          {
            label: excess > 0 ? "Above Healthy Range By" : "Within Healthy Range",
            value: excess > 0 ? `${fmtNumber(excess, 1)} kg (${fmtNumber(kgToLb(excess), 1)} lb)` : "Yes",
            emphasis: true,
          },
        ],
        compare: [
          { label: "Your Weight", value: kg, displayValue: `${fmtNumber(kg, 1)} kg (${fmtNumber(kgToLb(kg), 1)} lb)`, highlight: true },
          { label: "Healthy Max (BMI 24.9)", value: healthyMaxKg, displayValue: `${fmtNumber(healthyMaxKg, 1)} kg (${fmtNumber(kgToLb(healthyMaxKg), 1)} lb)` },
        ],
        chartCaption:
          excess > 0
            ? `You're about ${fmtNumber(excess, 1)} kg above the healthy-BMI ceiling for your height.`
            : `You're within the healthy-BMI range for your height — no excess to report.`,
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
    content: {
      intro: [
        "Rather than just returning a BMI number, this calculator translates it into a concrete figure: how many pounds or kilograms above the healthy-BMI ceiling (24.9) your current weight sits, given your height. It's the same BMI math most calculators use, just expressed as a weight difference instead of an abstract index number.",
        "BMI thresholds are population-level guidelines and don't account for muscle mass, frame, or where body fat is distributed — someone with a lot of muscle can show 'excess' weight by this calculation without carrying excess body fat, so treat the result as a screening reference rather than a personal verdict.",
        "It's useful for people who find a raw BMI number hard to act on and want it translated into something more concrete — how many pounds would bring them back into the standard healthy range — as a starting reference point rather than a fixed goal.",
        "Height and weight are about as commonly-typed numbers as it gets, but they're still personal — this calculator keeps the whole calculation local to your browser, with nothing saved or sent anywhere.",
      ],
      faq: [
        { q: "How is 'excess weight' calculated here?", a: "It subtracts your current weight from the weight that would put you exactly at a BMI of 24.9 for your height — the top of the standard 'normal' BMI range — so a positive result means you're above that threshold by the shown amount." },
        { q: "Does this mean I need to lose exactly that amount of weight?", a: "Not necessarily — it shows the gap to the top of the standard BMI-normal range, but BMI doesn't account for muscle mass or individual health factors, so it's a reference point rather than a personalized weight-loss target." },
        { q: "Can a muscular person show as 'overweight' by this calculation?", a: "Yes — because BMI only relates weight to height and can't distinguish muscle from fat, someone with substantial muscle mass can be flagged as above the healthy-BMI range here despite having a low body fat percentage." },
        { q: "What BMI counts as the healthy range's upper limit?", a: "This calculator uses 24.9 as the top of the standard normal-BMI range, consistent with the commonly cited 18.5–24.9 'normal weight' classification — a BMI at or above 25 is generally categorized as overweight." },
        { q: "Is BMI alone enough to determine if I'm a healthy weight?", a: "No — BMI is a useful screening tool at a population level, but it doesn't measure body fat percentage, muscle mass, or fat distribution directly, so a full picture of health typically involves more than one measurement." },
      ],
    },
  },
];

export default health2;
