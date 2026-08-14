import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Brain, Dumbbell, Code2, Briefcase, ArrowUpRight } from "lucide-react";

const PILLARS = [
  {
    Icon: Brain,
    label: "Mind",
    tagline: "Master Your Inner World",
    color: "#9b7fe8",
    skills: ["Confidence", "Communication", "Discipline", "Emotional Intelligence", "Deep Focus"],
    mentors: 248,
    members: "12.4K",
    desc: "Rewire limiting beliefs, build unshakeable confidence, and develop the mental architecture of elite performers.",
    img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&h=480&fit=crop&auto=format",
  },
  {
    Icon: Dumbbell,
    label: "Body",
    tagline: "Transform Your Physical Self",
    color: "#e87f7f",
    skills: ["Strength Training", "Nutrition Science", "Weight Loss", "Sleep Optimisation", "Longevity"],
    mentors: 312,
    members: "18.7K",
    desc: "Build a body that matches your ambition. Science-backed training, personalised nutrition, sustainable results.",
    img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=700&h=480&fit=crop&auto=format",
  },
  {
    Icon: Code2,
    label: "Skills",
    tagline: "Accelerate Your Capabilities",
    color: "#7fb8e8",
    skills: ["Software Engineering", "UI/UX Design", "AI & Machine Learning", "Languages", "Public Speaking"],
    mentors: 421,
    members: "24.1K",
    desc: "Learn from world-class practitioners. Structured roadmaps, live mentorship, and real project experience.",
    img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=700&h=480&fit=crop&auto=format",
  },
  {
    Icon: Briefcase,
    label: "Career",
    tagline: "Own Your Professional Path",
    color: "#7fe8b4",
    skills: ["Resume Craft", "Interview Mastery", "Entrepreneurship", "Executive Leadership", "Networking"],
    mentors: 289,
    members: "15.3K",
    desc: "Land dream roles, launch ventures, and build lasting influence — mentored by founders and C-suite leaders.",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=700&h=480&fit=crop&auto=format",
  },
];

function PillarCard({ p, i }: { p: typeof PILLARS[0]; i: number }) {
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="group relative rounded-2xl overflow-hidden cursor-pointer"
      style={{
        background: "rgba(11,11,18,0.92)",
        border: hov ? "1px solid rgba(212,175,55,0.35)" : "1px solid rgba(212,175,55,0.08)",
        boxShadow: hov ? "0 24px 64px rgba(0,0,0,0.55), 0 0 40px rgba(212,175,55,0.07)" : "0 4px 24px rgba(0,0,0,0.3)",
        transition: "all 0.45s cubic-bezier(0.22,1,0.36,1)",
        transform: hov ? "translateY(-7px)" : "translateY(0)",
      }}
    >
      {/* ── Image panel ── */}
      <div className="relative overflow-hidden" style={{ height: 180 }}>
        <img
          src={p.img}
          alt={p.label}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          style={{ filter: "brightness(0.35) saturate(0.6)" }}
        />
        <div className="absolute inset-0" style={{
          background: `linear-gradient(180deg, rgba(11,11,18,0) 40%, rgba(11,11,18,1) 100%)`,
        }} />

        {/* Icon */}
        <div
          className="absolute top-4 left-4 p-3 rounded-xl"
          style={{
            background: "rgba(10,10,15,0.85)",
            border: "1px solid rgba(212,175,55,0.2)",
            backdropFilter: "blur(8px)",
          }}
        >
          <p.Icon size={20} style={{ color: "#D4AF37" }} />
        </div>

        {/* Members badge */}
        <div
          className="absolute top-4 right-4 px-3 py-1 rounded-full text-[11px]"
          style={{
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.25)",
            color: "#F4D67A",
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        >
          {p.members} members
        </div>
      </div>

      {/* ── Body ── */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#FAF9F6",
                fontSize: "1.35rem",
                fontWeight: 700,
                lineHeight: 1.2,
                marginBottom: "0.2rem",
              }}
            >
              {p.label}
            </h3>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.68rem",
                color: "#D4AF37",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {p.tagline}
            </p>
          </div>
          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "rgba(250,249,246,0.35)" }}>
            {p.mentors} mentors
          </span>
        </div>

        <p
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "0.83rem",
            color: "rgba(250,249,246,0.5)",
            lineHeight: 1.7,
            fontWeight: 300,
            marginBottom: "1.1rem",
          }}
        >
          {p.desc}
        </p>

        {/* Skill pills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {p.skills.map((s) => (
            <span
              key={s}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.68rem",
                background: "rgba(212,175,55,0.07)",
                border: "1px solid rgba(212,175,55,0.14)",
                color: "rgba(250,249,246,0.6)",
                borderRadius: 999,
                padding: "3px 10px",
              }}
            >
              {s}
            </span>
          ))}
        </div>

        <div
          className="flex items-center gap-1.5 text-[13px] font-medium transition-colors duration-200"
          style={{
            fontFamily: "'Inter', sans-serif",
            color: hov ? "#D4AF37" : "rgba(250,249,246,0.3)",
          }}
        >
          Explore {p.label}
          <ArrowUpRight size={14} />
        </div>
      </div>
    </motion.div>
  );
}

export function TransformationPillars() {
  const ref   = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="pillars" className="py-28 px-6" style={{ background: "#09090e" }} ref={ref}>
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75 }}
          className="text-center mb-16"
        >
          <p className="uppercase tracking-[0.18em] text-[11px] mb-4" style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            Choose your arena
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Transformation{" "}
            <span style={{ background: "linear-gradient(135deg, #F4D67A, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Paths
            </span>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(250,249,246,0.42)", maxWidth: "50ch", margin: "0 auto", lineHeight: 1.8, fontWeight: 300, fontSize: "0.95rem" }}>
            Every pillar has its own expert mentors, constellation roadmap, and daily missions. Pick the one that calls to you — or chart all four.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PILLARS.map((p, i) => (
            <PillarCard key={p.label} p={p} i={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
