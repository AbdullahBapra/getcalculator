// Generic unit-conversion engine.
//
// This is the piece that replaces online-calculator.com's ~200 hand-authored
// "X to Y" pages: one conversion table + two small functions here, plus one
// route template (app/convert/[category]/[pair]/page.tsx), generates every
// pairwise conversion page via generateStaticParams. Add a unit to a category
// below and every new pair page (both directions) exists automatically.

export type UnitCategoryKey =
  | "length"
  | "weight"
  | "temperature"
  | "time"
  | "speed"
  | "volume";

export interface UnitDef {
  id: string;
  label: string;
  abbr: string;
  /** convert a value in this unit to the category's base unit */
  toBase: (v: number) => number;
  /** convert a value in the category's base unit to this unit */
  fromBase: (v: number) => number;
}

export interface UnitCategoryDef {
  key: UnitCategoryKey;
  title: string;
  baseLabel: string;
  units: UnitDef[];
}

function linear(factor: number): Pick<UnitDef, "toBase" | "fromBase"> {
  // value in this unit * factor = value in base unit
  return {
    toBase: (v) => v * factor,
    fromBase: (v) => v / factor,
  };
}

export const UNIT_CATEGORIES: UnitCategoryDef[] = [
  {
    key: "length",
    title: "Length",
    baseLabel: "meters",
    units: [
      { id: "millimeters", label: "Millimeters", abbr: "mm", ...linear(0.001) },
      { id: "centimeters", label: "Centimeters", abbr: "cm", ...linear(0.01) },
      { id: "meters", label: "Meters", abbr: "m", ...linear(1) },
      { id: "kilometers", label: "Kilometers", abbr: "km", ...linear(1000) },
      { id: "inches", label: "Inches", abbr: "in", ...linear(0.0254) },
      { id: "feet", label: "Feet", abbr: "ft", ...linear(0.3048) },
      { id: "yards", label: "Yards", abbr: "yd", ...linear(0.9144) },
      { id: "miles", label: "Miles", abbr: "mi", ...linear(1609.344) },
      { id: "nautical-miles", label: "Nautical Miles", abbr: "nmi", ...linear(1852) },
    ],
  },
  {
    key: "weight",
    title: "Weight",
    baseLabel: "kilograms",
    units: [
      { id: "milligrams", label: "Milligrams", abbr: "mg", ...linear(0.000001) },
      { id: "grams", label: "Grams", abbr: "g", ...linear(0.001) },
      { id: "kilograms", label: "Kilograms", abbr: "kg", ...linear(1) },
      { id: "metric-tons", label: "Metric Tons", abbr: "t", ...linear(1000) },
      { id: "ounces", label: "Ounces", abbr: "oz", ...linear(0.028349523125) },
      { id: "pounds", label: "Pounds", abbr: "lb", ...linear(0.45359237) },
      { id: "stones", label: "Stones", abbr: "st", ...linear(6.35029318) },
    ],
  },
  {
    key: "temperature",
    title: "Temperature",
    baseLabel: "celsius",
    units: [
      {
        id: "celsius",
        label: "Celsius",
        abbr: "°C",
        toBase: (v) => v,
        fromBase: (v) => v,
      },
      {
        id: "fahrenheit",
        label: "Fahrenheit",
        abbr: "°F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (v) => (v * 9) / 5 + 32,
      },
      {
        id: "kelvin",
        label: "Kelvin",
        abbr: "K",
        toBase: (v) => v - 273.15,
        fromBase: (v) => v + 273.15,
      },
    ],
  },
  {
    key: "time",
    title: "Time",
    baseLabel: "seconds",
    units: [
      { id: "seconds", label: "Seconds", abbr: "sec", ...linear(1) },
      { id: "minutes", label: "Minutes", abbr: "min", ...linear(60) },
      { id: "hours", label: "Hours", abbr: "hr", ...linear(3600) },
      { id: "days", label: "Days", abbr: "day", ...linear(86400) },
      { id: "weeks", label: "Weeks", abbr: "wk", ...linear(604800) },
    ],
  },
  {
    key: "speed",
    title: "Speed",
    baseLabel: "meters per second",
    units: [
      { id: "mps", label: "Meters/Second", abbr: "m/s", ...linear(1) },
      { id: "kph", label: "Kilometers/Hour", abbr: "km/h", ...linear(1000 / 3600) },
      { id: "mph", label: "Miles/Hour", abbr: "mph", ...linear(1609.344 / 3600) },
      { id: "knots", label: "Knots", abbr: "kn", ...linear(1852 / 3600) },
    ],
  },
  {
    key: "volume",
    title: "Volume",
    baseLabel: "liters",
    units: [
      { id: "milliliters", label: "Milliliters", abbr: "mL", ...linear(0.001) },
      { id: "liters", label: "Liters", abbr: "L", ...linear(1) },
      { id: "cubic-meters", label: "Cubic Meters", abbr: "m³", ...linear(1000) },
      { id: "us-cups", label: "US Cups", abbr: "cup", ...linear(0.2365882365) },
      { id: "us-pints", label: "US Pints", abbr: "pt", ...linear(0.473176473) },
      { id: "us-quarts", label: "US Quarts", abbr: "qt", ...linear(0.946352946) },
      { id: "us-gallons", label: "US Gallons", abbr: "gal", ...linear(3.785411784) },
      { id: "fluid-ounces", label: "US Fluid Ounces", abbr: "fl oz", ...linear(0.0295735295625) },
    ],
  },
];

export function getUnitCategory(key: string): UnitCategoryDef | undefined {
  return UNIT_CATEGORIES.find((c) => c.key === key);
}

export function getUnit(category: UnitCategoryDef, id: string): UnitDef | undefined {
  return category.units.find((u) => u.id === id);
}

export function convert(category: UnitCategoryDef, fromId: string, toId: string, value: number): number {
  const from = getUnit(category, fromId);
  const to = getUnit(category, toId);
  if (!from || !to || !Number.isFinite(value)) return NaN;
  return to.fromBase(from.toBase(value));
}

export interface UnitPair {
  category: UnitCategoryKey;
  from: string;
  to: string;
  slug: string; // e.g. "feet-to-meters"
}

/** Every ordered (from, to) pair across all categories — drives generateStaticParams
 *  for the static "X to Y" SEO landing pages. */
export function allUnitPairs(): UnitPair[] {
  const pairs: UnitPair[] = [];
  for (const cat of UNIT_CATEGORIES) {
    for (const from of cat.units) {
      for (const to of cat.units) {
        if (from.id === to.id) continue;
        pairs.push({
          category: cat.key,
          from: from.id,
          to: to.id,
          slug: `${from.id}-to-${to.id}`,
        });
      }
    }
  }
  return pairs;
}

export function findPair(category: UnitCategoryDef, slug: string): UnitPair | undefined {
  const ids = category.units.map((u) => u.id);
  // ids can contain hyphens themselves (e.g. "nautical-miles"), so match against
  // known unit ids rather than naively splitting on "-to-".
  for (const from of ids) {
    const prefix = `${from}-to-`;
    if (slug.startsWith(prefix)) {
      const to = slug.slice(prefix.length);
      if (ids.includes(to) && to !== from) {
        return { category: category.key, from, to, slug };
      }
    }
  }
  return undefined;
}
