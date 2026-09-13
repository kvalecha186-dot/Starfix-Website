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

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, country, learning_language, career_goal")
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

  return {
    name: data.full_name || localProfile.name || "Starfix Learner",
    email: data.email || localProfile.email || "",
    goalId: localProfile.goalId || "coding",
    goalTitle: localProfile.goalTitle || "Coding & Development",
    level: localProfile.level || "beginner",
    dailyTime: localProfile.dailyTime || "30min",
    preference: localProfile.preference || "roadmap",
    obstacle: localProfile.obstacle,
    country: data.country || localProfile.country,
    learningLanguage: (data.learning_language as UserProfile["learningLanguage"]) || localProfile.learningLanguage,
    learningLanguages: localProfile.learningLanguages,
    learningStyle: localProfile.learningStyle,
    careerGoal: data.career_goal || localProfile.careerGoal,
    avatarDataUrl: localProfile.avatarDataUrl,
  };
}

export async function upsertProfile(userId: string, patch: Partial<UserProfile>) {
  const payload = {
    id: userId,
    full_name: patch.name,
    email: patch.email,
    country: patch.country,
    learning_language: patch.learningLanguage,
    career_goal: patch.careerGoal,
    avatar_url: patch.avatarDataUrl,
  };

  const { error } = await supabase.from("profiles").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error("Starfix profile save failed:", error.message);
    return false;
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
