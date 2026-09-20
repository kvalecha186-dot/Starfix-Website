export interface UserProfile {
  name: string;
  email: string;
  goalId: string;
  goalTitle: string;
  level: "beginner" | "intermediate" | "advanced";
  dailyTime: string;
  preference: "mentorship" | "roadmap" | "community";
  obstacle?: string;
  /* Mirrors profiles.role in Supabase — the single source of truth for
     role-based routing/gating (Phase 1). Never trust a locally-cached
     copy of this for anything security-sensitive; always re-derive it
     from a fresh DB read when the decision actually matters (e.g. the
     /admin gate in App.tsx re-fetches rather than reusing this). */
  role?: "student" | "mentor" | "admin";
  // Collected during onboarding, before the learner ever reaches the
  // dashboard. Used purely for content curation — which real creators get
  // recommended for each Growth Path milestone (see lib/curatedContent.ts).
  country?: string;
  learningLanguage?: "English" | "Hindi" | "Both";
  /* New multi-select preference (max 2) — the field Settings → Account now
     writes to. `learningLanguage` above is kept in sync automatically so
     the existing curated-content ranking engine (lib/curatedContent.ts)
     keeps working without every call site needing to change. */
  learningLanguages?: string[];
  /* Set from Settings → Learning Identity. Used by DashboardHome to decide
     whether the mentor session card or the today's-mission/video block
     gets top billing, and can inform future recommendation ranking. */
  learningStyle?: "video-first" | "mentor-first" | "practice-first";
  careerGoal?: string;
  // Set from Settings → Account → Profile photo. A small data URL is fine
  // for a client-only demo; a real backend would upload to storage instead.
  avatarDataUrl?: string;
}

/* Reads the persisted profile straight from localStorage. Several
   standalone routes (MyPathWorkspace, PathOverviewPage, ActivationPage,
   ...) sit outside <DashboardLayout> and never receive `userProfile` as a
   prop, so this mirrors the same localStorage key App.tsx already owns
   rather than requiring a prop-drilled copy everywhere. */
export function getStoredUserProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("userProfile");
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export const GOAL_META: Record<string, {
  title: string;
  color: string;
  timeline: string;
  mentor: { name: string; role: string; initials: string; color: string };
  dailyPlan: string[];
  milestone: string;
  categoryTab: string;
}> = {
  coding: {
    title: "Coding & Development",
    color: "#6366F1",
    timeline: "3–6 months",
    mentor: { name: "Sofia Torres", role: "Software Engineer · Stripe", initials: "ST", color: "#A78BFA" },
    dailyPlan: [
      "Practice Python fundamentals (30 min)",
      "Watch: Clean Code series (20 min)",
      "Build a small daily project (10 min)",
    ],
    milestone: "Build your first full-stack web app",
    categoryTab: "Coding",
  },
  ai: {
    title: "AI & Machine Learning",
    color: "#8B5CF6",
    timeline: "4–8 months",
    mentor: { name: "Aria Chen", role: "ML Engineer · Google", initials: "AC", color: "#6366F1" },
    dailyPlan: [
      "Math foundations — linear algebra (30 min)",
      "Python ML libraries practice (20 min)",
      "Read: Paper of the week (10 min)",
    ],
    milestone: "Train your first neural network from scratch",
    categoryTab: "AI/ML",
  },
  uiux: {
    title: "UI/UX Design",
    color: "#EC4899",
    timeline: "3–5 months",
    mentor: { name: "Priya Sharma", role: "Lead UX Designer · Figma", initials: "PS", color: "#20B2AA" },
    dailyPlan: [
      "Daily Figma practice — replicate a UI (30 min)",
      "Study design principles (20 min)",
      "Critique 3 apps you use (10 min)",
    ],
    milestone: "Complete your first end-to-end product case study",
    categoryTab: "UI/UX",
  },
  finance: {
    title: "Finance & Investing",
    color: "#10B981",
    timeline: "4–6 months",
    mentor: { name: "Daniel Park", role: "Certified Financial Planner · Fidelity", initials: "DP", color: "#F4A261" },
    dailyPlan: [
      "Read financial news — curated feed (15 min)",
      "Track your portfolio metrics (15 min)",
      "Study: Investing concept of the week (30 min)",
    ],
    milestone: "Build and execute your first investment portfolio",
    categoryTab: "Finance",
  },
  comms: {
    title: "Communication & Leadership",
    color: "#F59E0B",
    timeline: "2–4 months",
    mentor: { name: "Kenji Nakamura", role: "TEDx Speaker & Executive Coach", initials: "KN", color: "#38BDF8" },
    dailyPlan: [
      "Mirror speaking exercise (15 min)",
      "Read: Storytelling framework (15 min)",
      "Record & review yourself talking (10 min)",
    ],
    milestone: "Deliver your first confident public presentation",
    categoryTab: "Communication",
  },
  startup: {
    title: "Entrepreneurship",
    color: "#F97316",
    timeline: "Ongoing journey",
    mentor: { name: "Marcus Webb", role: "Growth Coach · a16z Portfolio", initials: "MW", color: "#E85D75" },
    dailyPlan: [
      "Customer discovery or research (30 min)",
      "Work on your MVP or core product (30 min)",
      "Founder / investor reading (15 min)",
    ],
    milestone: "Launch your MVP and acquire your first 10 users",
    categoryTab: "Entrepreneurship",
  },
};
