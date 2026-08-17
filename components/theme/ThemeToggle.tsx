"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Read the class the no-flash inline script (in layout.tsx) already applied —
    // intentionally deferred to after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function setMode(next: boolean) {
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      window.localStorage.setItem("gc:theme", next ? "dark" : "light");
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex h-11 items-center gap-0.5 rounded-full border border-zinc-300 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-800">
      <button
        type="button"
        onClick={() => setMode(false)}
        aria-label="Switch to light mode"
        aria-pressed={!isDark}
        className={`flex h-full items-center rounded-full px-3 text-xs font-semibold transition ${
          !isDark ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => setMode(true)}
        aria-label="Switch to dark mode"
        aria-pressed={isDark}
        className={`flex h-full items-center rounded-full px-3 text-xs font-semibold transition ${
          isDark ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50" : "text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </button>
    </div>
  );
}
