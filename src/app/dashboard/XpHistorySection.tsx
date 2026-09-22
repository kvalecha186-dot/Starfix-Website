import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Filter, Sparkles, ArrowRight } from "lucide-react";
import { C } from "./dashColors";
import { useViewport } from "../lib/useViewport";
import { getXpLog } from "../lib/xpSystem";
import { WhyXpButton, WhyXpModal } from "./WhyXpModal";

function relativeGroup(at: number): string {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 86400000;
  const weekStart = todayStart - 6 * 86400000;

  if (at >= todayStart) return "TODAY";
  if (at >= yesterdayStart) return "YESTERDAY";
  if (at >= weekStart) return "THIS WEEK";
  return "EARLIER";
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: C.surface,
        border: "1px solid rgba(212,169,31,0.12)",
        boxShadow: "0 8px 24px rgba(212,169,31,0.06)",
        borderRadius: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Full XP History Drawer / Modal ─────────────────────────────────── */
export function XpHistoryModal({
  open,
  onClose,
  log,
}: {
  open: boolean;
  onClose: () => void;
  log: { id: string; label: string; amount: number; at: number }[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all");
  const { isDesktop } = useViewport();

  const filteredLog = useMemo(() => {
    return log.filter((item) => {
      const matchesSearch = item.label.toLowerCase().includes(search.toLowerCase());
      const matchesFilter =
        filter === "all"
          ? true
          : filter === "positive"
          ? item.amount > 0
          : item.amount < 0;
      return matchesSearch && matchesFilter;
    });
  }, [log, search, filter]);

  const groupedLog = useMemo(() => {
    const groups: { label: string; items: typeof filteredLog }[] = [];
    for (const entry of filteredLog) {
      const g = relativeGroup(entry.at);
      let bucket = groups.find((x) => x.label === g);
      if (!bucket) {
        bucket = { label: g, items: [] };
        groups.push(bucket);
      }
      bucket.items.push(entry);
    }
    return groups;
  }, [filteredLog]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5, 5, 16, 0.65)",
          backdropFilter: "blur(5px)",
          padding: 16,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: C.surface,
            border: `1px solid ${C.goldBorder}`,
            borderRadius: 24,
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.25)",
            width: "100%",
            maxWidth: 640,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "22px 28px",
              borderBottom: `1px solid ${C.border}`,
              background: C.surfaceAlt,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em", color: C.gold, fontWeight: 700 }}>
                Activity Log
              </div>
              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "1.35rem",
                  fontWeight: 700,
                  color: C.text,
                  margin: "2px 0 0",
                }}
              >
                Complete XP History
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

          {/* Controls: Search + Filter Tabs */}
          <div style={{ padding: "16px 28px", borderBottom: `1px solid ${C.border}`, background: C.surface, display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Search Input */}
            <div style={{ position: "relative", width: "100%" }}>
              <Search size={15} color={C.textFaint} style={{ position: "absolute", left: 14, top: 12 }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search XP activities (e.g. task, video)..."
                style={{
                  width: "100%",
                  padding: "10px 14px 10px 38px",
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  background: C.surfaceAlt,
                  fontSize: "0.84rem",
                  color: C.text,
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 8 }}>
              {(["all", "positive", "negative"] as const).map((f) => {
                const active = filter === f;
                const label = f === "all" ? "All Activity" : f === "positive" ? "Positive (+)" : "Undone (-)";
                return (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    style={{
                      background: active ? C.goldLight : C.surfaceAlt,
                      color: active ? C.gold : C.textMuted,
                      border: `1px solid ${active ? C.goldBorder : C.borderMuted}`,
                      borderRadius: 20,
                      padding: "5px 14px",
                      fontSize: "0.76rem",
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      fontFamily: "'Inter', sans-serif",
                      transition: "all 150ms ease",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* History List */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px" }}>
            {groupedLog.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: C.textMuted, fontSize: "0.86rem" }}>
                No XP activities match your criteria.
              </div>
            ) : (
              groupedLog.map((group) => (
                <div key={group.label} style={{ marginBottom: 24 }}>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      color: C.gold,
                      marginBottom: 10,
                    }}
                  >
                    {group.label}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {group.items.map((entry, idx) => (
                      <div
                        key={entry.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 0",
                          borderTop: idx > 0 ? `1px solid ${C.borderMuted}` : "none",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            color: entry.amount >= 0 ? "#00D68F" : C.textMuted,
                            width: 60,
                            flexShrink: 0,
                          }}
                        >
                          {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                        </span>
                        <span style={{ flex: 1, fontSize: "0.86rem", color: C.text, paddingRight: 12 }}>
                          {entry.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/* ─── Compact XP History Card Component (Dashboard & XP Page) ───────── */
export function XpHistoryCard() {
  const [modalOpen, setModalOpen] = useState(false);
  const [whyModalOpen, setWhyModalOpen] = useState(false);
  const log = getXpLog();

  // Show ONLY the 5 most recent XP activities in the preview card
  const recentEntries = useMemo(() => {
    return log.slice(0, 5);
  }, [log]);

  // Group entries chronologically
  const groupedPreview = useMemo(() => {
    const groups: { label: string; items: typeof recentEntries }[] = [];
    for (const entry of recentEntries) {
      const g = relativeGroup(entry.at);
      let bucket = groups.find((x) => x.label === g);
      if (!bucket) {
        bucket = { label: g, items: [] };
        groups.push(bucket);
      }
      bucket.items.push(entry);
    }
    return groups;
  }, [recentEntries]);

  return (
    <>
      <Card style={{ padding: "26px 30px" }}>
        {/* Title */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 10 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "1.25rem",
              fontWeight: 700,
              color: C.text,
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            XP History
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <WhyXpButton onClick={() => setWhyModalOpen(true)} />
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                color: C.gold,
                background: C.goldLight,
                border: `1px solid ${C.goldBorder}`,
                padding: "3px 10px",
                borderRadius: 20,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              5 Recent
            </span>
          </div>
        </div>

        {/* 5-Item Preview Container — Fixed & Balanced Height, No Scroll */}
        {recentEntries.length === 0 ? (
          <p style={{ fontSize: "0.84rem", color: C.textFaint, margin: "16px 0 24px" }}>
            Your XP activity will show up here as you complete tasks and milestones.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {groupedPreview.map((group) => (
              <div key={group.label}>
                <div
                  style={{
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: C.gold,
                    marginBottom: 10,
                  }}
                >
                  {group.label}
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                  {group.items.map((entry, idx) => (
                    <div
                      key={entry.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        padding: "11px 0",
                        borderTop: idx > 0 ? `1px solid ${C.borderMuted}` : "none",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.86rem",
                          fontWeight: 700,
                          color: entry.amount >= 0 ? "#00D68F" : C.textMuted,
                          width: 64,
                          flexShrink: 0,
                        }}
                      >
                        {entry.amount >= 0 ? `+${entry.amount}` : entry.amount}
                      </span>
                      <span style={{ flex: 1, fontSize: "0.86rem", color: C.text }}>
                        {entry.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Centered Pill Button */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingTop: 4 }}>
          <motion.button
            whileHover={{ y: -1, boxShadow: "0 6px 20px rgba(230, 194, 106, 0.32)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setModalOpen(true)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              background: C.surfaceAlt,
              border: `1px solid ${C.goldBorder}`,
              borderRadius: 999,
              padding: "9px 24px",
              fontSize: "0.82rem",
              fontWeight: 500,
              color: C.gold,
              fontFamily: "'Inter', sans-serif",
              boxShadow: "0 2px 12px rgba(230, 194, 106, 0.18)",
              cursor: "pointer",
              transition: "all 180ms ease",
              letterSpacing: "0.01em",
            }}
          >
            <span>View all history</span>
            <span style={{ fontSize: "0.88rem", transition: "transform 180ms ease" }}>→</span>
          </motion.button>
        </div>
      </Card>

      {/* Modal */}
      <XpHistoryModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        log={log}
      />
      <WhyXpModal
        open={whyModalOpen}
        onClose={() => setWhyModalOpen(false)}
      />
    </>
  );
}
