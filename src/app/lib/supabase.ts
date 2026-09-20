import { createClient } from "@supabase/supabase-js";
import type { UserProfile } from "../types";

/**
 * Starfix Supabase client.
 *
 * Only the publishable/anon key belongs in the browser. Never put a
 * service_role key in this file or in Vercel client-side environment vars.
 * The fallback values make the current Vercel deployment work immediately;
 * VITE_* values can override them later without changing source code.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://mndyaxvkjzzgyvfrxgvm.supabase.co";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_oSRryTseVP0tCs0kSTeWCQ_wG1ydebQ";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export async function isGoogleOAuthEnabled(): Promise<boolean> {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: SUPABASE_KEY },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.external?.google;
  } catch {
    return false;
  }
}

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, bio, role, country, learning_language, learning_languages, learning_style, career_goal, goal_id, goal_title, level, daily_time, preference, obstacle")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Starfix profile load failed:", error.message);
    return null;
  }
  if (!data) return null;
  const local = typeof window !== "undefined" ? window.localStorage.getItem("userProfile") : null;
  let localProfile: Partial<UserProfile> = {};
  try { localProfile = local ? JSON.parse(local) : {}; } catch { /* ignore malformed legacy data */ }

  const profile: UserProfile = {
    name: data.full_name || localProfile.name || "Starfix Learner",
    email: data.email || localProfile.email || "",
    goalId: data.goal_id || localProfile.goalId || "coding",
    goalTitle: data.goal_title || localProfile.goalTitle || "Coding & Development",
    level: (data.level as UserProfile["level"]) || localProfile.level || "beginner",
    dailyTime: data.daily_time || localProfile.dailyTime || "30min",
    preference: (data.preference as UserProfile["preference"]) || localProfile.preference || "roadmap",
    obstacle: data.obstacle || localProfile.obstacle,
    role: (data.role as UserProfile["role"]) || localProfile.role || "student",
    country: data.country || localProfile.country || "India",
    learningLanguage: (data.learning_language as UserProfile["learningLanguage"]) || localProfile.learningLanguage || "English",
    learningLanguages: data.learning_languages || localProfile.learningLanguages || ["English"],
    learningStyle: (data.learning_style as UserProfile["learningStyle"]) || localProfile.learningStyle || "practice-first",
    careerGoal: data.career_goal || localProfile.careerGoal,
    avatarDataUrl: data.avatar_url || localProfile.avatarDataUrl,
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem("userProfile", JSON.stringify(profile));
  }

  return profile;
}

export async function upsertProfile(userId: string, patch: Partial<UserProfile>) {
  const payload: Record<string, any> = {
    id: userId,
    updated_at: new Date().toISOString(),
  };

  if (patch.name !== undefined) payload.full_name = patch.name;
  if (patch.email !== undefined) payload.email = patch.email;
  if (patch.country !== undefined) payload.country = patch.country;
  if (patch.learningLanguage !== undefined) payload.learning_language = patch.learningLanguage;
  if (patch.learningLanguages !== undefined) payload.learning_languages = patch.learningLanguages;
  if (patch.learningStyle !== undefined) payload.learning_style = patch.learningStyle;
  if (patch.careerGoal !== undefined) payload.career_goal = patch.careerGoal;
  if (patch.goalId !== undefined) payload.goal_id = patch.goalId;
  if (patch.goalTitle !== undefined) payload.goal_title = patch.goalTitle;
  if (patch.level !== undefined) payload.level = patch.level;
  if (patch.dailyTime !== undefined) payload.daily_time = patch.dailyTime;
  if (patch.preference !== undefined) payload.preference = patch.preference;
  if (patch.obstacle !== undefined) payload.obstacle = patch.obstacle;
  if (patch.role !== undefined) payload.role = patch.role;
  if (patch.avatarDataUrl !== undefined) payload.avatar_url = patch.avatarDataUrl;

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("Starfix profile save failed:", error.message);
    return false;
  }

  if (typeof window !== "undefined") {
    const existing = window.localStorage.getItem("userProfile");
    let current = {};
    try { current = existing ? JSON.parse(existing) : {}; } catch {}
    window.localStorage.setItem("userProfile", JSON.stringify({ ...current, ...patch }));
  }

  return true;
}

export function toAuthProfile(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadata = user.user_metadata || {};
  return {
    name: String(metadata.full_name || metadata.name || user.email?.split("@")[0] || "Starfix Learner"),
    email: user.email || "",
  };
}

/* Fast, minimal, side-effect-free role check — used anywhere a routing
   decision (admin gate, mentor vs student dashboard) needs to be
   verified against the real database rather than a cached/local value.
   Deliberately does NOT touch localStorage the way getProfile() does. */
export async function fetchUserRole(userId: string): Promise<UserProfile["role"]> {
  const { data, error } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  if (error || !data) return "student";
  return (data.role as UserProfile["role"]) || "student";
}

/* Mentor onboarding calls this once, at the end of the 4-step flow.
   "Claim" flow: if a seeded catalog mentor row exists with this email
   and no owner yet (profile_id is null), attach this new account to it
   instead of creating a duplicate listing — otherwise insert a fresh row.
   Never deletes or overwrites the 10 original catalog rows' identity;
   only fills in profile_id + the fields collected during onboarding. */
export async function claimOrCreateMentorProfile(
  userId: string,
  fields: {
    name: string; email: string; phone?: string; location?: string;
    languages?: string[]; headline?: string; company?: string;
    yearsExperience?: number; category?: string; skills?: string[];
    education?: string; linkedinUrl?: string; bio?: string;
    mentoringApproach?: string; offersFreeIntro?: boolean;
  }
): Promise<{ mentorId: string } | null> {
  const patch = {
    profile_id: userId,
    name: fields.name,
    email: fields.email,
    phone: fields.phone ?? null,
    location: fields.location ?? null,
    languages: fields.languages ?? [],
    headline: fields.headline ?? null,
    company: fields.company ?? null,
    years_experience: fields.yearsExperience ?? null,
    category: fields.category ?? null,
    skills: fields.skills ?? [],
    education: fields.education ?? null,
    linkedin_url: fields.linkedinUrl ?? null,
    bio: fields.bio ?? null,
    mentoring_approach: fields.mentoringApproach ?? null,
    offers_free_intro: fields.offersFreeIntro ?? false,
    onboarding_completed: true,
  };

  const { data: existing } = await supabase
    .from("mentors")
    .select("id")
    .is("profile_id", null)
    .eq("email", fields.email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("mentors").update(patch).eq("id", existing.id);
    if (error) { console.error("Starfix mentor claim failed:", error.message); return null; }
    return { mentorId: existing.id };
  }

  const { data: created, error } = await supabase.from("mentors").insert(patch).select("id").single();
  if (error) { console.error("Starfix mentor create failed:", error.message); return null; }
  return { mentorId: created.id };
}
