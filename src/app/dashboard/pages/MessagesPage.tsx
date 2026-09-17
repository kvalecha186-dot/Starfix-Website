import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Send, Paperclip, Calendar, Video, MessageCircle, ChevronRight,
  TrendingUp, FileSearch, ClipboardList, BookOpen, MoreVertical, ArrowLeft,
} from "lucide-react";
import { C } from "../dashColors";
import type { DashPage } from "../DashboardLayout";
import { MENTORS, type Mentor } from "./MentorsPage";
import { PATHS } from "./GoalsPage";
import {
  getConversations, getConversation, ensureConversation, sendMessage,
  markDelivered, markRead, archiveConversation, QUICK_CHIPS,
  MESSAGES_CHANGED_EVENT, TYPING_CHANGED_EVENT, isMentorTyping, type Conversation,
} from "../../lib/messages";
import {
  getAllEnrollments, getSessionStatus, formatCountdown,
  calendarUrlFor, meetingUrlFor,
} from "../../lib/pathProgress";

/* ─────────────────────────────────────────────────────────────────────────
   /messages — a focused, professional mentorship workspace (Topmate ×
   Notion × Headspace), not a social chat app: no reactions, no stories, no
   online-everywhere green dots. Three columns — conversation list, thread
   + onboarding, and a live "Learning Context" panel pulled straight from
   the learner's real enrollment data — everything backed by
   lib/messages.ts + lib/pathProgress.ts so it all survives refresh.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};
const ACTIVE_BG = "#FFF8E6";
const ACTIVE_GLOW = "radial-gradient(circle at top right, rgba(212,169,31,0.08), transparent 60%)";

function Avatar({ initials, color, size = 44 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(155deg, ${color}26, ${color}0c)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: size * 0.36, fontWeight: 700, color }}>
        {initials}
      </span>
    </div>
  );
}

function timeAgo(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function clockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ── Empty state — no conversations yet ── */
function EmptyInbox({ onFindMentor }: { onFindMentor?: () => void }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 18, padding: 48, textAlign: "center",
    }}>
      <div style={{
        width: 76, height: 76, borderRadius: "50%", background: C.goldLight,
        border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <MessageCircle size={30} color={C.gold} strokeWidth={1.6} />
      </div>
      <div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.2rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
          Your mentor conversations will appear here.
        </h2>
        <p style={{ fontSize: "0.85rem", color: C.textMuted, margin: 0, maxWidth: 320 }}>
          Message a mentor from their profile and your conversation shows up in this inbox.
        </p>
      </div>
      <button
        onClick={onFindMentor}
        style={{
          background: C.gold, color: "#fff", border: "none", borderRadius: 999, padding: "11px 22px",
          fontSize: "0.84rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
        }}
      >
        Find a mentor
      </button>
    </div>
  );
}

/* ── Conversation list row (left column) ── */
function ConversationRow({
  mentor, convo, active, onClick,
}: { mentor: Mentor; convo: Conversation; active: boolean; onClick: () => void }) {
  const last = convo.messages.at(-1);
  const preview = last ? (last.sender === "user" ? `You: ${last.text}` : last.text) : "";
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left",
        padding: "12px 14px", borderRadius: 14, border: `1px solid ${active ? C.goldBorder : "transparent"}`,
        backgroundColor: active ? ACTIVE_BG : "transparent",
        backgroundImage: active ? ACTIVE_GLOW : "none",
        cursor: "pointer",
        fontFamily: "'Inter', sans-serif", transition: "background-color 140ms ease, border-color 140ms ease",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = C.surfaceAlt; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
    >
      <Avatar initials={mentor.initials} color={mentor.color} size={42} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: "0.87rem", fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {mentor.name}
          </span>
          {last && <span style={{ fontSize: "0.68rem", color: C.textFaint, flexShrink: 0 }}>{timeAgo(last.sentAt)}</span>}
        </div>
        <div style={{ fontSize: "0.72rem", color: C.textFaint, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {mentor.title}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: "0.78rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {preview}
          </span>
          {convo.unreadCount > 0 && (
            <span style={{
              minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999, background: C.gold, color: "#fff",
              fontSize: "0.66rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              {convo.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── One chat bubble. Mentor bubbles reveal their timestamp on hover, same
   as before. Learner bubbles always show a small status line underneath
   (Sent / Delivered / Seen) instead — status only ever advances from real
   events (persisted → delivered; a real mentor opening the thread → seen),
   never from a timer pretending to be a reply. ── */
function MessageBubble({ msg }: { msg: Conversation["messages"][0] }) {
  const [hover, setHover] = useState(false);
  const mine = msg.sender === "user";
  const statusLabel = mine && msg.status
    ? msg.status === "seen" ? "Seen" : msg.status === "delivered" ? "Delivered" : "Sent"
    : null;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start", marginBottom: 14 }}
    >
      <div
        style={{
          maxWidth: "72%", padding: "11px 16px", borderRadius: 18,
          borderBottomRightRadius: mine ? 6 : 18, borderBottomLeftRadius: mine ? 18 : 6,
          background: mine ? "#FFF3D6" : "#fff",
          border: mine ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`,
          color: C.text, fontSize: "0.86rem", lineHeight: 1.55,
        }}
      >
        {msg.text}
      </div>
      {mine ? (
        <span style={{ fontSize: "0.66rem", color: C.textFaint, marginTop: 4, padding: "0 2px" }}>
          {statusLabel}{statusLabel ? " · " : ""}{clockTime(msg.sentAt)}
        </span>
      ) : (
        <span style={{
          fontSize: "0.68rem", color: C.textFaint, marginTop: 4, opacity: hover ? 1 : 0,
          transition: "opacity 140ms ease", padding: "0 2px",
        }}>
          {clockTime(msg.sentAt)}
        </span>
      )}
    </div>
  );
}

/* ── Premium onboarding card — replaces a bare "welcome" bubble the first
   time a thread is opened. Clicking a card only inserts a draft, exactly
   like the quick chips below the composer — nothing here ever sends on
   its own. ── */
function OnboardingCard({ onPick }: { onPick: (text: string) => void }) {
  const CARDS = [
    { label: "Review my progress", Icon: TrendingUp,    chip: "Review my progress" },
    { label: "Explain this topic", Icon: FileSearch,    chip: "Explain this topic" },
    { label: "Check my project",   Icon: ClipboardList, chip: "Check my project" },
    { label: "Build a study plan", Icon: BookOpen,       chip: "Build a study plan" },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      style={{ padding: "8px 22px 4px" }}
    >
      <div style={{
        background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 18,
        padding: "20px 22px", marginBottom: 18,
      }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>
          Welcome to your mentorship space
        </h3>
        <p style={{ fontSize: "0.83rem", color: C.textMuted, margin: 0, lineHeight: 1.5 }}>
          Ask your mentor anything about your current milestone, project, interview prep, or next steps.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
        {CARDS.map((c) => {
          const chipText = QUICK_CHIPS.find((q) => q.label === c.chip)?.text ?? c.label;
          return (
            <motion.button
              key={c.label}
              onClick={() => onPick(chipText)}
              whileHover={{ y: -2 }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 10,
                background: "#fff", border: `1px solid ${C.border}`, borderRadius: 16,
                padding: "16px 18px", cursor: "pointer", textAlign: "left",
                fontFamily: "'Inter', sans-serif", transition: "transform 150ms ease, box-shadow 150ms ease",
              }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: C.goldLight,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <c.Icon size={15} color={C.gold} strokeWidth={1.8} />
              </div>
              <span style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text }}>{c.label}</span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ── Session card — only when a real session is booked with this mentor ── */
function SessionCard({ mentor }: { mentor: Mentor }) {
  const enrollment = getAllEnrollments().find((e) => e.mentorId === mentor.id);
  if (!enrollment || !enrollment.sessionAt) return null;
  const status = getSessionStatus(enrollment);
  if (status === "none" || status === "completed") return null;

  const dateLabel = new Date(enrollment.sessionAt).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const timeLabel = new Date(enrollment.sessionAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px 18px", margin: "14px 22px 0",
      background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 14,
    }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Calendar size={15} color={C.gold} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{dateLabel} · {timeLabel}</div>
        <div style={{ fontSize: "0.72rem", color: C.textMuted }}>
          {status === "live" ? "Session is live now" : status === "starting_soon" ? "Starting soon" : formatCountdown(enrollment.sessionAt)}
        </div>
      </div>
      {status === "live" ? (
        <a
          href={meetingUrlFor(enrollment.pathId, mentor.name)} target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, background: C.gold, color: "#fff", borderRadius: 999, padding: "8px 14px", fontSize: "0.76rem", fontWeight: 600, textDecoration: "none", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}
        >
          <Video size={13} /> Join when live
        </a>
      ) : (
        <a
          href={calendarUrlFor(enrollment.pathId, mentor.title, mentor.name, enrollment.sessionAt, enrollment.sessionDurationMin)}
          target="_blank" rel="noreferrer"
          style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", color: C.text, border: `1px solid ${C.border}`, borderRadius: 999, padding: "8px 14px", fontSize: "0.76rem", fontWeight: 600, textDecoration: "none", fontFamily: "'Inter', sans-serif", flexShrink: 0 }}
        >
          <Calendar size={13} /> Add to calendar
        </a>
      )}
    </div>
  );
}

/* ── Next-session chip in the mentor header — a compact companion to the
   fuller SessionCard below, so the header alone communicates "you have
   something coming up" at a glance. ── */
function NextSessionChip({ mentorId }: { mentorId: number }) {
  const enrollment = getAllEnrollments().find((e) => e.mentorId === mentorId);
  if (!enrollment || !enrollment.sessionAt) return null;
  const status = getSessionStatus(enrollment);
  if (status === "none" || status === "completed") return null;
  const label = status === "live"
    ? "Live now"
    : new Date(enrollment.sessionAt).toLocaleDateString("en-US", { weekday: "short" }) +
      " · " + new Date(enrollment.sessionAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 600,
      color: C.gold, background: C.goldLight, border: `1px solid ${C.goldBorder}`,
      padding: "4px 10px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0,
    }}>
      <Calendar size={11} /> {label}
    </span>
  );
}

/* Tracks viewport width so the workspace can genuinely reflow at the
   requested breakpoints (a plain resize listener, since this project has
   no CSS-media-query setup for inline-styled components). */
function useViewportWidth(): number {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440));
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

/* ─── Component ─────────────────────────────────── */

export function MessagesPage({
  onNavigate, openMentorId, onOpenedMentor, onFindMentor,
}: {
  onNavigate?: (p: DashPage) => void;
  openMentorId?: number | null;
  onOpenedMentor?: () => void;
  onFindMentor?: () => void;
}) {
  const [, forceTick] = useState(0);
  const refresh = () => forceTick((n) => n + 1);
  const viewportWidth = useViewportWidth();
  const isMobile = viewportWidth < 768;
  const isDesktop = viewportWidth >= 1024;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [menuOpen]);

  useEffect(() => {
    window.addEventListener(MESSAGES_CHANGED_EVENT, refresh);
    window.addEventListener(TYPING_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(MESSAGES_CHANGED_EVENT, refresh);
      window.removeEventListener(TYPING_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (openMentorId == null) return;
    const mentor = MENTORS.find((m) => m.id === openMentorId);
    if (!mentor) { onOpenedMentor?.(); return; }
    ensureConversation(mentor.id, mentor.name);
    setSelectedId(mentor.id);
    markRead(mentor.id);
    onOpenedMentor?.();
  }, [openMentorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = getConversations();
  const filtered = list.filter((c) => {
    const mentor = MENTORS.find((m) => m.id === c.mentorId);
    if (!mentor) return false;
    const q = search.toLowerCase();
    return !q || mentor.name.toLowerCase().includes(q) || mentor.title.toLowerCase().includes(q);
  });

  useEffect(() => {
    if (selectedId == null && list.length > 0) setSelectedId(list[0].mentorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.length]);

  const selectedMentor = selectedId != null ? MENTORS.find((m) => m.id === selectedId) ?? null : null;
  const selectedConvo = selectedId != null ? getConversation(selectedId) : null;

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [selectedConvo?.messages.length]);

  const selectConversation = (mentorId: number) => {
    setSelectedId(mentorId);
    markRead(mentorId);
    refresh();
  };

  // No reply is ever generated here — sending only persists the learner's
  // own message. Status only ever advances to "delivered" once it's safely
  // stored (a technical confirmation, same as any real chat app), and to
  // "seen" only if a real mentor actually opens the thread — nothing here
  // simulates that.
  const handleSend = (text: string) => {
    if (!selectedMentor || !text.trim()) return;
    sendMessage(selectedMentor.id, text);
    setDraft("");
    refresh();
  };

  const insertChip = (text: string) => setDraft((d) => (d ? `${d} ${text}` : text));

  if (list.length === 0) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "24px 24px 0" }}>
          <div style={{ ...LABEL, marginBottom: 8 }}>Mentorship</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
            Messages
          </h1>
        </div>
        <EmptyInbox onFindMentor={onFindMentor} />
      </div>
    );
  }

  const isFreshThread = (selectedConvo?.messages.length ?? 0) <= 1;
  // "First message" means the learner's own first message to THIS mentor —
  // derived straight from persisted conversation history (lib/messages.ts),
  // so it's naturally per-conversation and survives reload/return without
  // any extra storage of its own.
  const hasSentFirstMessage = (selectedConvo?.messages.some((m) => m.sender === "user")) ?? false;

  return (
    <div style={{
      background: C.bg, width: "100%", maxWidth: "none",
      minHeight: "100vh", height: "100vh", display: "flex", flexDirection: "column",
      boxSizing: "border-box",
    }}>
      <div style={{ padding: isDesktop ? "24px 24px 18px" : "16px 16px 14px" }}>
        <div style={{ ...LABEL, marginBottom: 8 }}>Mentorship</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "2rem" : "1.6rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
          Messages
        </h1>
      </div>

      <div style={{ flex: 1, display: "flex", minHeight: 0, padding: isDesktop ? "0 24px 24px" : "0 16px 16px", gap: isDesktop ? 24 : 12 }}>
        {/* ══ LEFT — conversation list (320px, hidden on mobile once a thread is open) ══ */}
        {(!isMobile || !selectedMentor) && (
        <div style={{
          width: isMobile ? "100%" : 320, flexShrink: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          <div style={{ padding: 16, borderBottom: `1px solid ${C.borderMuted}` }}>
            <div style={{ position: "relative" }}>
              <Search size={14} color={C.textFaint} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search mentors…"
                style={{
                  width: "100%", background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 12,
                  padding: "9px 12px 9px 34px", fontSize: "0.82rem", color: C.text, outline: "none",
                  fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
                }}
              />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 3 }}>
            {filtered.map((c) => {
              const mentor = MENTORS.find((m) => m.id === c.mentorId);
              if (!mentor) return null;
              return (
                <ConversationRow
                  key={c.mentorId}
                  mentor={mentor}
                  convo={c}
                  active={c.mentorId === selectedId}
                  onClick={() => selectConversation(c.mentorId)}
                />
              );
            })}
          </div>
        </div>
        )}

        {/* ══ CENTER — chat area (dominant, flexible; full width on mobile when a thread is open) ══ */}
        {(!isMobile || selectedMentor) && (
        <div style={{
          flex: 1, minWidth: 0, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20,
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}>
          {!selectedMentor || !selectedConvo ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: C.textFaint, fontSize: "0.86rem" }}>
              Select a conversation to start messaging.
            </div>
          ) : (
            <>
              {/* Mentor header */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 22px", borderBottom: `1px solid ${C.borderMuted}` }}>
                {isMobile && (
                  <button
                    onClick={() => setSelectedId(null)}
                    title="Back to conversations"
                    style={{
                      width: 30, height: 30, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: C.textMuted,
                    }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}
                <Avatar initials={selectedMentor.initials} color={selectedMentor.color} size={40} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: C.text }}>{selectedMentor.name}</div>
                  <div style={{ fontSize: "0.74rem", color: C.textMuted }}>{selectedMentor.title} · {selectedMentor.company}</div>
                </div>
                <NextSessionChip mentorId={selectedMentor.id} />
                <div style={{ fontSize: "0.72rem", color: C.textFaint, whiteSpace: "nowrap" }}>
                  Usually replies within 2 hours
                </div>
                <div style={{ position: "relative" }} ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((o) => !o)}
                    title="More options"
                    style={{
                      width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center",
                      background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: C.textFaint,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceAlt; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.12 }}
                      style={{
                        position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 20,
                        background: "#fff", border: `1px solid ${C.border}`, borderRadius: 12,
                        boxShadow: "0 8px 24px rgba(0,0,0,0.1)", padding: 6, minWidth: 160,
                      }}
                    >
                      <button
                        onClick={() => { archiveConversation(selectedMentor.id); setMenuOpen(false); }}
                        style={{
                          width: "100%", textAlign: "left", background: "transparent", border: "none",
                          borderRadius: 8, padding: "8px 10px", fontSize: "0.82rem", color: C.text,
                          cursor: "pointer", fontFamily: "'Inter', sans-serif",
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceAlt; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                      >
                        Archive conversation
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Session card, if booked */}
              <SessionCard mentor={selectedMentor} />

              {/* Message thread + onboarding */}
              <div ref={scrollRef} style={{ flex: 1, overflowY: "auto" }}>
                {isFreshThread && <OnboardingCard onPick={(text) => insertChip(text)} />}
                <div style={{ padding: "8px 22px 6px" }}>
                  {selectedConvo.messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
                  {isMentorTyping(selectedMentor.id) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0 10px" }}>
                      <div
                        style={{
                          background: C.surfaceAlt,
                          border: `1px solid ${C.border}`,
                          borderRadius: "16px 16px 16px 4px",
                          padding: "8px 14px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: "0.76rem", color: C.textMuted, fontStyle: "italic" }}>
                          {selectedMentor.name.split(" ")[0]} is typing
                        </span>
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                          <span style={{ width: 4, height: 4, borderRadius: "50%", background: C.gold, display: "inline-block" }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick-start chips + helper — shown only before the user's
                 first message to this mentor, per conversation (driven by
                 real message history, so it never reappears on reload or
                 a later visit). Fades out in place so the composer simply
                 slides up into the freed space — no collapse/jump. */}
              <AnimatePresence initial={false}>
                {!hasSentFirstMessage && (
                  <motion.div
                    key="quick-start"
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 22px 8px" }}>
                      <span style={{ fontSize: "0.76rem", color: C.textFaint, fontFamily: "'Inter', sans-serif" }}>
                        Start the conversation with your mentor using a quick prompt or type your own message.
                      </span>
                    </div>
                    <div className={isDesktop ? undefined : "starfix-chip-scroll"} style={{ display: "flex", flexWrap: isDesktop ? "wrap" : "nowrap", gap: 7, padding: "0 22px 12px" }}>
                      {QUICK_CHIPS.map((chip) => (
                        <button
                          key={chip.label}
                          onClick={() => insertChip(chip.text)}
                          style={{
                            display: "flex", alignItems: "center", gap: 4, background: C.surfaceAlt,
                            border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 12px",
                            fontSize: "0.74rem", fontWeight: 500, color: C.textMuted, cursor: "pointer",
                            fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap", flexShrink: 0,
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.background = C.goldLight; e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.color = "#7A5C00"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = C.surfaceAlt; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.textMuted; }}
                        >
                          {chip.label} <ChevronRight size={11} />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>


              {/* Composer */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 22px 20px" }}>
                <button
                  title="Attach image or file"
                  style={{
                    width: 42, height: 42, flexShrink: 0, borderRadius: 14, background: C.surfaceAlt,
                    border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                  }}
                >
                  <Paperclip size={16} color={C.textMuted} />
                </button>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSend(draft); }}
                  placeholder="Ask your mentor about your current milestone…"
                  style={{
                    flex: 1, background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 999,
                    padding: "13px 18px", fontSize: "0.86rem", color: C.text, outline: "none",
                    fontFamily: "'Inter', sans-serif", boxSizing: "border-box", transition: "box-shadow 140ms ease, border-color 140ms ease",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.boxShadow = `0 0 0 3px ${C.goldBorder}`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
                />
                <motion.button
                  onClick={() => handleSend(draft)}
                  whileTap={{ scale: 0.94 }}
                  disabled={!draft.trim()}
                  style={{
                    width: 42, height: 42, flexShrink: 0, borderRadius: 14, background: draft.trim() ? C.gold : C.borderMuted,
                    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: draft.trim() ? "pointer" : "default", transition: "background 140ms ease",
                  }}
                >
                  <Send size={16} color={draft.trim() ? "#fff" : C.textFaint} />
                </motion.button>
              </div>

              {/* Trust note — sets expectations honestly instead of
                 letting the interface imply an AI is replying. */}
              <div style={{ textAlign: "center", padding: "0 22px 18px" }}>
                <span style={{ fontSize: "0.7rem", color: C.textFaint, fontFamily: "'Inter', sans-serif" }}>
                  Messages are answered by your actual mentor, not by AI.
                </span>
              </div>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
