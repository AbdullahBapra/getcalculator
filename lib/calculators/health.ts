import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { unitFields, heightCm, weightKg, sexField, bmrMifflin, ACTIVITY } from "./health-helpers";
import { ftInCmPair, inCmPair, lbKgPair } from "./convert-hints";

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
        gauge: {
          value: bmi,
          min: 12,
          max: 40,
          valueLabel: fmtNumber(bmi, 1),
          zones: [
            { label: "Underweight", to: 18.5, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Normal", to: 25, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Overweight", to: 30, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Obese", to: 40, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption:
          category === "Normal weight"
            ? `A BMI of ${fmtNumber(bmi, 1)} sits well inside the normal range (18.5–24.9).`
            : `A BMI of ${fmtNumber(bmi, 1)} falls in the "${category}" range — BMI alone doesn't account for muscle mass, so this is a screening signal, not a diagnosis.`,
      };
    },
    relatedSlugs: ["body-fat-calculator", "ideal-weight-calculator", "calorie-calculator"],
    content: {
      intro: [
        "Body Mass Index is a ratio of weight to height, nothing more — it was never designed to measure body fat directly, and it can't tell the difference between someone carrying extra fat and someone carrying extra muscle. What it's actually good at is flagging, cheaply and instantly, whether a weight is in a range associated with higher health risk across a large population. For any one individual, it's a starting point for a conversation, not a diagnosis.",
        "Doctors' offices use it as a quick intake screen, insurers use it in actuarial models, and most people use it simply to see where they land against the standard categories before digging deeper into things like body fat percentage or waist measurements. It's popular precisely because it only needs two numbers you already know.",
        "A quick reminder before the number: this tool is for general information, not a medical assessment — if you have concerns about your weight or health, a doctor who can examine you is a far better judge than any formula. Everything you type here calculates instantly in your browser and is never sent anywhere, so there's no account needed to check a number you might feel sensitive about.",
      ],
      howItWorks: [
        "BMI = weight in kilograms ÷ (height in meters)². The formula is often credited to 19th-century statistician Adolphe Quetelet, who was studying population averages, not individual health — which is part of why it holds up better as a population screening tool than as a precise personal metric.",
        "In imperial units the same ratio is usually written as weight(lb) × 703 ÷ height(in)² — the 703 is just a unit-conversion constant so the result lands on the same scale as the metric version; it isn't a different formula.",
      ],
      faq: [
        {
          q: "What is a healthy BMI range?",
          a: "For most adults, 18.5–24.9 is classified as normal weight, under 18.5 as underweight, 25–29.9 as overweight, and 30+ as obese. These bands are population guidelines, not hard individual cutoffs.",
        },
        {
          q: "Is BMI accurate for athletes or muscular people?",
          a: "Not really — muscle is denser than fat, so a lean, muscular person can post a BMI in the \"overweight\" range despite having low body fat. The Body Fat Calculator or a simple waist measurement gives a more honest picture for anyone carrying significant muscle.",
        },
        {
          q: "Does BMI account for age or sex?",
          a: "No — the standard adult BMI formula and its category cutoffs are the same regardless of age or sex, which is one of its best-known limitations, since body composition naturally differs between men and women and shifts with age.",
        },
        {
          q: "Is BMI accurate for children or teenagers?",
          a: "No, this calculator isn't meant for kids — pediatric BMI is plotted against age- and sex-specific growth percentile charts, not the fixed adult categories used here.",
        },
        {
          q: "What should I check instead of, or alongside, BMI?",
          a: "Waist circumference, body fat percentage, and how your clothes fit over time all tell you something BMI can't. None of them are perfect alone, but together they paint a fuller picture than any single number.",
        },
      ],
    },
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
        table: {
          headers: ["Activity Level", "Estimated Daily Calories"],
          rows: Object.values(ACTIVITY).map((a) => [a.label, `${fmtNumber(bmr * a.factor, 0)} kcal/day`]),
        },
        chartCaption: `Your BMR of ${fmtNumber(bmr, 0)} kcal/day is what you'd burn lying still all day — multiply it by an activity factor above to estimate your total daily burn.`,
      };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
    content: {
      intro: [
        "Basal Metabolic Rate is the energy your body burns just to stay alive — running your heart, keeping your lungs breathing, repairing cells, regulating temperature — if you did nothing but lie still for 24 hours. It's not what you burn in a normal day; it's the floor underneath it, before you add a single step of walking or a single flight of stairs.",
        "This calculator uses the Mifflin-St Jeor equation, which replaced the older Harris-Benedict formula in most clinical and nutrition settings because it's been shown to estimate resting energy expenditure more accurately across a broad population. Like any formula built from population averages, though, it's an estimate — genetics, thyroid function, muscle mass and even sleep quality can shift someone's real BMR up or down from what the equation predicts.",
        "People mostly reach for a BMR number as the starting point for a calorie target, whether they're cutting, bulking or just curious what their body needs at rest. Because it only takes your height, weight, age and sex, and none of it leaves your device, it's also a fast way to check the number without creating an account on a diet-tracking app first.",
      ],
      howItWorks: [
        "Mifflin-St Jeor: BMR = 10×weight(kg) + 6.25×height(cm) − 5×age + 5 for men, or −161 for women. The weight and height terms capture body size, the age term reflects that metabolism gradually slows with age, and the final sex-based constant adjusts for the fact that, on average, men carry more muscle mass relative to their height and weight than women do — and muscle is metabolically more active at rest than fat tissue.",
        "The table below multiplies your BMR by a set of standard activity factors, since almost nobody actually spends a whole day at complete rest — that gives you a rough total daily burn to compare against, which the Calorie and TDEE calculators build on further.",
      ],
      faq: [
        {
          q: "What's the difference between BMR and TDEE?",
          a: "BMR is calories burned at complete rest; TDEE (Total Daily Energy Expenditure) adds in movement, exercise and digestion on top of BMR. BMR is the floor, TDEE is closer to what you actually burn in a real day.",
        },
        {
          q: "Why do men and women have different BMR formulas?",
          a: "The Mifflin-St Jeor equation adds a flat +5 for men and −161 for women to account for typical differences in body composition — men tend to carry more lean muscle mass at a given height and weight, and muscle burns more calories at rest than fat.",
        },
        {
          q: "How can I raise my BMR?",
          a: "Building muscle through resistance training is the most reliable lever, since muscle tissue burns more energy at rest than fat tissue. Crash dieting tends to do the opposite — it can lower BMR as the body adapts to reduced intake.",
        },
        {
          q: "Is Mifflin-St Jeor more accurate than Harris-Benedict?",
          a: "Generally yes — most modern nutrition guidelines favor Mifflin-St Jeor because studies have found it estimates resting energy expenditure more accurately for most people than the older Harris-Benedict formula from 1919.",
        },
        {
          q: "Should I eat exactly my BMR to lose weight?",
          a: "No — eating at or below your BMR ignores the energy you burn through daily activity and can be an unnecessarily aggressive deficit. Use the Calorie Calculator, which factors in activity level, for a more realistic target.",
        },
      ],
    },
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
        compare: [
          { label: "BMR (resting)", value: bmr, displayValue: `${fmtNumber(bmr, 0)} kcal` },
          { label: "TDEE (maintenance)", value: tdee, displayValue: `${fmtNumber(tdee, 0)} kcal` },
          { label: "Your Goal", value: goalCalories, displayValue: `${fmtNumber(goalCalories, 0)} kcal`, highlight: true },
        ],
        chartCaption: `Your goal of ${fmtNumber(goalCalories, 0)} kcal/day is ${goalCalories === tdee ? "equal to" : goalCalories > tdee ? "above" : "below"} your maintenance level (TDEE), which is itself ${fmtNumber(tdee - bmr, 0)} kcal above your resting burn (BMR).`,
      };
    },
    relatedSlugs: ["bmr-calculator", "tdee-calculator", "macro-calculator"],
    content: {
      intro: [
        "This calculator turns your resting metabolism and activity level into an actual daily calorie number for losing, maintaining or gaining weight — the figure most diet apps ask you to type in on day one. It starts from BMR, scales it up by how active you are to get your maintenance level (TDEE), then adds or subtracts calories depending on the goal you pick.",
        "The result is only ever an estimate, and it's worth being upfront about that: two people with identical stats can have real-world calorie needs that differ by a couple hundred calories a day due to genetics, gut microbiome, sleep, stress and how precisely they actually stick to a number. Treat the output as a sensible starting point to adjust from over a few weeks of real results, not a fixed target carved in stone.",
        "It's built for anyone setting up a diet — someone starting a cut, someone trying to bulk cleanly, or someone who just wants to know their maintenance number before they decide to change anything. Your height, weight and goals are personal enough that it's worth knowing nothing you enter here is sent to a server or saved anywhere.",
      ],
      howItWorks: [
        "The math happens in two stages: first BMR × activity factor gives TDEE, your estimated maintenance calories. Then a goal adjustment is applied — roughly ±250 kcal/day for a slower ±0.5 lb/week pace, or ±500 kcal/day for a faster ±1 lb/week pace, based on the rough rule that one pound of body fat represents about 3,500 stored calories.",
        "That 3,500-calorie figure is itself an approximation, not a precise constant — actual weight change also includes water shifts, glycogen stores and lean mass changes, which is why real-world results at a given calorie target can vary from what the arithmetic alone predicts.",
      ],
      faq: [
        {
          q: "How many calories should I eat to lose weight?",
          a: "A moderate deficit of about 250–500 calories per day below your maintenance (TDEE) level is the pace most guidelines recommend for sustainable fat loss — roughly 0.5 to 1 pound per week. Select a goal above to see the specific number for your stats.",
        },
        {
          q: "Is a 500-calorie deficit really 1 pound a week?",
          a: "It's a widely used approximation based on ~3,500 calories per pound of fat, but real results vary — water retention, muscle changes and metabolic adaptation over time mean the scale rarely moves in a perfectly straight line even at a consistent deficit.",
        },
        {
          q: "Should I eat back the calories I burn exercising?",
          a: "If your activity level selection above already reflects your typical exercise, no — it's already baked into the number. Only add back calories for workouts that are unusually intense or infrequent relative to what you selected.",
        },
        {
          q: "Why am I not losing weight at my calculated calories?",
          a: "The most common culprits are underestimating portion sizes, inconsistent logging, or an activity level selected here that's more optimistic than reality — most people overestimate how active they actually are. Give it 2–3 consistent weeks before adjusting the target.",
        },
        {
          q: "How accurate are online calorie calculators in general?",
          a: "They're a reasonable starting estimate, typically within a few hundred calories of an individual's true need — good enough to start a plan, not precise enough to treat as exact. Adjust based on your own weight trend over a few weeks.",
        },
      ],
    },
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
        steps: [
          `BMR = ${fmtNumber(bmr, 0)} kcal/day (calories burned at rest)`,
          `TDEE = ${fmtNumber(bmr, 0)} × ${factor} (activity factor) = ${fmtNumber(tdee, 0)} kcal/day`,
        ],
        notes: ["TDEE is your total daily burn including activity — eat close to this number to maintain your current weight, below it to lose, above it to gain."],
        compare: [
          { label: "BMR (resting)", value: bmr, displayValue: `${fmtNumber(bmr, 0)} kcal/day` },
          { label: "TDEE (with activity)", value: tdee, displayValue: `${fmtNumber(tdee, 0)} kcal/day`, highlight: true },
        ],
        chartCaption: `Activity adds about ${fmtNumber(tdee - bmr, 0)} kcal/day on top of your resting burn.`,
      };
    },
    relatedSlugs: ["calorie-calculator", "macro-calculator"],
    content: {
      intro: [
        "Total Daily Energy Expenditure is an estimate of every calorie you burn in a day — not just lying still, but also digesting food, walking around, and any deliberate exercise on top. It starts from your BMR and multiplies it by an activity factor, so it's only as good as the activity level you honestly select; most people, when they're being generous with themselves, pick a category more active than their real week looks like.",
        "TDEE is the number diet planning actually revolves around: eat close to it and your weight holds roughly steady, eat under it and you lose, eat over it and you gain. It's the figure people check before setting up a cut, a bulk, or just to understand what \"maintenance\" means for their own body rather than a generic guideline.",
        "Nothing you enter here is uploaded or stored anywhere — the calculation runs right in your browser, so you can check your numbers without signing up for another fitness app.",
      ],
      howItWorks: [
        "TDEE = BMR × activity factor, where the activity factor is a multiplier ranging from about 1.2 (sedentary, little to no exercise) up to 1.9 (very hard physical training or a physically demanding job). Each step up the scale assumes progressively more calories burned through movement layered on top of your resting metabolism.",
        "These multipliers are broad averages, not a precise measurement of your actual movement — two people who both call themselves \"moderately active\" can have real activity levels, and therefore real TDEEs, that differ by several hundred calories. Treat the output as a starting estimate and adjust it based on how your weight actually trends over a few weeks at a given intake.",
      ],
      faq: [
        {
          q: "What is TDEE and why does it matter?",
          a: "TDEE is your Total Daily Energy Expenditure — the full number of calories you burn in a day, including rest, digestion and activity. It's the number to compare your food intake against if you want to lose, gain or maintain weight.",
        },
        {
          q: "How do I know which activity level to pick?",
          a: "Be honest, not aspirational — \"lightly active\" usually fits someone with a desk job who exercises a few times a week, while \"sedentary\" fits little to no structured exercise at all. Most people overestimate their own activity level, which inflates the resulting TDEE.",
        },
        {
          q: "Why does my TDEE seem different from what a fitness app calculated?",
          a: "Different apps use different BMR formulas and slightly different activity multipliers, so small differences between tools are normal. What matters more than matching another app exactly is watching whether your real weight trend matches the direction your chosen TDEE predicts.",
        },
        {
          q: "Does TDEE change over time?",
          a: "Yes — it shifts as your weight, muscle mass, age and activity level change, so a number calculated a year ago may no longer be accurate today. It's worth recalculating every few months or after a significant change in weight or routine.",
        },
        {
          q: "Should I eat exactly at my TDEE?",
          a: "Only if your goal is to maintain your current weight. To lose weight you'd eat below TDEE, and to gain you'd eat above it — the Calorie Calculator applies a standard deficit or surplus to this same TDEE number automatically.",
        },
      ],
    },
  },
  {
    slug: "ideal-weight-calculator",
    title: "Ideal Weight Calculator",
    category: "health",
    shortDescription: "Estimate a healthy target weight for your height using the Devine formula.",
    seoDescription: "Estimate ideal body weight from height and sex using the Devine formula.",
    formulaSummary: "Devine: 50kg + 2.3kg per inch over 5ft (men); 45.5kg + 2.3kg per inch over 5ft (women)",
    fields: [
      sexField,
      { name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 3 },
      { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11, convertPair: ftInCmPair("heightFt", "heightIn") },
    ],
    calculate: (i) => {
      const totalIn = n(i.heightFt, 5) * 12 + n(i.heightIn, 9);
      const overIn = Math.max(0, totalIn - 60);
      const kg = (i.sex === "female" ? 45.5 : 50) + 2.3 * overIn;
      const heightM = totalIn * 0.0254;
      const bmiToKg = (bmi: number) => bmi * heightM * heightM;
      return {
        results: [
          { label: "Ideal Weight", value: `${fmtNumber(kg, 1)} kg (${fmtNumber(kg / 0.45359237, 1)} lb)`, emphasis: true },
        ],
        formula: i.sex === "female" ? "45.5 kg + 2.3 kg × inches over 5ft" : "50 kg + 2.3 kg × inches over 5ft",
        notes: ["The Devine formula is a widely used medical estimate, not a strict target — healthy weight varies with frame size and muscle mass."],
        gauge: {
          value: kg,
          min: bmiToKg(15),
          max: bmiToKg(35),
          valueLabel: `${fmtNumber(kg, 1)} kg`,
          zones: [
            { label: "Below Range", to: bmiToKg(18.5), barClass: "bg-indigo-400 dark:bg-indigo-500", textClass: "text-indigo-600 dark:text-indigo-400" },
            { label: "Healthy Range", to: bmiToKg(25), barClass: "bg-emerald-500 dark:bg-emerald-400", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Above Range", to: bmiToKg(30), barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Well Above", to: bmiToKg(35), barClass: "bg-rose-400 dark:bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
          ],
        },
        chartCaption:
          kg >= bmiToKg(18.5) && kg <= bmiToKg(25)
            ? `Your ${fmtNumber(kg, 1)} kg Devine estimate lands inside the healthy weight range for your height (BMI 18.5–24.9).`
            : `Your ${fmtNumber(kg, 1)} kg Devine estimate falls outside the typical healthy BMI range for your height — the formula is a general guideline, not a strict target.`,
      };
    },
    relatedSlugs: ["bmi-calculator", "healthy-weight-calculator"],
    content: {
      intro: [
        "The Devine formula turns your height into a single \"ideal weight\" figure — 50 kg for men and 45.5 kg for women as a base at 5 feet, plus 2.3 kg for every inch above that. It was never built as a wellness target, though; it was published in 1974 by a physician who needed a quick way to estimate lean body weight for drug dosing calculations, and it stuck around because it's simple enough to compute by hand at a bedside.",
        "Because it only takes height and sex, it says nothing about frame size, muscle mass or body composition — two people of identical height can have very different healthy weights depending on how they're built. Most people use this number the way it was borrowed for elsewhere in medicine: a quick reference point, not a personal target to chase.",
        "The calculation happens instantly on your device — no account, no server round-trip, just your height and an estimate you can compare against other tools like BMI or body fat percentage.",
      ],
      howItWorks: [
        "Devine's formula: 50 kg + 2.3 kg per inch over 5 feet for men, or 45.5 kg + 2.3 kg per inch over 5 feet for women. The flat base weight and per-inch increment were fitted to typical body weights of the era rather than derived from a body-composition model, which is why it's best read as a rough midpoint rather than a precisely reasoned target.",
        "Other similar formulas exist — Robinson (1983), Miller (1983) and Hamwi (1964) each tweak the constants slightly — and none of them agree exactly, which itself is a sign that \"ideal weight\" from height alone is inherently an approximation.",
      ],
      faq: [
        {
          q: "What is considered an ideal weight?",
          a: "There's no single correct answer — formulas like Devine give a height-based estimate, but a truly healthy weight depends on frame size, muscle mass, age and overall health, which is why doctors lean on ranges (like the healthy BMI band) rather than one fixed number.",
        },
        {
          q: "Is the Devine formula outdated?",
          a: "It's old, but it's still used clinically today, mainly because it's simple and consistent — hospitals often use it (or similar formulas) to estimate lean body weight for medication dosing, not as a personal fitness goal.",
        },
        {
          q: "Does this account for frame size or muscle mass?",
          a: "No — it only uses height and sex, so a muscular or large-framed person will show as \"above ideal\" even at a healthy body composition. Body fat percentage or waist measurement are better checks for anyone with above-average muscle mass.",
        },
        {
          q: "Why do different ideal weight calculators give different numbers?",
          a: "Because several competing formulas exist — Devine, Robinson, Miller and Hamwi were each developed independently with slightly different constants, so a small spread between calculators is normal rather than a sign that one is \"wrong.\"",
        },
        {
          q: "Should I try to hit this exact number?",
          a: "Not as a strict target — treat it as one reference point among several (alongside BMI and body fat percentage) rather than a number to chase on the scale, especially if you carry more muscle than average.",
        },
      ],
    },
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
      { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11, convertPair: ftInCmPair("heightFt", "heightIn") },
      { name: "neckIn", label: "Neck", type: "number", unit: "in", defaultValue: 15, min: 1, convertPair: inCmPair("neckIn") },
      { name: "waistIn", label: "Waist", type: "number", unit: "in", defaultValue: 34, min: 1, convertPair: inCmPair("waistIn") },
      { name: "hipIn", label: "Hip", type: "number", unit: "in", defaultValue: 38, min: 0, showIf: (i) => i.sex === "female", convertPair: inCmPair("hipIn") },
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
      const isFemale = i.sex === "female";
      return {
        results: [{ label: "Estimated Body Fat", value: `${fmtNumber(bf, 1)}%`, emphasis: true }],
        notes: ["Estimate only — accuracy depends on careful, consistent tape measurements. DEXA scans are more precise."],
        gauge: {
          value: bf,
          min: 0,
          max: isFemale ? 45 : 35,
          valueLabel: `${fmtNumber(bf, 1)}%`,
          zones: isFemale
            ? [
                { label: "Essential", to: 14, barClass: "bg-cyan-400 dark:bg-cyan-500", textClass: "text-cyan-600 dark:text-cyan-400" },
                { label: "Athletic", to: 20, barClass: "bg-lime-500 dark:bg-lime-400", textClass: "text-lime-600 dark:text-lime-400" },
                { label: "Fitness", to: 24, barClass: "bg-green-500 dark:bg-green-400", textClass: "text-green-600 dark:text-green-400" },
                { label: "Acceptable", to: 31, barClass: "bg-yellow-400 dark:bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
                { label: "Obese", to: 45, barClass: "bg-rose-500 dark:bg-rose-400", textClass: "text-rose-600 dark:text-rose-400" },
              ]
            : [
                { label: "Essential", to: 6, barClass: "bg-cyan-400 dark:bg-cyan-500", textClass: "text-cyan-600 dark:text-cyan-400" },
                { label: "Athletic", to: 13, barClass: "bg-lime-500 dark:bg-lime-400", textClass: "text-lime-600 dark:text-lime-400" },
                { label: "Fitness", to: 17, barClass: "bg-green-500 dark:bg-green-400", textClass: "text-green-600 dark:text-green-400" },
                { label: "Acceptable", to: 24, barClass: "bg-yellow-400 dark:bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
                { label: "Obese", to: 35, barClass: "bg-rose-500 dark:bg-rose-400", textClass: "text-rose-600 dark:text-rose-400" },
              ],
        },
        chartCaption: `Healthy body-fat ranges differ by sex — your ${fmtNumber(bf, 1)}% estimate is placed against typical categories for ${isFemale ? "women" : "men"}.`,
      };
    },
    relatedSlugs: ["bmi-calculator", "lean-body-mass-calculator"],
    content: {
      intro: [
        "This calculator estimates body fat percentage from tape-measure circumferences instead of a scan, using a formula the U.S. Navy developed to screen recruits quickly and cheaply. It trades precision for convenience — a DEXA scan or hydrostatic weighing will give a more exact number, but neither is something most people can do at home with a tape measure and two minutes.",
        "Its real value shows up over time rather than as a single reading: because it's cheap to repeat, tracking the same measurements weekly or monthly tends to reveal a trend even if the absolute percentage is off by a point or two. Athletes, dieters tracking a cut, and anyone curious how their composition is shifting alongside the number on the scale are the typical users.",
        "As with any home body-composition estimate, treat this as general fitness information rather than a clinical measurement — measuring technique affects accuracy more than most people expect, and it's not a substitute for a medical assessment. Your measurements are calculated locally and never leave your device.",
      ],
      howItWorks: [
        "The U.S. Navy method estimates body fat from circumference measurements — neck and waist for men, with hip added for women — run through a formula built on log-scaled ratios. Women include a hip measurement because fat tends to distribute differently by sex, typically more around the hips and thighs for women versus more centrally for men, and the extra measurement point improves the estimate's accuracy for that pattern.",
        "Because the formula is sensitive to exactly where and how snugly you measure, small technique differences — measuring the waist an inch higher or lower, or pulling the tape too tight — can shift the result more than an actual change in body fat would. Measuring at the same spot, at the same time of day, each time you check matters more than any single reading.",
      ],
      faq: [
        {
          q: "How accurate is the Navy body fat method?",
          a: "It's generally within a few percentage points of more precise methods like DEXA for most people, which makes it good for tracking change over time, but it can be noticeably less accurate for people at very low or very high body fat levels.",
        },
        {
          q: "What is a healthy body fat percentage?",
          a: "Healthy ranges differ by sex — roughly 14–24% is often considered fit-to-acceptable for women and 6–17% for men, though exact \"healthy\" cutoffs vary by source and by age. The gauge above places your estimate against typical category bands for your sex.",
        },
        {
          q: "Why does the calculator ask for a hip measurement only for women?",
          a: "The formula was built separately for each sex based on where body fat typically accumulates — since women's fat distribution more often includes the hip area, adding that measurement improves the estimate's accuracy for women specifically.",
        },
        {
          q: "Is a tape-measure method as good as calipers or a DEXA scan?",
          a: "No single home method matches a DEXA scan for precision, but calipers and the Navy tape method are both reasonable, low-cost ways to estimate body fat and — more usefully — to track whether it's trending up or down over time.",
        },
        {
          q: "How do I measure my waist and neck correctly?",
          a: "Measure your neck just below the larynx, and your waist at the narrowest point (men) or at the navel (women), keeping the tape snug but not compressing the skin. Measuring at the same time of day, ideally in the morning, keeps repeat readings comparable.",
        },
      ],
    },
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
      const fatMass = Math.max(0, kg - lbm);
      return {
        results: [
          { label: "Lean Body Mass", value: `${fmtNumber(lbm, 1)} kg (${fmtNumber(lbm / 0.45359237, 1)} lb)`, emphasis: true },
          { label: "Estimated Fat Mass", value: `${fmtNumber(fatMass, 1)} kg` },
        ],
        formula: i.sex === "female" ? "LBM = 0.252×kg + 0.473×cm − 48.3" : "LBM = 0.407×kg + 0.267×cm − 19.2",
        steps: [
          `Total weight = ${fmtNumber(kg, 1)} kg, Height = ${fmtNumber(cm, 0)} cm`,
          `Lean Body Mass = ${fmtNumber(lbm, 1)} kg`,
          `Estimated Fat Mass = Total weight − LBM = ${fmtNumber(fatMass, 1)} kg`,
        ],
        notes: ["The Boer formula estimates lean mass from height and weight alone — it doesn't account for individual muscle or frame differences, so treat it as a starting estimate."],
        breakdown: [
          { label: "Lean Mass", value: lbm, displayValue: `${fmtNumber(lbm, 1)} kg` },
          { label: "Fat Mass", value: fatMass, displayValue: `${fmtNumber(fatMass, 1)} kg` },
        ],
        chartCaption: `Lean mass makes up about ${fmtNumber((lbm / kg) * 100, 0)}% of your total body weight.`,
      };
    },
    relatedSlugs: ["body-fat-calculator", "one-rep-max-calculator"],
    content: {
      intro: [
        "Lean body mass is everything on the scale that isn't fat — muscle, bone, organs, water, connective tissue, all of it — and this calculator estimates it from height and weight using the Boer formula, one of a handful of equations built to approximate it without a scan. It's a formula-based estimate, not a direct measurement, so it can't separate how much of your lean mass is muscle versus water or organ weight the way a DEXA scan can.",
        "Strength athletes and bodybuilders use lean mass numbers to set protein targets (often per pound or kilogram of lean mass rather than total weight) and to track whether a bulk or cut is adding or losing the right kind of tissue, not just moving the scale in either direction.",
        "This runs entirely in your browser using just the height and weight you enter — nothing about your body stats is stored or sent anywhere, and there's a quick note before the numbers: this is a formula estimate, not a body-composition scan or medical measurement.",
      ],
      howItWorks: [
        "The Boer formula (1984) was developed as an update to older lean-mass equations and uses different constants for men and women: LBM = 0.407×kg + 0.267×cm − 19.2 for men, and 0.252×kg + 0.473×cm − 48.3 for women. The differing coefficients reflect that, at the same height and weight, men and women tend to carry different average proportions of muscle versus fat.",
        "Other formulas — James (1976) and Hume (1966) among them — use slightly different constants and can produce results a kilogram or two apart for the same person, which is normal; all of them are population-average approximations rather than a measurement of your specific composition.",
      ],
      faq: [
        {
          q: "What is lean body mass?",
          a: "It's your total body weight minus fat mass — so muscle, bone, organs, water and connective tissue combined, not muscle mass alone. A body with more lean mass at the same total weight generally reflects a leaner, more muscular build.",
        },
        {
          q: "Is lean body mass the same as muscle mass?",
          a: "No — lean mass includes muscle but also bone, organs and body water, so it's always higher than muscle mass alone. There's no way to isolate muscle specifically from height and weight; that requires imaging like a DEXA or MRI scan.",
        },
        {
          q: "Why does the formula use different constants for men and women?",
          a: "Because at the same height and weight, men and women tend to have different average ratios of muscle to fat, so the Boer formula's coefficients are fit separately by sex to better match typical body composition for each.",
        },
        {
          q: "How do I use lean body mass to set a protein target?",
          a: "A common approach is to aim for roughly 0.7–1 gram of protein per pound of lean body mass per day for those focused on muscle retention or growth — though needs vary by training volume, goals and individual factors.",
        },
        {
          q: "Is this formula accurate for very lean or very heavy individuals?",
          a: "It's less reliable at the extremes — formulas like Boer were fit to average body types, so someone who is exceptionally lean, very muscular, or has a high body fat percentage may see a larger gap between the estimate and their real lean mass.",
        },
      ],
    },
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
        steps: [
          `Daily calories = ${fmtNumber(cal, 0)} kcal`,
          `Protein = ${fmtNumber(cal * proteinPct, 0)} kcal ÷ 4 kcal/g = ${fmtNumber(proteinG, 0)} g`,
          `Carbohydrates = ${fmtNumber(cal * carbPct, 0)} kcal ÷ 4 kcal/g = ${fmtNumber(carbG, 0)} g`,
          `Fat = ${fmtNumber(cal * fatPct, 0)} kcal ÷ 9 kcal/g = ${fmtNumber(fatG, 0)} g`,
        ],
        breakdown: [
          { label: "Protein", value: cal * proteinPct, displayValue: `${fmtNumber(proteinG, 0)} g` },
          { label: "Carbohydrates", value: cal * carbPct, displayValue: `${fmtNumber(carbG, 0)} g` },
          { label: "Fat", value: cal * fatPct, displayValue: `${fmtNumber(fatG, 0)} g` },
        ],
        chartCaption: `Your ${fmtNumber(cal, 0)} kcal target splits into ${fmtNumber(proteinPct * 100, 0)}% protein, ${fmtNumber(carbPct * 100, 0)}% carbs and ${fmtNumber(fatPct * 100, 0)}% fat.`,
      };
    },
    relatedSlugs: ["calorie-calculator", "tdee-calculator"],
    content: {
      intro: [
        "This tool takes a daily calorie target and splits it into grams of protein, carbohydrate and fat according to a diet style you pick — balanced, low-carb or high-carb. The percentages behind each style are common, reasonable defaults, not a personalized prescription; the right split for one person's goals, training and preferences can look quite different from another's even at the same calorie total.",
        "It's aimed at anyone who already has a calorie number (from the Calorie or TDEE calculator, or from a coach) and needs it translated into grams they can actually log — carb-conscious dieters, people following a specific training-nutrition approach, or anyone tired of doing the gram math by hand every time their calorie target changes.",
        "As with anything diet-related, this is general nutrition information rather than tailored medical or dietetic advice — a registered dietitian can account for medical conditions and preferences a preset split can't. Your calorie target and results are computed in your browser and never saved or transmitted.",
      ],
      howItWorks: [
        "Protein and carbohydrate both provide about 4 calories per gram, while fat provides about 9 calories per gram — roughly double, since fat is a much more energy-dense macronutrient. Each macro's target grams comes from multiplying your total calories by that macro's percentage, then dividing by its calories-per-gram figure.",
        "The three presets shift the percentage split rather than the total calories: balanced spreads it fairly evenly, low-carb shifts weight toward protein and fat while cutting carbs, and high-carb leans the other way — none of them are inherently \"better,\" they just suit different training styles and personal preference.",
      ],
      faq: [
        {
          q: "How many grams of protein should I eat per day?",
          a: "Common guidance for active adults ranges from about 0.7 to 1 gram of protein per pound of body weight, though needs vary with training volume, age and goals. The balanced and low-carb presets above both weight protein fairly heavily.",
        },
        {
          q: "What if none of the three diet styles fit what I actually eat?",
          a: "The presets are meant as reasonable starting points, not the only valid splits — if you have a specific ratio in mind (say, from a coach or a specific diet protocol), you can calculate custom grams manually using 4 kcal/g for protein and carbs and 9 kcal/g for fat.",
        },
        {
          q: "Is a low-carb split better for weight loss?",
          a: "Not inherently — total calorie intake is the primary driver of weight change, and low-carb diets tend to work mainly because they're often easier for some people to stick to, not because carbs themselves are uniquely fattening.",
        },
        {
          q: "Do I need to hit these macro numbers exactly every day?",
          a: "No — treat them as a target to average toward over a few days, not a number to hit down to the gram daily. Consistency over a week matters far more than any single day's precision.",
        },
        {
          q: "What about fiber or alcohol calories — are they included?",
          a: "This calculator only splits calories across protein, carbs and fat as the three core macronutrients; it doesn't separately break out fiber (counted within carbs) or alcohol, which has its own calorie value (about 7 kcal/g) not represented here.",
        },
      ],
    },
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
      const fmtTime = (totalSec: number) => {
        const h = Math.floor(totalSec / 3600);
        const m = Math.floor((totalSec % 3600) / 60);
        const s = Math.round(totalSec % 60);
        return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
      };
      const raceDistances: [string, number][] =
        unitLabel === "mi"
          ? [
              ["5K", 3.10686],
              ["10K", 6.21371],
              ["Half Marathon", 13.10938],
              ["Marathon", 26.21875],
            ]
          : [
              ["5K", 5],
              ["10K", 10],
              ["Half Marathon", 21.0975],
              ["Marathon", 42.195],
            ];
      return {
        results: [
          { label: "Pace", value: `${paceMin}:${String(paceSec).padStart(2, "0")} / ${unitLabel}`, emphasis: true },
          { label: "Average Speed", value: `${fmtNumber(speed, 2)} ${unitLabel}/h` },
        ],
        table: {
          headers: ["Race Distance", "Distance", "Estimated Finish Time"],
          rows: raceDistances.map(([label, dist]) => [label, `${fmtNumber(dist, 2)} ${unitLabel}`, fmtTime(paceSecPerUnit * dist)]),
        },
        chartCaption: `At your current pace of ${paceMin}:${String(paceSec).padStart(2, "0")} / ${unitLabel}, here's about how long common race distances would take.`,
      };
    },
    relatedSlugs: ["calorie-calculator"],
    content: {
      intro: [
        "This calculator converts a distance and finish time into your pace per mile or kilometer, then projects that same pace across common race distances. The projection assumes you could hold today's pace evenly across a longer distance, which real races rarely allow for — fatigue, pacing strategy and terrain all tend to slow a runner down over a longer distance, so treat the longer-race estimates as optimistic ceilings rather than predictions.",
        "Runners use it two ways: working out what pace a goal finish time actually requires before a race, or checking what a recent training run or race translates to at other distances. It's a quick sanity check either way, not a training plan.",
        "Everything calculates instantly in your browser from the distance and time you enter — no account, no upload, no history saved anywhere.",
      ],
      howItWorks: [
        "Pace is simply total time divided by distance. The race-distance table then multiplies that same per-unit pace across standard distances (5K, 10K, half marathon, marathon) to estimate a finish time at each — useful as a rough benchmark, though it doesn't account for the fact that most runners naturally slow down over longer distances rather than holding a flat pace throughout.",
      ],
      faq: [
        {
          q: "What is a good running pace?",
          a: "It depends entirely on distance, experience and goals — there's no universal \"good\" pace. A pace that's fast for a beginner's 5K might be an easy recovery pace for an experienced marathoner, so compare your pace against your own past times rather than a generic benchmark.",
        },
        {
          q: "How do I calculate my race finish time from my pace?",
          a: "Multiply your per-mile or per-kilometer pace by the total race distance — this calculator does exactly that for common distances automatically once you enter a recent pace or a training run's time and distance.",
        },
        {
          q: "Does pace stay the same over longer distances?",
          a: "Rarely — most runners slow somewhat as distance increases due to fatigue and pacing strategy, so a 5K pace typically overstates what's sustainable across a marathon. Use the projected times here as an upper-bound estimate, not a guarantee.",
        },
        {
          q: "What's the difference between minutes per mile and minutes per kilometer?",
          a: "They're just two different distance units for the same idea — a mile is about 1.609 kilometers, so a pace in min/mile will always be a larger number than the equivalent pace in min/km. Pick whichever unit matches how your race or training plan is measured.",
        },
        {
          q: "How can I improve my running pace?",
          a: "Consistent training volume, interval workouts at faster-than-goal pace, and adequate recovery are the standard levers — pace improvements tend to come gradually over weeks and months of training, not from any single session.",
        },
      ],
    },
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
      const inRange = daysAlong >= 0 && daysAlong <= 300;
      const trimester = week < 14 ? 1 : week < 28 ? 2 : 3;
      const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
      return {
        results: [
          { label: "Estimated Due Date", value: fmt(due), emphasis: true },
          { label: "Current Gestational Age", value: inRange ? `${week} weeks, ${dayOfWeek} days` : "—" },
        ],
        formula: "Due date = LMP + 280 days (40 weeks)",
        steps: [
          `Last menstrual period started ${fmt(lmp)}`,
          `Naegele's rule: LMP + 280 days (40 weeks) → ${fmt(due)}`,
          inRange
            ? `Today you are about ${week} weeks, ${dayOfWeek} days along — Trimester ${trimester}`
            : `Enter a last period date within the last 40 weeks to see your current gestational age`,
        ],
        notes: [
          "Naegele's rule assumes a regular 28-day cycle — an ultrasound-based estimate from your provider is more accurate.",
          "Trimesters run roughly weeks 1–13 (first), 14–27 (second) and 28–40 (third).",
        ],
        // Pregnancy is inherently a 40-week trajectory, so "how far along am I" is a
        // textbook gauge — a position on a range, with the trimesters as the zones.
        ...(inRange
          ? {
              gauge: {
                value: week,
                min: 0,
                max: 40,
                zones: [
                  { label: "1st Trimester", to: 13, barClass: "bg-pink-300 dark:bg-pink-800", textClass: "text-pink-700 dark:text-pink-400" },
                  { label: "2nd Trimester", to: 27, barClass: "bg-fuchsia-400 dark:bg-fuchsia-700", textClass: "text-fuchsia-700 dark:text-fuchsia-400" },
                  { label: "3rd Trimester", to: 40, barClass: "bg-violet-500 dark:bg-violet-600", textClass: "text-violet-700 dark:text-violet-400" },
                ],
                valueLabel: `Wk ${week}`,
              },
              chartCaption: `You're ${week} weeks, ${dayOfWeek} days along, in Trimester ${trimester} — ${40 - week} weeks to go until your estimated due date.`,
            }
          : {}),
      };
    },
    relatedSlugs: ["ovulation-calculator"],
    content: {
      intro: [
        "This calculator applies Naegele's rule — adding 280 days, or 40 weeks, to the first day of your last menstrual period — to estimate a due date. It's a widely used starting estimate, not a precise prediction: it assumes a regular 28-day cycle with ovulation around day 14, and only a small share of babies are actually born on their exact calculated due date, with most arriving within a couple of weeks either side of it.",
        "Expecting parents typically use a number like this early on, before an ultrasound gives a more individually accurate estimate based on measuring the fetus directly rather than assuming a textbook cycle. It's a useful placeholder for planning purposes in the meantime.",
        "This is general pregnancy information, not medical advice or a diagnosis — always confirm dates and follow guidance from your own healthcare provider. Nothing you enter here, including your last period date, is stored or sent anywhere; it stays in your browser.",
      ],
      howItWorks: [
        "Naegele's rule: due date = first day of last menstrual period + 280 days. The 280-day figure comes from assuming a 28-day cycle with ovulation and conception around day 14, then adding a standard 266-day gestation period from conception — in other words, it's built on cycle averages, not your specific cycle.",
        "That's exactly why an early ultrasound is generally considered more accurate than LMP-based dating: it measures the fetus directly and isn't thrown off by an irregular cycle, uncertain ovulation timing, or an imprecisely remembered last period date the way Naegele's rule can be.",
      ],
      faq: [
        {
          q: "How accurate is a due date calculator?",
          a: "It's a reasonable starting estimate, but only a small percentage of babies are born exactly on the calculated date — most arrive within about two weeks before or after it. An ultrasound-based estimate from a provider is generally more precise.",
        },
        {
          q: "What if my menstrual cycle isn't exactly 28 days?",
          a: "Naegele's rule assumes a regular 28-day cycle, so if yours runs consistently longer or shorter, your actual due date may shift earlier or later than this estimate — a provider can adjust for your specific cycle length or confirm dating by ultrasound instead.",
        },
        {
          q: "What's the difference between LMP dating and ultrasound dating?",
          a: "LMP dating estimates conception from your last period and assumes a standard cycle; ultrasound dating measures the fetus's actual size, which is generally more accurate, especially when done in the first trimester before growth rates vary more between babies.",
        },
        {
          q: "How many weeks is considered full term?",
          a: "Full term is generally defined as 39 to 40 weeks, with 37 to 38 weeks considered \"early term\" and anything before 37 weeks considered preterm. Due dates mark 40 weeks exactly, but a healthy delivery can happen anywhere in a several-week window around it.",
        },
        {
          q: "Do most babies arrive exactly on their due date?",
          a: "No — only a small fraction do. It's normal and common for delivery to happen anytime from a couple of weeks before to about a week or two after the calculated due date.",
        },
      ],
    },
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
      { name: "weightLb", label: "Body Weight", type: "number", unit: "lb", defaultValue: 160, min: 1, convertPair: lbKgPair("weightLb") },
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
        gauge: {
          value: clamped,
          min: 0,
          max: 0.3,
          valueLabel: `${fmtNumber(clamped, 3)}%`,
          zones: [
            { label: "Minimal", to: 0.02, barClass: "bg-emerald-400 dark:bg-emerald-500", textClass: "text-emerald-600 dark:text-emerald-400" },
            { label: "Impaired", to: 0.08, barClass: "bg-yellow-400 dark:bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
            { label: "Legally Intoxicated", to: 0.15, barClass: "bg-orange-500 dark:bg-orange-400", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Severe Impairment", to: 0.3, barClass: "bg-red-600 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption:
          clamped >= 0.08
            ? `At ${fmtNumber(clamped, 3)}%, you're estimated to be at or above the legal driving limit in most U.S. states (0.08%) — do not drive.`
            : `At ${fmtNumber(clamped, 3)}%, this estimate is below the typical 0.08% legal limit, but any measurable BAC can impair judgment and reaction time.`,
      };
    },
    relatedSlugs: [],
    content: {
      intro: [
        "This calculator estimates blood alcohol content using the Widmark formula, which combines standard drinks consumed, body weight, sex and time elapsed into a rough BAC percentage. It's a population-average formula, not a breathalyzer reading — food in your stomach, medications, liver function, and how quickly you actually drank can all push your real BAC meaningfully above or below what the math predicts.",
        "People generally reach for a BAC estimate out of curiosity or for general alcohol-education purposes, understanding roughly how different amounts of drinking and time affect the numbers behind terms like \"legally intoxicated.\"",
        "This is an educational estimate only, not a measurement of your actual impairment, and it should never be used to decide whether it's safe to drive or operate anything — if there's any doubt, don't drive. Nothing you enter is stored or sent anywhere; it's calculated locally in your browser.",
      ],
      howItWorks: [
        "The Widmark formula estimates BAC from grams of alcohol consumed, body weight, a sex-based distribution constant (r), and time elapsed: BAC ≈ (alcohol grams × 5.14) / (weight in lb × r) − (0.015 × hours). The r constant — roughly 0.68 for men and 0.55 for women — reflects that alcohol distributes through body water, and men typically have a higher proportion of body water relative to weight than women, so the same amount of alcohol tends to produce a lower BAC in a man of equal weight.",
        "The 0.015-per-hour term subtracts a standard average elimination rate, since the body metabolizes alcohol at a roughly steady pace over time — though this rate, too, varies by individual, which is one more reason the result is an estimate rather than a precise reading.",
      ],
      faq: [
        {
          q: "What BAC level is considered legally intoxicated?",
          a: "In most U.S. states, 0.08% is the legal limit for driving, though commercial drivers and drivers under 21 face lower limits in many places. Impairment to reaction time and judgment can begin well below that threshold, though.",
        },
        {
          q: "How long does it take to sober up?",
          a: "The body eliminates alcohol at roughly 0.015% BAC per hour on average, so a BAC of 0.08% would take around five to six hours to reach zero under that average rate — though individual metabolism can make this faster or slower.",
        },
        {
          q: "Does eating food affect BAC?",
          a: "Yes — food in your stomach slows alcohol absorption into the bloodstream, which can lower peak BAC compared to drinking on an empty stomach, though the Widmark formula used here doesn't factor in food intake at all.",
        },
        {
          q: "Why do men and women get different BAC estimates for the same drinks?",
          a: "The Widmark formula uses a different distribution constant by sex because alcohol dissolves in body water, and men on average have a higher proportion of body water relative to total weight, which tends to dilute the same amount of alcohol more for a man than for a woman of equal weight.",
        },
        {
          q: "Can this calculator tell me if I'm okay to drive?",
          a: "No — it's an educational estimate, not a measurement of your actual impairment or a legal determination. No calculator can reliably tell you it's safe to drive after drinking; if you've had any alcohol, the safest choice is not to drive.",
        },
      ],
    },
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
        steps: [
          `Maximum Heart Rate = 220 − age (${n(i.age, 30)}) = ${maxHr} bpm`,
          `Heart Rate Reserve = Max HR − Resting HR = ${maxHr} − ${rhr} = ${maxHr - rhr} bpm`,
          `Target HR at intensity % = (Heart Rate Reserve × intensity) + Resting HR`,
        ],
        notes: ["These zones are estimates based on age and resting heart rate — actual training zones can vary with fitness level, medication and health conditions."],
        table: {
          headers: ["Zone", "Intensity", "Heart Rate Range"],
          rows: [
            ["Fat Burn", "50–60%", `${zone(0.5)}–${zone(0.6)} bpm`],
            ["Cardio", "60–70%", `${zone(0.6)}–${zone(0.7)} bpm`],
            ["Peak", "70–85%", `${zone(0.7)}–${zone(0.85)} bpm`],
          ],
        },
        chartCaption: `Your training zones are based on a heart rate reserve of ${maxHr - rhr} bpm (max minus resting).`,
      };
    },
    relatedSlugs: ["calorie-calculator"],
    content: {
      intro: [
        "This calculator finds training heart-rate zones using the Karvonen formula, which factors in your resting heart rate alongside an age-estimated maximum, rather than just taking a flat percentage of max heart rate alone. The age-based max heart rate formula (220 minus age) is itself a rough population average — actual maximum heart rate varies by several beats per minute even among healthy people of the same age, and certain medications, especially beta blockers, can significantly lower both resting and maximum heart rate.",
        "Runners, cyclists and anyone structuring cardio around effort zones — fat-burn, cardio, peak — use this to translate vague terms like \"moderate intensity\" into an actual heart-rate number they can watch on a monitor mid-workout.",
        "As a quick note: these zones are general fitness estimates, not a substitute for guidance from a doctor, especially if you have a heart condition or take medication that affects heart rate. Your age and resting heart rate are calculated locally and never leave your browser.",
      ],
      howItWorks: [
        "The Karvonen method first computes heart rate reserve (max heart rate minus resting heart rate), then scales that reserve by an intensity percentage before adding resting heart rate back: Target HR = ((max HR − resting HR) × intensity%) + resting HR. This differs from the simpler \"percentage of max heart rate only\" method by accounting for your individual fitness level through resting heart rate — a fitter person with a lower resting heart rate gets a meaningfully different target than someone with the same max heart rate but a higher resting rate.",
        "Maximum heart rate itself is only ever estimated here as 220 minus age, a commonly used but fairly rough population formula; a supervised maximal exercise test would give a more individually accurate max heart rate than the age formula can.",
      ],
      faq: [
        {
          q: "What is a good target heart rate for exercise?",
          a: "It depends on your goal — roughly 50–70% of heart rate reserve is considered moderate intensity and 70–85% vigorous, per common guidelines. Lower-intensity zones suit longer, easier sessions; higher zones suit shorter, harder efforts.",
        },
        {
          q: "What's the difference between the Karvonen method and just using a percentage of max heart rate?",
          a: "The simple method ignores your resting heart rate entirely, while Karvonen factors it in through heart rate reserve — this generally gives a more personalized target, especially for people whose fitness level (and therefore resting heart rate) differs from average.",
        },
        {
          q: "What if I'm on heart medication like a beta blocker?",
          a: "These formulas assume an unmedicated heart rate response, and medications like beta blockers can lower both resting and maximum heart rate substantially — talk to your doctor about an appropriate target zone if you're on heart-affecting medication.",
        },
        {
          q: "How do I measure my resting heart rate accurately?",
          a: "Check your pulse first thing in the morning, before getting out of bed, ideally over a full 60 seconds for a few days in a row and averaging the results — resting heart rate is typically at its lowest and most stable at that time of day.",
        },
        {
          q: "Which zone should I train in for fat loss versus endurance?",
          a: "Lower-to-moderate zones (roughly 50–70%) are often associated with fat-burning percentage of calories burned and are sustainable for longer sessions, while higher zones build cardiovascular fitness faster per minute — most well-rounded programs use a mix rather than staying in just one zone.",
        },
      ],
    },
  },
  {
    slug: "one-rep-max-calculator",
    title: "One-Rep Max Calculator",
    category: "health",
    shortDescription: "Estimate your one-rep max (1RM) from a weight and rep count.",
    seoDescription: "Estimate your one-rep max (1RM) for any lift using the Epley formula, with a percentage table for training loads.",
    formulaSummary: "Epley: 1RM = weight × (1 + reps/30)",
    fields: [
      { name: "weight", label: "Weight Lifted", type: "number", unit: "lb", defaultValue: 185, min: 0, convertPair: lbKgPair("weight") },
      { name: "reps", label: "Reps Completed", type: "number", defaultValue: 5, min: 1, max: 20 },
    ],
    calculate: (i) => {
      const w = n(i.weight, 185);
      const reps = n(i.reps, 5);
      const oneRm = w * (1 + reps / 30);
      const pct = [95, 90, 85, 80, 75, 70, 65, 60];
      const repTable: [number, number][] = [
        [1, 100],
        [2, 95],
        [3, 93],
        [4, 90],
        [5, 87],
        [6, 85],
        [7, 83],
        [8, 80],
        [9, 77],
        [10, 75],
      ];
      return {
        results: [
          { label: "Estimated 1RM", value: `${fmtNumber(oneRm, 0)} lb`, emphasis: true },
          ...pct.map((p) => ({ label: `${p}% of 1RM`, value: `${fmtNumber((oneRm * p) / 100, 0)} lb` })),
        ],
        formula: "1RM = weight × (1 + reps ÷ 30)",
        steps: [
          `Weight lifted = ${fmtNumber(w, 0)} lb, Reps completed = ${reps}`,
          `1RM = ${fmtNumber(w, 0)} × (1 + ${reps} ÷ 30) = ${fmtNumber(oneRm, 0)} lb`,
        ],
        notes: ["The Epley formula is most accurate for sets of 10 reps or fewer — heavier singles and doubles give the most reliable estimate."],
        table: {
          headers: ["Reps", "% of 1RM", "Estimated Weight"],
          rows: repTable.map(([r, p]) => [`${r}`, `${p}%`, `${fmtNumber((oneRm * p) / 100, 0)} lb`]),
        },
        chartCaption: `Use this table to plan training loads — e.g. ${fmtNumber((oneRm * 85) / 100, 0)} lb for a set of about 6 reps.`,
      };
    },
    relatedSlugs: ["lean-body-mass-calculator"],
    content: {
      intro: [
        "A one-rep max (1RM) is the heaviest weight you could lift for a single complete rep, and this calculator estimates it from a lighter set you actually performed, using the Epley formula. It's a prediction extrapolated from submaximal reps, not a measured max — actual 1RM testing involves real risk and fatigue that a formula can't capture, so treat the number as a planning estimate rather than a guaranteed true max.",
        "Lifters use estimated 1RM mainly to program percentage-based training — knowing that a working set at, say, 80% of 1RM should feel a certain way lets you plan progressive overload without maxing out every session, which is both safer and less fatiguing over a training block.",
        "This is general strength-training information, not personalized coaching — form, experience and individual recovery all affect how a real max would compare to the estimate. Your lift numbers are calculated instantly in your browser and never stored.",
      ],
      howItWorks: [
        "The Epley formula: 1RM = weight × (1 + reps ÷ 30). It's one of several competing rep-max formulas (Brzycki is another common one), and all of them share the same core assumption — that the relationship between weight and reps-to-failure follows a fairly predictable curve — which holds up reasonably well for moderate rep ranges but grows less reliable at the extremes.",
        "Estimates get less accurate the higher the rep count used to calculate them: a set of 3–5 reps predicts 1RM fairly reliably, but a set of 15–20 reps asks the formula to extrapolate much further from what was actually lifted, and fatigue and pacing differences start to matter more than the formula accounts for.",
      ],
      faq: [
        {
          q: "How accurate is a 1RM calculator?",
          a: "It's generally a solid estimate for sets in the 1–10 rep range, particularly under 5 reps, but accuracy declines the higher the rep count used — a max estimated from a set of 15+ reps is a much rougher guess than one from a set of 3.",
        },
        {
          q: "Which formula is more accurate — Epley or Brzycki?",
          a: "Neither is universally more accurate; they tend to agree closely at low-to-moderate reps and diverge more at higher rep counts. Both are reasonable estimates, and neither replaces an actual tested max for precision.",
        },
        {
          q: "Should beginners test their true 1RM or just estimate it?",
          a: "Most coaches recommend beginners estimate rather than test a true max early on, since proper technique under near-maximal load takes time to develop and true max attempts carry more injury risk without that foundation. An estimate from a controlled set of 3–5 reps is a safer starting point.",
        },
        {
          q: "How often should I retest or recalculate my 1RM?",
          a: "Every few weeks to a couple of months is common for lifters running percentage-based programs, since strength changes gradually — recalculating too often just adds noise, while going too long risks training off an outdated number.",
        },
        {
          q: "Is my 1RM the same percentage-wise across different lifts?",
          a: "Not exactly — the relationship between reps and percentage of 1RM can vary somewhat by exercise and by individual, with compound lifts like the squat or deadlift sometimes behaving slightly differently than isolation movements. The percentage table above is a general guide, not an exact rule for every lift.",
        },
      ],
    },
  },
];

export default health;
