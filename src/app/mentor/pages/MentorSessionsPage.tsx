import { useState } from "react";
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Plus,
  ArrowRight,
  Sparkles,
  ExternalLink,
  ChevronDown,
  X,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type { MentorSession, Mentee } from "../lib/mentorDataService";
import { VideoCallModal } from "../../dashboard/VideoCallModal";
import { toast } from "sonner";

interface Props {
  sessions: MentorSession[];
  mentees: Mentee[];
  mentorName: string;
  onSessionStatusChange: (sessionId: string, status: "Completed" | "Cancelled" | "Booked") => void;
  onAddSession: (newSession: Omit<MentorSession, "id" | "createdAt">) => void;
  onMessageMentee: (menteeId: string) => void;
  isScheduleModalOpen: boolean;
  onCloseScheduleModal: () => void;
  onOpenScheduleModal: () => void;
}

export function MentorSessionsPage({
  sessions,
  mentees,
  mentorName,
  onSessionStatusChange,
  onAddSession,
  onMessageMentee,
  isScheduleModalOpen,
  onCloseScheduleModal,
  onOpenScheduleModal,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [activeVideoSession, setActiveVideoSession] = useState<MentorSession | null>(null);

  // New session modal state
  const [selectedMenteeId, setSelectedMenteeId] = useState(mentees[0]?.id || "");
  const [sessionTopic, setSessionTopic] = useState("1:1 Architecture & Career Review");
  const [sessionDate, setSessionDate] = useState("Tomorrow");
  const [sessionTime, setSessionTime] = useState("5:00 PM");
  const [sessionDuration, setSessionDuration] = useState("45 min");
  const [sessionPrice, setSessionPrice] = useState("₹2,500");
  const [sessionNotes, setSessionNotes] = useState("");

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "upcoming") return s.status === "Booked";
    if (activeTab === "completed") return s.status === "Completed";
    if (activeTab === "cancelled") return s.status === "Cancelled";
    return true;
  });

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    const mentee = mentees.find((m) => m.id === selectedMenteeId) || mentees[0];
    const menteeName = mentee ? mentee.name : "Starfix Mentee";

    onAddSession({
      menteeId: selectedMenteeId || `mentee_${Date.now()}`,
      menteeName,
      menteeEmail: mentee?.email,
      sessionType: sessionTopic,
      duration: sessionDuration,
      price: sessionPrice,
      bookingDate: sessionDate,
      bookingTime: sessionTime,
      status: "Booked",
      meetingUrl: `https://meet.jit.si/starfix-${Date.now()}`,
      notes: sessionNotes.trim() || undefined,
    });

    toast.success(`Session scheduled with ${menteeName} for ${sessionDate}, ${sessionTime}`);
    onCloseScheduleModal();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span
              style={{
                fontSize: "0.72rem",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: M.gold,
                fontWeight: 700,
              }}
            >
              Session Operations
            </span>
          </div>
          <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
            Mentorship Sessions
          </h1>
          <p style={{ color: M.textMuted, fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>
            Conduct live 1-on-1 calls, review session summaries, and coordinate schedules.
          </p>
        </div>

        <button
          onClick={onOpenScheduleModal}
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
            whiteSpace: "nowrap",
          }}
        >
          <Plus size={16} /> Schedule Session
        </button>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12 }}>
        {[
          { id: "upcoming", label: "Upcoming Sessions", count: sessions.filter((s) => s.status === "Booked").length },
          { id: "completed", label: "Completed Sessions", count: sessions.filter((s) => s.status === "Completed").length },
          { id: "cancelled", label: "Cancelled", count: sessions.filter((s) => s.status === "Cancelled").length },
        ].map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                padding: "7px 16px",
                borderRadius: M.radiusPill,
                background: active ? M.goldBg : "transparent",
                border: `1px solid ${active ? M.goldBorder : "transparent"}`,
                color: active ? M.gold : M.textMuted,
                fontSize: "0.84rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: M.sans,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              {tab.label}
              <span
                style={{
                  fontSize: "0.72rem",
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: active ? M.gold : "rgba(255,255,255,0.08)",
                  color: active ? "#11101a" : M.textFaint,
                  fontWeight: 700,
                }}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Sessions List ── */}
      {filteredSessions.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "54px 20px",
            background: M.surface,
            border: `1px dashed ${M.border}`,
            borderRadius: M.radiusLg,
          }}
        >
          <Calendar size={36} color={M.gold} style={{ opacity: 0.7, marginBottom: 14 }} />
          <h3 style={{ fontSize: "1.05rem", color: M.text, margin: "0 0 6px" }}>
            No {activeTab} sessions
          </h3>
          <p style={{ color: M.textMuted, fontSize: "0.85rem", maxWidth: 380, margin: "0 auto 18px" }}>
            {activeTab === "upcoming"
              ? "You do not have any upcoming sessions on your calendar right now."
              : `There are currently no ${activeTab} sessions in your history.`}
          </p>
          {activeTab === "upcoming" && (
            <button
              onClick={onOpenScheduleModal}
              style={{
                background: M.gold,
                color: "#11101a",
                border: "none",
                borderRadius: M.radiusSm,
                padding: "9px 20px",
                fontSize: "0.84rem",
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: M.sans,
              }}
            >
              Schedule New Session
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {filteredSessions.map((session) => {
            const isUpcoming = session.status === "Booked";
            return (
              <div
                key={session.id}
                style={{
                  background: isUpcoming ? M.surface : M.surfaceAlt,
                  border: `1px solid ${isUpcoming ? M.border : M.borderSubtle}`,
                  borderRadius: M.radius,
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: isCompact ? "column" : "row",
                  alignItems: isCompact ? "flex-start" : "center",
                  justifyContent: "space-between",
                  gap: 18,
                  boxShadow: M.shadow,
                  transition: "border-color 0.16s ease",
                }}
              >
                {/* Mentee & Session Info */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: isUpcoming ? M.goldBg : "rgba(255,255,255,0.05)",
                      border: `1px solid ${isUpcoming ? M.goldBorder : M.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "1rem",
                      color: isUpcoming ? M.gold : M.textMuted,
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
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "1rem", color: M.text }}>
                        {session.menteeName}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: M.radiusPill,
                          background:
                            session.status === "Booked"
                              ? M.goldBg
                              : session.status === "Completed"
                              ? M.greenBg
                              : M.redBg,
                          color:
                            session.status === "Booked"
                              ? M.gold
                              : session.status === "Completed"
                              ? M.green
                              : M.red,
                          border: `1px solid ${
                            session.status === "Booked"
                              ? M.goldBorder
                              : session.status === "Completed"
                              ? M.greenBorder
                              : M.redBorder
                          }`,
                        }}
                      >
                        {session.status === "Booked" ? "Confirmed" : session.status}
                      </span>
                    </div>

                    <div style={{ color: M.textMuted, fontSize: "0.85rem", marginTop: 4 }}>
                      {session.sessionType} · <strong style={{ color: M.text }}>{session.duration}</strong> · {session.price}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: M.gold, fontSize: "0.8rem", fontWeight: 600 }}>
                        <Clock size={13} />
                        {session.bookingDate} at {session.bookingTime}
                      </span>

                      {session.notes && (
                        <span style={{ color: M.textFaint, fontSize: "0.78rem" }}>
                          Notes: {session.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Session Action Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, width: isCompact ? "100%" : "auto", flexWrap: "wrap" }}>
                  {isUpcoming && (
                    <>
                      <button
                        onClick={() => setActiveVideoSession(session)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          background: M.gold,
                          color: "#11101a",
                          border: "none",
                          borderRadius: M.radiusSm,
                          padding: "9px 18px",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          fontFamily: M.sans,
                          flex: isMobile ? 1 : "initial",
                        }}
                      >
                        <Video size={15} /> Join Video Call
                      </button>

                      <button
                        onClick={() => onSessionStatusChange(session.id, "Completed")}
                        title="Mark Completed"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "9px 14px",
                          borderRadius: M.radiusSm,
                          background: M.greenBg,
                          border: `1px solid ${M.greenBorder}`,
                          color: M.green,
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <CheckCircle2 size={14} /> Completed
                      </button>

                      <button
                        onClick={() => {
                          if (confirm(`Cancel this mentorship session with ${session.menteeName}?`)) {
                            onSessionStatusChange(session.id, "Cancelled");
                          }
                        }}
                        title="Cancel Session"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 36,
                          height: 36,
                          borderRadius: M.radiusSm,
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${M.border}`,
                          color: M.textFaint,
                          cursor: "pointer",
                        }}
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => onMessageMentee(session.menteeId)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "9px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.05)",
                      border: `1px solid ${M.border}`,
                      color: M.textMuted,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    <MessageCircle size={14} /> Message
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Video Call Modal (Reuses native Starfix component) ── */}
      {activeVideoSession && (
        <VideoCallModal
          isOpen={true}
          onClose={() => setActiveVideoSession(null)}
          meetingUrl={activeVideoSession.meetingUrl || `https://meet.jit.si/starfix-${activeVideoSession.id}`}
          mentorName={mentorName}
          pathTitle={activeVideoSession.sessionType}
          onSessionReflection={() => {
            onSessionStatusChange(activeVideoSession.id, "Completed");
            setActiveVideoSession(null);
            toast.success("Session completed and saved to history.");
          }}
        />
      )}

      {/* ── Schedule New Session Modal ── */}
      {isScheduleModalOpen && (
        <div
          onClick={onCloseScheduleModal}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 150,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              background: M.surface,
              border: `1px solid ${M.goldBorder}`,
              borderRadius: M.radiusLg,
              padding: "28px 30px",
              boxShadow: M.shadowLg,
              color: M.text,
              fontFamily: M.sans,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", color: M.gold, fontWeight: 700 }}>
                  Mentor Calendar
                </span>
                <h3 style={{ fontFamily: M.serif, fontSize: "1.35rem", color: M.text, margin: "4px 0 0" }}>
                  Schedule 1:1 Session
                </h3>
              </div>
              <button onClick={onCloseScheduleModal} style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSession} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Select Mentee */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Select Mentee
                </label>
                <select
                  value={selectedMenteeId}
                  onChange={(e) => setSelectedMenteeId(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.86rem",
                    outline: "none",
                  }}
                >
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id} style={{ background: "#11101a", color: "#FAF9F6" }}>
                      {m.name} ({m.careerGoal || "General Mentorship"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Topic */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Session Type / Topic
                </label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="e.g. System Design Mock Interview"
                  required
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.86rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Date & Time Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    type="text"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    placeholder="e.g. Tomorrow or Sep 24"
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    placeholder="e.g. 5:00 PM"
                    required
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Duration & Price Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Duration
                  </label>
                  <select
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  >
                    <option value="30 min" style={{ background: "#11101a", color: "#FAF9F6" }}>30 min</option>
                    <option value="45 min" style={{ background: "#11101a", color: "#FAF9F6" }}>45 min</option>
                    <option value="60 min" style={{ background: "#11101a", color: "#FAF9F6" }}>60 min</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Price
                  </label>
                  <input
                    type="text"
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(e.target.value)}
                    placeholder="e.g. ₹2,500 or Free"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.86rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Agenda & Preparation Notes (Optional)
                </label>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Items for mentee to review beforehand..."
                  rows={2}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.86rem",
                    outline: "none",
                    resize: "none",
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button
                  type="button"
                  onClick={onCloseScheduleModal}
                  style={{
                    padding: "9px 18px",
                    borderRadius: M.radiusSm,
                    background: "transparent",
                    border: `1px solid ${M.border}`,
                    color: M.textMuted,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: "9px 22px",
                    borderRadius: M.radiusSm,
                    background: M.gold,
                    border: "none",
                    color: "#11101a",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
