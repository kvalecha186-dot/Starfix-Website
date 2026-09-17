import type { PathDef } from "../dashboard/pages/GoalsPage";
import { addNotification } from "./notifications";
import { addXp, addTaskXp, undoTaskXp, XP_SOURCES } from "./xpSystem";
import { supabase } from "./supabase";
import { fetchEnrollmentsFromDb, saveEnrollmentToDb } from "./supabaseDb";

/* ─────────────────────────────────────────────────────────────────────────
   Enrollment store — single source of truth for "has this learner started
   this Growth Path, and how far have they gotten". Backed by localStorage
   so it survives refreshes without a backend. Every write fires
   ENROLLMENTS_CHANGED_EVENT so any mounted page (Dashboard, Profile,
   GoalsPage, PathOverview, MyPathWorkspace, mentor pages, ...) can re-read
   state without prop drilling.

   Mentors are never auto-assigned. enroll() always starts a path with
   mentorId: null; the workspace prompts the learner to choose one via the
   dedicated /paths/:pathId/mentors flow, which calls assignMentor().
───────────────────────────────────────────────────────────────────────── */

export const ENROLLMENTS_CHANGED_EVENT = "starfix:enrollments-changed";
const STORAGE_KEY = "starfix:enrollments";

export type VideoStage = "start" | "deeper" | "practice" | "community";
const STAGES: VideoStage[] = ["start", "deeper", "practice", "community"];

export interface EnrollmentTask {
  id: string;
  label: string;
  done: boolean;
}

export interface VideoProgress {
  pct: number;        // 0–100, how far into the current resume video
  elapsedMin: number;
  totalMin: number;
}

export interface Enrollment {
  pathId: string;
  mentorId: number | null;
  sessionSlot: string | null;   // display text, e.g. "Mon, Aug 11 · 4:00 PM"
  sessionAt: string | null;     // real ISO datetime the session goes live, set on assignMentor
  sessionDurationMin: number;   // session length — drives the upcoming/live/ended window
  sessionJoined: boolean;       // true once the learner has actually clicked Join Session
  focus: string[];
  level: "beginner" | "intermediate" | "advanced";
  weeklyTime: string;
  weekIndex: number;
  tasks: EnrollmentTask[];
  challenge: { label: string; done: boolean };
  videoStage: VideoStage;
  videoProgress: VideoProgress;
  milestoneVideoWatched: boolean; // curated milestone video marked watched (resets each new milestone)
  notes: string;
  xp: number;
  streak: number;
  startedAt: string;
  lastActiveAt: string;
  sessionReflectionDone: boolean; // "mark reflection complete" after a session ends
  completedAt: string | null;      // set once every module + the final week is done
}

function isValidEnrollment(e: any): e is Enrollment {
  return (
    e && typeof e === "object" &&
    typeof e.pathId === "string" &&
    Array.isArray(e.focus) &&
    Array.isArray(e.tasks) &&
    e.challenge && typeof e.challenge.label === "string" &&
    e.videoProgress && typeof e.videoProgress.pct === "number" &&
    typeof e.videoProgress.elapsedMin === "number" && typeof e.videoProgress.totalMin === "number" &&
    typeof e.weekIndex === "number" &&
    typeof e.xp === "number" &&
    typeof e.streak === "number"
  );
}

function readAll(): Record<string, Enrollment> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, Enrollment>) : {};
    // Backfill fields added after some enrollments were already saved, so
    // older localStorage data never crashes the session-status logic.
    let droppedAny = false;
    for (const key of Object.keys(parsed)) {
      const e = parsed[key] as Enrollment;
      if (e.sessionAt === undefined) e.sessionAt = null;
      if (e.sessionDurationMin === undefined) e.sessionDurationMin = 45;
      if (e.sessionJoined === undefined) e.sessionJoined = false;
      if (e.sessionReflectionDone === undefined) e.sessionReflectionDone = false;
      if (e.completedAt === undefined) e.completedAt = null;
      if (e.milestoneVideoWatched === undefined) e.milestoneVideoWatched = false;
      // Data saved under an earlier, incompatible shape (e.g. focus as a
      // single string, no videoProgress/challenge.label) can't be safely
      // patched field-by-field — discard it rather than let it crash every
      // page that reads enrollments. The learner just re-enrolls, which
      // takes seconds; a permanently blank app does not recover on its own.
      if (!isValidEnrollment(e)) {
        delete parsed[key];
        droppedAny = true;
      }
    }
    if (droppedAny) {
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed)); } catch { /* ignore */ }
    }
    return parsed;
  } catch {
    return {};
  }
}

function writeAll(data: Record<string, Enrollment>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  window.dispatchEvent(new Event(ENROLLMENTS_CHANGED_EVENT));

  // Asynchronously persist active enrollments to Supabase
  supabase.auth.getSession().then(({ data: { session } }) => {
    if (session?.user) {
      for (const e of Object.values(data)) {
        saveEnrollmentToDb(session.user.id, e).catch(() => {});
      }
    }
  });
}

/* Sync all enrollments from Supabase on sign-in or reload */
export async function syncEnrollmentsFromDb(): Promise<Record<string, Enrollment>> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return readAll();

    const remote = await fetchEnrollmentsFromDb(session.user.id);
    if (remote && Object.keys(remote).length > 0) {
      const local = readAll();
      const merged = { ...local, ...remote };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        window.dispatchEvent(new Event(ENROLLMENTS_CHANGED_EVENT));
      }
      return merged;
    }
  } catch (err) {
    console.warn("Could not sync enrollments from Supabase:", err);
  }
  return readAll();
}

export function isEnrolled(pathId: string): boolean {
  return !!readAll()[pathId];
}

export function getEnrollment(pathId: string): Enrollment | undefined {
  return readAll()[pathId];
}

/* Every currently active path, most-recently-active first — the feed used
   by Dashboard's "Resume Your Flow" carousel and Profile's path summary. */
export function getAllEnrollments(): Enrollment[] {
  return Object.values(readAll()).sort(
    (a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime()
  );
}

function tasksForWeek(p: PathDef, weekIndex: number): EnrollmentTask[] {
  const mod = p.modules[weekIndex] ?? p.modules[p.modules.length - 1];
  return [
    { id: `w${weekIndex}-learn`, label: `Learn the core concepts of ${mod.toLowerCase()}`, done: false },
    { id: `w${weekIndex}-practice`, label: `Complete a hands-on ${mod.toLowerCase()} exercise`, done: false },
    { id: `w${weekIndex}-apply`, label: `Apply it to a small real task in ${p.title.toLowerCase()}`, done: false },
  ];
}

function challengeForWeek(p: PathDef, weekIndex: number) {
  const mod = p.modules[weekIndex] ?? p.modules[p.modules.length - 1];
  return { label: `Ship one real outcome from ${mod.toLowerCase()} this week.`, done: false };
}

function parseDurationMin(duration: string): number {
  const match = duration.match(/(\d+)/);
  return match ? Math.max(5, parseInt(match[1], 10)) : 15;
}

function freshVideoProgress(totalMin: number): VideoProgress {
  return { pct: 0, elapsedMin: 0, totalMin };
}

/* Called by ActivationPage once a learner completes activation. Creates a
   brand-new Enrollment at week 0, with NO mentor assigned yet. */
export function enroll(
  p: PathDef,
  options: { focus: string[]; level: Enrollment["level"]; weeklyTime: string },
  startVideoMin = 15
): Enrollment {
  const all = readAll();
  const now = new Date().toISOString();
  const enrollment: Enrollment = {
    pathId: p.id,
    mentorId: null,
    sessionSlot: null,
    sessionAt: null,
    sessionDurationMin: 45,
    sessionJoined: false,
    focus: options.focus,
    level: options.level,
    weeklyTime: options.weeklyTime,
    weekIndex: 0,
    tasks: tasksForWeek(p, 0),
    challenge: challengeForWeek(p, 0),
    videoStage: "start",
    videoProgress: freshVideoProgress(startVideoMin),
    notes: "",
    xp: 0,
    streak: 1,
    startedAt: now,
    lastActiveAt: now,
    sessionReflectionDone: false,
    completedAt: null,
  };
  all[p.id] = enrollment;
  writeAll(all);

  // A short while after starting, let the learner know their workspace is
  // stocked — mirrors scheduleMentorWelcomeReply's pattern of a one-time,
  // slightly-delayed notification rather than an instant wall of alerts.
  if (typeof window !== "undefined") {
    window.setTimeout(() => {
      addNotification(
        "new_resource_added",
        "New resources added",
        `3 new resources added to ${p.title}.`,
        `new_resource_added:${p.id}:start`,
        p.id
      );
    }, 6000);
  }

  return enrollment;
}

/* ── Mentor selection (item 3/4/5/6 — never auto-assigned) ─────────────── */

/* Turns a display date bucket ("Today" / "Tomorrow" / "This week" /
   "Next week" / "Thu, Feb 6") plus a time string (with or without a
   leading weekday, e.g. "4:00 PM" or "Tue 5:00 PM") into a real Date —
   this is what lets the Join Session button transition automatically
   from upcoming → live → ended in real time. */
function parseSlotToDate(dateLabel: string, timeLabel: string): Date {
  const now = new Date();
  const result = new Date(now);
  result.setSeconds(0, 0);

  const lower = dateLabel.trim().toLowerCase();
  if (lower === "today") {
    // keep result on today
  } else if (lower === "tomorrow") {
    result.setDate(result.getDate() + 1);
  } else if (lower === "this week") {
    result.setDate(result.getDate() + 2);
  } else if (lower === "next week") {
    result.setDate(result.getDate() + 9);
  } else {
    // "Thu, Feb 6" style — parse the "Mon D" part, ignore the weekday
    const monthDay = dateLabel.split(",").pop()?.trim() ?? "";
    const parsed = new Date(`${monthDay} ${now.getFullYear()}`);
    if (!isNaN(parsed.getTime())) {
      if (parsed.getTime() < now.getTime() - 86400000) parsed.setFullYear(parsed.getFullYear() + 1);
      result.setFullYear(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    } else {
      result.setDate(result.getDate() + 3);
    }
  }

  const timeMatch = timeLabel.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (timeMatch) {
    let hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);
    const meridiem = timeMatch[3].toUpperCase();
    if (meridiem === "PM" && hour !== 12) hour += 12;
    if (meridiem === "AM" && hour === 12) hour = 0;
    result.setHours(hour, minute, 0, 0);
  } else {
    result.setHours(16, 0, 0, 0); // sensible fallback: 4:00 PM
  }
  return result;
}

export function assignMentor(pathId: string, mentorId: number, dateLabel: string, timeLabel: string, durationMin = 45) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  e.mentorId = mentorId;
  e.sessionSlot = `${dateLabel} · ${timeLabel}`;
  e.sessionAt = parseSlotToDate(dateLabel, timeLabel).toISOString();
  e.sessionDurationMin = durationMin;
  e.sessionJoined = false;
  e.sessionReflectionDone = false;
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* ── Live session state (item 1 — Join Session behavior) ────────────────── */

// "scheduled"      — booked, more than 10 minutes out
// "starting_soon"  — within 10 minutes of the start time
// "live"           — between start and start+duration
// "completed"      — past the end time
export type SessionStatus = "none" | "scheduled" | "starting_soon" | "live" | "completed";

const REMINDER_WINDOW_MIN = 10;

export function getSessionStatus(e: Pick<Enrollment, "mentorId" | "sessionAt" | "sessionDurationMin">): SessionStatus {
  if (!e.mentorId || !e.sessionAt) return "none";
  const start = new Date(e.sessionAt).getTime();
  const end = start + (e.sessionDurationMin || 45) * 60000;
  const now = Date.now();
  if (now < start - REMINDER_WINDOW_MIN * 60000) return "scheduled";
  if (now < start) return "starting_soon";
  if (now <= end) return "live";
  return "completed";
}

/* Minutes remaining until the session starts (never negative). Used to
   drive the live countdown shown before a session goes live. */
export function minutesUntilSession(sessionAt: string): number {
  return Math.max(0, Math.round((new Date(sessionAt).getTime() - Date.now()) / 60000));
}

/* Human countdown for the Scheduled state — "1h 30m remaining" / "45m
   remaining" — recomputed on every render, never stored. */
export function formatCountdown(sessionAt: string): string {
  const totalMin = minutesUntilSession(sessionAt);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}m remaining`;
  return `${m}m remaining`;
}

/* A stable, live WebRTC video meeting room powered by Jitsi Meet.
   Works instantly in the browser with HD video, audio, screen sharing,
   and in-meeting chat with zero configuration. */
export function meetingUrlFor(pathId: string, mentorName: string): string {
  const room = `${pathId}-${mentorName}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `https://meet.jit.si/starfix-${room}#config.prejoinPageEnabled=false&config.startWithAudioMuted=false`;
}

/* Google Calendar "add event" deep link for the Scheduled state's
   secondary action — opens in a new tab, never navigates the app away. */
export function calendarUrlFor(pathId: string, pathTitle: string, mentorName: string, sessionAt: string, durationMin: number): string {
  const start = new Date(sessionAt);
  const end = new Date(start.getTime() + durationMin * 60000);
  const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${pathTitle} mentor session with ${mentorName}`,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: `Starfix mentor session for your ${pathTitle} Growth Path.`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* Called once, right when the learner presses the glowing Join Session
   button while the session is live — never redirects, just records that
   they actually joined and awards attendance XP. The caller is
   responsible for opening the meeting link (meetingUrlFor) in a new tab. */
export function joinSession(pathId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  if (!e.sessionJoined) {
    e.sessionJoined = true;
    e.xp += 25;
    addXp(25, "Session attendance");
  }
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* Once, after a session ends, the learner can mark their reflection done —
   this is what "Award XP for attendance" completes into: attendance XP
   lands on join, reflection XP lands here. */
export function completeSessionReflection(pathId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e || e.sessionReflectionDone) return;
  e.sessionReflectionDone = true;
  e.xp += 30;
  addXp(30, "Session reflection");
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* Checks every active enrollment for a session that just went live and
   hasn't been announced yet, firing exactly one "session_started"
   notification per session. Safe to call on an interval. */
export function checkSessionStartedNotifications() {
  const all = readAll();
  for (const e of Object.values(all)) {
    if (getSessionStatus(e) === "live" && e.sessionAt) {
      addNotification(
        "session_started",
        "Session started",
        "Your mentor session is live now.",
        `session_started:${e.pathId}:${e.sessionAt}`,
        e.pathId
      );
    }
  }
}

/* Checks every active enrollment for a session entering its 10-minute
   reminder window, firing exactly one "session_reminder" notification
   per session. Needs the mentor's name, so it's supplied by the caller
   (who has access to the MENTORS list) rather than imported here. */
export function checkSessionReminderNotifications(mentorNameFor: (mentorId: number) => string | undefined) {
  const all = readAll();
  for (const e of Object.values(all)) {
    if (getSessionStatus(e) === "starting_soon" && e.sessionAt && e.mentorId != null) {
      const name = mentorNameFor(e.mentorId) ?? "your mentor";
      addNotification(
        "session_reminder",
        "Session starting soon",
        `Your session with ${name} starts in ${minutesUntilSession(e.sessionAt)} minutes.`,
        `session_reminder:${e.pathId}:${e.sessionAt}`,
        e.pathId
      );
    }
  }
}

export function clearMentor(pathId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  e.mentorId = null;
  e.sessionSlot = null;
  e.sessionAt = null;
  e.sessionJoined = false;
  writeAll(all);
}

/* ── Tasks + weekly challenge ───────────────────────────────────────────── */

export function toggleTask(pathId: string, taskId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  const task = e.tasks.find((t) => t.id === taskId);
  if (!task) return;
  task.done = !task.done;
  if (task.done) {
    e.xp += XP_SOURCES.actionTask;
    // Task XP is a two-stage reward: it lands in todayXp (pending) now
    // and auto-settles into the permanent totalXp after 6 hours — see
    // xpSystem.ts. Keyed per task so unchecking removes exactly this
    // task's XP, whether it's still pending or has already settled.
    addTaskXp(`pathtask:${pathId}:${taskId}`, XP_SOURCES.actionTask);
    // "Completed early" — hours remaining before the day's plan is due
    // (midnight). A genuinely useful, non-fabricated measure of how far
    // ahead of schedule the learner is working.
    const now = new Date();
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999);
    const hoursEarly = Math.max(1, Math.round((endOfDay.getTime() - now.getTime()) / 3600000));
    addNotification(
      "task_completed_early",
      "Task completed early",
      `You completed "${task.label}" ${hoursEarly} hour${hoursEarly === 1 ? "" : "s"} early. +${XP_SOURCES.actionTask} XP awarded.`,
      undefined,
      pathId
    );
  } else {
    e.xp = Math.max(0, e.xp - XP_SOURCES.actionTask);
    undoTaskXp(`pathtask:${pathId}:${taskId}`);
  }
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

export function toggleChallenge(pathId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  e.challenge.done = !e.challenge.done;
  if (e.challenge.done) {
    e.xp += XP_SOURCES.weeklyChallenge;
    addXp(XP_SOURCES.weeklyChallenge, "Weekly challenge");
    addNotification(
      "weekly_challenge_completed",
      "Weekly challenge completed",
      `You finished this week's challenge. +${XP_SOURCES.weeklyChallenge} XP awarded.`,
      undefined,
      pathId
    );
  } else {
    e.xp = Math.max(0, e.xp - XP_SOURCES.weeklyChallenge);
    addXp(-XP_SOURCES.weeklyChallenge, "Weekly challenge undone");
  }
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* Once every task + the weekly challenge are done, roll into the next week
   with a fresh task set — this is what keeps the workspace "connected" to
   the path's real module list instead of stalling on week 0 forever. */
export function advanceWeekIfReady(pathId: string, p: PathDef) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  const allTasksDone = e.tasks.every((t) => t.done);
  if (!allTasksDone || !e.challenge.done) return;

  if (e.weekIndex >= p.modules.length - 1) {
    // Already on the final module and just finished it — the path is
    // complete. Fire this once (completedAt gates the notification).
    if (!e.completedAt) {
      e.completedAt = new Date().toISOString();
      e.xp += 200;
      addXp(200, "Path completed");
      addNotification(
        "certificate_earned",
        "Certificate earned",
        `You completed ${p.title}. Your certificate is ready. +200 XP awarded.`,
        `certificate_earned:${pathId}`,
        pathId
      );
      writeAll(all);
    }
    return;
  }

  const nextWeek = e.weekIndex + 1;
  e.weekIndex = nextWeek;
  e.tasks = tasksForWeek(p, nextWeek);
  e.challenge = challengeForWeek(p, nextWeek);
  const stages: VideoStage[] = STAGES;
  e.videoStage = stages[nextWeek % stages.length];
  e.videoProgress = freshVideoProgress(e.videoProgress.totalMin);
  e.milestoneVideoWatched = false;
  writeAll(all);

  const pct = Math.round((nextWeek / p.modules.length) * 100);
  addNotification(
    "milestone_unlocked",
    "Milestone unlocked",
    `${p.modules[e.weekIndex - 1]} complete — on to ${p.modules[nextWeek]}.`,
    `milestone_unlocked:${pathId}:${nextWeek}`,
    pathId
  );
  addNotification(
    "path_progress_updated",
    "Path progress updated",
    `${p.title} is now ${pct}% complete.`,
    `path_progress_updated:${pathId}:${nextWeek}`,
    pathId
  );
}

/* ── Notes (item 11 — persistent, per-path, auto-saved) ─────────────────── */

export function setNotes(pathId: string, notes: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  e.notes = notes;
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* ── Video continuity (item 9) ──────────────────────────────────────────── */

export function saveVideoProgress(pathId: string, pct: number, elapsedMin: number) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  e.videoProgress = { ...e.videoProgress, pct, elapsedMin };
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
}

/* ── Curated milestone video (content-curation platform) ─────────────────
   Marking the curated pick for the current milestone as watched: awards
   XP, generates 3 fresh action tasks tied to what was just watched (so
   the workspace always reflects real post-video follow-through), and
   fires a notification. A no-op if this milestone's video is already
   marked watched, so re-opening the page never double-awards XP. */
export function markMilestoneVideoWatched(pathId: string, p: PathDef, videoTitle: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e || e.milestoneVideoWatched) return;
  e.milestoneVideoWatched = true;
  e.xp += 50;
  addXp(50, "Milestone video watched");
  const mod = p.modules[e.weekIndex] ?? p.modules[p.modules.length - 1];
  e.tasks = [
    { id: `w${e.weekIndex}-video-apply`, label: `Apply one idea from "${videoTitle}" to a real ${mod.toLowerCase()} task`, done: false },
    { id: `w${e.weekIndex}-video-notes`, label: `Write 3 takeaways from this video in your notes`, done: false },
    { id: `w${e.weekIndex}-video-share`, label: `Share one thing you learned with your mentor or community`, done: false },
  ];
  e.lastActiveAt = new Date().toISOString();
  writeAll(all);
  addNotification(
    "video_completed",
    "Video completed",
    `You finished "${videoTitle}". 3 new tasks added to your workspace. +50 XP awarded.`,
    `video_completed:${pathId}:${e.weekIndex}`,
    pathId
  );
}

/* ── Streak (called once per day the learner does anything in a path) ──── */

export function touchStreak(pathId: string) {
  const all = readAll();
  const e = all[pathId];
  if (!e) return;
  const last = new Date(e.lastActiveAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - last.getTime()) / 86400000);
  if (daysSince === 1) {
    e.streak += 1;
    addNotification(
      "streak_increased",
      "Streak increased",
      `Your streak increased to ${e.streak} day${e.streak === 1 ? "" : "s"}.`,
      `streak_increased:${pathId}:${e.streak}`,
      pathId
    );
    if (e.streak > 0 && e.streak % 5 === 0) {
      addNotification(
        "badge_unlocked",
        "Badge unlocked",
        `Consistency Badge unlocked — ${e.streak} days in a row.`,
        `badge_unlocked:${pathId}:${e.streak}`,
        pathId
      );
    }
  } else if (daysSince > 1) {
    e.streak = 1;
  }
  e.lastActiveAt = now.toISOString();
  writeAll(all);
}

/* ── Post-session summary (item 4 — Completed state content) ────────────── */

export interface SessionSummary {
  summary: string;
  mentorNotes: string;
  actionItems: string[];
}

/* Deterministic, non-fabricated-feeling recap generated from the real
   milestone the learner was on — no backend transcript to pull from, but
   nothing here is random per render, so it stays stable across re-opens. */
export function sessionSummaryFor(pathTitle: string, milestone: string, mentorName: string): SessionSummary {
  return {
    summary: `You and ${mentorName} reviewed your progress on ${milestone.toLowerCase()} and mapped out the next steps for ${pathTitle}.`,
    mentorNotes: `Good momentum on ${milestone.toLowerCase()}. Keep the same pace and bring any blockers to the next session.`,
    actionItems: [
      `Revisit ${milestone.toLowerCase()} and apply today's feedback`,
      "Complete this week's remaining tasks",
      "Note any questions for the next session",
    ],
  };
}

/* ── Mentor communication (simulated — no live chat backend) ────────────── */

/* Fires once, a short while after a mentor is assigned, so the Notification
   Center shows a first "mentor replied" moment instead of staying empty.
   Call this from wherever assignMentor() is invoked. */
export function scheduleMentorWelcomeReply(mentorName: string, pathId: string) {
  if (typeof window === "undefined") return;
  window.setTimeout(() => {
    addNotification(
      "mentor_replied",
      "Mentor replied",
      `${mentorName} sent you a welcome message ahead of your first session.`,
      `mentor_replied:${pathId}:welcome`,
      pathId
    );
  }, 4000);
}

