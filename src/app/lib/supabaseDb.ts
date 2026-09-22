import { supabase } from "./supabase";
import type { UserProfile } from "../types";
import { GOAL_META } from "../types";
import type { Booking } from "./bookings";

/* ─────────────────────────────────────────────────────────────────────────
   Supabase Database API Service Layer for Starfix
   Provides strongly typed database operations with automatic fallback to
   local mock state if offline or during network disruptions.
───────────────────────────────────────────────────────────────────────── */

/* ─── 1. USER PROFILES ─────────────────────────────────────────────────── */

export async function fetchProfileFromDb(userId: string): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("Could not fetch profile from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    const goalKey = data.goal_id || "coding";
    const goalMeta = GOAL_META[goalKey] || GOAL_META["coding"];

    const profile: UserProfile = {
      name: data.full_name || (data.email ? data.email.split("@")[0] : "Learner"),
      email: data.email || "",
      goalId: goalKey,
      goalTitle: data.goal_title || goalMeta.title,
      level: (data.level as any) || "intermediate",
      dailyTime: data.daily_time || "30min",
      preference: (data.preference as any) || "roadmap",
      obstacle: data.obstacle || undefined,
      country: data.country || "India",
      learningLanguage: (data.learning_language as any) || "English",
      learningLanguages: data.learning_languages || [data.learning_language || "English"],
      learningStyle: (data.learning_style as any) || "practice-first",
      careerGoal: data.career_goal || undefined,
      avatarDataUrl: data.avatar_url || undefined,
    };

    return profile;
  } catch (err) {
    console.warn("Exception fetching profile from Supabase:", err);
    return null;
  }
}

export async function saveProfileToDb(userId: string, profile: Partial<UserProfile>): Promise<boolean> {
  try {
    const patch: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (profile.name !== undefined) patch.full_name = profile.name;
    if (profile.email !== undefined) patch.email = profile.email;
    if (profile.goalId !== undefined) patch.goal_id = profile.goalId;
    if (profile.goalTitle !== undefined) patch.goal_title = profile.goalTitle;
    if (profile.level !== undefined) patch.level = profile.level;
    if (profile.dailyTime !== undefined) patch.daily_time = profile.dailyTime;
    if (profile.preference !== undefined) patch.preference = profile.preference;
    if (profile.obstacle !== undefined) patch.obstacle = profile.obstacle;
    if (profile.country !== undefined) patch.country = profile.country;
    if (profile.learningLanguage !== undefined) patch.learning_language = profile.learningLanguage;
    if (profile.learningLanguages !== undefined) patch.learning_languages = profile.learningLanguages;
    if (profile.learningStyle !== undefined) patch.learning_style = profile.learningStyle;
    if (profile.careerGoal !== undefined) patch.career_goal = profile.careerGoal;
    if (profile.avatarDataUrl !== undefined) patch.avatar_url = profile.avatarDataUrl;

    const { error } = await supabase
      .from("profiles")
      .update(patch)
      .eq("id", userId);

    if (error) {
      console.warn("Failed to update profile in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception updating profile in Supabase:", err);
    return false;
  }
}

/* ─── 2. MENTORS ───────────────────────────────────────────────────────── */

export interface DbMentor {
  id: number;
  name: string;
  initials: string;
  color: string;
  title: string;
  company: string;
  category: string;
  rating: number;
  students: number;
  price: string;
  free: boolean;
  availability: string;
  skills: string[];
  bio?: string;
  about?: string;
  pricing?: any[];
  availabilitySlots?: any[];
}

export async function fetchMentorsFromDb(): Promise<DbMentor[] | null> {
  try {
    const { data, error } = await supabase
      .from("mentors")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      console.warn("Could not fetch mentors from Supabase:", error.message);
      return null;
    }
    if (!data || data.length === 0) return null;

    return data.map((m: any) => ({
      id: m.legacy_id ?? m.id,
      uuid: m.id,
      name: m.name,
      initials: m.initials || (m.name ? m.name.split(" ").map((w: string) => w[0]).join("").slice(0, 2) : "ME"),
      color: m.color || "#6366F1",
      title: m.headline,
      company: m.company,
      category: m.category,
      rating: Number(m.rating) || 5.0,
      students: m.students_count || 0,
      price: m.price || (m.free ? "Free" : "₹2,500/hr"),
      free: !!m.free,
      availability: m.availability || "Today",
      skills: Array.isArray(m.skills) ? m.skills : [],
      bio: m.bio,
      about: m.bio,
      pricing: undefined,
      availabilitySlots: undefined,
    }));
  } catch (err) {
    console.warn("Exception fetching mentors from Supabase:", err);
    return null;
  }
}

export async function submitMentorReview(bookingId: string, mentorId: string, rating: number, reviewText: string): Promise<boolean> {
  const auth = await supabase.auth.getUser();
  const studentId = auth.data.user?.id;
  if (!studentId || rating < 1 || rating > 5 || !reviewText.trim()) return false;
  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    student_id: studentId,
    mentor_id: mentorId,
    rating,
    review_text: reviewText.trim(),
  });
  if (error) {
    console.warn("Could not submit mentor review:", error.message);
    return false;
  }
  return true;
}

/* ─── 3. BOOKINGS ──────────────────────────────────────────────────────── */

const isValidUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function fetchBookingsFromDb(studentId: string): Promise<Booking[] | null> {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch bookings from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    return data.map((b: any) => ({
      id: b.id,
      mentorId: b.mentor_num || 1,
      mentorName: b.mentor_name || "Mentor",
      mentorTitle: b.mentor_title,
      mentorCompany: b.mentor_company,
      mentorColor: b.mentor_color || "#6366F1",
      mentorInitials: b.mentor_initials || "ME",
      sessionType: b.session_type || "1:1 Session",
      duration: b.duration || "45 min",
      price: b.price || "Free",
      bookingDate: b.booking_date,
      bookingTime: b.booking_time,
      status: b.status as any,
      createdAt: b.created_at,
      notes: b.notes,
    }));
  } catch (err) {
    console.warn("Exception fetching bookings from Supabase:", err);
    return null;
  }
}

export async function insertBookingToDb(studentId: string, booking: Booking): Promise<boolean> {
  try {
    const bookingId = isValidUuid(booking.id) ? booking.id : crypto.randomUUID();

    // Resolve the real mentor row via legacy_id (the static MENTORS array's
    // numeric id) instead of fabricating a UUID that could never match a
    // real row — that was the actual bug. Falls back to NULL (now allowed
    // by the schema) if this mentor hasn't been seeded into the DB yet, so
    // the booking still saves with its flat mentor_* display fields intact.
    let mentorUuid: string | null = null;
    const { data: mentorRow } = await supabase
      .from("mentors")
      .select("id")
      .eq("legacy_id", booking.mentorId)
      .maybeSingle();
    if (mentorRow) mentorUuid = mentorRow.id;

    const { error } = await supabase
      .from("bookings")
      .insert({
        id: bookingId,
        student_id: studentId,
        mentor_id: mentorUuid,
        mentor_num: booking.mentorId,
        mentor_name: booking.mentorName,
        mentor_title: booking.mentorTitle,
        mentor_company: booking.mentorCompany,
        mentor_color: booking.mentorColor,
        mentor_initials: booking.mentorInitials,
        session_type: booking.sessionType,
        duration: booking.duration,
        price: booking.price,
        booking_date: booking.bookingDate,
        booking_time: booking.bookingTime,
        status: booking.status,
        notes: booking.notes,
        created_at: booking.createdAt,
      });

    if (error) {
      console.warn("Failed to insert booking to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception inserting booking to Supabase:", err);
    return false;
  }
}

export async function cancelBookingInDb(bookingId: string): Promise<boolean> {
  try {
    if (!isValidUuid(bookingId)) return true;

    const { error } = await supabase
      .from("bookings")
      .update({ status: "Cancelled" })
      .eq("id", bookingId);

    if (error) {
      console.warn("Failed to cancel booking in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception canceling booking in Supabase:", err);
    return false;
  }
}

/* ─── 4. XP TRANSACTIONS ───────────────────────────────────────────────── */

export async function recordXpInDb(
  userId: string,
  amount: number,
  reason: string,
  category = "mission",
  taskKey?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("xp_transactions")
      .insert({
        user_id: userId,
        amount,
        reason,
        category,
        task_key: taskKey,
        settled: true,
      });

    if (error) {
      console.warn("Could not record XP transaction in Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception recording XP in Supabase:", err);
    return false;
  }
}

/* ─── 5. NOTIFICATIONS ─────────────────────────────────────────────────── */

/* ─── 5. NOTIFICATIONS ─────────────────────────────────────────────────── */

export async function fetchNotificationsFromDb(userId: string): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (error) {
      console.warn("Could not fetch notifications from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    return data.map((n: any) => ({
      id: String(n.id),
      type: n.type || "path_progress_updated",
      title: n.title,
      message: n.message || "",
      createdAt: n.created_at || new Date().toISOString(),
      dismissed: !!n.read,
    }));
  } catch (err) {
    console.warn("Exception fetching notifications from Supabase:", err);
    return null;
  }
}

export async function insertNotificationToDb(userId: string, notif: any): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title: notif.title,
        message: notif.message || "",
        type: notif.type,
        read: !!notif.dismissed,
        created_at: notif.createdAt || new Date().toISOString(),
      });

    return !error;
  } catch (err) {
    return false;
  }
}

export async function markNotificationReadInDb(notificationId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId);

    return !error;
  } catch (err) {
    return false;
  }
}

/* ─── 6. MESSAGES ──────────────────────────────────────────────────────── */

export async function fetchMessagesFromDb(userId: string, mentorId?: number): Promise<any[] | null> {
  try {
    let query = supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (mentorId !== undefined) {
      query = query.eq("conversation_id", `conv_${userId}_${mentorId}`);
    }

    const { data, error } = await query;
    if (error) {
      console.warn("Could not fetch messages from Supabase:", error.message);
      return null;
    }
    return (data || []).map((m: any) => ({
      id: m.id,
      sender: m.sender || "user",
      text: m.body || m.text || "",
      sentAt: m.created_at,
      status: m.status,
    }));
  } catch (err) {
    console.warn("Exception fetching messages from Supabase:", err);
    return null;
  }
}

export async function sendMessageToDb(
  userId: string,
  mentorId: number,
  text: string,
  senderType: "user" | "mentor" = "user"
): Promise<boolean> {
  try {
    const conversationId = `conv_${userId}_${mentorId}`;
    const id = crypto.randomUUID();

    const { error } = await supabase
      .from("messages")
      .insert({
        id,
        conversation_id: conversationId,
        sender: senderType,
        body: text,
        status: "sent",
      });

    return !error;
  } catch (err) {
    console.warn("Exception sending message to Supabase:", err);
    return false;
  }
}

/* ─── 7. GROWTH PATH ENROLLMENTS & USER PROGRESS ────────────────────────── */

let pathCache: { slugToId: Map<string, string>; idToSlug: Map<string, string>; idToTitle: Map<string, string> } | null = null;

async function getPathMappings() {
  if (pathCache) return pathCache;
  const { data } = await supabase.from("growth_paths").select("id, slug, title");
  const slugToId = new Map<string, string>();
  const idToSlug = new Map<string, string>();
  const idToTitle = new Map<string, string>();

  (data || []).forEach((p: any) => {
    slugToId.set(p.slug, p.id);
    idToSlug.set(p.id, p.slug);
    idToTitle.set(p.id, p.title);
  });

  // Fallback defaults if DB is temporarily unreachable
  if (slugToId.size === 0) {
    const defaults = [
      ["coding", "53b8393c-a143-4acc-82c5-d2ee5dea7094", "Coding"],
      ["ai-ml", "397c63fd-c889-453a-9a06-ae89aa3d98c8", "AI & Machine Learning"],
      ["data-science", "37486550-8613-4572-971e-c88b4f7a4d42", "Data Science"],
      ["uiux", "0ff8ad35-e138-48eb-a671-d58a5c332897", "UI/UX Design"],
      ["webdev", "4364500b-81fe-4e21-b182-2e8dcf9718ae", "Web Development"],
      ["dsa", "7b2f3570-3b41-49ea-8376-1b07daabc8ca", "DSA"],
    ];
    defaults.forEach(([s, id, t]) => {
      slugToId.set(s, id);
      idToSlug.set(id, s);
      idToTitle.set(id, t);
    });
  }

  pathCache = { slugToId, idToSlug, idToTitle };
  return pathCache;
}

export async function fetchEnrollmentsFromDb(userId: string): Promise<Record<string, any> | null> {
  try {
    const mappings = await getPathMappings();

    // 1. Try path_enrollments first (in case it exists)
    const { data: enrollData, error: enrollError } = await supabase
      .from("path_enrollments")
      .select("*")
      .eq("user_id", userId);

    if (!enrollError && enrollData && enrollData.length > 0) {
      const record: Record<string, any> = {};
      for (const row of enrollData) {
        const pathKey = row.path_slug || row.path_id;
        record[pathKey] = {
          pathId: pathKey,
          mentorId: row.mentor_num ?? null,
          sessionSlot: row.session_slot ?? null,
          sessionAt: row.session_at ?? null,
          sessionDurationMin: row.session_duration_min || 45,
          sessionJoined: !!row.session_joined,
          focus: Array.isArray(row.focus) ? row.focus : [],
          level: row.level || "intermediate",
          weeklyTime: row.weekly_time || "30min",
          weekIndex: row.week_index || 0,
          tasks: Array.isArray(row.tasks) ? row.tasks : [],
          challenge: row.challenge || { label: "Complete week checkpoint", done: false },
          videoStage: row.video_stage || "start",
          videoProgress: row.video_progress || { pct: 0, elapsedMin: 0, totalMin: 20 },
          milestoneVideoWatched: !!row.milestone_video_watched,
          notes: row.notes || "",
          xp: row.xp || 0,
          streak: row.streak || 0,
          startedAt: row.started_at || new Date().toISOString(),
          lastActiveAt: row.last_active_at || new Date().toISOString(),
          sessionReflectionDone: false,
          completedAt: row.completed_at || null,
        };
      }
      return record;
    }

    // 2. Fallback to user_progress (live verified table)
    const { data: progData, error: progError } = await supabase
      .from("user_progress")
      .select("*")
      .eq("user_id", userId);

    if (progError || !progData || progData.length === 0) return null;

    const record: Record<string, any> = {};
    for (const row of progData) {
      const pathSlug = mappings.idToSlug.get(row.path_id) || row.path_id;
      let extra: any = {};
      try {
        if (row.video_stage && row.video_stage.startsWith("{")) {
          extra = JSON.parse(row.video_stage);
        }
      } catch {}

      record[pathSlug] = {
        pathId: pathSlug,
        mentorId: extra.mentorId ?? null,
        sessionSlot: extra.sessionSlot ?? null,
        sessionAt: extra.sessionAt ?? null,
        sessionDurationMin: extra.sessionDurationMin || 45,
        sessionJoined: !!extra.sessionJoined,
        focus: Array.isArray(extra.focus) ? extra.focus : [],
        level: extra.level || "intermediate",
        weeklyTime: extra.weeklyTime || "30min",
        weekIndex: typeof extra.weekIndex === "number" ? extra.weekIndex : 0,
        tasks: Array.isArray(extra.tasks) ? extra.tasks : [],
        challenge: extra.challenge || { label: "Complete week checkpoint", done: false },
        videoStage: extra.stage || (typeof row.video_stage === "string" && !row.video_stage.startsWith("{") ? row.video_stage : "start"),
        videoProgress: extra.videoProgress || { pct: 0, elapsedMin: 0, totalMin: 20 },
        milestoneVideoWatched: !!extra.milestoneVideoWatched,
        notes: extra.notes || "",
        xp: Number(row.xp) || 0,
        streak: Number(row.streak) || 0,
        startedAt: row.started_at || new Date().toISOString(),
        lastActiveAt: extra.lastActiveAt || row.started_at || new Date().toISOString(),
        sessionReflectionDone: !!extra.sessionReflectionDone,
        completedAt: row.completed_at || null,
      };
    }
    return record;
  } catch (err) {
    console.warn("Exception reading enrollments from Supabase:", err);
    return null;
  }
}

export async function saveEnrollmentToDb(userId: string, enrollment: any): Promise<boolean> {
  try {
    const mappings = await getPathMappings();
    const pathUuid = mappings.slugToId.get(enrollment.pathId) || enrollment.pathId;

    // 1. Try saving to path_enrollments
    const mentorUuid = enrollment.mentorId
      ? `00000000-0000-0000-0000-${String(enrollment.mentorId).padStart(12, "0")}`
      : null;

    const { error: enrollError } = await supabase
      .from("path_enrollments")
      .upsert(
        {
          user_id: userId,
          path_slug: enrollment.pathId,
          mentor_id: mentorUuid,
          mentor_num: enrollment.mentorId ?? null,
          session_slot: enrollment.sessionSlot,
          session_at: enrollment.sessionAt,
          session_duration_min: enrollment.sessionDurationMin || 45,
          session_joined: !!enrollment.sessionJoined,
          focus: enrollment.focus || [],
          level: enrollment.level || "intermediate",
          weekly_time: enrollment.weeklyTime || "30min",
          week_index: enrollment.weekIndex || 0,
          tasks: enrollment.tasks || [],
          challenge: enrollment.challenge || { label: "Complete checkpoint", done: false },
          video_stage: enrollment.videoStage || "start",
          video_progress: enrollment.videoProgress || { pct: 0, elapsedMin: 0, totalMin: 20 },
          milestone_video_watched: !!enrollment.milestoneVideoWatched,
          notes: enrollment.notes || "",
          xp: enrollment.xp || 0,
          streak: enrollment.streak || 0,
          last_active_at: new Date().toISOString(),
          completed_at: enrollment.completedAt || null,
        },
        { onConflict: "user_id,path_slug" }
      );

    if (!enrollError) return true;

    // 2. Persist to user_progress (live remote verified table)
    const extra = {
      stage: enrollment.videoStage || "start",
      weekIndex: enrollment.weekIndex || 0,
      tasks: enrollment.tasks || [],
      challenge: enrollment.challenge || { label: "Complete checkpoint", done: false },
      videoProgress: enrollment.videoProgress || { pct: 0, elapsedMin: 0, totalMin: 20 },
      milestoneVideoWatched: !!enrollment.milestoneVideoWatched,
      notes: enrollment.notes || "",
      mentorId: enrollment.mentorId ?? null,
      sessionSlot: enrollment.sessionSlot ?? null,
      sessionAt: enrollment.sessionAt ?? null,
      sessionDurationMin: enrollment.sessionDurationMin || 45,
      sessionJoined: !!enrollment.sessionJoined,
      focus: enrollment.focus || [],
      level: enrollment.level || "intermediate",
      weeklyTime: enrollment.weeklyTime || "30min",
      lastActiveAt: new Date().toISOString(),
    };

    // Check if progress already exists for (user_id, path_id)
    const { data: existing } = await supabase
      .from("user_progress")
      .select("id")
      .eq("user_id", userId)
      .eq("path_id", pathUuid)
      .maybeSingle();

    if (existing?.id) {
      const { error: updErr } = await supabase
        .from("user_progress")
        .update({
          xp: enrollment.xp || 0,
          streak: enrollment.streak || 0,
          completed_at: enrollment.completedAt || null,
          video_stage: JSON.stringify(extra),
        })
        .eq("id", existing.id);
      return !updErr;
    } else {
      const { error: insErr } = await supabase
        .from("user_progress")
        .insert({
          user_id: userId,
          path_id: pathUuid,
          xp: enrollment.xp || 0,
          streak: enrollment.streak || 0,
          started_at: enrollment.startedAt || new Date().toISOString(),
          completed_at: enrollment.completedAt || null,
          video_stage: JSON.stringify(extra),
        });
      return !insErr;
    }
  } catch (err) {
    console.warn("Exception saving enrollment to Supabase:", err);
    return false;
  }
}

/* ─── 8. SAVED ITEMS ───────────────────────────────────────────────────── */

export async function fetchSavedItemsFromDb(userId: string): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from("saved_items")
      .select("id, title, url, description, item_type, saved_at")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    if (error) {
      console.warn("Could not fetch saved items from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    return data.map((item: any) => {
      let meta: any = {};
      try {
        if (item.description && item.description.startsWith("{")) {
          meta = JSON.parse(item.description);
        }
      } catch {}

      return {
        id: meta.id || String(item.id),
        dbId: item.id,
        type: item.item_type || "Resource",
        title: item.title,
        desc: meta.desc !== undefined ? meta.desc : item.description || "",
        freshness: meta.freshness,
        url: item.url,
        mentorId: meta.mentorId,
        savedAt: item.saved_at || new Date().toISOString(),
      };
    });
  } catch (err) {
    console.warn("Exception fetching saved items from Supabase:", err);
    return null;
  }
}

export async function saveItemToDb(userId: string, item: any): Promise<boolean> {
  try {
    const descPayload = JSON.stringify({
      id: item.id,
      desc: item.desc || "",
      freshness: item.freshness,
      mentorId: item.mentorId,
    });

    const { error } = await supabase
      .from("saved_items")
      .insert({
        user_id: userId,
        title: item.title,
        url: item.url || `starfix://resource/${item.id}`,
        description: descPayload,
        item_type: item.type || "Resource",
        saved_at: item.savedAt || new Date().toISOString(),
      });

    if (error) {
      console.warn("Could not save item to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function removeSavedItemFromDb(userId: string, itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("saved_items")
      .delete()
      .eq("user_id", userId)
      .or(`description.ilike.%\"${itemId}\"%,url.ilike.%${itemId}%`);

    return !error;
  } catch (err) {
    return false;
  }
}

/* ─── 9. WATCH QUEUE ───────────────────────────────────────────────────── */

export async function fetchWatchQueueFromDb(userId: string): Promise<any[] | null> {
  try {
    const mappings = await getPathMappings();
    const { data, error } = await supabase
      .from("watch_queue")
      .select("id, path_id, video_url")
      .eq("user_id", userId);

    if (error) {
      console.warn("Could not fetch watch queue from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    const items: any[] = [];
    for (const row of data) {
      try {
        if (row.video_url && row.video_url.startsWith("{")) {
          const parsed = JSON.parse(row.video_url);
          const pathSlug = mappings.idToSlug.get(row.path_id) || parsed.pathId || "coding";
          const pathTitle = mappings.idToTitle.get(row.path_id) || parsed.pathTitle || "Growth Path";
          items.push({
            ...parsed,
            pathId: pathSlug,
            pathTitle,
            dbId: row.id,
          });
        }
      } catch {}
    }
    return items;
  } catch (err) {
    console.warn("Exception fetching watch queue from Supabase:", err);
    return null;
  }
}

export async function upsertWatchQueueToDb(userId: string, item: any): Promise<boolean> {
  try {
    const mappings = await getPathMappings();
    const pathUuid = mappings.slugToId.get(item.pathId) || item.pathId;

    // Check if this item is already in watch_queue
    const { data: existing } = await supabase
      .from("watch_queue")
      .select("id, video_url")
      .eq("user_id", userId)
      .eq("path_id", pathUuid);

    let matchId: string | null = null;
    if (existing) {
      for (const row of existing) {
        if (row.video_url && row.video_url.includes(item.id)) {
          matchId = row.id;
          break;
        }
      }
    }

    const payload = JSON.stringify(item);

    if (matchId) {
      const { error } = await supabase
        .from("watch_queue")
        .update({ video_url: payload })
        .eq("id", matchId);
      return !error;
    } else {
      const { error } = await supabase
        .from("watch_queue")
        .insert({
          user_id: userId,
          path_id: pathUuid,
          video_url: payload,
        });
      return !error;
    }
  } catch (err) {
    return false;
  }
}

export async function removeWatchQueueFromDb(userId: string, itemId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("watch_queue")
      .delete()
      .eq("user_id", userId)
      .ilike("video_url", `%"${itemId}"%`);

    return !error;
  } catch (err) {
    return false;
  }
}

/* ─── 10. XP & STREAK HYDRATION ────────────────────────────────────────── */

export async function fetchUserXpFromDb(userId: string): Promise<{ totalXp: number; log: any[] } | null> {
  try {
    const { data, error } = await supabase
      .from("xp_transactions")
      .select("id, amount, reason, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn("Could not fetch XP from Supabase:", error.message);
      return null;
    }
    if (!data) return null;

    const totalXp = data.reduce((sum: number, tx: any) => sum + (Number(tx.amount) || 0), 0);
    const log = data.map((tx: any) => ({
      id: String(tx.id),
      label: tx.reason || "XP reward",
      amount: Number(tx.amount) || 0,
      at: new Date(tx.created_at).getTime(),
    }));

    return { totalXp, log };
  } catch (err) {
    console.warn("Exception calculating XP from Supabase:", err);
    return null;
  }
}
