import { useEffect, useState } from "react";
import { Loader2, Users, Activity, ShieldCheck, Clock } from "lucide-react";
import { A } from "../adminColors";
import { loadAdminLearners } from "../../lib/adminBackend";
import { getLiveLogins, type UserLoginEvent } from "../../lib/loginAudit";

function timeAgo(dateStr: string) {
  if (!dateStr) return "—";
  const time = Date.parse(dateStr);
  if (isNaN(time)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (sec < 45) return "Just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}

export function LearnersPage() {
  const [learners, setLearners] = useState<any[]>([]);
  const [logins, setLogins] = useState<UserLoginEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"learners" | "logins">("logins");

  useEffect(() => {
    Promise.all([
      loadAdminLearners().catch(() => []),
      getLiveLogins().catch(() => []),
    ])
      .then(([l, log]) => {
        setLearners(l);
        setLogins(log);
      })
      .catch((e) => setError(e.message || "Could not load data"))
      .finally(() => setLoading(false));

    // Listen for real-time login events
    const handler = (e: any) => {
      if (e.detail) {
        setLogins((prev) => [e.detail, ...prev.filter((x) => x.id !== e.detail.id)]);
      }
    };
    window.addEventListener("starfix:new-login", handler);
    return () => window.removeEventListener("starfix:new-login", handler);
  }, []);

  return (
    <div style={{ padding: "36px 40px 60px", maxWidth: 1180, margin: "0 auto", fontFamily: A.sans }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: A.serif, fontSize: "1.7rem", color: A.text, margin: "0 0 6px" }}>
          User & Login Telemetry
        </h1>
        <p style={{ fontSize: ".85rem", color: A.textMuted, margin: 0 }}>
          Live user logins, authentication events, and student directory.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => setTab("logins")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${tab === "logins" ? A.gold : A.border}`,
            background: tab === "logins" ? A.goldLight : A.surface,
            color: tab === "logins" ? A.gold : A.textMuted,
            fontWeight: 600,
            fontSize: ".82rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Activity size={14} /> Real-Time Logins ({logins.length})
        </button>

        <button
          onClick={() => setTab("learners")}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: `1px solid ${tab === "learners" ? A.gold : A.border}`,
            background: tab === "learners" ? A.goldLight : A.surface,
            color: tab === "learners" ? A.gold : A.textMuted,
            fontWeight: 600,
            fontSize: ".82rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <Users size={14} /> Registered Learners ({learners.length})
        </button>
      </div>

      {loading ? (
        <Loader2 size={24} style={{ color: A.gold }} />
      ) : error ? (
        <div style={{ color: A.red }}>{error}</div>
      ) : tab === "logins" ? (
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["User", "Role", "Sign-In Method", "Device & OS", "IP / Location", "Time", "Status"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 18px", fontSize: ".72rem", color: A.textFaint, borderBottom: `1px solid ${A.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logins.length ? (
                logins.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < logins.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}>
                    <td style={{ padding: "13px 18px", fontWeight: 600, color: A.text }}>
                      {l.name}
                      <div style={{ fontSize: ".75rem", color: A.textMuted, fontWeight: 400 }}>{l.email}</div>
                    </td>
                    <td style={{ padding: "13px 18px", color: A.gold }}>{l.role}</td>
                    <td style={{ padding: "13px 18px", color: A.text, fontWeight: 500 }}>{l.loginMethod}</td>
                    <td style={{ padding: "13px 18px", color: A.textMuted }}>{l.device}</td>
                    <td style={{ padding: "13px 18px" }}>
                      <code style={{ fontSize: ".75rem", color: A.gold }}>{l.ipAddress}</code>
                      <div style={{ fontSize: ".7rem", color: A.textFaint }}>{l.location}</div>
                    </td>
                    <td style={{ padding: "13px 18px", color: "#4ADE80", fontWeight: 600 }}>{timeAgo(l.timestamp)}</td>
                    <td style={{ padding: "13px 18px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: 99, background: "rgba(74,222,128,.15)", color: "#4ADE80", fontSize: ".7rem", fontWeight: 600 }}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ padding: 28, textAlign: "center", color: A.textMuted }}>
                    No login events recorded yet. When a user logs in on Starfix, their session appears here in real-time.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: A.radius, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Name", "Email", "Role", "Country", "Career goal", "Joined"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "14px 18px", fontSize: ".7rem", color: A.textFaint, borderBottom: `1px solid ${A.border}` }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {learners.length ? (
                learners.map((l, i) => (
                  <tr key={l.id} style={{ borderBottom: i < learners.length - 1 ? `1px solid ${A.borderMuted}` : "none" }}>
                    <td style={{ padding: "13px 18px", fontWeight: 600, color: A.text }}>{l.full_name || "Unnamed"}</td>
                    <td style={{ padding: "13px 18px", color: A.textMuted }}>{l.email || "—"}</td>
                    <td style={{ padding: "13px 18px", color: A.textMuted }}>{l.role || "student"}</td>
                    <td style={{ padding: "13px 18px", color: A.textMuted }}>{l.country || "—"}</td>
                    <td style={{ padding: "13px 18px", color: A.textMuted }}>{l.career_goal || "—"}</td>
                    <td style={{ padding: "13px 18px", color: A.textFaint }}>{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: 28, textAlign: "center", color: A.textMuted }}>
                    No learner profiles found in Supabase yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
