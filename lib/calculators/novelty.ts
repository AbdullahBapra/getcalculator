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
      return {
        results: [{ label: `Checkout for ${score}`, value: checkout.map((d) => d.label).join(" → "), emphasis: true }],
        notes: ["Finishing dart must land on a double (or the bullseye, treated as double 25) per standard darts rules."],
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
      const digits = String(value).padStart(1, "0").split("").map(Number);
      const placeNames = ["Ones", "Tens", "Hundreds", "Thousands", "Ten-Thousands", "Hundred-Thousands", "Millions"];
      const results = digits
        .slice()
        .reverse()
        .map((d, idx) => ({ label: placeNames[idx] ?? `10^${idx}`, value: `${d} bead${d === 1 ? "" : "s"}` }))
        .reverse();
      return { results: [{ label: "Number", value: String(value), emphasis: true }, ...results] };
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
      const pavers = (patioArea / paverAreaSqFt) * (1 + n(i.wastePercent, 10) / 100);
      const gravelCubicYards = (patioArea * n(i.baseDepthIn, 4)) / 12 / 27;
      return {
        results: [
          { label: "Patio Area", value: `${fmtNumber(patioArea, 1)} sq ft` },
          { label: "Pavers Needed", value: fmtNumber(Math.ceil(pavers), 0), emphasis: true },
          { label: "Gravel Base Needed", value: `${fmtNumber(gravelCubicYards, 2)} cubic yards` },
        ],
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
      return {
        results: [
          { label: "Diameter", value: `${fmtNumber(diameter, 2)} mm` },
          { label: "Circumference", value: `${fmtNumber(circumference, 2)} mm` },
          { label: "US Ring Size", value: fmtNumber(usSize, 1), emphasis: true },
          { label: "Approx. EU Size", value: fmtNumber(circumference, 0) },
        ],
        notes: ["An approximation — for an important purchase, measure with a physical ring sizer or have it sized in person."],
      };
    },
    relatedSlugs: [],
  },
];

export default novelty;
