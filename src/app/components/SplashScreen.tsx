/**
 * Starfix Splash Screen — Ultra-Premium Luxury Edition
 *
 * Timing:
 *  0.0 s  Pure black screen
 *  0.3 s  Fine gold dust particles emerge
 *  0.7 s  Logo fades in, scales 95 → 100 %, soft halo appears
 *  1.2 s  "Starfix" wordmark fades in
 *  1.45s  Premium loading animation begins — orb sweeps continuously
 *  3.0 s  Elegant fade-out to homepage
 *
 * Design: focused glow, 5 strategic sparkles, sparse particles,
 * continuous gold-orb loading line, reduced spacing, no visual noise.
 */

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StarfixMark } from "./StarfixLogo";

/* ─── Constants ─────────────────────────────────────────────── */
const MARK_W   = 132;
const HOLD_MS  = 3000;   // fade starts at 3.0 s
const FADE_DUR = 0.58;   // seconds

/* ─── 5 strategic sparkles — near logo curves & text ────────── */
const SPARKLES = [
  { x: -78,  y: -62,  size: 5.5, delay: 0.5,  period: 2.6 },
  { x:  85,  y: -40,  size: 4.5, delay: 1.1,  period: 2.2 },
  { x: -62,  y:  80,  size: 4.0, delay: 0.75, period: 2.8 },
  { x:  72,  y:  72,  size: 3.5, delay: 1.35, period: 2.0 },
  { x:  22,  y: -90,  size: 3.0, delay: 0.95, period: 2.4 },
];

/* ─── 4-pointed sparkle star ─────────────────────────────────── */
function Sparkle({
  x, y, size, delay, period,
}: typeof SPARKLES[0]) {
  const arm  = 0.20;
  const path =
    `M 0,-1 L ${arm},-${arm} L 1,0 L ${arm},${arm} ` +
    `L 0,1 L -${arm},${arm} L -1,0 L -${arm},-${arm} Z`;

  const id = `sg${x}${y}`.replace(/[^a-z0-9]/gi, "_");

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position:   "absolute",
        top:        "50%",
        left:       "50%",
        width:      size,
        height:     size,
        marginTop:  -(size / 2) + y,
        marginLeft: -(size / 2) + x,
        pointerEvents: "none",
      }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{
        opacity: [0, 0.9, 0.55, 0.9, 0],
        scale:   [0.3, 1,   0.8,  1,   0.3],
      }}
      transition={{
        delay,
        duration:    period,
        repeat:      Infinity,
        ease:        "easeInOut",
        repeatDelay: 0.25 + Math.random() * 0.6,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="-1.15 -1.15 2.3 2.3"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient id={`${id}_g`} cx="50%" cy="28%" r="72%">
            <stop offset="0%"   stopColor="#FFFCE0" />
            <stop offset="48%"  stopColor="#F4D67A" />
            <stop offset="100%" stopColor="#B8900A" />
          </radialGradient>
          <filter id={`${id}_f`} x="-90%" y="-90%" width="280%" height="280%">
            <feGaussianBlur stdDeviation="0.25" result="b"/>
            <feMerge>
              <feMergeNode in="b"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d={path}
          fill={`url(#${id}_g)`}
          filter={`url(#${id}_f)`}
        />
      </svg>
    </motion.div>
  );
}

/* ─── Sparse gold dust canvas ────────────────────────────────── */
function DustCanvas() {
  const cvRef  = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const cv = cvRef.current;
    if (!cv) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    cv.width  = W * dpr;
    cv.height = H * dpr;
    const ctx = cv.getContext("2d")!;
    ctx.scale(dpr, dpr);

    const cx = W / 2, cy = H / 2;

    /* 52 sparse particles — small oval cloud around logo */
    const pts = Array.from({ length: 52 }, () => {
      const a  = Math.random() * Math.PI * 2;
      const rx = 30  + Math.random() * 165;
      const ry = 25  + Math.random() * 140;
      return {
        x:  cx + Math.cos(a) * rx,
        y:  cy + Math.sin(a) * ry,
        r:  0.15 + Math.random() * 0.68,
        op: 0.03 + Math.random() * 0.085,
        vx: (Math.random() - 0.5) * 0.026,
        vy: -(0.015 + Math.random() * 0.042),
        ph: Math.random() * Math.PI * 2,
        sp: 0.14 + Math.random() * 0.32,
      };
    });

    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.006;
      pts.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < cy - 200) {
          const a = Math.random() * Math.PI * 2;
          p.x = cx + Math.cos(a) * (30 + Math.random() * 140);
          p.y = cy + 140 + Math.random() * 65;
        }
        if (Math.abs(p.x - cx) > 220) p.x = cx + (Math.random() - 0.5) * 130;

        const tw = 0.32 + 0.68 * Math.sin(t * p.sp * 1.8 + p.ph);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212,175,55,${(p.op * tw).toFixed(3)})`;
        ctx.fill();
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={cvRef}
      aria-hidden="true"
      style={{
        position:      "absolute",
        inset:         0,
        width:         "100%",
        height:        "100%",
        pointerEvents: "none",
        filter:        "blur(0.35px)",
      }}
    />
  );
}

/* ─── Premium loading line with orb ─────────────────────────── */
function PremiumLoader() {
  const TRACK_W = 210;
  const ORB_W   = 7;
  const TRAIL_W = 50;
  const TOTAL_W = TRAIL_W + ORB_W; // 57 — orb+trail assembly width

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.45, duration: 0.45, ease: "easeOut" }}
      style={{ marginTop: "1.5rem", position: "relative", width: TRACK_W }}
    >
      {/* Track base */}
      <div
        style={{
          position:     "relative",
          height:       1.5,
          borderRadius: 2,
          background:   "rgba(212,175,55,0.13)",
          overflow:     "visible",
        }}
      >
        {/* Orb + trailing light — sweeps continuously left→right */}
        <motion.div
          initial={{ opacity: 1, x: -TOTAL_W }}
          style={{
            position:    "absolute",
            top:         "50%",
            y:           "-50%",
            display:     "flex",
            alignItems:  "center",
            width:       TOTAL_W,
            height:      8,
            pointerEvents: "none",
          }}
          animate={{ x: [-TOTAL_W, TRACK_W] }}
          transition={{
            delay:       1.45,
            duration:    1.95,
            repeat:      Infinity,
            ease:        [0.4, 0, 0.6, 1],
            repeatDelay: 0.25,
          }}
        >
          {/* Trail — fades in from left as orb leads */}
          <div
            style={{
              flex:       1,
              height:     2,
              borderRadius: 1,
              background: "linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.08) 25%, rgba(212,175,55,0.38) 75%, rgba(244,214,122,0.65) 100%)",
            }}
          />

          {/* Orb — bright gold core with soft bloom */}
          <div
            style={{
              width:        ORB_W,
              height:       ORB_W,
              borderRadius: "50%",
              flexShrink:   0,
              background:   "radial-gradient(circle, #FFFCE8 0%, #F4D67A 50%, rgba(180,120,0,0) 100%)",
              boxShadow:    "0 0 5px 2px rgba(212,175,55,0.70), 0 0 14px 4px rgba(212,175,55,0.22)",
            }}
          />
        </motion.div>

        {/* Independent shimmer sweep — offset timing for layered richness */}
        <motion.div
          initial={{ opacity: 1, left: "-28%" }}
          style={{
            position:     "absolute",
            top:          0,
            height:       "100%",
            width:        "28%",
            borderRadius: 2,
            background:   "linear-gradient(90deg, transparent, rgba(255,250,210,0.48), transparent)",
            pointerEvents: "none",
          }}
          animate={{ left: ["-28%", "128%"] }}
          transition={{
            delay:       1.75,
            duration:    1.55,
            repeat:      Infinity,
            ease:        [0.4, 0, 0.4, 1],
            repeatDelay: 0.65,
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Splash screen component ────────────────────────────────── */
interface Props {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(false), HOLD_MS);
    const t2 = setTimeout(() => onComplete(),      HOLD_MS + FADE_DUR * 1000 + 25);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="starfix-splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: FADE_DUR, ease: [0.4, 0, 0.2, 1] }}
          style={{
            position:       "fixed",
            inset:          0,
            zIndex:         9999,
            overflow:       "hidden",
            display:        "flex",
            flexDirection:  "column",
            alignItems:     "center",
            justifyContent: "center",
            /* Deep matte black with warm undertone — luxury base */
            background:
              "radial-gradient(ellipse 75% 65% at 50% 46%, #100900 0%, #060508 40%, #050505 100%)",
            pointerEvents: "none",
          }}
        >
          {/* ── Sparse gold dust (fades in at 0.3 s) ── */}
          <motion.div
            style={{ position: "absolute", inset: 0 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 1.0, ease: "easeOut" }}
          >
            <DustCanvas />
          </motion.div>

          {/* ── Focused golden halo — tight, not diffuse ── */}
          <motion.div
            aria-hidden="true"
            style={{
              position:      "absolute",
              width:         300,
              height:        400,
              borderRadius:  "50%",
              background:
                "radial-gradient(ellipse 52% 56% at 50% 50%, rgba(212,175,55,0.13) 0%, rgba(212,175,55,0.03) 55%, transparent 100%)",
              filter:        "blur(22px)",
              pointerEvents: "none",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.85, 1, 0.85] }}
            transition={{
              delay:    0.65,
              duration: 4.0,
              times:    [0, 0.18, 0.5, 1],
              repeat:   Infinity,
              ease:     "easeInOut",
            }}
          />

          {/* ── Strategic sparkles (5 only) ── */}
          <div
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
          >
            {SPARKLES.map((s, i) => (
              <Sparkle key={i} {...s} />
            ))}
          </div>

          {/* ── Logo ── fades in at 0.7 s, scales 95 → 100 % ── */}
          <motion.div
            style={{
              position:       "relative",
              zIndex:         1,
              display:        "flex",
              flexDirection:  "column",
              alignItems:     "center",
            }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1,  scale: 1    }}
            transition={{
              delay:    0.7,
              duration: 0.82,
              ease:     [0.22, 1, 0.36, 1],
            }}
          >
            {/* Chrome glow — follows ribbon silhouette, not a box */}
            <div
              style={{
                filter:
                  "drop-shadow(0 0 16px rgba(212,175,55,0.30)) drop-shadow(0 0 38px rgba(212,175,55,0.10))",
              }}
            >
              <StarfixMark width={MARK_W} />
            </div>

            {/* ── Wordmark — fades in at 1.2 s ── */}
            {/* Reduced gap: 0.9rem (≈15% less than previous 1.05rem) */}
            <motion.div
              style={{
                marginTop:            "0.9rem",
                fontFamily:           "'Playfair Display', serif",
                fontSize:             "1.9rem",
                fontWeight:           700,
                letterSpacing:        "-0.032em",
                lineHeight:           1,
                background:
                  "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 28%, #D4AF37 62%, #9a7818 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor:  "transparent",
                backgroundClip:       "text",
                filter:
                  "drop-shadow(0 0 8px rgba(212,175,55,0.22)) drop-shadow(0 0 20px rgba(212,175,55,0.08))",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                delay:    1.2,
                duration: 0.55,
                ease:     [0.4, 0, 0.2, 1],
              }}
            >
              Starfix
            </motion.div>

            {/* ── Premium loading line with orb ── */}
            <PremiumLoader />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
