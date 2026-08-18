"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  value: string;
  className?: string;
}

// prefix = leading non-digit chars ("$", "€ ", ""), core = the number itself (commas/
// decimal allowed), suffix = trailing non-digit chars (" kg", "%", "/mo", ...).
const NUMBER_PATTERN = /^([^\d-]*)(-?[\d,]*\.?\d+)([^\d]*)$/;

function parseParts(str: string): { prefix: string; num: number; decimals: number; suffix: string } | null {
  const m = NUMBER_PATTERN.exec(str.trim());
  if (!m) return null;
  const [, prefix, core, suffix] = m;
  const num = Number(core.replace(/,/g, ""));
  if (!Number.isFinite(num)) return null;
  const decimalMatch = core.match(/\.(\d+)$/);
  return { prefix, num, decimals: decimalMatch ? decimalMatch[1].length : 0, suffix };
}

function formatCore(num: number, decimals: number): string {
  return num.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Rolls a result number from its old value to its new one instead of snapping —
 *  "$1,850.00" → "$2,022.62" counts up over ~450ms. Only animates when the string is a
 *  single recognizable number with a stable prefix/suffix; anything else — a compound
 *  string like "36 years, 7 months, 16 days", an error message, or the very first
 *  render — just displays the plain string. The animation is purely a bonus on top of
 *  an already-correct value; it can never cause a wrong number to be shown. */
export default function AnimatedNumber({ value, className }: Props) {
  const [displayValue, setDisplayValue] = useState(value);
  const currentNumRef = useRef<number | null>(null);
  const partsRef = useRef<{ prefix: string; suffix: string } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const target = parseParts(value);

    if (!target) {
      currentNumRef.current = null;
      partsRef.current = null;
      // Syncing local display state to an external prop that just became "not a clean
      // number" (compound string, error message, ...) — a legitimate external-sync
      // effect, not a derived-state anti-pattern.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDisplayValue(value);
      return;
    }

    const sameShape = partsRef.current?.prefix === target.prefix && partsRef.current?.suffix === target.suffix;
    partsRef.current = { prefix: target.prefix, suffix: target.suffix };

    if (!sameShape || currentNumRef.current === null) {
      // First render, or the units/format changed underneath us (e.g. currency symbol
      // swapped) — snap straight to the target rather than animating a meaningless jump.
      currentNumRef.current = target.num;
      setDisplayValue(value);
      return;
    }

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startNum = currentNumRef.current;
    const startTime = performance.now();
    const duration = 450;

    function tick(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const cur = startNum + (target!.num - startNum) * eased;
      currentNumRef.current = cur;
      setDisplayValue(`${target!.prefix}${formatCore(cur, target!.decimals)}${target!.suffix}`);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentNumRef.current = target!.num;
      }
    }
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value]);

  return <span className={className}>{displayValue}</span>;
}
