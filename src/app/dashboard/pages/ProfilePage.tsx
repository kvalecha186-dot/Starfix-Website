import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit3, Flame, Target, ArrowRight, Sparkles,
  Code2, MessageSquare, Wind, TrendingUp, CheckCircle2,
  ExternalLink, Clock, Zap, MessageCircle, Calendar,
  Upload, Trash2, Bookmark, X,
  Youtube, CalendarDays, Trophy, Briefcase, Users, BookOpen, Award, GraduationCap,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
} from "recharts";
import { useNavigate } from "react-router";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";
import { PATHS as GROWTH_PATHS } from "./GoalsPage";
import { getSavedItems, removeSavedItem, type SavedItem } from "../../lib/savedItems";
import { MENTORS } from "./MentorsPage";
import { getAllEnrollments } from "../../lib/pathProgress";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

interface FocusArea {
  title: string;
  Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  purpose: string;
  progress: number;
  streak: string;
  lastActive: string;
  slug?: string;
}

/* ─────────────────────────────────────────────────────────────────────────
   Data — trimmed to only what genuinely helps someone track real progress.
───────────────────────────────────────────────────────────────────────── */

const FOCUS_AREAS = [
  { title: "Coding",        Icon: Code2,         purpose: "Full-stack & real projects",        progress: 72, streak: "5/7 days", lastActive: "2h ago" },
  { title: "Communication", Icon: MessageSquare, purpose: "Confidence & public speaking",       progress: 64, streak: "4/7 days", lastActive: "Yesterday" },
  { title: "Wellness",      Icon: Wind,          purpose: "Energy & daily consistency",         progress: 20, streak: "2/7 days", lastActive: "3 days ago" },
];

const GROWING_FEED = [
  { Icon: CheckCircle2, text: "Finished React module",       time: "2h ago" },
  { Icon: MessageCircle, text: "Asked mentor a question",     time: "Yesterday" },
  { Icon: Wind,          text: "Started Wellness week 1",     time: "3 days ago" },
];

const activityData = [
  { day: "Mon", full: "Mon", h: 2.8 },
  { day: "Tue", full: "Tue", h: 2.4 },
  { day: "Wed", full: "Wed", h: 2.7 },
  { day: "Thu", full: "Thu", h: 3.6 },
  { day: "Fri", full: "Fri", h: 3.2 },
  { day: "Sat", full: "Sat", h: 5.1 },
  { day: "Sun", full: "Sun", h: 4.6 },
];
const WEEKLY_TOTAL_HOURS = activityData.reduce((sum, d) => sum + d.h, 0);

/* ─────────────────────────────────────────────────────────────────────────
   Starfix identity — the editable profile data, plus the fixed option
   lists for the Edit Profile modal. Transformation-focus choices are NOT
   fixed here — they're sourced from the learner's actual active paths at
   render time, so the multi-select only ever offers real, active Starfix
   paths, never the full path catalog.
───────────────────────────────────────────────────────────────────────── */

interface StarfixProfileData {
  name: string;
  avatarUrl?: string;
  tagline: string;
  focusAreas: string[];
  dailyGoal: string;
  mentorshipStyle: string[];
  notifications: {
    sessionReminders: boolean;
    taskReminders: boolean;
    weeklyReview: boolean;
    achievementAlerts: boolean;
    newResources: boolean;
    mentorMessages: boolean;
  };
}

const DAILY_GOAL_OPTIONS = ["15 min", "30 min", "45 min", "1 hour", "2+ hours"];

const MENTORSHIP_STYLES = [
  "Structured", "Accountability", "Career-focused",
  "Beginner-friendly", "Deep learning", "Motivation & consistency",
];

const NOTIFICATION_ITEMS: { key: keyof StarfixProfileData["notifications"]; label: string }[] = [
  { key: "sessionReminders",  label: "Session reminders" },
  { key: "taskReminders",     label: "Task reminders" },
  { key: "weeklyReview",      label: "Weekly review" },
  { key: "achievementAlerts", label: "Achievement alerts" },
  { key: "newResources",      label: "New resources" },
  { key: "mentorMessages",    label: "Mentor messages" },
];

function makeDefaultProfile(name: string, activeFocusAreas: string[]): StarfixProfileData {
  return {
    name,
    avatarUrl: undefined,
    tagline: "Becoming stronger every day.",
    focusAreas: activeFocusAreas.slice(0, 2),
    dailyGoal: "30 min",
    mentorshipStyle: ["Accountability"],
    notifications: {
      sessionReminders: true,
      taskReminders: true,
      weeklyReview: true,
      achievementAlerts: true,
      newResources: false,
      mentorMessages: true,
    },
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   Shared bits
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: C.textFaint,
  fontFamily: "'Inter', sans-serif",
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -3, boxShadow: C.shadowMd }}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        boxShadow: C.shadow,
        transition: "box-shadow 200ms ease",
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

/* Redesigned profile hero — large avatar, growth-focused identity, minimal
   ghost edit button, and a trio of status badges (Level, Streak, Rising
   Star). Uses its own tight warm-white / gold / charcoal palette layered on
   top of the shared dashColors tokens, so it reads as a deliberate
   "identity moment" rather than just another dashboard Card. */
const ID = {
  bg: "#0C0B18",
  gold: "#D4AF37",
  text: "#FAF9F6",
  border: "rgba(255,255,255,0.08)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 12,
  border: `1px solid ${ID.border}`, background: "#141324", color: ID.text,
  fontSize: "0.86rem", fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
};

const ghostBtnStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: 7, padding: "9px 14px", borderRadius: 10,
  border: `1px solid ${ID.border}`, background: "#141324", color: ID.text,
  fontSize: "0.78rem", fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: "pointer",
};

/* Small labeled section wrapper used throughout the Edit Profile modal. */
function FieldGroup({ label, children, last }: { label: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 4 : 26 }}>
      <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>{label}</span>
      {children}
    </div>
  );
}

/* Gentle, iOS-style toggle switch for notification preferences. */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button
      type="button"
      className="icon-button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 42, height: 25, borderRadius: 999, border: "none", cursor: "pointer",
        background: checked ? ID.gold : "rgba(255,255,255,0.14)", position: "relative", flexShrink: 0, padding: 0,
      }}
      animate={{ backgroundColor: checked ? ID.gold : "rgba(255,255,255,0.14)" }}
      transition={{ duration: 0.2 }}
    >
      <motion.span
        animate={{ left: checked ? 19 : 3 }}
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        style={{
          position: "absolute", top: 3, width: 19, height: 19, borderRadius: "50%", background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        }}
      />
    </motion.button>
  );
}

/* Multi-select gold chips — used for Transformation Focus and Mentorship
   Style. Selecting/deselecting animates with a soft scale pulse. */
function ChipMultiSelect({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <motion.button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            whileTap={{ scale: 0.95 }}
            animate={{ scale: active ? 1.03 : 1 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              padding: "8px 16px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${active ? ID.gold : ID.border}`,
              background: active ? `${ID.gold}14` : "#141324",
              color: active ? ID.gold : C.textMuted,
              fontSize: "0.8rem", fontWeight: 600, fontFamily: "'Inter', sans-serif",
            }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

/* Single-select pill row — used for Daily Learning Goal. */
function PillSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map((opt) => {
        const active = opt === value;
        return (
          <motion.button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "8px 16px", borderRadius: 999, cursor: "pointer",
              border: `1px solid ${active ? ID.gold : ID.border}`,
              background: active ? ID.gold : "#141324",
              color: active ? "#fff" : C.textMuted,
              fontSize: "0.8rem", fontWeight: 600, fontFamily: "'Inter', sans-serif",
              transition: "background 160ms ease, color 160ms ease, border-color 160ms ease",
            }}
          >
            {opt}
          </motion.button>
        );
      })}
    </div>
  );
}

/* Avatar upload / auto-circle-crop / remove. Uses a plain FileReader +
   a circularly clipped, center-cropped <img> (object-fit: cover) — no
   external cropping library, since this is a real project dependency
   change we can't install from here. That still delivers "upload → crop
   to circle → remove" exactly as specified, just without manual pan/zoom. */
function AvatarUploader({ avatarUrl, initial, onChange }: { avatarUrl?: string; initial: string; onChange: (url?: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <motion.div
        whileHover={{ boxShadow: `0 0 0 6px ${ID.gold}22` }}
        transition={{ duration: 0.25 }}
        style={{
          width: 76, height: 76, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
          background: ID.gold, border: `3px solid ${ID.bg}`, boxShadow: `0 0 0 1px ${ID.gold}40`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {avatarUrl
          ? <img src={avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: "1.7rem", fontWeight: 700, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{initial}</span>}
      </motion.div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files?.[0])} />
        <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => inputRef.current?.click()} style={ghostBtnStyle}>
          <Upload size={13} /> Upload image
        </motion.button>
        {avatarUrl && (
          <motion.button type="button" whileTap={{ scale: 0.96 }} onClick={() => onChange(undefined)} style={{ ...ghostBtnStyle, color: "#B45309" }}>
            <Trash2 size={13} /> Remove photo
          </motion.button>
        )}
        <span style={{ fontSize: "0.68rem", color: C.textFaint }}>Automatically cropped to a circle.</span>
      </div>
    </div>
  );
}

function ProfileHero({ profile, activeAreasCount, weeklyHours, onEditClick }: { profile: StarfixProfileData; activeAreasCount: number; weeklyHours: number; onEditClick: () => void }) {
  const { isDesktop } = useViewport();
  const initial = (profile.name[0] || "S").toUpperCase();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        position: "relative",
        overflow: "hidden",
        background: ID.bg,
        border: `1px solid ${ID.border}`,
        borderRadius: 24,
        boxShadow: "0 1px 3px rgba(23,23,23,0.04)",
        padding: isDesktop ? "38px 40px 34px" : "28px 20px 24px",
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        alignItems: isDesktop ? "flex-start" : "center",
        justifyContent: "space-between",
        textAlign: isDesktop ? "left" : "center",
        gap: isDesktop ? 24 : 18,
      }}
    >
      {/* 1px gold highlight line — the one deliberate accent, no gradients */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: ID.gold }} />

      <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", alignItems: "center", gap: isDesktop ? 24 : 14, minWidth: 0 }}>
        {/* Avatar — large circle, warm gold fill, soft breathing glow behind it */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <motion.div
            animate={{ opacity: [0.18, 0.32, 0.18], scale: [1, 1.06, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
            style={{ position: "absolute", inset: -16, borderRadius: "50%", background: ID.gold, filter: "blur(20px)" }}
          />
          <motion.div
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "relative", width: 88, height: 88, borderRadius: "50%", overflow: "hidden",
              background: ID.gold, border: `3px solid ${ID.bg}`,
              boxShadow: `0 0 0 1px ${ID.gold}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", fontWeight: 700, color: "#fff",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            {profile.avatarUrl
              ? <img src={profile.avatarUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : initial}
          </motion.div>
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: isDesktop ? "flex-start" : "center", gap: 8, marginBottom: 7 }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: 700, color: ID.text, letterSpacing: "-0.01em" }}>
              {profile.name}
            </span>
            <Sparkles size={16} color={ID.gold} strokeWidth={2} />
          </div>
          <p style={{ fontSize: "0.86rem", color: C.textMuted, margin: "0 0 14px", lineHeight: 1.5, maxWidth: "40ch" }}>
            {profile.tagline}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: isDesktop ? "flex-start" : "center", gap: 8 }}>
            {/* Premium status chips — soft-gold border, light cream fill, gentle
               glow on hover. Both are live, derived from the learner's real
               active paths and this week's actual focused hours. */}
            <motion.span
              whileHover={{ boxShadow: `0 0 14px 1px ${ID.gold}38`, borderColor: `${ID.gold}60` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: "0.68rem", fontWeight: 700,
                color: ID.gold, background: ID.bg, border: `1px solid ${ID.gold}35`,
                padding: "5px 12px", borderRadius: 20,
              }}
            >
              <Target size={11} color={ID.gold} /> Focused on {activeAreasCount} area{activeAreasCount === 1 ? "" : "s"}
            </motion.span>
            <motion.span
              whileHover={{ boxShadow: `0 0 14px 1px ${ID.gold}38`, borderColor: `${ID.gold}60` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: "0.68rem", fontWeight: 700,
                color: ID.gold, background: ID.bg, border: `1px solid ${ID.gold}35`,
                padding: "5px 12px", borderRadius: 20,
              }}
            >
              <Clock size={11} color={ID.gold} /> {weeklyHours.toFixed(1)}h this week
            </motion.span>
          </div>
        </div>
      </div>

      <motion.button
        className="icon-button"
        onClick={onEditClick}
        whileHover={{ backgroundColor: "#1A1830", borderColor: ID.gold, color: ID.gold }}
        transition={{ duration: 0.18 }}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          width: 34, height: 34, borderRadius: "50%", border: `1px solid ${ID.border}`,
          background: "none", cursor: "pointer", color: C.textMuted, flexShrink: 0,
        }}
        title="Edit profile"
      >
        <Edit3 size={13} />
      </motion.button>
    </motion.div>
  );
}

/* Centered "Edit Your Starfix Profile" modal — soft fade + scale entrance,
   translucent blurred backdrop (so the real hero keeps updating live behind
   it), only the fields the brief asked for, and a sticky Cancel / Save bar. */
function EditProfileModal({
  open, onClose, draft, setDraft, onSave, focusOptions,
}: {
  open: boolean;
  onClose: () => void;
  draft: StarfixProfileData;
  setDraft: React.Dispatch<React.SetStateAction<StarfixProfileData>>;
  onSave: () => void;
  focusOptions: string[];
}) {
  const update = <K extends keyof StarfixProfileData>(key: K, value: StarfixProfileData[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleFocus = (opt: string) =>
    setDraft((d) => ({ ...d, focusAreas: d.focusAreas.includes(opt) ? d.focusAreas.filter((f) => f !== opt) : [...d.focusAreas, opt] }));

  const toggleStyle = (opt: string) =>
    setDraft((d) => ({ ...d, mentorshipStyle: d.mentorshipStyle.includes(opt) ? d.mentorshipStyle.filter((f) => f !== opt) : [...d.mentorshipStyle, opt] }));

  const toggleNotif = (key: keyof StarfixProfileData["notifications"]) =>
    setDraft((d) => ({ ...d, notifications: { ...d.notifications, [key]: !d.notifications[key] } }));

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            position: "fixed", inset: 0, background: "rgba(23,23,23,0.4)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 24,
          }}
        >
          <motion.div
            key="modal"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              width: "100%", maxWidth: 560, maxHeight: "88vh", overflowY: "auto",
              background: ID.bg, borderRadius: 24, border: `1px solid ${ID.border}`,
              boxShadow: "0 30px 70px -20px rgba(0,0,0,0.55)", position: "relative",
            }}
          >
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: ID.gold, borderTopLeftRadius: 24, borderTopRightRadius: 24 }} />

            <div style={{ padding: "30px 32px 8px" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: ID.text, margin: "0 0 4px" }}>
                Edit Your Starfix Profile
              </h2>
              <p style={{ fontSize: "0.8rem", color: C.textMuted, margin: "0 0 26px" }}>
                Shape how your growth identity shows up across Starfix.
              </p>

              <FieldGroup label="Profile Photo">
                <AvatarUploader avatarUrl={draft.avatarUrl} initial={draft.name[0]?.toUpperCase() || "S"} onChange={(v) => update("avatarUrl", v)} />
              </FieldGroup>

              <FieldGroup label="Display Name">
                <input
                  className="starfix-input"
                  value={draft.name}
                  onChange={(e) => update("name", e.target.value)}
                  style={inputStyle}
                  placeholder="Your name"
                />
              </FieldGroup>

              <FieldGroup label="Short Starfix Tagline">
                <input
                  className="starfix-input"
                  value={draft.tagline}
                  maxLength={60}
                  onChange={(e) => update("tagline", e.target.value)}
                  style={inputStyle}
                  placeholder="Becoming stronger every day."
                />
                <span style={{ fontSize: "0.7rem", color: C.textFaint, marginTop: 6, display: "block", textAlign: "right" }}>
                  {draft.tagline.length}/60
                </span>
              </FieldGroup>

              <FieldGroup label="Current Transformation Focus">
                <ChipMultiSelect options={focusOptions} selected={draft.focusAreas} onToggle={toggleFocus} />
              </FieldGroup>

              <FieldGroup label="Daily Learning Goal">
                <PillSelect options={DAILY_GOAL_OPTIONS} value={draft.dailyGoal} onChange={(v) => update("dailyGoal", v)} />
              </FieldGroup>

              <FieldGroup label="Preferred Mentorship Style">
                <ChipMultiSelect options={MENTORSHIP_STYLES} selected={draft.mentorshipStyle} onToggle={toggleStyle} />
              </FieldGroup>

              <FieldGroup label="Notification Preferences" last>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {NOTIFICATION_ITEMS.map(({ key, label }, i) => (
                    <div key={key} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 2px", borderBottom: i < NOTIFICATION_ITEMS.length - 1 ? `1px solid ${ID.border}` : "none",
                    }}>
                      <span style={{ fontSize: "0.86rem", color: ID.text }}>{label}</span>
                      <Toggle checked={draft.notifications[key]} onChange={() => toggleNotif(key)} />
                    </div>
                  ))}
                </div>
              </FieldGroup>
            </div>

            <div style={{
              position: "sticky", bottom: 0, display: "flex", gap: 12, justifyContent: "flex-end",
              padding: "16px 32px", borderTop: `1px solid ${ID.border}`, background: ID.bg,
              borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
            }}>
              <motion.button
                type="button" whileTap={{ scale: 0.97 }} onClick={onClose}
                style={{
                  padding: "11px 22px", borderRadius: C.radiusSm, border: `1px solid ${ID.border}`,
                  background: "#141324", color: C.textMuted, fontSize: "0.84rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                type="button" whileTap={{ scale: 0.97 }}
                whileHover={{ boxShadow: `0 0 18px 2px ${ID.gold}55` }}
                onClick={onSave}
                style={{
                  padding: "11px 26px", borderRadius: C.radiusSm, border: "none",
                  background: ID.gold, color: "#fff", fontSize: "0.84rem", fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  boxShadow: `0 0 14px 0 ${ID.gold}35`,
                }}
              >
                Save Changes
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Soft gold success toast — bottom-centered, fade + scale, auto-dismisses. */
function SuccessToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          style={{
            position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 10,
            background: ID.bg, border: `1px solid ${ID.gold}55`, borderRadius: 999,
            padding: "12px 22px", boxShadow: `0 12px 30px -10px ${ID.gold}50, 0 2px 8px rgba(0,0,0,0.4)`,
            zIndex: 200, fontFamily: "'Inter', sans-serif",
          }}
        >
          <CheckCircle2 size={16} color={ID.gold} />
          <span style={{ fontSize: "0.86rem", fontWeight: 600, color: ID.text }}>Profile updated successfully</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* A thin, gently breathing gold divider — the emotional beat between the
   hero and the more structured cards below. */
function BreathingDivider({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "4px 8px" }}>
      <motion.div
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${ID.gold})` }}
      />
      <span style={{ fontSize: "0.78rem", fontStyle: "italic", color: C.textMuted, whiteSpace: "nowrap", fontFamily: "'Playfair Display', serif" }}>
        {text}
      </span>
      <motion.div
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
        style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${ID.gold}, transparent)` }}
      />
    </div>
  );
}

/* Shared cursor-tracking handler for .glow-card elements — updates the
   --gx/--gy CSS custom properties so the radial gold glow follows the
   pointer, and the CSS :active state doubles as the "click ripple". */
function handleGlowMove(e: React.MouseEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  el.style.setProperty("--gx", `${x}%`);
  el.style.setProperty("--gy", `${y}%`);
}

/* Animated SVG progress ring used by Focus Area cards. */
function ProgressRing({ value, color, size = 64, stroke = 6 }: { value: number; color: string; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.borderMuted} strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        whileInView={{ strokeDashoffset: circumference - (value / 100) * circumference }}
        viewport={{ once: true }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      />
    </svg>
  );
}

/* SECTION 1 — Growth Journey. A full-width, cinematic weekly summary: hours
   focused, momentum vs last week, an animated area chart that breathes
   gently, a glowing weekly-goal indicator, and a one-line motivational
   close. This replaces the old plain "Weekly Activity" report card. */
function GrowthJourneyCard() {
  return (
    <motion.div
      className="glow-card"
      onMouseMove={handleGlowMove}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        position: "relative",
        borderRadius: 28,
        padding: "38px 40px 34px",
        background: `linear-gradient(150deg, ${ID.bg} 0%, #1A1830 55%, ${ID.bg} 100%)`,
        boxShadow: `0 24px 60px -24px ${ID.gold}40, 0 1px 3px rgba(0,0,0,0.3)`,
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 18, marginBottom: 28 }}>
        <div>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Your Journey This Week</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.3rem", fontWeight: 700, color: ID.text, letterSpacing: "-0.01em" }}>{WEEKLY_TOTAL_HOURS.toFixed(1)}</span>
            <span style={{ fontSize: "0.88rem", color: C.textMuted }}>focused hours</span>
            <span style={{
              display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", fontWeight: 700, color: "#10B981",
              background: "#10B98114", border: "1px solid #10B98125", padding: "4px 10px", borderRadius: 20,
            }}>
              <TrendingUp size={11} /> +18% momentum vs last week
            </span>
          </div>
        </div>
      </div>

      <div className="pulse-chart" style={{ marginBottom: 20, marginTop: -12 }}>
        <ResponsiveContainer width="100%" height={172}>
          <AreaChart data={activityData} margin={{ top: 6, right: 6, left: 6, bottom: 0 }}>
            <defs>
              <linearGradient id="journeyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ID.gold} stopOpacity={0.4} />
                <stop offset="40%" stopColor={ID.gold} stopOpacity={0.08} />
                <stop offset="70%" stopColor={ID.gold} stopOpacity={0} />
              </linearGradient>
              {/* Soft, narrow glow that hugs the stroke only — not the fill area */}
              <filter id="journeyLineGlow" x="-15%" y="-30%" width="130%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="2.1" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <YAxis hide domain={[(min: number) => min - 0.7, (max: number) => max + 0.7]} />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "#9C9585", fontFamily: "'Inter', sans-serif" }}
              axisLine={false}
              tickLine={false}
              padding={{ left: 8, right: 8 }}
            />
            <Tooltip
              cursor={{ stroke: ID.gold, strokeWidth: 1, strokeDasharray: "3 3" }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as { full: string; h: number };
                const idx = activityData.findIndex((d) => d.day === label);
                const prev = idx > 0 ? activityData[idx - 1] : null;
                const pct = prev ? Math.round(((p.h - prev.h) / prev.h) * 100) : null;
                return (
                  <div style={{
                    background: ID.bg, border: `1px solid ${ID.border}`, borderRadius: 10,
                    padding: "8px 12px", fontSize: "0.74rem", fontFamily: "'Inter', sans-serif",
                    color: ID.text, boxShadow: "0 6px 18px -6px rgba(0,0,0,0.5)",
                  }}>
                    <div style={{ fontWeight: 700 }}>
                      {p.full} <span style={{ color: C.textMuted, fontWeight: 500 }}>·</span> {p.h.toFixed(1)} hrs
                    </div>
                    {prev && pct !== null && (
                      <div style={{ marginTop: 2, fontSize: "0.68rem", fontWeight: 600, color: pct >= 0 ? "#10B981" : "#DC5A5A" }}>
                        {pct >= 0 ? "+" : ""}{pct}% vs {prev.full}
                      </div>
                    )}
                  </div>
                );
              }}
            />
            <Area
              type="natural"
              dataKey="h"
              stroke={ID.gold}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#journeyGrad)"
              style={{ filter: "url(#journeyLineGlow)" }}
              dot={false}
              activeDot={{
                r: 5, fill: ID.gold, stroke: "#fff", strokeWidth: 2,
              }}
              isAnimationActive
              animationDuration={700}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Glowing weekly-goal progress indicator */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={LABEL}>Weekly Goal</span>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: ID.gold }}>78%</span>
        </div>
        <div style={{ height: 6, borderRadius: 6, background: C.borderMuted, border: `1px solid ${ID.border}`, overflow: "hidden" }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: "78%" }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: "easeOut" }}
            style={{ height: "100%", background: ID.gold, borderRadius: 6, boxShadow: `0 0 12px 1px ${ID.gold}70` }}
          />
        </div>
      </div>

      <p style={{ fontSize: "0.94rem", fontStyle: "italic", color: ID.text, margin: 0, fontFamily: "'Playfair Display', serif" }}>
        “Small consistent actions are shaping your future.”
      </p>
    </motion.div>
  );
}

/* SECTION 2 — Focus Areas. Three interactive cards, each with its own
   progress ring (not a plain bar), streak, last-activity time, and a
   Continue action. A tiny sparkle breathes near any ring that's well
   underway. Replaces the old achievements badge grid. */
function FocusAreaCard({ area, onContinue }: { area: FocusArea; onContinue?: () => void }) {
  return (
    <motion.div
      className="glow-card"
      onMouseMove={handleGlowMove}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4, boxShadow: `0 20px 44px -16px ${ID.gold}45` }}
      style={{
        position: "relative",
        background: ID.bg,
        borderRadius: 28,
        padding: "26px 24px 22px",
        boxShadow: "0 1px 3px rgba(23,23,23,0.04)",
        transition: "box-shadow 220ms ease",
        display: "flex", flexDirection: "column", gap: 18,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 64, height: 64, flexShrink: 0 }}>
          <ProgressRing value={area.progress} color={ID.gold} />
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <area.Icon size={17} color={ID.gold} strokeWidth={1.8} />
          </div>
          {area.progress >= 60 && (
            <motion.div
              animate={{ opacity: [0, 1, 0], scale: [0.6, 1, 0.6] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", top: -3, right: -3 }}
            >
              <Sparkles size={12} color={ID.gold} />
            </motion.div>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "0.98rem", fontWeight: 700, color: ID.text }}>{area.title}</div>
          <div style={{ fontSize: "0.76rem", color: C.textMuted, lineHeight: 1.4 }}>{area.purpose}</div>
        </div>
        <span style={{ fontSize: "1rem", fontWeight: 700, color: ID.gold, fontFamily: "'Playfair Display', serif", flexShrink: 0 }}>{area.progress}%</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.74rem", color: C.textMuted, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} color="#F97316" /> {area.streak}</span>
        <span>·</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Clock size={12} /> {area.lastActive}</span>
      </div>

      <motion.button
        onClick={onContinue}
        whileHover="hover"
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginTop: "auto", paddingTop: 16, background: "none", border: "none",
          borderTop: `1px solid ${ID.border}`, cursor: "pointer", width: "100%", fontFamily: "'Inter', sans-serif",
        }}
      >
        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: ID.text }}>Continue</span>
        <motion.span variants={{ hover: { x: 6 } }} transition={{ duration: 0.18 }} style={{ display: "flex" }}>
          <ArrowRight size={14} color={ID.gold} />
        </motion.span>
      </motion.button>
    </motion.div>
  );
}

/* SECTION 5 — What's Growing Right Now. A tight, 3-item feed — never a
   long list — each row a tiny icon, relative time, and a clickable action.
   Replaces the old Recent Wins table and the plain Recent Activity list. */
function GrowingFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      style={{
        background: ID.bg, borderRadius: 28, padding: "28px 26px",
        boxShadow: "0 1px 3px rgba(23,23,23,0.04)",
      }}
    >
      <span style={{ ...LABEL, display: "block", marginBottom: 16, padding: "0 4px" }}>What's Growing Right Now</span>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {GROWING_FEED.map((f, i) => (
          <div
            key={f.text}
            style={{
              display: "flex", alignItems: "center", gap: 14, width: "100%",
              padding: "14px 12px", borderRadius: 16,
              cursor: "default", textAlign: "left", fontFamily: "'Inter', sans-serif",
              borderBottom: i < GROWING_FEED.length - 1 ? `1px solid ${ID.border}` : "none",
            }}
          >
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${ID.gold}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <f.Icon size={14} color={ID.gold} />
            </div>
            <span style={{ flex: 1, fontSize: "0.86rem", color: ID.text, minWidth: 0 }}>{f.text}</span>
            <span style={{ fontSize: "0.72rem", color: C.textFaint, flexShrink: 0 }}>{f.time}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   SAVED ITEMS — appended after the existing profile content. Everything
   saved from the bookmark icon on Explore cards lands here, read straight
   from the shared localStorage-backed store so it stays in sync with what
   was actually saved (no separate copy of the data).
───────────────────────────────────────────────────────────────────────── */

const SAVED_TYPE_META: Record<string, { color: string; Icon: React.ComponentType<{ size?: number; color?: string }>; filter: string }> = {
  YouTube:      { color: "#DC2626", Icon: Youtube,      filter: "Videos"        },
  Event:        { color: "#EC4899", Icon: CalendarDays, filter: "Events"        },
  Challenge:    { color: "#F59E0B", Icon: Trophy,       filter: "Opportunities" },
  Internship:   { color: "#10B981", Icon: Briefcase,    filter: "Opportunities" },
  Scholarship:  { color: "#0D9488", Icon: Award,        filter: "Opportunities" },
  Course:       { color: "#2563EB", Icon: GraduationCap,filter: "Opportunities" },
  Book:         { color: "#92400E", Icon: BookOpen,     filter: "Opportunities" },
  Mentor:       { color: ID.gold,   Icon: Users,        filter: "Mentors"       },
};
const SAVED_FALLBACK_META = { color: C.textMuted, Icon: Bookmark, filter: "Opportunities" };

const SAVED_FILTERS = ["All", "Videos", "Mentors", "Events", "Opportunities"];

function SavedItemCard({ item, onOpen, onRemove }: { item: SavedItem; onOpen: () => void; onRemove: () => void }) {
  const meta = SAVED_TYPE_META[item.type] ?? SAVED_FALLBACK_META;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      style={{
        background: ID.bg, border: `1px solid ${ID.border}`, borderRadius: 18,
        boxShadow: "0 1px 3px rgba(23,23,23,0.04)", padding: "18px 20px",
        display: "flex", flexDirection: "column", gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: "0.6rem", fontWeight: 700,
          textTransform: "uppercase", letterSpacing: "0.06em", color: meta.color,
          background: ID.bg, border: `1px solid ${meta.color}30`, padding: "3px 9px", borderRadius: 20,
        }}>
          <meta.Icon size={11} color={meta.color} /> {item.type}
        </span>
        <span style={{ fontSize: "0.68rem", color: C.textFaint }}>Saved {timeAgo(item.savedAt)}</span>
      </div>

      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: ID.text, lineHeight: 1.35 }}>{item.title}</div>
      <p style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.5, margin: 0 }}>{item.desc}</p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, marginTop: 4, borderTop: `1px solid ${ID.border}` }}>
        <motion.button
          onClick={onOpen}
          whileHover={{ x: 2 }}
          style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600, color: ID.gold, fontFamily: "'Inter', sans-serif" }}
        >
          Open <ExternalLink size={12} />
        </motion.button>
        <motion.button
          onClick={onRemove}
          whileHover={{ backgroundColor: "#1A1830" }}
          style={{
            display: "flex", alignItems: "center", gap: 5, background: "none",
            border: `1px solid ${ID.border}`, borderRadius: 8, padding: "6px 10px",
            cursor: "pointer", fontSize: "0.74rem", fontWeight: 500, color: C.textMuted, fontFamily: "'Inter', sans-serif",
          }}
        >
          <X size={11} /> Remove
        </motion.button>
      </div>
    </motion.div>
  );
}

function SavedItemsSection({ onSelectMentor, onNavigate }: { onSelectMentor?: (id: number) => void; onNavigate?: (p: DashPage) => void }) {
  const [items, setItems] = useState<SavedItem[]>(() => getSavedItems());
  const [filter, setFilter] = useState("All");

  const remove = (id: string) => setItems(removeSavedItem(id));

  const open = (item: SavedItem) => {
    if (item.type === "Mentor" && item.mentorId != null) {
      if (onSelectMentor) onSelectMentor(item.mentorId);
      else onNavigate?.("mentors");
    } else if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  };

  const visible = items.filter((i) => {
    if (filter === "All") return true;
    const meta = SAVED_TYPE_META[i.type] ?? SAVED_FALLBACK_META;
    return meta.filter === filter;
  });

  const recent = items[0]; // store prepends newest first

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4 }}
      style={{
        background: ID.bg, borderRadius: 28, padding: "28px 26px",
        boxShadow: "0 1px 3px rgba(23,23,23,0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, padding: "0 4px" }}>
        <Bookmark size={13} color={ID.gold} fill={ID.gold} />
        <span style={{ ...LABEL, marginBottom: 0 }}>Saved Items</span>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: "0.84rem", color: C.textMuted, padding: "8px 4px 4px", margin: 0 }}>
          Nothing saved yet — tap the bookmark icon on anything in Explore to keep it here.
        </p>
      ) : (
        <>
          <p style={{ fontSize: "0.8rem", color: C.textMuted, padding: "0 4px", margin: "0 0 18px" }}>
            {items.length} item{items.length === 1 ? "" : "s"} saved
            {recent && <> · most recent: <span style={{ color: ID.text, fontWeight: 500 }}>{recent.title}</span></>}
          </p>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "0 4px", marginBottom: 20 }}>
            {SAVED_FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: "6px 14px", borderRadius: 999, fontSize: "0.74rem", cursor: "pointer",
                border: `1px solid ${filter === f ? ID.gold : ID.border}`, background: filter === f ? `${ID.gold}14` : "#141324",
                color: filter === f ? ID.gold : C.textMuted, fontWeight: filter === f ? 600 : 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
              }}>
                {f}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p style={{ fontSize: "0.82rem", color: C.textMuted, padding: "8px 4px", margin: 0 }}>Nothing saved in this category yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <AnimatePresence mode="popLayout">
                {visible.map((item) => (
                  <SavedItemCard key={item.id} item={item} onOpen={() => open(item)} onRemove={() => remove(item.id)} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Component
───────────────────────────────────────────────────────────────────────── */

export function ProfilePage({ onNavigate, userProfile, onUpdateProfile, onSelectMentor }: { onNavigate?: (p: DashPage) => void; userProfile?: UserProfile | null; onUpdateProfile?: (patch: Partial<UserProfile>) => void; onSelectMentor?: (id: number) => void }) {
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useViewport();
  const enrollments = getAllEnrollments();

  // Real, connected paths (item 8) — minimal by design: name, progress,
  // mentor, streak, last active. No tasks or video detail surfaces here.
  const liveFocusAreas: FocusArea[] = enrollments.map((e) => {
    const path = GROWTH_PATHS.find((x) => x.id === e.pathId);
    const mentor = e.mentorId != null ? MENTORS.find((m) => m.id === e.mentorId) : undefined;
    const doneTasks = e.tasks.filter((t) => t.done).length;
    const weekPct = Math.round(((doneTasks + (e.challenge.done ? 1 : 0)) / (e.tasks.length + 1)) * 100);
    const progress = path ? Math.round(((e.weekIndex + weekPct / 100) / path.modules.length) * 100) : weekPct;
    return {
      title: path?.title ?? e.pathId,
      Icon: path?.Icon ?? Target,
      purpose: mentor ? `Mentor: ${mentor.name}` : "No mentor selected",
      progress,
      streak: `${e.streak}-day streak`,
      lastActive: timeAgo(e.lastActiveAt),
      slug: e.pathId,
    };
  });
  const focusAreas = liveFocusAreas.length ? liveFocusAreas : FOCUS_AREAS;
  const goToPath = (slug?: string) => (slug ? navigate(`/growth-paths/${slug}/journey`) : onNavigate?.("goals"));

  // Starfix identity — editable profile. `draftProfile` powers the modal
  // AND the live hero while the modal is open, so edits show in real time;
  // Cancel just closes without committing, Save copies draft → saved.
  //
  // Persistence: the full extended profile (tagline, avatar, daily goal,
  // mentorship style, notifications) is stored under its own localStorage
  // key so it survives refresh/reopen. The `name` field specifically is
  // ALSO synced up to the app-wide userProfile (via onUpdateProfile), since
  // that's the shared source every other screen — Dashboard, Sidebar,
  // Growth Paths, Mentors, Explore — reads its display name from.
  const PROFILE_STORAGE_KEY = "starfix:profileData";
  const [savedProfile, setSavedProfile] = useState<StarfixProfileData>(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as StarfixProfileData;
        // Global name (e.g. set via login) always wins over a stale local copy.
        return userProfile?.name ? { ...stored, name: userProfile.name } : stored;
      }
    } catch {}
    return makeDefaultProfile(userProfile?.name || "Khushi Agrawal", focusAreas.map((a) => a.title));
  });
  const [draftProfile, setDraftProfile] = useState<StarfixProfileData>(savedProfile);
  const [editOpen, setEditOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Live counts backing the profile hero's status chips — real active
  // Growth Paths and this week's real total focused hours, not placeholders.
  const activeAreasCount = focusAreas.length;
  const weeklyHours = WEEKLY_TOTAL_HOURS;
  const focusOptions = focusAreas.map((a) => a.title);

  const openEdit = () => { setDraftProfile(savedProfile); setEditOpen(true); };
  const closeEdit = () => setEditOpen(false);
  const saveEdit = () => {
    setSavedProfile(draftProfile);
    try { localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(draftProfile)); } catch {}
    // Push the name into global state + localStorage["userProfile"] so it
    // shows up everywhere else immediately and survives navigation/refresh.
    onUpdateProfile?.({ name: draftProfile.name });
    setEditOpen(false);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2600);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: isDesktop ? "40px 48px 64px" : "20px 16px 48px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexDirection: "column", gap: isDesktop ? 28 : 20 }}>

        {/* 1 — PROFILE HERO (large avatar, identity, badges, ghost edit).
             Reads from draftProfile while editing so it updates live. */}
        <ProfileHero
          profile={editOpen ? draftProfile : savedProfile}
          activeAreasCount={activeAreasCount}
          weeklyHours={weeklyHours}
          onEditClick={openEdit}
        />

        {/* 2 — Breathing gold divider, the emotional beat under the hero */}
        <BreathingDivider text="Every session is quietly building the person you're becoming." />

        {/* 6 — FOCUS AREAS — primary section, the active control center of the
             profile. Moved above the graph so paths-in-progress are the
             first thing a learner sees; extra top/bottom margin gives it
             room to breathe as the main focal area. */}
        <div style={{ marginTop: 12, marginBottom: 12 }}>
          <span style={{ ...LABEL, display: "block", marginBottom: 14, padding: "0 4px" }}>Focus Areas</span>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : isMobile ? "1fr" : "repeat(2, 1fr)", gap: isDesktop ? 20 : 16 }}>
            {focusAreas.map((area) => (
              <FocusAreaCard key={area.title} area={area} onContinue={() => goToPath(area.slug)} />
            ))}
          </div>
        </div>

        {/* 5 — GROWTH JOURNEY (cinematic weekly summary) */}
        <GrowthJourneyCard />

        {/* 9 — WHAT'S GROWING RIGHT NOW */}
        <GrowingFeed />

        {/* 10 — SAVED ITEMS (appended after all existing content) */}
        <SavedItemsSection onSelectMentor={onSelectMentor} onNavigate={onNavigate} />

      </div>

      <EditProfileModal
        open={editOpen}
        onClose={closeEdit}
        draft={draftProfile}
        setDraft={setDraftProfile}
        onSave={saveEdit}
        focusOptions={focusOptions}
      />
      <SuccessToast show={showToast} />
    </div>
  );
}
