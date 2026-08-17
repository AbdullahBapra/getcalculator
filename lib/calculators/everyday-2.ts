import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";

function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

// AWG copper wire resistance, ohms per 1000 feet (single conductor).
const AWG_RESISTANCE: Record<string, number> = { "20": 10.15, "18": 6.385, "16": 4.016, "14": 2.525, "12": 1.588, "10": 0.999, "8": 0.6282, "6": 0.3951 };

const ELEMENTS: Record<string, number> = {
  H: 1.008, He: 4.0026, Li: 6.94, Be: 9.0122, B: 10.81, C: 12.011, N: 14.007, O: 15.999, F: 18.998, Ne: 20.18,
  Na: 22.99, Mg: 24.305, Al: 26.982, Si: 28.085, P: 30.974, S: 32.06, Cl: 35.45, Ar: 39.948, K: 39.098, Ca: 40.078,
  Fe: 55.845, Cu: 63.546, Zn: 65.38, Ag: 107.868, Au: 196.967, Br: 79.904, I: 126.904, Mn: 54.938, Ti: 47.867,
  Ni: 58.693, Pb: 207.2, Sn: 118.71, Hg: 200.59, Cr: 51.996, Co: 58.933, Ba: 137.327, Sr: 87.62, Cs: 132.905,
};

function molecularWeight(formula: string): { mw: number; breakdown: string[] } | null {
  const re = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  let mw = 0;
  const breakdown: string[] = [];
  let consumed = 0;
  while ((match = re.exec(formula)) !== null) {
    if (match[0] === "") { re.lastIndex++; continue; }
    consumed += match[0].length;
    const symbol = match[1];
    const count = match[2] ? parseInt(match[2], 10) : 1;
    const weight = ELEMENTS[symbol];
    if (weight === undefined) return null;
    mw += weight * count;
    breakdown.push(`${symbol}${count > 1 ? count : ""}: ${fmtNumber(weight * count, 3)}`);
  }
  if (consumed !== formula.length || breakdown.length === 0) return null;
  return { mw, breakdown };
}

function toRoman(num: number): string {
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let result = "";
  let remaining = num;
  for (const [value, symbol] of table) {
    while (remaining >= value) { result += symbol; remaining -= value; }
  }
  return result;
}
function fromRoman(roman: string): number | null {
  const map: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  const s = roman.toUpperCase().trim();
  if (!/^[IVXLCDM]+$/.test(s)) return null;
  let total = 0;
  for (let idx = 0; idx < s.length; idx++) {
    const cur = map[s[idx]];
    const next = map[s[idx + 1]];
    if (next && cur < next) total -= cur;
    else total += cur;
  }
  return total;
}

function utf8SafeEncode(text: string): string {
  return btoa(unescape(encodeURIComponent(text)));
}
function utf8SafeDecode(b64: string): string {
  return decodeURIComponent(escape(atob(b64)));
}

const everyday2: CalculatorDefinition[] = [
  {
    slug: "time-calculator",
    title: "Time Calculator",
    category: "everyday",
    shortDescription: "Add or subtract two time durations (hours, minutes, seconds).",
    seoDescription: "Add or subtract two durations given in hours, minutes and seconds.",
    formulaSummary: "Total seconds converted back to h:m:s",
    fields: [
      { name: "h1", label: "Hours", type: "number", defaultValue: 2, min: 0 },
      { name: "m1", label: "Minutes", type: "number", defaultValue: 30, min: 0, max: 59 },
      { name: "s1", label: "Seconds", type: "number", defaultValue: 0, min: 0, max: 59 },
      { name: "op", label: "Operation", type: "select", defaultValue: "+", options: [{ value: "+", label: "+" }, { value: "-", label: "−" }] },
      { name: "h2", label: "Hours", type: "number", defaultValue: 1, min: 0 },
      { name: "m2", label: "Minutes", type: "number", defaultValue: 45, min: 0, max: 59 },
      { name: "s2", label: "Seconds", type: "number", defaultValue: 0, min: 0, max: 59 },
    ],
    calculate: (i) => {
      const t1 = n(i.h1) * 3600 + n(i.m1) * 60 + n(i.s1);
      const t2 = n(i.h2) * 3600 + n(i.m2) * 60 + n(i.s2);
      let total = i.op === "-" ? t1 - t2 : t1 + t2;
      const negative = total < 0;
      total = Math.abs(total);
      const h = Math.floor(total / 3600);
      const m = Math.floor((total % 3600) / 60);
      const s = Math.round(total % 60);
      return { results: [{ label: "Result", value: `${negative ? "-" : ""}${h}h ${m}m ${s}s`, emphasis: true }] };
    },
    relatedSlugs: ["time-duration-calculator"],
  },
  {
    slug: "height-calculator",
    title: "Height Predictor Calculator",
    category: "everyday",
    shortDescription: "Predict a child's approximate adult height from parents' heights.",
    seoDescription: "Predict a child's approximate adult height using the mid-parental height method.",
    formulaSummary: "Boys: (mother+father)/2 + 6.5cm · Girls: (mother+father)/2 − 6.5cm",
    fields: [
      { name: "childSex", label: "Child's Sex", type: "select", defaultValue: "male", options: [{ value: "male", label: "Male" }, { value: "female", label: "Female" }] },
      { name: "motherCm", label: "Mother's Height", type: "number", unit: "cm", defaultValue: 165, min: 100 },
      { name: "fatherCm", label: "Father's Height", type: "number", unit: "cm", defaultValue: 180, min: 100 },
    ],
    calculate: (i) => {
      const avg = (n(i.motherCm, 165) + n(i.fatherCm, 180)) / 2;
      const predicted = i.childSex === "female" ? avg - 6.5 : avg + 6.5;
      return {
        results: [{ label: "Predicted Adult Height", value: `${fmtNumber(predicted, 1)} cm (${fmtNumber(predicted / 2.54, 1)} in)`, emphasis: true }],
        notes: ["A rough population-average estimate (mid-parental height method) — actual adult height varies ±8.5cm even within this method's expected range."],
      };
    },
    relatedSlugs: ["bmi-calculator"],
  },
  {
    slug: "concrete-calculator",
    title: "Concrete Calculator",
    category: "everyday",
    shortDescription: "Calculate how much concrete (in cubic yards and bags) you need for a slab.",
    seoDescription: "Calculate the cubic yards of concrete and number of pre-mix bags needed for a slab, footing or column.",
    formulaSummary: "Volume = length × width × thickness",
    fields: [
      { name: "lengthFt", label: "Length", type: "number", unit: "ft", defaultValue: 10, min: 0 },
      { name: "widthFt", label: "Width", type: "number", unit: "ft", defaultValue: 10, min: 0 },
      { name: "thicknessIn", label: "Thickness", type: "number", unit: "in", defaultValue: 4, min: 0 },
    ],
    calculate: (i) => {
      const cubicFt = n(i.lengthFt, 10) * n(i.widthFt, 10) * (n(i.thicknessIn, 4) / 12);
      const cubicYards = cubicFt / 27;
      const bags80lb = cubicFt / 0.6;
      const bags60lb = cubicFt / 0.45;
      return {
        results: [
          { label: "Concrete Needed", value: `${fmtNumber(cubicYards, 2)} cubic yards`, emphasis: true },
          { label: "80 lb Bags", value: fmtNumber(Math.ceil(bags80lb), 0) },
          { label: "60 lb Bags", value: fmtNumber(Math.ceil(bags60lb), 0) },
        ],
      };
    },
    relatedSlugs: ["square-footage-calculator", "gravel-calculator"],
  },
  {
    slug: "bra-size-calculator",
    title: "Bra Size Calculator",
    category: "everyday",
    shortDescription: "Estimate your bra size from band and bust measurements.",
    seoDescription: "Estimate your bra band size and cup size from your underbust and bust measurements in inches.",
    formulaSummary: "Cup size from bust − band difference",
    fields: [
      { name: "underbustIn", label: "Underbust (Band)", type: "number", unit: "in", defaultValue: 32, min: 20 },
      { name: "bustIn", label: "Bust (fullest point)", type: "number", unit: "in", defaultValue: 36, min: 20 },
    ],
    calculate: (i) => {
      let band = Math.round(n(i.underbustIn, 32));
      if (band % 2 !== 0) band += 1;
      const diff = Math.round(n(i.bustIn, 36) - n(i.underbustIn, 32));
      const cups = ["AA", "A", "B", "C", "D", "DD/E", "DDD/F", "G", "H", "I", "J"];
      const cup = cups[Math.max(0, Math.min(cups.length - 1, diff))];
      return { results: [{ label: "Estimated Bra Size", value: `${band}${cup}`, emphasis: true }] };
    },
    relatedSlugs: ["shoe-size-conversion"],
  },
  {
    slug: "fuel-cost-calculator",
    title: "Fuel Cost Calculator",
    category: "everyday",
    shortDescription: "Calculate the fuel cost for a trip.",
    seoDescription: "Calculate the total fuel cost for a trip based on distance, fuel efficiency (mpg) and fuel price.",
    formulaSummary: "Cost = (distance ÷ mpg) × price per gallon",
    fields: [
      { name: "distance", label: "Trip Distance", type: "number", unit: "miles", defaultValue: 300, min: 0 },
      { name: "mpg", label: "Fuel Efficiency", type: "number", unit: "mpg", defaultValue: 28, min: 0.1 },
      { name: "pricePerGallon", label: "Fuel Price", type: "number", unit: "$/gal", defaultValue: 3.5, step: 0.01, min: 0 },
    ],
    calculate: (i) => {
      const gallons = n(i.distance, 300) / n(i.mpg, 28);
      const cost = gallons * n(i.pricePerGallon, 3.5);
      return {
        results: [
          { label: "Fuel Needed", value: `${fmtNumber(gallons, 2)} gallons` },
          { label: "Total Fuel Cost", value: `$${fmtNumber(cost, 2)}`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["gas-mileage-calculator", "mileage-calculator"],
  },
  {
    slug: "gas-mileage-calculator",
    title: "Gas Mileage Calculator",
    category: "everyday",
    shortDescription: "Calculate your car's fuel economy (MPG) from miles driven and gallons used.",
    seoDescription: "Calculate your vehicle's fuel economy in miles per gallon from miles driven and gallons of fuel used.",
    formulaSummary: "MPG = miles driven ÷ gallons used",
    fields: [
      { name: "miles", label: "Miles Driven", type: "number", defaultValue: 320, min: 0 },
      { name: "gallons", label: "Gallons Used", type: "number", defaultValue: 11.5, min: 0.01 },
    ],
    calculate: (i) => {
      const mpg = n(i.miles, 320) / n(i.gallons, 11.5);
      return { results: [{ label: "Fuel Economy", value: `${fmtNumber(mpg, 2)} MPG`, emphasis: true }] };
    },
    relatedSlugs: ["fuel-cost-calculator"],
  },
  {
    slug: "mileage-calculator",
    title: "Mileage Reimbursement Calculator",
    category: "everyday",
    shortDescription: "Calculate business mileage reimbursement.",
    seoDescription: "Calculate business travel mileage reimbursement using the standard IRS mileage rate or a custom rate.",
    formulaSummary: "Reimbursement = miles × rate per mile",
    fields: [
      { name: "miles", label: "Miles Driven", type: "number", defaultValue: 150, min: 0 },
      { name: "ratePerMile", label: "Rate Per Mile", type: "number", unit: "$", defaultValue: 0.67, step: 0.01, min: 0, help: "2024 IRS standard business rate: $0.67/mile" },
    ],
    calculate: (i) => {
      const reimbursement = n(i.miles, 150) * n(i.ratePerMile, 0.67);
      return { results: [{ label: "Reimbursement", value: `$${fmtNumber(reimbursement, 2)}`, emphasis: true }] };
    },
    relatedSlugs: ["fuel-cost-calculator"],
  },
  {
    slug: "horsepower-calculator",
    title: "Horsepower Calculator",
    category: "everyday",
    shortDescription: "Calculate horsepower from torque and engine RPM.",
    seoDescription: "Calculate horsepower from torque (lb-ft) and engine RPM.",
    formulaSummary: "HP = torque × RPM ÷ 5252",
    fields: [
      { name: "torque", label: "Torque", type: "number", unit: "lb-ft", defaultValue: 300, min: 0 },
      { name: "rpm", label: "RPM", type: "number", defaultValue: 5252, min: 0 },
    ],
    calculate: (i) => {
      const hp = (n(i.torque, 300) * n(i.rpm, 5252)) / 5252;
      return { results: [{ label: "Horsepower", value: `${fmtNumber(hp, 1)} hp`, emphasis: true }], formula: "HP = torque × RPM ÷ 5252" };
    },
    relatedSlugs: ["engine-horsepower-calculator"],
  },
  {
    slug: "engine-horsepower-calculator",
    title: "Engine Horsepower Calculator (Trap Speed)",
    category: "everyday",
    shortDescription: "Estimate engine horsepower from vehicle weight and quarter-mile trap speed.",
    seoDescription: "Estimate engine horsepower from vehicle weight and its quarter-mile trap speed.",
    formulaSummary: "HP = weight × (trap speed ÷ 234)³",
    fields: [
      { name: "weight", label: "Vehicle Weight", type: "number", unit: "lb", defaultValue: 3400, min: 0 },
      { name: "trapSpeed", label: "Quarter-Mile Trap Speed", type: "number", unit: "mph", defaultValue: 95, min: 0 },
    ],
    calculate: (i) => {
      const hp = n(i.weight, 3400) * Math.pow(n(i.trapSpeed, 95) / 234, 3);
      return { results: [{ label: "Estimated Horsepower", value: `${fmtNumber(hp, 0)} hp`, emphasis: true }] };
    },
    relatedSlugs: ["horsepower-calculator"],
  },
  {
    slug: "tire-size-calculator",
    title: "Tire Size Calculator",
    category: "everyday",
    shortDescription: "Compare the overall diameter of two tire sizes.",
    seoDescription: "Compare the overall diameter and speedometer difference between two tire sizes (width/aspect ratio/rim diameter).",
    formulaSummary: "Diameter = rim(in) + 2 × (width × aspect% ÷ 25.4)",
    fields: [
      { name: "width1", label: "Tire 1 Width", type: "number", unit: "mm", defaultValue: 225, min: 100 },
      { name: "aspect1", label: "Tire 1 Aspect Ratio", type: "number", unit: "%", defaultValue: 50, min: 20 },
      { name: "rim1", label: "Tire 1 Rim", type: "number", unit: "in", defaultValue: 17, min: 10 },
      { name: "width2", label: "Tire 2 Width", type: "number", unit: "mm", defaultValue: 235, min: 100 },
      { name: "aspect2", label: "Tire 2 Aspect Ratio", type: "number", unit: "%", defaultValue: 45, min: 20 },
      { name: "rim2", label: "Tire 2 Rim", type: "number", unit: "in", defaultValue: 18, min: 10 },
    ],
    calculate: (i) => {
      const diameter = (w: number, a: number, r: number) => r + (2 * (w * (a / 100))) / 25.4;
      const d1 = diameter(n(i.width1, 225), n(i.aspect1, 50), n(i.rim1, 17));
      const d2 = diameter(n(i.width2, 235), n(i.aspect2, 45), n(i.rim2, 18));
      const pctDiff = ((d2 - d1) / d1) * 100;
      return {
        results: [
          { label: "Tire 1 Diameter", value: `${fmtNumber(d1, 2)} in` },
          { label: "Tire 2 Diameter", value: `${fmtNumber(d2, 2)} in` },
          { label: "Difference", value: `${pctDiff >= 0 ? "+" : ""}${fmtNumber(pctDiff, 2)}%`, emphasis: true },
        ],
        notes: [Math.abs(pctDiff) > 3 ? "A difference over ~3% can noticeably throw off your speedometer and odometer accuracy." : "This difference is small enough to be within the typical acceptable range."],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "stair-calculator",
    title: "Stair Calculator",
    category: "everyday",
    shortDescription: "Calculate the number of steps, riser height and stringer length for a staircase.",
    seoDescription: "Calculate the number of steps, riser height, tread depth and stringer length for a staircase given total rise.",
    formulaSummary: "Riser height = total rise ÷ number of steps",
    fields: [
      { name: "totalRiseIn", label: "Total Rise", type: "number", unit: "in", defaultValue: 108, min: 1 },
      { name: "treadDepthIn", label: "Tread Depth", type: "number", unit: "in", defaultValue: 10, min: 6 },
      { name: "maxRiserIn", label: "Max Riser Height (code limit)", type: "number", unit: "in", defaultValue: 7.5, min: 4 },
    ],
    calculate: (i) => {
      const totalRise = n(i.totalRiseIn, 108);
      const numSteps = Math.ceil(totalRise / n(i.maxRiserIn, 7.5));
      const riserHeight = totalRise / numSteps;
      const totalRun = (numSteps - 1) * n(i.treadDepthIn, 10);
      const stringerLength = Math.sqrt(totalRise * totalRise + totalRun * totalRun);
      return {
        results: [
          { label: "Number of Steps", value: fmtNumber(numSteps, 0), emphasis: true },
          { label: "Riser Height", value: `${fmtNumber(riserHeight, 2)} in` },
          { label: "Total Run", value: `${fmtNumber(totalRun, 1)} in` },
          { label: "Stringer Length", value: `${fmtNumber(stringerLength / 12, 2)} ft` },
        ],
      };
    },
    relatedSlugs: ["roofing-calculator"],
  },
  {
    slug: "resistor-calculator",
    title: "Resistor Color Code Calculator",
    category: "everyday",
    shortDescription: "Decode a 4-band resistor color code into its resistance value.",
    seoDescription: "Convert a 4-band resistor color code into its resistance value and tolerance.",
    formulaSummary: "Resistance = (10×digit1 + digit2) × 10^multiplier",
    fields: [
      { name: "band1", label: "Band 1 (1st digit)", type: "select", defaultValue: "brown", options: ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
      { name: "band2", label: "Band 2 (2nd digit)", type: "select", defaultValue: "black", options: ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
      { name: "band3", label: "Band 3 (multiplier)", type: "select", defaultValue: "red", options: ["black", "brown", "red", "orange", "yellow", "green", "blue", "gold", "silver"].map((c) => ({ value: c, label: c[0].toUpperCase() + c.slice(1) })) },
      { name: "band4", label: "Band 4 (tolerance)", type: "select", defaultValue: "gold", options: [{ value: "gold", label: "Gold (±5%)" }, { value: "silver", label: "Silver (±10%)" }, { value: "brown", label: "Brown (±1%)" }, { value: "red", label: "Red (±2%)" }] },
    ],
    calculate: (i) => {
      const digits: Record<string, number> = { black: 0, brown: 1, red: 2, orange: 3, yellow: 4, green: 5, blue: 6, violet: 7, gray: 8, white: 9 };
      const multipliers: Record<string, number> = { black: 1, brown: 10, red: 100, orange: 1000, yellow: 10000, green: 100000, blue: 1000000, gold: 0.1, silver: 0.01 };
      const tolerances: Record<string, string> = { gold: "±5%", silver: "±10%", brown: "±1%", red: "±2%" };
      const value = (digits[i.band1] * 10 + digits[i.band2]) * multipliers[i.band3];
      return {
        results: [
          { label: "Resistance", value: value >= 1000 ? `${fmtNumber(value / 1000, 2)} kΩ` : `${fmtNumber(value, 2)} Ω`, emphasis: true },
          { label: "Tolerance", value: tolerances[i.band4] ?? "±5%" },
        ],
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
  },
  {
    slug: "ohms-law-calculator",
    title: "Ohm's Law Calculator",
    category: "everyday",
    shortDescription: "Solve for voltage, current or resistance using Ohm's Law.",
    seoDescription: "Solve for voltage, current or resistance in a circuit using Ohm's Law (V = I × R).",
    formulaSummary: "V = I × R",
    fields: [
      { name: "solveFor", label: "Solve For", type: "select", defaultValue: "voltage", options: [{ value: "voltage", label: "Voltage (V)" }, { value: "current", label: "Current (I)" }, { value: "resistance", label: "Resistance (R)" }] },
      { name: "voltage", label: "Voltage", type: "number", unit: "V", defaultValue: 12, min: 0, showIf: (i) => i.solveFor !== "voltage" },
      { name: "current", label: "Current", type: "number", unit: "A", defaultValue: 2, min: 0, showIf: (i) => i.solveFor !== "current" },
      { name: "resistance", label: "Resistance", type: "number", unit: "Ω", defaultValue: 6, min: 0, showIf: (i) => i.solveFor !== "resistance" },
    ],
    calculate: (i) => {
      if (i.solveFor === "current") {
        const val = n(i.voltage, 12) / n(i.resistance, 6);
        return { results: [{ label: "Current", value: `${fmtNumber(val, 4)} A`, emphasis: true }] };
      }
      if (i.solveFor === "resistance") {
        const val = n(i.voltage, 12) / n(i.current, 2);
        return { results: [{ label: "Resistance", value: `${fmtNumber(val, 4)} Ω`, emphasis: true }] };
      }
      const val = n(i.current, 2) * n(i.resistance, 6);
      return { results: [{ label: "Voltage", value: `${fmtNumber(val, 4)} V`, emphasis: true }] };
    },
    relatedSlugs: ["resistor-calculator", "electricity-calculator"],
  },
  {
    slug: "electricity-calculator",
    title: "Electricity Cost Calculator",
    category: "everyday",
    shortDescription: "Calculate the running cost of an electrical appliance.",
    seoDescription: "Calculate the energy usage (kWh) and monthly cost of running an electrical appliance.",
    formulaSummary: "kWh = watts × hours ÷ 1000",
    fields: [
      { name: "watts", label: "Power Draw", type: "number", unit: "watts", defaultValue: 1500, min: 0 },
      { name: "hoursPerDay", label: "Hours Used Per Day", type: "number", defaultValue: 3, min: 0, max: 24 },
      { name: "costPerKwh", label: "Electricity Rate", type: "number", unit: "$/kWh", defaultValue: 0.16, step: 0.01, min: 0 },
    ],
    calculate: (i) => {
      const kwhPerDay = (n(i.watts, 1500) * n(i.hoursPerDay, 3)) / 1000;
      const monthlyCost = kwhPerDay * 30 * n(i.costPerKwh, 0.16);
      return {
        results: [
          { label: "Daily Energy Use", value: `${fmtNumber(kwhPerDay, 2)} kWh` },
          { label: "Estimated Monthly Cost", value: `$${fmtNumber(monthlyCost, 2)}`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
  },
  {
    slug: "voltage-drop-calculator",
    title: "Voltage Drop Calculator",
    category: "everyday",
    shortDescription: "Calculate voltage drop across a wire run for a given gauge and load.",
    seoDescription: "Calculate the voltage drop and percentage drop across a copper wire run given its gauge, length and current.",
    formulaSummary: "Vdrop = 2 × length × current × (Ω/1000ft) ÷ 1000",
    fields: [
      { name: "gauge", label: "Wire Gauge (AWG)", type: "select", defaultValue: "12", options: Object.keys(AWG_RESISTANCE).map((g) => ({ value: g, label: `${g} AWG` })) },
      { name: "lengthFt", label: "One-Way Length", type: "number", unit: "ft", defaultValue: 50, min: 0 },
      { name: "currentAmps", label: "Current", type: "number", unit: "A", defaultValue: 10, min: 0 },
      { name: "systemVoltage", label: "System Voltage", type: "number", unit: "V", defaultValue: 120, min: 1 },
    ],
    calculate: (i) => {
      const resistancePer1000 = AWG_RESISTANCE[i.gauge] ?? 1.588;
      const drop = (2 * n(i.lengthFt, 50) * n(i.currentAmps, 10) * resistancePer1000) / 1000;
      const pct = (drop / n(i.systemVoltage, 120)) * 100;
      return {
        results: [
          { label: "Voltage Drop", value: `${fmtNumber(drop, 2)} V`, emphasis: true },
          { label: "Percent Drop", value: `${fmtNumber(pct, 2)}%`, emphasis: true },
          { label: "Voltage at Load", value: `${fmtNumber(n(i.systemVoltage, 120) - drop, 2)} V` },
        ],
        notes: [pct > 3 ? "Over the commonly recommended 3% limit — consider a thicker gauge wire." : "Within the commonly recommended 3% voltage drop limit."],
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
  },
  {
    slug: "btu-calculator",
    title: "BTU Calculator",
    category: "everyday",
    shortDescription: "Estimate the BTU heating/cooling capacity needed for a room.",
    seoDescription: "Estimate the BTU rating needed to heat or cool a room based on its area and climate.",
    formulaSummary: "BTU ≈ area(sqft) × climate factor",
    fields: [
      { name: "areaSqFt", label: "Room Area", type: "number", unit: "sq ft", defaultValue: 300, min: 0 },
      { name: "climate", label: "Climate / Insulation", type: "select", defaultValue: "moderate", options: [
        { value: "mild", label: "Mild climate, good insulation (20 BTU/sqft)" },
        { value: "moderate", label: "Moderate climate (25 BTU/sqft)" },
        { value: "hot", label: "Hot climate / poor insulation (30 BTU/sqft)" },
        { value: "veryHot", label: "Very hot climate, sun exposure (35 BTU/sqft)" },
      ] },
    ],
    calculate: (i) => {
      const factors: Record<string, number> = { mild: 20, moderate: 25, hot: 30, veryHot: 35 };
      const btu = n(i.areaSqFt, 300) * (factors[i.climate] ?? 25);
      return { results: [{ label: "Recommended BTU Capacity", value: fmtNumber(btu, 0), emphasis: true }] };
    },
    relatedSlugs: ["square-footage-calculator"],
  },
  {
    slug: "square-footage-calculator",
    title: "Square Footage Calculator",
    category: "everyday",
    shortDescription: "Calculate the square footage of a room and an optional material cost.",
    seoDescription: "Calculate the square footage of a rectangular room and the estimated material cost per square foot.",
    formulaSummary: "Area = length × width",
    fields: [
      { name: "lengthFt", label: "Length", type: "number", unit: "ft", defaultValue: 15, min: 0 },
      { name: "widthFt", label: "Width", type: "number", unit: "ft", defaultValue: 12, min: 0 },
      { name: "pricePerSqFt", label: "Price Per Sq Ft (optional)", type: "number", unit: "$", defaultValue: 0, min: 0 },
    ],
    calculate: (i) => {
      const area = n(i.lengthFt, 15) * n(i.widthFt, 12);
      const results = [{ label: "Square Footage", value: `${fmtNumber(area, 2)} sq ft`, emphasis: true }];
      if (n(i.pricePerSqFt) > 0) results.push({ label: "Estimated Cost", value: `$${fmtNumber(area * n(i.pricePerSqFt), 2)}`, emphasis: true });
      return { results };
    },
    relatedSlugs: ["area-calculator", "tile-calculator"],
  },
  {
    slug: "time-card-calculator",
    title: "Time Card Calculator",
    category: "everyday",
    shortDescription: "Add up a week's daily hours and calculate pay with overtime.",
    seoDescription: "Add up daily hours worked over a week and calculate total pay including overtime beyond 40 hours.",
    formulaSummary: "Overtime (1.5×) applies beyond 40 hours/week",
    fields: [
      { name: "dailyHours", label: "Hours Per Day (comma separated)", type: "text", defaultValue: "8, 8, 7.5, 8, 8" },
      { name: "hourlyRate", label: "Hourly Rate", type: "number", unit: "$", defaultValue: 22, min: 0 },
    ],
    calculate: (i) => {
      const hours = (i.dailyHours || "").split(",").map((s) => Number(s.trim())).filter((v) => Number.isFinite(v));
      if (hours.length === 0) return { results: [], error: "Enter daily hours, comma separated, e.g. 8, 8, 7.5, 8, 8" };
      const total = hours.reduce((a, b) => a + b, 0);
      const regular = Math.min(40, total);
      const overtime = Math.max(0, total - 40);
      const pay = regular * n(i.hourlyRate, 22) + overtime * n(i.hourlyRate, 22) * 1.5;
      return {
        results: [
          { label: "Total Hours", value: fmtNumber(total, 2), emphasis: true },
          { label: "Regular Hours", value: fmtNumber(regular, 2) },
          { label: "Overtime Hours", value: fmtNumber(overtime, 2) },
          { label: "Total Pay", value: `$${fmtNumber(pay, 2)}`, emphasis: true },
        ],
      };
    },
    relatedSlugs: ["hours-calculator"],
  },
  {
    slug: "time-zone-calculator",
    title: "Time Zone Calculator",
    category: "everyday",
    shortDescription: "Convert a time from one UTC offset to another.",
    seoDescription: "Convert a clock time from one UTC time zone offset to another.",
    formulaSummary: "Target time = source time + (target offset − source offset)",
    fields: [
      { name: "time", label: "Time (HH:MM, 24h)", type: "text", defaultValue: "14:00" },
      { name: "sourceOffset", label: "Source UTC Offset", type: "number", defaultValue: -5, step: 0.5, help: "e.g. -5 for US Eastern (EST)" },
      { name: "targetOffset", label: "Target UTC Offset", type: "number", defaultValue: 1, step: 0.5, help: "e.g. +1 for Central European Time" },
    ],
    calculate: (i) => {
      const minutes = parseClock(i.time);
      if (minutes === null) return { results: [], error: "Enter the time as HH:MM in 24-hour format." };
      const diffMinutes = (n(i.targetOffset, 1) - n(i.sourceOffset, -5)) * 60;
      let total = (minutes + diffMinutes) % 1440;
      let dayShift = 0;
      if (total < 0) { total += 1440; dayShift = -1; }
      if (minutes + diffMinutes >= 1440) dayShift = 1;
      const h = Math.floor(total / 60);
      const m = Math.round(total % 60);
      return {
        results: [
          { label: "Converted Time", value: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`, emphasis: true },
          { label: "Day", value: dayShift === 0 ? "Same day" : dayShift > 0 ? "Next day" : "Previous day" },
        ],
      };
    },
    relatedSlugs: ["time-duration-calculator"],
  },
  {
    slug: "density-calculator",
    title: "Density Calculator",
    category: "everyday",
    shortDescription: "Calculate density, mass or volume from the other two.",
    seoDescription: "Calculate density from mass and volume, or solve for mass or volume given density.",
    formulaSummary: "ρ = m / V",
    fields: [
      { name: "solveFor", label: "Solve For", type: "select", defaultValue: "density", options: [{ value: "density", label: "Density" }, { value: "mass", label: "Mass" }, { value: "volume", label: "Volume" }] },
      { name: "mass", label: "Mass", type: "number", unit: "kg", defaultValue: 10, min: 0, showIf: (i) => i.solveFor !== "mass" },
      { name: "volume", label: "Volume", type: "number", unit: "m³", defaultValue: 0.01, min: 0.0000001, showIf: (i) => i.solveFor !== "volume" },
      { name: "density", label: "Density", type: "number", unit: "kg/m³", defaultValue: 1000, min: 0.0000001, showIf: (i) => i.solveFor !== "density" },
    ],
    calculate: (i) => {
      if (i.solveFor === "mass") return { results: [{ label: "Mass", value: `${fmtNumber(n(i.density, 1000) * n(i.volume, 0.01), 4)} kg`, emphasis: true }] };
      if (i.solveFor === "volume") return { results: [{ label: "Volume", value: `${fmtNumber(n(i.mass, 10) / n(i.density, 1000), 6)} m³`, emphasis: true }] };
      return { results: [{ label: "Density", value: `${fmtNumber(n(i.mass, 10) / n(i.volume, 0.01), 4)} kg/m³`, emphasis: true }] };
    },
    relatedSlugs: ["molarity-calculator"],
  },
  {
    slug: "molarity-calculator",
    title: "Molarity Calculator",
    category: "everyday",
    shortDescription: "Calculate molarity from moles (or mass) and solution volume.",
    seoDescription: "Calculate the molarity of a solution from moles of solute (or mass and molar mass) and volume.",
    formulaSummary: "M = moles / volume(L)",
    fields: [
      { name: "mode", label: "I Have", type: "select", defaultValue: "moles", options: [{ value: "moles", label: "Moles of solute" }, { value: "mass", label: "Mass + molar mass" }] },
      { name: "moles", label: "Moles", type: "number", unit: "mol", defaultValue: 0.5, min: 0, showIf: (i) => i.mode !== "mass" },
      { name: "mass", label: "Mass", type: "number", unit: "g", defaultValue: 29.25, min: 0, showIf: (i) => i.mode === "mass" },
      { name: "molarMass", label: "Molar Mass", type: "number", unit: "g/mol", defaultValue: 58.44, min: 0.0001, showIf: (i) => i.mode === "mass" },
      { name: "volumeL", label: "Solution Volume", type: "number", unit: "L", defaultValue: 1, min: 0.0001 },
    ],
    calculate: (i) => {
      const moles = i.mode === "mass" ? n(i.mass, 29.25) / n(i.molarMass, 58.44) : n(i.moles, 0.5);
      const molarity = moles / n(i.volumeL, 1);
      return { results: [{ label: "Molarity", value: `${fmtNumber(molarity, 4)} mol/L`, emphasis: true }] };
    },
    relatedSlugs: ["molecular-weight-calculator"],
  },
  {
    slug: "molecular-weight-calculator",
    title: "Molecular Weight Calculator",
    category: "everyday",
    shortDescription: "Calculate the molecular weight of a chemical formula.",
    seoDescription: "Calculate the molecular (molar) weight of a chemical formula like H2O or C6H12O6.",
    formulaSummary: "Sum of (atomic weight × count) for each element",
    fields: [{ name: "formula", label: "Chemical Formula", type: "text", defaultValue: "C6H12O6", help: "e.g. H2O, NaCl, C6H12O6 — no parentheses or hydrates" }],
    calculate: (i) => {
      const result = molecularWeight((i.formula || "").trim());
      if (!result) return { results: [], error: "Couldn't parse that formula — use element symbols with optional counts, e.g. H2O, C6H12O6 (no parentheses)." };
      return {
        results: [{ label: "Molecular Weight", value: `${fmtNumber(result.mw, 3)} g/mol`, emphasis: true }],
        steps: result.breakdown,
      };
    },
    relatedSlugs: ["molarity-calculator"],
  },
  {
    slug: "roman-numeral-converter",
    title: "Roman Numeral Converter",
    category: "everyday",
    shortDescription: "Convert between numbers and Roman numerals.",
    seoDescription: "Convert a number to Roman numerals, or a Roman numeral back to a number.",
    formulaSummary: "Standard subtractive Roman numeral notation",
    fields: [
      { name: "mode", label: "Direction", type: "select", defaultValue: "toRoman", options: [{ value: "toRoman", label: "Number → Roman Numeral" }, { value: "fromRoman", label: "Roman Numeral → Number" }] },
      { name: "number", label: "Number", type: "number", defaultValue: 1994, min: 1, max: 3999, step: 1, showIf: (i) => i.mode !== "fromRoman" },
      { name: "roman", label: "Roman Numeral", type: "text", defaultValue: "MCMXCIV", showIf: (i) => i.mode === "fromRoman" },
    ],
    calculate: (i) => {
      if (i.mode === "fromRoman") {
        const value = fromRoman(i.roman || "");
        if (value === null) return { results: [], error: "Enter a valid Roman numeral using only I, V, X, L, C, D, M." };
        return { results: [{ label: "Number", value: fmtNumber(value, 0), emphasis: true }] };
      }
      const num = Math.round(n(i.number, 1994));
      if (num < 1 || num > 3999) return { results: [], error: "Enter a number between 1 and 3999." };
      return { results: [{ label: "Roman Numeral", value: toRoman(num), emphasis: true }] };
    },
    relatedSlugs: ["base-converter"],
  },
  {
    slug: "golf-handicap-calculator",
    title: "Golf Handicap Calculator",
    category: "everyday",
    shortDescription: "Estimate your golf handicap index from recent round scores.",
    seoDescription: "Estimate your golf handicap index from your course rating, slope rating and recent round scores.",
    formulaSummary: "Differential = (score − course rating) × 113 ÷ slope; index ≈ avg(lowest half) × 0.96",
    fields: [
      { name: "courseRating", label: "Course Rating", type: "number", defaultValue: 72, min: 60, max: 80, step: 0.1 },
      { name: "slopeRating", label: "Slope Rating", type: "number", defaultValue: 113, min: 55, max: 155 },
      { name: "scores", label: "Recent Round Scores (comma separated)", type: "text", defaultValue: "89, 92, 85, 94, 88, 90" },
    ],
    calculate: (i) => {
      const scores = (i.scores || "").split(",").map((s) => Number(s.trim())).filter((v) => Number.isFinite(v));
      if (scores.length === 0) return { results: [], error: "Enter at least one round score." };
      const differentials = scores.map((s) => ((s - n(i.courseRating, 72)) * 113) / n(i.slopeRating, 113));
      differentials.sort((a, b) => a - b);
      const useCount = Math.max(1, Math.ceil(differentials.length / 2));
      const best = differentials.slice(0, useCount);
      const index = (best.reduce((a, b) => a + b, 0) / best.length) * 0.96;
      return {
        results: [{ label: "Estimated Handicap Index", value: fmtNumber(index, 1), emphasis: true }],
        notes: ["A simplified estimate using your best-half differentials — the official USGA formula uses more detailed round-count tables."],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "sleep-calculator",
    title: "Sleep Calculator",
    category: "everyday",
    shortDescription: "Find optimal bedtimes or wake times based on 90-minute sleep cycles.",
    seoDescription: "Calculate optimal bedtime or wake-up time options based on 90-minute sleep cycles, so you wake up between cycles.",
    formulaSummary: "Cycles of 90 minutes + 15 minutes to fall asleep",
    fields: [
      { name: "mode", label: "I Want to Know", type: "select", defaultValue: "bedtime", options: [{ value: "bedtime", label: "What time should I go to bed?" }, { value: "waketime", label: "What time will I wake up?" }] },
      { name: "time", label: "Wake-Up Time (HH:MM)", type: "text", defaultValue: "07:00", showIf: (i) => i.mode !== "waketime" },
      { name: "bedTime", label: "Bedtime (HH:MM)", type: "text", defaultValue: "23:00", showIf: (i) => i.mode === "waketime" },
    ],
    calculate: (i) => {
      const fallAsleepMinutes = 15;
      const fmtTime = (mins: number) => {
        const wrapped = ((mins % 1440) + 1440) % 1440;
        const h = Math.floor(wrapped / 60);
        const m = Math.round(wrapped % 60);
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      };
      if (i.mode === "waketime") {
        const bed = parseClock(i.bedTime);
        if (bed === null) return { results: [], error: "Enter your bedtime as HH:MM in 24-hour format." };
        const results = [4, 5, 6].map((cycles) => ({ label: `${cycles} cycles (${(cycles * 1.5).toFixed(1)}h sleep)`, value: fmtTime(bed + fallAsleepMinutes + cycles * 90), emphasis: cycles === 5 }));
        return { results };
      }
      const wake = parseClock(i.time);
      if (wake === null) return { results: [], error: "Enter your wake-up time as HH:MM in 24-hour format." };
      const results = [6, 5, 4].map((cycles) => ({ label: `${cycles} cycles (${(cycles * 1.5).toFixed(1)}h sleep)`, value: fmtTime(wake - fallAsleepMinutes - cycles * 90), emphasis: cycles === 5 }));
      return { results };
    },
    relatedSlugs: ["age-calculator"],
  },
  {
    slug: "roofing-calculator",
    title: "Roofing Calculator",
    category: "everyday",
    shortDescription: "Calculate roofing squares and shingle bundles needed.",
    seoDescription: "Calculate the number of roofing squares and shingle bundles needed for a roof area, including waste.",
    formulaSummary: "1 square = 100 sq ft; ~3 bundles per square",
    fields: [
      { name: "roofAreaSqFt", label: "Roof Area", type: "number", unit: "sq ft", defaultValue: 1800, min: 0 },
      { name: "wastePercent", label: "Waste Factor", type: "number", unit: "%", defaultValue: 10, min: 0, max: 50 },
    ],
    calculate: (i) => {
      const areaWithWaste = n(i.roofAreaSqFt, 1800) * (1 + n(i.wastePercent, 10) / 100);
      const squares = areaWithWaste / 100;
      return {
        results: [
          { label: "Roofing Squares Needed", value: fmtNumber(squares, 2), emphasis: true },
          { label: "Shingle Bundles (≈3/square)", value: fmtNumber(Math.ceil(squares * 3), 0) },
        ],
      };
    },
    relatedSlugs: ["square-footage-calculator", "tile-calculator"],
  },
  {
    slug: "tile-calculator",
    title: "Tile Calculator",
    category: "everyday",
    shortDescription: "Calculate how many tiles you need for a floor or wall.",
    seoDescription: "Calculate the number of tiles needed for a room given the room size, tile size and waste factor.",
    formulaSummary: "Tiles = room area ÷ tile area × (1 + waste%)",
    fields: [
      { name: "roomLengthFt", label: "Room Length", type: "number", unit: "ft", defaultValue: 12, min: 0 },
      { name: "roomWidthFt", label: "Room Width", type: "number", unit: "ft", defaultValue: 10, min: 0 },
      { name: "tileLengthIn", label: "Tile Length", type: "number", unit: "in", defaultValue: 12, min: 1 },
      { name: "tileWidthIn", label: "Tile Width", type: "number", unit: "in", defaultValue: 12, min: 1 },
      { name: "wastePercent", label: "Waste Factor", type: "number", unit: "%", defaultValue: 10, min: 0, max: 50 },
    ],
    calculate: (i) => {
      const roomArea = n(i.roomLengthFt, 12) * n(i.roomWidthFt, 10);
      const tileAreaSqFt = (n(i.tileLengthIn, 12) * n(i.tileWidthIn, 12)) / 144;
      const tiles = (roomArea / tileAreaSqFt) * (1 + n(i.wastePercent, 10) / 100);
      return { results: [{ label: "Tiles Needed", value: fmtNumber(Math.ceil(tiles), 0), emphasis: true }] };
    },
    relatedSlugs: ["square-footage-calculator", "roofing-calculator"],
  },
  {
    slug: "mulch-calculator",
    title: "Mulch Calculator",
    category: "everyday",
    shortDescription: "Calculate how much mulch you need for a garden bed.",
    seoDescription: "Calculate the cubic yards and bags of mulch needed for a garden bed area and depth.",
    formulaSummary: "Cubic yards = area × depth(in) ÷ 12 ÷ 27",
    fields: [
      { name: "areaSqFt", label: "Area", type: "number", unit: "sq ft", defaultValue: 200, min: 0 },
      { name: "depthIn", label: "Depth", type: "number", unit: "in", defaultValue: 3, min: 0.5 },
    ],
    calculate: (i) => {
      const cubicYards = (n(i.areaSqFt, 200) * n(i.depthIn, 3)) / 12 / 27;
      const bags2cf = (cubicYards * 27) / 2;
      return {
        results: [
          { label: "Mulch Needed", value: `${fmtNumber(cubicYards, 2)} cubic yards`, emphasis: true },
          { label: "2 cu ft Bags", value: fmtNumber(Math.ceil(bags2cf), 0) },
        ],
      };
    },
    relatedSlugs: ["gravel-calculator", "concrete-calculator"],
  },
  {
    slug: "gravel-calculator",
    title: "Gravel Calculator",
    category: "everyday",
    shortDescription: "Calculate how much gravel you need in cubic yards and tons.",
    seoDescription: "Calculate the cubic yards and tons of gravel needed for a driveway or path area and depth.",
    formulaSummary: "Tons ≈ cubic yards × 1.4",
    fields: [
      { name: "areaSqFt", label: "Area", type: "number", unit: "sq ft", defaultValue: 400, min: 0 },
      { name: "depthIn", label: "Depth", type: "number", unit: "in", defaultValue: 4, min: 0.5 },
    ],
    calculate: (i) => {
      const cubicYards = (n(i.areaSqFt, 400) * n(i.depthIn, 4)) / 12 / 27;
      const tons = cubicYards * 1.4;
      return {
        results: [
          { label: "Gravel Needed", value: `${fmtNumber(cubicYards, 2)} cubic yards`, emphasis: true },
          { label: "Approx. Weight", value: `${fmtNumber(tons, 2)} tons` },
        ],
      };
    },
    relatedSlugs: ["mulch-calculator", "concrete-calculator"],
  },
  {
    slug: "wind-chill-calculator",
    title: "Wind Chill Calculator",
    category: "everyday",
    shortDescription: "Calculate the wind chill (feels-like) temperature.",
    seoDescription: "Calculate the wind chill temperature using the National Weather Service formula.",
    formulaSummary: "NWS wind chill formula",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 25, max: 50 },
      { name: "windMph", label: "Wind Speed", type: "number", unit: "mph", defaultValue: 15, min: 3 },
    ],
    calculate: (i) => {
      const t = n(i.tempF, 25);
      const v = Math.max(3, n(i.windMph, 15));
      const wc = 35.74 + 0.6215 * t - 35.75 * Math.pow(v, 0.16) + 0.4275 * t * Math.pow(v, 0.16);
      return { results: [{ label: "Wind Chill", value: `${fmtNumber(wc, 1)}°F`, emphasis: true }], notes: ["Valid for temperatures at or below 50°F and wind speeds of 3+ mph."] };
    },
    relatedSlugs: ["heat-index-calculator", "dew-point-calculator"],
  },
  {
    slug: "heat-index-calculator",
    title: "Heat Index Calculator",
    category: "everyday",
    shortDescription: "Calculate the heat index (feels-like temperature in humid heat).",
    seoDescription: "Calculate the heat index — how hot it feels when relative humidity is factored in with air temperature.",
    formulaSummary: "NWS Rothfusz regression",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 95, min: 80 },
      { name: "humidityPercent", label: "Relative Humidity", type: "number", unit: "%", defaultValue: 60, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const T = n(i.tempF, 95);
      const R = n(i.humidityPercent, 60);
      const hi =
        -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R +
        0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
      return { results: [{ label: "Heat Index", value: `${fmtNumber(hi, 1)}°F`, emphasis: true }], notes: ["Most accurate for temperatures at or above 80°F and humidity at or above 40%."] };
    },
    relatedSlugs: ["wind-chill-calculator", "dew-point-calculator"],
  },
  {
    slug: "dew-point-calculator",
    title: "Dew Point Calculator",
    category: "everyday",
    shortDescription: "Calculate the dew point from temperature and relative humidity.",
    seoDescription: "Calculate the dew point temperature from air temperature and relative humidity using the Magnus formula.",
    formulaSummary: "Magnus formula",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 75 },
      { name: "humidityPercent", label: "Relative Humidity", type: "number", unit: "%", defaultValue: 55, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const tC = ((n(i.tempF, 75) - 32) * 5) / 9;
      const rh = n(i.humidityPercent, 55);
      const a = 17.62, b = 243.12;
      const gamma = (a * tC) / (b + tC) + Math.log(rh / 100);
      const dewC = (b * gamma) / (a - gamma);
      const dewF = (dewC * 9) / 5 + 32;
      return { results: [{ label: "Dew Point", value: `${fmtNumber(dewF, 1)}°F (${fmtNumber(dewC, 1)}°C)`, emphasis: true }] };
    },
    relatedSlugs: ["heat-index-calculator", "wind-chill-calculator"],
  },
  {
    slug: "bandwidth-calculator",
    title: "Bandwidth / Download Time Calculator",
    category: "everyday",
    shortDescription: "Calculate how long a file will take to download at a given connection speed.",
    seoDescription: "Calculate estimated download time for a file given its size and your connection speed.",
    formulaSummary: "Time = file size(bits) ÷ speed(bits per second)",
    fields: [
      { name: "fileSize", label: "File Size", type: "number", defaultValue: 5, min: 0 },
      { name: "fileSizeUnit", label: "Unit", type: "select", defaultValue: "GB", options: [{ value: "MB", label: "MB" }, { value: "GB", label: "GB" }] },
      { name: "speed", label: "Connection Speed", type: "number", defaultValue: 100, min: 0.1 },
      { name: "speedUnit", label: "Speed Unit", type: "select", defaultValue: "Mbps", options: [{ value: "Mbps", label: "Mbps" }, { value: "Kbps", label: "Kbps" }] },
    ],
    calculate: (i) => {
      const sizeBits = n(i.fileSize, 5) * (i.fileSizeUnit === "GB" ? 1024 * 1024 * 1024 : 1024 * 1024) * 8;
      const speedBits = n(i.speed, 100) * (i.speedUnit === "Mbps" ? 1000000 : 1000);
      const seconds = sizeBits / speedBits;
      const mins = Math.floor(seconds / 60);
      const secs = Math.round(seconds % 60);
      return { results: [{ label: "Estimated Download Time", value: seconds < 60 ? `${fmtNumber(seconds, 1)} sec` : `${mins} min ${secs} sec`, emphasis: true }] };
    },
    relatedSlugs: [],
  },
  {
    slug: "base64-encode-decode",
    title: "Base64 Encode / Decode",
    category: "everyday",
    shortDescription: "Encode text to Base64, or decode a Base64 string back to text.",
    seoDescription: "Encode plain text to Base64, or decode a Base64 string back into readable text.",
    formulaSummary: "Standard Base64 encoding",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "encode", options: [{ value: "encode", label: "Encode (text → Base64)" }, { value: "decode", label: "Decode (Base64 → text)" }] },
      { name: "text", label: "Input", type: "text", defaultValue: "Hello, world!" },
    ],
    calculate: (i) => {
      try {
        const result = i.mode === "decode" ? utf8SafeDecode(i.text || "") : utf8SafeEncode(i.text || "");
        return { results: [{ label: "Output", value: result, emphasis: true }] };
      } catch {
        return { results: [], error: i.mode === "decode" ? "That doesn't look like valid Base64." : "Couldn't encode that input." };
      }
    },
    relatedSlugs: ["url-encode-decode"],
  },
  {
    slug: "url-encode-decode",
    title: "URL Encode / Decode",
    category: "everyday",
    shortDescription: "Encode text for use in a URL, or decode a URL-encoded string.",
    seoDescription: "URL-encode text so it's safe to use in a query string, or decode a percent-encoded URL string.",
    formulaSummary: "Percent-encoding (RFC 3986)",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "encode", options: [{ value: "encode", label: "Encode" }, { value: "decode", label: "Decode" }] },
      { name: "text", label: "Input", type: "text", defaultValue: "hello world & friends" },
    ],
    calculate: (i) => {
      try {
        const result = i.mode === "decode" ? decodeURIComponent(i.text || "") : encodeURIComponent(i.text || "");
        return { results: [{ label: "Output", value: result, emphasis: true }] };
      } catch {
        return { results: [], error: "Couldn't decode that input — it may not be validly percent-encoded." };
      }
    },
    relatedSlugs: ["base64-encode-decode"],
  },
  {
    slug: "shoe-size-conversion",
    title: "Shoe Size Conversion",
    category: "everyday",
    shortDescription: "Convert a US men's shoe size to US women's, UK, EU and centimeters.",
    seoDescription: "Convert a shoe size between US men's, US women's, UK and EU sizing systems, plus foot length in centimeters.",
    formulaSummary: "Approximate linear offsets from US men's sizing",
    fields: [{ name: "usMens", label: "US Men's Size", type: "number", defaultValue: 9, min: 3, max: 16, step: 0.5 }],
    calculate: (i) => {
      const m = n(i.usMens, 9);
      const cm = (2.54 * (m + 22)) / 3;
      return {
        results: [
          { label: "US Men's", value: fmtNumber(m, 1), emphasis: true },
          { label: "US Women's", value: fmtNumber(m + 1.5, 1) },
          { label: "UK", value: fmtNumber(m - 0.5, 1) },
          { label: "EU", value: fmtNumber(m + 33, 0) },
          { label: "Foot Length", value: `${fmtNumber(cm, 1)} cm` },
        ],
        notes: ["Approximate — exact sizing varies by brand and shoe last. When in stock, measure foot length directly against the brand's own chart."],
      };
    },
    relatedSlugs: ["bra-size-calculator"],
  },
];

export default everyday2;
