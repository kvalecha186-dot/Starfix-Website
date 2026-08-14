import { useParams, useNavigate, Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, Star, Check, Clock, Briefcase } from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import { PATHS } from "./GoalsPage";
import { MENTORS } from "./MentorsPage";
import { MENTOR_DETAILS } from "../mentorData";
import { MENTOR_EXTRA } from "../mentorExtra";
import { assignMentor, scheduleMentorWelcomeReply } from "../../lib/pathProgress";

/* ─────────────────────────────────────────────────────────────────────────
   /paths/:pathId/mentors/:mentorId — item 5 + 6. Full profile, ending in
   "Select this mentor", which writes straight into this path's Enrollment
   and drops the learner back at their workspace with a success toast.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

export function PathMentorProfilePage() {
  const { pathId, mentorId } = useParams<{ pathId: string; mentorId: string }>();
  const navigate = useNavigate();
  const { isDesktop } = useViewport();
  const p = PATHS.find((x) => x.id === pathId);
  const mentor = MENTORS.find((m) => m.id === Number(mentorId));
  const detail = mentor ? MENTOR_DETAILS[mentor.id] : undefined;
  const extra = mentor ? MENTOR_EXTRA[mentor.id] : undefined;

  if (!p || !mentor || !detail || !extra) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Mentor not found</span>
        <Link to={`/growth-paths/${pathId}/mentors`} style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to mentors</Link>
      </div>
    );
  }

  const handleSelect = () => {
    const dateLabel = detail.availability[0]?.date ?? "This week";
    const timeLabel = detail.availability[0]?.slots[0] ?? "4:00 PM";
    assignMentor(p.id, mentor.id, dateLabel, timeLabel);
    scheduleMentorWelcomeReply(mentor.name, p.id);
    const slot = `${dateLabel} · ${timeLabel}`;
    toast.success(`${mentor.name} is now your mentor for ${p.title}`, {
      description: `Next session: ${slot}`,
    });
    navigate(`/growth-paths/${p.id}/journey`);
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", padding: isDesktop ? "40px 48px 72px" : "20px 16px 56px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", gap: isDesktop ? 32 : 24 }}>

        <Link to={`/growth-paths/${p.id}/mentors`} style={{ display: "flex", alignItems: "center", gap: 6, color: C.textMuted, fontSize: "0.82rem", textDecoration: "none", fontFamily: "'Inter', sans-serif" }}>
          <ArrowLeft size={14} /> Back to mentors
        </Link>

        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", gap: isDesktop ? 20 : 14, flexDirection: isDesktop ? "row" : "column", alignItems: isDesktop ? "flex-start" : "center", textAlign: isDesktop ? "left" : "center" }}>
          <div style={{
            width: 84, height: 84, borderRadius: "50%",
            background: `linear-gradient(155deg, ${mentor.color}26, ${mentor.color}0c)`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.9rem", fontWeight: 700, color: mentor.color }}>{mentor.initials}</span>
          </div>
          <div style={{ paddingTop: isDesktop ? 4 : 0 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.7rem" : "1.4rem", fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{mentor.name}</h1>
            <div style={{ fontSize: "0.86rem", color: C.textMuted, marginBottom: 8 }}>{mentor.title} · {mentor.company} · {detail.experience}</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: isDesktop ? "flex-start" : "center", gap: 12, fontSize: "0.8rem", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Star size={12} color={C.gold} fill={C.gold} /> <strong style={{ color: C.text }}>{mentor.rating}</strong>
              </span>
              <span style={{ color: C.textMuted }}>{mentor.students.toLocaleString()} students guided</span>
            </div>
          </div>
        </motion.div>

        {/* Bio */}
        <section>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>About</span>
          <p style={{ fontSize: "0.94rem", color: C.text, lineHeight: 1.7, margin: "0 0 10px" }}>{detail.bio}</p>
          <p style={{ fontSize: "0.86rem", color: C.textMuted, lineHeight: 1.7, margin: 0 }}>{detail.about}</p>
        </section>

        {/* Achievements / timeline */}
        <section>
          <span style={{ ...LABEL, display: "block", marginBottom: 14 }}>Experience &amp; Achievements</span>
          {extra.timeline.map((t, i) => (
            <div key={t.role} style={{ display: "flex", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 3 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Briefcase size={11} color={C.gold} />
                </div>
                {i < extra.timeline.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 30, background: C.borderMuted, marginTop: 4 }} />}
              </div>
              <div style={{ paddingBottom: i < extra.timeline.length - 1 ? 18 : 0 }}>
                <div style={{ fontSize: "0.86rem", fontWeight: 700, color: C.text }}>{t.role}</div>
                <div style={{ fontSize: "0.74rem", color: C.textFaint, marginBottom: 3 }}>{t.org} · {t.duration}</div>
                <div style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.5 }}>{t.detail}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Teaching style + help with */}
        <section style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? 28 : 20 }}>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Teaching Style</span>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {detail.learningStyle.map((s) => (
                <span key={s} style={{ fontSize: "0.72rem", color: C.text, background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, padding: "6px 11px", borderRadius: 999 }}>{s}</span>
              ))}
            </div>
          </div>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>What They Help With</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {detail.learn.slice(0, 4).map((l) => (
                <div key={l} style={{ display: "flex", gap: 7, alignItems: "flex-start" }}>
                  <Check size={13} color={C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: "0.8rem", color: C.text, lineHeight: 1.4 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Session + pricing */}
        <section>
          <span style={{ ...LABEL, display: "block", marginBottom: 14 }}>Session Duration &amp; Pricing</span>
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 12 }}>
            {extra.sessions.map((s) => (
              <div key={s.name} style={{ border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "14px 16px", position: "relative" }}>
                {s.popular && <span style={{ position: "absolute", top: -8, right: 12, fontSize: "0.6rem", fontWeight: 700, color: "#fff", background: C.gold, padding: "2px 8px", borderRadius: 999 }}>Popular</span>}
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>{s.name}</span>
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: s.price === "Free" ? "#0F9D6C" : C.text }}>{s.price}</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: C.textFaint, display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {s.duration}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Available slots */}
        <section>
          <span style={{ ...LABEL, display: "block", marginBottom: 14 }}>Available Slots</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {detail.availability.map((a) => (
              <div key={a.date} style={{ border: `1px solid ${C.border}`, borderRadius: C.radiusSm, padding: "10px 14px", minWidth: 120 }}>
                <div style={{ fontSize: "0.74rem", fontWeight: 600, color: C.text, marginBottom: 4 }}>{a.date}</div>
                {a.slots.map((s) => <div key={s} style={{ fontSize: "0.7rem", color: C.textMuted }}>{s}</div>)}
              </div>
            ))}
          </div>
        </section>

        {/* Reviews */}
        <section>
          <span style={{ ...LABEL, display: "block", marginBottom: 14 }}>Reviews</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {detail.reviews.map((rv) => (
              <div key={rv.name} style={{ paddingBottom: 16, borderBottom: `1px solid ${C.borderMuted}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.text }}>{rv.name}</span>
                  <div style={{ display: "flex", gap: 1 }}>
                    {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={10} color={C.gold} fill={i < rv.rating ? C.gold : "none"} />)}
                  </div>
                </div>
                <p style={{ fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.6, margin: 0 }}>{rv.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Actions — full width and stacked on tablet/mobile */}
        <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 12, paddingTop: 8 }}>
          <motion.button
            whileHover={{ opacity: 0.88 }} whileTap={{ scale: 0.98 }}
            onClick={handleSelect}
            style={{ flex: 1, width: isDesktop ? "auto" : "100%", background: C.gold, color: "#fff", border: "none", borderRadius: C.radius, padding: "13px 0", fontSize: "0.88rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Select This Mentor
          </motion.button>
          <button
            onClick={() => navigate(`/growth-paths/${p.id}/mentors`)}
            style={{ width: isDesktop ? "auto" : "100%", background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: C.radius, padding: "13px 22px", fontSize: "0.84rem", fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
          >
            Back to Mentors
          </button>
        </div>
      </div>
    </div>
  );
}
