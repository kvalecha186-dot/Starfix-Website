import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Star, ArrowLeft, ArrowRight, Check, ChevronDown,
  Clock, MapPin, Globe2, Zap, MessageCircle,
  FileText, Video, BookOpen as GuideIcon, TrendingUp,
  Briefcase, CheckCircle2
} from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import { MENTORS, type Mentor } from "./MentorsPage";
import { MENTOR_DETAILS } from "../mentorData";
import { MENTOR_EXTRA, CATEGORY_CONFIG } from "../mentorExtra";
import { getAllEnrollments, ENROLLMENTS_CHANGED_EVENT } from "../../lib/pathProgress";
import { PATHS } from "./GoalsPage";
import { createBooking, isSessionBooked, BOOKINGS_CHANGED_EVENT, getBookingHistory, hydrateBookings } from "../../lib/bookings";
import { CheckoutModal } from "../CheckoutModal";
import { submitMentorReview } from "../../lib/supabaseDb";
import { supabase } from "../../lib/supabase";

/* ─── Small building blocks ───────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: C.textFaint,
  fontFamily: "'Inter', sans-serif",
};

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.35rem",
          fontWeight: 700,
          color: C.text,
          margin: 0,
          letterSpacing: "-0.01em",
        }}
      >
        {children}
      </h2>
      {sub && <p style={{ fontSize: "0.8rem", color: C.textMuted, margin: "4px 0 0" }}>{sub}</p>}
    </div>
  );
}

function Avatar({ initials, color, size = 96 }: { initials: string; color: string; size?: number }) {
  return (
    <div
      style={{
        width: size, height: size, borderRadius: "50%",
        background: `linear-gradient(155deg, ${color}26, ${color}0c)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: size * 0.34, fontWeight: 700, color }}>
        {initials}
      </span>
    </div>
  );
}

const CONTENT_ICON = { Article: FileText, Video: Video, Guide: GuideIcon } as const;

function slugify(name: string) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""); }

/* ─── Component ────────────────────────────────────── */

export function MentorDetailPage({
  mentorId, onNavigate, onSelectMentor, onMessageMentor,
}: {
  mentorId: number;
  onNavigate?: (p: DashPage) => void;
  onSelectMentor?: (id: number) => void;
  onMessageMentor?: (id: number) => void;
}) {
  const { isDesktop } = useViewport();
  const routerNavigate = useNavigate();
  const staticMentor = MENTORS.find((m) => m.id === mentorId);
  const detail = MENTOR_DETAILS[mentorId] || {
    bio: staticMentor?.title ? staticMentor.name + " is a " + staticMentor.title + " focused on practical, outcome-driven mentoring." : "Starfix mentor focused on practical, outcome-driven mentoring.",
    about: "This mentor's detailed profile is being completed. You can still view their verified Starfix profile, session types, availability, and book a session.",
    experience: "Professional mentor",
    responseTime: "Usually responds within 24 hours",
    languages: ["English"],
    location: "Online",
    learn: staticMentor?.skills || [],
    learningStyle: ["Practical guidance", "Structured feedback", "Goal-oriented"],
    availability: [],
    relatedPaths: [staticMentor?.category || "Growth"],
    content: [],
    faq: [
      { q: "What can I expect from a session?", a: "A focused 1:1 conversation around your goal, current progress, and next steps." },
      { q: "Can I message the mentor before booking?", a: "Yes. Use the Message Mentor button to start a conversation." },
    ],
    reviews: [],
  };
  const extra = MENTOR_EXTRA[mentorId] || {
    results: [],
    timeline: [],
    sessions: [],
  };
  const [dbMentor, setDbMentor] = useState<any>(null);
  const [dbSessions, setDbSessions] = useState<any[]>([]);
  const [dbAvailability, setDbAvailability] = useState<any[]>([]);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [selectedSession, setSelectedSession] = useState(0);
  const [showCheckout, setShowCheckout] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    void (async () => {
      const mentorRow = (await supabase.from("mentors").select("*").eq("legacy_id", mentorId).maybeSingle()).data;
      if (!mentorRow) return;
      setDbMentor(mentorRow);
      const sessions = (await supabase.from("session_types").select("id,title,description,duration_minutes,price,currency,active").eq("mentor_id", mentorRow.id).eq("active", true).order("price")).data || [];
      setDbSessions(sessions);
      const availability = (await supabase.from("mentor_availability").select("id,start_at,end_at,status").eq("mentor_id", mentorRow.id).gte("start_at", new Date().toISOString()).order("start_at").limit(30)).data || [];
      setDbAvailability(availability);
    })();
  }, [mentorId]);
  const mentor = dbMentor ? {
    ...(staticMentor || {}),
    id: mentorId,
    name: dbMentor.name || staticMentor?.name,
    initials: dbMentor.initials || staticMentor?.initials || "ME",
    color: dbMentor.color || staticMentor?.color || C.gold,
    title: dbMentor.headline || staticMentor?.title || "Starfix Mentor",
    company: dbMentor.company || staticMentor?.company || "",
    category: dbMentor.category || staticMentor?.category || "Coding",
    rating: Number(dbMentor.rating) || 0,
    students: Number(dbMentor.students_count) || 0,
    price: dbMentor.price || staticMentor?.price || "Free",
    free: !!dbMentor.free,
    availability: dbMentor.availability || staticMentor?.availability || "Today",
    skills: Array.isArray(dbMentor.skills) ? dbMentor.skills : (staticMentor?.skills || []),
  } : staticMentor;
  const sessionList = dbSessions.length
    ? dbSessions.map((s: any) => ({ name: s.title, duration: (s.duration_minutes || 45) + " min", price: Number(s.price) === 0 ? "Free" : "₹" + Number(s.price).toLocaleString("en-IN"), includes: s.description ? [s.description] : [], popular: false }))
    : (extra?.sessions || []);


  useEffect(() => {
    void (async () => {
      const auth = await supabase.auth.getUser();
      if (auth.data.user) await hydrateBookings(auth.data.user.id);
      const completed = getBookingHistory().find((b) => b.mentorId === mentorId && b.status === "Completed");
      if (!completed) return;
      setReviewBookingId(completed.id);
      const authAgain = await supabase.auth.getUser();
      if (!authAgain.data.user) return;
      const existing = (await supabase.from("reviews").select("id").eq("booking_id", completed.id).eq("student_id", authAgain.data.user.id).maybeSingle()).data;
      setReviewSubmitted(!!existing);
    })();
  }, [mentorId]);

  // The learner's own saved session notes with this mentor — read live
  // from the same enrollment store the Workspace's Notes card (Save
  // button) and the Dashboard session card write to/read from. No
  // separate copy: if there's an active enrollment with this mentor and
  // it has notes, they show up here automatically.
  const [, forceEnrollmentTick] = useState(0);
  useEffect(() => {
    const onChange = () => forceEnrollmentTick((n) => n + 1);
    window.addEventListener(ENROLLMENTS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(ENROLLMENTS_CHANGED_EVENT, onChange);
  }, []);

  const [, forceBookingsTick] = useState(0);
  useEffect(() => {
    const onChange = () => forceBookingsTick((n) => n + 1);
    window.addEventListener(BOOKINGS_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(BOOKINGS_CHANGED_EVENT, onChange);
  }, []);

  const myEnrollment = getAllEnrollments().find((e) => e.mentorId === mentorId);
  const myPath = myEnrollment ? PATHS.find((p) => p.id === myEnrollment.pathId) : undefined;

  const currentSess = sessionList[selectedSession] ?? sessionList[0];
  const isBooked = mentor && currentSess ? isSessionBooked(mentor.id, currentSess.name) : false;

  const handleBookSession = () => {
    if (!mentor || !detail || !extra || !currentSess || isBooked) return;
    setShowCheckout(true);
  };

  if (!mentor || !detail || !extra) {
    return (
      <div style={{ padding: 48 }}>
        <button onClick={() => onNavigate?.("mentors")} style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", fontSize: "0.85rem" }}>
          ← Back to Mentors
        </button>
        <p style={{ color: C.textMuted, marginTop: 16 }}>We couldn't find that mentor.</p>
      </div>
    );
  }

  const config = CATEGORY_CONFIG[mentor.category] ?? CATEGORY_CONFIG["Coding"];
  const similar = MENTORS.filter((m) => m.category === mentor.category && m.id !== mentor.id).slice(0, 3);
  const checkoutAvailability = dbAvailability.length
    ? Object.values(dbAvailability.reduce((acc: Record<string, { date: string; slots: string[] }>, slot: any) => {
        const d = new Date(slot.start_at);
        const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        acc[date] ||= { date, slots: [] };
        if (slot.status === "available") acc[date].slots.push(time);
        return acc;
      }, {}))
    : detail.availability;

  // Review distribution — computed from the actual review ratings.
  const dist = [5, 4, 3, 2, 1].map((star) => detail.reviews.filter((r) => r.rating === star).length);
  const maxDist = Math.max(...dist, 1);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Slug note is informational only — real routing lives at /mentors/:slug once wired up */}
      <div style={{ padding: isDesktop ? "28px 48px 0" : "14px 16px 0" }}>
        <motion.button
          whileHover={{ x: -2 }}
          onClick={() => onNavigate?.("mentors")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "none", border: "none", color: C.textMuted,
            cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Inter', sans-serif", padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Mentors
        </motion.button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 320px" : "1fr", gap: isDesktop ? 56 : 28, padding: isDesktop ? "24px 48px 0" : "18px 16px 0", alignItems: "start" }}>
        {/* ══════════════ LEFT — 70% ══════════════ */}
        <div style={{ minWidth: 0 }}>

          {/* 1 — Hero */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            style={{ display: "flex", gap: 22, marginBottom: 18 }}>
            <Avatar initials={mentor.initials} color={mentor.color} />
            <div style={{ paddingTop: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.9rem" : "1.5rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em" }}>
                  {mentor.name}
                </h1>
                <span style={{
                  fontSize: "0.66rem", fontWeight: 600, color: "#0F9D6C", background: "#E9F9F1",
                  padding: "3px 9px", borderRadius: 999, display: "flex", alignItems: "center", gap: 4,
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#0F9D6C" }} />
                  {mentor.availability}
                </span>
              </div>
              <div style={{ fontSize: "0.92rem", color: C.textMuted, marginBottom: 10 }}>
                {mentor.title} <span style={{ color: C.textFaint }}>·</span> {mentor.company} <span style={{ color: C.textFaint }}>·</span> {detail.experience} experience
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.82rem", flexWrap: "wrap" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Star size={13} color={C.gold} fill={C.gold} />
                  <strong style={{ color: C.text }}>{mentor.rating}</strong>
                  <span style={{ color: C.textFaint }}>({detail.reviews.length * 137} reviews)</span>
                </span>
                <span style={{ color: C.textFaint }}>·</span>
                <span style={{ color: C.textMuted }}>{mentor.students.toLocaleString()} students</span>
                <span style={{ color: C.textFaint }}>·</span>
                <span style={{ color: C.textMuted }}>{extra.results.length + 400} sessions</span>
                <span style={{ color: C.textFaint }}>·</span>
                <span style={{ color: C.textMuted }}>{detail.responseTime}</span>
              </div>
              <p style={{ fontSize: "0.78rem", color: C.gold, margin: "10px 0 0", fontWeight: 500 }}>{config.fieldNote}</p>
            </div>
          </motion.div>

          {/* Skills */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
            {mentor.skills.map((s) => (
              <span key={s} style={{ fontSize: "0.74rem", color: C.text, border: `1px solid ${C.border}`, padding: "5px 13px", borderRadius: 999, cursor: "pointer" }}>
                {s}
              </span>
            ))}
          </div>

          {/* Your saved session notes with this mentor — visible only if
             there's an active enrollment with them and notes exist */}
          {myEnrollment && myEnrollment.notes && myEnrollment.notes.trim().length > 0 && (
            <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 16, padding: "18px 20px", marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
                <span style={LABEL}>Your notes {myPath ? `· ${myPath.title}` : ""}</span>
                {onNavigate && myPath && (
                  <button
                    onClick={() => onNavigate("goals")}
                    style={{ background: "none", border: "none", color: C.gold, fontSize: "0.74rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif", padding: 0 }}
                  >
                    Edit in workspace →
                  </button>
                )}
              </div>
              <p style={{ fontSize: "0.86rem", color: C.text, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {myEnrollment.notes}
              </p>
            </div>
          )}

          {/* 2 — About */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>About {mentor.name.split(" ")[0]}</SectionTitle>
            <p style={{ fontSize: "1rem", color: C.text, lineHeight: 1.75, marginBottom: 14, maxWidth: 620 }}>{detail.bio}</p>
            <p style={{ fontSize: "0.9rem", color: C.textMuted, lineHeight: 1.75, maxWidth: 620 }}>{detail.about}</p>
          </section>

          {/* 3 — Experience Timeline */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Experience</SectionTitle>
            <div>
              {extra.timeline.map((t, i) => (
                <div key={t.role} style={{ display: "flex", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                    <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Briefcase size={13} color={C.gold} />
                    </div>
                    {i < extra.timeline.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 36, background: C.borderMuted, marginTop: 4 }} />}
                  </div>
                  <div style={{ paddingBottom: i < extra.timeline.length - 1 ? 22 : 0, paddingTop: 4 }}>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.text }}>{t.role}</div>
                    <div style={{ fontSize: "0.78rem", color: C.textMuted, marginBottom: 4 }}>{t.org} · {t.duration}</div>
                    <div style={{ fontSize: "0.82rem", color: C.textMuted, lineHeight: 1.5, maxWidth: 560 }}>{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4 — What this mentor can help you with */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>{config.helpWithLabel}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "12px 24px", maxWidth: 620 }}>
              {detail.learn.map((item) => (
                <div key={item} style={{ display: "flex", gap: 9, alignItems: "flex-start", background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, borderRadius: C.radiusSm, padding: "12px 14px" }}>
                  <Check size={15} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: "0.85rem", color: C.text, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 5 — Teaching style */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Teaching Style</SectionTitle>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {detail.learningStyle.map((s) => (
                <span key={s} style={{ fontSize: "0.78rem", color: C.text, background: C.surface, border: `1px solid ${C.borderMuted}`, padding: "9px 15px", borderRadius: C.radiusSm, boxShadow: C.shadow }}>
                  {s}
                </span>
              ))}
            </div>
          </section>

          {/* 6 — Session types */}
          <section id="sessions" style={{ marginBottom: 44 }}>
            <SectionTitle sub="Choose the session that fits where you are right now.">{config.sessionLabel}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 14 }}>
              {sessionList.map((s, i) => {
                const active = i === selectedSession;
                const activeBooked = isSessionBooked(mentor.id, s.name);
                return (
                  <motion.button
                    key={s.name}
                    onClick={() => setSelectedSession(i)}
                    whileHover={{ y: -2 }}
                    style={{
                      textAlign: "left", cursor: "pointer", position: "relative",
                      background: active ? C.goldLight : C.surface,
                      border: `2px solid ${active ? C.gold : C.border}`,
                      boxShadow: active ? "0 4px 16px rgba(212,169,31,0.12)" : C.shadow,
                      borderRadius: C.radius, padding: "16px 18px", fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    {s.popular && (
                      <span style={{ position: "absolute", top: -9, right: 14, fontSize: "0.62rem", fontWeight: 700, color: "#fff", background: C.gold, padding: "3px 9px", borderRadius: 999 }}>
                        Popular
                      </span>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                      <span style={{ fontSize: "0.88rem", fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
                        {s.name}
                        {active && <Check size={14} color={C.gold} />}
                      </span>
                      <span style={{ fontSize: "0.86rem", fontWeight: 700, color: s.price === "Free" ? "#0F9D6C" : C.text, flexShrink: 0, marginLeft: 8 }}>{s.price}</span>
                    </div>
                    <div style={{ fontSize: "0.72rem", color: C.textFaint, marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={11} /> {s.duration}
                      {activeBooked && <span style={{ marginLeft: 6, color: C.gold, fontWeight: 700 }}>· Booked</span>}
                    </div>
                    {s.includes.map((inc) => (
                      <div key={inc} style={{ fontSize: "0.76rem", color: C.textMuted, padding: "2px 0" }}>· {inc}</div>
                    ))}
                  </motion.button>
                );
              })}
            </div>
            <div style={{ marginTop: 16 }}>
              <motion.button
                type="button"
                onClick={handleBookSession}
                disabled={isBooked}
                whileHover={isBooked ? {} : { opacity: 0.92 }}
                whileTap={isBooked ? {} : { scale: 0.98 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  background: isBooked ? "#EAF7EF" : C.gold,
                  color: isBooked ? "#1E8449" : "#fff",
                  border: isBooked ? "1px solid #A3E635" : "none",
                  borderRadius: C.radius,
                  padding: "12px 24px",
                  fontSize: "0.86rem",
                  fontWeight: 600,
                  cursor: isBooked ? "default" : "pointer",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {isBooked ? (
                  <>
                    <Check size={16} /> Session Booked ({currentSess.name})
                  </>
                ) : (
                  `Book ${currentSess.name} (${currentSess.price})`
                )}
              </motion.button>
            </div>
          </section>

          {/* 7 — Availability */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Availability — Next 7 Days</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
              {detail.availability.map((a) => {
                const badge = a.slots.length >= 2 ? "Available" : a.slots.length === 1 ? "Few left" : "Fully booked";
                const badgeColor = badge === "Available" ? "#0F9D6C" : badge === "Few left" ? "#D97706" : C.textFaint;
                return (
                  <div key={a.date} style={{ border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "12px 14px" }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>{a.date}</div>
                    <div style={{ fontSize: "0.66rem", color: badgeColor, fontWeight: 600, marginBottom: 8 }}>{badge}</div>
                    {a.slots.map((s) => (
                      <div key={s} style={{ fontSize: "0.72rem", color: C.textMuted, padding: "1px 0" }}>{s}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8 — Student results */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>{config.resultsLabel}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr", gap: 16 }}>
              {extra.results.map((r) => (
                <div key={r.label} style={{ background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, borderRadius: C.radius, padding: "18px 16px" }}>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: C.gold, marginBottom: 6 }}>{r.metric}</div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text, marginBottom: 6, lineHeight: 1.35 }}>{r.label}</div>
                  <div style={{ fontSize: "0.74rem", color: C.textMuted, lineHeight: 1.5 }}>{r.detail}</div>
                </div>
              ))}
            </div>
          </section>

          {/* 9 — Reviews */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Student Reviews</SectionTitle>

            <div style={{ display: "flex", gap: 32, marginBottom: 24, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.2rem", fontWeight: 700, color: C.text, lineHeight: 1 }}>{mentor.rating}</div>
                <div style={{ display: "flex", gap: 1, justifyContent: "center", margin: "4px 0" }}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} color={C.gold} fill={i < Math.round(mentor.rating) ? C.gold : "none"} />)}
                </div>
                <div style={{ fontSize: "0.68rem", color: C.textFaint }}>{detail.reviews.length * 137} reviews</div>
              </div>
              <div style={{ flex: 1, minWidth: 180, maxWidth: 260 }}>
                {[5, 4, 3, 2, 1].map((star, i) => (
                  <div key={star} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: "0.68rem", color: C.textFaint, width: 8 }}>{star}</span>
                    <div style={{ flex: 1, height: 5, background: C.borderMuted, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${(dist[i] / maxDist) * 100}%`, height: "100%", background: C.gold, borderRadius: 3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {detail.reviews.map((rv) => (
                <div key={rv.name} style={{ paddingBottom: 22, borderBottom: `1px solid ${C.borderMuted}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                    <Avatar initials={rv.initials} color={rv.color} size={38} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: C.text }}>{rv.name}</div>
                      <div style={{ fontSize: "0.72rem", color: C.textFaint }}>{rv.course} · {rv.date}</div>
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={11} color={C.gold} fill={i < rv.rating ? C.gold : "none"} />)}
                    </div>
                  </div>
                  <p style={{ fontSize: "0.86rem", color: C.textMuted, lineHeight: 1.65, margin: 0, maxWidth: 600 }}>{rv.text}</p>
                </div>
              ))}
            </div>
          </section>

          {reviewBookingId && !reviewSubmitted && dbMentor?.id && (
            <section style={{ marginBottom: 44 }}>
              <SectionTitle>Share Your Experience</SectionTitle>
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: 20, maxWidth: 620 }}>
                <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                  {[1,2,3,4,5].map((star) => (
                    <button key={star} type="button" onClick={() => setReviewRating(star)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
                      <Star size={18} color={C.gold} fill={star <= reviewRating ? C.gold : "none"} />
                    </button>
                  ))}
                </div>
                <textarea value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder="How was your mentorship session?" rows={4} style={{ width: "100%", boxSizing: "border-box", resize: "vertical", background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: 12, fontFamily: "'Inter', sans-serif", outline: "none" }} />
                <button type="button" disabled={reviewSaving || !reviewText.trim()} onClick={async () => {
                  setReviewSaving(true);
                  const ok = await submitMentorReview(reviewBookingId, dbMentor.id, reviewRating, reviewText);
                  setReviewSaving(false);
                  if (ok) { setReviewSubmitted(true); toast.success("Review submitted."); } else toast.error("Could not submit review.");
                }} style={{ marginTop: 10, padding: "10px 16px", borderRadius: C.radiusSm, border: "none", background: reviewText.trim() ? C.gold : C.border, color: "#fff", fontWeight: 700, cursor: reviewText.trim() ? "pointer" : "default" }}>
                  {reviewSaving ? "Submitting…" : "Submit Review"}
                </button>
              </div>
            </section>
          )}

          {/* 10 — Related growth paths */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Related Growth Paths</SectionTitle>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {detail.relatedPaths.map((p) => (
                <button
                  key={p}
                  onClick={() => onNavigate?.("goals")}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, background: C.surface,
                    border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "10px 16px",
                    cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: C.text, fontWeight: 500,
                  }}
                >
                  {p} <ArrowRight size={12} color={C.gold} />
                </button>
              ))}
            </div>
          </section>

          {/* 11 — Free resources */}
          <section style={{ marginBottom: 44 }}>
            <SectionTitle>Free Resources From {mentor.name.split(" ")[0]}</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr", gap: 14 }}>
              {detail.content.map((c) => {
                const Icon = CONTENT_ICON[c.type];
                return (
                  <motion.div key={c.title} whileHover={{ y: -2 }} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "16px", cursor: "pointer" }}>
                    <Icon size={16} color={C.gold} style={{ marginBottom: 10 }} />
                    <div style={{ fontSize: "0.66rem", color: C.textFaint, fontWeight: 600, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.05em" }}>{c.type}</div>
                    <div style={{ fontSize: "0.82rem", color: C.text, lineHeight: 1.4 }}>{c.title}</div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* 12 — FAQ */}
          <section style={{ marginBottom: 8 }}>
            <SectionTitle>Frequently Asked</SectionTitle>
            <div style={{ maxWidth: 620 }}>
              {detail.faq.map((f, i) => {
                const open = openFaq === i;
                return (
                  <div key={f.q} style={{ borderBottom: `1px solid ${C.borderMuted}` }}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", padding: "16px 0", fontFamily: "'Inter', sans-serif", textAlign: "left" }}
                    >
                      <span style={{ fontSize: "0.88rem", fontWeight: 600, color: C.text }}>{f.q}</span>
                      <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} style={{ display: "flex", flexShrink: 0 }}>
                        <ChevronDown size={16} color={C.textFaint} />
                      </motion.span>
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                          <p style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.65, margin: "0 0 18px" }}>{f.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ══════════════ RIGHT — sticky sidebar on desktop, stacks below the profile
             content on tablet/mobile ══════════════ */}
        <div style={{ position: isDesktop ? "sticky" : "static", top: 24 }}>
          <div style={{ background: C.surface, borderRadius: C.radius, boxShadow: C.shadowMd, padding: 22, marginBottom: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: 16 }}>
              <Avatar initials={mentor.initials} color={mentor.color} size={64} />
              <div style={{ fontSize: "0.98rem", fontWeight: 700, color: C.text, marginTop: 10 }}>{mentor.name}</div>
              <div style={{ fontSize: "0.76rem", color: C.textMuted }}>{mentor.company}</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 0", marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${C.borderMuted}` }}>
              <InfoRow icon={Star} text={`${mentor.rating} rating`} />
              <InfoRow icon={TrendingUp} text={detail.experience} />
              <InfoRow icon={Globe2} text={detail.languages.join(", ")} />
              <InfoRow icon={MapPin} text={detail.location} />
              <InfoRow icon={Zap} text={detail.responseTime} />
            </div>

            <div style={{ marginBottom: 4 }}>
              <div style={{ ...LABEL, marginBottom: 4 }}>Selected Session</div>
              <div style={{ fontSize: "0.92rem", fontWeight: 700, color: C.text }}>{currentSess.name}</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 700, color: currentSess.price === "Free" ? "#0F9D6C" : C.text, fontFamily: "'Playfair Display', serif", marginTop: 2 }}>
                {currentSess.price} <span style={{ fontSize: "0.74rem", color: C.textMuted, fontFamily: "'Inter', sans-serif" }}>/ {currentSess.duration}</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleBookSession}
              disabled={isBooked}
              whileHover={isBooked ? {} : { opacity: 0.92 }}
              whileTap={isBooked ? {} : { scale: 0.98 }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                background: isBooked ? "#EAF7EF" : C.gold,
                color: isBooked ? "#1E8449" : "#fff",
                border: isBooked ? "1px solid #A3E635" : "none",
                borderRadius: C.radius,
                padding: "12px 0",
                fontSize: "0.86rem",
                fontWeight: 600,
                cursor: isBooked ? "default" : "pointer",
                fontFamily: "'Inter', sans-serif",
                marginTop: 16,
                marginBottom: 8,
              }}
            >
              {isBooked ? (
                <>
                  <Check size={16} /> Session Booked
                </>
              ) : (
                "Book Session"
              )}
            </motion.button>
            <motion.button
              onClick={() => onMessageMentor?.(mentor.id)}
              whileHover={{ background: C.surfaceAlt }} whileTap={{ scale: 0.98 }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "10px 0", fontSize: "0.82rem", fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif", marginBottom: 8 }}
            >
              <MessageCircle size={14} /> Message Mentor
            </motion.button>
          </div>
        </div>
      </div>

      {/* ══════════════ Similar mentors ══════════════ */}
      {similar.length > 0 && (
        <div style={{ padding: isDesktop ? "0 48px 48px" : "0 16px 40px" }}>
          <SectionTitle>Similar Mentors</SectionTitle>
          <div style={{ display: "flex", gap: 20, overflowX: "auto" }}>
            {similar.map((m) => (
              <motion.div
                key={m.id}
                whileHover={{ y: -2 }}
                onClick={() => onSelectMentor?.(m.id)}
                style={{ minWidth: 220, background: C.surface, borderRadius: C.radius, boxShadow: C.shadow, padding: 18, cursor: "pointer", flexShrink: 0 }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 10 }}>
                  <Avatar initials={m.initials} color={m.color} size={44} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.86rem", fontWeight: 600, color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                    <div style={{ fontSize: "0.72rem", color: C.textMuted }}>{m.title}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.76rem", color: C.text }}>
                    <Star size={11} color={C.gold} fill={C.gold} /> {m.rating}
                  </span>
                  <span style={{ fontSize: "0.76rem", color: C.gold, fontWeight: 500 }}>View →</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Luxury Checkout & Booking Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        mentor={mentor}
        session={currentSess}
        availability={checkoutAvailability}
        onMessageMentor={onMessageMentor}
        onSuccessBooking={() => {
          forceBookingsTick((n) => n + 1);
        }}
      />
    </div>
  );
}

function InfoRow({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; color?: string }>; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
      <Icon size={12} color={C.textFaint} />
      <span style={{ fontSize: "0.74rem", color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{text}</span>
    </div>
  );
}
