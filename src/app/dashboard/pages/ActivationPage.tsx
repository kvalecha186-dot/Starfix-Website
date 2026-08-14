import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Clock } from "lucide-react";
import { C } from "../dashColors";
import { PATHS, statsFor, focusOptionsFor } from "./GoalsPage";
import { enroll, type Enrollment } from "../../lib/pathProgress";

/* ─────────────────────────────────────────────────────────────────────────
   /activate/:pathId — the short activation flow that turns a browsing
   visitor into an active learner on ONE specific Growth Path: pick a
   focus, confirm level + weekly time, then create the real Enrollment
   record MyPathWorkspace reads from. Mentor selection happens afterward,
   in its own dedicated flow (/paths/:pathId/mentors) — enroll() always
   starts a path with no mentor assigned, matching pathProgress.ts.
   Every option below is derived from the matched PathDef, so this never
   looks templated from a single "Coding" example.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: C.textFaint,
  fontFamily: "'Inter', sans-serif",
};

const LEVELS: { id: Enrollment["level"]; label: string; desc: string }[] = [
  { id: "beginner", label: "Beginner", desc: "New to this, starting from zero" },
  { id: "intermediate", label: "Intermediate", desc: "Some experience already" },
  { id: "advanced", label: "Advanced", desc: "Sharpening real skills" },
];

const TIME_OPTIONS = ["15 min / day", "30 min / day", "1 hr / day", "2+ hrs / day"];

function SectionCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 18,
        boxShadow: C.shadow,
        padding: "28px 32px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function ActivationPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const p = PATHS.find((x) => x.id === pathId);

  const focusOptions = p ? focusOptionsFor(p) : [];

  const [focus, setFocus] = useState<string[]>(focusOptions.slice(0, 1));
  const [level, setLevel] = useState<Enrollment["level"]>("beginner");
  const [weeklyTime, setWeeklyTime] = useState(TIME_OPTIONS[1]);
  const [submitting, setSubmitting] = useState(false);

  if (!p) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Growth Path not found</span>
        <Link to="/growth-paths" style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to Growth Paths</Link>
      </div>
    );
  }

  const s = statsFor(p);

  const toggleFocus = (f: string) => {
    setFocus((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const handleActivate = () => {
    if (submitting) return;
    setSubmitting(true);
    enroll(p, { focus, level, weeklyTime });
    navigate(`/growth-paths/${p.id}/journey`);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: "40px 48px 72px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>

        <Link to={`/growth-paths/${p.id}`} style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: "0.82rem", textDecoration: "none", fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft size={14} /> Back to {p.title}
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 10 }}>
            <div style={{ width: 52, height: 52, borderRadius: C.radius, background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <p.Icon size={24} color={p.color} />
            </div>
            <div>
              <span style={LABEL}>Start Your Journey</span>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: C.text, margin: "2px 0 0", letterSpacing: "-0.01em" }}>
                {p.title}
              </h1>
            </div>
          </div>
          <p style={{ fontSize: "0.9rem", color: C.textMuted, lineHeight: 1.6, maxWidth: 560, margin: 0 }}>
            A few quick picks and your personal {s.duration.toLowerCase()} plan is ready — you'll choose your mentor right after this.
          </p>
        </motion.div>

        {/* Focus areas */}
        <SectionCard>
          <span style={{ ...LABEL, display: "block", marginBottom: 4 }}>What's Your Focus?</span>
          <p style={{ fontSize: "0.8rem", color: C.textMuted, margin: "0 0 18px" }}>Pick one or more areas to shape your weekly plan.</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {focusOptions.map((f) => {
              const selected = focus.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => toggleFocus(f)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "9px 16px", borderRadius: 20, fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem", fontWeight: 600,
                    border: `1.5px solid ${selected ? C.gold : C.borderMuted}`,
                    background: selected ? C.goldLight : C.surfaceAlt,
                    color: selected ? C.text : C.textMuted,
                  }}
                >
                  {selected && <Check size={12} color={C.gold} strokeWidth={3} />}
                  {f}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Level */}
        <SectionCard>
          <span style={{ ...LABEL, display: "block", marginBottom: 18 }}>Your Experience Level</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            {LEVELS.map((lvl) => {
              const selected = level === lvl.id;
              return (
                <button
                  key={lvl.id}
                  onClick={() => setLevel(lvl.id)}
                  style={{
                    textAlign: "left", cursor: "pointer", padding: 16, borderRadius: C.radiusSm,
                    border: `1.5px solid ${selected ? C.gold : C.border}`,
                    background: selected ? C.goldLight : C.surface,
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>{lvl.label}</div>
                  <div style={{ fontSize: "0.72rem", color: C.textMuted, lineHeight: 1.4 }}>{lvl.desc}</div>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Weekly time commitment */}
        <SectionCard>
          <span style={{ ...LABEL, display: "block", marginBottom: 18 }}>Weekly Time Commitment</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {TIME_OPTIONS.map((t) => {
              const selected = weeklyTime === t;
              return (
                <button
                  key={t}
                  onClick={() => setWeeklyTime(t)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6, cursor: "pointer",
                    padding: "9px 16px", borderRadius: 20, fontFamily: "'Inter', sans-serif",
                    fontSize: "0.8rem", fontWeight: 600,
                    border: `1.5px solid ${selected ? C.gold : C.borderMuted}`,
                    background: selected ? C.goldLight : C.surfaceAlt,
                    color: selected ? C.text : C.textMuted,
                  }}
                >
                  <Clock size={12} color={selected ? C.gold : C.textFaint} />
                  {t}
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* CTA */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
          <motion.button
            onClick={handleActivate}
            disabled={submitting}
            whileHover={{ boxShadow: `0 0 0 4px ${C.goldBorder}` }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "15px 34px", borderRadius: C.radiusSm, border: "none",
              background: C.gold, color: "#fff", fontSize: "0.92rem", fontWeight: 600,
              cursor: submitting ? "default" : "pointer",
              opacity: submitting ? 0.6 : 1,
              fontFamily: "'Inter', sans-serif", transition: "box-shadow 200ms ease, opacity 200ms ease",
            }}
          >
            Begin My Journey <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
