import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { unitFields, heightCm, weightKg, sexField, bmrMifflin, ACTIVITY } from "./health-helpers";

const health: CalculatorDefinition[] = [
  {
    slug: "bmi-calculator",
    title: "BMI Calculator",
    category: "health",
    shortDescription: "Calculate Body Mass Index and see your weight category.",
    seoDescription: "Calculate your Body Mass Index (BMI) from height and weight, in metric or imperial units, with your weight category.",
    formulaSummary: "BMI = weight(kg) / height(m)²",
    fields: [...unitFields],
    calculate: (i) => {
      const kg = weightKg(i);
      const m = heightCm(i) / 100;
      const bmi = kg / (m * m);
      let category = "Normal weight";
      if (bmi < 18.5) category = "Underweight";
      else if (bmi >= 25 && bmi < 30) category = "Overweight";
      else if (bmi >= 30) category = "Obese";
      return {
        results: [
          { label: "BMI", value: fmtNumber(bmi, 1), emphasis: true },
          { label: "Category", value: category, emphasis: true },
        ],
        formula: "BMI = weight(kg) / height(m)²",
        steps: [
          `Weight = ${fmtNumber(kg, 1)} kg, Height = ${fmtNumber(m, 2)} m`,
          `BMI = ${fmtNumber(kg, 1)} / ${fmtNumber(m, 2)}² = ${fmtNumber(bmi, 1)}`,
        ],
        notes: ["BMI ranges: Underweight <18.5 · Normal 18.5–24.9 · Overweight 25–29.9 · Obese ≥30. BMI doesn't account for muscle mass — the Body Fat Calculator is more precise for athletes."],
      };
    },
    relatedSlugs: ["body-fat-calculator", "ideal-weight-calculator", "calorie-calculator"],
  },
  {
    slug: "bmr-calculator",
    title: "BMR Calculator",
    category: "health",
    shortDescription: "Calculate your Basal Metabolic Rate — calories burned at rest.",
    seoDescription: "Calculate your Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation.",
    formulaSummary: "Mifflin-St Jeor: 10×kg + 6.25×cm − 5×age + (5 men / −161 women)",
    fields: [sexField, { name: "age", label: "Age", type: "number", unit: "years", defaultValue: 30, min: 1, max: 120 }, ...unitFields],
    calculate: (i) => {
      const bmr = bmrMifflin(weightKg(i), heightCm(i), n(i.age, 30), i.sex);
      return {
        results: [{ label: "BMR", value: `${fmtNumber(bmr, 0)} kcal/day`, emphasis: true }],
        formula: "BMR = 10×weight(kg) + 6.25×height(cm) − 5×age + (5 for men, −161 for women)",
        notes: ["This is calories burned at complete rest. See the Calorie Calculator to include activity level."],
      };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
  },
  {
    slug: "calorie-calculator",
    title: "Calorie Calculator",
    category: "health",
    shortDescription: "Estimate your daily calorie needs to maintain, lose or gain weight.",
    seoDescription: "Calculate your daily calorie needs based on BMR, activity level and weight goal.",
    formulaSummary: "TDEE = BMR × activity factor; goal = TDEE ± deficit/surplus",
    fields: [
      sexField,
      { name: "age", label: "Age", type: "number", unit: "years", defaultValue: 30, min: 1, max: 120 },
      ...unitFields,
      {
        name: "activity",
        label: "Activity Level",
        type: "select",
        defaultValue: "moderate",
        options: Object.entries(ACTIVITY).map(([value, v]) => ({ value, label: v.label })),
      },
      {
        name: "goal",
        label: "Goal",
        type: "select",
        defaultValue: "maintain",
        options: [
          { value: "loseFast", label: "Lose weight fast (−1 lb/wk)" },
          { value: "lose", label: "Lose weight (−0.5 lb/wk)" },
          { value: "maintain", label: "Maintain weight" },
          { value: "gain", label: "Gain weight (+0.5 lb/wk)" },
          { value: "gainFast", label: "Gain weight fast (+1 lb/wk)" },
        ],
      },
    ],
    calculate: (i) => {
      const bmr = bmrMifflin(weightKg(i), heightCm(i), n(i.age, 30), i.sex);
      const factor = ACTIVITY[i.activity]?.factor ?? 1.55;
      const tdee = bmr * factor;
      const deltas: Record<string, number> = { loseFast: -500, lose: -250, maintain: 0, gain: 250, gainFast: 500 };
      const goalCalories = tdee + (deltas[i.goal] ?? 0);
      return {
        results: [
          { label: "Calories to Maintain (TDEE)", value: `${fmtNumber(tdee, 0)} kcal/day` },
          { label: "Calories for Your Goal", value: `${fmtNumber(goalCalories, 0)} kcal/day`, emphasis: true },
          { label: "BMR (resting)", value: `${fmtNumber(bmr, 0)} kcal/day` },
        ],
        steps: [
          `BMR = ${fmtNumber(bmr, 0)} kcal/day`,
          `TDEE = BMR × activity factor (${factor}) = ${fmtNumber(tdee, 0)} kcal/day`,
          `Goal adjustment: ${deltas[i.goal] >= 0 ? "+" : ""}${deltas[i.goal] ?? 0} kcal/day → ${fmtNumber(goalCalories, 0)} kcal/day`,
        ],
      };
    },
    relatedSlugs: ["bmr-calculator", "tdee-calculator", "macro-calculator"],
  },
  {
    slug: "tdee-calculator",
    title: "TDEE Calculator",
    category: "health",
    shortDescription: "Calculate your Total Daily Energy Expenditure.",
    seoDescription: "Calculate your Total Daily Energy Expenditure (TDEE) — the calories you burn per day including activity.",
    formulaSummary: "TDEE = BMR × activity factor",
    fields: [
      sexField,
      { name: "age", label: "Age", type: "number", unit: "years", defaultValue: 30, min: 1, max: 120 },
      ...unitFields,
      {
        name: "activity",
        label: "Activity Level",
        type: "select",
        defaultValue: "moderate",
        options: Object.entries(ACTIVITY).map(([value, v]) => ({ value, label: v.label })),
      },
    ],
    calculate: (i) => {
      const bmr = bmrMifflin(weightKg(i), heightCm(i), n(i.age, 30), i.sex);
      const factor = ACTIVITY[i.activity]?.factor ?? 1.55;
      const tdee = bmr * factor;
      return {
        results: [
          { label: "TDEE", value: `${fmtNumber(tdee, 0)} kcal/day`, emphasis: true },
          { label: "BMR", value: `${fmtNumber(bmr, 0)} kcal/day` },
        ],
        formula: "TDEE = BMR × activity factor",
      };
    },
    relatedSlugs: ["calorie-calculator", "macro-calculator"],
  },
  {
    slug: "ideal-weight-calculator",
    title: "Ideal Weight Calculator",
    category: "health",
    shortDescription: "Estimate a healthy target weight for your height using the Devine formula.",
    seoDescription: "Estimate ideal body weight from height and sex using the Devine formula.",
    formulaSummary: "Devine: 50kg + 2.3kg per inch over 5ft (men); 45.5kg + 2.3kg per inch over 5ft (women)",
    fields: [sexField, { name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 3 }, { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11 }],
    calculate: (i) => {
      const totalIn = n(i.heightFt, 5) * 12 + n(i.heightIn, 9);
      const overIn = Math.max(0, totalIn - 60);
      const kg = (i.sex === "female" ? 45.5 : 50) + 2.3 * overIn;
      return {
        results: [
          { label: "Ideal Weight", value: `${fmtNumber(kg, 1)} kg (${fmtNumber(kg / 0.45359237, 1)} lb)`, emphasis: true },
        ],
        formula: i.sex === "female" ? "45.5 kg + 2.3 kg × inches over 5ft" : "50 kg + 2.3 kg × inches over 5ft",
        notes: ["The Devine formula is a widely used medical estimate, not a strict target — healthy weight varies with frame size and muscle mass."],
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
  },
  {
    slug: "body-fat-calculator",
    title: "Body Fat Calculator",
    category: "health",
    shortDescription: "Estimate body fat percentage using the U.S. Navy tape-measure method.",
    seoDescription: "Estimate body fat percentage from neck, waist and (for women) hip measurements using the U.S. Navy method.",
    formulaSummary: "U.S. Navy method (circumference-based)",
    fields: [
      sexField,
      { name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 3 },
      { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11 },
      { name: "neckIn", label: "Neck", type: "number", unit: "in", defaultValue: 15, min: 1 },
      { name: "waistIn", label: "Waist", type: "number", unit: "in", defaultValue: 34, min: 1 },
      { name: "hipIn", label: "Hip", type: "number", unit: "in", defaultValue: 38, min: 0, showIf: (i) => i.sex === "female" },
    ],
    calculate: (i) => {
      const heightIn = n(i.heightFt, 5) * 12 + n(i.heightIn, 9);
      const neck = n(i.neckIn, 15);
      const waist = n(i.waistIn, 34);
      const hip = n(i.hipIn, 38);
      let bf: number;
      if (i.sex === "female") {
        bf = 495 / (1.29579 - 0.35004 * Math.log10(waist + hip - neck) + 0.221 * Math.log10(heightIn)) - 450;
      } else {
        bf = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(heightIn)) - 450;
      }
      return {
        results: [{ label: "Estimated Body Fat", value: `${fmtNumber(bf, 1)}%`, emphasis: true }],
        notes: ["Estimate only — accuracy depends on careful, consistent tape measurements. DEXA scans are more precise."],
      };
    },
    relatedSlugs: ["bmi-calculator", "lean-body-mass-calculator"],
  },
  {
    slug: "lean-body-mass-calculator",
    title: "Lean Body Mass Calculator",
    category: "health",
    shortDescription: "Calculate lean body mass (everything except fat) using the Boer formula.",
    seoDescription: "Calculate lean body mass from height and weight using the Boer formula.",
    formulaSummary: "Boer formula",
    fields: [sexField, ...unitFields],
    calculate: (i) => {
      const kg = weightKg(i);
      const cm = heightCm(i);
      const lbm = i.sex === "female" ? 0.252 * kg + 0.473 * cm - 48.3 : 0.407 * kg + 0.267 * cm - 19.2;
      return {
        results: [
          { label: "Lean Body Mass", value: `${fmtNumber(lbm, 1)} kg (${fmtNumber(lbm / 0.45359237, 1)} lb)`, emphasis: true },
          { label: "Estimated Fat Mass", value: `${fmtNumber(kg - lbm, 1)} kg` },
        ],
        formula: i.sex === "female" ? "LBM = 0.252×kg + 0.473×cm − 48.3" : "LBM = 0.407×kg + 0.267×cm − 19.2",
      };
    },
    relatedSlugs: ["body-fat-calculator", "one-rep-max-calculator"],
  },
  {
    slug: "macro-calculator",
    title: "Macro Calculator",
    category: "health",
    shortDescription: "Split a daily calorie target into protein, carb and fat grams.",
    seoDescription: "Calculate daily protein, carbohydrate and fat targets in grams from a daily calorie goal and diet style.",
    formulaSummary: "Protein/Carbs = 4 kcal/g, Fat = 9 kcal/g",
    fields: [
      { name: "dailyCalories", label: "Daily Calorie Target", type: "number", unit: "kcal", defaultValue: 2200, min: 0 },
      {
        name: "split",
        label: "Diet Style",
        type: "select",
        defaultValue: "balanced",
        options: [
          { value: "balanced", label: "Balanced (40% carb / 30% protein / 30% fat)" },
          { value: "lowcarb", label: "Low-carb (25% carb / 40% protein / 35% fat)" },
          { value: "highcarb", label: "High-carb (55% carb / 25% protein / 20% fat)" },
        ],
      },
    ],
    calculate: (i) => {
      const cal = n(i.dailyCalories, 2200);
      const splits: Record<string, [number, number, number]> = {
        balanced: [0.4, 0.3, 0.3],
        lowcarb: [0.25, 0.4, 0.35],
        highcarb: [0.55, 0.25, 0.2],
      };
      const [carbPct, proteinPct, fatPct] = splits[i.split] ?? splits.balanced;
      const carbG = (cal * carbPct) / 4;
      const proteinG = (cal * proteinPct) / 4;
      const fatG = (cal * fatPct) / 9;
      return {
        results: [
          { label: "Protein", value: `${fmtNumber(proteinG, 0)} g`, emphasis: true },
          { label: "Carbohydrates", value: `${fmtNumber(carbG, 0)} g`, emphasis: true },
          { label: "Fat", value: `${fmtNumber(fatG, 0)} g`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
  },
  {
    slug: "pace-calculator",
    title: "Pace Calculator",
    category: "health",
    shortDescription: "Calculate your running pace and speed from distance and time.",
    seoDescription: "Calculate running pace per mile or kilometer, and overall speed, from a distance and finish time.",
    formulaSummary: "Pace = time / distance",
    fields: [
      { name: "distance", label: "Distance", type: "number", defaultValue: 5, min: 0.01, step: 0.01 },
      { name: "distanceUnit", label: "Unit", type: "select", defaultValue: "km", options: [{ value: "km", label: "Kilometers" }, { value: "mi", label: "Miles" }] },
      { name: "hours", label: "Hours", type: "number", defaultValue: 0, min: 0 },
      { name: "minutes", label: "Minutes", type: "number", defaultValue: 25, min: 0, max: 59 },
      { name: "seconds", label: "Seconds", type: "number", defaultValue: 0, min: 0, max: 59 },
    ],
    calculate: (i) => {
      const distance = n(i.distance, 5);
      const totalSeconds = n(i.hours) * 3600 + n(i.minutes) * 60 + n(i.seconds);
      const paceSecPerUnit = totalSeconds / distance;
      const paceMin = Math.floor(paceSecPerUnit / 60);
      const paceSec = Math.round(paceSecPerUnit % 60);
      const speed = distance / (totalSeconds / 3600);
      const unitLabel = i.distanceUnit === "mi" ? "mi" : "km";
      return {
        results: [
          { label: "Pace", value: `${paceMin}:${String(paceSec).padStart(2, "0")} / ${unitLabel}`, emphasis: true },
          { label: "Average Speed", value: `${fmtNumber(speed, 2)} ${unitLabel}/h` },
        ],
      };
    },
    relatedSlugs: ["calorie-calculator"],
  },
  {
    slug: "due-date-calculator",
    title: "Pregnancy Due Date Calculator",
    category: "health",
    shortDescription: "Estimate your baby's due date from your last menstrual period.",
    seoDescription: "Estimate your pregnancy due date and current gestational week from the first day of your last menstrual period.",
    formulaSummary: "Due date = LMP + 280 days (Naegele's rule)",
    fields: [{ name: "lmp", label: "First Day of Last Period", type: "date", defaultValue: "" }],
    calculate: (i) => {
      if (!i.lmp) return { results: [], error: "Enter the first day of your last menstrual period." };
      const lmp = new Date(`${i.lmp}T00:00:00Z`);
      if (Number.isNaN(lmp.getTime())) return { results: [], error: "Enter a valid date." };
      const due = new Date(lmp.getTime() + 280 * 86400000);
      const today = new Date();
      const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
      const daysAlong = Math.floor((todayUtc - lmp.getTime()) / 86400000);
      const week = Math.max(0, Math.floor(daysAlong / 7));
      const dayOfWeek = Math.max(0, daysAlong % 7);
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
      return {
        results: [
          { label: "Estimated Due Date", value: fmt(due), emphasis: true },
          { label: "Current Gestational Age", value: daysAlong >= 0 && daysAlong <= 300 ? `${week} weeks, ${dayOfWeek} days` : "—" },
        ],
        formula: "Due date = LMP + 280 days (40 weeks)",
        notes: ["Naegele's rule assumes a regular 28-day cycle — an ultrasound-based estimate from your provider is more accurate."],
      };
    },
    relatedSlugs: ["ovulation-calculator"],
  },
  {
    slug: "bac-calculator",
    title: "BAC Calculator",
    category: "health",
    shortDescription: "Estimate blood alcohol content using the Widmark formula.",
    seoDescription: "Estimate blood alcohol content (BAC) from standard drinks consumed, body weight, sex and time using the Widmark formula.",
    formulaSummary: "Widmark formula",
    fields: [
      sexField,
      { name: "weightLb", label: "Body Weight", type: "number", unit: "lb", defaultValue: 160, min: 1 },
      { name: "drinks", label: "Standard Drinks", type: "number", defaultValue: 3, min: 0, step: 0.5, help: "1 standard drink ≈ 14g alcohol (12oz beer, 5oz wine, 1.5oz spirits)" },
      { name: "hours", label: "Hours Since First Drink", type: "number", defaultValue: 2, min: 0, step: 0.25 },
    ],
    calculate: (i) => {
      const r = i.sex === "female" ? 0.55 : 0.68;
      const grams = n(i.drinks, 3) * 14;
      const bac = (grams * 5.14) / (n(i.weightLb, 160) * r) - 0.015 * n(i.hours, 2);
      const clamped = Math.max(0, bac);
      return {
        results: [{ label: "Estimated BAC", value: `${fmtNumber(clamped, 3)}%`, emphasis: true }],
        notes: [
          "This is a rough estimate for education only — actual BAC is affected by food, medications, and individual metabolism. Never use this to decide whether it's safe to drive.",
        ],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "target-heart-rate-calculator",
    title: "Target Heart Rate Calculator",
    category: "health",
    shortDescription: "Find your training heart-rate zones using the Karvonen formula.",
    seoDescription: "Calculate moderate and vigorous exercise heart-rate zones from age and resting heart rate using the Karvonen formula.",
    formulaSummary: "Target HR = ((max HR − resting HR) × intensity) + resting HR",
    fields: [
      { name: "age", label: "Age", type: "number", unit: "years", defaultValue: 30, min: 10, max: 100 },
      { name: "restingHr", label: "Resting Heart Rate", type: "number", unit: "bpm", defaultValue: 65, min: 30, max: 120 },
    ],
    calculate: (i) => {
      const maxHr = 220 - n(i.age, 30);
      const rhr = n(i.restingHr, 65);
      const zone = (pct: number) => Math.round((maxHr - rhr) * pct + rhr);
      return {
        results: [
          { label: "Maximum Heart Rate", value: `${maxHr} bpm` },
          { label: "Moderate Zone (50–70%)", value: `${zone(0.5)}–${zone(0.7)} bpm`, emphasis: true },
          { label: "Vigorous Zone (70–85%)", value: `${zone(0.7)}–${zone(0.85)} bpm`, emphasis: true },
        ],
        formula: "Karvonen: Target HR = ((220 − age − resting HR) × intensity) + resting HR",
      };
    },
    relatedSlugs: ["calorie-calculator"],
  },
  {
    slug: "one-rep-max-calculator",
    title: "One-Rep Max Calculator",
    category: "health",
    shortDescription: "Estimate your one-rep max (1RM) from a weight and rep count.",
    seoDescription: "Estimate your one-rep max (1RM) for any lift using the Epley formula, with a percentage table for training loads.",
    formulaSummary: "Epley: 1RM = weight × (1 + reps/30)",
    fields: [
      { name: "weight", label: "Weight Lifted", type: "number", unit: "lb", defaultValue: 185, min: 0 },
      { name: "reps", label: "Reps Completed", type: "number", defaultValue: 5, min: 1, max: 20 },
    ],
    calculate: (i) => {
      const w = n(i.weight, 185);
      const reps = n(i.reps, 5);
      const oneRm = w * (1 + reps / 30);
      const pct = [95, 90, 85, 80, 75, 70, 65, 60];
      return {
        results: [
          { label: "Estimated 1RM", value: `${fmtNumber(oneRm, 0)} lb`, emphasis: true },
          ...pct.map((p) => ({ label: `${p}% of 1RM`, value: `${fmtNumber((oneRm * p) / 100, 0)} lb` })),
        ],
        formula: "1RM = weight × (1 + reps ÷ 30)",
      };
    },
    relatedSlugs: ["lean-body-mass-calculator"],
  },
];

export default health;
