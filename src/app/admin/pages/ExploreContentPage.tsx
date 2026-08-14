import { Youtube, GraduationCap, CalendarDays, Award, Flag, FileText } from "lucide-react";
import { A } from "../adminColors";
import { CONTENT } from "../adminData";

const GROUPS: { key: keyof typeof CONTENT; label: string; Icon: any; metricKey: string }[] = [
  { key: "youtube",      label: "YouTube Videos", Icon: Youtube,       metricKey: "views" },
  { key: "courses",      label: "Courses",         Icon: GraduationCap, metricKey: "enrolled" },
  { key: "events",       label: "Events",          Icon: CalendarDays,  metricKey: "date" },
  { key: "scholarships", label: "Scholarships",    Icon: Award,         metricKey: "deadline" },
  { key: "challenges",   label: "Challenges",      Icon: Flag,          metricKey: "participants" },
  { key: "articles",     label: "Articles",        Icon: FileText,      metricKey: "reads" },
];

export function ExploreContentPage() {
  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Explore Content</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>Everything shown on learners' Discover page, tagged by Growth Path category.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
        {GROUPS.map((g) => {
          const items = CONTENT[g.key] as any[];
          return (
            <div key={g.key}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <g.Icon size={14} color={A.gold} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: A.textFaint }}>
                  {g.label} <span style={{ color: A.textMuted, fontWeight: 500 }}>({items.length})</span>
                </span>
              </div>
              <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                    borderBottom: i < items.length - 1 ? `1px solid ${A.borderMuted}` : "none",
                  }}>
                    <span style={{ flex: 1, fontSize: "0.86rem", color: A.text, fontWeight: 500 }}>{item.title}</span>
                    <span style={{ fontSize: "0.72rem", color: A.gold, background: A.goldLight, padding: "3px 10px", borderRadius: 20, flexShrink: 0 }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: "0.78rem", color: A.textFaint, flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                      {item[g.metricKey]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
