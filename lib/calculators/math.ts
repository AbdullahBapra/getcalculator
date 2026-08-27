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
    content: {
      intro: [
        "Percentages show up long before anyone calls it math class: a shopper working out whether 30% off is actually a better deal than $20 off, a server splitting a bill and adding a tip, a student checking a homework answer against the textbook, a manager reading a spreadsheet that reports growth as a percentage instead of raw numbers. The underlying operation is always the same — comparing a part to a whole, or comparing two wholes to each other — but the phrasing of the question changes depending on what you already know and what you're solving for.",
        "That's why this calculator has three modes instead of one formula box. 'A% of B' answers the most common question — what is 20% of 150. 'A is what % of B' flips it around, for when you know both numbers and want the percentage itself, like figuring out what share of a budget a $340 expense represents. 'Percent change' handles before-and-after comparisons — a price that moved, a stat that grew or shrank — and reports it correctly signed as an increase or decrease.",
        "People land here from a wide range of situations: a student checking arithmetic, a shopper price-comparing, someone tracking a fitness or savings goal expressed as a percentage. The math is genuinely simple once you see which of the three shapes your question is, which is really the point of splitting it out this way.",
      ],
      howItWorks: [
        "'A% of B' is a straight multiplication: convert the percentage to a decimal by dividing by 100, then multiply by B. 20% of 150 becomes (20/100) × 150 = 30.",
        "'A is what % of B' runs that in reverse: divide A by B, then multiply by 100 to express the result as a percentage. If 30 out of 150 people answered yes, that's (30/150) × 100 = 20%.",
        "'Percent change' compares two values relative to the starting one: (B − A) / |A| × 100. Dividing by the absolute value of A keeps the sign meaningful even when A is negative, and a positive result means an increase while a negative result means a decrease. Going from 150 to 180 is a change of (180 − 150)/150 × 100 = 20% — a 20% increase.",
      ],
      faq: [
        {
          q: "How do I calculate a percentage increase?",
          a: "Subtract the original value from the new value, divide that difference by the original value, then multiply by 100. This calculator's 'percent change' mode does exactly this and labels the result as an increase or decrease automatically.",
        },
        {
          q: "What's the difference between percent change and percentage points?",
          a: "Percent change is relative — going from 10% to 15% is a 50% increase relative to the starting 10%. Percentage points is the raw difference — that same move is a 5 percentage point increase. Mixing the two up is one of the most common percentage errors in news reporting and finance.",
        },
        {
          q: "How do I find the original price before a discount?",
          a: "If you know the sale price and the discount percentage, divide the sale price by (1 − discount as a decimal). A $60 item at 25% off means the original price was 60 / 0.75 = $80.",
        },
        {
          q: "How do I convert a fraction to a percentage?",
          a: "Divide the numerator by the denominator, then multiply by 100. 3/8 becomes (3 ÷ 8) × 100 = 37.5%. That's exactly what the 'A is what % of B' mode does with A as the numerator and B as the denominator.",
        },
        {
          q: "Why can a percent change be over 100%?",
          a: "Because percent change is relative to the starting value, not capped at the size of the ending value. Going from 10 to 25 is a 150% increase — the value more than doubled plus a bit more, and the formula just reports that faithfully.",
        },
      ],
    },
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
    content: {
      intro: [
        "Fractions turn up anywhere a whole gets split into parts and the parts need combining: a recipe that needs 2/3 of a cup doubled, a woodworker adding 3/8\" and 5/16\" of lumber thickness, a student working through an algebra problem set that keeps the answer unsimplified until the very last step. Unlike decimals, fractions carry the exact value — 1/3 stays exact where 0.333... doesn't — which is exactly why they're still taught and still used anywhere precision matters.",
        "This calculator handles the four basic operations — add, subtract, multiply, divide — on two fractions, and does the two things that make fraction arithmetic tedious by hand: finding a common denominator for addition and subtraction, and simplifying the result down to lowest terms afterward. It also shows the decimal equivalent, so you can sanity-check the fraction answer against the number you'd get from a plain calculator.",
        "It's built for checking homework against a known operation, converting a recipe or measurement mid-project, or just avoiding a common-denominator mistake when the two denominators don't share an obvious factor.",
      ],
      howItWorks: [
        "Addition and subtraction need a common denominator first. Rather than finding the least common denominator, this calculator uses the reliable general approach: multiply the two denominators together to get a common one, cross-multiply the numerators to match, then simplify at the end. a/b + c/d becomes (a×d + c×b) / (b×d).",
        "Multiplication is the simplest operation — multiply the numerators together and the denominators together, no common denominator needed: (a/b) × (c/d) = (a×c) / (b×d).",
        "Division flips the second fraction and multiplies: (a/b) ÷ (c/d) = (a/b) × (d/c). This works because dividing by a number is the same as multiplying by its reciprocal — flipping c/d to d/c is exactly what 'divide by' means when you're not allowed to divide directly by a fraction.",
        "Every result gets simplified by dividing both the numerator and denominator by their greatest common divisor (GCD), so 6/8 comes back as 3/4 rather than sitting unreduced.",
      ],
      faq: [
        {
          q: "How do you add fractions with different denominators?",
          a: "Rewrite both fractions so they share a common denominator, then add the numerators and keep that denominator. The simplest reliable way is to multiply each numerator by the other fraction's denominator and multiply the denominators together — the calculator's addition mode does exactly this.",
        },
        {
          q: "Why do you flip and multiply to divide fractions?",
          a: "Dividing by a fraction is the same operation as multiplying by its reciprocal, because a/b ÷ c/d asks 'how many c/d fit into a/b,' and multiplying by d/c answers that directly. Flipping c/d to d/c is just applying that equivalence.",
        },
        {
          q: "How do I simplify a fraction to lowest terms?",
          a: "Find the greatest common divisor (GCD) of the numerator and denominator, then divide both by it. 12/18 has a GCD of 6, so it simplifies to 2/3 — the calculator does this automatically on every result.",
        },
        {
          q: "How do I convert an improper fraction to a mixed number?",
          a: "Divide the numerator by the denominator — the whole-number quotient is the mixed number's whole part, and the remainder over the original denominator is the fractional part. 11/4 is 2 remainder 3, so it becomes 2¾.",
        },
        {
          q: "How do I convert a decimal to a fraction?",
          a: "Write the decimal over a power of 10 matching its number of decimal places (0.75 becomes 75/100), then simplify by dividing both numbers by their GCD — 75/100 reduces to 3/4.",
        },
      ],
    },
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
    content: {
      intro: [
        "The quadratic formula is the tool for when factoring an equation like ax² + bx + c = 0 by inspection just isn't happening — the roots aren't nice round numbers, or there's no obvious pair of factors to spot. It shows up constantly in algebra coursework, but also anywhere a relationship is genuinely quadratic: a ball's height over time under gravity, the break-even point of a cost curve with a squared term, or an engineer solving for a dimension in a design equation that reduces to this exact form.",
        "This calculator takes the three coefficients a, b and c and returns both roots, handling all three cases the formula can produce — two distinct real roots, one repeated real root, or a pair of complex roots when the equation never actually crosses the x-axis. It's a fast way to check an answer worked out by hand, or to solve an equation that's too messy to factor confidently.",
      ],
      howItWorks: [
        "The quadratic formula, x = [−b ± √(b² − 4ac)] / 2a, comes from completing the square on the general equation ax² + bx + c = 0. It always produces exactly two solutions because of the ± — one from adding the square root, one from subtracting it.",
        "The expression under the square root, b² − 4ac, is called the discriminant, and its sign alone tells you what kind of roots to expect before you even finish the calculation. A positive discriminant means two distinct real roots (the parabola crosses the x-axis twice). A discriminant of exactly zero means one repeated real root (the parabola just touches the x-axis at its vertex). A negative discriminant means the square root of a negative number, which produces two complex roots — the parabola never touches the x-axis at all.",
      ],
      faq: [
        {
          q: "What does the discriminant tell you?",
          a: "Its sign predicts the type of roots without solving the whole equation: positive means two real roots, zero means one repeated real root, and negative means two complex (non-real) roots.",
        },
        {
          q: "Can a quadratic equation have no real solutions?",
          a: "Yes — whenever the discriminant b² − 4ac is negative. The parabola described by the equation never crosses the x-axis, so the solutions exist only as complex numbers.",
        },
        {
          q: "What happens if a is 0?",
          a: "The equation stops being quadratic and becomes linear (bx + c = 0), which the quadratic formula can't handle since it would require dividing by 2a = 0. Solve bx + c = 0 directly instead: x = −c/b.",
        },
        {
          q: "Is the quadratic formula better than factoring?",
          a: "Factoring is faster when the roots are simple integers or fractions you can spot by inspection, but the quadratic formula always works, even when the roots are irrational, complex, or otherwise messy — it's the reliable fallback when factoring isn't obvious.",
        },
        {
          q: "How are the two roots related to a, b and c?",
          a: "Their sum always equals −b/a and their product always equals c/a, regardless of whether the roots are real or complex. This is a handy way to double-check a quadratic formula result by hand.",
        },
      ],
    },
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
    content: {
      intro: [
        "GCF (greatest common factor) and LCM (least common multiple) solve two opposite kinds of everyday problem. GCF answers 'what's the biggest chunk I can evenly divide this into' — splitting a group of people into equal teams, cutting boards of different lengths into the largest possible identical pieces, or simplifying a fraction down to lowest terms. LCM answers 'when do these cycles line up again' — two events on different repeating schedules, or finding a common denominator to add fractions that don't already share one.",
        "Students meet both constantly in the same unit of math class, and it's easy to mix up which one applies to which kind of question — this calculator computes both at once from the same list of numbers, so you can compare them side by side and see the relationship between them directly.",
      ],
      howItWorks: [
        "GCF is found here using the Euclidean algorithm: repeatedly divide the larger number by the smaller and replace the larger with the remainder, until the remainder hits zero — whatever's left is the GCF. For example, GCD(48, 18): 48 = 2×18 + 12, then 18 = 1×12 + 6, then 12 = 2×6 + 0, so the GCF is 6. It's dramatically faster than listing every factor of both numbers, especially for large ones.",
        "LCM is then built from the GCF using the identity LCM(a, b) = |a × b| / GCD(a, b) — the product of the two numbers, scaled down by whatever they already share. For more than two numbers, both GCF and LCM are computed pairwise, folding each new number into the running result one at a time.",
        "A useful sanity check: the GCF of a list is never larger than the smallest number in it, and the LCM is never smaller than the largest number in it — the GCF divides in, the LCM gets divided into.",
      ],
      faq: [
        {
          q: "What's the difference between GCF and LCM?",
          a: "GCF (greatest common factor) is the largest number that divides evenly into every number in the list. LCM (least common multiple) is the smallest number that every number in the list divides evenly into. They pull in opposite directions — GCF is always ≤ the smallest input, LCM is always ≥ the largest.",
        },
        {
          q: "How do you find the GCF of three or more numbers?",
          a: "Find the GCF of the first two numbers, then find the GCF of that result and the next number, and repeat until every number has been folded in. The final result is the GCF shared by the whole list.",
        },
        {
          q: "Is there a shortcut relating GCF and LCM?",
          a: "For exactly two numbers a and b, GCF(a,b) × LCM(a,b) = a × b. That identity is exactly how this calculator derives the LCM from the GCF instead of computing it from scratch, and it only holds for pairs, not longer lists.",
        },
        {
          q: "Why use the Euclidean algorithm instead of listing factors?",
          a: "Listing every factor of a large number gets slow fast, especially for numbers with no small factors. The Euclidean algorithm finds the GCF in a handful of division steps regardless of how large the numbers are, which is why it's the standard method.",
        },
        {
          q: "How is GCF used to simplify a fraction?",
          a: "Divide both the numerator and denominator by their GCF. For 24/36, the GCF is 12, so dividing both by 12 gives the simplified fraction 2/3 — this is exactly what the fraction calculator does automatically on every result.",
        },
      ],
    },
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
    content: {
      intro: [
        "This is the all-in-one version of the summary statistics students and analysts reach for constantly: mean, median, mode, range, variance and standard deviation, all computed from one list of numbers instead of running six separate calculators. It's the kind of tool that gets used to check a stats homework set, summarize a small survey or experiment's results, or get a quick read on a spreadsheet column without opening actual statistics software.",
        "Every one of these numbers answers a slightly different question about a data set: where's the center (mean, median, mode), how spread out is it (range, variance, standard deviation). Seeing them together, computed from the same data, makes it much easier to spot what each one is actually telling you rather than memorizing definitions in isolation.",
      ],
      howItWorks: [
        "Mean is the plain average: sum every value and divide by the count. Median is the middle value once the data is sorted (or the average of the two middle values, for an even-sized data set) — it ignores extreme values in a way the mean doesn't. Mode is whichever value (or values) appear most often; a data set can have no mode, one mode, or several tied modes.",
        "Variance measures spread by averaging the squared distance of every point from the mean — squaring keeps negative and positive deviations from canceling out, and standard deviation is just the square root of variance, which brings the units back to match the original data instead of squared units.",
        "This calculator reports both the sample standard deviation (dividing by N−1) and the population standard deviation (dividing by N). Sample standard deviation is the one to use almost always in practice, since real data is nearly always a sample of some larger population rather than the population itself — dividing by N−1 instead of N corrects for the fact that a sample tends to slightly underestimate the true spread.",
      ],
      faq: [
        {
          q: "What's the difference between sample and population standard deviation?",
          a: "Population standard deviation divides by N and is used when your data literally is the entire group you care about. Sample standard deviation divides by N−1 and is used when your data is a subset representing a larger population — which is the far more common real-world situation, so it's usually the right one to reach for.",
        },
        {
          q: "Why does a data set sometimes have no mode?",
          a: "If every value in the data set appears exactly once, there's no value that occurs more often than any other, so there's technically no mode. This calculator reports 'None' in that case rather than picking an arbitrary value.",
        },
        {
          q: "When should I use median instead of mean?",
          a: "When the data has outliers or is skewed. A handful of extreme values can drag the mean far from where most of the data actually sits, while the median — being just the middle value — stays much more resistant to that kind of distortion.",
        },
        {
          q: "What's the difference between variance and standard deviation?",
          a: "Variance is the average squared distance from the mean; standard deviation is its square root. Standard deviation is usually more useful for interpretation because it's back in the same units as the original data — variance of a data set measured in dollars would be in dollars squared, which doesn't mean anything intuitive.",
        },
      ],
    },
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
    content: {
      intro: [
        "Standard deviation answers a question the mean alone can't: not just where a data set is centered, but how tightly or loosely the values are clustered around that center. Two classes could both average 75% on a test, but one class might have everyone scoring between 70-80% while the other ranges from 40-100% — the mean is identical, but the standard deviation tells you those are very different distributions.",
        "This shows up anywhere consistency matters as much as the average: a teacher comparing how tightly grouped test scores are, a quality-control check on manufactured parts, an athlete tracking whether their times are becoming more consistent race to race, or a student working through the formula step by step for a statistics class. This calculator reports both population and sample standard deviation, since which one is correct depends on whether your numbers are the entire group of interest or just a sample drawn from it.",
      ],
      howItWorks: [
        "The core formula is σ = √(Σ(x − mean)² / N): for every value, subtract the mean, square that difference (so negative and positive deviations don't cancel out), add up all the squared differences, divide by the count, and take the square root at the end to bring the units back in line with the original data.",
        "The only difference between population and sample standard deviation is the denominator: population divides by N (the full count), while sample divides by N−1. That N−1 is called Bessel's correction, and it exists because a sample's own mean is calculated from the same data being measured, which makes the sample slightly less spread out than the true population — dividing by one fewer point corrects for that bias.",
        "In practice, use sample standard deviation unless your data genuinely is the entire population you care about (every student in a specific class, every unit actually produced) rather than a subset representing something larger.",
      ],
      faq: [
        {
          q: "Should I use population or sample standard deviation?",
          a: "Use sample standard deviation (dividing by N−1) whenever your data is a subset of a larger population, which covers the vast majority of real situations — surveys, experiments, measurements. Use population standard deviation only when your data set literally is every member of the group you're studying.",
        },
        {
          q: "What counts as a 'good' standard deviation?",
          a: "It depends entirely on context and the scale of the data — there's no universal threshold. What matters is comparing it to the mean or to another data set's standard deviation on the same scale; a standard deviation of 5 is tiny for data averaging 1,000 but huge for data averaging 10.",
        },
        {
          q: "How is variance related to standard deviation?",
          a: "Variance is standard deviation squared (or equivalently, standard deviation is the square root of variance). Variance is used in some further statistical calculations, but standard deviation is usually easier to interpret because it shares the same units as the original data.",
        },
        {
          q: "Why does the sample standard deviation come out larger than the population one?",
          a: "Because it divides by N−1 instead of N — dividing the same sum by a smaller number produces a larger result. This built-in inflation compensates for the tendency of a sample to understate the true spread of the full population it was drawn from.",
        },
      ],
    },
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
    content: {
      intro: [
        "Mean, median, mode and range are the four numbers most people actually mean when they say 'the average and the spread' — the quick summary you'd give of a data set without going as far as variance or standard deviation. Students meet them together in the same lesson, and mixing them up (or not knowing which one a question is really asking for) is one of the most common early-stats stumbling blocks.",
        "This calculator computes all four from one list of numbers, which is often exactly what's needed for a homework check, a quick read on a small data set (test scores, prices, measurements), or just remembering the difference between mean and median without having to look it up.",
      ],
      howItWorks: [
        "Mean is the sum of all values divided by how many there are — the single number that 'balances' the data set. Median is the middle value once the data is sorted from smallest to largest (or the average of the two middle values if there's an even number of entries) — it depends only on position, not on how large or small the extreme values are.",
        "Mode is whichever value occurs most frequently; a data set can have no mode (every value unique), one mode, or multiple modes tied for most frequent. Range is simply the largest value minus the smallest — the crudest possible measure of spread, but an easy one to compute and interpret at a glance.",
        "Mean and median agree closely when data is roughly symmetric. When they diverge, it's usually because the mean got pulled toward some unusually high or low values that the median, being purely positional, doesn't react to the same way.",
      ],
      faq: [
        {
          q: "What's the difference between mean and average?",
          a: "They're the same thing — 'average' in everyday language almost always refers to the mean, which is the sum of the values divided by the count. Median and mode are also technically types of average, but 'average' without qualification means the mean.",
        },
        {
          q: "Why would mean and median be very different for the same data?",
          a: "It usually signals the data is skewed by outliers. Income data is the classic example: a handful of very high earners pull the mean well above where most people's actual income sits, while the median — the true middle value — stays representative of a 'typical' person.",
        },
        {
          q: "Can a data set have more than one mode?",
          a: "Yes — if two or more values are tied for the highest frequency, the data set is called bimodal (two modes) or multimodal (more than two). This calculator lists every tied mode rather than picking just one.",
        },
        {
          q: "Is range a reliable measure of spread?",
          a: "Not especially — it only looks at the two most extreme values and ignores everything in between, so a single unusual outlier can make the range misleading. Standard deviation, which factors in every data point, is a much more complete measure of spread.",
        },
      ],
    },
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
    content: {
      intro: [
        "Percent error is the standard way science classes and labs express how far a measured (experimental) result strayed from the accepted (theoretical) value — a student measuring gravitational acceleration and getting 9.7 m/s² instead of the accepted 9.8, or a chemistry class weighing a reaction product against the yield predicted on paper. It turns a raw difference into a percentage, which makes it comparable across completely different kinds of measurements and different scales of the same measurement.",
        "It's used constantly in lab reports specifically because a raw difference like '0.2 off' means very little on its own — 0.2 off of a value near 10 is a big deal, while 0.2 off of a value near 10,000 barely registers. Percent error puts the discrepancy on a consistent scale, and that scale is what actually gets judged against a class's or lab's accuracy expectations.",
      ],
      howItWorks: [
        "The formula is %Error = |experimental − theoretical| / |theoretical| × 100. Subtract the theoretical (accepted) value from the experimental (measured) one, take the absolute value so the sign doesn't matter, divide by the absolute value of the theoretical value to put it on a relative scale, and multiply by 100 to express it as a percentage.",
        "Using the absolute value matters because percent error is meant to describe the size of the discrepancy, not its direction — a measurement that's too high and one that's too low by the same relative amount get the same percent error. If direction matters for your write-up, that's usually reported separately as 'measured high' or 'measured low' alongside the number.",
      ],
      faq: [
        {
          q: "What counts as a good percent error?",
          a: "It depends entirely on the experiment and the precision of the equipment involved — there's no universal cutoff. In an introductory physics lab, under 5% is often considered solid; in high-precision scientific work, even a fraction of a percent might be flagged as too high.",
        },
        {
          q: "Why does the percent error formula use absolute value?",
          a: "So the result reflects the size of the discrepancy regardless of whether the measured value came in too high or too low. Without the absolute value, a measurement that's too low would produce a negative percentage, which is awkward to interpret as an 'error size.'",
        },
        {
          q: "What's the difference between percent error and percent difference?",
          a: "Percent error compares a measured value against a known, accepted 'true' value (used when you're testing accuracy against theory). Percent difference compares two measured values against each other with neither treated as the accepted standard (used when comparing two experimental trials, for instance).",
        },
        {
          q: "Can percent error be negative?",
          a: "Not with the standard formula, since it uses absolute value in the numerator — the result is always zero or positive. If a version of the formula omits the absolute value, a negative result just means the experimental value came in below the theoretical one.",
        },
      ],
    },
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
    content: {
      intro: [
        "Exponents describe repeated multiplication, and once you move past whole-number powers like 2³, the rules get genuinely easy to second-guess — what does a negative exponent do, what does raising something to the power of 0 give you, and what on earth does a fractional exponent even mean. This calculator handles all of it: positive, negative, zero, and fractional exponents, on any base.",
        "It gets used for the straightforward case — checking 2^10 while working through a computer science problem, or verifying compound growth math — as much as for the confusing edge cases, where seeing the actual number the rule produces is often what makes the rule finally click.",
      ],
      howItWorks: [
        "A positive integer exponent means repeated multiplication: 2^4 = 2 × 2 × 2 × 2 = 16. Any nonzero number raised to the power of 0 equals exactly 1 — this isn't an arbitrary convention, it falls directly out of the pattern of dividing consecutive powers (2³/2³ = 2^0 = 1).",
        "A negative exponent means 'take the reciprocal': base^(−n) = 1 / base^n. So 2^(−3) = 1/2³ = 1/8. It's the natural extension of the pattern where each step down in the exponent divides by the base again — 2², 2¹, 2⁰, 2^(−1) is 4, 2, 1, 0.5, each half the last.",
        "A fractional exponent combines a power and a root: base^(a/b) means take the b-th root of base, then raise it to the a-th power (the order doesn't matter, both give the same result). So base^(1/2) is the square root, base^(1/3) is the cube root, and base^(3/2) is the square root of base, cubed.",
      ],
      faq: [
        {
          q: "What does a negative exponent mean?",
          a: "It means take the reciprocal of the positive-exponent version: base^(−n) = 1/base^n. For example, 5^(−2) = 1/5² = 1/25 = 0.04. The negative sign flips it to a fraction, it doesn't make the result negative.",
        },
        {
          q: "What is any number raised to the power of 0?",
          a: "It's always 1, as long as the base isn't 0 itself (0^0 is a special case that's mathematically undefined/context-dependent). This falls out of the pattern of dividing consecutive powers of the same base.",
        },
        {
          q: "What does a fractional exponent mean?",
          a: "It represents a root. base^(1/n) is the nth root of base, so base^(1/2) is a square root and base^(1/3) is a cube root. A fraction like 3/2 in the exponent combines both: take a root, then raise to a power (or the other way around — the result is the same).",
        },
        {
          q: "Why is 0 raised to a negative exponent undefined?",
          a: "Because a negative exponent means taking the reciprocal, and the reciprocal of 0 (1/0) is undefined — division by zero isn't a valid operation, so the expression has no defined value.",
        },
      ],
    },
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
    content: {
      intro: [
        "A root is the inverse of an exponent — instead of asking 'what do you get when you raise this number to a power,' it asks 'what number, raised to this power, gives you the value you started with.' The square root is the familiar one, but cube roots and higher-degree roots follow the exact same idea and show up whenever a problem runs an exponent in reverse: solving for a side length from a known area or volume, or checking algebra homework that involves un-squaring or un-cubing an expression.",
        "This calculator finds the nth root of any value for any degree n, including roots that don't come out to a clean whole number — which is most of them, since perfect squares and perfect cubes are the exception rather than the rule.",
      ],
      howItWorks: [
        "The nth root of a value is the number that, multiplied by itself n times, produces that value. It's computed as value^(1/n) — raising to a fractional exponent is mathematically identical to taking a root, which is why a root calculator and a fractional-exponent calculator are really doing the same operation.",
        "Even roots (square root, 4th root, and so on) of a negative number aren't real numbers — no real number multiplied by itself an even number of times can produce a negative result, since a negative times a negative is always positive. Odd roots (cube root, 5th root) of a negative number are fine and simply come out negative, since a negative multiplied by itself an odd number of times stays negative.",
      ],
      faq: [
        {
          q: "What's the difference between a square root and a cube root?",
          a: "A square root asks what number squared (multiplied by itself twice) gives the value; a cube root asks what number cubed (multiplied by itself three times) gives it. √9 = 3 because 3² = 9; ∛27 = 3 because 3³ = 27.",
        },
        {
          q: "Can you take an even root of a negative number?",
          a: "Not as a real number — no real number squared, or raised to any even power, can produce a negative result. Even roots of negative numbers only exist in the complex number system, which is outside what this calculator handles.",
        },
        {
          q: "How are roots and fractional exponents related?",
          a: "They're the same operation written two ways: the nth root of a value equals that value raised to the power of 1/n. A cube root is the same as raising to the power 1/3, and there's no mathematical difference between the two notations.",
        },
        {
          q: "How can I estimate a square root without a calculator?",
          a: "Find the two perfect squares your number sits between, then interpolate. √50 sits between √49 (=7) and √64 (=8), and since 50 is close to 49, the root should be a bit above 7 — about 7.07, which is in fact the real answer.",
        },
      ],
    },
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
    content: {
      intro: [
        "A logarithm answers the question 'what power do I need to raise this base to, to get this number' — it's the inverse operation of an exponent, the same way a root is, just structured differently: a root solves for the base, a logarithm solves for the exponent. It's a genuinely strange concept the first time it's taught, and it shows up again later in contexts that don't look related at first glance — the pH scale, decibels, earthquake magnitude, and computer science's use of log base 2 to describe how efficiently an algorithm scales.",
        "This calculator computes log base b of any value x, for any valid base, plus the natural log (base e) alongside it, since natural log is what most higher math and science actually uses once you're past an intro course.",
      ],
      howItWorks: [
        "log_b(x) asks 'b raised to what power equals x?' log₁₀(1000) = 3 because 10³ = 1000. This calculator computes it using the change-of-base formula: log_b(x) = ln(x) / ln(b), which works for any base by routing the calculation through natural log.",
        "The natural log, written ln(x), is just log base e, where e (≈2.71828) is a special constant that shows up naturally in continuous growth and decay — compound interest compounded continuously, radioactive decay, population growth models. It's the default 'log' used throughout calculus and most of higher mathematics.",
        "Logarithms are only defined for positive values, and only for a positive base that isn't 1 — you can't raise 1 to any power and get anything other than 1, so log base 1 would have no consistent answer.",
      ],
      faq: [
        {
          q: "What's the difference between log and ln?",
          a: "'log' with no base written usually means base 10 (common log) in everyday math, while 'ln' always specifically means base e, the natural log. They're the same operation with different bases — this calculator can compute either by setting the base to 10 or to e (≈2.71828).",
        },
        {
          q: "Why can't you take the log of zero or a negative number?",
          a: "Because no power of a positive base can ever produce zero or a negative number — a positive base raised to any real exponent always stays positive. Since a logarithm is asking 'what exponent gives this result,' there's no valid answer when the target isn't positive.",
        },
        {
          q: "What is a logarithm used for in real life?",
          a: "Anywhere a scale needs to be compressed because the underlying values span many orders of magnitude — the Richter scale for earthquakes, the decibel scale for sound, the pH scale for acidity, and computer science's use of log base 2 to describe how an algorithm's run time scales with input size.",
        },
        {
          q: "How do you switch between different log bases?",
          a: "Using the change-of-base formula: log_b(x) = log_k(x) / log_k(b) for any convenient base k, usually 10 or e since those are what calculators natively support. This is exactly how this calculator computes a log in any base you enter.",
        },
      ],
    },
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
    content: {
      intro: [
        "Ratios compare two quantities directly — the mix of flour to water in a recipe, the aspect ratio of a photo, paint mixed at a specific proportion, a map's scale of inches to real-world miles. Anywhere something needs to be scaled up or down while keeping the same relationship between its parts, a ratio (or its close cousin, the proportion) is the tool doing the work.",
        "This calculator covers the two most common ratio tasks: simplifying a ratio down to its smallest whole-number form (the way 8:12 is really just 2:3), and solving a proportion — filling in a missing fourth value when two ratios are set equal, like scaling a recipe that serves 4 up to serve 10.",
      ],
      howItWorks: [
        "Simplifying a ratio works exactly like simplifying a fraction: find the greatest common divisor (GCD) of the two numbers and divide both by it. 8:12 has a GCD of 4, so it simplifies to 2:3 — the same underlying proportion, expressed in smaller numbers.",
        "Solving a proportion A:B = C:D for the missing value uses cross-multiplication: since A/B = C/D, multiplying both sides out gives D = (B × C) / A. If a recipe uses a 2:3 ratio of flour to sugar and you're using 5 cups of flour, solving 2:3 = 5:D gives D = (3 × 5) / 2 = 7.5 cups of sugar.",
      ],
      faq: [
        {
          q: "How do you simplify a ratio?",
          a: "Divide both numbers in the ratio by their greatest common divisor (GCD), the same way you'd simplify a fraction. A ratio of 15:25 has a GCD of 5, so it simplifies to 3:5.",
        },
        {
          q: "What's the difference between a ratio and a fraction?",
          a: "A ratio compares two separate quantities (like flour to sugar), while a fraction represents a part out of a whole (like 3 slices out of an 8-slice pizza). They're calculated the same way mathematically, but a ratio doesn't necessarily imply the two numbers add up to some meaningful total the way a fraction's numerator and denominator do.",
        },
        {
          q: "How does cross-multiplication solve a proportion?",
          a: "Setting two ratios equal, A:B = C:D, means A/B = C/D as fractions. Cross-multiplying gives A×D = B×C, and solving that equation for whichever value is unknown gives the answer — this is the standard method for scaling recipes, maps, and any other proportional relationship.",
        },
        {
          q: "How do I scale a recipe using a ratio?",
          a: "Express the recipe's key ingredients as a ratio, then set up a proportion between the original ratio and your target amount for one ingredient, and solve for the rest. If a recipe is a 1:2 ratio of butter to flour and you want to use 3 cups of butter, solving 1:2 = 3:D gives D = 6 cups of flour.",
        },
      ],
    },
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
    content: {
      intro: [
        "Given just the three side lengths of a triangle, this calculator works out everything else — its area, perimeter, and all three interior angles — without needing a height or an angle measurement to start from. That's a common situation in geometry homework, but also in practical measuring: a carpenter or landscaper who's measured three physical sides and needs the angles or area without setting up a protractor.",
        "It uses two classical results that between them solve any triangle from its sides alone: Heron's formula for area, and the law of cosines for the angles.",
      ],
      howItWorks: [
        "Heron's formula finds area from the three sides directly: first compute the semi-perimeter s = (a+b+c)/2, then Area = √(s(s−a)(s−b)(s−c)). It works for any triangle, right or not, without ever needing to know a height.",
        "The law of cosines finds each angle from the three sides: for the angle opposite side a, cos(A) = (b² + c² − a²) / (2bc), and then A itself is the inverse cosine (arccos) of that value. Running this once for each side gives all three angles, and they'll always sum to exactly 180°.",
        "Not every three lengths can actually form a triangle — the triangle inequality requires that any two sides added together must be longer than the third side. If that fails, no triangle exists with those measurements, which is why this calculator checks it before computing anything.",
      ],
      faq: [
        {
          q: "How do you find a triangle's area from just its three sides?",
          a: "Use Heron's formula: compute the semi-perimeter (half the total perimeter), then take the square root of the semi-perimeter times its difference from each of the three sides. No height measurement is needed.",
        },
        {
          q: "What makes three lengths a valid triangle?",
          a: "The triangle inequality: the sum of any two sides must be strictly greater than the third side. If a side is longer than or equal to the sum of the other two, the three lengths can't close into a triangle at all — they'd lie flat or not reach each other.",
        },
        {
          q: "What's the difference between the law of cosines and the law of sines?",
          a: "The law of cosines relates all three sides to one angle, and works when you know three sides (like here) or two sides and the included angle. The law of sines relates sides to the sines of their opposite angles and is used instead when you know two angles and a side, or two sides and a non-included angle.",
        },
        {
          q: "Do a triangle's angles always add up to 180 degrees?",
          a: "Yes, for any triangle on a flat (Euclidean) plane, the three interior angles always sum to exactly 180° — this is a basic geometric fact used here as a check: this calculator finds two angles directly and gets the third by subtracting from 180° rather than recomputing it.",
        },
      ],
    },
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
    content: {
      intro: [
        "The Pythagorean theorem is one of the few pieces of geometry that keeps showing up long after school: a carpenter squaring a corner with the 3-4-5 rule, someone figuring out the diagonal brace needed for a fence or shelf, a TV or monitor's diagonal size measurement, or a hiker estimating a straight-line distance from two perpendicular legs of a route. It only applies to right triangles, but a huge number of practical measuring problems can be set up as one.",
        "This calculator solves both directions: finding the hypotenuse from the two legs, or finding a missing leg when you know the hypotenuse and the other leg — the second case comes up just as often in practice, like knowing a ladder's length and how far its base sits from a wall, and needing to know how high it reaches.",
      ],
      howItWorks: [
        "The theorem states a² + b² = c², where a and b are the two legs of a right triangle and c is the hypotenuse (the side opposite the right angle, always the longest side). To find the hypotenuse: c = √(a² + b²). To find a missing leg when you know the hypotenuse and the other leg: b = √(c² − a²) — the same equation, just rearranged.",
        "Geometrically, the theorem says that a square built on each leg, added together, covers exactly the same area as a square built on the hypotenuse — that's the classic visual proof, and it's also exactly why the formula squares each side before adding.",
      ],
      faq: [
        {
          q: "Does the Pythagorean theorem work on any triangle?",
          a: "No — it only applies to right triangles, ones with a 90° angle. For any other triangle, use the law of cosines instead, which is a more general version that reduces to the Pythagorean theorem exactly when one angle is 90°.",
        },
        {
          q: "How do I find a leg instead of the hypotenuse?",
          a: "Rearrange the formula to b = √(c² − a²), using the hypotenuse and the known leg. This calculator's 'find missing leg' mode does exactly this, and it requires the hypotenuse to be the longest of the two known values, since it's always the longest side of the triangle.",
        },
        {
          q: "What are Pythagorean triples?",
          a: "Sets of three whole numbers that satisfy a² + b² = c² exactly, with no decimals involved — 3-4-5 is the most famous, along with 5-12-13 and 8-15-17. Carpenters use the 3-4-5 triple specifically to check that a corner is a true right angle without any measuring tools beyond a tape measure.",
        },
        {
          q: "What are some real-world uses of the Pythagorean theorem?",
          a: "Squaring corners in construction, finding a TV or monitor's actual screen size from width and height, calculating the shortest straight-line distance between two points that differ in both horizontal and vertical position, and figuring out how far a leaning ladder reaches up a wall.",
        },
      ],
    },
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
    content: {
      intro: [
        "A circle's radius, diameter, circumference and area are all locked to each other by fixed formulas, which means knowing any single one of them is enough to work out all the rest. That's useful anywhere only one measurement is easy to take directly — measuring the distance around a round table (circumference) to find its diameter for a tablecloth, or knowing a pipe's stated diameter and needing its cross-sectional area for a flow calculation.",
        "This calculator takes whichever one of the four values you already know and derives the other three, so there's no need to remember and rearrange four different formulas by hand.",
      ],
      howItWorks: [
        "Everything about a circle flows from the radius r, the distance from the center to the edge. Diameter is simply twice the radius (d = 2r). Circumference, the distance around the circle, is 2πr. Area, the space enclosed, is πr². If you start from something other than the radius, this calculator first solves for r (dividing diameter by 2, dividing circumference by 2π, or taking the square root of area divided by π) and then derives the rest from there.",
        "π (pi) is the fixed ratio between any circle's circumference and its diameter — roughly 3.14159, and the same for every circle regardless of size. It's an irrational number, so it never terminates or repeats, which is why calculations use a rounded approximation rather than an exact value.",
      ],
      faq: [
        {
          q: "How do I find the radius from the circumference?",
          a: "Divide the circumference by 2π. Since circumference = 2πr, solving for r gives r = circumference / (2π). A circle with a 31.4-inch circumference has a radius of about 5 inches.",
        },
        {
          q: "What's the formula for the area of a circle?",
          a: "Area = πr², where r is the radius. Doubling the radius doesn't double the area — it quadruples it, since the radius is squared in the formula.",
        },
        {
          q: "What's the difference between circumference and perimeter?",
          a: "They mean the same thing — the distance around the outside of a shape — but 'circumference' is the term specifically reserved for circles, while 'perimeter' is the general term used for polygons and other shapes.",
        },
        {
          q: "What value of pi does this calculator use?",
          a: "The full double-precision value built into JavaScript's Math.PI (roughly 3.14159265358979), which is far more precise than the 3.14 or 22/7 approximations commonly used by hand, so results here won't drift for larger circles the way hand-rounded pi can.",
        },
      ],
    },
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
    content: {
      intro: [
        "Area calculations turn up constantly outside the classroom: figuring out how much flooring, paint, sod, or fabric to buy for a project, or checking a geometry homework answer against a known formula. Because different shapes need genuinely different formulas — a rectangle's is trivial, a trapezoid's is not — this calculator covers the shapes people actually run into most: rectangle, triangle, circle, and trapezoid.",
        "It's built for the practical case as much as the classroom one — measure a room or a plot of land, pick the closest matching shape, and get an area you can take straight to a hardware store or materials calculator.",
      ],
      howItWorks: [
        "A rectangle's area is simply width × height — the most basic case, and the one every other formula ultimately relates back to. A triangle's area is half of that: ½ × base × height, because any triangle is exactly half of the rectangle (or parallelogram) that would enclose it.",
        "A circle's area is πr², derived from the radius. A trapezoid — a four-sided shape with exactly one pair of parallel sides — uses ½ × (base₁ + base₂) × height, which is really just an averaging trick: it treats the trapezoid as the shape 'between' a rectangle made from the shorter parallel side and one made from the longer one.",
      ],
      faq: [
        {
          q: "How do I find the area of an irregular shape?",
          a: "Break it down into simpler shapes this calculator already covers — rectangles, triangles, circles, trapezoids — calculate each piece's area separately, then add them together (or subtract, for a cut-out section) to get the total.",
        },
        {
          q: "What's the difference between area and perimeter?",
          a: "Area measures the space enclosed inside a shape's boundary, in square units (like square feet). Perimeter measures the total length of the boundary itself, in linear units (like feet). They answer completely different questions — perimeter is how much fencing you need, area is how much sod fills the yard it encloses.",
        },
        {
          q: "How do I convert square feet to square meters?",
          a: "Multiply by 0.0929 (since 1 square foot equals about 0.0929 square meters) — note this isn't the same conversion factor as linear feet to meters, because it's the linear factor applied twice (squared), since area scales with the square of length.",
        },
        {
          q: "Why does the trapezoid formula average the two parallel sides?",
          a: "Because a trapezoid's width changes steadily from one parallel side to the other, its area works out to be the same as a rectangle built from the average of those two widths, times the height between them — that's exactly what ½ × (base₁ + base₂) × height computes.",
        },
      ],
    },
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
    content: {
      intro: [
        "Volume calculations come up anywhere something needs to fill, hold, or be poured into a 3D shape: how much concrete a cylindrical or box-shaped footing needs, how much water a spherical or cylindrical tank holds, how much a shipping box can fit, or a geometry student working through the formulas for cube, box, sphere, cylinder and cone. Every shape has its own formula, and this calculator covers the five that account for nearly every real-world volume question.",
        "Beyond the raw number, seeing how these shapes relate to each other — a cone is always exactly a third of the cylinder that shares its base and height, a sphere is always exactly two-thirds of the cylinder that tightly wraps around it — is often the more useful takeaway, since it means you only really need to remember one formula and derive the others.",
      ],
      howItWorks: [
        "A cube's volume is side³ (the side length multiplied by itself three times), and a rectangular box generalizes that to length × width × height, for when the three dimensions differ. A cylinder's volume is πr²h — the circular base's area (πr²) extended along its height.",
        "A cone's volume is exactly ⅓ × πr²h — one third of a cylinder sharing the same base and height, because a cone tapers to a point instead of keeping a constant cross-section all the way up. A sphere's volume is (4/3)πr³, and it works out to exactly two-thirds of the volume of the tightest-fitting cylinder around it (radius r, height 2r) — a classical result first proven by Archimedes.",
      ],
      faq: [
        {
          q: "How much does a cylindrical tank hold?",
          a: "Use V = πr²h, where r is the tank's inside radius and h is its height (or fill height, if you want the volume at partial fill). A tank with a 1-foot radius and 4-foot height holds about π × 1² × 4 ≈ 12.57 cubic feet.",
        },
        {
          q: "How is a cone's volume related to a cylinder's?",
          a: "A cone is always exactly ⅓ the volume of a cylinder that shares the same base radius and height — no matter the size of either shape. This is a fixed geometric ratio, not an approximation.",
        },
        {
          q: "How is a sphere's volume related to a cylinder's?",
          a: "A sphere's volume is exactly two-thirds of the volume of the cylinder that tightly wraps around it — same radius, and a height equal to the sphere's diameter (2r). This result goes back to Archimedes and is considered one of his most celebrated proofs.",
        },
        {
          q: "How do I convert cubic feet to gallons?",
          a: "Multiply cubic feet by about 7.48 to get US gallons (1 cubic foot ≈ 7.48 gallons). This is a common follow-up step after finding a tank or container's volume in cubic feet, when you actually need the capacity in gallons.",
        },
      ],
    },
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
    content: {
      intro: [
        "Probability shows up in dice games, card games, weather forecasts, and a huge chunk of introductory statistics classes, but the actual arithmetic gets confusing fast once a question involves two events instead of one — should you add the probabilities or multiply them, and does it matter if the events can happen together? This calculator handles both the basic case (favorable outcomes over total outcomes) and the two-event case (AND / OR combinations of independent events).",
        "It's aimed at exactly the situations where people get tripped up: a single dice roll or card draw is usually intuitive, but combining two separate probabilities correctly is where a wrong intuition (adding when you should multiply, or the reverse) most often creeps in.",
      ],
      howItWorks: [
        "A single event's probability is favorable outcomes divided by total possible outcomes, expressed as a percentage — the chance of rolling a 4 on a standard die is 1 favorable outcome out of 6 total, or about 16.7%.",
        "For two independent events (where one happening doesn't affect the other's chances), P(A and B) = P(A) × P(B) — both have to happen, so you multiply. P(A or B) = P(A) + P(B) − P(A)×P(B) — either one happening is enough, so you add them, then subtract the overlap where both happen, since that overlap would otherwise get counted twice.",
        "'Independent' is the key assumption behind these formulas — it means the outcome of one event has zero effect on the probability of the other. Two separate dice rolls are independent; drawing two cards from a deck without replacing the first one is not, since removing a card changes the odds for the second draw.",
      ],
      faq: [
        {
          q: "What's the difference between AND and OR probability?",
          a: "AND (both events happening) multiplies the individual probabilities together, which always makes the combined chance smaller than either alone. OR (at least one event happening) adds the probabilities and then subtracts their overlap, which always makes the combined chance at least as large as either alone.",
        },
        {
          q: "What does 'independent events' mean?",
          a: "It means the outcome of one event doesn't change the probability of the other. Flipping two separate coins is independent; drawing two cards from the same deck without putting the first one back is not, because removing a card shifts the odds for the next draw.",
        },
        {
          q: "Can a probability be over 100%?",
          a: "No — probability is always between 0% (impossible) and 100% (certain). If a calculation produces something outside that range, it usually means an input was entered wrong, like favorable outcomes exceeding total outcomes.",
        },
        {
          q: "What's the complement of a probability?",
          a: "The complement is 'this event does not happen,' and its probability is always 100% minus the event's own probability. If there's a 30% chance of rain, there's a 70% chance it doesn't rain — the two must always add up to 100%.",
        },
      ],
    },
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
    content: {
      intro: [
        "Permutations and combinations both count the number of ways to choose r items from a set of n, but they answer subtly different questions: permutations count arrangements where order matters (who finishes 1st, 2nd, 3rd in a race), while combinations count selections where order doesn't matter (which 3 people get picked for a committee, regardless of the order they're picked in). Mixing the two up is one of the most common mistakes in an introductory statistics or combinatorics course.",
        "This calculator computes both nPr and nCr for the same n and r side by side, which makes the relationship between them — nPr is always nCr multiplied by the number of ways to arrange r items — much easier to see than working with either formula in isolation.",
      ],
      howItWorks: [
        "nPr (permutations) = n! / (n−r)!. The factorial n! means n × (n−1) × (n−2) × ... × 1, the product of every whole number from n down to 1. Dividing by (n−r)! effectively 'stops' the multiplication after r terms, which is exactly what's needed since you're only choosing and arranging r items out of the n available.",
        "nCr (combinations) = n! / (r! × (n−r)!) — it's nPr divided again by r!, the number of ways to arrange those same r chosen items among themselves. Dividing by r! removes the effect of order, which is exactly the difference between counting arrangements and counting selections.",
      ],
      faq: [
        {
          q: "What's the difference between a permutation and a combination?",
          a: "A permutation counts arrangements, where order matters — 1st, 2nd, 3rd place in a race are all different outcomes even with the same three people. A combination counts selections, where order doesn't matter — picking the same 3 people for a committee is one outcome no matter what order they were chosen in.",
        },
        {
          q: "What does the factorial symbol (!) mean?",
          a: "n! means multiply every whole number from n down to 1: 5! = 5×4×3×2×1 = 120. It represents the total number of ways to arrange n distinct items in a row, and by convention 0! is defined as 1.",
        },
        {
          q: "Can you give a real-world example of each?",
          a: "Permutation: assigning gold, silver, and bronze medals to 3 of 10 racers — the same 3 racers in a different order is a different outcome. Combination: choosing 3 of 10 people for a study group — the same 3 people is the same outcome regardless of who was picked first.",
        },
        {
          q: "Why does the combination formula divide by an extra r!?",
          a: "Because nPr already counts every distinct arrangement of the r chosen items separately, and there are exactly r! ways to arrange any given group of r items. Dividing nPr by r! collapses all of those duplicate arrangements back down to a single combination.",
        },
      ],
    },
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
    content: {
      intro: [
        "A z-score converts a raw value into a standardized measure of how far it sits from the mean, expressed in standard deviations rather than in the original units — which makes it possible to compare a test score, a height, or any other measurement against the rest of its distribution, or even against a completely different data set. A z-score of 2 always means 'two standard deviations above average,' whether it's describing an SAT score or a factory part's tolerance.",
        "This shows up constantly in statistics coursework, but also in practical score interpretation — a school reporting where a student's test result falls relative to the class, or a quality-control process flagging a measurement as unusually far from the expected value.",
      ],
      howItWorks: [
        "The formula is z = (x − μ) / σ, where x is the raw value, μ (mu) is the mean, and σ (sigma) is the standard deviation. Subtracting the mean centers the value at zero, and dividing by the standard deviation rescales it so that one full unit of z equals one standard deviation.",
        "Once you have a z-score, the percentile — what fraction of a normally distributed population falls below that value — comes from the standard normal distribution's cumulative distribution function. A z-score of 0 sits at the 50th percentile (right at the mean); a z-score of +1 sits at roughly the 84th percentile; a z-score of −1 sits at roughly the 16th percentile.",
        "This percentile conversion assumes the underlying data is normally distributed (the classic bell curve) — for data that doesn't follow that shape, the z-score is still meaningful as a distance-from-mean measure, but the percentile figure becomes less reliable.",
      ],
      faq: [
        {
          q: "What does a negative z-score mean?",
          a: "It means the value sits below the mean — the more negative, the further below. A z-score of −2 means the value is two standard deviations below average, which corresponds to a low percentile (roughly the 2nd-3rd percentile in a normal distribution).",
        },
        {
          q: "What counts as a 'good' z-score?",
          a: "It depends entirely on what's being measured and what direction is favorable — there's no universal good or bad. A z-score of +2 on a test is great; a z-score of +2 on a defect-rate measurement in manufacturing would be a serious problem.",
        },
        {
          q: "How is a z-score related to percentile?",
          a: "The z-score is converted to a percentile using the standard normal distribution — this calculator does that conversion automatically. A z-score of 0 always lands at the 50th percentile, and roughly 68% of a normal distribution falls between z-scores of −1 and +1.",
        },
        {
          q: "Does the z-score formula work for non-normal data?",
          a: "The z-score itself (how many standard deviations from the mean) is still valid for any distribution shape. But the percentile figure this calculator derives from it specifically relies on the data being normally distributed — for skewed data, that percentile can be noticeably off.",
        },
      ],
    },
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
    content: {
      intro: [
        "Rounding trims a number down to a manageable number of decimal places, which is something almost everyone does casually with money ($19.995 becomes $20.00) and something that becomes a precise, rule-based operation in a math class assignment. Getting it right matters more than it seems — rounding errors compound in spreadsheets and financial calculations, and the exact rule for handling a borderline digit (like whether 2.5 rounds up or down) genuinely varies between contexts.",
        "This calculator rounds a number to any chosen number of decimal places, and shows the round-up and round-down alternatives alongside it, along with the specific digit that determined which way the rounding went.",
      ],
      howItWorks: [
        "The standard 'round half up' rule looks at the digit immediately after the last decimal place you're keeping. If that digit is 5 or higher, the last kept digit rounds up by one; if it's 4 or lower, the last kept digit stays the same. Rounding 3.14159 to 2 decimal places looks at the third decimal digit (1), which is below 5, so it stays 3.14.",
        "'Round up' and 'round down' (shown alongside the standard rounded result) are simpler: round up always moves to the next boundary regardless of the digit, and round down always drops the extra digits regardless of the digit — they're useful for situations like billing, where you specifically need to always round in one direction rather than to the nearest value.",
      ],
      faq: [
        {
          q: "What's the difference between 'round half up' and 'round half to even'?",
          a: "Round half up (used here) always rounds a trailing 5 upward — 2.5 becomes 3. Round half to even, sometimes called banker's rounding, rounds a trailing 5 to whichever neighboring value is even — 2.5 becomes 2, but 3.5 becomes 4. Banker's rounding exists specifically to avoid a consistent upward bias when rounding large volumes of numbers.",
        },
        {
          q: "How do you round a negative number?",
          a: "The same rule applies, just applied to the negative value's magnitude — rounding −2.5 to the nearest whole number using round-half-up gives −3 (rounding away from zero on the tie), following the same logic as the positive case.",
        },
        {
          q: "What's the difference between rounding and truncating?",
          a: "Rounding looks at the next digit and may round the last kept digit up or down to get the closest possible value. Truncating just chops off everything past the desired precision with no adjustment — 3.789 truncated to 1 decimal place is 3.7, while rounded to 1 decimal place it's 3.8.",
        },
        {
          q: "Why does 2.5 round to 3 instead of 2?",
          a: "Under the standard 'round half up' convention used by this calculator, any trailing digit of exactly 5 rounds the previous digit upward. It's a convention, not a mathematical necessity — other rounding rules like round-half-to-even would round 2.5 down to 2 instead, since 2 is the nearer even number.",
        },
      ],
    },
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
    content: {
      intro: [
        "Computers store and process everything in binary, but people rarely think or communicate that way, which is why base conversion — moving a number between binary, octal, decimal and hexadecimal — is a routine task for programmers, computer science students, and anyone working with color codes, memory addresses, or bitwise data. A color like #FF5733 is hexadecimal; a permissions setting like 755 in Unix is octal; both are just decimal numbers wearing a different base's clothing.",
        "This calculator converts a value from any of those four bases into all the others simultaneously, along with a place-value breakdown showing exactly how each digit contributes to the total — useful both for getting a fast answer and for actually understanding how positional number systems work under the hood.",
      ],
      howItWorks: [
        "Every positional number system works the same way, just with a different base: each digit's value is multiplied by the base raised to the power of its position, counting from 0 at the rightmost digit. Decimal 255 is 2×10² + 5×10¹ + 5×10⁰. The same number in binary, 11111111, is 1×2⁷ + 1×2⁶ + ... + 1×2⁰ — eight place values, each a power of 2, all summing to 255.",
        "Hexadecimal (base 16) needs digits beyond 9, so it borrows letters: A=10, B=11, C=12, D=13, E=14, F=15. It's popular in computing specifically because each hex digit maps cleanly onto exactly 4 binary digits (bits), making it a much more compact way to write out binary data than writing the raw 1s and 0s.",
      ],
      faq: [
        {
          q: "What is binary used for?",
          a: "It's the native language of digital electronics — every transistor in a computer is either off or on, which maps directly to 0 and 1. All the number systems above binary (octal, decimal, hex) exist purely for human convenience, since raw binary gets long and hard to read quickly.",
        },
        {
          q: "How do I convert hexadecimal to binary quickly?",
          a: "Convert each hex digit to its 4-bit binary equivalent individually and concatenate them — hex digit A becomes 1010, hex digit 3 becomes 0011, so hex A3 becomes binary 10100011. This shortcut works because 16 is exactly 2⁴, so each hex digit maps to exactly 4 bits.",
        },
        {
          q: "What's the largest single digit in a given base?",
          a: "It's always one less than the base itself — the largest digit in base 10 is 9, in base 8 (octal) it's 7, in base 2 (binary) it's 1, and in base 16 (hex) it's F (which represents 15). Once a digit would reach the base's value, it carries over into the next place instead.",
        },
        {
          q: "Why do computers use binary instead of decimal?",
          a: "Because the underlying hardware — transistors and switches — naturally represents just two reliable states (off/on, low voltage/high voltage), which map perfectly onto binary's two digits. Building reliable hardware for ten distinct voltage states, as decimal would require, is far more complex and error-prone.",
        },
      ],
    },
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
    content: {
      intro: [
        "Scientific notation writes very large or very small numbers as a small coefficient times a power of 10, which is how astronomy, chemistry, and physics keep numbers like the distance to a star or the mass of a molecule readable instead of drowning in zeros. The distance to the sun (about 93,000,000 miles) becomes 9.3 × 10⁷; the mass of a hydrogen atom becomes roughly 1.67 × 10⁻²⁴ grams — same value, far easier to read, compare, and type without miscounting a zero.",
        "This calculator converts in both directions: turning an ordinary number into scientific notation, or turning a coefficient-and-exponent pair back into the full standard number — useful for a chemistry or physics student translating between the two forms, or anyone double-checking a calculator or spreadsheet result that's displaying in scientific notation.",
      ],
      howItWorks: [
        "Converting to scientific notation means rewriting the number as a × 10^b, where a (the coefficient) is between 1 and 10, and b (the exponent) is however many places the decimal point had to move to get there. 123,400,000 becomes 1.234 × 10⁸ — the decimal point moved 8 places to the left to land right after the first nonzero digit.",
        "Converting back from scientific notation reverses that: a × 10^b means shift the decimal point in a by b places — right if b is positive, left if b is negative. 5.2 × 10⁻³ means shifting the decimal 3 places left, giving 0.0052.",
        "The exponent's sign tells you immediately whether the original number was large or small: a positive exponent means the number is 10 or bigger, a negative exponent means it's smaller than 1.",
      ],
      faq: [
        {
          q: "Why use scientific notation instead of writing the full number?",
          a: "It keeps very large or very small numbers compact and far easier to read accurately — miscounting a zero in 0.0000000000523 is easy, but 5.23 × 10⁻¹¹ leaves no room for that kind of error, and it also makes comparing the relative size of two numbers much faster.",
        },
        {
          q: "How do you add two numbers in scientific notation?",
          a: "First convert them to the same power of 10 (adjusting the coefficient as you shift the exponent), then add the coefficients and keep the shared exponent. 3×10⁵ + 2×10⁴ becomes 3×10⁵ + 0.2×10⁵ = 3.2×10⁵, since the exponents have to match before the coefficients can be combined directly.",
        },
        {
          q: "What's the difference between scientific and engineering notation?",
          a: "Scientific notation requires the coefficient to be between 1 and 10. Engineering notation instead requires the exponent to be a multiple of 3, so the coefficient can range up to 1,000 — this keeps the exponent aligned with common unit prefixes like kilo (10³), mega (10⁶), and milli (10⁻³).",
        },
        {
          q: "How do I convert scientific notation back to a normal number?",
          a: "Take the coefficient and shift its decimal point by the number of places shown in the exponent — right for a positive exponent, left for a negative one. 6.02 × 10²³ shifts the decimal 23 places right, producing the full standard number (Avogadro's number, in this case).",
        },
      ],
    },
  },
];

export default math;
