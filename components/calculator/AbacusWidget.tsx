"use client";

import { useState } from "react";
import { useFullscreen } from "./useFullscreen";
import FullscreenButton from "./FullscreenButton";

const PLACE_NAMES = ["Ones", "Tens", "Hundreds", "Thousands", "Ten-Th.", "Hundred-Th.", "Millions"];
const COLUMNS = PLACE_NAMES.length;
const BEADS_PER_ROD = 9;

function digitsToNumber(digits: number[]): number {
  return digits.reduce((total, d, idx) => total + d * Math.pow(10, idx), 0);
}
function numberToDigits(value: number): number[] {
  const clamped = Math.max(0, Math.min(Math.pow(10, COLUMNS) - 1, Math.floor(value)));
  const digits: number[] = [];
  let remaining = clamped;
  for (let i = 0; i < COLUMNS; i++) {
    digits.push(remaining % 10);
    remaining = Math.floor(remaining / 10);
  }
  return digits;
}

export default function AbacusWidget() {
  const { ref, isFullscreen, supported, toggle } = useFullscreen<HTMLDivElement>();
  const [digits, setDigits] = useState<number[]>(numberToDigits(4527));

  function clickBead(col: number, beadIndex: number) {
    setDigits((prev) => {
      const next = [...prev];
      const clickedValue = beadIndex + 1;
      next[col] = prev[col] === clickedValue ? beadIndex : clickedValue;
      return next;
    });
  }
  function clear() {
    setDigits(new Array(COLUMNS).fill(0));
  }
  function setFromInput(raw: string) {
    const v = Number(raw);
    if (Number.isFinite(v) && v >= 0) setDigits(numberToDigits(v));
  }

  const total = digitsToNumber(digits);

  return (
    <div ref={ref} className={isFullscreen ? "flex h-full w-full items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950" : ""}>
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">Current Number</div>
          <div className="font-mono text-3xl font-bold text-teal-700 dark:text-teal-400">{total.toLocaleString("en-US")}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            defaultValue={total}
            onChange={(e) => setFromInput(e.target.value)}
            className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            aria-label="Set number"
          />
          <button
            onClick={clear}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Clear
          </button>
          {supported && <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />}
        </div>
      </div>

      <div className="flex justify-center gap-2 overflow-x-auto rounded-xl bg-gradient-to-b from-amber-50 to-amber-100 p-4 dark:from-zinc-800 dark:to-zinc-900 sm:gap-4 sm:p-6">
        {Array.from({ length: COLUMNS })
          .map((_, i) => COLUMNS - 1 - i)
          .map((col) => (
            <div key={col} className="flex flex-col items-center gap-1">
              <div className="flex flex-col-reverse gap-1 rounded bg-amber-800/10 p-1 dark:bg-black/30">
                {Array.from({ length: BEADS_PER_ROD }).map((_, beadIndex) => {
                  const active = beadIndex < digits[col];
                  return (
                    <button
                      key={beadIndex}
                      onClick={() => clickBead(col, beadIndex)}
                      aria-label={`Set ${PLACE_NAMES[col]} to ${beadIndex + 1}`}
                      className={`h-4 w-6 rounded-full border transition sm:h-5 sm:w-8 ${
                        active
                          ? "border-teal-700 bg-teal-500 shadow-sm"
                          : "border-zinc-300 bg-zinc-200 hover:bg-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                      }`}
                    />
                  );
                })}
              </div>
              <div className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{digits[col]}</div>
              <div className="text-[10px] uppercase tracking-wide text-zinc-500 dark:text-zinc-500">{PLACE_NAMES[col]}</div>
            </div>
          ))}
      </div>
      <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Click a bead to slide the column up to that count — click the top active bead again to slide it back down.
      </p>
      </div>
    </div>
  );
}
