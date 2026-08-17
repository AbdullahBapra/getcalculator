// Shared embed-snippet logic — used by the central embed picker (embed-calculators page)
// and anywhere else an <iframe> snippet needs generating, so the format only lives once.
import { SITE_URL, SITE_NAME } from "./site";

export function embedHeightFor(widget?: string): number {
  switch (widget) {
    case "keypad-scientific":
      return 640;
    case "keypad-basic":
      return 480;
    case "abacus":
      return 480;
    case "darts-scorer":
      return 560;
    default:
      return 700;
  }
}

export function embedUrlFor(category: string, slug: string): string {
  return `${SITE_URL}/embed/${category}/${slug}`;
}

export function buildEmbedSnippet(category: string, slug: string, title: string, widget?: string): string {
  const url = embedUrlFor(category, slug);
  const height = embedHeightFor(widget);
  return `<iframe src="${url}" width="100%" height="${height}" style="border:1px solid #e4e4e7;border-radius:12px;" loading="lazy" title="${title} — powered by ${SITE_NAME}"></iframe>`;
}
