import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { findCheckout, BOGEY_SCORES } from "./darts-helpers";

const novelty: CalculatorDefinition[] = [
  {
    slug: "darts-calculator",
    title: "Darts Scorer & Checkout Calculator",
    category: "everyday",
    shortDescription: "Play a live 501/301 game with running score, bust detection and checkout suggestions.",
    seoDescription: "A live darts scorer for 501 or 301 — enter each turn's score, track the running total with bust detection, and get a valid checkout suggestion.",
    formulaSummary: "Searches dart combinations ending on a double (or bullseye)",
    widget: "darts-scorer",
    fields: [{ name: "score", label: "Remaining Score", type: "number", defaultValue: 170, min: 2, max: 170, step: 1 }],
    calculate: (i) => {
      const score = Math.round(n(i.score, 170));
      const checkout = findCheckout(score);
      if (!checkout) {
        return {
          results: [{ label: "Checkout", value: "Not possible in 3 darts", emphasis: true }],
          notes: BOGEY_SCORES.has(score) ? [`${score} is one of the well-known "bogey numbers" with no 3-dart checkout.`] : ["Score is out of checkout range (must be 2–170)."],
        };
      }
      let remaining = score;
      const growthSeries = checkout.map((dart) => {
        remaining -= dart.value;
        const landed = Math.max(remaining, 0);
        return {
          label: dart.label,
          value: landed,
          displayValue: landed === 0 ? "Checkout! 🎯" : `${landed} left`,
        };
      });
      return {
        results: [{ label: `Checkout for ${score}`, value: checkout.map((d) => d.label).join(" → "), emphasis: true }],
        notes: ["Finishing dart must land on a double (or the bullseye, treated as double 25) per standard darts rules."],
        growthSeries,
        chartCaption:
          checkout.length === 1
            ? `One dart, one double, game over — ${checkout[0].label} takes you straight from ${score} to zero.`
            : `Watch ${score} fall to nothing dart by dart — the last bar always has to land on a double to win the leg.`,
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "online-abacus",
    title: "Online Abacus",
    category: "everyday",
    shortDescription: "A real click-to-count abacus for learning place value.",
    seoDescription: "An interactive click-to-count abacus with columns for ones through millions — click a bead to set its column, or type a number to see it represented.",
    formulaSummary: "Base-10 place value decomposition",
    widget: "abacus",
    fields: [{ name: "value", label: "Number", type: "number", defaultValue: 4527, min: 0, max: 9999999, step: 1 }],
    calculate: (i) => {
      const value = Math.max(0, Math.min(9999999, Math.round(n(i.value, 4527))));
      const digitStr = String(value).padStart(1, "0");
      const digits = digitStr.split("").map(Number);
      const placeNames = ["Ones", "Tens", "Hundreds", "Thousands", "Ten-Thousands", "Hundred-Thousands", "Millions"];
      const results = digits
        .slice()
        .reverse()
        .map((d, idx) => ({ label: placeNames[idx] ?? `10^${idx}`, value: `${d} bead${d === 1 ? "" : "s"}` }))
        .reverse();
      // Every bead's real worth is its digit × its column's place value — a ones bead
      // is worth exactly 1, but that one lonely bead in the thousands column is secretly
      // carrying 1,000. The donut shows which columns are doing the heavy lifting.
      const len = digitStr.length;
      const breakdown = digitStr
        .split("")
        .map((ch, idx) => {
          const d = Number(ch);
          const placeIdx = len - 1 - idx;
          const contribution = d * Math.pow(10, placeIdx);
          return { label: placeNames[placeIdx] ?? `10^${placeIdx}`, value: contribution, displayValue: `${contribution.toLocaleString("en-US")} (${d} bead${d === 1 ? "" : "s"})` };
        })
        .filter((seg) => seg.value > 0);
      const topSegment = breakdown.slice().sort((a, b) => b.value - a.value)[0];
      return {
        results: [{ label: "Number", value: String(value), emphasis: true }, ...results],
        breakdown: breakdown.length > 0 ? breakdown : undefined,
        chartCaption:
          breakdown.length > 0
            ? `A single bead in the ${topSegment.label.toLowerCase()} column is quietly worth more than every other bead on the frame combined — that's place value doing the work.`
            : "Zero beads, zero drama — every column sits empty.",
      };
    },
    relatedSlugs: ["base-converter"],
  },
  {
    slug: "patio-calculator",
    title: "Patio Calculator",
    category: "everyday",
    shortDescription: "Calculate the pavers and base material needed for a patio.",
    seoDescription: "Calculate the number of pavers and cubic yards of gravel base needed for a patio given its size and paver dimensions.",
    formulaSummary: "Pavers = patio area ÷ paver area × (1 + waste%)",
    fields: [
      { name: "lengthFt", label: "Patio Length", type: "number", unit: "ft", defaultValue: 16, min: 0 },
      { name: "widthFt", label: "Patio Width", type: "number", unit: "ft", defaultValue: 12, min: 0 },
      { name: "paverLengthIn", label: "Paver Length", type: "number", unit: "in", defaultValue: 12, min: 1 },
      { name: "paverWidthIn", label: "Paver Width", type: "number", unit: "in", defaultValue: 12, min: 1 },
      { name: "wastePercent", label: "Waste Factor", type: "number", unit: "%", defaultValue: 10, min: 0, max: 50 },
      { name: "baseDepthIn", label: "Gravel Base Depth", type: "number", unit: "in", defaultValue: 4, min: 0 },
    ],
    calculate: (i) => {
      const patioArea = n(i.lengthFt, 16) * n(i.widthFt, 12);
      const paverAreaSqFt = (n(i.paverLengthIn, 12) * n(i.paverWidthIn, 12)) / 144;
      const basePavers = patioArea / paverAreaSqFt;
      const pavers = basePavers * (1 + n(i.wastePercent, 10) / 100);
      const wastePavers = Math.max(pavers - basePavers, 0);
      const gravelCubicYards = (patioArea * n(i.baseDepthIn, 4)) / 12 / 27;
      const wastePercent = n(i.wastePercent, 10);
      return {
        results: [
          { label: "Patio Area", value: `${fmtNumber(patioArea, 1)} sq ft` },
          { label: "Pavers Needed", value: fmtNumber(Math.ceil(pavers), 0), emphasis: true },
          { label: "Gravel Base Needed", value: `${fmtNumber(gravelCubicYards, 2)} cubic yards` },
        ],
        // Not "parts of a whole" in a dollars sense, but genuinely two slices of one
        // pallet order: the pavers that actually cover ground, and the extra stack
        // you buy purely so a bad cut or a dropped paver doesn't stop the job.
        breakdown: [
          { label: "Pavers that cover the patio", value: basePavers, displayValue: `${fmtNumber(Math.ceil(basePavers), 0)} pavers` },
          { label: "Extra for cuts & breakage", value: wastePavers, displayValue: `${fmtNumber(Math.ceil(wastePavers), 0)} pavers` },
        ],
        chartCaption: `About ${fmtNumber(wastePercent, 0)}% of the order you're buying is pure insurance — for the edge cuts, the mismeasure, and the one paver everyone drops.`,
      };
    },
    relatedSlugs: ["tile-calculator", "gravel-calculator"],
  },
  {
    slug: "ring-size-converter",
    title: "Ring Size Converter",
    category: "everyday",
    shortDescription: "Convert between ring diameter, circumference and US ring size.",
    seoDescription: "Convert a ring's inner diameter or circumference in millimeters to a US ring size, and an approximate EU size.",
    formulaSummary: "US size ≈ (diameter mm − 11.63) ÷ 0.8128 + 1",
    fields: [
      { name: "mode", label: "I Know the", type: "select", defaultValue: "diameter", options: [{ value: "diameter", label: "Inner Diameter (mm)" }, { value: "circumference", label: "Circumference (mm)" }] },
      { name: "diameterMm", label: "Inner Diameter", type: "number", unit: "mm", defaultValue: 17.3, step: 0.1, min: 10, showIf: (i) => i.mode !== "circumference" },
      { name: "circumferenceMm", label: "Circumference", type: "number", unit: "mm", defaultValue: 54.4, step: 0.1, min: 30, showIf: (i) => i.mode === "circumference" },
    ],
    calculate: (i) => {
      const diameter = i.mode === "circumference" ? n(i.circumferenceMm, 54.4) / Math.PI : n(i.diameterMm, 17.3);
      const circumference = diameter * Math.PI;
      const usSize = (diameter - 11.63) / 0.8128 + 1;
      const clampedSize = Math.max(3, Math.min(13, usSize));
      let sizeZone = "Bold & Statement";
      if (usSize < 5) sizeZone = "Petite";
      else if (usSize < 7) sizeZone = "Snug Classic";
      else if (usSize < 9) sizeZone = "Everyday Standard";
      else if (usSize < 11) sizeZone = "Generous Fit";
      return {
        results: [
          { label: "Diameter", value: `${fmtNumber(diameter, 2)} mm` },
          { label: "Circumference", value: `${fmtNumber(circumference, 2)} mm` },
          { label: "US Ring Size", value: fmtNumber(usSize, 1), emphasis: true },
          { label: "Approx. EU Size", value: fmtNumber(circumference, 0) },
        ],
        notes: ["An approximation — for an important purchase, measure with a physical ring sizer or have it sized in person."],
        gauge: {
          value: clampedSize,
          min: 3,
          max: 13,
          valueLabel: fmtNumber(usSize, 1),
          zones: [
            { label: "Petite", to: 5, barClass: "bg-pink-400 dark:bg-pink-500", textClass: "text-pink-600 dark:text-pink-400" },
            { label: "Snug Classic", to: 7, barClass: "bg-violet-400 dark:bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
            { label: "Everyday Standard", to: 9, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Generous Fit", to: 11, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Bold & Statement", to: 13, barClass: "bg-orange-500 dark:bg-orange-400", textClass: "text-orange-600 dark:text-orange-400" },
          ],
        },
        chartCaption:
          sizeZone === "Everyday Standard"
            ? `Size ${fmtNumber(usSize, 1)} sits right in the "${sizeZone}" zone — the most common sizes jewelers keep sitting on the shelf.`
            : sizeZone === "Petite" || sizeZone === "Bold & Statement"
              ? `Size ${fmtNumber(usSize, 1)} sits out at the "${sizeZone}" end of the spectrum — lovely, but expect more resizing or special-order waits than a middle-of-the-road size.`
              : `Size ${fmtNumber(usSize, 1)} lands in the "${sizeZone}" zone — comfortably common, easy to size or resize.`,
      };
    },
    relatedSlugs: [],
  },
];

export default novelty;
