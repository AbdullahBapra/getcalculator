// Shared types for the calculator platform. Every calculator (financial, health,
// math, everyday) is defined as data + a pure calculate() function that implements
// this contract, so the UI (CalculatorShell) is generic and never duplicated.

export type CategoryKey = "financial" | "health" | "math" | "everyday";

export interface CategoryMeta {
  key: CategoryKey;
  title: string;
  description: string;
}

export type FieldType = "number" | "select" | "text" | "date" | "radio";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  /** key used in the inputs record and the shareable query string */
  name: string;
  label: string;
  type: FieldType;
  unit?: string;
  defaultValue?: number | string;
  options?: FieldOption[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  help?: string;
  /** only render this field when the predicate over current raw inputs is true */
  showIf?: (inputs: Record<string, string>) => boolean;
  /** A live, EDITABLE "other unit" twin for this field — e.g. a weight field in lb gets
   *  a linked kg box right next to it: type in either one and the other updates. So
   *  someone who only knows their weight in kg never has to do the math themselves. */
  convertPair?: {
    /** unit label shown after the twin input, e.g. "kg" */
    unit: string;
    /** accessible name for the twin input — defaults to `"${field.label} in ${unit}"`,
     *  which reads oddly for a field with no visible label (e.g. the second half of a
     *  ft/in pair) — set this to override, e.g. "Height in cm". */
    ariaLabel?: string;
    /** current value to display in the twin input, given the full inputs record
     *  (some conversions need a sibling field too, e.g. ft + in → cm) */
    toDisplay: (inputs: Record<string, string>) => string;
    /** called when the person types in the twin input — write the converted value(s)
     *  back with `setField`, which may target this field, a sibling field, or both
     *  (e.g. typing a cm height writes both the ft and in fields). */
    onDisplayChange: (displayValue: string, inputs: Record<string, string>, setField: (name: string, value: string) => void) => void;
  };
}

export interface ResultLine {
  label: string;
  value: string;
  unit?: string;
  emphasis?: boolean;
}

export interface BreakdownSegment {
  label: string;
  /** raw number used to size this segment relative to the others — not displayed directly */
  value: number;
  /** the formatted string actually shown, e.g. "$320,000.00" */
  displayValue: string;
}

export interface CalcOutput {
  results: ResultLine[];
  /** human-readable "show your work" breakdown, rendered as an ordered list */
  steps?: string[];
  /** short plain-text formula, e.g. "A = P(1 + r/n)^(nt)" */
  formula?: string;
  notes?: string[];
  error?: string;
  /** Optional parts-of-a-whole breakdown (e.g. principal vs. interest, P&I vs. tax vs.
   *  insurance) — rendered as an animated donut chart with a legend. Only meaningful
   *  when the segments are genuinely parts of one total; omit otherwise. */
  breakdown?: BreakdownSegment[];
  /** One plain-English sentence explaining what the chart actually means — shown right
   *  under it, so the visualization isn't just decoration you have to interpret yourself. */
  chartCaption?: string;
  /** For results that mean "where do I fall on a range" (BMI, body fat %, DTI) rather
   *  than "parts of a whole" — a spectrum bar with a sliding marker, instead of forcing
   *  that kind of answer into a donut chart it doesn't actually fit. */
  gauge?: {
    value: number;
    min: number;
    max: number;
    zones: { label: string; to: number; barClass: string; textClass: string }[];
    valueLabel: string;
  };
  /** For results that are a TRAJECTORY over time (a balance compounding year by year)
   *  rather than a static split — a growing bar chart you can hover/tap per-point. */
  growthSeries?: { label: string; value: number; displayValue: string }[];
  /** For results that mean "this one thing vs. that one thing" (before/after, you vs.
   *  average, option A vs. option B) — two side-by-side bars scaled to the larger value,
   *  not a donut (nothing here is a "part of a whole") and not a gauge (there's no range
   *  to fall on, just two numbers to size up against each other). 2-4 entries. */
  compare?: { label: string; value: number; displayValue: string; highlight?: boolean }[];
  /** For results that are naturally a small reference table (tax brackets applied, pace
   *  per mile/km, a lookup row-by-row) rather than a single number — rendered as a
   *  compact styled table instead of forcing it into a chart it doesn't fit. */
  table?: { headers: string[]; rows: string[][] };
}

export interface CalculatorDefinition {
  slug: string;
  title: string;
  category: CategoryKey;
  /** one-line summary shown on category/home listing cards */
  shortDescription: string;
  /** longer copy used in <meta description> and page intro */
  seoDescription: string;
  formulaSummary: string;
  fields: FieldDef[];
  calculate: (inputs: Record<string, string>) => CalcOutput;
  relatedSlugs?: string[];
  keywords?: string[];
  /** When set, the calculator page renders a dedicated interactive keypad widget
   *  instead of the generic field-based CalculatorShell. `fields`/`calculate` are
   *  still kept as a valid fallback definition (search, SEO, non-JS degradation). */
  widget?: "keypad-basic" | "keypad-scientific" | "abacus" | "darts-scorer";
  /** Which country's rules this calculator assumes. Omitted = jurisdiction-agnostic (pure math,
   *  unit conversion, etc). Existing US-specific financial/tax calculators predate this field
   *  and aren't all retroactively tagged yet — absence doesn't guarantee jurisdiction-agnostic. */
  jurisdiction?: "US" | "UK" | "IE" | "Global";
  /** For calculators whose constants are law-driven and change on a schedule (tax bands, NI
   *  thresholds, statutory caps) — shown as a "rates current as of" banner on the page. */
  ratesAsOf?: string;
  /** The on-page SEO content below the calculator itself — an explanation, the method
   *  in plain English, and an FAQ written around real long-tail search questions
   *  ("how do I...", "what is a good...", "is X accurate"), the same shape
   *  calculator.net-style pages use and that ranks for informational queries the tool
   *  itself never catches. Written per-calculator, not templated — duplicate
   *  boilerplate across 200+ pages is a real SEO liability, not just an aesthetic one. */
  content?: CalculatorContent;
}

export interface FaqItem {
  /** A real search-style question — "how do I calculate…", "what is a good…", "is …
   *  accurate" — not a generic marketing question. */
  q: string;
  a: string;
}

export interface CalculatorContent {
  /** 2-4 paragraphs: what this actually calculates, who uses it and why, framed around
   *  this calculator's specific subject — not a reusable template. */
  intro: string[];
  /** Plain-English walkthrough of the method/formula, expanding on formulaSummary —
   *  omit if the primary result card's own "show your work" already covers it well
   *  enough that repeating it here would just be filler. */
  howItWorks?: string[];
  /** Long-tail, question-phrased entries — the actual searches people type, tagged
   *  toward "ready to calculate" intent since that's what this page is for. */
  faq: FaqItem[];
}
