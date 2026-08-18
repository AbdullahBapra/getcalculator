"use client";

import { useCallback, useState } from "react";
import { evaluateExpression } from "@/lib/calculators/expr-evaluator";
import { fmtNumber } from "@/lib/format";
import { useFullscreen } from "./useFullscreen";
import FullscreenButton from "./FullscreenButton";

function tryEvaluate(expr: string, degrees: boolean): number | null {
  try {
    const v = evaluateExpression(expr, degrees);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

function appendToken(ctx: { expr: string; setExpr: (v: string) => void; justEvaluated: boolean; setJustEvaluated: (v: boolean) => void }, token: string, resetOnFreshStart = false) {
  const base = ctx.justEvaluated && resetOnFreshStart ? "" : ctx.expr === "0" ? "" : ctx.expr;
  ctx.setExpr(base + token);
  ctx.setJustEvaluated(false);
}

export default function ScientificCalculatorKeypad() {
  const { ref, isFullscreen, supported, toggle } = useFullscreen<HTMLDivElement>();
  const [expr, setExpr] = useState("0");
  const [degrees, setDegrees] = useState(true);
  const [shift, setShift] = useState(false);
  const [memory, setMemory] = useState(0);
  const [lastAnswer, setLastAnswer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [justEvaluated, setJustEvaluated] = useState(false);

  const preview = error === null ? tryEvaluate(expr, degrees) : null;

  const evaluate = useCallback(() => {
    try {
      const v = evaluateExpression(expr, degrees);
      if (!Number.isFinite(v)) {
        setError("Not a finite number");
        return;
      }
      setLastAnswer(v);
      setExpr(fmtNumber(v, 10));
      setJustEvaluated(true);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't evaluate that expression");
    }
  }, [expr, degrees]);

  function digit(d: string) {
    setError(null);
    if (justEvaluated) {
      setExpr(d === "." ? "0." : d);
      setJustEvaluated(false);
      return;
    }
    setExpr((prev) => (prev === "0" && d !== "." ? d : prev + d));
  }
  function operator(op: string) {
    setError(null);
    setExpr((prev) => (justEvaluated ? prev + op : (prev === "0" ? "0" : prev) + op));
    setJustEvaluated(false);
  }
  function func(name: string) {
    setError(null);
    setExpr((prev) => (justEvaluated ? "" : prev === "0" ? "" : prev) + `${name}(`);
    setJustEvaluated(false);
  }
  function transform(fn: (e: string) => string) {
    setError(null);
    setExpr((prev) => fn(prev === "0" ? "0" : prev));
    setJustEvaluated(false);
  }
  function clearAll() {
    setExpr("0");
    setError(null);
    setJustEvaluated(false);
  }

  const btn = "h-10 sm:h-11 rounded-lg text-[11px] sm:text-sm font-semibold transition active:scale-95 flex items-center justify-center";
  const numC = `${btn} bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700`;
  const opC = `${btn} bg-teal-600 text-white hover:bg-teal-500`;
  const fnC = `${btn} bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600`;
  const memC = `${btn} bg-amber-100 text-amber-900 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60`;

  const trigLabel = (base: string, inv: string) => (shift ? inv : base);
  const trigFn = (base: string, inv: string) => (shift ? inv : base);

  return (
    <div ref={ref} className={isFullscreen ? "flex h-full w-full items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950" : ""}>
      <div className="mx-auto w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      {supported && (
        <div className="mb-2 flex justify-end">
          <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />
        </div>
      )}
      <div className="mb-3 rounded-xl bg-zinc-900 px-4 py-3 text-right dark:bg-black">
        <div className="flex items-center justify-between text-xs text-teal-400">
          <span>
            {degrees ? "Deg" : "Rad"} {memory !== 0 ? "· M" : ""} {shift ? "· 2nd" : ""}
          </span>
          <button
            onClick={() => setExpr((p) => (p.length > 1 ? p.slice(0, -1) : "0"))}
            className="-m-3 rounded-lg p-3 text-base leading-none text-zinc-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Backspace"
          >
            ⌫
          </button>
        </div>
        <input
          value={expr}
          onChange={(e) => { setExpr(e.target.value || "0"); setJustEvaluated(false); setError(null); }}
          className="w-full overflow-x-auto bg-transparent text-right text-2xl font-mono text-white outline-none"
          spellCheck={false}
          aria-label="Expression"
        />
        <div className="h-4 text-xs text-zinc-500">{error ? error : preview !== null && String(preview) !== expr ? `= ${fmtNumber(preview, 8)}` : " "}</div>
      </div>

      {/* 8 columns at every width, not just sm+ — a real calculator's keypad is wide
         and squat (7 rows), not narrow and tall. Dropping to 4 columns on mobile used
         to turn this into 13 cramped rows, taller than the phone screen itself. */}
      <div className="grid grid-cols-8 gap-1 sm:gap-1.5">
        <button className={fnC} onClick={() => setDegrees((d) => !d)}>{degrees ? "Deg" : "Rad"}</button>
        <button className={numC} onClick={() => operator("(")}>(</button>
        <button className={numC} onClick={() => operator(")")}>)</button>
        <button className={fnC} onClick={() => transform((e) => `(${e})%`)}>%</button>
        <button className={memC} onClick={() => setMemory(0)}>MC</button>
        <button className={memC} onClick={() => { const v = tryEvaluate(expr, degrees); if (v !== null) setMemory(memory + v); }}>M+</button>
        <button className={memC} onClick={() => { const v = tryEvaluate(expr, degrees); if (v !== null) setMemory(memory - v); }}>M−</button>
        <button className={memC} onClick={() => { setExpr(fmtNumber(memory, 10)); setJustEvaluated(true); }}>MR</button>

        <button className={fnC} onClick={() => transform((e) => `1/(${e})`)}>1/x</button>
        <button className={fnC} onClick={() => transform((e) => `(${e})^2`)}>x²</button>
        <button className={fnC} onClick={() => transform((e) => `(${e})^3`)}>x³</button>
        <button className={fnC} onClick={() => operator("^")}>yˣ</button>
        <button className={fnC} onClick={clearAll}>C</button>
        <button className={numC} onClick={() => transform((e) => (e.startsWith("-") ? e.slice(1) : `-${e}`))}>±</button>
        <button className={opC} onClick={() => operator("/")}>÷</button>
        <button className={opC} onClick={() => operator("*")}>×</button>

        <button className={fnC} onClick={() => transform((e) => `(${e})!`)}>x!</button>
        <button className={fnC} onClick={() => transform((e) => `sqrt(${e})`)}>√</button>
        <button className={fnC} onClick={() => transform((e) => `cbrt(${e})`)}>∛</button>
        <button className={fnC} onClick={() => func("log")}>log</button>
        <button className={numC} onClick={() => digit("7")}>7</button>
        <button className={numC} onClick={() => digit("8")}>8</button>
        <button className={numC} onClick={() => digit("9")}>9</button>
        <button className={opC} onClick={() => operator("-")}>−</button>

        <button className={fnC} onClick={() => func(trigFn("sin", "asin"))}>{trigLabel("sin", "sin⁻¹")}</button>
        <button className={fnC} onClick={() => func(trigFn("cos", "acos"))}>{trigLabel("cos", "cos⁻¹")}</button>
        <button className={fnC} onClick={() => func(trigFn("tan", "atan"))}>{trigLabel("tan", "tan⁻¹")}</button>
        <button className={fnC} onClick={() => func("ln")}>ln</button>
        <button className={numC} onClick={() => digit("4")}>4</button>
        <button className={numC} onClick={() => digit("5")}>5</button>
        <button className={numC} onClick={() => digit("6")}>6</button>
        <button className={opC} onClick={() => operator("+")}>+</button>

        <button className={fnC} onClick={() => func("sinh")}>sinh</button>
        <button className={fnC} onClick={() => func("cosh")}>cosh</button>
        <button className={fnC} onClick={() => func("tanh")}>tanh</button>
        <button className={fnC} onClick={() => func("exp")}>eˣ</button>
        <button className={numC} onClick={() => digit("1")}>1</button>
        <button className={numC} onClick={() => digit("2")}>2</button>
        <button className={numC} onClick={() => digit("3")}>3</button>
        <button className={`${btn} bg-teal-700 text-white hover:bg-teal-600`} onClick={evaluate}>=</button>

        <button className={shift ? `${fnC} bg-teal-200 dark:bg-teal-800` : fnC} onClick={() => setShift((s) => !s)}>1st</button>
        <button className={fnC} onClick={() => appendToken({ expr, setExpr, justEvaluated, setJustEvaluated }, "pi")}>π</button>
        <button className={fnC} onClick={() => operator("*10^")}>EE</button>
        <button className={fnC} onClick={() => appendToken({ expr, setExpr, justEvaluated, setJustEvaluated }, Math.random().toFixed(6))}>rnd</button>
        <button className={`${numC} col-span-2`} onClick={() => digit("0")}>0</button>
        <button className={numC} onClick={() => digit(".")}>.</button>
        <button className={fnC} onClick={() => appendToken({ expr, setExpr, justEvaluated, setJustEvaluated }, fmtNumber(lastAnswer, 10), true)}>Ans</button>
      </div>
      <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-600">Click buttons or type directly into the display — {"^"} for power, {"!"} for factorial, {"pi"}/{"e"} for constants.</p>
      </div>
    </div>
  );
}
