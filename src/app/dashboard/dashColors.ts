/* ─────────────────────────────────────────────────────────────────────────
   Starfix Student Dashboard — Luxury Obsidian Dark Design Tokens
   Matched 1:1 to the Mentor Mode palette (see ../mentor/mentorColors.ts)
   so both sides of Starfix now share one consistent dark + gold identity.
   Only the values changed here — every key name is unchanged, so every
   component that already reads C.bg / C.surface / C.text / etc. picks up
   the new theme automatically with zero other edits required.
───────────────────────────────────────────────────────────────────────── */

export const C = {
  bg:          "#050510",
  surface:     "#0C0B18",
  surfaceAlt:  "#141324",
  border:      "rgba(255, 255, 255, 0.08)",
  borderMuted: "rgba(255, 255, 255, 0.04)",
  gold:        "#D4AF37",
  goldLight:   "rgba(212, 175, 55, 0.10)",
  goldBorder:  "rgba(212, 175, 55, 0.26)",
  text:        "#FAF9F6",
  textMuted:   "rgba(250, 249, 246, 0.65)",
  textFaint:   "rgba(250, 249, 246, 0.40)",
  shadow:      "0 4px 20px rgba(0, 0, 0, 0.35)",
  shadowMd:    "0 12px 40px rgba(0, 0, 0, 0.55)",
  radius:      "14px",
  radiusSm:    "10px",
};
