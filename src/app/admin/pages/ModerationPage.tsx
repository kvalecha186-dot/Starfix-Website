import { Flag, UserX, MessageSquareWarning, ShieldOff } from "lucide-react";
import { A } from "../adminColors";
import { MODERATION } from "../adminData";

function Section({ title, Icon, items, reasonKey, timeKey, nameKey }: {
  title: string; Icon: any; items: any[]; reasonKey: string; timeKey: string; nameKey: string;
}) {
  return (
    <div style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <Icon size={14} color={A.gold} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>
          {title} <span style={{ color: A.textMuted, fontWeight: 500 }}>({items.length})</span>
        </span>
      </div>
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
        {items.length === 0
          ? <div style={{ padding: 20, fontSize: "0.82rem", color: A.textFaint }}>Nothing to review.</div>
          : items.map((item, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "15px 20px",
              borderBottom: i < items.length - 1 ? `1px solid ${A.borderMuted}` : "none",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.86rem", fontWeight: 600, color: A.text }}>{item[nameKey]}</div>
                <div style={{ fontSize: "0.78rem", color: A.textMuted, marginTop: 2 }}>{item[reasonKey]}</div>
              </div>
              <span style={{ fontSize: "0.74rem", color: A.textFaint, flexShrink: 0 }}>{item[timeKey]}</span>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button style={{
                  fontSize: "0.76rem", fontWeight: 600, color: A.gold, background: A.goldLight,
                  border: "none", borderRadius: 20, padding: "6px 14px", cursor: "pointer",
                }}>
                  Review
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export function ModerationPage() {
  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1000, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Moderation</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>Reported content, mentors, messages, and blocked users.</p>
      </div>

      <Section title="Reported Content"  Icon={Flag}                items={MODERATION.reportedContent}  reasonKey="reason" timeKey="reported" nameKey="title" />
      <Section title="Reported Mentors"  Icon={UserX}               items={MODERATION.reportedMentors}  reasonKey="reason" timeKey="reported" nameKey="name" />
      <Section title="Reported Messages" Icon={MessageSquareWarning}items={MODERATION.reportedMessages} reasonKey="reason" timeKey="reported" nameKey="from" />
      <Section title="Blocked Users"     Icon={ShieldOff}           items={MODERATION.blockedUsers}     reasonKey="reason" timeKey="blocked"  nameKey="name" />
    </div>
  );
}
