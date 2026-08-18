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
        const isDegrees = i.angleUnit !== "radians";
        const result = evaluateExpression(i.expression || "0", isDegrees);
        if (!Number.isFinite(result)) return { results: [], error: "That expression doesn't evaluate to a finite number (check for division by zero)." };
        // Same expression, evaluated under the OTHER angle mode too — a genuine,
        // honest "this vs. that" comparison of how much the degrees/radians toggle
        // actually changes this particular expression (nothing if it has no trig).
        let altResult: number | null = null;
        try {
          const alt = evaluateExpression(i.expression || "0", !isDegrees);
          if (Number.isFinite(alt)) altResult = alt;
        } catch {
          altResult = null;
        }
        const degResult = isDegrees ? result : altResult;
        const radResult = isDegrees ? altResult : result;
        return {
          results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }],
          steps: [
            `Expression: ${i.expression || "0"}`,
            `Angle mode: ${i.angleUnit === "radians" ? "radians" : "degrees"} (affects sin, cos, tan)`,
            `Evaluated left to right respecting parentheses and operator precedence → ${fmtNumber(result, 8)}`,
          ],
          ...(degResult !== null && radResult !== null
            ? {
                compare: [
                  { label: "Degrees Mode", value: degResult, displayValue: fmtNumber(degResult, 8), highlight: isDegrees },
                  { label: "Radians Mode", value: radResult, displayValue: fmtNumber(radResult, 8), highlight: !isDegrees },
                ],
                chartCaption:
                  Math.abs(degResult - radResult) < 1e-9
                    ? "This expression has no angle function (sin, cos, tan…), so the degrees/radians setting makes no difference here — both bars land on the same value."
                    : `Your angle mode (${isDegrees ? "degrees" : "radians"}) is highlighted — switching it would change this same expression's result from ${fmtNumber(result, 8)} to ${fmtNumber(altResult as number, 8)}.`,
              }
            : {}),
        };
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
      const symbol = i.op === "+" ? "+" : i.op === "-" ? "−" : i.op === "*" ? "×" : "÷";
      return {
        results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }],
        steps: [`${fmtNumber(a, 8)} ${symbol} ${fmtNumber(b, 8)} = ${fmtNumber(result, 8)}`],
        compare: [
          { label: "A", value: a, displayValue: fmtNumber(a, 8) },
          { label: "B", value: b, displayValue: fmtNumber(b, 8) },
          { label: `Result (A ${symbol} B)`, value: result, displayValue: fmtNumber(result, 8), highlight: true },
        ],
        chartCaption: `A ${symbol} B = ${fmtNumber(result, 8)} — see how the result sizes up against the two numbers you started with.`,
      };
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
      const symbol = i.op === "+" ? "+" : i.op === "-" ? "−" : i.op === "*" ? "×" : "÷";
      return {
        results: [{ label: "Result", value: fmtNumber(result, 8), emphasis: true }],
        steps: [`${fmtNumber(a, 8)} ${symbol} ${fmtNumber(b, 8)} = ${fmtNumber(result, 8)}`],
        compare: [
          { label: "A", value: a, displayValue: fmtNumber(a, 8) },
          { label: "B", value: b, displayValue: fmtNumber(b, 8) },
          { label: `Result (A ${symbol} B)`, value: result, displayValue: fmtNumber(result, 8), highlight: true },
        ],
        chartCaption: `A ${symbol} B = ${fmtNumber(result, 8)} — see how the result sizes up against the two numbers you started with.`,
      };
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
      const shownCount = Math.min(seq.length, 15);
      return {
        results: [
          { label: `Term ${terms}`, value: fmtNumber(seq[seq.length - 1], 4), emphasis: true },
          { label: "Sum of Terms", value: fmtNumber(sum, 4), emphasis: true },
          { label: "Sequence", value: seq.map((v) => fmtNumber(v, 2)).join(", ") },
        ],
        growthSeries: seq.slice(0, shownCount).map((v, idx) => ({ label: `#${idx + 1}`, value: v, displayValue: fmtNumber(v, 2) })),
        chartCaption:
          i.type === "geometric"
            ? `Each term multiplies the one before it by ${fmtNumber(d, 3)}${seq.length > shownCount ? ` — showing the first ${shownCount} of ${seq.length} terms` : ""}, which is why the bars ${Math.abs(d) > 1 ? "shoot up" : "shrink down"} so fast.`
            : `Each term adds ${fmtNumber(d, 3)} to the one before it${seq.length > shownCount ? ` — showing the first ${shownCount} of ${seq.length} terms` : ""}, so the bars climb at a steady, constant rate.`,
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
      const initial = n(i.initialAmount, 100);
      const halfLife = n(i.halfLife, 5);
      const elapsed = n(i.elapsed);
      const remaining = initial * Math.pow(0.5, elapsed / halfLife);
      const pointCount = 7;
      const growthSeries =
        elapsed > 0
          ? Array.from({ length: pointCount + 1 }, (_, k) => {
              const t = (k / pointCount) * elapsed;
              const amt = initial * Math.pow(0.5, t / halfLife);
              return { label: k === 0 ? "Start" : `t=${fmtNumber(t, 1)}`, value: amt, displayValue: fmtNumber(amt, 2) };
            })
          : undefined;
      return {
        results: [
          { label: "Remaining Amount", value: fmtNumber(remaining, 4), emphasis: true },
          { label: "Percent Remaining", value: `${fmtNumber((remaining / initial) * 100, 2)}%` },
        ],
        formula: "N(t) = N₀ × 0.5^(t / half-life)",
        ...(growthSeries ? { growthSeries } : {}),
        ...(growthSeries
          ? {
              chartCaption: `The amount halves every ${fmtNumber(halfLife, 2)} time units — over ${fmtNumber(elapsed, 2)} units it decays from ${fmtNumber(initial, 2)} down to ${fmtNumber(remaining, 4)} (${fmtNumber((remaining / initial) * 100, 1)}% left).`,
            }
          : {}),
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
      if (x2 === x1)
        return {
          results: [{ label: "Slope", value: "Undefined (vertical line)" }],
          notes: [`The line is x = ${x1}. A vertical line has no defined slope because Δx = 0, and division by zero is undefined.`],
        };
      const dy = y2 - y1;
      const dx = x2 - x1;
      const m = dy / dx;
      const b = y1 - m * x1;
      const dist = Math.sqrt(dx ** 2 + dy ** 2);
      return {
        results: [
          { label: "Slope (m)", value: fmtNumber(m, 4), emphasis: true },
          { label: "Y-Intercept (b)", value: fmtNumber(b, 4) },
          { label: "Line Equation", value: `y = ${fmtNumber(m, 3)}x ${b >= 0 ? "+" : "−"} ${fmtNumber(Math.abs(b), 3)}` },
          { label: "Distance Between Points", value: fmtNumber(dist, 4) },
        ],
        steps: [
          `Rise: Δy = y₂ − y₁ = ${fmtNumber(y2)} − ${fmtNumber(y1)} = ${fmtNumber(dy)}`,
          `Run: Δx = x₂ − x₁ = ${fmtNumber(x2)} − ${fmtNumber(x1)} = ${fmtNumber(dx)}`,
          `Slope: m = rise / run = ${fmtNumber(dy)} / ${fmtNumber(dx)} = ${fmtNumber(m, 4)}`,
          `Intercept: b = y₁ − m×x₁ = ${fmtNumber(y1)} − (${fmtNumber(m, 4)})(${fmtNumber(x1)}) = ${fmtNumber(b, 4)}`,
        ],
        notes: [`For every ${fmtNumber(Math.abs(dx), 2)} units you move right, the line moves ${fmtNumber(Math.abs(dy), 2)} units ${dy >= 0 ? "up" : "down"} — that's literally what "rise over run" means.`],
        compare: [
          { label: "Rise (Δy)", value: Math.abs(dy), displayValue: fmtNumber(dy, 4) },
          { label: "Run (Δx)", value: Math.abs(dx), displayValue: fmtNumber(dx, 4) },
        ],
        chartCaption: `Slope is rise over run — here the line rises ${fmtNumber(Math.abs(dy), 2)} for every ${fmtNumber(Math.abs(dx), 2)} it runs, so the ${Math.abs(dy) > Math.abs(dx) ? "rise" : "run"} bar is the bigger of the two.`,
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
      const marginPercent = n(i.marginOfErrorPercent, 5);
      const gaugeMax = Math.max(20, marginPercent * 1.2);
      return {
        results: [{ label: "Required Sample Size", value: fmtNumber(Math.ceil(adjusted), 0), emphasis: true }],
        steps: [
          `Z-score for ${i.confidenceLevel}% confidence = ${fmtNumber(z, 3)}`,
          `n₀ = z²×p(1−p) / e² = ${fmtNumber(z, 3)}² × ${fmtNumber(p, 3)} × ${fmtNumber(1 - p, 3)} / ${fmtNumber(e, 4)}² = ${fmtNumber(n0, 1)}`,
          pop > 0
            ? `Finite population correction for a population of ${fmtNumber(pop, 0)}: n = n₀ / (1 + (n₀−1)/N) = ${fmtNumber(adjusted, 1)}`
            : `No population size entered, so no finite-population correction is applied.`,
          `Round up to a whole respondent count: ${Math.ceil(adjusted)}`,
        ],
        notes: ["Tightening the margin of error or raising the confidence level both push the required sample size up — that's the core tradeoff behind every survey design."],
        gauge: {
          value: marginPercent,
          min: 0,
          max: gaugeMax,
          valueLabel: `±${fmtNumber(marginPercent, 1)}%`,
          zones: [
            { label: "Very Precise", to: 2, barClass: "bg-teal-600 dark:bg-teal-400", textClass: "text-teal-700 dark:text-teal-400" },
            { label: "Precise", to: 5, barClass: "bg-teal-400 dark:bg-teal-500", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Loose", to: 10, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Very Loose", to: gaugeMax, barClass: "bg-rose-400 dark:bg-rose-500", textClass: "text-rose-600 dark:text-rose-400" },
          ],
        },
        chartCaption: `A ±${fmtNumber(marginPercent, 1)}% margin of error is where your survey's precision lands — the tighter that margin, the larger the sample size it takes to earn it (that's why ${fmtNumber(Math.ceil(adjusted), 0)} respondents are needed here).`,
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
      const lower = mean - margin;
      const upper = mean + margin;
      const span = Math.max(margin * 3, 0.0001);
      return {
        results: [
          { label: `${i.confidenceLevel}% Confidence Interval`, value: `${fmtNumber(lower, 3)} to ${fmtNumber(upper, 3)}`, emphasis: true },
          { label: "Margin of Error", value: `± ${fmtNumber(margin, 4)}` },
        ],
        gauge: {
          value: mean,
          min: mean - span,
          max: mean + span,
          valueLabel: fmtNumber(mean, 2),
          zones: [
            { label: "Below CI", to: lower, barClass: "bg-zinc-300 dark:bg-zinc-600", textClass: "text-zinc-500 dark:text-zinc-400" },
            { label: `${i.confidenceLevel}% CI`, to: upper, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Above CI", to: mean + span, barClass: "bg-zinc-300 dark:bg-zinc-600", textClass: "text-zinc-500 dark:text-zinc-400" },
          ],
        },
        chartCaption: `You can be ${i.confidenceLevel}% confident the true population mean lies between ${fmtNumber(lower, 3)} and ${fmtNumber(upper, 3)} — the teal band is that interval, sized against a wider scale so you can see how wide (or narrow) it really is.`,
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
      const dx = n(i.x2, 3) - n(i.x1);
      const dy = n(i.y2, 4) - n(i.y1);
      const dz = n(i.z2) - n(i.z1);
      const sumSquares = dx * dx + dy * dy + dz * dz;
      const d = Math.sqrt(sumSquares);
      const breakdown = [
        { label: "X Contribution (Δx²)", value: dx * dx, displayValue: fmtNumber(dx * dx, 4) },
        { label: "Y Contribution (Δy²)", value: dy * dy, displayValue: fmtNumber(dy * dy, 4) },
      ];
      if (dz !== 0) breakdown.push({ label: "Z Contribution (Δz²)", value: dz * dz, displayValue: fmtNumber(dz * dz, 4) });
      return {
        results: [{ label: "Distance", value: fmtNumber(d, 4), emphasis: true }],
        formula: "d = √[(x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²]",
        steps: [
          `Δx = ${fmtNumber(n(i.x2, 3))} − ${fmtNumber(n(i.x1))} = ${fmtNumber(dx)}`,
          `Δy = ${fmtNumber(n(i.y2, 4))} − ${fmtNumber(n(i.y1))} = ${fmtNumber(dy)}`,
          ...(dz !== 0 ? [`Δz = ${fmtNumber(n(i.z2))} − ${fmtNumber(n(i.z1))} = ${fmtNumber(dz)}`] : []),
          `d = √(Δx² + Δy²${dz !== 0 ? " + Δz²" : ""}) = √${fmtNumber(sumSquares, 4)} = ${fmtNumber(d, 4)}`,
        ],
        breakdown,
        chartCaption: `Squared, the ${dz !== 0 ? "x, y and z" : "x and y"} differences add up to ${fmtNumber(sumSquares, 4)} — the square root of that total is the straight-line distance, ${fmtNumber(d, 4)}.`,
      };
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
      let steps: string[] | undefined;
      let breakdown: { label: string; value: number; displayValue: string }[] | undefined;
      let chartCaption: string | undefined;
      switch (i.shape) {
        case "cube": {
          const side = n(i.side);
          area = 6 * side ** 2;
          formula = "SA = 6 × side²";
          steps = [`One face = side² = ${fmtNumber(side, 4)}² = ${fmtNumber(side ** 2, 4)}`, `A cube has 6 identical faces: 6 × ${fmtNumber(side ** 2, 4)} = ${fmtNumber(area, 4)}`];
          break;
        }
        case "sphere": {
          const r = n(i.radius);
          area = 4 * Math.PI * r ** 2;
          formula = "SA = 4πr²";
          steps = [`SA = 4 × π × ${fmtNumber(r, 4)}² = ${fmtNumber(area, 4)}`];
          break;
        }
        case "cylinder": {
          const r = n(i.radius), h = n(i.height);
          const ends = 2 * Math.PI * r * r;
          const side = 2 * Math.PI * r * h;
          area = ends + side;
          formula = "SA = 2πr(r+h)";
          breakdown = [
            { label: "Two Circular Ends", value: ends, displayValue: fmtNumber(ends, 4) },
            { label: "Curved Side", value: side, displayValue: fmtNumber(side, 4) },
          ];
          chartCaption = `The curved side makes up ${fmtNumber((side / area) * 100, 0)}% of the total surface — the two flat circular ends account for the rest.`;
          break;
        }
        case "cone": {
          const r = n(i.radius), h = n(i.height);
          const slant = Math.sqrt(r ** 2 + h ** 2);
          const base = Math.PI * r * r;
          const lateral = Math.PI * r * slant;
          area = base + lateral;
          formula = "SA = πr(r + slant height)";
          breakdown = [
            { label: "Base (circle)", value: base, displayValue: fmtNumber(base, 4) },
            { label: "Curved Side (lateral)", value: lateral, displayValue: fmtNumber(lateral, 4) },
          ];
          chartCaption = `The slanted (lateral) side accounts for ${fmtNumber((lateral / area) * 100, 0)}% of the cone's surface, with the circular base making up the rest.`;
          break;
        }
        default: {
          const l = n(i.length), w = n(i.width), h = n(i.height);
          const top = 2 * l * w, front = 2 * l * h, side = 2 * w * h;
          area = top + front + side;
          formula = "SA = 2(lw + lh + wh)";
          breakdown = [
            { label: "Top & Bottom", value: top, displayValue: fmtNumber(top, 4) },
            { label: "Front & Back", value: front, displayValue: fmtNumber(front, 4) },
            { label: "Left & Right", value: side, displayValue: fmtNumber(side, 4) },
          ];
          chartCaption = `A box's surface splits into three pairs of matching faces — the largest pair here contributes ${fmtNumber((Math.max(top, front, side) / area) * 100, 0)}% of the total area.`;
        }
      }
      return {
        results: [{ label: "Surface Area", value: fmtNumber(area, 4), emphasis: true }],
        formula,
        ...(steps ? { steps } : {}),
        ...(breakdown ? { breakdown } : {}),
        ...(chartCaption ? { chartCaption } : {}),
      };
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
        compare: [
          { label: "Leg a", value: a, displayValue: fmtNumber(a, 4) },
          { label: "Leg b", value: b, displayValue: fmtNumber(b, 4) },
          { label: "Hypotenuse c", value: c, displayValue: fmtNumber(c, 4), highlight: true },
        ],
        chartCaption: `The hypotenuse (${fmtNumber(c, 4)}) is always the longest side of a right triangle — it stretches across the right angle, so it's longer than either leg on its own.`,
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
      const pairs: [number, number][] = [];
      for (let d = 1; d * d <= value; d++) {
        if (value % d === 0) {
          factors.push(d);
          pairs.push([d, value / d]);
          if (d !== value / d) factors.push(value / d);
        }
      }
      factors.sort((a, b) => a - b);
      return {
        results: [
          { label: "Factors", value: factors.join(", "), emphasis: true },
          { label: "Count", value: fmtNumber(factors.length, 0) },
        ],
        table: {
          headers: ["Factor Pair", "Product"],
          rows: pairs.map(([a, b]) => [`${fmtNumber(a, 0)} × ${fmtNumber(b, 0)}`, fmtNumber(value, 0)]),
        },
        chartCaption: `Every row multiplies out to ${fmtNumber(value, 0)} — pairing the smallest factor with the largest and working inward is the fastest way to find them all.`,
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
      const original = Math.round(n(i.value, 360));
      let value = original;
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
      let running = 1;
      const rows = Object.entries(factors).map(([p, e]) => {
        const prime = Number(p);
        const power = Math.pow(prime, e);
        running *= power;
        return [e > 1 ? `${prime}^${e}` : `${prime}`, fmtNumber(prime, 0), fmtNumber(e, 0), fmtNumber(power, 0), fmtNumber(running, 0)];
      });
      return {
        results: [{ label: "Prime Factorization", value: parts.join(" × "), emphasis: true }],
        table: {
          headers: ["Prime Power", "Prime", "Exponent", "Value (p^e)", "Running Product"],
          rows,
        },
        chartCaption: `Multiplying each prime power together in order rebuilds the original number — the running product reaches ${fmtNumber(original, 0)} once every prime factor is included.`,
      };
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
      const shown = common.length > 20 ? common.slice(0, 20) : common;
      return {
        results: [
          { label: "Common Factors", value: common.join(", "), emphasis: true },
          { label: "Greatest Common Factor", value: fmtNumber(Math.max(...common), 0) },
        ],
        growthSeries: shown.map((f, idx) => ({ label: `#${idx + 1}`, value: f, displayValue: fmtNumber(f, 0) })),
        chartCaption:
          common.length > shown.length
            ? `${common.length} factors divide evenly into every number listed (first ${shown.length} shown) — the tallest bar, ${fmtNumber(Math.max(...common), 0)}, is the greatest common factor.`
            : `${common.length} factor${common.length === 1 ? "" : "s"} divide${common.length === 1 ? "s" : ""} evenly into every number listed — the tallest bar, ${fmtNumber(Math.max(...common), 0)}, is the greatest common factor.`,
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
      if (i.operation === "detA") {
        return {
          results: [{ label: "det(A)", value: fmtNumber(det, 4), emphasis: true }],
          table: {
            headers: ["Term", "Value"],
            rows: [
              ["a₁₁ × a₂₂", fmtNumber(A[0][0] * A[1][1], 4)],
              ["a₁₂ × a₂₁", fmtNumber(A[0][1] * A[1][0], 4)],
              ["Determinant (difference)", fmtNumber(det, 4)],
            ],
          },
          chartCaption:
            det === 0
              ? `The determinant is the product of the main diagonal minus the product of the other diagonal — zero here means A is singular and has no inverse.`
              : `The determinant is the product of the main diagonal minus the product of the other diagonal — a nonzero value of ${fmtNumber(det, 4)} means A is invertible.`,
        };
      }
      if (i.operation === "inverseA") {
        if (det === 0) return { results: [], error: "Matrix A is singular (determinant is 0) — it has no inverse." };
        const inv = [[A[1][1] / det, -A[0][1] / det], [-A[1][0] / det, A[0][0] / det]];
        return {
          results: [{ label: "A⁻¹", value: fmt2x2(inv), emphasis: true }],
          table: {
            headers: ["Cell", "Formula", "Value"],
            rows: [
              ["[1,1]", "a₂₂ / det", fmtNumber(inv[0][0], 4)],
              ["[1,2]", "−a₁₂ / det", fmtNumber(inv[0][1], 4)],
              ["[2,1]", "−a₂₁ / det", fmtNumber(inv[1][0], 4)],
              ["[2,2]", "a₁₁ / det", fmtNumber(inv[1][1], 4)],
            ],
          },
          chartCaption: `Every entry of A is divided by the determinant (${fmtNumber(det, 4)}) and the diagonal entries swap places — multiply A by A⁻¹ and you get back the identity matrix.`,
        };
      }
      let R: number[][];
      let rows: string[][];
      if (i.operation === "add") {
        R = [[A[0][0] + B[0][0], A[0][1] + B[0][1]], [A[1][0] + B[1][0], A[1][1] + B[1][1]]];
        rows = [
          ["[1,1]", `${fmtNumber(A[0][0])} + ${fmtNumber(B[0][0])}`, fmtNumber(R[0][0])],
          ["[1,2]", `${fmtNumber(A[0][1])} + ${fmtNumber(B[0][1])}`, fmtNumber(R[0][1])],
          ["[2,1]", `${fmtNumber(A[1][0])} + ${fmtNumber(B[1][0])}`, fmtNumber(R[1][0])],
          ["[2,2]", `${fmtNumber(A[1][1])} + ${fmtNumber(B[1][1])}`, fmtNumber(R[1][1])],
        ];
      } else if (i.operation === "subtract") {
        R = [[A[0][0] - B[0][0], A[0][1] - B[0][1]], [A[1][0] - B[1][0], A[1][1] - B[1][1]]];
        rows = [
          ["[1,1]", `${fmtNumber(A[0][0])} − ${fmtNumber(B[0][0])}`, fmtNumber(R[0][0])],
          ["[1,2]", `${fmtNumber(A[0][1])} − ${fmtNumber(B[0][1])}`, fmtNumber(R[0][1])],
          ["[2,1]", `${fmtNumber(A[1][0])} − ${fmtNumber(B[1][0])}`, fmtNumber(R[1][0])],
          ["[2,2]", `${fmtNumber(A[1][1])} − ${fmtNumber(B[1][1])}`, fmtNumber(R[1][1])],
        ];
      } else {
        R = [
          [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
          [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
        ];
        rows = [
          ["[1,1]", `${fmtNumber(A[0][0])}×${fmtNumber(B[0][0])} + ${fmtNumber(A[0][1])}×${fmtNumber(B[1][0])}`, fmtNumber(R[0][0])],
          ["[1,2]", `${fmtNumber(A[0][0])}×${fmtNumber(B[0][1])} + ${fmtNumber(A[0][1])}×${fmtNumber(B[1][1])}`, fmtNumber(R[0][1])],
          ["[2,1]", `${fmtNumber(A[1][0])}×${fmtNumber(B[0][0])} + ${fmtNumber(A[1][1])}×${fmtNumber(B[1][0])}`, fmtNumber(R[1][0])],
          ["[2,2]", `${fmtNumber(A[1][0])}×${fmtNumber(B[0][1])} + ${fmtNumber(A[1][1])}×${fmtNumber(B[1][1])}`, fmtNumber(R[1][1])],
        ];
      }
      return {
        results: [{ label: "Result", value: fmt2x2(R), emphasis: true }],
        table: { headers: ["Cell", "Working", "Value"], rows },
        chartCaption:
          i.operation === "multiply"
            ? `Each result cell multiplies a row of A by a column of B, entry by entry, then adds the products — the table shows that arithmetic for all four cells.`
            : `Each result cell simply combines the matching entries of A and B — the table shows the exact arithmetic behind every one of the four numbers.`,
      };
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
        const aStr = (i.a || "0").trim();
        const bStr = (i.b || "0").trim();
        const a = BigInt(aStr);
        const b = BigInt(bStr);
        const result = i.op === "+" ? a + b : i.op === "-" ? a - b : a * b;
        const symbol = i.op === "+" ? "+" : i.op === "-" ? "−" : "×";
        const digitsA = aStr.replace("-", "").length;
        const digitsB = bStr.replace("-", "").length;
        const digitsResult = result.toString().replace("-", "").length;
        return {
          results: [
            { label: "Result", value: result.toString(), emphasis: true },
            { label: "Digits in Result", value: fmtNumber(digitsResult, 0) },
          ],
          steps: [`A has ${digitsA} digit${digitsA === 1 ? "" : "s"}, B has ${digitsB} digit${digitsB === 1 ? "" : "s"}.`, `${aStr} ${symbol} ${bStr} = ${result.toString()}`],
          notes: [
            "This uses exact arbitrary-precision integer math (BigInt), so there's no rounding or floating-point error no matter how large the numbers get — a regular calculator or spreadsheet starts losing precision past about 15-16 digits.",
          ],
          // Bars are sized by DIGIT COUNT, not the raw numeric magnitude — these values
          // are BigInts specifically because they can exceed what a JS number can hold
          // safely, so comparing digit counts (still exact, still meaningful) is the
          // honest way to visualize "how big" each one is without any precision loss.
          compare: [
            { label: "Digits in A", value: digitsA, displayValue: `${digitsA} digit${digitsA === 1 ? "" : "s"}` },
            { label: "Digits in B", value: digitsB, displayValue: `${digitsB} digit${digitsB === 1 ? "" : "s"}` },
            { label: "Digits in Result", value: digitsResult, displayValue: `${digitsResult} digit${digitsResult === 1 ? "" : "s"}`, highlight: true },
          ],
          chartCaption: `Compared by digit count rather than raw value — these numbers can be far too large for ordinary numeric scaling, but digit count stays exact and still shows how the result's size relates to A and B.`,
        };
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
      const absDividendStr = Math.abs(dividend).toString();
      const absDivisor = Math.abs(divisor);
      const rows: string[][] = [];
      let carry = 0;
      for (const digitChar of absDividendStr) {
        const digit = Number(digitChar);
        const broughtDown = carry * 10 + digit;
        const qDigit = Math.floor(broughtDown / absDivisor);
        const product = qDigit * absDivisor;
        const stepRemainder = broughtDown - product;
        rows.push([digitChar, fmtNumber(broughtDown, 0), fmtNumber(qDigit, 0), fmtNumber(product, 0), fmtNumber(stepRemainder, 0)]);
        carry = stepRemainder;
      }
      return {
        results: [
          { label: "Quotient", value: fmtNumber(quotient, 0), emphasis: true },
          { label: "Remainder", value: fmtNumber(remainder, 0) },
          { label: "Decimal Result", value: fmtNumber(dividend / divisor, 6) },
        ],
        steps: [`${dividend} = ${divisor} × ${quotient} + ${remainder}`],
        table: {
          headers: ["Bring Down Digit", "Working Number", "Quotient Digit", "Divisor × Digit", "Remainder"],
          rows,
        },
        chartCaption: `Working left to right through each digit of ${Math.abs(dividend)}, exactly like long division on paper — it lands on the same quotient (${quotient}) and remainder (${remainder}) as above.`,
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
      const twoTailedPct = twoTailed * 100;
      return {
        results: [
          { label: "One-Tailed P-Value", value: fmtNumber(oneTailed, 5), emphasis: true },
          { label: "Two-Tailed P-Value", value: fmtNumber(twoTailed, 5), emphasis: true },
        ],
        gauge: {
          value: twoTailedPct,
          min: 0,
          max: 100,
          valueLabel: `${fmtNumber(twoTailedPct, 2)}%`,
          zones: [
            { label: "Highly Significant", to: 1, barClass: "bg-teal-600 dark:bg-teal-400", textClass: "text-teal-700 dark:text-teal-400" },
            { label: "Significant", to: 5, barClass: "bg-teal-400 dark:bg-teal-500", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Marginal", to: 10, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Not Significant", to: 100, barClass: "bg-zinc-300 dark:bg-zinc-600", textClass: "text-zinc-500 dark:text-zinc-400" },
          ],
        },
        chartCaption:
          twoTailed < 0.05
            ? `A two-tailed p-value of ${fmtNumber(twoTailedPct, 2)}% falls below the common 5% significance threshold — usually read as a statistically significant result.`
            : `A two-tailed p-value of ${fmtNumber(twoTailedPct, 2)}% sits above the common 5% significance threshold — usually not considered statistically significant on its own.`,
      };
    },
    relatedSlugs: ["z-score-calculator", "confidence-interval-calculator"],
  },
];

export default math2;
