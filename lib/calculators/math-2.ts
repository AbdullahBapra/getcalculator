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
    content: {
      intro: [
        "A scientific calculator is the one you reach for the moment a problem involves anything past the four basic operations — sine and cosine, logarithms, powers, roots, factorials, or a value of π or e carried out to real precision. It's the calculator behind algebra II, trigonometry, physics, and most engineering coursework, and the one professionals keep a tab open for when a quick check beats digging out a formula sheet.",
        "Most people land here mid-problem: a homework set that suddenly needs sin(37°), a lab report that needs ln of a ratio, a spreadsheet formula they want to sanity-check by hand first. Typing the whole expression — parentheses, functions and all — and getting one clean answer is faster than hunting for the right buttons on a physical unit, and this one never dies mid-exam because the battery ran out.",
        "Because trig functions mean two different things depending on whether the angle is in degrees or radians, getting that toggle right is the single most common place a scientific calculator produces a 'wrong' answer that's actually just the other angle mode.",
      ],
      howItWorks: [
        "Expressions are evaluated respecting standard order of operations — parentheses first, then exponents and functions, then multiplication and division, then addition and subtraction — exactly the way you'd work through it on paper, just applied automatically to the whole string at once.",
        "The angle mode matters only for sin, cos and tan (and their inverses). A full circle is 360 degrees or 2π radians, so 30° and π/6 radians describe the identical angle — but typing sin(30) in radians mode evaluates sine of 30 radians, a completely different number from sin(30°). If a result looks wrong, the angle mode toggle is the first thing to check.",
        "Logarithm functions come in two flavors: log() is base-10 (how many times you'd multiply 10 by itself to reach a number), while ln() is the natural log, base e ≈ 2.71828 — the base that shows up naturally in growth and decay math. sqrt() and ^ handle roots and powers, and constants like pi and e can be typed directly into any expression.",
      ],
      faq: [
        {
          q: "Should I use degrees or radians mode?",
          a: "Use degrees for most everyday and geometry problems (angles measured 0-360°), and radians for calculus, physics, and anything involving angular velocity or the unit circle in terms of π. If a trig result looks way off, the angle mode is almost always the reason.",
        },
        {
          q: "What's the difference between log and ln?",
          a: "log() is logarithm base 10; ln() is the natural logarithm, base e. log(100) = 2 because 10² = 100, while ln(100) ≈ 4.605 because e^4.605 ≈ 100 — they answer the same kind of question with a different base.",
        },
        {
          q: "How do I calculate a square root or a power on a scientific calculator?",
          a: "Use sqrt() for a square root — sqrt(16) returns 4 — and ^ for any power, so 2^10 returns 1024. Both can be nested inside a larger expression along with parentheses.",
        },
        {
          q: "How is a scientific calculator different from a basic calculator?",
          a: "A basic calculator only adds, subtracts, multiplies and divides. A scientific calculator adds trigonometry, logarithms, exponents, roots, factorials and constants like π and e — the functions you need once math moves past arithmetic into algebra, trig, or calculus.",
        },
        {
          q: "Why does my answer not match what my phone's calculator shows?",
          a: "The two most common culprits are angle mode (degrees vs. radians) and order of operations — especially implied multiplication next to parentheses, which some calculators handle differently. Re-typing the expression with explicit parentheses around each piece usually resolves the mismatch.",
        },
      ],
    },
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
    content: {
      intro: [
        "A basic calculator handles the four operations that cover most of everyday math: addition, subtraction, multiplication and division. No trig, no logs, no memory keys — just two numbers, one operation, one answer, which is exactly what most quick calculations actually need.",
        "It's the calculator people reach for splitting a bill, checking a receipt total, doubling a recipe, or working out a quick homework problem that doesn't call for anything scientific. Because there's only one operation happening at a time, there's no order-of-operations ambiguity to worry about — pick A, pick the operation, pick B, and the answer is unambiguous.",
        "If your problem involves more than one operation chained together, parentheses, or functions like square roots and exponents, the scientific calculator on this site handles that same arithmetic plus everything past it.",
      ],
      faq: [
        {
          q: "What happens if I divide by zero?",
          a: "Division by zero is mathematically undefined, so this calculator flags it as an error rather than returning a number — there's no finite value that correctly answers 'how many times does zero go into this.'",
        },
        {
          q: "Can I use negative numbers?",
          a: "Yes — enter a negative value directly (e.g. -8) in either the A or B field and it's handled the same way any positive number would be, following standard sign rules for addition, subtraction, multiplication and division.",
        },
        {
          q: "What's the difference between this and the scientific calculator?",
          a: "This one performs a single operation between two numbers. The scientific calculator evaluates a full expression — parentheses, multiple operations, exponents, roots, trig and logarithms all at once.",
        },
        {
          q: "Does this calculator round the answer?",
          a: "Results are shown to a high level of precision (up to 8 decimal places when the division isn't exact), so you're seeing the real computed value rather than a rounded approximation.",
        },
      ],
    },
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
    content: {
      intro: [
        "This is a real on-screen calculator you click or tap through, built for the moments a physical calculator would normally handle: totaling a grocery cart in your head-check, working out a tip, running the arithmetic behind a budget, or just wanting satisfying buttons instead of typing numbers into a text field. It behaves like the calculator that's sat on a desk or in a kitchen drawer for decades, just accessible from any browser.",
        "The memory keys (M+, M−, MR, MC) are the feature a plain typed-in calculator can't replicate easily — they let you park a running subtotal while you compute something else, then bring it back later without writing it down. That's genuinely useful for anything with several intermediate totals: a shopping list, a set of measurements, a multi-step conversion.",
        "It also responds to your physical keyboard — number keys, the four operators, Enter for equals — so once you're used to it, it's just as fast as typing into any calculator app, with the buttons there for anyone who'd rather click.",
      ],
      howItWorks: [
        "Each number key appends a digit to the number currently being entered, and each operator key locks in the number so far and waits for the next one — press equals and it performs the pending operation and shows the result.",
        "The memory keys work independently of whatever's on the display: M+ adds the current display value into a separate memory slot, M− subtracts it from that slot, MR recalls whatever's stored there back onto the display, and MC clears the memory slot back to zero. Nothing else on the calculator touches that stored value until you tell it to.",
      ],
      faq: [
        {
          q: "What does the M+ button do?",
          a: "M+ adds whatever's currently on the display into the calculator's memory slot, which is separate from the number you're actively working with — useful for building up a running total across several separate calculations.",
        },
        {
          q: "How is MR different from MC?",
          a: "MR (memory recall) brings the stored memory value back onto the display without changing it; MC (memory clear) resets the stored memory value to zero. Use MR to reuse a saved total, MC when you're done with it.",
        },
        {
          q: "Can I use my keyboard instead of clicking?",
          a: "Yes — number keys, +, −, ×  (or *), ÷ (or /), and Enter (for equals) all work directly, so you can operate the whole calculator without touching the mouse.",
        },
        {
          q: "Why does the calculator show an error on division?",
          a: "Dividing by zero has no defined answer, so the calculator shows an error instead of a number rather than silently returning something misleading.",
        },
      ],
    },
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
    content: {
      intro: [
        "A number sequence is just a list of values that follows a fixed rule from one term to the next. The two most common patterns — arithmetic, where you add the same amount each time, and geometric, where you multiply by the same factor each time — cover most of what shows up in algebra classes and in real patterns: a savings account earning a flat monthly deposit, a population doubling on a fixed schedule, a ball bouncing to a fraction of its previous height on each bounce.",
        "Students hit this mostly in algebra and precalculus, working out a specific term (\"what's the 20th term?\") or the sum of a run of terms without having to add or multiply them out one at a time by hand. Outside the classroom, the same math describes anything that grows or shrinks by a constant step or a constant ratio — loan balances, investment compounding, radioactive decay, and depreciation schedules are all sequences in disguise.",
      ],
      howItWorks: [
        "In an arithmetic sequence, each term is the previous term plus a fixed common difference d: aₙ = a₁ + (n−1)d. The sequence grows (or shrinks) by the same flat amount every step, so plotted out it forms a straight line.",
        "In a geometric sequence, each term is the previous term multiplied by a fixed common ratio r: aₙ = a₁ × r^(n−1). Because the growth compounds instead of adding flatly, the terms curve — sharply upward if r is greater than 1, or shrinking toward zero if r is a fraction between 0 and 1.",
        "The sum of the first n terms has a closed-form shortcut in both cases, which is what lets this calculator total up a sequence of any length instantly instead of adding every term one by one.",
      ],
      faq: [
        {
          q: "What's the difference between an arithmetic and a geometric sequence?",
          a: "Arithmetic sequences add a fixed amount to get the next term (2, 5, 8, 11…, adding 3 each time). Geometric sequences multiply by a fixed ratio instead (2, 6, 18, 54…, multiplying by 3 each time) — that's why geometric sequences grow so much faster.",
        },
        {
          q: "How do I find the nth term of a sequence without listing every term?",
          a: "Use the direct formula: aₙ = a₁ + (n−1)d for arithmetic, or aₙ = a₁ × r^(n−1) for geometric. Both let you jump straight to any term without computing everything before it.",
        },
        {
          q: "What does a common ratio less than 1 do to a geometric sequence?",
          a: "It shrinks the terms toward zero instead of growing them — each term is smaller than the last, which is exactly the pattern behind radioactive decay and value depreciation.",
        },
        {
          q: "Can the common difference or ratio be negative?",
          a: "Yes. A negative common difference makes an arithmetic sequence count downward, and a negative common ratio makes a geometric sequence alternate in sign from term to term while still growing or shrinking in magnitude.",
        },
      ],
    },
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
    content: {
      intro: [
        "Half-life describes how long it takes for a quantity to fall to exactly half of its current value, and it shows up any time something decays at a rate proportional to how much of it is left — radioactive isotopes, the concentration of a drug in the bloodstream, or a hot cup of coffee cooling toward room temperature all follow the same underlying pattern.",
        "It's a staple of chemistry and physics courses, where students compute how much of a radioactive sample remains after a given time, and it comes up just as often outside a classroom — carbon-14 dating an artifact, a pharmacist working out how long a medication stays active in the body, or an engineer estimating how long stored nuclear material stays hazardous.",
        "The key thing that makes half-life math different from steady, linear decline is that the decay never actually stops — every half-life removes half of whatever's left, so the amount keeps shrinking but never technically reaches zero.",
      ],
      howItWorks: [
        "The formula is N(t) = N₀ × 0.5^(t / half-life), where N₀ is the starting amount, t is the elapsed time, and half-life is how long it takes to lose half the current amount. Every time t advances by one full half-life, the exponent increases by exactly 1, and the remaining amount gets cut in half again.",
        "This is exponential decay, not linear decay — the substance doesn't lose a fixed amount per unit time, it loses a fixed fraction. That's why the amount drops fast at first (in absolute terms) and then tapers off, approaching but never quite touching zero.",
      ],
      faq: [
        {
          q: "What does half-life actually mean?",
          a: "It's the time it takes for a decaying quantity to drop to exactly half its current amount — and that same waiting period cuts whatever's left in half again, no matter how much or how little remains at that point.",
        },
        {
          q: "Does the substance ever fully disappear?",
          a: "Mathematically, no — each half-life only removes half of what's currently there, so the remaining amount keeps shrinking toward zero without ever technically reaching it, though after enough half-lives it becomes negligible.",
        },
        {
          q: "How is half-life used in carbon dating?",
          a: "Carbon-14 has a known half-life of about 5,730 years. By measuring how much carbon-14 remains in an organic sample relative to the original amount, scientists can work backward through this same formula to estimate the sample's age.",
        },
        {
          q: "Can this calculator be used for drug elimination from the body?",
          a: "Yes — many medications are eliminated from the bloodstream at a rate that closely follows the same exponential half-life pattern, so entering a drug's known half-life and elapsed time gives a reasonable estimate of how much remains active.",
        },
      ],
    },
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
    content: {
      intro: [
        "Slope measures how steep a line is — how much it rises or falls for every unit it moves sideways — and it's one of the first genuinely useful pieces of algebra, because it describes rate of change in general, not just lines on graph paper. Speed is the slope of a distance-vs-time line, a ramp's steepness is a slope, and a hillside's grade is a slope expressed as a percentage.",
        "Students meet this calculating slope between two points for algebra homework, but it comes up constantly outside class too: a contractor checking that a wheelchair ramp meets accessibility requirements, a roofer calculating pitch, or anyone checking whether two lines are parallel (same slope) or perpendicular (slopes that are negative reciprocals of each other).",
        "Given any two points on a line, the slope is fully determined — there's exactly one straight line through two distinct points, and exactly one slope that describes it.",
      ],
      howItWorks: [
        "Slope is 'rise over run': m = (y₂ − y₁) / (x₂ − x₁). The numerator (rise) is how far the line moves vertically between the two points; the denominator (run) is how far it moves horizontally. Dividing one by the other gives a single number that describes the line's steepness and direction.",
        "The sign tells you the direction: positive slope means the line climbs left to right, negative means it falls, zero means it's perfectly flat (horizontal), and an undefined slope (division by zero, when both points share the same x-value) means the line is perfectly vertical.",
        "Once you have the slope, the full line equation follows from a single point: y = mx + b, where b (the y-intercept) is found by plugging one of the known points back into that equation and solving for b.",
      ],
      faq: [
        {
          q: "How do you find the slope between two points?",
          a: "Subtract the y-values to get the rise, subtract the x-values (in the same order) to get the run, then divide: m = (y₂ − y₁) / (x₂ − x₁).",
        },
        {
          q: "What does a negative slope mean?",
          a: "The line falls as it moves left to right — for every step you take to the right along the x-axis, the y-value decreases rather than increases.",
        },
        {
          q: "What's the difference between a zero slope and an undefined slope?",
          a: "A zero slope is a perfectly horizontal line (no rise at all, just run). An undefined slope is a perfectly vertical line — there's no run (Δx = 0), and dividing by zero has no defined value.",
        },
        {
          q: "How do I know if two lines are parallel or perpendicular from their slopes?",
          a: "Parallel lines share the exact same slope. Perpendicular lines have slopes that are negative reciprocals of each other — for example, a slope of 2 and a slope of −1/2 meet at a right angle.",
        },
      ],
    },
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
    content: {
      intro: [
        "Sample size math answers a very practical question before you run a survey or study: how many people do you actually need to talk to for the results to be trustworthy? Ask too few and your margin of error balloons; ask more than you need and you've wasted time and budget collecting responses that barely tighten the result any further.",
        "This is the calculator behind market research surveys, academic studies, political polling, and product feedback forms — anywhere someone needs to say, credibly, 'we surveyed enough people that this result reflects the broader population within a stated margin of error.'",
        "The required sample size depends on how tight you want your margin of error, how confident you want to be in the result, and — perhaps less intuitively — on the expected proportion itself, since a rough 50/50 split needs a larger sample than a lopsided one to pin down accurately.",
      ],
      howItWorks: [
        "The core formula is n = z²×p(1−p) / e², where z is the z-score for your chosen confidence level, p is the estimated proportion (as a decimal), and e is your target margin of error (also as a decimal). Higher confidence and tighter margins both push z or shrink e, which pushes the required sample size up.",
        "p(1−p) is largest when p = 0.5, which is why 50% is the most conservative (largest sample-requiring) estimate to use when you genuinely don't know what proportion to expect — it guarantees you won't undersize the survey.",
        "When you're sampling from a small, known population rather than an effectively infinite one, a finite population correction shrinks the required sample size, since surveying a larger share of a small group naturally yields more certainty per respondent.",
      ],
      faq: [
        {
          q: "What sample size do I need for a survey?",
          a: "It depends on your target margin of error and confidence level — a common starting point is a 95% confidence level with a 5% margin of error, which typically calls for a sample in the low hundreds regardless of how large the overall population is, unless that population itself is small.",
        },
        {
          q: "Why does the population size barely matter for large populations?",
          a: "Once a population is large relative to the sample, sampling a bit more or less of it changes the required sample size only marginally — the required n converges toward the same value whether the population is 100,000 or 100,000,000. It only shrinks noticeably when the population itself is small.",
        },
        {
          q: "What confidence level and margin of error should I use?",
          a: "95% confidence with a 5% margin of error is the most common default across market research and academic surveys, though tighter margins (like 3%) or higher confidence (99%) are used when the decision riding on the result matters more.",
        },
        {
          q: "Why does using 50% for the expected proportion give the largest sample size?",
          a: "The math term p(1−p) peaks at p = 0.5, so a roughly even split in your population is the hardest case to pin down precisely — using 50% when you're unsure guarantees your sample size is large enough no matter what the true proportion turns out to be.",
        },
      ],
    },
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
    content: {
      intro: [
        "A confidence interval takes a single sample mean and turns it into a range that's likely to contain the true population mean — the number you'd get if you could somehow measure every single member of the population instead of just a sample. Almost no real-world measurement is exact, so this range is often the more honest, useful answer than a single point estimate on its own.",
        "It's a core tool in research, quality control, and any A/B test or survey analysis — anywhere someone has measured a sample (average test scores, average product weight off an assembly line, average response to a survey question) and needs to state how much uncertainty surrounds that average.",
        "The width of the interval is a direct trade-off with confidence: a wider interval lets you be more confident the true value falls inside it, while a narrower interval is more precise but riskier — it's more likely to miss the true value entirely.",
      ],
      howItWorks: [
        "The interval is built as mean ± z × (σ / √n): take the sample mean, then add and subtract a margin built from the z-score for your confidence level, the sample's standard deviation, and the square root of the sample size.",
        "Standard deviation measures how spread out the individual data points are — more spread means more uncertainty about where the true mean sits, and the formula reflects that directly. Sample size works in the opposite direction: as √n grows, the margin shrinks, because a larger sample pins the average down more precisely.",
        "A 95% confidence level means that if you repeated this same sampling process many times, about 95% of the resulting intervals would contain the true population mean — it's a statement about the reliability of the method, not a 95% probability attached to this one specific interval.",
      ],
      faq: [
        {
          q: "What does a 95% confidence interval actually mean?",
          a: "It means that if the same sampling process were repeated many times, about 95% of the resulting intervals would contain the true population mean. It doesn't mean there's a 95% chance the true mean falls in this particular interval — the true mean is fixed, only the interval varies.",
        },
        {
          q: "Why does a larger sample size narrow the confidence interval?",
          a: "The margin of error depends on the sample size through √n in the denominator — a bigger sample gives a more precise estimate of the true mean, which shrinks the range needed to be confident it's captured.",
        },
        {
          q: "Should I use 90%, 95%, or 99% confidence?",
          a: "95% is the standard default across most research and business contexts. Use 99% when the cost of being wrong is high and you want more certainty (at the cost of a wider interval); 90% when a rougher estimate is acceptable and you'd rather have a tighter range.",
        },
        {
          q: "What's the difference between this and the sample size calculator?",
          a: "This calculator starts from a sample you've already collected and tells you the confidence interval around its mean. The sample size calculator works in the opposite direction — it tells you how large a sample you'd need to collect to hit a target margin of error before you start.",
        },
      ],
    },
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
    content: {
      intro: [
        "This finds the straight-line ('as the crow flies') distance between two points, whether they're plotted on a flat 2D graph or floating in 3D space. It's one of the most direct applications of the Pythagorean theorem you'll meet in geometry class — instead of one right triangle, it's really just stacking the theorem across however many dimensions you're working in.",
        "Students hit it in coordinate geometry proving shapes or finding perimeters from vertex coordinates, while outside the classroom the identical math underlies GPS distance calculations, game and graphics programming (how far apart are two objects in a scene), and physics problems involving displacement between two positions.",
        "Adding a third coordinate (z) extends the exact same idea into 3D without changing the underlying logic — it's the same formula with one more squared difference added under the square root.",
      ],
      howItWorks: [
        "The formula is d = √[(x₂−x₁)² + (y₂−y₁)² + (z₂−z₁)²]. Each squared difference measures how far apart the two points are along one axis; adding them together and taking the square root combines those separate axis-by-axis differences into one overall straight-line distance — exactly the Pythagorean theorem, generalized past two dimensions.",
        "Squaring each difference before adding is what makes the direction of the difference (positive or negative) not matter — a negative Δx contributes the same squared value as a positive one of the same size, since distance itself is never negative.",
        "In 2D, leaving z at zero for both points collapses this back to the familiar two-dimensional distance formula, since the z-term simply becomes zero and drops out of the sum.",
      ],
      faq: [
        {
          q: "How do you find the distance between two points?",
          a: "Subtract the x-coordinates and square the result, do the same for y (and z, if working in 3D), add all the squared differences together, and take the square root of that sum.",
        },
        {
          q: "Does this work for 3D coordinates too?",
          a: "Yes — leave the z-coordinates at 0 for a purely 2D distance, or fill them in for a genuine 3D straight-line distance; the same formula covers both cases.",
        },
        {
          q: "What's the difference between this and the slope calculator?",
          a: "Distance tells you how far apart two points are in a straight line. Slope tells you the steepness and direction of the line connecting them — you can have two points that are very far apart with a shallow slope, or close together with a steep one; the two measurements answer different questions.",
        },
        {
          q: "Why is the result always positive?",
          a: "Distance is a magnitude, not a direction — squaring each coordinate difference eliminates any negative signs before the square root is taken, so the result can never come out negative.",
        },
      ],
    },
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
    content: {
      intro: [
        "Surface area is the total area covering the outside of a 3D shape — every face, added together. It's the number that actually matters when you're covering, wrapping, painting, or plating something, as opposed to volume, which tells you how much a shape holds on the inside.",
        "It's a standard geometry-class topic across cubes, boxes, spheres, cylinders and cones, but it's also genuinely practical: figuring out how much wrapping paper a box needs, how much paint a cylindrical tank's exterior requires, how much material goes into a can or a cone-shaped container, or how much fabric covers a spherical shape.",
        "Each shape has its own formula because each is built from a different combination of flat and curved faces, but they all reduce to the same idea — add up the area of every face that makes up the shape's outer surface.",
      ],
      howItWorks: [
        "A cube's surface area is 6 × side², since all six faces are identical squares. A rectangular box generalizes that into three pairs of matching rectangular faces: SA = 2(lw + lh + wh), where each term covers one pair (top/bottom, front/back, left/right).",
        "A sphere's surface area, 4πr², comes from calculus but is simple to apply — it depends only on the radius. A cylinder splits into two flat circular ends (2πr²) plus one curved rectangular side wrapped around (2πrh), combining to SA = 2πr(r + h). A cone splits similarly into a flat circular base (πr²) plus a curved lateral surface (πr × slant height, where the slant height is √(r² + h²) by the Pythagorean theorem).",
      ],
      faq: [
        {
          q: "What's the difference between surface area and volume?",
          a: "Surface area measures the total area of a shape's outer faces — think of it as how much material would wrap the outside. Volume measures how much space the shape encloses on the inside. They're measured in different units too: surface area in square units, volume in cubic units.",
        },
        {
          q: "Why does a cone need the slant height instead of the regular height?",
          a: "The cone's curved side is slanted, not vertical, so its area depends on the distance along that slanted surface (the slant height) rather than the straight vertical height — the two are only equal for a perfectly flat cone, which isn't really a cone at all.",
        },
        {
          q: "How do you find the surface area of a cylinder?",
          a: "Add the area of the two circular ends (2πr²) to the area of the curved side unrolled into a rectangle (2πrh, where h is the height): SA = 2πr(r + h).",
        },
        {
          q: "Is surface area always in square units?",
          a: "Yes — since it's an area measurement, the result is always in square units (square inches, square meters, etc.), regardless of which 3D shape you're measuring.",
        },
      ],
    },
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
    content: {
      intro: [
        "A right triangle has one 90° angle, which makes it uniquely solvable — knowing just two pieces of information about it (two sides, or one side and one angle) is enough to work out everything else: the remaining side, both remaining angles, and the area. That predictability is exactly why right triangles anchor so much of trigonometry.",
        "Geometry and trig students use this to solve for whatever's missing given two known values, but the same triangle shows up constantly in construction and design: framing a roof, checking that a ladder is at a safe angle against a wall, calculating a wheelchair ramp's rise and run, or laying out a diagonal brace.",
        "Because a right triangle's shape is fully locked in by any two known measurements, this calculator adapts to whichever two you actually have — two legs, a leg and the hypotenuse, or a leg and an angle — rather than forcing one fixed input layout.",
      ],
      howItWorks: [
        "When both legs are known, the Pythagorean theorem finds the hypotenuse directly: a² + b² = c². When the hypotenuse and one leg are known, the same equation is rearranged to solve for the missing leg instead.",
        "When one leg and one angle are known, trigonometric ratios take over: sine, cosine and tangent relate an angle to a ratio of two of the triangle's sides. Once one side and one non-right angle are known, those ratios pin down every other side.",
        "In every case, once all three sides are known, the two non-right angles follow from inverse trig functions, and since a triangle's angles always sum to 180°, the two acute angles in a right triangle always add up to exactly 90°.",
      ],
      faq: [
        {
          q: "How do you find the hypotenuse of a right triangle?",
          a: "If you know both legs, use the Pythagorean theorem: c = √(a² + b²). If you know one leg and one angle instead, divide that leg by the sine or cosine of the angle, depending on which side it sits opposite or adjacent to.",
        },
        {
          q: "What is SOHCAHTOA?",
          a: "It's a memory aid for the three basic trig ratios in a right triangle: Sine = Opposite/Hypotenuse, Cosine = Adjacent/Hypotenuse, Tangent = Opposite/Adjacent — the relationships this calculator uses whenever an angle is one of the known values.",
        },
        {
          q: "Do the two non-right angles always add up to 90°?",
          a: "Yes — every triangle's angles sum to 180°, and one of those is already the fixed 90° right angle, so the other two must always add up to the remaining 90° between them.",
        },
        {
          q: "Why is the hypotenuse always the longest side?",
          a: "It's the side directly opposite the right angle, and the right angle is the largest angle in the triangle — the longest side in any triangle is always opposite the largest angle.",
        },
      ],
    },
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
    content: {
      intro: [
        "A factor of a number is any whole number that divides into it evenly, with nothing left over. Every whole number greater than 1 has at least two factors — 1 and itself — and most have several more tucked in between, arranged neatly in pairs that multiply back to the original number.",
        "This comes up constantly in school math: simplifying fractions to lowest terms, factoring expressions in algebra, or splitting a group of items into equal-sized batches. It's also just a handy everyday tool — figuring out every way to arrange a fixed number of items into equal rows and columns, for example, is really a factor question in disguise.",
        "Larger numbers tend to have more factors, but not predictably — a number like 60 has twelve factors thanks to its rich mix of small prime building blocks, while a number like 61 (prime) has only two: 1 and 61 itself.",
      ],
      howItWorks: [
        "Finding every factor of a number means testing which whole numbers divide into it with no remainder. Checking divisors only up to the square root of the number is enough — every factor above that square root is guaranteed to be paired with one already found below it, since factors always come in pairs that multiply to the original number.",
        "That's why factors are naturally listed as pairs: for 60, the pair (4, 15) multiplies back to 60, and so does (5, 12), (6, 10), (1, 60), (2, 30), and (3, 20) — six pairs, twelve factors total.",
      ],
      faq: [
        {
          q: "What is a factor of a number?",
          a: "A factor is any whole number that divides evenly into another number with no remainder. For example, 6 is a factor of 24 because 24 ÷ 6 = 4 exactly, with nothing left over.",
        },
        {
          q: "What's the difference between factors and multiples?",
          a: "Factors divide into a number (the factors of 12 are smaller than or equal to 12: 1, 2, 3, 4, 6, 12). Multiples are what you get multiplying a number up (the multiples of 12 go the other direction: 12, 24, 36, 48…) — factors and multiples are essentially inverses of each other.",
        },
        {
          q: "How many factors does a number have?",
          a: "It depends entirely on the number's prime building blocks — a number with many small prime factors tends to have far more total factors than a prime number of similar size, which only ever has exactly two: 1 and itself.",
        },
        {
          q: "What's the difference between this and the prime factorization calculator?",
          a: "This lists every whole-number divisor of a number. Prime factorization breaks the number down into only its prime building blocks (with exponents) — a more compact, unique representation that this calculator's full factor list is actually built from.",
        },
      ],
    },
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
    content: {
      intro: [
        "Prime factorization breaks a number down into the unique set of prime numbers that multiply together to build it. Every whole number greater than 1 has exactly one such breakdown — that uniqueness (the fundamental theorem of arithmetic) is what makes prime factorization such a powerful tool rather than just an academic exercise.",
        "It shows up in middle and high school math as a stepping stone to finding greatest common factors and least common multiples, simplifying radicals, and reducing fractions — and the same technique underlies parts of number theory and cryptography, where the difficulty of factoring very large numbers into their primes is what keeps certain encryption schemes secure.",
        "Because the breakdown is unique, two numbers' prime factorizations can be compared directly to find exactly what they share and what they don't — which is precisely how GCF and LCM get computed under the hood.",
      ],
      howItWorks: [
        "The standard method is repeated division: start with the smallest prime (2), divide it out of the number as many times as it goes in evenly, then move to the next prime (3, 5, 7…) and repeat, continuing until only 1 remains.",
        "Each prime that was divided out, along with how many times it divided in (its exponent), becomes one term in the final factorization — written as n = p₁^e₁ × p₂^e₂ × ... For example, 360 breaks down to 2³ × 3² × 5, meaning 2×2×2×3×3×5 multiplies back out to exactly 360.",
        "You only need to test prime divisors up to the square root of whatever's left at each step — if nothing up to that point divides evenly, whatever remains is itself prime and becomes the final factor.",
      ],
      faq: [
        {
          q: "What is prime factorization?",
          a: "It's expressing a whole number as a product of prime numbers — numbers greater than 1 with no divisors other than 1 and themselves. For example, the prime factorization of 60 is 2² × 3 × 5.",
        },
        {
          q: "Is 1 a prime number?",
          a: "No. By definition, a prime number has exactly two distinct divisors (1 and itself); 1 only has one divisor (itself), so it's excluded and doesn't appear in any prime factorization.",
        },
        {
          q: "How is prime factorization used to find GCF and LCM?",
          a: "The GCF of two numbers is the product of the smallest power of each prime they share; the LCM is the product of the largest power of every prime appearing in either number. Comparing the two numbers' prime factorizations side by side makes both straightforward to read off.",
        },
        {
          q: "What's the fastest way to find prime factorization by hand?",
          a: "Repeatedly divide by the smallest prime that still divides in evenly — start with 2, then 3, 5, 7, and so on — writing down each prime you use until you're left with 1. It's slow for very large numbers but reliable for anything typically encountered in coursework.",
        },
      ],
    },
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
    content: {
      intro: [
        "A common factor is any whole number that divides evenly into every number in a group, not just one of them. Two numbers might each have plenty of factors on their own, but only the ones appearing in both lists actually count as common — and the largest of those shared factors is the greatest common factor (GCF), the number most people are really after.",
        "It's the tool behind simplifying a fraction to lowest terms (dividing numerator and denominator by their GCF), splitting items into the largest possible equal groups, or figuring out the biggest square tile size that fits evenly across a rectangular floor with no cutting — all classic 'what's the biggest number that divides evenly into all of these' problems.",
        "Common factors get harder to spot by inspection as more numbers are added to the list, which is exactly where working through the math systematically instead of guessing pays off.",
      ],
      howItWorks: [
        "This works by listing every factor of the first number, then narrowing that list down to only the factors that also divide evenly into every other number in the group — effectively an intersection of each number's individual factor set.",
        "Whatever's left after that narrowing is the complete set of common factors, and the largest value remaining in that set is the greatest common factor (GCF) — the single number most simplification and grouping problems actually need.",
      ],
      faq: [
        {
          q: "What's the difference between a common factor and the GCF?",
          a: "A common factor is any number that divides evenly into every number in the group — there are usually several. The GCF (greatest common factor) is specifically the largest one among them, and it's usually the one you actually need for simplifying or grouping.",
        },
        {
          q: "How is this different from the factor calculator?",
          a: "The factor calculator lists every factor of one single number. This one takes two or more numbers and finds only the factors they all share — a narrower, more targeted question that's actually what most real problems (like simplifying a fraction) are asking.",
        },
        {
          q: "Why does the GCF matter for simplifying fractions?",
          a: "Dividing both the numerator and denominator of a fraction by their GCF reduces it to lowest terms in one step — dividing by any smaller common factor would still leave it further simplifiable.",
        },
        {
          q: "What if two numbers only share the factor 1?",
          a: "That means the numbers are coprime (relatively prime) — they share no factors beyond 1, even if each individually has plenty of its own factors, so their GCF is 1 and no fraction built from them can be simplified any further.",
        },
      ],
    },
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
    content: {
      intro: [
        "A matrix is just a rectangular grid of numbers, and once you can add, subtract, multiply and invert them, you have the basic toolkit behind a surprising amount of applied math — solving systems of linear equations, transforming coordinates in computer graphics and game engines, and representing the data behind machine learning models all lean on this same 2×2-and-larger matrix arithmetic.",
        "Students meet 2×2 matrices in algebra II or a first linear algebra course, usually right around the point where matrix multiplication first breaks the intuition built from ordinary number multiplication — it isn't commutative, and 'dividing' by a matrix means multiplying by its inverse instead, if that inverse even exists.",
        "This calculator handles the operations that actually come up at the 2×2 level: entrywise addition and subtraction, row-by-column multiplication, the determinant, and the inverse — the four building blocks that everything else in matrix algebra is stacked on top of.",
      ],
      howItWorks: [
        "Addition and subtraction work entrywise — each cell of the result is just the sum or difference of the matching cells in A and B, nothing more involved than that.",
        "Multiplication is different: each cell of the result comes from multiplying a full row of A by a full column of B, entry by entry, and adding those products together — which is why matrix multiplication order matters (A×B usually isn't the same as B×A), unlike multiplying ordinary numbers.",
        "The determinant of a 2×2 matrix [[a,b],[c,d]] is ad − bc — a single number that reveals whether the matrix has an inverse at all. If it's zero, the matrix is 'singular' and has no inverse. Otherwise, the inverse is built by swapping the diagonal entries, negating the off-diagonal entries, and dividing everything by the determinant.",
      ],
      faq: [
        {
          q: "What does the determinant of a matrix tell you?",
          a: "It's a single number that reveals whether a matrix can be inverted — a nonzero determinant means an inverse exists, while a determinant of exactly zero means the matrix is singular and has no inverse at all.",
        },
        {
          q: "Why doesn't A × B equal B × A for matrices?",
          a: "Matrix multiplication combines rows of the first matrix with columns of the second, and swapping which matrix comes first changes which rows pair with which columns — so unlike multiplying ordinary numbers, the order you multiply matrices in generally changes the result.",
        },
        {
          q: "What happens if I try to invert a matrix with a determinant of zero?",
          a: "It's mathematically impossible — a singular matrix (determinant zero) has no inverse, the matrix equivalent of trying to divide by zero.",
        },
        {
          q: "What are matrices actually used for?",
          a: "They're the standard way to represent and solve systems of linear equations, and they're the backbone of computer graphics transformations (rotating, scaling, moving objects), engineering simulations, and the underlying math of many machine learning models.",
        },
      ],
    },
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
    content: {
      intro: [
        "Ordinary calculators — and JavaScript's built-in number type, for that matter — start losing exact precision once a whole number climbs past about 15 to 16 digits. This calculator sidesteps that limit entirely, performing addition, subtraction and multiplication on integers of essentially unlimited size with every digit exact, no rounding anywhere in the pipeline.",
        "People end up here doing things ordinary arithmetic tools weren't built for: multiplying out a large factorial, exploring number theory or combinatorics problems, checking cryptography-adjacent math where numbers routinely run to dozens or hundreds of digits, or just satisfying curiosity about how large a number actually gets when you keep multiplying.",
        "The tell that you need something like this rather than a standard calculator is precision silently degrading — a normal calculator will confidently show you a wrong answer once a result exceeds its safe integer range, without any warning that it's happened.",
      ],
      howItWorks: [
        "This uses arbitrary-precision integer arithmetic (JavaScript's BigInt type), which represents whole numbers as an actual sequence of digits rather than packing them into a fixed-size floating-point slot. That means there's no upper limit on how large a number it can represent exactly, and no rounding error creeping in as numbers grow.",
        "The tradeoff is that BigInt math only works cleanly with whole numbers — decimals aren't part of this system, which is exactly why the operations here are addition, subtraction and multiplication rather than division, since division of two large integers usually doesn't land on another whole number.",
      ],
      faq: [
        {
          q: "Why does a regular calculator give the wrong answer for very large numbers?",
          a: "Standard calculators and most programming languages store numbers in a fixed amount of space (floating point), which starts losing exact precision once a whole number passes roughly 15 to 16 digits — past that point, the calculator is silently rounding, not computing exactly.",
        },
        {
          q: "How large a number can this calculator handle?",
          a: "There's no fixed limit built into the math itself — arbitrary-precision arithmetic can represent integers with hundreds of digits or more exactly, limited only by practical constraints like computation time for extremely large inputs.",
        },
        {
          q: "Why is there no division option?",
          a: "Dividing two large integers usually doesn't produce another whole number, and this calculator is built around exact integer arithmetic — introducing decimals or rounding would undercut the entire point of using arbitrary precision in the first place.",
        },
        {
          q: "Can I enter negative numbers?",
          a: "Yes — a leading minus sign is handled correctly for any operation, and the arithmetic remains exact regardless of sign.",
        },
      ],
    },
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
    content: {
      intro: [
        "Long division is the step-by-step process of dividing one number by another by hand, digit by digit, rather than in one leap. It's one of the foundational arithmetic skills taught in elementary school, and it's still the method that explains exactly why a quotient and remainder come out the way they do — something a calculator's flat decimal answer skips right over.",
        "Students use this to check their own by-hand division work or to see each individual step laid out when a problem doesn't click from the final answer alone. It's also genuinely useful any time you need an exact quotient and remainder rather than a rounded decimal — splitting a quantity into equal whole groups with some left over, for instance.",
        "Every step of the long division algorithm follows the same simple move repeated over and over: bring down the next digit, see how many times the divisor fits, write that digit down, subtract, and carry the leftover into the next step.",
      ],
      howItWorks: [
        "At each step, the next digit of the dividend is 'brought down' and combined with whatever remainder carried over from the previous step. The divisor is checked against that combined number to see how many whole times it fits — that count becomes the next digit of the quotient.",
        "The divisor is then multiplied by that quotient digit and subtracted from the working number, leaving a new remainder that carries into the next step. Repeating this once for every digit of the dividend eventually produces the full quotient, with whatever's left over at the very end being the final remainder.",
        "The relationship dividend = divisor × quotient + remainder holds at every stage and is the easiest way to check the final answer: multiply the quotient back by the divisor, add the remainder, and it should return the original dividend exactly.",
      ],
      faq: [
        {
          q: "What's the difference between the quotient and the remainder?",
          a: "The quotient is how many whole times the divisor fits into the dividend. The remainder is whatever's left over afterward that doesn't divide in evenly — for example, 17 ÷ 5 has a quotient of 3 and a remainder of 2, since 5×3=15 and 17−15=2.",
        },
        {
          q: "How do you check a long division answer?",
          a: "Multiply the quotient by the divisor, then add the remainder — the result should exactly equal the original dividend. If it doesn't, there's an arithmetic mistake somewhere in the steps.",
        },
        {
          q: "How do I turn the remainder into a decimal instead?",
          a: "Divide the remainder by the divisor and continue the division past the decimal point (adding zeros as needed) to get the decimal form — this calculator shows both the whole-number remainder and the full decimal result side by side.",
        },
        {
          q: "Does this work with negative numbers?",
          a: "Yes — enter a negative dividend or divisor and the sign is carried through correctly in both the quotient and the decimal result.",
        },
      ],
    },
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
    content: {
      intro: [
        "A p-value measures how surprising an observed result would be if there were actually no real effect going on — in statistics terms, if the 'null hypothesis' were true. A small p-value means the result would be unusual under that assumption, which is the standard evidence researchers lean on to say an effect is probably real rather than just noise.",
        "This is the calculator behind hypothesis testing in research papers, A/B test analysis, and any statistics coursework that gets to the 'is this result actually significant' stage — taking a z-score (how many standard deviations a result sits from what you'd expect by chance) and converting it into the probability researchers actually report.",
        "The distinction between one-tailed and two-tailed matters here: a one-tailed p-value only asks about surprise in one direction (result higher than expected, say), while a two-tailed p-value accounts for surprise in either direction — and two-tailed is the more common, more conservative default in most published research.",
      ],
      howItWorks: [
        "This works from the standard normal distribution: the one-tailed p-value is 1 minus the cumulative probability up to |z|, which is the probability of seeing a result at least that extreme in one specific direction purely by chance.",
        "The two-tailed p-value simply doubles that figure, since it accounts for an extreme result showing up in either direction — above or below the expected value — rather than just the one direction the one-tailed version checks.",
        "A larger z-score (further from zero) pushes the p-value down, since it represents a result that's further out in the distribution's tail and therefore less likely to happen just by chance if there were no real effect at all.",
      ],
      faq: [
        {
          q: "What counts as a statistically significant p-value?",
          a: "The most common threshold is 0.05 (5%) — a p-value below that is conventionally called statistically significant. Some fields use stricter thresholds like 0.01, particularly when false positives carry a higher cost.",
        },
        {
          q: "Should I use a one-tailed or two-tailed p-value?",
          a: "Use two-tailed by default — it's the more conservative, more widely accepted choice and covers surprise in either direction. One-tailed is only appropriate when you have a specific, pre-stated reason to only care about one direction of effect before you look at the data.",
        },
        {
          q: "Does a p-value tell you the probability the null hypothesis is true?",
          a: "No — that's one of the most common misreadings of it. A p-value only measures how surprising the observed data would be if the null hypothesis were true, not the probability that the null hypothesis itself is true or false.",
        },
        {
          q: "What's the relationship between a z-score and a p-value?",
          a: "The z-score measures how many standard deviations a result is from what's expected by chance; the p-value converts that distance into a probability. A larger z-score (further from zero, in either direction) always produces a smaller, more significant p-value.",
        },
      ],
    },
  },
];

export default math2;
