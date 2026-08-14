import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";
import { Flame, Star, Award, Zap } from "lucide-react";

/* ── Mini SVG constellation map ── */
const NODES = [
  { id: 1,  x: 14, y: 68, label: "Foundation", done: true,  size: 9  },
  { id: 2,  x: 26, y: 44, label: "Mindset",    done: true,  size: 8  },
  { id: 3,  x: 21, y: 22, label: "Habits",     done: true,  size: 7  },
  { id: 4,  x: 41, y: 52, label: "Skills",     done: true,  size: 12 },
  { id: 5,  x: 54, y: 28, label: "Mastery",    done: false, size: 9,  active: true },
  { id: 6,  x: 67, y: 50, label: "Leadership", done: false, size: 8  },
  { id: 7,  x: 74, y: 24, label: "Legacy",     done: false, size: 11 },
  { id: 8,  x: 88, y: 40, label: "Peak",       done: false, size: 14 },
  { id: 9,  x: 34, y: 78, label: "Wellness",   done: true,  size: 7  },
  { id: 10, x: 50, y: 70, label: "Network",    done: false, size: 7  },
  { id: 11, x: 62, y: 76, label: "Impact",     done: false, size: 8  },
];

const EDGES = [[1,2],[2,3],[1,4],[2,4],[4,5],[3,5],[5,6],[6,7],[7,8],[1,9],[9,10],[10,11],[4,10],[6,11]];

function MapSVG() {
  const [prog, setProgress] = useState(0);

  useEffect(() => {
    let start: number | null = null;
    const dur = 1800;
    const tick = (ts: number) => {
      if (!start) start = ts;
      setProgress(Math.min((ts - start) / dur, 1));
      if ((ts - start) < dur) requestAnimationFrame(tick);
    };
    const id = setTimeout(() => requestAnimationFrame(tick), 600);
    return () => clearTimeout(id);
  }, []);

  const litEdges = EDGES.filter(([a, b]) => {
    const nA = NODES.find((n) => n.id === a);
    const nB = NODES.find((n) => n.id === b);
    return nA?.done && nB?.done;
  });

  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" style={{ overflow: "visible" }}>
      <defs>
        <radialGradient id="cpGold" cx="50%" cy="30%" r="70%">
          <stop offset="0%"  stopColor="#FFF8D0" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8a6a10" />
        </radialGradient>
        <filter id="cpGlow">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* All edges — dim */}
      {EDGES.map(([a,b],i) => {
        const A = NODES.find(n=>n.id===a)!;
        const B = NODES.find(n=>n.id===b)!;
        return <line key={`d${i}`} x1={A.x} y1={A.y} x2={B.x} y2={B.y} stroke="rgba(212,175,55,0.07)" strokeWidth="0.4"/>;
      })}

      {/* Lit edges — animated draw */}
      {litEdges.map(([a,b],i) => {
        const A = NODES.find(n=>n.id===a)!;
        const B = NODES.find(n=>n.id===b)!;
        const len = Math.hypot(B.x-A.x, B.y-A.y);
        return (
          <line
            key={`l${i}`}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            stroke="url(#cpGold)"
            strokeWidth="0.65"
            opacity={0.55}
            strokeDasharray={len}
            strokeDashoffset={len * (1 - prog)}
          />
        );
      })}

      {/* Nodes */}
      {NODES.map(n => (
        <g key={n.id} filter={(n.done || (n as any).active) ? "url(#cpGlow)" : undefined}>
          {(n as any).active && (
            <circle cx={n.x} cy={n.y} r={n.size * 2}>
              <animate attributeName="r" values={`${n.size*1.5};${n.size*2.8};${n.size*1.5}`} dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.4s" repeatCount="indefinite"/>
              <animate attributeName="fill" values="rgba(212,175,55,0.15);rgba(212,175,55,0.05);rgba(212,175,55,0.15)" dur="2.4s" repeatCount="indefinite"/>
            </circle>
          )}
          <circle
            cx={n.x} cy={n.y}
            r={n.size * 0.52}
            fill={n.done || (n as any).active ? "url(#cpGold)" : "rgba(40,40,55,0.9)"}
            opacity={n.done ? 1 : (n as any).active ? 0.9 : 0.3}
          />
          {n.done && <circle cx={n.x-n.size*0.15} cy={n.y-n.size*0.15} r={n.size*0.14} fill="rgba(255,255,255,0.5)"/>}
        </g>
      ))}

      {/* Labels */}
      {NODES.filter(n=>n.done||(n as any).active).map(n=>(
        <text key={`t${n.id}`} x={n.x} y={n.y+n.size*0.52+3} textAnchor="middle"
          fill={(n as any).active?"rgba(212,175,55,0.85)":"rgba(212,175,55,0.6)"}
          fontSize="2.6" fontFamily="Inter,sans-serif">
          {n.label}
        </text>
      ))}
    </svg>
  );
}

export function ConstellationProgress() {
  const ref   = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const stats = [
    { val: "Day 24", sub: "Streak" },
    { val: "7/11",   sub: "Nodes"  },
    { val: "64%",    sub: "Done"   },
  ];

  const milestones = [
    { icon: Flame,  label: "Orientation complete", done: true  },
    { icon: Zap,    label: "7-day streak earned",  done: true  },
    { icon: Star,   label: "Mindset node lit",      done: true  },
    { icon: Award,  label: "Mastery node — active", done: false },
  ];

  return (
    <section
      className="py-28 px-6"
      ref={ref}
      style={{
        background: "linear-gradient(180deg, #09090e 0%, #0c0a04 100%)",
      }}
    >
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

        {/* ── Left — constellation map ── */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div
            className="relative rounded-3xl overflow-hidden"
            style={{
              background: "rgba(9,8,16,0.95)",
              border: "1px solid rgba(212,175,55,0.12)",
              boxShadow: "0 0 80px rgba(212,175,55,0.04), inset 0 0 60px rgba(0,0,0,0.5)",
              aspectRatio: "4 / 3",
              padding: "2rem",
            }}
          >
            {/* Nebula glow */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "radial-gradient(ellipse 60% 50% at 35% 45%, rgba(212,175,55,0.04) 0%, transparent 60%), radial-gradient(ellipse 40% 35% at 70% 65%, rgba(120,80,200,0.04) 0%, transparent 50%)",
            }}/>
            <MapSVG />

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex items-center gap-4">
              {[
                { col: "#D4AF37", label: "Lit" },
                { col: "rgba(212,175,55,0.35)", label: "Active" },
                { col: "#2a2a3c", label: "Locked" },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.col }}/>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.6rem", color: "rgba(250,249,246,0.4)" }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Right — copy + stats ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <p className="uppercase tracking-[0.18em] text-[11px] mb-4" style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            Your journey visualised
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", letterSpacing: "-0.025em", marginBottom: "1.25rem" }}>
            A Living{" "}
            <span style={{ background: "linear-gradient(135deg, #F4D67A, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Star Map
            </span>
          </h2>
          <p style={{ fontFamily: "'Inter', sans-serif", color: "rgba(250,249,246,0.48)", fontSize: "0.95rem", lineHeight: 1.8, fontWeight: 300, marginBottom: "2rem" }}>
            Forget linear progress bars. Your transformation is a constellation — each node you light represents a mastered milestone, each golden line a bridge you've built.
          </p>

          {/* Milestone list */}
          <div className="flex flex-col gap-2.5 mb-8">
            {milestones.map((m) => (
              <div key={m.label} className="flex items-center gap-3.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: m.done ? "rgba(212,175,55,0.12)" : "rgba(255,255,255,0.03)",
                    border: m.done ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.07)",
                  }}
                >
                  <m.icon size={15} style={{ color: m.done ? "#D4AF37" : "rgba(250,249,246,0.2)" }}/>
                </div>
                <span style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.87rem",
                  color: m.done ? "rgba(250,249,246,0.8)" : "rgba(250,249,246,0.28)",
                  fontWeight: m.done ? 500 : 400,
                }}>
                  {m.label}
                </span>
                {m.done && (
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full" style={{
                    background: "rgba(212,175,55,0.09)",
                    color: "#D4AF37",
                    border: "1px solid rgba(212,175,55,0.18)",
                    fontFamily: "'DM Mono', monospace",
                  }}>✓</span>
                )}
              </div>
            ))}
          </div>

          {/* Stat chips */}
          <div
            className="grid grid-cols-3 gap-4 rounded-2xl p-5"
            style={{ background: "rgba(14,12,6,0.9)", border: "1px solid rgba(212,175,55,0.1)" }}
          >
            {stats.map(s => (
              <div key={s.sub} className="text-center">
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", fontWeight: 700, color: "#F4D67A" }}>{s.val}</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.68rem", color: "rgba(250,249,246,0.38)" }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
