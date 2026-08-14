import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Star, Quote } from "lucide-react";

const STORIES = [
  {
    name: "Elena Rodriguez",
    role: "Software Engineer → Tech Lead",
    pillar: "Career",
    result: "Promoted in 6 months",
    quote: "Starfix matched me with a mentor who had done exactly what I was trying to do. Within six months I was promoted to Tech Lead at a Fortune 500. The constellation map kept me accountable every single day — I couldn't let a node go dark.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&auto=format",
    duration: "6 months",
  },
  {
    name: "David Park",
    role: "Burned out → Founder",
    pillar: "Mind",
    result: "Launched $1M ARR startup",
    quote: "I had zero confidence and was completely burnt out. The Mind pillar rebuilt me from the inside out. Today my company does over $1M ARR. The ROI of a single mentor session is incalculable compared to any course I ever bought.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&auto=format",
    duration: "9 months",
  },
  {
    name: "Amara Osei",
    role: "Sedentary → Marathon runner",
    pillar: "Body",
    result: "Lost 35 kg, first marathon",
    quote: "Marcus designed my entire programme and was available every step of the way. The daily missions made it feel like a game — I was addicted to lighting the next node. Fifty weeks later I crossed a marathon finish line.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&auto=format",
    duration: "11 months",
  },
];

const PILLAR_COL: Record<string, string> = {
  Mind: "#9b7fe8", Body: "#e87f7f", Skills: "#7fb8e8", Career: "#7fe8b4",
};

export function SuccessStories() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section id="stories" className="py-28 px-6" ref={ref} style={{ background: "#09090e" }}>
      <div className="max-w-7xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75 }}
          className="text-center mb-16"
        >
          <p className="uppercase tracking-[0.18em] text-[11px] mb-4" style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            Real transformations
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Stories That{" "}
            <span style={{ background: "linear-gradient(135deg, #F4D67A, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Inspire
            </span>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(250,249,246,0.42)", maxWidth: "48ch", margin: "0 auto", lineHeight: 1.8, fontWeight: 300, fontSize: "0.95rem" }}>
            50,000+ people have rewritten their story with Starfix. Here are three of them.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {STORIES.map((s, i) => (
            <motion.div
              key={s.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.12 }}
              className="relative rounded-2xl overflow-hidden flex flex-col"
              style={{
                background: "rgba(11,11,18,0.92)",
                border: "1px solid rgba(212,175,55,0.09)",
              }}
            >
              {/* Top accent */}
              <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${PILLAR_COL[s.pillar]}50, #D4AF3740, transparent)` }}/>

              <div className="p-7 flex flex-col flex-1">
                {/* Result chip */}
                <div className="flex items-center justify-between mb-5">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                    style={{ background: "rgba(212,175,55,0.09)", border: "1px solid rgba(212,175,55,0.18)" }}
                  >
                    <Star size={11} style={{ color: "#D4AF37", fill: "#D4AF37" }}/>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "#F4D67A", fontWeight: 600 }}>
                      {s.result}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                    background: `${PILLAR_COL[s.pillar]}18`,
                    color: PILLAR_COL[s.pillar],
                    border: `1px solid ${PILLAR_COL[s.pillar]}30`,
                    fontFamily: "'Inter', sans-serif",
                  }}>{s.pillar}</span>
                </div>

                {/* Quote */}
                <div className="flex-1 mb-6">
                  <Quote size={18} style={{ color: "rgba(212,175,55,0.25)", marginBottom: "0.65rem" }}/>
                  <p style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.85rem",
                    color: "rgba(250,249,246,0.62)",
                    lineHeight: 1.78,
                    fontStyle: "italic",
                    fontWeight: 300,
                  }}>
                    {s.quote}
                  </p>
                </div>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <img src={s.photo} alt={s.name}
                    className="w-11 h-11 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1.5px solid rgba(212,175,55,0.22)" }}
                  />
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem", fontWeight: 600, color: "#FAF9F6" }}>{s.name}</div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(250,249,246,0.38)" }}>{s.role}</div>
                  </div>
                  <div className="ml-auto flex">
                    {Array.from({ length: s.rating }).map((_, j) => (
                      <Star key={j} size={11} style={{ color: "#D4AF37", fill: "#D4AF37" }}/>
                    ))}
                  </div>
                </div>

                {/* Duration */}
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: "1px solid rgba(212,175,55,0.07)" }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "rgba(250,249,246,0.28)" }}>Duration</span>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#D4AF37", fontWeight: 500 }}>{s.duration}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
