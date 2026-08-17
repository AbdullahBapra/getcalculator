"use client";

import { useState } from "react";
import { findCheckout } from "@/lib/calculators/darts-helpers";
import { useFullscreen } from "./useFullscreen";
import FullscreenButton from "./FullscreenButton";

interface Player {
  name: string;
  score: number;
  history: number[];
}

const QUICK_SCORES = [26, 41, 45, 60, 81, 100, 140, 180];

function newPlayers(count: number, startingScore: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({ name: `Player ${i + 1}`, score: startingScore, history: [] }));
}

export default function DartsScorerWidget() {
  const { ref, isFullscreen, supported, toggle } = useFullscreen<HTMLDivElement>();
  const [startingScore, setStartingScore] = useState(501);
  const [numPlayers, setNumPlayers] = useState(1);
  const [players, setPlayers] = useState<Player[]>(() => newPlayers(1, 501));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [turnInput, setTurnInput] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [winner, setWinner] = useState<string | null>(null);

  function startNewGame(score = startingScore, count = numPlayers) {
    setPlayers(newPlayers(count, score));
    setCurrentIdx(0);
    setTurnInput("");
    setMessage(null);
    setWinner(null);
  }

  function submitTurn(value: number) {
    if (winner) return;
    if (!Number.isFinite(value) || value < 0 || value > 180) {
      setMessage("Enter a score between 0 and 180.");
      return;
    }
    const player = players[currentIdx];
    const remaining = player.score - value;
    const next = [...players];
    if (remaining < 0 || remaining === 1) {
      next[currentIdx] = { ...player, history: [...player.history, 0] };
      setMessage(`Bust! ${player.name} stays on ${player.score}.`);
    } else if (remaining === 0) {
      next[currentIdx] = { ...player, score: 0, history: [...player.history, value] };
      setPlayers(next);
      setWinner(player.name);
      setTurnInput("");
      return;
    } else {
      next[currentIdx] = { ...player, score: remaining, history: [...player.history, value] };
      setMessage(null);
    }
    setPlayers(next);
    setTurnInput("");
    setCurrentIdx((idx) => (idx + 1) % players.length);
  }

  const current = players[currentIdx];
  const checkout = current && !winner ? findCheckout(current.score) : null;

  const btn = "h-11 rounded-lg text-base font-semibold transition active:scale-95 bg-zinc-100 text-zinc-900 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700";

  return (
    <div ref={ref} className={isFullscreen ? "flex h-full w-full items-center justify-center bg-zinc-100 p-6 dark:bg-zinc-950" : ""}>
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Game:{" "}
          <select
            value={startingScore}
            onChange={(e) => { const v = Number(e.target.value); setStartingScore(v); startNewGame(v, numPlayers); }}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value={301}>301</option>
            <option value={501}>501</option>
            <option value={701}>701</option>
          </select>
        </label>
        <label className="text-sm text-zinc-600 dark:text-zinc-400">
          Players:{" "}
          <select
            value={numPlayers}
            onChange={(e) => { const v = Number(e.target.value); setNumPlayers(v); startNewGame(startingScore, v); }}
            className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-base dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <button
          onClick={() => startNewGame()}
          className="ml-auto min-h-11 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          New Game
        </button>
        {supported && <FullscreenButton isFullscreen={isFullscreen} onClick={toggle} />}
      </div>

      <div className={`grid gap-3 ${players.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
        {players.map((p, idx) => (
          <div
            key={p.name}
            className={`rounded-xl border p-4 text-center ${
              idx === currentIdx && !winner ? "border-teal-500 bg-teal-50 dark:bg-teal-950/30" : "border-zinc-200 dark:border-zinc-800"
            }`}
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{p.name}{winner === p.name ? " 🏆" : ""}</div>
            <div className="font-mono text-4xl font-bold text-zinc-900 dark:text-zinc-50">{p.score}</div>
            <div className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">{p.history.length ? `Last: ${p.history[p.history.length - 1]}` : "—"}</div>
          </div>
        ))}
      </div>

      {winner ? (
        <p className="mt-4 rounded-lg bg-teal-50 px-4 py-3 text-center font-semibold text-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
          🎯 {winner} wins!
        </p>
      ) : (
        <>
          {checkout && (
            <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              Checkout for {current.score}: {checkout.map((d) => d.label).join(" → ")}
            </p>
          )}
          {message && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-center text-sm font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">{message}</p>}

          <div className="mt-4 flex flex-wrap gap-1.5">
            {QUICK_SCORES.map((s) => (
              <button
                key={s}
                onClick={() => submitTurn(s)}
                className="min-h-11 min-w-11 rounded-full border border-zinc-300 px-4 py-2 text-sm text-zinc-700 transition active:scale-95 hover:border-teal-400 hover:text-teal-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-teal-700 dark:hover:text-teal-400"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-4 py-2 text-right font-mono text-2xl text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
              {turnInput || "0"}
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {["7", "8", "9", "⌫", "4", "5", "6", "C", "1", "2", "3", "Enter", "0"].map((k, idx) => {
              if (k === "⌫") return <button key={idx} className={btn} onClick={() => setTurnInput((t) => t.slice(0, -1))}>⌫</button>;
              if (k === "C") return <button key={idx} className={btn} onClick={() => setTurnInput("")}>C</button>;
              if (k === "Enter")
                return (
                  <button key={idx} className={`${btn} col-span-1 bg-teal-600 text-white hover:bg-teal-500`} onClick={() => submitTurn(Number(turnInput || "0"))}>
                    Enter
                  </button>
                );
              return (
                <button
                  key={idx}
                  className={k === "0" ? `${btn} col-span-3` : btn}
                  onClick={() => setTurnInput((t) => (t.length < 3 ? t + k : t))}
                >
                  {k}
                </button>
              );
            })}
          </div>
        </>
      )}
      <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
        Enter each turn&apos;s 3-dart total (0–180). Reaching exactly 0 wins; going below 0 or to 1 is a bust and your turn is skipped.
      </p>
      </div>
    </div>
  );
}
