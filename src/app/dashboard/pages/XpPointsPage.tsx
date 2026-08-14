import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Sparkles, Clock, Flame, Lock, Check, Compass, BookOpen, Wrench,
  Target, Trophy, Award, Star, Bookmark, Layers, FileText, CalendarClock,
  BadgeCheck, Info, ArrowRight,
} from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import {
  getXpState, getRank, getPendingEntries, getNextSettleAt, getXpLog,
  RANKS, SETTLE_MS, XP_CHANGED_EVENT,
} from "../../lib/xpSystem";
import { XpHistoryCard } from "../XpHistorySection";
import { WhyXpButton, WhyXpModal } from "../WhyXpModal";

/* ─────────────────────────────────────────────────────────────────────────
   XP Points — a dedicated, full-width page reading the exact same
   xpSystem store as the Dashboard's XP wallet card, so the two can never
   drift out of sync: same getXpState()/getRank(), same XP_CHANGED_EVENT.
───────────────────────────────────────────────────────────────────────── */

const X = {
  bg: "#FAF8F3",
  border: "#E8D7A5",
  borderSoft: "rgba(212,165,20,0.14)",
  gold: "#D4A514",
  goldLight: "#FBF3DE",
  text: "#1C1917",
  textMuted: "#6B6355",
  textFaint: "#A69C87",
  shadow: "0 10px 32px rgba(180,140,20,0.07)",
  radius: 28,
};

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: X.textFaint, fontFamily: "'Inter', sans-serif",
};

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "#fff", border: `1px solid ${X.border}`, borderRadius: X.radius,
      boxShadow: X.shadow, ...style,
    }}>
      {children}
    </div>
  );
}

const RANK_ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Explorer: Compass, Learner: BookOpen, Builder: Wrench, Practitioner: Target,
  Achiever: Trophy, Expert: Award, "Rising Star": Star,
};

const UNLOCKS = [
  { xp: 500,   Icon: Bookmark,      title: "Save unlimited videos",         desc: "No cap on how many videos and resources you can save." },
  { xp: 1500,  Icon: Layers,        title: "Weekly challenge access",        desc: "Take on the weekly project challenge for bonus XP." },
  { xp: 3500,  Icon: FileText,      title: "Project review templates",       desc: "Structured templates to submit projects for feedback." },
  { xp: 7000,  Icon: Sparkles,      title: "Advanced curated content",       desc: "Deeper, more advanced videos and resources unlock." },
  { xp: 12000, Icon: CalendarClock, title: "Priority mentor booking window", desc: "Book mentor sessions from an earlier time window." },
  { xp: 20000, Icon: BadgeCheck,    title: "Rising Star profile badge",      desc: "A permanent badge on your profile marking this milestone." },
];

const EARN_ROWS = [
  { action: "Complete a daily task",              xp: "+15–40 XP" },
  { action: "Watch 80% of a curated video",        xp: "+10 XP" },
  { action: "Finish a milestone",                  xp: "+100 XP" },
  { action: "Submit a project",                    xp: "+150 XP" },
  { action: "Mentor marks project reviewed",        xp: "+200 XP" },
  { action: "7-day consistency",                   xp: "+75 XP" },
  { action: "30-day consistency",                   xp: "+400 XP" },
];

function formatCountdown(ms: number): string {
  if (ms <= 0) return "any moment";
  const totalMin = Math.ceil(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function relativeGroup(at: number): string {
  const d = new Date(at);
  const now = new Date();
  const startOfDay = (dt: Date) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 1 && diffDays <= 7) return "This week";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeAgo(at: number): string {
  const diffMin = Math.max(0, Math.round((Date.now() - at) / 60000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function XpPointsPage({ onNavigate }: { onNavigate?: (p: DashPage) => void }) {
  const { isDesktop, isTablet } = useViewport();
  const [xpState, setXpState] = useState(getXpState);
  const [pending, setPending] = useState(getPendingEntries);
  const [log, setLog] = useState(getXpLog);
  const [nextSettleAt, setNextSettleAt] = useState(getNextSettleAt);
  const [, tick] = useState(0);

  useEffect(() => {
    const refresh = () => {
      setXpState(getXpState());
      setPending(getPendingEntries());
      setLog(getXpLog());
      setNextSettleAt(getNextSettleAt());
    };
    window.addEventListener(XP_CHANGED_EVENT, refresh);
    const iv = window.setInterval(() => { refresh(); tick((n) => n + 1); }, 60000);
    return () => { window.removeEventListener(XP_CHANGED_EVENT, refresh); window.clearInterval(iv); };
  }, []);

  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const rank = getRank(xpState.totalXp);
  const remainingToNext = rank.next ? rank.next.min - xpState.totalXp : 0;
  const countdownMs = nextSettleAt ? nextSettleAt - Date.now() : 0;

  const groupedLog = useMemo(() => {
    const groups: { label: string; items: typeof log }[] = [];
    for (const entry of log) {
      const g = relativeGroup(entry.at);
      let bucket = groups.find((x) => x.label === g);
      if (!bucket) { bucket = { label: g, items: [] }; groups.push(bucket); }
      bucket.items.push(entry);
    }
    return groups;
  }, [log]);

  const twoCol = isDesktop || isTablet;

  return (
    <div style={{ background: X.bg, minHeight: "100vh" }}>
      <div style={{ padding: isDesktop ? "40px 48px 100px" : "20px 16px 80px", maxWidth: "100%", boxSizing: "border-box" }}>

        {/* Page header — same rhythm as every other Starfix page */}
        <div style={{ marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ ...LABEL, marginBottom: 8 }}>Your Growth</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "2.2rem" : "1.8rem", fontWeight: 700, color: X.text, margin: 0, letterSpacing: "-0.02em" }}>
              XP Points
            </h1>
          </div>
          <WhyXpButton onClick={() => setWhyModalOpen(true)} />
        </div>

        {/* ══ SECTION 1 — HERO XP CARD ══════════════════════════ */}
        <Card style={{ padding: isDesktop ? "36px 40px" : "24px 22px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{
            position: "absolute", top: -100, right: -100, width: 320, height: 320, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,165,20,0.14) 0%, rgba(212,165,20,0) 70%)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 22, flexWrap: "wrap" }}>
              <span style={{
                display: "flex", alignItems: "center", gap: 7, fontSize: "0.8rem", fontWeight: 700,
                color: X.gold, background: X.goldLight, border: `1px solid ${X.border}`,
                padding: "7px 16px", borderRadius: 999,
              }}>
                {(() => { const RIcon = RANK_ICONS[rank.name] ?? Star; return <RIcon size={14} color={X.gold} />; })()}
                {rank.name}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: X.textMuted }}>
                <Flame size={13} color="#F97316" /> {xpState.consistencyStreak}-day consistency
              </span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: isDesktop ? 48 : 28, marginBottom: 26 }}>
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "2.6rem" : "2rem", fontWeight: 700, color: X.text, lineHeight: 1 }}>
                  {xpState.totalXp.toLocaleString()} <span style={{ fontSize: "1rem", fontWeight: 500, color: X.textMuted, fontFamily: "'Inter', sans-serif" }}>XP total</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: isDesktop ? "1.5rem" : "1.2rem", fontWeight: 600, color: X.gold, lineHeight: 1 }}>
                  +{xpState.todayXp} <span style={{ fontSize: "0.85rem", fontWeight: 500, color: X.textMuted }}>XP pending today</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, fontSize: "0.82rem", color: X.textMuted }}>
                <span>{xpState.totalXp.toLocaleString()} / {rank.next ? rank.next.min.toLocaleString() : xpState.totalXp.toLocaleString()} XP {rank.next ? `to ${rank.next.name}` : "— top rank"}</span>
                {rank.next && <span style={{ fontWeight: 600, color: X.text }}>{remainingToNext.toLocaleString()} XP remaining</span>}
              </div>
              <div style={{ height: 3, borderRadius: 999, background: "#F1EADC", overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${rank.progressPct}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  style={{ height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${X.gold}, #E7C86A)` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* ══ SECTION 2 — PENDING XP (TODAY) ═════════════════════ */}
        <Card style={{ padding: isDesktop ? "28px 32px" : "20px 20px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: X.text, margin: "0 0 4px" }}>Pending XP (Today)</h2>
              <p style={{ fontSize: "0.8rem", color: X.textMuted, margin: 0 }}>Completing a task adds XP here first — it settles into Total XP automatically after 6 hours.</p>
            </div>
            {pending.length > 0 && nextSettleAt && (
              <span style={{
                display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600,
                color: X.gold, background: X.goldLight, border: `1px solid ${X.border}`, padding: "7px 14px", borderRadius: 999, whiteSpace: "nowrap",
              }}>
                <Clock size={13} /> Transfers to total in {formatCountdown(countdownMs)}
              </span>
            )}
          </div>

          {pending.length === 0 ? (
            <p style={{ fontSize: "0.84rem", color: X.textFaint, margin: 0, padding: "8px 0" }}>Nothing pending right now — complete a task to see it here.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {pending.map((p, i) => (
                <div key={p.key} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                  borderTop: i > 0 ? `1px solid ${X.borderSoft}` : "none",
                }}>
                  <span style={{
                    fontSize: "0.78rem", fontWeight: 700, color: p.amount >= 0 ? X.gold : X.textMuted,
                    background: p.amount >= 0 ? X.goldLight : "#F4F1E8", border: `1px solid ${p.amount >= 0 ? X.border : "#E5E0D3"}`,
                    padding: "3px 10px", borderRadius: 999, flexShrink: 0, minWidth: 56, textAlign: "center",
                  }}>
                    {p.amount >= 0 ? "+" : ""}{p.amount}
                  </span>
                  <span style={{ flex: 1, fontSize: "0.86rem", color: X.text }}>{p.label}</span>
                  <span style={{ fontSize: "0.72rem", color: X.textFaint, flexShrink: 0 }}>{timeAgo(p.addedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ══ SECTION 3 — XP HISTORY ══════════════════════════════ */}
        <div style={{ marginBottom: 24 }}>
          <XpHistoryCard />
        </div>

        {/* ══ SECTION 4 + 5 — HIERARCHY & UNLOCKS (2-col on desktop/tablet) ══ */}
        <div style={{ display: "grid", gridTemplateColumns: twoCol ? "1fr 1fr" : "1fr", gap: 24, marginBottom: 24, alignItems: "start" }}>

          {/* Rank hierarchy */}
          <Card style={{ padding: isDesktop ? "28px 32px" : "20px 20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: X.text, margin: "0 0 18px" }}>Starfix Rank Hierarchy</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {RANKS.map((r) => {
                const achieved = xpState.totalXp >= r.min;
                const isCurrent = r.name === rank.name;
                const Icon = RANK_ICONS[r.name] ?? Star;
                const idx = RANKS.findIndex((x) => x.name === r.name);
                const nextMin = RANKS[idx + 1]?.min;
                const range = nextMin ? `${r.min.toLocaleString()}–${(nextMin - 1).toLocaleString()} XP` : `${r.min.toLocaleString()}+ XP`;
                return (
                  <div key={r.name} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "12px 14px", borderRadius: 16,
                    background: isCurrent ? X.goldLight : "transparent",
                    border: `1px solid ${isCurrent ? X.border : "transparent"}`,
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                      background: achieved ? X.goldLight : "#F4F1E8",
                      border: `1px solid ${achieved ? X.border : "#E5E0D3"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon size={15} color={achieved ? X.gold : X.textFaint} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.86rem", fontWeight: 700, color: achieved ? X.text : X.textFaint }}>{r.name}</span>
                        {isCurrent && <span style={{ fontSize: "0.62rem", fontWeight: 700, color: X.gold, textTransform: "uppercase", letterSpacing: "0.05em" }}>Current</span>}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: achieved ? X.textMuted : X.textFaint, marginTop: 1 }}>{range}</div>
                      <div style={{ fontSize: "0.72rem", color: achieved ? X.textMuted : X.textFaint, marginTop: 3, lineHeight: 1.4 }}>{r.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Unlocks & rewards */}
          <Card style={{ padding: isDesktop ? "28px 32px" : "20px 20px" }}>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: X.text, margin: "0 0 18px" }}>Unlocks & Rewards</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {UNLOCKS.map((u) => {
                const unlocked = xpState.totalXp >= u.xp;
                return (
                  <div key={u.title} style={{
                    padding: "16px 14px", borderRadius: 18,
                    background: unlocked ? X.goldLight : "#FAF9F5",
                    border: `1px solid ${unlocked ? X.border : "#EDE8DA"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                        background: unlocked ? "#fff" : "#F1EADC",
                      }}>
                        <u.Icon size={14} color={unlocked ? X.gold : X.textFaint} />
                      </div>
                      {unlocked ? <Check size={14} color={X.gold} /> : <Lock size={12} color={X.textFaint} />}
                    </div>
                    <div style={{ fontSize: "0.68rem", fontWeight: 700, color: unlocked ? X.gold : X.textFaint, marginBottom: 4 }}>{u.xp.toLocaleString()} XP</div>
                    <div style={{ fontSize: "0.82rem", fontWeight: 600, color: unlocked ? X.text : X.textFaint, marginBottom: 4, lineHeight: 1.3 }}>{u.title}</div>
                    <div style={{ fontSize: "0.7rem", color: unlocked ? X.textMuted : X.textFaint, lineHeight: 1.4 }}>{u.desc}</div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ══ SECTION 6 — HOW XP IS EARNED ═══════════════════════ */}
        <Card style={{ padding: isDesktop ? "28px 32px" : "20px 20px", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: X.text, margin: "0 0 18px" }}>How XP Is Earned</h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {EARN_ROWS.map((row, i) => (
              <div key={row.action} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
                padding: "13px 0", borderTop: i > 0 ? `1px solid ${X.borderSoft}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <ArrowRight size={13} color={X.textFaint} />
                  <span style={{ fontSize: "0.86rem", color: X.text }}>{row.action}</span>
                </div>
                <span style={{ fontSize: "0.8rem", fontWeight: 700, color: X.gold, flexShrink: 0 }}>{row.xp}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Why XP Modal */}
        <WhyXpModal open={whyModalOpen} onClose={() => setWhyModalOpen(false)} />

      </div>
    </div>
  );
}
