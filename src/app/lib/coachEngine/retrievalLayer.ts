/* ─────────────────────────────────────────────────────────────────────────
   Retrieval Layer — grounds AI Coach responses in Starfix's authoritative
   data (PATHS, MENTORS, curatedContent, pathProgress, messages, bookings).
───────────────────────────────────────────────────────────────────────── */

import { PATHS, type PathDef } from "../../dashboard/pages/GoalsPage";
import { MENTORS } from "../../dashboard/pages/MentorsPage";
import { pickCuratedVideo } from "../curatedContent";
import { getAllEnrollments, type Enrollment } from "../pathProgress";
import { getConversations } from "../messages";
import { getUpcomingBookings, type Booking } from "../bookings";
import type { UserProfile } from "../../types";

export interface PersonalizedMentorPick {
  mentor: typeof MENTORS[0];
  reason: string;
  existingChat: boolean;
}

export interface CuratedResourcePick {
  title: string;
  creator: string;
  searchUrl: string;
  reason: string;
}

export interface LearnerContext {
  activeEnrollment: Enrollment | null;
  activePath: PathDef | null;
  upcomingBooking: Booking | null;
  skillLevel: string;
  country: string;
}

/** Retrieve matched Growth Path from PATHS array */
export function getMatchedPath(categoryOrId: string): PathDef {
  const c = categoryOrId.toLowerCase();
  const found = PATHS.find(
    (p) => p.id === c || p.title.toLowerCase().includes(c) || p.mentorCategory.toLowerCase().includes(c)
  );
  return found || PATHS[0]; // Fallback to Coding
}

/** Retrieve personalized mentor recommendation matching UserProfile & Category */
export function getPersonalizedMentor(
  category: string,
  userProfile?: UserProfile | null
): PersonalizedMentorPick {
  const catMentors = MENTORS.filter(
    (m) => m.category.toLowerCase() === category.toLowerCase()
  );
  const candidates = catMentors.length > 0 ? catMentors : MENTORS;

  // Personalization score matching learner's profile
  let bestMentor = candidates[0];
  let bestScore = -1;
  let bestReason = `Leading ${bestMentor.category} mentor with a ${bestMentor.rating} rating at ${bestMentor.company}.`;

  const userLevel = (userProfile?.skillLevel || "beginner").toLowerCase();
  const userCountry = userProfile?.country || "IN";

  for (const m of candidates) {
    let score = m.rating * 10 + m.students / 500;

    // Prefer free mentors for beginners
    if (userLevel === "beginner" && m.free) {
      score += 15;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMentor = m;
      bestReason = m.free
        ? `${m.name} is a ${m.title} at ${m.company} offering free mentorship, perfect for your ${userLevel} growth stage.`
        : `${m.name} is a ${m.title} at ${m.company} rated ${m.rating}⭐ across ${m.students.toLocaleString()} learners.`;
    }
  }

  // Check if learner has an existing message thread with this mentor
  const conversations = getConversations();
  const existingChat = Boolean(conversations[bestMentor.id]);

  return {
    mentor: bestMentor,
    reason: bestReason,
    existingChat,
  };
}

/** Retrieve curated video resource from curatedContent engine */
export function getCuratedResource(
  category: string,
  milestoneTopic?: string,
  userProfile?: UserProfile | null
): CuratedResourcePick {
  const path = getMatchedPath(category);
  const topic = milestoneTopic || path.modules[0];
  const country = userProfile?.country === "IN" ? "IN" : "Global";
  const language = userProfile?.learningLanguages?.[0] === "Hindi" ? "Hindi" : "English";

  const video = pickCuratedVideo(path.id, topic, country, language);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${video.creator} ${topic}`
  )}`;

  return {
    title: `${topic} by ${video.creator}`,
    creator: video.creator,
    searchUrl,
    reason: `Hand-picked top-tier course by ${video.creator} tailored for ${country} learners.`,
  };
}

/** Retrieve live learner status across active enrollments & bookings */
export function getLearnerContext(userProfile?: UserProfile | null): LearnerContext {
  const enrollments = getAllEnrollments();
  const activeEnrollment = enrollments.find((e) => !e.completedAt) || enrollments[0] || null;
  const activePath = activeEnrollment ? getMatchedPath(activeEnrollment.pathId) : null;

  const upcomingBookings = getUpcomingBookings();
  const upcomingBooking = upcomingBookings[0] || null;

  return {
    activeEnrollment,
    activePath,
    upcomingBooking,
    skillLevel: userProfile?.skillLevel || "beginner",
    country: userProfile?.country || "IN",
  };
}
