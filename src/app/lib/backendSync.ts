import { supabase } from "./supabase";

const EVENTS = [
  "starfix:appsettings-changed",
  "starfix:saveditems-changed",
  "starfix:watchqueue-changed",
  "starfix:notifications-changed",
  "starfix:xp-changed",
  "starfix:enrollments-changed",
] as const;

let started = false;
let syncing = false;

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

async function syncSettings(userId: string) {
  const raw = localStorage.getItem("starfix:appSettings");
  if (!raw) return;
  let s: any;
  try { s = JSON.parse(raw); } catch { return; }
  const { error } = await supabase.from("app_settings").upsert({
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
  if (error) console.warn("Starfix settings sync:", error.message);
}

async function hydrateSettings(userId: string) {
  const { data } = await supabase.from("app_settings").select("*").eq("user_id", userId).maybeSingle();
  if (!data) return;
  let current: any = {};
  try { current = JSON.parse(localStorage.getItem("starfix:appSettings") || "{}"); } catch {}
  localStorage.setItem("starfix:appSettings", JSON.stringify({
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
  }));
}

async function syncSaved(userId: string) {
  const raw = localStorage.getItem("starfix:savedItems");
  if (!raw) return;
  let items: any[];
  try { items = JSON.parse(raw); } catch { return; }
  for (const item of items) {
    const { error } = await supabase.from("saved_items").upsert({
      user_id: userId,
      external_id: String(item.id),
      item_type: item.type || "Resource",
      title: item.title || "Saved item",
      description: item.desc || null,
      url: item.url || `starfix://${item.id}`,
      saved_at: item.savedAt || new Date().toISOString(),
    }, { onConflict: "user_id,external_id" });
    if (error) console.warn("Starfix saved item sync:", error.message);
  }
}

async function hydrateSaved(userId: string) {
  const { data } = await supabase.from("saved_items").select("id,external_id,item_type,title,description,url,saved_at").eq("user_id", userId).order("saved_at", { ascending: false });
  if (!data) return;
  const items = data.map((x: any) => ({
    id: x.external_id || x.id,
    type: x.item_type,
    title: x.title,
    desc: x.description || "",
    url: x.url,
    savedAt: x.saved_at,
  }));
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
    const { error } = await supabase.from("watch_queue").upsert({
      user_id: userId,
      external_id: String(item.id),
      path_id: pathId,
      video_title: item.title,
      creator: item.creator,
      video_url: item.url,
      pct: Math.max(0, Math.min(100, Math.round(item.pct))),
      elapsed_min: Math.max(0, Math.round(item.elapsedMin)),
      total_min: Math.max(1, Math.round(item.totalMin)),
      last_watched_at: item.lastWatchedAt || new Date().toISOString(),
    }, { onConflict: "user_id,external_id" });
    if (error) console.warn("Starfix watch sync:", error.message);
  }
}

async function hydrateWatch(userId: string) {
  const { data: paths } = await supabase.from("growth_paths").select("id,slug,title");
  const pathMap = new Map((paths ?? []).map((p: any) => [p.id, p]));
  const { data } = await supabase.from("watch_queue").select("id,external_id,path_id,video_title,creator,video_url,pct,elapsed_min,total_min,last_watched_at").eq("user_id", userId).order("last_watched_at", { ascending: false });
  if (!data) return;
  const out: Record<string, any> = {};
  for (const x of data) {
    const p = pathMap.get(x.path_id);
    const id = x.external_id || x.id;
    out[id] = {
      id, pathId: p?.slug || x.path_id, pathTitle: p?.title || "Growth Path", pathColor: "#D4AF37",
      title: x.video_title, creator: x.creator, url: x.video_url, thumbSeed: id,
      pct: x.pct, elapsedMin: x.elapsed_min, totalMin: x.total_min, lastWatchedAt: x.last_watched_at,
    };
  }
  localStorage.setItem("starfix:watchQueue", JSON.stringify(out));
}

async function syncNotifications(userId: string) {
  const raw = localStorage.getItem("starfix:notifications");
  if (!raw) return;
  let list: any[];
  try { list = JSON.parse(raw); } catch { return; }
  for (const n of list) {
    const { error } = await supabase.from("notifications").upsert({
      user_id: userId,
      external_id: String(n.id),
      type: n.type,
      title: n.title,
      message: n.message || null,
      read: !!n.dismissed,
      created_at: n.createdAt || new Date().toISOString(),
    }, { onConflict: "user_id,external_id" });
    if (error) console.warn("Starfix notification sync:", error.message);
  }
}

async function hydrateNotifications(userId: string) {
  const { data } = await supabase.from("notifications").select("id,external_id,type,title,message,read,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(40);
  if (!data) return;
  localStorage.setItem("starfix:notifications", JSON.stringify(data.map((n: any) => ({
    id: n.external_id || n.id, type: n.type, title: n.title, message: n.message || "", createdAt: n.created_at, dismissed: !!n.read,
  }))));
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
    const { error } = await supabase.from("user_progress").upsert({
      user_id: userId,
      path_id: pathId,
      overall_progress: e.completedAt ? 100 : Math.max(0, Math.min(99, Number(e.weekIndex || 0) * 8)),
      started_at: e.startedAt,
      completed_at: e.completedAt,
      focus: e.focus || [],
      video_stage: e.videoStage || "start",
      streak: e.streak || 0,
      xp: e.xp || 0,
      last_active_date: (e.lastActiveAt || new Date().toISOString()).slice(0, 10),
      current_challenge_text: e.challenge?.label || null,
      current_challenge_xp: 0,
      current_challenge_done: !!e.challenge?.done,
    }, { onConflict: "user_id,path_id" });
    if (error) console.warn("Starfix progress sync:", error.message);
  }
}

async function syncXp(userId: string) {
  const raw = localStorage.getItem("starfix:xp");
  if (!raw) return;
  let s: any;
  try { s = JSON.parse(raw); } catch { return; }
  const rows = (s.log || []).slice(0, 200).map((x: any) => ({
    user_id: userId,
    external_id: String(x.id),
    amount: Number(x.amount) || 0,
    reason: x.label || "XP event",
    source_type: "app",
    created_at: new Date(x.at || Date.now()).toISOString(),
  }));
  if (rows.length) {
    const { error } = await supabase.from("xp_transactions").upsert(rows, { onConflict: "user_id,external_id" });
    if (error) console.warn("Starfix XP sync:", error.message);
  }
}

async function hydrateXp(userId: string) {
  const { data } = await supabase.from("xp_transactions").select("external_id,amount,reason,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
  if (!data?.length) return;
  const state = JSON.parse(localStorage.getItem("starfix:xp") || "{}");
  state.totalXp = Math.max(0, data.reduce((sum: number, x: any) => sum + Number(x.amount), 0));
  state.pending = state.pending || [];
  state.settledByKey = state.settledByKey || {};
  state.consistencyStreak = state.consistencyStreak || 0;
  state.lastConsistencyDate = state.lastConsistencyDate || "";
  state.log = data.map((x: any, i: number) => ({ id: x.external_id || `db-${i}`, label: x.reason, amount: Number(x.amount), at: new Date(x.created_at).getTime() }));
  localStorage.setItem("starfix:xp", JSON.stringify(state));
}

async function migrateAndHydrate(userId: string) {
  // Upload local legacy state first so an existing learner's browser data is
  // not overwritten by an empty remote account on the first connection.
  await syncAll(userId);
  await hydrateAll(userId);
}

async function hydrateAll(userId: string) {
  await Promise.all([hydrateSettings(userId), hydrateSaved(userId), hydrateWatch(userId), hydrateNotifications(userId), hydrateXp(userId)]);
}

async function syncAll(userId: string) {
  if (syncing) return;
  syncing = true;
  try { await Promise.all([syncSettings(userId), syncSaved(userId), syncWatch(userId), syncNotifications(userId), syncProgress(userId), syncXp(userId)]); }
  finally { syncing = false; }
}

export async function initializeBackendSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  const userId = await currentUserId();
  if (!userId) return;

  await migrateAndHydrate(userId);

  const onChange = () => { void currentUserId().then((id) => id && syncAll(id)); };
  EVENTS.forEach((event) => window.addEventListener(event, onChange));

  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) void migrateAndHydrate(session.user.id);
  });
}
