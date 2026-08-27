import type { CalculatorContent } from "@/lib/calculators/types";

/** The on-page SEO content below a calculator — an explanation, the method in plain
 *  English, and an FAQ, the same shape calculator.net-style pages use. The FAQ also
 *  gets real FAQPage structured data, so it's not just readable copy — it's eligible
 *  for Google's FAQ rich-result treatment the way a plain paragraph never is. Renders
 *  nothing (not even an empty section) when a calculator has no content yet, so this
 *  is always safe to drop into a page unconditionally. */
export default function CalculatorContentSection({ content, title }: { content?: CalculatorContent; title: string }) {
  if (!content) return null;

  const faqJsonLd =
    content.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: content.faq.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }
      : null;

  return (
    <div className="mt-12 flex flex-col gap-8">
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}

      {(content.intro.length > 0 || content.howItWorks) && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">About the {title}</h2>
          <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            {content.intro.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {content.howItWorks && content.howItWorks.length > 0 && (
            <>
              <h3 className="mt-6 text-sm font-semibold text-zinc-800 dark:text-zinc-200">How it&rsquo;s calculated</h3>
              <div className="mt-2 flex flex-col gap-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {content.howItWorks.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {content.faq.length > 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Frequently asked questions</h2>
          <div className="mt-3 flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
            {content.faq.map((f, i) => (
              <details key={i} className="group py-3 first:pt-0 last:pb-0">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-zinc-800 marker:content-none [&::-webkit-details-marker]:hidden dark:text-zinc-200">
                  {f.q}
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-180"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
