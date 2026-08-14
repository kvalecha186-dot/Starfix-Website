/* ─────────────────────────────────────────────────────────────────────────
   Mock admin data. Every number here is illustrative — wire to real
   endpoints when the backend exists. Kept realistic in shape and scale
   rather than exhaustive.
───────────────────────────────────────────────────────────────────────── */

export type LearnerStatus = "Active" | "At risk" | "Inactive";

export interface Learner {
  id: number;
  name: string;
  email: string;
  initials: string;
  color: string;
  activePaths: string[];
  streak: number;
  progress: number;
  lastActive: string;
  status: LearnerStatus;
  mentorSessions: { mentor: string; date: string; topic: string }[];
  notes: string[];
  aiInteractions: string[];
  recentActivity: string[];
}

export const LEARNERS: Learner[] = [
  { id: 1, name: "Priya Nair",        email: "priya.nair@example.com",    initials: "PN", color: "#C89B1D",
    activePaths: ["Coding", "Communication"], streak: 14, progress: 68, lastActive: "2h ago", status: "Active",
    mentorSessions: [{ mentor: "Sofia Torres", date: "Yesterday", topic: "API design review" }],
    notes: ["Strong momentum on the Coding path", "Asked about switching mentors — resolved"],
    aiInteractions: ["\u201cHow do I structure a REST API?\u201d", "\u201cWhat should I learn after JavaScript basics?\u201d"],
    recentActivity: ["Completed Module 4: APIs", "Booked a session with Sofia Torres", "Earned Consistency badge"] },
  { id: 2, name: "Daniel Osei",       email: "daniel.osei@example.com",   initials: "DO", color: "#3F8F6B",
    activePaths: ["Fitness"], streak: 31, progress: 84, lastActive: "1h ago", status: "Active",
    mentorSessions: [{ mentor: "Jake Morrison", date: "3 days ago", topic: "Progressive overload plan" }],
    notes: ["One of our most consistent learners"], aiInteractions: ["\u201cHow much protein do I need daily?\u201d"],
    recentActivity: ["Logged workout #46", "Hit a 30-day streak", "Left a 5-star mentor review"] },
  { id: 3, name: "Meera Iyer",        email: "meera.iyer@example.com",    initials: "MI", color: "#8B6BC9",
    activePaths: ["UI/UX", "Career Growth"], streak: 3, progress: 22, lastActive: "6h ago", status: "At risk",
    mentorSessions: [], notes: ["Hasn't booked a mentor session yet — flagged for outreach"],
    aiInteractions: ["\u201cWhat's the difference between UX and UI?\u201d"],
    recentActivity: ["Started UI/UX path", "Skipped 2 daily missions"] },
  { id: 4, name: "Tom Bennett",       email: "tom.bennett@example.com",   initials: "TB", color: "#4A7FB5",
    activePaths: ["Finance"], streak: 0, progress: 12, lastActive: "9 days ago", status: "Inactive",
    mentorSessions: [{ mentor: "Daniel Park", date: "2 weeks ago", topic: "Building a first budget" }],
    notes: ["Went quiet after onboarding — re-engagement email sent"], aiInteractions: [],
    recentActivity: ["Missed 5 consecutive days"] },
  { id: 5, name: "Aisha Rahman",      email: "aisha.rahman@example.com",  initials: "AR", color: "#C9527A",
    activePaths: ["Communication", "Meditation"], streak: 22, progress: 71, lastActive: "30m ago", status: "Active",
    mentorSessions: [{ mentor: "Kenji Nakamura", date: "Today", topic: "Mock interview practice" }],
    notes: [], aiInteractions: ["\u201cGive me a 5-minute breathing exercise\u201d"],
    recentActivity: ["Completed a mock interview", "Started Meditation week 2"] },
  { id: 6, name: "Lucas Ferreira",    email: "lucas.ferreira@example.com",initials: "LF", color: "#C87A2E",
    activePaths: ["Coding"], streak: 7, progress: 45, lastActive: "4h ago", status: "Active",
    mentorSessions: [], notes: ["Requested a mentor switch to someone with React Native experience"],
    aiInteractions: ["\u201cReact Native vs Flutter for a first app?\u201d"],
    recentActivity: ["Submitted first project for review"] },
  { id: 7, name: "Grace Kim",         email: "grace.kim@example.com",     initials: "GK", color: "#2E9E9E",
    activePaths: ["Entrepreneurship"], streak: 18, progress: 59, lastActive: "12h ago", status: "Active",
    mentorSessions: [{ mentor: "Marcus Webb", date: "5 days ago", topic: "Pitch deck feedback" }],
    notes: [], aiInteractions: [], recentActivity: ["Uploaded pitch deck v2", "Booked next mentor session"] },
  { id: 8, name: "Noah Williams",     email: "noah.williams@example.com", initials: "NW", color: "#9A6B3F",
    activePaths: ["Finance", "Coding"], streak: 1, progress: 8, lastActive: "3 days ago", status: "At risk",
    mentorSessions: [], notes: ["New signup, hasn't completed onboarding tasks"], aiInteractions: [],
    recentActivity: ["Signed up", "Viewed Growth Paths page"] },
];

export interface AdminPath {
  id: string;
  title: string;
  category: string;
  learners: number;
  completion: number;
  mentors: number;
  updated: string;
  trend: "up" | "down" | "flat";
}

export const ADMIN_PATHS: AdminPath[] = [
  { id: "coding",         title: "Coding & Development",   category: "Career & Tech",  learners: 1240, completion: 61, mentors: 4, updated: "2 days ago",  trend: "flat" },
  { id: "ai-ml",          title: "AI & Machine Learning",  category: "Career & Tech",  learners: 860,  completion: 47, mentors: 2, updated: "5 days ago",  trend: "up"   },
  { id: "communication-skills", title: "Communication Skills", category: "Mindset",   learners: 940,  completion: 72, mentors: 2, updated: "1 week ago",  trend: "flat" },
  { id: "meditation",     title: "Meditation",             category: "Mindset",        learners: 510,  completion: 38, mentors: 1, updated: "3 weeks ago", trend: "down" },
  { id: "finance",        title: "Personal Finance",       category: "Personal Life",  learners: 675,  completion: 55, mentors: 1, updated: "4 days ago",  trend: "flat" },
  { id: "gym-training",   title: "Gym & Strength Training",category: "Health & Fitness",learners: 780,  completion: 66, mentors: 1, updated: "6 days ago",  trend: "up"   },
];

export interface AdminMentor {
  id: number;
  name: string;
  initials: string;
  color: string;
  specialty: string;
  experience: string;
  rating: number;
  activeLearners: number;
  responseTime: string;
  earnings: number;
  status: "Active" | "Pending" | "Suspended";
}

export const ADMIN_MENTORS: AdminMentor[] = [
  { id: 1, name: "Sofia Torres",    initials: "ST", color: "#C87A2E", specialty: "Coding",        experience: "6 yrs",  rating: 4.9, activeLearners: 184, responseTime: "3 hrs",  earnings: 4820, status: "Active" },
  { id: 2, name: "Aria Chen",       initials: "AC", color: "#6366F1", specialty: "AI & ML",        experience: "7 yrs",  rating: 4.9, activeLearners: 142, responseTime: "2 hrs",  earnings: 5960, status: "Active" },
  { id: 3, name: "Priya Sharma",    initials: "PS", color: "#C9527A", specialty: "UI/UX Design",   experience: "8 yrs",  rating: 4.9, activeLearners: 210, responseTime: "1 hr",   earnings: 6410, status: "Active" },
  { id: 4, name: "Daniel Park",     initials: "DP", color: "#2E9E9E", specialty: "Finance",        experience: "12 yrs", rating: 4.7, activeLearners: 96,  responseTime: "6 hrs",  earnings: 3120, status: "Active" },
  { id: 5, name: "Kenji Nakamura",  initials: "KN", color: "#8B6BC9", specialty: "Communication",  experience: "11 yrs", rating: 4.9, activeLearners: 158, responseTime: "3 hrs",  earnings: 5280, status: "Active" },
  { id: 6, name: "Jake Morrison",   initials: "JM", color: "#4A7FB5", specialty: "Fitness",        experience: "8 yrs",  rating: 4.8, activeLearners: 133, responseTime: "4 hrs",  earnings: 3640, status: "Active" },
  { id: 7, name: "Marcus Webb",     initials: "MW", color: "#9A6B3F", specialty: "Entrepreneurship",experience: "10 yrs",rating: 4.8, activeLearners: 88,  responseTime: "4 hrs",  earnings: 3980, status: "Pending" },
];

export const SESSIONS = {
  upcoming: [
    { learner: "Priya Nair",  mentor: "Sofia Torres",   time: "Today · 4:00 PM", topic: "API design review" },
    { learner: "Aisha Rahman",mentor: "Kenji Nakamura", time: "Today · 6:30 PM", topic: "Mock interview practice" },
    { learner: "Grace Kim",   mentor: "Marcus Webb",    time: "Tomorrow · 11:00 AM", topic: "Pitch deck feedback" },
  ],
  live: [
    { learner: "Daniel Osei", mentor: "Jake Morrison",  time: "Started 12 min ago", topic: "Progressive overload plan" },
  ],
  completed: [
    { learner: "Tom Bennett", mentor: "Daniel Park",    time: "2 weeks ago", topic: "Building a first budget" },
    { learner: "Lucas Ferreira", mentor: "Sofia Torres", time: "1 week ago", topic: "Project code review" },
    { learner: "Meera Iyer",  mentor: "Priya Sharma",   time: "3 days ago", topic: "Portfolio critique" },
  ],
};

export const CONTENT = {
  youtube:      [{ title: "Structuring APIs That Scale", category: "Coding", views: "12.4k" }, { title: "Deploying Your First Model", category: "AI & ML", views: "8.1k" }],
  courses:      [{ title: "Full-Stack Fundamentals", category: "Coding", enrolled: 640 }, { title: "Public Speaking Foundations", category: "Communication", enrolled: 410 }],
  events:       [{ title: "Live Q&A: Breaking Into Tech", category: "Coding", date: "Aug 12" }],
  scholarships: [{ title: "Women in Tech Scholarship", category: "Coding", deadline: "Sep 1" }],
  challenges:   [{ title: "7-Day Consistency Challenge", category: "Mindset", participants: 320 }],
  articles:     [{ title: "Why Most ML Tutorials Fall Short", category: "AI & ML", reads: "3.2k" }],
};

export const AI_ASSISTANT = {
  mostAsked: [
    "How do I structure a REST API?",
    "What should I learn after JavaScript basics?",
    "How much protein do I need daily?",
    "What's the difference between UX and UI?",
  ],
  failedAnswers: [
    "Can you review my actual resume file?",
    "What's the exact salary I'll get after this path?",
  ],
  suggestedImprovements: [
    "Add a resume-upload flow so the AI can give specific feedback",
    "Expand the Finance path's tax-planning content — frequently asked, thinly covered",
  ],
  topMentorRecs: [
    { mentor: "Sofia Torres", count: 312 },
    { mentor: "Priya Sharma", count: 274 },
    { mentor: "Kenji Nakamura", count: 198 },
  ],
  popularGoals: ["Coding & Development", "AI & Machine Learning", "Communication Skills", "Gym & Strength Training"],
};

export const MODERATION = {
  reportedContent:  [{ title: "\u201cQuick riches\u201d finance article (external link)", reason: "Misleading claims", reported: "2 days ago" }],
  reportedMentors:  [{ name: "Unverified applicant — R. Kapoor", reason: "Credentials could not be verified", reported: "5 days ago" }],
  reportedMessages: [{ from: "Learner \u2192 Mentor", reason: "Inappropriate language", reported: "1 day ago" }],
  blockedUsers:     [{ name: "user_29841", reason: "Repeated spam in mentor messages", blocked: "1 week ago" }],
};

export const RECENT_ACTIVITY = [
  { text: "New mentor approved — Elena Vasquez (Public Speaking)", time: "18 min ago" },
  { text: "New learner joined — Noah Williams", time: "1 hr ago" },
  { text: "Session completed — Daniel Osei & Jake Morrison", time: "2 hrs ago" },
  { text: "Path published — \u201cIntro to Cloud Computing\u201d", time: "Yesterday" },
  { text: "Resource reported — external finance article flagged", time: "2 days ago" },
];

export const NEEDS_ATTENTION = [
  { kind: "low-completion" as const, title: "Meditation", detail: "Completion rate has dropped to 38% — the lowest on the platform.", cta: "Review path" },
  { kind: "trending" as const,       title: "AI & Machine Learning", detail: "Enrollments up 34% this month — consider adding a second mentor.", cta: "View path" },
  { kind: "demand" as const,         title: "UI/UX Design mentors", detail: "Wait time for a UI/UX mentor session is now 4.2 days — highest demand category.", cta: "Review mentors" },
];

export const OVERVIEW_METRICS = [
  { label: "Active learners",        value: "4,812", trend: "+6.2% this week" },
  { label: "Active mentor sessions", value: "37",    trend: "12 live right now" },
  { label: "Path completion rate",   value: "58%",   trend: "+3pts vs last month" },
  { label: "Weekly momentum",        value: "+18%",  trend: "vs. last week" },
];
