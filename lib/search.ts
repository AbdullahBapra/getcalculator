// Typo-tolerant fuzzy search shared by the header search box, the command palette, and
// the embed-calculators list. Deliberately NOT an AI/LLM router — this is the cheap,
// client-side "Phase A" search upgrade from INNOVATION_PLAN.md; real natural-language
// parsing is deferred until this proves insufficient.

export interface Searchable {
  slug: string;
  title: string;
  category: string;
  shortDescription: string;
  keywords?: string[];
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Levenshtein edit distance — used only for short-token typo tolerance (e.g. "mortgag" ~ "mortgage"). */
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = temp;
    }
  }
  return dp[n];
}

// Present in nearly every calculator title ("Tip Calculator", "BMI Calculator", ...) so it
// carries almost no discriminative value for token-level matching — without excluding it,
// every title ties on this one word alone and drowns out the word that actually matters.
const STOPWORDS = new Set(["calculator", "calculators", "converter", "and", "for", "the", "of", "a"]);

function scoreItem(item: Searchable, query: string): number {
  const q = normalize(query);
  const title = normalize(item.title);
  if (title === q) return 100;
  if (title.startsWith(q)) return 90;
  if (title.includes(q)) return 75;

  const titleTokens = title.split(/\s+/).filter((t) => !STOPWORDS.has(t));
  const qTokens = q.split(/\s+/).filter((t) => t && !STOPWORDS.has(t));
  let tokenScore = 0;
  for (const qt of qTokens) {
    let best = 0;
    for (const tt of titleTokens) {
      if (tt.startsWith(qt)) best = Math.max(best, 30);
      else if (tt.includes(qt)) best = Math.max(best, 15);
      else if (qt.length > 3) {
        const dist = levenshtein(qt, tt);
        if (dist <= 2) best = Math.max(best, 20 - dist * 5);
      }
    }
    tokenScore += best;
  }
  if (tokenScore > 0) return Math.min(70, tokenScore);

  if (normalize(item.shortDescription).includes(q)) return 20;
  if (item.keywords?.some((k) => normalize(k).includes(q))) return 15;
  return 0;
}

export function fuzzySearch<T extends Searchable>(items: T[], query: string, max = 10): T[] {
  const q = query.trim();
  if (!q) return [];
  return items
    .map((item) => ({ item, score: scoreItem(item, q) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map((s) => s.item);
}
