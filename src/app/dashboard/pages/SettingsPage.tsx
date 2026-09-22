import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Globe2, BookOpen, ShieldCheck, Trash2, LogOut,
  Camera, ChevronDown, Check, TrendingUp, Users, Bell,
} from "lucide-react";
import { C } from "../dashColors";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";
import {
  getSettings, updateSettings, resetRecommendationPreferences,
  type AppSettings, type ContentSource, type ContentLevel, type SessionReminderLead,
} from "../../lib/appSettings";
import { clearWatchQueue } from "../../lib/watchQueue";
import { clearSavedItems } from "../../lib/savedItems";

/* ─────────────────────────────────────────────────────────────────────────
   /settings (rendered inside DashboardLayout as the "settings" tab) —
   every real, meaningful preference Starfix actually uses, grouped into
   plain sections. No gamification here on purpose — this is the one page
   in the product that should feel calm and administrative, not playful.
───────────────────────────────────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.1em",
  color: C.textFaint, fontFamily: "'Inter', sans-serif",
};

// Full country list for the Learning Identity country/region picker. Each
// entry carries an ISO 3166-1 alpha-2 code so we can render a real, crisp
// flag image (flagcdn.com) instead of a flag emoji, which falls back to
// plain two-letter text on Windows.
const COUNTRY_OPTIONS: { name: string; code: string }[] = [
  { name: "Afghanistan", code: "af" }, { name: "Albania", code: "al" }, { name: "Algeria", code: "dz" },
  { name: "Argentina", code: "ar" }, { name: "Armenia", code: "am" }, { name: "Australia", code: "au" },
  { name: "Austria", code: "at" }, { name: "Azerbaijan", code: "az" }, { name: "Bahrain", code: "bh" },
  { name: "Bangladesh", code: "bd" }, { name: "Belarus", code: "by" }, { name: "Belgium", code: "be" },
  { name: "Bolivia", code: "bo" }, { name: "Bosnia and Herzegovina", code: "ba" }, { name: "Brazil", code: "br" },
  { name: "Bulgaria", code: "bg" }, { name: "Cambodia", code: "kh" }, { name: "Cameroon", code: "cm" },
  { name: "Canada", code: "ca" }, { name: "Chile", code: "cl" }, { name: "China", code: "cn" },
  { name: "Colombia", code: "co" }, { name: "Costa Rica", code: "cr" }, { name: "Croatia", code: "hr" },
  { name: "Cuba", code: "cu" }, { name: "Cyprus", code: "cy" }, { name: "Czech Republic", code: "cz" },
  { name: "Denmark", code: "dk" }, { name: "Dominican Republic", code: "do" }, { name: "Ecuador", code: "ec" },
  { name: "Egypt", code: "eg" }, { name: "Estonia", code: "ee" }, { name: "Ethiopia", code: "et" },
  { name: "Finland", code: "fi" }, { name: "France", code: "fr" }, { name: "Georgia", code: "ge" },
  { name: "Germany", code: "de" }, { name: "Ghana", code: "gh" }, { name: "Greece", code: "gr" },
  { name: "Guatemala", code: "gt" }, { name: "Honduras", code: "hn" }, { name: "Hong Kong", code: "hk" },
  { name: "Hungary", code: "hu" }, { name: "Iceland", code: "is" }, { name: "India", code: "in" },
  { name: "Indonesia", code: "id" }, { name: "Iran", code: "ir" }, { name: "Iraq", code: "iq" },
  { name: "Ireland", code: "ie" }, { name: "Israel", code: "il" }, { name: "Italy", code: "it" },
  { name: "Jamaica", code: "jm" }, { name: "Japan", code: "jp" }, { name: "Jordan", code: "jo" },
  { name: "Kazakhstan", code: "kz" }, { name: "Kenya", code: "ke" }, { name: "Kuwait", code: "kw" },
  { name: "Latvia", code: "lv" }, { name: "Lebanon", code: "lb" }, { name: "Lithuania", code: "lt" },
  { name: "Luxembourg", code: "lu" }, { name: "Malaysia", code: "my" }, { name: "Malta", code: "mt" },
  { name: "Mexico", code: "mx" }, { name: "Mongolia", code: "mn" }, { name: "Morocco", code: "ma" },
  { name: "Myanmar", code: "mm" }, { name: "Nepal", code: "np" }, { name: "Netherlands", code: "nl" },
  { name: "New Zealand", code: "nz" }, { name: "Nigeria", code: "ng" }, { name: "Norway", code: "no" },
  { name: "Oman", code: "om" }, { name: "Pakistan", code: "pk" }, { name: "Panama", code: "pa" },
  { name: "Peru", code: "pe" }, { name: "Philippines", code: "ph" }, { name: "Poland", code: "pl" },
  { name: "Portugal", code: "pt" }, { name: "Qatar", code: "qa" }, { name: "Romania", code: "ro" },
  { name: "Russia", code: "ru" }, { name: "Saudi Arabia", code: "sa" }, { name: "Serbia", code: "rs" },
  { name: "Singapore", code: "sg" }, { name: "Slovakia", code: "sk" }, { name: "Slovenia", code: "si" },
  { name: "South Africa", code: "za" }, { name: "South Korea", code: "kr" }, { name: "Spain", code: "es" },
  { name: "Sri Lanka", code: "lk" }, { name: "Sweden", code: "se" }, { name: "Switzerland", code: "ch" },
  { name: "Taiwan", code: "tw" }, { name: "Tanzania", code: "tz" }, { name: "Thailand", code: "th" },
  { name: "Tunisia", code: "tn" }, { name: "Turkey", code: "tr" }, { name: "Uganda", code: "ug" },
  { name: "Ukraine", code: "ua" }, { name: "United Arab Emirates", code: "ae" }, { name: "United Kingdom", code: "gb" },
  { name: "United States", code: "us" }, { name: "Uruguay", code: "uy" }, { name: "Uzbekistan", code: "uz" },
  { name: "Venezuela", code: "ve" }, { name: "Vietnam", code: "vn" }, { name: "Yemen", code: "ye" },
  { name: "Zambia", code: "zm" }, { name: "Zimbabwe", code: "zw" },
];

/* Small, crisp flag image shared by the country picker and the language
   pills — real image instead of emoji, since regional-indicator emoji
   don't render as flags on Windows (they fall back to plain text). */
function Flag({ code, size = 18 }: { code: string; size?: number }) {
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      alt=""
      width={size}
      height={Math.round(size * 0.72)}
      style={{ borderRadius: 3, objectFit: "cover", flexShrink: 0, display: "block", boxShadow: "0 0 0 1px rgba(0,0,0,0.06)" }}
    />
  );
}
const TIME_ZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Europe/London", "Europe/Berlin",
  "America/New_York", "America/Los_Angeles", "America/Chicago", "Australia/Sydney", "UTC",
];

// Matches the career-goal options offered during onboarding, so editing
// it later in Settings stays consistent with the original choice.
const CAREER_GOALS = [
  "Software Engineer", "AI Engineer", "Data Scientist", "Cyber Security",
  "Cloud / DevOps", "Product Designer", "Content Creator", "Public Speaker",
  "Fitness & Wellness", "Productivity & Self Growth", "Still exploring",
];

// flagCode is an ISO 3166-1 alpha-2 country code used to render a real,
// crisp circular flag image (flagcdn.com) instead of a flag *emoji* — emoji
// regional-indicator flags don't render as flags on Windows, they fall back
// to plain two-letter text ("US", "IN", "ES"...), which is the exact bug
// this replaces.
const LANGUAGES: { code: string; name: string; flagCode: string }[] = [
  { code: "English",    name: "English",    flagCode: "gb" },
  { code: "Hindi",      name: "Hindi",      flagCode: "in" },
  { code: "Spanish",    name: "Spanish",    flagCode: "es" },
  { code: "French",     name: "French",     flagCode: "fr" },
  { code: "German",     name: "German",     flagCode: "de" },
  { code: "Japanese",   name: "Japanese",   flagCode: "jp" },
  { code: "Korean",     name: "Korean",     flagCode: "kr" },
  { code: "Chinese",    name: "Chinese",    flagCode: "cn" },
  { code: "Portuguese", name: "Portuguese", flagCode: "pt" },
  { code: "Russian",    name: "Russian",    flagCode: "ru" },
];

/* Keeps the legacy single-value field (used by lib/curatedContent.ts's
   creator-ranking engine) in sync with the new multi-select preference,
   so recommendations keep working without touching every call site. */
function legacyLanguageFrom(langs: string[]): "English" | "Hindi" | "Both" {
  const hasEnglish = langs.includes("English");
  const hasHindi = langs.includes("Hindi");
  if (hasEnglish && hasHindi) return "Both";
  if (hasHindi) return "Hindi";
  return "English";
}

/* Tracks viewport width for the two real breakpoints this page cares
   about: tablet padding (≤1024px) and the Account section's two-column
   layout collapsing to one column on mobile/tablet. */
function useViewportWidth(): number {
  const [w, setW] = useState(() => (typeof window !== "undefined" ? window.innerWidth : 1440));
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ size?: number; color?: string }>; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, padding: 32, boxSizing: "border-box", overflow: "visible", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 22 }}>
        <Icon size={15} color={C.gold} />
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{children}</div>
    </div>
  );
}

/* A compact, premium switch (iOS/Notion/Instagram-style) — fixed 44×26
   track so it's never clipped or squeezed by a long label next to it.
   flex-shrink: 0 on the wrapping element (see Row/PrivacyRow) keeps the
   card's own right padding as a hard boundary the switch never crosses. */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      style={{
        width: 44, minWidth: 44, maxWidth: 44, height: 26, minHeight: 26, maxHeight: 26,
        borderRadius: 999, border: "none", cursor: "pointer", outline: "none",
        background: checked ? "#D4A91F" : "#F4F4F4", position: "relative",
        flexShrink: 0, flexGrow: 0, display: "inline-block", padding: 0, margin: 0,
        boxSizing: "border-box", overflow: "visible", verticalAlign: "middle",
        transition: "background-color 180ms ease",
      }}
    >
      <motion.span
        animate={{ x: checked ? 21 : 3 }}
        transition={{ duration: 0.18, ease: "easeInOut" }}
        style={{
          position: "absolute", top: 3, left: 0, width: 20, height: 20, borderRadius: "50%",
          background: "#FFFFFF", boxShadow: "0 1px 3px rgba(0,0,0,0.18)", pointerEvents: "none",
        }}
      />
    </button>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, width: "100%", boxSizing: "border-box" }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text }}>{label}</div>
        {hint && <div style={{ fontSize: "0.74rem", color: C.textFaint, marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>{children}</div>
    </div>
  );
}

/* ── Privacy section — Notion/Headspace-style calm card, no social
   features (no public profile, followers, or community visibility).
   Every row here controls either what the learner sees about themselves
   or what their own mentor can see — nothing broadcast anywhere else. ── */

function PrivacyGroupCard({
  title, icon: Icon, note, children,
}: { title: string; icon: React.ComponentType<{ size?: number; color?: string }>; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32, boxSizing: "border-box", overflow: "visible", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: C.goldLight, border: `1px solid ${C.goldBorder}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={14} color={C.gold} />
        </div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.04rem", fontWeight: 700, color: C.text, margin: 0 }}>{title}</h3>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{children}</div>
      {note && (
        <div style={{ marginTop: 22, paddingTop: 18, borderTop: `1px solid ${C.borderMuted}`, fontSize: "0.76rem", color: C.textFaint, lineHeight: 1.55 }}>
          {note}
        </div>
      )}
    </div>
  );
}

function PrivacyRow({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18,
        // Hover highlight bleeds left into the card's own padding only —
        // the right edge stays flush with the row's real width, so the
        // switch never sits past the card's right padding boundary.
        padding: "10px 12px 10px 10px", margin: "-10px -12px -10px -10px", borderRadius: 12,
        background: hover ? C.surfaceAlt : "transparent", boxSizing: "border-box",
        transition: "background 150ms ease",
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: "0.87rem", fontWeight: 600, color: C.text }}>{title}</div>
        <div style={{ fontSize: "0.76rem", color: C.textMuted, marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
        <Toggle checked={checked} onChange={onChange} />
      </div>
    </div>
  );
}

function Select({ value, options, onChange, fullWidth }: { value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; fullWidth?: boolean }) {
  return (
    <div style={{ position: "relative", flexShrink: fullWidth ? undefined : 0, width: fullWidth ? "100%" : undefined }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          appearance: "none", background: C.surfaceAlt, border: `1px solid rgba(0,0,0,0.08)`,
          borderRadius: 12, padding: "0 30px 0 14px", height: 40, boxSizing: "border-box",
          fontSize: "0.82rem", color: C.text, width: fullWidth ? "100%" : undefined,
          fontFamily: "'Inter', sans-serif", cursor: "pointer", outline: "none", minWidth: fullWidth ? undefined : 140,
        }}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} color={C.textFaint} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

/* Custom Starfix country selector — replaces the native <select> so the
   field and its open menu match the white + gold aesthetic exactly
   (native dropdowns render with the OS's own styling, which a CSS-only
   <select> can never fully override). Field: 48px tall, 14px radius, gold
   ring on focus/open. Menu: floating, 16px radius, soft shadow, max 280px
   with scroll, each row flag + name with a soft-gold hover and a stronger
   gold "selected" fill + check. */
function CountrySelect({ value, onChange, isMobile }: { value: string; onChange: (v: string) => void; isMobile?: boolean }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = COUNTRY_OPTIONS.find((c) => c.name === value) ?? COUNTRY_OPTIONS[0];

  useEffect(() => {
    if (!open || isMobile) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, isMobile]);

  const optionRow = (c: { name: string; code: string }, isSelected: boolean) => (
    <button
      key={c.name}
      onClick={() => { onChange(c.name); setOpen(false); }}
      style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", background: isSelected ? C.goldLight : "transparent",
        border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
        transition: "background 120ms ease",
      }}
      onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = C.surfaceHover; }}
      onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
    >
      <Flag code={c.code} size={18} />
      <span style={{ flex: 1, textAlign: "left", fontSize: "0.83rem", fontWeight: 500, color: isSelected ? C.gold : C.text }}>
        {c.name}
      </span>
      {isSelected && <Check size={14} color={C.gold} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
    </button>
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", flexShrink: 0, width: "100%" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", height: 40, boxSizing: "border-box", display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.surfaceAlt, border: `1px solid ${open ? C.gold : C.border}`, borderRadius: 12,
          padding: "0 14px", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          boxShadow: open ? `0 0 0 3px ${C.goldBorder}` : "none", transition: "border-color 140ms ease, box-shadow 140ms ease",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 9, minWidth: 0 }}>
          <Flag code={selected.code} size={16} />
          <span style={{ fontSize: "0.82rem", fontWeight: 500, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selected.name}
          </span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.15 }} style={{ display: "flex", flexShrink: 0, marginLeft: 8 }}>
          <ChevronDown size={14} color={C.textFaint} />
        </motion.span>
      </button>

      {/* Desktop/tablet — floating dropdown, unchanged. */}
      {!isMobile && (
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -4 }}
              transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
              style={{
                position: "absolute", top: "calc(100% + 8px)", left: 0, width: "100%", zIndex: 50,
                background: C.surface, borderRadius: 16, boxShadow: "0 12px 32px rgba(0,0,0,0.45)",
                border: `1px solid ${C.borderMuted}`, padding: "8px 0",
                maxHeight: 280, overflowY: "auto",
              }}
            >
              {COUNTRY_OPTIONS.map((c) => optionRow(c, c.name === selected.name))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Mobile — bottom-sheet selector, per the mobile-dropdown spec. */}
      {isMobile && (
        <AnimatePresence>
          {open && (
            <>
              <div
                className="starfix-overlay-enter"
                onClick={() => setOpen(false)}
                style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 95 }}
              />
              <div
                className="starfix-sheet-enter"
                style={{
                  position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 96,
                  background: C.surface, borderTopLeftRadius: 22, borderTopRightRadius: 22,
                  boxShadow: "0 -12px 32px rgba(0,0,0,0.4)", maxHeight: "70vh",
                  display: "flex", flexDirection: "column", overflow: "hidden",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
                  <div style={{ width: 36, height: 4, borderRadius: 999, background: C.borderMuted }} />
                </div>
                <div style={{ padding: "6px 16px 12px", fontSize: "0.86rem", fontWeight: 700, color: C.text, fontFamily: "'Inter', sans-serif" }}>
                  Select your country
                </div>
                <div style={{ overflowY: "auto", paddingBottom: 8 }}>
                  {COUNTRY_OPTIONS.map((c) => optionRow(c, c.name === selected.name))}
                </div>
              </div>
            </>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}

function TextField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: "8px 12px", fontSize: "0.8rem", color: C.text, fontFamily: "'Inter', sans-serif",
        outline: "none", width: 220, textAlign: "right",
      }}
    />
  );
}

/* Segmented control — used for content source + level, a bit more visible
   than a bare select for the two settings that matter most to curation. */
function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 10, padding: 2, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              border: "none", borderRadius: 8, padding: "6px 12px", fontSize: "0.74rem", fontWeight: 600,
              cursor: "pointer", fontFamily: "'Inter', sans-serif", whiteSpace: "nowrap",
              background: active ? C.gold : "transparent", color: active ? "#fff" : C.textMuted,
              transition: "background 140ms ease",
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* Premium multi-select language picker — pill cards (not checkboxes),
   max 2 selections, gold-tinted selected state with a trailing check. */
function LanguagePicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [limitMsg, setLimitMsg] = useState(false);

  const toggle = (code: string) => {
    if (value.includes(code)) {
      onChange(value.filter((c) => c !== code));
      setLimitMsg(false);
      return;
    }
    if (value.length >= 2) {
      setLimitMsg(true);
      window.setTimeout(() => setLimitMsg(false), 2200);
      return;
    }
    onChange([...value, code]);
  };

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {LANGUAGES.map((l) => {
          const active = value.includes(l.code);
          return (
            <motion.button
              key={l.code}
              onClick={() => toggle(l.code)}
              whileHover={{ boxShadow: active ? `0 0 0 4px ${C.goldBorder}` : `0 0 0 3px ${C.surfaceHover}` }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: "flex", alignItems: "center", gap: 8, height: 40, boxSizing: "border-box",
                padding: "0 14px", borderRadius: 999, cursor: "pointer",
                fontSize: "0.82rem", fontWeight: 500, fontFamily: "'Inter', sans-serif",
                background: active ? C.goldLight : C.surfaceAlt,
                border: `1px solid ${active ? C.gold : C.border}`,
                color: active ? C.gold : C.text,
                transition: "background 140ms ease, border-color 140ms ease",
              }}
            >
              <Flag code={l.flagCode} size={16} />
              {l.name}
              {active && <Check size={13} color={C.gold} strokeWidth={2.5} />}
            </motion.button>
          );
        })}
      </div>

      <div style={{ marginTop: 10, minHeight: 18 }}>
        {limitMsg ? (
          <motion.span
            initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
            style={{ fontSize: "0.74rem", color: C.gold, fontFamily: "'Inter', sans-serif" }}
          >
            You can choose up to 2 preferred languages.
          </motion.span>
        ) : (
          <span style={{ fontSize: "0.76rem", color: C.textMuted, fontFamily: "'Inter', sans-serif" }}>
            Selected: {value.length ? value.join(", ") : "None yet"}
          </span>
        )}
      </div>
    </div>
  );
}

export function SettingsPage({ userProfile, onUpdateProfile, onLogout }: {
  onNavigate?: (p: DashPage) => void;
  userProfile?: UserProfile | null;
  onUpdateProfile?: (patch: Partial<UserProfile>) => void;
  onLogout?: () => void;
}) {
  const [settings, setSettings] = useState<AppSettings>(() => getSettings());
  const [name, setName] = useState(userProfile?.name || "");
  const [clearedMsg, setClearedMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const initialLangs = () => {
    if (userProfile?.learningLanguages?.length) return userProfile.learningLanguages;
    if (userProfile?.learningLanguage === "Both") return ["English", "Hindi"];
    if (userProfile?.learningLanguage === "Hindi") return ["Hindi"];
    return ["English"];
  };
  const [langs, setLangs] = useState<string[]>(initialLangs);

  useEffect(() => { setName(userProfile?.name || ""); }, [userProfile?.name]);

  const patch = (p: Partial<AppSettings>) => setSettings(updateSettings(p));

  const handlePhoto = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => onUpdateProfile?.({ avatarDataUrl: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const flash = (msg: string) => { setClearedMsg(msg); window.setTimeout(() => setClearedMsg(null), 2500); };

  const viewportWidth = useViewportWidth();
  const isTablet = viewportWidth <= 1024;
  const isMobile = viewportWidth < 768;
  const isStacked = viewportWidth <= 900; // Account section's 2-col grid → 1 col

  return (
    <div style={{ background: C.bg, width: "100%", maxWidth: "none", minHeight: "100vh", boxSizing: "border-box", padding: `${isMobile ? 20 : 40}px ${isMobile ? 16 : isTablet ? 24 : 48}px 90px` }}>
      <div style={{ width: "100%", maxWidth: "none", display: "flex", flexDirection: "column", gap: 26 }}>

        <div style={{ textAlign: "left" }}>
          <div style={{ ...LABEL, marginBottom: 8 }}>Preferences</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: C.text, margin: 0, letterSpacing: "-0.02em", textAlign: "left" }}>
            Settings
          </h1>
        </div>

        {/* 1 — Account */}
        <SectionCard title="Account" icon={User}>
          <Row label="Profile photo">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%", flexShrink: 0, overflow: "hidden",
                background: C.gold, display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: "0.86rem", fontWeight: 700, fontFamily: "'Playfair Display', serif",
              }}>
                {userProfile?.avatarDataUrl
                  ? <img src={userProfile.avatarDataUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (userProfile?.name || "K")[0].toUpperCase()}
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden
                onChange={(e) => e.target.files?.[0] && handlePhoto(e.target.files[0])} />
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 6, background: C.surfaceAlt,
                  border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 14px",
                  fontSize: "0.76rem", fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                }}
              >
                <Camera size={12} /> Change
              </button>
            </div>
          </Row>
          <Row label="Display name">
            <TextField value={name} onChange={setName} placeholder="Your name" />
          </Row>

          {/* Two-column layout: languages on the left, country + learning
             preferences on the right — collapses to one column ≤900px. */}
          <div style={{
            display: "grid", gridTemplateColumns: isStacked ? "1fr" : "1fr 1fr",
            gap: 28, paddingTop: 4,
          }}>
            <div>
              <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text, marginBottom: 12 }}>Preferred learning languages</div>
              <LanguagePicker value={langs} onChange={setLangs} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text, marginBottom: 12 }}>Country</div>
                <CountrySelect
                  value={userProfile?.country || "India"}
                  onChange={(v) => onUpdateProfile?.({ country: v })}
                  isMobile={isMobile}
                />
              </div>
              <div>
                <div style={{ fontSize: "0.86rem", fontWeight: 500, color: C.text, marginBottom: 12 }}>Career goal</div>
                <Select
                  value={userProfile?.careerGoal || "Still exploring"}
                  options={CAREER_GOALS.map((g) => ({ value: g, label: g }))}
                  onChange={(v) => onUpdateProfile?.({ careerGoal: v })}
                  fullWidth
                />
              </div>
            </div>
          </div>

          {(name !== (userProfile?.name || "") || JSON.stringify(langs) !== JSON.stringify(initialLangs())) && (
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => onUpdateProfile?.({ name, learningLanguages: langs, learningLanguage: legacyLanguageFrom(langs) })}
                style={{ background: C.gold, color: "#fff", border: "none", borderRadius: 10, padding: "7px 16px", fontSize: "0.76rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
              >
                Save changes
              </button>
            </div>
          )}
        </SectionCard>

        {/* 2 — Learning Experience */}
        <SectionCard title="Learning Experience" icon={BookOpen}>
          <Row label="Autoplay next video" hint="Automatically start the next recommended lesson">
            <Toggle checked={settings.autoplayNextVideo} onChange={(v) => patch({ autoplayNextVideo: v })} />
          </Row>
          <Row label="Show subtitles when available">
            <Toggle checked={settings.showSubtitles} onChange={(v) => patch({ showSubtitles: v })} />
          </Row>
          <Row label="Daily reminder notifications" hint="A gentle nudge to keep your streak going">
            <Toggle checked={settings.dailyReminderNotifications} onChange={(v) => patch({ dailyReminderNotifications: v })} />
          </Row>
          <Row label="Weekly progress email">
            <Toggle checked={settings.weeklyProgressEmail} onChange={(v) => patch({ weeklyProgressEmail: v })} />
          </Row>
          <Row label="Focus mode" hint="Hides XP, streaks, and badges across the app">
            <Toggle checked={settings.focusMode} onChange={(v) => patch({ focusMode: v })} />
          </Row>
        </SectionCard>

        {/* 3 — Content Preferences */}
        <SectionCard title="Content Preferences" icon={Globe2}>
          <Row label="Creator origin" hint="Which creators are prioritized in your recommendations">
            <Segmented<ContentSource>
              value={settings.contentSource}
              options={[
                { value: "indian", label: "Indian" },
                { value: "international", label: "International" },
                { value: "both", label: "Mix both" },
              ]}
              onChange={(v) => patch({ contentSource: v })}
            />
          </Row>
          <Row label="Content level">
            <Segmented<ContentLevel>
              value={settings.contentLevel}
              options={[
                { value: "beginner", label: "Beginner" },
                { value: "intermediate", label: "Intermediate" },
                { value: "advanced", label: "Advanced" },
              ]}
              onChange={(v) => patch({ contentLevel: v })}
            />
          </Row>
        </SectionCard>

        {/* 4 — Mentor & Session Settings */}
        <SectionCard title="Mentor & Session Settings" icon={ShieldCheck}>
          <Row label="Session reminders" hint="How far ahead you're notified before a session">
            <Segmented<SessionReminderLead>
              value={settings.sessionReminderLead}
              options={[
                { value: "10", label: "10 min before" },
                { value: "30", label: "30 min before" },
                { value: "60", label: "1 hour before" },
              ]}
              onChange={(v) => patch({ sessionReminderLead: v })}
            />
          </Row>
          <Row label="Time zone">
            <Select
              value={settings.timeZone}
              options={TIME_ZONES.map((z) => ({ value: z, label: z.replace("_", " ") }))}
              onChange={(v) => patch({ timeZone: v })}
            />
          </Row>
        </SectionCard>

        {/* 5 — Privacy: personal progress, mentor access, and
            notifications only — no public profile, followers, or
            community visibility anywhere in Starfix. */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <PrivacyGroupCard title="Personal Progress" icon={TrendingUp}>
            <PrivacyRow
              title="Show completed paths"
              desc="Keep a record of finished Growth Paths on your own profile"
              checked={settings.showCompletedPaths}
              onChange={(v) => patch({ showCompletedPaths: v })}
            />
            <PrivacyRow
              title="Show streaks"
              desc="Keep your current learning streak visible on your profile"
              checked={settings.showStreaks}
              onChange={(v) => patch({ showStreaks: v })}
            />
            <PrivacyRow
              title="Show saved resources"
              desc="Keep resources you've saved for later visible on your profile"
              checked={settings.showSavedResources}
              onChange={(v) => patch({ showSavedResources: v })}
            />
          </PrivacyGroupCard>

          <PrivacyGroupCard
            title="Mentor Access"
            icon={ShieldCheck}
            note="Your mentors can only access information related to the paths they mentor."
          >
            <PrivacyRow
              title="Allow mentors to view my progress"
              desc="Your assigned mentor can see how far you've come on their path"
              checked={settings.mentorViewProgress}
              onChange={(v) => patch({ mentorViewProgress: v })}
            />
            <PrivacyRow
              title="Allow mentors to see completed tasks"
              desc="Your mentor can see which weekly tasks you've checked off"
              checked={settings.mentorViewCompletedTasks}
              onChange={(v) => patch({ mentorViewCompletedTasks: v })}
            />
            <PrivacyRow
              title="Share weekly learning summary with mentors"
              desc="Send your mentor a short recap of your progress each week"
              checked={settings.shareWeeklySummaryWithMentors}
              onChange={(v) => patch({ shareWeeklySummaryWithMentors: v })}
            />
          </PrivacyGroupCard>

          <PrivacyGroupCard title="Notifications & Data" icon={Bell}>
            <PrivacyRow
              title="Learning reminders"
              desc="Gentle nudges to keep your daily learning habit going"
              checked={settings.privacyLearningReminders}
              onChange={(v) => patch({ privacyLearningReminders: v })}
            />
            <PrivacyRow
              title="Session reminders"
              desc="Get notified ahead of your upcoming mentor sessions"
              checked={settings.privacySessionReminders}
              onChange={(v) => patch({ privacySessionReminders: v })}
            />
            <PrivacyRow
              title="Achievement notifications"
              desc="Get notified when you unlock a badge or milestone"
              checked={settings.privacyAchievementNotifications}
              onChange={(v) => patch({ privacyAchievementNotifications: v })}
            />
          </PrivacyGroupCard>

          <p style={{ textAlign: "center", fontSize: "0.76rem", color: C.textFaint, lineHeight: 1.6, margin: "2px 12px 0" }}>
            Starfix is designed to keep your learning personal, focused, and mentor-guided.
          </p>
        </div>


        {/* 6 — Data & Storage */}
        <SectionCard title="Data & Storage" icon={Trash2}>
          <Row label="Clear watch history" hint="Removes everything from your Continue Watching queue">
            <button
              onClick={() => { clearWatchQueue(); flash("Watch history cleared"); }}
              style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 14px", fontSize: "0.76rem", fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              Clear
            </button>
          </Row>
          <Row label="Clear saved items" hint="Removes everything saved from Explore and workspaces">
            <button
              onClick={() => { clearSavedItems(); flash("Saved items cleared"); }}
              style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 14px", fontSize: "0.76rem", fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              Clear
            </button>
          </Row>
          <Row label="Reset learning recommendations" hint="Resets content preferences back to defaults">
            <button
              onClick={() => { setSettings(resetRecommendationPreferences()); flash("Recommendations reset"); }}
              style={{ background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "7px 14px", fontSize: "0.76rem", fontWeight: 600, color: C.text, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}
            >
              Reset
            </button>
          </Row>
          {clearedMsg && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", color: C.gold, fontWeight: 600 }}>
              <Check size={13} /> {clearedMsg}
            </div>
          )}
        </SectionCard>

        {/* 7 — Sign out */}
        <div style={{ borderTop: `1px solid ${C.borderMuted}`, paddingTop: 22, marginTop: 4 }}>
          <motion.button
            onClick={onLogout}
            whileHover={{ boxShadow: `0 0 0 4px ${C.goldBorder}` }}
            whileTap={{ scale: 0.99 }}
            style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              background: "#fff", border: `1.5px solid ${C.goldBorder}`, borderRadius: 999,
              padding: "13px 0", fontSize: "0.86rem", fontWeight: 700, color: C.gold,
              cursor: "pointer", fontFamily: "'Inter', sans-serif", transition: "box-shadow 200ms ease",
            }}
          >
            <LogOut size={15} /> Log out
          </motion.button>
        </div>

      </div>
    </div>
  );
}
