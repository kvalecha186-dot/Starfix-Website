import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles } from "lucide-react";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import {
  getXpState, getRank, XP_CHANGED_EVENT, XP_FLY_EVENT, XP_GLOW_EVENT,
} from "../lib/xpSystem";

/* ─────────────────────────────────────────────────────────────────────────
   XP wallet card — a compact, secondary card that lives INSIDE the normal
   document flow (no position: fixed, no position: absolute). It's meant
   to sit in the right column of the dashboard hero, stacked above the
   Continue Watching card, so it scrolls and lays out like any other card
   and can never get clipped or overlap content below it.
───────────────────────────────────────────────────────────────────────── */

export function XpCornerCard() {
  const { isDesktop } = useViewport();
  const [state, setState] = useState(getXpState);
  const [iconPulse, setIconPulse] = useState(false); // icon-only pulse — task earned
  const [settling, setSettling] = useState(false);    // total row highlight — pending settled
  const prevTotal = useRef(state.totalXp);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const onChange = () => setState(getXpState());
    const onGlow = () => {
      setIconPulse(true);
      window.setTimeout(() => setIconPulse(false), 700);
    };
    window.addEventListener(XP_CHANGED_EVENT, onChange);
    window.addEventListener(XP_GLOW_EVENT, onGlow);

    // No dedicated "settle" event from the store (settlement can happen
    // silently on any read, e.g. app load) — a light poll here catches
    // "totalXp went up without a fresh task completion" and plays a
    // brief settle highlight for it.
    const pollId = window.setInterval(() => setState(getXpState()), 30000);

    return () => {
      window.removeEventListener(XP_CHANGED_EVENT, onChange);
      window.removeEventListener(XP_GLOW_EVENT, onGlow);
      window.clearInterval(pollId);
    };
  }, []);

  useEffect(() => {
    if (state.totalXp > prevTotal.current) {
      setSettling(true);
      window.setTimeout(() => setSettling(false), 900);
    }
    prevTotal.current = state.totalXp;
  }, [state.totalXp]);

  const rank = getRank(state.totalXp);

  return (
    <motion.div
      data-xp-wallet="true"
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      animate={{
        y: hover ? -1 : 0,
        boxShadow: hover ? "0 10px 26px rgba(212,165,20,0.12)" : "0 4px 14px rgba(212,165,20,0.06)",
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{
        // In-flow, always — no fixed/absolute positioning at any breakpoint.
        position: "static",
        width: isDesktop ? 240 : "100%",
        minHeight: 118,
        padding: 16,
        marginTop: 8,
        boxSizing: "border-box",
        background: "#fff",
        border: "1px solid rgba(212,165,20,0.16)",
        borderRadius: 22,
        fontFamily: "'Inter', sans-serif",
        overflow: "visible",
      }}
    >
      {/* Top row — small gold circle (left) + "PENDING" label (right) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <motion.div
          animate={iconPulse ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          style={{
            width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(155deg, ${C.gold}, #B88900)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Sparkles size={12} color="#fff" />
        </motion.div>
        <span style={{
          fontSize: "0.62rem", fontWeight: 700, color: C.textFaint,
          textTransform: "uppercase", letterSpacing: "0.06em",
        }}>
          Pending
        </span>
      </div>

      {/* Middle — today's pending XP */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: "28px", fontWeight: 600, color: C.text, lineHeight: 1 }}>+{state.todayXp} XP</span>
        <span style={{ fontSize: "14px", color: C.textMuted }}>Today</span>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: "rgba(212,165,20,0.20)", margin: "12px 0" }} />

      {/* Bottom row — total XP */}
      <motion.div
        animate={{ color: settling ? [C.textMuted, C.gold, C.textMuted] : C.textMuted }}
        transition={{ duration: 0.9 }}
        style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}
      >
        <span style={{ fontSize: "0.74rem", color: C.textMuted }}>Total XP</span>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: C.text }}>{state.totalXp.toLocaleString()} XP</span>
      </motion.div>

      {/* Progress bar toward next rank */}
      <div style={{ height: 4, width: "100%", borderRadius: 999, background: "#F4F1E8", overflow: "hidden", marginTop: 10 }}>
        <motion.div
          animate={{ width: `${rank.progressPct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #D4A514, #E7C86A)" }}
        />
      </div>
      {rank.next && (
        <div style={{ fontSize: "0.66rem", color: C.textFaint, marginTop: 6, textAlign: "right" }}>
          {(rank.next.min - state.totalXp).toLocaleString()} XP to {rank.next.name}
        </div>
      )}
    </motion.div>
  );
}

/* ─── Floating "+XP" badges that fly from the click point toward the
   wallet card, then fade. Purely visual — mount once per page. Since the
   wallet card is now in-flow (not fixed), the landing point is measured
   from the actual card element via a shared ref/id rather than a fixed
   viewport offset. ─────────────────────────────────────────────────── */

interface FlyBadge { id: number; amount: number; x: number; y: number }
let flyId = 0;

export function XpFlyLayer() {
  const [badges, setBadges] = useState<FlyBadge[]>([]);

  useEffect(() => {
    const onFly = (e: Event) => {
      const { amount, x, y } = (e as CustomEvent).detail;
      const id = ++flyId;
      setBadges((prev) => [...prev, { id, amount, x, y }]);
      window.setTimeout(() => setBadges((prev) => prev.filter((b) => b.id !== id)), 900);
    };
    window.addEventListener(XP_FLY_EVENT, onFly);
    return () => window.removeEventListener(XP_FLY_EVENT, onFly);
  }, []);

  // Best-effort landing point: the wallet card's own top-right position
  // in the document, found live via querySelector so it tracks the card's
  // real in-flow location instead of assuming a fixed corner.
  const getTarget = () => {
    const el = document.querySelector('[data-xp-wallet="true"]') as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      return { x: r.left + 24, y: r.top + 24 };
    }
    return { x: (typeof window !== "undefined" ? window.innerWidth - 120 : 0), y: 80 };
  };

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 70 }}>
      <AnimatePresence>
        {badges.map((b) => {
          const positive = b.amount >= 0;
          const target = getTarget();
          return (
          <motion.div
            key={b.id}
            initial={{ opacity: 0, x: b.x, y: b.y, scale: 0.8 }}
            animate={{ opacity: [0, 1, 1, 0], x: target.x, y: target.y, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed", left: 0, top: 0,
              fontSize: "0.86rem", fontWeight: 700,
              color: positive ? C.gold : C.textMuted,
              background: "#fff",
              border: positive ? `1px solid ${C.goldBorder}` : `1px solid ${C.border}`,
              borderRadius: 999, padding: "5px 12px",
              boxShadow: positive ? "0 6px 18px rgba(212,165,20,0.18)" : "0 4px 12px rgba(0,0,0,0.06)",
              fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
            }}
          >
            {positive ? "+" : "−"}{Math.abs(b.amount)} XP
          </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
