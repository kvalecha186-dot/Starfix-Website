import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
  FileText,
  AlertCircle,
  Check,
  CalendarPlus,
  ListTodo,
  Save,
  Send,
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
  initialMenteeId?: string | null;
  onSessionStatusChange: (sessionId: string, status: "Completed" | "Cancelled" | "Booked") => void;
  onUpdateSession?: (sessionId: string, patch: Partial<MentorSession>) => void;
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
  initialMenteeId,
  onSessionStatusChange,
  onUpdateSession,
  onAddSession,
  onMessageMentee,
  isScheduleModalOpen,
  onCloseScheduleModal,
  onOpenScheduleModal,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "followup" | "cancelled">("upcoming");
  const [activeVideoSession, setActiveVideoSession] = useState<MentorSession | null>(null);

  // Post-Session Follow-up Modal State
  const [followupSession, setFollowupSession] = useState<MentorSession | null>(null);
  const [recapText, setRecapText] = useState("");
  const [prepNotesText, setPrepNotesText] = useState("");
  const [actionItemsList, setActionItemsList] = useState<string[]>([]);
  const [newActionItem, setNewActionItem] = useState("");
  const [needsFollowupToggle, setNeedsFollowupToggle] = useState(false);

  // New session modal state
  const [selectedMenteeId, setSelectedMenteeId] = useState(mentees[0]?.id || "");
  const [sessionTopic, setSessionTopic] = useState("1:1 Architecture & Career Review");
  const [sessionDate, setSessionDate] = useState("Tomorrow");
  const [sessionTime, setSessionTime] = useState("5:00 PM");
  const [sessionDuration, setSessionDuration] = useState("45 min");
  const [sessionPrice, setSessionPrice] = useState("₹2,500");
  const [sessionPrepNotes, setSessionPrepNotes] = useState("");

  useEffect(() => {
    if (initialMenteeId && mentees.some((m) => m.id === initialMenteeId)) setSelectedMenteeId(initialMenteeId);
  }, [initialMenteeId, mentees]);


  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "upcoming") return s.status === "Booked";
    if (activeTab === "completed") return s.status === "Completed";
    if (activeTab === "followup") return s.status === "Completed" && s.needsFollowup;
    if (activeTab === "cancelled") return s.status === "Cancelled";
    return true;
  });

  const handleOpenFollowupModal = (session: MentorSession) => {
    setFollowupSession(session);
    setRecapText(session.discussionRecap || "");
    setPrepNotesText(session.prepNotes || "");
    setActionItemsList(session.actionItems || []);
    setNeedsFollowupToggle(!!session.needsFollowup);
  };

  const handleSaveFollowup = () => {
    if (!followupSession) return;
    const patch: Partial<MentorSession> = {
      discussionRecap: recapText.trim() || undefined,
      prepNotes: prepNotesText.trim() || undefined,
      actionItems: actionItemsList,
      needsFollowup: needsFollowupToggle,
    };
    if (onUpdateSession) {
      onUpdateSession(followupSession.id, patch);
    }
    setFollowupSession(null);
    toast.success("Session recap and follow-up notes saved.");
  };

  const handleAddActionItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionItem.trim()) return;
    setActionItemsList([...actionItemsList, newActionItem.trim()]);
    setNewActionItem("");
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItemsList(actionItemsList.filter((_, i) => i !== index));
  };

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
      prepNotes: sessionPrepNotes.trim() || undefined,
      needsFollowup: false,
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
              Session Operations & Calendar
            </span>
          </div>
          <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
            Mentorship Sessions
          </h1>
          <p style={{ color: M.textMuted, fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>
            Conduct live video calls, review preparation notes, log discussion recaps, and agree on action items.
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
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12, overflowX: "auto" }}>
        {[
          { id: "upcoming", label: "Upcoming", count: sessions.filter((s) => s.status === "Booked").length },
          { id: "completed", label: "Completed", count: sessions.filter((s) => s.status === "Completed").length },
          { id: "followup", label: "Needs Follow-up", count: sessions.filter((s) => s.status === "Completed" && s.needsFollowup).length },
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
                whiteSpace: "nowrap",
              }}
            >
              {tab.id === "followup" && <AlertCircle size={13} color={active ? M.gold : M.amber} />}
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
            No {activeTab === "followup" ? "sessions requiring follow-up" : `${activeTab} sessions`}
          </h3>
          <p style={{ color: M.textMuted, fontSize: "0.85rem", maxWidth: 380, margin: "0 auto 18px" }}>
            {activeTab === "upcoming"
              ? "You do not have any upcoming sessions on your calendar right now."
              : activeTab === "followup"
              ? "Great job! All completed sessions have their recap notes and action items completed."
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
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {filteredSessions.map((session) => {
            const isUpcoming = session.status === "Booked";
            return (
              <div
                key={session.id}
                style={{
                  background: isUpcoming ? M.surface : M.surfaceAlt,
                  border: `1px solid ${
                    session.needsFollowup
                      ? M.amberBorder
                      : isUpcoming
                      ? M.border
                      : M.borderSubtle
                  }`,
                  borderRadius: M.radiusLg,
                  padding: "20px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: M.shadow,
                  transition: "border-color 0.16s ease",
                }}
              >
                {/* Main Session Bar */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: isCompact ? "column" : "row",
                    alignItems: isCompact ? "flex-start" : "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
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

                        {session.needsFollowup && (
                          <span
                            style={{
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "2px 8px",
                              borderRadius: M.radiusPill,
                              background: M.amberBg,
                              color: M.amber,
                              border: `1px solid ${M.amberBorder}`,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <AlertCircle size={11} /> Follow-up Required
                          </span>
                        )}
                      </div>

                      <div style={{ color: M.textMuted, fontSize: "0.85rem", marginTop: 4 }}>
                        {session.sessionType} · <strong style={{ color: M.text }}>{session.duration}</strong> · {session.price}
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 6, flexWrap: "wrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: M.gold, fontSize: "0.8rem", fontWeight: 600 }}>
                          <Clock size={13} />
                          {session.bookingDate} at {session.bookingTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8, width: isCompact ? "100%" : "auto", flexWrap: "wrap" }}>
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
                          onClick={() => handleOpenFollowupModal(session)}
                          title="View or add preparation notes"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "9px 12px",
                            borderRadius: M.radiusSm,
                            background: "rgba(255,255,255,0.06)",
                            border: `1px solid ${M.border}`,
                            color: M.text,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <FileText size={14} /> Prep Notes
                        </button>

                        <button
                          onClick={() => onSessionStatusChange(session.id, "Completed")}
                          title="Mark Completed"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "9px 12px",
                            borderRadius: M.radiusSm,
                            background: M.greenBg,
                            border: `1px solid ${M.greenBorder}`,
                            color: M.green,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          <CheckCircle2 size={14} /> Complete
                        </button>
                      </>
                    )}

                    {!isUpcoming && session.status === "Completed" && (
                      <button
                        onClick={() => handleOpenFollowupModal(session)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          borderRadius: M.radiusSm,
                          background: session.needsFollowup ? M.goldBg : "rgba(255,255,255,0.06)",
                          border: `1px solid ${session.needsFollowup ? M.goldBorder : M.border}`,
                          color: session.needsFollowup ? M.gold : M.text,
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <ListTodo size={14} />
                        {session.discussionRecap ? "Edit Recap & Items" : "Record Recap & Tasks"}
                      </button>
                    )}

                    <button
                      onClick={() => onMessageMentee(session.menteeId)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        padding: "8px 12px",
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

                {/* Preparation notes snippet (for upcoming sessions) */}
                {session.prepNotes && isUpcoming && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.02)",
                      border: `1px dashed ${M.borderSubtle}`,
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                    }}
                  >
                    <FileText size={14} color={M.gold} style={{ marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.8rem", color: M.textMuted, lineHeight: 1.4 }}>
                      <strong style={{ color: M.text }}>Session Agenda & Prep:</strong> {session.prepNotes}
                    </span>
                  </div>
                )}

                {/* Recap and Action Items snippet (for completed sessions) */}
                {!isUpcoming && (session.discussionRecap || (session.actionItems && session.actionItems.length > 0)) && (
                  <div
                    style={{
                      padding: "12px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.02)",
                      border: `1px solid ${M.borderSubtle}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {session.discussionRecap && (
                      <div style={{ fontSize: "0.82rem", color: M.textMuted, lineHeight: 1.5 }}>
                        <strong style={{ color: M.goldLight }}>Discussion Recap: </strong>
                        {session.discussionRecap}
                      </div>
                    )}

                    {session.actionItems && session.actionItems.length > 0 && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 2 }}>
                        <span style={{ fontSize: "0.74rem", color: M.textFaint, fontWeight: 700, textTransform: "uppercase" }}>
                          Agreed Action Items ({session.actionItems.length}):
                        </span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {session.actionItems.map((item, idx) => (
                            <span
                              key={idx}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "3px 8px",
                                borderRadius: M.radiusSm,
                                background: M.surface,
                                border: `1px solid ${M.borderSubtle}`,
                                fontSize: "0.76rem",
                                color: M.text,
                              }}
                            >
                              <Check size={11} color={M.green} /> {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Post-Session Follow-Up & Recap Modal ── */}
      <AnimatePresence>
        {followupSession && (
          <div
            onClick={() => setFollowupSession(null)}
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
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              style={{
                width: "100%",
                maxWidth: 620,
                background: M.surface,
                border: `1px solid ${M.goldBorder}`,
                borderRadius: M.radiusLg,
                padding: "26px 28px",
                boxShadow: M.shadowLg,
                color: M.text,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                maxHeight: "90vh",
                overflowY: "auto",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", color: M.gold, fontWeight: 700 }}>
                    Session Wrap-Up
                  </span>
                  <h3 style={{ fontFamily: M.serif, fontSize: "1.3rem", margin: "2px 0 0", color: M.text }}>
                    Summary with {followupSession.menteeName}
                  </h3>
                  <div style={{ color: M.textMuted, fontSize: "0.78rem", marginTop: 2 }}>
                    {followupSession.sessionType} · {followupSession.bookingDate}
                  </div>
                </div>
                <button onClick={() => setFollowupSession(null)} style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}>
                  <X size={18} />
                </button>
              </div>

              {/* Prep Notes */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Preparation Notes & Meeting Goals
                </label>
                <textarea
                  rows={2}
                  value={prepNotesText}
                  onChange={(e) => setPrepNotesText(e.target.value)}
                  placeholder="Notes prepared prior to the call…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.84rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Discussion Recap */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Discussion Recap & Decisions Made
                </label>
                <textarea
                  rows={4}
                  value={recapText}
                  onChange={(e) => setRecapText(e.target.value)}
                  placeholder="Summarize key takeaways, architectural decisions, and areas evaluated during this session…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.84rem",
                    lineHeight: 1.5,
                    outline: "none",
                  }}
                />
              </div>

              {/* Action Items List */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Agreed Action Items for Mentee
                </label>
                <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <input
                    type="text"
                    value={newActionItem}
                    onChange={(e) => setNewActionItem(e.target.value)}
                    placeholder="Add actionable task (e.g. Review Redis failover)…"
                    style={{
                      flex: 1,
                      padding: "8px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.84rem",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddActionItem}
                    style={{
                      padding: "8px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Add
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {actionItemsList.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "6px 10px",
                        borderRadius: M.radiusSm,
                        background: M.surfaceAlt,
                        border: `1px solid ${M.borderSubtle}`,
                        fontSize: "0.82rem",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Check size={13} color={M.green} /> {item}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(idx)}
                        style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Needs Follow-up toggle */}
              <div
                onClick={() => setNeedsFollowupToggle(!needsFollowupToggle)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "10px 12px",
                  borderRadius: M.radiusSm,
                  background: needsFollowupToggle ? "rgba(245, 158, 11, 0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${needsFollowupToggle ? M.amberBorder : M.borderSubtle}`,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: `1.5px solid ${needsFollowupToggle ? M.amber : M.border}`,
                    background: needsFollowupToggle ? M.amber : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {needsFollowupToggle && <Check size={12} color="#11101a" />}
                </div>
                <span style={{ fontSize: "0.84rem", color: needsFollowupToggle ? M.amber : M.textMuted }}>
                  Mark this session as requiring follow-up or additional written review
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={() => setFollowupSession(null)}
                  style={{
                    padding: "9px 16px",
                    borderRadius: M.radiusSm,
                    background: "none",
                    border: `1px solid ${M.border}`,
                    color: M.textMuted,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveFollowup}
                  style={{
                    padding: "9px 20px",
                    borderRadius: M.radiusSm,
                    background: M.gold,
                    border: "none",
                    color: "#11101a",
                    fontWeight: 700,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                  }}
                >
                  Save Summary & Action Items
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                >
                  {mentees.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.careerGoal || m.pathTitle})
                    </option>
                  ))}
                </select>
              </div>

              {/* Session Topic */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Session Topic / Focus
                </label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="e.g. Distributed Caching & System Architecture Deep Dive"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Date & Time */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Date
                  </label>
                  <input
                    type="text"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    placeholder="e.g. Tomorrow or Sep 28"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Time
                  </label>
                  <input
                    type="text"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    placeholder="e.g. 5:00 PM"
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Duration & Price */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  >
                    <option value="30 min">30 min (Intro / Quick Sync)</option>
                    <option value="45 min">45 min (Standard Architecture)</option>
                    <option value="60 min">60 min (Full Mock Interview)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                    Price (INR)
                  </label>
                  <input
                    type="text"
                    value={sessionPrice}
                    onChange={(e) => setSessionPrice(e.target.value)}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "10px 12px",
                      borderRadius: M.radiusSm,
                      background: M.surfaceAlt,
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Preparation Notes */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Preparation Notes / Agenda
                </label>
                <textarea
                  rows={2}
                  value={sessionPrepNotes}
                  onChange={(e) => setSessionPrepNotes(e.target.value)}
                  placeholder="Review schema design and prepare 2 mock system design problems…"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.84rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Submit Buttons */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={onCloseScheduleModal}
                  style={{
                    padding: "10px 18px",
                    borderRadius: M.radiusSm,
                    background: "none",
                    border: `1px solid ${M.border}`,
                    color: M.textMuted,
                    fontSize: "0.86rem",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={{
                    padding: "10px 22px",
                    borderRadius: M.radiusSm,
                    background: M.gold,
                    border: "none",
                    color: "#11101a",
                    fontWeight: 700,
                    fontSize: "0.86rem",
                    cursor: "pointer",
                    boxShadow: "0 2px 10px rgba(212,175,55,0.25)",
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
