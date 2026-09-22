import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  Sliders,
  LogOut,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { M } from "./mentorColors";
import { useViewport } from "../lib/useViewport";
import { MentorAvatar } from "./MentorAvatar";
import type { UserProfile } from "../types";
import {
  fetchMentorData,
  updateMentorProfileInDb,
  updateSessionStatusInDb,
  saveProfileExtras,
  type MentorProfileData,
  type Mentee,
  type MentorSession,
  type MentorReview,
  type MentorEarnings,
} from "./lib/mentorDataService";
import { MentorDashboardHome } from "./pages/MentorDashboardHome";
import { MentorMenteesPage } from "./pages/MentorMenteesPage";
import { MentorSessionsPage } from "./pages/MentorSessionsPage";
import { MentorMessagesPage } from "./pages/MentorMessagesPage";
import { MentorProfilePage } from "./pages/MentorProfilePage";
import { toast } from "sonner";

export type MentorTab = "dashboard" | "mentees" | "sessions" | "messages" | "profile";

const NAV_ITEMS: { id: MentorTab; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "mentees", label: "My Mentees", icon: Users },
  { id: "sessions", label: "Sessions", icon: Calendar },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "profile", label: "Profile & Availability", icon: Sliders },
];

interface Props {
  userProfile?: UserProfile | null;
  onLogout: () => void;
  onUpdateProfile?: (patch: Partial<UserProfile>) => void;
}

export function MentorLayout({ userProfile, onLogout, onUpdateProfile }: Props) {
  const { isDesktop, isCompact } = useViewport();
  const [currentTab, setCurrentTab] = useState<MentorTab>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Data state
  const [mentor, setMentor] = useState<MentorProfileData | null>(null);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [sessions, setSessions] = useState<MentorSession[]>([]);
  const [reviews, setReviews] = useState<MentorReview[]>([]);
  const [earnings, setEarnings] = useState<MentorEarnings | null>(null);

  // Modal / inter-page state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [openMenteeMessageId, setOpenMenteeMessageId] = useState<string | null>(null);

  // Load initial mentor data
  const loadData = useCallback(async () => {
    setLoading(true);
    const userId = userProfile?.email || "mentor_current";
    const data = await fetchMentorData(userId, userProfile);
    setMentor(data.mentor);
    setMentees(data.mentees);
    setSessions(data.sessions);
    setReviews(data.reviews);
    setEarnings(data.earnings);
    setLoading(false);
  }, [userProfile]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Navigate handler
  const handleNavigate = (tab: MentorTab) => {
    setCurrentTab(tab);
    setDrawerOpen(false);
  };

  // Jump to messages with a specific mentee
  const handleMessageMentee = (menteeId: string) => {
    setOpenMenteeMessageId(menteeId);
    setCurrentTab("messages");
    setDrawerOpen(false);
  };

  // Jump to schedule session with a specific mentee
  const handleScheduleWithMentee = (mentee: Mentee) => {
    setCurrentTab("sessions");
    setIsScheduleModalOpen(true);
    setDrawerOpen(false);
  };

  // Toggle availability
  const handleToggleAvailability = async () => {
    if (!mentor) return;
    const newStatus = !mentor.acceptingMentees;
    const updated = {
      ...mentor,
      acceptingMentees: newStatus,
      availability: newStatus ? "Available" : "Paused",
    };
    setMentor(updated);
    await updateMentorProfileInDb(mentor.id, {
      availability: updated.availability,
    });
    toast.success(newStatus ? "You are now accepting mentees." : "Availability paused.");
  };

  // Update session status (Completed, Cancelled)
  const handleSessionStatusChange = async (
    sessionId: string,
    newStatus: "Completed" | "Cancelled" | "Booked"
  ) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: newStatus } : s))
    );
    await updateSessionStatusInDb(sessionId, newStatus);
    toast.success(`Session marked as ${newStatus.toLowerCase()}.`);
  };

  // Add new session
  const handleAddSession = (newSession: Omit<MentorSession, "id" | "createdAt">) => {
    const sessionObj: MentorSession = {
      ...newSession,
      id: `sess_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSessions((prev) => [sessionObj, ...prev]);
  };

  // Update mentor profile. Splits the patch three ways: known `mentors`
  // table columns go to Supabase; the mentor-specific fields that aren't
  // (yet) real columns — mentoringStyle, sessionTypes, targetLevel,
  // areasCanHelp — persist to localStorage via saveProfileExtras so they
  // survive a reload without risking a write against a column that may
  // not exist; avatarUrl is really userProfile.avatarDataUrl, the same
  // photo-upload mechanism Settings already uses on the student side, so
  // it bubbles up through the top-level onUpdateProfile instead.
  const handleUpdateMentorProfile = async (patch: Partial<MentorProfileData>): Promise<boolean> => {
    if (!mentor) return false;
    const updated = { ...mentor, ...patch };
    setMentor(updated);

    const { mentoringStyle, sessionTypes, targetLevel, areasCanHelp, avatarUrl, ...dbPatch } = patch;
    if (mentoringStyle !== undefined || sessionTypes !== undefined || targetLevel !== undefined || areasCanHelp !== undefined) {
      saveProfileExtras({ mentoringStyle, sessionTypes, targetLevel, areasCanHelp });
    }
    if (avatarUrl !== undefined && onUpdateProfile) {
      onUpdateProfile({ avatarDataUrl: avatarUrl });
    }
    const ok = await updateMentorProfileInDb(mentor.id, dbPatch);
    if (patch.name && onUpdateProfile) {
      onUpdateProfile({ name: patch.name });
    }
    return ok;
  };

  const unreadMessagesCount = 1;

  if (loading && !mentor) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: M.bg,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: M.textMuted,
          fontFamily: M.sans,
          gap: 14,
        }}
      >
        <div style={{ width: 38, height: 38, borderRadius: "50%", border: `2px solid ${M.goldBorder}`, borderTopColor: M.gold, animation: "spin 0.8s linear infinite" }} />
        <span style={{ fontSize: "0.9rem" }}>Loading Mentor Command Center…</span>
      </div>
    );
  }

  const mentorObj = mentor!;

  const SidebarContent = (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
      <div>
        {/* Logo Branding */}
        <div style={{ padding: "26px 22px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: M.serif,
                fontSize: "1.35rem",
                fontWeight: 700,
                color: M.gold,
                letterSpacing: "-0.02em",
              }}
            >
              Starfix
            </span>
            <span
              style={{
                padding: "2px 7px",
                borderRadius: M.radiusPill,
                background: M.goldBg,
                border: `1px solid ${M.goldBorder}`,
                color: M.gold,
                fontSize: "0.68rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Mentor
            </span>
          </div>
          <div style={{ color: M.textFaint, fontSize: "0.76rem", marginTop: 4 }}>
            Faculty & Advisor Suite
          </div>
        </div>

        {/* Navigation Items */}
        <nav style={{ padding: "4px 12px 18px", display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV_ITEMS.map((item) => {
            const active = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: M.radiusSm,
                  background: active ? M.goldBg : "transparent",
                  border: `1px solid ${active ? M.goldBorder : "transparent"}`,
                  color: active ? M.gold : M.textMuted,
                  fontSize: "0.86rem",
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  fontFamily: M.sans,
                  textAlign: "left",
                  transition: "all 0.16s ease",
                  width: "100%",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = M.surfaceHover;
                    e.currentTarget.style.color = M.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = M.textMuted;
                  }
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.3 : 1.9} color={active ? M.gold : M.textMuted} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.id === "messages" && unreadMessagesCount > 0 && (
                  <span
                    style={{
                      padding: "1px 6px",
                      borderRadius: 999,
                      background: M.gold,
                      color: "#11101a",
                      fontSize: "0.68rem",
                      fontWeight: 700,
                    }}
                  >
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Footer & Logout */}
      <div style={{ padding: "16px 14px", borderTop: `1px solid ${M.border}`, background: M.surfaceAlt }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <MentorAvatar name={mentorObj.name} avatarUrl={mentorObj.avatarUrl} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: "0.85rem", color: M.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {mentorObj.name}
              </div>
              <div style={{ color: M.textFaint, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {mentorObj.acceptingMentees ? "● Available" : "○ Paused"}
              </div>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out from Mentor Mode"
            style={{
              background: "none",
              border: "none",
              color: M.textMuted,
              cursor: "pointer",
              padding: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: M.radiusSm,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = M.red)}
            onMouseLeave={(e) => (e.currentTarget.style.color = M.textMuted)}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        height: "100vh",
        background: M.bg,
        fontFamily: M.sans,
        color: M.text,
        overflow: "hidden",
      }}
    >
      {/* ── Desktop Sidebar ── */}
      {isDesktop ? (
        <aside
          style={{
            width: 232,
            flexShrink: 0,
            background: M.surface,
            borderRight: `1px solid ${M.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {SidebarContent}
        </aside>
      ) : (
        /* ── Mobile / Tablet Header ── */
        <>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: M.surface,
              borderBottom: `1px solid ${M.border}`,
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: M.serif, fontSize: "1.25rem", fontWeight: 700, color: M.gold }}>
                Starfix
              </span>
              <span
                style={{
                  padding: "2px 6px",
                  borderRadius: M.radiusPill,
                  background: M.goldBg,
                  border: `1px solid ${M.goldBorder}`,
                  color: M.gold,
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                Mentor
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: M.radiusSm,
                  border: `1px solid ${M.border}`,
                  background: "transparent",
                  color: M.text,
                  cursor: "pointer",
                }}
              >
                <Menu size={18} />
              </button>
            </div>
          </header>

          {/* Slide-in Mobile Drawer */}
          <AnimatePresence>
            {drawerOpen && (
              <>
                <div
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 120 }}
                />
                <aside
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "82vw",
                    maxWidth: 300,
                    background: M.surface,
                    borderRight: `1px solid ${M.border}`,
                    zIndex: 121,
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: M.shadowLg,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "flex-end", padding: "14px 14px 0" }}>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      style={{ background: "none", border: "none", color: M.textMuted, cursor: "pointer", padding: 4 }}
                    >
                      <X size={20} />
                    </button>
                  </div>
                  {SidebarContent}
                </aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Main Viewport Area ── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          background: M.bg,
          padding: isCompact ? "20px 16px 40px" : "32px 40px 60px",
          maxWidth: "100vw",
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              {currentTab === "dashboard" && (
                <MentorDashboardHome
                  mentor={mentorObj}
                  mentees={mentees}
                  sessions={sessions}
                  unreadMessagesCount={unreadMessagesCount}
                  onNavigate={handleNavigate}
                  onOpenSessionModal={() => {
                    setCurrentTab("sessions");
                    setIsScheduleModalOpen(true);
                  }}
                  onMessageMentee={handleMessageMentee}
                  onToggleAvailability={handleToggleAvailability}
                  onSessionStatusChange={handleSessionStatusChange}
                />
              )}

              {currentTab === "mentees" && (
                <MentorMenteesPage
                  mentees={mentees}
                  onMessageMentee={handleMessageMentee}
                  onScheduleWithMentee={handleScheduleWithMentee}
                />
              )}

              {currentTab === "sessions" && (
                <MentorSessionsPage
                  sessions={sessions}
                  mentees={mentees}
                  mentorName={mentorObj.name}
                  onSessionStatusChange={handleSessionStatusChange}
                  onAddSession={handleAddSession}
                  onMessageMentee={handleMessageMentee}
                  isScheduleModalOpen={isScheduleModalOpen}
                  onCloseScheduleModal={() => setIsScheduleModalOpen(false)}
                  onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
                />
              )}

              {currentTab === "messages" && (
                <MentorMessagesPage
                  mentees={mentees}
                  openMenteeId={openMenteeMessageId}
                  onOpenScheduleModal={handleScheduleWithMentee}
                />
              )}

              {currentTab === "profile" && (
                <MentorProfilePage
                  mentor={mentorObj}
                  mentees={mentees}
                  sessions={sessions}
                  reviews={reviews}
                  earnings={earnings || { totalEarned: 0, pendingPayout: 0, completedSessionsCount: 0, avgPerSession: 0, currency: "INR", payoutMethod: "", history: [] }}
                  onUpdateProfile={handleUpdateMentorProfile}
                  onToggleAvailability={handleToggleAvailability}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
