"use client";

import { useCallback, useEffect, useState } from "react";
import { useFullscreen } from "./useFullscreen";
import FullscreenButton from "./FullscreenButton";

type Op = "+" | "-" | "*" | "/";

function apply(a: number, b: number, op: Op): number {
  switch (op) {
    case "+": return a + b;
    case "-": return a - b;
    case "*": return a * b;
    case "/": return b === 0 ? NaN : a / b;
  }
}

function formatDisplay(value: number): string {
  if (!Number.isFinite(value)) return "Error";
  if (Math.abs(value) > 0 && (Math.abs(value) >= 1e15 || Math.abs(value) < 1e-9)) return value.toExponential(6);
  const rounded = parseFloat(value.toPrecision(12));
  return rounded.toString();
}

const opSymbol: Record<Op, string> = { "+": "+", "-": "−", "*": "×", "/": "÷" };

export default function SimpleCalculatorKeypad() {
  const { ref, isFullscreen, supported, toggle } = useFullscreen<HTMLDivElement>();
  const [display, setDisplay] = useState("0");
  const [accumulator, setAccumulator] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op | null>(null);
  const [overwrite, setOverwrite] = useState(true);
  const [memory, setMemory] = useState(0);

  const currentValue = () => parseFloat(display) || 0;

  const inputDigit = useCallback((d: string) => {
    setDisplay((prev) => {
      if (overwrite) return d === "." ? "0." : d;
      if (d === "." && prev.includes(".")) return prev;
      if (prev.replace("-", "").replace(".", "").length >= 15) return prev;
      return prev === "0" && d !== "." ? d : prev + d;
    });
    setOverwrite(false);
  }, [overwrite]);

  const inputOperator = useCallback((op: Op) => {
    const curr = currentValue();
    if (pendingOp && !overwrite && accumulator !== null) {
      const result = apply(accumulator, curr, pendingOp);
      setDisplay(formatDisplay(result));
      setAccumulator(result);
    } else {
      setAccumulator(curr);
    }
    setPendingOp(op);
    setOverwrite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOp, overwrite, accumulator, display]);

  const equals = useCallback(() => {
    if (pendingOp === null || accumulator === null) return;
    const result = apply(accumulator, currentValue(), pendingOp);
    setDisplay(formatDisplay(result));
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOp, accumulator, display]);

  const clearAll = useCallback(() => {
    setDisplay("0");
    setAccumulator(null);
    setPendingOp(null);
    setOverwrite(true);
  }, []);

  const backspace = useCallback(() => {
    setDisplay((prev) => {
      if (overwrite) return prev;
      return prev.length > 1 ? prev.slice(0, -1) : "0";
    });
  }, [overwrite]);

  const toggleSign = useCallback(() => {
    setDisplay((prev) => (prev.startsWith("-") ? prev.slice(1) : prev === "0" ? prev : `-${prev}`));
  }, []);

  const percent = useCallback(() => {
    setDisplay(formatDisplay(currentValue() / 100));
    setOverwrite(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [display]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) inputDigit(e.key);
      else if (e.key === ".") inputDigit(".");
      else if (e.key === "+") inputOperator("+");
      else if (e.key === "-") inputOperator("-");
      else if (e.key === "*") inputOperator("*");
      else if (e.key === "/") { e.preventDefault(); inputOperator("/"); }
      else if (e.key === "Enter" || e.key === "=") { e.preventDefault(); equals(); }
      else if (e.key === "Escape") clearAll();
      else if (e.key === "Backspace") backspace();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inputDigit, inputOperator, equals, clearAll, backspace]);

  const btn = "h-14 rounded-xl text-lg font-semibold transition active:scale-95";
  const numBtn = `${btn} bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700`;
  const opBtn = `${btn} bg-teal-600 text-white hover:bg-teal-500`;
  const funcBtn = `${btn} bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600`;
  const memBtn = `${btn} bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60 text-sm`;

  return (
    <div
      ref={ref}
      className={isFullscreen ? "flex h-full w-full items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950" : ""}
    >
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      {supported && (
        <div className="mb-2 flex justify-end">
          <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />
        </div>
      )}
      <div className="mb-3 rounded-xl bg-zinc-900 px-4 py-4 text-right dark:bg-black">
        <div className="h-4 text-xs text-teal-400">
          {memory !== 0 ? "M " : ""}
          {pendingOp ? `${formatDisplay(accumulator ?? 0)} ${opSymbol[pendingOp]}` : ""}
        </div>
        <div className="overflow-x-auto whitespace-nowrap text-3xl font-mono text-white">{display}</div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button className={memBtn} onClick={() => setMemory(0)}>MC</button>
        <button className={memBtn} onClick={() => setMemory((m) => m + currentValue())}>M+</button>
        <button className={memBtn} onClick={() => setMemory((m) => m - currentValue())}>M−</button>
        <button className={memBtn} onClick={() => { setDisplay(formatDisplay(memory)); setOverwrite(true); }}>MR</button>

        <button className={funcBtn} onClick={clearAll}>C</button>
        <button className={funcBtn} onClick={backspace}>⌫</button>
        <button className={funcBtn} onClick={percent}>%</button>
        <button className={opBtn} onClick={() => inputOperator("/")}>÷</button>

        <button className={numBtn} onClick={() => inputDigit("7")}>7</button>
        <button className={numBtn} onClick={() => inputDigit("8")}>8</button>
        <button className={numBtn} onClick={() => inputDigit("9")}>9</button>
        <button className={opBtn} onClick={() => inputOperator("*")}>×</button>

        <button className={numBtn} onClick={() => inputDigit("4")}>4</button>
        <button className={numBtn} onClick={() => inputDigit("5")}>5</button>
        <button className={numBtn} onClick={() => inputDigit("6")}>6</button>
        <button className={opBtn} onClick={() => inputOperator("-")}>−</button>

        <button className={numBtn} onClick={() => inputDigit("1")}>1</button>
        <button className={numBtn} onClick={() => inputDigit("2")}>2</button>
        <button className={numBtn} onClick={() => inputDigit("3")}>3</button>
        <button className={opBtn} onClick={() => inputOperator("+")}>+</button>

        <button className={numBtn} onClick={toggleSign}>±</button>
        <button className={numBtn} onClick={() => inputDigit("0")}>0</button>
        <button className={numBtn} onClick={() => inputDigit(".")}>.</button>
        <button className={`${btn} bg-teal-700 text-white hover:bg-teal-600`} onClick={equals}>=</button>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-600">Keyboard supported: digits, + − × ÷, Enter, Backspace, Esc</p>
      </div>
    </div>
  );
}
