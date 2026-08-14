import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flame, MessageSquareText, StickyNote, Sparkles, Activity } from "lucide-react";
import { A } from "../adminColors";
import { LEARNERS, type Learner, type LearnerStatus } from "../adminData";

const STATUS_STYLE: Record<LearnerStatus, { bg: string; fg: string }> = {
  "Active":   { bg: A.greenLight, fg: A.green },
  "At risk":  { bg: A.amberLight, fg: A.amber },
  "Inactive": { bg: A.redLight,   fg: A.red   },
};

function StatusBadge({ status }: { status: LearnerStatus }) {
  const s = STATUS_STYLE[status];
  return (
    <span style={{
      fontSize: "0.7rem", fontWeight: 600, color: s.fg, background: s.bg,
      padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap",
    }}>
      {status}
    </span>
  );
}

function DrawerSection({ title, Icon, children }: { title: string; Icon: any; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <Icon size={14} color={A.gold} />
        <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function LearnerDrawer({ learner, onClose }: { learner: Learner; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,0.28)", zIndex: 40 }}
      />
      <motion.div
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: A.surface,
          borderLeft: `1px solid ${A.border}`, zIndex: 41, overflowY: "auto", padding: "28px 30px 40px",
          boxShadow: A.shadowMd,
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 24, right: 24, width: 30, height: 30, borderRadius: "50%",
          border: `1px solid ${A.border}`, background: "none", display: "flex", alignItems: "center",
          justifyContent: "center", cursor: "pointer",
        }}>
          <X size={14} color={A.textMuted} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", background: `${learner.color}18`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem",
            fontWeight: 700, color: learner.color, fontFamily: A.serif,
          }}>
            {learner.initials}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: A.text, fontFamily: A.serif }}>{learner.name}</div>
            <div style={{ fontSize: "0.78rem", color: A.textMuted }}>{learner.email}</div>
          </div>
        </div>

        <DrawerSection title="Current Paths" Icon={Sparkles}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {learner.activePaths.map((p) => (
              <span key={p} style={{ fontSize: "0.76rem", color: A.gold, background: A.goldLight, padding: "4px 10px", borderRadius: 20 }}>{p}</span>
            ))}
          </div>
        </DrawerSection>

        <DrawerSection title="Mentor Sessions" Icon={MessageSquareText}>
          {learner.mentorSessions.length === 0
            ? <p style={{ fontSize: "0.82rem", color: A.textFaint, margin: 0 }}>No sessions booked yet.</p>
            : learner.mentorSessions.map((s, i) => (
              <div key={i} style={{ fontSize: "0.82rem", color: A.text, padding: "8px 0", borderBottom: i < learner.mentorSessions.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}>
                <strong style={{ fontWeight: 600 }}>{s.mentor}</strong> — {s.topic}
                <div style={{ fontSize: "0.72rem", color: A.textFaint, marginTop: 2 }}>{s.date}</div>
              </div>
            ))}
        </DrawerSection>

        <DrawerSection title="Notes" Icon={StickyNote}>
          {learner.notes.length === 0
            ? <p style={{ fontSize: "0.82rem", color: A.textFaint, margin: 0 }}>No admin notes.</p>
            : learner.notes.map((n, i) => (
              <p key={i} style={{ fontSize: "0.82rem", color: A.textMuted, margin: "0 0 8px", lineHeight: 1.5 }}>{n}</p>
            ))}
        </DrawerSection>

        <DrawerSection title="AI Interactions" Icon={Sparkles}>
          {learner.aiInteractions.length === 0
            ? <p style={{ fontSize: "0.82rem", color: A.textFaint, margin: 0 }}>No AI Assistant activity.</p>
            : learner.aiInteractions.map((q, i) => (
              <p key={i} style={{ fontSize: "0.82rem", color: A.textMuted, margin: "0 0 6px", fontStyle: "italic" }}>{q}</p>
            ))}
        </DrawerSection>

        <DrawerSection title="Recent Activity" Icon={Activity}>
          {learner.recentActivity.map((r, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.82rem", color: A.text, padding: "5px 0" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: A.gold, flexShrink: 0 }} />
              {r}
            </div>
          ))}
        </DrawerSection>
      </motion.div>
    </>
  );
}

export function LearnersPage() {
  const [selected, setSelected] = useState<Learner | null>(null);

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Learners</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>{LEARNERS.length} learners on the platform.</p>
      </div>

      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["", "Name", "Active paths", "Streak", "Progress", "Last active", "Status"].map((h) => (
                <th key={h} style={{
                  textAlign: "left", fontSize: "0.7rem", fontWeight: 700, color: A.textFaint, textTransform: "uppercase",
                  letterSpacing: "0.06em", padding: "14px 18px", borderBottom: `1px solid ${A.border}`,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {LEARNERS.map((l, i) => (
              <motion.tr
                key={l.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, delay: i * 0.02 }}
                onClick={() => setSelected(l)}
                style={{ cursor: "pointer", borderBottom: i < LEARNERS.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = A.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "13px 18px" }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%", background: `${l.color}18`,
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem",
                    fontWeight: 700, color: l.color,
                  }}>
                    {l.initials}
                  </div>
                </td>
                <td style={{ padding: "13px 18px", fontSize: "0.86rem", color: A.text, fontWeight: 500 }}>{l.name}</td>
                <td style={{ padding: "13px 18px", fontSize: "0.82rem", color: A.textMuted }}>{l.activePaths.join(", ")}</td>
                <td style={{ padding: "13px 18px", fontSize: "0.82rem", color: A.textMuted }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Flame size={12} color="#D97742" /> {l.streak}d</span>
                </td>
                <td style={{ padding: "13px 18px", fontSize: "0.82rem", color: A.gold, fontWeight: 600 }}>{l.progress}%</td>
                <td style={{ padding: "13px 18px", fontSize: "0.82rem", color: A.textFaint }}>{l.lastActive}</td>
                <td style={{ padding: "13px 18px" }}><StatusBadge status={l.status} /></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {selected && <LearnerDrawer learner={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
