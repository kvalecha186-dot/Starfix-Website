import { motion } from "motion/react";
import { useEffect, useState } from "react";
import {
  Users, Video, Target, TrendingUp, TrendingDown, Flame,
  UserCheck, UserPlus, CheckCircle2, BookOpenCheck, Flag, ArrowRight,
} from "lucide-react";
import { A } from "../adminColors";
import { OVERVIEW_METRICS, NEEDS_ATTENTION, RECENT_ACTIVITY } from "../adminData";
import type { AdminPage } from "../AdminLayout";
import { supabase } from "../../lib/supabase";

const METRIC_ICONS = [Users, Video, Target, TrendingUp];
const ATTENTION_ICON: Record<string, any> = { "low-completion": TrendingDown, trending: TrendingUp, demand: Flame };
const ACTIVITY_ICON = [UserCheck, UserPlus, CheckCircle2, BookOpenCheck, Flag];

function MetricCard({ label, value, trend, Icon }: { label: string; value: string; trend: string; Icon: any }) {
  return (
    <div
      className="glow-card"
      onMouseMove={(e) => {
        const el = e.currentTarget as HTMLElement;
        const r = el.getBoundingClientRect();
        el.style.setProperty("--gx", `${((e.clientX - r.left) / r.width) * 100}%`);
        el.style.setProperty("--gy", `${((e.clientY - r.top) / r.height) * 100}%`);
      }}
      style={{
        background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius,
        padding: "22px 22px 20px", boxShadow: A.shadow, transition: "transform 150ms ease, box-shadow 150ms ease",
      }}
    >
      <div style={{
        width: 34, height: 34, borderRadius: "50%", background: A.goldLight,
        display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16,
      }}>
        <Icon size={15} color={A.gold} strokeWidth={1.8} />
      </div>
      <div style={{ fontSize: "1.55rem", fontWeight: 700, color: A.text, fontFamily: A.serif, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: "0.8rem", color: A.textMuted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: "0.72rem", color: A.textFaint }}>{trend}</div>
    </div>
  );
}

export function AdminOverview({ onNavigate }: { onNavigate?: (p: AdminPage) => void }) {
  const [metrics, setMetrics] = useState(OVERVIEW_METRICS);
  const [activity, setActivity] = useState(RECENT_ACTIVITY);

  useEffect(() => {
    void (async () => {
      const [students, mentors, sessions, paths] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("mentors").select("id", { count: "exact", head: true }),
        supabase.from("bookings").select("id", { count: "exact", head: true }),
        supabase.from("growth_paths").select("id", { count: "exact", head: true }),
      ]);
      setMetrics([
        { label: "Learners", value: String(students.count ?? 0), trend: "Live Supabase count" },
        { label: "Mentors", value: String(mentors.count ?? 0), trend: "Live Supabase count" },
        { label: "Sessions", value: String(sessions.count ?? 0), trend: "All bookings" },
        { label: "Growth Paths", value: String(paths.count ?? 0), trend: "Published paths" },
      ]);
      const recent = (await supabase.from("bookings").select("session_type,created_at,status").order("created_at", { ascending: false }).limit(5)).data || [];
      if (recent.length) setActivity(recent.map((b: any) => ({
        text: (b.status === "completed" ? "Session completed" : "Session booked") + " · " + (b.session_type || "Mentorship session"),
        time: new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      })));
    })();
  }, []);

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} style={{ marginBottom: 30 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.9rem", fontWeight: 700, color: A.text, margin: "0 0 6px", letterSpacing: "-0.01em" }}>
          Good morning, Marcus.
        </h1>
        <p style={{ fontSize: "0.9rem", color: A.textMuted, margin: 0 }}>Here's what needs your attention today.</p>
      </motion.div>

      {/* Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 36 }}>
        {metrics.map((m, i) => (
          <MetricCard key={m.label} label={m.label} value={m.value} trend={m.trend} Icon={METRIC_ICONS[i]} />
        ))}
      </div>

      {/* What Needs Attention */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: A.textFaint, margin: "0 0 16px" }}>
          What needs attention
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {NEEDS_ATTENTION.map((n) => {
            const Icon = ATTENTION_ICON[n.kind];
            return (
              <div key={n.title} style={{
                background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius,
                padding: "22px 22px 20px", boxShadow: A.shadow,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: A.goldLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} color={A.gold} />
                  </div>
                  <span style={{ fontSize: "0.92rem", fontWeight: 600, color: A.text }}>{n.title}</span>
                </div>
                <p style={{ fontSize: "0.8rem", color: A.textMuted, lineHeight: 1.55, margin: "0 0 16px" }}>{n.detail}</p>
                <button
                  onClick={() => onNavigate?.(n.kind === "demand" ? "mentors" : "paths")}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, background: "none", border: "none",
                    color: A.gold, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: 0, fontFamily: A.sans,
                  }}
                >
                  {n.cta} <ArrowRight size={13} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: A.textFaint, margin: "0 0 16px" }}>
          Recent platform activity
        </h2>
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, padding: "8px 24px" }}>
          {RECENT_ACTIVITY.map((a, i) => {
            const Icon = ACTIVITY_ICON[i];
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "15px 0",
                borderBottom: i < RECENT_ACTIVITY.length - 1 ? `1px solid ${A.borderMuted}` : "none",
              }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: A.surfaceAlt, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={A.textMuted} />
                </div>
                <span style={{ flex: 1, fontSize: "0.85rem", color: A.text }}>{a.text}</span>
                <span style={{ fontSize: "0.74rem", color: A.textFaint, flexShrink: 0 }}>{a.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
