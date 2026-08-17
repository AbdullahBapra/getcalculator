"use client";

import type { FieldDef } from "@/lib/calculators/types";

interface Props {
  field: FieldDef;
  value: string;
  onChange: (name: string, value: string) => void;
}

// text-base (16px), not text-sm — iOS Safari auto-zooms the page on focus for any input
// under 16px, which is a well-documented, jarring mobile UX bug. py-3 keeps the tap
// target close to the 44px touch-target guideline.
const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-3 text-base text-zinc-900 shadow-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";

export default function Field({ field, value, onChange }: Props) {
  const id = `field-${field.name}`;

  if (field.type === "select" || field.type === "radio") {
    const options = field.options ?? [];
    // A short list of options (2-3) reads as a mode switch — "Add tax" vs "Remove tax",
    // metric vs imperial — so it renders as a segmented pill-tab group instead of a
    // native <select>. A longer list (units, currencies, filing status, ...) stays a
    // dropdown, since a tab row of 8+ options would just be a worse select.
    if (options.length > 0 && options.length <= 3) {
      return (
        <div className="flex flex-col gap-1">
          {field.label && <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{field.label}</label>}
          <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChange(field.name, opt.value)}
                  aria-pressed={active}
                  className={`min-h-11 flex-1 rounded-lg px-2 text-xs font-semibold transition ${
                    active
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-zinc-600 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-700/60"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          {field.help && <p className="text-xs text-zinc-500 dark:text-zinc-400">{field.help}</p>}
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1">
        {field.label && (
          <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {field.label}
          </label>
        )}
        <select id={id} name={field.name} className={inputClass} value={value} onChange={(e) => onChange(field.name, e.target.value)}>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {field.help && <p className="text-xs text-zinc-500 dark:text-zinc-400">{field.help}</p>}
      </div>
    );
  }

  // A number field with both bounds declared reads as a range, not just a raw value —
  // pairing it with a slider (mirroring the same value/onChange) lets you drag toward a
  // ballpark instead of typing, while the number input still gives an exact value.
  const showSlider = field.type === "number" && field.min !== undefined && field.max !== undefined;

  return (
    <div className="flex flex-col gap-1">
      {field.label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          {field.label}
          {field.unit ? <span className="text-zinc-400 dark:text-zinc-500"> ({field.unit})</span> : null}
        </label>
      )}
      <input
        id={id}
        name={field.name}
        type={field.type === "date" ? "date" : field.type === "text" ? "text" : "number"}
        inputMode={field.type === "number" ? "decimal" : undefined}
        className={inputClass}
        value={value}
        min={field.min}
        max={field.max}
        step={field.step ?? (field.type === "number" ? "any" : undefined)}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.name, e.target.value)}
        autoComplete="off"
      />
      {showSlider && (
        <input
          type="range"
          min={field.min}
          max={field.max}
          step={field.step || (field.max! - field.min! > 100 ? 1 : 0.1)}
          value={value === "" ? field.min : value}
          onChange={(e) => onChange(field.name, e.target.value)}
          className="mt-1 h-1.5 w-full cursor-pointer accent-teal-600 dark:accent-teal-500"
          aria-label={`${field.label} slider`}
        />
      )}
      {field.help && <p className="text-xs text-zinc-500 dark:text-zinc-400">{field.help}</p>}
    </div>
  );
}
