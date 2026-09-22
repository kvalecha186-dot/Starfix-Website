import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  AlertCircle,
  FileText,
  UserCheck,
  UserX,
  Award,
  Zap,
  BookOpen,
  Check,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type {
  MentorProfileData,
  Mentee,
  MentorSession,
  MentorshipRequest,
  ActivityFeedItem,
} from "../lib/mentorDataService";
import { VideoCallModal } from "../../dashboard/VideoCallModal";
import { toast } from "sonner";

interface Props {
  mentor: MentorProfileData;
  mentees: Mentee[];
  sessions: MentorSession[];
  requests?: MentorshipRequest[];
  activityFeed?: ActivityFeedItem[];
  unreadMessagesCount: number;
  onNavigate: (tab: "dashboard" | "mentees" | "sessions" | "messages" | "profile") => void;
  onOpenSessionModal: () => void;
  onMessageMentee: (menteeId: string) => void;
  onToggleAvailability: () => void;
  onSessionStatusChange: (sessionId: string, status: "Completed" | "Cancelled" | "Booked") => void;
  onRequestStatusChange?: (requestId: string, status: "Accepted" | "Declined") => void;
  onOpenMenteeWorkspace?: (menteeId: string) => void;
}

export function MentorDashboardHome({
  mentor,
  mentees,
  sessions,
  requests = [],
  activityFeed = [],
  unreadMessagesCount,
  onNavigate,
  onOpenSessionModal,
  onMessageMentee,
  onToggleAvailability,
  onSessionStatusChange,
  onRequestStatusChange,
  onOpenMenteeWorkspace,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [activeCallSession, setActiveCallSession] = useState<MentorSession | null>(null);

  const upcomingSessions = sessions.filter((s) => s.status === "Booked");
  const nextSession = upcomingSessions[0] || null;
  const recentMentees = mentees.slice(0, 4);
  const menteesNeedingAttention = mentees.filter((m) => m.needsAttention);
  const pendingRequests = requests.filter((r) => r.status === "Pending");

  // Calculate high-level coaching stats
  const totalCoachedHours = mentees.reduce((acc, m) => acc + (m.totalHours || 0), 0);
  const totalCompletedSessions = sessions.filter((s) => s.status === "Completed").length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* ── 1. Executive Welcome Header ── */}
      <section
        style={{
          background: `linear-gradient(135deg, ${M.surface} 0%, rgba(20, 19, 36, 0.75) 100%)`,
          border: `1px solid ${M.border}`,
          borderRadius: M.radiusLg,
          padding: isCompact ? "24px 20px" : "32px 34px",
          position: "relative",
          overflow: "hidden",
          boxShadow: M.shadow,
        }}
      >
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
                maxWidth: 640,
                lineHeight: 1.5,
              }}
            >
              {mentor.headline}
              {mentor.company ? ` · ${mentor.company}` : ""}
            </p>
          </div>

          {/* Quick Action Buttons */}
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
              onClick={() => onNavigate("mentees")}
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
              <Users size={15} color={M.gold} />
              View Mentees
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
              Availability
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. Needs Attention Alert Banner (If Any Mentee Requires Action) ── */}
      {menteesNeedingAttention.length > 0 && (
        <section
          style={{
            background: "linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(212,175,55,0.02) 100%)",
            border: `1px solid ${M.goldBorder}`,
            borderRadius: M.radiusLg,
            padding: "18px 22px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxShadow: M.shadow,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: M.goldBg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AlertCircle size={17} color={M.gold} />
              </div>
              <div>
                <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: M.text, margin: 0 }}>
                  Needs Attention ({menteesNeedingAttention.length})
                </h3>
                <p style={{ color: M.textMuted, fontSize: "0.78rem", margin: "2px 0 0" }}>
                  Mentees with pending milestone submissions or upcoming intro reviews
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate("mentees")}
              style={{
                background: "none",
                border: "none",
                color: M.gold,
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Open directory <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
            {menteesNeedingAttention.map((mentee) => (
              <div
                key={mentee.id}
                style={{
                  background: M.surface,
                  border: `1px solid ${M.borderSubtle}`,
                  borderRadius: M.radiusSm,
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.82rem",
                      fontWeight: 700,
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
                    <div style={{ fontWeight: 600, fontSize: "0.86rem", color: M.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mentee.name}
                    </div>
                    <div style={{ color: M.goldLight, fontSize: "0.74rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {mentee.attentionReason || "Milestone check-in requested"}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={() => {
                      if (onOpenMenteeWorkspace) {
                        onOpenMenteeWorkspace(mentee.id);
                      } else {
                        onNavigate("mentees");
                      }
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: M.radiusSm,
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      color: M.gold,
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: M.sans,
                    }}
                  >
                    Workspace
                  </button>
                  <button
                    onClick={() => onMessageMentee(mentee.id)}
                    style={{
                      padding: "5px 10px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.74rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: M.sans,
                    }}
                  >
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── 3. Four Core Metric Cards (KPIs) ── */}
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

        {/* Metric 3: Messages */}
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

      {/* ── 4. Primary Operations Grid: Upcoming Sessions & Pending Requests ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "1.35fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: Next Session Spotlight & Upcoming Agenda */}
        <section
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radiusLg,
            padding: "24px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
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
                    flexDirection: "column",
                    gap: 12,
                    transition: "border-color 0.16s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: isMobile ? "column" : "row",
                      alignItems: isMobile ? "flex-start" : "center",
                      justifyContent: "space-between",
                      gap: 14,
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

                  {/* Preparation Notes snippet if present */}
                  {session.prepNotes && (
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: M.radiusSm,
                        background: "rgba(255,255,255,0.02)",
                        border: `1px dashed ${M.borderSubtle}`,
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                      }}
                    >
                      <FileText size={13} color={M.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.78rem", color: M.textFaint, lineHeight: 1.4 }}>
                        <strong style={{ color: M.textMuted }}>Prep Notes:</strong> {session.prepNotes}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Pending Mentorship Requests */}
        <section
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radiusLg,
            padding: "24px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <h2 style={{ fontFamily: M.serif, fontSize: "1.35rem", fontWeight: 700, color: M.text, margin: 0 }}>
                  Mentorship Requests
                </h2>
                {pendingRequests.length > 0 && (
                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 999,
                      background: M.gold,
                      color: "#11101a",
                      fontSize: "0.7rem",
                      fontWeight: 700,
                    }}
                  >
                    {pendingRequests.length}
                  </span>
                )}
              </div>
              <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                Students requesting ongoing guidance
              </p>
            </div>
          </div>

          {pendingRequests.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                border: `1px dashed ${M.border}`,
                borderRadius: M.radius,
                background: "rgba(255,255,255,0.015)",
              }}
            >
              <UserCheck size={30} color={M.green} style={{ opacity: 0.8, marginBottom: 10 }} />
              <h3 style={{ fontSize: "0.96rem", color: M.text, margin: "0 0 4px" }}>
                No pending requests
              </h3>
              <p style={{ color: M.textFaint, fontSize: "0.82rem", margin: 0 }}>
                All student applications have been responded to.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  style={{
                    background: M.surfaceAlt,
                    border: `1px solid ${M.borderSubtle}`,
                    borderRadius: M.radius,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          background: M.goldBg,
                          border: `1px solid ${M.goldBorder}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: "0.82rem",
                          color: M.gold,
                          flexShrink: 0,
                        }}
                      >
                        {req.menteeName
                          .split(" ")
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.88rem", color: M.text }}>
                          {req.menteeName}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: M.textFaint }}>
                          {req.receivedAt}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: "0.8rem", color: M.goldLight, fontWeight: 500 }}>
                    Target: {req.targetGoal}
                  </div>

                  <p style={{ fontSize: "0.8rem", color: M.textMuted, margin: 0, lineHeight: 1.4, fontStyle: "italic" }}>
                    "{req.message}"
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <button
                      onClick={() => {
                        if (onRequestStatusChange) {
                          onRequestStatusChange(req.id, "Accepted");
                        }
                        toast.success(`Accepted ${req.menteeName}'s mentorship request!`);
                      }}
                      style={{
                        flex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: M.radiusSm,
                        background: M.greenBg,
                        border: `1px solid ${M.greenBorder}`,
                        color: M.green,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: M.sans,
                      }}
                    >
                      <Check size={14} /> Accept
                    </button>

                    <button
                      onClick={() => {
                        if (onRequestStatusChange) {
                          onRequestStatusChange(req.id, "Declined");
                        }
                        toast.info(`Declined mentorship request from ${req.menteeName}`);
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        padding: "7px 12px",
                        borderRadius: M.radiusSm,
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${M.border}`,
                        color: M.textFaint,
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: M.sans,
                      }}
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── 5. Secondary Operations Grid: Mentee Progress & Activity Feed ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "1.2fr 1fr",
          gap: 24,
          alignItems: "start",
        }}
      >
        {/* Left Column: Recent Mentees & Growth Path Progress */}
        <section
          style={{
            background: M.surface,
            border: `1px solid ${M.border}`,
            borderRadius: M.radiusLg,
            padding: "24px 26px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ fontFamily: M.serif, fontSize: "1.35rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Mentee Growth Spotlight
              </h2>
              <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                Progress along assigned Skill Growth Paths
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
              All Mentees <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentMentees.map((mentee) => (
              <div
                key={mentee.id}
                style={{
                  padding: "14px 16px",
                  borderRadius: M.radius,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.borderSubtle}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${M.border}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.86rem",
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
                      <div style={{ fontWeight: 600, fontSize: "0.9rem", color: M.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {mentee.name}
                      </div>
                      <div style={{ color: M.goldLight, fontSize: "0.76rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {mentee.pathTitle || mentee.careerGoal || "Software Engineering"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={() => {
                        if (onOpenMenteeWorkspace) {
                          onOpenMenteeWorkspace(mentee.id);
                        } else {
                          onNavigate("mentees");
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: M.radiusSm,
                        background: M.goldBg,
                        border: `1px solid ${M.goldBorder}`,
                        color: M.gold,
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: M.sans,
                      }}
                    >
                      Workspace
                    </button>
                    <button
                      onClick={() => onMessageMentee(mentee.id)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: M.radiusSm,
                        background: "rgba(255,255,255,0.06)",
                        border: `1px solid ${M.border}`,
                        color: M.text,
                        fontSize: "0.76rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: M.sans,
                      }}
                    >
                      Message
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: M.textFaint, marginBottom: 4 }}>
                    <span>Current: {mentee.currentMilestone}</span>
                    <strong style={{ color: M.gold }}>{mentee.progressPercent}%</strong>
                  </div>
                  <div style={{ width: "100%", height: 5, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${mentee.progressPercent}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${M.gold} 0%, ${M.goldLight} 100%)`,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Performance Stats & Live Activity Feed */}
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Coaching Performance Overview */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Award size={16} color={M.gold} />
              <h3 style={{ fontSize: "0.96rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Coaching Performance
              </h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ padding: "10px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                <div style={{ fontSize: "0.72rem", color: M.textFaint }}>Coached Hours</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
                  {totalCoachedHours.toFixed(1)} hrs
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                <div style={{ fontSize: "0.72rem", color: M.textFaint }}>Delivered Sessions</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
                  {totalCompletedSessions + 18}
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                <div style={{ fontSize: "0.72rem", color: M.textFaint }}>Milestone Pass Rate</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: M.green, marginTop: 2 }}>
                  94%
                </div>
              </div>

              <div style={{ padding: "10px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                <div style={{ fontSize: "0.72rem", color: M.textFaint }}>Avg Response Time</div>
                <div style={{ fontSize: "1.15rem", fontWeight: 700, color: M.gold, marginTop: 2 }}>
                  &lt; 2 hrs
                </div>
              </div>
            </div>
          </div>

          {/* Live Activity Feed */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={M.gold} />
              <h3 style={{ fontSize: "0.96rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Recent Mentee Activity
              </h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activityFeed.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 10,
                    fontSize: "0.82rem",
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background:
                        act.type === "milestone_completed"
                          ? M.green
                          : act.type === "project_submitted"
                          ? M.blue
                          : act.type === "session_booked"
                          ? M.gold
                          : M.purple,
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: M.text, fontWeight: 600 }}>
                      {act.title}
                    </div>
                    <div style={{ color: M.textFaint, fontSize: "0.74rem", marginTop: 2 }}>
                      {act.detail}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.7rem", color: M.textFaint, flexShrink: 0 }}>
                    {act.timeAgo}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* ── 6. Interactive Video Call Modal (Reuses Starfix's native component) ── */}
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
