import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { StarfixLogo } from "./StarfixLogo";

export function BrandShowcase() {
  const ref    = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section
      ref={ref}
      className="py-28 px-6 overflow-hidden"
      style={{
        background: "#0a0a0f",
      }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">

        {/* ── Left: Logo on charcoal card ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center"
        >
          <div
            className="relative flex flex-col items-center justify-center rounded-3xl"
            style={{
              background: "#1C1C1C",
              border: "1px solid rgba(212,175,55,0.12)",
              padding: "3.5rem 4rem",
              boxShadow:
                "0 0 0 1px rgba(212,175,55,0.06), 0 32px 80px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.3)",
              minWidth: 320,
            }}
          >
            {/* Studio ambient light spot from upper-left */}
            <div
              className="absolute pointer-events-none"
              style={{
                top: -60, left: -60,
                width: 280, height: 280,
                background:
                  "radial-gradient(circle, rgba(212,175,55,0.09) 0%, transparent 70%)",
                borderRadius: "50%",
              }}
            />

            {/* Corner constellation dots */}
            {[
              { top: 16, left: 16 }, { top: 16, right: 16 },
              { bottom: 16, left: 16 }, { bottom: 16, right: 16 },
            ].map((pos, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 rounded-full"
                style={{ ...pos, background: "rgba(212,175,55,0.25)" }}
              />
            ))}

            {/* The mark */}
            <motion.div
              initial={{ opacity: 0, scale: 0.82, rotate: -6 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : {}}
              transition={{ duration: 1.0, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                filter:
                  "drop-shadow(0 0 32px rgba(212,175,55,0.4)) drop-shadow(0 0 70px rgba(212,175,55,0.18))",
              }}
            >
              <StarfixLogo size={120} showText={false} markColor="#D4AF37" />
            </motion.div>

            {/* Wordmark */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.8, delay: 0.45 }}
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "2.2rem",
                fontWeight: 700,
                letterSpacing: "-0.03em",
                background:
                  "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 28%, #D4AF37 58%, #A07820 82%, #7A5A0A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1,
                marginTop: "-0.4rem",
                marginBottom: "1.1rem",
              }}
            >
              Starfix
            </motion.div>

            {/* Divider */}
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={inView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.6 }}
              className="flex items-center gap-2.5 mb-3.5"
            >
              <div className="h-px w-12" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.4))" }} />
              <span style={{ fontSize: "0.45rem", color: "rgba(212,175,55,0.4)", letterSpacing: "0.3em" }}>✦</span>
              <div className="h-px w-12" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.4), transparent)" }} />
            </motion.div>

            {/* Tagline */}
            <motion.span
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.72 }}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "0.58rem",
                fontWeight: 500,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "rgba(212,175,55,0.65)",
              }}
            >
              AI-Powered Personal Transformation
            </motion.span>
          </div>
        </motion.div>

        {/* ── Right: Brand story ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-8"
        >
          <div>
            <p
              className="uppercase tracking-[0.18em] text-[11px] mb-4"
              style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}
            >
              The Mark of Transformation
            </p>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                color: "#FAF9F6",
                letterSpacing: "-0.025em",
                marginBottom: "1.25rem",
              }}
            >
              A Symbol That{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #F4D67A, #D4AF37)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Means More
              </span>
            </h2>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                color: "rgba(250,249,246,0.5)",
                fontSize: "0.95rem",
                lineHeight: 1.82,
                fontWeight: 300,
                maxWidth: "46ch",
              }}
            >
              The liquid gold ribbon that forms our{" "}
              <em style={{ color: "rgba(250,249,246,0.75)", fontStyle: "normal", fontWeight: 500 }}>S</em>{" "}
              symbolises a journey in constant motion — fluid, luminous, and impossible to stop. Each endpoint sharpens into a North Star starburst: the beginning of your path, and the brilliant destination awaiting you.
            </p>
          </div>

          {/* Symbol breakdown */}
          <div className="flex flex-col gap-4">
            {[
              {
                icon: "✦",
                title: "The Ribbon",
                desc: "Continuous fluid motion — transformation is not a moment, it is a living process.",
              },
              {
                icon: "★",
                title: "The Starbursts",
                desc: "Two luminous endpoints: where you begin, and the brilliant star you become.",
              },
              {
                icon: "◈",
                title: "The Gold",
                desc: "Liquid gold chrome — the universal symbol of mastery, rarity, and earned excellence.",
              },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-4">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: "rgba(212,175,55,0.09)",
                    border: "1px solid rgba(212,175,55,0.2)",
                  }}
                >
                  <span style={{ color: "#D4AF37", fontSize: "0.9rem" }}>{item.icon}</span>
                </div>
                <div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.88rem",
                      fontWeight: 600,
                      color: "#FAF9F6",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {item.title}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Inter', sans-serif",
                      fontSize: "0.82rem",
                      color: "rgba(250,249,246,0.42)",
                      lineHeight: 1.65,
                      fontWeight: 300,
                    }}
                  >
                    {item.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
