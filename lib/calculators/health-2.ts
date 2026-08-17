import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { unitFields, heightCm, weightKg, kgToLb, sexField } from "./health-helpers";

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
      return {
        results: [
          { label: "Current Gestational Age", value: daysAlong >= 0 ? `${week} weeks, ${day} days` : "Not started yet", emphasis: true },
          { label: "Trimester", value: daysAlong >= 0 && daysAlong < 294 ? trimester : "—" },
          { label: "Estimated Conception Date", value: fmtDate(conception) },
          { label: "Estimated Due Date", value: fmtDate(due), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["due-date-calculator", "pregnancy-weight-gain-calculator"],
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
      return {
        results: [
          { label: "Pre-Pregnancy BMI", value: fmtNumber(bmi, 1) },
          { label: "Category", value: category },
          { label: "Recommended Total Gain", value: `${fmtNumber(range[0])}–${fmtNumber(range[1])} kg (${fmtNumber(toLb(range[0]))}–${fmtNumber(toLb(range[1]))} lb)`, emphasis: true },
        ],
        notes: ["Based on Institute of Medicine (IOM) guidelines for a single pregnancy — twins/multiples have higher targets. Always follow your provider's specific guidance."],
      };
    },
    relatedSlugs: ["pregnancy-calculator", "bmi-calculator"],
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
      };
    },
    relatedSlugs: ["due-date-calculator", "ovulation-calculator"],
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
      { name: "heightIn", label: "Height", type: "number", unit: "in", defaultValue: 70, min: 1 },
      { name: "neckIn", label: "Neck", type: "number", unit: "in", defaultValue: 15, min: 1 },
      { name: "waistIn", label: "Waist (at navel)", type: "number", unit: "in", defaultValue: 34, min: 1 },
      { name: "hipIn", label: "Hip", type: "number", unit: "in", defaultValue: 38, min: 0, showIf: (i) => i.sex === "female" },
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
      return {
        results: [{ label: "Estimated Body Fat", value: `${fmtNumber(bf, 1)}%`, emphasis: true }],
        notes: ["Official Army Body Composition Program standards vary by age and sex — this gives the same style of tape-test estimate, not an official pass/fail determination."],
      };
    },
    relatedSlugs: ["body-fat-calculator"],
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
      const grams = (n(i.dailyCalories) * (n(i.carbPercent, 45) / 100)) / 4;
      return { results: [{ label: "Daily Carbohydrate Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }] };
    },
    relatedSlugs: ["macro-calculator", "protein-calculator"],
  },
  {
    slug: "healthy-weight-calculator",
    title: "Healthy Weight Calculator",
    category: "health",
    shortDescription: "Find the healthy weight range for your height based on BMI.",
    seoDescription: "Calculate the healthy weight range for your height using the standard 18.5–24.9 BMI range.",
    formulaSummary: "Weight range = BMI(18.5 to 24.9) × height(m)²",
    fields: [{ name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 3 }, { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11 }],
    calculate: (i) => {
      const cm = n(i.heightFt, 5) * 30.48 + n(i.heightIn, 9) * 2.54;
      const m = cm / 100;
      const lowKg = 18.5 * m * m;
      const highKg = 24.9 * m * m;
      return {
        results: [
          { label: "Healthy Weight Range", value: `${fmtNumber(lowKg, 1)}–${fmtNumber(highKg, 1)} kg (${fmtNumber(kgToLb(lowKg), 1)}–${fmtNumber(kgToLb(highKg), 1)} lb)`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["bmi-calculator", "ideal-weight-calculator"],
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
      const total = kcalPerMin * n(i.minutes, 30);
      return { results: [{ label: "Calories Burned", value: `${fmtNumber(total, 0)} kcal`, emphasis: true }] };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
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
      return { results: [{ label: "Daily Protein Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }] };
    },
    relatedSlugs: ["macro-calculator", "carbohydrate-calculator"],
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
      const grams = (n(i.dailyCalories) * (n(i.fatPercent, 30) / 100)) / 9;
      return { results: [{ label: "Daily Fat Target", value: `${fmtNumber(grams, 0)} g`, emphasis: true }] };
    },
    relatedSlugs: ["macro-calculator", "carbohydrate-calculator"],
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
      return {
        results: [
          { label: "Estimated Ovulation Date", value: fmtDate(ovulation), emphasis: true },
          { label: "Fertile Window", value: `${fmtDate(fertileStart)} – ${fmtDate(fertileEnd)}`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["conception-calculator", "period-calculator"],
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
      };
    },
    relatedSlugs: ["ovulation-calculator", "due-date-calculator"],
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
      return { results };
    },
    relatedSlugs: ["ovulation-calculator"],
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
      };
    },
    relatedSlugs: ["bmi-calculator"],
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
      { name: "heightCm", label: "Height", type: "number", unit: "cm", defaultValue: 175, min: 1 },
      { name: "wristCm", label: "Wrist Circumference", type: "number", unit: "cm", defaultValue: 16, min: 1 },
    ],
    calculate: (i) => {
      const ratio = n(i.heightCm, 175) / n(i.wristCm, 16);
      const thresholds = i.sex === "female" ? [10.75, 11.5] : [10.4, 11.1];
      let type = "Mesomorph (athletic frame)";
      if (ratio > thresholds[1]) type = "Ectomorph (slender frame)";
      else if (ratio < thresholds[0]) type = "Endomorph (broader frame)";
      return {
        results: [{ label: "Estimated Body Type", value: type, emphasis: true }],
        notes: ["A rough frame-size estimate based on the height-to-wrist ratio method — not a precise medical classification."],
      };
    },
    relatedSlugs: ["lean-body-mass-calculator"],
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
      return { results: [{ label: "Body Surface Area", value: `${fmtNumber(bsa, 2)} m²`, emphasis: true }], formula: "BSA = √(height(cm) × weight(kg) / 3600)" };
    },
    relatedSlugs: ["bmi-calculator"],
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
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
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
      const points = n(i.calories) * 0.0305 + n(i.sugarG) * 0.0803 + n(i.satFatG) * 0.275 - n(i.proteinG) * 0.0225;
      return {
        results: [{ label: "Estimated Points", value: fmtNumber(Math.max(0, points), 0), emphasis: true }],
        notes: ["An independent approximation for educational use — not affiliated with or identical to any commercial points-based program's proprietary formula."],
      };
    },
    relatedSlugs: ["calorie-calculator"],
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
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
  },
];

export default health2;
