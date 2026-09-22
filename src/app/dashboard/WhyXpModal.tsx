import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Check, ShieldCheck, Flame, Target, Award, TrendingUp } from "lucide-react";
import { C } from "./dashColors";

export function WhyXpButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1, boxShadow: "0 4px 16px rgba(230, 194, 106, 0.28)" }}
      whileTap={{ scale: 0.98 }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: C.surfaceAlt,
        border: `1px solid ${C.goldBorder}`,
        borderRadius: 999,
        padding: "7px 16px",
        fontSize: "14px",
        fontWeight: 500,
        color: C.gold,
        fontFamily: "'Inter', sans-serif",
        boxShadow: "0 2px 10px rgba(230, 194, 106, 0.16)",
        cursor: "pointer",
        transition: "all 180ms ease",
        letterSpacing: "0.01em",
      }}
    >
      <Sparkles size={14} color={C.gold} />
      <span>Why XP?</span>
    </motion.button>
  );
}

export function WhyXpModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 130,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5, 5, 16, 0.65)",
          backdropFilter: "blur(6px)",
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.surface,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 24,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(212,175,55,0.12)",
            width: "100%",
            maxWidth: 580,
            maxHeight: "88vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "24px 32px 18px",
              borderBottom: `1px solid ${C.border}`,
              background: `linear-gradient(180deg, ${C.surfaceAlt} 0%, ${C.surface} 100%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "rgba(212,175,55,0.15)",
                  border: `1px solid ${C.goldBorder}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Sparkles size={18} color={C.gold} />
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.5rem",
                  fontWeight: 700,
                  color: C.text,
                  margin: 0,
                  letterSpacing: "-0.01em",
                }}
              >
                Why XP?
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                color: C.textMuted,
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
              }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Body Content */}
          <div
            style={{
              padding: "28px 32px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 22,
              color: C.text,
              fontSize: "0.9rem",
              lineHeight: 1.65,
            }}
          >
            {/* Intro */}
            <div>
              <p style={{ fontSize: "1.05rem", fontWeight: 600, color: C.text, margin: "0 0 10px", lineHeight: 1.4 }}>
                XP is not a leaderboard for popularity.
              </p>
              <p style={{ color: C.textMuted, margin: "0 0 14px" }}>
                In Starfix, XP measures meaningful growth across five dimensions:
              </p>
              <div
                style={{
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  borderRadius: 16,
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>•</span>
                  <span><strong>Consistency</strong> — showing up regularly</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>•</span>
                  <span><strong>Depth</strong> — learning beyond the surface</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>•</span>
                  <span><strong>Execution</strong> — completing real tasks and projects</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>•</span>
                  <span><strong>Mentor feedback</strong> — applying guidance effectively</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: C.gold, fontWeight: 700 }}>•</span>
                  <span><strong>Long-term growth</strong> — improving over time, not overnight</span>
                </div>
              </div>
            </div>

            {/* How XP works */}
            <div>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
                How XP works
              </h3>
              <p style={{ margin: "0 0 8px", color: C.textMuted }}>
                <strong style={{ color: "#00B67A" }}>+ Positive XP</strong> is earned when you complete tasks, finish sessions, submit projects, practice consistently, and receive mentor approval.
              </p>
              <p style={{ margin: 0, color: C.textMuted }}>
                <strong style={{ color: C.textMuted }}>− Negative XP</strong> appears only when a completed task is intentionally undone or removed.
              </p>
            </div>

            {/* Pending XP */}
            <div>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
                Pending XP
              </h3>
              <p style={{ margin: 0, color: C.textMuted }}>
                Newly earned XP first appears as “Pending XP” for a few hours before being added to your total. This keeps progress accurate and prevents accidental changes.
              </p>
            </div>

            {/* Levels */}
            <div>
              <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: C.text, margin: "0 0 8px" }}>
                Levels
              </h3>
              <p style={{ margin: 0, color: C.textMuted }}>
                XP unlocks growth stages such as Learner, Builder, Creator, and Mentor. These stages represent your learning journey, not your social status.
              </p>
            </div>

            {/* Conclusion */}
            <div
              style={{
                borderTop: `1px solid ${C.border}`,
                paddingTop: 16,
                fontStyle: "italic",
                color: C.text,
                fontWeight: 500,
                textAlign: "center",
              }}
            >
              The goal of XP is simple: reward real effort, real learning, and real progress.
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: "16px 32px 24px",
              borderTop: `1px solid ${C.border}`,
              background: C.surface,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <motion.button
              type="button"
              onClick={onClose}
              whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(230, 194, 106, 0.32)" }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: C.surfaceAlt,
                border: `1px solid ${C.goldBorder}`,
                borderRadius: 999,
                padding: "10px 32px",
                fontSize: "0.86rem",
                fontWeight: 600,
                color: C.gold,
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 2px 12px rgba(230, 194, 106, 0.18)",
                cursor: "pointer",
                transition: "all 180ms ease",
              }}
            >
              <Sparkles size={14} color={C.gold} />
              <span>Got it</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
