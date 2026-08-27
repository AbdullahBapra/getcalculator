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
    content: {
      intro: [
        "You're sitting on a finish — 121, 85, 170 — and you need to know the actual route to zero before it's your turn again, not five minutes from now. This scorer runs a real checkout search over every legal 1-, 2- and 3-dart route and hands you a sequence that ends on a double, exactly the way the rules require, instead of you doing mental arithmetic under pressure at the oche.",
        "It's built for two kinds of moments: mid-leg, when you want to glance at a checkout instead of guessing at it, and off the board entirely, when you're memorizing the standard finishes players are expected to know cold — 170 (T20, T20, Bull), 121 (T20, 11, D25), and the rest of the classic 501/301 checkout chart.",
        "Feed it any remaining score from 2 to 170 and it works out the same way a chalker would: search for a one-dart finish first, then two darts, then three, always landing the last dart on a double or the bullseye.",
      ],
      howItWorks: [
        "Darts' most important rule for checkouts: the finishing dart must land on a double (including the outer bull as D25, worth 50). A treble 20 followed by a treble 19 doesn't finish anything if the last dart isn't a double — no matter how much score it removes.",
        "The calculator searches shortest-path-first. It checks whether your remaining score is itself a double (a 1-dart out, like 40 = D20); if not, it looks for any single dart plus a double that adds up to your score; if that fails too, it searches every combination of two darts plus a closing double. That mirrors how a real player should be thinking, just faster.",
        "Not every score has a checkout in three darts. Nine scores between 2 and 170 — 169, 168, 166, 165, 163, 162, and 159 — are the well-known \"bogey numbers\": no combination of three darts lands on a double from those totals, so the standard advice is to bust that score down into something else on your next visit rather than aim straight at it.",
      ],
      faq: [
        {
          q: "What is the highest possible checkout in darts?",
          a: "170, known as the \"big fish\" — hit with treble 20, treble 20, then the bullseye (double 25). It's the highest finish achievable in three darts and one of the most celebrated shots in the sport.",
        },
        {
          q: "Why can't I check out on 169?",
          a: "169 is one of darts' nine \"bogey numbers\" (169, 168, 166, 165, 163, 162, 159) — there's no legal combination of three darts that reduces 169 to zero while finishing on a double. The standard play is to score down to a different, checkout-friendly number instead.",
        },
        {
          q: "Does the last dart have to land on a double to win?",
          a: "Yes — in standard 501 and 301, the leg only ends on a double (D1 through D20) or the bullseye counted as double 25. Any other finish, including a treble or the single bull, doesn't count and the remaining score carries over.",
        },
        {
          q: "What happens if I score more than I have left — is that a bust?",
          a: "Yes, that's a \"bust.\" If a dart would take your remaining score below zero, to exactly 1, or to zero without the last dart being a double, the entire turn's score is voided and your total resets to what it was before that turn started.",
        },
        {
          q: "What's a good checkout to memorize for 501?",
          a: "The three every player learns first are 170 (T20, T20, Bull), 121 (T20, 11, D25 or T20, 15, D18 depending on preference), and 40 (D20) — that last one because so many legs end with a simple double-20 look.",
        },
      ],
    },
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
    content: {
      intro: [
        "The abacus is one of the oldest calculating tools still in active use — versions of it were in use in Mesopotamia and the ancient Mediterranean, and the Chinese suanpan and Japanese soroban are still taught today because moving physical beads builds an intuitive sense of place value that a calculator screen never will. This tool is a click-to-count version of that: real columns for ones, tens, hundreds and up, where clicking a bead actually changes the number.",
        "It's mainly built for two audiences: kids (or the parents teaching them) working through place value and basic addition/subtraction the way soroban-style mental math programs still do, and anyone who's just curious what a specific number — their birth year, a phone number, a locker combination — looks like decomposed into beads on a frame.",
        "Type any number up to 9,999,999 and the columns update to represent it instantly, or click through the beads yourself and watch the number build column by column exactly the way it would on a physical frame.",
      ],
      howItWorks: [
        "Every column represents one power of ten — ones, tens, hundreds, thousands, and on up — exactly the same place-value system used in ordinary written numbers. A bead in the ones column is worth 1; the identical-looking bead one column over, in the tens, is worth 10; move it once more and it's worth 100.",
        "That's the whole trick a physical abacus teaches by feel: a single bead's worth depends entirely on which column it's sitting in, not on the bead itself. This calculator's breakdown chart makes that explicit by showing exactly how much value each column's beads are contributing to the total.",
      ],
      faq: [
        {
          q: "How does an abacus actually represent numbers?",
          a: "Each column stands for a power of ten (ones, tens, hundreds, and so on), and the number of beads set in that column is that digit. A number like 4,527 is four beads in the thousands column, five in the hundreds, two in the tens, and seven in the ones.",
        },
        {
          q: "Is the abacus still used for real math, or just for teaching?",
          a: "Both. It's widely used to teach place value and mental arithmetic to children, and soroban-based mental math training (where students eventually visualize the beads and stop needing the physical frame) is still actively taught, particularly in parts of Asia, as a way to build fast mental calculation.",
        },
        {
          q: "What's the difference between a Chinese, Japanese and Russian abacus?",
          a: "The Chinese suanpan traditionally has two beads above the bar and five below per column; the Japanese soroban simplified this to one bead above and four below, which is the layout most modern educational abacuses (including this one) follow; the Russian schoty instead uses horizontal wires with ten beads each and no dividing bar.",
        },
        {
          q: "Why do some abacus columns show more beads than others for the same digit?",
          a: "They shouldn't for the same digit — each column always uses the same number of beads to represent 0 through 9. What differs is each column's place value, so an identical-looking bead is worth ten times more in the tens column than in the ones column.",
        },
      ],
    },
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
    content: {
      intro: [
        "Pavers are sold by the piece, but patios are priced by the square foot — so before you can even call the supplier, you need to convert your patio's footprint into a paver count without over-ordering by half a pallet or, worse, running twenty short with the crew standing around. This calculator does that conversion and adds a waste allowance on top, because straight-edge cuts around the border and the occasional cracked paver are a given, not an edge case.",
        "It's built for the actual shopping trip: punch in the patio dimensions and the size of paver you've picked out, and it tells you how many to buy and how much gravel base to order alongside them, so one trip to the yard covers the whole job.",
        "The gravel figure isn't an afterthought either — a paver patio that skips a proper compacted base is a patio that heaves and settles unevenly within a couple of freeze-thaw cycles, so getting that cubic yardage right matters as much as the paver count itself.",
      ],
      howItWorks: [
        "The core math is simple division: total patio area divided by the area of a single paver gives the base number of pavers needed to cover the ground with no gaps. A 16×12 ft patio (192 sq ft) tiled with 12×12 in pavers (1 sq ft each) needs 192 pavers before any allowance for waste.",
        "Waste factor gets added on top of that base count, not folded into it — the calculator shows both numbers separately in the breakdown so you can see exactly how many pavers are covering ground versus how many are buffer. 10% is the standard rule of thumb for a simple rectangular layout; bump it toward 15-20% for a herringbone or running-bond pattern, curved edges, or a design with a lot of cuts.",
        "Gravel base volume comes from the same footprint: patio area × the depth of your compacted base layer, converted from cubic inches to cubic yards (the unit most gravel and stone is actually sold in). A typical patio base runs 4-6 inches of compacted gravel, deeper in areas with heavy frost or poor-draining soil.",
      ],
      faq: [
        {
          q: "How many pavers do I need for a 12x16 patio?",
          a: "It depends on the paver size — divide the patio's area (192 sq ft) by the area of one paver, then add roughly 10% for waste and cuts. For a common 12x12 in (1 sq ft) paver, that works out to about 211 pavers after waste; a smaller 6x9 in paver would need close to 565.",
        },
        {
          q: "How much gravel base do I need under pavers?",
          a: "Most residential patios use a compacted gravel base 4-6 inches deep. Multiply the patio's square footage by the base depth, convert to cubic feet, then divide by 27 to get cubic yards — the unit most stone yards sell by.",
        },
        {
          q: "How much extra should I order for waste?",
          a: "10% is the standard allowance for a straightforward rectangular patio in a simple running pattern. For diagonal or herringbone layouts, curved borders, or a lot of edge cuts, plan for 15-20% instead — the more cuts a pattern needs, the more full pavers get sacrificed to make them.",
        },
        {
          q: "Do I really need a gravel base, or can I lay pavers on dirt?",
          a: "You need a compacted base. Pavers set directly on soil will settle unevenly as the ground shifts, freezes and drains, leading to a wavy, trip-hazard surface within a season or two — the gravel layer (often with a sand setting bed on top) is what keeps the whole patio level over time.",
        },
        {
          q: "What size pavers should I use for a patio?",
          a: "Larger pavers (12x12 in or bigger) cover ground faster and need fewer joints, which is easier and cheaper to install; smaller pavers or mixed sizes give more pattern options (herringbone, basketweave) but need more units and generally more waste allowance for the cuts those patterns require.",
        },
      ],
    },
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
    content: {
      intro: [
        "Ring sizes don't mean the same thing in every country, which is exactly the problem when a ring was bought or sized abroad, borrowed from a relative overseas, or you're shopping a jeweler that only lists EU or UK numbers. The one measurement that stays honest across all of them is the physical size of the ring itself — its inner diameter or circumference in millimeters — so that's what this converter works from.",
        "It's built for the classic real-world case: you've got a ring that fits (a sibling's, a family heirloom, one you already own), you've measured it with a ruler or string, and you need to know what to actually ask for at the counter or type into an online size selector without guessing and hoping.",
        "Feed it either measurement — inner diameter straight across the band's opening, or the circumference if you wrapped a strip of paper around the inside and measured the length — and it converts to a US size, plus an approximate EU size, so you're covered wherever you're buying.",
      ],
      howItWorks: [
        "Diameter and circumference are just two ways of describing the same circle, related by circumference = diameter × π, so the calculator freely converts between whichever one you measured. If you only have circumference (say, from wrapping a string around the inside of a ring and measuring the string), it back-calculates the diameter first.",
        "US ring sizes are a numeric scale that increases in small, fairly even steps of about 0.8128 mm of diameter per half-size — this calculator uses that standard relationship (US size ≈ (diameter mm − 11.63) ÷ 0.8128 + 1) to translate a millimeter measurement into the number engraved on US sizing charts.",
        "EU sizing works differently: it's simply the inner circumference in millimeters, rounded — so a ring with a 54.4 mm inside circumference is roughly an EU size 54. That's why the EU figure shown here is just the circumference itself, no separate formula needed, while UK sizing (a letter-based scale, A through Z+) follows yet another system entirely and isn't included here.",
      ],
      faq: [
        {
          q: "How do I measure my ring size at home?",
          a: "The most reliable way is to measure a ring you already own that fits the intended finger: lay it flat and measure the inner diameter (straight across the inside edge, not including the band's width) with a ruler, or wrap a strip of paper or string around the inside and measure that length for circumference.",
        },
        {
          q: "How accurate is a DIY ring size measurement?",
          a: "It's a solid starting point but not exact — a ruler reading can easily be off by half a millimeter, which is enough to shift the result by close to a full size. For an expensive or hard-to-return purchase, it's worth confirming with a physical ring sizer or an in-person jeweler measurement before ordering.",
        },
        {
          q: "What is the difference between US and EU ring sizes?",
          a: "US sizes are a numbered scale (roughly 3 to 13 for adults) based on the ring's inner diameter, while EU sizes are simply the inner circumference in millimeters, rounded to a whole number — so a US size 7 (about 17.3 mm diameter, 54.4 mm circumference) corresponds to roughly EU size 54.",
        },
        {
          q: "Does ring size change with temperature or time of day?",
          a: "Yes, slightly — fingers swell with heat, humidity, salt intake and at the end of the day, and can shrink in cold weather. For the most consistent measurement, measure in the evening at a normal room temperature rather than first thing in the morning or right after exercise.",
        },
        {
          q: "Why do men's and women's ring sizes use the same scale?",
          a: "They use the same numeric US/EU sizing systems — there's no separate men's or women's scale — men's rings simply tend to run larger in practice because of average finger size and wider band styles, not because the sizing measurement itself differs.",
        },
      ],
    },
  },
];

export default novelty;
