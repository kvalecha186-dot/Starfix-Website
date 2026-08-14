import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Star, ChevronDown,
  Check, Clock, Users, Flame, Target, Play, BookOpen,
} from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import { isEnrolled } from "../../lib/pathProgress";
import {
  PATHS, statsFor, WEEK_BANDS, CURATED_STACKS, fallbackStack,
  type PathDef, type ResourceStack, type CuratedResource,
} from "./GoalsPage";

/* ─────────────────────────────────────────────────────────────────────────
   /growth-paths/:pathId — THE canonical, premium overview page for every
   single Growth Path (Coding, Communication, AI, Meditation, ...). This is
   the one and only overview page in the app: the old /paths/:pathId route
   (PathOverviewPage.tsx) has been retired and nothing links to it anymore.

   This is a straight extraction of what used to be GoalsPage's in-page
   PathDetailView — same exact JSX, same design, same content — just
   promoted to a real routed page so "Back to Path Overview" from the
   journey page (and browser Back generally) can reach it deterministically
   instead of sometimes landing on the old page.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

const PHASE_FILL = [2, 4, 5, 7, 8];

function ResourceCard({ label, Icon, r, color }: { label: string; Icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; r: CuratedResource; color: string }) {
  return (
    <motion.a
      href={r.url}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      style={{
        display: "block",
        textDecoration: "none",
        borderRadius: C.radius,
        border: `1px solid ${C.border}`,
        background: C.surface,
        boxShadow: C.shadow,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "20px 22px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ ...LABEL, color }}>{label}</span>
        <span
          style={{
            fontSize: "0.6rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "3px 9px",
            borderRadius: 20,
            color: r.badge === "Video" ? C.gold : C.textMuted,
            border: `1px solid ${r.badge === "Video" ? C.goldBorder : C.borderMuted}`,
            background: r.badge === "Video" ? C.goldLight : C.surfaceAlt,
            flexShrink: 0,
          }}
        >
          {r.badge}
        </span>
      </div>

      <div style={{ margin: "14px 22px 0", height: 88, borderRadius: C.radiusSm, background: `${color}0F`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={26} color={color} strokeWidth={1.6} />
      </div>

      <div style={{ padding: "16px 22px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.68rem", color: C.textFaint, marginBottom: 8 }}>
          <Clock size={11} />
          <span>{r.duration}</span>
          <span>·</span>
          <span>{r.source}</span>
        </div>
        <div style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text, lineHeight: 1.35, marginBottom: 6 }}>{r.title}</div>
        <p style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.6, margin: "0 0 16px" }}>{r.description}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", fontWeight: 600, color: C.text }}>
          {r.cta}
          <ArrowUpRight size={13} />
        </div>
      </div>
    </motion.a>
  );
}

function DotRow({ filled, total = 8, color }: { filled: number; total?: number; color: string }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{ width: 12, height: 12, borderRadius: 3, background: i < filled ? color : C.borderMuted }} />
      ))}
    </div>
  );
}

function NotFound() {
  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
      <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Growth Path not found</span>
      <Link to="/growth-paths" style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to Growth Paths</Link>
    </div>
  );
}

export function GrowthPathOverviewPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const { isDesktop, isMobile } = useViewport();
  const p = PATHS.find((x) => x.id === pathId);

  if (!p) return <NotFound />;

  return <Overview p={p} navigate={navigate} isDesktop={isDesktop} isMobile={isMobile} />;
}

function Overview({ p, navigate, isDesktop, isMobile }: {
  p: PathDef;
  navigate: ReturnType<typeof useNavigate>;
  isDesktop: boolean;
  isMobile: boolean;
}) {
  const enrolled = isEnrolled(p.id);
  const [openWeek, setOpenWeek] = useState<number | null>(0);
  const s = statsFor(p);
  const isCareer = p.group === "Career & Tech";
  const goToJourney = () => navigate(`/growth-paths/${p.id}/journey`);

  // Explicit route only — no navigate(-1)/history.back. "Back" from the
  // overview always means "the Growth Paths listing", which lives at /growth-paths.
  const handleBack = () => navigate("/growth-paths");

  const stack = CURATED_STACKS[p.id] ?? fallbackStack(p);

  const previewMentors = [
    { name: p.title.split(" ")[0].slice(0, 1) + ". Rao", role: p.mentorLabel.replace(/s$/, ""), years: 6 },
    { name: "R. Verma", role: p.mentorLabel.replace(/s$/, ""), years: 8 },
    { name: "S. Iyer", role: p.mentorLabel.replace(/s$/, ""), years: 4 },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{
        padding: isDesktop ? "28px 48px 0" : "14px 16px",
        position: isDesktop ? "static" : "sticky", top: 0, zIndex: 5,
        background: isDesktop ? "transparent" : C.bg,
        borderBottom: isDesktop ? "none" : `1px solid ${C.border}`,
      }}>
        <motion.button
          whileHover={{ x: -3 }}
          onClick={handleBack}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: "0.8rem", padding: 0, fontFamily: "'Inter', sans-serif" }}
        >
          <ArrowLeft size={14} /> Back
        </motion.button>
      </div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} key={p.id} style={{ padding: isDesktop ? "24px 48px 40px" : "20px 16px 28px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "120px 1fr" : "1fr", gap: isDesktop ? 28 : 16, alignItems: isDesktop ? "center" : "start", textAlign: isDesktop ? "left" : "center" }}>
          <div style={{ width: 120, height: 120, borderRadius: 28, background: `linear-gradient(155deg, ${p.color}26, ${p.color}08)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, margin: isDesktop ? 0 : "0 auto" }}>
            <p.Icon size={48} color={p.color} strokeWidth={1.5} />
          </div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isMobile ? "1.6rem" : isDesktop ? "2.2rem" : "1.9rem", fontWeight: 700, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{p.title}</h1>
            <p style={{ fontSize: "0.9rem", color: C.textMuted, margin: "0 0 16px", maxWidth: "56ch" }}>{p.desc}</p>
            <div style={{ display: "flex", alignItems: "center", justifyContent: isDesktop ? "flex-start" : "center", gap: 18, flexWrap: "wrap", fontSize: "0.78rem", color: C.textMuted, marginBottom: 20 }}>
              <span>{s.difficulty}</span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {s.duration}</span>
              <span>·</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Star size={12} color={C.gold} fill={C.gold} /> {s.rating}</span>
              <span>·</span>
              <span>{s.learners.toLocaleString()} learners</span>
            </div>
            <motion.button
              whileHover={{ opacity: 0.9 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToJourney}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, background: C.gold, color: "#fff", border: "none",
                borderRadius: C.radius, padding: "12px 26px", fontSize: "0.86rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              {enrolled ? <>Continue Journey <ArrowRight size={14} /></> : <>Start Journey <ArrowRight size={14} /></>}
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Overview */}
      <div style={{ padding: isDesktop ? "40px 48px" : "28px 16px", borderBottom: `1px solid ${C.border}`, display: "grid", gridTemplateColumns: isDesktop ? (isCareer ? "repeat(4, 1fr)" : "repeat(3, 1fr)") : isMobile ? "1fr" : "repeat(2, 1fr)", gap: isDesktop ? 32 : 22 }}>
        <div>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Who it's for</span>
          <p style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.65, margin: 0 }}>
            Anyone starting fresh in {p.title.toLowerCase()} — no prior experience required, just consistency.
          </p>
        </div>
        <div>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>What you'll achieve</span>
          <p style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.65, margin: 0 }}>
            Real ability across {p.modules[0].toLowerCase()}, {p.modules[1].toLowerCase()}, and {p.modules[3].toLowerCase()}.
          </p>
        </div>
        <div>
          <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Expected outcome</span>
          <p style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.65, margin: 0 }}>
            The confidence to keep progressing in {p.title.toLowerCase()} independently, long after this path ends.
          </p>
        </div>
        {isCareer && (
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 10 }}>Career opportunities</span>
            <p style={{ fontSize: "0.84rem", color: C.textMuted, lineHeight: 1.65, margin: 0 }}>
              Opens doors to roles worked by {p.mentorLabel.toLowerCase()} and similar teams.
            </p>
          </div>
        )}
      </div>

      {/* Roadmap — built directly from this path's own 5 modules */}
      <div style={{ padding: isDesktop ? "40px 48px" : "28px 16px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.35rem" : "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 26px" }}>Roadmap</h2>
        <div style={{ maxWidth: 640 }}>
          {p.modules.map((mod, i) => (
            <div key={mod} style={{ display: "flex", gap: 16, paddingBottom: i < p.modules.length - 1 ? 26 : 0 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                {i < p.modules.length - 1 && <div style={{ width: 1, flex: 1, minHeight: 40, background: C.borderMuted, marginTop: 4 }} />}
              </div>
              <div style={{ paddingTop: 1 }}>
                <span style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, color: C.textFaint }}>Phase {i + 1} · {WEEK_BANDS[i]}</span>
                <div style={{ fontSize: "0.94rem", fontWeight: 600, color: C.text, margin: "3px 0 9px" }}>{mod}</div>
                <DotRow filled={PHASE_FILL[i]} color={p.color} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly Learning Plan — accordion per module */}
      <div style={{ padding: isDesktop ? "40px 48px" : "28px 16px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.35rem" : "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 22px" }}>Weekly Learning Plan</h2>
        <div style={{ maxWidth: 680 }}>
          {p.modules.map((mod, i) => {
            const open = openWeek === i;
            return (
              <div key={mod} style={{ borderBottom: `1px solid ${C.borderMuted}` }}>
                <button
                  onClick={() => setOpenWeek(open ? null : i)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", padding: "16px 0", cursor: "pointer", textAlign: "left", fontFamily: "'Inter', sans-serif" }}
                >
                  <div>
                    <div style={{ fontSize: "0.68rem", color: C.textFaint, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{WEEK_BANDS[i]}</div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text }}>{mod}</div>
                  </div>
                  <ChevronDown size={15} color={C.textFaint} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                <AnimatePresence>
                  {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }} style={{ overflow: "hidden" }}>
                      <div style={{ paddingBottom: 18, display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 20 }}>
                        <div>
                          <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Objectives & Tasks</span>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.9 }}>
                            <li>Learn the core concepts of {mod.toLowerCase()}</li>
                            <li>Complete a hands-on {mod.toLowerCase()} exercise</li>
                            <li>Apply it to a small real task in {p.title.toLowerCase()}</li>
                          </ul>
                        </div>
                        <div>
                          <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Resources & Time</span>
                          <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.8rem", color: C.textMuted, lineHeight: 1.9 }}>
                            <li>1 curated video + 1 article on {mod.toLowerCase()}</li>
                            <li>Daily habit check-in</li>
                            <li>Est. 4–6 hrs of study this phase</li>
                          </ul>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Curated Resources — real, path-specific learning stack */}
      <div style={{ padding: isDesktop ? "40px 48px" : "28px 16px", borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.35rem" : "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 8px" }}>Curated Resources</h2>
            <p style={{ fontSize: "0.82rem", color: C.textMuted, margin: 0 }}>Only the essentials for {p.title.toLowerCase()} — a focused stack, not a library.</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: 20, maxWidth: 920 }}>
          <ResourceCard label="Start Here" Icon={Play} r={stack.start} color={p.color} />
          <ResourceCard label="Go Deeper" Icon={BookOpen} r={stack.deeper} color={p.color} />
          <ResourceCard label="Practice With This" Icon={Target} r={stack.practice} color={p.color} />
          <ResourceCard label="Community" Icon={Users} r={stack.community} color={p.color} />
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: isDesktop ? "40px 48px" : "28px 16px", borderBottom: `1px solid ${C.border}` }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.35rem" : "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 22px" }}>Progress</h2>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(4, 1fr)" : "repeat(2, 1fr)", gap: isDesktop ? 24 : 18, maxWidth: 760, marginBottom: 22 }}>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Completion</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: p.color }}>{enrolled ? "12%" : "0%"}</div>
          </div>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Milestones</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: C.text }}>{enrolled ? "1" : "0"}<span style={{ fontSize: "0.9rem", color: C.textFaint, fontWeight: 400 }}> / 5</span></div>
          </div>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Achievements</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: C.text }}>{enrolled ? "1" : "0"}</div>
          </div>
          <div>
            <span style={{ ...LABEL, display: "block", marginBottom: 8 }}>Current streak</span>
            <div style={{ fontSize: "1.6rem", fontWeight: 700, color: C.gold, display: "flex", alignItems: "center", gap: 6 }}>
              <Flame size={16} /> {enrolled ? "1" : "0"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 420 }}>
          {p.modules.map((mod, i) => (
            <div key={mod} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {enrolled && i === 0 ? <Check size={13} color={p.color} /> : <div style={{ width: 13, height: 13, borderRadius: "50%", border: `1.5px solid ${C.borderMuted}`, flexShrink: 0 }} />}
              <span style={{ fontSize: "0.78rem", color: enrolled && i === 0 ? C.text : C.textMuted }}>Master {mod}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Mentors — only this path's specialization */}
      <div style={{ padding: isDesktop ? "40px 48px 56px" : "28px 16px 40px" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.35rem" : "1.15rem", fontWeight: 700, color: C.text, margin: "0 0 6px" }}>Need expert guidance?</h2>
        <p style={{ fontSize: "0.84rem", color: C.textMuted, margin: "0 0 26px" }}>Learn faster with {p.mentorLabel.toLowerCase()} specialized in {p.title}.</p>

        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: 20, marginBottom: 28 }}>
          {previewMentors.map((m, i) => (
            <div key={i} style={{ padding: 18, borderRadius: C.radius, border: `1px solid ${C.border}`, background: C.surface }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${p.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.74rem", fontWeight: 700, color: p.color, flexShrink: 0, fontFamily: "'Playfair Display', serif" }}>
                  {m.name.slice(0, 2)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text }}>{m.name}</div>
                  <div style={{ fontSize: "0.68rem", color: C.textMuted }}>{m.role}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.7rem", color: C.textMuted, marginBottom: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={10} color={C.gold} fill={C.gold} /> 4.{7 + (i % 3)}</span>
                <span>·</span>
                <span>{m.years} yrs exp</span>
                <span>·</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.modules[i % p.modules.length]}</span>
              </div>
              <button style={{ width: "100%", padding: "8px 0", borderRadius: C.radiusSm, border: `1px solid ${C.border}`, background: "transparent", fontSize: "0.76rem", fontWeight: 500, color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Book Session
              </button>
            </div>
          ))}
        </div>

        <motion.button
          whileHover={{ opacity: 0.88 }}
          onClick={() => navigate(`/growth-paths/${p.id}/mentors`)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%",
            background: C.surfaceAlt, color: C.text, border: `1px solid ${C.border}`, borderRadius: C.radius,
            padding: "14px 0", fontSize: "0.86rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          View All Mentors <ArrowRight size={14} />
        </motion.button>
      </div>
    </div>
  );
}
