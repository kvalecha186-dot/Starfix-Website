import { Circle, CalendarClock, CheckCircle2 } from "lucide-react";
import { A } from "../adminColors";
import { SESSIONS } from "../adminData";

function SessionRow({ s, live }: { s: { learner: string; mentor: string; time: string; topic: string }; live?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "14px 20px",
      borderBottom: `1px solid ${A.borderMuted}`,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "0.86rem", fontWeight: 600, color: A.text }}>
          {s.learner} <span style={{ color: A.textFaint, fontWeight: 400 }}>with</span> {s.mentor}
        </div>
        <div style={{ fontSize: "0.78rem", color: A.textMuted, marginTop: 2 }}>{s.topic}</div>
      </div>
      {live && (
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.7rem", fontWeight: 700, color: A.red }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: A.red, display: "inline-block" }} /> LIVE
        </span>
      )}
      <span style={{ fontSize: "0.78rem", color: A.textFaint, flexShrink: 0, whiteSpace: "nowrap" }}>{s.time}</span>
    </div>
  );
}

function SessionGroup({ title, Icon, items, live }: { title: string; Icon: any; items: typeof SESSIONS.upcoming; live?: boolean }) {
  return (
    <div style={{ marginBottom: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <Icon size={14} color={A.gold} />
        <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>
          {title} <span style={{ color: A.textMuted, fontWeight: 500 }}>({items.length})</span>
        </span>
      </div>
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
        {items.length === 0
          ? <div style={{ padding: "20px", fontSize: "0.82rem", color: A.textFaint }}>Nothing here right now.</div>
          : items.map((s, i) => <SessionRow key={i} s={s} live={live} />)}
      </div>
    </div>
  );
}

export function SessionsPage() {
  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Sessions</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>Mentor session activity across the platform.</p>
      </div>

      <SessionGroup title="Live now" Icon={Circle} items={SESSIONS.live} live />
      <SessionGroup title="Upcoming" Icon={CalendarClock} items={SESSIONS.upcoming} />
      <SessionGroup title="Completed" Icon={CheckCircle2} items={SESSIONS.completed} />
    </div>
  );
}
