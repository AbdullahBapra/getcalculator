// Reusable builders for FieldDef.convertPair — a live, EDITABLE "other unit" twin next
// to a field. Someone who only knows their weight in kg doesn't have to do the math:
// they type into the kg box and the lb field (the one calculate() actually reads)
// fills itself in, and vice versa. Each function returns a convertPair object to hand
// straight to a FieldDef, so a calculator opts in with one line.
import type { FieldDef } from "./types";

const LB_PER_KG = 2.2046226218;
const CM_PER_IN = 2.54;

function parse(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const v = Number(raw);
  return Number.isFinite(v) ? v : null;
}

function fmt(n: number, digits: number): string {
  return (Math.round(n * Math.pow(10, digits)) / Math.pow(10, digits)).toString();
}

/** A field entered in lb — paired kg twin. */
export function lbKgPair(fieldName: string): FieldDef["convertPair"] {
  return {
    unit: "kg",
    toDisplay: (inputs) => {
      const lb = parse(inputs[fieldName]);
      return lb === null ? "" : fmt(lb / LB_PER_KG, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const kg = parse(displayValue);
      setField(fieldName, kg === null ? "" : fmt(kg * LB_PER_KG, 1));
    },
  };
}

/** A field entered in kg — paired lb twin. */
export function kgLbPair(fieldName: string): FieldDef["convertPair"] {
  return {
    unit: "lb",
    toDisplay: (inputs) => {
      const kg = parse(inputs[fieldName]);
      return kg === null ? "" : fmt(kg * LB_PER_KG, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const lb = parse(displayValue);
      setField(fieldName, lb === null ? "" : fmt(lb / LB_PER_KG, 1));
    },
  };
}

/** A field entered in inches — paired cm twin. */
export function inCmPair(fieldName: string): FieldDef["convertPair"] {
  return {
    unit: "cm",
    toDisplay: (inputs) => {
      const inches = parse(inputs[fieldName]);
      return inches === null ? "" : fmt(inches * CM_PER_IN, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const cm = parse(displayValue);
      setField(fieldName, cm === null ? "" : fmt(cm / CM_PER_IN, 1));
    },
  };
}

/** A field entered in cm — paired inches twin. */
export function cmInPair(fieldName: string): FieldDef["convertPair"] {
  return {
    unit: "in",
    toDisplay: (inputs) => {
      const cm = parse(inputs[fieldName]);
      return cm === null ? "" : fmt(cm / CM_PER_IN, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const inches = parse(displayValue);
      setField(fieldName, inches === null ? "" : fmt(inches * CM_PER_IN, 1));
    },
  };
}

/** A feet + inches PAIR of fields — put this on the inches field. The twin is a single
 *  editable cm box: typing a cm value writes BOTH the ft and in fields back out. */
export function ftInCmPair(ftFieldName: string, inFieldName: string): FieldDef["convertPair"] {
  return {
    unit: "cm",
    ariaLabel: "Height in cm",
    toDisplay: (inputs) => {
      const ft = parse(inputs[ftFieldName]);
      const inches = parse(inputs[inFieldName]);
      if (ft === null && inches === null) return "";
      const totalIn = (ft ?? 0) * 12 + (inches ?? 0);
      return fmt(totalIn * CM_PER_IN, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const cm = parse(displayValue);
      if (cm === null) {
        setField(ftFieldName, "");
        setField(inFieldName, "");
        return;
      }
      const totalIn = cm / CM_PER_IN;
      const ft = Math.floor(totalIn / 12);
      const inches = fmt(totalIn - ft * 12, 1);
      setField(ftFieldName, String(ft));
      setField(inFieldName, inches);
    },
  };
}

/** A field entered in °F — paired °C twin. */
export function fCPair(fieldName: string): FieldDef["convertPair"] {
  return {
    unit: "°C",
    toDisplay: (inputs) => {
      const f = parse(inputs[fieldName]);
      return f === null ? "" : fmt(((f - 32) * 5) / 9, 1);
    },
    onDisplayChange: (displayValue, _inputs, setField) => {
      const c = parse(displayValue);
      setField(fieldName, c === null ? "" : fmt((c * 9) / 5 + 32, 1));
    },
  };
}
