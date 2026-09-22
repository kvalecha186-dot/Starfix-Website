import { useState } from "react";
import { M } from "./mentorColors";

/* ─────────────────────────────────────────────────────────────────────────
   MentorAvatar — the single source of truth for how a mentor's identity
   renders anywhere in Mentor Mode (sidebar footer, dashboard welcome,
   Profile & Availability header). Always prefers a real uploaded photo;
   falls back to a clean initials mark generated from the mentor's actual
   name — never a generic icon, placeholder image, or stale test data.
   Handles broken image URLs gracefully by dropping back to initials.
───────────────────────────────────────────────────────────────────────── */

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((p) => p[0].toUpperCase()).join("");
}

export function MentorAvatar({
  name,
  avatarUrl,
  size = 40,
  ring = true,
  glow = false,
  fontSize,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  ring?: boolean;
  glow?: boolean;
  fontSize?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = !!avatarUrl && !imgFailed;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: showImage ? "transparent" : M.goldBg,
        border: ring ? `1.5px solid ${M.goldBorder}` : "none",
        boxShadow: glow ? M.goldGlow : "none",
        overflow: "hidden",
      }}
    >
      {showImage ? (
        <img
          src={avatarUrl!}
          alt={name}
          onError={() => setImgFailed(true)}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontWeight: 700,
            fontSize: fontSize || `${Math.round(size * 0.38)}px`,
            color: M.gold,
            fontFamily: M.sans,
          }}
        >
          {initialsFor(name)}
        </span>
      )}
    </div>
  );
}
