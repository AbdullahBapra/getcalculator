import type { CalculatorDefinition } from "./types";
import { n, fmtNumber, round } from "../format";
import { gcd, lcm, factorial, parseNumberList, computeStats, normalCdf } from "./math-helpers";

const math: CalculatorDefinition[] = [
  {
    slug: "percentage-calculator",
    title: "Percentage Calculator",
    category: "math",
    shortDescription: "Find a percentage of a number, what percent one number is of another, or percent change.",
    seoDescription: "Calculate what X% of Y is, what percent X is of Y, or the percent change/increase/decrease between two numbers.",
    formulaSummary: "A% of B = (A/100)×B",
    fields: [
      { name: "mode", label: "What do you want to find?", type: "select", defaultValue: "of", options: [
        { value: "of", label: "A% of B" },
        { value: "isWhatPercent", label: "A is what % of B" },
        { value: "change", label: "% change from A to B" },
      ] },
      { name: "a", label: "A", type: "number", defaultValue: 20 },
      { name: "b", label: "B", type: "number", defaultValue: 150 },
    ],
    calculate: (i) => {
      const a = n(i.a), b = n(i.b);
      if (i.mode === "isWhatPercent") {
        const r = b !== 0 ? (a / b) * 100 : NaN;
        const base = {
          results: [{ label: "Result", value: `${fmtNumber(r)}%`, emphasis: true }],
          steps: [`${a} ÷ ${b} × 100 = ${fmtNumber(r)}%`],
        };
        if (r >= 0 && r <= 100) {
          return {
            ...base,
            breakdown: [
              { label: `A (${fmtNumber(a)})`, value: a, displayValue: `${fmtNumber(r)}%` },
              { label: "Remainder of B", value: b - a, displayValue: `${fmtNumber(100 - r)}%` },
            ],
            chartCaption: `${fmtNumber(a)} makes up ${fmtNumber(r)}% of ${fmtNumber(b)} — the rest of the donut is the ${fmtNumber(100 - r, 2)}% left over.`,
          };
        }
        return {
          ...base,
          compare: [
            { label: "A", value: a, displayValue: fmtNumber(a) },
            { label: "B", value: b, displayValue: fmtNumber(b) },
          ],
          chartCaption: `A is ${fmtNumber(r)}% of B — since that's over 100% (or negative), A doesn't fit neatly inside B, so here they are side by side instead.`,
        };
      }
      if (i.mode === "change") {
        const r = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : NaN;
        return {
          results: [{ label: r >= 0 ? "Percent Increase" : "Percent Decrease", value: `${fmtNumber(Math.abs(r))}%`, emphasis: true }],
          steps: [`(${b} − ${a}) ÷ |${a}| × 100 = ${fmtNumber(r)}%`],
          compare: [
            { label: "Before (A)", value: a, displayValue: fmtNumber(a) },
            { label: "After (B)", value: b, displayValue: fmtNumber(b), highlight: true },
          ],
          chartCaption: `The value moved from ${fmtNumber(a)} to ${fmtNumber(b)} — a ${r >= 0 ? "gain" : "drop"} of ${fmtNumber(Math.abs(r))}%.`,
        };
      }
      const r = (a / 100) * b;
      return {
        results: [{ label: "Result", value: fmtNumber(r), emphasis: true }],
        steps: [`${a}% × ${b} = ${fmtNumber(r)}`],
        compare: [
          { label: "Whole (B)", value: b, displayValue: fmtNumber(b) },
          { label: `${fmtNumber(a)}% of B`, value: r, displayValue: fmtNumber(r), highlight: true },
        ],
        chartCaption: `${fmtNumber(a)}% of ${fmtNumber(b)} is ${fmtNumber(r)} — see how that slice sizes up against the whole.`,
      };
    },
    relatedSlugs: ["discount-calculator", "percent-error-calculator"],
  },
  {
    slug: "fraction-calculator",
    title: "Fraction Calculator",
    category: "math",
    shortDescription: "Add, subtract, multiply or divide two fractions and simplify the result.",
    seoDescription: "Add, subtract, multiply or divide two fractions, with the result simplified and shown as a decimal.",
    formulaSummary: "a/b op c/d, simplified by GCD",
    fields: [
      { name: "num1", label: "Numerator", type: "number", defaultValue: 1 },
      { name: "den1", label: "Denominator", type: "number", defaultValue: 2 },
      { name: "op", label: "Operation", type: "select", defaultValue: "+", options: [
        { value: "+", label: "+" }, { value: "-", label: "−" }, { value: "*", label: "×" }, { value: "/", label: "÷" },
      ] },
      { name: "num2", label: "Numerator", type: "number", defaultValue: 1 },
      { name: "den2", label: "Denominator", type: "number", defaultValue: 3 },
    ],
    calculate: (i) => {
      const n1 = n(i.num1, 1), d1 = n(i.den1, 1), n2 = n(i.num2, 1), d2 = n(i.den2, 1);
      if (d1 === 0 || d2 === 0) return { results: [], error: "Denominator cannot be zero." };
      let rn: number, rd: number;
      switch (i.op) {
        case "-": rn = n1 * d2 - n2 * d1; rd = d1 * d2; break;
        case "*": rn = n1 * n2; rd = d1 * d2; break;
        case "/":
          if (n2 === 0) return { results: [], error: "Cannot divide by a fraction equal to zero." };
          rn = n1 * d2; rd = d1 * n2; break;
        default: rn = n1 * d2 + n2 * d1; rd = d1 * d2;
      }
      const g = gcd(rn, rd) || 1;
      let simpN = rn / g, simpD = rd / g;
      if (simpD < 0) { simpD = -simpD; simpN = -simpN; }
      const opSymbol = i.op === "-" ? "−" : i.op === "*" ? "×" : i.op === "/" ? "÷" : "+";
      const dec1 = n1 / d1, dec2 = n2 / d2, decResult = simpN / simpD;
      return {
        results: [
          { label: "Result", value: `${simpN}/${simpD}`, emphasis: true },
          { label: "Decimal", value: fmtNumber(decResult, 4) },
        ],
        compare: [
          { label: `${n1}/${d1}`, value: dec1, displayValue: fmtNumber(dec1, 4) },
          { label: `${n2}/${d2}`, value: dec2, displayValue: fmtNumber(dec2, 4) },
          { label: `Result (${simpN}/${simpD})`, value: decResult, displayValue: fmtNumber(decResult, 4), highlight: true },
        ],
        chartCaption: `${n1}/${d1} ${opSymbol} ${n2}/${d2} = ${simpN}/${simpD} — shown here as decimals so you can see how the result compares to each fraction you started with.`,
      };
    },
    relatedSlugs: ["percentage-calculator", "ratio-calculator"],
  },
  {
    slug: "quadratic-formula-calculator",
    title: "Quadratic Formula Calculator",
    category: "math",
    shortDescription: "Solve ax² + bx + c = 0 for x.",
    seoDescription: "Solve any quadratic equation ax² + bx + c = 0 for real or complex roots using the quadratic formula.",
    formulaSummary: "x = [−b ± √(b²−4ac)] / 2a",
    fields: [
      { name: "a", label: "a", type: "number", defaultValue: 1 },
      { name: "b", label: "b", type: "number", defaultValue: -3 },
      { name: "c", label: "c", type: "number", defaultValue: 2 },
    ],
    calculate: (i) => {
      const a = n(i.a, 1), b = n(i.b), c = n(i.c);
      if (a === 0) return { results: [], error: "'a' cannot be 0 — this would not be a quadratic equation." };
      const disc = b * b - 4 * a * c;
      if (disc > 0) {
        const x1 = (-b + Math.sqrt(disc)) / (2 * a);
        const x2 = (-b - Math.sqrt(disc)) / (2 * a);
        return {
          results: [{ label: "x₁", value: fmtNumber(x1, 4), emphasis: true }, { label: "x₂", value: fmtNumber(x2, 4), emphasis: true }],
          formula: "x = [−b ± √(b²−4ac)] / 2a",
          steps: [`Discriminant = ${b}² − 4×${a}×${c} = ${fmtNumber(disc, 4)}`],
          table: {
            headers: ["Term", "Value"],
            rows: [
              ["b²", fmtNumber(b * b, 4)],
              ["4ac", fmtNumber(4 * a * c, 4)],
              ["Discriminant (b² − 4ac)", fmtNumber(disc, 4)],
              ["√Discriminant", fmtNumber(Math.sqrt(disc), 4)],
              ["x₁ = (−b + √disc) / 2a", fmtNumber(x1, 4)],
              ["x₂ = (−b − √disc) / 2a", fmtNumber(x2, 4)],
            ],
          },
          chartCaption: "A positive discriminant means the parabola crosses the x-axis twice — two distinct real roots.",
        };
      }
      if (disc === 0) {
        const x = -b / (2 * a);
        return {
          results: [{ label: "x (double root)", value: fmtNumber(x, 4), emphasis: true }],
          formula: "x = −b / 2a",
          steps: [`Discriminant = ${b}² − 4×${a}×${c} = 0`, `x = −${b} / (2×${a}) = ${fmtNumber(x, 4)}`],
          notes: ["A discriminant of exactly 0 means the parabola just touches the x-axis at a single point — a repeated root."],
        };
      }
      const real = -b / (2 * a);
      const imag = Math.sqrt(-disc) / (2 * a);
      return {
        results: [
          { label: "x₁", value: `${fmtNumber(real, 4)} + ${fmtNumber(imag, 4)}i`, emphasis: true },
          { label: "x₂", value: `${fmtNumber(real, 4)} − ${fmtNumber(imag, 4)}i`, emphasis: true },
        ],
        notes: ["The discriminant is negative, so the roots are complex (no real solutions)."],
        table: {
          headers: ["Term", "Value"],
          rows: [
            ["Discriminant (b² − 4ac)", fmtNumber(disc, 4)],
            ["Real part (−b / 2a)", fmtNumber(real, 4)],
            ["Imaginary part (√|disc| / 2a)", fmtNumber(imag, 4)],
          ],
        },
        chartCaption: "A negative discriminant means the parabola never touches the x-axis — the roots exist only in the complex plane.",
      };
    },
    relatedSlugs: ["exponent-calculator"],
  },
  {
    slug: "gcf-lcm-calculator",
    title: "GCF & LCM Calculator",
    category: "math",
    shortDescription: "Find the greatest common factor and least common multiple of a list of numbers.",
    seoDescription: "Calculate the greatest common factor (GCF) and least common multiple (LCM) of two or more numbers.",
    formulaSummary: "GCD via Euclidean algorithm; LCM(a,b) = |a×b| / GCD(a,b)",
    fields: [{ name: "numbers", label: "Numbers (comma separated)", type: "text", defaultValue: "12, 18, 30" }],
    calculate: (i) => {
      const nums = parseNumberList(i.numbers || "").filter((v) => v !== 0);
      if (nums.length < 2) return { results: [], error: "Enter at least two non-zero numbers, separated by commas." };
      const g = nums.reduce((a, b) => gcd(a, b));
      const l = nums.reduce((a, b) => lcm(a, b));
      const gcdSteps: string[] = [];
      let runningG = Math.abs(Math.round(nums[0]));
      for (let idx = 1; idx < nums.length; idx++) {
        const next = Math.abs(Math.round(nums[idx]));
        let x = runningG, y = next;
        const euclid: string[] = [];
        while (y) {
          euclid.push(`${x} = ${Math.floor(x / y)}×${y} + ${x % y}`);
          [x, y] = [y, x % y];
        }
        gcdSteps.push(`GCD(${runningG}, ${next}): ${euclid.join(", ")} → GCD = ${x}`);
        runningG = gcd(runningG, next);
      }
      const lcmSteps: string[] = [];
      let runningL = Math.abs(Math.round(nums[0]));
      for (let idx = 1; idx < nums.length; idx++) {
        const next = Math.abs(Math.round(nums[idx]));
        const nextL = lcm(runningL, next);
        lcmSteps.push(`LCM(${runningL}, ${next}) = (${runningL}×${next}) / GCD(${runningL}, ${next}) = ${fmtNumber(nextL, 0)}`);
        runningL = nextL;
      }
      return {
        results: [
          { label: "Greatest Common Factor", value: fmtNumber(g, 0), emphasis: true },
          { label: "Least Common Multiple", value: fmtNumber(l, 0), emphasis: true },
        ],
        steps: [...gcdSteps, ...lcmSteps],
        notes: ["The GCF is found with the Euclidean algorithm (repeated division with remainder); the LCM is built up pairwise using LCM(a,b) = (a×b) / GCD(a,b)."],
        compare: [
          { label: "GCF (largest shared factor)", value: g, displayValue: fmtNumber(g, 0) },
          { label: "LCM (smallest shared multiple)", value: l, displayValue: fmtNumber(l, 0), highlight: true },
        ],
        chartCaption: `The GCF is always the smaller of the two — it divides every number in your list — while the LCM, the smallest number every one of them divides into, is always the larger (here ${fmtNumber(l / g, 0)}× bigger).`,
      };
    },
    relatedSlugs: ["fraction-calculator"],
  },
  {
    slug: "statistics-calculator",
    title: "Statistics Calculator",
    category: "math",
    shortDescription: "Get mean, median, mode, range, variance and standard deviation from a data set.",
    seoDescription: "Calculate mean, median, mode, range, sample and population standard deviation and variance from a list of numbers.",
    formulaSummary: "σ = √(Σ(x−mean)² / N)",
    fields: [{ name: "numbers", label: "Data Set (comma separated)", type: "text", defaultValue: "4, 8, 6, 5, 3, 9, 7" }],
    calculate: (i) => {
      const values = parseNumberList(i.numbers || "");
      if (values.length === 0) return { results: [], error: "Enter at least one number, separated by commas." };
      const s = computeStats(values);
      return {
        results: [
          { label: "Count", value: fmtNumber(s.count, 0) },
          { label: "Sum", value: fmtNumber(s.sum) },
          { label: "Mean", value: fmtNumber(s.mean, 4), emphasis: true },
          { label: "Median", value: fmtNumber(s.median, 4) },
          { label: "Mode", value: s.modes.length ? s.modes.map((m) => fmtNumber(m)).join(", ") : "None" },
          { label: "Range", value: fmtNumber(s.range, 4) },
          { label: "Sample Std. Deviation", value: fmtNumber(s.stdDevSample, 4), emphasis: true },
          { label: "Population Std. Deviation", value: fmtNumber(s.stdDevPop, 4) },
          { label: "Sample Variance", value: fmtNumber(s.varianceSample, 4) },
        ],
        table: {
          headers: ["Value", "Deviation (x − mean)", "Squared Deviation"],
          rows: values.map((v) => [fmtNumber(v, 4), fmtNumber(v - s.mean, 4), fmtNumber((v - s.mean) ** 2, 4)]),
        },
        chartCaption: `Each row shows how far that data point sits from the mean (${fmtNumber(s.mean, 4)}) — squaring those distances and averaging them is exactly how the standard deviation above is built.`,
      };
    },
    relatedSlugs: ["standard-deviation-calculator", "z-score-calculator"],
  },
  {
    slug: "standard-deviation-calculator",
    title: "Standard Deviation Calculator",
    category: "math",
    shortDescription: "Calculate population and sample standard deviation from a data set.",
    seoDescription: "Calculate the standard deviation and variance of a data set, both population and sample.",
    formulaSummary: "σ = √(Σ(x−mean)² / N)",
    fields: [{ name: "numbers", label: "Data Set (comma separated)", type: "text", defaultValue: "10, 12, 23, 23, 16, 23, 21, 16" }],
    calculate: (i) => {
      const values = parseNumberList(i.numbers || "");
      if (values.length === 0) return { results: [], error: "Enter at least one number, separated by commas." };
      const s = computeStats(values);
      return {
        results: [
          { label: "Mean", value: fmtNumber(s.mean, 4) },
          { label: "Population Std. Deviation", value: fmtNumber(s.stdDevPop, 4), emphasis: true },
          { label: "Sample Std. Deviation", value: fmtNumber(s.stdDevSample, 4), emphasis: true },
          { label: "Sample Variance", value: fmtNumber(s.varianceSample, 4) },
        ],
        formula: "σ = √(Σ(x − mean)² / N)",
        compare: [
          { label: "Population Std. Deviation (÷N)", value: s.stdDevPop, displayValue: fmtNumber(s.stdDevPop, 4) },
          { label: "Sample Std. Deviation (÷N−1)", value: s.stdDevSample, displayValue: fmtNumber(s.stdDevSample, 4), highlight: true },
        ],
        chartCaption:
          values.length > 1
            ? `Dividing by N−1 instead of N makes the sample estimate a little wider — ${fmtNumber(s.stdDevSample, 4)} vs ${fmtNumber(s.stdDevPop, 4)} — to correct for only having a sample, not the whole population.`
            : "With only one data point, standard deviation isn't meaningful — add more values for a real comparison.",
      };
    },
    relatedSlugs: ["statistics-calculator", "mean-median-mode-calculator"],
  },
  {
    slug: "mean-median-mode-calculator",
    title: "Mean, Median, Mode & Range Calculator",
    category: "math",
    shortDescription: "Calculate the mean, median, mode and range of a set of numbers.",
    seoDescription: "Calculate the mean (average), median, mode and range of any data set.",
    formulaSummary: "Mean = Σx / N",
    fields: [{ name: "numbers", label: "Data Set (comma separated)", type: "text", defaultValue: "2, 4, 4, 4, 5, 5, 7, 9" }],
    calculate: (i) => {
      const values = parseNumberList(i.numbers || "");
      if (values.length === 0) return { results: [], error: "Enter at least one number, separated by commas." };
      const s = computeStats(values);
      const compareItems: { label: string; value: number; displayValue: string; highlight?: boolean }[] = [
        { label: "Mean", value: s.mean, displayValue: fmtNumber(s.mean, 4) },
        { label: "Median", value: s.median, displayValue: fmtNumber(s.median, 4) },
      ];
      if (s.modes.length === 1) {
        compareItems.push({ label: "Mode", value: s.modes[0], displayValue: fmtNumber(s.modes[0]) });
      }
      return {
        results: [
          { label: "Mean", value: fmtNumber(s.mean, 4), emphasis: true },
          { label: "Median", value: fmtNumber(s.median, 4), emphasis: true },
          { label: "Mode", value: s.modes.length ? s.modes.map((m) => fmtNumber(m)).join(", ") : "None", emphasis: true },
          { label: "Range", value: fmtNumber(s.range, 4) },
        ],
        compare: compareItems,
        chartCaption:
          Math.abs(s.mean - s.median) < 1e-9
            ? "Mean and median line up closely, which usually means the data set is fairly symmetric."
            : `Mean and median differ (${fmtNumber(s.mean, 4)} vs ${fmtNumber(s.median, 4)}) — that gap is a sign the data set is skewed by some unusually high or low values.`,
      };
    },
    relatedSlugs: ["statistics-calculator"],
  },
  {
    slug: "percent-error-calculator",
    title: "Percent Error Calculator",
    category: "math",
    shortDescription: "Calculate the percent error between an experimental and theoretical value.",
    seoDescription: "Calculate percent error between a measured (experimental) value and the accepted (theoretical) value.",
    formulaSummary: "%Error = |experimental − theoretical| / |theoretical| × 100",
    fields: [
      { name: "experimental", label: "Experimental (Measured) Value", type: "number", defaultValue: 9.8 },
      { name: "theoretical", label: "Theoretical (Accepted) Value", type: "number", defaultValue: 10 },
    ],
    calculate: (i) => {
      const exp = n(i.experimental), theo = n(i.theoretical);
      if (theo === 0) return { results: [], error: "Theoretical value cannot be zero." };
      const err = (Math.abs(exp - theo) / Math.abs(theo)) * 100;
      return {
        results: [{ label: "Percent Error", value: `${fmtNumber(err, 3)}%`, emphasis: true }],
        steps: [`|${exp} − ${theo}| ÷ |${theo}| × 100 = ${fmtNumber(err, 3)}%`],
        compare: [
          { label: "Theoretical (Accepted)", value: theo, displayValue: fmtNumber(theo) },
          { label: "Experimental (Measured)", value: exp, displayValue: fmtNumber(exp), highlight: true },
        ],
        chartCaption: `Your measured value is off from the accepted value by ${fmtNumber(err, 3)}% — the closer the two bars, the more accurate the measurement.`,
      };
    },
    relatedSlugs: ["percentage-calculator"],
  },
  {
    slug: "exponent-calculator",
    title: "Exponent Calculator",
    category: "math",
    shortDescription: "Calculate a base raised to a power, including negative and fractional exponents.",
    seoDescription: "Calculate base^exponent for any real base and exponent, including negative and fractional powers.",
    formulaSummary: "result = base^exponent",
    fields: [
      { name: "base", label: "Base", type: "number", defaultValue: 2 },
      { name: "exponent", label: "Exponent", type: "number", defaultValue: 10 },
    ],
    calculate: (i) => {
      const base = n(i.base, 2), exp = n(i.exponent, 1);
      const result = Math.pow(base, exp);
      const steps = [`${base}^${exp} = ${fmtNumber(result, 6)}`];
      if (Number.isInteger(exp) && exp >= 2 && exp <= 12) {
        steps.push(`${base} multiplied by itself ${exp} times: ${Array(exp).fill(fmtNumber(base)).join(" × ")} = ${fmtNumber(result, 6)}`);
      } else if (exp === 0) {
        steps.push("Any non-zero number raised to the power of 0 is 1.");
      } else if (Number.isInteger(exp) && exp < 0) {
        steps.push(`A negative exponent means "1 over": ${base}^${exp} = 1 / ${base}^${-exp} = ${fmtNumber(result, 6)}`);
      } else if (!Number.isInteger(exp)) {
        steps.push(`A fractional exponent mixes a power and a root: ${base}^${fmtNumber(exp, 4)} = ${fmtNumber(result, 6)}`);
      }
      const results = [{ label: "Result", value: fmtNumber(result, 6), emphasis: true }];
      if (base > 0 && Number.isInteger(exp) && exp >= 2 && exp <= 12) {
        const growthSeries = Array.from({ length: exp }, (_, idx) => {
          const power = idx + 1;
          const val = Math.pow(base, power);
          return { label: `${fmtNumber(base)}^${power}`, value: val, displayValue: fmtNumber(val, 6) };
        });
        return {
          results,
          steps,
          growthSeries,
          chartCaption: `Each step multiplies by ${fmtNumber(base)} again — watch how fast ${fmtNumber(base)}^${exp} builds up to ${fmtNumber(result, 6)} from ${fmtNumber(base)}^1.`,
        };
      }
      return {
        results,
        steps,
        compare: [
          { label: "Base", value: base, displayValue: fmtNumber(base, 6) },
          { label: "Result", value: result, displayValue: fmtNumber(result, 6), highlight: true },
        ],
        chartCaption: `${fmtNumber(base)} raised to the power ${fmtNumber(exp, 4)} sized up against the original base.`,
      };
    },
    relatedSlugs: ["root-calculator", "log-calculator"],
  },
  {
    slug: "root-calculator",
    title: "Root Calculator",
    category: "math",
    shortDescription: "Calculate the nth root of a number.",
    seoDescription: "Calculate the square root, cube root, or any nth root of a number.",
    formulaSummary: "result = value^(1/n)",
    fields: [
      { name: "value", label: "Value", type: "number", defaultValue: 27 },
      { name: "degree", label: "Root Degree (n)", type: "number", defaultValue: 3, min: 1, step: 1 },
    ],
    calculate: (i) => {
      const value = n(i.value, 27), degree = Math.max(1, n(i.degree, 2));
      if (value < 0 && degree % 2 === 0) return { results: [], error: "Even roots of a negative number are not real." };
      const result = value < 0 ? -Math.pow(-value, 1 / degree) : Math.pow(value, 1 / degree);
      return {
        results: [{ label: "Result", value: fmtNumber(result, 6), emphasis: true }],
        steps: [
          `${degree}√${value} = ${fmtNumber(result, 6)}`,
          `Check: ${fmtNumber(result, 6)}^${degree} ≈ ${fmtNumber(Math.pow(result, degree), 6)}`,
        ],
        compare: [
          { label: "Original Value", value, displayValue: fmtNumber(value, 6) },
          { label: `${degree}√ Result`, value: result, displayValue: fmtNumber(result, 6), highlight: true },
        ],
        chartCaption: `Sizing up ${fmtNumber(value, 6)} against its ${degree}-degree root — the further apart the bars, the more root-taking shrinks the number.`,
      };
    },
    relatedSlugs: ["exponent-calculator"],
  },
  {
    slug: "log-calculator",
    title: "Log Calculator",
    category: "math",
    shortDescription: "Calculate the logarithm of a number for any base, including natural log.",
    seoDescription: "Calculate log base b of x, including common log (base 10) and natural log (base e).",
    formulaSummary: "log_b(x) = ln(x) / ln(b)",
    fields: [
      { name: "value", label: "Value (x)", type: "number", defaultValue: 100, min: 0.0000001 },
      { name: "base", label: "Base (b)", type: "number", defaultValue: 10, min: 0.0000001 },
    ],
    calculate: (i) => {
      const value = n(i.value, 100), base = n(i.base, 10);
      if (value <= 0 || base <= 0 || base === 1) return { results: [], error: "Value must be > 0 and base must be > 0 and ≠ 1." };
      const result = Math.log(value) / Math.log(base);
      return {
        results: [
          { label: `log_${fmtNumber(base)}(${fmtNumber(value)})`, value: fmtNumber(result, 6), emphasis: true },
          { label: "Natural Log ln(x)", value: fmtNumber(Math.log(value), 6) },
        ],
        steps: [
          `A logarithm asks "what power do I raise the base to?" — log_${fmtNumber(base)}(${fmtNumber(value)}) = ${fmtNumber(result, 6)}`,
          `Check: ${fmtNumber(base)}^${fmtNumber(result, 6)} ≈ ${fmtNumber(value)}`,
        ],
        compare: [
          { label: "Input Value (x)", value, displayValue: fmtNumber(value, 6) },
          { label: `log_${fmtNumber(base)}(x)`, value: result, displayValue: fmtNumber(result, 6), highlight: true },
        ],
        chartCaption: `Logarithms compress scale — ${fmtNumber(value, 6)} collapses down to just ${fmtNumber(result, 6)} once you ask "what power of ${fmtNumber(base)} gives this?"`,
      };
    },
    relatedSlugs: ["exponent-calculator"],
  },
  {
    slug: "ratio-calculator",
    title: "Ratio Calculator",
    category: "math",
    shortDescription: "Simplify a ratio, or solve a proportion A:B = C:D for the missing value.",
    seoDescription: "Simplify a ratio to lowest terms, or solve a proportion for a missing value.",
    formulaSummary: "A:B = C:D → D = (B×C)/A",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "simplify", options: [
        { value: "simplify", label: "Simplify A : B" },
        { value: "proportion", label: "Solve A : B = C : ?" },
      ] },
      { name: "a", label: "A", type: "number", defaultValue: 8 },
      { name: "b", label: "B", type: "number", defaultValue: 12 },
      { name: "c", label: "C", type: "number", defaultValue: 20, showIf: (i) => i.mode === "proportion" },
    ],
    calculate: (i) => {
      const a = n(i.a, 1), b = n(i.b, 1);
      if (i.mode === "proportion") {
        const c = n(i.c, 1);
        if (a === 0) return { results: [], error: "A cannot be 0." };
        const d = (b * c) / a;
        return {
          results: [{ label: "Missing Value (D)", value: fmtNumber(d, 4), emphasis: true }],
          steps: [`${a}:${b} = ${c}:D → D = (${b}×${c})/${a} = ${fmtNumber(d, 4)}`],
          compare: [
            { label: "A", value: a, displayValue: fmtNumber(a) },
            { label: "B", value: b, displayValue: fmtNumber(b) },
            { label: "C", value: c, displayValue: fmtNumber(c) },
            { label: "D", value: d, displayValue: fmtNumber(d, 4), highlight: true },
          ],
          chartCaption: "A:B and C:D are equivalent ratios, so all four bars grow by the same scale factor — that's what makes the proportion true.",
        };
      }
      const g = gcd(a, b) || 1;
      return {
        results: [{ label: "Simplified Ratio", value: `${a / g} : ${b / g}`, emphasis: true }],
        steps: [`GCD(${a}, ${b}) = ${g} → ${a}/${g} : ${b}/${g}`],
        compare: [
          { label: "A", value: a, displayValue: fmtNumber(a) },
          { label: "B", value: b, displayValue: fmtNumber(b) },
        ],
        chartCaption: `${a} and ${b} simplify down to ${a / g}:${b / g} — same proportion, smaller numbers.`,
      };
    },
    relatedSlugs: ["fraction-calculator", "percentage-calculator"],
  },
  {
    slug: "triangle-calculator",
    title: "Triangle Calculator",
    category: "math",
    shortDescription: "Find the angles, area and perimeter of a triangle from its three side lengths.",
    seoDescription: "Calculate a triangle's angles, area and perimeter from the lengths of its three sides using the law of cosines and Heron's formula.",
    formulaSummary: "Heron's formula + law of cosines",
    fields: [
      { name: "a", label: "Side a", type: "number", defaultValue: 5, min: 0 },
      { name: "b", label: "Side b", type: "number", defaultValue: 6, min: 0 },
      { name: "c", label: "Side c", type: "number", defaultValue: 7, min: 0 },
    ],
    calculate: (i) => {
      const a = n(i.a), b = n(i.b), c = n(i.c);
      if (a + b <= c || a + c <= b || b + c <= a || a <= 0 || b <= 0 || c <= 0) {
        return { results: [], error: "These three sides can't form a triangle (each side must be less than the sum of the other two)." };
      }
      const s = (a + b + c) / 2;
      const area = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      const deg = (rad: number) => (rad * 180) / Math.PI;
      const A = deg(Math.acos((b * b + c * c - a * a) / (2 * b * c)));
      const B = deg(Math.acos((a * a + c * c - b * b) / (2 * a * c)));
      const C = 180 - A - B;
      return {
        results: [
          { label: "Area", value: fmtNumber(area, 4), emphasis: true },
          { label: "Perimeter", value: fmtNumber(a + b + c, 4) },
          { label: "Angle A (opp. side a)", value: `${fmtNumber(A, 2)}°` },
          { label: "Angle B (opp. side b)", value: `${fmtNumber(B, 2)}°` },
          { label: "Angle C (opp. side c)", value: `${fmtNumber(C, 2)}°` },
        ],
        formula: "Area = √(s(s−a)(s−b)(s−c)), s = perimeter/2",
        breakdown: [
          { label: "Angle A", value: A, displayValue: `${fmtNumber(A, 2)}°` },
          { label: "Angle B", value: B, displayValue: `${fmtNumber(B, 2)}°` },
          { label: "Angle C", value: C, displayValue: `${fmtNumber(C, 2)}°` },
        ],
        chartCaption: "Every triangle's three angles add up to exactly 180° — this donut shows how that total splits between the three corners.",
      };
    },
    relatedSlugs: ["pythagorean-theorem-calculator", "circle-calculator"],
  },
  {
    slug: "pythagorean-theorem-calculator",
    title: "Pythagorean Theorem Calculator",
    category: "math",
    shortDescription: "Find the hypotenuse or a missing leg of a right triangle.",
    seoDescription: "Calculate the hypotenuse or a missing leg of a right triangle using the Pythagorean theorem, a² + b² = c².",
    formulaSummary: "a² + b² = c²",
    fields: [
      { name: "mode", label: "Find", type: "select", defaultValue: "hyp", options: [
        { value: "hyp", label: "Hypotenuse (c), given legs a & b" },
        { value: "leg", label: "Missing leg, given hypotenuse c & leg a" },
      ] },
      { name: "a", label: "Leg a", type: "number", defaultValue: 3, min: 0 },
      { name: "b", label: "Leg b", type: "number", defaultValue: 4, min: 0, showIf: (i) => i.mode !== "leg" },
      { name: "c", label: "Hypotenuse c", type: "number", defaultValue: 5, min: 0, showIf: (i) => i.mode === "leg" },
    ],
    calculate: (i) => {
      const a = n(i.a);
      if (i.mode === "leg") {
        const c = n(i.c);
        if (c <= a) return { results: [], error: "The hypotenuse must be longer than leg a." };
        const b = Math.sqrt(c * c - a * a);
        return {
          results: [{ label: "Leg b", value: fmtNumber(b, 4), emphasis: true }],
          steps: [`b = √(c² − a²) = √(${c}² − ${a}²) = ${fmtNumber(b, 4)}`],
          breakdown: [
            { label: "a²", value: a * a, displayValue: fmtNumber(a * a, 4) },
            { label: "b²", value: b * b, displayValue: fmtNumber(b * b, 4) },
          ],
          chartCaption: `The classic picture: a square built on side a plus a square built on side b together cover exactly the same area as a square built on the hypotenuse (c² = ${fmtNumber(c * c, 4)}).`,
        };
      }
      const b = n(i.b);
      const c = Math.sqrt(a * a + b * b);
      return {
        results: [{ label: "Hypotenuse c", value: fmtNumber(c, 4), emphasis: true }],
        formula: "c = √(a² + b²)",
        steps: [`c = √(${a}² + ${b}²) = ${fmtNumber(c, 4)}`],
        breakdown: [
          { label: "a²", value: a * a, displayValue: fmtNumber(a * a, 4) },
          { label: "b²", value: b * b, displayValue: fmtNumber(b * b, 4) },
        ],
        chartCaption: `The classic picture: a square built on side a plus a square built on side b together cover exactly the same area as a square built on the hypotenuse (c² = ${fmtNumber(c * c, 4)}).`,
      };
    },
    relatedSlugs: ["triangle-calculator"],
  },
  {
    slug: "circle-calculator",
    title: "Circle Calculator",
    category: "math",
    shortDescription: "Find the radius, diameter, circumference and area of a circle from any one value.",
    seoDescription: "Calculate a circle's radius, diameter, circumference and area from any single known value.",
    formulaSummary: "Area = πr², Circumference = 2πr",
    fields: [
      { name: "knownField", label: "I know the...", type: "select", defaultValue: "radius", options: [
        { value: "radius", label: "Radius" }, { value: "diameter", label: "Diameter" }, { value: "circumference", label: "Circumference" }, { value: "area", label: "Area" },
      ] },
      { name: "value", label: "Value", type: "number", defaultValue: 5, min: 0 },
    ],
    calculate: (i) => {
      const v = n(i.value, 5);
      let r: number;
      switch (i.knownField) {
        case "diameter": r = v / 2; break;
        case "circumference": r = v / (2 * Math.PI); break;
        case "area": r = Math.sqrt(v / Math.PI); break;
        default: r = v;
      }
      return {
        results: [
          { label: "Radius", value: fmtNumber(r, 4), emphasis: true },
          { label: "Diameter", value: fmtNumber(r * 2, 4) },
          { label: "Circumference", value: fmtNumber(2 * Math.PI * r, 4) },
          { label: "Area", value: fmtNumber(Math.PI * r * r, 4) },
        ],
        table: {
          headers: ["Property", "Formula", "Value"],
          rows: [
            ["Radius", "r", fmtNumber(r, 4)],
            ["Diameter", "2r", fmtNumber(r * 2, 4)],
            ["Circumference", "2πr", fmtNumber(2 * Math.PI * r, 4)],
            ["Area", "πr²", fmtNumber(Math.PI * r * r, 4)],
          ],
        },
        chartCaption: "Every circle measurement is derived from the same radius — this table shows exactly which formula produces each one.",
      };
    },
    relatedSlugs: ["area-calculator", "triangle-calculator"],
  },
  {
    slug: "area-calculator",
    title: "Area Calculator",
    category: "math",
    shortDescription: "Calculate the area of rectangles, triangles, circles and trapezoids.",
    seoDescription: "Calculate the area of common shapes: rectangle, triangle, circle, and trapezoid.",
    formulaSummary: "Depends on shape",
    fields: [
      { name: "shape", label: "Shape", type: "select", defaultValue: "rectangle", options: [
        { value: "rectangle", label: "Rectangle" }, { value: "triangle", label: "Triangle (base & height)" }, { value: "circle", label: "Circle" }, { value: "trapezoid", label: "Trapezoid" },
      ] },
      { name: "width", label: "Width / Base", type: "number", defaultValue: 10, min: 0, showIf: (i) => i.shape === "rectangle" || i.shape === "triangle" },
      { name: "height", label: "Height", type: "number", defaultValue: 5, min: 0, showIf: (i) => i.shape === "rectangle" || i.shape === "triangle" },
      { name: "radius", label: "Radius", type: "number", defaultValue: 5, min: 0, showIf: (i) => i.shape === "circle" },
      { name: "base1", label: "Parallel Side 1", type: "number", defaultValue: 8, min: 0, showIf: (i) => i.shape === "trapezoid" },
      { name: "base2", label: "Parallel Side 2", type: "number", defaultValue: 12, min: 0, showIf: (i) => i.shape === "trapezoid" },
      { name: "trapHeight", label: "Height", type: "number", defaultValue: 6, min: 0, showIf: (i) => i.shape === "trapezoid" },
    ],
    calculate: (i) => {
      let area = 0, formula = "";
      let steps: string[] = [];
      switch (i.shape) {
        case "triangle":
          area = 0.5 * n(i.width) * n(i.height);
          formula = "Area = ½ × base × height";
          steps = [`Area = ½ × ${fmtNumber(n(i.width))} × ${fmtNumber(n(i.height))} = ${fmtNumber(area, 4)}`];
          break;
        case "circle":
          area = Math.PI * n(i.radius) ** 2;
          formula = "Area = π × r²";
          steps = [`Area = π × ${fmtNumber(n(i.radius))}² = ${fmtNumber(area, 4)}`];
          break;
        case "trapezoid":
          area = 0.5 * (n(i.base1) + n(i.base2)) * n(i.trapHeight);
          formula = "Area = ½ × (b₁+b₂) × height";
          steps = [`Area = ½ × (${fmtNumber(n(i.base1))} + ${fmtNumber(n(i.base2))}) × ${fmtNumber(n(i.trapHeight))} = ${fmtNumber(area, 4)}`];
          break;
        default:
          area = n(i.width) * n(i.height);
          formula = "Area = width × height";
          steps = [`Area = ${fmtNumber(n(i.width))} × ${fmtNumber(n(i.height))} = ${fmtNumber(area, 4)}`];
      }

      let compare: { label: string; value: number; displayValue: string; highlight?: boolean }[] | undefined;
      let table: { headers: string[]; rows: string[][] } | undefined;
      let chartCaption: string | undefined;
      switch (i.shape) {
        case "triangle":
          compare = [
            { label: "Base", value: n(i.width), displayValue: fmtNumber(n(i.width), 4) },
            { label: "Height", value: n(i.height), displayValue: fmtNumber(n(i.height), 4) },
          ];
          chartCaption = "The triangle's base and height sized up side by side — the area is half of the rectangle they'd form together.";
          break;
        case "circle": {
          const r = n(i.radius);
          table = {
            headers: ["Property", "Formula", "Value"],
            rows: [
              ["Radius", "r", fmtNumber(r, 4)],
              ["Diameter", "2r", fmtNumber(r * 2, 4)],
              ["Circumference", "2πr", fmtNumber(2 * Math.PI * r, 4)],
              ["Area", "πr²", fmtNumber(area, 4)],
            ],
          };
          chartCaption = "Every one of these is derived from the same radius — this table shows exactly which formula produces each measurement.";
          break;
        }
        case "trapezoid":
          compare = [
            { label: "Parallel Side 1", value: n(i.base1), displayValue: fmtNumber(n(i.base1), 4) },
            { label: "Parallel Side 2", value: n(i.base2), displayValue: fmtNumber(n(i.base2), 4) },
            { label: "Height", value: n(i.trapHeight), displayValue: fmtNumber(n(i.trapHeight), 4) },
          ];
          chartCaption = "The trapezoid's two parallel sides and the height between them, sized up together.";
          break;
        default:
          compare = [
            { label: "Width", value: n(i.width), displayValue: fmtNumber(n(i.width), 4) },
            { label: "Height", value: n(i.height), displayValue: fmtNumber(n(i.height), 4) },
          ];
          chartCaption = "The rectangle's width and height sized up side by side — the area is the space they enclose together.";
      }

      return { results: [{ label: "Area", value: fmtNumber(area, 4), emphasis: true }], formula, steps, compare, table, chartCaption };
    },
    relatedSlugs: ["circle-calculator", "volume-calculator"],
  },
  {
    slug: "volume-calculator",
    title: "Volume Calculator",
    category: "math",
    shortDescription: "Calculate the volume of a cube, box, sphere, cylinder or cone.",
    seoDescription: "Calculate the volume of common 3D shapes: cube, rectangular box, sphere, cylinder and cone.",
    formulaSummary: "Depends on shape",
    fields: [
      { name: "shape", label: "Shape", type: "select", defaultValue: "box", options: [
        { value: "cube", label: "Cube" }, { value: "box", label: "Rectangular Box" }, { value: "sphere", label: "Sphere" }, { value: "cylinder", label: "Cylinder" }, { value: "cone", label: "Cone" },
      ] },
      { name: "side", label: "Side Length", type: "number", defaultValue: 4, min: 0, showIf: (i) => i.shape === "cube" },
      { name: "length", label: "Length", type: "number", defaultValue: 6, min: 0, showIf: (i) => i.shape === "box" },
      { name: "width", label: "Width", type: "number", defaultValue: 4, min: 0, showIf: (i) => i.shape === "box" },
      { name: "height", label: "Height", type: "number", defaultValue: 3, min: 0, showIf: (i) => i.shape === "box" || i.shape === "cylinder" || i.shape === "cone" },
      { name: "radius", label: "Radius", type: "number", defaultValue: 3, min: 0, showIf: (i) => i.shape === "sphere" || i.shape === "cylinder" || i.shape === "cone" },
    ],
    calculate: (i) => {
      let volume = 0, formula = "";
      let steps: string[] = [];
      let compare: { label: string; value: number; displayValue: string; highlight?: boolean }[] | undefined;
      let chartCaption: string | undefined;
      switch (i.shape) {
        case "cube":
          volume = n(i.side) ** 3;
          formula = "V = side³";
          steps = [`V = ${fmtNumber(n(i.side))}³ = ${fmtNumber(volume, 4)}`];
          break;
        case "sphere": {
          const r = n(i.radius);
          volume = (4 / 3) * Math.PI * r ** 3;
          formula = "V = (4/3)πr³";
          steps = [`V = (4/3) × π × ${fmtNumber(r)}³ = ${fmtNumber(volume, 4)}`];
          const cylinderVol = Math.PI * r ** 2 * (2 * r);
          compare = [
            { label: "Sphere", value: volume, displayValue: fmtNumber(volume, 4), highlight: true },
            { label: "Tightest-fit Cylinder", value: cylinderVol, displayValue: fmtNumber(cylinderVol, 4) },
          ];
          chartCaption = "Archimedes' famous result: a sphere's volume is always exactly two-thirds of the cylinder that tightly wraps around it (same radius, height = diameter).";
          break;
        }
        case "cylinder":
          volume = Math.PI * n(i.radius) ** 2 * n(i.height);
          formula = "V = πr²h";
          steps = [`V = π × ${fmtNumber(n(i.radius))}² × ${fmtNumber(n(i.height))} = ${fmtNumber(volume, 4)}`];
          break;
        case "cone": {
          const r = n(i.radius), h = n(i.height);
          volume = (1 / 3) * Math.PI * r ** 2 * h;
          formula = "V = (1/3)πr²h";
          steps = [`V = (1/3) × π × ${fmtNumber(r)}² × ${fmtNumber(h)} = ${fmtNumber(volume, 4)}`];
          const cylinderVol = Math.PI * r ** 2 * h;
          compare = [
            { label: "Cone", value: volume, displayValue: fmtNumber(volume, 4), highlight: true },
            { label: "Same Base & Height Cylinder", value: cylinderVol, displayValue: fmtNumber(cylinderVol, 4) },
          ];
          chartCaption = "A cone is always exactly ⅓ the volume of a cylinder that shares its base and height — no matter the size.";
          break;
        }
        default:
          volume = n(i.length) * n(i.width) * n(i.height);
          formula = "V = length × width × height";
          steps = [`V = ${fmtNumber(n(i.length))} × ${fmtNumber(n(i.width))} × ${fmtNumber(n(i.height))} = ${fmtNumber(volume, 4)}`];
      }
      return { results: [{ label: "Volume", value: fmtNumber(volume, 4), emphasis: true }], formula, steps, compare, chartCaption };
    },
    relatedSlugs: ["area-calculator"],
  },
  {
    slug: "probability-calculator",
    title: "Probability Calculator",
    category: "math",
    shortDescription: "Calculate a single event's probability, or the combined probability of two independent events.",
    seoDescription: "Calculate probability from favorable and total outcomes, or the AND/OR probability of two independent events.",
    formulaSummary: "P(A and B) = P(A)×P(B); P(A or B) = P(A)+P(B)−P(A)×P(B)",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "single", options: [
        { value: "single", label: "Single event (favorable / total)" },
        { value: "two", label: "Two independent events A & B" },
      ] },
      { name: "favorable", label: "Favorable Outcomes", type: "number", defaultValue: 1, min: 0, showIf: (i) => i.mode !== "two" },
      { name: "total", label: "Total Outcomes", type: "number", defaultValue: 6, min: 1, showIf: (i) => i.mode !== "two" },
      { name: "probA", label: "P(A) %", type: "number", defaultValue: 50, min: 0, max: 100, showIf: (i) => i.mode === "two" },
      { name: "probB", label: "P(B) %", type: "number", defaultValue: 30, min: 0, max: 100, showIf: (i) => i.mode === "two" },
    ],
    calculate: (i) => {
      if (i.mode === "two") {
        const a = n(i.probA, 50) / 100, b = n(i.probB, 30) / 100;
        const pAnd = a * b, pOr = a + b - a * b;
        return {
          results: [
            { label: "P(A and B)", value: `${fmtNumber(pAnd * 100, 3)}%`, emphasis: true },
            { label: "P(A or B)", value: `${fmtNumber(pOr * 100, 3)}%`, emphasis: true },
          ],
          compare: [
            { label: "P(A)", value: a * 100, displayValue: `${fmtNumber(a * 100, 3)}%` },
            { label: "P(B)", value: b * 100, displayValue: `${fmtNumber(b * 100, 3)}%` },
            { label: "P(A and B)", value: pAnd * 100, displayValue: `${fmtNumber(pAnd * 100, 3)}%` },
            { label: "P(A or B)", value: pOr * 100, displayValue: `${fmtNumber(pOr * 100, 3)}%`, highlight: true },
          ],
          chartCaption: `"And" requires both events, so it's always the smallest bar; "or" only needs one of the two, so it's always at least as big as P(A) and P(B) alone.`,
        };
      }
      const fav = n(i.favorable, 1), total = n(i.total, 6);
      if (total <= 0 || fav < 0 || fav > total) return { results: [], error: "Favorable outcomes must be between 0 and total outcomes." };
      const p = (fav / total) * 100;
      return {
        results: [{ label: "Probability", value: `${fmtNumber(p, 3)}%`, emphasis: true }, { label: "As a Fraction", value: `${fav}/${total}` }],
        gauge: {
          value: p,
          min: 0,
          max: 100,
          valueLabel: `${fmtNumber(p, 1)}%`,
          zones: [
            { label: "Unlikely", to: 25, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "Possible", to: 50, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Likely", to: 75, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Very Likely", to: 100, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
          ],
        },
        chartCaption: `A ${fmtNumber(p, 1)}% chance sits in the "${p < 25 ? "Unlikely" : p < 50 ? "Possible" : p < 75 ? "Likely" : "Very Likely"}" zone.`,
      };
    },
    relatedSlugs: ["permutation-and-combination-calculator"],
  },
  {
    slug: "permutation-and-combination-calculator",
    title: "Permutation & Combination Calculator",
    category: "math",
    shortDescription: "Calculate nPr (permutations) and nCr (combinations).",
    seoDescription: "Calculate the number of permutations (nPr) and combinations (nCr) of r items chosen from a set of n.",
    formulaSummary: "nPr = n!/(n−r)!, nCr = n!/(r!(n−r)!)",
    fields: [
      { name: "nVal", label: "n (set size)", type: "number", defaultValue: 10, min: 0, step: 1 },
      { name: "rVal", label: "r (chosen)", type: "number", defaultValue: 3, min: 0, step: 1 },
    ],
    calculate: (i) => {
      const nv = Math.round(n(i.nVal, 10)), rv = Math.round(n(i.rVal, 3));
      if (rv > nv || nv < 0 || rv < 0) return { results: [], error: "r must be between 0 and n." };
      if (nv > 170) return { results: [], error: "n is too large to compute exactly (max 170)." };
      const nPr = factorial(nv) / factorial(nv - rv);
      const nCr = nPr / factorial(rv);
      return {
        results: [
          { label: `P(${nv},${rv}) — Permutations`, value: fmtNumber(nPr, 0), emphasis: true },
          { label: `C(${nv},${rv}) — Combinations`, value: fmtNumber(nCr, 0), emphasis: true },
        ],
        compare: [
          { label: "nPr — order matters", value: nPr, displayValue: fmtNumber(nPr, 0), highlight: true },
          { label: "nCr — order doesn't matter", value: nCr, displayValue: fmtNumber(nCr, 0) },
        ],
        chartCaption:
          rv > 1
            ? `Every group of ${rv} items can be arranged ${fmtNumber(factorial(rv), 0)} different ways, which is exactly why nPr is ${fmtNumber(factorial(rv), 0)}× bigger than nCr here.`
            : `With r = ${rv}, order doesn't create any extra arrangements, so nPr and nCr come out the same.`,
      };
    },
    relatedSlugs: ["probability-calculator"],
  },
  {
    slug: "z-score-calculator",
    title: "Z-score Calculator",
    category: "math",
    shortDescription: "Calculate a z-score and its percentile in a normal distribution.",
    seoDescription: "Calculate a z-score from a value, mean and standard deviation, plus its percentile rank in a normal distribution.",
    formulaSummary: "z = (x − μ) / σ",
    fields: [
      { name: "x", label: "Value (x)", type: "number", defaultValue: 85 },
      { name: "mean", label: "Mean (μ)", type: "number", defaultValue: 75 },
      { name: "stddev", label: "Standard Deviation (σ)", type: "number", defaultValue: 8, min: 0.0000001 },
    ],
    calculate: (i) => {
      const x = n(i.x), mean = n(i.mean), sd = n(i.stddev, 8);
      if (sd <= 0) return { results: [], error: "Standard deviation must be greater than 0." };
      const z = (x - mean) / sd;
      const percentile = normalCdf(z) * 100;
      return {
        results: [
          { label: "Z-score", value: fmtNumber(z, 4), emphasis: true },
          { label: "Percentile", value: `${fmtNumber(percentile, 2)}%` },
        ],
        formula: "z = (x − μ) / σ",
        steps: [`z = (${x} − ${mean}) / ${sd} = ${fmtNumber(z, 4)}`],
        gauge: {
          value: percentile,
          min: 0,
          max: 100,
          valueLabel: `${fmtNumber(percentile, 1)}%`,
          zones: [
            { label: "Well Below Average", to: 16, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "Below Average", to: 50, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Above Average", to: 84, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Well Above Average", to: 100, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
          ],
        },
        chartCaption: `A value of ${fmtNumber(x)} sits at the ${fmtNumber(percentile, 1)}th percentile — meaning it beats about ${fmtNumber(percentile, 0)}% of a normally distributed population.`,
      };
    },
    relatedSlugs: ["statistics-calculator"],
  },
  {
    slug: "rounding-calculator",
    title: "Rounding Calculator",
    category: "math",
    shortDescription: "Round a number to a chosen number of decimal places.",
    seoDescription: "Round any number to a specified number of decimal places, with rounding up and down shown too.",
    formulaSummary: "Round-half-up to N decimal places",
    fields: [
      { name: "value", label: "Number", type: "number", defaultValue: 3.14159 },
      { name: "decimals", label: "Decimal Places", type: "number", defaultValue: 2, min: 0, max: 10, step: 1 },
    ],
    calculate: (i) => {
      const value = n(i.value), decimals = Math.max(0, Math.round(n(i.decimals, 2)));
      const factor = Math.pow(10, decimals);
      const rounded = round(value, decimals);
      const nextDigit = Math.floor(Math.abs(value) * factor * 10) % 10;
      return {
        results: [
          { label: "Rounded", value: fmtNumber(rounded, decimals), emphasis: true },
          { label: "Rounded Up", value: fmtNumber(Math.ceil(value * factor) / factor, decimals) },
          { label: "Rounded Down", value: fmtNumber(Math.floor(value * factor) / factor, decimals) },
        ],
        steps: [
          `Look at the digit right after decimal place ${decimals}: it's ${nextDigit}.`,
          nextDigit >= 5
            ? `${nextDigit} ≥ 5, so the last kept digit rounds up → ${fmtNumber(rounded, decimals)}`
            : `${nextDigit} < 5, so the last kept digit stays the same → ${fmtNumber(rounded, decimals)}`,
        ],
        compare: [
          { label: "Original Value", value, displayValue: fmtNumber(value, Math.max(decimals, 6)) },
          { label: "Rounded Value", value: rounded, displayValue: fmtNumber(rounded, decimals), highlight: true },
        ],
        chartCaption: `Rounding to ${decimals} decimal place${decimals === 1 ? "" : "s"} moves ${fmtNumber(value, Math.max(decimals, 6))} to ${fmtNumber(rounded, decimals)}.`,
      };
    },
    relatedSlugs: ["scientific-notation-calculator"],
  },
  {
    slug: "base-converter",
    title: "Number Base Converter",
    category: "math",
    shortDescription: "Convert numbers between binary, octal, decimal and hexadecimal.",
    seoDescription: "Convert a number between binary, octal, decimal and hexadecimal bases.",
    formulaSummary: "Positional base conversion",
    fields: [
      { name: "value", label: "Value", type: "text", defaultValue: "255" },
      { name: "fromBase", label: "From Base", type: "select", defaultValue: "10", options: [
        { value: "2", label: "Binary (base 2)" }, { value: "8", label: "Octal (base 8)" }, { value: "10", label: "Decimal (base 10)" }, { value: "16", label: "Hexadecimal (base 16)" },
      ] },
    ],
    calculate: (i) => {
      const from = parseInt(i.fromBase || "10", 10);
      const raw = (i.value || "").trim();
      const parsed = parseInt(raw, from);
      if (!raw || Number.isNaN(parsed)) return { results: [], error: `"${raw}" is not a valid base-${from} number.` };
      const isNegative = raw.startsWith("-");
      const digits = (isNegative ? raw.slice(1) : raw).toUpperCase().split("");
      const validDigits = digits.every((d) => !Number.isNaN(parseInt(d, from)));
      const table =
        !isNegative && validDigits
          ? {
              headers: ["Digit", "Place Value", "Contributes"],
              rows: digits.map((d, idx) => {
                const power = digits.length - 1 - idx;
                const digitValue = parseInt(d, from);
                return [d, `${from}^${power}`, fmtNumber(digitValue * Math.pow(from, power), 0)];
              }),
            }
          : undefined;
      return {
        results: [
          { label: "Binary", value: parsed.toString(2), emphasis: from !== 2 },
          { label: "Octal", value: parsed.toString(8), emphasis: from !== 8 },
          { label: "Decimal", value: parsed.toString(10), emphasis: from !== 10 },
          { label: "Hexadecimal", value: parsed.toString(16).toUpperCase(), emphasis: from !== 16 },
        ],
        table,
        chartCaption: table ? `Each digit is worth its face value times ${from} raised to its position — add those up and you get ${parsed} in decimal.` : undefined,
      };
    },
    relatedSlugs: ["scientific-notation-calculator"],
  },
  {
    slug: "scientific-notation-calculator",
    title: "Scientific Notation Calculator",
    category: "math",
    shortDescription: "Convert a number to and from scientific notation.",
    seoDescription: "Convert a regular number into scientific (exponential) notation, or convert scientific notation back into a decimal number.",
    formulaSummary: "a × 10^b, 1 ≤ |a| < 10",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "toSci", options: [
        { value: "toSci", label: "Number → Scientific Notation" },
        { value: "fromSci", label: "Scientific Notation → Number" },
      ] },
      { name: "value", label: "Number", type: "number", defaultValue: 123400000, showIf: (i) => i.mode !== "fromSci" },
      { name: "coefficient", label: "Coefficient (a)", type: "number", defaultValue: 1.234, showIf: (i) => i.mode === "fromSci" },
      { name: "exponent", label: "Exponent (b)", type: "number", defaultValue: 8, step: 1, showIf: (i) => i.mode === "fromSci" },
    ],
    calculate: (i) => {
      if (i.mode === "fromSci") {
        const coeff = n(i.coefficient, 1), exp = n(i.exponent, 0);
        const result = coeff * Math.pow(10, exp);
        return {
          results: [{ label: "Number", value: fmtNumber(result, 10), emphasis: true }],
          steps: [`${fmtNumber(coeff)} × 10^${fmtNumber(exp, 0)} means shifting the decimal point ${Math.abs(exp)} places ${exp >= 0 ? "right" : "left"} → ${fmtNumber(result, 10)}`],
          table: {
            headers: ["Form", "Value"],
            rows: [
              ["Scientific Form", `${fmtNumber(coeff)} × 10^${fmtNumber(exp, 0)}`],
              ["Standard Form", fmtNumber(result, 10)],
            ],
          },
          chartCaption: "Same value, two representations — the exponent tells you how far the decimal point shifts to get from one to the other.",
        };
      }
      const value = n(i.value, 0);
      if (value === 0) return { results: [{ label: "Scientific Notation", value: "0 × 10^0", emphasis: true }] };
      const exp = Math.floor(Math.log10(Math.abs(value)));
      const coeff = value / Math.pow(10, exp);
      return {
        results: [{ label: "Scientific Notation", value: `${fmtNumber(coeff, 6)} × 10^${exp}`, emphasis: true }],
        steps: [`Move the decimal point until only one nonzero digit remains before it: ${fmtNumber(value)} → ${fmtNumber(coeff, 6)} × 10^${exp} (moved ${Math.abs(exp)} places ${exp >= 0 ? "left" : "right"}).`],
        table: {
          headers: ["Form", "Value"],
          rows: [
            ["Standard Form", fmtNumber(value, 10)],
            ["Scientific Form", `${fmtNumber(coeff, 6)} × 10^${exp}`],
          ],
        },
        chartCaption: "Same value, two representations — the exponent tells you how far the decimal point shifts to get from one to the other.",
      };
    },
    relatedSlugs: ["rounding-calculator"],
  },
];

export default math;
