import { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  Calendar,
  MessageCircle,
  Star,
  ArrowRight,
  Video,
  Clock,
  CheckCircle2,
  CalendarPlus,
  Sliders,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type { MentorProfileData, Mentee, MentorSession } from "../lib/mentorDataService";
import { VideoCallModal } from "../../dashboard/VideoCallModal";
import { toast } from "sonner";

interface Props {
  mentor: MentorProfileData;
  mentees: Mentee[];
  sessions: MentorSession[];
  unreadMessagesCount: number;
  onNavigate: (tab: "dashboard" | "mentees" | "sessions" | "messages" | "profile") => void;
  onOpenSessionModal: () => void;
  onMessageMentee: (menteeId: string) => void;
  onToggleAvailability: () => void;
  onSessionStatusChange: (sessionId: string, status: "Completed" | "Cancelled" | "Booked") => void;
}

export function MentorDashboardHome({
  mentor,
  mentees,
  sessions,
  unreadMessagesCount,
  onNavigate,
  onOpenSessionModal,
  onMessageMentee,
  onToggleAvailability,
  onSessionStatusChange,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [activeCallSession, setActiveCallSession] = useState<MentorSession | null>(null);

  const upcomingSessions = sessions.filter((s) => s.status === "Booked");
  const nextSession = upcomingSessions[0] || null;
  const recentMentees = mentees.slice(0, 4);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── 1. Executive Welcome Header ── */}
      <section
        style={{
          background: `linear-gradient(135deg, ${M.surface} 0%, rgba(20, 19, 36, 0.7) 100%)`,
          border: `1px solid ${M.border}`,
          borderRadius: M.radiusLg,
          padding: isCompact ? "24px 20px" : "32px 34px",
          position: "relative",
          overflow: "hidden",
          boxShadow: M.shadow,
        }}
      >
        {/* Subtle decorative glow */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: isCompact ? "column" : "row",
            alignItems: isCompact ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: M.radiusPill,
                  background: M.goldBg,
                  border: `1px solid ${M.goldBorder}`,
                  color: M.gold,
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                <Sparkles size={13} />
                Mentor Command Center
              </span>

              <button
                onClick={onToggleAvailability}
                title="Click to toggle availability"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 11px",
                  borderRadius: M.radiusPill,
                  background: mentor.acceptingMentees ? M.greenBg : "rgba(255,255,255,0.06)",
                  border: `1px solid ${mentor.acceptingMentees ? M.greenBorder : M.border}`,
                  color: mentor.acceptingMentees ? M.green : M.textFaint,
                  fontSize: "0.74rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: M.sans,
                  transition: "all 0.18s ease",
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: mentor.acceptingMentees ? M.green : M.textFaint,
                    boxShadow: mentor.acceptingMentees ? `0 0 8px ${M.green}` : "none",
                  }}
                />
                {mentor.acceptingMentees ? "Accepting Mentees" : "Availability Paused"}
              </button>
            </div>

            <h1
              style={{
                fontFamily: M.serif,
                fontSize: isCompact ? "1.75rem" : "2.15rem",
                fontWeight: 700,
                color: M.text,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              Welcome back, {mentor.name.split(" ")[0]}.
            </h1>
            <p
              style={{
                color: M.textMuted,
                fontSize: "0.92rem",
                marginTop: 6,
                marginBottom: 0,
                maxWidth: 620,
                lineHeight: 1.5,
              }}
            >
              {mentor.headline}
              {mentor.company ? ` · ${mentor.company}` : ""}
            </p>
          </div>

          {/* Quick Action Chips */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap",
              width: isCompact ? "100%" : "auto",
            }}
          >
            <button
              onClick={onOpenSessionModal}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 18px",
                borderRadius: M.radiusSm,
                background: M.gold,
                color: "#11101a",
                border: "none",
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: "pointer",
                fontFamily: M.sans,
                boxShadow: "0 2px 10px rgba(212,175,55,0.25)",
                transition: "transform 0.16s ease, filter 0.16s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.filter = "none")}
            >
              <CalendarPlus size={16} />
              Schedule Session
            </button>

            <button
              onClick={() => onNavigate("profile")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 16px",
                borderRadius: M.radiusSm,
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${M.border}`,
                color: M.text,
                fontWeight: 600,
                fontSize: "0.86rem",
                cursor: "pointer",
                fontFamily: M.sans,
                transition: "background 0.16s ease, border-color 0.16s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = M.surfaceAlt;
                e.currentTarget.style.borderColor = M.borderMuted;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                e.currentTarget.style.borderColor = M.border;
              }}
            >
              <Sliders size={15} color={M.gold} />
              Manage Availability
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Four Key Metric Cards (KPIs) ── */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : isCompact
            ? "repeat(2, 1fr)"
            : "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {/* Metric 1: Active Mentees */}
        <div
          onClick={() => onNavigate("mentees")}
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radius,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = M.goldBorder;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = M.border;
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: M.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>Active Mentees</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: M.goldBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={17} color={M.gold} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: M.sans, fontSize: "1.9rem", fontWeight: 700, color: M.text }}>
              {mentees.length}
            </span>
            <span style={{ color: M.green, fontSize: "0.76rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <TrendingUp size={12} /> Active
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${M.borderSubtle}` }}>
            <span style={{ fontSize: "0.76rem", color: M.textFaint }}>View mentees directory</span>
            <ChevronRight size={14} color={M.textFaint} />
          </div>
        </div>

        {/* Metric 2: Upcoming Sessions */}
        <div
          onClick={() => onNavigate("sessions")}
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radius,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "transform 0.18s ease, border-color 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = M.goldBorder;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = M.border;
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: M.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>Upcoming Sessions</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: M.blueBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Calendar size={17} color={M.blue} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: M.sans, fontSize: "1.9rem", fontWeight: 700, color: M.text }}>
              {upcomingSessions.length}
            </span>
            {nextSession && (
              <span style={{ color: M.gold, fontSize: "0.76rem", fontWeight: 600 }}>
                Next: {nextSession.bookingDate}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${M.borderSubtle}` }}>
            <span style={{ fontSize: "0.76rem", color: M.textFaint }}>Manage calendar</span>
            <ChevronRight size={14} color={M.textFaint} />
          </div>
        </div>

        {/* Metric 3: Unread Messages */}
        <div
          onClick={() => onNavigate("messages")}
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radius,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "transform 0.18s ease, border-color 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = M.goldBorder;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = M.border;
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: M.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>Messages</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: M.purpleBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <MessageCircle size={17} color={M.purple} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: M.sans, fontSize: "1.9rem", fontWeight: 700, color: M.text }}>
              {unreadMessagesCount > 0 ? `${unreadMessagesCount} unread` : "All read"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${M.borderSubtle}` }}>
            <span style={{ fontSize: "0.76rem", color: M.textFaint }}>Open inbox</span>
            <ChevronRight size={14} color={M.textFaint} />
          </div>
        </div>

        {/* Metric 4: Rating & Reviews */}
        <div
          onClick={() => onNavigate("profile")}
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radius,
            padding: "20px 22px",
            cursor: "pointer",
            transition: "transform 0.18s ease, border-color 0.18s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = M.goldBorder;
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = M.border;
            e.currentTarget.style.transform = "none";
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ color: M.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>Mentor Rating</span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: M.goldBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Star size={17} color={M.gold} fill={M.gold} />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: M.sans, fontSize: "1.9rem", fontWeight: 700, color: M.text }}>
              {mentor.rating.toFixed(1)}
            </span>
            <span style={{ color: M.textFaint, fontSize: "0.78rem" }}>
              ({mentor.totalReviews} reviews)
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 10, borderTop: `1px solid ${M.borderSubtle}` }}>
            <span style={{ fontSize: "0.76rem", color: M.textFaint }}>View feedback</span>
            <ChevronRight size={14} color={M.textFaint} />
          </div>
        </div>
      </section>

      {/* ── 3. Two-Column Content Grid: Next Sessions & Active Mentees ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "1.4fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: Upcoming Sessions Agenda */}
        <section
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radiusLg,
            padding: "24px 26px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: M.serif, fontSize: "1.35rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Upcoming Sessions
              </h2>
              <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                Confirmed 1-on-1 mentorship appointments
              </p>
            </div>
            <button
              onClick={() => onNavigate("sessions")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                color: M.gold,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: M.sans,
              }}
            >
              See all <ArrowRight size={14} />
            </button>
          </div>

          {upcomingSessions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                border: `1px dashed ${M.border}`,
                borderRadius: M.radius,
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <Calendar size={32} color={M.gold} style={{ opacity: 0.7, marginBottom: 12 }} />
              <h3 style={{ fontSize: "1rem", color: M.text, margin: "0 0 6px" }}>No sessions scheduled today</h3>
              <p style={{ color: M.textFaint, fontSize: "0.84rem", maxWidth: 360, margin: "0 auto 18px" }}>
                Keep your availability updated so students can book slots. You can also schedule sessions manually.
              </p>
              <button
                onClick={onOpenSessionModal}
                style={{
                  background: M.gold,
                  color: "#11101a",
                  border: "none",
                  borderRadius: M.radiusSm,
                  padding: "8px 18px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: M.sans,
                }}
              >
                Schedule a Session
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {upcomingSessions.slice(0, 3).map((session, idx) => (
                <div
                  key={session.id}
                  style={{
                    background: idx === 0 ? "rgba(212,175,55,0.04)" : M.surfaceAlt,
                    border: `1px solid ${idx === 0 ? M.goldBorder : M.border}`,
                    borderRadius: M.radius,
                    padding: "16px 18px",
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: 14,
                    transition: "border-color 0.16s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        background: idx === 0 ? M.goldBg : "rgba(255,255,255,0.06)",
                        border: `1px solid ${idx === 0 ? M.goldBorder : M.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.9rem",
                        fontWeight: 700,
                        color: idx === 0 ? M.gold : M.text,
                        flexShrink: 0,
                      }}
                    >
                      {session.menteeName
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: "0.92rem", color: M.text }}>
                          {session.menteeName}
                        </span>
                        {idx === 0 && (
                          <span
                            style={{
                              padding: "2px 7px",
                              borderRadius: M.radiusPill,
                              background: M.goldBg,
                              color: M.gold,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                            }}
                          >
                            Next Up
                          </span>
                        )}
                      </div>
                      <div style={{ color: M.textMuted, fontSize: "0.82rem", marginTop: 3 }}>
                        {session.sessionType} · {session.duration}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          color: M.gold,
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          marginTop: 4,
                        }}
                      >
                        <Clock size={12} />
                        {session.bookingDate}, {session.bookingTime}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: isMobile ? "100%" : "auto" }}>
                    <button
                      onClick={() => setActiveCallSession(session)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        background: idx === 0 ? M.gold : "rgba(255,255,255,0.08)",
                        color: idx === 0 ? "#11101a" : M.text,
                        border: idx === 0 ? "none" : `1px solid ${M.border}`,
                        borderRadius: M.radiusSm,
                        padding: "8px 14px",
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: M.sans,
                        flex: isMobile ? 1 : "initial",
                      }}
                    >
                      <Video size={14} /> Join Call
                    </button>

                    <button
                      onClick={() => onSessionStatusChange(session.id, "Completed")}
                      title="Mark session as completed"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 34,
                        height: 34,
                        borderRadius: M.radiusSm,
                        background: "rgba(255,255,255,0.05)",
                        border: `1px solid ${M.border}`,
                        color: M.green,
                        cursor: "pointer",
                      }}
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Recent Mentees Spotlight */}
        <section
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radiusLg,
            padding: "24px 26px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: M.serif, fontSize: "1.35rem", fontWeight: 700, color: M.text, margin: 0 }}>
                My Mentees
              </h2>
              <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                Recently active learners
              </p>
            </div>
            <button
              onClick={() => onNavigate("mentees")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: "none",
                border: "none",
                color: M.gold,
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: M.sans,
              }}
            >
              Directory <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentMentees.map((mentee) => (
              <div
                key={mentee.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 14px",
                  borderRadius: M.radius,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.borderSubtle}`,
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${M.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      color: M.gold,
                      flexShrink: 0,
                    }}
                  >
                    {mentee.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: M.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mentee.name}
                    </div>
                    <div style={{ color: M.textFaint, fontSize: "0.76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mentee.careerGoal || "Learner"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onMessageMentee(mentee.id)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: M.radiusSm,
                    background: "rgba(212,175,55,0.08)",
                    border: `1px solid ${M.goldBorder}`,
                    color: M.gold,
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: M.sans,
                    whiteSpace: "nowrap",
                  }}
                >
                  Message
                </button>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: 18,
              paddingTop: 14,
              borderTop: `1px solid ${M.borderSubtle}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.78rem", color: M.textFaint }}>
              Total mentees coached: <strong style={{ color: M.text }}>{mentees.length}</strong>
            </span>
            <button
              onClick={() => onNavigate("mentees")}
              style={{
                background: "none",
                border: "none",
                color: M.gold,
                fontSize: "0.78rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Manage all →
            </button>
          </div>
        </section>
      </div>

      {/* ── 4. Interactive Video Call Modal (Reuses Starfix's native component) ── */}
      {activeCallSession && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setActiveCallSession(null)}
          meetingUrl={activeCallSession.meetingUrl || `https://meet.jit.si/starfix-${activeCallSession.id}`}
          mentorName={mentor.name}
          pathTitle={activeCallSession.sessionType}
          onSessionReflection={() => {
            onSessionStatusChange(activeCallSession.id, "Completed");
            setActiveCallSession(null);
            toast.success("Session completed and recorded.");
          }}
        />
      )}
    </div>
  );
}
