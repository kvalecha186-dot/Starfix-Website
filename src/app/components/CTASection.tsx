import { motion, useInView } from "motion/react";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { StarfixLogo } from "./StarfixLogo";

function AmbientStars() {
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.offsetWidth, H = cv.offsetHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.scale(dpr, dpr);

    const pts = Array.from({ length: 36 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.4 + Math.random() * 1.1,
      op: 0.1 + Math.random() * 0.45,
      ph: Math.random() * Math.PI * 2,
      sp: 0.5 + Math.random() * 1.0,
    }));

    let raf: number, t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.012;
      pts.forEach(p => {
        const op = p.op * (0.5 + 0.5 * Math.sin(t * p.sp + p.ph));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={cvRef} className="absolute inset-0 w-full h-full pointer-events-none"/>;
}

export function CTASection({ onStartOnboarding, onLogin }: { onStartOnboarding?: () => void; onLogin?: () => void }) {
  const ref    = useRef<HTMLDivElement>(null);
  const inView  = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      className="relative py-36 px-6 overflow-hidden"
      style={{ background: "linear-gradient(180deg, #09090e 0%, #0d0a01 60%, #07060f 100%)" }}
    >
      <AmbientStars />

      {/* Central orb glow */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 50% 45% at 50% 52%, rgba(212,175,55,0.07) 0%, transparent 70%)",
      }}/>

      <div className="relative z-10 max-w-3xl mx-auto text-center" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex justify-center mb-10">
            <StarfixLogo size={58} markColor="#D4AF37" textColor="#FAF9F6" />
          </div>

          {/* Divider constellation line */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.3))" }}/>
            <span style={{ color: "rgba(212,175,55,0.5)", fontSize: "0.55rem", letterSpacing: "0.3em" }}>✦ ✦ ✦</span>
            <div className="h-px flex-1 max-w-[80px]" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.3), transparent)" }}/>
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              color: "#FAF9F6",
              fontSize: "clamp(2.2rem, 5.5vw, 4rem)",
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
            }}
          >
            Your Star Is Waiting
            <br />
            <span style={{
              background: "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 40%, #D4AF37 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              to Shine
            </span>
          </h2>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "1rem",
              color: "rgba(250,249,246,0.45)",
              maxWidth: "44ch",
              margin: "0 auto 3rem",
              lineHeight: 1.8,
              fontWeight: 300,
            }}
          >
            Join 50,000+ people who chose to invest in themselves. Your transformation starts with a single decision — made right now.
          </p>

          <button
            className="group inline-flex items-center gap-2.5 px-10 py-4 rounded-full font-semibold text-[15px]"
            onClick={onStartOnboarding}
            style={{
              fontFamily: "'Inter', sans-serif",
              background: "linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)",
              color: "#08070a",
              boxShadow: "0 0 42px rgba(212,175,55,0.42)",
              transition: "all 0.3s cubic-bezier(0.22,1,0.36,1)",
              cursor: "pointer",
              border: "none",
            }}
            onMouseEnter={(e)=>{
              const b=e.currentTarget as HTMLButtonElement;
              b.style.transform="translateY(-2px) scale(1.02)";
              b.style.boxShadow="0 0 70px rgba(212,175,55,0.68)";
            }}
            onMouseLeave={(e)=>{
              const b=e.currentTarget as HTMLButtonElement;
              b.style.transform="translateY(0) scale(1)";
              b.style.boxShadow="0 0 42px rgba(212,175,55,0.42)";
            }}
          >
            Begin Your Transformation
            <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform duration-200"/>
          </button>

          <p style={{
            fontFamily: "'Inter', sans-serif", fontSize: "0.7rem",
            color: "rgba(250,249,246,0.2)", marginTop: "1.4rem",
            letterSpacing: "0.07em",
          }}>
            Free to start · No credit card required · Cancel anytime
          </p>

          <button
            onClick={onLogin}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              marginTop: "1rem",
              fontFamily: "'Inter', sans-serif",
              fontSize: "0.78rem",
              color: "rgba(250,249,246,0.35)",
              letterSpacing: "0.02em",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(212,175,55,0.8)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.35)";
            }}
          >
            Already a member? <span style={{ fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px" }}>Sign In</span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
