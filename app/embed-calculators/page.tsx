import type { Metadata } from "next";
import { ALL_CALCULATORS } from "@/lib/calculators/registry";
import EmbedCalculatorList from "@/components/calculator/EmbedCalculatorList";
import EmbedPicker from "@/components/calculator/EmbedPicker";

export const metadata: Metadata = {
  title: "Embed a Free Calculator Widget on Your Website",
  description:
    "Add any of our 205 free calculator widgets to your website in one line of HTML — no signup, no ads, no cost. Mortgage, BMI, tip, unit converters and more, all embeddable via iframe.",
  alternates: { canonical: "/embed-calculators" },
};

export default function EmbedCalculatorsPage() {
  const items = ALL_CALCULATORS.map((c) => ({
    slug: c.slug,
    title: c.title,
    category: c.category,
    shortDescription: c.shortDescription,
    widget: c.widget,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Embed a Calculator on Your Website — Free</h1>
      <p className="mt-3 max-w-3xl text-zinc-600 dark:text-zinc-400">
        Every one of our {ALL_CALCULATORS.length} calculators can be dropped straight onto your own site — a blog, a brokerage, an accountancy
        practice, anywhere — as a live, working widget. No signup, no API key, no ads, and it costs nothing. All we ask is the widget keeps its
        small &ldquo;Powered by GetCalculator.online&rdquo; link.
      </p>

      <div id="embed-tool" className="mt-8 scroll-mt-20">
        <EmbedPicker items={items} />
      </div>

      <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
        Calculator widget builders like Calconic, Outgrow and involve.me typically charge $5–19+/month with a capped number of monthly views once
        you outgrow the free tier. Ours has no impression cap, no tier, and no price — free, permanently, for every calculator on the site.
        Pick any calculator above, or browse the full list below.
      </p>

      <div className="mt-10">
        <EmbedCalculatorList items={items} />
      </div>
    </div>
  );
}
