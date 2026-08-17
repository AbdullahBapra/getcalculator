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
        return { results: [{ label: "Result", value: `${fmtNumber(r)}%`, emphasis: true }], steps: [`${a} ÷ ${b} × 100 = ${fmtNumber(r)}%`] };
      }
      if (i.mode === "change") {
        const r = a !== 0 ? ((b - a) / Math.abs(a)) * 100 : NaN;
        return { results: [{ label: r >= 0 ? "Percent Increase" : "Percent Decrease", value: `${fmtNumber(Math.abs(r))}%`, emphasis: true }], steps: [`(${b} − ${a}) ÷ |${a}| × 100 = ${fmtNumber(r)}%`] };
      }
      const r = (a / 100) * b;
      return { results: [{ label: "Result", value: fmtNumber(r), emphasis: true }], steps: [`${a}% × ${b} = ${fmtNumber(r)}`] };
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
      return {
        results: [
          { label: "Result", value: `${simpN}/${simpD}`, emphasis: true },
          { label: "Decimal", value: fmtNumber(simpN / simpD, 4) },
        ],
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
        return { results: [{ label: "x₁", value: fmtNumber(x1, 4), emphasis: true }, { label: "x₂", value: fmtNumber(x2, 4), emphasis: true }], formula: "x = [−b ± √(b²−4ac)] / 2a", steps: [`Discriminant = ${b}² − 4×${a}×${c} = ${fmtNumber(disc, 4)}`] };
      }
      if (disc === 0) {
        const x = -b / (2 * a);
        return { results: [{ label: "x (double root)", value: fmtNumber(x, 4), emphasis: true }] };
      }
      const real = -b / (2 * a);
      const imag = Math.sqrt(-disc) / (2 * a);
      return {
        results: [
          { label: "x₁", value: `${fmtNumber(real, 4)} + ${fmtNumber(imag, 4)}i`, emphasis: true },
          { label: "x₂", value: `${fmtNumber(real, 4)} − ${fmtNumber(imag, 4)}i`, emphasis: true },
        ],
        notes: ["The discriminant is negative, so the roots are complex (no real solutions)."],
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
      return {
        results: [
          { label: "Greatest Common Factor", value: fmtNumber(g, 0), emphasis: true },
          { label: "Least Common Multiple", value: fmtNumber(l, 0), emphasis: true },
        ],
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
      return {
        results: [
          { label: "Mean", value: fmtNumber(s.mean, 4), emphasis: true },
          { label: "Median", value: fmtNumber(s.median, 4), emphasis: true },
          { label: "Mode", value: s.modes.length ? s.modes.map((m) => fmtNumber(m)).join(", ") : "None", emphasis: true },
          { label: "Range", value: fmtNumber(s.range, 4) },
        ],
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
      return { results: [{ label: "Percent Error", value: `${fmtNumber(err, 3)}%`, emphasis: true }], steps: [`|${exp} − ${theo}| ÷ |${theo}| × 100 = ${fmtNumber(err, 3)}%`] };
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
      return { results: [{ label: "Result", value: fmtNumber(result, 6), emphasis: true }], steps: [`${base}^${exp} = ${fmtNumber(result, 6)}`] };
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
      return { results: [{ label: "Result", value: fmtNumber(result, 6), emphasis: true }], steps: [`${degree}√${value} = ${fmtNumber(result, 6)}`] };
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
        return { results: [{ label: "Missing Value (D)", value: fmtNumber(d, 4), emphasis: true }], steps: [`${a}:${b} = ${c}:D → D = (${b}×${c})/${a} = ${fmtNumber(d, 4)}`] };
      }
      const g = gcd(a, b) || 1;
      return { results: [{ label: "Simplified Ratio", value: `${a / g} : ${b / g}`, emphasis: true }], steps: [`GCD(${a}, ${b}) = ${g} → ${a}/${g} : ${b}/${g}`] };
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
        return { results: [{ label: "Leg b", value: fmtNumber(b, 4), emphasis: true }], steps: [`b = √(c² − a²) = √(${c}² − ${a}²) = ${fmtNumber(b, 4)}`] };
      }
      const b = n(i.b);
      const c = Math.sqrt(a * a + b * b);
      return { results: [{ label: "Hypotenuse c", value: fmtNumber(c, 4), emphasis: true }], formula: "c = √(a² + b²)", steps: [`c = √(${a}² + ${b}²) = ${fmtNumber(c, 4)}`] };
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
      switch (i.shape) {
        case "triangle": area = 0.5 * n(i.width) * n(i.height); formula = "Area = ½ × base × height"; break;
        case "circle": area = Math.PI * n(i.radius) ** 2; formula = "Area = π × r²"; break;
        case "trapezoid": area = 0.5 * (n(i.base1) + n(i.base2)) * n(i.trapHeight); formula = "Area = ½ × (b₁+b₂) × height"; break;
        default: area = n(i.width) * n(i.height); formula = "Area = width × height";
      }
      return { results: [{ label: "Area", value: fmtNumber(area, 4), emphasis: true }], formula };
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
      switch (i.shape) {
        case "cube": volume = n(i.side) ** 3; formula = "V = side³"; break;
        case "sphere": volume = (4 / 3) * Math.PI * n(i.radius) ** 3; formula = "V = (4/3)πr³"; break;
        case "cylinder": volume = Math.PI * n(i.radius) ** 2 * n(i.height); formula = "V = πr²h"; break;
        case "cone": volume = (1 / 3) * Math.PI * n(i.radius) ** 2 * n(i.height); formula = "V = (1/3)πr²h"; break;
        default: volume = n(i.length) * n(i.width) * n(i.height); formula = "V = length × width × height";
      }
      return { results: [{ label: "Volume", value: fmtNumber(volume, 4), emphasis: true }], formula };
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
        return {
          results: [
            { label: "P(A and B)", value: `${fmtNumber(a * b * 100, 3)}%`, emphasis: true },
            { label: "P(A or B)", value: `${fmtNumber((a + b - a * b) * 100, 3)}%`, emphasis: true },
          ],
        };
      }
      const fav = n(i.favorable, 1), total = n(i.total, 6);
      if (total <= 0 || fav < 0 || fav > total) return { results: [], error: "Favorable outcomes must be between 0 and total outcomes." };
      const p = (fav / total) * 100;
      return { results: [{ label: "Probability", value: `${fmtNumber(p, 3)}%`, emphasis: true }, { label: "As a Fraction", value: `${fav}/${total}` }] };
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
      return {
        results: [
          { label: "Rounded", value: fmtNumber(round(value, decimals), decimals), emphasis: true },
          { label: "Rounded Up", value: fmtNumber(Math.ceil(value * factor) / factor, decimals) },
          { label: "Rounded Down", value: fmtNumber(Math.floor(value * factor) / factor, decimals) },
        ],
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
      return {
        results: [
          { label: "Binary", value: parsed.toString(2), emphasis: from !== 2 },
          { label: "Octal", value: parsed.toString(8), emphasis: from !== 8 },
          { label: "Decimal", value: parsed.toString(10), emphasis: from !== 10 },
          { label: "Hexadecimal", value: parsed.toString(16).toUpperCase(), emphasis: from !== 16 },
        ],
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
        const result = n(i.coefficient, 1) * Math.pow(10, n(i.exponent, 0));
        return { results: [{ label: "Number", value: fmtNumber(result, 10), emphasis: true }] };
      }
      const value = n(i.value, 0);
      if (value === 0) return { results: [{ label: "Scientific Notation", value: "0 × 10^0", emphasis: true }] };
      const exp = Math.floor(Math.log10(Math.abs(value)));
      const coeff = value / Math.pow(10, exp);
      return { results: [{ label: "Scientific Notation", value: `${fmtNumber(coeff, 6)} × 10^${exp}`, emphasis: true }] };
    },
    relatedSlugs: ["rounding-calculator"],
  },
];

export default math;
