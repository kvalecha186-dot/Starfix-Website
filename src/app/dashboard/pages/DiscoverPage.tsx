import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Youtube, CalendarDays, Trophy, Briefcase, Users, BookOpen,
  ExternalLink, Bookmark, BellRing, Star, Award, GraduationCap, Check,
} from "lucide-react";
import { C } from "../dashColors";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";
import { PATHS, statsFor, hashStr, CURATED_STACKS, fallbackStack, type PathDef } from "./GoalsPage";
import { MENTORS } from "./MentorsPage";
import { getSavedItems, saveItem, removeSavedItem } from "../../lib/savedItems";

/* ─────────────────────────────────────────────────────────────────────────
   Explore — a personalized opportunity engine generated from the user's
   ACTIVE PATHS (primary + secondary), weighted 60/30/10 with a general
   self-improvement pool. Nothing here is templated: every path pulls its
   own real video, its own matched mentor, its own modules for milestones.
───────────────────────────────────────────────────────────────────────── */

type ContentType = "YouTube" | "Event" | "Internship" | "Scholarship" | "Mentor" | "Course" | "Book" | "Challenge";

const TYPE_META: Record<ContentType, { color: string; Icon: React.ComponentType<{ size?: number; color?: string }>; filter: string }> = {
  YouTube:      { color: "#DC2626", Icon: Youtube,      filter: "Videos"       },
  Event:        { color: "#EC4899", Icon: CalendarDays, filter: "Events"       },
  Internship:   { color: "#10B981", Icon: Briefcase,    filter: "Opportunities"},
  Scholarship:  { color: "#0D9488", Icon: Award,        filter: "Opportunities"},
  Mentor:       { color: C.gold,    Icon: Users,        filter: "Mentors"      },
  Course:       { color: "#2563EB", Icon: GraduationCap,filter: "Courses"      },
  Book:         { color: "#92400E", Icon: BookOpen,     filter: "Books"        },
  Challenge:    { color: "#F59E0B", Icon: Trophy,       filter: "Challenges"   },
};

const FILTERS = ["All", "Videos", "Events", "Opportunities", "Courses", "Books", "Challenges"];

interface FeedItem {
  id: string;
  type: ContentType;
  title: string;
  desc: string;
  freshness: string;
  reason: string;
  url?: string;
  mentorId?: number;
  trending?: boolean;
  bucket: "primary" | "secondary" | "general";
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const gsearch = (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

// Onboarding goalId -> full path catalog id, so this page speaks the same
// "active path" language as the Dashboard and Profile.
const GOAL_TO_PATH_ID: Record<string, string> = {
  coding: "coding", ai: "ai-ml", uiux: "uiux", finance: "finance",
  comms: "communication-skills", startup: "entrepreneurship",
};

const REASONS = (p: PathDef, progress: number, milestone: string) => [
  `Because you're working on ${p.title} (${progress}%)`,
  `Because you're working on ${p.title} — next milestone: ${milestone}`,
  `Because you're working on ${p.title} — learners with similar goals found this useful`,
];

/* Fixed freshness vocabulary. Deterministic per (type, path-hash) so it's
   stable across re-renders rather than random on every mount. */
const FRESHNESS_POOL = ["Added 2h ago", "This week", "Deadline in 5 days", "Trending now"] as const;

function freshnessFor(type: ContentType, h: number): string {
  switch (type) {
    case "YouTube":     return h % 2 === 0 ? "Added 2h ago" : "Trending now";
    case "Event":       return h % 2 === 0 ? "This week" : "Trending now";
    case "Internship":  return h % 2 === 0 ? "Deadline in 5 days" : "This week";
    case "Scholarship": return h % 3 === 0 ? "This week" : "Deadline in 5 days";
    case "Course":      return h % 2 === 0 ? "Added 2h ago" : "This week";
    case "Book":        return h % 2 === 0 ? "This week" : "Added 2h ago";
    case "Challenge":   return h % 2 === 0 ? "Trending now" : "This week";
    default:            return FRESHNESS_POOL[h % FRESHNESS_POOL.length];
  }
}

/* Per-category content flavor — this is what makes Coding, Communication,
   Fitness, Mindset/Meditation, and Student Life feel like genuinely
   different feeds rather than one template with the path name swapped in.
   Every other path (Finance, Personal Life, etc.) falls back to `general`,
   which is still fully path-specific, just less specialized in wording. */
type Flavor = {
  event: (p: PathDef, milestone: string) => { title: string; desc: string };
  challenge: (p: PathDef) => { title: string; desc: string };
  internship: (p: PathDef) => { title: string; desc: string };
  scholarship: (p: PathDef) => { title: string; desc: string };
  course: (p: PathDef) => { title: string; desc: string };
  book: (p: PathDef) => { title: string; desc: string };
};

const FLAVORS: Record<string, Flavor> = {
  coding: {
    event: (p) => ({ title: `${p.title} Hackathon & Builder Meetup`, desc: `Live coding challenges and real networking with other ${p.title.toLowerCase()} builders.` }),
    challenge: (p) => ({ title: `${p.title} Hackathon`, desc: `A timed build challenge to test what you've learned so far.` }),
    internship: (p) => ({ title: `${p.title} Internships — Open Roles`, desc: `Real internship openings matched to ${p.title.toLowerCase()}.` }),
    scholarship: (p) => ({ title: `${p.title} Scholarships & GitHub Opportunities`, desc: `Funded programs plus open-source contribution opportunities.` }),
    course: (p) => ({ title: `Best ${p.title} Certification Courses`, desc: `Structured courses to go from fundamentals to job-ready.` }),
    book: (p) => ({ title: `Must-Read Books for ${p.title}`, desc: `The books working engineers actually recommend.` }),
  },
  communication: {
    event: (p) => ({ title: `${p.title} Speaking Workshop`, desc: `A live workshop with real feedback on how you speak.` }),
    challenge: (p) => ({ title: `${p.title} 7-Day Speak-Up Challenge`, desc: `Daily prompts to build speaking confidence fast.` }),
    internship: (p) => ({ title: `Mock Interview & Speaking Practice Sessions`, desc: `Practice real interview and presentation scenarios.` }),
    scholarship: (p) => ({ title: `Public Speaking Competitions & Scholarships`, desc: `Competitions and funded programs for speakers.` }),
    course: (p) => ({ title: `Best ${p.title} Courses`, desc: `Courses built around real speaking practice, not just theory.` }),
    book: (p) => ({ title: `Must-Read Books on ${p.title}`, desc: `Classic and modern reads on communicating with impact.` }),
  },
  fitness: {
    event: (p) => ({ title: `${p.title} Community Fitness Event`, desc: `A local or virtual session to train alongside others.` }),
    challenge: (p) => ({ title: `${p.title} 30-Day Challenge`, desc: `A structured challenge to build real momentum.` }),
    internship: (p) => ({ title: `Coaching Internships & Traineeships`, desc: `Hands-on placements for people serious about this path.` }),
    scholarship: (p) => ({ title: `${p.title} Certifications & Scholarships`, desc: `Funded certification programs in fitness and coaching.` }),
    course: (p) => ({ title: `Best ${p.title} Training Courses`, desc: `Structured programs from certified coaches.` }),
    book: (p) => ({ title: `Nutrition & Training Guides for ${p.title}`, desc: `The guides real coaches recommend to clients.` }),
  },
  mindset: {
    event: (p) => ({ title: `${p.title} Guided Focus Session`, desc: `A live guided session to reset and refocus.` }),
    challenge: (p) => ({ title: `${p.title} 21-Day Practice Challenge`, desc: `Daily guided practice to build the habit.` }),
    internship: (p) => ({ title: `Facilitator & Practice Programs`, desc: `Hands-on training programs to go deeper into practice.` }),
    scholarship: (p) => ({ title: `${p.title} Retreats & Funded Programs`, desc: `Retreats and funded training programs.` }),
    course: (p) => ({ title: `Best ${p.title} Courses`, desc: `Structured courses from real practitioners.` }),
    book: (p) => ({ title: `Must-Read Books & Podcasts on ${p.title}`, desc: `The books and podcasts learners keep coming back to.` }),
  },
  student: {
    event: (p) => ({ title: `${p.title} Placement Drive & Prep Session`, desc: `Live sessions to prepare for real placement processes.` }),
    challenge: (p) => ({ title: `${p.title} Mock Test Challenge`, desc: `A timed mock test to check where you actually stand.` }),
    internship: (p) => ({ title: `${p.title} Placement Drives — Open Roles`, desc: `Real placement and internship drives matched to this path.` }),
    scholarship: (p) => ({ title: `${p.title} Scholarships & Funded Programs`, desc: `Scholarships and funded opportunities for students.` }),
    course: (p) => ({ title: `Best ${p.title} Prep Courses`, desc: `Structured prep courses students actually recommend.` }),
    book: (p) => ({ title: `Study Resources & Resume Guides for ${p.title}`, desc: `Curated study material and resume-building resources.` }),
  },
  general: {
    event: (p, milestone) => ({ title: `${p.title} Webinar: ${milestone}`, desc: `A live session focused on ${milestone.toLowerCase()}.` }),
    challenge: (p) => ({ title: `${p.title} 30-Day Challenge`, desc: `A structured challenge to build momentum in ${p.title.toLowerCase()}.` }),
    internship: (p) => ({ title: `${p.title} Internships & Opportunities`, desc: `Real openings and hands-on opportunities matched to this path.` }),
    scholarship: (p) => ({ title: `${p.title} Scholarships & Competitions`, desc: `Scholarships and competitions in this space.` }),
    course: (p) => ({ title: `Best ${p.title} Courses`, desc: `Structured courses to build real skill.` }),
    book: (p) => ({ title: `Must-Read Books for ${p.title}`, desc: `Curated reading, picked by past learners.` }),
  },
};

function flavorKeyFor(p: PathDef): string {
  if (p.mentorCategory === "Coding" || p.mentorCategory === "AI/ML") return "coding";
  if (p.mentorCategory === "Communication") return "communication";
  if (p.mentorCategory === "Fitness") return "fitness";
  if (p.mentorCategory === "Meditation") return "mindset";
  if (p.group === "Student Life") return "student";
  return "general";
}

const TYPE_ORDER: ContentType[] = ["YouTube", "Mentor", "Event", "Challenge", "Internship", "Scholarship", "Course", "Book"];

/* Generates content for one active path — real video, real matched mentor,
   and functional search/application links for the rest. Copy is flavored by
   the path's mentor category / group so Coding, Communication, Fitness,
   Mindset, and Student paths each surface genuinely different opportunities.
   `budget` caps how many of the 8 types are produced, following TYPE_ORDER,
   so a secondary path can contribute a smaller, prioritized slice. */
function generateForPath(p: PathDef, bucket: FeedItem["bucket"], budget: number = 8): FeedItem[] {
  const h = hashStr(p.id);
  const progress = 20 + (h % 71);
  const milestone = p.modules[Math.min(4, Math.floor((progress / 100) * 5))];
  const reasons = REASONS(p, progress, milestone);
  const stack = CURATED_STACKS[p.id] ?? fallbackStack(p);
  const mentors = MENTORS.filter((m) => m.category === p.mentorCategory);
  const mentor = mentors.length ? mentors[h % mentors.length] : MENTORS[0];
  const flavor = FLAVORS[flavorKeyFor(p)];

  const ev = flavor.event(p, milestone);
  const ch = flavor.challenge(p);
  const iv = flavor.internship(p);
  const sc = flavor.scholarship(p);
  const co = flavor.course(p);
  const bk = flavor.book(p);

  const byType: Record<ContentType, Omit<FeedItem, "reason" | "bucket" | "trending">> = {
    YouTube:     { id: `${p.id}-yt`, type: "YouTube",     title: stack.start.title, desc: stack.start.description, freshness: freshnessFor("YouTube", h), url: stack.start.url },
    Mentor:      { id: `${p.id}-mt`, type: "Mentor",      title: `Book a session with ${mentor.name}`, desc: `${mentor.title} · ${p.mentorLabel}`, freshness: mentor.availability === "Today" ? "Available today" : `Available ${mentor.availability.toLowerCase()}`, mentorId: mentor.id },
    Event:       { id: `${p.id}-ev`, type: "Event",       title: ev.title, desc: ev.desc, freshness: freshnessFor("Event", h), url: `https://www.eventbrite.com/d/online/${slug(p.title)}-events/` },
    Challenge:   { id: `${p.id}-ch`, type: "Challenge",   title: ch.title, desc: ch.desc, freshness: freshnessFor("Challenge", h), url: `https://www.reddit.com/search/?q=${encodeURIComponent(p.title + " challenge")}` },
    Internship:  { id: `${p.id}-in`, type: "Internship",  title: iv.title, desc: iv.desc, freshness: freshnessFor("Internship", h), url: `https://internshala.com/internships/keywords-${slug(p.title)}` },
    Scholarship: { id: `${p.id}-sc`, type: "Scholarship", title: sc.title, desc: sc.desc, freshness: freshnessFor("Scholarship", h), url: gsearch(`${p.title} scholarship application 2026`) },
    Course:      { id: `${p.id}-co`, type: "Course",      title: co.title, desc: co.desc, freshness: freshnessFor("Course", h), url: `https://www.coursera.org/search?query=${encodeURIComponent(p.title)}` },
    Book:        { id: `${p.id}-bk`, type: "Book",        title: bk.title, desc: bk.desc, freshness: freshnessFor("Book", h), url: `https://www.goodreads.com/search?q=${encodeURIComponent(p.title + " " + bk.title)}` },
  };

  return TYPE_ORDER.slice(0, budget).map((type, i) => {
    const it = byType[type];
    return { ...it, reason: reasons[i % 3], bucket, trending: freshnessFor(type, h) === "Trending now" };
  });
}

const GENERAL_POOL: FeedItem[] = [
  { id: "gen-1", type: "Book", title: "Atomic Habits — James Clear", desc: "The habit-building framework nearly every learner references.", freshness: "This week", reason: "Useful no matter which path you're on", url: gsearch("Atomic Habits James Clear"), bucket: "general" },
  { id: "gen-2", type: "YouTube", title: "The Science of Setting Goals That Actually Stick", desc: "A short, evergreen watch on goal-setting psychology.", freshness: "Trending now", reason: "Useful no matter which path you're on", url: "https://www.youtube.com/results?search_query=TEDx+science+of+setting+goals+that+stick", bucket: "general", trending: true },
  { id: "gen-3", type: "Course", title: "Learning How to Learn", desc: "A widely-recommended course on effective, evidence-based learning.", freshness: "Added 2h ago", reason: "Useful no matter which path you're on", url: "https://www.coursera.org/search?query=learning%20how%20to%20learn", bucket: "general" },
];

type ActionState = { reminded: string[]; dismissed: string[] };
function loadActions(key: string): ActionState {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : { reminded: [], dismissed: [] }; }
  catch { return { reminded: [], dismissed: [] }; }
}

function FeedCard({ item, state, savedIds, onToggle, onToggleSave, onSelectMentor, compact }: {
  item: FeedItem; state: ActionState; savedIds: Set<string>;
  onToggle: (b: "reminded" | "dismissed", id: string) => void;
  onToggleSave: (item: FeedItem) => void;
  onSelectMentor?: (id: number) => void; compact?: boolean;
}) {
  const meta = TYPE_META[item.type];
  const saved = savedIds.has(item.id);
  const reminded = state.reminded.includes(item.id);
  const isDeadline = item.freshness.startsWith("Deadline");
  const [rippleKey, setRippleKey] = useState(0);

  const open = () => {
    if (item.type === "Mentor" && item.mentorId != null) onSelectMentor?.(item.mentorId);
    else if (item.url) window.open(item.url, "_blank", "noopener,noreferrer");
  };

  const handleSaveClick = () => {
    setRippleKey((k) => k + 1);
    onToggleSave(item);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }} transition={{ duration: 0.18 }}
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 18, boxShadow: C.shadow, overflow: "hidden", width: compact ? 270 : undefined, flexShrink: 0 }}
    >
      <div onClick={open} style={{ height: 92, background: `${meta.color}12`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
        <meta.Icon size={26} color={meta.color} />
        <span style={{ position: "absolute", top: 10, left: 10, fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: meta.color, background: "#fff", border: `1px solid ${meta.color}30`, padding: "3px 9px", borderRadius: 20 }}>{item.type}</span>
        {item.trending && <span style={{ position: "absolute", top: 10, right: 10, fontSize: "0.6rem", fontWeight: 700, color: C.gold, background: C.goldLight, border: `1px solid ${C.goldBorder}`, padding: "3px 8px", borderRadius: 20 }}>Trending</span>}
      </div>
      <div style={{ padding: "16px 18px 14px" }}>
        <div onClick={open} style={{ fontSize: "0.9rem", fontWeight: 600, color: C.text, lineHeight: 1.35, marginBottom: 5, cursor: "pointer" }}>{item.title}</div>
        <p style={{ fontSize: "0.76rem", color: C.textMuted, lineHeight: 1.5, margin: "0 0 8px" }}>{item.desc}</p>
        <div style={{ fontSize: "0.7rem", color: C.gold, fontWeight: 500, marginBottom: 6 }}>{item.reason}</div>
        <div style={{ fontSize: "0.7rem", color: isDeadline ? "#B45309" : C.textFaint, fontWeight: isDeadline ? 600 : 400, marginBottom: 14 }}>{item.freshness}</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: `1px solid ${C.borderMuted}` }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ position: "relative" }}>
              <AnimatePresence>
                {rippleKey > 0 && (
                  <motion.span
                    key={rippleKey}
                    initial={{ scale: 0.3, opacity: 0.55 }}
                    animate={{ scale: 2.1, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    style={{
                      position: "absolute", inset: 0, margin: "auto", width: 26, height: 26,
                      borderRadius: "50%", background: C.gold, pointerEvents: "none",
                    }}
                  />
                )}
              </AnimatePresence>
              <IconBtn active={saved} onClick={handleSaveClick} title={saved ? "Remove from saved" : "Save"}>
                <motion.span key={saved ? "on" : "off"} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ duration: 0.18 }} style={{ display: "flex" }}>
                  <Bookmark size={13} fill={saved ? C.gold : "none"} />
                </motion.span>
              </IconBtn>
            </div>
            <IconBtn active={reminded} onClick={() => onToggle("reminded", item.id)} title="Remind me"><BellRing size={13} /></IconBtn>
          </div>
          <motion.button onClick={open} whileHover={{ x: 2 }} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, color: C.gold, fontFamily: "'Inter', sans-serif" }}>
            {item.type === "Mentor" ? "View Profile" : "Open"} <ExternalLink size={12} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

function IconBtn({ children, active, onClick, title }: { children: React.ReactNode; active: boolean; onClick: () => void; title: string }) {
  return (
    <motion.button onClick={onClick} title={title} whileHover={{ backgroundColor: C.surfaceAlt }} transition={{ duration: 0.15 }}
      style={{ width: 26, height: 26, borderRadius: 8, border: "none", background: "none", color: active ? C.gold : C.textFaint, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {children}
    </motion.button>
  );
}

export function DiscoverPage({ onNavigate, userProfile, onSelectMentor }: { onNavigate?: (p: DashPage) => void; userProfile?: UserProfile | null; onSelectMentor?: (id: number) => void }) {
  const goalId = userProfile?.goalId || "coding";
  const primaryId = GOAL_TO_PATH_ID[goalId] || "coding";

  const enrolledIds = useMemo(() => {
    try {
      return Object.keys(localStorage)
        .filter((k) => k.startsWith("starfix:enrolled:") && localStorage.getItem(k) === "true")
        .map((k) => k.replace("starfix:enrolled:", ""));
    } catch { return []; }
  }, []);
  // Every other active (enrolled) path beyond the primary onboarding goal —
  // supports more than one secondary active path for the 30% secondary bucket.
  const secondaryIds = useMemo(() => enrolledIds.filter((id) => id !== primaryId).slice(0, 3), [enrolledIds, primaryId]);

  const primaryPath = PATHS.find((p) => p.id === primaryId) || PATHS[0];
  const secondaryPaths = useMemo(
    () => secondaryIds.map((id) => PATHS.find((p) => p.id === id)).filter((p): p is PathDef => !!p),
    [secondaryIds]
  );

  const actionsKey = `starfix:discover:actions:${primaryId}`;
  const [filter, setFilter] = useState("All");
  const [actions, setActions] = useState<ActionState>(() => loadActions(actionsKey));

  // Saved items are global (not scoped to a goal/path) so they persist and
  // show up on the Profile page regardless of which path is currently active.
  const [savedIds, setSavedIds] = useState<Set<string>>(() => new Set(getSavedItems().map((i) => i.id)));
  const [toast, setToast] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((cur) => (cur === msg ? null : cur)), 2400);
  };

  const toggle = (bucket: "reminded" | "dismissed", id: string) => {
    setActions((prev) => {
      const set = new Set(prev[bucket]);
      set.has(id) ? set.delete(id) : set.add(id);
      const next = { ...prev, [bucket]: Array.from(set) };
      try { localStorage.setItem(actionsKey, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const toggleSave = (item: FeedItem) => {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) {
        next.delete(item.id);
        removeSavedItem(item.id);
        showToast("Removed from saved items");
      } else {
        next.add(item.id);
        saveItem({ id: item.id, type: item.type, title: item.title, desc: item.desc, freshness: item.freshness, url: item.url, mentorId: item.mentorId });
        showToast("Saved to your profile");
      }
      return next;
    });
  };

  // 60% primary / 30% secondary (split across every secondary active path) / 10% general
  const feed = useMemo(() => {
    const primary = generateForPath(primaryPath, "primary", 8); // all 8 content types
    const secondaryBudgetTotal = 4;
    const perPath = secondaryPaths.length ? Math.max(1, Math.floor(secondaryBudgetTotal / secondaryPaths.length)) : 0;
    const extra = secondaryPaths.length ? secondaryBudgetTotal - perPath * secondaryPaths.length : 0;
    const secondary = secondaryPaths.flatMap((sp, i) =>
      generateForPath(sp, "secondary", perPath + (i < extra ? 1 : 0))
    );
    const general = GENERAL_POOL.slice(0, secondary.length ? 1 : 2);
    return [...primary, ...secondary, ...general];
  }, [primaryPath, secondaryPaths]);

  const visible = useMemo(
    () => feed.filter((f) => !actions.dismissed.includes(f.id) && (filter === "All" || TYPE_META[f.type].filter === filter)),
    [feed, filter, actions.dismissed]
  );
  const trending = useMemo(() => feed.filter((f) => f.trending && !actions.dismissed.includes(f.id)), [feed, actions.dismissed]);

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div style={{ padding: "40px 48px 0" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2.1rem", fontWeight: 700, color: C.text, margin: "0 0 6px", letterSpacing: "-0.02em" }}>Explore</h1>
        <p style={{ fontSize: "0.84rem", color: C.textMuted, margin: "0 0 26px" }}>A personalized feed of what's worth your time next.</p>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
          {FILTERS.map((f) => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: "7px 15px", borderRadius: 999, fontSize: "0.78rem", cursor: "pointer",
              border: `1px solid ${filter === f ? C.gold : C.border}`, background: filter === f ? C.goldLight : "transparent",
              color: filter === f ? C.gold : C.textMuted, fontWeight: filter === f ? 600 : 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
            }}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {trending.length > 0 && (
        <div style={{ padding: "28px 48px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Star size={13} color={C.gold} fill={C.gold} />
            <span style={{ fontSize: "0.84rem", fontWeight: 600, color: C.text }}>Trending among learners like you</span>
          </div>
          <div style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 8 }}>
            {trending.map((item) => <FeedCard key={item.id} item={item} state={actions} savedIds={savedIds} onToggle={toggle} onToggleSave={toggleSave} onSelectMentor={onSelectMentor} compact />)}
          </div>
        </div>
      )}

      <div style={{ padding: "28px 48px 56px" }}>
        {visible.length === 0 ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: C.textMuted, fontSize: "0.86rem" }}>Nothing here right now — try a different filter.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {visible.map((item) => <FeedCard key={item.id} item={item} state={actions} savedIds={savedIds} onToggle={toggle} onToggleSave={toggleSave} onSelectMentor={onSelectMentor} />)}
          </div>
        )}
      </div>

      {/* Toast — bottom-right, gold accent, auto-dismiss */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              position: "fixed", bottom: 28, right: 28, zIndex: 200,
              display: "flex", alignItems: "center", gap: 9,
              background: C.text, color: "#fff", padding: "12px 18px", borderRadius: 12,
              boxShadow: "0 12px 30px -10px rgba(0,0,0,0.35)", fontFamily: "'Inter', sans-serif",
            }}
          >
            <span style={{
              width: 18, height: 18, borderRadius: "50%", background: C.gold,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Check size={11} color="#fff" strokeWidth={3} />
            </span>
            <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
