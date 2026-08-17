// Shared fields/helpers used across every health & fitness calculator.
import type { FieldDef } from "./types";
import { n } from "../format";

export const unitFields: FieldDef[] = [
  {
    name: "units",
    label: "Units",
    type: "select",
    defaultValue: "imperial",
    options: [
      { value: "imperial", label: "Imperial (ft/in, lb)" },
      { value: "metric", label: "Metric (cm, kg)" },
    ],
  },
  { name: "heightFt", label: "Height", type: "number", unit: "ft", defaultValue: 5, min: 0, showIf: (i) => i.units !== "metric" },
  { name: "heightIn", label: "", type: "number", unit: "in", defaultValue: 9, min: 0, max: 11, showIf: (i) => i.units !== "metric" },
  { name: "heightCm", label: "Height", type: "number", unit: "cm", defaultValue: 175, min: 0, showIf: (i) => i.units === "metric" },
  { name: "weightLb", label: "Weight", type: "number", unit: "lb", defaultValue: 160, min: 0, showIf: (i) => i.units !== "metric" },
  { name: "weightKg", label: "Weight", type: "number", unit: "kg", defaultValue: 73, min: 0, showIf: (i) => i.units === "metric" },
];

export function heightCm(i: Record<string, string>): number {
  if (i.units === "metric") return n(i.heightCm, 175);
  return n(i.heightFt, 5) * 30.48 + n(i.heightIn, 9) * 2.54;
}
export function weightKg(i: Record<string, string>): number {
  if (i.units === "metric") return n(i.weightKg, 73);
  return n(i.weightLb, 160) * 0.45359237;
}
export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}

export const sexField: FieldDef = {
  name: "sex",
  label: "Sex",
  type: "select",
  defaultValue: "male",
  options: [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
  ],
};

export function bmrMifflin(kg: number, cm: number, age: number, sex: string): number {
  const base = 10 * kg + 6.25 * cm - 5 * age;
  return sex === "female" ? base - 161 : base + 5;
}

export const ACTIVITY: Record<string, { label: string; factor: number }> = {
  sedentary: { label: "Sedentary (little/no exercise)", factor: 1.2 },
  light: { label: "Light (1-3 days/week)", factor: 1.375 },
  moderate: { label: "Moderate (3-5 days/week)", factor: 1.55 },
  active: { label: "Active (6-7 days/week)", factor: 1.725 },
  veryActive: { label: "Very active (hard exercise + physical job)", factor: 1.9 },
};
