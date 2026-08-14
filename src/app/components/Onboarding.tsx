import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Code2, Cpu, Palette, TrendingUp, MessageSquare, Rocket,
  ArrowLeft, ArrowRight, Check, X, Star, Clock, Target, Users,
} from "lucide-react";
import type { UserProfile } from "../types";
import { GOAL_META } from "../types";
import { CountrySelect } from "./CountrySelect";

/* ─── Data ─────────────────────────────────────── */

const GOALS = [
  { id: "coding",  title: "Coding",          Icon: Code2,         color: "#6366F1", desc: "Python, JS, Web Dev"       },
  { id: "ai",      title: "AI & ML",          Icon: Cpu,           color: "#8B5CF6", desc: "Machine Learning, Data"    },
  { id: "uiux",    title: "UI/UX Design",     Icon: Palette,       color: "#EC4899", desc: "Figma, Design Systems"     },
  { id: "finance", title: "Finance",          Icon: TrendingUp,    color: "#10B981", desc: "Investing, Wealth"          },
  { id: "comms",   title: "Communication",    Icon: MessageSquare, color: "#F59E0B", desc: "Leadership, Speaking"       },
  { id: "startup", title: "Entrepreneurship", Icon: Rocket,        color: "#F97316", desc: "Startup, Product"           },
];

const LEVELS = [
  { id: "beginner",     label: "Just Starting",   desc: "New to this area"          },
  { id: "intermediate", label: "Building Skills",  desc: "I know the basics"         },
  { id: "advanced",     label: "Going Deeper",     desc: "Ready for real challenges" },
];

const TIMES = [
  { id: "15min", label: "15–30 min", desc: "Light & consistent" },
  { id: "30min", label: "30–60 min", desc: "Steady progress"    },
  { id: "1hr",   label: "1–2 hours", desc: "Fast growth"        },
  { id: "2hr",   label: "2+ hours",  desc: "Accelerated path"   },
];

const PREFS = [
  { id: "mentorship", label: "Expert Mentorship",         desc: "1-on-1 sessions with industry professionals"        },
  { id: "roadmap",    label: "Structured Roadmap",         desc: "Clear milestones and AI-curated content"            },
  { id: "community",  label: "Community & Accountability", desc: "Peers, challenges, and group accountability"        },
];

const LANGUAGES: { id: "English" | "Hindi" | "Both"; label: string; desc: string }[] = [
  { id: "English", label: "English",          desc: "Lessons and videos in English" },
  { id: "Hindi",   label: "Hindi",             desc: "Prioritize Hindi-taught creators" },
  { id: "Both",    label: "Both",              desc: "Mix of Hindi and English content" },
];

const OBSTACLES = [
  { id: "structure",   label: "Lack of Structure",   desc: "I don't know what to study or in what order" },
  { id: "mentorship",  label: "Expert Guidance",    desc: "I need feedback from professionals in the field" },
  { id: "consistency", label: "Accountability",     desc: "I struggle to stay motivated and consistent alone" },
  { id: "practice",    label: "Real-world Practice", desc: "I want hands-on, portfolio-building projects" },
];

const LOADING_MSGS = [
  "Building your personalized roadmap...",
  "Matching you with mentors...",
  "Creating your daily learning plan...",
  "Finding opportunities...",
];

/* ─── Types ─────────────────────────────────────── */

type Phase = "steps" | "loading" | "welcome";

/* ─── Colors ────────────────────────────────────── */

const BG   = "#050510";
const GOLD = "#D4AF37";
const TEXT = "#FAF9F6";
const MUTED = "rgba(250,249,246,0.45)";
const FAINT = "rgba(250,249,246,0.18)";


/* ─── Ambient stars canvas ───────────────────────── */

function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);
    const pts = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.3 + Math.random() * 0.8,
      op: 0.05 + Math.random() * 0.2,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 0.8,
    }));
    let raf: number, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;
      pts.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${p.op * (0.4 + 0.6 * Math.sin(t * p.sp + p.ph))})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
    />
  );
}

/* ─── Option card ────────────────────────────────── */

function OptionCard({
  selected,
  onClick,
  children,
}: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: selected
          ? "rgba(212,175,55,0.12)"
          : hover ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? "rgba(212,175,55,0.55)" : `rgba(255,255,255,${hover ? "0.14" : "0.09"})`}`,
        borderRadius: 10,
        padding: "18px 20px",
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        fontFamily: "'Inter', sans-serif",
        transform: hover && !selected ? "translateY(-1px)" : "none",
        transition: "all 0.18s ease",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main component ─────────────────────────────── */

export function Onboarding({
  onComplete,
  onClose,
  onOpenLogin,
}: {
  onComplete: (p: UserProfile) => void;
  onClose?: () => void;
  onOpenLogin?: () => void;
}) {
  const [phase,      setPhase]      = useState<Phase>("steps");
  const [step,       setStep]       = useState(0);
  const [msgIdx,     setMsgIdx]     = useState(0);
  const [msgVisible, setMsgVisible] = useState(true);
  const [goalId,     setGoalId]     = useState("");
  const [level,      setLevel]      = useState("");
  const [obstacle,   setObstacle]   = useState("");
  const [dailyTime,  setDailyTime]  = useState("");
  const [preference, setPreference] = useState("");
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [country,    setCountry]    = useState("");
  const [language,   setLanguage]   = useState<"English" | "Hindi" | "Both" | "">("");
  const [careerGoal, setCareerGoal] = useState("");

  const TOTAL = 7;

  /* Loading sequence - ~3.5 seconds total */
  useEffect(() => {
    if (phase !== "loading") return;
    let idx = 0;
    const advance = () => {
      setMsgVisible(false);
      setTimeout(() => {
        idx++;
        if (idx >= LOADING_MSGS.length) { setPhase("welcome"); return; }
        setMsgIdx(idx);
        setMsgVisible(true);
        setTimeout(advance, 800); // 800ms display time
      }, 200); // 200ms fade transition
    };
    const t = setTimeout(advance, 800);
    return () => clearTimeout(t);
  }, [phase]);

  const canContinue = () => {
    if (step === 0) return !!goalId;
    if (step === 1) return !!level;
    if (step === 2) return !!obstacle;
    if (step === 3) return !!dailyTime;
    if (step === 4) return !!preference;
    if (step === 5) return !!country && !!language;
    if (step === 6) return name.trim().length > 1 && email.includes("@");
    return false;
  };

  const handleContinue = () => {
    if (!canContinue()) return;
    if (step < TOTAL - 1) { setStep(s => s + 1); return; }
    setPhase("loading");
    setMsgIdx(0);
    setMsgVisible(true);
  };

  const goalMeta    = GOAL_META[goalId] || GOAL_META["coding"];
  const goalDisplay = GOALS.find(g => g.id === goalId);

  const buildProfile = (): UserProfile => ({
    name, email, goalId,
    goalTitle:  goalMeta.title,
    level:      (level || "beginner") as UserProfile["level"],
    dailyTime:  dailyTime || "30min",
    preference: (preference || "roadmap") as UserProfile["preference"],
    obstacle:   obstacle,
    country:          country || undefined,
    learningLanguage: (language || undefined) as UserProfile["learningLanguage"],
    careerGoal:       careerGoal.trim() || undefined,
  });

  /* ═══════════════════════════════ LOADING PHASE ═══════════════════════════ */
  if (phase === "loading") {
    return (
      <motion.div
        key="loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: BG,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", fontFamily: "'Inter', sans-serif",
        }}
      >
        <Stars />
        <div style={{ position: "relative", zIndex: 1, textAlign: "center", maxWidth: 420, padding: "0 28px" }}>

          {/* Pulsing rings */}
          <div style={{ position: "relative", width: 88, height: 88, margin: "0 auto 52px" }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ opacity: 1 }}
                animate={{
                  scale:   [1, 1.6 + i * 0.35, 1],
                  opacity: [0.45 - i * 0.1, 0, 0.45 - i * 0.1],
                }}
                transition={{ duration: 2.2, delay: i * 0.55, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `1px solid rgba(212,175,55,${0.5 - i * 0.12})`,
                }}
              />
            ))}
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Star size={26} color={GOLD} fill={GOLD} />
            </div>
          </div>

          <div style={{
            fontSize: "0.62rem", letterSpacing: "0.22em",
            color: "rgba(212,175,55,0.6)", textTransform: "uppercase",
            marginBottom: 20, fontWeight: 600,
          }}>
            Starfix AI
          </div>

          <AnimatePresence mode="wait">
            {msgVisible && (
              <motion.p
                key={msgIdx}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                style={{ fontSize: "1.05rem", color: TEXT, fontWeight: 300, lineHeight: 1.7, margin: 0 }}
              >
                {LOADING_MSGS[msgIdx]}
              </motion.p>
            )}
          </AnimatePresence>

          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 40 }}>
            {LOADING_MSGS.map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1 }}
                animate={{ opacity: i <= msgIdx ? 1 : 0.2, scale: i === msgIdx ? 1.3 : 1 }}
                transition={{ duration: 0.25 }}
                style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: i <= msgIdx ? GOLD : "rgba(255,255,255,0.18)",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════ WELCOME PHASE ═══════════════════════════ */
  if (phase === "welcome") {
    const m = goalDisplay;
    const timeLabelMap: Record<string, string> = {
      "15min": "15–30 min / day",
      "30min": "30–60 min / day",
      "1hr":   "1–2 hours / day",
      "2hr":   "2+ hours / day",
    };
    const levelLabelMap: Record<string, string> = {
      beginner:     "Foundations track",
      intermediate: "Core skills track",
      advanced:     "Advanced projects track",
    };

    return (
      <motion.div
        key="welcome"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "fixed", inset: 0, zIndex: 100,
          background: BG, overflowY: "auto",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <Stars />
        <div style={{
          position: "relative", zIndex: 1,
          maxWidth: 620, margin: "0 auto",
          padding: "60px 28px 80px",
        }}>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              background: "rgba(212,175,55,0.1)",
              border: "1px solid rgba(212,175,55,0.28)",
              borderRadius: 99, padding: "5px 14px",
              marginBottom: 32,
            }}
          >
            <Star size={10} color={GOLD} fill={GOLD} />
            <span style={{ fontSize: "0.67rem", color: GOLD, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
              AI Personalized for You
            </span>
          </motion.div>

          {/* Greeting */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
              color: TEXT, margin: "0 0 12px",
              letterSpacing: "-0.025em", lineHeight: 1.1,
            }}
          >
            Your journey begins,<br />
            <span style={{
              background: "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 40%, #D4AF37 100%)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              {name.trim().split(" ")[0]}.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.26 }}
            style={{ fontSize: "0.9rem", color: MUTED, marginBottom: 48, lineHeight: 1.75, maxWidth: "50ch" }}
          >
            We built this roadmap around your answers. Here's exactly what your first 90 days look like.
          </motion.p>

          {/* Primary goal card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${goalMeta.color}30`,
              borderLeft: `3px solid ${goalMeta.color}`,
              borderRadius: 12, padding: "22px 24px",
              marginBottom: 20,
              display: "flex", alignItems: "center", gap: 18,
            }}
          >
            {m && (
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: `${m.color}16`,
                border: `1px solid ${m.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <m.Icon size={22} color={m.color} />
              </div>
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.12em", color: GOLD, fontWeight: 600, marginBottom: 5 }}>
                Primary Goal
              </div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: TEXT }}>{goalMeta.title}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: "0.6rem", color: FAINT, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Est. timeline</div>
              <div style={{ fontSize: "1rem", fontWeight: 700, color: goalMeta.color }}>{goalMeta.timeline}</div>
            </div>
          </motion.div>

          {/* 3-col stats */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 24 }}
          >
            {([
              { Icon: Users, label: "Matched Mentor", value: goalMeta.mentor.name, sub: goalMeta.mentor.role.split("·")[0].trim() },
              { Icon: Clock, label: "Daily Study",    value: timeLabelMap[dailyTime] || "30–60 min / day", sub: "personalised schedule" },
              { Icon: Target, label: "Track",         value: levelLabelMap[level] || "Foundations track", sub: level || "beginner" },
            ] as const).map(({ Icon, label, value, sub }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "16px 14px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Icon size={11} color="rgba(212,175,55,0.65)" />
                  <span style={{ fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.12em", color: FAINT }}>
                    {label}
                  </span>
                </div>
                <div style={{ fontSize: "0.84rem", fontWeight: 600, color: TEXT, lineHeight: 1.35, marginBottom: 3 }}>{value}</div>
                <div style={{ fontSize: "0.66rem", color: MUTED }}>{sub}</div>
              </div>
            ))}
          </motion.div>

          {/* First milestone */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48 }}
            style={{
              background: `${goalMeta.color}0D`,
              border: `1px solid ${goalMeta.color}25`,
              borderRadius: 10, padding: "18px 20px",
              marginBottom: 24, display: "flex", alignItems: "flex-start", gap: 14,
            }}
          >
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: `${goalMeta.color}22`,
              border: `1px solid ${goalMeta.color}45`,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 1,
            }}>
              <span style={{ fontSize: "0.64rem", fontWeight: 800, color: goalMeta.color }}>1</span>
            </div>
            <div>
              <div style={{ fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.12em", color: goalMeta.color, fontWeight: 700, marginBottom: 5 }}>
                Your First Milestone
              </div>
              <div style={{ fontSize: "0.9rem", fontWeight: 500, color: TEXT, lineHeight: 1.45 }}>
                {goalMeta.milestone}
              </div>
            </div>
          </motion.div>

          {/* Daily plan */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            style={{ marginBottom: 52 }}
          >
            <div style={{
              fontSize: "0.6rem", textTransform: "uppercase", letterSpacing: "0.14em",
              color: FAINT, marginBottom: 14, fontWeight: 600,
            }}>
              Daily Study Plan
            </div>
            {goalMeta.dailyPlan.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 13,
                padding: "12px 0",
                borderBottom: i < goalMeta.dailyPlan.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "rgba(212,175,55,0.14)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Check size={10} color={GOLD} />
                </div>
                <span style={{ fontSize: "0.85rem", color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            style={{ textAlign: "center" }}
          >
            <motion.button
              initial={{ opacity: 1 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onComplete(buildProfile())}
              style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)",
                color: "#07060f",
                border: "none", borderRadius: 99,
                padding: "16px 40px",
                fontSize: "1rem", fontWeight: 700,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
                boxShadow: "0 0 48px rgba(212,175,55,0.42)",
                letterSpacing: "-0.01em",
              }}
            >
              Begin My Journey <ArrowRight size={17} />
            </motion.button>
            <p style={{ fontSize: "0.7rem", color: FAINT, marginTop: 14, letterSpacing: "0.05em" }}>
              Free to start · No credit card required
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  /* ═══════════════════════════════ STEPS PHASE ════════════════════════════ */

  const stepContent = () => {
    switch (step) {
      /* ── Step 0: Goal ── */
      case 0: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Your starting point
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            What do you want to master?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            Your entire experience will be shaped around this. Choose the one that matters most right now.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {GOALS.map(({ id, title, Icon, color, desc }) => (
              <OptionCard key={id} selected={goalId === id} onClick={() => setGoalId(id)}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Icon size={16} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.88rem", fontWeight: 600, color: TEXT, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: "0.7rem", color: MUTED }}>{desc}</div>
                  </div>
                  {goalId === id && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={10} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>
        </div>
      );

      /* ── Step 1: Level ── */
      case 1: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Your starting point
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Where are you right now?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            Be honest — we calibrate your plan exactly to your current level.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {LEVELS.map(({ id, label, desc }) => (
              <OptionCard key={id} selected={level === id} onClick={() => setLevel(id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.96rem", fontWeight: 600, color: TEXT, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: "0.74rem", color: MUTED }}>{desc}</div>
                  </div>
                  {level === id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={11} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>
        </div>
      );

      /* ── Step 2: Focus / Biggest Obstacle ── */
      case 2: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Your Focus
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            What is your biggest obstacle?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            We customize your roadmap to help you overcome this barrier.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {OBSTACLES.map(({ id, label, desc }) => (
              <OptionCard key={id} selected={obstacle === id} onClick={() => setObstacle(id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.96rem", fontWeight: 600, color: TEXT, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: "0.74rem", color: MUTED }}>{desc}</div>
                  </div>
                  {obstacle === id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={11} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>
        </div>
      );

      /* ── Step 3: Daily time ── */
      case 3: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Daily investment
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            How much time can you commit daily?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            Even 15 minutes of focused practice creates compound growth over 90 days.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {TIMES.map(({ id, label, desc }) => (
              <OptionCard key={id} selected={dailyTime === id} onClick={() => setDailyTime(id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "1rem", fontWeight: 700, color: TEXT, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: "0.72rem", color: MUTED }}>{desc}</div>
                  </div>
                  {dailyTime === id && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={9} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>
        </div>
      );

      /* ── Step 4: Preference ── */
      case 4: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Learning style
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            What drives your success?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            We weight your experience toward what actually works for you.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PREFS.map(({ id, label, desc }) => (
              <OptionCard key={id} selected={preference === id} onClick={() => setPreference(id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ flex: 1, paddingRight: preference === id ? 12 : 0 }}>
                    <div style={{ fontSize: "0.96rem", fontWeight: 600, color: TEXT, marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: "0.74rem", color: MUTED, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                  {preference === id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={11} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>
        </div>
      );

      /* ── Step 5: Country + Language + Career Goal (drives content curation) ── */
      case 5: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Personalize your content
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Where are you learning from?
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 28, lineHeight: 1.75 }}>
            We use this to recommend the most trusted, high-quality creators for your region and language.
          </p>

          <label style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: FAINT, marginBottom: 10, fontWeight: 600 }}>
            Country
          </label>
          <div style={{ marginBottom: 26 }}>
            <CountrySelect value={country} onChange={setCountry} placeholder="Search 195 countries…" />
          </div>

          <label style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: FAINT, marginBottom: 10, fontWeight: 600 }}>
            Preferred learning language
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 26 }}>
            {LANGUAGES.map(({ id, label, desc }) => (
              <OptionCard key={id} selected={language === id} onClick={() => setLanguage(id)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 600, color: TEXT, marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: "0.72rem", color: MUTED }}>{desc}</div>
                  </div>
                  {language === id && (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: GOLD, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={10} color="#000" strokeWidth={3} />
                    </div>
                  )}
                </div>
              </OptionCard>
            ))}
          </div>

          <label style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: FAINT, marginBottom: 10, fontWeight: 600 }}>
            Career goal <span style={{ textTransform: "none", letterSpacing: 0, color: MUTED, fontWeight: 400 }}>(optional)</span>
          </label>
          <input
            type="text"
            value={careerGoal}
            placeholder="e.g. Land a junior developer role"
            onChange={(e) => setCareerGoal(e.target.value)}
            style={{
              width: "100%", padding: "13px 16px",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${careerGoal.length > 1 ? "rgba(212,175,55,0.42)" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 8, color: TEXT,
              fontSize: "0.92rem", outline: "none",
              fontFamily: "'Inter', sans-serif",
              boxSizing: "border-box",
            }}
          />
        </div>
      );

      /* ── Step 6: Account ── */
      case 6: return (
        <div>
          <div style={{ marginBottom: 10, fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(212,175,55,0.7)", fontWeight: 600 }}>
            Almost there
          </div>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.9rem, 4.5vw, 2.7rem)", color: TEXT, margin: "0 0 10px", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
            Create your account
          </h2>
          <p style={{ fontSize: "0.88rem", color: MUTED, marginBottom: 32, lineHeight: 1.75 }}>
            Free to start. Your personalized roadmap will be waiting inside.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              { label: "Full Name",    value: name,  placeholder: "Khushi Agarwal",  type: "text",  setter: setName  },
              { label: "Email",        value: email, placeholder: "you@example.com", type: "email", setter: setEmail },
            ].map(({ label, value, placeholder, type, setter }) => (
              <div key={label}>
                <label style={{ display: "block", fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: FAINT, marginBottom: 8, fontWeight: 600 }}>
                  {label}
                </label>
                <input
                  type={type}
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setter(e.target.value)}
                  style={{
                    width: "100%", padding: "13px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: `1px solid ${value.length > 1 ? "rgba(212,175,55,0.42)" : "rgba(255,255,255,0.12)"}`,
                    borderRadius: 8, color: TEXT,
                    fontSize: "0.92rem", outline: "none",
                    fontFamily: "'Inter', sans-serif",
                    boxSizing: "border-box",
                    transition: "border-color 0.18s",
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.65)"; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = value.length > 1 ? "rgba(212,175,55,0.42)" : "rgba(255,255,255,0.12)"; }}
                />
              </div>
            ))}
            <p style={{ fontSize: "0.7rem", color: FAINT, lineHeight: 1.65 }}>
              By continuing you agree to our terms of service. No credit card required.
            </p>
          </div>
        </div>
      );

      default: return null;
    }
  };

  return (
    <motion.div
      key="steps"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: BG, overflowY: "auto",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Stars />

      {/* Header */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 28px",
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>
          Starfix
        </span>
        <span style={{ fontSize: "0.72rem", color: FAINT, letterSpacing: "0.06em" }}>
          {step + 1} / {TOTAL}
        </span>
        <button
          onClick={onClose}
          title="Close"
          style={{ background: "none", border: "none", cursor: "pointer", color: FAINT, padding: 4, display: "flex", transition: "color 0.15s" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.5)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = FAINT; }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ position: "relative", zIndex: 1, height: 2, background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          initial={{ opacity: 1, width: `${(step / TOTAL) * 100}%` }}
          animate={{ width: `${((step + 1) / TOTAL) * 100}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ height: "100%", background: `linear-gradient(90deg, ${GOLD}, #F4D67A)` }}
        />
      </div>

      {/* Step content */}
      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "52px 28px 28px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {stepContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div style={{
        position: "relative", zIndex: 1,
        maxWidth: 560, margin: "0 auto",
        padding: "8px 28px 28px",
        display: "flex", alignItems: "center",
        justifyContent: step === 0 ? "flex-end" : "space-between",
      }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "none", border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 99, padding: "10px 20px",
              color: MUTED, fontSize: "0.84rem", cursor: "pointer",
              fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(255,255,255,0.3)"; b.style.color = TEXT;
            }}
            onMouseLeave={(e) => {
              const b = e.currentTarget as HTMLButtonElement;
              b.style.borderColor = "rgba(255,255,255,0.14)"; b.style.color = MUTED;
            }}
          >
            <ArrowLeft size={14} /> Back
          </button>
        )}

        <button
          onClick={handleContinue}
          disabled={!canContinue()}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: canContinue() ? "linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)" : "rgba(255,255,255,0.07)",
            color: canContinue() ? "#07060f" : "rgba(255,255,255,0.28)",
            border: "none", borderRadius: 99,
            padding: "11px 28px",
            fontSize: "0.9rem", fontWeight: 700,
            cursor: canContinue() ? "pointer" : "not-allowed",
            fontFamily: "'Inter', sans-serif",
            transition: "all 0.2s",
            boxShadow: canContinue() ? "0 0 30px rgba(212,175,55,0.32)" : "none",
          }}
        >
          {step === TOTAL - 1 ? "Build My Roadmap" : "Continue"} <ArrowRight size={15} />
        </button>
      </div>

      {phase === "steps" && onOpenLogin && (
        <div style={{ textAlign: "center", marginTop: 0, paddingBottom: 60, position: "relative", zIndex: 1 }}>
          <button
            onClick={onOpenLogin}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: MUTED,
              fontSize: "0.78rem",
              fontFamily: "'Inter', sans-serif",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = MUTED; }}
          >
            Already a member? <span style={{ fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>Sign In</span>
          </button>
        </div>
      )}
    </motion.div>
  );
}
