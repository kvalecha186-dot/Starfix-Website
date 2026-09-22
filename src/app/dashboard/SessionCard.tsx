import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Video, Clock, Radio, Check, CalendarPlus, CalendarClock,
  HelpCircle, Send, ClipboardList, Bell, X,
} from "lucide-react";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import { MENTORS } from "./pages/MentorsPage";
import { PATHS } from "./pages/GoalsPage";
import {
  getSessionStatus, joinSession, completeSessionReflection, minutesUntilSession,
  formatCountdown, meetingUrlFor, calendarUrlFor, sessionSummaryFor, setNotes,
  type Enrollment,
} from "../lib/pathProgress";
import { VideoCallModal } from "./VideoCallModal";

/* ─────────────────────────────────────────────────────────────────────────
   Shared mentor-session state machine — the single source of truth for
   how the session card looks and behaves everywhere it appears (Dashboard,
   Workspace). Five states, all driven off getSessionStatus():

     none / scheduled / starting_soon / live / completed

   Never navigates away on its own — every action either opens a new tab
   (meeting link, calendar), toggles local UI, or writes to the enrollment
   store. This is what fixes the "Join Session opens the dashboard" bug:
   there is exactly one Join Session button in the whole app, defined once
   here, and it is wired to joinSession() + window.open(), never a route
   change.
───────────────────────────────────────────────────────────────────────── */

export const SESSION_LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  scheduled:      { label: "Scheduled",     color: C.textMuted, bg: C.surfaceAlt },
  starting_soon:  { label: "Starting Soon", color: "#F0B429",   bg: "rgba(240,180,41,0.14)" },
  live:           { label: "Live",          color: "#F87171",   bg: "rgba(248,113,113,0.14)" },
  completed:      { label: "Completed",     color: "#34D399",   bg: "rgba(52,211,153,0.14)" },
};

function GhostButton({ children, onClick, href, disabled }: { children: React.ReactNode; onClick?: () => void; href?: string; disabled?: boolean }) {
  const style: React.CSSProperties = {
    display: "flex", alignItems: "center", gap: 7, background: "transparent",
    border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "10px 16px",
    fontSize: "0.8rem", fontWeight: 600, color: disabled ? C.textFaint : C.text,
    cursor: disabled ? "default" : "pointer", fontFamily: "'Inter', sans-serif",
    textDecoration: "none", opacity: disabled ? 0.6 : 1,
  };
  if (href) {
    return <a href={href} target="_blank" rel="noopener noreferrer" style={style}>{children}</a>;
  }
  return <button onClick={onClick} disabled={disabled} style={style}>{children}</button>;
}

export function SessionStateCard({
  enrollment,
  onBookSession,
  onReschedule,
}: {
  enrollment: Enrollment;
  onBookSession?: () => void;
  onReschedule?: () => void;
}) {
  const { isDesktop } = useViewport();
  const [, setTick] = useState(0);
  const [showQuestionBox, setShowQuestionBox] = useState(false);
  const [question, setQuestion] = useState("");
  const [showVideoModal, setShowVideoModal] = useState(false);

  // Re-derive status every 20s — this is what moves the card from
  // scheduled → starting_soon → live → completed with no reload.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 20000);
    return () => window.clearInterval(id);
  }, []);

  const mentor = MENTORS.find((m) => m.id === enrollment.mentorId);
  const path = PATHS.find((p) => p.id === enrollment.pathId);

  if (!mentor) return null;

  // Mentor chosen, but no session booked yet.
  if (!enrollment.sessionAt) {
    return (
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, padding: isDesktop ? "22px 26px" : "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: C.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <CalendarClock size={18} color={C.textFaint} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.92rem", fontWeight: 600, color: C.text }}>No session booked yet</div>
            <div style={{ fontSize: "0.78rem", color: C.textMuted, marginTop: 2 }}>Book a time with {mentor.name} to get started.</div>
          </div>
          <button
            onClick={onBookSession}
            style={{ display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "10px 18px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}
          >
            Book a session
          </button>
        </div>
      </div>
    );
  }

  const status = getSessionStatus(enrollment);
  const meta = STATUS_META[status] ?? STATUS_META.scheduled;
  const sessionDate = new Date(enrollment.sessionAt);
  const dateLabel = sessionDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = sessionDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const meetingUrl = meetingUrlFor(enrollment.pathId, mentor.name);
  const calendarUrl = calendarUrlFor(enrollment.pathId, path?.title ?? enrollment.pathId, mentor.name, enrollment.sessionAt, enrollment.sessionDurationMin);

  const handleJoin = () => {
    joinSession(enrollment.pathId);
    setTick((t) => t + 1);
    setShowVideoModal(true);
    toast.success("You've joined the session", { description: `Live with ${mentor.name}` });
  };

  const handleReflectionComplete = () => {
    completeSessionReflection(enrollment.pathId);
    setTick((t) => t + 1);
    toast.success("Reflection marked complete", { description: "+30 XP awarded" });
  };

  const submitQuestion = () => {
    if (!question.trim()) return;
    const stamp = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const addition = `[${stamp}] Question for mentor: ${question.trim()}`;
    setNotes(enrollment.pathId, enrollment.notes ? `${enrollment.notes}\n${addition}` : addition);
    setQuestion("");
    setShowQuestionBox(false);
    toast.success("Question saved for your mentor");
  };

  const summary = sessionSummaryFor(path?.title ?? enrollment.pathId, path?.modules[enrollment.weekIndex] ?? "your milestone", mentor.name);

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, padding: isDesktop ? "22px 26px" : "16px 18px" }}>
      {/* Header — mentor identity + status pill */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: `${mentor.color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.86rem", fontWeight: 700, color: mentor.color, flexShrink: 0,
          }}>
            {mentor.initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 600, color: C.text }}>{mentor.name}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.64rem", fontWeight: 700, color: meta.color, background: meta.bg, padding: "2px 8px", borderRadius: 999 }}>
                {status === "live" && <Radio size={9} />} {meta.label}
              </span>
            </div>
            <div style={{ fontSize: "0.78rem", color: C.textMuted, marginTop: 2 }}>{path?.title ?? enrollment.pathId}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: C.textFaint, marginTop: 4 }}>
              <Clock size={11} /> {dateLabel} · {timeLabel} · {enrollment.sessionDurationMin} min
            </div>
          </div>
        </div>

        {/* Countdown — only meaningful before the session starts */}
        {(status === "scheduled" || status === "starting_soon") && (
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: C.gold, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
            {formatCountdown(enrollment.sessionAt)}
          </span>
        )}
      </div>

      {/* Action row — one per state, never a route change */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 18 }}>

        {status === "scheduled" && (
          <>
            <button
              disabled
              style={{
                display: "flex", alignItems: "center", gap: 7, background: C.surfaceAlt, color: C.textFaint,
                border: `1px solid ${C.borderMuted}`, borderRadius: C.radiusSm, padding: "10px 18px",
                fontSize: "0.8rem", fontWeight: 600, cursor: "default", fontFamily: "'Inter', sans-serif",
              }}
            >
              You'll be notified when the session begins
            </button>
            <GhostButton href={calendarUrl}><CalendarPlus size={14} /> Add to Calendar</GhostButton>
            <button
              onClick={() => setShowQuestionBox((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: "10px 4px", fontSize: "0.8rem", fontWeight: 600, color: C.textMuted, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              <HelpCircle size={14} /> Add questions
            </button>
          </>
        )}

        {status === "starting_soon" && (
          <>
            <motion.button
              onClick={handleJoin}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff",
                border: "none", borderRadius: C.radiusSm, padding: "10px 18px",
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              <Video size={14} /> Join Video Call Early
            </motion.button>
            <GhostButton href={calendarUrl}><CalendarPlus size={14} /> Add to Calendar</GhostButton>
            <button
              onClick={() => setShowQuestionBox((v) => !v)}
              style={{ display: "flex", alignItems: "center", gap: 7, background: "none", border: "none", padding: "10px 4px", fontSize: "0.8rem", fontWeight: 600, color: C.textMuted, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              <HelpCircle size={14} /> Add questions
            </button>
          </>
        )}

        {status === "live" && !enrollment.sessionJoined && (
          <>
            <motion.button
              onClick={handleJoin}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              animate={{ boxShadow: ["0 0 0px 0px rgba(201,162,39,0.4)", "0 0 22px 4px rgba(201,162,39,0.4)", "0 0 0px 0px rgba(201,162,39,0.4)"] }}
              transition={{ boxShadow: { duration: 1.8, repeat: Infinity, ease: "easeInOut" } }}
              style={{
                display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff",
                border: "none", borderRadius: C.radiusSm, padding: "10px 18px",
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              <Video size={14} /> Join Session (In-App)
            </motion.button>
            <GhostButton href={meetingUrl}><Video size={14} /> Open in New Tab</GhostButton>
          </>
        )}

        {status === "live" && enrollment.sessionJoined && (
          <>
            <span style={{ display: "flex", alignItems: "center", gap: 7, fontSize: "0.8rem", fontWeight: 600, color: "#0F9D6C" }}>
              <Check size={14} /> You're in the session
            </span>
            <motion.button
              onClick={() => setShowVideoModal(true)}
              whileHover={{ y: -1 }}
              style={{
                display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff",
                border: "none", borderRadius: C.radiusSm, padding: "10px 18px",
                fontSize: "0.8rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              <Video size={14} /> Reopen Call Room
            </motion.button>
            <GhostButton href={meetingUrl}><Video size={14} /> Open in New Tab</GhostButton>
          </>
        )}

        {status === "completed" && (
          <>
            {onReschedule && (
              <button
                onClick={onReschedule}
                style={{ display: "flex", alignItems: "center", gap: 7, background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "10px 18px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                <CalendarPlus size={14} /> Book next session
              </button>
            )}
          </>
        )}
      </div>

      {/* Add-questions inline box (scheduled / starting_soon) */}
      <AnimatePresence>
        {showQuestionBox && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ display: "flex", gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${C.borderMuted}` }}>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitQuestion(); }}
                placeholder="What do you want to ask your mentor?"
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: "0.82rem", fontFamily: "'Inter', sans-serif", outline: "none", color: C.text }}
              />
              <button
                onClick={submitQuestion}
                style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                <Send size={13} /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Completed — session summary, mentor notes, action items, reflection */}
      {status === "completed" && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${C.borderMuted}`, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <span style={{ ...SESSION_LABEL, display: "block", marginBottom: 6 }}>Session Summary</span>
            <p style={{ fontSize: "0.84rem", color: C.text, margin: 0, lineHeight: 1.55 }}>{summary.summary}</p>
          </div>
          <div>
            <span style={{ ...SESSION_LABEL, display: "block", marginBottom: 6 }}>Mentor Notes</span>
            <p style={{ fontSize: "0.84rem", color: C.textMuted, margin: 0, lineHeight: 1.55, fontStyle: "italic" }}>{summary.mentorNotes}</p>
          </div>
          <div>
            <span style={{ ...SESSION_LABEL, display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <ClipboardList size={12} /> Action Items
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {summary.actionItems.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: "0.82rem", color: C.text }}>
                  <Check size={13} color={C.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={handleReflectionComplete}
            disabled={enrollment.sessionReflectionDone}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", alignSelf: "flex-start",
              borderRadius: C.radiusSm, border: "none", cursor: enrollment.sessionReflectionDone ? "default" : "pointer",
              fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", fontWeight: 600,
              background: enrollment.sessionReflectionDone ? C.surfaceAlt : C.gold,
              color: enrollment.sessionReflectionDone ? "#0F9D6C" : "#fff",
            }}
          >
            {enrollment.sessionReflectionDone ? <>Reflection complete <Check size={14} /></> : "Mark reflection complete"}
          </button>
        </div>
      )}

      {/* Embedded Luxury WebRTC Call Room */}
      <VideoCallModal
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setTick((t) => t + 1);
        }}
        meetingUrl={meetingUrl}
        mentorName={mentor.name}
        mentorInitials={mentor.initials}
        mentorColor={mentor.color}
        pathTitle={path?.title ?? enrollment.pathId}
        onSessionReflection={handleReflectionComplete}
      />
    </div>
  );
}

/* ── The 10-minutes-before banner (item 2) ────────────────────────────────
   Lives at the top of whatever page renders it. Dismissible; re-appears
   for a genuinely new session (dismissal is keyed to sessionAt) rather
   than being gone forever after the first dismiss. */
export function SessionReminderBanner({
  enrollment,
  onViewSession,
  onAddNotes,
}: {
  enrollment: Enrollment | null;
  onViewSession?: () => void;
  onAddNotes?: () => void;
}) {
  const { isDesktop } = useViewport();
  const [tick, setTick] = useState(0);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 20000);
    return () => window.clearInterval(id);
  }, []);

  if (!enrollment || !enrollment.sessionAt || !enrollment.mentorId) return null;
  const status = getSessionStatus(enrollment);
  if (status !== "starting_soon" || dismissedFor === enrollment.sessionAt) return null;

  const mentor = MENTORS.find((m) => m.id === enrollment.mentorId);
  const mins = minutesUntilSession(enrollment.sessionAt);

  return (
    <AnimatePresence>
      <motion.div
        key={`reminder-${enrollment.sessionAt}-${tick}`}
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: C.radius,
          padding: isDesktop ? "13px 22px" : "12px 16px", margin: isDesktop ? "0 48px 20px" : "0 16px 16px",
        }}
      >
        <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.goldLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Bell size={14} color={C.gold} />
        </div>
        <span style={{ flex: 1, minWidth: 200, fontSize: "0.86rem", color: C.text }}>
          Your session with <strong>{mentor?.name ?? "your mentor"}</strong> starts in {mins} minute{mins === 1 ? "" : "s"}.
        </span>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <button
            onClick={onViewSession}
            style={{ background: C.gold, color: "#fff", border: "none", borderRadius: C.radiusSm, padding: "8px 16px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            View session
          </button>
          <button
            onClick={onAddNotes}
            style={{ background: "transparent", border: `1px solid ${C.goldBorder}`, color: C.text, borderRadius: C.radiusSm, padding: "8px 16px", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Add notes
          </button>
          <button
            onClick={() => setDismissedFor(enrollment.sessionAt)}
            title="Dismiss"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, display: "flex", padding: 4 }}
          >
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
