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

export async function fetchNotificationsFromDb(userId: string): Promise<any[] | null> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.warn("Could not fetch notifications from Supabase:", error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Exception fetching notifications from Supabase:", err);
    return null;
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

/* ─── 7. PATH ENROLLMENTS ─────────────────────────────────────────────── */

export async function fetchEnrollmentsFromDb(userId: string): Promise<Record<string, any> | null> {
  try {
    const { data, error } = await supabase
      .from("path_enrollments")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      // Table may not be created yet in remote Supabase
      return null;
    }
    if (!data || data.length === 0) return null;

    const record: Record<string, any> = {};
    for (const row of data) {
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
  } catch (err) {
    console.warn("Exception reading enrollments from Supabase:", err);
    return null;
  }
}

export async function saveEnrollmentToDb(userId: string, enrollment: any): Promise<boolean> {
  try {
    const mentorUuid = enrollment.mentorId
      ? `00000000-0000-0000-0000-${String(enrollment.mentorId).padStart(12, "0")}`
      : null;

    const { error } = await supabase
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

    if (error) {
      console.warn("Could not save enrollment to Supabase:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("Exception saving enrollment to Supabase:", err);
    return false;
  }
}
