import { useState } from "react";
import { Palette, Sliders, CreditCard, Bell, Sparkles, ShieldCheck } from "lucide-react";
import { A } from "../adminColors";

const SECTIONS = [
  { id: "branding",     label: "Branding",      Icon: Palette,     desc: "Logo, colors, and typography used across Starfix." },
  { id: "platform",     label: "Platform",      Icon: Sliders,     desc: "General platform behavior and defaults." },
  { id: "payments",     label: "Payments",      Icon: CreditCard,  desc: "Mentor payouts, pricing, and billing." },
  { id: "notifications",label: "Notifications", Icon: Bell,        desc: "Email and push notification rules." },
  { id: "ai",           label: "AI",            Icon: Sparkles,    desc: "AI Assistant behavior and guardrails." },
  { id: "security",     label: "Security",      Icon: ShieldCheck, desc: "Access control and account security." },
];

export function AdminSettingsPage() {
  const [active, setActive] = useState("branding");
  const section = SECTIONS.find((s) => s.id === active)!;

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1000, margin: "0 auto", display: "flex", gap: 32 }}>
      <div style={{ width: 200, flexShrink: 0 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.3rem", fontWeight: 700, color: A.text, margin: "0 0 20px" }}>Settings</h1>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: A.radiusSm,
                border: "none", cursor: "pointer", textAlign: "left", fontFamily: A.sans,
                background: active === s.id ? A.goldLight : "transparent",
                color: active === s.id ? A.gold : A.textMuted,
                fontSize: "0.84rem", fontWeight: active === s.id ? 600 : 500,
                transition: "background 150ms ease",
              }}
            >
              <s.Icon size={14} /> {s.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, padding: "28px 30px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <section.Icon size={17} color={A.gold} />
          <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: A.text, margin: 0, fontFamily: A.serif }}>{section.label}</h2>
        </div>
        <p style={{ fontSize: "0.84rem", color: A.textMuted, margin: "0 0 24px", lineHeight: 1.55 }}>{section.desc}</p>
        <div style={{
          border: `1px dashed ${A.border}`, borderRadius: 16, padding: "40px 20px",
          textAlign: "center", fontSize: "0.82rem", color: A.textFaint,
        }}>
          {section.label} settings will appear here.
        </div>
      </div>
    </div>
  );
}
