import { motion, useInView } from "motion/react";
import { useRef } from "react";
import { Compass, Users, Map, TrendingUp } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: Compass,
    title: "Discover Your Path",
    desc: "Take our AI assessment to map your goals into a precise, personalized transformation roadmap across Mind, Body, Skills, and Career.",
  },
  {
    step: "02",
    icon: Users,
    title: "Match With a Mentor",
    desc: "Our algorithm connects you with vetted mentors who've walked your exact path. Book a free discovery call and begin your journey.",
  },
  {
    step: "03",
    icon: Map,
    title: "Follow Your Star Map",
    desc: "Complete daily missions, unlock constellation nodes, and watch your star map illuminate as each milestone is mastered.",
  },
  {
    step: "04",
    icon: TrendingUp,
    title: "Evolve Without Limit",
    desc: "Weekly AI reports, mentor check-ins, and a community of high achievers ensure your momentum never stops building.",
  },
];

export function HowItWorks() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      id="how-it-works"
      className="py-28 px-6 overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, #070710 0%, #0a0a0f 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75 }}
          className="text-center mb-20"
        >
          <p
            className="uppercase tracking-widest text-xs mb-4"
            style={{
              color: "#D4AF37",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
            }}
          >
            Simple. Structured. Powerful.
          </p>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#FAF9F6",
              letterSpacing: "-0.02em",
            }}
          >
            How Starfix{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #F4D67A, #D4AF37)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Works
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative">
          {/* Connecting orbit line */}
          <div
            className="hidden lg:block absolute top-11 left-[12.5%] right-[12.5%] h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(212,175,55,0.15) 20%, rgba(212,175,55,0.25) 50%, rgba(212,175,55,0.15) 80%, transparent)",
            }}
          />

          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
              className="flex flex-col items-center text-center"
            >
              {/* Icon ring */}
              <div className="relative mb-6">
                <div
                  className="w-[88px] h-[88px] rounded-full flex items-center justify-center"
                  style={{
                    background:
                      "radial-gradient(circle at 40% 35%, rgba(212,175,55,0.12) 0%, rgba(14,14,20,0.95) 70%)",
                    border: "1px solid rgba(212,175,55,0.2)",
                    boxShadow: "0 0 28px rgba(212,175,55,0.06)",
                  }}
                >
                  <step.icon size={28} style={{ color: "#D4AF37" }} />
                </div>
                {/* Step badge */}
                <div
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #F4D67A, #D4AF37)",
                    color: "#0a0805",
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                  }}
                >
                  {step.step}
                </div>
              </div>

              <h3
                style={{
                  fontFamily: "'Playfair Display', serif",
                  color: "#FAF9F6",
                  fontSize: "1.05rem",
                  fontWeight: 700,
                  marginBottom: "0.75rem",
                }}
              >
                {step.title}
              </h3>
              <p
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.83rem",
                  color: "rgba(250,249,246,0.45)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                }}
              >
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
