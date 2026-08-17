import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { parseNumberList, normalCdf } from "./math-helpers";
import { evaluateExpression } from "./expr-evaluator";

const math2: CalculatorDefinition[] = [
  {
    slug: "scientific-calculator",
    title: "Scientific Calculator",
    category: "math",
    shortDescription: "A real button-based scientific calculator with memory, trig, logs and more.",
    seoDescription: "An interactive scientific calculator with memory functions, degree/radian trig, logs, powers, roots and parentheses — plus expression typing.",
    formulaSummary: "Full expression evaluation: + − × ÷ ^ sin cos tan log ln √ x! π e and more",
    widget: "keypad-scientific",
    fields: [
      { name: "expression", label: "Expression", type: "text", defaultValue: "sin(30) + sqrt(16) * 2", help: "Use + - * / ^, parentheses, and sin() cos() tan() sqrt() log() ln() exp() abs(), pi, e" },
      { name: "angleUnit", label: "Angle Unit", type: "select", defaultValue: "degrees", options: [{ value: "degrees", label: "Degrees" }, { value: "radians", label: "Radians" }] },
    ],
    calculate: (i) => {
      try {
        const result = evaluateExpression(i.expression || "0", i.angleUnit !== "radians");
        if (!Number.isFinite(result)) return { results: [], error: "That expression doesn't evaluate to a finite number (check for division by zero)." };
        return { results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }] };
      } catch (e) {
        return { results: [], error: e instanceof Error ? `Couldn't parse that expression: ${e.message}` : "Couldn't parse that expression." };
      }
    },
    relatedSlugs: ["basic-calculator", "exponent-calculator"],
  },
  {
    slug: "basic-calculator",
    title: "Basic Calculator",
    category: "math",
    shortDescription: "A simple calculator for addition, subtraction, multiplication and division.",
    seoDescription: "A simple, no-frills calculator for basic addition, subtraction, multiplication and division.",
    formulaSummary: "A op B",
    fields: [
      { name: "a", label: "A", type: "number", defaultValue: 12 },
      { name: "op", label: "Operation", type: "select", defaultValue: "+", options: [{ value: "+", label: "+" }, { value: "-", label: "−" }, { value: "*", label: "×" }, { value: "/", label: "÷" }] },
      { name: "b", label: "B", type: "number", defaultValue: 8 },
    ],
    calculate: (i) => {
      const a = n(i.a), b = n(i.b);
      if (i.op === "/" && b === 0) return { results: [], error: "Can't divide by zero." };
      const result = i.op === "+" ? a + b : i.op === "-" ? a - b : i.op === "*" ? a * b : a / b;
      return { results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }] };
    },
    relatedSlugs: ["scientific-calculator"],
  },
  {
    slug: "simple-calculator",
    title: "Simple Calculator",
    category: "math",
    shortDescription: "A real button calculator for everyday arithmetic, with memory keys.",
    seoDescription: "An interactive on-screen calculator for everyday addition, subtraction, multiplication and division, with memory (M+, M−, MR, MC) and keyboard support.",
    formulaSummary: "Standard four-function calculator with running memory",
    widget: "keypad-basic",
    fields: [
      { name: "a", label: "A", type: "number", defaultValue: 12 },
      { name: "op", label: "Operation", type: "select", defaultValue: "+", options: [{ value: "+", label: "+" }, { value: "-", label: "−" }, { value: "*", label: "×" }, { value: "/", label: "÷" }] },
      { name: "b", label: "B", type: "number", defaultValue: 8 },
    ],
    calculate: (i) => {
      const a = n(i.a), b = n(i.b);
      if (i.op === "/" && b === 0) return { results: [], error: "Can't divide by zero." };
      const result = i.op === "+" ? a + b : i.op === "-" ? a - b : i.op === "*" ? a * b : a / b;
      return { results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }] };
    },
    relatedSlugs: ["scientific-calculator", "basic-calculator"],
  },
  {
    slug: "number-sequence-calculator",
    title: "Number Sequence Calculator",
    category: "math",
    shortDescription: "Generate an arithmetic or geometric sequence and its sum.",
    seoDescription: "Generate the terms and sum of an arithmetic or geometric number sequence.",
    formulaSummary: "Arithmetic: aₙ = a₁+(n−1)d · Geometric: aₙ = a₁×r^(n−1)",
    fields: [
      { name: "type", label: "Sequence Type", type: "select", defaultValue: "arithmetic", options: [{ value: "arithmetic", label: "Arithmetic" }, { value: "geometric", label: "Geometric" }] },
      { name: "firstTerm", label: "First Term (a₁)", type: "number", defaultValue: 3 },
      { name: "step", label: "Common Difference / Ratio", type: "number", defaultValue: 4 },
      { name: "terms", label: "Number of Terms", type: "number", defaultValue: 10, min: 1, max: 100, step: 1 },
    ],
    calculate: (i) => {
      const a1 = n(i.firstTerm, 3);
      const d = n(i.step, 4);
      const terms = Math.round(n(i.terms, 10));
      const seq: number[] = [];
      let sum = 0;
      if (i.type === "geometric") {
        for (let k = 0; k < terms; k++) { const term = a1 * Math.pow(d, k); seq.push(term); sum += term; }
      } else {
        for (let k = 0; k < terms; k++) { const term = a1 + k * d; seq.push(term); sum += term; }
      }
      return {
        results: [
          { label: `Term ${terms}`, value: fmtNumber(seq[seq.length - 1], 4), emphasis: true },
          { label: "Sum of Terms", value: fmtNumber(sum, 4), emphasis: true },
          { label: "Sequence", value: seq.map((v) => fmtNumber(v, 2)).join(", ") },
        ],
      };
    },
    relatedSlugs: ["statistics-calculator"],
  },
  {
    slug: "half-life-calculator",
    title: "Half-Life Calculator",
    category: "math",
    shortDescription: "Calculate the remaining amount of a substance after radioactive/exponential decay.",
    seoDescription: "Calculate how much of a substance remains after a given time, based on its half-life.",
    formulaSummary: "N(t) = N₀ × 0.5^(t / half-life)",
    fields: [
      { name: "initialAmount", label: "Initial Amount", type: "number", defaultValue: 100, min: 0 },
      { name: "halfLife", label: "Half-Life", type: "number", unit: "time units", defaultValue: 5, min: 0.0001 },
      { name: "elapsed", label: "Elapsed Time", type: "number", unit: "same time units", defaultValue: 12, min: 0 },
    ],
    calculate: (i) => {
      const remaining = n(i.initialAmount, 100) * Math.pow(0.5, n(i.elapsed) / n(i.halfLife, 5));
      return {
        results: [
          { label: "Remaining Amount", value: fmtNumber(remaining, 4), emphasis: true },
          { label: "Percent Remaining", value: `${fmtNumber((remaining / n(i.initialAmount, 100)) * 100, 2)}%` },
        ],
        formula: "N(t) = N₀ × 0.5^(t / half-life)",
      };
    },
    relatedSlugs: ["exponent-calculator"],
  },
  {
    slug: "slope-calculator",
    title: "Slope Calculator",
    category: "math",
    shortDescription: "Calculate the slope and equation of a line through two points.",
    seoDescription: "Calculate the slope, y-intercept and equation of a line through two (x, y) points.",
    formulaSummary: "m = (y₂−y₁) / (x₂−x₁)",
    fields: [
      { name: "x1", label: "x₁", type: "number", defaultValue: 1 },
      { name: "y1", label: "y₁", type: "number", defaultValue: 2 },
      { name: "x2", label: "x₂", type: "number", defaultValue: 4 },
      { name: "y2", label: "y₂", type: "number", defaultValue: 11 },
    ],
    calculate: (i) => {
      const x1 = n(i.x1), y1 = n(i.y1), x2 = n(i.x2, 1), y2 = n(i.y2);
      if (x2 === x1) return { results: [{ label: "Slope", value: "Undefined (vertical line)" }], notes: [`The line is x = ${x1}.`] };
      const m = (y2 - y1) / (x2 - x1);
      const b = y1 - m * x1;
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
      return {
        results: [
          { label: "Slope (m)", value: fmtNumber(m, 4), emphasis: true },
          { label: "Y-Intercept (b)", value: fmtNumber(b, 4) },
          { label: "Line Equation", value: `y = ${fmtNumber(m, 3)}x ${b >= 0 ? "+" : "−"} ${fmtNumber(Math.abs(b), 3)}` },
          { label: "Distance Between Points", value: fmtNumber(dist, 4) },
        ],
      };
    },
    relatedSlugs: ["distance-calculator"],
  },
  {
    slug: "sample-size-calculator",
    title: "Sample Size Calculator",
    category: "math",
    shortDescription: "Calculate the survey sample size needed for a target margin of error.",
    seoDescription: "Calculate the required survey sample size for a given confidence level, margin of error and expected proportion.",
    formulaSummary: "n = z²×p(1−p) / e², adjusted for finite population",
    fields: [
      { name: "confidenceLevel", label: "Confidence Level", type: "select", defaultValue: "95", options: [{ value: "90", label: "90%" }, { value: "95", label: "95%" }, { value: "99", label: "99%" }] },
      { name: "marginOfErrorPercent", label: "Margin of Error", type: "number", unit: "%", defaultValue: 5, min: 0.1, step: 0.1 },
      { name: "proportionPercent", label: "Estimated Proportion", type: "number", unit: "%", defaultValue: 50, min: 1, max: 99 },
      { name: "populationSize", label: "Population Size (optional)", type: "number", defaultValue: 0, min: 0 },
    ],
    calculate: (i) => {
      const zMap: Record<string, number> = { "90": 1.645, "95": 1.96, "99": 2.576 };
      const z = zMap[i.confidenceLevel] ?? 1.96;
      const p = n(i.proportionPercent, 50) / 100;
      const e = n(i.marginOfErrorPercent, 5) / 100;
      const n0 = (z * z * p * (1 - p)) / (e * e);
      const pop = n(i.populationSize);
      const adjusted = pop > 0 ? n0 / (1 + (n0 - 1) / pop) : n0;
      return {
        results: [{ label: "Required Sample Size", value: fmtNumber(Math.ceil(adjusted), 0), emphasis: true }],
      };
    },
    relatedSlugs: ["confidence-interval-calculator"],
  },
  {
    slug: "confidence-interval-calculator",
    title: "Confidence Interval Calculator",
    category: "math",
    shortDescription: "Calculate a confidence interval for a sample mean.",
    seoDescription: "Calculate the confidence interval for a population mean from a sample mean, standard deviation and sample size.",
    formulaSummary: "CI = mean ± z × (σ / √n)",
    fields: [
      { name: "mean", label: "Sample Mean", type: "number", defaultValue: 50 },
      { name: "stdDev", label: "Sample Standard Deviation", type: "number", defaultValue: 8, min: 0 },
      { name: "sampleSize", label: "Sample Size", type: "number", defaultValue: 40, min: 2, step: 1 },
      { name: "confidenceLevel", label: "Confidence Level", type: "select", defaultValue: "95", options: [{ value: "90", label: "90%" }, { value: "95", label: "95%" }, { value: "99", label: "99%" }] },
    ],
    calculate: (i) => {
      const zMap: Record<string, number> = { "90": 1.645, "95": 1.96, "99": 2.576 };
      const z = zMap[i.confidenceLevel] ?? 1.96;
      const margin = z * (n(i.stdDev, 8) / Math.sqrt(n(i.sampleSize, 40)));
      const mean = n(i.mean, 50);
      return {
        results: [
          { label: `${i.confidenceLevel}% Confidence Interval`, value: `${fmtNumber(mean - margin, 3)} to ${fmtNumber(mean + margin, 3)}`, emphasis: true },
          { label: "Margin of Error", value: `± ${fmtNumber(margin, 4)}` },
        ],
      };
    },
    relatedSlugs: ["sample-size-calculator", "z-score-calculator"],
  },
  {
    slug: "distance-calculator",
    title: "Distance Calculator (Coordinates)",
    category: "math",
    shortDescription: "Calculate the straight-line distance between two points.",
    seoDescription: "Calculate the Euclidean distance between two points in 2D or 3D coordinate space.",
    formulaSummary: "d = √[(x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²]",
    fields: [
      { name: "x1", label: "x₁", type: "number", defaultValue: 0 },
      { name: "y1", label: "y₁", type: "number", defaultValue: 0 },
      { name: "z1", label: "z₁ (optional)", type: "number", defaultValue: 0 },
      { name: "x2", label: "x₂", type: "number", defaultValue: 3 },
      { name: "y2", label: "y₂", type: "number", defaultValue: 4 },
      { name: "z2", label: "z₂ (optional)", type: "number", defaultValue: 0 },
    ],
    calculate: (i) => {
      const d = Math.sqrt((n(i.x2, 3) - n(i.x1)) ** 2 + (n(i.y2, 4) - n(i.y1)) ** 2 + (n(i.z2) - n(i.z1)) ** 2);
      return { results: [{ label: "Distance", value: fmtNumber(d, 4), emphasis: true }], formula: "d = √[(x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²]" };
    },
    relatedSlugs: ["slope-calculator"],
  },
  {
    slug: "surface-area-calculator",
    title: "Surface Area Calculator",
    category: "math",
    shortDescription: "Calculate the surface area of a cube, box, sphere, cylinder or cone.",
    seoDescription: "Calculate the total surface area of common 3D shapes: cube, rectangular box, sphere, cylinder and cone.",
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
      let area = 0, formula = "";
      switch (i.shape) {
        case "cube": area = 6 * n(i.side) ** 2; formula = "SA = 6 × side²"; break;
        case "sphere": area = 4 * Math.PI * n(i.radius) ** 2; formula = "SA = 4πr²"; break;
        case "cylinder": area = 2 * Math.PI * n(i.radius) * (n(i.radius) + n(i.height)); formula = "SA = 2πr(r+h)"; break;
        case "cone": {
          const slant = Math.sqrt(n(i.radius) ** 2 + n(i.height) ** 2);
          area = Math.PI * n(i.radius) * (n(i.radius) + slant);
          formula = "SA = πr(r + slant height)";
          break;
        }
        default: area = 2 * (n(i.length) * n(i.width) + n(i.length) * n(i.height) + n(i.width) * n(i.height)); formula = "SA = 2(lw + lh + wh)";
      }
      return { results: [{ label: "Surface Area", value: fmtNumber(area, 4), emphasis: true }], formula };
    },
    relatedSlugs: ["volume-calculator", "area-calculator"],
  },
  {
    slug: "right-triangle-calculator",
    title: "Right Triangle Calculator",
    category: "math",
    shortDescription: "Solve a right triangle's sides and angles from two known values.",
    seoDescription: "Solve for all sides and angles of a right triangle given two legs, a leg and the hypotenuse, or a leg and an angle.",
    formulaSummary: "Pythagorean theorem + trigonometric ratios",
    fields: [
      { name: "mode", label: "Known Values", type: "select", defaultValue: "twoLegs", options: [
        { value: "twoLegs", label: "Two legs (a, b)" },
        { value: "hypLeg", label: "Hypotenuse and one leg (c, a)" },
        { value: "legAngle", label: "One leg and one angle (a, A)" },
      ] },
      { name: "a", label: "Leg a", type: "number", defaultValue: 6, min: 0 },
      { name: "b", label: "Leg b", type: "number", defaultValue: 8, min: 0, showIf: (i) => i.mode === "twoLegs" },
      { name: "c", label: "Hypotenuse c", type: "number", defaultValue: 10, min: 0, showIf: (i) => i.mode === "hypLeg" },
      { name: "angleA", label: "Angle A (degrees)", type: "number", defaultValue: 30, min: 0.01, max: 89.99, showIf: (i) => i.mode === "legAngle" },
    ],
    calculate: (i) => {
      const a = n(i.a, 6);
      let b: number, c: number;
      if (i.mode === "hypLeg") {
        c = n(i.c, 10);
        if (c <= a) return { results: [], error: "Hypotenuse must be longer than leg a." };
        b = Math.sqrt(c * c - a * a);
      } else if (i.mode === "legAngle") {
        const rad = (n(i.angleA, 30) * Math.PI) / 180;
        b = a / Math.tan(rad);
        c = a / Math.sin(rad);
      } else {
        b = n(i.b, 8);
        c = Math.sqrt(a * a + b * b);
      }
      const angleA = (Math.asin(a / c) * 180) / Math.PI;
      const angleB = 90 - angleA;
      const area = 0.5 * a * b;
      return {
        results: [
          { label: "Leg a", value: fmtNumber(a, 4) },
          { label: "Leg b", value: fmtNumber(b, 4) },
          { label: "Hypotenuse c", value: fmtNumber(c, 4), emphasis: true },
          { label: "Angle A", value: `${fmtNumber(angleA, 2)}°` },
          { label: "Angle B", value: `${fmtNumber(angleB, 2)}°` },
          { label: "Area", value: fmtNumber(area, 4) },
        ],
      };
    },
    relatedSlugs: ["pythagorean-theorem-calculator", "triangle-calculator"],
  },
  {
    slug: "factor-calculator",
    title: "Factor Calculator",
    category: "math",
    shortDescription: "List all the factors (divisors) of a whole number.",
    seoDescription: "Find every factor (divisor) of a positive whole number.",
    formulaSummary: "All d where number mod d = 0",
    fields: [{ name: "value", label: "Number", type: "number", defaultValue: 60, min: 1, step: 1 }],
    calculate: (i) => {
      const value = Math.round(n(i.value, 60));
      if (value < 1) return { results: [], error: "Enter a positive whole number." };
      const factors: number[] = [];
      for (let d = 1; d * d <= value; d++) {
        if (value % d === 0) {
          factors.push(d);
          if (d !== value / d) factors.push(value / d);
        }
      }
      factors.sort((a, b) => a - b);
      return {
        results: [
          { label: "Factors", value: factors.join(", "), emphasis: true },
          { label: "Count", value: fmtNumber(factors.length, 0) },
        ],
      };
    },
    relatedSlugs: ["prime-factorization-calculator", "gcf-lcm-calculator"],
  },
  {
    slug: "prime-factorization-calculator",
    title: "Prime Factorization Calculator",
    category: "math",
    shortDescription: "Break a number down into its prime factors.",
    seoDescription: "Find the prime factorization of a whole number, shown with exponents.",
    formulaSummary: "n = p₁^e₁ × p₂^e₂ × ...",
    fields: [{ name: "value", label: "Number", type: "number", defaultValue: 360, min: 2, step: 1 }],
    calculate: (i) => {
      let value = Math.round(n(i.value, 360));
      if (value < 2) return { results: [], error: "Enter a whole number 2 or greater." };
      const factors: Record<number, number> = {};
      let divisor = 2;
      while (divisor * divisor <= value) {
        while (value % divisor === 0) {
          factors[divisor] = (factors[divisor] ?? 0) + 1;
          value /= divisor;
        }
        divisor++;
      }
      if (value > 1) factors[value] = (factors[value] ?? 0) + 1;
      const parts = Object.entries(factors).map(([p, e]) => (e > 1 ? `${p}^${e}` : p));
      return { results: [{ label: "Prime Factorization", value: parts.join(" × "), emphasis: true }] };
    },
    relatedSlugs: ["factor-calculator", "gcf-lcm-calculator"],
  },
  {
    slug: "common-factor-calculator",
    title: "Common Factor Calculator",
    category: "math",
    shortDescription: "List every factor shared by two or more numbers.",
    seoDescription: "Find every common factor shared by two or more whole numbers, and their greatest common factor.",
    formulaSummary: "Intersection of each number's factor set",
    fields: [{ name: "numbers", label: "Numbers (comma separated)", type: "text", defaultValue: "36, 60, 84" }],
    calculate: (i) => {
      const nums = parseNumberList(i.numbers).map((v) => Math.round(Math.abs(v))).filter((v) => v > 0);
      if (nums.length < 2) return { results: [], error: "Enter at least two positive whole numbers." };
      const factorsOf = (v: number) => {
        const f: number[] = [];
        for (let d = 1; d <= v; d++) if (v % d === 0) f.push(d);
        return f;
      };
      let common = factorsOf(nums[0]);
      for (const num of nums.slice(1)) {
        const fs = new Set(factorsOf(num));
        common = common.filter((f) => fs.has(f));
      }
      return {
        results: [
          { label: "Common Factors", value: common.join(", "), emphasis: true },
          { label: "Greatest Common Factor", value: fmtNumber(Math.max(...common), 0) },
        ],
      };
    },
    relatedSlugs: ["gcf-lcm-calculator", "factor-calculator"],
  },
  {
    slug: "matrix-calculator",
    title: "Matrix Calculator (2×2)",
    category: "math",
    shortDescription: "Add, subtract, multiply, or find the determinant/inverse of 2×2 matrices.",
    seoDescription: "Perform addition, subtraction, multiplication, determinant and inverse operations on 2×2 matrices.",
    formulaSummary: "Standard 2×2 matrix operations",
    fields: [
      { name: "operation", label: "Operation", type: "select", defaultValue: "multiply", options: [
        { value: "add", label: "A + B" }, { value: "subtract", label: "A − B" }, { value: "multiply", label: "A × B" }, { value: "detA", label: "Determinant of A" }, { value: "inverseA", label: "Inverse of A" },
      ] },
      { name: "a11", label: "A[1,1]", type: "number", defaultValue: 1 },
      { name: "a12", label: "A[1,2]", type: "number", defaultValue: 2 },
      { name: "a21", label: "A[2,1]", type: "number", defaultValue: 3 },
      { name: "a22", label: "A[2,2]", type: "number", defaultValue: 4 },
      { name: "b11", label: "B[1,1]", type: "number", defaultValue: 5, showIf: (i) => i.operation === "add" || i.operation === "subtract" || i.operation === "multiply" },
      { name: "b12", label: "B[1,2]", type: "number", defaultValue: 6, showIf: (i) => i.operation === "add" || i.operation === "subtract" || i.operation === "multiply" },
      { name: "b21", label: "B[2,1]", type: "number", defaultValue: 7, showIf: (i) => i.operation === "add" || i.operation === "subtract" || i.operation === "multiply" },
      { name: "b22", label: "B[2,2]", type: "number", defaultValue: 8, showIf: (i) => i.operation === "add" || i.operation === "subtract" || i.operation === "multiply" },
    ],
    calculate: (i) => {
      const A = [[n(i.a11, 1), n(i.a12, 2)], [n(i.a21, 3), n(i.a22, 4)]];
      const B = [[n(i.b11, 5), n(i.b12, 6)], [n(i.b21, 7), n(i.b22, 8)]];
      const fmt2x2 = (m: number[][]) => `[${fmtNumber(m[0][0])}, ${fmtNumber(m[0][1])}; ${fmtNumber(m[1][0])}, ${fmtNumber(m[1][1])}]`;
      const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
      if (i.operation === "detA") return { results: [{ label: "det(A)", value: fmtNumber(det, 4), emphasis: true }] };
      if (i.operation === "inverseA") {
        if (det === 0) return { results: [], error: "Matrix A is singular (determinant is 0) — it has no inverse." };
        const inv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
        return { results: [{ label: "A⁻¹", value: fmt2x2(inv), emphasis: true }] };
      }
      let R: number[][];
      if (i.operation === "add") R = [[A[0][0] + B[0][0], A[0][1] + B[0][1]], [A[1][0] + B[1][0], A[1][1] + B[1][1]]];
      else if (i.operation === "subtract") R = [[A[0][0] - B[0][0], A[0][1] - B[0][1]], [A[1][0] - B[1][0], A[1][1] - B[1][1]]];
      else
        R = [
          [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
          [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
        ];
      return { results: [{ label: "Result", value: fmt2x2(R), emphasis: true }] };
    },
    relatedSlugs: [],
  },
  {
    slug: "big-number-calculator",
    title: "Big Number Calculator",
    category: "math",
    shortDescription: "Add, subtract or multiply integers of unlimited size, exactly.",
    seoDescription: "Perform exact addition, subtraction and multiplication on arbitrarily large whole numbers.",
    formulaSummary: "Arbitrary-precision integer arithmetic",
    fields: [
      { name: "a", label: "Number A", type: "text", defaultValue: "123456789123456789123456789" },
      { name: "op", label: "Operation", type: "select", defaultValue: "*", options: [{ value: "+", label: "+" }, { value: "-", label: "−" }, { value: "*", label: "×" }] },
      { name: "b", label: "Number B", type: "text", defaultValue: "987654321987654321" },
    ],
    calculate: (i) => {
      try {
        const a = BigInt((i.a || "0").trim());
        const b = BigInt((i.b || "0").trim());
        const result = i.op === "+" ? a + b : i.op === "-" ? a - b : a * b;
        return { results: [{ label: "Result", value: result.toString(), emphasis: true }] };
      } catch {
        return { results: [], error: "Enter valid whole numbers (integers only, no decimals)." };
      }
    },
    relatedSlugs: ["scientific-notation-calculator"],
  },
  {
    slug: "long-division-calculator",
    title: "Long Division Calculator",
    category: "math",
    shortDescription: "Divide two numbers and see the quotient and remainder.",
    seoDescription: "Calculate the quotient and remainder of long division between two whole numbers, plus the decimal result.",
    formulaSummary: "Dividend = Divisor × Quotient + Remainder",
    fields: [
      { name: "dividend", label: "Dividend", type: "number", defaultValue: 187, step: 1 },
      { name: "divisor", label: "Divisor", type: "number", defaultValue: 12, step: 1 },
    ],
    calculate: (i) => {
      const dividend = Math.round(n(i.dividend, 187));
      const divisor = Math.round(n(i.divisor, 12));
      if (divisor === 0) return { results: [], error: "Divisor can't be zero." };
      const quotient = Math.trunc(dividend / divisor);
      const remainder = dividend - quotient * divisor;
      return {
        results: [
          { label: "Quotient", value: fmtNumber(quotient, 0), emphasis: true },
          { label: "Remainder", value: fmtNumber(remainder, 0) },
          { label: "Decimal Result", value: fmtNumber(dividend / divisor, 6) },
        ],
        steps: [`${dividend} = ${divisor} × ${quotient} + ${remainder}`],
      };
    },
    relatedSlugs: ["fraction-calculator"],
  },
  {
    slug: "p-value-calculator",
    title: "P-Value Calculator",
    category: "math",
    shortDescription: "Calculate the one-tailed and two-tailed p-value for a z-score.",
    seoDescription: "Calculate the one-tailed and two-tailed p-value corresponding to a z-score from the standard normal distribution.",
    formulaSummary: "p = 1 − Φ(|z|) one-tailed; ×2 for two-tailed",
    fields: [{ name: "zScore", label: "Z-Score", type: "number", defaultValue: 1.96, step: 0.01 }],
    calculate: (i) => {
      const z = n(i.zScore, 1.96);
      const oneTailed = 1 - normalCdf(Math.abs(z));
      const twoTailed = Math.min(1, oneTailed * 2);
      return {
        results: [
          { label: "One-Tailed P-Value", value: fmtNumber(oneTailed, 5), emphasis: true },
          { label: "Two-Tailed P-Value", value: fmtNumber(twoTailed, 5), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["z-score-calculator", "confidence-interval-calculator"],
  },
];

export default math2;
