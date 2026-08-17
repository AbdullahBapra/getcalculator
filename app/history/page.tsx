import type { Metadata } from "next";
import HistoryDashboard from "@/components/history/HistoryDashboard";

export const metadata: Metadata = {
  title: "Your Calculation History",
  description: "Every calculation you've saved across every calculator on this site, in one place — stored only on your device, no login required.",
  robots: { index: false, follow: true },
};

export default function HistoryPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Your History</h1>
      <p className="mt-2 max-w-2xl text-zinc-600 dark:text-zinc-400">
        Every calculation you&rsquo;ve saved, across every calculator on the site, in one place. No account, no login — it&rsquo;s just stored in
        this browser.
      </p>
      <div className="mt-8">
        <HistoryDashboard />
      </div>
    </div>
  );
}
