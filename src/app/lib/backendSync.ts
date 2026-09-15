import { supabase } from "./supabase";

const EVENTS = {
  settings: "starfix:appsettings-changed",
  saved: "starfix:saveditems-changed",
  watch: "starfix:watchqueue-changed",
  notifications: "starfix:notifications-changed",
  xp: "starfix:xp-changed",
  progress: "starfix:enrollments-changed",
  bookings: "starfix_bookings_changed",
  messages: "starfix:messages-changed",
} as const;

let started = false;
let syncing = false;

function userIdFromSession(): string | null {
  // The Supabase client already owns the authenticated session. This helper
  // is only used after getSession() in the async functions below.
  return null;
}

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function syncSettings(userId: string) {
  const raw = localStorage.getItem("starfix:appSettings");
  if (!raw) return;
  let s: any;
  try { s = JSON.parse(raw); } catch { return; }
  await supabase.from("app_settings").upsert({
    user_id: userId,
    autoplay_next_video: !!s.autoplayNextVideo,
    show_subtitles: !!s.showSubtitles,
    daily_reminder_notifications: !!s.dailyReminderNotifications,
    weekly_progress_email: !!s.weeklyProgressEmail,
    focus_mode: !!s.focusMode,
    content_source: s.contentSource ?? "both",
    content_level: s.contentLevel ?? "beginner",
    session_reminder_lead: s.sessionReminderLead ?? "10",
    time_zone: s.timeZone ?? "UTC",
    show_completed_paths: s.showCompletedPaths !== false,
    show_streak_publicly: s.showStreaks !== false,
    show_saved_items_publicly: !!s.showSavedResources,
  }, { onConflict: "user_id" });
}

async function hydrateSettings(userId: string) {
  const { data } = await supabase.from("app_settings").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return;
  const current = JSON.parse(localStorage.getItem("starfix:appSettings") || "{}");
  const next = {
    ...current,
    autoplayNextVideo: data.autoplay_next_video,
    showSubtitles: data.show_subtitles,
    dailyReminderNotifications: data.daily_reminder_notifications,
    weeklyProgressEmail: data.weekly_progress_email,
    focusMode: data.focus_mode,
    contentSource: data.content_source,
    contentLevel: data.content_level,
    sessionReminderLead: data.session_reminder_lead,
    timeZone: data.time_zone,
    showCompletedPaths: data.show_completed_paths,
    showStreaks: data.show_streak_publicly,
    showSavedResources: data.show_saved_items_publicly,
  };
  localStorage.setItem("starfix:appSettings", JSON.stringify(next));
}

async function syncSaved(userId: string) {
  const raw = localStorage.getItem("starfix:savedItems");
  if (!raw) return;
  let items: any[];
  try { items = JSON.parse(raw); } catch { return; }
  const { data: paths } = await supabase.from("growth_paths").select("id,slug");
  const pathMap = new Map((paths ?? []).map((p: any) => [p.slug, p.id]));
  for (const item of items) {
    await supabase.from("saved_items").upsert({
      user_id: userId,
      item_type: item.type || "Resource",
      title: item.title,
      description: item.desc || null,
      url: item.url || `starfix://${item.id}`,
      saved_at: item.savedAt || new Date().toISOString(),
    }, { onConflict: "id" }).then(() => undefined);
  }
}

async function hydrateSaved(userId: string) {
  const { data } = await supabase.from("saved_items").select("id,item_type,title,description,url,saved_at").eq("user_id", userId).order("saved_at", { ascending: false });
  if (!data?.length) return;
  const items = data.map((x: any) => ({ id: x.id, type: x.item_type, title: x.title, desc: x.description || "", url: x.url, savedAt: x.saved_at }));
  localStorage.setItem("starfix:savedItems", JSON.stringify(items));
}

async function syncWatch(userId: string) {
  const raw = localStorage.getItem("starfix:watchQueue");
  if (!raw) return;
  let map: Record<string, any>;
  try { map = JSON.parse(raw); } catch { return; }
  const { data: paths } = await supabase.from("growth_paths").select("id,slug");
  const pathMap = new Map((paths ?? []).map((p: any) => [p.slug, p.id]));
  for (const item of Object.values(map)) {
    const pathId = pathMap.get(item.pathId);
    if (!pathId) continue;
    await supabase.from("watch_queue").upsert({
      user_id: userId,
      path_id: pathId,
      video_title: item.title,
      creator: item.creator,
      video_url: item.url,
      pct: Math.max(0, Math.min(100, Math.round(item.pct))),
      elapsed_min: Math.max(0, Math.round(item.elapsedMin)),
      total_min: Math.max(1, Math.round(item.totalMin)),
      last_watched_at: item.lastWatchedAt || new Date().toISOString(),
    }, { onConflict: "id" });
  }
}

async function hydrateWatch(userId: string) {
  const { data: paths } = await supabase.from("growth_paths").select("id,slug,title");
  const pathMap = new Map((paths ?? []).map((p: any) => [p.id, p]));
  const { data } = await supabase.from("watch_queue").select("id,path_id,video_title,creator,video_url,pct,elapsed_min,total_min,last_watched_at").eq("user_id", userId).order("last_watched_at", { ascending: false });
  if (!data) return;
  const out: Record<string, any> = {};
  for (const x of data) {
    const p = pathMap.get(x.path_id);
    const item = {
      id: x.id, pathId: p?.slug || x.path_id, pathTitle: p?.title || "Growth Path", pathColor: "#D4AF37",
      title: x.video_title, creator: x.creator, url: x.video_url, thumbSeed: x.id,
      pct: x.pct, elapsedMin: x.elapsed_min, totalMin: x.total_min, lastWatchedAt: x.last_watched_at,
    };
    out[item.id] = item;
  }
  localStorage.setItem("starfix:watchQueue", JSON.stringify(out));
}

async function syncNotifications(userId: string) {
  const raw = localStorage.getItem("starfix:notifications");
  if (!raw) return;
  let list: any[];
  try { list = JSON.parse(raw); } catch { return; }
  for (const n of list) {
    const externalId = n.id;
    await supabase.from("notifications").upsert({
      user_id: userId,
      type: n.type,
      title: n.title,
      message: n.message,
      read: !!n.dismissed,
    }, { onConflict: "id" }).then(() => undefined);
  }
}

async function hydrateNotifications(userId: string) {
  const { data } = await supabase.from("notifications").select("id,type,title,message,read,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(40);
  if (!data) return;
  const list = data.map((n: any) => ({ id: n.id, type: n.type, title: n.title, message: n.message || "", createdAt: n.created_at, dismissed: !!n.read }));
  localStorage.setItem("starfix:notifications", JSON.stringify(list));
}

async function syncProgress(userId: string) {
  const raw = localStorage.getItem("starfix:enrollments");
  if (!raw) return;
  let all: Record<string, any>;
  try { all = JSON.parse(raw); } catch { return; }
  const { data: paths } = await supabase.from("growth_paths").select("id,slug");
  const pathMap = new Map((paths ?? []).map((p: any) => [p.slug, p.id]));
  for (const e of Object.values(all)) {
    const pathId = pathMap.get(e.pathId);
    if (!pathId) continue;
    await supabase.from("user_progress").upsert({
      user_id: userId, path_id: pathId, overall_progress: Math.max(0, Math.min(100, Number(e.weekIndex || 0))),
      current_milestone_id: null, started_at: e.startedAt, completed_at: e.completedAt,
      focus: e.focus || [], video_stage: e.videoStage || "start", streak: e.streak || 0, xp: e.xp || 0,
      last_active_date: (e.lastActiveAt || new Date().toISOString()).slice(0, 10),
      current_challenge_text: e.challenge?.label || null, current_challenge_xp: 0, current_challenge_done: !!e.challenge?.done,
    }, { onConflict: "user_id,path_id" });
  }
}

async function syncXp(userId: string) {
  const raw = localStorage.getItem("starfix:xp");
  if (!raw) return;
  let s: any;
  try { s = JSON.parse(raw); } catch { return; }
  const rows = (s.log || []).slice(0, 200).map((x: any) => ({ user_id: userId, amount: x.amount, reason: x.label || "XP event", source_type: "app", created_at: new Date(x.at || Date.now()).toISOString() }));
  if (rows.length) await supabase.from("xp_transactions").insert(rows);
}

async function hydrateXp(userId: string) {
  const { data } = await supabase.from("xp_transactions").select("amount,reason,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
  if (!data?.length) return;
  const totalXp = data.reduce((sum: number, x: any) => sum + Number(x.amount), 0);
  const state = JSON.parse(localStorage.getItem("starfix:xp") || "{}");
  state.totalXp = Math.max(0, totalXp); state.pending = state.pending || []; state.settledByKey = state.settledByKey || {};
  state.consistencyStreak = state.consistencyStreak || 0; state.lastConsistencyDate = state.lastConsistencyDate || "";
  state.log = data.map((x: any, i: number) => ({ id: `db-${i}-${new Date(x.created_at).getTime()}`, label: x.reason, amount: Number(x.amount), at: new Date(x.created_at).getTime() }));
  localStorage.setItem("starfix:xp", JSON.stringify(state));
}

async function hydrateAll(userId: string) {
  await Promise.all([
    hydrateSettings(userId), hydrateSaved(userId), hydrateWatch(userId),
    hydrateNotifications(userId), hydrateXp(userId),
  ]);
}

async function syncAll(userId: string) {
  if (syncing) return;
  syncing = true;
  try {
    await Promise.all([
      syncSettings(userId), syncSaved(userId), syncWatch(userId), syncNotifications(userId), syncProgress(userId), syncXp(userId),
    ]);
  } finally { syncing = false; }
}

export async function initializeBackendSync() {
  if (started) return;
  started = true;
  const userId = await currentUserId();
  if (!userId) return;

  // Database is the cross-device source of truth. Hydrate first, then keep
  // the existing UI stores compatible while their mutations are migrated.
  await hydrateAll(userId);

  const onChange = () => { void currentUserId().then((id) => id && syncAll(id)); };
  Object.values(EVENTS).forEach((event) => window.addEventListener(event, onChange));
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      void hydrateAll(session.user.id).then(() => syncAll(session.user.id));
    }
  });

  // One initial write migrates any legacy local data into Supabase.
  await syncAll(userId);
}

export function getBackendUserId() {
  return userIdFromSession();
}
