import { motion } from "motion/react";

/* ─────────────────────────────────────────────────────────────
   The S-ribbon path used by every stroke layer.
   ViewBox 280 × 400.  The S flows from upper-right (195,68)
   to lower-center-left (142,338) in two smooth arcs.
   ───────────────────────────────────────────────────────────── */
const S_PATH =
  "M 195,68 C 248,52 252,155 182,175 C 148,185 82,182 78,220 C 70,260 92,323 144,338";

/* ── 4-axis starburst helper ── */
function Starburst({
  cx, cy,
  longRay, shortRay,
  coreR,
  id,
  bright = false,
}: {
  cx: number; cy: number;
  longRay: number; shortRay: number;
  coreR: number;
  id: string;
  bright?: boolean;
}) {
  const rays = [
    { a: -90 }, { a: 0 }, { a: 90 }, { a: 180 }, // cardinal
    { a: -45, s: true }, { a: 45, s: true }, { a: 135, s: true }, { a: 225, s: true }, // diagonal (short)
  ];

  return (
    <g>
      {/* Outer atmospheric glow */}
      <radialGradient id={`${id}-halo`} cx="50%" cy="50%" r="50%">
        <stop offset="0%"   stopColor="rgba(244,214,122,0.45)" />
        <stop offset="60%"  stopColor="rgba(212,175,55,0.12)"  />
        <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
      </radialGradient>
      <circle
        cx={cx} cy={cy}
        r={longRay * 2.8}
        fill={`url(#${id}-halo)`}
      />

      {/* Pulse ring */}
      <circle
        cx={cx} cy={cy} r={longRay * 1.35}
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="0.6"
      />

      {/* Rays */}
      {rays.map(({ a, s }, i) => {
        const len = s ? shortRay : longRay;
        const rad = (a * Math.PI) / 180;
        const tipX = cx + Math.cos(rad) * len;
        const tipY = cy + Math.sin(rad) * len;
        const perpR = (a * Math.PI) / 180 + Math.PI / 2;
        const hw = s ? 0.8 : 1.6; // half-width at base
        const b1x = cx + Math.cos(perpR) * hw;
        const b1y = cy + Math.sin(perpR) * hw;
        const b2x = cx - Math.cos(perpR) * hw;
        const b2y = cy - Math.sin(perpR) * hw;
        return (
          <path
            key={i}
            d={`M ${b1x},${b1y} L ${tipX},${tipY} L ${b2x},${b2y} Z`}
            fill={`url(#${id}-ray)`}
          />
        );
      })}

      {/* Core jewel */}
      <radialGradient id={`${id}-jewel`} cx="35%" cy="30%" r="65%">
        <stop offset="0%"   stopColor="#FFFEF0" />
        <stop offset="35%"  stopColor="#FFF8D4" />
        <stop offset="70%"  stopColor="#F4D67A" />
        <stop offset="100%" stopColor="#C9A228" />
      </radialGradient>
      <circle cx={cx} cy={cy} r={coreR + 3}
        fill="rgba(0,0,0,0.4)"
        transform={`translate(1.5,2)`} />
      <circle cx={cx} cy={cy} r={coreR}
        fill={`url(#${id}-jewel)`} />
      {/* Specular dot */}
      <circle cx={cx - coreR * 0.28} cy={cy - coreR * 0.28}
        r={coreR * 0.32}
        fill="rgba(255,255,255,0.75)" />
    </g>
  );
}

/* ─────────────────────────────────────────────────────────────
   Full Logo Mark — returns the SVG mark only (no text)
   size = rendered px width (height = size × 1.43)
   ───────────────────────────────────────────────────────────── */
export function StarfixMark({ size = 280 }: { size?: number }) {
  const h = size * (400 / 280);

  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 280 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Starfix liquid gold S logo mark"
    >
      <defs>
        {/* ── Gold spectrum gradient (upper-left lit) ── */}
        <linearGradient id="goldMain" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFFBE4" />
          <stop offset="10%"  stopColor="#F8E896" />
          <stop offset="28%"  stopColor="#F4D67A" />
          <stop offset="48%"  stopColor="#D4AF37" />
          <stop offset="66%"  stopColor="#A07820" />
          <stop offset="82%"  stopColor="#7A5A0A" />
          <stop offset="100%" stopColor="#3A2A04" />
        </linearGradient>

        {/* Darker version for back-edge illusion */}
        <linearGradient id="goldDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#C9A228" />
          <stop offset="35%"  stopColor="#9A7818" />
          <stop offset="70%"  stopColor="#6A5010" />
          <stop offset="100%" stopColor="#2A1E02" />
        </linearGradient>

        {/* Bright specular – runs upper-left to lower-right */}
        <linearGradient id="goldSpec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,240,0.95)" />
          <stop offset="28%"  stopColor="rgba(255,248,200,0.6)"  />
          <stop offset="55%"  stopColor="rgba(244,214,122,0.25)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
        </linearGradient>

        {/* Edge rim highlight (thinnest top layer) */}
        <linearGradient id="goldRim" x1="5%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.85)" />
          <stop offset="30%"  stopColor="rgba(255,248,210,0.5)"  />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
        </linearGradient>

        {/* Starburst ray gradient */}
        <linearGradient id="top-sb-ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.0)"  />
          <stop offset="50%"  stopColor="rgba(255,252,220,0.75)" />
          <stop offset="100%" stopColor="rgba(255,248,200,0.0)"  />
        </linearGradient>
        <linearGradient id="bot-sb-ray" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,248,200,0.0)"  />
          <stop offset="50%"  stopColor="rgba(255,252,220,0.7)"  />
          <stop offset="100%" stopColor="rgba(255,255,255,0.0)"  />
        </linearGradient>

        {/* ── Filters ── */}
        {/* Soft atmospheric glow */}
        <filter id="aura" x="-60%" y="-40%" width="220%" height="180%">
          <feGaussianBlur stdDeviation="22" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
          </feMerge>
        </filter>

        {/* Drop shadow for ribbon depth */}
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="4" dy="8" stdDeviation="10"
            floodColor="rgba(0,0,0,0.75)" floodOpacity="1" />
        </filter>

        {/* Ribbon inner-glow */}
        <filter id="ribbonGlow" x="-15%" y="-10%" width="130%" height="120%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Starburst glow */}
        <filter id="sbGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Strong focal glow for final star */}
        <filter id="sbGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Atmospheric golden aura around the whole mark ── */}
      <ellipse cx="140" cy="200" rx="95" ry="150"
        fill="rgba(212,175,55,0.13)"
        filter="url(#aura)"
      />

      {/* ── Layer 0: Cast shadow (widest, blurred, offset) ── */}
      <path
        d={S_PATH}
        stroke="rgba(0,0,0,0.7)"
        strokeWidth="48"
        strokeLinecap="round"
        fill="none"
        transform="translate(5, 9)"
        filter="url(#shadow)"
        opacity="0.8"
      />

      {/* ── Layer 1: Dark back-face of ribbon ── */}
      <path
        d={S_PATH}
        stroke="url(#goldDark)"
        strokeWidth="38"
        strokeLinecap="round"
        fill="none"
      />

      {/* ── Layer 2: Main gold body ── */}
      <path
        d={S_PATH}
        stroke="url(#goldMain)"
        strokeWidth="30"
        strokeLinecap="round"
        fill="none"
        filter="url(#ribbonGlow)"
      />

      {/* ── Layer 3: Sheen — thinner, brighter ── */}
      <path
        d={S_PATH}
        stroke="url(#goldSpec)"
        strokeWidth="15"
        strokeLinecap="round"
        fill="none"
        opacity="0.88"
      />

      {/* ── Layer 4: Specular highlight ridge — thinnest ── */}
      <path
        d={S_PATH}
        stroke="url(#goldRim)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
        opacity="0.75"
      />

      {/* ── Starburst — top endpoint (195, 68) ── */}
      <g filter="url(#sbGlow)">
        <Starburst cx={195} cy={68} longRay={24} shortRay={13} coreR={5.5} id="top-sb" />
      </g>

      {/* ── Starburst — bottom endpoint (144, 338), burns brightest ── */}
      <g filter="url(#sbGlowStrong)">
        <Starburst cx={144} cy={338} longRay={30} shortRay={16} coreR={7} id="bot-sb" bright />
      </g>

      {/* ── Fine detail: edge micro-highlights along the ribbon ── */}
      {/* Upper-loop outer edge glint */}
      <path
        d="M 200,72 C 242,56, 246,125, 215,155"
        stroke="rgba(255,255,235,0.35)"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Lower-loop inner edge glint */}
      <path
        d="M 96,222 C 80,255, 97,316, 135,334"
        stroke="rgba(255,255,235,0.25)"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   Full brand lockup: mark + name + tagline
   ───────────────────────────────────────────────────────────── */
export function StarfixBrandLockup() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center text-center select-none"
    >
      {/* Mark */}
      <div
        style={{
          filter:
            "drop-shadow(0 0 40px rgba(212,175,55,0.35)) drop-shadow(0 0 80px rgba(212,175,55,0.15))",
        }}
      >
        <StarfixMark size={220} />
      </div>

      {/* Wordmark */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35 }}
        style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "clamp(2rem, 5vw, 3rem)",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          background:
            "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 28%, #D4AF37 58%, #A07820 82%, #7A5A0A 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          lineHeight: 1,
          marginTop: "-0.5rem",
          marginBottom: "1.2rem",
        }}
      >
        Starfix
      </motion.div>

      {/* Divider */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.55 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className="h-px w-14" style={{ background: "linear-gradient(90deg, transparent, rgba(212,175,55,0.45))" }} />
        <span style={{ color: "rgba(212,175,55,0.4)", fontSize: "0.5rem", letterSpacing: "0.35em" }}>✦</span>
        <div className="h-px w-14" style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.45), transparent)" }} />
      </motion.div>

      {/* Tagline */}
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.62rem",
          fontWeight: 500,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(212,175,55,0.7)",
        }}
      >
        AI-Powered Personal Transformation
      </motion.span>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Compact version for Navbar (uses the ribbon S mark inline)
   ───────────────────────────────────────────────────────────── */
export function StarfixNavMark({ size = 34 }: { size?: number }) {
  const h = size * (400 / 280);
  return (
    <svg
      width={size} height={h}
      viewBox="0 0 280 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Starfix"
    >
      <defs>
        <linearGradient id="nm-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FFF8D4" />
          <stop offset="30%"  stopColor="#F4D67A" />
          <stop offset="60%"  stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#7A5A0A" />
        </linearGradient>
        <linearGradient id="nm-spec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,240,0.9)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"    />
        </linearGradient>
        <filter id="nm-glow" x="-30%" y="-20%" width="160%" height="140%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* Shadow */}
      <path d={S_PATH} stroke="rgba(0,0,0,0.5)" strokeWidth="40" strokeLinecap="round" fill="none"
        transform="translate(3,6)" />

      {/* Body */}
      <path d={S_PATH} stroke="url(#nm-gold)" strokeWidth="32" strokeLinecap="round" fill="none"
        filter="url(#nm-glow)" />

      {/* Specular */}
      <path d={S_PATH} stroke="url(#nm-spec)" strokeWidth="12" strokeLinecap="round" fill="none" />

      {/* Tiny starbursts at endpoints */}
      {[{ cx: 195, cy: 68, r: 4 }, { cx: 144, cy: 338, r: 5 }].map(({ cx, cy, r }, i) => (
        <g key={i}>
          {[0, 90, 180, 270].map((a) => {
            const rad = (a * Math.PI) / 180;
            const len = r * 3.2;
            return (
              <line key={a}
                x1={cx} y1={cy}
                x2={cx + Math.cos(rad) * len}
                y2={cy + Math.sin(rad) * len}
                stroke="rgba(255,248,200,0.85)" strokeWidth="1.2"
                strokeLinecap="round"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={r} fill="#FFFBE0" />
        </g>
      ))}
    </svg>
  );
}
