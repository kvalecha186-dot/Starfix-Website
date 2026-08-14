import { HelpCircle, AlertTriangle, Lightbulb, GraduationCap, Target } from "lucide-react";
import { A } from "../adminColors";
import { AI_ASSISTANT } from "../adminData";

function Panel({ title, Icon, children }: { title: string; Icon: any; children: React.ReactNode }) {
  return (
    <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, padding: "22px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <Icon size={14} color={A.gold} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

export function AIAssistantPage() {
  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>AI Assistant</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>How the AI Coach is being used across the platform.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
        <Panel title="Most Asked Questions" Icon={HelpCircle}>
          {AI_ASSISTANT.mostAsked.map((q, i) => (
            <p key={i} style={{ fontSize: "0.84rem", color: A.text, margin: "0 0 10px", lineHeight: 1.5 }}>"{q}"</p>
          ))}
        </Panel>
        <Panel title="Failed Answers" Icon={AlertTriangle}>
          {AI_ASSISTANT.failedAnswers.map((q, i) => (
            <p key={i} style={{ fontSize: "0.84rem", color: A.text, margin: "0 0 10px", lineHeight: 1.5 }}>"{q}"</p>
          ))}
        </Panel>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Panel title="Suggested Improvements" Icon={Lightbulb}>
          {AI_ASSISTANT.suggestedImprovements.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: i < AI_ASSISTANT.suggestedImprovements.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: A.gold, marginTop: 7, flexShrink: 0 }} />
              <p style={{ fontSize: "0.84rem", color: A.text, margin: 0, lineHeight: 1.5 }}>{s}</p>
            </div>
          ))}
        </Panel>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <Panel title="Top Mentor Recommendations" Icon={GraduationCap}>
          {AI_ASSISTANT.topMentorRecs.map((m, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: A.text, padding: "8px 0", borderBottom: i < AI_ASSISTANT.topMentorRecs.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}>
              <span>{m.mentor}</span>
              <span style={{ color: A.gold, fontWeight: 600 }}>{m.count} recs</span>
            </div>
          ))}
        </Panel>
        <Panel title="Popular Goals" Icon={Target}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AI_ASSISTANT.popularGoals.map((g) => (
              <span key={g} style={{ fontSize: "0.78rem", color: A.gold, background: A.goldLight, padding: "5px 12px", borderRadius: 20 }}>{g}</span>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}
