// Shared calculation-history storage. Each calculator keeps its own localStorage key
// (unchanged from before — a calculator's own "recent calculations" panel still works
// exactly as it did), but this module is the single place that reads/writes them, so a
// site-wide history page can merge every calculator's entries into one view without any
// account or server-side storage — everything stays on the visitor's own device.

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputs: Record<string, string>;
  summary: string;
  label?: string;
}

export interface GlobalHistoryEntry extends HistoryEntry {
  slug: string;
  category: string;
  calculatorTitle: string;
}

const PREFIX = "gc:history:";
const MAX_PER_CALCULATOR = 8;

function keyFor(slug: string): string {
  return PREFIX + slug;
}

export function getHistory(slug: string): HistoryEntry[] {
  try {
    const raw = window.localStorage.getItem(keyFor(slug));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveHistory(slug: string, entries: HistoryEntry[]) {
  try {
    window.localStorage.setItem(keyFor(slug), JSON.stringify(entries));
  } catch {
    // storage full or disabled — history just won't persist
  }
}

function uniqueId(): string {
  // Date.now() alone can collide if two entries are added within the same millisecond
  // (rename/delete match by id, so a collision would silently corrupt both entries).
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addHistoryEntry(slug: string, inputs: Record<string, string>, summary: string): HistoryEntry[] {
  const entry: HistoryEntry = { id: uniqueId(), timestamp: Date.now(), inputs, summary };
  const next = [entry, ...getHistory(slug)].slice(0, MAX_PER_CALCULATOR);
  saveHistory(slug, next);
  return next;
}

export function renameHistoryEntry(slug: string, id: string, label: string): HistoryEntry[] {
  const next = getHistory(slug).map((e) => (e.id === id ? { ...e, label } : e));
  saveHistory(slug, next);
  return next;
}

export function deleteHistoryEntry(slug: string, id: string): HistoryEntry[] {
  const next = getHistory(slug).filter((e) => e.id !== id);
  saveHistory(slug, next);
  return next;
}

export function clearHistory(slug: string) {
  try {
    window.localStorage.removeItem(keyFor(slug));
  } catch {
    // ignore
  }
}

/** Merge every calculator's saved history into one reverse-chronological list. Client-only
 *  (localStorage), so this must be called from an effect/event handler, never during render. */
export function getAllHistory(calculators: { slug: string; title: string; category: string }[]): GlobalHistoryEntry[] {
  const all: GlobalHistoryEntry[] = [];
  for (const c of calculators) {
    for (const entry of getHistory(c.slug)) {
      all.push({ ...entry, slug: c.slug, calculatorTitle: c.title, category: c.category });
    }
  }
  return all.sort((a, b) => b.timestamp - a.timestamp);
}
