import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, X, Send, ArrowRight, Circle,
} from "lucide-react";
import { C } from "./dashColors";
import type { DashPage } from "./DashboardLayout";
import type { UserProfile } from "../types";
import { runCoachPipeline } from "../lib/coachEngine/pipelineRunner";
import { sessionState } from "../lib/coachEngine/stateMachine";

/* ─────────────────────────────────────────────────────────────────────────
   AI Coach — a floating assistant powered by the coachEngine pipeline:
   evaluates structured conversation state, single-pass classification, and
   data grounding for zero signal blending and coherent replies.
───────────────────────────────────────────────────────────────────────── */

interface Msg {
  id: string;
  from: "user" | "coach";
  text?: string;
  plan?: PlanBlock;
  chips?: string[];
  actions?: { label: string; page: DashPage; category?: string }[];
  time: number;
}

interface PlanBlock {
  heading: string;
  lines: { label: string; value: string }[];
  weekList?: string[];
  today?: string;
}

const SUGGESTED = [
  "Help me achieve my goal",
  "Create a study plan",
  "Find the right mentor",
  "What should I do today?",
];

function uid() { return Math.random().toString(36).slice(2); }

/* ─── Component ────────────────────────────────────── */

export function AICoach({
  onNavigate, onGoToMentors, userProfile,
}: {
  onNavigate?: (p: DashPage) => void;
  onGoToMentors?: (category: string) => void;
  userProfile?: UserProfile | null;
}) {
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [showResume, setShowResume] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const check = () => setMobile(window.innerWidth <= 480);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Load history + decide whether to show "continue previous conversation"
  useEffect(() => {
    try {
      const raw = localStorage.getItem("starfix:coachHistory");
      if (raw) {
        const saved: Msg[] = JSON.parse(raw);
        if (saved.length) {
          const last = saved[saved.length - 1];
          const hoursSince = (Date.now() - last.time) / 36e5;
          if (hoursSince > 24) setShowResume(true);
          else setMessages(saved);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (messages.length) {
      try { localStorage.setItem("starfix:coachHistory", JSON.stringify(messages.slice(-40))); } catch {}
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const push = (m: Omit<Msg, "id" | "time">) =>
    setMessages((prev) => [...prev, { ...m, id: uid(), time: Date.now() }]);

  function handleSend(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text) return;
    setInput("");
    setShowResume(false);

    // Push user message
    push({ from: "user", text });

    // Run classify-and-route pipeline
    const coachMsgs = runCoachPipeline(text, userProfile);

    coachMsgs.forEach((cm) => {
      push(cm);
    });
  }

  const size = mobile ? 52 : 58;

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileHover={{ y: -2, boxShadow: `0 6px 22px ${C.goldBorder}` }}
        whileTap={{ scale: 0.96 }}
        style={{
          position: "fixed",
          bottom: mobile ? 18 : 26,
          right: mobile ? 18 : 26,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "#fff",
          border: `1px solid ${C.goldBorder}`,
          boxShadow: `0 2px 12px rgba(201,162,39,0.16)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: 60,
        }}
        aria-label="Open AI Coach"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? "close" : "open"}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            style={{ display: "flex" }}
          >
            {open ? <X size={20} color={C.gold} strokeWidth={1.8} /> : <Sparkles size={20} color={C.gold} strokeWidth={1.8} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: "fixed",
              bottom: mobile ? 82 : 96,
              right: mobile ? 14 : 26,
              width: mobile ? "calc(100vw - 28px)" : 360,
              height: 560,
              maxHeight: "calc(100vh - 120px)",
              background: "#fff",
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 24,
              boxShadow: "0 16px 48px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              zIndex: 60,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* Header */}
            <div style={{ padding: "18px 20px", borderBottom: `1px solid ${C.borderMuted}`, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: C.goldLight,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Sparkles size={16} color={C.gold} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.92rem", fontWeight: 700, color: C.text, fontFamily: "'Playfair Display', serif" }}>AI Coach</span>
                  <Circle size={7} color="#10B981" fill="#10B981" />
                </div>
                <div style={{ fontSize: "0.7rem", color: C.textMuted }}>Your personal growth assistant</div>
              </div>
            </div>

            {/* Body */}
            <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
              {showResume && (
                <button
                  onClick={() => {
                    try {
                      const raw = localStorage.getItem("starfix:coachHistory");
                      if (raw) setMessages(JSON.parse(raw));
                    } catch {}
                    setShowResume(false);
                  }}
                  style={{
                    alignSelf: "center", fontSize: "0.74rem", color: C.gold, background: C.goldLight,
                    border: `1px solid ${C.goldBorder}`, borderRadius: 999, padding: "6px 14px", cursor: "pointer",
                    fontFamily: "'Inter', sans-serif",
                  }}
                >
                  Continue previous conversation
                </button>
              )}

              {messages.length === 0 && !showResume && (
                <div style={{ textAlign: "center", padding: "24px 8px", color: C.textMuted, fontSize: "0.82rem", lineHeight: 1.6 }}>
                  Ask me about any goal — coding, fitness, design, communication — and I'll build you a plan.
                </div>
              )}

              {messages.map((m) => <Bubble key={m.id} m={m} onSend={handleSend} onNavigate={onNavigate} onGoToMentors={onGoToMentors} />)}

              {messages.length === 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 4 }}>
                  {SUGGESTED.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleSend(s)}
                      style={{
                        fontSize: "0.76rem", color: C.text, background: C.surfaceAlt,
                        border: `1px solid ${C.borderMuted}`, borderRadius: 999, padding: "7px 13px",
                        cursor: "pointer", fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div style={{ padding: "12px 14px", borderTop: `1px solid ${C.borderMuted}`, display: "flex", gap: 8 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="Ask your coach anything…"
                style={{
                  flex: 1, padding: "10px 14px", borderRadius: 999, border: `1px solid ${C.border}`,
                  background: C.surfaceAlt, color: C.text, fontSize: "0.82rem", outline: "none",
                  fontFamily: "'Inter', sans-serif",
                }}
              />
              <motion.button
                whileHover={{ opacity: 0.85 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => handleSend()}
                style={{
                  width: 36, height: 36, borderRadius: "50%", background: C.gold, border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
                }}
              >
                <Send size={14} color="#fff" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Message bubble ───────────────────────────────── */

function Bubble({
  m, onSend, onNavigate, onGoToMentors,
}: {
  m: Msg;
  onSend: (t: string) => void;
  onNavigate?: (p: DashPage) => void;
  onGoToMentors?: (category: string) => void;
}) {
  const isUser = m.from === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "88%" }}>
        {m.text && (
          <div
            style={{
              background: isUser ? C.gold : C.surfaceAlt,
              color: isUser ? "#fff" : C.text,
              padding: "10px 14px",
              borderRadius: isUser ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              fontSize: "0.84rem",
              lineHeight: 1.55,
            }}
          >
            {m.text}
          </div>
        )}

        {m.plan && (
          <div style={{ background: C.surfaceAlt, border: `1px solid ${C.borderMuted}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: "0.86rem", fontWeight: 700, color: C.text, marginBottom: 8 }}>{m.plan.heading}</div>
            {m.plan.lines.map((l) => (
              <div key={l.label} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", padding: "3px 0" }}>
                <span style={{ color: C.textMuted }}>{l.label}</span>
                <span style={{ color: C.text, fontWeight: 500 }}>{l.value}</span>
              </div>
            ))}
            {m.plan.weekList && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: "0.72rem", color: C.textFaint, marginBottom: 4 }}>This week</div>
                {m.plan.weekList.map((t, i) => (
                  <div key={t} style={{ fontSize: "0.78rem", color: C.text, padding: "2px 0" }}>{i + 1}. {t}</div>
                ))}
              </div>
            )}
            {m.plan.today && (
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: "0.72rem", color: C.textFaint, marginBottom: 2 }}>Today's task</div>
                <div style={{ fontSize: "0.8rem", color: C.text }}>{m.plan.today}</div>
              </div>
            )}
          </div>
        )}

        {m.chips && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {m.chips.map((c) => (
              <button
                key={c}
                onClick={() => onSend(c)}
                style={{
                  fontSize: "0.74rem", color: C.text, background: "#fff",
                  border: `1px solid ${C.border}`, borderRadius: 999, padding: "6px 12px",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {m.actions && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {m.actions.map((a) => (
              <button
                key={a.label}
                onClick={() => (a.category ? onGoToMentors?.(a.category) : onNavigate?.(a.page))}
                style={{
                  display: "flex", alignItems: "center", gap: 5, fontSize: "0.76rem", fontWeight: 600,
                  color: "#fff", background: C.gold, border: "none", borderRadius: 999, padding: "7px 13px",
                  cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                {a.label} <ArrowRight size={11} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
