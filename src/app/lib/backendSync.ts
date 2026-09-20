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

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
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

export async function initializeBackendSync() {
  if (typeof window === "undefined") return;
  const uid = await currentUserId();
  if (!uid || startedForUser === uid) return;
  startedForUser = uid;

  // Hydrate all database data for this user first
  await hydrateAll(uid);

  // Then ensure any offline local progress is saved
  await syncAll(uid);

  const onChange = () => {
    void currentUserId().then((id) => id && syncAll(id));
  };

  window.addEventListener("starfix:enrollments-changed", onChange);

  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      if (startedForUser !== session.user.id) {
        startedForUser = session.user.id;
        void hydrateAll(session.user.id);
      }
    } else if (event === "SIGNED_OUT") {
      clearAllUserData();
    }
  });
}

