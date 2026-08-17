const JURISDICTION_LABEL: Record<string, string> = {
  UK: "🇬🇧 United Kingdom",
  IE: "🇮🇪 Ireland",
  US: "🇺🇸 United States",
  Global: "Global",
};

export default function RatesBanner({ jurisdiction, asOf }: { jurisdiction?: string; asOf?: string }) {
  if (!asOf) return null;
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300">
      <span className="font-medium">Rates current as of {asOf}.</span>
      {jurisdiction && <span className="text-amber-700/80 dark:text-amber-400/80">{JURISDICTION_LABEL[jurisdiction] ?? jurisdiction} rules.</span>}
      <span className="text-amber-700/80 dark:text-amber-400/80">Thresholds change by law — verify against an official source before relying on this for a real decision.</span>
    </div>
  );
}
