"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CATEGORIES } from "@/lib/calculators/registry";

function TabIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

/** A fixed bottom tab bar shown only below the sm breakpoint — the single most
 *  recognizable "this is an app, not a shrunk website" signal on mobile. Search opens
 *  the same CommandPalette the rest of the site uses (via a plain window event, so
 *  CommandPalette stays a self-contained component with no new props to wire); theme
 *  switching stays a header-only action (ThemeToggle) rather than being duplicated
 *  here, so Categories gets the fourth slot instead — real navigation beats a redundant
 *  control. Categories opens a bottom sheet (the native-app pattern for "pick one of a
 *  few things without leaving the page") rather than a whole new route. */
export default function MobileTabBar() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isHome = pathname === "/";
  const isHistory = pathname === "/history";
  const isCategoryPage = CATEGORIES.some((c) => pathname === `/${c.key}`) || pathname === "/convert";

  return (
    <>
      {sheetOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:hidden" onClick={() => setSheetOpen(false)}>
          <div
            role="dialog"
            aria-label="Browse categories"
            className="w-full max-w-md rounded-t-3xl border-t border-zinc-200 bg-white pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" aria-hidden="true" />
            <div className="px-5 pt-4 pb-1 text-sm font-semibold text-zinc-800 dark:text-zinc-200">Browse categories</div>
            <ul className="flex flex-col px-2 pb-1">
              {CATEGORIES.map((c) => (
                <li key={c.key}>
                  <Link
                    href={`/${c.key}`}
                    onClick={() => setSheetOpen(false)}
                    className="flex min-h-14 items-center justify-between rounded-xl px-3 text-[15px] font-medium text-zinc-800 active:bg-zinc-100 dark:text-zinc-200 dark:active:bg-zinc-800"
                  >
                    {c.title}
                    <TabIcon>
                      <path d="m9 18 6-6-6-6" />
                    </TabIcon>
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/convert"
                  onClick={() => setSheetOpen(false)}
                  className="flex min-h-14 items-center justify-between rounded-xl px-3 text-[15px] font-medium text-zinc-800 active:bg-zinc-100 dark:text-zinc-200 dark:active:bg-zinc-800"
                >
                  Unit Converters
                  <TabIcon>
                    <path d="m9 18 6-6-6-6" />
                  </TabIcon>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      )}

      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-zinc-200 bg-white/95 backdrop-blur sm:hidden dark:border-zinc-800 dark:bg-zinc-950/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Mobile navigation"
      >
        <Link
          href="/"
          aria-current={isHome ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isHome ? "text-teal-600 dark:text-teal-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          <TabIcon>
            <path d="M3 10.5 12 3l9 7.5" />
            <path d="M5 9.5V21h14V9.5" />
          </TabIcon>
          Home
        </Link>
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          aria-current={isCategoryPage ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isCategoryPage ? "text-teal-600 dark:text-teal-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          <TabIcon>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
          </TabIcon>
          Categories
        </button>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("gc:open-search"))}
          className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
        >
          <TabIcon>
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </TabIcon>
          Search
        </button>
        <Link
          href="/history"
          aria-current={isHistory ? "page" : undefined}
          className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${isHistory ? "text-teal-600 dark:text-teal-400" : "text-zinc-500 dark:text-zinc-400"}`}
        >
          <TabIcon>
            <path d="M3.5 9a9 9 0 1 0 2-5" />
            <path d="M3 3v6h6" />
            <path d="M12 7v5l3 3" />
          </TabIcon>
          History
        </Link>
      </nav>
    </>
  );
}
