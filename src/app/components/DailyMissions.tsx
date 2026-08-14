import { motion } from "motion/react";
import { useState } from "react";
import { CheckCircle2, Circle, Flame, Trophy, Zap, Star, Shield, Crown } from "lucide-react";

const missions = [
  { id: 1, title: "Complete 20-minute meditation", xp: 50, done: true, category: "Mind" },
  { id: 2, title: "Read 10 pages of your current book", xp: 30, done: true, category: "Mind" },
  { id: 3, title: "30-min strength workout", xp: 80, done: false, category: "Body" },
  { id: 4, title: "Build 1 component for your portfolio", xp: 100, done: false, category: "Skills" },
  { id: 5, title: "Message 1 potential mentor", xp: 40, done: false, category: "Career" },
];

const badges = [
  { icon: Flame, label: "7-Day Streak", desc: "Consistent for a week", earned: true },
  { icon: Trophy, label: "First Mentor Session", desc: "Welcome to Starfix", earned: true },
  { icon: Zap, label: "Speed Learner", desc: "3 skills in 30 days", earned: true },
  { icon: Star, label: "Top 10% Achiever", desc: "Elite performer", earned: false },
  { icon: Shield, label: "Mind Master", desc: "Complete Mind pillar", earned: false },
  { icon: Crown, label: "Constellation Complete", desc: "Light all 12 nodes", earned: false },
];

export function DailyMissions() {
  const [checked, setChecked] = useState<number[]>([1, 2]);

  const toggle = (id: number) => {
    setChecked((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const totalXP = missions.reduce((acc, m) => checked.includes(m.id) ? acc + m.xp : acc, 0);
  const maxXP = missions.reduce((acc, m) => acc + m.xp, 0);

  const categoryColors: Record<string, string> = {
    Mind: "#9b7fe8",
    Body: "#e87f7f",
    Skills: "#7fb8e8",
    Career: "#7fe8b4",
  };

  return (
    <section className="py-28 px-6" style={{ background: "linear-gradient(180deg, #0d0b06 0%, #0a0a0f 100%)" }}>
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="uppercase tracking-widest text-xs mb-4" style={{ color: "#D4AF37", fontFamily: "'Inter', sans-serif", fontWeight: 500 }}>
            Stay on Track
          </p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", marginBottom: "1rem" }}>
            Daily Missions &{" "}
            <span style={{ background: "linear-gradient(135deg, #F4D67A, #D4AF37)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
              Achievements
            </span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Daily missions */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="rounded-3xl p-8"
            style={{
              background: "rgba(14,14,20,0.9)",
              border: "1px solid rgba(212,175,55,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", fontSize: "1.3rem" }}>
                  Today's Missions
                </h3>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "rgba(250,249,246,0.4)" }}>
                  Thursday, June 12, 2026
                </p>
              </div>
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)" }}
              >
                <Flame size={15} style={{ color: "#D4AF37" }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", color: "#F4D67A", fontWeight: 600 }}>
                  24-Day Streak
                </span>
              </div>
            </div>

            {/* XP bar */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "rgba(250,249,246,0.5)" }}>Daily XP</span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.75rem", color: "#D4AF37", fontWeight: 600 }}>
                  {totalXP} / {maxXP} XP
                </span>
              </div>
              <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, #F4D67A, #D4AF37)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalXP / maxXP) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Mission list */}
            <div className="flex flex-col gap-3">
              {missions.map((mission) => {
                const isDone = checked.includes(mission.id);
                return (
                  <motion.div
                    key={mission.id}
                    onClick={() => toggle(mission.id)}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200"
                    style={{
                      background: isDone ? "rgba(212,175,55,0.07)" : "rgba(255,255,255,0.03)",
                      border: isDone ? "1px solid rgba(212,175,55,0.2)" : "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    {isDone
                      ? <CheckCircle2 size={20} style={{ color: "#D4AF37", flexShrink: 0 }} />
                      : <Circle size={20} style={{ color: "rgba(250,249,246,0.2)", flexShrink: 0 }} />
                    }
                    <span
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: "0.88rem",
                        color: isDone ? "rgba(250,249,246,0.5)" : "#FAF9F6",
                        fontWeight: isDone ? 400 : 500,
                        textDecoration: isDone ? "line-through" : "none",
                        flex: 1,
                      }}
                    >
                      {mission.title}
                    </span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: `${categoryColors[mission.category]}15`,
                          color: categoryColors[mission.category],
                          fontFamily: "'Inter', sans-serif",
                          border: `1px solid ${categoryColors[mission.category]}30`,
                        }}
                      >
                        {mission.category}
                      </span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.72rem", color: "#D4AF37", fontWeight: 500 }}>
                        +{mission.xp}xp
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Badges */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="rounded-3xl p-8"
            style={{
              background: "rgba(14,14,20,0.9)",
              border: "1px solid rgba(212,175,55,0.12)",
              backdropFilter: "blur(20px)",
            }}
          >
            <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#FAF9F6", fontSize: "1.3rem", marginBottom: "0.4rem" }}>
              Achievement Badges
            </h3>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.78rem", color: "rgba(250,249,246,0.4)", marginBottom: "1.5rem" }}>
              3 of 6 earned — keep going!
            </p>

            <div className="grid grid-cols-2 gap-4">
              {badges.map((badge, i) => (
                <motion.div
                  key={badge.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{
                    background: badge.earned ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
                    border: badge.earned ? "1px solid rgba(212,175,55,0.22)" : "1px solid rgba(255,255,255,0.05)",
                    opacity: badge.earned ? 1 : 0.45,
                  }}
                >
                  <div
                    className="flex items-center justify-center w-10 h-10 rounded-xl flex-shrink-0"
                    style={{
                      background: badge.earned ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.05)",
                      border: badge.earned ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <badge.icon size={18} style={{ color: badge.earned ? "#D4AF37" : "rgba(250,249,246,0.2)" }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.82rem", fontWeight: 600, color: badge.earned ? "#FAF9F6" : "rgba(250,249,246,0.4)" }}>
                      {badge.label}
                    </div>
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.7rem", color: "rgba(250,249,246,0.35)" }}>
                      {badge.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
