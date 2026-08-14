/**
 * Starfix premium logo mark.
 *
 * A continuous fluid gold ribbon that twists to form the letter S,
 * with 4-axis starburst endpoints. Rendered in SVG with layered
 * strokes that simulate a polished chrome-gold finish under studio
 * lighting (light source: upper-left).
 *
 * No external dependencies — pure SVG + React.
 */

/* ─── S-ribbon path ─────────────────────────────────────────────
   viewBox 0 0 280 420
   Start: (195, 68)  top-right   →  starburst A
   End  : (144, 338) lower-left  →  starburst B          */
const S = "M 195,68 C 248,52 252,155 182,175 C 148,185 82,182 78,220 C 70,260 92,323 144,338";

/* ─── 4-axis starburst ───────────────────────────────────────── */
function Starburst({
  cx, cy, R, r, coreR, idBase,
}: {
  cx: number; cy: number;
  R: number;     // long ray length
  r: number;     // short (diagonal) ray length
  coreR: number; // jewel radius
  idBase: string;
}) {
  const angles = {
    cardinal: [270, 0, 90, 180],     // up right down left
    diagonal: [315, 45, 135, 225],
  };

  const ray = (angleDeg: number, len: number) => {
    const a = (angleDeg * Math.PI) / 180;
    const tipX = cx + Math.cos(a) * len;
    const tipY = cy + Math.sin(a) * len;
    const perp = a + Math.PI / 2;
    const hw = len < R ? 0.9 : 1.5;          // half-width at base
    return `M ${cx + Math.cos(perp) * hw},${cy + Math.sin(perp) * hw}
            L ${tipX},${tipY}
            L ${cx - Math.cos(perp) * hw},${cy - Math.sin(perp) * hw} Z`;
  };

  return (
    <>
      {/* Outer halo */}
      <circle cx={cx} cy={cy} r={R * 2.8} fill={`url(#${idBase}-halo)`} />
      {/* Inner glow ring */}
      <circle cx={cx} cy={cy} r={R * 1.35}
        fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="0.7" />
      {/* Cardinal rays */}
      {angles.cardinal.map((a, i) => (
        <path key={`c${i}`} d={ray(a, R)} fill={`url(#${idBase}-ray)`} />
      ))}
      {/* Diagonal sub-rays */}
      {angles.diagonal.map((a, i) => (
        <path key={`d${i}`} d={ray(a, r)} fill={`url(#${idBase}-ray)`} opacity={0.65} />
      ))}
      {/* Jewel */}
      <circle cx={cx} cy={cy} r={coreR} fill={`url(#${idBase}-jewel)`} />
      {/* Specular dot */}
      <circle cx={cx - coreR * 0.3} cy={cy - coreR * 0.32}
        r={coreR * 0.35} fill="rgba(255,255,255,0.75)" />
    </>
  );
}

/* ─── Full mark SVG ─────────────────────────────────────────── */
export function StarfixMark({
  width = 200,
}: {
  width?: number;
}) {
  const vW = 280, vH = 420;
  const height = Math.round(width * (vH / vW));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${vW} ${vH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Starfix logo mark"
    >
      <defs>
        {/* ── Ribbon gradients — studio light from upper-left ── */}
        <linearGradient id="sf-body" x1="8%" y1="3%" x2="92%" y2="97%">
          <stop offset="0%"   stopColor="#FFFCE8" />
          <stop offset="10%"  stopColor="#F8EB90" />
          <stop offset="26%"  stopColor="#F4D67A" />
          <stop offset="46%"  stopColor="#D4AF37" />
          <stop offset="64%"  stopColor="#A07820" />
          <stop offset="80%"  stopColor="#7A5A0A" />
          <stop offset="100%" stopColor="#3A2A04" />
        </linearGradient>

        <linearGradient id="sf-dark" x1="8%" y1="3%" x2="92%" y2="97%">
          <stop offset="0%"   stopColor="#C9A228" />
          <stop offset="38%"  stopColor="#8C6810" />
          <stop offset="100%" stopColor="#241800" />
        </linearGradient>

        <linearGradient id="sf-sheen" x1="5%" y1="0%" x2="95%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,240,0.95)" />
          <stop offset="22%"  stopColor="rgba(255,250,200,0.58)" />
          <stop offset="50%"  stopColor="rgba(244,214,122,0.22)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
        </linearGradient>

        {/* ── Starburst A (top, 195 68) ── */}
        <radialGradient id="sbA-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(244,214,122,0.50)" />
          <stop offset="55%"  stopColor="rgba(212,175,55,0.14)"  />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
        </radialGradient>
        <linearGradient id="sbA-ray" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%"   stopColor="rgba(255,255,220,0)"    />
          <stop offset="50%"  stopColor="rgba(255,252,210,0.90)" />
          <stop offset="100%" stopColor="rgba(255,255,220,0)"    />
        </linearGradient>
        <radialGradient id="sbA-jewel" cx="36%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFFEEE" />
          <stop offset="42%"  stopColor="#F4D67A" />
          <stop offset="100%" stopColor="#C9A228" />
        </radialGradient>

        {/* ── Starburst B (bottom, 144 338) — burns stronger ── */}
        <radialGradient id="sbB-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="rgba(255,248,200,0.75)" />
          <stop offset="45%"  stopColor="rgba(212,175,55,0.28)"  />
          <stop offset="100%" stopColor="rgba(212,175,55,0)"     />
        </radialGradient>
        <linearGradient id="sbB-ray" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%"   stopColor="rgba(255,255,220,0)"    />
          <stop offset="50%"  stopColor="rgba(255,254,220,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,220,0)"    />
        </linearGradient>
        <radialGradient id="sbB-jewel" cx="36%" cy="30%" r="65%">
          <stop offset="0%"   stopColor="#FFFFFF" />
          <stop offset="38%"  stopColor="#F4D67A" />
          <stop offset="100%" stopColor="#C9A228" />
        </radialGradient>

        {/* ── Filters ── */}
        <filter id="sf-shadow" x="-20%" y="-10%" width="140%" height="130%">
          <feDropShadow dx="3" dy="9" stdDeviation="11"
            floodColor="rgba(0,0,0,0.78)" floodOpacity="1" />
        </filter>

        <filter id="sf-glow" x="-18%" y="-12%" width="136%" height="124%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sf-sbA" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sf-sbB" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="13" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="sf-aura" x="-50%" y="-40%" width="200%" height="180%">
          <feGaussianBlur stdDeviation="28" />
        </filter>
      </defs>

      {/* ── Atmospheric aura ── */}
      <ellipse cx="140" cy="205" rx="105" ry="155"
        fill="rgba(212,175,55,0.13)" filter="url(#sf-aura)" />

      {/* ── Cast shadow (offset + blurred) ── */}
      <path d={S}
        stroke="rgba(0,0,0,0.72)" strokeWidth="52" strokeLinecap="round" fill="none"
        transform="translate(4,10)" filter="url(#sf-shadow)" opacity="0.65" />

      {/* ── Dark back-face of ribbon ── */}
      <path d={S}
        stroke="url(#sf-dark)" strokeWidth="44" strokeLinecap="round" fill="none" />

      {/* ── Primary gold body ── */}
      <path d={S}
        stroke="url(#sf-body)" strokeWidth="34" strokeLinecap="round" fill="none"
        filter="url(#sf-glow)" />

      {/* ── Specular sheen ── */}
      <path d={S}
        stroke="url(#sf-sheen)" strokeWidth="14" strokeLinecap="round" fill="none"
        opacity="0.88" />

      {/* ── Finest specular ridge ── */}
      <path d={S}
        stroke="rgba(255,255,235,0.55)" strokeWidth="3.5" strokeLinecap="round"
        fill="none" />

      {/* ── Fine edge glints (hand-placed micro-highlights) ── */}
      <path d="M 200,72 C 242,57, 246,125, 216,152"
        stroke="rgba(255,255,230,0.32)" strokeWidth="2.2" strokeLinecap="round"
        fill="none" />
      <path d="M 94,225 C 78,258, 97,314, 136,332"
        stroke="rgba(255,255,230,0.22)" strokeWidth="1.8" strokeLinecap="round"
        fill="none" />

      {/* ── Starburst A — top endpoint (195, 68) ── */}
      <g filter="url(#sf-sbA)">
        <Starburst cx={195} cy={68} R={22} r={12} coreR={5.5} idBase="sbA" />
      </g>

      {/* ── Starburst B — bottom endpoint (144, 338), stronger ── */}
      <g filter="url(#sf-sbB)">
        <Starburst cx={144} cy={338} R={29} r={16} coreR={7.5} idBase="sbB" />
      </g>
    </svg>
  );
}

/* ─── Logo lockup: mark + wordmark ─────────────────────────── */
export function StarfixLogo({
  size = 38,
  showText = true,
  textColor = "#FAF9F6",
}: {
  size?: number;
  showText?: boolean;
  textColor?: string;
}) {
  /* Mark viewBox is 280×420; rendered height at given `size` width */
  const markW = size;

  return (
    <div
      className="flex items-center select-none"
      style={{ gap: showText ? Math.round(markW * 0.45) : 0 }}
    >
      <StarfixMark width={markW} />

      {showText && (
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: Math.round(markW * 0.62),
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1,
            background:
              "linear-gradient(135deg, #FFF8D4 0%, #F4D67A 30%, #D4AF37 65%, #9a7818 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            color: textColor,
          }}
        >
          Starfix
        </span>
      )}
    </div>
  );
}
