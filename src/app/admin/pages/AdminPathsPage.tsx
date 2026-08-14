import { Code2, Brain, Wallet, Dumbbell, TrendingUp, TrendingDown, Minus, Pencil, Eye, Copy, Archive, Users, GraduationCap } from "lucide-react";
import { A } from "../adminColors";
import { ADMIN_PATHS } from "../adminData";

const CATEGORY_ICON: Record<string, any> = {
  "Career & Tech": Code2, "Mindset": Brain, "Personal Life": Wallet, "Health & Fitness": Dumbbell,
};
const TREND_ICON = { up: TrendingUp, down: TrendingDown, flat: Minus };

function ActionBtn({ Icon, title }: { Icon: any; title: string }) {
  return (
    <button title={title} style={{
      width: 30, height: 30, borderRadius: "50%", border: `1px solid ${A.border}`, background: A.surface,
      display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "background 150ms ease",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = A.surfaceAlt)}
      onMouseLeave={(e) => (e.currentTarget.style.background = A.surface)}
    >
      <Icon size={13} color={A.textMuted} />
    </button>
  );
}

export function AdminPathsPage() {
  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1180, margin: "0 auto" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.5rem", fontWeight: 700, color: A.text, margin: "0 0 6px" }}>Growth Paths</h1>
        <p style={{ fontSize: "0.85rem", color: A.textMuted, margin: 0 }}>{ADMIN_PATHS.length} published paths across the platform.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
        {ADMIN_PATHS.map((p) => {
          const CatIcon = CATEGORY_ICON[p.category] || Code2;
          const TrendIcon = TREND_ICON[p.trend];
          const trendColor = p.trend === "up" ? A.green : p.trend === "down" ? A.red : A.textFaint;
          return (
            <div key={p.id} style={{
              background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius,
              padding: "22px 22px 18px", boxShadow: A.shadow, transition: "transform 150ms ease, box-shadow 150ms ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = A.shadowMd; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = A.shadow; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: A.goldLight, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <CatIcon size={16} color={A.gold} strokeWidth={1.8} />
                </div>
                <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", fontWeight: 600, color: trendColor }}>
                  <TrendIcon size={12} />
                </span>
              </div>

              <div style={{ fontSize: "1rem", fontWeight: 700, color: A.text, marginBottom: 3 }}>{p.title}</div>
              <div style={{ fontSize: "0.76rem", color: A.textFaint, marginBottom: 16 }}>{p.category}</div>

              <div style={{ display: "flex", gap: 18, marginBottom: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.9rem", fontWeight: 700, color: A.text }}>
                    <Users size={12} color={A.textFaint} /> {p.learners.toLocaleString()}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: A.textFaint, marginTop: 2 }}>Learners</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: A.gold }}>{p.completion}%</div>
                  <div style={{ fontSize: "0.68rem", color: A.textFaint, marginTop: 2 }}>Completion</div>
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.9rem", fontWeight: 700, color: A.text }}>
                    <GraduationCap size={12} color={A.textFaint} /> {p.mentors}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: A.textFaint, marginTop: 2 }}>Mentors</div>
                </div>
              </div>

              <div style={{ fontSize: "0.72rem", color: A.textFaint, marginBottom: 16 }}>Updated {p.updated}</div>

              <div style={{ display: "flex", gap: 8, paddingTop: 14, borderTop: `1px solid ${A.borderMuted}` }}>
                <ActionBtn Icon={Pencil} title="Edit" />
                <ActionBtn Icon={Eye} title="View" />
                <ActionBtn Icon={Copy} title="Duplicate" />
                <ActionBtn Icon={Archive} title="Archive" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
