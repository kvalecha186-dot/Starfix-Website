import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Star, CheckCircle, MessageCircle, Calendar } from "lucide-react";

const MENTORS = [
  {
    name: "Dr. Priya Sharma",
    role: "Executive Coach · Mindset Expert",
    pillar: "Mind",
    rating: 4.98,
    sessions: 1240,
    price: "$120/hr",
    tags: ["Confidence", "Leadership", "Resilience"],
    photo: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=300&fit=crop&auto=format",
    online: true,
    metric: "1,240 students guided · 92% goal completion",
  },
  {
    name: "Marcus Chen",
    role: "Elite Fitness · Longevity Coach",
    pillar: "Body",
    rating: 4.96,
    sessions: 890,
    price: "$95/hr",
    tags: ["Strength", "Nutrition", "Recovery"],
    photo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop&auto=format",
    online: true,
    metric: "500+ transformations · 89% client retention",
  },
  {
    name: "Aisha Williams",
    role: "Staff Engineer · Tech Mentor",
    pillar: "Skills",
    rating: 4.99,
    sessions: 2100,
    price: "$150/hr",
    tags: ["React", "System Design", "AI/ML"],
    photo: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=300&fit=crop&auto=format",
    online: false,
    metric: "2,100+ engineers mentored · 96% career advancement",
  },
  {
    name: "James Okafor",
    role: "Founder · Career Strategist",
    pillar: "Career",
    rating: 4.97,
    sessions: 760,
    price: "$180/hr",
    tags: ["Startups", "VC Fundraising", "Hiring"],
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&auto=format",
    online: true,
    metric: "760 founders guided · 94% raised or hired",
  },
];

const PILLAR_COL: Record<string, string> = {
  Mind:   "#9b7fe8",
  Body:   "#e87f7f",
  Skills: "#7fb8e8",
  Career: "#7fe8b4",
};

/* ── Premium mentor card ───────────────────────────────────────── */
function MentorCard({ m, i }: { m: typeof MENTORS[0]; i: number }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background:   "rgba(11,11,18,0.94)",
        border:       hov
          ? "1px solid rgba(212,175,55,0.42)"
          : "1px solid rgba(212,175,55,0.09)",
        boxShadow:    hov
          ? "0 18px 48px rgba(0,0,0,0.52), 0 0 0 1px rgba(212,175,55,0.06), 0 0 32px rgba(212,175,55,0.04)"
          : "0 4px 20px rgba(0,0,0,0.25)",
        transform:    hov ? "translateY(-6px)" : "translateY(0)",
        transition:   "transform 0.38s cubic-bezier(0.22,1,0.36,1), box-shadow 0.38s cubic-bezier(0.22,1,0.36,1), border-color 0.38s cubic-bezier(0.22,1,0.36,1)",
      }}
    >
      {/* Pillar accent bar — brightens on hover */}
      <div
        style={{
          height: 1.5,
          background: hov
            ? `linear-gradient(90deg, transparent 0%, ${PILLAR_COL[m.pillar]} 40%, #F4D67A 65%, transparent 100%)`
            : `linear-gradient(90deg, transparent 0%, ${PILLAR_COL[m.pillar]}55 50%, transparent 100%)`,
          transition: "background 0.38s ease",
        }}
      />

      <div className="p-5 flex flex-col flex-1">
        {/* Avatar + bio */}
        <div className="flex items-start gap-3.5 mb-4">
          <div className="relative flex-shrink-0 overflow-hidden rounded-xl"
            style={{ width: 56, height: 56 }}
          >
            <img
              src={m.photo}
              alt={m.name}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                border: "1.5px solid rgba(212,175,55,0.25)",
                borderRadius: "inherit",
                transform:  hov ? "scale(1.025)" : "scale(1)",
                transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1)",
                display: "block",
              }}
            />
            {m.online && (
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full"
                style={{
                  background: "#34d399",
                  border: "2px solid #0a0a0f",
                }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h4
                style={{
                  fontFamily:   "'Playfair Display', serif",
                  color:        hov ? "#FAF9F6" : "rgba(250,249,246,0.92)",
                  fontSize:     "0.95rem",
                  fontWeight:   700,
                  transition:   "color 0.25s",
                }}
              >
                {m.name}
              </h4>
              <CheckCircle size={13} style={{ color: hov ? "#F4D67A" : "#D4AF37", flexShrink: 0, transition: "color 0.25s" }} />
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "rgba(250,249,246,0.4)", lineHeight: 1.4 }}>
              {m.role}
            </p>
            <span
              className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px]"
              style={{
                background: `${PILLAR_COL[m.pillar]}18`,
                color:      PILLAR_COL[m.pillar],
                border:     `1px solid ${PILLAR_COL[m.pillar]}35`,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {m.pillar}
            </span>
          </div>
        </div>

        {/* Rating + price */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star size={12} style={{ color: "#D4AF37", fill: "#D4AF37" }} />
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: hov ? "#F4D67A" : "#D4AF37", fontWeight: 600, transition: "color 0.25s" }}>
              {m.rating}
            </span>
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.72rem", color: "rgba(250,249,246,0.28)" }}>
            {m.sessions.toLocaleString()} sessions
          </span>
          <span className="ml-auto" style={{ fontFamily: "'Playfair Display', serif", fontSize: "0.88rem", color: hov ? "#F4D67A" : "#D4AF37", fontWeight: 600, transition: "color 0.25s" }}>
            {m.price}
          </span>
        </div>

        {/* Specialty tags */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {m.tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily:  "'Inter', sans-serif",
                fontSize:    "0.65rem",
                background:  hov ? "rgba(212,175,55,0.1)" : "rgba(212,175,55,0.07)",
                border:      `1px solid ${hov ? "rgba(212,175,55,0.22)" : "rgba(212,175,55,0.13)"}`,
                color:       hov ? "rgba(250,249,246,0.75)" : "rgba(250,249,246,0.55)",
                borderRadius: 999,
                padding:     "2px 9px",
                transition:  "background 0.3s, border-color 0.3s, color 0.3s",
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* ── Credibility metric ── */}
        <div
          className="mb-4 px-3 py-2 rounded-lg"
          style={{
            background:  hov ? "rgba(212,175,55,0.07)" : "rgba(212,175,55,0.04)",
            border:      `1px solid ${hov ? "rgba(212,175,55,0.16)" : "rgba(212,175,55,0.08)"}`,
            transition:  "background 0.35s, border-color 0.35s",
          }}
        >
          <span
            style={{
              fontFamily:    "'Inter', sans-serif",
              fontSize:      "0.68rem",
              color:         hov ? "rgba(212,175,55,0.8)" : "rgba(212,175,55,0.55)",
              fontWeight:    500,
              letterSpacing: "0.01em",
              transition:    "color 0.3s",
            }}
          >
            {m.metric}
          </span>
        </div>

        {/* Actions — pushed to bottom */}
        <div className="flex gap-2 mt-auto">
          <button
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-medium"
            style={{
              fontFamily:  "'Inter', sans-serif",
              background:  hov ? "linear-gradient(135deg, #F4D67A, #D4AF37)" : "rgba(212,175,55,0.1)",
              color:       hov ? "#08070a" : "#D4AF37",
              border:      hov ? "none" : "1px solid rgba(212,175,55,0.18)",
              transition:  "background 0.35s, color 0.35s, border 0.35s",
            }}
          >
            <Calendar size={13} /> Book Session
          </button>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-xl"
            style={{
              background:   hov ? "rgba(212,175,55,0.09)" : "rgba(255,255,255,0.04)",
              border:       hov ? "1px solid rgba(212,175,55,0.28)" : "1px solid rgba(255,255,255,0.07)",
              color:        hov ? "rgba(212,175,55,0.85)" : "rgba(250,249,246,0.35)",
              transition:   "background 0.35s, border-color 0.35s, color 0.35s",
            }}
          >
            <MessageCircle size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Section ───────────────────────────────────────────────────── */
export function MentorSection() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      id="mentors"
      className="py-28 px-6"
      ref={ref}
      style={{ background: "#09090e" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* ── Inspirational statement ── */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-6"
        >
          {/* Eyebrow */}
          <p
            className="uppercase tracking-[0.18em] text-[11px] mb-8"
            style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
          >
            Vetted · Verified · World-class
          </p>

          {/* Primary statement */}
          <h2
            style={{
              fontFamily:    "'Playfair Display', serif",
              fontStyle:     "italic",
              fontSize:      "clamp(1.65rem, 4vw, 2.9rem)",
              fontWeight:    700,
              color:         "#FAF9F6",
              lineHeight:    1.18,
              letterSpacing: "-0.02em",
              maxWidth:      "22ch",
              margin:        "0 auto 1.5rem",
            }}
          >
            The right mentor can accelerate what{" "}
            <span
              style={{
                background:           "linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
              }}
            >
              years of trial and error
            </span>{" "}
            cannot.
          </h2>

          {/* Supporting line */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily:  "'Inter', sans-serif",
              color:       "rgba(250,249,246,0.42)",
              maxWidth:    "56ch",
              margin:      "0 auto",
              lineHeight:  1.78,
              fontWeight:  300,
              fontSize:    "0.95rem",
            }}
          >
            Connect with world-class mentors in coding, fitness, confidence,
            career growth, and personal transformation.
          </motion.p>
        </motion.div>

        {/* Hairline divider */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 0.9, delay: 0.28 }}
          className="mb-14 mx-auto"
          style={{
            height:     1,
            maxWidth:   320,
            background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.22), transparent)",
            transformOrigin: "center",
          }}
        />

        {/* ── Mentor cards ── */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MENTORS.map((m, i) => (
            <MentorCard key={m.name} m={m} i={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
