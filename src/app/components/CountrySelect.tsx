import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Search, Check } from "lucide-react";
import { COUNTRIES, flagEmoji } from "../lib/countries";

/* ─────────────────────────────────────────────────────────────────────────
   CountrySelect — a premium, searchable country picker (Stripe/Linear/
   Notion-style), backed by the full ISO 3166-1 list (195 countries and
   territories). Not a native <select>: a custom floating panel with its
   own search, flags while browsing, and a clean text-only closed state.
───────────────────────────────────────────────────────────────────────── */

const GOLD = "#C9A227";
const BORDER = "#E6E1D6";
const HOVER_BG = "#FFF7E1";
const SELECTED_BG = "#FFF4D6";

export function CountrySelect({
  value,
  onChange,
  placeholder = "Select your country",
}: {
  value: string;
  onChange: (name: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  }, [query]);

  const selected = COUNTRIES.find((c) => c.name === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      // let the entrance animation start before stealing focus
      const t = window.setTimeout(() => searchRef.current?.focus(), 60);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%", fontFamily: "'Inter', sans-serif" }}>
      {/* Closed field */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", height: 48, boxSizing: "border-box",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", borderRadius: 14,
          background: "#fff",
          border: `1px solid ${open ? GOLD : BORDER}`,
          boxShadow: open ? `0 0 0 3px ${GOLD}22` : "none",
          cursor: "pointer", transition: "border-color 160ms ease, box-shadow 160ms ease",
        }}
      >
        <span style={{ fontSize: "0.92rem", color: value ? "#171717" : "#9C9585", fontWeight: value ? 500 : 400 }}>
          {value || placeholder}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexShrink: 0 }}>
          <ChevronDown size={16} color="#9C9585" />
        </motion.span>
      </button>

      {/* Open dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, zIndex: 50,
              background: "#fff", borderRadius: 16, border: `1px solid ${BORDER}`,
              boxShadow: "0 20px 48px -14px rgba(23,23,23,0.22), 0 2px 8px rgba(23,23,23,0.06)",
              overflow: "hidden",
            }}
          >
            {/* Search bar */}
            <div style={{ padding: 10, borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Search size={14} color="#9C9585" style={{ position: "absolute", left: 12, pointerEvents: "none" }} />
                <input
                  ref={searchRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search your country…"
                  style={{
                    width: "100%", height: 38, boxSizing: "border-box",
                    padding: "0 12px 0 34px", borderRadius: 10,
                    border: `1px solid ${BORDER}`, background: "#FAF9F5",
                    fontSize: "0.86rem", color: "#171717", outline: "none",
                    fontFamily: "'Inter', sans-serif",
                  }}
                />
              </div>
            </div>

            {/* Options */}
            <div style={{ maxHeight: 320, overflowY: "auto", scrollBehavior: "smooth" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: "18px 16px", fontSize: "0.82rem", color: "#9C9585", textAlign: "center" }}>
                  No countries match "{query}"
                </div>
              ) : (
                filtered.map((c) => {
                  const isSelected = c.name === value;
                  return (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => pick(c.name)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "12px 16px", background: isSelected ? SELECTED_BG : "transparent",
                        border: "none", cursor: "pointer", textAlign: "left",
                        transition: "background-color 120ms ease",
                      }}
                      onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = HOVER_BG; }}
                      onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: "1.05rem", lineHeight: 1, flexShrink: 0 }}>{flagEmoji(c.code)}</span>
                      <span style={{ flex: 1, fontSize: "0.86rem", color: "#171717", fontWeight: isSelected ? 600 : 400 }}>{c.name}</span>
                      {isSelected && <Check size={15} color={GOLD} style={{ flexShrink: 0 }} />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
