import Link from "next/link";
import { ALL_CALCULATORS, POPULAR_SLUGS, getCalculator } from "@/lib/calculators/registry";
import Logo from "@/components/theme/Logo";

export default function Footer() {
  const quickLinks = POPULAR_SLUGS.map((s) => getCalculator(s)).filter((c) => !!c);

  return (
    <footer className="border-t border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="logo-mark flex items-center gap-2 font-[family-name:var(--font-logo)] text-lg font-bold tracking-tight text-zinc-900 dark:text-zinc-50"
          >
            <Logo size={28} />
            GetCalculator
          </Link>
          <p className="mt-3 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            {ALL_CALCULATORS.length}+ free calculators, one clean home. No signup, no ads — every result runs entirely in your browser.
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Calculators</h3>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            {quickLinks.map((c) => (
              <Link key={c.slug} href={`/${c.category}/${c.slug}`} className="text-zinc-600 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
                {c.title}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Site</h3>
          <div className="mt-4 flex flex-col gap-2.5 text-sm">
            <Link href="/" className="text-zinc-600 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Home
            </Link>
            <Link href="/convert" className="text-zinc-600 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Unit converters
            </Link>
            <Link href="/history" className="text-zinc-600 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Your calculation history
            </Link>
            <Link href="/embed-calculators" className="text-zinc-600 transition hover:text-teal-600 dark:text-zinc-400 dark:hover:text-teal-400">
              Embed a calculator — free
            </Link>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 pb-10">
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-6 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} GetCalculator. Runs entirely in your browser — no accounts, no email, nothing sent to a server.</p>
        </div>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">Results are estimates for informational purposes, not professional advice.</p>
      </div>
    </footer>
  );
}
