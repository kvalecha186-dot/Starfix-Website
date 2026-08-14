import { useState } from "react";
import { motion } from "motion/react";
import {
  LayoutGrid, Users, Target, GraduationCap, CalendarClock, Compass,
  Sparkles, ShieldAlert, Settings as SettingsIcon, Search, Bell, Plus,
} from "lucide-react";
import { A } from "./adminColors";
import { StarfixNavMark } from "../components/StarfixLogoMark";

import { AdminOverview }   from "./pages/AdminOverview";
import { LearnersPage }    from "./pages/LearnersPage";
import { AdminPathsPage }  from "./pages/AdminPathsPage";
import { AdminMentorsPage} from "./pages/AdminMentorsPage";
import { SessionsPage }    from "./pages/SessionsPage";
import { ExploreContentPage } from "./pages/ExploreContentPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { ModerationPage }  from "./pages/ModerationPage";
import { AdminSettingsPage } from "./pages/AdminSettingsPage";

export type AdminPage =
  | "overview" | "learners" | "paths" | "mentors" | "sessions"
  | "content" | "ai" | "moderation" | "settings";

const NAV: { id: AdminPage; label: string; Icon: any }[] = [
  { id: "overview",   label: "Overview",       Icon: LayoutGrid },
  { id: "learners",   label: "Learners",       Icon: Users },
  { id: "paths",      label: "Growth Paths",   Icon: Target },
  { id: "mentors",    label: "Mentors",        Icon: GraduationCap },
  { id: "sessions",   label: "Sessions",       Icon: CalendarClock },
  { id: "content",    label: "Explore Content",Icon: Compass },
  { id: "ai",         label: "AI Assistant",   Icon: Sparkles },
  { id: "moderation", label: "Moderation",     Icon: ShieldAlert },
  { id: "settings",   label: "Settings",       Icon: SettingsIcon },
];

export function AdminLayout() {
  const [page, setPage] = useState<AdminPage>("overview");

  return (
    <div style={{ display: "flex", height: "100vh", background: A.bg, fontFamily: A.sans, overflow: "hidden" }}>

      {/* ══ SIDEBAR ══════════════════════════════════════════ */}
      <aside style={{
        width: 240, flexShrink: 0, background: A.surface, borderRight: `1px solid ${A.border}`,
        display: "flex", flexDirection: "column", padding: "22px 14px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 10px 26px" }}>
          <StarfixNavMark size={26} />
          <div>
            <div style={{ fontFamily: A.serif, fontSize: "1.05rem", fontWeight: 700, color: A.text, lineHeight: 1 }}>Starfix</div>
            <div style={{ fontSize: "0.62rem", color: A.textFaint, letterSpacing: "0.08em", textTransform: "uppercase", marginTop: 2 }}>Admin</div>
          </div>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
          {NAV.map((item) => {
            const active = page === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 11, padding: "10px 12px",
                  borderRadius: A.radiusSm, border: "none", cursor: "pointer", width: "100%",
                  background: active ? A.goldLight : "transparent",
                  color: active ? A.gold : A.textMuted,
                  fontSize: "0.86rem", fontWeight: active ? 600 : 500,
                  fontFamily: A.sans, textAlign: "left", transition: "background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = A.surfaceAlt; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
              >
                <item.Icon size={16} strokeWidth={1.8} />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ padding: "12px 10px 4px", borderTop: `1px solid ${A.borderMuted}`, marginTop: 8 }}>
          <div style={{ fontSize: "0.68rem", color: A.textFaint }}>Signed in as</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 600, color: A.text, marginTop: 2 }}>Marcus Bellweather</div>
        </div>
      </aside>

      {/* ══ MAIN ═════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

        {/* Top bar */}
        <header style={{
          height: 64, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 28px", borderBottom: `1px solid ${A.border}`, background: A.bg,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 9, background: A.surface,
            border: `1px solid ${A.border}`, borderRadius: 12, padding: "9px 14px", width: 340,
          }}>
            <Search size={15} color={A.textFaint} />
            <input
              placeholder="Search users, mentors, paths, resources"
              style={{
                border: "none", outline: "none", background: "transparent", fontSize: "0.82rem",
                color: A.text, width: "100%", fontFamily: A.sans,
              }}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <motion.button
              whileHover={{ y: -2 }}
              style={{
                position: "relative", width: 36, height: 36, borderRadius: "50%", border: `1px solid ${A.border}`,
                background: A.surface, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <Bell size={15} color={A.textMuted} />
              <span style={{ position: "absolute", top: 8, right: 9, width: 6, height: 6, borderRadius: "50%", background: A.gold }} />
            </motion.button>

            <motion.button
              whileHover={{ y: -2 }}
              style={{
                width: 36, height: 36, borderRadius: "50%", border: "none",
                background: A.gold, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
              title="Quick create"
            >
              <Plus size={16} strokeWidth={2.4} />
            </motion.button>

            <div style={{
              width: 36, height: 36, borderRadius: "50%", background: A.goldLight, border: `1px solid ${A.goldBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700, color: A.gold,
              fontFamily: A.serif, cursor: "pointer",
            }}>
              M
            </div>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, overflow: "auto" }}>
          {page === "overview"   && <AdminOverview onNavigate={setPage} />}
          {page === "learners"   && <LearnersPage />}
          {page === "paths"      && <AdminPathsPage />}
          {page === "mentors"    && <AdminMentorsPage />}
          {page === "sessions"   && <SessionsPage />}
          {page === "content"    && <ExploreContentPage />}
          {page === "ai"         && <AIAssistantPage />}
          {page === "moderation" && <ModerationPage />}
          {page === "settings"   && <AdminSettingsPage />}
        </main>
      </div>
    </div>
  );
}
