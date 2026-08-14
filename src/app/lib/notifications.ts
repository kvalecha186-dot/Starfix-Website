/* ─────────────────────────────────────────────────────────────────────────
   Notification store — single source of truth for the Dashboard
   Notification Center. Mirrors the pathProgress.ts pattern: backed by
   localStorage, fires NOTIFICATIONS_CHANGED_EVENT on every write so any
   mounted component (NotificationCenter, Dashboard, Sidebar badge, ...)
   can re-read state without prop drilling.
───────────────────────────────────────────────────────────────────────── */

export const NOTIFICATIONS_CHANGED_EVENT = "starfix:notifications-changed";
const STORAGE_KEY = "starfix:notifications";
const MAX_STORED = 40;

export type NotificationType =
  | "session_started"
  | "session_reminder"
  | "mentor_replied"
  | "task_completed_early"
  | "streak_increased"
  | "badge_unlocked"
  | "weekly_challenge_completed"
  | "milestone_unlocked"
  | "new_resource_added"
  | "path_progress_updated"
  | "certificate_earned"
  | "video_completed";

export type NotificationCategory = "sessions" | "progress" | "mentors" | "achievements";

/* Which tab of the Notification Center panel a given type belongs under. */
export function categoryFor(type: NotificationType): NotificationCategory {
  switch (type) {
    case "session_started":
    case "session_reminder":
      return "sessions";
    case "mentor_replied":
      return "mentors";
    case "task_completed_early":
    case "path_progress_updated":
    case "new_resource_added":
    case "video_completed":
      return "progress";
    case "streak_increased":
    case "badge_unlocked":
    case "weekly_challenge_completed":
    case "milestone_unlocked":
    case "certificate_earned":
      return "achievements";
    default:
      return "progress";
  }
}

export interface AppNotification {
  id: string;            // stable id — used to de-duplicate repeat events
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;      // ISO
  dismissed: boolean;
  pathId?: string;        // which Growth Path this relates to, if any
}

function readAll(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: AppNotification[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_STORED)));
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));
}

/* All notifications, most recent first. */
export function getAllNotifications(): AppNotification[] {
  return readAll().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/* Active (non-dismissed) notifications, most recent first — what the
   Notification Center strip renders. */
export function getActiveNotifications(): AppNotification[] {
  return getAllNotifications().filter((n) => !n.dismissed);
}

/* Adds a notification. If `id` is provided and a notification with that id
   already exists, the call is a no-op — this is how repeat events (e.g. a
   session-started check running every 30s) avoid spamming duplicates. */
export function addNotification(
  type: NotificationType,
  title: string,
  message: string,
  id?: string,
  pathId?: string
): AppNotification | null {
  const all = readAll();
  const finalId = id ?? `${type}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;
  if (all.some((n) => n.id === finalId)) return null;

  const notif: AppNotification = {
    id: finalId,
    type,
    title,
    message,
    createdAt: new Date().toISOString(),
    dismissed: false,
    pathId,
  };
  writeAll([notif, ...all]);
  return notif;
}

export function dismissNotification(id: string) {
  const all = readAll();
  const n = all.find((x) => x.id === id);
  if (!n) return;
  n.dismissed = true;
  writeAll(all);
}

export function dismissAll() {
  const all = readAll().map((n) => ({ ...n, dismissed: true }));
  writeAll(all);
}
