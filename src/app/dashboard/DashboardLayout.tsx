import { useState, useCallback, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Home, Target, Users, MessageCircle, Zap, Sparkles, User, Settings as SettingsIcon, Menu, X } from "lucide-react";
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
  const { isDesktop, isCompact } = useViewport();
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
  // Which mentor's thread Messages should open to — set by
  // openMentorConversation (from "Message Mentor"), consumed once by
  // MessagesPage and then cleared so it doesn't re-trigger on remount.
  const [openMentorId, setOpenMentorId] = useState<number | null>(null);

  // Sidebar unread badge — recomputed on the shared messages-changed event
  // so it stays accurate whether the change came from this tab or another
  // mounted view (e.g. a mentor "replying" while Messages isn't open).
  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    const recompute = () => setUnreadCount(totalUnreadCount());
    recompute();
    window.addEventListener(MESSAGES_CHANGED_EVENT, recompute);
    return () => window.removeEventListener(MESSAGES_CHANGED_EVENT, recompute);
  }, []);

  // Generic sidebar/internal navigation — clears any Growth-Path mentor filter so a
  // plain click on "Mentors" always falls back to the user's own goal category, and
  // always resets any open mentor profile back to the grid.
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

  // Used specifically by a Growth Path's "View All Mentors" action — pre-filters
  // the Mentors page to that path's category before switching pages.
  const goToMentorsFiltered = useCallback((category: string) => {
    setMentorCategoryOverride(category);
    setSelectedMentorId(null);
    setPage("mentors");
  }, []);

  // Opens a specific mentor's dedicated profile page within the Mentors tab.
  // Note: this is an internal state switch, not a real route — /mentors/:slug
  // isn't a page this app can render standalone, so we never touch the URL
  // bar here (a stale pushState to that fake path is what caused direct
  // visits/refreshes to that URL to show a blank screen).
  const selectMentor = useCallback((id: number) => {
    setSelectedMentorId(id);
    setPage("mentors");
  }, []);

  // "Message Mentor" on any mentor profile — jumps straight to Messages
  // with that mentor's thread open (creating it first if needed happens
  // inside MessagesPage/ensureConversation, since that's where the mentor's
  // display name is already in scope).
  const openMentorConversation = useCallback((id: number) => {
    setOpenMentorId(id);
    setPage("messages");
  }, []);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isDesktop ? "row" : "column",
        height: "100vh",
        background: C.bg,
        fontFamily: "'Inter', sans-serif",
        color: C.text,
        overflow: "hidden",
      }}
    >
      {isDesktop ? (
        /* ── Sidebar (desktop, 1024px+) — byte-identical to before ── */
        <aside
          style={{
            width: 232,
            flexShrink: 0,
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SidebarNavContent page={page} navigate={navigate} unreadCount={unreadCount} />
        </aside>
      ) : (
        /* ── Mobile header + slide-in drawer (tablet/mobile, <1024px) ── */
        <>
          <header
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexShrink: 0, padding: "14px 16px", background: C.surface,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{
                fontFamily: "'Playfair Display', serif", fontSize: "1.15rem",
                fontWeight: 700, color: C.gold, letterSpacing: "-0.02em",
              }}
            >
              Starfix
            </span>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: 38, height: 38, borderRadius: 10, border: `1px solid ${C.border}`,
                background: "transparent", color: C.text, cursor: "pointer",
              }}
            >
              <Menu size={18} />
            </button>
          </header>

          <AnimatePresence>
            {drawerOpen && (
              <>
                <div
                  key="overlay"
                  className="starfix-overlay-enter"
                  onClick={() => setDrawerOpen(false)}
                  style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 90 }}
                />
                <aside
                  key="drawer"
                  className="starfix-drawer-enter"
                  style={{
                    position: "fixed", top: 0, left: 0, bottom: 0,
                    width: "84vw", maxWidth: 320,
                    background: C.surface, borderRight: `1px solid ${C.border}`,
                    display: "flex", flexDirection: "column", zIndex: 91,
                    boxShadow: "0 0 40px rgba(0,0,0,0.15)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "14px 14px 0" }}>
                    <button
                      onClick={() => setDrawerOpen(false)}
                      aria-label="Close menu"
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "center",
                        width: 34, height: 34, borderRadius: 10, border: "none",
                        background: "transparent", color: C.textMuted, cursor: "pointer",
                      }}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <SidebarNavContent page={page} navigate={navigate} unreadCount={unreadCount} />
                </aside>
              </>
            )}
          </AnimatePresence>
        </>
      )}

      {/* ── Main ── */}
      <main style={{ flex: 1, overflow: "auto", background: C.bg, maxWidth: "100vw" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: isCompact ? 4 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isCompact ? -2 : -4 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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

      <AICoach onNavigate={navigate} onGoToMentors={goToMentorsFiltered} userProfile={userProfile} />
    </div>
  );
}

/* Logo + nav list — identical markup used by the desktop <aside> and the
   mobile drawer's <aside>, so desktop rendering is unaffected by the
   drawer's existence and the two never drift out of sync. */
function SidebarNavContent({ page, navigate, unreadCount }: { page: DashPage; navigate: (p: DashPage) => void; unreadCount: number }) {
  return (
    <>
      {/* Logo */}
      <div style={{ padding: "26px 22px 22px" }}>
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
      </div>

      {/* Nav — compact, gold accent reserved for the active item only */}
      <nav style={{ flex: 1, padding: "4px 14px 20px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ id, label, Icon }) => {
          const active = page === id;
          return (
            <motion.button
              key={id}
              onClick={() => navigate(id)}
              whileHover={{ x: active ? 0 : 1 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 12px",
                width: "100%",
                background: active ? C.goldLight : "transparent",
                border: "none",
                borderRadius: 10,
                color: active ? C.gold : C.textMuted,
                fontSize: "0.85rem",
                fontWeight: active ? 600 : 500,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Inter', sans-serif",
                transition: "background 0.18s ease, color 0.18s ease",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = C.surfaceAlt; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
            >
              <Icon size={16} strokeWidth={active ? 2.1 : 1.8} />
              {label}
              {id === "messages" && unreadCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto", minWidth: 18, height: 18, padding: "0 5px", borderRadius: 999,
                    background: active ? C.gold : "#D4A91F", color: "#fff", fontSize: "0.66rem", fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif",
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </motion.button>
          );
        })}
      </nav>
    </>
  );
}
