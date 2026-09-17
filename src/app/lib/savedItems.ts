export interface SavedItem {
  id: string;
  type: string;
  title: string;
  desc: string;
  freshness?: string;
  url?: string;
  mentorId?: number;
  savedAt: string;
}

const KEY = "starfix:savedItems";
export const SAVED_ITEMS_CHANGED_EVENT = "starfix:saveditems-changed";

function notify() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SAVED_ITEMS_CHANGED_EVENT));
}

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
  if (existing.some((i) => i.id === item.id)) return existing;
  const next = [{ ...item, savedAt: new Date().toISOString() }, ...existing];
  try { localStorage.setItem(KEY, JSON.stringify(next)); notify(); } catch {}
  return next;
}

export function removeSavedItem(id: string): SavedItem[] {
  const next = getSavedItems().filter((i) => i.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); notify(); } catch {}
  return next;
}

export function clearSavedItems(): void {
  try { localStorage.setItem(KEY, JSON.stringify([])); notify(); } catch {}
}
