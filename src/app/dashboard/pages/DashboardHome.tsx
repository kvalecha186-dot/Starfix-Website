import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, Play, Clock, Flame,
  Lock, Check, Sparkles, X, Layers,
} from "lucide-react";
import { useNavigate } from "react-router";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";
import { GOAL_META, getStoredUserProfile } from "../../types";
import {
  getAllEnrollments,
  checkSessionStartedNotifications, checkSessionReminderNotifications,
  ENROLLMENTS_CHANGED_EVENT, type Enrollment,
} from "../../lib/pathProgress";
import { PATHS } from "./GoalsPage";
import { pickCuratedVideo } from "../../lib/curatedContent";
import { MENTORS } from "./MentorsPage";
import { SessionStateCard, SessionReminderBanner } from "../SessionCard";
import {
  getQueue, getQueueGrouped, bumpProgress,
  WATCH_QUEUE_CHANGED_EVENT, type WatchQueueItem,
} from "../../lib/watchQueue";
import { XpFlyLayer } from "../XpCorner";
import { getXpState, getRank, celebrateTaskXp, uncelebrateTaskXp, XP_CHANGED_EVENT } from "../../lib/xpSystem";
import { UpcomingSessionsSection, SessionHistorySection } from "../BookedSessionsSection";
import { XpHistoryCard } from "../XpHistorySection";

/* ─── Per-goal session + video context (extends GOAL_META locally) ─── */

const SESSION_META: Record<string, { focus: string; topic: string; video: string; thumbSeed: string }> = {
  coding:  { focus: "Full-Stack Architecture + Career Planning", topic: "API design & deployment", video: "Structuring APIs That Scale",              thumbSeed: "starfix-coding" },
  ai:      { focus: "Deep Learning + Career Planning",           topic: "Model deployment",         video: "Deploying Your First Model to Production", thumbSeed: "starfix-ai" },
  uiux:    { focus: "Design Systems + Portfolio Review",         topic: "Component architecture",   video: "Building a Design System from Scratch",     thumbSeed: "starfix-uiux" },
  finance: { focus: "Portfolio Strategy + Career Planning",      topic: "Risk-adjusted returns",     video: "Index Funds vs. Individual Stocks",         thumbSeed: "starfix-finance" },
  comms:   { focus: "Public Speaking + Executive Presence",      topic: "Storytelling structure",    video: "The Structure Behind Every Great Talk",     thumbSeed: "starfix-comms" },
  startup: { focus: "Fundraising + Go-to-Market",                topic: "Pitch deck review",         video: "Nailing Your First Investor Pitch",         thumbSeed: "starfix-startup" },
};

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: C.textFaint,
  fontFamily: "'Inter', sans-serif",
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

/* ─── Small shared pieces ─────────────────────────────────────────── */

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        // Faint gold border + shadow instead of the plain neutral one —
        // barely noticeable on its own, but reads as noticeably richer
        // next to a flat white card. 10% gold border, very soft gold shadow.
        border: "1px solid rgba(212,169,31,0.10)",
        boxShadow: "0 8px 24px rgba(212,169,31,0.06)",
        borderRadius: 20,
        transition: "box-shadow 180ms ease, transform 180ms ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ── Mentor Session — item 1: the real Join Session state machine ──────
   Delegates to the shared SessionStateCard (src/app/dashboard/SessionCard.tsx)
   so Dashboard and Workspace render and behave identically — one state
   machine, driven off getSessionStatus() (none/scheduled/starting_soon/
   live/completed), never a route change on click. This is what fixes the
   "Join Session opens the dashboard" bug: previously this file compared
   status against "upcoming"/"ended" strings that getSessionStatus() never
   returns, so the button area silently rendered empty before/after a
   session — now every real status value is handled. */
function MentorSessionCard({ enrollment, onNavigate }: { enrollment: Enrollment | null; onNavigate?: (p: DashPage) => void }) {
  const navigate = useNavigate();

  // Announce any session that just went live / entering its 10-minute
  // window on an interval — this is what makes the card + banner update
  // on their own, with no reload.
  useEffect(() => {
    const id = window.setInterval(() => {
      checkSessionStartedNotifications();
      checkSessionReminderNotifications((mentorId) => MENTORS.find((m) => m.id === mentorId)?.name);
    }, 30000);
    return () => window.clearInterval(id);
  }, []);

  if (!enrollment) {
    return (
      <SectionCard style={{ padding: "22px 26px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Clock size={18} color={C.textFaint} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: C.text }}>No mentor session scheduled</div>
            <div style={{ fontSize: "0.78rem", color: C.textMuted, marginTop: 2 }}>Choose a mentor for one of your Growth Paths to book your first session.</div>
          </div>
          <motion.button
            whileHover={{ y: -2, opacity: 0.92 }}
            onClick={() => onNavigate?.("goals")}
            style={{
              display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff",
              border: "none", borderRadius: 12, padding: "10px 18px", fontSize: "0.8rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0, whiteSpace: "nowrap",
            }}
          >
            Choose a mentor
          </motion.button>
        </div>
      </SectionCard>
    );
  }

  return (
    <SessionStateCard
      enrollment={enrollment}
      onBookSession={() => navigate(`/growth-paths/${enrollment.pathId}/mentors`)}
      onReschedule={() => navigate(`/growth-paths/${enrollment.pathId}/mentors`)}
    />
  );
}

/* ── Recommended next lesson — item 7: one compact row, never a full
   section. Built from the learner's real Enrollment + curated-content
   engine (country/language-aware), never a random link. Renders nothing
   if the learner has no active path yet or the path has no curated
   creator roster. ── */
function RecommendedLessonRow({ enrollment }: { enrollment: Enrollment | null }) {
  const navigate = useNavigate();
  if (!enrollment) return null;
  const path = PATHS.find((x) => x.id === enrollment.pathId);
  if (!path) return null;

  const milestone = path.modules[enrollment.weekIndex] ?? path.modules[path.modules.length - 1];
  const profile = getStoredUserProfile();
  const lesson = pickCuratedVideo({
    pathId: path.id,
    pathTitle: path.title,
    milestoneIndex: enrollment.weekIndex,
    milestoneTitle: milestone,
    country: profile?.country,
    language: profile?.learningLanguage,
  });
  if (!lesson) return null;

  const vp = enrollment.videoProgress;
  const statusLabel = enrollment.milestoneVideoWatched
    ? "Completed"
    : vp.pct > 0
      ? `${Math.max(0, vp.totalMin - vp.elapsedMin)} min left`
      : "Not started";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 4px", borderTop: `1px solid ${C.borderMuted}`, marginTop: 6 }}>
      <div style={{
        width: 46, height: 46, borderRadius: 10, background: `${path.color}14`, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <path.Icon size={19} color={path.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.66rem", color: C.textFaint, marginBottom: 2 }}>Recommended next lesson · {lesson.creator}</div>
        <div style={{ fontSize: "0.86rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lesson.title}</div>
        <div style={{ fontSize: "0.72rem", color: C.textMuted, marginTop: 2 }}>{statusLabel}</div>
      </div>
      <button
        onClick={() => navigate(`/growth-paths/${path.id}/journey`)}
        style={{
          flexShrink: 0, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "8px 16px", fontSize: "0.78rem", fontWeight: 600, color: C.text, cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Resume lesson
      </button>
    </div>
  );
}

/* ── Continue Watching — Netflix-style, cross-path watch queue ─────────
   formatRelativeWatch: "Just now" / "12m ago" / "3h ago" / "Yesterday" /
   "5d ago" — recomputed on render, never stored. ── */
function formatRelativeWatch(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  return `${diffDay}d ago`;
}

function WatchQueueRow({ item, onResume }: { item: WatchQueueItem; onResume: (item: WatchQueueItem) => void }) {
  const remaining = Math.max(0, item.totalMin - item.elapsedMin);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 4px" }}>
      <div style={{ width: 76, height: 50, borderRadius: 10, overflow: "hidden", flexShrink: 0, position: "relative" }}>
        <img src={`https://picsum.photos/seed/${item.thumbSeed}/160/100`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 3, background: "rgba(0,0,0,0.18)" }}>
          <div style={{ width: `${item.pct}%`, height: "100%", background: C.gold }} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{
            fontSize: "0.6rem", fontWeight: 700, color: item.pathColor, background: `${item.pathColor}14`,
            border: `1px solid ${item.pathColor}30`, padding: "2px 7px", borderRadius: 20,
          }}>
            {item.pathTitle}
          </span>
        </div>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{item.title}</div>
        <div style={{ fontSize: "0.68rem", color: C.textFaint }}>{item.pct}% watched · {remaining} min left · {formatRelativeWatch(item.lastWatchedAt)}</div>
      </div>
      <button
        onClick={() => onResume(item)}
        style={{
          flexShrink: 0, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "7px 14px", fontSize: "0.74rem", fontWeight: 600, color: C.text, cursor: "pointer",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Resume
      </button>
    </div>
  );
}

/* Right-side drawer (desktop) / full-width overlay (narrow viewports) —
   every video the learner is currently watching, grouped by Growth Path,
   sorted most-recently-watched first within each group. */
function ContinueWatchingDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [, forceTick] = useState(0);
  const groups = getQueueGrouped();

  const handleResume = (item: WatchQueueItem) => {
    bumpProgress(item.id, item.elapsedMin); // touches lastWatchedAt, bumps to top
    window.open(item.url, "_blank", "noopener,noreferrer");
    forceTick((n) => n + 1);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, background: "rgba(24,24,27,0.35)", zIndex: 60 }}
          />
          <motion.div
            key="panel"
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)",
              background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 61,
              display: "flex", flexDirection: "column", boxShadow: "-8px 0 30px rgba(0,0,0,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 24px", borderBottom: `1px solid ${C.borderMuted}` }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: 0 }}>Continue Watching</h2>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, display: "flex", padding: 4 }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px 24px 24px" }}>
              {groups.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 10px" }}>
                  <Layers size={26} color={C.textFaint} style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: "0.86rem", color: C.textMuted, margin: 0 }}>Your learning queue is empty</p>
                </div>
              ) : (
                groups.map((g) => (
                  <div key={g.pathId} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 4px 4px" }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", background: g.pathColor, flexShrink: 0 }} />
                      <span style={LABEL}>{g.pathTitle}</span>
                    </div>
                    {g.items.map((item, i) => (
                      <div key={item.id} style={{ borderTop: i > 0 ? `1px solid ${C.borderMuted}` : "none" }}>
                        <WatchQueueRow item={item} onResume={handleResume} />
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */

export function DashboardHome({ onNavigate, userProfile }: { onNavigate?: (p: DashPage) => void; userProfile?: UserProfile | null }) {
  const { isDesktop, isMobile } = useViewport();
  const goalId = userProfile?.goalId || "coding";
  const meta = GOAL_META[goalId] || GOAL_META.coding;
  const session = SESSION_META[goalId] || SESSION_META.coding;
  const firstName = (userProfile?.name || "Khushi").split(" ")[0];
  const navigate = useNavigate();

  // Re-render whenever enrollment data changes anywhere in the app (task
  // toggles, saved notes, session booking, etc.) — same single source of
  // truth as every other page, refetched live instead of only on next
  // navigation, so a note saved in the Workspace shows up here at once.
  const [, forceEnrollmentTick] = useState(0);
  useEffect(() => {
    const onChange = () => forceEnrollmentTick((n) => n + 1);
    window.addEventListener(ENROLLMENTS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ENROLLMENTS_CHANGED_EVENT, onChange);
  }, []);
  const enrollments = getAllEnrollments();

  /* ── Continue Watching queue — live-updates on any watch anywhere ── */
  const [showQueueDrawer, setShowQueueDrawer] = useState(false);
  const [, forceQueueTick] = useState(0);
  useEffect(() => {
    const onChange = () => forceQueueTick((n) => n + 1);
    window.addEventListener(WATCH_QUEUE_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(WATCH_QUEUE_CHANGED_EVENT, onChange);
  }, []);
  const watchQueue = getQueue();
  const mostRecentWatch = watchQueue[0];

  /* ── Today's Mission — 5 tasks, XP-weighted, persisted per day ── */
  const buildTasks = () => {
    const plan = meta.dailyPlan || [];
    const xp = [20, 30, 40, 15, 15];
    const base = [
      plan[0] || "Review today's fundamentals",
      plan[1] || "Practice a core skill",
      plan[2] || "Apply what you learned",
      `Watch: ${session.video}`,
      "Prepare questions for your mentor",
    ];
    return base.map((text, i) => ({ id: i + 1, text, xp: xp[i], done: false }));
  };

  const storageKey = `starfix_tasks_${goalId}_${todayKey()}`;
  const [tasks, setTasks] = useState(() => {
    const saved = readJSON<{ id: number; text: string; xp: number; done: boolean }[] | null>(storageKey, null);
    return saved && saved.length ? saved : buildTasks();
  });

  useEffect(() => {
    const saved = readJSON<{ id: number; text: string; xp: number; done: boolean }[] | null>(storageKey, null);
    setTasks(saved && saved.length ? saved : buildTasks());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goalId]);

  useEffect(() => { writeJSON(storageKey, tasks); }, [tasks, storageKey]);

  const doneCount = tasks.filter((t) => t.done).length;
  const earnedXP = tasks.filter((t) => t.done).reduce((sum, t) => sum + t.xp, 0);
  const totalXP = tasks.reduce((sum, t) => sum + t.xp, 0);

  const toggle = (id: number, e?: React.MouseEvent) => {
    const task = tasks.find((t) => t.id === id);
    const willBeDone = task ? !task.done : false;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
    if (!task) return;
    // Task XP is a two-stage reward — see xpSystem.ts. It lands in
    // todayXp (pending) now and settles into totalXp after 6 hours.
    // Keyed per goal/day/task so unchecking (undo) reverses exactly
    // this task's XP, whether still pending or already settled.
    const key = `mission:${goalId}:${todayKey()}:${id}`;
    if (e) {
      if (willBeDone) celebrateTaskXp(key, task.xp, e, task.text);
      else uncelebrateTaskXp(key, task.xp, e);
    } else {
      if (willBeDone) celebrateTaskXp(key, task.xp, undefined, task.text);
      else uncelebrateTaskXp(key, task.xp);
    }
  };

  /* ── Global XP + rank — shown under the greeting; the corner card
     (mounted below) reads the same store independently. ── */
  const [xpState, setXpState] = useState(getXpState);
  useEffect(() => {
    const onChange = () => setXpState(getXpState());
    window.addEventListener(XP_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(XP_CHANGED_EVENT, onChange);
  }, []);
  const rank = getRank(xpState.totalXp);

  const now = new Date();
  const today = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const greeting = now.getHours() < 12 ? "Good morning" : now.getHours() < 18 ? "Good afternoon" : "Good evening";

  const sessionEnrollment = enrollments.find((e) => e.mentorId != null) ?? null;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", position: "relative", overflow: "hidden" }}>

      <XpFlyLayer />

      {/* ══ AMBIENT GOLD GLOW — pure-white base, 3 huge ultra-soft radial
          washes (3–6% opacity) melted together with a very heavy blur so
          nothing reads as a shape, just diffused warmth behind the
          greeting / active-journey / mission areas. Purely decorative:
          aria-hidden, no pointer events, sits behind all real content. ══ */}
      <div aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: "-20%", filter: "blur(1400px)" }}>
          {/* top-right — behind the greeting */}
          <div style={{
            position: "absolute", top: "2%", right: "4%", width: 900, height: 900, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(233,201,106,0.06) 0%, rgba(248,231,181,0.04) 45%, rgba(255,246,220,0) 75%)",
          }} />
          {/* center-left — behind the active journey card */}
          <div style={{
            position: "absolute", top: "34%", left: "2%", width: 900, height: 900, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(248,231,181,0.05) 0%, rgba(233,201,106,0.03) 45%, rgba(255,246,220,0) 75%)",
          }} />
          {/* bottom-right — behind the mission / progress area */}
          <div style={{
            position: "absolute", bottom: "6%", right: "2%", width: 950, height: 950, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,246,220,0.06) 0%, rgba(233,201,106,0.03) 45%, rgba(255,246,220,0) 75%)",
          }} />
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 1 }}>

      {/* ══ 10-MIN SESSION REMINDER BANNER — item 2 ══ */}
      <SessionReminderBanner
        enrollment={sessionEnrollment}
        onViewSession={() => {
          document.getElementById("mentor-session-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
        }}
        onAddNotes={() => sessionEnrollment && navigate(`/growth-paths/${sessionEnrollment.pathId}/journey`)}
      />

      <div
        style={{
          padding: isDesktop ? "40px 48px 120px" : "16px 16px 100px",
          display: "flex",
          flexDirection: "column",
          gap: isDesktop ? 24 : 16,
          background: "radial-gradient(circle at 50% 0%, rgba(233,201,106,0.06) 0%, rgba(255,255,255,0) 65%)",
        }}
      >

        {/* ── Greeting ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div style={{ ...LABEL, marginBottom: 8 }}>{today}</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1.7rem" : isDesktop ? "2.2rem" : "2rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
            {greeting}, {firstName}.
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: "0.82rem", fontFamily: "'Inter', sans-serif" }}>
            <span style={{ fontWeight: 700, color: C.gold }}>{rank.name}</span>
            <span style={{ color: C.textFaint }}>•</span>
            <span style={{ color: C.textMuted }}>{xpState.totalXp.toLocaleString()} XP</span>
            <span style={{ color: C.textFaint }}>•</span>
            <span style={{ color: C.textMuted, display: "flex", alignItems: "center", gap: 4 }}>
              <Flame size={12} color="#F97316" /> {xpState.consistencyStreak}-day consistency
              <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} style={{ display: "inline-flex", marginLeft: 2 }}>
                <Sparkles size={11} color={C.gold} />
              </motion.span>
            </span>
          </div>
        </motion.div>

        {/* ══ HERO — 2 COLUMN ═══════════════════════════════════ */}
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1.15fr 1fr" : "1fr", gap: isDesktop ? 24 : 16 }}>

          {/* LEFT — Continue Journey */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.07, ease: "easeOut" }}
          >
            <SectionCard style={{ padding: isDesktop ? "28px 30px" : "18px 18px", borderTop: `2px solid ${C.gold}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                <span style={{
                  fontSize: "0.62rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em",
                  color: C.gold, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
                  padding: "4px 10px", borderRadius: 20,
                }}>
                  Active
                </span>
                <span style={{ fontSize: "0.76rem", color: C.textMuted }}>Week 4 of 8</span>
              </div>

              <div style={{ ...LABEL, marginBottom: 6 }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                {meta.title}
              </div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.35rem", fontWeight: 700, color: C.text, marginBottom: 20, lineHeight: 1.3 }}>
                {meta.milestone}
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={LABEL}>
                    <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                    Progress
                  </span>
                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: C.gold }}>68%</span>
                </div>
                <div style={{ height: 6, borderRadius: 6, background: C.borderMuted, overflow: "hidden", position: "relative" }}>
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: "68%" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    style={{ height: "100%", background: C.gold, borderRadius: 6, position: "relative", overflow: "hidden" }}
                  >
                    <motion.div
                      initial={{ x: "-100%" }}
                      animate={{ x: "100%" }}
                      transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
                      style={{
                        position: "absolute", inset: 0,
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)",
                      }}
                    />
                  </motion.div>
                </div>
              </div>

              {/* Next Milestone Preview line */}
              <div style={{
                marginBottom: 20, padding: "8px 12px", borderRadius: 8, background: C.surfaceAlt,
                border: `1px solid ${C.borderMuted}`, display: "flex", alignItems: "center", gap: 8, fontSize: "0.76rem",
              }}>
                <span style={{ color: C.textFaint, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", fontSize: "0.66rem" }}>Next milestone:</span>
                <span style={{ color: C.text, fontWeight: 500 }}>Real Projects & System Architecture</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: C.textMuted }}>
                  <Flame size={13} color="#F97316" /> 12-day streak
                </div>
                <motion.button
                  whileHover={{ y: -2, opacity: 0.95, boxShadow: `0 4px 14px ${C.goldBorder}` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigate?.("goals")}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    background: C.gold, color: "#fff", border: "none", borderRadius: 12,
                    padding: "11px 22px", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer",
                    fontFamily: "'Inter', sans-serif", transition: "transform 180ms ease, box-shadow 180ms ease",
                  }}
                >
                  Continue Journey <ArrowRight size={14} />
                </motion.button>
              </div>
            </SectionCard>
          </motion.div>

          {/* RIGHT column — Continue Watching */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.14, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 24, overflow: "visible" }}
          >
            <motion.div whileHover={{ y: -2 }} style={{ transition: "transform 180ms ease" }}>
              <SectionCard style={{ padding: 0, overflow: "hidden", borderTop: `2px solid ${C.gold}` }}>
              <div style={{ ...LABEL, padding: "18px 20px 0" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block", marginRight: 6, verticalAlign: "middle" }} />
                Continue watching
              </div>

              {mostRecentWatch ? (
                <>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => window.open(mostRecentWatch.url, "_blank", "noopener,noreferrer")}
                    style={{
                      margin: "10px 20px 0", position: "relative", cursor: "pointer",
                      borderRadius: 14, overflow: "hidden", aspectRatio: "16 / 9",
                    }}
                  >
                    <img
                      src={`https://picsum.photos/seed/${mostRecentWatch.thumbSeed}/560/315`}
                      alt={mostRecentWatch.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {/* Looping pulse glow ring behind play button */}
                      <motion.div
                        animate={{ scale: [1, 1.16, 1], opacity: [0.3, 0.65, 0.3] }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                          position: "absolute", width: 54, height: 54, borderRadius: "50%",
                          background: `rgba(201,162,39,0.35)`,
                        }}
                      />
                      <div style={{
                        position: "relative", width: 46, height: 46, borderRadius: "50%", background: "rgba(255,255,255,0.92)",
                        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2,
                      }}>
                        <Play size={18} color={C.text} fill={C.text} style={{ marginLeft: 2 }} />
                      </div>
                    </div>
                    <span style={{
                      position: "absolute", top: 10, left: 10, fontSize: "0.62rem", fontWeight: 700,
                      color: "#fff", background: mostRecentWatch.pathColor, padding: "3px 9px", borderRadius: 20,
                    }}>
                      {mostRecentWatch.pathTitle}
                    </span>
                    <span style={{
                      position: "absolute", bottom: 10, right: 10, fontSize: "0.66rem", fontWeight: 600,
                      color: "#fff", background: "rgba(0,0,0,0.55)", padding: "3px 8px", borderRadius: 6,
                    }}>
                      {Math.max(0, mostRecentWatch.totalMin - mostRecentWatch.elapsedMin)} min left
                    </span>
                  </motion.div>
                  <div style={{ padding: "16px 20px 20px" }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 600, color: C.text, marginBottom: 4, lineHeight: 1.4 }}>
                      {mostRecentWatch.title}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: C.textFaint, marginBottom: 12 }}>
                      {formatRelativeWatch(mostRecentWatch.lastWatchedAt)}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.72rem", color: C.textMuted }}>{mostRecentWatch.pct}% watched</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 20, background: C.borderMuted, overflow: "hidden", marginBottom: 16 }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${mostRecentWatch.pct}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        style={{ height: "100%", background: C.gold, borderRadius: 20 }}
                      />
                    </div>
                    {/* Premium white-and-gold "See more" action */}
                    <motion.button
                      onClick={() => setShowQueueDrawer(true)}
                      whileHover={{ boxShadow: `0 0 0 4px ${C.goldBorder}` }}
                      whileTap={{ scale: 0.98 }}
                      style={{
                        width: "100%", background: "#fff", border: `1.5px solid ${C.goldBorder}`,
                        borderRadius: 999, padding: "10px 0", fontSize: "0.82rem", fontWeight: 700,
                        color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        transition: "box-shadow 200ms ease",
                      }}
                    >
                      <Sparkles size={14} color={C.gold} /> See more
                    </motion.button>
                  </div>
                </>
              ) : (
                /* Item 9 — empty state */
                <div style={{ padding: "36px 24px 30px", textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, margin: "0 auto 16px", borderRadius: "50%",
                    background: C.goldLight, border: `1px solid ${C.goldBorder}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Layers size={22} color={C.gold} />
                  </div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: C.text, marginBottom: 6 }}>
                    Your learning queue is empty
                  </div>
                  <p style={{ fontSize: "0.78rem", color: C.textMuted, margin: "0 0 18px", lineHeight: 1.5 }}>
                    Start a video from any Growth Path and it'll show up here.
                  </p>
                  <button
                    onClick={() => onNavigate?.("goals")}
                    style={{
                      background: C.gold, color: "#fff", border: "none", borderRadius: 999,
                      padding: "10px 22px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Explore growth paths
                  </button>
                </div>
              )}
              </SectionCard>
            </motion.div>
          </motion.div>
        </div>

        {/* ══ UPCOMING SESSIONS & SESSION HISTORY ════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.21, ease: "easeOut" }}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          <UpcomingSessionsSection onNavigate={onNavigate} />
          <SessionHistorySection />
        </motion.div>

        {/* ══ TODAY'S MISSION ═══════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.28, ease: "easeOut" }}
        >
          <SectionCard style={{ padding: isDesktop ? "26px 30px" : "18px 18px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>
                Today's Mission
              </h2>
              <div style={{ fontSize: "0.78rem", color: C.textMuted }}>
                Earn {totalXP} XP today
              </div>
            </div>
            <span style={{ fontSize: "0.78rem", color: C.textFaint }}>{doneCount}/{tasks.length} done</span>
          </div>

          <div>
            {tasks.map((t, i) => (
              <motion.div
                key={t.id}
                onClick={(e) => toggle(t.id, e)}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: t.done ? 0.5 : 1, y: 0 }}
                transition={{ duration: 0.22, delay: i * 0.03 }}
                whileHover={{ x: 3 }}
                style={{
                  display: "flex", alignItems: "center", gap: 14, padding: "13px 4px", cursor: "pointer",
                  borderBottom: i < tasks.length - 1 ? `1px solid ${C.borderMuted}` : "none",
                  flexWrap: isDesktop ? "nowrap" : "wrap",
                }}
              >
                <div style={{
                  width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                  border: `1.5px solid ${t.done ? C.gold : "#D8D8D5"}`,
                  background: t.done ? C.gold : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 180ms ease, border-color 180ms ease",
                }}>
                  <AnimatePresence>
                    {t.done && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.18 }}>
                        <Check size={12} color="#fff" strokeWidth={3} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <span style={{
                  fontSize: "0.9rem", color: t.done ? C.textFaint : C.text,
                  textDecoration: t.done ? "line-through" : "none", flex: 1, lineHeight: 1.4,
                }}>
                  {t.text}
                </span>
                <span style={{
                  fontSize: "0.68rem", fontWeight: 700, color: C.gold, background: C.goldLight,
                  padding: "3px 10px", borderRadius: 999, flexShrink: 0,
                }}>
                  +{t.xp} XP
                </span>
              </motion.div>
            ))}
          </div>

          <RecommendedLessonRow enrollment={enrollments[0] ?? null} />

        </SectionCard>
        </motion.div>

        {/* ══ XP HISTORY CARD ════════════════════════════════════ */}
        <XpHistoryCard />

        {/* ══ MENTOR SESSION — item 1: the real Join Session state machine ══ */}
        <div id="mentor-session-card">
          <MentorSessionCard
            enrollment={sessionEnrollment}
            onNavigate={onNavigate}
          />
        </div>

        {/* ══ WEEKLY CHALLENGE ═══════════════════════════════════ */}
        <SectionCard style={{ padding: isDesktop ? "26px 30px" : "18px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%", flexShrink: 0, position: "relative",
              background: `conic-gradient(${C.gold} ${60 * 3.6}deg, ${C.borderMuted} 0deg)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: "50%", background: C.surface,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.74rem", fontWeight: 700, color: C.gold,
              }}>
                3/5
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: "0.95rem", fontWeight: 700, color: C.text }}>Weekly Challenge</span>
                <span style={{ fontSize: "0.72rem", color: C.textFaint }}>Ends in 3 days</span>
              </div>
              <div style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.4 }}>
                Ship a small project and share it with your mentor
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
              <span style={{
                fontSize: "0.72rem", fontWeight: 700, color: C.gold, background: C.goldLight,
                border: `1px solid ${C.goldBorder}`, padding: "5px 12px", borderRadius: 999,
              }}>
                +300 XP
              </span>
              <motion.button
                whileHover={{ y: -2, opacity: 0.92 }}
                style={{
                  background: C.gold, color: "#fff", border: "none", borderRadius: 12,
                  padding: "10px 18px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                  fontFamily: "'Inter', sans-serif", transition: "transform 180ms ease", whiteSpace: "nowrap",
                }}
              >
                Continue challenge
              </motion.button>
            </div>
          </div>
        </SectionCard>

        {/* ══ UNLOCK SECTION ═════════════════════════════════════ */}
        <SectionCard style={{ padding: isDesktop ? "22px 26px" : "16px 18px" }}>
          <div style={{ ...LABEL, marginBottom: 14 }}>You're close to unlocking</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: C.goldLight, flexShrink: 0,
              border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Lock size={17} color={C.gold} />
            </div>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: "0.88rem", fontWeight: 600, color: C.text, marginBottom: 2 }}>Consistency Badge</div>
              <div style={{ fontSize: "0.78rem", color: C.textMuted }}>Complete tasks for 2 more days</div>
            </div>
            <div style={{ flex: 1, minWidth: 160, maxWidth: 220 }}>
              <div style={{ height: 5, borderRadius: 5, background: C.borderMuted, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }} animate={{ width: "80%" }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  style={{ height: "100%", background: C.gold, borderRadius: 5 }}
                />
              </div>
              <div style={{ fontSize: "0.7rem", color: C.textFaint, marginTop: 5, textAlign: "right" }}>80%</div>
            </div>
          </div>
        </SectionCard>
      </div>
      </div>

      <ContinueWatchingDrawer open={showQueueDrawer} onClose={() => setShowQueueDrawer(false)} />
    </div>
  );
}
