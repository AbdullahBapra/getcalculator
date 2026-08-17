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
}

export interface ResultLine {
  label: string;
  value: string;
  unit?: string;
  emphasis?: boolean;
}

export interface CalcOutput {
  results: ResultLine[];
  /** human-readable "show your work" breakdown, rendered as an ordered list */
  steps?: string[];
  /** short plain-text formula, e.g. "A = P(1 + r/n)^(nt)" */
  formula?: string;
  notes?: string[];
  error?: string;
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
}
