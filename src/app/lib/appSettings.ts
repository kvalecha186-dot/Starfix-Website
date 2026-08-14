/* ─────────────────────────────────────────────────────────────────────────
   App settings store — every learning/privacy/session preference that
   isn't already part of UserProfile (name, country, learningLanguage live
   there and are edited via onUpdateProfile). Backed by localStorage, same
   pattern as pathProgress.ts / notifications.ts: self-validating reads,
   single change event so the Settings page and anything else that cares
   can stay in sync without prop drilling.
───────────────────────────────────────────────────────────────────────── */

export const APP_SETTINGS_CHANGED_EVENT = "starfix:appsettings-changed";
const STORAGE_KEY = "starfix:appSettings";

export type ContentSource = "indian" | "international" | "both";
export type ContentLevel = "beginner" | "intermediate" | "advanced";
export type SessionReminderLead = "10" | "30" | "60";

export interface AppSettings {
  // Learning Experience
  autoplayNextVideo: boolean;
  showSubtitles: boolean;
  dailyReminderNotifications: boolean;
  weeklyProgressEmail: boolean;
  focusMode: boolean;
  // Content Preferences
  contentSource: ContentSource;
  contentLevel: ContentLevel;
  // Mentor & Session Settings
  sessionReminderLead: SessionReminderLead;
  timeZone: string;
  // Privacy — personal progress, mentor access, and notifications only.
  // Starfix has no public profile, followers, or social visibility of any
  // kind, so every field here controls something the learner or their own
  // mentor sees — never a stranger or a feed.
  showCompletedPaths: boolean;
  showStreaks: boolean;
  showSavedResources: boolean;
  mentorViewProgress: boolean;
  mentorViewCompletedTasks: boolean;
  shareWeeklySummaryWithMentors: boolean;
  privacyLearningReminders: boolean;
  privacySessionReminders: boolean;
  privacyAchievementNotifications: boolean;
}

function defaultTimeZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; } catch { return "UTC"; }
}

export function defaultSettings(): AppSettings {
  return {
    autoplayNextVideo: true,
    showSubtitles: true,
    dailyReminderNotifications: true,
    weeklyProgressEmail: false,
    focusMode: false,
    contentSource: "both",
    contentLevel: "beginner",
    sessionReminderLead: "10",
    timeZone: defaultTimeZone(),
    showCompletedPaths: true,
    showStreaks: true,
    showSavedResources: false,
    mentorViewProgress: true,
    mentorViewCompletedTasks: true,
    shareWeeklySummaryWithMentors: false,
    privacyLearningReminders: true,
    privacySessionReminders: true,
    privacyAchievementNotifications: true,
  };
}

function isValid(v: any): v is AppSettings {
  return v && typeof v === "object" &&
    typeof v.autoplayNextVideo === "boolean" &&
    typeof v.showSubtitles === "boolean" &&
    typeof v.dailyReminderNotifications === "boolean" &&
    typeof v.weeklyProgressEmail === "boolean" &&
    typeof v.focusMode === "boolean" &&
    typeof v.contentSource === "string" &&
    typeof v.contentLevel === "string" &&
    typeof v.sessionReminderLead === "string" &&
    typeof v.timeZone === "string" &&
    typeof v.showCompletedPaths === "boolean" &&
    typeof v.showStreaks === "boolean" &&
    typeof v.showSavedResources === "boolean" &&
    typeof v.mentorViewProgress === "boolean" &&
    typeof v.mentorViewCompletedTasks === "boolean" &&
    typeof v.shareWeeklySummaryWithMentors === "boolean" &&
    typeof v.privacyLearningReminders === "boolean" &&
    typeof v.privacySessionReminders === "boolean" &&
    typeof v.privacyAchievementNotifications === "boolean";
}

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return isValid(parsed) ? parsed : defaultSettings();
  } catch {
    return defaultSettings();
  }
}

function writeSettings(next: AppSettings) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(APP_SETTINGS_CHANGED_EVENT));
}

export function updateSettings(patch: Partial<AppSettings>): AppSettings {
  const next = { ...getSettings(), ...patch };
  writeSettings(next);
  return next;
}

/* "Reset learning recommendations" (Data & Storage) — resets only the
   content-curation preferences back to their defaults, so the next set of
   recommendations is recomputed fresh. Deliberately does NOT touch active
   Growth Path enrollments or progress — a settings toggle should never be
   able to silently erase a learner's actual journey. */
export function resetRecommendationPreferences(): AppSettings {
  return updateSettings({
    contentSource: "both",
    contentLevel: "beginner",
  });
}
