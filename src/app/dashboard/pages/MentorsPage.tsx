import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Star, ArrowUpRight } from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";
import { GOAL_META } from "../../types";

/* ─── Data ─────────────────────────────────────── */

export const MENTORS = [
  {
    id: 1, initials: "AC", color: "#6366F1",
    name: "Aria Chen",       title: "Senior ML Engineer",     company: "Google",          category: "AI/ML",
    rating: 4.9, students: 1240, price: "₹2,500/hr", free: false,
    availability: "Today",
    skills: ["PyTorch", "NLP", "Computer Vision"],
  },
  {
    id: 2, initials: "MW", color: "#E85D75",
    name: "Marcus Webb",     title: "Growth Coach",           company: "a16z Portfolio",  category: "Entrepreneurship",
    rating: 4.8, students: 890, price: "₹3,200/hr", free: false,
    availability: "Tomorrow",
    skills: ["Startup Strategy", "Fundraising", "GTM"],
  },
  {
    id: 3, initials: "PS", color: "#20B2AA",
    name: "Priya Sharma",    title: "Lead UX Designer",       company: "Figma",           category: "UI/UX",
    rating: 5.0, students: 2100, price: "Free", free: true,
    availability: "Today",
    skills: ["Figma", "Design Systems", "User Research"],
  },
  {
    id: 4, initials: "DP", color: "#F4A261",
    name: "Daniel Park",     title: "Certified Financial Planner", company: "Fidelity",  category: "Finance",
    rating: 4.7, students: 567, price: "₹1,800/hr", free: false,
    availability: "This week",
    skills: ["Investing", "Tax Planning", "Budgeting"],
  },
  {
    id: 5, initials: "ST", color: "#A78BFA",
    name: "Sofia Torres",    title: "Software Engineer",      company: "Stripe",          category: "Coding",
    rating: 4.9, students: 1580, price: "Free", free: true,
    availability: "Today",
    skills: ["Python", "React", "System Design"],
  },
  {
    id: 6, initials: "RG", color: "#34D399",
    name: "Rahul Gupta",     title: "IELTS Trainer",          company: "British Council", category: "Languages",
    rating: 4.8, students: 3400, price: "₹1,200/hr", free: false,
    availability: "Today",
    skills: ["IELTS", "TOEFL", "Business English"],
  },
  {
    id: 7, initials: "EW", color: "#FB923C",
    name: "Emma Walsh",      title: "Content Strategist",     company: "HubSpot",         category: "Content",
    rating: 4.6, students: 720, price: "₹2,000/hr", free: false,
    availability: "Tomorrow",
    skills: ["Instagram", "YouTube", "Brand Building"],
  },
  {
    id: 8, initials: "KN", color: "#38BDF8",
    name: "Kenji Nakamura",  title: "Communication Coach",    company: "TEDx Speaker",    category: "Communication",
    rating: 4.9, students: 890, price: "₹2,800/hr", free: false,
    availability: "Today",
    skills: ["Public Speaking", "Storytelling", "Confidence"],
  },
  {
    id: 9, initials: "JM", color: "#F87171",
    name: "Jake Morrison",   title: "Certified Personal Trainer", company: "Equinox",     category: "Fitness",
    rating: 4.8, students: 1120, price: "₹1,500/hr", free: false,
    availability: "Today",
    skills: ["Strength Training", "Nutrition", "Fat Loss"],
  },
  {
    id: 10, initials: "LA", color: "#14B8A6",
    name: "Leela Anand",     title: "Meditation & Mindfulness Coach", company: "Headspace", category: "Meditation",
    rating: 4.9, students: 640, price: "Free", free: true,
    availability: "Tomorrow",
    skills: ["Meditation", "Breathwork", "Stress Relief"],
  },
];

export type Mentor = typeof MENTORS[0];

const CATEGORY_TABS = [
  "All", "Coding", "AI/ML", "UI/UX", "Finance",
  "Languages", "Communication", "Entrepreneurship", "Content",
  "Fitness", "Meditation",
];

const FILTER_PILLS = [
  { label: "Available today", key: "today"  },
  { label: "Free",            key: "free"   },
  { label: "Top rated",       key: "top"    },
];

/* ─── Component ─────────────────────────────────── */

export function MentorsPage({ onNavigate, userProfile, categoryOverride, onSelectMentor }: { onNavigate?: (p: DashPage) => void; userProfile?: UserProfile | null; categoryOverride?: string | null; onSelectMentor?: (id: number) => void }) {
  const { isDesktop, isMobile } = useViewport();
  const defaultCategory = categoryOverride || (userProfile?.goalId ? (GOAL_META[userProfile.goalId]?.categoryTab || "All") : "All");
  const [search,   setSearch]   = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [filters,  setFilters]  = useState<string[]>([]);

  useEffect(() => { setCategory(defaultCategory); }, [defaultCategory]);

  const toggleFilter = (key: string) =>
    setFilters((prev) => (prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]));

  const filtered = MENTORS.filter((m) => {
    const q = search.toLowerCase();
    const matchSearch =
      m.name.toLowerCase().includes(q) ||
      m.title.toLowerCase().includes(q) ||
      m.skills.some((s) => s.toLowerCase().includes(q));
    const matchCat  = category === "All" || m.category === category;
    const matchFree  = !filters.includes("free")  || m.free;
    const matchToday = !filters.includes("today") || m.availability === "Today";
    const matchTop   = !filters.includes("top")   || m.rating >= 4.9;
    return matchSearch && matchCat && matchFree && matchToday && matchTop;
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: isDesktop ? "40px 48px 0" : "20px 16px 0" }}>
        <h1
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: isDesktop ? "2.1rem" : "1.7rem",
            fontWeight: 700,
            color: C.text,
            margin: "0 0 24px",
            letterSpacing: "-0.02em",
          }}
        >
          Mentors
        </h1>

        {/* Search + filters */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: isDesktop ? "1 1 260px" : "1 1 100%", maxWidth: isDesktop ? 320 : "100%" }}>
            <Search
              size={13}
              color={C.textFaint}
              style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search mentors, skills…"
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: 999,
                border: `1px solid ${C.border}`,
                background: C.surface,
                color: C.text,
                fontSize: "0.82rem",
                outline: "none",
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box",
              }}
            />
          </div>

          {FILTER_PILLS.map(({ label, key }) => (
            <button
              key={key}
              onClick={() => toggleFilter(key)}
              style={{
                padding: "7px 14px",
                borderRadius: 999,
                fontSize: "0.76rem",
                cursor: "pointer",
                border: `1px solid ${filters.includes(key) ? C.gold : C.border}`,
                background: filters.includes(key) ? C.goldLight : "transparent",
                color: filters.includes(key) ? "#7A6010" : C.textMuted,
                transition: "all 0.15s",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Category tabs — already horizontally scrollable at any size */}
        <div className="starfix-chip-scroll" style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}` }}>
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              style={{
                padding: "10px 16px",
                background: "none",
                border: "none",
                borderBottom: `2px solid ${category === cat ? C.gold : "transparent"}`,
                color: category === cat ? C.text : C.textMuted,
                fontSize: "0.81rem",
                fontWeight: category === cat ? 600 : 400,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                flexShrink: 0,
                marginBottom: -1,
                transition: "color 0.15s, border-color 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Card grid — auto-fill already degrades naturally; single column
           is forced below tablet width so a card never has to squeeze. */}
      <div
        style={{
          padding: isDesktop ? "32px 48px 48px" : "20px 16px 40px",
          display: "grid",
          gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(240px, 1fr))" : isMobile ? "1fr" : "repeat(2, 1fr)",
          gap: isDesktop ? "28px 24px" : "20px 16px",
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", padding: "48px 0", textAlign: "center", color: C.textMuted, fontSize: "0.86rem" }}>
            No mentors match your search.
          </div>
        ) : (
          filtered.map((m, i) => <MentorCard key={m.id} mentor={m} delay={i * 0.04} onSelect={onSelectMentor} />)
        )}
      </div>
    </div>
  );
}

function MentorCard({ mentor: m, delay, onSelect }: { mentor: Mentor; delay: number; onSelect?: (id: number) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay }}
      whileHover={{ y: -2 }}
      onClick={() => onSelect?.(m.id)}
      style={{ cursor: "pointer" }}
    >
      {/* Photo */}
      <div
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          borderRadius: C.radius,
          background: `linear-gradient(155deg, ${m.color}22, ${m.color}08)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 14,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "2.4rem",
            fontWeight: 700,
            color: m.color,
          }}
        >
          {m.initials}
        </span>
        {m.availability === "Today" && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 9,
              height: 9,
              borderRadius: "50%",
              background: "#10B981",
              border: "2px solid #fff",
            }}
            title="Available today"
          />
        )}
      </div>

      {/* Identity */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 2 }}>
        <div style={{ fontSize: "0.98rem", fontWeight: 600, color: C.text, lineHeight: 1.3 }}>
          {m.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0, paddingTop: 2 }}>
          <Star size={11} color={C.gold} fill={C.gold} />
          <span style={{ fontSize: "0.75rem", fontWeight: 600, color: C.text }}>{m.rating}</span>
        </div>
      </div>
      <div style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.4, marginBottom: 10 }}>
        {m.title} · {m.company}
      </div>

      {/* Skills */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        {m.skills.slice(0, 2).map((s) => (
          <span
            key={s}
            style={{
              fontSize: "0.68rem",
              color: C.textMuted,
              border: `1px solid ${C.border}`,
              padding: "2px 9px",
              borderRadius: 999,
            }}
          >
            {s}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: m.free ? "#0F9D6C" : C.text }}>
          {m.price}
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.76rem", fontWeight: 500, color: C.gold }}>
          Book <ArrowUpRight size={12} />
        </span>
      </div>
    </motion.div>
  );
}
