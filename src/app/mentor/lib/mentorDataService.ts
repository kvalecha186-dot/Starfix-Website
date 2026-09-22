import { supabase } from "../../lib/supabase";
import type { UserProfile } from "../../types";

export interface MentorProfileData {
  id: string;
  legacyId?: number;
  name: string;
  email: string;
  headline: string;
  company: string;
  category: string;
  yearsExperience: number;
  rating: number;
  totalReviews: number;
  skills: string[];
  bio: string;
  mentoringApproach?: string;
  languages?: string[];
  location?: string;
  availability: string;
  acceptingMentees: boolean;
  offersFreeIntro: boolean;
  price: string;
  sessionDuration: string;
  linkedinUrl?: string;
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
  return {
    id: "mentor_current",
    name: userProfile?.name || "Kunal Valecha",
    email: userProfile?.email || "mentor@starfix.com",
    headline: userProfile?.careerGoal || "Senior Software Engineer & Tech Mentor",
    company: "Starfix Partner",
    category: "Coding",
    yearsExperience: 8,
    rating: 5.0,
    totalReviews: 24,
    skills: ["System Design", "Distributed Systems", "TypeScript", "React", "Cloud Architecture"],
    bio: "Passionate about mentoring high-potential engineers through complex distributed system design, high-scale API architecture, and senior career placement.",
    mentoringApproach: "I focus on first-principles system thinking, pragmatic code reviews, and structured mock interviews with actionable written feedback.",
    languages: ["English", "Hindi"],
    location: "Bangalore, India",
    availability: "Available",
    acceptingMentees: true,
    offersFreeIntro: true,
    price: "₹2,500",
    sessionDuration: "45 min",
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

export async function fetchMentorData(
  userId: string,
  userProfile?: UserProfile | null
): Promise<{
  mentor: MentorProfileData;
  mentees: Mentee[];
  sessions: MentorSession[];
  requests: MentorshipRequest[];
  activityFeed: ActivityFeedItem[];
  reviews: MentorReview[];
  earnings: MentorEarnings;
}> {
  let mentorData = getDefaultMentorData(userProfile);
  let menteesList: Mentee[] = getStoredMentees();
  let sessionsList: MentorSession[] = getStoredSessions();
  let requestsList: MentorshipRequest[] = getStoredRequests();
  let activityFeed: ActivityFeedItem[] = [...SAMPLE_ACTIVITY_FEED];
  let reviewsList: MentorReview[] = [...SAMPLE_REVIEWS];
  let earningsData: MentorEarnings = { ...SAMPLE_EARNINGS };

  try {
    const { data: mentorRow } = await supabase
      .from("mentors")
      .select("*")
      .or(`profile_id.eq.${userId},email.eq.${userProfile?.email || ""}`)
      .maybeSingle();

    if (mentorRow) {
      mentorData = {
        id: mentorRow.id,
        legacyId: mentorRow.legacy_id ?? undefined,
        name: mentorRow.name || mentorData.name,
        email: mentorRow.email || mentorData.email,
        headline: mentorRow.headline || mentorData.headline,
        company: mentorRow.company || mentorData.company,
        category: mentorRow.category || mentorData.category,
        yearsExperience: Number(mentorRow.years_experience) || mentorData.yearsExperience,
        rating: Number(mentorRow.rating) || 5.0,
        totalReviews: Number(mentorRow.total_reviews) || mentorData.totalReviews,
        skills: Array.isArray(mentorRow.skills) && mentorRow.skills.length ? mentorRow.skills : mentorData.skills,
        bio: mentorRow.bio || mentorData.bio,
        mentoringApproach: mentorRow.mentoring_approach || mentorData.mentoringApproach,
        languages: mentorRow.languages || mentorData.languages,
        location: mentorRow.location || mentorData.location,
        availability: mentorRow.availability || "Available",
        acceptingMentees: mentorRow.availability !== "Paused",
        offersFreeIntro: !!mentorRow.offers_free_intro,
        price: mentorRow.price || mentorData.price,
        sessionDuration: "45 min",
        linkedinUrl: mentorRow.linkedin_url || undefined,
      };

      const orFilter = mentorRow.legacy_id
        ? `mentor_id.eq.${mentorRow.id},mentor_num.eq.${mentorRow.legacy_id}`
        : `mentor_id.eq.${mentorRow.id}`;

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id,student_id,mentor_name,session_type,duration,price,booking_date,booking_time,status,notes,created_at,scheduled_start")
        .or(orFilter)
        .order("created_at", { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        const studentIds = [...new Set(bookingsData.map((b: any) => b.student_id).filter(Boolean))];
        const studentMap = new Map<string, any>();

        if (studentIds.length > 0) {
          const { data: studentProfiles } = await supabase
            .from("profiles")
            .select("id,full_name,email,avatar_url,career_goal,learning_language")
            .in("id", studentIds);

          (studentProfiles || []).forEach((p: any) => studentMap.set(p.id, p));
        }

        const remoteSessions: MentorSession[] = bookingsData.map((b: any) => {
          const student = studentMap.get(b.student_id);
          const studentName = student?.full_name || student?.email?.split("@")[0] || "Student Mentee";
          return {
            id: String(b.id),
            menteeId: b.student_id || "student_guest",
            menteeName: studentName,
            menteeEmail: student?.email || undefined,
            menteeAvatar: student?.avatar_url || undefined,
            sessionType: b.session_type || "1:1 Mentorship Session",
            duration: b.duration || "45 min",
            price: b.price || "₹2,500",
            bookingDate: b.booking_date || (b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : "Scheduled"),
            bookingTime: b.booking_time || "5:00 PM",
            status: b.status === "completed" ? "Completed" : b.status === "cancelled" ? "Cancelled" : "Booked",
            meetingUrl: `https://meet.jit.si/starfix-${b.id}`,
            notes: b.notes || undefined,
            createdAt: b.created_at || new Date().toISOString(),
          };
        });

        sessionsList = remoteSessions.length >= 3 ? remoteSessions : [...remoteSessions, ...SAMPLE_SESSIONS.slice(remoteSessions.length)];
      }
    }
  } catch (err) {
    console.warn("Error in fetchMentorData:", err);
  }

  return {
    mentor: mentorData,
    mentees: menteesList,
    sessions: sessionsList,
    requests: requestsList,
    activityFeed: activityFeed,
    reviews: reviewsList,
    earnings: earningsData,
  };
}

export async function updateMentorProfileInDb(
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
