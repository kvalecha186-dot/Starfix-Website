import { useEffect, useRef } from "react";
import { motion } from "motion/react";

/* ────────────────────────────────────────────────
   3-D Rotating Constellation — Canvas renderer
   ──────────────────────────────────────────────── */
interface Star {
  ox: number; oy: number; oz: number;   // original position on sphere
  x:  number; y:  number; z:  number;   // rotated position
  r: number; bright: number;
  twinkleHz: number; twinklePhase: number;
  conn: number[];
}

function ConstellationCanvas() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    let W = 0, H = 0;

    /* DPR-aware resize */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = cv.offsetWidth;
      H = cv.offsetHeight;
      cv.width  = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    /* Fibonacci-sphere star placement */
    const COUNT  = 52;
    const RADIUS = 310;
    const PHI    = Math.PI * (Math.sqrt(5) - 1);
    const stars: Star[] = [];

    for (let i = 0; i < COUNT; i++) {
      const y      = 1 - (i / (COUNT - 1)) * 2;
      const ringR  = Math.sqrt(1 - y * y);
      const theta  = PHI * i;
      const ox = Math.cos(theta) * ringR * RADIUS;
      const oy = y * RADIUS * 0.72;
      const oz = Math.sin(theta) * ringR * RADIUS;
      stars.push({
        ox, oy, oz, x: ox, y: oy, z: oz,
        r:            1.4 + Math.random() * 2.6,
        bright:       0.45 + Math.random() * 0.55,
        twinkleHz:    0.5  + Math.random() * 1.4,
        twinklePhase: Math.random() * Math.PI * 2,
        conn: [],
      });
    }

    /* Build edges */
    const CONN_DIST = 230;
    const MAX_CONN  = 4;
    for (let i = 0; i < COUNT; i++) {
      for (let j = i + 1; j < COUNT; j++) {
        if (stars[i].conn.length >= MAX_CONN) break;
        const dx = stars[i].ox - stars[j].ox;
        const dy = stars[i].oy - stars[j].oy;
        const dz = stars[i].oz - stars[j].oz;
        if (Math.sqrt(dx*dx + dy*dy + dz*dz) < CONN_DIST) {
          stars[i].conn.push(j);
        }
      }
    }

    /* Dust particles */
    const DUST = Array.from({ length: 90 }, () => ({
      x:  (Math.random() - 0.5) * 1600,
      y:  (Math.random() - 0.5) * 900,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      r:  0.35 + Math.random() * 0.85,
      op: 0.08 + Math.random() * 0.38,
      ph: Math.random() * Math.PI * 2,
    }));

    /* Projection constants */
    const FOV = 680;

    const project = (x: number, y: number, z: number) => {
      const depth = z + FOV;
      const sc = depth > 0 ? FOV / depth : 0;
      return {
        px: W / 2 + x * sc,
        py: H / 2 + y * sc - 30, // shift up slightly so headline sits below
        sc,
        nz: (z + RADIUS) / (2 * RADIUS), // 0=back 1=front
      };
    };

    let t = 0;

    const draw = () => {
      t += 0.003;
      ctx.clearRect(0, 0, W, H);

      /* Slow dual-axis rotation */
      const cy = Math.cos(t * 0.28),  sy = Math.sin(t * 0.28);
      const cx2 = Math.cos(t * 0.09), sx2 = Math.sin(t * 0.09);

      const proj = stars.map((s) => {
        // Y rotation
        let x = s.ox * cy  - s.oz * sy;
        let z = s.ox * sy  + s.oz * cy;
        let y = s.oy;
        // X tilt
        const y2 = y * cx2 - z * sx2;
        z        = y * sx2 + z * cx2;
        y = y2;
        s.x = x; s.y = y; s.z = z;
        return project(x, y, z);
      });

      /* ── Light rays emanating from centre ── */
      const rayCount = 8;
      for (let i = 0; i < rayCount; i++) {
        const angle = (i / rayCount) * Math.PI * 2 + t * 0.12;
        const len   = 180 + 40 * Math.sin(t * 0.7 + i);
        const grd   = ctx.createLinearGradient(
          W/2, H/2 - 30,
          W/2 + Math.cos(angle) * len,
          H/2 - 30 + Math.sin(angle) * len,
        );
        grd.addColorStop(0, "rgba(212,175,55,0.10)");
        grd.addColorStop(1, "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.moveTo(W/2, H/2 - 30);
        ctx.lineTo(W/2 + Math.cos(angle) * len, H/2 - 30 + Math.sin(angle) * len);
        ctx.strokeStyle = grd;
        ctx.lineWidth   = 1.2;
        ctx.stroke();
      }

      /* ── Constellation edges ── */
      stars.forEach((s, i) => {
        const pA = proj[i];
        s.conn.forEach((j) => {
          const pB = proj[j];
          const nz = (pA.nz + pB.nz) * 0.5;
          if (nz < 0.08) return;

          const grd = ctx.createLinearGradient(pA.px, pA.py, pB.px, pB.py);
          const op  = nz * 0.28;
          grd.addColorStop(0,   `rgba(212,175,55,${op * 0.6})`);
          grd.addColorStop(0.5, `rgba(244,214,122,${op * 1.5})`);
          grd.addColorStop(1,   `rgba(212,175,55,${op * 0.6})`);
          ctx.beginPath();
          ctx.moveTo(pA.px, pA.py);
          ctx.lineTo(pB.px, pB.py);
          ctx.strokeStyle = grd;
          ctx.lineWidth   = 0.55 + nz * 0.55;
          ctx.stroke();
        });
      });

      /* ── Stars ── */
      stars.forEach((_, i) => {
        const p  = proj[i];
        const s  = stars[i];
        if (p.nz < 0.04) return;
        const tw = 0.65 + 0.35 * Math.sin(t * s.twinkleHz * 3.5 + s.twinklePhase);
        const r  = Math.max(0.4, s.r * p.sc * 0.82 * s.bright * tw);
        const op = Math.min(1, p.nz * s.bright * tw * 1.1);

        // Outer glow
        const glow = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r * 7);
        glow.addColorStop(0,   `rgba(244,214,122,${op * 0.5})`);
        glow.addColorStop(0.4, `rgba(212,175,55,${op * 0.14})`);
        glow.addColorStop(1,   "rgba(212,175,55,0)");
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 7, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(p.px, p.py, 0, p.px, p.py, r);
        core.addColorStop(0,   `rgba(255,252,230,${op})`);
        core.addColorStop(0.5, `rgba(244,214,122,${op * 0.9})`);
        core.addColorStop(1,   `rgba(212,175,55,${op * 0.35})`);
        ctx.beginPath();
        ctx.arc(p.px, p.py, r, 0, Math.PI * 2);
        ctx.fillStyle = core;
        ctx.fill();
      });

      /* ── Dust particles ── */
      DUST.forEach((d) => {
        d.x += d.vx; d.y += d.vy;
        if (d.x > W / 2 + 900) d.x = -900 + W / 2;
        if (d.x < -900 + W / 2) d.x = W / 2 + 900;
        if (d.y > H / 2 + 500) d.y = -500 + H / 2;
        if (d.y < -500 + H / 2) d.y = H / 2 + 500;
        const op = d.op * (0.5 + 0.5 * Math.sin(t * 1.6 + d.ph));
        ctx.beginPath();
        ctx.arc(d.x + W / 2, d.y + H / 2 - 30, d.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${op})`;
        ctx.fill();
      });

      /* ── Central orb / North Star focal point ── */
      const pulse = 22 + 5 * Math.sin(t * 1.4);
      const orb   = ctx.createRadialGradient(W/2, H/2-30, 0, W/2, H/2-30, pulse * 4);
      orb.addColorStop(0,   "rgba(255,252,230,0.22)");
      orb.addColorStop(0.3, "rgba(212,175,55,0.10)");
      orb.addColorStop(1,   "rgba(212,175,55,0)");
      ctx.beginPath();
      ctx.arc(W/2, H/2-30, pulse * 4, 0, Math.PI * 2);
      ctx.fillStyle = orb;
      ctx.fill();

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={cvRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

/* ────────────────────────────────────────────────
   Hero Section
   ──────────────────────────────────────────────── */
export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 100% 80% at 50% -5%, #130d01 0%, #08070f 38%, #050510 100%)",
      }}
    >
      {/* 3D constellation fills the entire section */}
      <ConstellationCanvas />

      {/* Radial depth vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 52%, transparent 35%, rgba(5,5,16,0.72) 100%)",
        }}
      />

      {/* ── Headline block — sits in the lower-centre of the constellation ── */}
      <div
        className="relative z-10 flex flex-col items-center text-center px-6"
        style={{ marginTop: "12vh" }}
      >
        {/* Main headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            fontFamily: "'Playfair Display', serif",
            color: "#FAF9F6",
            fontSize: "clamp(3rem, 7.5vw, 6.5rem)",
            fontWeight: 700,
            lineHeight: 1.04,
            letterSpacing: "-0.03em",
            maxWidth: "12ch",
            marginBottom: "1.5rem",
          }}
        >
          Fix Your Star
          <br />
          <span
            style={{
              background:
                "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 30%, #D4AF37 60%, #a07e18 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            with Starfix
          </span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.65 }}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
            color: "rgba(250,249,246,0.48)",
            maxWidth: "52ch",
            lineHeight: 1.78,
            fontWeight: 300,
            marginBottom: "2.8rem",
          }}
        >
          Stop navigating life alone. Get a personalized roadmap, expert mentors,
          and daily accountability to transform your mind, body, skills, and career.
        </motion.p>

      </div>

      {/* Bottom section fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            "linear-gradient(0deg, #050510 0%, rgba(5,5,16,0.7) 55%, transparent 100%)",
        }}
      />
    </section>
  );
}
