import type { CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";
import { fCPair, cmInPair, lbKgPair } from "./convert-hints";

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

function molecularWeight(formula: string): { mw: number; breakdown: string[]; elements: { symbol: string; count: number; contribution: number }[] } | null {
  const re = /([A-Z][a-z]?)(\d*)/g;
  let match: RegExpExecArray | null;
  let mw = 0;
  const breakdown: string[] = [];
  const elements: { symbol: string; count: number; contribution: number }[] = [];
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
    elements.push({ symbol, count, contribution: weight * count });
  }
  if (consumed !== formula.length || breakdown.length === 0) return null;
  return { mw, breakdown, elements };
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
      const fmtHMS = (secs: number) => `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m ${Math.round(secs % 60)}s`;
      return {
        results: [{ label: "Result", value: `${negative ? "-" : ""}${h}h ${m}m ${s}s`, emphasis: true }],
        steps: [
          `First duration: ${fmtHMS(t1)} = ${t1} total seconds`,
          `Second duration: ${fmtHMS(t2)} = ${t2} total seconds`,
          `${t1}s ${i.op === "-" ? "−" : "+"} ${t2}s = ${negative ? "-" : ""}${total}s`,
          `Converted back: ${negative ? "-" : ""}${h}h ${m}m ${s}s`,
        ],
        compare: [
          { label: "First Duration", value: t1, displayValue: fmtHMS(t1), highlight: t1 >= t2 },
          { label: "Second Duration", value: t2, displayValue: fmtHMS(t2), highlight: t2 > t1 },
        ],
        chartCaption: `The two durations side by side before they're ${i.op === "-" ? "subtracted" : "added"} — the result (${negative ? "-" : ""}${h}h ${m}m ${s}s) is ${i.op === "-" ? "their difference" : "their sum"}.`,
      };
    },
    relatedSlugs: ["time-duration-calculator"],
    content: {
      intro: [
        "This tool adds or subtracts two spans of time given in hours, minutes and seconds — the kind of arithmetic that gets surprisingly fiddly by hand once minutes roll past 60 or a subtraction goes negative. Type in two durations, pick plus or minus, and it carries the borrowing and carrying for you.",
        "It gets used for anything measured in stretches of time rather than clock times: totaling up two recorded video clips before you trim them together, figuring out how much longer a recipe needs after part of it has already cooked, working out the gap between two lap times, or tallying hours across a couple of work sessions.",
        "Everything runs in your browser — there's nothing to sign in for and nothing saved, so it's just as quick for a one-off kitchen timer question as it is for something you'd use daily.",
      ],
      howItWorks: [
        "Both durations are first converted to a single number of seconds (hours × 3600 + minutes × 60 + seconds), which sidesteps the awkward base-60 carrying that trips up manual addition. The two totals are then added or subtracted as plain numbers.",
        "The result is converted back into hours, minutes and seconds for display. If a subtraction produces a negative total, the calculator flags it and shows the magnitude of the difference with a minus sign rather than wrapping around a clock.",
      ],
      faq: [
        {
          q: "How do I add two times that total more than 24 hours?",
          a: "Just enter them — this calculator works with durations, not clock times, so there's no 24-hour wraparound. Adding 20 hours and 10 hours correctly returns 30 hours rather than looping back to 6.",
        },
        {
          q: "What does a negative result mean when subtracting?",
          a: "It means the second duration was longer than the first, so the difference is shown as a negative value — for example subtracting 3h from 1h30m gives −1h 30m.",
        },
        {
          q: "Can I use this for adding up work hours across a week?",
          a: "You can add two durations at a time, so it works for combining a couple of shifts. For a full week of daily hours with overtime pay calculated automatically, the Time Card Calculator is the better fit.",
        },
        {
          q: "Does this account for time zones or daylight saving?",
          a: "No — this treats both entries as plain durations (like a stopwatch reading), not clock times tied to a specific zone or date, so there's nothing to adjust for.",
        },
      ],
    },
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
      { name: "motherCm", label: "Mother's Height", type: "number", unit: "cm", defaultValue: 165, min: 100, convertPair: cmInPair("motherCm") },
      { name: "fatherCm", label: "Father's Height", type: "number", unit: "cm", defaultValue: 180, min: 100, convertPair: cmInPair("fatherCm") },
    ],
    calculate: (i) => {
      const motherCm = n(i.motherCm, 165);
      const fatherCm = n(i.fatherCm, 180);
      const avg = (motherCm + fatherCm) / 2;
      const predicted = i.childSex === "female" ? avg - 6.5 : avg + 6.5;
      return {
        results: [{ label: "Predicted Adult Height", value: `${fmtNumber(predicted, 1)} cm (${fmtNumber(predicted / 2.54, 1)} in)`, emphasis: true }],
        notes: ["A rough population-average estimate (mid-parental height method) — actual adult height varies ±8.5cm even within this method's expected range."],
        compare: [
          { label: "Mother", value: motherCm, displayValue: `${fmtNumber(motherCm, 1)} cm` },
          { label: "Father", value: fatherCm, displayValue: `${fmtNumber(fatherCm, 1)} cm` },
          { label: "Predicted Child", value: predicted, displayValue: `${fmtNumber(predicted, 1)} cm`, highlight: true },
        ],
        chartCaption: `The prediction starts from the parents' average height (${fmtNumber(avg, 1)} cm) and then shifts ${i.childSex === "female" ? "down" : "up"} 6.5 cm for a ${i.childSex === "female" ? "daughter" : "son"}.`,
      };
    },
    relatedSlugs: ["bmi-calculator"],
    content: {
      intro: [
        "This calculator predicts a child's likely adult height using the mid-parental height method — averaging both parents' heights and shifting the result up or down depending on the child's sex. It's the same rough calculation pediatricians have used for decades as a starting reference point, not a precise forecast.",
        "Parents typically reach for this out of simple curiosity — wondering whether a tall toddler is going to stay tall, or whether a shorter-than-average kid is tracking normally against the family's genetics. It's also a common talking point at pediatric checkups when growth charts come up.",
        "The math is quick and happens entirely on your device, so there's no need to hand over anyone's health details just to satisfy curiosity about how tall your kid might end up.",
      ],
      howItWorks: [
        "The method averages the mother's and father's heights, then adjusts for the statistical difference between adult male and female height: add 6.5 cm for a boy, subtract 6.5 cm for a girl. That shift approximates the roughly 13 cm average height gap between adult men and women, split evenly around the parental average.",
        "This is a population-level estimate, not a growth-curve projection from the child's own measurements — it ignores the child's current growth trajectory, nutrition, health conditions, and the fact that height is influenced by more than just the two parents' genes. Actual adult height commonly falls within about ±8.5 cm of the mid-parental estimate, which is a wide enough band that it's best treated as a ballpark, not a prediction to bank on.",
      ],
      faq: [
        {
          q: "How accurate is the mid-parental height method?",
          a: "It's a rough estimate — most children's adult height lands within about 8.5 cm of the calculated value, but genetics, nutrition and health during childhood can push someone outside that range in either direction.",
        },
        {
          q: "Why does the formula add or subtract 6.5 cm based on sex?",
          a: "That adjustment approximates the average height difference between adult men and women, so the son's estimate is shifted above the parental average and the daughter's estimate is shifted below it.",
        },
        {
          q: "Is this the same method doctors use?",
          a: "Pediatricians do use mid-parental height as one reference point, usually alongside the child's own growth chart percentile over time — the two together give a much better picture than either alone.",
        },
        {
          q: "Does this work for a child who is much taller or shorter than their growth curve suggests?",
          a: "The formula only uses parental heights, so it won't reflect a child's own growth trajectory. A pediatrician tracking the child's percentile over multiple visits is a far more reliable source if actual growth looks unusual.",
        },
      ],
    },
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
        table: {
          headers: ["Material / Unit", "Quantity Needed"],
          rows: [
            ["Ready-mix concrete", `${fmtNumber(cubicYards, 2)} cubic yards`],
            ["Cubic feet (raw)", `${fmtNumber(cubicFt, 1)} cu ft`],
            ["80 lb pre-mix bags", `${fmtNumber(Math.ceil(bags80lb), 0)} bags`],
            ["60 lb pre-mix bags", `${fmtNumber(Math.ceil(bags60lb), 0)} bags`],
          ],
        },
        chartCaption: "Either buy ready-mix by the cubic yard for a delivery truck, or use one of the bag counts if you're mixing bags yourself — don't add both bag rows together, they're two alternatives for the same slab.",
      };
    },
    relatedSlugs: ["square-footage-calculator", "gravel-calculator"],
    content: {
      intro: [
        "This calculator converts a slab's length, width and thickness into the cubic yards of ready-mix concrete you'd order from a truck, plus the equivalent number of pre-mix bags if you're hand-mixing instead. It's built for the moment before a materials run — sizing a patio, footing, shed pad or fence post job before you're standing in the aisle guessing.",
        "Concrete is priced and delivered by the cubic yard for anything of real size, but most DIY jobs (a small pad, a handful of post holes) are more practically done with bagged mix from a hardware store — this tool gives you both units side by side so you can pick whichever matches how you're actually buying.",
        "Thickness is entered in inches because that's how slabs are specified, while length and width stay in feet — the calculator handles the unit conversion so you don't have to convert inches to feet in your head before multiplying.",
      ],
      howItWorks: [
        "Volume starts as length × width × thickness, with thickness converted from inches to feet first (divided by 12), giving a raw cubic-foot volume. Dividing by 27 converts that to cubic yards, since a cubic yard is 3 ft × 3 ft × 3 ft = 27 cubic feet.",
        "For bagged concrete, an 80 lb bag yields about 0.6 cubic feet of mixed concrete and a 60 lb bag yields about 0.45 cubic feet — those are standard figures from bag manufacturers, so the calculator divides your total cubic footage by the appropriate yield and rounds up, since you can't buy a partial bag.",
      ],
      faq: [
        {
          q: "How many bags of concrete do I need per cubic yard?",
          a: "About 45 bags of 60 lb mix or roughly 34 bags of 80 lb mix per cubic yard, though it's easier to let the calculator do the exact math for your specific slab size rather than working from a flat per-yard rule.",
        },
        {
          q: "Should I use 60 lb or 80 lb bags?",
          a: "80 lb bags deliver more concrete per bag (fewer bags to carry and mix) but are noticeably heavier to lift; 60 lb bags are easier to handle solo. Both produce the same final concrete once mixed.",
        },
        {
          q: "What thickness should I use for a driveway versus a walkway?",
          a: "A typical walkway or patio slab is usually 4 inches thick, while a driveway that needs to support vehicle weight is commonly poured at 5 to 6 inches — check local code for anything load-bearing.",
        },
        {
          q: "Should I order extra concrete beyond the calculated amount?",
          a: "Most contractors add 5–10% over the calculated volume to cover an uneven subgrade, spillage and minor measurement error — it's cheaper to have a little extra than to run short mid-pour.",
        },
        {
          q: "Is ready-mix delivery worth it for a small job?",
          a: "For anything under roughly half a cubic yard, bagged mix is usually more practical since most ready-mix suppliers have delivery minimums; above that, a truck often works out cheaper per yard and saves a lot of manual mixing.",
        },
      ],
    },
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
      return {
        results: [{ label: "Estimated Bra Size", value: `${band}${cup}`, emphasis: true }],
        steps: [
          `Band size rounds your ${fmtNumber(n(i.underbustIn, 32), 1)} in underbust to the nearest even number = ${band}`,
          `Bust minus underbust = ${fmtNumber(n(i.bustIn, 36), 1)} − ${fmtNumber(n(i.underbustIn, 32), 1)} = ${diff} in difference`,
          `Each inch of difference steps up one cup letter (0"=AA, 1"=A, 2"=B, ...) → ${diff}" = ${cup} cup`,
          `Estimated size: ${band}${cup}`,
        ],
        compare: [
          { label: "Underbust (Band)", value: n(i.underbustIn, 32), displayValue: `${fmtNumber(n(i.underbustIn, 32), 1)} in` },
          { label: "Bust (Fullest Point)", value: n(i.bustIn, 36), displayValue: `${fmtNumber(n(i.bustIn, 36), 1)} in`, highlight: true },
        ],
        chartCaption: `The ${diff} in gap between your bust and underbust measurements is what determines the ${cup} cup letter — a bigger gap means a bigger cup.`,
      };
    },
    relatedSlugs: ["shoe-size-conversion"],
    content: {
      intro: [
        "This calculator estimates a bra size from two tape-measure numbers: your band measurement (snug, directly under the bust) and your bust measurement (around the fullest point). It's the same band-and-cup math used behind the counter at a fitting appointment, just without needing to book one.",
        "People usually pull this up after a weight change, after a bra stops fitting the way it used to, or when shopping online somewhere without a fitting room — a size estimate up front saves a round of returns. It's also a common first stop for someone buying their first bra and unsure where to even start.",
        "Because it's just a bit of arithmetic on two numbers you already typed in, everything runs locally in your browser — there's no account, no measurement history saved anywhere, and nothing about your body leaves your device.",
      ],
      howItWorks: [
        "The band size rounds your underbust measurement to the nearest even number, which is how bra bands are conventionally sized. The cup size comes from the difference between your bust and underbust measurements: each full inch of difference steps up one cup letter, starting at AA for a 0\" difference, A for 1\", B for 2\", and so on.",
      ],
      faq: [
        {
          q: "How do I measure for band and bust size at home?",
          a: "Measure the band snugly around your ribcage directly under your bust, keeping the tape level and parallel to the floor. Measure the bust around the fullest part while wearing an unpadded bra, then let the difference between the two numbers determine your cup size.",
        },
        {
          q: "Why did I get a different size than what I usually buy?",
          a: "Sizing isn't standardized across brands — a cut that runs small in one label can run large in another, and this calculator gives a starting estimate rather than a guaranteed fit. Treat the result as a size to try on or order first, not a final answer.",
        },
        {
          q: "What if my measurement falls between two even band numbers?",
          a: "Round to the nearest even number, which is the convention most brands use for band sizing — an odd measurement like 33 inches typically rounds to a 34 band.",
        },
        {
          q: "Does this account for sister sizing?",
          a: "Not directly. Sister sizes (the same cup volume in an adjacent band size, like 34C and 36B) are a separate concept from this estimate — if the calculated size doesn't fit right, trying the sister size up or down in band with the opposite cup direction is a common next step.",
        },
      ],
    },
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
      const distance = n(i.distance, 300);
      const price = n(i.pricePerGallon, 3.5);
      const gallons = distance / n(i.mpg, 28);
      const cost = gallons * price;
      const avgMpg = 25;
      const avgCost = (distance / avgMpg) * price;
      return {
        results: [
          { label: "Fuel Needed", value: `${fmtNumber(gallons, 2)} gallons` },
          { label: "Total Fuel Cost", value: `$${fmtNumber(cost, 2)}`, emphasis: true },
        ],
        steps: [
          `Gallons needed = ${fmtNumber(distance, 0)} miles ÷ ${fmtNumber(n(i.mpg, 28), 1)} mpg = ${fmtNumber(gallons, 2)} gallons`,
          `Cost = ${fmtNumber(gallons, 2)} gallons × $${fmtNumber(price, 2)}/gal = $${fmtNumber(cost, 2)}`,
        ],
        compare: [
          { label: "Your Trip Cost", value: cost, displayValue: `$${fmtNumber(cost, 2)}`, highlight: cost <= avgCost },
          { label: "At Average 25 MPG", value: avgCost, displayValue: `$${fmtNumber(avgCost, 2)}` },
        ],
        chartCaption: `At the same fuel price, this trip would cost $${fmtNumber(avgCost, 2)} in a vehicle averaging 25 MPG — your ${fmtNumber(n(i.mpg, 28), 1)} MPG ${cost <= avgCost ? "saves you" : "costs you"} $${fmtNumber(Math.abs(avgCost - cost), 2)}.`,
      };
    },
    relatedSlugs: ["gas-mileage-calculator", "mileage-calculator"],
    content: {
      intro: [
        "This calculator turns a trip distance, your vehicle's fuel economy, and the current price at the pump into a single dollar figure for how much gas the drive will burn. It's built for the moment before a road trip — or before agreeing to a long commute — when you want a real number instead of a guess.",
        "It gets used for budgeting a vacation drive, comparing the fuel cost of two possible routes, splitting gas money fairly for a shared ride, or working out whether it's cheaper to drive or fly somewhere once fuel is priced in.",
        "The math is a straightforward division and multiplication, run entirely in your browser — nothing about your trip, vehicle or destination is saved or sent anywhere.",
      ],
      howItWorks: [
        "Gallons needed is simply trip distance divided by your vehicle's miles-per-gallon rating, and total cost is that gallon figure multiplied by the price per gallon. The result is compared against a 25 MPG baseline (roughly the current average for US passenger vehicles) so you can see how much your specific vehicle's efficiency is saving or costing you on this trip.",
      ],
      faq: [
        {
          q: "What MPG number should I use if I don't know my car's exact fuel economy?",
          a: "Check your vehicle's window sticker or owner's manual for the EPA combined rating, or calculate your real-world average with the Gas Mileage Calculator using your last fill-up's miles and gallons — actual mileage often runs a bit below the EPA sticker number, especially on highway trips at higher speeds.",
        },
        {
          q: "Does this account for highway versus city driving?",
          a: "No — it uses a single MPG figure for the whole trip. If your trip mixes highway and city driving, use a blended MPG estimate, or your vehicle's combined EPA rating, for a more realistic result.",
        },
        {
          q: "How do I estimate fuel cost for a round trip?",
          a: "Enter the round-trip distance (double the one-way mileage) rather than just the one-way distance, and the calculator will return the total fuel cost for the full trip there and back.",
        },
        {
          q: "Why does the comparison bar show a 25 MPG baseline?",
          a: "It's a rough average fuel economy figure for gas-powered passenger vehicles in the US, included so you have a quick reference point for whether your vehicle's efficiency is helping or hurting your fuel budget on this specific trip.",
        },
      ],
    },
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
      return {
        results: [{ label: "Fuel Economy", value: `${fmtNumber(mpg, 2)} MPG`, emphasis: true }],
        gauge: {
          value: mpg,
          min: 0,
          max: 50,
          valueLabel: `${fmtNumber(mpg, 1)} MPG`,
          zones: [
            { label: "Poor", to: 18, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "Average", to: 27, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Good", to: 36, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Excellent", to: 50, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
          ],
        },
        chartCaption: `${fmtNumber(mpg, 1)} MPG is roughly ${mpg < 18 ? "below" : mpg < 27 ? "around" : mpg < 36 ? "above" : "well above"} the typical gas-vehicle average — hybrids and small cars often land in the "Good" or "Excellent" zone.`,
      };
    },
    relatedSlugs: ["fuel-cost-calculator"],
    content: {
      intro: [
        "This calculator works out your car's actual fuel economy from two numbers you can read off the pump and the odometer: how many miles you drove and how many gallons it took to fill back up. It's the simplest possible way to check your real MPG instead of relying on the EPA sticker rating.",
        "Drivers use it right after a fill-up to track fuel economy over time, to see whether a recent oil change or a set of new tires changed anything, or to compare how a car performs on a highway-heavy trip versus routine city driving.",
        "It's one division done in your browser — no trip logs, no account, nothing stored between visits unless you choose to write the number down yourself.",
      ],
      howItWorks: [
        "MPG is simply miles driven divided by gallons of fuel used to cover that distance. For a clean reading, fill the tank completely, reset your trip odometer (or note the mileage), drive normally, then fill up again and divide the miles by the gallons it took to fill it back to full.",
      ],
      faq: [
        {
          q: "Why is my calculated MPG lower than the EPA rating on my car's window sticker?",
          a: "EPA ratings are measured under controlled test conditions. Real-world driving — city traffic, cold starts, air conditioning, aggressive acceleration, hilly terrain — routinely brings actual MPG below the sticker number, sometimes by several miles per gallon.",
        },
        {
          q: "How do I get an accurate reading?",
          a: "Fill the tank completely and note the odometer reading, drive as you normally would, then fill up again to full and divide the miles driven by the gallons it took to refill. Filling only partially either time throws off the gallons number and skews the result.",
        },
        {
          q: "Does one fill-up give a reliable number?",
          a: "It's a reasonable snapshot, but MPG naturally varies fill to fill based on driving conditions. Tracking it over several fill-ups and averaging gives a more stable picture of your car's real fuel economy.",
        },
        {
          q: "What counts as good gas mileage?",
          a: "It depends heavily on vehicle type — a compact sedan averaging in the high 30s is doing well, a midsize SUV in the low-to-mid 20s is typical, and a hybrid can push well past 40 MPG. The gauge above compares your result against general gas-vehicle bands rather than a single fixed target.",
        },
      ],
    },
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
      const miles = n(i.miles, 150);
      const rate = n(i.ratePerMile, 0.67);
      const reimbursement = miles * rate;
      const standardRate = 0.67;
      const standardReimbursement = miles * standardRate;
      return {
        results: [{ label: "Reimbursement", value: `$${fmtNumber(reimbursement, 2)}`, emphasis: true }],
        steps: [`Reimbursement = ${fmtNumber(miles, 1)} miles × $${fmtNumber(rate, 3)}/mile = $${fmtNumber(reimbursement, 2)}`],
        compare: [
          { label: "At Your Rate", value: reimbursement, displayValue: `$${fmtNumber(reimbursement, 2)}`, highlight: true },
          { label: "At 2024 IRS Rate ($0.67)", value: standardReimbursement, displayValue: `$${fmtNumber(standardReimbursement, 2)}` },
        ],
        chartCaption:
          rate === standardRate
            ? "You're using the 2024 IRS standard business rate, so both bars match."
            : `Your $${fmtNumber(rate, 3)}/mile rate ${rate > standardRate ? "pays more" : "pays less"} than the 2024 IRS standard rate would for the same ${fmtNumber(miles, 1)} miles.`,
      };
    },
    relatedSlugs: ["fuel-cost-calculator"],
    content: {
      intro: [
        "This calculator multiplies business miles driven by a per-mile rate to work out mileage reimbursement — the standard method employers and the IRS use to compensate for using a personal vehicle for work, without tracking every gallon of gas or oil change receipt separately.",
        "It's used by freelancers and employees logging trips for expense reports, by small business owners figuring out what to reimburse themselves or their staff, and by anyone estimating a tax deduction for business use of a personal vehicle under the standard mileage method.",
        "The default rate reflects the IRS standard business mileage rate, but the field is fully editable — some employers set their own reimbursement rate above or below the IRS figure, and this calculator works the same either way.",
      ],
      howItWorks: [
        "Reimbursement is simply miles driven multiplied by the rate per mile. The IRS standard mileage rate is meant to cover the average cost of operating a vehicle — gas, depreciation, maintenance, insurance — bundled into one number, which is why it's typically used instead of tracking every actual expense.",
      ],
      faq: [
        {
          q: "What is the current IRS standard mileage rate?",
          a: "The IRS sets a standard business mileage rate each year — 67 cents per mile for 2024 — which is prefilled as the default rate here, though you can overwrite it with your employer's own rate or a prior year's figure if that's what applies.",
        },
        {
          q: "Can I use the standard mileage rate and also deduct gas separately?",
          a: "No. The standard mileage rate is meant to already cover fuel, depreciation, maintenance and insurance combined — under IRS rules you choose either the standard mileage method or the actual expense method for a given vehicle, not a mix of both.",
        },
        {
          q: "Does this include commuting miles?",
          a: "It shouldn't — ordinary commuting between home and a regular workplace generally isn't deductible or reimbursable business mileage. This calculator just multiplies whatever mile figure you enter, so it's on you to log only qualifying business trips.",
        },
        {
          q: "Why would my employer use a different rate than the IRS standard?",
          a: "Employers aren't required to use the IRS rate for reimbursement — some set a flat internal rate that's higher or lower. The IRS rate mainly matters directly if you're claiming an unreimbursed mileage deduction yourself, which itself is limited under current tax law for most employees.",
        },
      ],
    },
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
      return {
        results: [{ label: "Horsepower", value: `${fmtNumber(hp, 1)} hp`, emphasis: true }],
        formula: "HP = torque × RPM ÷ 5252",
        steps: [
          `HP = ${fmtNumber(n(i.torque, 300), 1)} lb-ft × ${fmtNumber(n(i.rpm, 5252), 0)} RPM ÷ 5252 = ${fmtNumber(hp, 1)} hp`,
          "5252 is the RPM at which torque (lb-ft) and horsepower always cross the same numeric value — it's not a rounding choice, it falls out of the unit conversion.",
        ],
        compare: [
          { label: "This Result", value: hp, displayValue: `${fmtNumber(hp, 1)} hp`, highlight: hp >= 200 },
          { label: "Typical Passenger Car", value: 200, displayValue: "~200 hp" },
        ],
        chartCaption: `For scale, a typical modern passenger car makes roughly 200 hp — this result is ${hp >= 200 ? `about ${fmtNumber(hp / 200, 1)}× that` : `about ${fmtNumber((hp / 200) * 100, 0)}% of that`}.`,
      };
    },
    relatedSlugs: ["engine-horsepower-calculator"],
    content: {
      intro: [
        "This calculator converts a torque and RPM reading into horsepower using the standard formula every dyno sheet and engine spec chart relies on. Torque and horsepower are related but distinct measurements, and this is the direct math connecting the two at any given engine speed.",
        "It gets used by engine builders and car enthusiasts reading a dyno printout that only lists torque at a specific RPM, by anyone comparing spec sheets between engines that quote figures differently, or just out of curiosity about how a particular torque number translates into horsepower.",
        "Because it's one formula applied to two numbers, everything computes instantly in your browser with no need to look up a conversion chart.",
      ],
      howItWorks: [
        "Horsepower equals torque (in lb-ft) multiplied by RPM, divided by the constant 5252. That constant isn't arbitrary — it falls directly out of the unit conversion between torque and power (horsepower is defined as work per unit time, and 5252 is the RPM value where the numeric torque and horsepower figures always come out equal, regardless of the engine).",
        "That crossover point is why torque and horsepower curves on a dyno chart always intersect exactly at 5252 RPM — below that RPM, torque reads higher than horsepower, and above it, horsepower reads higher.",
      ],
      faq: [
        {
          q: "Why do torque and horsepower always cross at 5252 RPM on a dyno chart?",
          a: "It's a direct consequence of the formula itself — HP = torque × RPM ÷ 5252 forces the two curves to have identical numeric values whenever RPM equals 5252, no matter what engine is being measured. It's not a coincidence specific to any one engine.",
        },
        {
          q: "Is horsepower or torque more important for performance?",
          a: "They describe different things — torque is rotational force, horsepower is the rate of doing work over time (it factors in RPM). A high-revving engine can make strong horsepower with modest torque, while a low-revving diesel can make huge torque with modest horsepower; which matters more depends on the application.",
        },
        {
          q: "Where do I find my engine's torque and RPM figures?",
          a: "A dyno printout is the most accurate source, since it measures your specific engine rather than a factory average. Manufacturer spec sheets also list peak torque and the RPM it occurs at, though that's usually the single peak value rather than a full curve.",
        },
        {
          q: "Does this calculator account for drivetrain losses?",
          a: "No — this is the raw torque-to-horsepower conversion at the crankshaft (or wherever the torque was measured). Power measured at the wheels on a chassis dyno is typically lower due to drivetrain losses, and this formula doesn't adjust for that difference.",
        },
      ],
    },
  },
  {
    slug: "engine-horsepower-calculator",
    title: "Engine Horsepower Calculator (Trap Speed)",
    category: "everyday",
    shortDescription: "Estimate engine horsepower from vehicle weight and quarter-mile trap speed.",
    seoDescription: "Estimate engine horsepower from vehicle weight and its quarter-mile trap speed.",
    formulaSummary: "HP = weight × (trap speed ÷ 234)³",
    fields: [
      { name: "weight", label: "Vehicle Weight", type: "number", unit: "lb", defaultValue: 3400, min: 0, convertPair: lbKgPair("weight") },
      { name: "trapSpeed", label: "Quarter-Mile Trap Speed", type: "number", unit: "mph", defaultValue: 95, min: 0 },
    ],
    calculate: (i) => {
      const hp = n(i.weight, 3400) * Math.pow(n(i.trapSpeed, 95) / 234, 3);
      return {
        results: [{ label: "Estimated Horsepower", value: `${fmtNumber(hp, 0)} hp`, emphasis: true }],
        steps: [
          `Trap speed ratio = ${fmtNumber(n(i.trapSpeed, 95), 1)} mph ÷ 234 = ${fmtNumber(n(i.trapSpeed, 95) / 234, 4)}`,
          `Cubed = ${fmtNumber(Math.pow(n(i.trapSpeed, 95) / 234, 3), 6)}`,
          `HP ≈ ${fmtNumber(n(i.weight, 3400), 0)} lb × ${fmtNumber(Math.pow(n(i.trapSpeed, 95) / 234, 3), 6)} = ${fmtNumber(hp, 0)} hp`,
        ],
        compare: [
          { label: "This Result", value: hp, displayValue: `${fmtNumber(hp, 0)} hp`, highlight: hp >= 200 },
          { label: "Typical Passenger Car", value: 200, displayValue: "~200 hp" },
        ],
        chartCaption: `For scale, a typical modern passenger car makes roughly 200 hp — this estimate is ${hp >= 200 ? `about ${fmtNumber(hp / 200, 1)}× that` : `about ${fmtNumber((hp / 200) * 100, 0)}% of that`}.`,
      };
    },
    relatedSlugs: ["horsepower-calculator"],
    content: {
      intro: [
        "This calculator estimates engine horsepower using nothing but vehicle weight and the trap speed recorded at the end of a quarter-mile drag run — the same rough method racers have used for decades to ballpark power without a dyno session.",
        "It's mainly used by drag racing and drag-strip enthusiasts comparing runs, by someone who just picked up a timeslip and wants a horsepower ballpark, or by anyone curious how much power a given trap speed roughly implies for a car of a certain weight.",
        "It's a well-known formula from racing, not a precision instrument — treat the output as a starting estimate to compare against, not a substitute for an actual dyno pull.",
      ],
      howItWorks: [
        "The formula divides trap speed by 234, cubes that ratio, and multiplies by the vehicle's weight — a relationship derived empirically from drag racing data rather than from first-principles physics. It works reasonably well as a rough estimate for typical passenger-car-based drag cars but gets less reliable for vehicles with unusual aerodynamics, all-wheel drive, or significant power-to-weight extremes.",
        "Because it only uses weight and trap speed, it doesn't account for aerodynamic drag, drivetrain losses, launch technique, or track conditions — two cars with identical horsepower can post different trap speeds for reasons this formula can't see.",
      ],
      faq: [
        {
          q: "How accurate is the trap speed horsepower formula?",
          a: "It's a widely used rule-of-thumb estimate, generally considered reasonably close for typical rear-wheel-drive cars, but it can be off by a meaningful margin for vehicles with unusual weight distribution, aerodynamics, or drivetrain type. Treat it as a ballpark, not a dyno-accurate number.",
        },
        {
          q: "What weight should I enter — curb weight or race weight?",
          a: "Use the actual weight of the car as it ran down the strip, including the driver and any fuel on board — race weight, not the bare curb weight off a spec sheet, since that's what the trap speed actually reflects.",
        },
        {
          q: "Why do two cars with the same horsepower post different trap speeds?",
          a: "Trap speed is also affected by aerodynamic drag, gearing, launch quality, tire grip, and track surface — this formula assumes those factors are roughly average, so a car with poor aerodynamics or a bad launch will trap slower than its true horsepower would suggest.",
        },
        {
          q: "Is this the same as horsepower measured at the wheels?",
          a: "It's closer to an estimate of flywheel (crank) horsepower, since it's derived from full vehicle performance rather than a chassis dyno roller. It won't exactly match either a crank dyno or a wheel dyno reading, but it lands in a similar ballpark.",
        },
      ],
    },
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
        compare: [
          { label: "Tire 1", value: d1, displayValue: `${fmtNumber(d1, 2)} in`, highlight: d1 >= d2 },
          { label: "Tire 2", value: d2, displayValue: `${fmtNumber(d2, 2)} in`, highlight: d2 > d1 },
        ],
        chartCaption: `Tire ${d2 >= d1 ? 2 : 1} stands ${fmtNumber(Math.abs(pctDiff), 2)}% taller — that changes how far you actually travel per wheel rotation versus what your speedometer reads.`,
      };
    },
    relatedSlugs: [],
    content: {
      intro: [
        "This calculator compares the overall diameter of two tire sizes given as width/aspect-ratio/rim-diameter — the three numbers printed on a tire's sidewall, like 225/50R17. It's built for the moment you're eyeing a size change and want to know how much it actually shifts the tire's height before you order a set.",
        "It's used for plus-sizing (moving to a wider tire on a bigger wheel while trying to keep overall diameter close to stock), for checking whether a used set of tires from a different size will roughly fit, and for understanding how a size swap will throw off a speedometer or odometer reading.",
        "Enter both sizes and it works out each tire's overall diameter along with the percentage difference between them — the number that actually matters for fitment and speedometer accuracy.",
      ],
      howItWorks: [
        "Overall diameter starts from the rim diameter (already in inches) and adds twice the sidewall height, since the sidewall appears above and below the rim. Sidewall height is the tire's width in millimeters times its aspect ratio (as a percentage), converted from millimeters to inches by dividing by 25.4.",
        "A tire's speedometer reading assumes the diameter (and therefore the distance covered per revolution) the vehicle was calibrated for. Swap in a tire with a meaningfully different overall diameter and every wheel rotation covers a different distance than the speedometer expects, throwing off both the speed reading and the odometer's mileage count by roughly the same percentage as the diameter difference.",
      ],
      faq: [
        {
          q: "How much tire size difference is considered safe?",
          a: "A commonly cited rule of thumb is to keep overall diameter within about 3% of the stock size — beyond that, speedometer error, clearance issues, and handling changes become more noticeable. Some vehicles tolerate more, some less, so check clearance physically when in doubt.",
        },
        {
          q: "What do the three numbers on a tire (like 225/50R17) mean?",
          a: "225 is the tire's width in millimeters, 50 is the aspect ratio — the sidewall height as a percentage of that width — and 17 is the wheel rim diameter in inches that the tire is built to fit.",
        },
        {
          q: "Why would a larger tire make my speedometer read slower than my actual speed?",
          a: "A taller tire covers more ground per revolution than the vehicle's speed sensor was calibrated to expect, so the speedometer under-reads your actual road speed — you're going faster than the dash shows.",
        },
        {
          q: "Does plus-sizing (bigger wheel, lower-profile tire) change the overall diameter?",
          a: "Not necessarily — the goal of plus-sizing is usually to pick a lower aspect ratio tire on a larger wheel so the overall diameter stays close to the original, which is exactly the comparison this calculator is built to check.",
        },
      ],
    },
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
      const maxRiser = n(i.maxRiserIn, 7.5);
      return {
        results: [
          { label: "Number of Steps", value: fmtNumber(numSteps, 0), emphasis: true },
          { label: "Riser Height", value: `${fmtNumber(riserHeight, 2)} in` },
          { label: "Total Run", value: `${fmtNumber(totalRun, 1)} in` },
          { label: "Stringer Length", value: `${fmtNumber(stringerLength / 12, 2)} ft` },
        ],
        compare: [
          { label: "Your Riser Height", value: riserHeight, displayValue: `${fmtNumber(riserHeight, 2)} in`, highlight: true },
          { label: "Code Max Riser", value: maxRiser, displayValue: `${fmtNumber(maxRiser, 2)} in` },
        ],
        chartCaption: `Each step's riser (${fmtNumber(riserHeight, 2)} in) comes in ${riserHeight <= maxRiser ? "under" : "over"} your ${fmtNumber(maxRiser, 2)} in code limit — steps are spread evenly so no single riser exceeds it.`,
      };
    },
    relatedSlugs: ["roofing-calculator"],
    content: {
      intro: [
        "This calculator works out how many steps a staircase needs, how tall each riser will be, and how long the stringer (the diagonal cutting board the treads attach to) needs to be — starting from just the total vertical rise, the tread depth you want, and a maximum riser height limit.",
        "It's built for the moment before cutting stringers on a deck, porch, shed or basement staircase: measure the total height the stairs need to climb, and the calculator spreads that rise evenly across the fewest steps that keep every riser under your code limit.",
        "Getting riser height even and consistent matters more than it might seem — a staircase where one step is noticeably taller or shorter than the rest is a well-documented tripping hazard, which is exactly what evenly dividing the total rise avoids.",
      ],
      howItWorks: [
        "The calculator first figures out the minimum number of steps needed so that no single riser exceeds your maximum riser height, then divides the total rise evenly across that many steps — this is what keeps every riser exactly the same height rather than leaving an odd, mismatched last step.",
        "Total run is the tread depth multiplied by one fewer than the number of steps (since the top step's edge is level with the landing, not a separate tread). Stringer length is then found with the Pythagorean theorem, treating rise and run as the two legs of a right triangle: stringer = √(rise² + run²).",
      ],
      faq: [
        {
          q: "What's a typical maximum riser height allowed by code?",
          a: "Most US residential codes cap riser height around 7 to 7.75 inches, though the exact limit varies by jurisdiction — check your local building code before finalizing a design, especially for anything requiring a permit.",
        },
        {
          q: "Why does the calculator sometimes give a riser height lower than my code maximum?",
          a: "Because it needs a whole number of steps to divide the total rise evenly, the actual riser height is often a bit under the maximum you entered — for example, a rise that doesn't divide evenly by 7.5 inches will land on a slightly smaller, consistent riser height instead.",
        },
        {
          q: "What's a comfortable tread depth for outdoor stairs?",
          a: "10 to 11 inches is a common comfortable range for exterior stairs, giving enough room for a full foot placement; indoor stairs are sometimes built shallower due to space constraints, but shallower treads generally feel less comfortable to walk.",
        },
        {
          q: "How is stringer length different from total rise?",
          a: "Stringer length is the diagonal length of the board that supports the stairs — always longer than the vertical rise alone, since it also has to span the horizontal run. That's why it's calculated with the Pythagorean theorem rather than just using the rise.",
        },
      ],
    },
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
        steps: [
          `Band 1 (${i.band1}) = digit ${digits[i.band1]}, Band 2 (${i.band2}) = digit ${digits[i.band2]} → two-digit number ${digits[i.band1] * 10 + digits[i.band2]}`,
          `Band 3 (${i.band3}) = multiplier ×${multipliers[i.band3]}`,
          `Resistance = ${digits[i.band1] * 10 + digits[i.band2]} × ${multipliers[i.band3]} = ${fmtNumber(value, 2)} Ω`,
          `Band 4 (${i.band4}) sets tolerance = ${tolerances[i.band4] ?? "±5%"} — the actual part can measure anywhere in that ± range and still be in spec.`,
        ],
        table: {
          headers: ["Band", "Color", "Meaning"],
          rows: [
            ["1st digit", i.band1[0].toUpperCase() + i.band1.slice(1), `${digits[i.band1]}`],
            ["2nd digit", i.band2[0].toUpperCase() + i.band2.slice(1), `${digits[i.band2]}`],
            ["Multiplier", i.band3[0].toUpperCase() + i.band3.slice(1), `×${multipliers[i.band3]}`],
            ["Tolerance", i.band4[0].toUpperCase() + i.band4.slice(1), tolerances[i.band4] ?? "±5%"],
          ],
        },
        chartCaption: `Reading the four bands left to right decodes to ${value >= 1000 ? `${fmtNumber(value / 1000, 2)} kΩ` : `${fmtNumber(value, 2)} Ω`} ${tolerances[i.band4] ?? "±5%"}.`,
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
    content: {
      intro: [
        "This calculator decodes a standard 4-band resistor color code into its actual resistance value and tolerance — the same reading you'd get with a multimeter, but from just looking at the colored bands printed on the part.",
        "It's a staple tool for electronics hobbyists, students learning circuit basics, and anyone sorting through a parts bin of unmarked resistors trying to identify what's what without a meter handy. It's also useful the other direction — checking that a resistor you're about to solder in actually matches the value your schematic calls for.",
        "Pick each band's color from the dropdowns in left-to-right reading order and it works out the resistance immediately, along with a breakdown of what each individual band contributes.",
      ],
      howItWorks: [
        "On a 4-band resistor, the first two bands are significant digits, the third band is a power-of-ten multiplier, and the fourth band indicates tolerance. The two digit bands combine into a two-digit number, which is then multiplied by the third band's multiplier value to get the resistance in ohms.",
        "The tolerance band doesn't change the nominal resistance value — it tells you the manufacturing precision, meaning the actual part could measure anywhere within that percentage of the stated value and still be considered in spec. Gold (±5%) and silver (±10%) are the most common tolerance bands on general-purpose resistors.",
      ],
      faq: [
        {
          q: "Which end of the resistor do I read first?",
          a: "Read from the end furthest from the tolerance band, which is usually gold or silver and set slightly apart from the other three bands — that gap marks it as the last band, so you read the color code starting from the opposite end.",
        },
        {
          q: "What's the difference between a 4-band and 5-band resistor?",
          a: "A 4-band resistor has two significant digit bands, while a 5-band resistor has three, giving it one more digit of precision — 5-band resistors are typically used where tighter tolerances (like ±1%) are needed. This calculator handles the more common 4-band case.",
        },
        {
          q: "What does the tolerance band actually tell me?",
          a: "It's the manufacturer's guaranteed accuracy range around the stated resistance — a 100Ω resistor with a gold ±5% band could measure anywhere from 95Ω to 105Ω and still be within spec, which matters for precision circuits but rarely for general-purpose use.",
        },
        {
          q: "Why do my measured and calculated resistance values not match exactly?",
          a: "A little difference is expected and normal — it should fall within the tolerance band's stated percentage. If a multimeter reading is far outside that range, the resistor may be damaged, mislabeled, or misread.",
        },
      ],
    },
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
        const voltage = n(i.voltage, 12);
        const resistance = n(i.resistance, 6);
        const val = voltage / resistance;
        return {
          results: [{ label: "Current", value: `${fmtNumber(val, 4)} A`, emphasis: true }],
          steps: [`I = V ÷ R = ${fmtNumber(voltage, 2)} V ÷ ${fmtNumber(resistance, 2)} Ω = ${fmtNumber(val, 4)} A`],
          compare: [
            { label: "Voltage", value: voltage, displayValue: `${fmtNumber(voltage, 2)} V` },
            { label: "Current", value: val, displayValue: `${fmtNumber(val, 4)} A`, highlight: true },
            { label: "Resistance", value: resistance, displayValue: `${fmtNumber(resistance, 2)} Ω` },
          ],
          chartCaption: `V = I × R: ${fmtNumber(voltage, 2)} V = ${fmtNumber(val, 4)} A × ${fmtNumber(resistance, 2)} Ω — all three quantities are locked together by Ohm's Law.`,
        };
      }
      if (i.solveFor === "resistance") {
        const voltage = n(i.voltage, 12);
        const current = n(i.current, 2);
        const val = voltage / current;
        return {
          results: [{ label: "Resistance", value: `${fmtNumber(val, 4)} Ω`, emphasis: true }],
          steps: [`R = V ÷ I = ${fmtNumber(voltage, 2)} V ÷ ${fmtNumber(current, 2)} A = ${fmtNumber(val, 4)} Ω`],
          compare: [
            { label: "Voltage", value: voltage, displayValue: `${fmtNumber(voltage, 2)} V` },
            { label: "Current", value: current, displayValue: `${fmtNumber(current, 2)} A` },
            { label: "Resistance", value: val, displayValue: `${fmtNumber(val, 4)} Ω`, highlight: true },
          ],
          chartCaption: `V = I × R: ${fmtNumber(voltage, 2)} V = ${fmtNumber(current, 2)} A × ${fmtNumber(val, 4)} Ω — all three quantities are locked together by Ohm's Law.`,
        };
      }
      const current = n(i.current, 2);
      const resistance = n(i.resistance, 6);
      const val = current * resistance;
      return {
        results: [{ label: "Voltage", value: `${fmtNumber(val, 4)} V`, emphasis: true }],
        steps: [`V = I × R = ${fmtNumber(current, 2)} A × ${fmtNumber(resistance, 2)} Ω = ${fmtNumber(val, 4)} V`],
        compare: [
          { label: "Voltage", value: val, displayValue: `${fmtNumber(val, 4)} V`, highlight: true },
          { label: "Current", value: current, displayValue: `${fmtNumber(current, 2)} A` },
          { label: "Resistance", value: resistance, displayValue: `${fmtNumber(resistance, 2)} Ω` },
        ],
        chartCaption: `V = I × R: ${fmtNumber(val, 4)} V = ${fmtNumber(current, 2)} A × ${fmtNumber(resistance, 2)} Ω — all three quantities are locked together by Ohm's Law.`,
      };
    },
    relatedSlugs: ["resistor-calculator", "electricity-calculator"],
    content: {
      intro: [
        "This calculator solves Ohm's Law — the relationship V = I × R between voltage, current and resistance — for whichever of the three values you're missing. Pick what you want to solve for, enter the other two, and it does the division or multiplication for you.",
        "It's a first-week concept in any electronics course, but it stays useful well past the classroom: sizing a resistor for an LED circuit, checking whether a component can handle the current a circuit will actually draw, or just verifying a hand calculation before building something.",
        "Because it's pure arithmetic on three related quantities, the result updates instantly with no data leaving your browser.",
      ],
      howItWorks: [
        "Ohm's Law states that voltage equals current times resistance (V = I × R) for a simple resistive circuit. Rearranging that same relationship gives the other two forms: current equals voltage divided by resistance (I = V ÷ R), and resistance equals voltage divided by current (R = V ÷ I) — the calculator just picks whichever rearrangement matches what you're solving for.",
      ],
      faq: [
        {
          q: "What is Ohm's Law used for in practice?",
          a: "It's the basic relationship for sizing components in any resistive circuit — figuring out what resistor value limits current to a safe level for an LED, checking a fuse or wire's current rating against expected load, or working backward from a measured voltage and resistance to find current draw.",
        },
        {
          q: "Does Ohm's Law apply to AC circuits with capacitors and inductors?",
          a: "Not directly in this simple form — capacitors and inductors introduce reactance, which behaves differently from plain resistance and requires impedance calculations instead. This calculator's V = I × R form applies cleanly to DC circuits and purely resistive AC loads.",
        },
        {
          q: "How do I find power (watts) from these values?",
          a: "Power isn't part of Ohm's Law directly, but it's closely related: P = V × I. Once you know any two of voltage, current and resistance from this calculator, you can multiply voltage by current to get power in watts.",
        },
        {
          q: "Why is my calculated current higher than what a component is rated for?",
          a: "That usually means the resistance in the circuit is too low for the voltage applied — Ohm's Law is telling you the circuit will draw more current than the part can safely handle, which is a sign to increase resistance (or reduce voltage) before building it.",
        },
      ],
    },
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
      const dailyCost = kwhPerDay * n(i.costPerKwh, 0.16);
      const monthlyCost = kwhPerDay * 30 * n(i.costPerKwh, 0.16);
      return {
        results: [
          { label: "Daily Energy Use", value: `${fmtNumber(kwhPerDay, 2)} kWh` },
          { label: "Estimated Monthly Cost", value: `$${fmtNumber(monthlyCost, 2)}`, emphasis: true },
        ],
        growthSeries: [
          { label: "1 Day", value: dailyCost, displayValue: `$${fmtNumber(dailyCost, 2)}` },
          { label: "1 Week", value: dailyCost * 7, displayValue: `$${fmtNumber(dailyCost * 7, 2)}` },
          { label: "1 Month", value: dailyCost * 30, displayValue: `$${fmtNumber(dailyCost * 30, 2)}` },
          { label: "1 Year", value: dailyCost * 365, displayValue: `$${fmtNumber(dailyCost * 365, 2)}` },
        ],
        chartCaption: `Running this appliance ${fmtNumber(n(i.hoursPerDay, 3), 1)} hrs/day quietly adds up to about $${fmtNumber(dailyCost * 365, 2)} a year at your electricity rate.`,
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
    content: {
      intro: [
        "This calculator turns an appliance's power draw in watts, how many hours a day you run it, and your electricity rate into a concrete cost — daily, weekly, monthly and yearly. It's built for the moment you're wondering whether a space heater, an old fridge, or a gaming PC left on all day is actually costing you much.",
        "People use it to compare running costs between two appliances, to spot which device is quietly driving up an electricity bill, or to decide whether upgrading to a more efficient model is worth it once the yearly savings are laid out in dollars.",
        "The math is simple multiplication done locally in your browser — nothing about your appliances or your electricity rate is stored or sent anywhere.",
      ],
      howItWorks: [
        "Energy use in kilowatt-hours is watts multiplied by hours used, divided by 1000 (since a kilowatt is 1000 watts) — kWh is the unit utilities actually bill you on, not raw watts. That daily kWh figure is then multiplied by your cost per kWh to get a daily cost, which is projected out to weekly, monthly and yearly totals by simple multiplication.",
      ],
      faq: [
        {
          q: "Where do I find an appliance's wattage?",
          a: "Check the label on the appliance itself, its nameplate, or the manufacturer spec sheet — most list wattage directly. If only amps and voltage are given, multiply them together (watts = volts × amps) to get an estimate.",
        },
        {
          q: "Where do I find my electricity rate?",
          a: "Your utility bill lists a rate per kilowatt-hour, usually somewhere in the billing details or a rate summary section. Rates vary significantly by region and sometimes by time of day, so use your actual bill's number for the most accurate result.",
        },
        {
          q: "Does this account for standby power when an appliance is off but plugged in?",
          a: "No — this only calculates cost for the hours per day you specify as active use. Many electronics draw a small amount of standby power even when switched off, which this calculator doesn't separately account for unless you include it in your hours figure.",
        },
        {
          q: "Why does a small wattage difference matter so much over a year?",
          a: "Small daily costs compound — a device costing just a few cents a day can add up to tens of dollars over a full year of continuous use, which is exactly why the yearly figure is included alongside the daily one.",
        },
      ],
    },
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
        gauge: {
          value: pct,
          min: 0,
          max: 10,
          valueLabel: `${fmtNumber(pct, 2)}%`,
          zones: [
            { label: "Good", to: 3, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Marginal", to: 5, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Excessive", to: 10, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `${fmtNumber(pct, 2)}% drop is ${pct <= 3 ? "within" : pct <= 5 ? "past" : "well past"} the commonly recommended 3% ceiling for branch circuits — the higher this reads, the more a thicker gauge wire pays for itself in delivered power.`,
      };
    },
    relatedSlugs: ["ohms-law-calculator"],
    content: {
      intro: [
        "This calculator estimates how much voltage is lost along a copper wire run given its gauge, length and the current it's carrying — the check an electrician runs before wiring anything with a long cable path, like a detached garage, a well pump, or a workshop out past the house.",
        "Wire isn't a perfect conductor — every foot of it has a small amount of resistance, and over a long enough run at high enough current, that resistance quietly eats into the voltage that actually reaches the load. This tool sizes that loss before the wire is bought and run, since undersizing a long circuit is expensive to fix after drywall is up.",
        "Enter the wire gauge, the one-way length of the run, the expected current draw and the system voltage, and it returns both the voltage lost and the percentage drop — the number that actually determines whether a gauge is adequate.",
      ],
      howItWorks: [
        "Voltage drop is calculated from the wire's resistance per 1000 feet (a standard published figure for each AWG copper wire gauge), the one-way length of the run, and the current flowing through it. The length is doubled in the formula because current has to travel out to the load and back through the return conductor — a 50-foot run means 100 feet of total conductor.",
        "The percentage drop is just the voltage lost divided by the system voltage. Electricians commonly target keeping voltage drop under about 3% for branch circuits, since drops beyond that can cause dim lighting, motors that run hot or underperform, and other symptoms of an undersized wire run.",
      ],
      faq: [
        {
          q: "What voltage drop percentage is acceptable?",
          a: "3% is a widely used guideline for branch circuits, and 5% is often cited as a combined limit for a feeder plus branch circuit together — beyond that, equipment can underperform and the National Electrical Code offers this as a recommended (not always mandatory) design target.",
        },
        {
          q: "How do I fix excessive voltage drop?",
          a: "The two main levers are using a thicker (lower AWG number) wire gauge, which has less resistance per foot, or shortening the run if that's practical. Reducing the current draw isn't usually an option since that's dictated by the load itself.",
        },
        {
          q: "Why does wire length matter twice as much as I'd expect?",
          a: "Because current has to complete a full circuit — it flows out through one conductor and back through another — so a 100-foot one-way run actually involves 200 feet of wire resistance total. This calculator's length input is one-way and doubles it internally to account for that.",
        },
        {
          q: "Does thicker wire always solve voltage drop?",
          a: "Generally yes — thicker wire has lower resistance per foot, which directly reduces voltage drop for the same length and current. The tradeoff is cost and physical size, so the goal is usually the thinnest gauge that still keeps drop within an acceptable range, not the thickest wire available.",
        },
      ],
    },
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
      const factor = factors[i.climate] ?? 25;
      const btu = n(i.areaSqFt, 300) * factor;
      return {
        results: [{ label: "Recommended BTU Capacity", value: fmtNumber(btu, 0), emphasis: true }],
        steps: [
          `Room area = ${fmtNumber(n(i.areaSqFt, 300), 0)} sq ft`,
          `Climate factor for your selection = ${factor} BTU per sq ft`,
          `BTU capacity = ${fmtNumber(n(i.areaSqFt, 300), 0)} × ${factor} = ${fmtNumber(btu, 0)} BTU`,
        ],
        notes: ["Undersizing leaves a unit that runs constantly and never quite cools/heats the room; oversizing short-cycles and wastes energy without improving comfort — aim close to this number rather than rounding up 'to be safe'."],
        gauge: {
          value: btu,
          min: 0,
          max: 60000,
          valueLabel: `${fmtNumber(btu, 0)} BTU`,
          zones: [
            { label: "Small room", to: 8000, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Medium room", to: 14000, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Large room (~2 ton)", to: 24000, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Multi-room (~3 ton)", to: 36000, barClass: "bg-orange-500 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Whole floor (~5 ton)", to: 60000, barClass: "bg-red-500 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `HVAC equipment is conventionally sized in "tons" of cooling capacity, where 1 ton = 12,000 BTU/h — your ${fmtNumber(btu, 0)} BTU need works out to roughly ${fmtNumber(btu / 12000, 1)} tons.`,
      };
    },
    relatedSlugs: ["square-footage-calculator"],
    content: {
      intro: [
        "This calculator gives a ballpark BTU (British Thermal Unit) capacity for heating or cooling a room, based on its floor area and how demanding the climate or insulation situation is. It's the number to have in hand before shopping for a window AC unit, a portable heater, or a mini-split.",
        "Buying HVAC equipment by BTU rating without a sizing check is a common way to end up disappointed — a unit that's too small runs constantly and never quite catches up, while one that's oversized short-cycles, wastes energy, and can leave a room feeling clammy since it cools too fast to properly dehumidify.",
        "Enter the room's square footage and pick the climate and insulation description that best matches your situation, and the calculator returns a BTU target along with where that lands relative to common equipment sizing (in both BTU and the 'tons' HVAC gear is conventionally rated in).",
      ],
      howItWorks: [
        "The calculation multiplies room area in square feet by a BTU-per-square-foot factor that scales with climate severity and insulation quality — a mild, well-insulated space needs less cooling or heating capacity per square foot than a poorly insulated room in a hot climate with heavy sun exposure.",
        "HVAC capacity is also commonly expressed in \"tons\" of cooling, where 1 ton equals 12,000 BTU per hour — a unit of measure that dates back to the amount of heat needed to melt a ton of ice in 24 hours. The calculator shows both units since equipment listings often use tons while room-sizing guides typically use raw BTU figures.",
      ],
      faq: [
        {
          q: "What happens if I buy an oversized AC unit \"to be safe\"?",
          a: "An oversized unit cools the room quickly but shuts off before it has time to properly remove humidity, which can leave the space feeling cold and clammy rather than genuinely comfortable — it also cycles on and off more often, adding wear and using more energy than a correctly sized unit.",
        },
        {
          q: "Does ceiling height affect the BTU calculation?",
          a: "This calculator uses floor area with a standard ceiling height assumption. A room with unusually high ceilings has more air volume to condition than the floor area alone suggests, and may need a somewhat higher BTU capacity than this estimate provides.",
        },
        {
          q: "Do I need to account for sun exposure or the number of windows?",
          a: "Significant direct sun exposure is one reason to pick the more demanding climate option in the dropdown — a sunny, south-facing room with lots of glass generally needs more cooling capacity than the same square footage in a shaded, well-insulated room.",
        },
        {
          q: "What does 1 ton of AC capacity mean in practice?",
          a: "One ton equals 12,000 BTU per hour of cooling capacity — a term that comes from the amount of heat needed to melt one ton of ice in a day. Residential AC units are commonly sold in ton increments (1.5 ton, 2 ton, 3 ton, etc.), which is why this calculator shows tons alongside raw BTU.",
        },
      ],
    },
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
      const length = n(i.lengthFt, 15);
      const width = n(i.widthFt, 12);
      const area = length * width;
      const results = [{ label: "Square Footage", value: `${fmtNumber(area, 2)} sq ft`, emphasis: true }];
      const steps = [`Area = length × width = ${fmtNumber(length, 2)} ft × ${fmtNumber(width, 2)} ft = ${fmtNumber(area, 2)} sq ft`];
      const tableRows = [
        ["Length", `${fmtNumber(length, 2)} ft`],
        ["Width", `${fmtNumber(width, 2)} ft`],
        ["Area", `${fmtNumber(area, 2)} sq ft`],
      ];
      if (n(i.pricePerSqFt) > 0) {
        const cost = area * n(i.pricePerSqFt);
        results.push({ label: "Estimated Cost", value: `$${fmtNumber(cost, 2)}`, emphasis: true });
        steps.push(`Cost = ${fmtNumber(area, 2)} sq ft × $${fmtNumber(n(i.pricePerSqFt), 2)}/sq ft = $${fmtNumber(cost, 2)}`);
        tableRows.push(["Estimated Cost", `$${fmtNumber(cost, 2)}`]);
      }
      return {
        results,
        steps,
        table: { headers: ["Dimension", "Value"], rows: tableRows },
        chartCaption: `A single rectangle: ${fmtNumber(length, 2)} ft × ${fmtNumber(width, 2)} ft = ${fmtNumber(area, 2)} sq ft.`,
      };
    },
    relatedSlugs: ["area-calculator", "tile-calculator"],
    content: {
      intro: [
        "This calculator multiplies a room's length and width to get its area in square feet, with an optional price-per-square-foot field to turn that area straight into a material cost estimate. It's the number flooring, paint, carpet and countertop quotes are almost always based on.",
        "It's used before ordering flooring or carpet, before getting a paint or tile quote, when listing or renting a property and needing an accurate square footage figure, or just settling a casual disagreement about how big a room actually is.",
        "Add a price per square foot and the same calculation gives you an estimated total cost for the room — handy for comparing quotes or budgeting a project before committing to a specific material.",
      ],
      faq: [
        {
          q: "How do I measure a room for accurate square footage?",
          a: "Measure the length and width of the room at the floor, in a straight line wall to wall, using a tape measure or laser measure for accuracy. For irregular rooms, break the space into rectangles, calculate each separately, and add the areas together.",
        },
        {
          q: "Does this work for rooms that aren't perfectly rectangular?",
          a: "Not directly — this calculator handles a single rectangle. For an L-shaped or irregular room, split it mentally into two or more rectangular sections, run each one through the calculator separately, and add the results together for the total.",
        },
        {
          q: "Should I subtract closets, alcoves or built-ins from the square footage?",
          a: "It depends on what you're using the number for — for flooring or paint material estimates, you usually want the true covered area including closets and alcoves you're actually finishing; for listing square footage, local real estate conventions vary on what counts.",
        },
        {
          q: "How do I convert square feet to square yards for flooring quotes?",
          a: "Divide square feet by 9, since a square yard is 3 feet by 3 feet (9 square feet). Carpet in particular is commonly priced by the square yard rather than the square foot.",
        },
      ],
    },
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
      const regularPay = regular * n(i.hourlyRate, 22);
      const overtimePay = overtime * n(i.hourlyRate, 22) * 1.5;
      const pay = regularPay + overtimePay;
      return {
        results: [
          { label: "Total Hours", value: fmtNumber(total, 2), emphasis: true },
          { label: "Regular Hours", value: fmtNumber(regular, 2) },
          { label: "Overtime Hours", value: fmtNumber(overtime, 2) },
          { label: "Total Pay", value: `$${fmtNumber(pay, 2)}`, emphasis: true },
        ],
        breakdown:
          overtime > 0
            ? [
                { label: "Regular Pay", value: regularPay, displayValue: `$${fmtNumber(regularPay, 2)}` },
                { label: "Overtime Pay (1.5×)", value: overtimePay, displayValue: `$${fmtNumber(overtimePay, 2)}` },
              ]
            : undefined,
        chartCaption:
          overtime > 0
            ? `Overtime hours are paid at 1.5×, so your ${fmtNumber(overtime, 2)} OT hours contribute ${fmtNumber((overtimePay / pay) * 100, 0)}% of your total pay despite being a smaller share of your hours.`
            : undefined,
      };
    },
    relatedSlugs: ["hours-calculator"],
    content: {
      intro: [
        "This calculator adds up a week's worth of daily hours, splits them into regular and overtime, and works out total pay at your hourly rate — the same math a payroll system runs, done manually for a quick check.",
        "Hourly employees use it to verify a paycheck looks right before it's deposited, managers use it to estimate weekly labor cost across a team, and freelancers or contractors use it to total up billable hours logged day by day.",
        "Enter each day's hours as a comma-separated list and an hourly rate, and it totals the week, splits out anything past 40 hours as overtime, and shows exactly how much of the total pay comes from each.",
      ],
      howItWorks: [
        "Under the standard overtime rule this calculator applies, the first 40 hours in a week are paid at your regular rate, and anything beyond 40 hours is paid at 1.5× that rate (time-and-a-half) — a common baseline under US federal overtime law for non-exempt employees, though some states and specific job categories have different or additional rules.",
        "Total pay is the sum of regular hours times the regular rate, plus overtime hours times 1.5 times the regular rate — the breakdown shown separates these two pieces so you can see exactly how much of your paycheck came from overtime specifically.",
      ],
      faq: [
        {
          q: "When does overtime pay kick in?",
          a: "This calculator uses the common federal threshold of 40 hours in a week — hours beyond that are calculated at 1.5× your regular rate. Some states set different or additional overtime rules (like daily overtime past 8 hours), so check your local labor law if your situation might differ.",
        },
        {
          q: "How do I enter hours for a day I didn't work?",
          a: "Enter 0 for that day in the comma-separated list, or simply omit it — either way, the total and overtime split will only reflect the hours you actually enter.",
        },
        {
          q: "Does this account for taxes or deductions?",
          a: "No — this calculates gross pay only, before any tax withholding, insurance deductions, or other paycheck adjustments. The number shown is what you earned before deductions, not your take-home pay.",
        },
        {
          q: "Can I use this for a pay period longer than one week?",
          a: "The overtime threshold here is based on a single 40-hour week, so for accurate overtime calculation, run each week separately rather than entering a full pay period's hours all at once — combining two weeks into one entry would miscalculate the overtime split.",
        },
      ],
    },
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
      const destLabel = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const hourDiff = diffMinutes / 60;
      return {
        results: [
          { label: "Converted Time", value: destLabel, emphasis: true },
          { label: "Day", value: dayShift === 0 ? "Same day" : dayShift > 0 ? "Next day" : "Previous day" },
        ],
        steps: [
          `Offset difference = target (${n(i.targetOffset, 1) >= 0 ? "+" : ""}${n(i.targetOffset, 1)}) − source (${n(i.sourceOffset, -5) >= 0 ? "+" : ""}${n(i.sourceOffset, -5)}) = ${hourDiff >= 0 ? "+" : ""}${fmtNumber(hourDiff, 1)} hours`,
          `${i.time} + ${fmtNumber(hourDiff, 1)}h = ${destLabel}${dayShift !== 0 ? ` (${dayShift > 0 ? "next" : "previous"} day)` : ""}`,
        ],
        compare: [
          { label: "Origin Time", value: minutes / 60, displayValue: i.time },
          { label: "Destination Time", value: total / 60, displayValue: destLabel, highlight: true },
        ],
        chartCaption: `Same moment, different clocks — the destination reads ${fmtNumber(Math.abs(hourDiff), 1)} hour${Math.abs(hourDiff) === 1 ? "" : "s"} ${hourDiff >= 0 ? "ahead of" : "behind"} the origin on the 24-hour clock.`,
      };
    },
    relatedSlugs: ["time-duration-calculator"],
    content: {
      intro: [
        "This calculator converts a clock time from one UTC offset to another — the arithmetic behind figuring out what time it is somewhere else in the world, without needing to remember which direction to shift or squinting at a world clock website.",
        "It comes up constantly for scheduling a call with someone overseas, figuring out what time a livestream or flight departure actually lands in your own zone, or double-checking a meeting invite that only lists a time zone abbreviation you're not sure of.",
        "Enter a time along with the source and target UTC offsets, and it shifts the clock time by the difference between them, flagging when the result lands on the previous or next day.",
      ],
      howItWorks: [
        "The calculator finds the difference between the target and source UTC offsets and adds that difference (in hours) to the source time. Because time zones wrap around a 24-hour clock, a shift can push the result past midnight in either direction — when that happens, the calculator flags whether the converted time falls on the previous day, the next day, or the same day as the original.",
      ],
      faq: [
        {
          q: "Does this calculator account for daylight saving time automatically?",
          a: "No — you enter the UTC offset directly, so it's on you to use the offset that's currently in effect (for example, US Eastern is UTC-5 in winter but UTC-4 during daylight saving). Double-check which offset applies to your dates before converting.",
        },
        {
          q: "What UTC offset should I use for a specific city?",
          a: "UTC offsets are commonly listed alongside time zone abbreviations (like UTC-5 for US Eastern Standard Time or UTC+1 for Central European Time) — a quick search for the specific city's current UTC offset will confirm the exact number, especially around daylight saving transitions.",
        },
        {
          q: "Why did my converted time roll over to the next or previous day?",
          a: "Time zone shifts don't respect the 24-hour clock's boundaries — adding or subtracting several hours from a time near midnight can easily push the result past 00:00 or past 24:00, which is exactly what the day indicator in the results is flagging.",
        },
        {
          q: "How do I convert between two zones that aren't UTC-based in my head?",
          a: "You don't need to — just enter each zone's own UTC offset, and the calculator handles the difference between them regardless of how far apart the two zones are or which side of UTC they're each on.",
        },
      ],
    },
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
      const waterGauge = (densityValue: number) => ({
        gauge: {
          value: densityValue,
          min: 0,
          max: 2000,
          valueLabel: `${fmtNumber(densityValue, 1)} kg/m³`,
          zones: [
            { label: "Floats in water", to: 1000, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Sinks in water", to: 2000, barClass: "bg-indigo-500 dark:bg-indigo-500", textClass: "text-indigo-600 dark:text-indigo-400" },
          ],
        },
        chartCaption: `Water is 1,000 kg/m³ (1 g/cm³) — at ${fmtNumber(densityValue, 1)} kg/m³, this substance would ${densityValue < 1000 ? "float on water" : densityValue > 1000 ? "sink in water" : "neither float nor sink — it matches water's density exactly"}.`,
      });
      if (i.solveFor === "mass") {
        const densityInput = n(i.density, 1000);
        const mass = densityInput * n(i.volume, 0.01);
        return {
          results: [{ label: "Mass", value: `${fmtNumber(mass, 4)} kg`, emphasis: true }],
          steps: [`Mass = density × volume = ${fmtNumber(densityInput, 2)} kg/m³ × ${fmtNumber(n(i.volume, 0.01), 4)} m³ = ${fmtNumber(mass, 4)} kg`],
          ...waterGauge(densityInput),
        };
      }
      if (i.solveFor === "volume") {
        const densityInput = n(i.density, 1000);
        const volume = n(i.mass, 10) / densityInput;
        return {
          results: [{ label: "Volume", value: `${fmtNumber(volume, 6)} m³`, emphasis: true }],
          steps: [`Volume = mass ÷ density = ${fmtNumber(n(i.mass, 10), 2)} kg ÷ ${fmtNumber(densityInput, 2)} kg/m³ = ${fmtNumber(volume, 6)} m³`],
          ...waterGauge(densityInput),
        };
      }
      const density = n(i.mass, 10) / n(i.volume, 0.01);
      return {
        results: [{ label: "Density", value: `${fmtNumber(density, 4)} kg/m³`, emphasis: true }],
        steps: [`Density = mass ÷ volume = ${fmtNumber(n(i.mass, 10), 2)} kg ÷ ${fmtNumber(n(i.volume, 0.01), 4)} m³ = ${fmtNumber(density, 4)} kg/m³`],
        ...waterGauge(density),
      };
    },
    relatedSlugs: ["molarity-calculator"],
    content: {
      intro: [
        "This calculator solves the density relationship (density = mass ÷ volume) for whichever of the three quantities you're missing — density, mass or volume — given the other two. Pick what you're solving for and it handles the division or multiplication.",
        "It shows up in physics and chemistry homework, in material identification (comparing a measured density against known reference values to guess what a substance is), and in practical questions like predicting whether an object will float or sink in water.",
        "Because the calculation is pure arithmetic, results update instantly, and the gauge compares your result directly against water's density — a familiar reference point for whether something floats or sinks.",
      ],
      howItWorks: [
        "Density is mass divided by volume (ρ = m/V). Solving for mass instead multiplies density by volume, and solving for volume divides mass by density — the same relationship rearranged depending on which quantity is unknown.",
        "Water's density of 1,000 kg/m³ (equivalently 1 g/cm³) is used as the reference point in the gauge: anything less dense than water floats, and anything denser sinks, which is why density is often the deciding factor in float-or-sink questions and material identification.",
      ],
      faq: [
        {
          q: "Why does density determine whether something floats or sinks?",
          a: "An object floats in a fluid when it's less dense than that fluid, and sinks when it's denser — this is a direct consequence of buoyancy (Archimedes' principle). Water's density of 1,000 kg/m³ is the reference most float/sink questions are measured against.",
        },
        {
          q: "What units does this calculator use?",
          a: "Mass in kilograms, volume in cubic meters, and density in kilograms per cubic meter — standard SI units. If your data is in other units (grams, cm³, g/mL), convert first, or note that 1 g/cm³ equals 1,000 kg/m³ for a quick mental conversion.",
        },
        {
          q: "How can I use density to identify an unknown material?",
          a: "Measure the object's mass and volume, calculate density, and compare the result to a table of known material densities — metals, plastics and liquids each have fairly distinct densities, which is a common quick way to narrow down what something might be.",
        },
        {
          q: "Does temperature affect density?",
          a: "Yes — most materials expand slightly and become less dense as temperature rises (water near freezing is a notable exception). This calculator computes density from the mass and volume you provide, so any temperature effect needs to already be reflected in those measured values.",
        },
      ],
    },
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
      const gaugeMax = molarity > 1.5 ? Math.ceil(molarity * 1.2) : 2;
      const concLabel = molarity < 0.1 ? "Dilute" : molarity < 1 ? "Moderate" : "Concentrated";
      return {
        results: [{ label: "Molarity", value: `${fmtNumber(molarity, 4)} mol/L`, emphasis: true }],
        steps: [
          ...(i.mode === "mass" ? [`Moles = mass ÷ molar mass = ${fmtNumber(n(i.mass, 29.25), 2)} g ÷ ${fmtNumber(n(i.molarMass, 58.44), 2)} g/mol = ${fmtNumber(moles, 4)} mol`] : []),
          `Molarity = moles ÷ volume = ${fmtNumber(moles, 4)} mol ÷ ${fmtNumber(n(i.volumeL, 1), 3)} L = ${fmtNumber(molarity, 4)} mol/L`,
        ],
        gauge: {
          value: molarity,
          min: 0,
          max: gaugeMax,
          valueLabel: `${fmtNumber(molarity, 3)} M`,
          zones: [
            { label: "Dilute", to: 0.1, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Moderate", to: 1, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Concentrated", to: gaugeMax, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `At ${fmtNumber(molarity, 3)} mol/L, this solution reads as "${concLabel}" — general chemistry commonly treats solutions under 0.1 M as dilute and over 1 M as concentrated.`,
      };
    },
    relatedSlugs: ["molecular-weight-calculator"],
    content: {
      intro: [
        "This calculator works out the molarity of a solution — how many moles of solute are dissolved per liter — either directly from a known moles figure, or from a mass and molar mass if you're starting from a scale reading instead of a moles count.",
        "It's a standard tool in chemistry coursework and lab work: preparing a solution to a target concentration, checking a calculation before mixing reagents, or converting between a recipe given in grams and one given in molarity.",
        "Switch the input mode depending on what you actually have on hand — moles directly, or mass plus the compound's molar mass — and the calculator handles the rest, including a quick read on whether the resulting solution counts as dilute or concentrated.",
      ],
      howItWorks: [
        "When starting from mass, moles are first found by dividing mass by molar mass (moles = mass ÷ molar mass) — molar mass is specific to each compound and can be found on a label, a safety data sheet, or calculated with the Molecular Weight Calculator.",
        "Molarity itself is moles of solute divided by the solution's volume in liters (M = mol/L). General chemistry commonly treats concentrations under about 0.1 M as dilute and over 1 M as concentrated, which is the rough scale the gauge above reflects.",
      ],
      faq: [
        {
          q: "What's the difference between molarity and molality?",
          a: "Molarity is moles of solute per liter of solution (volume-based), while molality is moles of solute per kilogram of solvent (mass-based). Molarity is more common in general lab work, while molality is preferred when temperature changes might affect volume, since mass doesn't shift with temperature.",
        },
        {
          q: "Where do I find a compound's molar mass?",
          a: "It's usually printed on the reagent bottle's label or safety data sheet. If you only know the chemical formula, the Molecular Weight Calculator will compute it directly by summing each element's atomic weight.",
        },
        {
          q: "How do I prepare a solution of a specific molarity?",
          a: "Rearrange the molarity formula to solve for mass: mass = molarity × volume × molar mass. This calculator's mass-input mode does exactly that calculation in reverse — enter mass and molar mass to check the molarity a given amount will produce in your chosen volume.",
        },
        {
          q: "Does molarity change if I dilute the solution?",
          a: "Yes — adding solvent increases the volume while the moles of solute stay the same, which lowers the molarity proportionally. That relationship (M₁V₁ = M₂V₂) is the basis for calculating dilutions, though this calculator handles the base molarity formula rather than the dilution equation itself.",
        },
      ],
    },
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
        breakdown: result.elements.map((e) => ({
          label: `${e.symbol}${e.count > 1 ? e.count : ""}`,
          value: e.contribution,
          displayValue: `${fmtNumber(e.contribution, 3)} g/mol`,
        })),
        chartCaption: `Each element's share of the ${fmtNumber(result.mw, 3)} g/mol total — the heaviest contributor is ${result.elements.reduce((a, b) => (b.contribution > a.contribution ? b : a)).symbol}.`,
      };
    },
    relatedSlugs: ["molarity-calculator"],
    content: {
      intro: [
        "This calculator adds up the molecular (molar) weight of a chemical formula by looking up each element's atomic weight and summing it across the formula — type in something like H2O or C6H12O6 and it returns the total in grams per mole, along with each element's individual contribution.",
        "It's a routine step in chemistry coursework and lab prep: converting a target mass into moles, preparing a solution to a specific molarity, or double-checking a stoichiometry calculation by hand before trusting it.",
        "The formula parser reads element symbols and their subscript counts directly from what you type, so entering a compound is as quick as typing its formula — no periodic table lookup required.",
      ],
      howItWorks: [
        "Each element's atomic weight (from the periodic table) is multiplied by how many times it appears in the formula, and those contributions are summed to get the total molecular weight. For glucose (C6H12O6), that means 6 carbons, 12 hydrogens and 6 oxygens each contributing their atomic weight times their count.",
      ],
      faq: [
        {
          q: "Can I enter formulas with parentheses, like Ca(OH)2?",
          a: "No — this parser reads element symbols and subscript counts directly, without expanding parenthesized groups. For a compound like Ca(OH)2, expand it manually first (CaO2H2) before entering it.",
        },
        {
          q: "Does this handle hydrates, like CuSO4·5H2O?",
          a: "Not automatically — hydrate notation with a center dot isn't supported by the parser. Calculate the anhydrous compound and the water separately, then add the water's contribution (5 × 18.015 g/mol) by hand for a hydrate.",
        },
        {
          q: "What's the difference between molecular weight and molar mass?",
          a: "In practice they're used interchangeably for most purposes — both describe the mass of one mole of a substance in grams per mole. Molecular weight technically refers to a single molecule's mass in atomic mass units, but numerically it matches molar mass in g/mol.",
        },
        {
          q: "Why did my formula return an error?",
          a: "The parser expects standard element symbols with correct capitalization (Na, not NA or na) and no parentheses, spaces, or hydrate dots. Double-check that every part of the formula matches a real element symbol and that counts are written as plain numbers directly after the symbol.",
        },
      ],
    },
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
        return {
          results: [{ label: "Number", value: fmtNumber(value, 0), emphasis: true }],
          notes: ["Read left to right, adding each symbol's value — except when a smaller symbol sits before a larger one (like IV or IX), which subtracts instead of adds."],
        };
      }
      const num = Math.round(n(i.number, 1994));
      if (num < 1 || num > 3999) return { results: [], error: "Enter a number between 1 and 3999." };
      const roman = toRoman(num);
      const parts: string[] = [];
      let remaining = num;
      const table: [number, string][] = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
      for (const [value, symbol] of table) {
        let count = 0;
        while (remaining >= value) { remaining -= value; count++; }
        if (count > 0) parts.push(`${symbol}${count > 1 ? ` ×${count}` : ""} (${value * count})`);
      }
      return {
        results: [{ label: "Roman Numeral", value: roman, emphasis: true }],
        steps: [`${num} breaks down into: ${parts.join(" + ")}`, `Assembled: ${roman}`],
      };
    },
    relatedSlugs: ["base-converter"],
    content: {
      intro: [
        "This tool converts a regular number into Roman numerals, or reads a Roman numeral back into a number — the same notation still stamped on clock faces, movie copyright years, book chapter numbers, and the corners of the Super Bowl.",
        "People reach for it when engraving a wedding date or anniversary year onto a ring, decoding the copyright numerals hidden in a movie's closing credits, checking a Super Bowl or Olympic Games number, or just working through a school assignment on ancient numbering systems.",
        "Switch the direction depending on which way you're converting, and it shows the breakdown step by step so the logic behind the result is visible, not just the answer.",
      ],
      howItWorks: [
        "Roman numerals use seven symbols (I=1, V=5, X=10, L=50, C=100, D=500, M=1000) combined additively, with a subtractive shortcut for four specific cases: a smaller symbol placed immediately before a larger one subtracts instead of adds (IV=4, IX=9, XL=40, XC=90, CD=400, CM=900). Converting a number to Roman numerals works greedily from the largest value down, repeatedly subtracting the biggest symbol that still fits.",
        "Reading a Roman numeral back into a number works the opposite way: scan left to right, adding each symbol's value, except when a smaller symbol sits directly before a larger one — in that case, subtract the smaller value instead of adding it.",
      ],
      faq: [
        {
          q: "What's the highest number this calculator can convert?",
          a: "Standard Roman numeral notation supports numbers from 1 to 3999 using the basic seven symbols — larger numbers traditionally require an overline notation (multiplying a symbol's value by 1000) that isn't handled here.",
        },
        {
          q: "Why is 4 written as IV instead of IIII?",
          a: "IV uses the subtractive shortcut (one less than V) and is the standard modern convention, though IIII does appear historically and is still occasionally used on clock faces for visual symmetry with VIII on the opposite side.",
        },
        {
          q: "How do I read a Roman numeral copyright date in movie credits?",
          a: "Break it into recognizable chunks from left to right — for MCMXCIV, that's M (1000) + CM (900) + XC (90) + IV (4), totaling 1994. Entering the numeral into this calculator's reverse mode does that breakdown automatically.",
        },
        {
          q: "Can Roman numerals represent zero or negative numbers?",
          a: "No — the classical Roman numeral system has no symbol for zero and no way to represent negative values, which is one of the reasons it was eventually replaced by Arabic numerals for general arithmetic.",
        },
      ],
    },
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
      const differentialsInOrder = scores.map((s) => ((s - n(i.courseRating, 72)) * 113) / n(i.slopeRating, 113));
      const differentials = [...differentialsInOrder].sort((a, b) => a - b);
      const useCount = Math.max(1, Math.ceil(differentials.length / 2));
      const best = differentials.slice(0, useCount);
      const index = (best.reduce((a, b) => a + b, 0) / best.length) * 0.96;
      return {
        results: [{ label: "Estimated Handicap Index", value: fmtNumber(index, 1), emphasis: true }],
        notes: ["A simplified estimate using your best-half differentials — the official USGA formula uses more detailed round-count tables."],
        growthSeries: scores.map((s, idx) => ({
          label: `Round ${idx + 1}`,
          value: s,
          displayValue: `Shot ${s} (diff. ${fmtNumber(differentialsInOrder[idx], 1)})`,
        })),
        chartCaption: `Your score differential per round, in the order you played them — the handicap index uses only your best ${useCount} of these ${differentials.length}, not a straight average of every round.`,
      };
    },
    relatedSlugs: [],
    content: {
      intro: [
        "This calculator estimates a golf handicap index from a course rating, slope rating and a list of your recent round scores — a simplified version of the differential-based system golfers use to compare skill across different courses of varying difficulty.",
        "Golfers use it after a round to track how their handicap is trending, before a tournament to submit or verify an estimated index, or just to satisfy curiosity about where a handful of recent scores puts them without digging through an official handicap tracking app.",
        "Enter your course and slope rating along with a comma-separated list of recent scores, and it calculates a score differential for each round before combining the best ones into an index.",
      ],
      howItWorks: [
        "Each round produces a score differential: (your score − course rating) × 113 ÷ slope rating. The 113 constant is the slope rating of a course of \"standard\" difficulty, which normalizes differentials so rounds on harder or easier courses can be fairly compared against each other.",
        "The handicap index is calculated from only your best half of recent differentials (not all of them), averaged and then multiplied by 0.96 — a deliberate downward adjustment baked into the handicap system. This calculator uses that same best-half approach as a simplified stand-in for the official USGA method, which uses more detailed round-count tables depending on how many rounds you've played.",
      ],
      faq: [
        {
          q: "Why does the handicap only use my best rounds instead of all of them?",
          a: "The handicap system is meant to reflect potential skill level, not average performance, so it deliberately weights toward your better rounds rather than averaging in every score — using only the best half of recent differentials is a simplified version of that same idea.",
        },
        {
          q: "What are course rating and slope rating?",
          a: "Course rating is the expected score for a scratch (zero-handicap) golfer on that course, while slope rating measures how much harder the course plays for a bogey golfer relative to a scratch golfer — both numbers are printed on the scorecard or the course's official rating sheet.",
        },
        {
          q: "How many rounds do I need for an accurate handicap?",
          a: "More recent rounds generally produce a more stable and representative handicap. The official USGA system uses a sliding scale based on how many of your last 20 rounds are available; this calculator's simplified best-half method works reasonably with as few as a handful of rounds, but stabilizes further with more.",
        },
        {
          q: "Is this the same number as my official USGA Handicap Index?",
          a: "It's a close approximation using the same core differential formula, but the official USGA system applies more detailed round-count tables and additional adjustments that this simplified calculator doesn't replicate exactly — treat this as a solid estimate, not an official index.",
        },
      ],
    },
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
        return {
          results,
          table: {
            headers: ["Sleep Cycles", "Total Sleep", "Wake-Up Time"],
            rows: [4, 5, 6].map((cycles) => [`${cycles} cycles`, `${(cycles * 1.5).toFixed(1)} hrs`, fmtTime(bed + fallAsleepMinutes + cycles * 90)]),
          },
          chartCaption: "Waking up right as a 90-minute cycle ends (rather than mid-cycle) is what actually makes you feel rested — more total sleep isn't always the better option here.",
        };
      }
      const wake = parseClock(i.time);
      if (wake === null) return { results: [], error: "Enter your wake-up time as HH:MM in 24-hour format." };
      const results = [6, 5, 4].map((cycles) => ({ label: `${cycles} cycles (${(cycles * 1.5).toFixed(1)}h sleep)`, value: fmtTime(wake - fallAsleepMinutes - cycles * 90), emphasis: cycles === 5 }));
      return {
        results,
        table: {
          headers: ["Sleep Cycles", "Total Sleep", "Bedtime"],
          rows: [6, 5, 4].map((cycles) => [`${cycles} cycles`, `${(cycles * 1.5).toFixed(1)} hrs`, fmtTime(wake - fallAsleepMinutes - cycles * 90)]),
        },
        chartCaption: "Pick the bedtime that lines up with a full number of 90-minute cycles before your alarm — falling asleep mid-cycle is what makes an alarm feel brutal even after 'enough' hours.",
      };
    },
    relatedSlugs: ["age-calculator"],
    content: {
      intro: [
        "This calculator works out either a set of bedtime options based on when you need to wake up, or a set of wake-up time options based on when you're going to bed — both built around 90-minute sleep cycles rather than a flat 8-hour target.",
        "It's for the moment before setting an alarm: deciding what time to actually go to bed given a fixed wake-up time tomorrow, or figuring out the best time to wake up if you're heading to bed right now and want to avoid a groggy mid-cycle wakeup.",
        "Rather than a single recommendation, it lists several options at different cycle counts, since waking up cleanly at the end of a cycle usually matters more for feeling rested than simply maximizing total hours.",
      ],
      howItWorks: [
        "Sleep progresses in cycles of roughly 90 minutes each, moving through lighter and deeper stages before starting the next cycle. Waking up in the middle of a cycle — especially during deep sleep — tends to produce that groggy, hard-to-shake feeling known as sleep inertia, even if the total hours slept were reasonable.",
        "The calculator adds a 15-minute buffer for the average time it takes to actually fall asleep, then works in whole 90-minute increments from there — showing a few options (typically 4, 5 and 6 full cycles) so you can pick between more sleep or an earlier end time depending on what your schedule allows.",
      ],
      faq: [
        {
          q: "Why does this use 90-minute cycles instead of just 8 hours?",
          a: "Sleep isn't uniform — it moves through repeating cycles of roughly 90 minutes, and waking up between cycles rather than in the middle of one is generally associated with feeling more rested, even if the total hours differ slightly from a round 8.",
        },
        {
          q: "Why is there a 15-minute buffer added before the cycles start?",
          a: "It accounts for typical sleep latency — the average time it takes a person to actually fall asleep after getting into bed. Skipping that buffer would slightly overestimate how much cycle-aligned sleep you'd actually get by your wake-up time.",
        },
        {
          q: "Is 4 cycles (6 hours) of sleep enough?",
          a: "It's on the low end of what's generally recommended for adults, and is offered here mainly as the shortest cycle-aligned option when a full night isn't possible — most sleep guidelines recommend 5 to 6 full cycles (7.5 to 9 hours) for most adults on a regular basis.",
        },
        {
          q: "Does everyone's sleep cycle last exactly 90 minutes?",
          a: "90 minutes is a commonly used average, but actual cycle length varies somewhat by individual and even night to night — treat the options here as a solid general guideline rather than an exact personal measurement.",
        },
      ],
    },
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
      const baseSquares = n(i.roofAreaSqFt, 1800) / 100;
      const areaWithWaste = n(i.roofAreaSqFt, 1800) * (1 + n(i.wastePercent, 10) / 100);
      const squares = areaWithWaste / 100;
      const wasteSquares = squares - baseSquares;
      return {
        results: [
          { label: "Roofing Squares Needed", value: fmtNumber(squares, 2), emphasis: true },
          { label: "Shingle Bundles (≈3/square)", value: fmtNumber(Math.ceil(squares * 3), 0) },
        ],
        breakdown: [
          { label: "Base Roof Area", value: baseSquares, displayValue: `${fmtNumber(baseSquares, 2)} squares` },
          { label: "Waste Allowance", value: wasteSquares, displayValue: `${fmtNumber(wasteSquares, 2)} squares` },
        ],
        chartCaption: `Your ${fmtNumber(n(i.wastePercent, 10), 0)}% waste factor adds ${fmtNumber(wasteSquares, 2)} extra squares on top of the roof's actual area, to cover cuts, overlaps and hips/valleys.`,
      };
    },
    relatedSlugs: ["square-footage-calculator", "tile-calculator"],
    content: {
      intro: [
        "This calculator converts a roof's area into roofing squares — the unit roofers actually price and order material in — along with an estimated shingle bundle count, so you have real numbers before a materials run or a contractor quote.",
        "It's used ahead of a reroofing project to estimate material cost, to sanity-check a contractor's quoted square count against the roof's actual measured area, or to plan a DIY shed or garage roof from scratch.",
        "Roof area is trickier to measure than floor area since it includes slope, hips, valleys and ridge lines that a simple footprint measurement misses — this calculator assumes you're entering the actual roof surface area (not the building's footprint), with a waste factor built in to cover the cuts and overlaps that measurement alone won't catch.",
      ],
      howItWorks: [
        "A roofing square is a standard unit equal to 100 square feet of roof surface — dividing total roof area by 100 gives the base square count. Adding a waste percentage on top accounts for material lost to angled cuts around hips, valleys and ridges, plus normal shingle overlap, both of which increase actual material needed beyond the roof's raw area.",
        "Shingle bundles are estimated at roughly 3 bundles per square, which is standard for most architectural and 3-tab asphalt shingles, though some heavier or specialty shingle products may require a different bundle-per-square ratio — check the product packaging for the exact coverage rate.",
      ],
      faq: [
        {
          q: "What's a typical waste factor for a roofing project?",
          a: "10% is a common default for a straightforward gable roof; more complex rooflines with lots of hips, valleys, dormers or a steep pitch often warrant 15% or more to cover the extra angled cuts those features require.",
        },
        {
          q: "How many shingle bundles come in a square?",
          a: "Most standard asphalt shingles are packaged 3 bundles to a square (100 sq ft), which is the ratio this calculator uses — but always confirm against the specific product's packaging, since some heavier or specialty shingles use a different bundle count per square.",
        },
        {
          q: "How do I measure roof area if I can't get on the roof?",
          a: "Satellite measurement tools, a contractor's roof measurement report, or measuring the building's footprint and multiplying by a pitch-based multiplier are all common approaches — a steeper roof has meaningfully more actual surface area than its footprint alone suggests.",
        },
        {
          q: "Should I order extra beyond the calculated bundle count?",
          a: "Rounding up to the next full bundle (which the calculator already does) plus keeping the waste factor generous for a complex roof is usually enough — running short mid-project, especially on a specific shingle color batch, is more costly than having a spare bundle or two on hand.",
        },
      ],
    },
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
      const baseTiles = roomArea / tileAreaSqFt;
      const tiles = baseTiles * (1 + n(i.wastePercent, 10) / 100);
      const wasteTiles = tiles - baseTiles;
      return {
        results: [{ label: "Tiles Needed", value: fmtNumber(Math.ceil(tiles), 0), emphasis: true }],
        breakdown: [
          { label: "Tiles to Cover Room", value: baseTiles, displayValue: `${fmtNumber(Math.ceil(baseTiles), 0)} tiles` },
          { label: "Waste / Cut Allowance", value: wasteTiles, displayValue: `${fmtNumber(Math.ceil(wasteTiles), 0)} tiles` },
        ],
        chartCaption: `Buying only the base tile count leaves nothing for cuts around edges and breakage — the ${fmtNumber(n(i.wastePercent, 10), 0)}% waste allowance covers that so you don't have to make a second trip.`,
      };
    },
    relatedSlugs: ["square-footage-calculator", "roofing-calculator"],
    content: {
      intro: [
        "This calculator works out how many tiles a floor or wall job needs, based on room dimensions, individual tile size, and a waste allowance for cuts and breakage — the number to have before standing in a tile aisle guessing at boxes.",
        "It's used before a bathroom, kitchen backsplash, or flooring retile — sizing a materials order so you buy enough in one trip without wildly overbuying, especially useful since tile is sold by the box and running short mid-job on a specific batch or dye lot can mean a mismatched replacement.",
        "Enter the room's length and width along with the individual tile's dimensions, and it converts everything to a common unit before dividing — plus a waste percentage on top for the pieces lost to edge cuts and the occasional cracked tile.",
      ],
      howItWorks: [
        "Room area (length × width, in square feet) is divided by each tile's area (converted from inches to square feet by multiplying tile length × width and dividing by 144) to get the base number of tiles needed to cover the floor with no cuts or breakage.",
        "The waste percentage is added on top of that base count to cover tiles cut at the edges of the room (which rarely use a full tile) and the inevitable breakage that happens during cutting and installation — skipping this allowance is a common reason DIY tile jobs come up short right at the finish line.",
      ],
      faq: [
        {
          q: "How much waste allowance should I add for tile?",
          a: "10% is a reasonable default for a simple rectangular room laid in a straight pattern; more complex layouts (diagonal patterns, herringbone, lots of corners or fixtures to cut around) commonly need 15% or more.",
        },
        {
          q: "Should I round the tile count up to full boxes?",
          a: "Yes — tile is sold by the box, and this calculator's result is the raw tile count. Check how many tiles come per box from the product you're buying and round up to the next full box, since buying loose individual tiles usually isn't an option.",
        },
        {
          q: "Does grout line width affect how many tiles I need?",
          a: "Not significantly for the tile count itself — grout lines take up a small amount of space between tiles, but the effect on total tile count is minor compared to the waste factor for cuts. It matters more for grout quantity than for tile quantity.",
        },
        {
          q: "What if my room isn't a perfect rectangle?",
          a: "Split the room into rectangular sections, run each through the calculator separately, and add the tile counts together — that keeps the area math accurate for irregular layouts like L-shaped bathrooms or rooms with alcoves.",
        },
      ],
    },
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
        table: {
          headers: ["Buying Option", "Quantity"],
          rows: [
            ["Bulk (by the yard)", `${fmtNumber(cubicYards, 2)} cubic yards`],
            ["2 cu ft bags", `${fmtNumber(Math.ceil(bags2cf), 0)} bags`],
          ],
        },
        chartCaption: "Bulk delivery is usually cheaper per cubic yard for larger beds; bagged mulch is easier to haul in a car for small or oddly-shaped beds — both rows describe the same total volume.",
      };
    },
    relatedSlugs: ["gravel-calculator", "concrete-calculator"],
    content: {
      intro: [
        "This calculator converts a garden bed's area and desired mulch depth into cubic yards, plus the equivalent number of standard 2-cubic-foot bags — the two ways mulch is actually sold, whether you're having it delivered in bulk or hauling bags from a garden center.",
        "It's used every spring or fall when refreshing garden beds, when planning a new landscaping bed from scratch, or when trying to decide whether a bulk delivery is worth it versus a trunk full of bagged mulch for a smaller area.",
        "Enter the bed's square footage and how deep you want the mulch layer, and it returns both the bulk cubic-yard figure and the bagged equivalent side by side, so you can buy however suits the job.",
      ],
      howItWorks: [
        "Cubic yards are calculated as area (in square feet) times depth (converted from inches to feet by dividing by 12), divided by 27 — since a cubic yard equals 27 cubic feet (3 ft × 3 ft × 3 ft). That same total volume in cubic feet, divided by 2, gives the number of standard 2-cubic-foot bags.",
      ],
      faq: [
        {
          q: "How deep should mulch be applied?",
          a: "2 to 3 inches is the commonly recommended depth for most garden beds — enough to suppress weeds and retain soil moisture without smothering plant roots or trapping excess moisture against stems and trunks.",
        },
        {
          q: "Is bulk mulch or bagged mulch cheaper?",
          a: "Bulk mulch is typically cheaper per cubic yard for larger areas, since you're not paying for bagging, but most suppliers have a delivery minimum that makes bulk impractical for small beds — bagged mulch is usually more cost-effective and convenient below roughly 2-3 cubic yards.",
        },
        {
          q: "Do I need to remove old mulch before adding new mulch?",
          a: "Not usually — a fresh layer on top of old, mostly-decomposed mulch is standard practice. If old mulch has built up to more than 3-4 inches total, raking some out first helps avoid smothering roots or creating excessive moisture retention against the soil.",
        },
        {
          q: "How often should garden beds be re-mulched?",
          a: "Once a year is typical for most organic mulches, since they break down and settle over time — though a thin top-up rather than a full fresh layer is often enough if the existing mulch hasn't fully decomposed.",
        },
      ],
    },
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
        table: {
          headers: ["Measure", "Quantity"],
          rows: [
            ["Volume", `${fmtNumber(cubicYards, 2)} cubic yards`],
            ["Weight (≈1.4 tons/yd³)", `${fmtNumber(tons, 2)} tons`],
          ],
        },
        chartCaption: "Gravel suppliers usually sell and deliver by weight (tons) even though you're planning by volume — both numbers describe the same pile.",
      };
    },
    relatedSlugs: ["mulch-calculator", "concrete-calculator"],
    content: {
      intro: [
        "This calculator converts a driveway, path or base layer's area and depth into cubic yards of gravel, plus the approximate weight in tons — the two numbers that matter when you're getting quotes, since gravel suppliers typically sell and deliver by weight even though you're planning the job by volume.",
        "It's used for sizing a new driveway base, refreshing a gravel path, or backfilling a drainage trench — anywhere a layer of crushed stone or gravel needs to cover a known area at a known depth.",
        "Enter the area and how deep you want the gravel layer, and it returns both the volume and the estimated tonnage so you're not caught off guard by a supplier quoting in a different unit than you were expecting.",
      ],
      howItWorks: [
        "Volume in cubic yards is area (in square feet) times depth (converted from inches to feet), divided by 27 cubic feet per cubic yard. Weight is then estimated by multiplying cubic yards by roughly 1.4 tons per cubic yard — a typical density for common crushed gravel, though the exact figure varies somewhat by material type and how tightly it's compacted.",
      ],
      faq: [
        {
          q: "How deep should a gravel driveway base be?",
          a: "4 to 6 inches is a common depth for a base layer under a driveway, sometimes built up in multiple compacted layers for better stability; a decorative gravel path on top of existing ground can often get by with 2 to 3 inches.",
        },
        {
          q: "Why does gravel weight vary — is 1.4 tons per cubic yard always accurate?",
          a: "It's a reasonable average for common crushed gravel, but actual weight varies by material (river rock, crushed limestone, pea gravel) and by how compacted it is — for a large or expensive order, it's worth confirming the specific product's density with your supplier.",
        },
        {
          q: "Should I compact the gravel before calculating the finished depth?",
          a: "Loose gravel compacts down somewhat once driven or walked on, so ordering slightly more than the bare finished-depth calculation — or accounting for compaction in the depth you enter — helps avoid ending up with a thinner layer than planned.",
        },
        {
          q: "Do I need a landscape fabric layer under gravel?",
          a: "It's commonly recommended under driveways and paths to prevent the gravel from sinking into the soil over time and to reduce weed growth — it doesn't change the gravel volume calculation itself, but it's worth budgeting for separately.",
        },
      ],
    },
  },
  {
    slug: "wind-chill-calculator",
    title: "Wind Chill Calculator",
    category: "everyday",
    shortDescription: "Calculate the wind chill (feels-like) temperature.",
    seoDescription: "Calculate the wind chill temperature using the National Weather Service formula.",
    formulaSummary: "NWS wind chill formula",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 25, max: 50, convertPair: fCPair("tempF") },
      { name: "windMph", label: "Wind Speed", type: "number", unit: "mph", defaultValue: 15, min: 3 },
    ],
    calculate: (i) => {
      const t = n(i.tempF, 25);
      const v = Math.max(3, n(i.windMph, 15));
      const wc = 35.74 + 0.6215 * t - 35.75 * Math.pow(v, 0.16) + 0.4275 * t * Math.pow(v, 0.16);
      return {
        results: [{ label: "Wind Chill", value: `${fmtNumber(wc, 1)}°F`, emphasis: true }],
        notes: ["Valid for temperatures at or below 50°F and wind speeds of 3+ mph."],
        gauge: {
          value: wc,
          min: -60,
          max: 50,
          valueLabel: `${fmtNumber(wc, 1)}°F`,
          zones: [
            { label: "Extreme (frostbite <5 min)", to: -35, barClass: "bg-red-500 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "High Risk (frostbite <10 min)", to: -19, barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Increasing Risk (frostbite <30 min)", to: 0, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Cold", to: 32, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Mild", to: 50, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
          ],
        },
        chartCaption: wc < 0 ? `At ${fmtNumber(wc, 1)}°F, exposed skin is at real risk of frostbite — the colder it reads, the faster that risk sets in.` : `At ${fmtNumber(wc, 1)}°F it feels cold, but this is outside the range where frostbite is an immediate concern.`,
      };
    },
    relatedSlugs: ["heat-index-calculator", "dew-point-calculator"],
    content: {
      intro: [
        "This calculator works out wind chill — how much colder moving air makes cold weather actually feel on exposed skin — using the official National Weather Service formula, from just an air temperature and wind speed.",
        "It's checked before heading outside in winter weather: deciding how many layers a cold, windy commute actually calls for, judging frostbite risk before outdoor work or sports, or just understanding why a forecast's \"feels like\" temperature reads so much colder than the actual air temperature.",
        "Wind strips away the thin layer of warmed air that naturally clings to skin, which is why the same air temperature can feel dramatically colder on a windy day than a still one — this calculator quantifies exactly how much colder.",
      ],
      howItWorks: [
        "The National Weather Service wind chill formula combines air temperature and wind speed (raised to the 0.16 power, reflecting that the cooling effect of wind increases quickly at first but levels off at higher speeds) into a single \"feels like\" temperature. It's only valid for temperatures at or below 50°F and wind speeds of 3 mph or more — outside that range, wind chill isn't a meaningful or accurate measure.",
        "The frostbite risk zones shown are based on NWS guidance for how quickly frostbite can set in on exposed skin at a given wind chill value — the colder the reading, the less time it takes for frostbite risk to become significant.",
      ],
      faq: [
        {
          q: "How fast can frostbite occur in extreme wind chill?",
          a: "At wind chills in the extreme range (around -35°F or colder), frostbite on exposed skin can occur in under 5 minutes according to NWS guidance — which is why extreme wind chill warnings are taken seriously for anyone spending time outdoors.",
        },
        {
          q: "Why doesn't wind chill apply above 50°F?",
          a: "The wind chill formula specifically models how wind accelerates heat loss from skin in cold conditions — above 50°F, the body isn't losing heat fast enough for wind to meaningfully change the perceived temperature the same way, so the NWS formula isn't calibrated for that range.",
        },
        {
          q: "Does wind chill affect inanimate objects, like car engines or pipes?",
          a: "No — wind chill specifically measures how cold moving air feels on living skin due to accelerated heat loss from a body generating its own warmth. Non-living objects cool to the actual air temperature regardless of wind, not to the wind chill value.",
        },
        {
          q: "What wind speed should I use if forecasts show gusts and sustained wind separately?",
          a: "Sustained wind speed is the standard input for wind chill calculations, since it reflects ongoing conditions rather than brief gusts — using gust speed would overstate the wind chill for most of the time you're actually outside.",
        },
      ],
    },
  },
  {
    slug: "heat-index-calculator",
    title: "Heat Index Calculator",
    category: "everyday",
    shortDescription: "Calculate the heat index (feels-like temperature in humid heat).",
    seoDescription: "Calculate the heat index — how hot it feels when relative humidity is factored in with air temperature.",
    formulaSummary: "NWS Rothfusz regression",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 95, min: 80, convertPair: fCPair("tempF") },
      { name: "humidityPercent", label: "Relative Humidity", type: "number", unit: "%", defaultValue: 60, min: 0, max: 100 },
    ],
    calculate: (i) => {
      const T = n(i.tempF, 95);
      const R = n(i.humidityPercent, 60);
      const hi =
        -42.379 + 2.04901523 * T + 10.14333127 * R - 0.22475541 * T * R - 0.00683783 * T * T - 0.05481717 * R * R +
        0.00122874 * T * T * R + 0.00085282 * T * R * R - 0.00000199 * T * T * R * R;
      return {
        results: [{ label: "Heat Index", value: `${fmtNumber(hi, 1)}°F`, emphasis: true }],
        notes: ["Most accurate for temperatures at or above 80°F and humidity at or above 40%."],
        gauge: {
          value: hi,
          min: 80,
          max: 135,
          valueLabel: `${fmtNumber(hi, 1)}°F`,
          zones: [
            { label: "Caution", to: 90, barClass: "bg-amber-300 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Extreme Caution", to: 103, barClass: "bg-amber-500 dark:bg-amber-600", textClass: "text-amber-700 dark:text-amber-400" },
            { label: "Danger", to: 125, barClass: "bg-orange-500 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Extreme Danger", to: 135, barClass: "bg-red-500 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `The National Weather Service classifies ${fmtNumber(hi, 1)}°F as "${hi < 90 ? "Caution" : hi < 103 ? "Extreme Caution" : hi < 125 ? "Danger" : "Extreme Danger"}" — heatstroke risk rises sharply as this number climbs.`,
      };
    },
    relatedSlugs: ["wind-chill-calculator", "dew-point-calculator"],
    content: {
      intro: [
        "This calculator works out the heat index — how much hotter humid air actually feels compared to the thermometer reading — using the National Weather Service's Rothfusz regression formula, from air temperature and relative humidity.",
        "It's used to judge real heat risk before outdoor work, sports practice, or events in hot weather, since humidity is what makes heat genuinely dangerous rather than just uncomfortable — the same air temperature can range from tolerable to hazardous depending on how much moisture is in the air.",
        "High humidity blocks sweat from evaporating efficiently, which is the body's main cooling mechanism — this calculator quantifies exactly how much that effect raises the perceived (and physiologically felt) temperature.",
      ],
      howItWorks: [
        "The Rothfusz regression is a statistical formula developed by the National Weather Service that combines air temperature and relative humidity into a single \"feels like\" figure, fitted from actual data on how humans perceive combined heat and humidity. It's most accurate for temperatures at or above 80°F and humidity at or above 40%, which is the range it was calibrated against.",
        "The risk categories (Caution, Extreme Caution, Danger, Extreme Danger) reflect NWS guidance on the likelihood of heat-related illness — sunstroke, heat cramps, heat exhaustion — at sustained exposure to a given heat index value, with risk increasing sharply as the number climbs.",
      ],
      faq: [
        {
          q: "Why does high humidity make heat feel so much worse?",
          a: "Sweat evaporating off skin is the body's primary cooling mechanism, and high humidity slows that evaporation dramatically — so on a humid day, sweat lingers on the skin without cooling you nearly as effectively, making the same air temperature feel significantly hotter.",
        },
        {
          q: "What's a dangerous heat index level?",
          a: "The NWS \"Danger\" category starts around 103°F, where heat cramps and heat exhaustion become likely with continued exposure or physical activity, and \"Extreme Danger\" above roughly 125°F carries a high risk of heat stroke — both warrant limiting outdoor exposure and activity.",
        },
        {
          q: "Is heat index the same as the temperature shown on a weather app?",
          a: "No — the plain temperature is just the air reading, while heat index (often labeled \"feels like\" or \"real feel\") factors in humidity's effect on perceived heat. On a humid day the two numbers can differ substantially.",
        },
        {
          q: "Does heat index account for direct sunlight?",
          a: "No — the standard heat index formula assumes shade. Direct sun exposure can add significantly to how hot conditions actually feel and to real heat stress on the body, beyond what the heat index number alone suggests.",
        },
      ],
    },
  },
  {
    slug: "dew-point-calculator",
    title: "Dew Point Calculator",
    category: "everyday",
    shortDescription: "Calculate the dew point from temperature and relative humidity.",
    seoDescription: "Calculate the dew point temperature from air temperature and relative humidity using the Magnus formula.",
    formulaSummary: "Magnus formula",
    fields: [
      { name: "tempF", label: "Air Temperature", type: "number", unit: "°F", defaultValue: 75, convertPair: fCPair("tempF") },
      { name: "humidityPercent", label: "Relative Humidity", type: "number", unit: "%", defaultValue: 55, min: 1, max: 100 },
    ],
    calculate: (i) => {
      const tC = ((n(i.tempF, 75) - 32) * 5) / 9;
      const rh = n(i.humidityPercent, 55);
      const a = 17.62, b = 243.12;
      const gamma = (a * tC) / (b + tC) + Math.log(rh / 100);
      const dewC = (b * gamma) / (a - gamma);
      const dewF = (dewC * 9) / 5 + 32;
      const comfortLabel = dewF < 50 ? "Dry" : dewF < 60 ? "Comfortable" : dewF < 65 ? "Slightly Humid" : dewF < 70 ? "Humid" : dewF < 75 ? "Very Humid" : "Oppressive";
      return {
        results: [{ label: "Dew Point", value: `${fmtNumber(dewF, 1)}°F (${fmtNumber(dewC, 1)}°C)`, emphasis: true }],
        gauge: {
          value: dewF,
          min: 30,
          max: 85,
          valueLabel: `${fmtNumber(dewF, 1)}°F`,
          zones: [
            { label: "Dry", to: 50, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Comfortable", to: 60, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Slightly Humid", to: 65, barClass: "bg-amber-300 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Humid", to: 70, barClass: "bg-amber-500 dark:bg-amber-600", textClass: "text-amber-700 dark:text-amber-400" },
            { label: "Very Humid", to: 75, barClass: "bg-orange-500 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Oppressive", to: 85, barClass: "bg-red-500 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
          ],
        },
        chartCaption: `Unlike relative humidity, dew point doesn't change with temperature swings — ${fmtNumber(dewF, 1)}°F reads as "${comfortLabel}" no matter how hot or cold the air itself is.`,
      };
    },
    relatedSlugs: ["heat-index-calculator", "wind-chill-calculator"],
    content: {
      intro: [
        "This calculator finds the dew point — the temperature air would need to cool to for it to become saturated with the moisture already in it — from air temperature and relative humidity, using the Magnus formula meteorologists rely on for this exact conversion.",
        "Weather-watchers, pilots, and anyone deciding how muggy a day will actually feel use dew point because, unlike relative humidity, it doesn't swing up and down with temperature over the course of a day — it's a much more consistent read on how much moisture is actually in the air.",
        "It also comes up in HVAC and building contexts, since dew point relative to a surface temperature determines whether condensation will form — a practical concern for anything from cold drinks sweating on a table to moisture forming inside walls or on windows.",
      ],
      howItWorks: [
        "The Magnus formula relates temperature and relative humidity to dew point through an empirical approximation of the physics of water vapor saturation — the calculator converts your Fahrenheit input to Celsius, applies the formula, then converts the result back to Fahrenheit for display.",
        "The key distinction from relative humidity: relative humidity is a percentage relative to what the current air temperature can hold, so it changes constantly as temperature rises and falls through the day even if the actual moisture content stays the same. Dew point measures the actual moisture content directly, which is why meteorologists consider it the more reliable comfort indicator.",
      ],
      faq: [
        {
          q: "Why is dew point a better comfort indicator than relative humidity?",
          a: "Relative humidity depends on temperature — the same amount of moisture in the air produces a different relative humidity reading depending on how hot or cold it is. Dew point measures actual moisture content directly, so a dew point in the 60s reliably feels humid whether the air temperature is 75°F or 95°F.",
        },
        {
          q: "What dew point is considered comfortable?",
          a: "Dew points below 60°F are generally considered comfortable, 60-65°F starts to feel slightly humid, and anything above 70°F is widely considered oppressive — meteorologists commonly use these rough bands, which is why the gauge above is scaled the same way.",
        },
        {
          q: "Can the dew point be higher than the air temperature?",
          a: "No — dew point can equal air temperature (at 100% relative humidity, when the air is fully saturated) but never exceed it, since dew point represents the temperature air would need to cool to in order to reach saturation with its current moisture content.",
        },
        {
          q: "Why does condensation form on a cold glass but not a warm one?",
          a: "Condensation forms whenever a surface is colder than the surrounding air's dew point — a cold glass often sits below the outdoor dew point on a humid day, causing moisture from the air to condense on its surface, which is exactly why glasses \"sweat\" in humid weather.",
        },
      ],
    },
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
      const fmtSecs = (s: number) => (s < 60 ? `${fmtNumber(s, 1)} sec` : `${Math.floor(s / 60)} min ${Math.round(s % 60)} sec`);
      return {
        results: [{ label: "Estimated Download Time", value: seconds < 60 ? `${fmtNumber(seconds, 1)} sec` : `${mins} min ${secs} sec`, emphasis: true }],
        growthSeries: [0.25, 0.5, 0.75, 1].map((frac) => ({
          label: `${frac * 100}%`,
          value: seconds * frac,
          displayValue: fmtSecs(seconds * frac),
        })),
        chartCaption: `Progress through the download at a steady ${n(i.speed, 100)} ${i.speedUnit} connection — real-world speeds fluctuate, so treat this as a best case.`,
      };
    },
    relatedSlugs: [],
    content: {
      intro: [
        "This calculator estimates how long a file will take to download given its size and your connection speed — a genuinely confusing conversion since file sizes are measured in bytes (MB, GB) while connection speeds are almost always advertised in bits (Mbps, Kbps).",
        "It comes up when checking whether a large game download or software update will finish before you need to leave, when comparing internet plans by what they'd actually mean for a typical download, or just double-checking why an advertised \"100 Mbps\" connection doesn't download a 100 MB file in one second.",
        "Pick your file size unit and connection speed unit independently, and the calculator handles the bits-to-bytes conversion internally so you don't have to do the math by hand.",
      ],
      howItWorks: [
        "The most common source of confusion here is that file sizes are measured in bytes, but internet speeds are marketed in bits — and there are 8 bits in a byte. A \"100 Mbps\" connection transfers about 12.5 megabytes per second, not 100 megabytes per second, which catches a lot of people off guard when a download takes far longer than the advertised speed number implies.",
        "The calculator converts your file size to bits (multiplying by 8) and your connection speed to bits per second, then divides one by the other to get download time in seconds — this is a theoretical best case, since it assumes your connection sustains its full advertised speed for the entire download with no overhead or contention.",
      ],
      faq: [
        {
          q: "Why is my download slower than my internet plan's advertised speed suggests?",
          a: "Advertised speeds are almost always in megabits per second (Mbps), while file sizes and download progress bars show megabytes (MB) — since there are 8 bits per byte, a 100 Mbps connection tops out around 12.5 MB per second, not 100 MB per second, which is often the real explanation.",
        },
        {
          q: "What's the difference between Mbps and MBps?",
          a: "Mbps (lowercase b) is megabits per second, the unit internet speeds are marketed in. MBps (uppercase B) is megabytes per second, the unit download managers and file sizes use. Dividing Mbps by 8 gives you the roughly equivalent MBps figure.",
        },
        {
          q: "Why does my actual download take longer than this calculator predicts?",
          a: "This estimate assumes your connection sustains its full advertised speed the entire time, with no other devices competing for bandwidth and no server-side bottleneck. Real downloads are affected by network congestion, Wi-Fi signal strength, and the download server's own speed limits — all of which this calculator doesn't account for.",
        },
        {
          q: "How much faster is a wired connection than Wi-Fi for large downloads?",
          a: "It depends heavily on your specific Wi-Fi setup and signal strength, but a wired Ethernet connection generally delivers closer to your plan's actual advertised speed with less variability than Wi-Fi, which can be affected by distance, interference, and how many devices share the network.",
        },
      ],
    },
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
        const inputLen = (i.text || "").length;
        const outputLen = result.length;
        return {
          results: [{ label: "Output", value: result, emphasis: true }],
          notes: [
            i.mode === "decode"
              ? `Decoded ${inputLen} Base64 characters back into ${outputLen} characters of text.`
              : `Base64 packs 3 bytes into 4 characters, so encoded text runs about 33% longer — your ${inputLen}-character input became ${outputLen} characters.`,
          ],
          compare: [
            { label: "Input Characters", value: inputLen, displayValue: `${inputLen}` },
            { label: "Output Characters", value: outputLen, displayValue: `${outputLen}`, highlight: outputLen >= inputLen },
          ],
          chartCaption:
            i.mode === "decode"
              ? `Decoding shrank ${inputLen} Base64 characters down to ${outputLen} characters of plain text.`
              : `Encoding grew ${inputLen} input characters into ${outputLen} output characters — Base64's 3-bytes-to-4-characters packing adds roughly 33% length.`,
        };
      } catch {
        return { results: [], error: i.mode === "decode" ? "That doesn't look like valid Base64." : "Couldn't encode that input." };
      }
    },
    relatedSlugs: ["url-encode-decode"],
    content: {
      intro: [
        "This tool encodes plain text into Base64, or decodes a Base64 string back into readable text — a conversion developers run constantly when working with data formats that don't handle raw binary or special characters cleanly.",
        "It's used for embedding small binary data (like an image) inside JSON or a URL, decoding a Base64-encoded JWT payload or API token to see what's inside, preparing email attachment data, or just reading a Base64 string someone pasted into a bug report or config file.",
        "Since encoding and decoding both happen entirely in your browser, it's a safe place to paste something you're not sure is sensitive — an API key or auth token fragment, for instance — without it ever leaving your device.",
      ],
      howItWorks: [
        "Base64 represents binary data using only 64 printable ASCII characters (A-Z, a-z, 0-9, plus two symbols), which makes it safe to embed inside text-based formats like JSON, XML or URLs that don't reliably handle raw binary or every special character.",
        "The encoding works by packing 3 bytes of input into 4 Base64 characters, which is why encoded output runs roughly 33% longer than the original — that expansion is the tradeoff for making the data universally text-safe.",
      ],
      faq: [
        {
          q: "Is Base64 encoding a form of encryption?",
          a: "No — Base64 is purely a data representation format, not encryption. It doesn't hide or protect information at all; anyone can decode it instantly, so it should never be used as a substitute for actual encryption when handling sensitive data.",
        },
        {
          q: "Why does encoded text always come out longer than the original?",
          a: "Base64 packs every 3 bytes of input into 4 output characters, which mathematically expands the size by about 33% — that overhead is the tradeoff for representing arbitrary binary data using only safe, printable text characters.",
        },
        {
          q: "Why do I sometimes see a Base64 string end with one or two equals signs?",
          a: "Equals signs are padding characters, added when the input's length isn't a multiple of 3 bytes — they let the decoder know the final group of characters represents fewer than the usual 3 bytes of original data.",
        },
        {
          q: "What is Base64 commonly used for?",
          a: "Embedding image or file data directly inside HTML, CSS or JSON; encoding email attachments (MIME); representing the payload sections of JWTs (JSON Web Tokens) used in authentication; and any other context where binary or special-character data needs to travel safely through a text-only channel.",
        },
      ],
    },
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
        const inputLen = (i.text || "").length;
        const outputLen = result.length;
        return {
          results: [{ label: "Output", value: result, emphasis: true }],
          notes: [
            i.mode === "decode"
              ? "Percent-encoded sequences like %20 or %26 are converted back to their original characters (space, &, etc)."
              : "Characters unsafe in a URL (spaces, &, ?, #, and others) are replaced with a % followed by their hex code, so the text can travel safely inside a query string.",
          ],
          compare: [
            { label: "Input Characters", value: inputLen, displayValue: `${inputLen}` },
            { label: "Output Characters", value: outputLen, displayValue: `${outputLen}`, highlight: outputLen >= inputLen },
          ],
          chartCaption:
            outputLen === inputLen
              ? `${inputLen} characters in, ${outputLen} out — nothing in this input needed percent-encoding.`
              : i.mode === "decode"
                ? `Decoding shrank ${inputLen} percent-encoded characters down to ${outputLen} characters of plain text.`
                : `Encoding grew ${inputLen} input characters into ${outputLen} output characters as unsafe characters were replaced with %-escapes.`,
        };
      } catch {
        return { results: [], error: "Couldn't decode that input — it may not be validly percent-encoded." };
      }
    },
    relatedSlugs: ["base64-encode-decode"],
    content: {
      intro: [
        "This tool URL-encodes text so it's safe to include in a web address or query string, or decodes a percent-encoded URL string back into its original readable form — the encoding scheme behind those %20s and %26s you see scattered through URLs.",
        "It's used by developers building query strings by hand, by anyone trying to read what a long tracking or redirect URL actually says once the percent-encoding is stripped away, or when debugging why a link with spaces or special characters isn't working as expected.",
        "The conversion runs entirely in your browser using the same encoding logic web browsers themselves use, so pasting in a URL fragment to decode is safe and nothing is sent anywhere.",
      ],
      howItWorks: [
        "Certain characters — spaces, ampersands, question marks, hashes, and others — have special meaning inside a URL and can't appear literally in most parts of it without causing confusion about where the URL structure ends and the actual data begins. Percent-encoding replaces each unsafe character with a % followed by its two-digit hexadecimal code (a space becomes %20, an ampersand becomes %26, and so on).",
        "This lets arbitrary text — including spaces, punctuation, and non-ASCII characters — travel safely inside a URL's query string or path without breaking the URL's own syntax, since the decoder on the receiving end reverses the process to recover the original text.",
      ],
      faq: [
        {
          q: "Why do spaces in a URL show up as %20 or a plus sign?",
          a: "%20 is the standard percent-encoded representation of a space. A plus sign (+) is an older convention specifically used inside URL query strings (and form submissions) to represent a space — both are valid depending on context, though %20 is the more universally correct form.",
        },
        {
          q: "Which characters need to be URL-encoded?",
          a: "Reserved characters with special meaning in URL syntax — spaces, &, ?, #, %, /, and others — along with non-ASCII characters generally need encoding. Letters, numbers, and a handful of symbols like hyphens and periods are considered safe and left as-is.",
        },
        {
          q: "Why does decoding sometimes fail with an error?",
          a: "Decoding fails when the input contains a % that isn't followed by a valid two-digit hex code, or when it isn't correctly formed percent-encoded text to begin with — often the sign of a string that was only partially encoded or has been modified since it was originally encoded.",
        },
        {
          q: "Is URL encoding the same thing as encryption?",
          a: "No — URL encoding is purely a way to safely represent characters within URL syntax, not a security measure. It's trivially reversible by anyone, so it should never be relied on to hide or protect sensitive information.",
        },
      ],
    },
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
        table: {
          headers: ["Sizing System", "Size"],
          rows: [
            ["US Men's", fmtNumber(m, 1)],
            ["US Women's", fmtNumber(m + 1.5, 1)],
            ["UK", fmtNumber(m - 0.5, 1)],
            ["EU", fmtNumber(m + 33, 0)],
            ["Foot Length", `${fmtNumber(cm, 1)} cm`],
          ],
        },
        chartCaption: "All five rows represent the exact same physical foot length — pick whichever sizing system the shoe you're buying uses.",
      };
    },
    relatedSlugs: ["bra-size-calculator"],
    content: {
      intro: [
        "This calculator converts a US men's shoe size into US women's, UK and EU sizes, plus an estimated foot length in centimeters — the reference chart you need when a shoe you're buying only lists sizes in a system you don't normally shop in.",
        "It's used when ordering shoes from an international retailer that lists only UK or EU sizes, when buying a unisex or men's shoe as a woman (or vice versa) and needing the size offset, or when a size chart online only gives a foot-length measurement to match against.",
        "Enter a US men's size and it fills in the equivalent sizes across every other common system at once, so you're not hunting down a separate conversion for each one.",
      ],
      howItWorks: [
        "Each sizing system is derived from the US men's size using standard offsets: US women's runs about 1.5 sizes larger numerically than the equivalent US men's size, UK sizing runs about 0.5 smaller, and EU sizing adds roughly 33 to the US men's number. Foot length in centimeters is estimated from the same base size using a standard length-per-size scale.",
      ],
      faq: [
        {
          q: "How much bigger is a women's shoe size than the equivalent men's size?",
          a: "US women's sizing typically runs about 1.5 sizes larger numerically than the equivalent US men's size — for example, a men's size 9 is roughly equivalent to a women's 10.5. It's an approximate offset used widely in the shoe industry, though not universal across every brand.",
        },
        {
          q: "Why do my actual shoe sizes not exactly match this conversion?",
          a: "Sizing conventions vary meaningfully by brand and by the specific shoe's last (its shape template) — this calculator gives a standard approximate conversion, but the safest way to confirm fit for a specific pair is to measure your actual foot length and compare it against that brand's own size chart.",
        },
        {
          q: "How do I measure my foot length at home?",
          a: "Stand on a piece of paper with your heel against a wall, mark where your longest toe ends, and measure that distance in centimeters — comparing that number against a brand's foot-length chart is generally more reliable than converting between size systems alone.",
        },
        {
          q: "Is EU sizing the same across all of Europe?",
          a: "EU sizing is broadly standardized and used across most of continental Europe, making it one of the more consistent systems — but as with any conversion, individual brands can still vary slightly in exactly how a given EU size is cut.",
        },
      ],
    },
  },
];

export default everyday2;
