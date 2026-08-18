import Link from "next/link";

interface Props {
  href: string;
  title: string;
  description: string;
  /** The live example result (e.g. "$2,022.62") — rendered as a torn receipt-tape
   *  strip at the card's foot, the same "=" language as the actual result screen, so
   *  browsing a category already previews what answering feels like. */
  preview?: string | null;
  /** Heading level for the card title, to keep each page's heading hierarchy correct —
   *  a category page's own <h1> makes its cards <h2>; the homepage's "Popular
   *  calculators" <h2> makes its cards <h3>. Defaults to <h3>. */
  headingLevel?: "h2" | "h3";
}

/** A calculator listing card — one consistent teal brand accent, not a rainbow, but
 *  built around a single real idea instead of the generic "icon + title + gray pill"
 *  card every SaaS grid on the internet uses: the preview strip is a genuinely torn
 *  paper-tape edge (a calculator's receipt tape, via a zigzag CSS mask — see
 *  .calc-card-tape in globals.css), not a dashed line pretending to be one. The corner
 *  watermark is the same ascending-bars mark as the site logo and grows in on hover,
 *  the title uses the logo's own typeface, and the "=" badge pops on hover — small,
 *  cheap signature moves instead of a pile of unrelated decoration. */
export default function CalculatorCard({ href, title, description, preview, headingLevel = "h3" }: Props) {
  const Heading = headingLevel;

  return (
    <Link
      href={href}
      className="group calc-card relative flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-teal-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-teal-800"
    >
      <span className="absolute inset-x-0 top-0 h-1 origin-left scale-x-50 bg-teal-500 transition-transform duration-300 group-hover:scale-x-100" />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-base font-bold text-teal-700 dark:bg-teal-950/50 dark:text-teal-400">
            {title[0]}
          </span>
          <svg width="20" height="16" viewBox="0 0 20 16" aria-hidden="true" className="calc-card-bars mt-1.5 text-zinc-300 transition-colors group-hover:text-teal-500 dark:text-zinc-700">
            <rect className="calc-card-bar-1" x="0" y="9" width="4" height="7" rx="1.5" fill="currentColor" />
            <rect className="calc-card-bar-2" x="8" y="5" width="4" height="11" rx="1.5" fill="currentColor" />
            <rect className="calc-card-bar-3" x="16" y="0" width="4" height="16" rx="1.5" fill="currentColor" />
          </svg>
        </div>
        <Heading className="mt-3 font-[family-name:var(--font-logo)] font-medium text-zinc-900 dark:text-zinc-100">{title}</Heading>
        <p className="mt-1 flex-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
        {preview && (
          <div className="calc-card-tape relative -mx-5 -mb-5 mt-5 flex items-center gap-2 bg-zinc-50 px-5 pt-4 pb-4 dark:bg-zinc-800/60">
            <span className="calc-card-eq flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white font-mono text-[10px] font-bold text-zinc-500 shadow-sm transition group-hover:text-teal-600 dark:bg-zinc-900 dark:text-zinc-400 dark:group-hover:text-teal-400">
              =
            </span>
            <span className="truncate font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200">{preview}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
