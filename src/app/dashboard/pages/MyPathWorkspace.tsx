import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft, Flame, Zap, CheckCircle2, Circle, ExternalLink,
  Trophy, MessageSquare, Users, Star, PlayCircle, UserPlus,
  Library, Bookmark, BookmarkCheck, Sparkles, BarChart2, Check, AlertCircle,
} from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import { PATHS, statsFor, WEEK_BANDS, CURATED_STACKS, fallbackStack } from "./GoalsPage";
import { MENTORS } from "./MentorsPage";
import {
  getEnrollment, toggleTask, toggleChallenge, setNotes as saveNotesStore,
  advanceWeekIfReady, saveVideoProgress, touchStreak, markMilestoneVideoWatched,
  checkSessionStartedNotifications, checkSessionReminderNotifications,
  ENROLLMENTS_CHANGED_EVENT, type Enrollment,
} from "../../lib/pathProgress";
import { SessionStateCard, SessionReminderBanner } from "../SessionCard";
import { pickCuratedVideo, pickNextCuratedVideo } from "../../lib/curatedContent";
import { getStoredUserProfile } from "../../types";
import { isItemSaved, saveItem, removeSavedItem } from "../../lib/savedItems";
import { upsertWatch, bumpProgress, setWatchComplete, watchIdFor } from "../../lib/watchQueue";
import { XpFlyLayer } from "../XpCorner";
import { flyXp, XP_SOURCES } from "../../lib/xpSystem";
import { useFocusTracker } from "../../lib/useFocusTracker";

/* ─────────────────────────────────────────────────────────────────────────
   /my-paths/:pathId — the learner's personal workspace for ONE active path.
   Order: header → progress → continue watching → this week's tasks →
   milestone → weekly challenge → mentor → notes → resources, per spec.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

function Card({ children, style, id }: { children: React.ReactNode; style?: React.CSSProperties; id?: string }) {
  return (
    <div id={id} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, ...style }}>
      {children}
    </div>
  );
}

export function MyPathWorkspace() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useViewport();
  const p = PATHS.find((x) => x.id === pathId);

  // TEMPORARY — verifies the journey page mounts for the right path and
  // that navigating back to the overview never bounces back here. Safe to
  // remove once confirmed in the console.
  console.log("JOURNEY PAGE", pathId);

  const [enrollment, setEnrollment] = useState<Enrollment | undefined>(() => (p ? getEnrollment(p.id) : undefined));
  const [notes, setNotesLocal] = useState(enrollment?.notes ?? "");
  // Explicit "Save" button state — separate from the silent debounced
  // auto-save below. lastSavedNotes tracks what's actually persisted, so
  // handleSaveNotes can no-op writes that would be redundant, but the
  // button itself is never disabled by this — only while a save is
  // actually in flight (see the "saving" check below), so a real click
  // always fires the handler.
  const [lastSavedNotes, setLastSavedNotes] = useState(enrollment?.notes ?? "");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [langChoice, setLangChoice] = useState<"Hindi" | "English">("Hindi");
  const savedId = p ? `curated:${p.id}:${enrollment?.weekIndex ?? 0}` : "";
  const [saved, setSaved] = useState(() => (savedId ? isItemSaved(savedId) : false));
  const watchTickRef = useRef<number | null>(null);

  useEffect(() => () => { if (watchTickRef.current) window.clearInterval(watchTickRef.current); }, []);

  // Focus XP — 25 uninterrupted minutes on this workspace (a real lesson/
  // project view). Active whenever a real, enrolled path is open.
  useFocusTracker(!!p && !!enrollment);

  const refresh = useCallback(() => {
    if (!p) return;
    setEnrollment(getEnrollment(p.id));
  }, [p]);

  useEffect(() => {
    if (p) touchStreak(p.id);
    refresh();
    window.addEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refresh]);

  useEffect(() => { setNotesLocal(enrollment?.notes ?? ""); }, [enrollment?.pathId]);
  useEffect(() => { setSaved(savedId ? isItemSaved(savedId) : false); }, [savedId]);

  // Re-derive session status on an interval so the session card + reminder
  // banner update live, and fire the shared session notifications — same
  // mechanism as Dashboard, so the two pages never disagree.
  useEffect(() => {
    const id = window.setInterval(() => {
      checkSessionStartedNotifications();
      checkSessionReminderNotifications((mentorId) => MENTORS.find((m) => m.id === mentorId)?.name);
      refresh();
    }, 30000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save, debounced — notes are per-path and persist immediately.
  useEffect(() => {
    if (!p) return;
    const t = setTimeout(() => {
      saveNotesStore(p.id, notes);
      setLastSavedNotes(notes);
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes]);

  // Explicit Save button — same store as auto-save, but immediate (no
  // debounce wait) and with its own visible saving/saved/error feedback.
  // Guards against double-submits while a save is already in flight.
  const handleSaveNotes = useCallback(() => {
    if (!p || saveStatus === "saving") return;
    setSaveStatus("saving");
    window.setTimeout(() => {
      try {
        saveNotesStore(p.id, notes);
        setLastSavedNotes(notes);
        setSaveStatus("saved");
        window.setTimeout(() => setSaveStatus((s) => (s === "saved" ? "idle" : s)), 2200);
      } catch {
        // Notes stay exactly as typed — only the persisted copy failed.
        setSaveStatus("error");
      }
    }, 300);
  }, [p, notes, saveStatus]);

  if (!p) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Growth Path not found</span>
        <Link to="/growth-paths" style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to Growth Paths</Link>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, padding: 24 }}>
        <div style={{ width: 56, height: 56, borderRadius: 18, background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p.Icon size={24} color={p.color} />
        </div>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text, textAlign: "center" }}>
          You haven't started {p.title} yet
        </span>
        <p style={{ fontSize: "0.86rem", color: C.textMuted, textAlign: "center", maxWidth: 380 }}>
          Your personal workspace is created the moment you start this journey.
        </p>
        <button
          onClick={() => navigate(`/activate/${p.id}`)}
          style={{ background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "12px 26px", fontSize: "0.86rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
        >
          Start {p.title} Journey
        </button>
      </div>
    );
  }

  const stack = CURATED_STACKS[p.id] ?? fallbackStack(p);

  const weekIndex = enrollment.weekIndex;
  const doneTasks = enrollment.tasks.filter((t) => t.done).length;
  const weekProgressPct = Math.round(((doneTasks + (enrollment.challenge.done ? 1 : 0)) / (enrollment.tasks.length + 1)) * 100);
  const overallProgress = Math.round(((weekIndex + weekProgressPct / 100) / p.modules.length) * 100);

  const mentor = enrollment.mentorId != null ? MENTORS.find((m) => m.id === enrollment.mentorId) : undefined;
  const milestone = p.modules[weekIndex];

  // Content curation — a specific, high-quality creator's video for this
  // exact milestone, prioritized by the learner's country + language from
  // onboarding. Falls back to the generic curated stack for paths outside
  // the explicitly-vetted creator roster.
  const profile = getStoredUserProfile();
  const curated = pickCuratedVideo({
    pathId: p.id,
    pathTitle: p.title,
    milestoneIndex: weekIndex,
    milestoneTitle: milestone,
    country: profile?.country,
    language: profile?.learningLanguage,
  });
  const fallbackVideo = stack[enrollment.videoStage];
  const primaryVideo = curated ?? {
    creator: fallbackVideo.source,
    title: fallbackVideo.title,
    url: fallbackVideo.url,
    duration: fallbackVideo.duration,
    difficulty: statsFor(p).difficulty.split(" ")[0] as "Beginner" | "Intermediate" | "Advanced",
    why: `A focused, curated pick for ${p.title.toLowerCase()} — matched to your current milestone: "${milestone}."`,
  };
  // Phase 5 — when the learner's onboarding language is "Both", offer a
  // Hindi/English toggle between the primary (Hindi-preferring) pick and
  // its English alternate, instead of only ever showing one.
  const resumeVideo = langChoice === "English" && curated?.alternate
    ? { ...primaryVideo, creator: curated.alternate.creator, title: curated.alternate.title, url: curated.alternate.url, duration: curated.alternate.duration }
    : primaryVideo;
  const nextMilestone = p.modules[weekIndex + 1];
  const nextVideo = nextMilestone
    ? (pickNextCuratedVideo({ pathId: p.id, pathTitle: p.title, nextMilestoneIndex: weekIndex + 1, nextMilestoneTitle: nextMilestone, country: profile?.country, language: profile?.learningLanguage }) ?? null)
    : null;

  const vp = enrollment.videoProgress;
  const remainingMin = Math.max(0, vp.totalMin - vp.elapsedMin);

  const handleToggleTask = (taskId: string, e?: React.MouseEvent) => {
    const task = enrollment.tasks.find((t) => t.id === taskId);
    const willBeDone = task ? !task.done : false;
    toggleTask(p.id, taskId);
    advanceWeekIfReady(p.id, p);
    // toggleTask() already applies the XP change (via addTaskXp/undoTaskXp
    // in pathProgress.ts) — this just plays the fly/glow animation, so XP
    // is never double-counted.
    if (e) flyXp(willBeDone ? XP_SOURCES.actionTask : -XP_SOURCES.actionTask, e.clientX, e.clientY);
  };
  const handleToggleChallenge = (e?: React.MouseEvent) => {
    const willBeDone = !enrollment.challenge.done;
    toggleChallenge(p.id);
    advanceWeekIfReady(p.id, p);
    if (e) flyXp(willBeDone ? XP_SOURCES.weeklyChallenge : -XP_SOURCES.weeklyChallenge, e.clientX, e.clientY);
  };
  const handleWatch = () => {
    // Simulated continuity: opening the video marks it ~35% further along.
    const nextPct = Math.min(100, vp.pct + 35);
    const nextElapsed = Math.round((nextPct / 100) * vp.totalMin);
    saveVideoProgress(p.id, nextPct, nextElapsed);

    // Continue Watching queue — every video started, across every active
    // path, lives here as its own entry so switching paths never loses
    // progress on any of them (item 1). Bumps this video to the top.
    const watchId = watchIdFor(p.id, resumeVideo.creator, resumeVideo.title);
    upsertWatch({
      pathId: p.id, pathTitle: p.title, pathColor: p.color,
      title: resumeVideo.title, creator: resumeVideo.creator, url: resumeVideo.url,
      thumbSeed: watchId, pct: nextPct, elapsedMin: nextElapsed, totalMin: vp.totalMin,
    });

    // Item 7 — "save current timestamp every 10 seconds": without a real
    // embedded player to hook a timeupdate event on, this interval is the
    // closest honest equivalent — it keeps persisting real, incrementing
    // progress for as long as this stays the video the learner is on,
    // rather than a single one-off nudge.
    if (watchTickRef.current) window.clearInterval(watchTickRef.current);
    let elapsed = nextElapsed;
    const totalMin = vp.totalMin;
    watchTickRef.current = window.setInterval(() => {
      elapsed = Math.min(totalMin, elapsed + 1);
      bumpProgress(watchId, elapsed);
      if (elapsed >= totalMin && watchTickRef.current) {
        window.clearInterval(watchTickRef.current);
        watchTickRef.current = null;
      }
    }, 10000);

    window.open(resumeVideo.url, "_blank", "noopener,noreferrer");
  };
  const handleToggleSave = () => {
    if (saved) { removeSavedItem(savedId); setSaved(false); }
    else { saveItem({ id: savedId, type: "YouTube", title: resumeVideo.title, desc: resumeVideo.why ?? "", url: resumeVideo.url }); setSaved(true); }
  };
  const handleMarkWatched = () => {
    markMilestoneVideoWatched(p.id, p, resumeVideo.title);
    setWatchComplete(watchIdFor(p.id, resumeVideo.creator, resumeVideo.title));
    if (watchTickRef.current) { window.clearInterval(watchTickRef.current); watchTickRef.current = null; }
    refresh();
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: isDesktop ? "40px 48px 72px" : "0 0 56px" }}>
      <XpFlyLayer />
      <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", flexDirection: "column", gap: isDesktop ? 24 : 18, padding: isDesktop ? 0 : "0 16px" }}>

        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            position: isMobile ? "sticky" : "static", top: 0, zIndex: 10,
            background: isMobile ? C.bg : "transparent",
            marginLeft: isMobile ? -16 : 0, marginRight: isMobile ? -16 : 0,
            paddingLeft: isMobile ? 16 : 0, paddingRight: isMobile ? 16 : 0,
            paddingTop: isMobile ? 14 : 0, paddingBottom: isMobile ? 14 : 0,
            borderBottom: isMobile ? `1px solid ${C.borderMuted}` : "none",
          }}
        >
          <button
            onClick={() => navigate(`/growth-paths/${p.id}`)}
            style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: "0.82rem", textDecoration: "none", fontFamily: "'Inter', sans-serif", background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            <ArrowLeft size={14} /> Back to Path Overview
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: C.gold, background: C.goldLight, border: `1px solid ${C.goldBorder}`, padding: "4px 10px", borderRadius: 20 }}>
              <Zap size={11} /> {enrollment.xp.toLocaleString()} XP
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: C.textMuted, background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, padding: "4px 10px", borderRadius: 20 }}>
              <Flame size={11} color="#F97316" /> {enrollment.streak}-day streak
            </span>
          </div>
        </div>

        {/* 1 — Path header */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <p.Icon size={28} color={p.color} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={LABEL}>Phase {weekIndex + 1} · {WEEK_BANDS[weekIndex]}</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.7rem", fontWeight: 700, color: C.text, margin: "2px 0 0", letterSpacing: "-0.01em" }}>
              {p.title}
            </h1>
          </div>
        </div>

        {/* 2 — Progress */}
        <Card style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={LABEL}>Overall Progress</span>
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.text }}>{overallProgress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 20, background: C.borderMuted, overflow: "hidden", marginBottom: 20 }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${overallProgress}%` }} transition={{ duration: 0.5, ease: "easeOut" }} style={{ height: "100%", borderRadius: 20, background: p.color }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.76rem", color: C.textMuted }}>This week's progress</span>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: C.text }}>{weekProgressPct}%</span>
          </div>
        </Card>

        {/* 3 — Continue watching: curated milestone video */}
        <Card style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, gap: 10, flexWrap: "wrap" }}>
            <span style={LABEL}>Best Video For This Milestone</span>
            {curated?.alternate && (
              <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 20, padding: 2, gap: 2 }}>
                {(["Hindi", "English"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLangChoice(lang)}
                    style={{
                      border: "none", borderRadius: 18, padding: "4px 12px", fontSize: "0.68rem", fontWeight: 600,
                      cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      background: langChoice === lang ? C.gold : "transparent",
                      color: langChoice === lang ? "#fff" : C.textMuted,
                    }}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            )}
            {enrollment.milestoneVideoWatched && (
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.68rem", fontWeight: 700, color: "#10B981", background: "#10B98114", border: "1px solid #10B98130", padding: "3px 10px", borderRadius: 20 }}>
                <CheckCircle2 size={11} /> Watched
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 96, height: 64, borderRadius: C.radiusSm, background: `${p.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <PlayCircle size={26} color={p.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "0.66rem", color: C.textFaint, marginBottom: 4 }}>{resumeVideo.creator}</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text, marginBottom: 8, lineHeight: 1.35 }}>{resumeVideo.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.7rem", color: C.textMuted, flexWrap: "wrap" }}>
                <span>{resumeVideo.duration}</span>
                <span>·</span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}><BarChart2 size={11} /> {resumeVideo.difficulty}</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", padding: "12px 14px", borderRadius: C.radiusSm, background: C.surfaceAlt, marginBottom: 16 }}>
            <Sparkles size={13} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.55, margin: 0 }}>{resumeVideo.why}</p>
          </div>
          <div style={{ height: 5, borderRadius: 20, background: C.borderMuted, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${vp.pct}%`, height: "100%", background: p.color, borderRadius: 20 }} />
          </div>
          <div style={{ fontSize: "0.7rem", color: C.textMuted, marginBottom: 16 }}>{vp.pct}% watched · {remainingMin} min left</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              onClick={handleWatch}
              style={{ display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "10px 18px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              {vp.pct > 0 ? "Resume" : "Watch"} on Starfix <ExternalLink size={13} />
            </button>
            <button
              onClick={handleToggleSave}
              style={{ display: "flex", alignItems: "center", gap: 7, background: saved ? C.goldLight : "transparent", color: saved ? C.gold : C.text, border: `1px solid ${saved ? C.goldBorder : C.border}`, borderRadius: C.radiusSm, padding: "10px 16px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              {saved ? <BookmarkCheck size={13} /> : <Bookmark size={13} />} {saved ? "Saved" : "Save for later"}
            </button>
            <button
              onClick={handleMarkWatched}
              disabled={enrollment.milestoneVideoWatched}
              style={{
                display: "flex", alignItems: "center", gap: 7, background: "transparent",
                color: enrollment.milestoneVideoWatched ? C.textFaint : C.text,
                border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "10px 16px",
                fontSize: "0.8rem", fontWeight: 600, cursor: enrollment.milestoneVideoWatched ? "default" : "pointer",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              <CheckCircle2 size={13} /> {enrollment.milestoneVideoWatched ? "Marked Watched" : "Mark Watched"}
            </button>
          </div>

          {enrollment.milestoneVideoWatched && nextVideo && (
            <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.borderMuted}` }}>
              <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Suggested Next Video</span>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.66rem", color: C.textFaint, marginBottom: 3 }}>{nextVideo.creator} · {nextVideo.duration}</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{nextVideo.title}</div>
                </div>
                <a href={nextVideo.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600, color: C.gold, textDecoration: "none", flexShrink: 0 }}>
                  Preview <ExternalLink size={12} />
                </a>
              </div>
            </div>
          )}
        </Card>

        {/* 4 — This week's tasks */}
        <Card style={{ padding: "24px 28px" }}>
          <span style={{ ...LABEL, display: "block", marginBottom: 16 }}>This Week's Tasks</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {enrollment.tasks.map((t) => (
              <button
                key={t.id}
                onClick={(e) => handleToggleTask(t.id, e)}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
              >
                {t.done ? <CheckCircle2 size={18} color={p.color} style={{ flexShrink: 0 }} /> : <Circle size={18} color={C.textFaint} style={{ flexShrink: 0 }} />}
                <span style={{ fontSize: "0.86rem", color: t.done ? C.textMuted : C.text, textDecoration: t.done ? "line-through" : "none" }}>{t.label}</span>
              </button>
            ))}
          </div>
        </Card>

        {/* 5 — Current milestone */}
        <Card style={{ padding: "24px 28px" }}>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Current Milestone</span>
          <p style={{ fontSize: "0.98rem", fontWeight: 600, color: C.text, margin: 0 }}>{milestone}</p>
          <p style={{ fontSize: "0.8rem", color: C.textMuted, margin: "6px 0 0" }}>Phase {weekIndex + 1} of {p.modules.length} · {WEEK_BANDS[weekIndex]}</p>
        </Card>

        {/* 6 — Weekly challenge */}
        <Card style={{ padding: "24px 28px", border: `1px solid ${C.goldBorder}`, background: C.goldLight }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Trophy size={16} color={C.gold} />
            <span style={{ ...LABEL, color: C.gold }}>Weekly Challenge</span>
          </div>
          <p style={{ fontSize: "0.88rem", color: C.text, margin: "0 0 16px", lineHeight: 1.5 }}>{enrollment.challenge.label}</p>
          <button
            onClick={handleToggleChallenge}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px",
              borderRadius: C.radiusSm, border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
              fontSize: "0.8rem", fontWeight: 600,
              background: enrollment.challenge.done ? "#fff" : C.gold,
              color: enrollment.challenge.done ? C.gold : "#fff",
            }}
          >
            {enrollment.challenge.done ? <>Completed <CheckCircle2 size={14} /></> : "Mark as Complete"}
          </button>
        </Card>

        {/* 7 — Your mentor (never auto-assigned) */}
        <Card style={{ padding: "24px 28px" }}>
          <span style={{ ...LABEL, display: "block", marginBottom: 16 }}>Your Mentor</span>
          {mentor ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${mentor.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700, color: mentor.color, flexShrink: 0 }}>
                  {mentor.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600, color: C.text }}>{mentor.name}</div>
                  <div style={{ fontSize: "0.72rem", color: C.textMuted }}>{mentor.title}</div>
                </div>
                <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 3, fontSize: "0.76rem", color: C.text, flexShrink: 0 }}>
                  <Star size={10} color={C.gold} fill={C.gold} /> {mentor.rating}
                </span>
              </div>
              <button style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "10px 0", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, background: "#fff", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: C.text, fontFamily: "'Inter', sans-serif" }}>
                <MessageSquare size={13} /> Message
              </button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 10px" }}>
              <Users size={22} color={C.textFaint} style={{ marginBottom: 10 }} />
              <p style={{ fontSize: "0.84rem", color: C.textMuted, margin: "0 0 16px" }}>No mentor selected yet.</p>
              <button
                onClick={() => navigate(`/growth-paths/${p.id}/mentors`)}
                style={{ display: "inline-flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "10px 20px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                <UserPlus size={14} /> Choose Mentor
              </button>
            </div>
          )}
        </Card>

        {/* 7b — Session state machine (item 8): scheduled → starting soon →
             live → completed. Same shared component as Dashboard, so the
             two pages are always in sync and neither ever navigates away
             on click. */}
        {mentor && (
          <>
            <SessionReminderBanner
              enrollment={enrollment}
              onViewSession={() => document.getElementById("workspace-session-card")?.scrollIntoView({ behavior: "smooth", block: "center" })}
              onAddNotes={() => document.getElementById("workspace-notes")?.scrollIntoView({ behavior: "smooth", block: "center" })}
            />
            <div id="workspace-session-card">
              <SessionStateCard
                enrollment={enrollment}
                onBookSession={() => navigate(`/growth-paths/${p.id}/mentors`)}
                onReschedule={() => navigate(`/growth-paths/${p.id}/mentors`)}
              />
            </div>
          </>
        )}



        {/* 9 — Resources */}
        <Card style={{ padding: "24px 28px" }}>
          <span style={{ ...LABEL, display: "flex", alignItems: "center", gap: 6, marginBottom: 16 }}>
            <Library size={12} /> Resources
          </span>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 14 }}>
            {[stack.start, stack.deeper, stack.practice].map((r) => (
              <a
                key={r.title}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "block", textDecoration: "none", padding: "14px 15px", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, background: C.surfaceAlt }}
              >
                <div style={{ fontSize: "0.64rem", color: C.textFaint, marginBottom: 6 }}>{r.duration} · {r.source}</div>
                <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text, lineHeight: 1.35 }}>{r.title}</div>
              </a>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
