import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Users,
  Search,
  MessageCircle,
  CalendarPlus,
  FileText,
  Clock,
  CheckCircle2,
  X,
  Save,
  Sparkles,
  ChevronRight,
  AlertCircle,
  Plus,
  ExternalLink,
  BookOpen,
  Award,
  Check,
  Calendar,
  Layers,
  Star,
  Target,
  Send,
  Trash2,
  Video,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type {
  Mentee,
  MenteeMilestone,
  MenteeGoal,
  MenteeFeedback,
  MenteeResource,
} from "../lib/mentorDataService";
import { saveMenteeNotes, getMenteeNotes } from "../lib/mentorDataService";
import { toast } from "sonner";

interface Props {
  mentees: Mentee[];
  initialMenteeId?: string | null;
  onClearInitialMentee?: () => void;
  onUpdateMentee?: (menteeId: string, patch: Partial<Mentee>) => void;
  onMessageMentee: (menteeId: string) => void;
  onScheduleWithMentee: (mentee: Mentee) => void;
}

export function MentorMenteesPage({
  mentees,
  initialMenteeId,
  onClearInitialMentee,
  onUpdateMentee,
  onMessageMentee,
  onScheduleWithMentee,
}: Props) {
  const { isMobile, isCompact } = useViewport();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Needs Attention" | "Completed" | "Pending">("All");
  const [sortBy, setSortBy] = useState<"recent" | "progress" | "name">("recent");

  // Deep workspace modal state
  const [workspaceMentee, setWorkspaceMentee] = useState<Mentee | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<"milestones" | "goals" | "sessions" | "feedback" | "resources" | "notes" | "timeline">("milestones");

  // Private note editing in workspace
  const [noteText, setNoteText] = useState("");

  // Goal adding form
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDate, setNewGoalDate] = useState("");

  // Feedback adding form
  const [feedbackFocus, setFeedbackFocus] = useState("System Architecture");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackContent, setFeedbackContent] = useState("");

  // Resource adding form
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);
  const [resTitle, setResTitle] = useState("");
  const [resType, setResType] = useState<"video" | "doc" | "project" | "article">("video");
  const [resUrl, setResUrl] = useState("");
  const [resAuthor, setResAuthor] = useState("");

  // Auto-open initial mentee if specified from dashboard navigation
  useEffect(() => {
    if (initialMenteeId) {
      const found = mentees.find((m) => m.id === initialMenteeId);
      if (found) {
        handleOpenWorkspace(found);
      }
      if (onClearInitialMentee) {
        onClearInitialMentee();
      }
    }
  }, [initialMenteeId, mentees, onClearInitialMentee]);

  const handleOpenWorkspace = (mentee: Mentee) => {
    setWorkspaceMentee(mentee);
    setWorkspaceTab("milestones");
    setNoteText(getMenteeNotes(mentee.id) || mentee.notes || "");
  };

  const handleSaveNotes = () => {
    if (!workspaceMentee) return;
    saveMenteeNotes(workspaceMentee.id, noteText);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, { notes: noteText });
    }
    setWorkspaceMentee({ ...workspaceMentee, notes: noteText });
    toast.success(`Notes saved for ${workspaceMentee.name}`);
  };

  // Toggle milestone completion
  const handleToggleMilestone = (milestoneId: string) => {
    if (!workspaceMentee) return;
    const updatedMilestones = workspaceMentee.allMilestones.map((ms) => {
      if (ms.id === milestoneId) {
        return { ...ms, completed: !ms.completed };
      }
      return ms;
    });

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const newProgress = Math.round((completedCount / updatedMilestones.length) * 100);
    const nextMs = updatedMilestones.find((m) => !m.completed);

    const updatedMentee: Mentee = {
      ...workspaceMentee,
      allMilestones: updatedMilestones,
      progressPercent: newProgress,
      nextMilestone: nextMs ? nextMs.title : "All Modules Completed 🎉",
    };

    setWorkspaceMentee(updatedMentee);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, {
        allMilestones: updatedMilestones,
        progressPercent: newProgress,
        nextMilestone: updatedMentee.nextMilestone,
      });
    }
    toast.success("Milestone progress updated.");
  };

  // Toggle goal completion
  const handleToggleGoal = (goalId: string) => {
    if (!workspaceMentee) return;
    const updatedGoals = workspaceMentee.goals.map((g) =>
      g.id === goalId ? { ...g, completed: !g.completed } : g
    );
    const updatedMentee = { ...workspaceMentee, goals: updatedGoals };
    setWorkspaceMentee(updatedMentee);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, { goals: updatedGoals });
    }
    toast.success("Goal status updated.");
  };

  // Add new goal
  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceMentee || !newGoalTitle.trim()) return;
    const newGoal: MenteeGoal = {
      id: `g_${Date.now()}`,
      title: newGoalTitle.trim(),
      completed: false,
      targetDate: newGoalDate.trim() || undefined,
    };
    const updatedGoals = [...workspaceMentee.goals, newGoal];
    const updatedMentee = { ...workspaceMentee, goals: updatedGoals };
    setWorkspaceMentee(updatedMentee);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, { goals: updatedGoals });
    }
    setNewGoalTitle("");
    setNewGoalDate("");
    toast.success(`Assigned goal to ${workspaceMentee.name}`);
  };

  // Log feedback
  const handleLogFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceMentee || !feedbackContent.trim()) return;
    const newFb: MenteeFeedback = {
      id: `fb_${Date.now()}`,
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      content: feedbackContent.trim(),
      focus: feedbackFocus,
      rating: feedbackRating,
    };
    const updatedFeedback = [newFb, ...workspaceMentee.feedbackHistory];
    const updatedMentee = { ...workspaceMentee, feedbackHistory: updatedFeedback };
    setWorkspaceMentee(updatedMentee);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, { feedbackHistory: updatedFeedback });
    }
    setFeedbackContent("");
    toast.success(`Logged structured feedback for ${workspaceMentee.name}`);
  };

  // Add recommended resource
  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceMentee || !resTitle.trim() || !resUrl.trim()) return;
    const newRes: MenteeResource = {
      id: `res_${Date.now()}`,
      title: resTitle.trim(),
      type: resType,
      url: resUrl.trim(),
      channelOrAuthor: resAuthor.trim() || undefined,
      addedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    };
    const updatedRes = [newRes, ...workspaceMentee.recommendedResources];
    const updatedMentee = { ...workspaceMentee, recommendedResources: updatedRes };
    setWorkspaceMentee(updatedMentee);
    if (onUpdateMentee) {
      onUpdateMentee(workspaceMentee.id, { recommendedResources: updatedRes });
    }
    setShowAddResourceModal(false);
    setResTitle("");
    setResUrl("");
    setResAuthor("");
    toast.success(`Recommended "${newRes.title}" to ${workspaceMentee.name}`);
  };

  // Filter and sort mentees
  const filteredMentees = useMemo(() => {
    return mentees
      .filter((m) => {
        const matchesSearch =
          m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (m.careerGoal && m.careerGoal.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (m.pathTitle && m.pathTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase());

        let matchesStatus = true;
        if (statusFilter === "Needs Attention") {
          matchesStatus = !!m.needsAttention;
        } else if (statusFilter !== "All") {
          matchesStatus = m.status === statusFilter;
        }

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === "progress") {
          return b.progressPercent - a.progressPercent;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        // Default "recent": mentees needing attention or with upcoming sessions first
        if (a.needsAttention && !b.needsAttention) return -1;
        if (!a.needsAttention && b.needsAttention) return 1;
        return 0;
      });
  }, [mentees, searchQuery, statusFilter, sortBy]);

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
              Mentee Management Center
            </span>
          </div>
          <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
            My Mentees
          </h1>
          <p style={{ color: M.textMuted, fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>
            Track learning roadmaps, inspect milestone progress, assign goals, and share curated knowledge.
          </p>
        </div>

        {/* Controls: Search and Sort */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, width: isCompact ? "100%" : "auto", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: 260, flex: 1 }}>
            <Search
              size={16}
              color={M.textFaint}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, track, or goal…"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px 10px 38px",
                background: M.surface,
                border: `1px solid ${M.border}`,
                borderRadius: M.radiusSm,
                color: M.text,
                fontSize: "0.86rem",
                fontFamily: M.sans,
                outline: "none",
              }}
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: "10px 14px",
              borderRadius: M.radiusSm,
              background: M.surface,
              border: `1px solid ${M.border}`,
              color: M.textMuted,
              fontSize: "0.84rem",
              fontFamily: M.sans,
              outline: "none",
              cursor: "pointer",
            }}
          >
            <option value="recent">Sort: Priority & Recent</option>
            <option value="progress">Sort: Progress % (High to Low)</option>
            <option value="name">Sort: Alphabetical (A-Z)</option>
          </select>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12, overflowX: "auto" }}>
        {(["All", "Active", "Needs Attention", "Pending", "Completed"] as const).map((filter) => {
          const active = statusFilter === filter;
          let count = 0;
          if (filter === "All") count = mentees.length;
          else if (filter === "Needs Attention") count = mentees.filter((m) => m.needsAttention).length;
          else count = mentees.filter((m) => m.status === filter).length;

          return (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              style={{
                padding: "6px 14px",
                borderRadius: M.radiusPill,
                background: active ? M.goldBg : "transparent",
                border: `1px solid ${active ? M.goldBorder : "transparent"}`,
                color: active ? M.gold : M.textMuted,
                fontSize: "0.82rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: M.sans,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.16s ease",
                whiteSpace: "nowrap",
              }}
            >
              {filter === "Needs Attention" && <AlertCircle size={13} color={active ? M.gold : M.amber} />}
              {filter}
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Mentees Grid ── */}
      {filteredMentees.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "54px 20px",
            background: M.surface,
            border: `1px dashed ${M.border}`,
            borderRadius: M.radiusLg,
          }}
        >
          <Users size={36} color={M.textFaint} style={{ marginBottom: 14 }} />
          <h3 style={{ fontSize: "1.05rem", color: M.text, margin: "0 0 6px" }}>No mentees found</h3>
          <p style={{ color: M.textMuted, fontSize: "0.85rem", maxWidth: 360, margin: "0 auto 16px" }}>
            {searchQuery ? `No mentees matched "${searchQuery}".` : "You do not have any mentees under this filter yet."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${M.border}`,
                borderRadius: M.radiusSm,
                color: M.text,
                padding: "8px 16px",
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile
              ? "1fr"
              : isCompact
              ? "repeat(2, 1fr)"
              : "repeat(3, 1fr)",
            gap: 18,
          }}
        >
          {filteredMentees.map((mentee) => (
            <div
              key={mentee.id}
              style={{
                background: M.surface,
                border: `1px solid ${mentee.needsAttention ? M.goldBorder : M.border}`,
                borderRadius: M.radiusLg,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: M.shadow,
                transition: "border-color 0.16s ease, transform 0.16s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = M.goldBorder;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = mentee.needsAttention ? M.goldBorder : M.border;
                e.currentTarget.style.transform = "none";
              }}
            >
              {/* Mentee Header */}
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "50%",
                        background: M.goldBg,
                        border: `1px solid ${M.goldBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.98rem",
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

                    <div>
                      <h3 style={{ fontSize: "1rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        {mentee.name}
                      </h3>
                      <div style={{ color: M.textMuted, fontSize: "0.78rem", marginTop: 2 }}>
                        {mentee.email}
                      </div>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "3px 8px",
                      borderRadius: M.radiusPill,
                      background:
                        mentee.status === "Active"
                          ? M.greenBg
                          : mentee.status === "Pending"
                          ? M.amberBg
                          : "rgba(255,255,255,0.06)",
                      color:
                        mentee.status === "Active"
                          ? M.green
                          : mentee.status === "Pending"
                          ? M.amber
                          : M.textFaint,
                      border: `1px solid ${
                        mentee.status === "Active"
                          ? M.greenBorder
                          : mentee.status === "Pending"
                          ? M.amberBorder
                          : M.border
                      }`,
                    }}
                  >
                    {mentee.status}
                  </span>
                </div>

                {/* Attention pill if present */}
                {mentee.needsAttention && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: "7px 10px",
                      borderRadius: M.radiusSm,
                      background: "rgba(212,175,55,0.08)",
                      border: `1px solid ${M.goldBorder}`,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: "0.75rem",
                      color: M.gold,
                    }}
                  >
                    <AlertCircle size={13} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {mentee.attentionReason || "Milestone submission pending review"}
                    </span>
                  </div>
                )}

                {/* Skill Growth Path & Progress Bar */}
                <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: "0.72rem", color: M.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Growth Path
                    </span>
                    <strong style={{ fontSize: "0.82rem", color: M.gold }}>
                      {mentee.progressPercent}%
                    </strong>
                  </div>
                  <div style={{ fontSize: "0.86rem", fontWeight: 600, color: M.text, marginBottom: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {mentee.pathTitle || mentee.careerGoal || "Software Architecture"}
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: "100%", height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${mentee.progressPercent}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${M.gold} 0%, ${M.goldLight} 100%)`,
                        borderRadius: 999,
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 8, fontSize: "0.74rem", color: M.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
                    <Target size={12} color={M.gold} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      Next: {mentee.nextMilestone}
                    </span>
                  </div>
                </div>

                {/* Session count & hours */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  <div style={{ padding: "8px 10px", borderRadius: M.radiusSm, background: "rgba(255,255,255,0.02)", border: `1px solid ${M.borderSubtle}` }}>
                    <div style={{ fontSize: "0.7rem", color: M.textFaint }}>Sessions</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
                      {mentee.totalSessions} completed
                    </div>
                  </div>

                  <div style={{ padding: "8px 10px", borderRadius: M.radiusSm, background: "rgba(255,255,255,0.02)", border: `1px solid ${M.borderSubtle}` }}>
                    <div style={{ fontSize: "0.7rem", color: M.textFaint }}>Coached Time</div>
                    <div style={{ fontSize: "0.88rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
                      {mentee.totalHours} hrs
                    </div>
                  </div>
                </div>

                {mentee.nextSessionDate && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: M.gold, fontSize: "0.78rem" }}>
                    <Clock size={12} />
                    <span>Next: {mentee.nextSessionDate}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 12, borderTop: `1px solid ${M.borderSubtle}` }}>
                <button
                  onClick={() => handleOpenWorkspace(mentee)}
                  style={{
                    flex: 1.2,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: M.radiusSm,
                    background: M.goldBg,
                    border: `1px solid ${M.goldBorder}`,
                    color: M.gold,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: M.sans,
                  }}
                >
                  <BookOpen size={14} />
                  Workspace
                </button>

                <button
                  onClick={() => onMessageMentee(mentee.id)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "8px 10px",
                    borderRadius: M.radiusSm,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: M.sans,
                  }}
                >
                  <MessageCircle size={14} />
                  Message
                </button>

                <button
                  onClick={() => onScheduleWithMentee(mentee)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 5,
                    padding: "8px 10px",
                    borderRadius: M.radiusSm,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: M.sans,
                  }}
                >
                  <CalendarPlus size={14} />
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Comprehensive Mentee Workspace Modal / Drawer ── */}
      <AnimatePresence>
        {workspaceMentee && (
          <div
            onClick={() => setWorkspaceMentee(null)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(6px)",
              zIndex: 140,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isMobile ? 12 : 24,
            }}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              style={{
                width: "100%",
                maxWidth: 880,
                maxHeight: "90vh",
                background: M.surface,
                border: `1px solid ${M.goldBorder}`,
                borderRadius: M.radiusLg,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                boxShadow: M.shadowLg,
              }}
            >
              {/* Workspace Header */}
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: `1px solid ${M.border}`,
                  background: M.surfaceAlt,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: "50%",
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: M.gold,
                      flexShrink: 0,
                    }}
                  >
                    {workspaceMentee.name
                      .split(" ")
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join("")}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <h2 style={{ fontFamily: M.serif, fontSize: "1.3rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        {workspaceMentee.name}
                      </h2>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: M.radiusPill,
                          background: M.goldBg,
                          color: M.gold,
                          fontWeight: 700,
                        }}
                      >
                        {workspaceMentee.status}
                      </span>
                    </div>
                    <div style={{ color: M.goldLight, fontSize: "0.82rem", marginTop: 2 }}>
                      {workspaceMentee.pathTitle} · {workspaceMentee.email}
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button
                    onClick={() => {
                      onMessageMentee(workspaceMentee.id);
                      setWorkspaceMentee(null);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: M.radiusSm,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <MessageCircle size={14} /> Message
                  </button>

                  <button
                    onClick={() => {
                      onScheduleWithMentee(workspaceMentee);
                      setWorkspaceMentee(null);
                    }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: M.radiusSm,
                      background: M.gold,
                      border: "none",
                      color: "#11101a",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <CalendarPlus size={14} /> Schedule
                  </button>

                  <button
                    onClick={() => setWorkspaceMentee(null)}
                    style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer", padding: 4 }}
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Workspace Navigation Subtabs */}
              <div
                style={{
                  display: "flex",
                  gap: 4,
                  padding: "0 20px",
                  background: M.surface,
                  borderBottom: `1px solid ${M.border}`,
                  overflowX: "auto",
                  flexShrink: 0,
                }}
              >
                {[
                  { id: "milestones", label: "Skill Roadmap", icon: Layers, count: `${workspaceMentee.progressPercent}%` },
                  { id: "goals", label: "Assigned Goals", icon: Target, count: workspaceMentee.goals.length },
                  { id: "feedback", label: "Feedback History", icon: Award, count: workspaceMentee.feedbackHistory.length },
                  { id: "resources", label: "Curated Resources", icon: BookOpen, count: workspaceMentee.recommendedResources.length },
                  { id: "notes", label: "Private Notes", icon: FileText },
                  { id: "timeline", label: "Timeline", icon: Clock },
                ].map((tab) => {
                  const active = workspaceTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setWorkspaceTab(tab.id as any)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "12px 14px",
                        border: "none",
                        background: "none",
                        borderBottom: `2px solid ${active ? M.gold : "transparent"}`,
                        color: active ? M.gold : M.textMuted,
                        fontSize: "0.84rem",
                        fontWeight: active ? 700 : 500,
                        cursor: "pointer",
                        fontFamily: M.sans,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Icon size={15} />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span
                          style={{
                            fontSize: "0.7rem",
                            padding: "1px 6px",
                            borderRadius: 999,
                            background: active ? M.goldBg : "rgba(255,255,255,0.06)",
                            color: active ? M.gold : M.textFaint,
                            fontWeight: 700,
                          }}
                        >
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Workspace Content Pane */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px 26px" }}>
                {/* 1. Skill Growth Path & Milestones */}
                {workspaceTab === "milestones" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                          5-Module Skill Growth Path
                        </h3>
                        <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                          Check off completed modules as your mentee demonstrates proficiency.
                        </p>
                      </div>
                      <div style={{ fontSize: "0.92rem", fontWeight: 700, color: M.gold }}>
                        {workspaceMentee.progressPercent}% Mastered
                      </div>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {workspaceMentee.allMilestones.map((ms, idx) => (
                        <div
                          key={ms.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "14px 16px",
                            borderRadius: M.radius,
                            background: ms.completed
                              ? "rgba(16, 185, 129, 0.05)"
                              : ms.current
                              ? "rgba(212, 175, 55, 0.06)"
                              : M.surfaceAlt,
                            border: `1px solid ${
                              ms.completed
                                ? M.greenBorder
                                : ms.current
                                ? M.goldBorder
                                : M.borderSubtle
                            }`,
                            gap: 12,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button
                              onClick={() => handleToggleMilestone(ms.id)}
                              style={{
                                width: 24,
                                height: 24,
                                borderRadius: 6,
                                border: `1.5px solid ${ms.completed ? M.green : M.border}`,
                                background: ms.completed ? M.green : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                flexShrink: 0,
                              }}
                            >
                              {ms.completed && <Check size={14} color="#11101a" />}
                            </button>

                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span
                                  style={{
                                    fontSize: "0.9rem",
                                    fontWeight: 600,
                                    color: ms.completed ? M.text : M.text,
                                    textDecoration: ms.completed ? "line-through" : "none",
                                    opacity: ms.completed ? 0.7 : 1,
                                  }}
                                >
                                  {ms.title}
                                </span>
                                {ms.current && !ms.completed && (
                                  <span
                                    style={{
                                      fontSize: "0.68rem",
                                      fontWeight: 700,
                                      padding: "2px 6px",
                                      borderRadius: M.radiusPill,
                                      background: M.goldBg,
                                      color: M.gold,
                                      textTransform: "uppercase",
                                    }}
                                  >
                                    In Progress
                                  </span>
                                )}
                              </div>
                              <span style={{ fontSize: "0.74rem", color: M.textFaint }}>
                                Stage {idx + 1} of {workspaceMentee.allMilestones.length}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleMilestone(ms.id)}
                            style={{
                              padding: "6px 12px",
                              borderRadius: M.radiusSm,
                              background: ms.completed ? "rgba(255,255,255,0.04)" : M.goldBg,
                              border: `1px solid ${ms.completed ? M.border : M.goldBorder}`,
                              color: ms.completed ? M.textMuted : M.gold,
                              fontSize: "0.76rem",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            {ms.completed ? "Mark Incomplete" : "Mark Completed"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Assigned Goals */}
                {workspaceTab === "goals" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        Actionable Goals & Homework
                      </h3>
                      <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                        Assign specific technical deliverables for {workspaceMentee.name} to complete between sessions.
                      </p>
                    </div>

                    {/* New Goal Input Form */}
                    <form onSubmit={handleAddGoal} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <input
                        type="text"
                        value={newGoalTitle}
                        onChange={(e) => setNewGoalTitle(e.target.value)}
                        placeholder="Assign deliverable (e.g. Implement Redis Cache Layer)…"
                        style={{
                          flex: 1,
                          minWidth: 240,
                          padding: "10px 14px",
                          borderRadius: M.radiusSm,
                          background: M.surfaceAlt,
                          border: `1px solid ${M.border}`,
                          color: M.text,
                          fontSize: "0.86rem",
                          outline: "none",
                        }}
                      />
                      <input
                        type="text"
                        value={newGoalDate}
                        onChange={(e) => setNewGoalDate(e.target.value)}
                        placeholder="Target date (e.g. Oct 5)"
                        style={{
                          width: 150,
                          padding: "10px 14px",
                          borderRadius: M.radiusSm,
                          background: M.surfaceAlt,
                          border: `1px solid ${M.border}`,
                          color: M.text,
                          fontSize: "0.86rem",
                          outline: "none",
                        }}
                      />
                      <button
                        type="submit"
                        disabled={!newGoalTitle.trim()}
                        style={{
                          padding: "10px 18px",
                          borderRadius: M.radiusSm,
                          background: newGoalTitle.trim() ? M.gold : "rgba(255,255,255,0.06)",
                          border: "none",
                          color: newGoalTitle.trim() ? "#11101a" : M.textFaint,
                          fontWeight: 700,
                          fontSize: "0.84rem",
                          cursor: newGoalTitle.trim() ? "pointer" : "default",
                        }}
                      >
                        Assign Goal
                      </button>
                    </form>

                    {/* Goals Checklist */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {workspaceMentee.goals.map((goal) => (
                        <div
                          key={goal.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderRadius: M.radiusSm,
                            background: goal.completed ? "rgba(16, 185, 129, 0.04)" : M.surfaceAlt,
                            border: `1px solid ${goal.completed ? M.greenBorder : M.borderSubtle}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <button
                              onClick={() => handleToggleGoal(goal.id)}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 5,
                                border: `1.5px solid ${goal.completed ? M.green : M.border}`,
                                background: goal.completed ? M.green : "transparent",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                              }}
                            >
                              {goal.completed && <Check size={13} color="#11101a" />}
                            </button>
                            <div>
                              <div
                                style={{
                                  fontSize: "0.88rem",
                                  color: M.text,
                                  fontWeight: 500,
                                  textDecoration: goal.completed ? "line-through" : "none",
                                  opacity: goal.completed ? 0.65 : 1,
                                }}
                              >
                                {goal.title}
                              </div>
                              {goal.targetDate && (
                                <div style={{ fontSize: "0.72rem", color: M.goldLight, marginTop: 2 }}>
                                  Target: {goal.targetDate}
                                </div>
                              )}
                            </div>
                          </div>

                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              color: goal.completed ? M.green : M.textFaint,
                            }}
                          >
                            {goal.completed ? "Completed" : "In Progress"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Feedback History & Form */}
                {workspaceTab === "feedback" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        Structured Coaching Feedback
                      </h3>
                      <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                        Log actionable feedback after mock interviews and design walkthroughs.
                      </p>
                    </div>

                    {/* Log New Feedback Form */}
                    <form
                      onSubmit={handleLogFeedback}
                      style={{
                        background: M.surfaceAlt,
                        border: `1px solid ${M.border}`,
                        borderRadius: M.radius,
                        padding: "18px 20px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 14,
                      }}
                    >
                      <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <label style={{ fontSize: "0.76rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                            Focus Area
                          </label>
                          <select
                            value={feedbackFocus}
                            onChange={(e) => setFeedbackFocus(e.target.value)}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.border}`,
                              color: M.text,
                              fontSize: "0.84rem",
                              outline: "none",
                            }}
                          >
                            <option value="System Architecture">System Architecture</option>
                            <option value="Frontend Architecture">Frontend Architecture</option>
                            <option value="Database Design & Tuning">Database Design & Tuning</option>
                            <option value="Machine Learning & PyTorch">Machine Learning & PyTorch</option>
                            <option value="SRE & Cloud Infrastructure">SRE & Cloud Infrastructure</option>
                            <option value="Interview Communication">Interview Communication</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: "0.76rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                            Rating (1 to 5)
                          </label>
                          <div style={{ display: "flex", gap: 6 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFeedbackRating(star)}
                                style={{
                                  padding: "7px 10px",
                                  borderRadius: M.radiusSm,
                                  background: feedbackRating >= star ? M.goldBg : "rgba(255,255,255,0.04)",
                                  border: `1px solid ${feedbackRating >= star ? M.goldBorder : M.border}`,
                                  color: feedbackRating >= star ? M.gold : M.textFaint,
                                  cursor: "pointer",
                                  fontSize: "0.82rem",
                                  fontWeight: 700,
                                }}
                              >
                                {star} ★
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: "0.76rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                          Written Coaching Notes & Actionable Advice
                        </label>
                        <textarea
                          rows={3}
                          value={feedbackContent}
                          onChange={(e) => setFeedbackContent(e.target.value)}
                          placeholder="Provide specific, high-signal recommendations for improvement…"
                          style={{
                            width: "100%",
                            boxSizing: "border-box",
                            padding: "10px 12px",
                            borderRadius: M.radiusSm,
                            background: M.surface,
                            border: `1px solid ${M.border}`,
                            color: M.text,
                            fontSize: "0.84rem",
                            lineHeight: 1.5,
                            outline: "none",
                            resize: "vertical",
                          }}
                        />
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <button
                          type="submit"
                          disabled={!feedbackContent.trim()}
                          style={{
                            padding: "8px 18px",
                            borderRadius: M.radiusSm,
                            background: feedbackContent.trim() ? M.gold : "rgba(255,255,255,0.06)",
                            border: "none",
                            color: feedbackContent.trim() ? "#11101a" : M.textFaint,
                            fontWeight: 700,
                            fontSize: "0.82rem",
                            cursor: feedbackContent.trim() ? "pointer" : "default",
                          }}
                        >
                          Log Feedback
                        </button>
                      </div>
                    </form>

                    {/* Feedback History Cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {workspaceMentee.feedbackHistory.map((fb) => (
                        <div
                          key={fb.id}
                          style={{
                            background: M.surfaceAlt,
                            border: `1px solid ${M.borderSubtle}`,
                            borderRadius: M.radius,
                            padding: "14px 18px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.88rem", color: M.text }}>
                                {fb.focus}
                              </span>
                              {fb.rating && (
                                <span style={{ color: M.gold, fontSize: "0.78rem" }}>
                                  {"★".repeat(fb.rating)}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: "0.74rem", color: M.textFaint }}>{fb.date}</span>
                          </div>
                          <p style={{ color: M.textMuted, fontSize: "0.84rem", margin: 0, lineHeight: 1.5 }}>
                            {fb.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Curated Resources */}
                {workspaceTab === "resources" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                          Curated Learning Resources
                        </h3>
                        <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                          High-quality articles, videos, and documentation recommended to {workspaceMentee.name}.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddResourceModal(true)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "8px 14px",
                          borderRadius: M.radiusSm,
                          background: M.gold,
                          border: "none",
                          color: "#11101a",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <Plus size={14} /> Recommend Resource
                      </button>
                    </div>

                    {showAddResourceModal && (
                      <form
                        onSubmit={handleAddResource}
                        style={{
                          background: M.surfaceAlt,
                          border: `1px solid ${M.goldBorder}`,
                          borderRadius: M.radius,
                          padding: "16px 18px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 12,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: "0.88rem", color: M.gold }}>
                          Add Resource Link
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <input
                            type="text"
                            value={resTitle}
                            onChange={(e) => setResTitle(e.target.value)}
                            placeholder="Resource title (e.g. Distributed Consensus Explained)…"
                            style={{
                              padding: "8px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.border}`,
                              color: M.text,
                              fontSize: "0.84rem",
                              outline: "none",
                            }}
                          />
                          <select
                            value={resType}
                            onChange={(e) => setResType(e.target.value as any)}
                            style={{
                              padding: "8px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.border}`,
                              color: M.text,
                              fontSize: "0.84rem",
                              outline: "none",
                            }}
                          >
                            <option value="video">Video Tutorial</option>
                            <option value="doc">Technical Document / Whitepaper</option>
                            <option value="project">Interactive Project / Repo</option>
                            <option value="article">Deep-Dive Article</option>
                          </select>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 10 }}>
                          <input
                            type="url"
                            value={resUrl}
                            onChange={(e) => setResUrl(e.target.value)}
                            placeholder="URL (https://…)"
                            style={{
                              padding: "8px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.border}`,
                              color: M.text,
                              fontSize: "0.84rem",
                              outline: "none",
                            }}
                          />
                          <input
                            type="text"
                            value={resAuthor}
                            onChange={(e) => setResAuthor(e.target.value)}
                            placeholder="Author / Channel name (optional)"
                            style={{
                              padding: "8px 12px",
                              borderRadius: M.radiusSm,
                              background: M.surface,
                              border: `1px solid ${M.border}`,
                              color: M.text,
                              fontSize: "0.84rem",
                              outline: "none",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          <button
                            type="button"
                            onClick={() => setShowAddResourceModal(false)}
                            style={{
                              padding: "7px 14px",
                              borderRadius: M.radiusSm,
                              background: "none",
                              border: `1px solid ${M.border}`,
                              color: M.textMuted,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            style={{
                              padding: "7px 16px",
                              borderRadius: M.radiusSm,
                              background: M.gold,
                              border: "none",
                              color: "#11101a",
                              fontWeight: 700,
                              fontSize: "0.8rem",
                              cursor: "pointer",
                            }}
                          >
                            Add to Mentee
                          </button>
                        </div>
                      </form>
                    )}

                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {workspaceMentee.recommendedResources.map((res) => (
                        <div
                          key={res.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 16px",
                            borderRadius: M.radiusSm,
                            background: M.surfaceAlt,
                            border: `1px solid ${M.borderSubtle}`,
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ fontWeight: 600, fontSize: "0.88rem", color: M.text }}>
                                {res.title}
                              </span>
                              <span
                                style={{
                                  fontSize: "0.68rem",
                                  padding: "2px 6px",
                                  borderRadius: M.radiusPill,
                                  background: M.goldBg,
                                  color: M.gold,
                                  textTransform: "uppercase",
                                }}
                              >
                                {res.type}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.74rem", color: M.textFaint, marginTop: 3 }}>
                              {res.channelOrAuthor ? `By ${res.channelOrAuthor} · ` : ""}Added {res.addedAt}
                            </div>
                          </div>

                          <a
                            href={res.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "6px 12px",
                              borderRadius: M.radiusSm,
                              background: "rgba(255,255,255,0.06)",
                              border: `1px solid ${M.border}`,
                              color: M.gold,
                              fontSize: "0.78rem",
                              textDecoration: "none",
                              fontWeight: 600,
                            }}
                          >
                            Open Link <ExternalLink size={12} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Private Mentor Notes */}
                {workspaceTab === "notes" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        Private Mentor Notes
                      </h3>
                      <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                        These coaching notes are 100% private to you and never visible to the student.
                      </p>
                    </div>

                    <textarea
                      rows={8}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Record mentee strengths, blindspots, career goals, or interview prep focus areas…"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "14px 16px",
                        borderRadius: M.radius,
                        background: M.surfaceAlt,
                        border: `1px solid ${M.border}`,
                        color: M.text,
                        fontSize: "0.88rem",
                        lineHeight: 1.6,
                        fontFamily: M.sans,
                        outline: "none",
                        resize: "vertical",
                      }}
                    />

                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                      <button
                        onClick={handleSaveNotes}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "10px 20px",
                          borderRadius: M.radiusSm,
                          background: M.gold,
                          border: "none",
                          color: "#11101a",
                          fontWeight: 700,
                          fontSize: "0.84rem",
                          cursor: "pointer",
                        }}
                      >
                        <Save size={15} /> Save Private Notes
                      </button>
                    </div>
                  </div>
                )}

                {/* 6. Chronological Progress Timeline */}
                {workspaceTab === "timeline" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                        Mentorship Journey Timeline
                      </h3>
                      <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                        Historical record of milestones, completed sessions, and key check-ins.
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14, position: "relative", paddingLeft: 18 }}>
                      <div
                        style={{
                          position: "absolute",
                          left: 6,
                          top: 8,
                          bottom: 8,
                          width: 2,
                          background: M.borderSubtle,
                        }}
                      />

                      {workspaceMentee.timeline.map((event) => (
                        <div key={event.id} style={{ position: "relative" }}>
                          <div
                            style={{
                              position: "absolute",
                              left: -18,
                              top: 4,
                              width: 10,
                              height: 10,
                              borderRadius: "50%",
                              background: event.type === "milestone" ? M.green : M.gold,
                              border: `2px solid ${M.surface}`,
                            }}
                          />
                          <div
                            style={{
                              background: M.surfaceAlt,
                              border: `1px solid ${M.borderSubtle}`,
                              borderRadius: M.radiusSm,
                              padding: "12px 14px",
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontWeight: 700, fontSize: "0.86rem", color: M.text }}>
                                {event.title}
                              </span>
                              <span style={{ fontSize: "0.72rem", color: M.goldLight }}>
                                {event.date}
                              </span>
                            </div>
                            <p style={{ color: M.textMuted, fontSize: "0.8rem", margin: 0, lineHeight: 1.4 }}>
                              {event.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
