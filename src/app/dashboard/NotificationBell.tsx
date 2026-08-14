import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X } from "lucide-react";
import { C } from "./dashColors";
import {
  getAllNotifications, dismissNotification, dismissAll, categoryFor,
  NOTIFICATIONS_CHANGED_EVENT, type AppNotification, type NotificationCategory,
} from "../lib/notifications";
import { ENROLLMENTS_CHANGED_EVENT } from "../lib/pathProgress";
import { PATHS } from "./pages/GoalsPage";
import { TYPE_META } from "./NotificationCenter";

/* ─────────────────────────────────────────────────────────────────────────
   Notification Bell + Center (item 5 & 7) — the bell lives in the
   Dashboard header; clicking it opens a right-side panel with tabs
   (All / Sessions / Progress / Mentors / Achievements), each notification
   showing icon, message, time, and related Growth Path.
───────────────────────────────────────────────────────────────────────── */

const TABS: { id: "all" | NotificationCategory; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "sessions",     label: "Sessions" },
  { id: "progress",     label: "Progress" },
  { id: "mentors",      label: "Mentors" },
  { id: "achievements", label: "Achievements" },
];

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotificationRow({ n }: { n: AppNotification }) {
  const meta = TYPE_META[n.type];
  const path = n.pathId ? PATHS.find((p) => p.id === n.pathId) : undefined;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{ duration: 0.18 }}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "14px 4px", borderBottom: `1px solid ${C.borderMuted}`,
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: "50%", flexShrink: 0, marginTop: 1,
        background: `${meta.color}16`, display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <meta.Icon size={14} color={meta.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text }}>{n.title}</span>
          <span style={{ fontSize: "0.68rem", color: C.textFaint, flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
        </div>
        <p style={{ fontSize: "0.8rem", color: C.textMuted, margin: "3px 0 0", lineHeight: 1.4 }}>{n.message}</p>
        {path && (
          <span style={{
            display: "inline-block", marginTop: 6, fontSize: "0.64rem", fontWeight: 700,
            color: path.color, background: `${path.color}14`, padding: "2px 8px", borderRadius: 999,
          }}>
            {path.title}
          </span>
        )}
      </div>
      <button
        onClick={() => dismissNotification(n.id)}
        title="Dismiss"
        style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, padding: 2, flexShrink: 0 }}
      >
        <X size={12} />
      </button>
    </motion.div>
  );
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"all" | NotificationCategory>("all");
  const [items, setItems] = useState<AppNotification[]>([]);

  const refresh = useCallback(() => setItems(getAllNotifications().filter((n) => !n.dismissed)), []);

  useEffect(() => {
    refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    window.addEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
      window.removeEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  const filtered = tab === "all" ? items : items.filter((n) => categoryFor(n.type) === tab);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Notifications"
        style={{
          position: "relative", width: 36, height: 36, borderRadius: "50%",
          border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Bell size={15} color={C.text} />
        {items.length > 0 && (
          <span style={{
            position: "absolute", top: -2, right: -2, minWidth: 15, height: 15, borderRadius: 999,
            background: C.gold, color: "#fff", fontSize: "0.6rem", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px",
            border: `1.5px solid ${C.bg}`,
          }}>
            {items.length > 9 ? "9+" : items.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(24,24,27,0.28)", zIndex: 60 }}
            />
            <motion.div
              key="panel"
              initial={{ x: 380 }} animate={{ x: 0 }} exit={{ x: 380 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "fixed", top: 0, right: 0, bottom: 0, width: 380, maxWidth: "92vw",
                background: C.surface, borderLeft: `1px solid ${C.border}`, zIndex: 61,
                display: "flex", flexDirection: "column",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 22px 14px" }}>
                <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: C.text }}>Notifications</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {items.length > 0 && (
                    <button
                      onClick={() => dismissAll()}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.gold, fontSize: "0.74rem", fontWeight: 600, fontFamily: "'Inter', sans-serif" }}
                    >
                      Clear all
                    </button>
                  )}
                  <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, display: "flex" }}>
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: "flex", gap: 4, padding: "0 22px 14px", overflowX: "auto" }}>
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    style={{
                      flexShrink: 0, padding: "6px 12px", borderRadius: 999, fontSize: "0.72rem", fontWeight: 600,
                      border: `1px solid ${tab === t.id ? C.goldBorder : C.border}`,
                      background: tab === t.id ? C.goldLight : "transparent",
                      color: tab === t.id ? C.gold : C.textMuted,
                      cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "0 22px 22px" }}>
                <AnimatePresence initial={false}>
                  {filtered.length === 0 ? (
                    <div style={{ padding: "40px 0", textAlign: "center", color: C.textFaint, fontSize: "0.82rem" }}>
                      Nothing here yet.
                    </div>
                  ) : (
                    filtered.map((n) => <NotificationRow key={n.id} n={n} />)
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
