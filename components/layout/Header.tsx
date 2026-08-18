import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";
import Logo from "@/components/theme/Logo";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="logo-mark flex items-center gap-2 font-[family-name:var(--font-logo)] text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          <Logo size={32} />
          GetCalculator
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/embed-calculators"
            className="flex h-11 items-center rounded-full border border-teal-200 px-4 text-sm font-medium text-teal-700 transition hover:border-teal-300 hover:bg-teal-50 dark:border-teal-900 dark:text-teal-400 dark:hover:bg-teal-950/40"
          >
            Embed
          </Link>
          {/* Hidden below sm — the mobile tab bar's own History tab already covers
             this, and showing both is exactly the kind of duplicated nav a real app
             wouldn't have. */}
          <Link
            href="/history"
            title="Your saved calculation history"
            className="hidden h-11 shrink-0 items-center gap-1.5 rounded-full border border-zinc-300 px-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-100 sm:flex dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
            <span className="hidden sm:inline">History</span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
