import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { X, Check } from "lucide-react";

const traditionalItems = [
  "Random YouTube rabbit holes",
  "Zero accountability or tracking",
  "No mentor, no feedback loop",
  "Slow, scattered progress",
  "Content without direction",
  "Motivation fades in weeks",
];

const starfixItems = [
  "AI-personalized transformation roadmap",
  "Daily missions + streak accountability",
  "Expert mentors matched to your goals",
  "Structured, measurable growth",
  "Constellation path with clear milestones",
  "Community & mentor to keep you moving",
];

export function WhyStarfixWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="py-28 px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #0c0906 0%, #070710 50%, #0a0a0f 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto" ref={ref}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75 }}
          className="text-center mb-16"
        >
          <p
            className="uppercase tracking-widest text-xs mb-4"
            style={{
              color: "#D4AF37",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          >
            The Difference Is Clear
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#FAF9F6",
              letterSpacing: "-0.02em",
            }}
          >
            Why{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #F4D67A, #D4AF37)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Starfix Works
            </span>
          </h2>
        </motion.div>

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-5 items-stretch">
          {/* Traditional */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="relative rounded-3xl p-8 flex flex-col"
            style={{
              background: "rgba(10,10,14,0.8)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            {/* Faded X watermark */}
            <div
              className="absolute top-4 right-6 text-7xl font-bold pointer-events-none select-none"
              style={{ color: "rgba(200,60,60,0.06)", fontFamily: "'Playfair Display', serif" }}
            >
              ✕
            </div>

            <div className="mb-7">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs mb-4"
                style={{
                  background: "rgba(180,40,40,0.12)",
                  border: "1px solid rgba(180,40,40,0.2)",
                  color: "rgba(220,120,120,0.8)",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                Traditional Learning
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "rgba(250,249,246,0.45)",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                Going it alone
              </h3>
            </div>

            <ul className="flex flex-col gap-4 flex-1">
              {traditionalItems.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(180,40,40,0.15)",
                      border: "1px solid rgba(180,40,40,0.25)",
                    }}
                  >
                    <X size={11} style={{ color: "rgba(220,100,100,0.7)" }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.88rem",
                      color: "rgba(250,249,246,0.35)",
                      lineHeight: 1.6,
                      fontWeight: 300,
                    }}
                  >
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Starfix */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.75, delay: 0.15 }}
            className="relative rounded-3xl p-8 flex flex-col overflow-hidden"
            style={{
              background:
                "linear-gradient(145deg, #110e02 0%, #0e0c04 60%, #0a0a10 100%)",
              border: "1px solid rgba(212,175,55,0.28)",
              boxShadow:
                "0 0 60px rgba(212,175,55,0.07), inset 0 0 80px rgba(212,175,55,0.03)",
            }}
          >
            {/* Corner constellation accent */}
            <svg
              className="absolute top-0 right-0 pointer-events-none"
              width={120}
              height={120}
              viewBox="0 0 120 120"
              fill="none"
            >
              <circle cx="95" cy="20" r="2.5" fill="rgba(212,175,55,0.5)" />
              <circle cx="110" cy="45" r="1.5" fill="rgba(212,175,55,0.3)" />
              <circle cx="78" cy="38" r="1.8" fill="rgba(212,175,55,0.4)" />
              <circle cx="105" cy="70" r="1.2" fill="rgba(212,175,55,0.2)" />
              <line x1="95" y1="20" x2="78" y2="38" stroke="rgba(212,175,55,0.12)" strokeWidth="0.7" />
              <line x1="78" y1="38" x2="110" y2="45" stroke="rgba(212,175,55,0.1)" strokeWidth="0.7" />
              <line x1="110" y1="45" x2="105" y2="70" stroke="rgba(212,175,55,0.08)" strokeWidth="0.7" />
            </svg>

            <div className="mb-7">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs mb-4"
                style={{
                  background: "rgba(212,175,55,0.12)",
                  border: "1px solid rgba(212,175,55,0.3)",
                  color: "#D4AF37",
                  fontFamily: "'Inter', sans-serif",
                  fontWeight: 500,
                  letterSpacing: "0.07em",
                  textTransform: "uppercase",
                }}
              >
                ⭐ Starfix
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#FAF9F6",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                }}
              >
                Guided transformation
              </h3>
            </div>

            <ul className="flex flex-col gap-4 flex-1">
              {starfixItems.map((item, i) => (
                <motion.li
                  key={item}
                  initial={{ opacity: 0, x: 12 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.35 + i * 0.07 }}
                  className="flex items-start gap-3"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: "rgba(212,175,55,0.14)",
                      border: "1px solid rgba(212,175,55,0.3)",
                    }}
                  >
                    <Check size={11} style={{ color: "#D4AF37" }} />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.88rem",
                      color: "rgba(250,249,246,0.75)",
                      lineHeight: 1.6,
                      fontWeight: 400,
                    }}
                  >
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>

            {/* Outcome note — no CTA, just context */}
            <div
              className="mt-8 pt-6"
              style={{ borderTop: "1px solid rgba(212,175,55,0.08)" }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(250,249,246,0.3)",
                  letterSpacing: "0.02em",
                }}
              >
                50,000+ people already transforming with Starfix
              </span>
            </div>
          </motion.div>
        </div>

        {/* Floating label between */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="flex justify-center mt-8"
        >
          <div
            className="px-5 py-2 rounded-full text-xs"
            style={{
              background: "rgba(212,175,55,0.07)",
              border: "1px solid rgba(212,175,55,0.18)",
              color: "rgba(212,175,55,0.7)",
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.08em",
            }}
          >
            The choice is yours. Your star awaits.
          </div>
        </motion.div>
      </div>
    </section>
  );
}
