/* ─────────────────────────────────────────────────────────────────────────
   Global Saved Items store — a single localStorage-backed list shared by
   the Explore page (where items get saved/removed) and the Profile page
   (where they're reviewed). Not scoped per-path or per-goal, so a saved
   item stays saved no matter which Growth Path is currently active.
───────────────────────────────────────────────────────────────────────── */

export interface SavedItem {
  id: string;
  type: string;          // "YouTube" | "Event" | "Challenge" | "Opportunity" | "Mentor" | "Resource"
  title: string;
  desc: string;
  freshness?: string;
  url?: string;
  mentorId?: number;
  savedAt: string;        // ISO timestamp
}

const KEY = "starfix:savedItems";

export function getSavedItems(): SavedItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedItem[]) : [];
  } catch {
    return [];
  }
}

export function isItemSaved(id: string): boolean {
  return getSavedItems().some((i) => i.id === id);
}

export function saveItem(item: Omit<SavedItem, "savedAt">): SavedItem[] {
  const existing = getSavedItems();
  if (existing.some((i) => i.id === item.id)) return existing; // already saved
  const next = [{ ...item, savedAt: new Date().toISOString() }, ...existing];
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function removeSavedItem(id: string): SavedItem[] {
  const next = getSavedItems().filter((i) => i.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

/* Settings → Data & Storage → "Clear saved items". */
export function clearSavedItems(): void {
  try { localStorage.setItem(KEY, JSON.stringify([])); } catch {}
}
