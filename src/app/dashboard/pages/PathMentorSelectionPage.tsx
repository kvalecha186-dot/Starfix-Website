import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Star, Users, Clock } from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import { PATHS } from "./GoalsPage";
import { MENTORS } from "./MentorsPage";
import { MENTOR_DETAILS } from "../mentorData";
import { isEnrolled } from "../../lib/pathProgress";

/* ─────────────────────────────────────────────────────────────────────────
   /growth-paths/:pathId/mentors — item 4. Shows only mentors relevant to
   THIS path's category (never a generic global list), each card summarized
   enough to compare before opening a full profile.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

export function PathMentorSelectionPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useViewport();
  const p = PATHS.find((x) => x.id === pathId);

  if (!p) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Growth Path not found</span>
        <Link to="/growth-paths" style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to Growth Paths</Link>
      </div>
    );
  }

  if (!isEnrolled(p.id)) {
    navigate(`/activate/${p.id}`, { replace: true });
    return null;
  }

  const mentors = MENTORS.filter((m) => m.category === p.mentorCategory);
  const pool = mentors.length ? mentors : MENTORS;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: isDesktop ? "40px 48px 72px" : "20px 16px 56px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: isDesktop ? 24 : 18 }}>

        <button
          onClick={() => navigate(`/growth-paths/${p.id}/journey`)}
          style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: "0.82rem", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={14} /> Back to Workspace
        </button>

        <div>
          <span style={LABEL}>{p.title}</span>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", fontWeight: 700, color: C.text, margin: "2px 0 6px", letterSpacing: "-0.01em" }}>
            Choose Your Mentor
          </h1>
          <p style={{ fontSize: "0.88rem", color: C.textMuted, margin: 0, maxWidth: 560 }}>
            {p.mentorLabel} who specialize in {p.title.toLowerCase()}. Pick the one whose style fits how you like to learn.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 14 : 18 }}>
          {pool.map((m, i) => {
            const detail = MENTOR_DETAILS[m.id];
            return (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(`/growth-paths/${p.id}/mentors/${m.id}`)}
                style={{
                  textAlign: "left", cursor: "pointer", background: C.surface,
                  border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "20px 22px",
                  fontFamily: "'Inter', sans-serif", boxShadow: C.shadow,
                }}
              >
                <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: `linear-gradient(155deg, ${m.color}26, ${m.color}0c)`,
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: m.color }}>{m.initials}</span>
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "0.98rem", fontWeight: 700, color: C.text }}>{m.name}</div>
                    <div style={{ fontSize: "0.78rem", color: C.textMuted }}>{m.title}</div>
                    <div style={{ fontSize: "0.72rem", color: C.textFaint }}>{m.company} · {detail?.experience ?? "5+ years"}</div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {m.skills.slice(0, 3).map((s) => (
                    <span key={s} style={{ fontSize: "0.68rem", color: C.text, border: `1px solid ${C.border}`, padding: "2px 9px", borderRadius: 999 }}>{s}</span>
                  ))}
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: "0.76rem", color: C.textMuted }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} color={C.gold} fill={C.gold} /> <strong style={{ color: C.text }}>{m.rating}</strong>
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Users size={12} color={C.textFaint} /> {m.students.toLocaleString()}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} color={C.textFaint} /> {m.availability}
                  </span>
                  <span style={{ marginLeft: "auto", fontWeight: 700, color: m.free ? "#0F9D6C" : C.text }}>{m.price}</span>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
