import { supabase } from "../../lib/supabase";
import type { UserProfile } from "../../types";

export interface MentorProfileData {
  id: string;
  legacyId?: number;
  name: string;
  email: string;
  avatarUrl?: string;
  headline: string;
  company: string;
  category: string;
  yearsExperience: number;
  rating: number;
  totalReviews: number;
  skills: string[];
  bio: string;
  mentoringApproach?: string;
  mentoringStyle?: string[];
  sessionTypes?: string[];
  targetLevel?: string;
  areasCanHelp?: string[];
  languages?: string[];
  location?: string;
  availability: string;
  acceptingMentees: boolean;
  offersFreeIntro: boolean;
  price: string;
  sessionDuration: string;
  linkedinUrl?: string;
  mentorSince?: string;
}

export interface MenteeMilestone {
  id: string;
  title: string;
  completed: boolean;
  current?: boolean;
}

export interface MenteeGoal {
  id: string;
  title: string;
  completed: boolean;
  targetDate?: string;
}

export interface MenteeFeedback {
  id: string;
  date: string;
  content: string;
  focus: string;
  rating?: number;
}

export interface MenteeResource {
  id: string;
  title: string;
  type: "video" | "doc" | "project" | "article";
  url: string;
  channelOrAuthor?: string;
  addedAt: string;
}

export interface MenteeTimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "session" | "milestone" | "note" | "feedback";
}

export interface Mentee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  careerGoal?: string;
  learningLanguage?: string;
  pathTitle: string;
  pathId: string;
  progressPercent: number;
  currentMilestone: string;
  nextMilestone: string;
  allMilestones: MenteeMilestone[];
  goals: MenteeGoal[];
  totalSessions: number;
  totalHours: number;
  nextSessionDate?: string;
  lastActive?: string;
  status: "Active" | "Completed" | "Pending";
  needsAttention?: boolean;
  attentionReason?: string;
  notes?: string;
  feedbackHistory: MenteeFeedback[];
  recommendedResources: MenteeResource[];
  timeline: MenteeTimelineEvent[];
}

export interface MentorSession {
  id: string;
  menteeId: string;
  menteeName: string;
  menteeEmail?: string;
  menteeAvatar?: string;
  sessionType: string;
  duration: string;
  price: string;
  bookingDate: string;
  bookingTime: string;
  status: "Booked" | "Completed" | "Cancelled";
  meetingUrl?: string;
  notes?: string;
  prepNotes?: string;
  discussionRecap?: string;
  actionItems?: string[];
  needsFollowup?: boolean;
  createdAt: string;
}

export interface MentorshipRequest {
  id: string;
  menteeName: string;
  menteeEmail: string;
  avatarUrl?: string;
  targetGoal: string;
  message: string;
  preferredTimes: string[];
  receivedAt: string;
  status: "Pending" | "Accepted" | "Declined";
}

export interface ActivityFeedItem {
  id: string;
  menteeName: string;
  type: "milestone_completed" | "project_submitted" | "session_booked" | "review_left" | "question_asked";
  title: string;
  detail: string;
  timeAgo: string;
}

export interface MentorReview {
  id: string;
  menteeName: string;
  rating: number;
  comment: string;
  date: string;
  sessionType: string;
}

export interface MentorEarnings {
  totalEarned: number;
  pendingPayout: number;
  completedSessionsCount: number;
  avgPerSession: number;
  currency: string;
  payoutMethod: string;
  history: {
    id: string;
    date: string;
    sessionTitle: string;
    menteeName: string;
    amount: number;
    status: "Paid" | "Pending";
  }[];
}

export interface WeeklyScheduleDay {
  day: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";
  enabled: boolean;
  startTime: string;
  endTime: string;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
}

/* ─── Local Storage Keys ─────────────────────────────────────────────────── */

const STORAGE_NOTES_KEY = "starfix:mentor_notes";
const STORAGE_SCHEDULE_KEY = "starfix:mentor_schedule";
const STORAGE_BLOCKED_DATES_KEY = "starfix:mentor_blocked_dates";
const STORAGE_REQUESTS_KEY = "starfix:mentor_requests";
const STORAGE_EXTRA_MENTEES_KEY = "starfix:mentor_mentees_extra";
const STORAGE_SESSIONS_KEY = "starfix:mentor_sessions_extra";
const STORAGE_PROFILE_EXTRAS_KEY = "starfix:mentor_profile_extras";
const STORAGE_MENTOR_SINCE_KEY = "starfix:mentor_since";

/* ─── Mentor-specific profile fields not (yet) columns in the `mentors`
   table — mentoring style, session types, target level, "areas I can
   help with". Persisted locally so editing them is fully functional and
   durable across refreshes without risking a write against a DB column
   that may not exist. Merged onto MentorProfileData on every load. ──── */

export interface MentorProfileExtras {
  mentoringStyle: string[];
  sessionTypes: string[];
  targetLevel: string;
  areasCanHelp: string[];
}

const DEFAULT_PROFILE_EXTRAS: MentorProfileExtras = {
  mentoringStyle: [],
  sessionTypes: [],
  targetLevel: "",
  areasCanHelp: [],
};

export function getStoredProfileExtras(): MentorProfileExtras {
  if (typeof window === "undefined") return DEFAULT_PROFILE_EXTRAS;
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_EXTRAS_KEY);
    return raw ? { ...DEFAULT_PROFILE_EXTRAS, ...JSON.parse(raw) } : DEFAULT_PROFILE_EXTRAS;
  } catch {
    return DEFAULT_PROFILE_EXTRAS;
  }
}

export function saveProfileExtras(extras: Partial<MentorProfileExtras>): void {
  if (typeof window === "undefined") return;
  try {
    const merged = { ...getStoredProfileExtras(), ...extras };
    localStorage.setItem(STORAGE_PROFILE_EXTRAS_KEY, JSON.stringify(merged));
  } catch {}
}

/* "Mentoring Since" — genuinely derived from the first time this browser
   ever loaded Mentor Mode, not an invented number. Set once, read forever
   after. If a real backend column (mentor_since / created_at) is ever
   present on the mentors row, that value wins instead — see
   fetchMentorData, which merges DB data over this local fallback. */
export function getOrInitMentorSince(): string {
  if (typeof window === "undefined") return new Date().toISOString();
  try {
    const existing = localStorage.getItem(STORAGE_MENTOR_SINCE_KEY);
    if (existing) return existing;
    const now = new Date().toISOString();
    localStorage.setItem(STORAGE_MENTOR_SINCE_KEY, now);
    return now;
  } catch {
    return new Date().toISOString();
  }
}

/* ─── Mentees Local Persistence ─────────────────────────────────────────── */

export function getStoredMentees(): Mentee[] {
  if (typeof window === "undefined") return SAMPLE_MENTEES;
  try {
    const raw = localStorage.getItem(STORAGE_EXTRA_MENTEES_KEY);
    if (!raw) return SAMPLE_MENTEES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return SAMPLE_MENTEES;
  } catch {
    return SAMPLE_MENTEES;
  }
}

export function saveStoredMentees(mentees: Mentee[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_EXTRA_MENTEES_KEY, JSON.stringify(mentees));
  } catch {}
}

/* ─── Sessions Local Persistence ─────────────────────────────────────────── */

export function getStoredSessions(): MentorSession[] {
  if (typeof window === "undefined") return SAMPLE_SESSIONS;
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
    if (!raw) return SAMPLE_SESSIONS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return SAMPLE_SESSIONS;
  } catch {
    return SAMPLE_SESSIONS;
  }
}

export function saveStoredSessions(sessions: MentorSession[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {}
}

/* ─── Private Notes Storage ─────────────────────────────────────────────── */

function getStoredNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_NOTES_KEY) || "{}");
  } catch {
    return {};
  }
}

export function saveMenteeNotes(menteeId: string, notes: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getStoredNotes();
    existing[menteeId] = notes;
    localStorage.setItem(STORAGE_NOTES_KEY, JSON.stringify(existing));
  } catch {}
}

export function getMenteeNotes(menteeId: string): string {
  return getStoredNotes()[menteeId] || "";
}

/* ─── Weekly Schedule & Blocked Dates ─────────────────────────────────────── */

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleDay[] = [
  { day: "Monday", enabled: true, startTime: "10:00 AM", endTime: "6:00 PM" },
  { day: "Tuesday", enabled: true, startTime: "10:00 AM", endTime: "6:00 PM" },
  { day: "Wednesday", enabled: true, startTime: "10:00 AM", endTime: "6:00 PM" },
  { day: "Thursday", enabled: true, startTime: "10:00 AM", endTime: "6:00 PM" },
  { day: "Friday", enabled: true, startTime: "10:00 AM", endTime: "4:00 PM" },
  { day: "Saturday", enabled: true, startTime: "11:00 AM", endTime: "3:00 PM" },
  { day: "Sunday", enabled: false, startTime: "11:00 AM", endTime: "2:00 PM" },
];

export function getStoredWeeklySchedule(): WeeklyScheduleDay[] {
  if (typeof window === "undefined") return DEFAULT_WEEKLY_SCHEDULE;
  try {
    const raw = localStorage.getItem(STORAGE_SCHEDULE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_WEEKLY_SCHEDULE;
  } catch {
    return DEFAULT_WEEKLY_SCHEDULE;
  }
}

export function saveWeeklySchedule(schedule: WeeklyScheduleDay[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_SCHEDULE_KEY, JSON.stringify(schedule));
  } catch {}
}

export const DEFAULT_BLOCKED_DATES: BlockedDate[] = [
  { id: "b1", date: "2026-10-02", reason: "National Holiday" },
  { id: "b2", date: "2026-10-18", reason: "Attending Tech Summit" },
];

export function getStoredBlockedDates(): BlockedDate[] {
  if (typeof window === "undefined") return DEFAULT_BLOCKED_DATES;
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKED_DATES_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_BLOCKED_DATES;
  } catch {
    return DEFAULT_BLOCKED_DATES;
  }
}

export function saveBlockedDates(dates: BlockedDate[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_BLOCKED_DATES_KEY, JSON.stringify(dates));
  } catch {}
}

/* ─── Default Sample Data ─────────────────────────────────────────────────── */

export function getDefaultMentorData(userProfile?: UserProfile | null): MentorProfileData {
  const extras = getStoredProfileExtras();
  return {
    id: "mentor_current",
    name: userProfile?.name || "Kunal Valecha",
    email: userProfile?.email || "mentor@starfix.com",
    avatarUrl: userProfile?.avatarDataUrl || undefined,
    headline: userProfile?.careerGoal || "Senior Software Engineer & Tech Mentor",
    company: "Starfix Partner",
    category: "Coding",
    yearsExperience: 8,
    rating: 5.0,
    totalReviews: 24,
    skills: ["System Design", "Distributed Systems", "TypeScript", "React", "Cloud Architecture"],
    bio: "Passionate about mentoring high-potential engineers through complex distributed system design, high-scale API architecture, and senior career placement.",
    mentoringApproach: "I focus on first-principles system thinking, pragmatic code reviews, and structured mock interviews with actionable written feedback.",
    mentoringStyle: extras.mentoringStyle,
    sessionTypes: extras.sessionTypes,
    targetLevel: extras.targetLevel,
    areasCanHelp: extras.areasCanHelp,
    languages: ["English", "Hindi"],
    location: "Bangalore, India",
    availability: "Available",
    acceptingMentees: true,
    offersFreeIntro: true,
    price: "₹2,500",
    sessionDuration: "45 min",
    mentorSince: getOrInitMentorSince(),
  };
}

export const SAMPLE_MENTEES: Mentee[] = [
  {
    id: "mentee_1",
    name: "Aarav Sharma",
    email: "aarav.s@gmail.com",
    careerGoal: "Senior Full-Stack Developer",
    learningLanguage: "TypeScript & React",
    pathTitle: "Full-Stack Software Architecture",
    pathId: "coding",
    progressPercent: 68,
    currentMilestone: "Module 3: Microservice APIs & Schema Design",
    nextMilestone: "Module 4: Distributed Caching & Sharding",
    allMilestones: [
      { id: "m1", title: "Module 1: Advanced TypeScript & Design Patterns", completed: true },
      { id: "m2", title: "Module 2: Relational DB Modeling & Query Tuning", completed: true },
      { id: "m3", title: "Module 3: Microservice APIs & Schema Design", completed: false, current: true },
      { id: "m4", title: "Module 4: Distributed Caching & Sharding", completed: false },
      { id: "m5", title: "Module 5: End-to-End System Design Mock", completed: false },
    ],
    goals: [
      { id: "g1", title: "Complete GraphQL Federation Schema", completed: true, targetDate: "Sep 15" },
      { id: "g2", title: "Implement Redis Cache Layer with Write-Through Pattern", completed: false, targetDate: "Sep 26" },
      { id: "g3", title: "Mock Interview: Design a Scalable Notification System", completed: false, targetDate: "Oct 5" },
    ],
    totalSessions: 4,
    totalHours: 3.5,
    nextSessionDate: "Tomorrow, 5:00 PM",
    lastActive: "2 hours ago",
    status: "Active",
    needsAttention: true,
    attentionReason: "Submitted API schema for review before tomorrow's call",
    notes: "Strong frontend intuition. Needs extra focus on database indexing and connection pool sizing.",
    feedbackHistory: [
      {
        id: "fb_1",
        date: "Sep 12, 2026",
        content: "Excellent implementation of the optimistic UI updates in React. Remember to handle edge network timeouts gracefully.",
        focus: "Frontend Architecture",
        rating: 5,
      },
      {
        id: "fb_2",
        date: "Aug 28, 2026",
        content: "Good progress on SQL normalization. Next step is understanding B-tree vs Hash index tradeoffs.",
        focus: "Database Design",
        rating: 4,
      },
    ],
    recommendedResources: [
      {
        id: "res_1",
        title: "Structuring Scalable APIs & Microservices",
        type: "video",
        url: "https://www.youtube.com/watch?v=api_scale",
        channelOrAuthor: "Hitesh Choudhary",
        addedAt: "Sep 10, 2026",
      },
      {
        id: "res_2",
        title: "Designing Data-Intensive Applications (DDIA Summary)",
        type: "doc",
        url: "https://starfix.app/resources/ddia-summary",
        channelOrAuthor: "Martin Kleppmann",
        addedAt: "Aug 20, 2026",
      },
    ],
    timeline: [
      { id: "t1", date: "Sep 18", title: "Milestone 2 Completed", description: "Successfully finished DB Query Tuning project.", type: "milestone" },
      { id: "t2", date: "Sep 12", title: "1:1 Architecture Session", description: "Discussed REST vs GraphQL federation.", type: "session" },
      { id: "t3", date: "Aug 28", title: "Roadmap Alignment", description: "Established Q4 goal of reaching Senior Full-Stack role.", type: "note" },
    ],
  },
  {
    id: "mentee_2",
    name: "Priya Patel",
    email: "priya.p@outlook.com",
    careerGoal: "AI & Machine Learning Engineer",
    learningLanguage: "Python & PyTorch",
    pathTitle: "AI & Machine Learning Engineering",
    pathId: "ai-ml",
    progressPercent: 52,
    currentMilestone: "Module 3: Deep Neural Networks & Fine-Tuning",
    nextMilestone: "Module 4: Model Quantization & TensorRT",
    allMilestones: [
      { id: "m1", title: "Module 1: Linear Algebra & Calculus for ML", completed: true },
      { id: "m2", title: "Module 2: Classical Machine Learning with Scikit", completed: true },
      { id: "m3", title: "Module 3: Deep Neural Networks & Fine-Tuning", completed: false, current: true },
      { id: "m4", title: "Module 4: Model Quantization & TensorRT", completed: false },
      { id: "m5", title: "Module 5: Production LLM Deployment", completed: false },
    ],
    goals: [
      { id: "g1", title: "Implement Multi-Head Attention from scratch", completed: true, targetDate: "Sep 10" },
      { id: "g2", title: "Fine-tune Llama 3 8B with QLoRA on custom dataset", completed: false, targetDate: "Sep 28" },
    ],
    totalSessions: 3,
    totalHours: 2.5,
    nextSessionDate: "Thursday, 6:30 PM",
    lastActive: "Yesterday",
    status: "Active",
    needsAttention: false,
    notes: "Mathematical foundations are solid. Needs hands-on production deployment experience with Triton inference server.",
    feedbackHistory: [
      {
        id: "fb_3",
        date: "Sep 5, 2026",
        content: "Clear understanding of attention mechanisms. Keep code clean and modular for the training pipeline.",
        focus: "PyTorch & Transformers",
        rating: 5,
      },
    ],
    recommendedResources: [
      {
        id: "res_3",
        title: "Deploying PyTorch Models with Docker & FastApi",
        type: "video",
        url: "https://www.youtube.com/watch?v=pytorch_deploy",
        channelOrAuthor: "Andrew Ng",
        addedAt: "Sep 2, 2026",
      },
    ],
    timeline: [
      { id: "t4", date: "Sep 14", title: "Completed Transformer Lab", description: "Built attention layer in PyTorch.", type: "milestone" },
      { id: "t5", date: "Sep 5", title: "1:1 PyTorch Session", description: "Debugged loss plateau issue in gradient descent.", type: "session" },
    ],
  },
  {
    id: "mentee_3",
    name: "Rohan Verma",
    email: "rohan.v@tech.io",
    careerGoal: "Cloud Architect",
    learningLanguage: "Docker & Kubernetes",
    pathTitle: "Cloud & DevOps Architecture",
    pathId: "cloud",
    progressPercent: 100,
    currentMilestone: "Module 5: Multi-Region Kubernetes Failover",
    nextMilestone: "Course Completed 🎉",
    allMilestones: [
      { id: "m1", title: "Module 1: Linux CLI & Containerization", completed: true },
      { id: "m2", title: "Module 2: CI/CD Pipelines & GitHub Actions", completed: true },
      { id: "m3", title: "Module 3: Terraform & Infrastructure as Code", completed: true },
      { id: "m4", title: "Module 4: Kubernetes Cluster Management", completed: true },
      { id: "m5", title: "Module 5: Multi-Region Kubernetes Failover", completed: true },
    ],
    goals: [
      { id: "g1", title: "Achieve CKA (Certified Kubernetes Admin)", completed: true, targetDate: "Sep 1" },
      { id: "g2", title: "Pass Senior Cloud Architect Interview", completed: true, targetDate: "Sep 15" },
    ],
    totalSessions: 6,
    totalHours: 5.0,
    nextSessionDate: undefined,
    lastActive: "3 days ago",
    status: "Completed",
    needsAttention: false,
    notes: "Successfully cracked Senior Cloud role offer with 40% salary hike. High recommendation.",
    feedbackHistory: [
      {
        id: "fb_4",
        date: "Sep 8, 2026",
        content: "Outstanding performance during the mock incident management drill. Ready for senior responsibility.",
        focus: "SRE & Resilience",
        rating: 5,
      },
    ],
    recommendedResources: [],
    timeline: [
      { id: "t6", date: "Sep 15", title: "Offer Accepted 🎉", description: "Accepted offer at leading global fintech.", type: "milestone" },
      { id: "t7", date: "Sep 8", title: "Final Mock Interview", description: "Simulated high-load incident triage.", type: "session" },
    ],
  },
  {
    id: "mentee_4",
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    careerGoal: "Product Designer & Frontend Dev",
    learningLanguage: "Design Systems & Figma",
    pathTitle: "UI/UX & Product Design Systems",
    pathId: "uiux",
    progressPercent: 24,
    currentMilestone: "Module 2: Design Token Systems & Accessibility",
    nextMilestone: "Module 3: Prototyping Complex Micro-Interactions",
    allMilestones: [
      { id: "m1", title: "Module 1: Typography, Spacing & Layout Rhythm", completed: true },
      { id: "m2", title: "Module 2: Design Token Systems & Accessibility", completed: false, current: true },
      { id: "m3", title: "Module 3: Prototyping Complex Micro-Interactions", completed: false },
      { id: "m4", title: "Module 4: User Testing & Research Syntheses", completed: false },
      { id: "m5", title: "Module 5: Production Portfolio Case Study", completed: false },
    ],
    goals: [
      { id: "g1", title: "Build Figma Variable Color Palette (WCAG AAA)", completed: false, targetDate: "Sep 30" },
    ],
    totalSessions: 1,
    totalHours: 0.75,
    nextSessionDate: "Saturday, 11:00 AM",
    lastActive: "Today",
    status: "Pending",
    needsAttention: true,
    attentionReason: "Free intro session booked. Review portfolio deck prior to call.",
    notes: "Transitioning from graphic design to product design. Very creative.",
    feedbackHistory: [],
    recommendedResources: [],
    timeline: [
      { id: "t8", date: "Sep 20", title: "Intro Session Booked", description: "Scheduled roadmap alignment call.", type: "session" },
    ],
  },
];

export const SAMPLE_SESSIONS: MentorSession[] = [
  {
    id: "sess_101",
    menteeId: "mentee_1",
    menteeName: "Aarav Sharma",
    menteeEmail: "aarav.s@gmail.com",
    sessionType: "1:1 System Architecture Deep Dive",
    duration: "45 min",
    price: "₹2,500",
    bookingDate: "Tomorrow",
    bookingTime: "5:00 PM",
    status: "Booked",
    meetingUrl: "https://meet.jit.si/starfix-session-101-aarav",
    prepNotes: "Review GraphQL federation schema and Redis cache invalidation strategies.",
    actionItems: ["Review Redis cluster failover", "Draft API rate limiting proposal"],
    needsFollowup: false,
    notes: "Review microservice decomposition and distributed caching strategy.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sess_102",
    menteeId: "mentee_4",
    menteeName: "Ananya Iyer",
    menteeEmail: "ananya.iyer@gmail.com",
    sessionType: "Free Intro & Roadmap Alignment",
    duration: "30 min",
    price: "Free",
    bookingDate: "Saturday",
    bookingTime: "11:00 AM",
    status: "Booked",
    meetingUrl: "https://meet.jit.si/starfix-session-102-ananya",
    prepNotes: "Review Ananya's portfolio case studies and current Figma prototypes.",
    needsFollowup: false,
    notes: "Goal setting and timeline review for Q4 career transition.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sess_103",
    menteeId: "mentee_2",
    menteeName: "Priya Patel",
    menteeEmail: "priya.p@outlook.com",
    sessionType: "Model Deployment & API Scaling",
    duration: "60 min",
    price: "₹3,200",
    bookingDate: "Thursday",
    bookingTime: "6:30 PM",
    status: "Booked",
    meetingUrl: "https://meet.jit.si/starfix-session-103-priya",
    prepNotes: "Inspect PyTorch container GPU memory allocation and Dockerfile.",
    needsFollowup: false,
    notes: "Troubleshoot PyTorch container memory leak.",
    createdAt: new Date().toISOString(),
  },
  {
    id: "sess_104",
    menteeId: "mentee_3",
    menteeName: "Rohan Verma",
    menteeEmail: "rohan.v@tech.io",
    sessionType: "System Design Mock Interview",
    duration: "60 min",
    price: "₹3,500",
    bookingDate: "Last Week",
    bookingTime: "4:00 PM",
    status: "Completed",
    meetingUrl: "https://meet.jit.si/starfix-session-104-rohan",
    discussionRecap: "Conducted simulated system design interview on designing a global video streaming platform. Evaluated CDN routing, edge caching, and adaptive bitrate transcoding.",
    actionItems: ["Rohan to review Kafka consumer lag monitoring", "Submit written evaluation"],
    needsFollowup: true,
    notes: "Strong answers on rate limiting and database sharding. Recommended for hire.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

export const SAMPLE_REQUESTS: MentorshipRequest[] = [
  {
    id: "req_1",
    menteeName: "Vikram Malhotra",
    menteeEmail: "vikram.m@engineer.com",
    targetGoal: "Preparing for L5 Senior Backend Engineer rounds at Uber",
    message: "Hi Kunal! I admire your work in distributed systems. I have an onsite interview in 3 weeks and need focused guidance on high-throughput microservice architecture.",
    preferredTimes: ["Friday, 6:00 PM", "Saturday, 4:00 PM"],
    receivedAt: "Today, 1:40 PM",
    status: "Pending",
  },
  {
    id: "req_2",
    menteeName: "Meera Sen",
    menteeEmail: "meera.sen@design.org",
    targetGoal: "Transitioning into Full-Stack Development from QA",
    message: "I completed the JavaScript core track and would love your mentorship to build my first production-grade full-stack project.",
    preferredTimes: ["Sunday, 11:00 AM"],
    receivedAt: "Yesterday",
    status: "Pending",
  },
];

export const SAMPLE_ACTIVITY_FEED: ActivityFeedItem[] = [
  {
    id: "act_1",
    menteeName: "Aarav Sharma",
    type: "milestone_completed",
    title: "Completed Milestone: DB Query Optimization",
    detail: "Passed all SQL index benchmarks and submitted benchmark charts.",
    timeAgo: "2 hours ago",
  },
  {
    id: "act_2",
    menteeName: "Priya Patel",
    type: "project_submitted",
    title: "Submitted PyTorch Model Benchmark",
    detail: "Trained transformer model reached 92% validation accuracy.",
    timeAgo: "5 hours ago",
  },
  {
    id: "act_3",
    menteeName: "Ananya Iyer",
    type: "session_booked",
    title: "Booked Intro Session",
    detail: "Free Intro & Roadmap Alignment scheduled for Saturday 11:00 AM.",
    timeAgo: "1 day ago",
  },
  {
    id: "act_4",
    menteeName: "Rohan Verma",
    type: "review_left",
    title: "Left a 5-Star Review",
    detail: "“Incredible depth of practical knowledge. The mock interview prepared me for every single curveball.”",
    timeAgo: "3 days ago",
  },
];

export const SAMPLE_REVIEWS: MentorReview[] = [
  {
    id: "rev_1",
    menteeName: "Rohan Verma",
    rating: 5,
    comment: "Incredible depth of practical knowledge. The mock interview prepared me for every single curveball the interviewer threw.",
    date: "1 week ago",
    sessionType: "System Design Mock Interview",
  },
  {
    id: "rev_2",
    menteeName: "Aarav Sharma",
    rating: 5,
    comment: "Clear, concise, and gave actionable architectural guidance. Helped me refactor our legacy monolith safely.",
    date: "2 weeks ago",
    sessionType: "1:1 Architecture Review",
  },
  {
    id: "rev_3",
    menteeName: "Sneha Reddy",
    rating: 5,
    comment: "Best mentor on Starfix hands down. Patient, encouraging, and provides great follow-up resources.",
    date: "1 month ago",
    sessionType: "Career Strategy & Placement",
  },
];

export const SAMPLE_EARNINGS: MentorEarnings = {
  totalEarned: 48500,
  pendingPayout: 9200,
  completedSessionsCount: 19,
  avgPerSession: 2550,
  currency: "INR",
  payoutMethod: "Direct Bank Transfer (HDFC Bank •••• 4892)",
  history: [
    {
      id: "pay_1",
      date: "Sep 18, 2026",
      sessionTitle: "System Design Mock Interview",
      menteeName: "Rohan Verma",
      amount: 3500,
      status: "Paid",
    },
    {
      id: "pay_2",
      date: "Sep 14, 2026",
      sessionTitle: "Microservice Scaling Session",
      menteeName: "Aarav Sharma",
      amount: 2500,
      status: "Paid",
    },
    {
      id: "pay_3",
      date: "Sep 10, 2026",
      sessionTitle: "Career Strategy Deep Dive",
      menteeName: "Kavita Nair",
      amount: 3200,
      status: "Paid",
    },
    {
      id: "pay_4",
      date: "Upcoming (Sep 25)",
      sessionTitle: "Pending Platform Payout",
      menteeName: "Platform Balance",
      amount: 9200,
      status: "Pending",
    },
  ],
};

/* ─── Mentorship Requests Persistence ─────────────────────────────────────── */

export function getStoredRequests(): MentorshipRequest[] {
  if (typeof window === "undefined") return SAMPLE_REQUESTS;
  try {
    const raw = localStorage.getItem(STORAGE_REQUESTS_KEY);
    return raw ? JSON.parse(raw) : SAMPLE_REQUESTS;
  } catch {
    return SAMPLE_REQUESTS;
  }
}

export function updateRequestStatus(
  requestId: string,
  newStatus: "Accepted" | "Declined"
): MentorshipRequest[] {
  const list = getStoredRequests().map((r) =>
    r.id === requestId ? { ...r, status: newStatus } : r
  );
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_REQUESTS_KEY, JSON.stringify(list));
    } catch {}
  }
  return list;
}

/* ─── Remote Data Loading & Synchronization ───────────────────────────────── */

export async function fetchMentorData(\n  _userId: string,\n  userProfile?: UserProfile | null\n): Promise<{\n  mentor: MentorProfileData;\n  mentees: Mentee[];\n  sessions: MentorSession[];\n  requests: MentorshipRequest[];\n  activityFeed: ActivityFeedItem[];\n  reviews: MentorReview[];\n  earnings: MentorEarnings;\n}> {\n  const fallback = getDefaultMentorData(userProfile);\n  let mentorData = fallback;\n  let menteesList: Mentee[] = [];\n  let sessionsList: MentorSession[] = [];\n  let reviewsList: MentorReview[] = [];\n  let earningsData: MentorEarnings = { totalEarned: 0, pendingPayout: 0, completedSessionsCount: 0, avgPerSession: 0, currency: "INR", payoutMethod: "Not configured", history: [] };\n  try {\n    const authResult = await supabase.auth.getUser();\n    const authId = authResult.data.user?.id;\n    const email = authResult.data.user?.email || userProfile?.email || "";\n    if (!authId && !email) throw new Error("No authenticated mentor.");\n    let mentorRow: any = null;\n    if (authId) mentorRow = (await supabase.from("mentors").select("*").eq("profile_id", authId).maybeSingle()).data;\n    if (!mentorRow && email) mentorRow = (await supabase.from("mentors").select("*").eq("email", email).maybeSingle()).data;\n    if (!mentorRow) return { mentor: mentorData, mentees: [], sessions: [], requests: [], activityFeed: [], reviews: [], earnings: earningsData };\n    const extras = getStoredProfileExtras();\n    mentorData = {\n      id: mentorRow.id, legacyId: mentorRow.legacy_id ?? undefined, name: mentorRow.name || fallback.name, email: mentorRow.email || email,\n      avatarUrl: mentorRow.avatar_url || fallback.avatarUrl, headline: mentorRow.headline || fallback.headline, company: mentorRow.company || fallback.company,\n      category: mentorRow.category || fallback.category, yearsExperience: Number(mentorRow.years_experience) || 0, rating: Number(mentorRow.rating) || 0,\n      totalReviews: Number(mentorRow.total_reviews) || 0, skills: Array.isArray(mentorRow.skills) ? mentorRow.skills : [], bio: mentorRow.bio || "",\n      mentoringApproach: mentorRow.mentoring_approach || "", mentoringStyle: extras.mentoringStyle, sessionTypes: extras.sessionTypes,\n      targetLevel: extras.targetLevel, areasCanHelp: extras.areasCanHelp, languages: Array.isArray(mentorRow.languages) ? mentorRow.languages : [],\n      location: mentorRow.location || "", availability: mentorRow.availability || "Available", acceptingMentees: mentorRow.availability !== "Paused",\n      offersFreeIntro: !!mentorRow.offers_free_intro, price: mentorRow.price || "₹0", sessionDuration: "45 min",\n      linkedinUrl: mentorRow.linkedin_url || undefined, mentorSince: mentorRow.mentor_since || mentorRow.created_at || undefined,\n    };\n    const filter = mentorRow.legacy_id ? "mentor_id.eq." + mentorRow.id + ",mentor_num.eq." + mentorRow.legacy_id : "mentor_id.eq." + mentorRow.id;\n    const bookings = (await supabase.from("bookings").select("id,student_id,mentor_id,mentor_num,session_type,duration,price,amount,currency,booking_date,booking_time,scheduled_start,scheduled_end,status,notes,created_at").or(filter).order("scheduled_start", { ascending: true, nullsFirst: false })).data || [];\n    const studentIds = [...new Set(bookings.map((b: any) => b.student_id).filter(Boolean))];\n    const studentMap = new Map<string, any>();\n    if (studentIds.length) {\n      const profiles = (await supabase.from("profiles").select("id,full_name,email,avatar_url,career_goal,learning_language,updated_at").in("id", studentIds)).data || [];\n      profiles.forEach((p: any) => studentMap.set(p.id, p));\n    }\n    const progressMap = new Map<string, any>();\n    if (studentIds.length) {\n      const progress = (await supabase.from("user_progress").select("user_id,path_id,overall_progress,current_milestone_id,completed_at").in("user_id", studentIds)).data || [];\n      progress.forEach((p: any) => progressMap.set(p.user_id, p));\n    }\n    const pathIds = [...new Set([...progressMap.values()].map((p: any) => p.path_id).filter(Boolean))];\n    const pathMap = new Map<string, any>();\n    if (pathIds.length) { const paths = (await supabase.from("growth_paths").select("id,title,slug").in("id", pathIds)).data || []; paths.forEach((p: any) => pathMap.set(p.id, p)); }\n    const milestoneIds = [...new Set([...progressMap.values()].map((p: any) => p.current_milestone_id).filter(Boolean))];\n    const milestoneMap = new Map<string, string>();\n    if (milestoneIds.length) { const ms = (await supabase.from("milestones").select("id,title").in("id", milestoneIds)).data || []; ms.forEach((m: any) => milestoneMap.set(m.id, m.title)); }\n    const notes = studentIds.length ? ((await supabase.from("mentor_notes").select("student_id,note,updated_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds)).data || []) : [];\n    const noteMap = new Map(notes.map((n: any) => [n.student_id, n]));\n    const goals = studentIds.length ? ((await supabase.from("mentor_goals").select("id,student_id,title,target_date,completed").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];\n    const goalsMap = new Map<string, MenteeGoal[]>();\n    goals.forEach((g: any) => { const a = goalsMap.get(g.student_id) || []; a.push({ id: String(g.id), title: g.title, completed: !!g.completed, targetDate: g.target_date || undefined }); goalsMap.set(g.student_id, a); });\n    const feedback = studentIds.length ? ((await supabase.from("mentor_feedback").select("id,student_id,focus,content,rating,created_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];\n    const feedbackMap = new Map<string, MenteeFeedback[]>();\n    feedback.forEach((fb: any) => { const a = feedbackMap.get(fb.student_id) || []; a.push({ id: String(fb.id), date: new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), content: fb.content, focus: fb.focus || "General", rating: fb.rating ?? undefined }); feedbackMap.set(fb.student_id, a); });\n    const resources = studentIds.length ? ((await supabase.from("shared_resources").select("id,student_id,resource_type,title,url,created_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];\n    const resourceMap = new Map<string, MenteeResource[]>();\n    resources.forEach((r: any) => { const a = resourceMap.get(r.student_id) || []; const type = ["video","doc","project","article"].includes(r.resource_type) ? r.resource_type : "article"; a.push({ id: String(r.id), title: r.title, type: type as any, url: r.url || "", addedAt: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }); resourceMap.set(r.student_id, a); });\n    studentIds.forEach((studentId) => {\n      const p = studentMap.get(studentId) || {}; const progress = progressMap.get(studentId); const path = progress ? pathMap.get(progress.path_id) : null;\n      const sb = bookings.filter((b: any) => b.student_id === studentId);\n      const upcoming = sb.find((b: any) => b.status === "confirmed" && b.scheduled_start && new Date(b.scheduled_start) >= new Date());\n      const completed = sb.filter((b: any) => b.status === "completed").length;\n      const status: Mentee["status"] = upcoming ? "Active" : completed ? "Completed" : "Pending";\n      menteesList.push({ id: studentId, name: p.full_name || p.email?.split("@")[0] || "Student", email: p.email || "", avatarUrl: p.avatar_url || undefined,\n        careerGoal: p.career_goal || "", learningLanguage: p.learning_language || "", pathTitle: path?.title || "Growth Path", pathId: path?.slug || path?.id || "",\n        progressPercent: Math.max(0, Math.min(100, Number(progress?.overall_progress) || 0)), currentMilestone: milestoneMap.get(progress?.current_milestone_id) || "No active milestone",\n        nextMilestone: progress?.completed_at ? "All modules completed 🎉" : milestoneMap.get(progress?.current_milestone_id) || "Continue current milestone", allMilestones: [],\n        goals: goalsMap.get(studentId) || [], totalSessions: sb.length, totalHours: sb.reduce((sum: number, b: any) => sum + ((parseInt(String(b.duration || "").replace(/[^0-9]/g, "")) || 45) / 60), 0),\n        nextSessionDate: upcoming?.scheduled_start ? new Date(upcoming.scheduled_start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : undefined,\n        lastActive: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : undefined, status, needsAttention: false, notes: noteMap.get(studentId)?.note || "",\n        feedbackHistory: feedbackMap.get(studentId) || [], recommendedResources: resourceMap.get(studentId) || [],\n        timeline: sb.slice(0, 10).map((b: any) => ({ id: String(b.id), date: new Date(b.scheduled_start || b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), title: b.session_type || "Mentorship session", description: b.notes || "Mentorship session", type: "session" as const })) });\n    });\n    sessionsList = await fetchMentorSessionsFromDb(mentorRow.id, mentorRow.legacy_id);\n    reviewsList = await fetchMentorReviewsFromDb(mentorRow.id);\n    earningsData = await fetchMentorEarningsFromDb(mentorRow.id);\n    const activityFeed: ActivityFeedItem[] = sessionsList.slice(0, 8).map((s) => ({ id: s.id, menteeName: s.menteeName, type: s.status === "Booked" ? "session_booked" : "milestone_completed", title: s.status === "Booked" ? "Session booked" : "Session completed", detail: s.sessionType, timeAgo: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));\n    return { mentor: mentorData, mentees: menteesList, sessions: sessionsList, requests: [], activityFeed, reviews: reviewsList, earnings: earningsData };\n  } catch (err) {\n    console.warn("Error in fetchMentorData:", err);\n    return { mentor: mentorData, mentees: menteesList, sessions: sessionsList, requests: [], activityFeed: [], reviews: reviewsList, earnings: earningsData };\n  }\n}\n\nexport async function fetchMentorSessionsFromDb(mentorId: string, legacyId?: number): Promise<MentorSession[]> {\n  const filter = legacyId ? "mentor_id.eq." + mentorId + ",mentor_num.eq." + legacyId : "mentor_id.eq." + mentorId;\n  const rows = (await supabase.from("bookings").select("id,student_id,session_type,duration,price,amount,booking_date,booking_time,scheduled_start,status,notes,created_at").or(filter).order("scheduled_start", { ascending: true, nullsFirst: false })).data || [];\n  const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))];\n  const studentMap = new Map<string, any>();\n  if (studentIds.length) { const ps = (await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", studentIds)).data || []; ps.forEach((p: any) => studentMap.set(p.id, p)); }\n  const ids = rows.map((r: any) => r.id);\n  const followups = ids.length ? ((await supabase.from("session_followups").select("booking_id,summary,discussed,next_steps,follow_up_date").in("booking_id", ids)).data || []) : [];\n  const fm = new Map(followups.map((f: any) => [f.booking_id, f]));\n  return rows.map((b: any) => { const p = studentMap.get(b.student_id); const f = fm.get(b.id); const status = b.status === "completed" ? "Completed" : b.status === "cancelled" ? "Cancelled" : "Booked"; return {\n    id: String(b.id), menteeId: b.student_id || "", menteeName: p?.full_name || p?.email?.split("@")[0] || "Student", menteeEmail: p?.email, menteeAvatar: p?.avatar_url,\n    sessionType: b.session_type || "Mentorship Session", duration: b.duration || "45 min", price: b.price || ("₹" + Number(b.amount || 0).toLocaleString("en-IN")),\n    bookingDate: b.booking_date || (b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : "Scheduled"), bookingTime: b.booking_time || "", status, meetingUrl: "https://meet.jit.si/starfix-" + b.id,\n    notes: b.notes || undefined, discussionRecap: f?.summary || undefined, prepNotes: f?.discussed || b.notes || undefined, actionItems: f?.next_steps ? String(f.next_steps).split("\\n").filter(Boolean) : [], needsFollowup: !!f?.follow_up_date, createdAt: b.created_at || new Date().toISOString()\n  }; });\n}\n\nexport async function updateMentorSessionInDb(sessionId: string, patch: Partial<MentorSession>): Promise<boolean> {\n  try {\n    const bookingPatch: Record<string, any> = {}; if (patch.notes !== undefined) bookingPatch.notes = patch.notes; if (patch.prepNotes !== undefined) bookingPatch.notes = patch.prepNotes;\n    if (Object.keys(bookingPatch).length) { const r = await supabase.from("bookings").update(bookingPatch).eq("id", sessionId); if (r.error) return false; }\n    if (patch.discussionRecap !== undefined || patch.actionItems !== undefined || patch.needsFollowup !== undefined || patch.prepNotes !== undefined) {\n      const booking = (await supabase.from("bookings").select("student_id,mentor_id").eq("id", sessionId).maybeSingle()).data; if (!booking?.student_id || !booking?.mentor_id) return false;\n      const payload = { booking_id: sessionId, mentor_id: booking.mentor_id, student_id: booking.student_id, summary: patch.discussionRecap || "", discussed: patch.prepNotes || "", next_steps: Array.isArray(patch.actionItems) ? patch.actionItems.join("\n") : "", follow_up_date: patch.needsFollowup ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) : null };\n      const existing = (await supabase.from("session_followups").select("id").eq("booking_id", sessionId).maybeSingle()).data;\n      const r = existing?.id ? await supabase.from("session_followups").update(payload).eq("id", existing.id) : await supabase.from("session_followups").insert(payload);\n      return !r.error;\n    }\n    return true;\n  } catch { return false; }\n}\n\nexport async function createMentorSessionInDb(mentorId: string, legacyId: number | undefined, session: Omit<MentorSession, "id" | "createdAt">): Promise<MentorSession | null> {\n  const studentId = session.menteeId && session.menteeId.includes("-") ? session.menteeId : null; if (!studentId) return null;\n  const amount = Number(String(session.price || "0").replace(/[^0-9.]/g, "")) || 0;\n  const r = await supabase.from("bookings").insert({ student_id: studentId, mentor_id: mentorId, mentor_num: legacyId ?? null, session_type: session.sessionType, duration: session.duration, price: session.price, amount, currency: "INR", booking_date: session.bookingDate, booking_time: session.bookingTime, notes: session.prepNotes || null, status: "confirmed" }).select("id,created_at").single();\n  if (r.error || !r.data) return null; return { ...session, id: String(r.data.id), createdAt: r.data.created_at };\n}\n\nexport async function saveMentorNoteToDb(mentorId: string, studentId: string, note: string): Promise<boolean> {\n  const existing = (await supabase.from("mentor_notes").select("id").eq("mentor_id", mentorId).eq("student_id", studentId).maybeSingle()).data;\n  const r = existing?.id ? await supabase.from("mentor_notes").update({ note, updated_at: new Date().toISOString() }).eq("id", existing.id) : await supabase.from("mentor_notes").insert({ mentor_id: mentorId, student_id: studentId, note }); return !r.error;\n}\nexport async function saveMentorGoalToDb(mentorId: string, studentId: string, goal: MenteeGoal): Promise<boolean> {\n  const r = await supabase.from("mentor_goals").upsert({ mentor_id: mentorId, student_id: studentId, title: goal.title, target_date: goal.targetDate || null, completed: goal.completed }, { onConflict: "mentor_id,student_id,title" }); return !r.error;\n}\nexport async function updateMentorGoalInDb(mentorId: string, studentId: string, goal: MenteeGoal): Promise<boolean> {\n  const r = await supabase.from("mentor_goals").update({ title: goal.title, target_date: goal.targetDate || null, completed: goal.completed, updated_at: new Date().toISOString() }).eq("id", goal.id).eq("mentor_id", mentorId).eq("student_id", studentId); return !r.error;\n}\nexport async function saveMentorFeedbackToDb(mentorId: string, studentId: string, feedback: MenteeFeedback): Promise<boolean> {\n  const r = await supabase.from("mentor_feedback").insert({ mentor_id: mentorId, student_id: studentId, focus: feedback.focus, content: feedback.content, rating: feedback.rating ?? null }); return !r.error;\n}\nexport async function saveSharedResourceToDb(mentorId: string, studentId: string, resource: MenteeResource, message?: string): Promise<boolean> {\n  const r = await supabase.from("shared_resources").insert({ mentor_id: mentorId, student_id: studentId, resource_type: resource.type, title: resource.title, url: resource.url, message: message || null }); return !r.error;\n}\nexport async function fetchMentorReviewsFromDb(mentorId: string): Promise<MentorReview[]> {\n  const rows = (await supabase.from("reviews").select("id,student_id,rating,review_text,created_at").eq("mentor_id", mentorId).order("created_at", { ascending: false })).data || [];\n  const ids = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))]; const ps = ids.length ? ((await supabase.from("profiles").select("id,full_name").in("id", ids)).data || []) : []; const pm = new Map(ps.map((p: any) => [p.id, p.full_name]));\n  return rows.map((r: any) => ({ id: String(r.id), menteeName: pm.get(r.student_id) || "Student", rating: Number(r.rating) || 0, comment: r.review_text || "", date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), sessionType: "Mentorship Session" }));\n}\nexport async function fetchMentorEarningsFromDb(mentorId: string): Promise<MentorEarnings> {\n  const rows = (await supabase.from("bookings").select("id,student_id,session_type,amount,price,status,created_at").eq("mentor_id", mentorId).order("created_at", { ascending: false })).data || [];\n  const completed = rows.filter((r: any) => r.status === "completed"); const pending = rows.filter((r: any) => r.status === "confirmed");\n  const ids = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))]; const ps = ids.length ? ((await supabase.from("profiles").select("id,full_name").in("id", ids)).data || []) : []; const pm = new Map(ps.map((p: any) => [p.id, p.full_name]));\n  const value = (r: any) => Number(r.amount) || Number(String(r.price || "").replace(/[^0-9.]/g, "")) || 0; const total = completed.reduce((s: number, r: any) => s + value(r), 0); const pend = pending.reduce((s: number, r: any) => s + value(r), 0);\n  return { totalEarned: total, pendingPayout: pend, completedSessionsCount: completed.length, avgPerSession: completed.length ? Math.round(total / completed.length) : 0, currency: "INR", payoutMethod: "Not configured", history: rows.slice(0, 20).map((r: any) => ({ id: String(r.id), date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), sessionTitle: r.session_type || "Mentorship Session", menteeName: pm.get(r.student_id) || "Student", amount: value(r), status: r.status === "completed" ? "Paid" : "Pending" })) };\n}\nexport async function updateMentorProfileInDb(
  mentorId: string,
  patch: Partial<MentorProfileData>
): Promise<boolean> {
  try {
    const dbPatch: Record<string, any> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.headline !== undefined) dbPatch.headline = patch.headline;
    if (patch.company !== undefined) dbPatch.company = patch.company;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.yearsExperience !== undefined) dbPatch.years_experience = patch.yearsExperience;
    if (patch.skills !== undefined) dbPatch.skills = patch.skills;
    if (patch.bio !== undefined) dbPatch.bio = patch.bio;
    if (patch.mentoringApproach !== undefined) dbPatch.mentoring_approach = patch.mentoringApproach;
    if (patch.languages !== undefined) dbPatch.languages = patch.languages;
    if (patch.location !== undefined) dbPatch.location = patch.location;
    if (patch.availability !== undefined) dbPatch.availability = patch.availability;
    if (patch.offersFreeIntro !== undefined) dbPatch.offers_free_intro = patch.offersFreeIntro;
    if (patch.price !== undefined) dbPatch.price = patch.price;
    if (patch.linkedinUrl !== undefined) dbPatch.linkedin_url = patch.linkedinUrl;

    const { error } = await supabase.from("mentors").update(dbPatch).eq("id", mentorId);
    if (error) {
      console.warn("Could not update mentor in Supabase:", error.message);
    }
    return true;
  } catch (e) {
    console.warn("Exception updating mentor in Supabase:", e);
    return true;
  }
}

export async function updateSessionStatusInDb(
  sessionId: string,
  newStatus: "Completed" | "Cancelled" | "Booked"
): Promise<boolean> {
  try {
    const statusMap = {
      Completed: "completed",
      Cancelled: "cancelled",
      Booked: "booked",
    };
    await supabase.from("bookings").update({ status: statusMap[newStatus] }).eq("id", sessionId);
    return true;
  } catch (err) {
    console.warn("Exception updating session status in Supabase:", err);
    return true;
  }
}
