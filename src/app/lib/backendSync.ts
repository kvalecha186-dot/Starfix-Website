import { supabase } from "./supabase";
import { hydrateBookings, clearBookings } from "./bookings";
import { hydrateMessages, clearConversations } from "./messages";
import { syncEnrollmentsFromDb, clearEnrollments } from "./pathProgress";
import { hydrateSavedItems, clearSavedItems } from "./savedItems";
import { hydrateWatchQueue, clearWatchQueue } from "./watchQueue";
import { hydrateNotifications, clearNotifications } from "./notifications";
import { hydrateXp, clearXp } from "./xpSystem";
import { saveEnrollmentToDb } from "./supabaseDb";

let startedForUser: string | null = null;
let syncing = false;
// Single in-flight init promise — login fires initializeBackendSync from
// several places at once (getSession, onAuthStateChange, a custom event);
// without this each caller started its own full 7-table hydrate before the
// first one had recorded the user, which flooded phones with duplicate
// requests and re-renders.
let initInFlight: Promise<void> | null = null;
let listenersRegistered = false;
let syncTimer: number | null = null;

async function currentUserId(): Promise<string | null> {
  // getSession reads the locally cached session (no network round-trip),
  // unlike getUser() which hits the auth server every time.
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function hydrateAll(userId: string): Promise<void> {
  try {
    await Promise.allSettled([
      syncEnrollmentsFromDb(),
      hydrateBookings(userId),
      hydrateMessages(userId),
      hydrateSavedItems(userId),
      hydrateWatchQueue(userId),
      hydrateNotifications(userId),
      hydrateXp(userId),
    ]);
  } catch (err) {
    console.warn("Error hydrating user data:", err);
  }
}

export function clearAllUserData(): void {
  startedForUser = null;
  clearEnrollments();
  clearBookings();
  clearConversations();
  clearSavedItems();
  clearWatchQueue();
  clearNotifications();
  clearXp();
}

async function syncProgress(userId: string) {
  const raw = typeof window !== "undefined" ? localStorage.getItem("starfix:enrollments") : null;
  if (!raw) return;
  let map: Record<string, any> = {};
  try {
    map = JSON.parse(raw);
  } catch {
    return;
  }
  for (const e of Object.values(map)) {
    await saveEnrollmentToDb(userId, e).catch(() => {});
  }
}

async function syncAll(userId: string) {
  if (syncing) return;
  syncing = true;
  try {
    await syncProgress(userId);
  } catch (err) {
    console.warn("Background sync error:", err);
  } finally {
    syncing = false;
  }
}

export function initializeBackendSync(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (initInFlight) return initInFlight;

  initInFlight = (async () => {
    const uid = await currentUserId();
    if (!uid || startedForUser === uid) return;
    startedForUser = uid;

    // Register the global listeners exactly once for the app's lifetime —
    // previously every call added another pair, so they stacked up.
    if (!listenersRegistered) {
      listenersRegistered = true;

      // Debounced: a burst of task ticks / note edits now produces one
      // background save instead of one full re-save per tick.
      window.addEventListener("starfix:enrollments-changed", () => {
        if (syncTimer != null) window.clearTimeout(syncTimer);
        syncTimer = window.setTimeout(() => {
          syncTimer = null;
          void currentUserId().then((id) => id && syncAll(id));
        }, 2000);
      });

      supabase.auth.onAuthStateChange((event, session) => {
        if (event === "SIGNED_OUT") {
          clearAllUserData();
        } else if (session?.user && startedForUser !== session.user.id) {
          // A different user signed in on the same tab.
          startedForUser = session.user.id;
          void hydrateAll(session.user.id);
        }
      });
    }

    // Hydrate all database data for this user first
    await hydrateAll(uid);

    // Then ensure any offline local progress is saved
    await syncAll(uid);
  })().finally(() => {
    // Allow a later call (new user after logout) to run; same-user repeat
    // calls are still cut off by the startedForUser check above.
    initInFlight = null;
  });

  return initInFlight;
}

