import { supabase } from "./supabase";
import { fetchSavedItemsFromDb, saveItemToDb, removeSavedItemFromDb } from "./supabaseDb";

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
  const fullItem: SavedItem = { ...item, savedAt: new Date().toISOString() };
  const next = [fullItem, ...existing];
  try { localStorage.setItem(KEY, JSON.stringify(next)); notify(); } catch {}

  // Asynchronously persist to Supabase
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void saveItemToDb(session.user.id, fullItem);
    }
  });

  return next;
}

export function removeSavedItem(id: string): SavedItem[] {
  const next = getSavedItems().filter((i) => i.id !== id);
  try { localStorage.setItem(KEY, JSON.stringify(next)); notify(); } catch {}

  // Asynchronously delete from Supabase
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void removeSavedItemFromDb(session.user.id, id);
    }
  });

  return next;
}

export async function hydrateSavedItems(userId?: string): Promise<SavedItem[]> {
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }
    if (!uid) return getSavedItems();

    const remote = await fetchSavedItemsFromDb(uid);
    if (remote && Array.isArray(remote)) {
      if (typeof window !== "undefined") {
        localStorage.setItem(KEY, JSON.stringify(remote));
        notify();
      }
      return remote;
    }
  } catch (err) {
    console.warn("Could not hydrate saved items from Supabase:", err);
  }
  return getSavedItems();
}

export function clearSavedItems(): void {
  try { localStorage.setItem(KEY, JSON.stringify([])); notify(); } catch {}
}

