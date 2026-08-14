import { motion, useInView } from "motion/react";
import { useRef, useState } from "react";
import { Check, Star } from "lucide-react";

const PLANS = [
  {
    name: "Explorer",
    price: { mo: 0, yr: 0 },
    desc: "Begin the journey",
    features: [
      "3 mentor connections",
      "Basic constellation map",
      "5 daily missions",
      "Community access",
      "Progress tracking",
    ],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Accelerator",
    price: { mo: 79, yr: 59 },
    desc: "For the seriously ambitious",
    features: [
      "Unlimited mentor access",
      "Full constellation map",
      "Unlimited daily missions",
      "AI growth coach",
      "Weekly insight reports",
      "Achievement badges",
      "Priority mentor matching",
    ],
    cta: "Start Transforming",
    featured: true,
    badge: "Most Popular",
  },
  {
    name: "Visionary",
    price: { mo: 199, yr: 149 },
    desc: "For elite performers",
    features: [
      "Everything in Accelerator",
      "Dedicated head mentor",
      "Monthly strategy session",
      "Custom roadmap design",
      "Executive peer group",
      "VIP events & retreats",
      "White-glove onboarding",
    ],
    cta: "Apply Now",
    featured: false,
  },
];

export function PricingSection({ onStartOnboarding }: { onStartOnboarding?: () => void }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-60px" });
  const [annual, setAnnual] = useState(true);

  return (
    <section id="pricing" className="py-28 px-6" ref={ref} style={{ background: "#09090e" }}>
      <div className="max-w-6xl mx-auto">

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.75 }}
          className="text-center mb-14"
        >
          <p className="uppercase tracking-[0.18em] text-[11px] mb-4" style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            Transparent pricing
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
            Invest in Your{" "}
            <span style={{ background: "linear-gradient(135deg, #F4D67A, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Future Self
            </span>
          </h2>

          {/* Annual/monthly toggle */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: annual ? "rgba(250,249,246,0.35)" : "rgba(250,249,246,0.75)" }}>
              Monthly
            </span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative w-11 h-6 rounded-full transition-colors duration-300 flex-shrink-0"
              style={{ background: annual ? "#D4AF37" : "rgba(255,255,255,0.08)" }}
              aria-label="Toggle billing"
            >
              <div
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300"
                style={{ transform: annual ? "translateX(22px)" : "translateX(2px)" }}
              />
            </button>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: annual ? "rgba(250,249,246,0.75)" : "rgba(250,249,246,0.35)" }}>
              Annual{" "}
              <span className="px-2 py-0.5 rounded-full text-[10px] ml-1" style={{
                background: "rgba(212,175,55,0.12)", color: "#D4AF37",
                border: "1px solid rgba(212,175,55,0.22)", fontFamily: "'DM Mono', monospace",
              }}>–25%</span>
            </span>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 items-center">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.65, delay: i * 0.1 }}
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: plan.featured
                  ? "linear-gradient(155deg, #130e02 0%, #0f0c03 100%)"
                  : "rgba(11,11,18,0.92)",
                border: plan.featured
                  ? "1px solid rgba(212,175,55,0.38)"
                  : "1px solid rgba(212,175,55,0.09)",
                boxShadow: plan.featured
                  ? "0 0 70px rgba(212,175,55,0.09), 0 20px 60px rgba(0,0,0,0.45)"
                  : "none",
                transform: plan.featured ? "scale(1.025)" : "scale(1)",
              }}
            >
              {/* Featured top bar */}
              {plan.featured && (
                <div className="h-[1.5px]" style={{ background: "linear-gradient(90deg, transparent, #F4D67A 30%, #D4AF37 70%, transparent)" }}/>
              )}

              {plan.badge && (
                <div className="flex justify-center pt-5 pb-0">
                  <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full"
                    style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.25)" }}
                  >
                    <Star size={10} style={{ color: "#D4AF37", fill: "#D4AF37" }}/>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "#D4AF37", fontWeight: 600 }}>
                      {plan.badge}
                    </span>
                  </div>
                </div>
              )}

              <div className="p-8">
                <div className="mb-6">
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", fontSize: "1.3rem", fontWeight: 700, marginBottom: "0.2rem" }}>
                    {plan.name}
                  </h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "rgba(250,249,246,0.38)" }}>
                    {plan.desc}
                  </p>
                </div>

                <div className="mb-7">
                  <span style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: "2.5rem", fontWeight: 700,
                    color: plan.featured ? "#F4D67A" : "#FAF9F6",
                  }}>
                    {plan.price.mo === 0 ? "Free" : `$${annual ? plan.price.yr : plan.price.mo}`}
                  </span>
                  {plan.price.mo > 0 && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.8rem", color: "rgba(250,249,246,0.35)", marginLeft: 4 }}>/mo</span>
                  )}
                  {annual && plan.price.mo > 0 && (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "rgba(250,249,246,0.28)", marginTop: "0.25rem" }}>
                      Billed ${plan.price.yr * 12}/year
                    </div>
                  )}
                </div>

                <ul className="flex flex-col gap-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <div className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" style={{ width: 18, height: 18 }}>
                        <Check size={15} style={{ color: "#D4AF37" }}/>
                      </div>
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.83rem", color: "rgba(250,249,246,0.6)", lineHeight: 1.5 }}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-250"
                  onClick={onStartOnboarding}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    background: plan.featured ? "linear-gradient(135deg, #F4D67A, #D4AF37)" : "rgba(212,175,55,0.08)",
                    color: plan.featured ? "#08070a" : "#D4AF37",
                    border: plan.featured ? "none" : "1px solid rgba(212,175,55,0.18)",
                    boxShadow: plan.featured ? "0 0 28px rgba(212,175,55,0.32)" : "none",
                  }}
                  onMouseEnter={(e)=>{
                    const b=e.currentTarget as HTMLButtonElement;
                    if(plan.featured) b.style.boxShadow="0 0 45px rgba(212,175,55,0.55)";
                    else { b.style.background="rgba(212,175,55,0.14)"; b.style.borderColor="rgba(212,175,55,0.35)"; }
                    b.style.transform="translateY(-1px)";
                  }}
                  onMouseLeave={(e)=>{
                    const b=e.currentTarget as HTMLButtonElement;
                    if(plan.featured) b.style.boxShadow="0 0 28px rgba(212,175,55,0.32)";
                    else { b.style.background="rgba(212,175,55,0.08)"; b.style.borderColor="rgba(212,175,55,0.18)"; }
                    b.style.transform="translateY(0)";
                  }}
                >
                  {plan.cta}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="text-center mt-9"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "rgba(250,249,246,0.22)" }}
        >
          All plans include a 14-day money-back guarantee. No questions asked.
        </motion.p>
      </div>
    </section>
  );
}
