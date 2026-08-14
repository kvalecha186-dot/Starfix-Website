/**
 * StarJourney — "Your Star Journey" section.
 *
 * Animation contract:
 * - Does NOT start on page load.
 * - Starts once when ≥50 % of this section enters the viewport
 *   (IntersectionObserver, threshold: 0.5).
 * - Plays once per page load; never replays on re-scroll.
 * - Total sequence: ~5 s. ~1 s per star.
 * - Soft gold energy beam travels left→right along the track.
 * - Each star illuminates smoothly (no flash, no scaling).
 * - The connector line fills gold as the beam passes.
 * - Transformation star holds the strongest glow.
 */

import { motion, AnimatePresence, useInView } from "motion/react";
import { useRef, useState, useEffect } from "react";

const STEPS = [
  {
    n: 1,
    label: "Discover",
    sub: "Map where you stand",
    desc: "An AI-powered assessment reads your strengths, blind spots, and deepest ambitions — then pinpoints your precise starting coordinate in the constellation.",
    detail: "Takes 8 minutes. Reveals everything.",
  },
  {
    n: 2,
    label: "Learn",
    sub: "Expert-curated knowledge",
    desc: "Structured modules built by world-class practitioners — no filler, no noise. Only the knowledge that moves the needle for your specific goal.",
    detail: "Mentor-verified. Continuously updated.",
  },
  {
    n: 3,
    label: "Practice",
    sub: "Real work, real feedback",
    desc: "Live sessions, applied challenges, and mentor reviews forge raw knowledge into genuine, repeatable capability.",
    detail: "Do, not just watch.",
  },
  {
    n: 4,
    label: "Consistency",
    sub: "Daily rituals win everything",
    desc: "Streak tracking, accountability partners, and micro-missions keep you building on the hard days — when motivation evaporates and discipline carries you.",
    detail: "Compounding daily. Unstoppable weekly.",
  },
  {
    n: 5,
    label: "Transformation",
    sub: "Become who you chose",
    desc: "The constellation completes. Your growth is documented, celebrated, and becomes the foundation for the next horizon you set your sights on.",
    detail: "Not an ending — a launch point.",
  },
];

/* ── Star glyph ────────────────────────────────────────────── */
function StarGlyph({
  size,
  lit,
  isFinal,
}: {
  size: number;
  lit: boolean;
  isFinal: boolean;
}) {
  const glowStr = isFinal && lit
    ? "drop-shadow(0 0 18px rgba(212,175,55,1)) drop-shadow(0 0 40px rgba(212,175,55,0.55)) drop-shadow(0 0 70px rgba(212,175,55,0.25))"
    : lit
    ? "drop-shadow(0 0 10px rgba(212,175,55,0.85)) drop-shadow(0 0 22px rgba(212,175,55,0.35))"
    : "none";

  return (
    <svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <defs>
        <radialGradient id="sg-gold" cx="48%" cy="32%" r="68%">
          <stop offset="0%"   stopColor="#FFF8D0" />
          <stop offset="42%"  stopColor="#F4D67A" />
          <stop offset="100%" stopColor="#9a7818" />
        </radialGradient>
      </defs>

      {/* Dim base always visible */}
      <polygon
        points="30,4 36,22 55,22 40,34 46,52 30,40 14,52 20,34 5,22 24,22"
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.8"
      />

      {/* Gold overlay fades in when lit */}
      <motion.polygon
        points="30,4 36,22 55,22 40,34 46,52 30,40 14,52 20,34 5,22 24,22"
        fill="url(#sg-gold)"
        stroke="rgba(244,214,122,0.45)"
        strokeWidth="0.8"
        initial={{ opacity: 0 }}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        style={{ filter: glowStr }}
      />

      {/* Specular highlight dot */}
      {lit && (
        <motion.ellipse
          cx="23" cy="18" rx="5.5" ry="2.8"
          fill="rgba(255,255,255,0.38)"
          transform="rotate(-28 23 18)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      )}
    </svg>
  );
}

/* ── Main section ──────────────────────────────────────────── */
export function StarJourney() {
  const sectionRef   = useRef<HTMLDivElement>(null);
  const trackRef     = useRef<HTMLDivElement>(null);
  const startedRef   = useRef(false);       // guard: play only once

  /* Per-star state */
  const [litUpTo,    setLitUpTo]    = useState(-1);   // 0-4 or -1 (nothing lit)
  const [trackFill,  setTrackFill]  = useState(0);    // 0-100 %
  const [beamLeft,   setBeamLeft]   = useState(-5);   // % across the track
  const [beamOn,     setBeamOn]     = useState(false);
  const [showDetail, setShowDetail] = useState(0);    // step index shown in card
  const [cardVisible, setCardVisible] = useState(false);

  /* Viewport detection — fires when ≥50 % of section is visible */
  const inView = useInView(sectionRef, { once: true, amount: 0.5 });

  useEffect(() => {
    if (!inView || startedRef.current) return;
    startedRef.current = true;

    const PER_STAR_MS = 1000;   // ms between each star lighting
    const EASE_MS     = 800;    // beam travel / fill transition duration (CSS handles this)

    /* Show beam */
    setBeamOn(true);

    /* Activate each star in sequence */
    STEPS.forEach((_, i) => {
      const t = i * PER_STAR_MS + 150;
      setTimeout(() => {
        const pct = (i / (STEPS.length - 1)) * 100;
        setBeamLeft(pct);
        setTrackFill(pct);
        setLitUpTo(i);
        setShowDetail(i);
        setCardVisible(true);
      }, t);
    });

    /* Fade beam out after all stars lit */
    setTimeout(() => setBeamOn(false), STEPS.length * PER_STAR_MS + EASE_MS);
  }, [inView]);

  /* Header inView for stagger-reveal (separate, doesn't reset) */
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, amount: 0.3 });

  return (
    <section
      id="star-journey"
      className="py-32 px-6 overflow-hidden"
      ref={sectionRef}
      style={{
        background:
          "linear-gradient(180deg, #050510 0%, #09090e 55%, #0c0a05 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto">

        {/* ── Header ── */}
        <div ref={headerRef} className="text-center mb-20">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65 }}
            className="uppercase tracking-[0.18em] text-[11px] mb-4"
            style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
          >
            Every great journey has a map
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1 }}
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#FAF9F6",
              letterSpacing: "-0.025em",
              marginBottom: "1rem",
            }}
          >
            Your{" "}
            <span style={{
              background: "linear-gradient(135deg, #F4D67A, #D4AF37)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Star Journey
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.18 }}
            style={{
              fontFamily: "'Inter', sans-serif",
              color: "rgba(250,249,246,0.42)",
              maxWidth: "44ch",
              margin: "0 auto",
              lineHeight: 1.8,
              fontWeight: 300,
              fontSize: "0.95rem",
            }}
          >
            Five celestial milestones. One luminous destination.
          </motion.p>
        </div>

        {/* ── Journey track ── */}
        <div className="relative" ref={trackRef}>

          {/* ── Connector track (desktop) ── */}
          <div
            className="hidden lg:block absolute top-[44px] left-[9%] right-[9%] pointer-events-none"
            style={{ height: 1 }}
          >
            {/* Dim base rail */}
            <div className="absolute inset-0 rounded-full"
              style={{ background: "rgba(255,255,255,0.07)" }} />

            {/* Gold fill — expands as beam passes */}
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, rgba(212,175,55,0.8), rgba(244,214,122,0.4))",
                width: `${trackFill}%`,
              }}
              animate={{ width: `${trackFill}%` }}
              transition={{ duration: 0.82, ease: [0.4, 0, 0.2, 1] }}
            />

            {/* ── Luminous beam ── */}
            <AnimatePresence>
              {beamOn && (
                <motion.div
                  className="absolute"
                  style={{
                    top: "50%",
                    transform: "translateY(-50%) translateX(-50%)",
                    width: 110,
                    height: 22,
                    pointerEvents: "none",
                  }}
                  animate={{ left: `${beamLeft}%` }}
                  transition={{ duration: 0.82, ease: [0.4, 0, 0.2, 1] }}
                  initial={false}
                >
                  {/* Soft glow cloud */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 100% at 50% 50%, rgba(255,248,180,0.88) 0%, rgba(244,214,122,0.42) 45%, rgba(212,175,55,0.12) 75%, transparent 100%)",
                      filter: "blur(4px)",
                    }}
                  />
                  {/* Travelling spark */}
                  <div
                    className="absolute top-1/2 left-1/2 rounded-full"
                    style={{
                      width: 7,
                      height: 7,
                      transform: "translate(-50%, -50%)",
                      background: "#FFFCE8",
                      boxShadow:
                        "0 0 8px 3px rgba(255,248,200,0.9), 0 0 20px 8px rgba(212,175,55,0.6)",
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Five stars ── */}
          <div className="grid grid-cols-5 gap-2 lg:gap-0">
            {STEPS.map((step, i) => {
              const lit    = i <= litUpTo;
              const isFinal = i === 4;
              const size   = isFinal ? 72 : 60;

              return (
                <div
                  key={step.n}
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => { if (lit) setShowDetail(i); }}
                >
                  {/* Star + badge */}
                  <div className="relative mb-4">
                    {/* Pulse ring for Transformation (final, lit) */}
                    {isFinal && lit && (
                      <>
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: size * 1.95, height: size * 1.95,
                            border: "1px solid rgba(212,175,55,0.35)",
                            top: "50%", left: "50%",
                            transform: "translate(-50%,-50%)",
                          }}
                          initial={{ scale: 1, opacity: 0.55 }}
                          animate={{ scale: [1, 1.45, 1], opacity: [0.55, 0, 0.55] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute rounded-full pointer-events-none"
                          style={{
                            width: size * 2.7, height: size * 2.7,
                            border: "1px solid rgba(212,175,55,0.18)",
                            top: "50%", left: "50%",
                            transform: "translate(-50%,-50%)",
                          }}
                          initial={{ scale: 1, opacity: 0.3 }}
                          animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut", delay: 0.55 }}
                        />
                      </>
                    )}

                    <StarGlyph size={size} lit={lit} isFinal={isFinal} />
                  </div>

                  {/* Label */}
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontSize: "clamp(0.72rem, 1.4vw, 0.95rem)",
                      fontWeight: 700,
                      marginBottom: "0.15rem",
                      textAlign: "center",
                      color: isFinal && lit ? "#F4D67A" : lit ? "rgba(250,249,246,0.85)" : "rgba(250,249,246,0.22)",
                      transition: "color 0.6s",
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "clamp(0.58rem, 0.9vw, 0.68rem)",
                      fontWeight: 400,
                      textAlign: "center",
                      color: lit ? "rgba(212,175,55,0.62)" : "rgba(250,249,246,0.18)",
                      transition: "color 0.6s",
                    }}
                  >
                    {step.sub}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Detail card (only shown once first star lights) ── */}
          <AnimatePresence>
            {cardVisible && (
              <motion.div
                key={showDetail}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="mt-14 mx-auto max-w-2xl rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(11,9,4,0.9)",
                  border: "1px solid rgba(212,175,55,0.18)",
                  backdropFilter: "blur(24px)",
                  boxShadow: "0 0 40px rgba(212,175,55,0.05)",
                }}
              >
                <div className="h-[1.5px]" style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, #D4AF37 38%, #F4D67A 62%, transparent 100%)",
                }} />
                <div className="p-7 flex gap-5">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: "rgba(212,175,55,0.1)",
                      border: "1px solid rgba(212,175,55,0.22)",
                    }}
                  >
                    <span style={{ fontSize: "1.05rem" }}>⭐</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2.5">
                      <h4
                        style={{
                          fontFamily: "'Playfair Display', serif",
                          color: "#FAF9F6",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                        }}
                      >
                        {STEPS[showDetail].label}
                      </h4>
                      <span
                        className="px-2.5 py-0.5 rounded-full text-[10px]"
                        style={{
                          background: "rgba(212,175,55,0.1)",
                          border: "1px solid rgba(212,175,55,0.2)",
                          color: "#D4AF37",
                          fontFamily: "'DM Mono', monospace",
                        }}
                      >
                        {STEPS[showDetail].detail}
                      </span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        color: "rgba(250,249,246,0.55)",
                        fontSize: "0.88rem",
                        lineHeight: 1.75,
                        fontWeight: 300,
                      }}
                    >
                      {STEPS[showDetail].desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile step dots */}
          {cardVisible && (
            <div className="flex justify-center gap-2 mt-6 lg:hidden">
              {STEPS.map((s, i) => (
                <div
                  key={s.n}
                  onClick={() => { if (i <= litUpTo) setShowDetail(i); }}
                  className="rounded-full cursor-pointer"
                  style={{
                    width: i === showDetail ? 20 : 6,
                    height: 6,
                    background: i <= litUpTo ? "#D4AF37" : "rgba(255,255,255,0.1)",
                    transition: "width 0.3s, background 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
