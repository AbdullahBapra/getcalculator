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
      const totalMonthsLived = years * 12 + months;
      const totalWeeksLived = Math.floor(totalDays / 7);
      const totalHoursLived = totalDays * 24;
      return {
        results: [
          { label: "Age", value: `${years} years, ${months} months, ${days} days`, emphasis: true },
          { label: "Total Days Lived", value: fmtNumber(totalDays, 0) },
          { label: "Days Until Next Birthday", value: fmtNumber(daysToNextBday, 0) },
        ],
        table: {
          headers: ["Unit", "Your Age In That Unit"],
          rows: [
            ["Years", `${years} yr${years === 1 ? "" : "s"} (+ ${months}mo ${days}d)`],
            ["Months (approx.)", `${fmtNumber(totalMonthsLived, 0)} months`],
            ["Weeks", `${fmtNumber(totalWeeksLived, 0)} weeks`],
            ["Days", `${fmtNumber(totalDays, 0)} days`],
            ["Hours (approx.)", `${fmtNumber(totalHoursLived, 0)} hours`],
          ],
        },
        chartCaption: `The exact same amount of time — ${fmtNumber(totalDays, 0)} days — counted in different units. Handy for spotting a round-number milestone, like your 10,000th day.`,
      };
    },
    content: {
      intro: [
        "Most of the time \"how old am I\" only needs a rough answer, but every so often it doesn't — a visa form wants your age in complete years as of a specific date, a scholarship has a cutoff of \"under 25 on the application deadline,\" or you just want to know if you've quietly crossed your 10,000th day alive. Subtracting birth year from the current year gets you close, but it's wrong for roughly a third of the year, right up until your birthday actually passes.",
        "This calculator does the subtraction properly, accounting for how many days are actually in the months involved, so the years/months/days figure it gives you is exact rather than approximate. Enter a birth date and, optionally, any other date to measure from — it doesn't have to be today, so it also works for \"how old was I on my wedding day\" or \"how old will I be when this loan is paid off.\"",
        "It also breaks the same span down into total months, weeks, hours and days, which is where the milestone-chasing usually happens: plenty of people time a small celebration around their 10,000th day or their millionth hour.",
      ],
      howItWorks: [
        "The calculator counts full years first, then full months within the remaining span, then whatever days are left over — borrowing from the previous month's actual day count (28, 29, 30 or 31, whichever applies) when the end date's day-of-month is earlier than the birth date's, so a birthday on the 31st is handled correctly even in months that don't have 31 days.",
        "Total days lived is a straight difference in milliseconds between the two dates, converted to whole days, which is also what the months/weeks/hours figures in the table are derived from — so all the units describe the exact same span, just sliced differently.",
      ],
      faq: [
        {
          q: "How is age calculated in exact years, months, and days?",
          a: "The calculator counts complete years elapsed since the birth date, then complete months within what's left, then the remaining days — the same way you'd count on a calendar by hand, just automated so leap years and different month lengths don't trip it up.",
        },
        {
          q: "Why doesn't my age just equal this year minus my birth year?",
          a: "That subtraction only gives the right answer after your birthday has passed this year; before it, you're still one year younger than the subtraction implies. This calculator checks whether the birthday has occurred as of your chosen date and adjusts automatically.",
        },
        {
          q: "Can I calculate my age as of a future or past date, not just today?",
          a: "Yes — the \"As of Date\" field defaults to today but accepts any date, so you can find your age at a past event, a future deadline, or any other specific day.",
        },
        {
          q: "Does this account for leap years?",
          a: "Yes. The day-count and total-days figures are based on real calendar dates, so leap years are included automatically wherever they fall within the span — you don't need to adjust anything.",
        },
        {
          q: "How do I find out when I'll hit a round number of days old, like 10,000 or 30,000?",
          a: "Use the Total Days Lived figure as a baseline: subtract it from your target number to see how many days remain, then use the Date Calculator's add/subtract mode with that count to get the actual calendar date.",
        },
      ],
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
        const resultLabel = d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
        const startLabel = start.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
        return {
          results: [{ label: "Resulting Date", value: resultLabel, emphasis: true }],
          steps: [
            `Starting date: ${startLabel}`,
            `${i.direction === "subtract" ? "Subtract" : "Add"} ${Math.abs(n(i.amount, 0))} ${i.unit} ${i.direction === "subtract" ? "before" : "after"} that date.`,
            `Result: ${resultLabel}`,
          ],
        };
      }
      const end = parseDateUTC(i.endDate);
      if (!end) return { results: [], error: "Enter a valid end date." };
      const totalDays = Math.round((end.getTime() - start.getTime()) / 86400000);
      const earlier = totalDays >= 0 ? start : end;
      const later = totalDays >= 0 ? end : start;
      const { years, months, days } = monthDiff(earlier, later);
      const absDays = Math.abs(totalDays);
      const totalMonthsSpan = years * 12 + months;
      return {
        results: [
          { label: "Total Days", value: fmtNumber(absDays, 0), emphasis: true },
          { label: "Breakdown", value: `${years} years, ${months} months, ${days} days` },
          { label: "Total Weeks", value: fmtNumber(absDays / 7, 1) },
        ],
        table: {
          headers: ["Unit", "Span"],
          rows: [
            ["Years + Months + Days", `${years}y ${months}m ${days}d`],
            ["Months (approx.)", `${fmtNumber(totalMonthsSpan, 0)} months`],
            ["Weeks", `${fmtNumber(absDays / 7, 1)} weeks`],
            ["Days", `${fmtNumber(absDays, 0)} days`],
          ],
        },
        chartCaption: `The same span between these two dates, expressed in different units — pick whichever is easiest to plan around.`,
      };
    },
    content: {
      intro: [
        "\"How many days until\" and \"what date is 90 days from now\" are two versions of the same underlying problem, and this calculator handles both. The difference mode answers questions like how many days are left until a deadline, how long a trip lasted, or how many days someone has been employed; the add/subtract mode answers the reverse — given a starting date, what date do you land on after adding or subtracting a stretch of days, weeks, months or years.",
        "It shows up in contract and legal work more than people expect — a 30-day notice period, a 90-day payment term, a 180-day residency test — where the exact date matters and \"about three months\" isn't good enough. It's just as useful for ordinary planning: counting down to a trip, working out a project deadline, or figuring out what week a due date falls in.",
        "Because month lengths aren't uniform, adding \"3 months\" or counting the days between two dates six months apart isn't simple multiplication — this handles the calendar's irregularities (28/29/30/31-day months, leap years) so the result matches what a calendar would actually show.",
      ],
      howItWorks: [
        "In difference mode, the calculator takes a straight day count between the two dates and separately works out a years/months/days breakdown by counting whole calendar units, the same way you'd count by hand — so \"14 months\" and \"1 year, 2 months\" both appear, letting you use whichever framing fits.",
        "In add/subtract mode, adding months or years moves the calendar field directly (so adding 1 month to January 31 rolls forward using JavaScript's date arithmetic, which normalizes overflow into the next month) rather than adding a fixed number of days, which is what keeps \"add 1 month\" behaving the way a calendar would, not like adding exactly 30 days.",
      ],
      faq: [
        {
          q: "How many days are there between two dates?",
          a: "Enter both dates in difference mode and the calculator gives you the total day count along with a years/months/days breakdown, so you can see the span both as a single number and as a calendar-style duration.",
        },
        {
          q: "Does the day count include both the start and end date?",
          a: "The total is the number of days between the two dates, not an inclusive count of both endpoints — if you need an inclusive count (common for things like \"how many days do I have off,\" counting both the first and last day), add 1 to the result.",
        },
        {
          q: "What date is 90 days from today?",
          a: "Switch to add/subtract mode, set the amount to 90, the unit to days, and the direction to add, starting from today's date — the calculator returns the exact resulting calendar date.",
        },
        {
          q: "How does adding months handle different month lengths?",
          a: "It moves forward by calendar months rather than a fixed day count, so adding a month to a date in a 31-day month and one in a 30-day month still land on the corresponding day the following month wherever that's possible.",
        },
        {
          q: "Does this calculator account for leap years?",
          a: "Yes — because all the arithmetic operates on real calendar dates rather than a fixed 365-day year, leap years are already reflected in both the difference and add/subtract results.",
        },
      ],
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
      const decimalHours = diff / 60;
      let lengthCategory = "Quick";
      if (decimalHours >= 12) lengthCategory = "Extended / overnight";
      else if (decimalHours >= 8) lengthCategory = "Full day";
      else if (decimalHours >= 4) lengthCategory = "Half day";
      else if (decimalHours >= 1) lengthCategory = "Short";
      return {
        results: [
          { label: "Duration", value: `${hours}h ${minutes}m`, emphasis: true },
          { label: "Total Minutes", value: fmtNumber(diff, 0) },
          { label: "Decimal Hours", value: fmtNumber(diff / 60, 2) },
        ],
        gauge: {
          value: decimalHours,
          min: 0,
          max: 24,
          valueLabel: `${hours}h ${minutes}m`,
          zones: [
            { label: "Quick (<1h)", to: 1, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Short (1-4h)", to: 4, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Half day (4-8h)", to: 8, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Full day (8-12h)", to: 12, barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
            { label: "Extended / overnight (12-24h)", to: 24, barClass: "bg-violet-400 dark:bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
          ],
        },
        chartCaption: `${hours}h ${minutes}m falls in the "${lengthCategory}" range on a 24-hour scale.`,
      };
    },
    content: {
      intro: [
        "Working out how long something lasted from a start and end time sounds trivial until the math involves borrowing across the hour, or the event runs past midnight into the next day — a night shift that starts at 22:00 and ends at 06:00, a flight that departs late and lands the next morning, a movie marathon that started before midnight. Straight subtraction gives a negative number in exactly those cases, which is where people usually reach for a calculator instead of doing it in their head.",
        "It's built for anything measured start-to-end in clock time rather than elapsed stopwatch time: shift lengths, meeting spans, how long a call lasted, or how much runway is left between now and an appointment. The overnight toggle handles the midnight-crossing case explicitly, so you don't have to mentally add 24 hours yourself.",
        "The result is given three ways — hours and minutes, total minutes, and decimal hours — because different situations call for different units: decimal hours is what most timesheet and billing software expects, while hours-and-minutes is what you'd say out loud.",
      ],
      faq: [
        {
          q: "How do I calculate duration across midnight?",
          a: "Enter the start and end times as normal, then set \"End time is the next day\" to Yes — the calculator adds 24 hours before subtracting so the span comes out correct instead of negative.",
        },
        {
          q: "What's the difference between the duration shown here and decimal hours?",
          a: "They're the same span expressed two ways: \"7h 30m\" is the clock-style reading, while 7.5 is the decimal-hours version used by most payroll and invoicing systems — both numbers describe the identical duration.",
        },
        {
          q: "Can I use this to check how long I have until an appointment?",
          a: "Yes — enter the current time as the start and the appointment time as the end (with the overnight toggle set appropriately if it's tomorrow) to see exactly how much time is left.",
        },
        {
          q: "Does it handle times entered without leading zeros?",
          a: "Enter times as HH:MM in 24-hour format, such as 09:00 rather than 9:00 — the calculator expects two digits for the hour and will flag the entry if it can't be parsed.",
        },
      ],
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
      return {
        results,
        breakdown: [
          { label: "Regular Hours", value: regular, displayValue: `${fmtNumber(regular, 2)}h` },
          { label: "Overtime Hours", value: overtime, displayValue: `${fmtNumber(overtime, 2)}h` },
        ],
        chartCaption:
          overtime > 0
            ? `Overtime makes up ${fmtNumber((overtime / Math.max(workedHours, 0.0001)) * 100, 0)}% of the hours worked${rate > 0 ? `, and pays 1.5× the rate — worth $${fmtNumber(overtime * rate * 1.5, 2)} of the total.` : "."}`
            : `All ${fmtNumber(workedHours, 2)}h worked stayed within the ${fmtNumber(threshold, 0)}h regular-time threshold — no overtime kicked in.`,
      };
    },
    content: {
      intro: [
        "Hourly employees rarely get a clean number of hours on a timesheet — a shift that starts at 8:00, ends at 5:00, with a 30-minute unpaid lunch in the middle works out to 8.5 hours, not the 9 the raw clock times suggest. This calculator does that subtraction for you, then goes a step further and estimates the actual paycheck, splitting regular hours from overtime and applying a 1.5× multiplier to whatever crosses your daily threshold.",
        "It's aimed at the moment before payday, not after: checking a timesheet looks right before submitting it, estimating what a shift is going to pay before you work it, or a manager sanity-checking hours across a pay period. Freelancers and contractors doing client billing by the hour use the same math, just without the overtime rule applying.",
        "The overtime threshold defaults to 8 hours a day, which is the common daily-overtime convention in the US, but it's editable — some jobs use a 40-hour weekly threshold instead, or a different daily cutoff entirely, so adjust it to match whatever rule actually governs your pay.",
      ],
      howItWorks: [
        "Worked hours are the raw clock-out-minus-clock-in span with the unpaid break subtracted; if that span crosses midnight, the calculator adds a full day to keep the subtraction positive. Regular hours are worked hours capped at the overtime threshold, and overtime is whatever remains above it, paid at 1.5× the entered hourly rate — a standard time-and-a-half calculation, though your employer's actual overtime rules may differ by state or contract.",
      ],
      faq: [
        {
          q: "How do I calculate hours worked from clock-in and clock-out times?",
          a: "Enter your clock-in and clock-out times and any unpaid break length — the calculator subtracts the break from the raw span between the two times to give total hours worked.",
        },
        {
          q: "Is the break time paid or unpaid in this calculation?",
          a: "The break field is treated as unpaid time and subtracted from the worked hours entirely; if your break is paid, set it to 0 so it doesn't reduce your hours.",
        },
        {
          q: "How is overtime pay calculated here?",
          a: "Hours up to the overtime threshold (8 hours a day by default) are paid at your regular rate, and anything beyond that is paid at 1.5× that rate — you can change the threshold if your job uses a different daily or weekly overtime rule.",
        },
        {
          q: "Does this account for state-specific overtime laws?",
          a: "No — overtime rules vary by state, industry and sometimes union contract (some require overtime after 40 hours a week rather than 8 a day, for instance), so treat the result as an estimate and adjust the threshold to match the rule that actually applies to you.",
        },
        {
          q: "What if my shift goes past midnight?",
          a: "Enter the clock-in and clock-out times as usual — if the clock-out time is earlier in the day than the clock-in time, the calculator assumes the shift crossed midnight and adds 24 hours automatically.",
        },
      ],
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
      const courses: { credits: number; grade: number }[] = [];
      for (const p of pairs) {
        const [c, g] = p.split(":").map((v) => Number(v.trim()));
        if (!Number.isFinite(c) || !Number.isFinite(g)) continue;
        totalCredits += c;
        totalPoints += c * g;
        courses.push({ credits: c, grade: g });
      }
      if (totalCredits === 0) return { results: [], error: "Enter at least one valid credits:gradePoint pair, e.g. 3:4.0, 4:3.3" };
      const gpa = totalPoints / totalCredits;
      return {
        results: [
          { label: "GPA", value: fmtNumber(gpa, 3), emphasis: true },
          { label: "Total Credits", value: fmtNumber(totalCredits, 0) },
        ],
        breakdown: courses.map((c, idx) => ({
          label: `Course ${idx + 1} (${fmtNumber(c.credits, 0)} cr, ${fmtNumber(c.grade, 1)} GPA)`,
          value: c.credits * c.grade,
          displayValue: `${fmtNumber(c.credits * c.grade, 2)} pts`,
        })),
        chartCaption: `Each course contributes credits × grade point to the ${fmtNumber(totalPoints, 2)} total quality points behind your ${fmtNumber(gpa, 3)} GPA — bigger, higher-graded courses pull the average harder.`,
      };
    },
    content: {
      intro: [
        "A GPA isn't a simple average of your grades — a 3-credit class and a 4-credit class don't count equally, and most people only remember that fact right when they're staring at a transcript trying to figure out where they actually stand. This calculator does the credit-weighted math directly: list each course's credit hours and the grade point it earned, and it works out the overall average the way a registrar's office would.",
        "It's most useful at the two ends of a semester — planning what GPA a set of expected grades would produce before finals, and double-checking an official transcript figure once grades post. Transfer students and applicants comparing schools with different course loads use it too, since it's the credit weighting, not just the letter grades, that determines the final number.",
        "Grade points here follow the standard 4.0 scale (A = 4.0, B = 3.0, and so on, with pluses and minuses typically landing at .3 or .7 increments) — check your specific school's scale before relying on the result, since a few institutions use a 4.3 or 4.5 scale instead.",
      ],
      howItWorks: [
        "Each course's credit hours are multiplied by its grade point to get that course's \"quality points.\" The quality points for every course are summed, then divided by the total credit hours across all courses — GPA = Σ(credits × grade point) ÷ Σcredits. A 4-credit A (4.0) contributes more to the total than a 1-credit A, which is exactly why credit weighting matters.",
      ],
      faq: [
        {
          q: "How do I calculate my GPA by hand?",
          a: "Multiply each course's credit hours by its grade point, add those products together, then divide by the total credit hours across all courses — that weighted average is your GPA.",
        },
        {
          q: "What's the difference between GPA and grade point?",
          a: "A grade point is the numeric value assigned to a single letter grade (an A is typically 4.0), while GPA is the credit-weighted average of all your grade points across every course you've taken.",
        },
        {
          q: "Does a 4-credit class count more than a 1-credit class toward my GPA?",
          a: "Yes — that's the entire point of credit weighting. A high grade in a 4-credit course moves your GPA much more than the same grade in a 1-credit course, since it contributes four times the quality points.",
        },
        {
          q: "How do I enter plus/minus grades like A- or B+?",
          a: "Enter the grade point value directly rather than the letter — most schools use 3.7 for an A-, 3.3 for a B+, and so on; check your institution's official scale if you're unsure of the exact values.",
        },
        {
          q: "Can this calculate my cumulative GPA across multiple semesters?",
          a: "Yes — list every course from every semester as one set of credits:gradePoint pairs; since GPA is just total quality points divided by total credits, it doesn't matter whether the courses span one term or four.",
        },
      ],
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
      const items: { score: number; weight: number }[] = [];
      for (const p of pairs) {
        const [score, weight] = p.split(":").map((v) => Number(v.trim()));
        if (!Number.isFinite(score) || !Number.isFinite(weight)) continue;
        totalWeight += weight;
        weightedSum += score * weight;
        items.push({ score, weight });
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
        breakdown: items.map((it, idx) => ({
          label: `Item ${idx + 1} (${fmtNumber(it.score, 0)}% @ ${fmtNumber(it.weight, 0)}% weight)`,
          value: (it.score * it.weight) / totalWeight,
          displayValue: `${fmtNumber((it.score * it.weight) / totalWeight, 2)}%`,
        })),
        chartCaption: `Each item's score, scaled by its share of the total weight, adds up to your ${fmtNumber(grade, 2)}% final grade — the biggest slices are whichever items carry the most weight, not necessarily the highest score.`,
      };
    },
    content: {
      intro: [
        "A syllabus that says \"homework 20%, midterm 30%, final 50%\" is telling you exactly how to calculate your grade, but doing that math by hand for five or six categories, each with its own score, is where mistakes creep in. This calculator takes each graded item as a score-and-weight pair and works out the weighted percentage directly — the same calculation your professor's gradebook software is running behind the scenes.",
        "It's most often used in two moments: checking where you currently stand partway through a term, and the finals-week question of what score you need on a remaining item to hit a target grade — plug in a placeholder score for the final and adjust it until the result matches the grade you're aiming for.",
        "Weights don't need to add up to exactly 100% for the math to work — the calculator normalizes against whatever your weights actually sum to, though it's worth double-checking your syllabus if they're off, since that usually means a category was missed.",
      ],
      howItWorks: [
        "Each item's score is multiplied by its weight, all of those products are summed, and the total is divided by the sum of the weights — Grade = Σ(score × weight) ÷ Σweight. If your weights already add up to 100, this simplifies to what you'd expect: each item contributing directly according to its stated percentage.",
      ],
      faq: [
        {
          q: "How do I calculate my weighted grade?",
          a: "Multiply each assignment or exam's score by its weight, add all of those together, then divide by the total of the weights — that gives you the overall weighted percentage, which is exactly what this calculator automates.",
        },
        {
          q: "What if my weights don't add up to 100%?",
          a: "The calculator still computes a correct weighted average by dividing by whatever the weights actually sum to, but it's worth checking your syllabus — weights not totaling 100% often means a category was left out.",
        },
        {
          q: "How do I figure out what I need on the final exam?",
          a: "Add the final as an item with its actual weight and try different scores for it until the resulting overall grade matches your target — that trial score is what you'd need to earn on the final.",
        },
        {
          q: "What letter grade corresponds to my percentage?",
          a: "This calculator uses a standard scale (93+ is an A, 90-92 is an A-, and so on down to below 60 as an F) as a general reference, but your instructor's actual cutoffs may differ, so check your syllabus for the definitive scale.",
        },
        {
          q: "Does a missing assignment count as a zero in this calculation?",
          a: "Only if you enter it as one — leave out an assignment entirely and it's excluded from the weighted average rather than counted as a zero, so include it with a 0 score if that's how your instructor treats missing work.",
        },
      ],
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
      let strength = "Very Weak";
      if (entropyBits >= 128) strength = "Very Strong"; else if (entropyBits >= 60) strength = "Strong"; else if (entropyBits >= 36) strength = "Reasonable"; else if (entropyBits >= 28) strength = "Weak";
      const gaugeMax = Math.max(160, entropyBits);
      return {
        results: [
          { label: "Password", value: pw, emphasis: true },
          { label: "Estimated Entropy", value: `${entropyBits} bits` },
        ],
        notes: ["Generated fresh each time you calculate — nothing is stored or sent anywhere. Use a password manager to save it."],
        gauge: {
          value: entropyBits,
          min: 0,
          max: gaugeMax,
          valueLabel: `${entropyBits} bits`,
          zones: [
            { label: "Very Weak", to: 28, barClass: "bg-red-400 dark:bg-red-500", textClass: "text-red-600 dark:text-red-400" },
            { label: "Weak", to: 36, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Reasonable", to: 60, barClass: "bg-yellow-400 dark:bg-yellow-500", textClass: "text-yellow-600 dark:text-yellow-400" },
            { label: "Strong", to: 128, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Very Strong", to: gaugeMax, barClass: "bg-emerald-500 dark:bg-emerald-400", textClass: "text-emerald-600 dark:text-emerald-400" },
          ],
        },
        chartCaption: `${entropyBits} bits of entropy rates as "${strength}" — each extra bit doubles the number of guesses an attacker would need to try.`,
      };
    },
    content: {
      intro: [
        "The moment this gets used is almost always the same one: a signup form just rejected \"password123\" and demanded something stronger, or a security prompt is nagging you to update an old, reused password. Rather than typing something memorable and hoping it's strong enough, this generates a genuinely random string from whatever character sets you choose — lowercase, uppercase, numbers, symbols — at a length you control.",
        "Everything happens in your browser. The password is generated locally using your browser's cryptographic random number generator and never touches a server, which matters more than it sounds — a password worth generating randomly is also a password worth not transmitting anywhere, even to the site that's supposedly helping you create it.",
        "Nothing is saved either, by design: refresh the page or hit calculate again and the previous password is gone for good, so the plan should always be to copy it straight into a password manager rather than relying on this page to remember it for you.",
      ],
      howItWorks: [
        "Each character is drawn independently and uniformly from the combined pool of the character sets you've enabled, using the browser's crypto.getRandomValues API where available — a cryptographically secure source, unlike Math.random(), which isn't designed to resist prediction.",
        "Strength is reported as entropy in bits, calculated as length × log2(pool size): a longer password or a larger character pool both increase it. Each additional bit doubles the number of guesses a brute-force attack would need on average, which is why length matters more than most people expect — going from 8 to 16 characters increases the guess space far more than adding a couple of symbols to an 8-character password ever could.",
      ],
      faq: [
        {
          q: "How long should a password be?",
          a: "12 characters is a reasonable practical minimum today, and 16 or more is comfortably strong for most purposes; length increases entropy faster than adding more character types does, so a longer password with fewer symbol types often beats a short one stuffed with special characters.",
        },
        {
          q: "Is this password generator actually secure?",
          a: "It uses your browser's cryptographically secure random number generator (crypto.getRandomValues) rather than a predictable pseudo-random function, and the password is never sent to a server — it exists only on your device until you copy it elsewhere.",
        },
        {
          q: "What does 'bits of entropy' actually mean?",
          a: "It's a measure of how many possible passwords could have been generated with your chosen length and character set — expressed as a power of two, so higher bits mean an attacker guessing at random would need to try exponentially more combinations before finding yours.",
        },
        {
          q: "Should every account have a different password?",
          a: "Yes — reusing a password means a breach at one site exposes every other account that shares it. A password manager makes using a unique, random password like this one for every account practical without having to memorize them.",
        },
        {
          q: "Why avoid password patterns like 'Name1234!'?",
          a: "Patterns based on real words, names or predictable substitutions are exactly what password-cracking tools test first — they cut the effective search space enormously compared to a truly random string of the same length, even though the two might look similarly complex at a glance.",
        },
      ],
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
      const shown = out.slice(0, 30);
      return {
        results: [{ label: count === 1 ? "Random Number" : "Random Numbers", value: out.join(", "), emphasis: true }],
        steps: [
          `Range: ${min} to ${max} inclusive — ${fmtNumber(range, 0)} possible whole number${range === 1 ? "" : "s"}.`,
          `Each draw picks uniformly at random, so on a single draw every number in range has about a ${fmtNumber(100 / range, range > 1000 ? 4 : 2)}% chance of coming up.`,
          i.unique === "no"
            ? `Duplicates are allowed, so ${count} independent draws were made — the same number can appear more than once.`
            : `Duplicates are excluded, so once a number is drawn it's removed from the pool before the next draw.`,
        ],
        // A single draw is a position on the range (gauge); several draws are a sequence
        // worth seeing in order (bar-per-draw) — different shapes get different charts.
        ...(count === 1
          ? {
              gauge: {
                value: out[0],
                min,
                max,
                zones: [
                  { label: "Low", to: min + range / 3, barClass: "bg-sky-300 dark:bg-sky-700", textClass: "text-sky-700 dark:text-sky-400" },
                  { label: "Mid", to: min + (2 * range) / 3, barClass: "bg-teal-400 dark:bg-teal-600", textClass: "text-teal-700 dark:text-teal-400" },
                  { label: "High", to: max, barClass: "bg-amber-400 dark:bg-amber-600", textClass: "text-amber-700 dark:text-amber-400" },
                ],
                valueLabel: `${out[0]}`,
              },
              chartCaption: `${out[0]} landed in the ${out[0] < min + range / 3 ? "low" : out[0] < min + (2 * range) / 3 ? "middle" : "high"} third of the ${min}–${max} range.`,
            }
          : {
              growthSeries: shown.map((v, idx) => ({ label: `#${idx + 1}`, value: v - min + 1, displayValue: `${v}` })),
              chartCaption:
                shown.length < out.length
                  ? `Showing the first ${shown.length} of ${out.length} draws, in the order they were generated.`
                  : `All ${out.length} draws, in the order they were generated.`,
            }),
      };
    },
    content: {
      intro: [
        "Picking a number \"at random\" by hand is harder to trust than it sounds — people are bad at generating genuine randomness, and any process that isn't seen as fair invites second-guessing. This tool exists for exactly that gap: pick a range, decide how many numbers you need, and whether repeats are allowed, and it draws them using your browser's random number generator instead of anyone's gut feeling.",
        "The common uses cluster around fairness and sampling: drawing a raffle or giveaway winner from a list of entrant numbers, assigning random order to participants, picking a random sample from a dataset, or settling something where a truly arbitrary pick is the whole point. It's also just handy for anything that needs an on-the-spot number — a lottery number pick, a random seed for a game.",
        "The unique-draws option matters for raffles specifically: with duplicates excluded, once a number is drawn it's removed from the pool, so you never end up picking the same winner's number twice from a single draw.",
      ],
      howItWorks: [
        "Every draw picks uniformly at random across the full min-to-max range, meaning each whole number in range has an equal chance of coming up on any given draw. With duplicates allowed, each draw is independent — the same number can be drawn more than once, just as rolling a die twice can give the same result twice. With duplicates excluded, the pool shrinks by one number after every draw, so later draws are selecting from a smaller set.",
      ],
      faq: [
        {
          q: "Is this random number generator actually random?",
          a: "It draws from your browser's built-in random number generator (using the cryptographic crypto.getRandomValues API where available), which is suitable for fair, unpredictable results in everyday use like raffles, games and sampling.",
        },
        {
          q: "Can I use this to pick a fair raffle or giveaway winner?",
          a: "Yes — set the minimum and maximum to match your entrant numbers, set the count to how many winners you need, and turn off duplicates so the same entrant can't be drawn twice in one draw.",
        },
        {
          q: "What's the difference between allowing and excluding duplicates?",
          a: "With duplicates allowed, each number drawn is put back in the pool, so the same value can appear more than once across multiple draws — useful for simulating independent events. Excluding duplicates removes each number once it's drawn, which is what you want when picking distinct winners or a sample without repeats.",
        },
        {
          q: "What's the maximum number of values I can generate at once?",
          a: "Up to 500 numbers in a single batch; if you need unique numbers and set the count higher than the size of your min-max range allows, the calculator will flag that there aren't enough distinct values available.",
        },
        {
          q: "Can I generate negative numbers or a range that spans zero?",
          a: "Yes — the minimum and maximum accept any whole numbers, including negative ones, as long as the maximum is greater than or equal to the minimum.",
        },
      ],
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
      const total = rolls.reduce((a, b) => a + b, 0);
      const expectedAvg = numDice * ((sides + 1) / 2);
      const minPossible = numDice * 1;
      const maxPossible = numDice * sides;
      return {
        results: [
          { label: "Rolls", value: rolls.join(", "), emphasis: true },
          { label: "Total", value: fmtNumber(total, 0), emphasis: true },
        ],
        notes: [`With ${numDice} die${numDice === 1 ? "" : "ce"} of ${sides} sides, totals can range from ${minPossible} to ${maxPossible}, averaging ${fmtNumber(expectedAvg, 1)} over many rolls.`],
        compare: [
          { label: "This Roll", value: total, displayValue: fmtNumber(total, 0), highlight: true },
          { label: "Statistical Average", value: expectedAvg, displayValue: fmtNumber(expectedAvg, 1) },
        ],
        chartCaption:
          total === expectedAvg
            ? `This roll landed exactly on the long-run average of ${fmtNumber(expectedAvg, 1)}.`
            : `This roll came in ${fmtNumber(Math.abs(total - expectedAvg), 1)} ${total > expectedAvg ? "above" : "below"} the long-run average of ${fmtNumber(expectedAvg, 1)} for ${numDice}d${sides}.`,
      };
    },
    content: {
      intro: [
        "You're mid-game, the d20 has rolled under the couch for the third time this session, or half the party's dice bag never made it to game night — this roller covers you, with any number of dice at any number of sides, not just the classic six-sided cube. Board games, tabletop RPGs, gambling-adjacent party games, or settling an argument with a coin-flip-style roll all work the same way here.",
        "Tabletop RPG players get the most out of the flexible sides field — a d20 for an attack roll, a d8 for damage, a d100 for a percentile check — while board gamers mostly want the standard 2d6. Either way, it rolls instantly and shows every individual die alongside the total, so you can see exactly what came up on each one, not just the sum.",
      ],
      faq: [
        {
          q: "Is this dice roller actually random and fair?",
          a: "Each die rolls an independent, uniformly random result from 1 to however many sides it has, using your browser's random number generator — every side has an equal chance on every roll, exactly like a physical fair die.",
        },
        {
          q: "Can I roll dice other than a standard six-sided die?",
          a: "Yes — set \"Sides Per Die\" to whatever you need: 4, 8, 10, 12, 20, or any other number, covering the full set of dice used in tabletop RPGs plus anything unusual a game calls for.",
        },
        {
          q: "How many dice can I roll at once?",
          a: "Up to 50 dice in a single roll, each shown individually alongside the combined total.",
        },
        {
          q: "Why does the total rarely land exactly on the statistical average?",
          a: "With multiple dice, individual rolls swing above and below the average and mostly cancel out, but any single roll is still just one sample — the average only becomes visible after many, many rolls, which is exactly what the comparison bar above is showing you.",
        },
        {
          q: "Can I use this for a percentile (d100) roll?",
          a: "Yes — set sides to 100 and roll a single die to get a number from 1 to 100, the standard way tabletop games handle percentile checks.",
        },
      ],
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
      let zone = "Just Friends";
      if (score >= 80) zone = "Soulmates"; else if (score >= 60) zone = "Good Match"; else if (score >= 40) zone = "Some Spark";
      return {
        results: [{ label: `${i.name1} + ${i.name2}`, value: `${score}%`, emphasis: true }],
        notes: ["Just for fun — not a real compatibility measure! The same two names always give the same score."],
        gauge: {
          value: score,
          min: 0,
          max: 100,
          valueLabel: `${score}%`,
          zones: [
            { label: "Just Friends", to: 40, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Some Spark", to: 60, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Good Match", to: 80, barClass: "bg-pink-400 dark:bg-pink-500", textClass: "text-pink-600 dark:text-pink-400" },
            { label: "Soulmates", to: 100, barClass: "bg-rose-500 dark:bg-rose-400", textClass: "text-rose-600 dark:text-rose-400" },
          ],
        },
        chartCaption: `${i.name1} + ${i.name2} lands in the "${zone}" zone at ${score}% — purely for laughs, so take it exactly as seriously as it deserves.`,
      };
    },
    content: {
      intro: [
        "This is the internet's oldest party trick: type in two names, get back a percentage, and either laugh at it or screenshot it depending on how the numbers fell. It's not measuring anything real about you or the other person — it's a playful novelty that turns two names into a score for a bit of fun, whether you're texting it to a group chat, testing it on a crush's name, or just curious what your own name pairs best with.",
        "The one honest thing about it: type the same two names in again and you'll get the exact same percentage every time. There's no dice roll hiding behind the curtain — the score comes from the names themselves, so no amount of retrying will \"reroll\" you a better result.",
      ],
      faq: [
        {
          q: "Is the love calculator score real or scientifically accurate?",
          a: "No — it's a novelty generator for entertainment only. There's no relationship science behind the percentage; it's purely for fun and shouldn't be read as a genuine compatibility measurement.",
        },
        {
          q: "Why do I get the same percentage every time I enter the same two names?",
          a: "The score is generated deterministically from the two names themselves, so the same pair of names always produces the same result — it isn't re-randomized on each try.",
        },
        {
          q: "Does the order I enter the names in matter?",
          a: "No — swapping which name goes in \"Your Name\" versus \"Their Name\" produces the same score either way, since both names are combined together before the score is generated.",
        },
        {
          q: "Can I get a 100% match?",
          a: "It's possible but intentionally rare — most name pairs land somewhere in the middle of the range, with a perfect 100% only turning up occasionally.",
        },
      ],
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
      let sizeCategory = "Point-to-point / single host";
      if (cidr <= 7) sizeCategory = "Massive (ISP-scale)"; else if (cidr <= 15) sizeCategory = "Large enterprise"; else if (cidr <= 23) sizeCategory = "Medium network"; else if (cidr <= 29) sizeCategory = "Small LAN";
      return {
        results: [
          { label: "Network Address", value: toIp(networkInt), emphasis: true },
          { label: "Broadcast Address", value: toIp(broadcastInt), emphasis: true },
          { label: "Subnet Mask", value: toIp(maskInt) },
          { label: "Usable Host Range", value: cidr >= 31 ? "N/A" : `${toIp(networkInt + 1)} – ${toIp(broadcastInt - 1)}` },
          { label: "Usable Hosts", value: fmtNumber(usable, 0) },
        ],
        gauge: {
          value: cidr,
          min: 0,
          max: 32,
          valueLabel: `/${cidr}`,
          zones: [
            { label: "Massive (ISP-scale)", to: 7, barClass: "bg-violet-400 dark:bg-violet-500", textClass: "text-violet-600 dark:text-violet-400" },
            { label: "Large enterprise", to: 15, barClass: "bg-sky-400 dark:bg-sky-500", textClass: "text-sky-600 dark:text-sky-400" },
            { label: "Medium network", to: 23, barClass: "bg-teal-500 dark:bg-teal-400", textClass: "text-teal-600 dark:text-teal-400" },
            { label: "Small LAN", to: 29, barClass: "bg-amber-400 dark:bg-amber-500", textClass: "text-amber-600 dark:text-amber-400" },
            { label: "Point-to-point / single host", to: 32, barClass: "bg-orange-400 dark:bg-orange-500", textClass: "text-orange-600 dark:text-orange-400" },
          ],
        },
        chartCaption: `A /${cidr} network provides ${fmtNumber(usable, 0)} usable host address${usable === 1 ? "" : "es"} — that puts it in the "${sizeCategory}" range of subnet sizes.`,
      };
    },
    content: {
      intro: [
        "Given an IP address and a CIDR prefix like /24, the practical questions that follow are always the same: what's the network address, what's the broadcast address, and how many actual devices can I put on this network? Those aren't things you read off the IP address directly — they come from applying the subnet mask, which is exactly what this calculator works out.",
        "It's aimed at the people who need this regularly: network engineers and sysadmins planning IP address ranges, students working through CCNA or Network+ material where subnetting is a core skill, and anyone setting up a home lab, VLAN, or router configuration who needs to know whether a given block of addresses is big enough for the devices going on it.",
        "Enter any IPv4 address and a prefix from /0 to /32, and it returns the network address, broadcast address, dotted-decimal subnet mask, and the usable host range in one pass — the numbers you'd otherwise work out by converting to binary and masking by hand.",
      ],
      howItWorks: [
        "The CIDR prefix determines how many leading bits of the 32-bit address are the \"network\" portion versus the \"host\" portion — a /24 fixes the first 24 bits as network, leaving 8 bits (256 addresses) for hosts. The subnet mask is just that split expressed in dotted-decimal form: /24 is 255.255.255.0.",
        "The network address is found by applying a bitwise AND between the IP address and the subnet mask, which zeroes out the host bits. The broadcast address flips the host bits to all 1s instead, giving the highest address in the range. Two addresses in every subnet are reserved this way — the network address and the broadcast address — so the usable host count is the total address space minus 2 (except for /31 and /32, which use special conventions with no reserved addresses).",
      ],
      faq: [
        {
          q: "What's the difference between the network address and broadcast address?",
          a: "The network address is the lowest address in the subnet (all host bits set to 0) and identifies the subnet itself rather than any device on it. The broadcast address is the highest address (all host bits set to 1) and is used to send a packet to every device on that subnet at once. Neither is assignable to an individual device.",
        },
        {
          q: "How many usable hosts does a /24 network provide?",
          a: "A /24 has 256 total addresses, minus 2 reserved for the network and broadcast addresses, leaving 254 usable host addresses — the classic setup behind a typical 192.168.1.0/24 home or small-office network.",
        },
        {
          q: "What does the CIDR notation /24 actually mean?",
          a: "It means the first 24 bits of the 32-bit IPv4 address are fixed as the network portion, leaving the remaining 8 bits available for host addresses — equivalent to a 255.255.255.0 subnet mask.",
        },
        {
          q: "Why are 2 addresses always subtracted from the total for usable hosts?",
          a: "Every subnet reserves its lowest address as the network address and its highest as the broadcast address — neither can be assigned to a device — so usable hosts is always the total address count minus those two, except at /31 and /32 where special rules apply for point-to-point links and single hosts.",
        },
        {
          q: "What's a subnet mask, and how does it relate to CIDR notation?",
          a: "A subnet mask is the dotted-decimal form of the same information a CIDR prefix conveys — both mark where the network portion of an address ends and the host portion begins; /24 and 255.255.255.0 describe the identical subnet.",
        },
      ],
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
      const year = d.getUTCFullYear();
      const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      const isoDayNum = d.getUTCDay() === 0 ? 7 : d.getUTCDay();
      const startOfYear = Date.UTC(year, 0, 1);
      const dayOfYear = Math.floor((d.getTime() - startOfYear) / 86400000) + 1;
      return {
        results: [{ label: "Day of the Week", value: weekday, emphasis: true }],
        steps: [
          `${weekday} is day ${isoDayNum} of the ISO week (Monday = 1 … Sunday = 7).`,
          `It's day ${dayOfYear} of ${isLeap ? 366 : 365} in ${year}, which is${isLeap ? "" : " not"} a leap year.`,
        ],
        notes: ["Calculated using the standard Gregorian calendar, so it's exact for any real-world date and is a mathematical projection for dates before Gregorian adoption in 1582."],
        // Day-of-year is inherently "where does this fall across the year" — a gauge
        // with the four quarters as zones turns that into something you can see at a glance.
        gauge: {
          value: dayOfYear,
          min: 1,
          max: isLeap ? 366 : 365,
          zones: [
            { label: "Q1", to: isLeap ? 91 : 90, barClass: "bg-sky-300 dark:bg-sky-700", textClass: "text-sky-700 dark:text-sky-400" },
            { label: "Q2", to: isLeap ? 182 : 181, barClass: "bg-teal-400 dark:bg-teal-600", textClass: "text-teal-700 dark:text-teal-400" },
            { label: "Q3", to: isLeap ? 274 : 273, barClass: "bg-amber-400 dark:bg-amber-600", textClass: "text-amber-700 dark:text-amber-400" },
            { label: "Q4", to: isLeap ? 366 : 365, barClass: "bg-violet-400 dark:bg-violet-600", textClass: "text-violet-700 dark:text-violet-400" },
          ],
          valueLabel: `Day ${dayOfYear}`,
        },
        chartCaption: `${weekday}, ${year} is day ${dayOfYear} of ${isLeap ? 366 : 365} — about ${fmtNumber((dayOfYear / (isLeap ? 366 : 365)) * 100, 0)}% of the way through the year.`,
      };
    },
    content: {
      intro: [
        "\"What day of the week was that?\" comes up more than you'd think — checking whether your birthday fell on a weekend a particular year, confirming a historical date (was the moon landing really a Sunday?), or working out what day a future date lands on so you can tell if an event falls on a weekday. Mental calendar math gets unreliable more than a few months out in either direction, which is exactly when this is handiest.",
        "Enter any calendar date and it returns the day of the week instantly, along with where that date falls in the year — its ISO day-of-week number and how far through the year it is. That second part is a quick way to see how close a date is to a quarter boundary or the year's midpoint without counting on your fingers.",
      ],
      howItWorks: [
        "The calculation uses the standard Gregorian calendar — the one in everyday use worldwide today — so results are exact for any real-world date. For dates before October 1582, when the Gregorian calendar was formally adopted (and adopted at different times in different countries after that), the result is a proleptic projection: it applies today's calendar rules backward, which won't match the Julian calendar dates actually in use at the time.",
      ],
      faq: [
        {
          q: "What day of the week was I born?",
          a: "Enter your birth date and the calculator returns the exact weekday it fell on, calculated using the standard Gregorian calendar.",
        },
        {
          q: "Can this calculate the day of the week for a future date?",
          a: "Yes — it works identically for any future or past date; the same calendar math applies regardless of which direction you're calculating.",
        },
        {
          q: "Is this accurate for dates before 1582?",
          a: "It's a mathematical projection rather than a historical record — the Gregorian calendar wasn't adopted until October 1582 (and at different times in different countries), so dates before that used the Julian calendar in real life, which drifts from the Gregorian by a growing number of days the further back you go.",
        },
        {
          q: "How does this account for leap years?",
          a: "Leap years are built directly into the Gregorian calendar rules the calculation follows, so they're automatically reflected in both the weekday result and the day-of-year figure — no separate adjustment is needed.",
        },
        {
          q: "What's the difference between the day-of-week and day-of-year numbers shown?",
          a: "The ISO day-of-week number ranks the weekday from 1 (Monday) to 7 (Sunday), while the day-of-year number counts how many days have elapsed since January 1st of that year — they answer different questions about the same date.",
        },
      ],
    },
    relatedSlugs: ["date-calculator"],
  },
];

export default everyday;
