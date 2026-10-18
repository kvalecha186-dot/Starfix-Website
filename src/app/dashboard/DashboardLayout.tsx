import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Home, Target, Users, MessageCircle, Zap, Sparkles, User, Settings as SettingsIcon, Menu, X, LogOut, Compass } from "lucide-react";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import { DashboardHome } from "./pages/DashboardHome";
import { GoalsPage }     from "./pages/GoalsPage";
import { MentorsPage }   from "./pages/MentorsPage";
import { MentorDetailPage } from "./pages/MentorDetailPage";
import { MessagesPage }  from "./pages/MessagesPage";
import { XpPointsPage }  from "./pages/XpPointsPage";
import { DiscoverPage }  from "./pages/DiscoverPage";
import { ProfilePage }   from "./pages/ProfilePage";
import { SettingsPage }  from "./pages/SettingsPage";
import { AICoach }       from "./AICoach";
import type { UserProfile } from "../types";
import { totalUnreadCount, MESSAGES_CHANGED_EVENT } from "../lib/messages";

export type DashPage = "dashboard" | "goals" | "mentors" | "messages" | "xp" | "discover" | "profile" | "settings";

const NAV: { id: DashPage; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
  { id: "dashboard", label: "Dashboard",     Icon: Home        },
  { id: "goals",     label: "Growth Paths",  Icon: Target      },
  { id: "mentors",   label: "Mentors",       Icon: Users       },
  { id: "messages",  label: "Messages",      Icon: MessageCircle },
  { id: "xp",        label: "XP Points",     Icon: Zap         },
  { id: "discover",  label: "Explore",       Icon: Sparkles    },
  { id: "profile",   label: "Profile",       Icon: User        },
  { id: "settings",  label: "Settings",      Icon: SettingsIcon },
];

export function DashboardLayout({ onLogout, userProfile, onUpdateProfile }: { onLogout?: () => void; userProfile?: UserProfile | null; onUpdateProfile?: (patch: Partial<UserProfile>) => void }) {
  const { isDesktop, isCompact, isMobile } = useViewport();
  const location = useLocation();
  const routerNavigate = useNavigate();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const getPageFromPath = (path: string): DashPage => {
    if (path.startsWith("/growth-paths") || path.startsWith("/goals")) return "goals";
    if (path.startsWith("/mentors")) return "mentors";
    if (path.startsWith("/messages")) return "messages";
    if (path.startsWith("/xp")) return "xp";
    if (path.startsWith("/discover")) return "discover";
    if (path.startsWith("/profile")) return "profile";
    if (path.startsWith("/settings")) return "settings";
    return "dashboard";
  };

  const page = getPageFromPath(location.pathname);
  const [mentorCategoryOverride, setMentorCategoryOverride] = useState<string | null>(null);
  const [selectedMentorId, setSelectedMentorId] = useState<number | null>(null);
  const [openMentorId, setOpenMentorId] = useState<number | null>(null);

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const recompute = () => setUnreadCount(totalUnreadCount());
    recompute();
    window.addEventListener(MESSAGES_CHANGED_EVENT, recompute);
    return () => window.removeEventListener(MESSAGES_CHANGED_EVENT, recompute);
  }, []);

  const navigate = useCallback((p: DashPage) => {
    if (p !== "mentors") setMentorCategoryOverride(null);
    setSelectedMentorId(null);
    setDrawerOpen(false);
    if (p === "goals") {
      routerNavigate("/growth-paths");
    } else if (p === "dashboard") {
      routerNavigate("/");
    } else {
      routerNavigate(`/${p}`);
    }
  }, [routerNavigate]);

  const setPage = useCallback((p: DashPage) => {
    if (p === "goals") routerNavigate("/growth-paths");
    else if (p === "dashboard") routerNavigate("/");
    else routerNavigate(`/${p}`);
  }, [routerNavigate]);

  const goToMentorsFiltered = useCallback((category: string) => {
    setMentorCategoryOverride(category);
    setSelectedMentorId(null);
    setPage("mentors");
  }, [setPage]);

  const selectMentor = useCallback((id: number) => {
    setSelectedMentorId(id);
    setPage("mentors");
  }, [setPage]);

  const openMentorConversation = useCallback((id: number) => {
    setOpenMentorId(id);
    setPage("messages");
  }, [setPage]);

  const userName = userProfile?.name || "Starfix Learner";
  const userInitial = (userName[0] || "S").toUpperCase();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        height: isDesktop ? "100vh" : "100dvh",
        background: C.bg,
        fontFamily: "'Inter', sans-serif",
        color: C.text,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {isDesktop ? (
        /* ── Sidebar (desktop, 1024px+) ── */
        <aside
          style={{
            width: 240,
            flexShrink: 0,
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            height: "100vh",
          }}
        >
          <SidebarNavContent
            page={page}
            navigate={navigate}
            unreadCount={unreadCount}
            userProfile={userProfile}
            onLogout={onLogout}
          />
        </aside>
      ) : (
        /* ── Mobile header + slide-in drawer (tablet/mobile, <1024px) ── */
        <>
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              padding: "calc(10px + env(safe-area-inset-top, 0px)) 16px 10px",
              background: C.surface,
              borderBottom: `1px solid ${C.border}`,
              zIndex: 30,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <button
                onClick={() => navigate("dashboard")}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "1.2rem",
                    fontWeight: 700,
                    color: C.gold,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Starfix
                </span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Profile Avatar Quick Jump */}
              <button
                onClick={() => navigate("profile")}
                aria-label="Profile"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: `1px solid ${page === "profile" ? C.gold : C.border}`,
                  background: page === "profile" ? C.goldLight : C.surfaceAlt,
                  color: page === "profile" ? C.gold : C.text,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                {userProfile?.avatarDataUrl ? (
                  <img src={userProfile.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  userInitial
                )}
              </button>

              {/* Hamburger Menu Toggle */}
              <button
                onClick={() => setDrawerOpen(true)}
                aria-label="Open menu"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: `1px solid ${C.border}`,
                  background: drawerOpen ? C.surfaceAlt : "transparent",
                  color: C.text,
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Menu size={18} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: C.gold,
                    }}
                  />
                )}
              </button>
            </div>
          </header>

          <AnimatePresence>
            {drawerOpen && (
              <>
                <div
                  key="overlay"
                  className="starfix-overlay-enter"
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 90 }}
                />
                <aside
                  key="drawer"
                  className="starfix-drawer-enter"
                  style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: "84vw",
                    maxWidth: 320,
                    background: C.surface,
                    borderRight: `1px solid ${C.border}`,
                    display: "flex",
                    flexDirection: "column",
                    zIndex: 91,
                    boxShadow: "0 0 50px rgba(0,0,0,0.6)",
                    paddingTop: "env(safe-area-inset-top, 0px)",
                    paddingBottom: "env(safe-area-inset-bottom, 0px)",
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 18px 12px",
                      borderBottom: `1px solid ${C.borderMuted}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Playfair Display', serif",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: C.gold,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      Starfix
                    </span>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Close menu"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        borderRadius: 8,
                        border: `1px solid ${C.borderMuted}`,
                        background: "transparent",
                        color: C.textMuted,
                        cursor: "pointer",
                      }}
                    >
                      <X size={17} />
                    </button>
                  </div>
                  <SidebarNavContent
                    page={page}
                    navigate={navigate}
                    unreadCount={unreadCount}
                    userProfile={userProfile}
                    onLogout={() => {
                      setDrawerOpen(false);
                      onLogout?.();
                    }}
                  />
                </aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Main Content Area ── */}
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          WebkitOverflowScrolling: "touch",
          background: C.bg,
          maxWidth: "100vw",
          paddingBottom: isMobile ? "calc(64px + env(safe-area-inset-bottom, 0px))" : 0,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: isCompact ? 3 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isCompact ? -2 : -4 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {page === "dashboard" && <DashboardHome onNavigate={navigate} userProfile={userProfile} />}
            {page === "goals"     && <GoalsPage     onNavigate={navigate} userProfile={userProfile} onViewMentorsForPath={goToMentorsFiltered} />}
            {page === "mentors"   && (
              selectedMentorId != null
                ? <MentorDetailPage mentorId={selectedMentorId} onNavigate={navigate} onSelectMentor={selectMentor} onMessageMentor={openMentorConversation} />
                : <MentorsPage onNavigate={navigate} userProfile={userProfile} categoryOverride={mentorCategoryOverride} onSelectMentor={selectMentor} />
            )}
            {page === "messages"  && (
              <MessagesPage
                onNavigate={navigate}
                openMentorId={openMentorId}
                onOpenedMentor={() => setOpenMentorId(null)}
                onFindMentor={() => navigate("mentors")}
              />
            )}
            {page === "xp"        && <XpPointsPage  onNavigate={navigate} />}
            {page === "discover"  && <DiscoverPage  onNavigate={navigate} userProfile={userProfile} onSelectMentor={selectMentor} />}
            {page === "profile"   && <ProfilePage   onNavigate={navigate} userProfile={userProfile} onUpdateProfile={onUpdateProfile} onSelectMentor={selectMentor} />}
            {page === "settings"  && <SettingsPage  onNavigate={navigate} userProfile={userProfile} onUpdateProfile={onUpdateProfile} onLogout={onLogout} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Mobile Bottom Navigation Bar (<768px) ── */}
      {isMobile && (
        <nav
          aria-label="Mobile Navigation"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: "rgba(12, 11, 24, 0.94)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-around",
            paddingTop: 6,
            paddingBottom: "max(6px, env(safe-area-inset-bottom, 0px))",
            boxShadow: "0 -4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <MobileTabButton
            active={page === "dashboard"}
            label="Home"
            Icon={Home}
            onClick={() => navigate("dashboard")}
          />
          <MobileTabButton
            active={page === "goals"}
            label="Paths"
            Icon={Target}
            onClick={() => navigate("goals")}
          />
          <MobileTabButton
            active={page === "mentors"}
            label="Mentors"
            Icon={Users}
            onClick={() => navigate("mentors")}
          />
          <MobileTabButton
            active={page === "messages"}
            label="Messages"
            Icon={MessageCircle}
            badge={unreadCount}
            onClick={() => navigate("messages")}
          />
          <MobileTabButton
            active={page === "profile"}
            label="Profile"
            Icon={User}
            onClick={() => navigate("profile")}
          />
          <MobileTabButton
            active={drawerOpen}
            label="More"
            Icon={Menu}
            onClick={() => setDrawerOpen(true)}
          />
        </nav>
      )}

      <AICoach onNavigate={navigate} onGoToMentors={goToMentorsFiltered} userProfile={userProfile} />
    </div>
  );
}

function MobileTabButton({
  active,
  label,
  Icon,
  badge,
  onClick,
}: {
  active: boolean;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        background: "transparent",
        border: "none",
        color: active ? C.gold : C.textMuted,
        cursor: "pointer",
        padding: "4px 8px",
        position: "relative",
        minWidth: 50,
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div style={{ position: "relative" }}>
        <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
        {badge != null && badge > 0 && (
          <span
            style={{
              position: "absolute",
              top: -4,
              right: -8,
              minWidth: 15,
              height: 15,
              padding: "0 4px",
              borderRadius: 999,
              background: C.gold,
              color: "#050510",
              fontSize: "0.6rem",
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: "0.65rem",
          fontWeight: active ? 600 : 500,
          letterSpacing: "-0.01em",
        }}
      >
        {label}
      </span>
      {active && (
        <span
          style={{
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: C.gold,
            marginTop: 1,
          }}
        />
      )}
    </button>
  );
}

/* Sidebar navigation content with Logo, nav list, and User Footer */
function SidebarNavContent({
  page,
  navigate,
  unreadCount,
  userProfile,
  onLogout,
}: {
  page: DashPage;
  navigate: (p: DashPage) => void;
  unreadCount: number;
  userProfile?: UserProfile | null;
  onLogout?: () => void;
}) {
  const userName = userProfile?.name || "Starfix Learner";
  const userInitial = (userName[0] || "S").toUpperCase();
  const roleLabel = userProfile?.role === "mentor" ? "Mentor Account" : "Learner Account";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", flex: 1, minHeight: 0 }}>
      {/* Desktop Logo */}
      <div className="hidden lg:block" style={{ padding: "26px 22px 20px" }}>
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.25rem",
            fontWeight: 700,
            color: C.gold,
            letterSpacing: "-0.02em",
          }}
        >
          Starfix
        </span>
      </div>

      {/* Nav links */}
      <nav
        style={{
          flex: 1,
          padding: "6px 12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 3,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => navigate(id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "9px 12px",
                width: "100%",
                background: active ? C.goldLight : "transparent",
                border: active ? `1px solid ${C.goldBorder}` : "1px solid transparent",
                borderRadius: 10,
                color: active ? C.gold : C.textMuted,
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Inter', sans-serif",
                transition: "all 0.16s ease",
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = C.surfaceAlt;
                  e.currentTarget.style.color = C.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = C.textMuted;
                }
              }}
            >
              <Icon size={16} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {id === "messages" && unreadCount > 0 && (
                <span
                  style={{
                    minWidth: 18,
                    height: 18,
                    padding: "0 5px",
                    borderRadius: 999,
                    background: active ? C.gold : "#D4A91F",
                    color: "#050510",
                    fontSize: "0.66rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Footer & Logout Section */}
      <div
        style={{
          padding: "14px 14px 16px",
          borderTop: `1px solid ${C.border}`,
          background: C.surfaceAlt,
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <button
            onClick={() => navigate("profile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              flex: 1,
              background: "transparent",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: C.goldLight,
                border: `1px solid ${C.goldBorder}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.gold,
                fontSize: "0.82rem",
                fontWeight: 700,
                flexShrink: 0,
                overflow: "hidden",
              }}
            >
              {userProfile?.avatarDataUrl ? (
                <img src={userProfile.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                userInitial
              )}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "0.82rem",
                  color: C.text,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {userName}
              </div>
              <div
                style={{
                  color: C.textFaint,
                  fontSize: "0.68rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {roleLabel}
              </div>
            </div>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              title="Log out"
              style={{
                background: "transparent",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                padding: "6px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 8,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#EF4444"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = C.textMuted; }}
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
