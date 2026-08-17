import type { CalcOutput, CalculatorDefinition } from "./types";
import { n, fmtNumber } from "../format";

function parseDateUTC(value: string): Date | null {
  if (!value) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
function parseClock(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}
function monthDiff(start: Date, end: Date) {
  let years = end.getUTCFullYear() - start.getUTCFullYear();
  let months = end.getUTCMonth() - start.getUTCMonth();
  let days = end.getUTCDate() - start.getUTCDate();
  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 0));
    days += prevMonth.getUTCDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years, months, days };
}
function randomInt(min: number, max: number): number {
  const range = max - min + 1;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return min + (buf[0] % range);
  }
  return min + Math.floor(Math.random() * range);
}
function hashNames(a: string, b: string): number {
  const s = `${a.trim().toLowerCase()}|${b.trim().toLowerCase()}`;
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 41 === 0 ? 100 : Math.abs(hash) % 101; // occasionally lands on 100%, otherwise 0-100
}

const everyday: CalculatorDefinition[] = [
  {
    slug: "age-calculator",
    title: "Age Calculator",
    category: "everyday",
    shortDescription: "Calculate exact age in years, months and days from a birth date.",
    seoDescription: "Calculate your exact age in years, months and days, plus total days lived and days until your next birthday.",
    formulaSummary: "Calendar-aware date difference",
    fields: [
      { name: "birthDate", label: "Date of Birth", type: "date", defaultValue: "" },
      { name: "asOfDate", label: "As of Date", type: "date", defaultValue: new Date().toISOString().slice(0, 10) },
    ],
    calculate: (i) => {
      const birth = parseDateUTC(i.birthDate);
      const asOf = parseDateUTC(i.asOfDate) ?? new Date();
      if (!birth) return { results: [], error: "Enter a valid date of birth." };
      if (birth.getTime() > asOf.getTime()) return { results: [], error: "Date of birth must be before the 'as of' date." };
      const { years, months, days } = monthDiff(birth, asOf);
      const totalDays = Math.floor((asOf.getTime() - birth.getTime()) / 86400000);
      let nextBday = new Date(Date.UTC(asOf.getUTCFullYear(), birth.getUTCMonth(), birth.getUTCDate()));
      if (nextBday.getTime() < asOf.getTime()) nextBday = new Date(Date.UTC(asOf.getUTCFullYear() + 1, birth.getUTCMonth(), birth.getUTCDate()));
      const daysToNextBday = Math.round((nextBday.getTime() - asOf.getTime()) / 86400000);
      return {
        results: [
          { label: "Age", value: `${years} years, ${months} months, ${days} days`, emphasis: true },
          { label: "Total Days Lived", value: fmtNumber(totalDays, 0) },
          { label: "Days Until Next Birthday", value: fmtNumber(daysToNextBday, 0) },
        ],
      };
    },
    relatedSlugs: ["date-calculator"],
  },
  {
    slug: "date-calculator",
    title: "Date Calculator",
    category: "everyday",
    shortDescription: "Find the number of days between two dates, or add/subtract time from a date.",
    seoDescription: "Calculate the number of days, weeks, months and years between two dates, or add/subtract a duration from a date.",
    formulaSummary: "Calendar-aware date arithmetic",
    fields: [
      { name: "mode", label: "Mode", type: "select", defaultValue: "difference", options: [
        { value: "difference", label: "Difference between two dates" },
        { value: "addSubtract", label: "Add/subtract time from a date" },
      ] },
      { name: "startDate", label: "Start Date", type: "date", defaultValue: "" },
      { name: "endDate", label: "End Date", type: "date", defaultValue: "", showIf: (i) => i.mode !== "addSubtract" },
      { name: "amount", label: "Amount", type: "number", defaultValue: 30, showIf: (i) => i.mode === "addSubtract" },
      { name: "unit", label: "Unit", type: "select", defaultValue: "days", options: [
        { value: "days", label: "Days" }, { value: "weeks", label: "Weeks" }, { value: "months", label: "Months" }, { value: "years", label: "Years" },
      ], showIf: (i) => i.mode === "addSubtract" },
      { name: "direction", label: "Direction", type: "select", defaultValue: "add", options: [{ value: "add", label: "Add" }, { value: "subtract", label: "Subtract" }], showIf: (i) => i.mode === "addSubtract" },
    ],
    calculate: (i) => {
      const start = parseDateUTC(i.startDate);
      if (!start) return { results: [], error: "Enter a valid start date." };
      if (i.mode === "addSubtract") {
        const amt = n(i.amount, 0) * (i.direction === "subtract" ? -1 : 1);
        const d = new Date(start);
        if (i.unit === "days") d.setUTCDate(d.getUTCDate() + amt);
        else if (i.unit === "weeks") d.setUTCDate(d.getUTCDate() + amt * 7);
        else if (i.unit === "months") d.setUTCMonth(d.getUTCMonth() + amt);
        else d.setUTCFullYear(d.getUTCFullYear() + amt);
        return { results: [{ label: "Resulting Date", value: d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }), emphasis: true }] };
      }
      const end = parseDateUTC(i.endDate);
      if (!end) return { results: [], error: "Enter a valid end date." };
      const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
      const earlier = totalDays >= 0 ? start : end;
      const later = totalDays >= 0 ? end : start;
      const { years, months, days } = monthDiff(earlier, later);
      return {
        results: [
          { label: "Total Days", value: fmtNumber(Math.abs(totalDays), 0), emphasis: true },
          { label: "Breakdown", value: `${years} years, ${months} months, ${days} days` },
          { label: "Total Weeks", value: fmtNumber(Math.abs(totalDays) / 7, 1) },
        ],
      };
    },
    relatedSlugs: ["age-calculator", "day-of-the-week-calculator"],
  },
  {
    slug: "time-duration-calculator",
    title: "Time Duration Calculator",
    category: "everyday",
    shortDescription: "Calculate the duration between two clock times.",
    seoDescription: "Calculate the duration in hours and minutes between a start time and end time, including overnight spans.",
    formulaSummary: "End − Start (+ 24h if overnight)",
    fields: [
      { name: "startTime", label: "Start Time (HH:MM, 24h)", type: "text", defaultValue: "09:00" },
      { name: "endTime", label: "End Time (HH:MM, 24h)", type: "text", defaultValue: "17:30" },
      { name: "overnight", label: "End time is the next day", type: "select", defaultValue: "no", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }] },
    ],
    calculate: (i) => {
      const start = parseClock(i.startTime);
      const end = parseClock(i.endTime);
      if (start === null || end === null) return { results: [], error: "Enter times as HH:MM in 24-hour format, e.g. 09:00 or 17:30." };
      let diff = end - start + (i.overnight === "yes" ? 24 * 60 : 0);
      if (diff < 0) diff += 24 * 60;
      const hours = Math.floor(diff / 60);
      const minutes = diff % 60;
      return {
        results: [
          { label: "Duration", value: `${hours}h ${minutes}m`, emphasis: true },
          { label: "Total Minutes", value: fmtNumber(diff, 0) },
          { label: "Decimal Hours", value: fmtNumber(diff / 60, 2) },
        ],
      };
    },
    relatedSlugs: ["hours-calculator"],
  },
  {
    slug: "hours-calculator",
    title: "Hours Calculator",
    category: "everyday",
    shortDescription: "Calculate hours worked and pay, including overtime, from clock-in and clock-out times.",
    seoDescription: "Calculate total hours worked and gross pay from clock-in and clock-out times, an unpaid break, hourly rate and overtime rules.",
    formulaSummary: "Worked hours = (out − in) − break; overtime beyond threshold pays 1.5×",
    fields: [
      { name: "startTime", label: "Clock In (HH:MM, 24h)", type: "text", defaultValue: "08:00" },
      { name: "endTime", label: "Clock Out (HH:MM, 24h)", type: "text", defaultValue: "17:00" },
      { name: "breakMinutes", label: "Unpaid Break", type: "number", unit: "minutes", defaultValue: 30, min: 0 },
      { name: "hourlyRate", label: "Hourly Rate (optional)", type: "number", unit: "$", defaultValue: 0, min: 0 },
      { name: "otThreshold", label: "Overtime Threshold", type: "number", unit: "hrs/day", defaultValue: 8, min: 0 },
    ],
    calculate: (i) => {
      const start = parseClock(i.startTime);
      const end = parseClock(i.endTime);
      if (start === null || end === null) return { results: [], error: "Enter times as HH:MM in 24-hour format." };
      let diff = end - start;
      if (diff < 0) diff += 24 * 60;
      const workedMinutes = Math.max(0, diff - n(i.breakMinutes));
      const workedHours = workedMinutes / 60;
      const threshold = n(i.otThreshold, 8);
      const regular = Math.min(workedHours, threshold);
      const overtime = Math.max(0, workedHours - threshold);
      const rate = n(i.hourlyRate);
      const pay = regular * rate + overtime * rate * 1.5;
      const results: CalcOutput["results"] = [
        { label: "Total Hours Worked", value: fmtNumber(workedHours, 2), emphasis: true },
        { label: "Regular Hours", value: fmtNumber(regular, 2) },
        { label: "Overtime Hours", value: fmtNumber(overtime, 2) },
      ];
      if (rate > 0) results.push({ label: "Estimated Gross Pay", value: `$${fmtNumber(pay, 2)}`, emphasis: true });
      return { results };
    },
    relatedSlugs: ["time-duration-calculator"],
  },
  {
    slug: "gpa-calculator",
    title: "GPA Calculator",
    category: "everyday",
    shortDescription: "Calculate your weighted grade point average from course credits and grades.",
    seoDescription: "Calculate your weighted GPA from a list of course credit hours and grade points.",
    formulaSummary: "GPA = Σ(credits×gradePoint) / Σcredits",
    fields: [
      { name: "courses", label: "Courses as credits:gradePoint pairs", type: "text", defaultValue: "3:4.0, 4:3.3, 3:3.7, 3:3.0", help: "e.g. 3:4.0 means a 3-credit class with a 4.0 grade point (A)" },
    ],
    calculate: (i) => {
      const pairs = (i.courses || "").split(",").map((s) => s.trim()).filter(Boolean);
      let totalCredits = 0, totalPoints = 0;
      for (const p of pairs) {
        const [c, g] = p.split(":").map((v) => Number(v.trim()));
        if (!Number.isFinite(c) || !Number.isFinite(g)) continue;
        totalCredits += c;
        totalPoints += c * g;
      }
      if (totalCredits === 0) return { results: [], error: "Enter at least one valid credits:gradePoint pair, e.g. 3:4.0, 4:3.3" };
      return {
        results: [
          { label: "GPA", value: fmtNumber(totalPoints / totalCredits, 3), emphasis: true },
          { label: "Total Credits", value: fmtNumber(totalCredits, 0) },
        ],
      };
    },
    relatedSlugs: ["grade-calculator"],
  },
  {
    slug: "grade-calculator",
    title: "Grade Calculator",
    category: "everyday",
    shortDescription: "Calculate a weighted final grade from assignment scores and weights.",
    seoDescription: "Calculate your overall weighted grade percentage from assignment scores and their weights.",
    formulaSummary: "Grade = Σ(score×weight) / Σweight",
    fields: [
      { name: "items", label: "Grades as score:weight pairs", type: "text", defaultValue: "90:20, 85:30, 95:50", help: "e.g. 90:20 means a 90% score worth 20% of the final grade" },
    ],
    calculate: (i) => {
      const pairs = (i.items || "").split(",").map((s) => s.trim()).filter(Boolean);
      let totalWeight = 0, weightedSum = 0;
      for (const p of pairs) {
        const [score, weight] = p.split(":").map((v) => Number(v.trim()));
        if (!Number.isFinite(score) || !Number.isFinite(weight)) continue;
        totalWeight += weight;
        weightedSum += score * weight;
      }
      if (totalWeight === 0) return { results: [], error: "Enter at least one valid score:weight pair, e.g. 90:20, 85:30" };
      const grade = weightedSum / totalWeight;
      let letter = "F";
      if (grade >= 93) letter = "A"; else if (grade >= 90) letter = "A-"; else if (grade >= 87) letter = "B+"; else if (grade >= 83) letter = "B"; else if (grade >= 80) letter = "B-"; else if (grade >= 77) letter = "C+"; else if (grade >= 73) letter = "C"; else if (grade >= 70) letter = "C-"; else if (grade >= 60) letter = "D";
      return {
        results: [
          { label: "Final Grade", value: `${fmtNumber(grade, 2)}%`, emphasis: true },
          { label: "Letter Grade", value: letter, emphasis: true },
        ],
        notes: totalWeight !== 100 ? [`Your weights add up to ${fmtNumber(totalWeight, 1)}%, not 100% — the grade is still calculated as a weighted average.`] : undefined,
      };
    },
    relatedSlugs: ["gpa-calculator"],
  },
  {
    slug: "password-generator",
    title: "Password Generator",
    category: "everyday",
    shortDescription: "Generate a strong random password with your choice of character sets.",
    seoDescription: "Generate a strong, random password with configurable length and character sets — uppercase, numbers and symbols.",
    formulaSummary: "Cryptographically random selection from the chosen character set",
    fields: [
      { name: "length", label: "Length", type: "number", defaultValue: 16, min: 4, max: 128, step: 1 },
      { name: "uppercase", label: "Include Uppercase (A-Z)", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { name: "numbers", label: "Include Numbers (0-9)", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { name: "symbols", label: "Include Symbols (!@#$...)", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
    calculate: (i) => {
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const digits = "0123456789";
      const symbols = "!@#$%^&*()-_=+[]{}";
      let pool = lower;
      if (i.uppercase !== "no") pool += upper;
      if (i.numbers !== "no") pool += digits;
      if (i.symbols !== "no") pool += symbols;
      const length = Math.max(4, Math.min(128, Math.round(n(i.length, 16))));
      let pw = "";
      for (let k = 0; k < length; k++) pw += pool[randomInt(0, pool.length - 1)];
      const entropyBits = Math.round(length * Math.log2(pool.length));
      return {
        results: [
          { label: "Password", value: pw, emphasis: true },
          { label: "Estimated Entropy", value: `${entropyBits} bits` },
        ],
        notes: ["Generated fresh each time you calculate — nothing is stored or sent anywhere. Use a password manager to save it."],
      };
    },
    relatedSlugs: ["random-number-generator"],
  },
  {
    slug: "random-number-generator",
    title: "Random Number Generator",
    category: "everyday",
    shortDescription: "Generate one or more random numbers within a range.",
    seoDescription: "Generate random integers within a min/max range, with or without duplicates.",
    formulaSummary: "Uniform random integer in [min, max]",
    fields: [
      { name: "min", label: "Minimum", type: "number", defaultValue: 1, step: 1 },
      { name: "max", label: "Maximum", type: "number", defaultValue: 100, step: 1 },
      { name: "count", label: "How Many", type: "number", defaultValue: 5, min: 1, max: 500, step: 1 },
      { name: "unique", label: "Allow Duplicates", type: "select", defaultValue: "yes", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
    ],
    calculate: (i) => {
      const min = Math.round(n(i.min, 1)), max = Math.round(n(i.max, 100));
      const count = Math.max(1, Math.round(n(i.count, 5)));
      if (max < min) return { results: [], error: "Maximum must be greater than or equal to minimum." };
      const range = max - min + 1;
      if (i.unique === "no" && count > range) return { results: [], error: `Can't generate ${count} unique numbers from a range of only ${range}.` };
      const out: number[] = [];
      if (i.unique === "no") {
        const pool = Array.from({ length: range }, (_, k) => min + k);
        while (out.length < count) {
          const idx = randomInt(0, pool.length - 1);
          out.push(pool[idx]);
          pool.splice(idx, 1);
        }
      } else {
        for (let k = 0; k < count; k++) out.push(randomInt(min, max));
      }
      return { results: [{ label: count === 1 ? "Random Number" : "Random Numbers", value: out.join(", "), emphasis: true }] };
    },
    relatedSlugs: ["dice-roller", "password-generator"],
  },
  {
    slug: "dice-roller",
    title: "Dice Roller",
    category: "everyday",
    shortDescription: "Roll any number of virtual dice with any number of sides.",
    seoDescription: "Roll virtual dice online — choose the number of dice and sides per die, and see the total.",
    formulaSummary: "Uniform random integer 1..sides per die",
    fields: [
      { name: "numDice", label: "Number of Dice", type: "number", defaultValue: 2, min: 1, max: 50, step: 1 },
      { name: "sides", label: "Sides Per Die", type: "number", defaultValue: 6, min: 2, max: 1000, step: 1 },
    ],
    calculate: (i) => {
      const numDice = Math.max(1, Math.round(n(i.numDice, 2)));
      const sides = Math.max(2, Math.round(n(i.sides, 6)));
      const rolls = Array.from({ length: numDice }, () => randomInt(1, sides));
      return {
        results: [
          { label: "Rolls", value: rolls.join(", "), emphasis: true },
          { label: "Total", value: fmtNumber(rolls.reduce((a, b) => a + b, 0), 0), emphasis: true },
        ],
      };
    },
    relatedSlugs: ["random-number-generator"],
  },
  {
    slug: "love-calculator",
    title: "Love Calculator",
    category: "everyday",
    shortDescription: "A just-for-fun compatibility score between two names.",
    seoDescription: "A fun, novelty love compatibility calculator that turns two names into a percentage score.",
    formulaSummary: "Deterministic hash of both names — for entertainment only",
    fields: [
      { name: "name1", label: "Your Name", type: "text", defaultValue: "Alex" },
      { name: "name2", label: "Their Name", type: "text", defaultValue: "Sam" },
    ],
    calculate: (i) => {
      if (!i.name1 || !i.name2) return { results: [], error: "Enter both names." };
      const score = hashNames(i.name1, i.name2);
      return {
        results: [{ label: `${i.name1} + ${i.name2}`, value: `${score}%`, emphasis: true }],
        notes: ["Just for fun — not a real compatibility measure! The same two names always give the same score."],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "ip-subnet-calculator",
    title: "IP Subnet Calculator",
    category: "everyday",
    shortDescription: "Calculate network address, broadcast address and host range from an IPv4 address and CIDR prefix.",
    seoDescription: "Calculate the network address, broadcast address, subnet mask and usable host range from an IPv4 address and CIDR prefix length.",
    formulaSummary: "IPv4 bitwise masking",
    fields: [
      { name: "ip", label: "IP Address", type: "text", defaultValue: "192.168.1.10" },
      { name: "cidr", label: "CIDR Prefix (/n)", type: "number", defaultValue: 24, min: 0, max: 32, step: 1 },
    ],
    calculate: (i) => {
      const parts = (i.ip || "").split(".").map((p) => Number(p.trim()));
      if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) {
        return { results: [], error: "Enter a valid IPv4 address, e.g. 192.168.1.10." };
      }
      const cidr = Math.max(0, Math.min(32, Math.round(n(i.cidr, 24))));
      const ipInt = ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
      const maskInt = cidr === 0 ? 0 : (0xffffffff << (32 - cidr)) >>> 0;
      const networkInt = ipInt & maskInt;
      const broadcastInt = networkInt | (~maskInt >>> 0);
      const toIp = (v: number) => [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join(".");
      const totalHosts = Math.pow(2, 32 - cidr);
      const usable = cidr >= 31 ? totalHosts : Math.max(0, totalHosts - 2);
      return {
        results: [
          { label: "Network Address", value: toIp(networkInt), emphasis: true },
          { label: "Broadcast Address", value: toIp(broadcastInt), emphasis: true },
          { label: "Subnet Mask", value: toIp(maskInt) },
          { label: "Usable Host Range", value: cidr >= 31 ? "N/A" : `${toIp(networkInt + 1)} – ${toIp(broadcastInt - 1)}` },
          { label: "Usable Hosts", value: fmtNumber(usable, 0) },
        ],
      };
    },
    relatedSlugs: [],
  },
  {
    slug: "day-of-the-week-calculator",
    title: "Day of the Week Calculator",
    category: "everyday",
    shortDescription: "Find out what day of the week any date falls on.",
    seoDescription: "Find the day of the week for any calendar date, past or future.",
    formulaSummary: "JavaScript Gregorian calendar lookup",
    fields: [{ name: "date", label: "Date", type: "date", defaultValue: "" }],
    calculate: (i) => {
      const d = parseDateUTC(i.date);
      if (!d) return { results: [], error: "Enter a valid date." };
      const weekday = d.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
      return { results: [{ label: "Day of the Week", value: weekday, emphasis: true }] };
    },
    relatedSlugs: ["date-calculator"],
  },
];

export default everyday;
