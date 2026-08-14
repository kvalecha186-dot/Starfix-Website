import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Video, MessageCircle, CheckCircle2, Flame, Award, Trophy, X,
  BellRing, Library, TrendingUp, FileBadge,
} from "lucide-react";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import {
  getActiveNotifications, dismissNotification,
  NOTIFICATIONS_CHANGED_EVENT, type AppNotification, type NotificationType,
} from "../lib/notifications";
import { ENROLLMENTS_CHANGED_EVENT } from "../lib/pathProgress";

/* ─────────────────────────────────────────────────────────────────────────
   Dashboard Notification Bar — item 6: a slim, dismissible strip below the
   top header that rotates through recent notifications one at a time
   (never a wall of toasts). Reads the same shared store as the Notification
   Center side panel (NotificationBell.tsx), so anything written by
   pathProgress.ts anywhere in the app shows up here immediately.
───────────────────────────────────────────────────────────────────────── */

// Every NotificationType from lib/notifications.ts must have an entry here —
// a missing entry used to throw at render (meta.Icon on undefined) the
// first time an uncovered type fired. All 11 covered now.
export const TYPE_META: Record<NotificationType, { Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }> = {
  session_started:            { Icon: Video,         color: C.gold },
  session_reminder:           { Icon: BellRing,       color: C.gold },
  mentor_replied:             { Icon: MessageCircle,  color: "#2563EB" },
  task_completed_early:       { Icon: CheckCircle2,   color: "#0F9D6C" },
  streak_increased:           { Icon: Flame,          color: "#F97316" },
  badge_unlocked:             { Icon: Award,          color: C.gold },
  weekly_challenge_completed: { Icon: Trophy,         color: C.gold },
  milestone_unlocked:         { Icon: TrendingUp,     color: "#10B981" },
  new_resource_added:         { Icon: Library,        color: "#2563EB" },
  path_progress_updated:      { Icon: TrendingUp,     color: C.gold },
  certificate_earned:         { Icon: FileBadge,      color: C.gold },
};

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

const ROTATE_MS = 5000;

/* Slim rotating bar — shows exactly one notification at a time, gently
   sliding to the next every few seconds. Dismissing removes just the
   notification currently shown. */
export function NotificationBar() {
  const { isDesktop } = useViewport();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [index, setIndex] = useState(0);
  const rotateRef = useRef<number | null>(null);

  const refresh = useCallback(() => setItems(getActiveNotifications()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    window.addEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
      window.removeEventListener(ENROLLMENTS_CHANGED_EVENT, refresh);
    };
  }, [refresh]);

  useEffect(() => {
    if (items.length <= 1) return;
    rotateRef.current = window.setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => { if (rotateRef.current) window.clearInterval(rotateRef.current); };
  }, [items.length]);

  useEffect(() => { if (index >= items.length) setIndex(0); }, [items.length, index]);

  if (items.length === 0) return null;
  const n = items[index % items.length];
  const meta = TYPE_META[n.type];

  return (
    <div style={{ padding: isDesktop ? "14px 40px 0" : "12px 16px 0" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={n.id}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: "flex", alignItems: "center", gap: 12,
            background: C.surface, border: `1px solid ${C.border}`,
            borderRadius: 999, padding: "9px 12px 9px 14px",
            boxShadow: C.shadow, maxWidth: isDesktop ? 560 : "100%",
          }}
        >
          <div style={{
            width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
            background: `${meta.color}16`, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <meta.Icon size={12} color={meta.color} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: C.text }}>{n.title}</span>
            <span style={{ fontSize: "0.8rem", color: C.textMuted }}> — {n.message}</span>
          </div>
          <span style={{ fontSize: "0.66rem", color: C.textFaint, flexShrink: 0 }}>{timeAgo(n.createdAt)}</span>
          {items.length > 1 && (
            <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
              {items.slice(0, 5).map((it, i) => (
                <span key={it.id} style={{
                  width: 4, height: 4, borderRadius: "50%",
                  background: i === (index % items.length) ? C.gold : C.borderMuted,
                }} />
              ))}
            </div>
          )}
          <button
            onClick={() => dismissNotification(n.id)}
            title="Dismiss"
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textFaint, display: "flex", padding: 2, flexShrink: 0, borderRadius: "50%" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.text; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = C.textFaint; }}
          >
            <X size={12} />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* Back-compat alias — some pages may still import the original name. */
export const NotificationCenter = NotificationBar;
