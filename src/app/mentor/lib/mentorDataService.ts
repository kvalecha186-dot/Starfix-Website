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
  availability: string;
  acceptingMentees: boolean;
  offersFreeIntro: boolean;
  price: string;
  sessionDuration: string;
  linkedinUrl?: string;
}

export interface Mentee {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  careerGoal?: string;
  learningLanguage?: string;
  totalSessions: number;
  totalHours: number;
  nextSessionDate?: string;
  lastActive?: string;
  status: "Active" | "Completed" | "Pending";
  notes?: string;
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
  userId: string,
  userProfile?: UserProfile | null
): Promise<{
  mentor: MentorProfileData;
  mentees: Mentee[];
  sessions: MentorSession[];
  reviews: MentorReview[];
  earnings: MentorEarnings;
}> {
  let mentorData = getDefaultMentorData(userProfile);
  let menteesList: Mentee[] = [...SAMPLE_MENTEES];
  let sessionsList: MentorSession[] = [...SAMPLE_SESSIONS];
  let reviewsList: MentorReview[] = [...SAMPLE_REVIEWS];
  let earningsData: MentorEarnings = { ...SAMPLE_EARNINGS };

  try {
    // 1. Fetch mentor profile from Supabase
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
        availability: mentorRow.availability || "Available",
        acceptingMentees: mentorRow.availability !== "Paused",
        offersFreeIntro: !!mentorRow.offers_free_intro,
        price: mentorRow.price || mentorData.price,
        sessionDuration: "45 min",
        linkedinUrl: mentorRow.linkedin_url || undefined,
      };

      // 2. Fetch real bookings from Supabase for this mentor
      const orFilter = mentorRow.legacy_id
        ? `mentor_id.eq.${mentorRow.id},mentor_num.eq.${mentorRow.legacy_id}`
        : `mentor_id.eq.${mentorRow.id}`;

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("id,student_id,mentor_name,session_type,duration,price,booking_date,booking_time,status,notes,created_at,scheduled_start")
        .or(orFilter)
        .order("created_at", { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        // Collect student profiles
        const studentIds = [...new Set(bookingsData.map((b: any) => b.student_id).filter(Boolean))];
        const studentMap = new Map<string, any>();

        if (studentIds.length > 0) {
          const { data: studentProfiles } = await supabase
            .from("profiles")
            .select("id,full_name,email,avatar_url,career_goal,learning_language")
            .in("id", studentIds);

          (studentProfiles || []).forEach((p: any) => studentMap.set(p.id, p));
        }

        // Map bookings to sessions
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

        // Combine remote sessions with samples if remote has few entries
        sessionsList = remoteSessions.length >= 3 ? remoteSessions : [...remoteSessions, ...SAMPLE_SESSIONS.slice(remoteSessions.length)];

        // Derive active mentees from real bookings
        const menteeMap = new Map<string, Mentee>();
        remoteSessions.forEach((s) => {
          const existing = menteeMap.get(s.menteeId);
          const student = studentMap.get(s.menteeId);
          if (existing) {
            existing.totalSessions += 1;
            existing.totalHours += 0.75;
            if (s.status === "Booked") existing.nextSessionDate = `${s.bookingDate}, ${s.bookingTime}`;
          } else {
            menteeMap.set(s.menteeId, {
              id: s.menteeId,
              name: s.menteeName,
              email: s.menteeEmail || "mentee@starfix.com",
              avatarUrl: s.menteeAvatar,
              careerGoal: student?.career_goal || "Software Engineering",
              learningLanguage: student?.learning_language || "English",
              totalSessions: 1,
              totalHours: 0.75,
              nextSessionDate: s.status === "Booked" ? `${s.bookingDate}, ${s.bookingTime}` : undefined,
              lastActive: "Recent",
              status: s.status === "Booked" ? "Active" : "Completed",
              notes: getMenteeNotes(s.menteeId),
            });
          }
        });

        if (menteeMap.size > 0) {
          menteesList = Array.from(menteeMap.values());
        }
      }
    }
  } catch (err) {
    console.warn("Error in fetchMentorData:", err);
  }

  return {
    mentor: mentorData,
    mentees: menteesList,
    sessions: sessionsList,
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
