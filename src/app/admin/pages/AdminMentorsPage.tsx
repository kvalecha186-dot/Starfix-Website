import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Star, Users, Clock, DollarSign, Award } from "lucide-react";
import { A } from "../adminColors";
import { ADMIN_MENTORS, type AdminMentor } from "../adminData";

const STATUS_STYLE: Record<AdminMentor["status"], { bg: string; fg: string }> = {
  Active:    { bg: A.greenLight, fg: A.green },
  Pending:   { bg: A.amberLight, fg: A.amber },
  Suspended: { bg: A.redLight,   fg: A.red   },
};

function MentorDrawer({ mentor, onClose }: { mentor: AdminMentor; onClose: () => void }) {
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(23,23,23,0.28)", zIndex: 40 }} />
      <motion.div
        initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 420, background: A.surface,
          borderLeft: `1px solid ${A.border}`, zIndex: 41, overflowY: "auto", padding: "28px 30px 40px", boxShadow: A.shadowMd,
        }}
      >
        <button onClick={onClose} style={{
          position: "absolute", top: 24, right: 24, width: 30, height: 30, borderRadius: "50%",
          border: `1px solid ${A.border}`, background: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <X size={14} color={A.textMuted} />
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 60, height: 60, borderRadius: "50%", background: `${mentor.color}18`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.15rem",
            fontWeight: 700, color: mentor.color, fontFamily: A.serif,
          }}>
            {mentor.initials}
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 700, color: A.text, fontFamily: A.serif }}>{mentor.name}</div>
            <div style={{ fontSize: "0.8rem", color: A.textMuted }}>{mentor.specialty} · {mentor.experience}</div>
          </div>
        </div>

        <div style={{
          display: "flex", fontSize: "0.72rem", background: STATUS_STYLE[mentor.status].bg,
          width: "fit-content", padding: "4px 12px", borderRadius: 20, marginBottom: 24,
        }}>
          <span style={{ color: STATUS_STYLE[mentor.status].fg, fontWeight: 600 }}>{mentor.status}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
          {[
            { label: "Rating", value: `${mentor.rating}`, Icon: Star },
            { label: "Active learners", value: `${mentor.activeLearners}`, Icon: Users },
            { label: "Response time", value: mentor.responseTime, Icon: Clock },
            { label: "Earnings this month", value: `$${mentor.earnings.toLocaleString()}`, Icon: DollarSign },
          ].map((s) => (
            <div key={s.label} style={{ background: A.surfaceAlt, borderRadius: 16, padding: "14px 16px" }}>
              <s.Icon size={13} color={A.gold} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: "1rem", fontWeight: 700, color: A.text, fontFamily: A.serif }}>{s.value}</div>
              <div style={{ fontSize: "0.68rem", color: A.textFaint, marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Award size={14} color={A.gold} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>Specialty</span>
        </div>
        <p style={{ fontSize: "0.85rem", color: A.text, lineHeight: 1.6, margin: 0 }}>
          {mentor.name.split(" ")[0]} specializes in {mentor.specialty.toLowerCase()}, mentoring {mentor.activeLearners} active learners
          with an average rating of {mentor.rating} and a typical response time of {mentor.responseTime}.
        </p>
      </motion.div>
    </>
  );
}

export function AdminMentorsPage() {
  const [selected, setSelected] = useState<AdminMentor | null>(null);

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Mentors</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>{ADMIN_MENTORS.length} mentors on the platform.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {ADMIN_MENTORS.map((m) => (
          <div
            key={m.id}
            onClick={() => setSelected(m)}
            style={{
              background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius,
              padding: "22px 22px 18px", boxShadow: A.shadow, cursor: "pointer",
              transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = A.shadowMd; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = A.shadow; }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{
                width: 46, height: 46, borderRadius: "50%", background: `${m.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem",
                fontWeight: 700, color: m.color, fontFamily: A.serif, flexShrink: 0,
              }}>
                {m.initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: "0.94rem", fontWeight: 700, color: A.text }}>{m.name}</div>
                <div style={{ fontSize: "0.76rem", color: A.textMuted }}>{m.specialty} · {m.experience}</div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.8rem", color: A.text, marginBottom: 14 }}>
              <Star size={12} color={A.gold} fill={A.gold} /> {m.rating}
              <span style={{ color: A.textFaint, marginLeft: 4 }}>· {m.activeLearners} active learners</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 14, borderTop: `1px solid ${A.borderMuted}` }}>
              <div>
                <div style={{ fontSize: "0.68rem", color: A.textFaint }}>Response time</div>
                <div style={{ fontSize: "0.82rem", color: A.text, fontWeight: 600, marginTop: 2 }}>{m.responseTime}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.68rem", color: A.textFaint }}>Earnings this month</div>
                <div style={{ fontSize: "0.82rem", color: A.gold, fontWeight: 700, marginTop: 2 }}>${m.earnings.toLocaleString()}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selected && <MentorDrawer mentor={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>
    </div>
  );
}
