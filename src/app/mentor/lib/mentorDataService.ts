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

export interface MenteeTimelineItem {
  id: string;
  date: string;
  title: string;
  description: string;
  type: "milestone" | "session" | "note";
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

export interface ActivityFeedItem {
  id: string;
  menteeName: string;
  type: "session_booked" | "milestone_completed";
  title: string;
  detail: string;
  timeAgo: string;
}

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  menteeName: string;
  message?: string;
  status: "Pending" | "Accepted" | "Declined";
  createdAt?: string;
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
  timeline: MenteeTimelineItem[];
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

const STORAGE_NOTES_KEY = "starfix:mentor_notes";

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
  } catch {
    /* ignore */
  }
}

export function getMenteeNotes(menteeId: string): string {
  return getStoredNotes()[menteeId] || "";
}

/* ─── Default Sample Data for Fresh Mentors ─────────────────────────────── */

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
    skills: ["System Design", "React", "TypeScript", "Node.js", "Cloud Architecture"],
    bio: "Passionate about mentoring high-potential software engineers and guiding them through complex system design and career progression.",
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
    totalSessions: 4,
    totalHours: 3.5,
    nextSessionDate: "Tomorrow, 5:00 PM",
    lastActive: "Today",
    status: "Active",
    notes: "Focusing on micro-frontend architecture and clean state management patterns.",
  },
  {
    id: "mentee_2",
    name: "Priya Patel",
    email: "priya.p@outlook.com",
    careerGoal: "AI & Machine Learning Engineer",
    learningLanguage: "Python & PyTorch",
    totalSessions: 3,
    totalHours: 2.5,
    nextSessionDate: "Thursday, 6:30 PM",
    lastActive: "Yesterday",
    status: "Active",
    notes: "Working on model quantization and deploying LLM inference endpoints.",
  },
  {
    id: "mentee_3",
    name: "Rohan Verma",
    email: "rohan.v@tech.io",
    careerGoal: "Cloud Architect",
    learningLanguage: "Docker & Kubernetes",
    totalSessions: 6,
    totalHours: 5.0,
    nextSessionDate: undefined,
    lastActive: "3 days ago",
    status: "Completed",
    notes: "Successfully cracked Senior SRE interview at top product company.",
  },
  {
    id: "mentee_4",
    name: "Ananya Iyer",
    email: "ananya.iyer@gmail.com",
    careerGoal: "Product Designer & Frontend Dev",
    learningLanguage: "Design Systems & Figma",
    totalSessions: 1,
    totalHours: 0.75,
    nextSessionDate: "Saturday, 11:00 AM",
    lastActive: "Today",
    status: "Pending",
    notes: "Introductory session booked. Review portfolio case study beforehand.",
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
    notes: "Goal setting and timeline review for Q4 transition.",
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
    notes: "Strong answers on rate limiting and database sharding. Recommended for hire.",
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
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

/* ─── Remote Data Loading & Synchronization ───────────────────────────────── */

export async function fetchMentorData(
  _userId: string,
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
  const fallback = getDefaultMentorData(userProfile);
  let mentorData = fallback;
  let menteesList: Mentee[] = [];
  let sessionsList: MentorSession[] = [];
  let reviewsList: MentorReview[] = [];
  let earningsData: MentorEarnings = { totalEarned: 0, pendingPayout: 0, completedSessionsCount: 0, avgPerSession: 0, currency: "INR", payoutMethod: "Not configured", history: [] };
  try {
    const authResult = await supabase.auth.getUser();
    const authId = authResult.data.user?.id;
    const email = authResult.data.user?.email || userProfile?.email || "";
    if (!authId && !email) throw new Error("No authenticated mentor.");
    let mentorRow: any = null;
    if (authId) mentorRow = (await supabase.from("mentors").select("*").eq("profile_id", authId).maybeSingle()).data;
    if (!mentorRow && email) mentorRow = (await supabase.from("mentors").select("*").eq("email", email).maybeSingle()).data;
    if (!mentorRow) return { mentor: mentorData, mentees: [], sessions: [], requests: [], activityFeed: [], reviews: [], earnings: earningsData };
    const extras = getStoredProfileExtras();
    mentorData = { id: mentorRow.id, legacyId: mentorRow.legacy_id ?? undefined, name: mentorRow.name || fallback.name, email: mentorRow.email || email, avatarUrl: mentorRow.avatar_url || fallback.avatarUrl, headline: mentorRow.headline || fallback.headline, company: mentorRow.company || fallback.company, category: mentorRow.category || fallback.category, yearsExperience: Number(mentorRow.years_experience) || 0, rating: Number(mentorRow.rating) || 0, totalReviews: Number(mentorRow.total_reviews) || 0, skills: Array.isArray(mentorRow.skills) ? mentorRow.skills : [], bio: mentorRow.bio || "", mentoringApproach: mentorRow.mentoring_approach || "", mentoringStyle: extras.mentoringStyle, sessionTypes: extras.sessionTypes, targetLevel: extras.targetLevel, areasCanHelp: extras.areasCanHelp, languages: Array.isArray(mentorRow.languages) ? mentorRow.languages : [], location: mentorRow.location || "", availability: mentorRow.availability || "Available", acceptingMentees: mentorRow.availability !== "Paused", offersFreeIntro: !!mentorRow.offers_free_intro, price: mentorRow.price || "₹0", sessionDuration: "45 min", linkedinUrl: mentorRow.linkedin_url || undefined, mentorSince: mentorRow.mentor_since || mentorRow.created_at || undefined };
    const filter = mentorRow.legacy_id ? "mentor_id.eq." + mentorRow.id + ",mentor_num.eq." + mentorRow.legacy_id : "mentor_id.eq." + mentorRow.id;
    const bookings = (await supabase.from("bookings").select("id,student_id,mentor_id,mentor_num,session_type,duration,price,amount,currency,booking_date,booking_time,scheduled_start,scheduled_end,status,notes,created_at").or(filter).order("scheduled_start", { ascending: true, nullsFirst: false })).data || [];
    const studentIds = [...new Set(bookings.map((b: any) => b.student_id).filter(Boolean))];
    const studentMap = new Map<string, any>();
    if (studentIds.length) { const profiles = (await supabase.from("profiles").select("id,full_name,email,avatar_url,career_goal,learning_language,updated_at").in("id", studentIds)).data || []; profiles.forEach((p: any) => studentMap.set(p.id, p)); }
    const progressMap = new Map<string, any>();
    if (studentIds.length) { const progress = (await supabase.from("user_progress").select("user_id,path_id,overall_progress,current_milestone_id,completed_at").in("user_id", studentIds)).data || []; progress.forEach((p: any) => progressMap.set(p.user_id, p)); }
    const pathIds = [...new Set([...progressMap.values()].map((p: any) => p.path_id).filter(Boolean))];
    const pathMap = new Map<string, any>();
    if (pathIds.length) { const paths = (await supabase.from("growth_paths").select("id,title,slug").in("id", pathIds)).data || []; paths.forEach((p: any) => pathMap.set(p.id, p)); }
    const milestoneIds = [...new Set([...progressMap.values()].map((p: any) => p.current_milestone_id).filter(Boolean))];
    const milestoneMap = new Map<string, string>();
    if (milestoneIds.length) { const ms = (await supabase.from("milestones").select("id,title").in("id", milestoneIds)).data || []; ms.forEach((m: any) => milestoneMap.set(m.id, m.title)); }
    const milestonesByPath = new Map<string, any[]>();
    if (pathIds.length) { const ms = (await supabase.from("milestones").select("id,path_id,title,order_index").in("path_id", pathIds).order("order_index", { ascending: true })).data || []; ms.forEach((m: any) => { const a = milestonesByPath.get(m.path_id) || []; a.push(m); milestonesByPath.set(m.path_id, a); }); }
    const milestoneProgressMap = new Map<string, Set<string>>();
    if (studentIds.length) { const mp = (await supabase.from("milestone_progress").select("user_id,milestone_id,completed").in("user_id", studentIds)).data || []; mp.forEach((r: any) => { if (!r.completed) return; const s = milestoneProgressMap.get(r.user_id) || new Set<string>(); s.add(r.milestone_id); milestoneProgressMap.set(r.user_id, s); }); }
    const notes = studentIds.length ? ((await supabase.from("mentor_notes").select("student_id,note,updated_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds)).data || []) : [];
    const noteMap = new Map(notes.map((n: any) => [n.student_id, n]));
    const goals = studentIds.length ? ((await supabase.from("mentor_goals").select("id,student_id,title,target_date,completed").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];
    const goalsMap = new Map<string, MenteeGoal[]>();
    goals.forEach((g: any) => { const a = goalsMap.get(g.student_id) || []; a.push({ id: String(g.id), title: g.title, completed: !!g.completed, targetDate: g.target_date || undefined }); goalsMap.set(g.student_id, a); });
    const feedback = studentIds.length ? ((await supabase.from("mentor_feedback").select("id,student_id,focus,content,rating,created_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];
    const feedbackMap = new Map<string, MenteeFeedback[]>();
    feedback.forEach((fb: any) => { const a = feedbackMap.get(fb.student_id) || []; a.push({ id: String(fb.id), date: new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), content: fb.content, focus: fb.focus || "General", rating: fb.rating ?? undefined }); feedbackMap.set(fb.student_id, a); });
    const resources = studentIds.length ? ((await supabase.from("shared_resources").select("id,student_id,resource_type,title,url,created_at").eq("mentor_id", mentorRow.id).in("student_id", studentIds).order("created_at", { ascending: false })).data || []) : [];
    const resourceMap = new Map<string, MenteeResource[]>();
    resources.forEach((r: any) => { const a = resourceMap.get(r.student_id) || []; const type = ["video","doc","project","article"].includes(r.resource_type) ? r.resource_type : "article"; a.push({ id: String(r.id), title: r.title, type: type as any, url: r.url || "", addedAt: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) }); resourceMap.set(r.student_id, a); });
    studentIds.forEach((studentId) => {
      const p = studentMap.get(studentId) || {}; const progress = progressMap.get(studentId); const path = progress ? pathMap.get(progress.path_id) : null;
      const sb = bookings.filter((b: any) => b.student_id === studentId);
      const upcoming = sb.find((b: any) => b.status === "confirmed" && b.scheduled_start && new Date(b.scheduled_start) >= new Date());
      const completed = sb.filter((b: any) => b.status === "completed").length;
      const status: Mentee["status"] = upcoming ? "Active" : completed ? "Completed" : "Pending";
      const allMs = (milestonesByPath.get(progress?.path_id) || []).map((m: any) => ({ id: String(m.id), title: m.title, completed: milestoneProgressMap.get(studentId)?.has(m.id) || false, current: m.id === progress?.current_milestone_id }));
      menteesList.push({ id: studentId, name: p.full_name || p.email?.split("@")[0] || "Student", email: p.email || "", avatarUrl: p.avatar_url || undefined, careerGoal: p.career_goal || "", learningLanguage: p.learning_language || "", pathTitle: path?.title || "Growth Path", pathId: path?.slug || path?.id || "", progressPercent: Math.max(0, Math.min(100, Number(progress?.overall_progress) || 0)), currentMilestone: milestoneMap.get(progress?.current_milestone_id) || "No active milestone", nextMilestone: progress?.completed_at ? "All modules completed 🎉" : milestoneMap.get(progress?.current_milestone_id) || "Continue current milestone", allMilestones: allMs, goals: goalsMap.get(studentId) || [], totalSessions: sb.length, totalHours: sb.reduce((sum: number, b: any) => sum + ((parseInt(String(b.duration || "").replace(/[^0-9]/g, "")) || 45) / 60), 0), nextSessionDate: upcoming?.scheduled_start ? new Date(upcoming.scheduled_start).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : undefined, lastActive: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : undefined, status, needsAttention: false, attentionReason: undefined, notes: noteMap.get(studentId)?.note || "", feedbackHistory: feedbackMap.get(studentId) || [], recommendedResources: resourceMap.get(studentId) || [], timeline: sb.slice(0, 10).map((b: any) => ({ id: String(b.id), date: new Date(b.scheduled_start || b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }), title: b.session_type || "Mentorship session", description: b.notes || "Mentorship session", type: "session" as const })) });
    });
    sessionsList = await fetchMentorSessionsFromDb(mentorRow.id, mentorRow.legacy_id);
    reviewsList = await fetchMentorReviewsFromDb(mentorRow.id);
    earningsData = await fetchMentorEarningsFromDb(mentorRow.id);
    const activityFeed: ActivityFeedItem[] = sessionsList.slice(0, 8).map((s) => ({ id: s.id, menteeName: s.menteeName, type: s.status === "Booked" ? "session_booked" : "milestone_completed", title: s.status === "Booked" ? "Session booked" : "Session completed", detail: s.sessionType, timeAgo: new Date(s.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) }));
    return { mentor: mentorData, mentees: menteesList, sessions: sessionsList, requests: [], activityFeed, reviews: reviewsList, earnings: earningsData };
  } catch (err) {
    console.warn("Error in fetchMentorData:", err);
    return { mentor: mentorData, mentees: menteesList, sessions: sessionsList, requests: [], activityFeed: [], reviews: reviewsList, earnings: earningsData };
  }
}

export async function fetchMentorSessionsFromDb(mentorId: string, legacyId?: number): Promise<MentorSession[]> {
  const filter = legacyId ? "mentor_id.eq." + mentorId + ",mentor_num.eq." + legacyId : "mentor_id.eq." + mentorId;
  const rows = (await supabase.from("bookings").select("id,student_id,session_type,duration,price,amount,booking_date,booking_time,scheduled_start,status,notes,created_at").or(filter).order("scheduled_start", { ascending: true, nullsFirst: false })).data || [];
  const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))];
  const studentMap = new Map<string, any>();
  if (studentIds.length) { const ps = (await supabase.from("profiles").select("id,full_name,email,avatar_url").in("id", studentIds)).data || []; ps.forEach((p: any) => studentMap.set(p.id, p)); }
  const ids = rows.map((r: any) => r.id);
  const followups = ids.length ? ((await supabase.from("session_followups").select("booking_id,summary,discussed,next_steps,follow_up_date").in("booking_id", ids)).data || []) : [];
  const fm = new Map(followups.map((f: any) => [f.booking_id, f]));
  return rows.map((b: any) => { const p = studentMap.get(b.student_id); const f = fm.get(b.id); const status = b.status === "completed" ? "Completed" : b.status === "cancelled" ? "Cancelled" : "Booked"; return { id: String(b.id), menteeId: b.student_id || "", menteeName: p?.full_name || p?.email?.split("@")[0] || "Student", menteeEmail: p?.email, menteeAvatar: p?.avatar_url, sessionType: b.session_type || "Mentorship Session", duration: b.duration || "45 min", price: b.price || ("₹" + Number(b.amount || 0).toLocaleString("en-IN")), bookingDate: b.booking_date || (b.scheduled_start ? new Date(b.scheduled_start).toLocaleDateString() : "Scheduled"), bookingTime: b.booking_time || "", status, meetingUrl: "https://meet.jit.si/starfix-" + b.id, notes: b.notes || undefined, discussionRecap: f?.summary || undefined, prepNotes: f?.discussed || b.notes || undefined, actionItems: f?.next_steps ? String(f.next_steps).split("\n").filter(Boolean) : [], needsFollowup: !!f?.follow_up_date, createdAt: b.created_at || new Date().toISOString() }; });
}

export async function updateMentorSessionInDb(sessionId: string, patch: Partial<MentorSession>): Promise<boolean> {
  try {
    const bookingPatch: Record<string, any> = {}; if (patch.notes !== undefined) bookingPatch.notes = patch.notes; if (patch.prepNotes !== undefined) bookingPatch.notes = patch.prepNotes;
    if (Object.keys(bookingPatch).length) { const r = await supabase.from("bookings").update(bookingPatch).eq("id", sessionId); if (r.error) return false; }
    if (patch.discussionRecap !== undefined || patch.actionItems !== undefined || patch.needsFollowup !== undefined || patch.prepNotes !== undefined) {
      const booking = (await supabase.from("bookings").select("student_id,mentor_id").eq("id", sessionId).maybeSingle()).data; if (!booking?.student_id || !booking?.mentor_id) return false;
      const payload = { booking_id: sessionId, mentor_id: booking.mentor_id, student_id: booking.student_id, summary: patch.discussionRecap || "", discussed: patch.prepNotes || "", next_steps: Array.isArray(patch.actionItems) ? patch.actionItems.join("\n") : "", follow_up_date: patch.needsFollowup ? new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10) : null };
      const existing = (await supabase.from("session_followups").select("id").eq("booking_id", sessionId).maybeSingle()).data;
      const r = existing?.id ? await supabase.from("session_followups").update(payload).eq("id", existing.id) : await supabase.from("session_followups").insert(payload);
      return !r.error;
    }
    return true;
  } catch { return false; }
}

export async function createMentorSessionInDb(mentorId: string, legacyId: number | undefined, session: Omit<MentorSession, "id" | "createdAt">): Promise<MentorSession | null> {
  const studentId = session.menteeId && session.menteeId.includes("-") ? session.menteeId : null; if (!studentId) return null;
  const amount = Number(String(session.price || "0").replace(/[^0-9.]/g, "")) || 0;
  const r = await supabase.from("bookings").insert({ student_id: studentId, mentor_id: mentorId, mentor_num: legacyId ?? null, session_type: session.sessionType, duration: session.duration, price: session.price, amount, currency: "INR", booking_date: session.bookingDate, booking_time: session.bookingTime, notes: session.prepNotes || null, status: "confirmed" }).select("id,created_at").single();
  if (r.error || !r.data) return null; return { ...session, id: String(r.data.id), createdAt: r.data.created_at };
}

const SCHEDULE_STORAGE_KEY = "starfix:mentor_schedule";
const BLOCKED_STORAGE_KEY = "starfix:mentor_blocked_dates";

export function getStoredWeeklySchedule(): WeeklyScheduleDay[] {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return [
    { day: "Monday", enabled: true, startTime: "17:00", endTime: "21:00" },
    { day: "Tuesday", enabled: true, startTime: "17:00", endTime: "21:00" },
    { day: "Wednesday", enabled: true, startTime: "17:00", endTime: "21:00" },
    { day: "Thursday", enabled: true, startTime: "17:00", endTime: "21:00" },
    { day: "Friday", enabled: false, startTime: "17:00", endTime: "21:00" },
    { day: "Saturday", enabled: true, startTime: "11:00", endTime: "16:00" },
    { day: "Sunday", enabled: false, startTime: "11:00", endTime: "16:00" },
  ];
}

export function saveWeeklySchedule(schedule: WeeklyScheduleDay[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(schedule)); } catch {}
}

export function getStoredBlockedDates(): BlockedDate[] {
  if (typeof window !== "undefined") {
    try { return JSON.parse(localStorage.getItem(BLOCKED_STORAGE_KEY) || "[]"); } catch {}
  }
  return [];
}

export function saveBlockedDates(dates: BlockedDate[]): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(BLOCKED_STORAGE_KEY, JSON.stringify(dates)); } catch {}
}

export async function fetchMentorScheduleFromDb(mentorId: string): Promise<{ schedule: WeeklyScheduleDay[]; blocked: BlockedDate[] }> {
  const rules = (await supabase.from("mentor_schedule_rules").select("day_of_week,enabled,start_time,end_time").eq("mentor_id", mentorId).order("day_of_week")).data || [];
  const dayNames: WeeklyScheduleDay["day"][] = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const fallback = getStoredWeeklySchedule();
  const schedule = dayNames.slice(1).concat(dayNames.slice(0,1)).map((day) => {
    const idx = dayNames.indexOf(day);
    const r = rules.find((x: any) => Number(x.day_of_week) === idx);
    const old = fallback.find((x) => x.day === day)!;
    return { day, enabled: r ? !!r.enabled : old.enabled, startTime: r ? String(r.start_time).slice(0,5) : old.startTime, endTime: r ? String(r.end_time).slice(0,5) : old.endTime };
  }) as WeeklyScheduleDay[];
  const blockedRows = (await supabase.from("mentor_blocked_dates").select("id,blocked_date,reason").eq("mentor_id", mentorId).order("blocked_date")).data || [];
  const blocked = blockedRows.map((b: any) => ({ id: String(b.id), date: b.blocked_date, reason: b.reason || "Unavailable" }));
  return { schedule, blocked };
}

export async function materializeMentorAvailability(mentorId: string, schedule: WeeklyScheduleDay[]): Promise<boolean> {
  try {
    const blocked = (await supabase.from("mentor_blocked_dates").select("blocked_date").eq("mentor_id", mentorId)).data || [];
    const blockedSet = new Set(blocked.map((b: any) => String(b.blocked_date)));
    const existing = (await supabase.from("mentor_availability").select("start_at,status").eq("mentor_id", mentorId).gte("start_at", new Date().toISOString()).limit(500)).data || [];
    const existingStarts = new Set(existing.map((r: any) => new Date(r.start_at).getTime()));
    const dayIndex: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    const rows: any[] = [];
    const now = new Date();
    for (let offset = 1; offset <= 28; offset++) {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      const day = schedule.find((x) => dayIndex[x.day] === d.getDay());
      if (!day?.enabled) continue;
      const dateKey = d.toISOString().slice(0, 10);
      if (blockedSet.has(dateKey)) continue;
      const [sh, sm] = day.startTime.split(":").map(Number);
      const [eh, em] = day.endTime.split(":").map(Number);
      const cursor = new Date(d); cursor.setHours(sh || 0, sm || 0, 0, 0);
      const end = new Date(d); end.setHours(eh || 0, em || 0, 0, 0);
      while (cursor < end) {
        const slotEnd = new Date(cursor.getTime() + 45 * 60000);
        if (slotEnd > end) break;
        const ts = cursor.getTime();
        if (ts > Date.now() && !existingStarts.has(ts)) rows.push({ mentor_id: mentorId, start_at: cursor.toISOString(), end_at: slotEnd.toISOString(), status: "available" });
        cursor.setTime(cursor.getTime() + 45 * 60000);
      }
    }
    if (rows.length) {
      const r = await supabase.from("mentor_availability").insert(rows);
      if (r.error) return false;
    }
    return true;
  } catch { return false; }
}

export async function saveMentorScheduleToDb(mentorId: string, schedule: WeeklyScheduleDay[]): Promise<boolean> {
  try {
    const dayIndex: Record<string, number> = { Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6 };
    for (const d of schedule) {
      const payload = { mentor_id: mentorId, day_of_week: dayIndex[d.day], enabled: d.enabled, start_time: d.startTime, end_time: d.endTime, updated_at: new Date().toISOString() };
      const r = await supabase.from("mentor_schedule_rules").upsert(payload, { onConflict: "mentor_id,day_of_week" });
      if (r.error) return false;
    }
    await materializeMentorAvailability(mentorId, schedule);
    return true;
  } catch { return false; }
}

export async function addMentorBlockedDateToDb(mentorId: string, entry: BlockedDate): Promise<boolean> {
  const r = await supabase.from("mentor_blocked_dates").upsert({ mentor_id: mentorId, blocked_date: entry.date, reason: entry.reason }, { onConflict: "mentor_id,blocked_date" });
  return !r.error;
}

export async function removeMentorBlockedDateFromDb(mentorId: string, id: string, date: string): Promise<boolean> {
  const q = supabase.from("mentor_blocked_dates").delete().eq("mentor_id", mentorId);
  const r = id.includes("-") ? await q.eq("id", id) : await q.eq("blocked_date", date);
  return !r.error;
}

export async function saveMenteeMilestonesToDb(studentId: string, pathId: string, milestones: MenteeMilestone[]): Promise<boolean> {
  try {
    const pathRow = (await supabase.from("growth_paths").select("id").eq("slug", pathId).maybeSingle()).data;
    const pathUuid = pathRow?.id || pathId;
    for (const ms of milestones) {
      const payload = { user_id: studentId, milestone_id: ms.id, progress_percent: ms.completed ? 100 : 0, completed: ms.completed, completed_at: ms.completed ? new Date().toISOString() : null };
      const existing = (await supabase.from("milestone_progress").select("id").eq("user_id", studentId).eq("milestone_id", ms.id).maybeSingle()).data;
      const r = existing?.id
        ? await supabase.from("milestone_progress").update(payload).eq("id", existing.id)
        : await supabase.from("milestone_progress").insert(payload);
      if (r.error) return false;
    }
    const completedCount = milestones.filter((m) => m.completed).length;
    const overall = milestones.length ? Math.round((completedCount / milestones.length) * 100) : 0;
    const progress = (await supabase.from("user_progress").select("id").eq("user_id", studentId).eq("path_id", pathUuid).maybeSingle()).data;
    if (progress?.id) {
      const next = milestones.find((m) => !m.completed);
      await supabase.from("user_progress").update({ overall_progress: overall, current_milestone_id: next?.id || null, completed_at: overall === 100 ? new Date().toISOString() : null }).eq("id", progress.id);
    }
    return true;
  } catch { return false; }
}

export interface MentorChatThread {
  conversationId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  careerGoal?: string;
  messages: { id: string; senderId: string; sender: "mentor" | "student"; text: string; sentAt: string; status?: string }[];
  unreadCount: number;
}

export async function fetchMentorConversations(mentorId: string): Promise<MentorChatThread[]> {
  const mentorProfile = (await supabase.from("mentors").select("profile_id").eq("id", mentorId).maybeSingle()).data;
  const mentorProfileId = mentorProfile?.profile_id;
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id,student_id,created_at")
    .eq("mentor_id", mentorId)
    .eq("archived", false)
    .order("created_at", { ascending: false });
  if (!conversations?.length) return [];
  const studentIds = [...new Set(conversations.map((c: any) => c.student_id).filter(Boolean))];
  const profiles = studentIds.length
    ? ((await supabase.from("profiles").select("id,full_name,email,career_goal").in("id", studentIds)).data || [])
    : [];
  const pm = new Map(profiles.map((p: any) => [p.id, p]));
  const ids = conversations.map((c: any) => c.id);
  const messages = ((await supabase.from("messages").select("id,conversation_id,sender,body,status,created_at").in("conversation_id", ids).order("created_at", { ascending: true })).data || []);
  return conversations.map((c: any) => {
    const p = pm.get(c.student_id);
    const ms = messages.filter((m: any) => m.conversation_id === c.id).map((m: any) => ({
      id: String(m.id), senderId: String(m.sender), sender: String(m.sender) === String(mentorProfileId) ? "mentor" : "student", text: m.body || "", sentAt: m.created_at, status: m.status
    }));
    return { conversationId: String(c.id), studentId: c.student_id, studentName: p?.full_name || p?.email?.split("@")[0] || "Student", studentEmail: p?.email, careerGoal: p?.career_goal, messages: ms, unreadCount: ms.filter((m: any) => m.sender === "student" && m.status !== "seen").length };
  });
}

export async function ensureMentorConversation(mentorId: string, studentId: string): Promise<string | null> {
  const existing = (await supabase.from("conversations").select("id").eq("student_id", studentId).eq("mentor_id", mentorId).maybeSingle()).data;
  if (existing?.id) return String(existing.id);
  const r = await supabase.from("conversations").insert({ student_id: studentId, mentor_id: mentorId }).select("id").single();
  return r.data?.id ? String(r.data.id) : null;
}

export async function sendMentorChatMessage(conversationId: string, text: string): Promise<boolean> {
  const auth = await supabase.auth.getUser();
  const senderId = auth.data.user?.id;
  if (!senderId || !text.trim()) return false;
  const r = await supabase.from("messages").insert({ conversation_id: conversationId, sender: senderId, body: text.trim(), status: "sent" });
  return !r.error;
}

export async function markMentorConversationRead(conversationId: string): Promise<boolean> {
  const auth = await supabase.auth.getUser();
  const senderId = auth.data.user?.id;
  if (!senderId) return false;
  const r = await supabase.from("messages").update({ status: "seen" }).eq("conversation_id", conversationId).neq("sender", senderId);
  return !r.error;
}

export async function saveMentorNoteToDb(mentorId: string, studentId: string, note: string): Promise<boolean> { const existing = (await supabase.from("mentor_notes").select("id").eq("mentor_id", mentorId).eq("student_id", studentId).maybeSingle()).data; const r = existing?.id ? await supabase.from("mentor_notes").update({ note, updated_at: new Date().toISOString() }).eq("id", existing.id) : await supabase.from("mentor_notes").insert({ mentor_id: mentorId, student_id: studentId, note }); return !r.error; }
export async function saveMentorGoalToDb(mentorId: string, studentId: string, goal: MenteeGoal): Promise<boolean> { const r = await supabase.from("mentor_goals").upsert({ mentor_id: mentorId, student_id: studentId, title: goal.title, target_date: goal.targetDate || null, completed: goal.completed }, { onConflict: "mentor_id,student_id,title" }); return !r.error; }
export async function updateMentorGoalInDb(mentorId: string, studentId: string, goal: MenteeGoal): Promise<boolean> { const r = await supabase.from("mentor_goals").update({ title: goal.title, target_date: goal.targetDate || null, completed: goal.completed, updated_at: new Date().toISOString() }).eq("id", goal.id).eq("mentor_id", mentorId).eq("student_id", studentId); return !r.error; }
export async function saveMentorFeedbackToDb(mentorId: string, studentId: string, feedback: MenteeFeedback): Promise<boolean> { const r = await supabase.from("mentor_feedback").insert({ mentor_id: mentorId, student_id: studentId, focus: feedback.focus, content: feedback.content, rating: feedback.rating ?? null }); return !r.error; }
export async function saveSharedResourceToDb(mentorId: string, studentId: string, resource: MenteeResource, message?: string): Promise<boolean> { const r = await supabase.from("shared_resources").insert({ mentor_id: mentorId, student_id: studentId, resource_type: resource.type, title: resource.title, url: resource.url, message: message || null }); return !r.error; }
export async function fetchMentorReviewsFromDb(mentorId: string): Promise<MentorReview[]> { const rows = (await supabase.from("reviews").select("id,student_id,rating,review_text,created_at").eq("mentor_id", mentorId).order("created_at", { ascending: false })).data || []; const ids = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))]; const ps = ids.length ? ((await supabase.from("profiles").select("id,full_name").in("id", ids)).data || []) : []; const pm = new Map(ps.map((p: any) => [p.id, p.full_name])); return rows.map((r: any) => ({ id: String(r.id), menteeName: pm.get(r.student_id) || "Student", rating: Number(r.rating) || 0, comment: r.review_text || "", date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }), sessionType: "Mentorship Session" })); }
export async function fetchMentorEarningsFromDb(mentorId: string): Promise<MentorEarnings> {
  const rows = (await supabase.from("bookings").select("id,student_id,session_type,amount,price,status,created_at").eq("mentor_id", mentorId).order("created_at", { ascending: false })).data || [];
  const completed = rows.filter((r: any) => r.status === "completed");
  const confirmed = rows.filter((r: any) => r.status === "confirmed");
  const ids = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))];
  const ps = ids.length ? ((await supabase.from("profiles").select("id,full_name").in("id", ids)).data || []) : [];
  const pm = new Map(ps.map((p: any) => [p.id, p.full_name]));
  const value = (r: any) => Number(r.amount) || Number(String(r.price || "").replace(/[^0-9.]/g, "")) || 0;

  if (completed.length) {
    for (const b of completed) {
      await supabase.from("mentor_earnings").upsert({
        mentor_id: mentorId, booking_id: b.id, gross_amount: value(b), platform_fee: 0, net_amount: value(b), currency: "INR", status: "pending"
      }, { onConflict: "booking_id" });
    }
  }
  const earnings = (await supabase.from("mentor_earnings").select("booking_id,net_amount,status,created_at").eq("mentor_id", mentorId).order("created_at", { ascending: false })).data || [];
  const earningByBooking = new Map(earnings.map((e: any) => [e.booking_id, e]));
  const total = completed.reduce((s: number, r: any) => s + value(r), 0);
  const pending = confirmed.reduce((s: number, r: any) => s + value(r), 0) + earnings.filter((e: any) => e.status === "pending").reduce((s: number, e: any) => s + Number(e.net_amount || 0), 0);

  return {
    totalEarned: total,
    pendingPayout: pending,
    completedSessionsCount: completed.length,
    avgPerSession: completed.length ? Math.round(total / completed.length) : 0,
    currency: "INR",
    payoutMethod: "Not configured",
    history: rows.slice(0, 20).map((r: any) => {
      const e = earningByBooking.get(r.id);
      return {
        id: String(r.id),
        date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        sessionTitle: r.session_type || "Mentorship Session",
        menteeName: pm.get(r.student_id) || "Student",
        amount: value(r),
        status: e?.status === "paid" ? "Paid" : "Pending",
      };
    }),
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
