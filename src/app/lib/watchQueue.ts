/* ─────────────────────────────────────────────────────────────────────────
   Continue Watching queue — a single persistent, cross-path record of
   every video the learner has ever started. Unlike Enrollment.videoProgress
   (which only tracks the ONE current-milestone video per path), this store
   keeps a separate entry per distinct video, so switching between Coding,
   AI & ML, Fitness, etc. never loses progress on any of them — exactly
   what powers a real Netflix-style "Continue Watching" row.
───────────────────────────────────────────────────────────────────────── */

import { supabase } from "./supabase";
import { fetchWatchQueueFromDb, upsertWatchQueueToDb, removeWatchQueueFromDb } from "./supabaseDb";

export const WATCH_QUEUE_CHANGED_EVENT = "starfix:watchqueue-changed";
const STORAGE_KEY = "starfix:watchQueue";

export interface WatchQueueItem {
  id: string;             // stable per (pathId + creator + title)
  pathId: string;
  pathTitle: string;      // group header for Smart Grouping, e.g. "Coding"
  pathColor: string;
  title: string;
  creator: string;
  url: string;
  thumbSeed: string;      // deterministic picsum seed, unique per video
  pct: number;             // 0–100
  elapsedMin: number;
  totalMin: number;
  lastWatchedAt: string;   // ISO — drives "most recently watched" sort
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function watchIdFor(pathId: string, creator: string, title: string): string {
  return `${slug(pathId)}::${slug(creator)}::${slug(title)}`;
}

function isValidItem(v: any): v is WatchQueueItem {
  return v && typeof v === "object" &&
    typeof v.id === "string" && typeof v.pathId === "string" &&
    typeof v.title === "string" && typeof v.creator === "string" &&
    typeof v.pct === "number" && typeof v.elapsedMin === "number" &&
    typeof v.totalMin === "number" && typeof v.lastWatchedAt === "string";
}

function readAll(): Record<string, WatchQueueItem> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, WatchQueueItem>) : {};
    let dropped = false;
    for (const key of Object.keys(parsed)) {
      if (!isValidItem(parsed[key])) { delete parsed[key]; dropped = true; }
    }
    if (dropped) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch { /* ignore */ } }
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, WatchQueueItem>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(WATCH_QUEUE_CHANGED_EVENT));
}

/* Every video ever started, most recently watched first. */
export function getQueue(): WatchQueueItem[] {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
  );
}

/* Grouped by path (Smart Grouping) — group order follows each group's most
   recently watched video, items within a group most-recent first. */
export function getQueueGrouped(): { pathId: string; pathTitle: string; pathColor: string; items: WatchQueueItem[] }[] {
  const all = getQueue();
  const groups = new Map<string, { pathId: string; pathTitle: string; pathColor: string; items: WatchQueueItem[] }>();
  for (const item of all) {
    if (!groups.has(item.pathId)) {
      groups.set(item.pathId, { pathId: item.pathId, pathTitle: item.pathTitle, pathColor: item.pathColor, items: [] });
    }
    groups.get(item.pathId)!.items.push(item);
  }
  return Array.from(groups.values());
}

export function getMostRecentWatch(): WatchQueueItem | undefined {
  return getQueue()[0];
}

/* Starts (or resumes) tracking a video — called the moment a learner hits
   Watch/Resume. Always bumps it to the top of the queue. */
export function upsertWatch(input: {
  pathId: string; pathTitle: string; pathColor: string;
  title: string; creator: string; url: string; thumbSeed: string;
  pct: number; elapsedMin: number; totalMin: number;
}): WatchQueueItem {
  const all = readAll();
  const id = watchIdFor(input.pathId, input.creator, input.title);
  const item: WatchQueueItem = { id, ...input, lastWatchedAt: new Date().toISOString() };
  all[id] = item;
  writeAll(all);

  // Asynchronously persist to Supabase
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void upsertWatchQueueToDb(session.user.id, item);
    }
  });

  return item;
}

/* Item 7 — "save current timestamp every 10 seconds": bumps elapsed
   minutes + recomputed watched % and moves the item to the top of the
   queue, exactly mirroring a real player's periodic progress save. */
export function bumpProgress(id: string, elapsedMin: number): WatchQueueItem | undefined {
  const all = readAll();
  const item = all[id];
  if (!item) return undefined;
  const clampedElapsed = Math.min(item.totalMin, elapsedMin);
  const updated: WatchQueueItem = {
    ...item,
    elapsedMin: clampedElapsed,
    pct: item.totalMin > 0 ? Math.round((clampedElapsed / item.totalMin) * 100) : item.pct,
    lastWatchedAt: new Date().toISOString(),
  };
  all[id] = updated;
  writeAll(all);

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void upsertWatchQueueToDb(session.user.id, updated);
    }
  });

  return updated;
}

export function setWatchComplete(id: string): void {
  const all = readAll();
  const item = all[id];
  if (!item) return;
  const updated = { ...item, pct: 100, elapsedMin: item.totalMin, lastWatchedAt: new Date().toISOString() };
  all[id] = updated;
  writeAll(all);

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void upsertWatchQueueToDb(session.user.id, updated);
    }
  });
}

export function removeFromQueue(id: string): void {
  const all = readAll();
  if (!all[id]) return;
  delete all[id];
  writeAll(all);

  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      void removeWatchQueueFromDb(session.user.id, id);
    }
  });
}

export async function hydrateWatchQueue(userId?: string): Promise<Record<string, WatchQueueItem>> {
  try {
    let uid = userId;
    if (!uid) {
      const { data } = await supabase.auth.getUser();
      uid = data.user?.id;
    }
    if (!uid) return readAll();

    const remote = await fetchWatchQueueFromDb(uid);
    if (remote && Array.isArray(remote) && remote.length > 0) {
      const map: Record<string, WatchQueueItem> = {};
      remote.forEach((item: WatchQueueItem) => {
        if (item.id) map[item.id] = item;
      });
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
        window.dispatchEvent(new Event(WATCH_QUEUE_CHANGED_EVENT));
      }
      return map;
    }
  } catch (err) {
    console.warn("Could not hydrate watch queue from Supabase:", err);
  }
  return readAll();
}

/* Settings → Data & Storage → "Clear watch history". */
export function clearWatchQueue(): void {
  writeAll({});
}

