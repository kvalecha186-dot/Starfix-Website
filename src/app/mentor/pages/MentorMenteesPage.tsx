import { useState, useMemo } from "react";
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
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type { Mentee } from "../lib/mentorDataService";
import { saveMenteeNotes, getMenteeNotes } from "../lib/mentorDataService";
import { toast } from "sonner";

interface Props {
  mentees: Mentee[];
  onMessageMentee: (menteeId: string) => void;
  onScheduleWithMentee: (mentee: Mentee) => void;
}

export function MentorMenteesPage({
  mentees,
  onMessageMentee,
  onScheduleWithMentee,
}: Props) {
  const { isMobile, isCompact } = useViewport();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Completed" | "Pending">("All");
  const [selectedNotesMentee, setSelectedNotesMentee] = useState<Mentee | null>(null);
  const [currentNoteText, setCurrentNoteText] = useState("");

  const filteredMentees = useMemo(() => {
    return mentees.filter((m) => {
      const matchesSearch =
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.careerGoal && m.careerGoal.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || m.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [mentees, searchQuery, statusFilter]);

  const handleOpenNotes = (mentee: Mentee) => {
    setSelectedNotesMentee(mentee);
    setCurrentNoteText(getMenteeNotes(mentee.id) || mentee.notes || "");
  };

  const handleSaveNotes = () => {
    if (!selectedNotesMentee) return;
    saveMenteeNotes(selectedNotesMentee.id, currentNoteText);
    selectedNotesMentee.notes = currentNoteText;
    toast.success(`Notes saved for ${selectedNotesMentee.name}`);
    setSelectedNotesMentee(null);
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
              Learner Directory
            </span>
          </div>
          <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
            My Mentees
          </h1>
          <p style={{ color: M.textMuted, fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>
            Manage active learners, track session history, and maintain private coaching notes.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ position: "relative", width: isCompact ? "100%" : 320 }}>
          <Search
            size={16}
            color={M.textFaint}
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentees by name or track…"
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
      </div>

      {/* ── Status Filter Tabs ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12, overflowX: "auto" }}>
        {(["All", "Active", "Pending", "Completed"] as const).map((filter) => {
          const active = statusFilter === filter;
          const count = filter === "All" ? mentees.length : mentees.filter((m) => m.status === filter).length;
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
              }}
            >
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
                border: `1px solid ${M.border}`,
                borderRadius: M.radius,
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                gap: 16,
                boxShadow: M.shadow,
                transition: "border-color 0.16s ease, transform 0.16s ease",
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
              {/* Mentee Header */}
              <div>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: M.goldBg,
                        border: `1px solid ${M.goldBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: "0.95rem",
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
                      <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: M.text, margin: 0 }}>
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

                {/* Track and stats */}
                <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.borderSubtle}` }}>
                  <div style={{ fontSize: "0.74rem", color: M.textFaint, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Goal Focus
                  </div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: M.goldLight, marginTop: 2 }}>
                    {mentee.careerGoal || "General Mentorship"}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
                  <div style={{ padding: "8px 10px", borderRadius: M.radiusSm, background: "rgba(255,255,255,0.02)", border: `1px solid ${M.borderSubtle}` }}>
                    <div style={{ fontSize: "0.7rem", color: M.textFaint }}>Sessions</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
                      {mentee.totalSessions} completed
                    </div>
                  </div>

                  <div style={{ padding: "8px 10px", borderRadius: M.radiusSm, background: "rgba(255,255,255,0.02)", border: `1px solid ${M.borderSubtle}` }}>
                    <div style={{ fontSize: "0.7rem", color: M.textFaint }}>Total Time</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: M.text, marginTop: 2 }}>
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
                  onClick={() => onMessageMentee(mentee.id)}
                  style={{
                    flex: 1,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: M.radiusSm,
                    background: M.goldBg,
                    border: `1px solid ${M.goldBorder}`,
                    color: M.gold,
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
                    gap: 6,
                    padding: "8px 12px",
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

                <button
                  onClick={() => handleOpenNotes(mentee)}
                  title="Private Mentor Notes"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: M.radiusSm,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${M.border}`,
                    color: mentee.notes ? M.gold : M.textMuted,
                    cursor: "pointer",
                  }}
                >
                  <FileText size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Private Mentor Notes Modal ── */}
      {selectedNotesMentee && (
        <div
          onClick={() => setSelectedNotesMentee(null)}
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
              padding: "26px 28px",
              boxShadow: M.shadowLg,
              color: M.text,
              fontFamily: M.sans,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.06em", color: M.gold, fontWeight: 700 }}>
                  Confidential Coaching Notes
                </span>
                <h3 style={{ fontFamily: M.serif, fontSize: "1.3rem", color: M.text, margin: "4px 0 0" }}>
                  {selectedNotesMentee.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotesMentee(null)}
                style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ color: M.textMuted, fontSize: "0.84rem", marginBottom: 14 }}>
              These private notes are visible ONLY to you as the mentor. Use them to track progress, curriculum goals, and action items.
            </p>

            <textarea
              value={currentNoteText}
              onChange={(e) => setCurrentNoteText(e.target.value)}
              placeholder="e.g. Needs practice with distributed caching. Recommended DDIA Chapters 5 & 6. Next review scheduled for Thursday..."
              rows={6}
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "12px 14px",
                borderRadius: M.radiusSm,
                background: M.surfaceAlt,
                border: `1px solid ${M.border}`,
                color: M.text,
                fontSize: "0.88rem",
                fontFamily: M.sans,
                lineHeight: 1.5,
                outline: "none",
                resize: "vertical",
              }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setSelectedNotesMentee(null)}
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
                onClick={handleSaveNotes}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "9px 20px",
                  borderRadius: M.radiusSm,
                  background: M.gold,
                  border: "none",
                  color: "#11101a",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Save size={15} /> Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
