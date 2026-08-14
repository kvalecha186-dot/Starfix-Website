/* ─────────────────────────────────────────────────────────────────────────
   Grounded Data Engine — strict data lookup from Starfix authoritative files
   (PATHS, MENTORS, curatedContent, pathProgress, messages, bookings).
   Guarantees content is never fabricated, blended across topics, or defaulted
   to an unrelated topic.
───────────────────────────────────────────────────────────────────────── */

import { PATHS, type PathDef } from "../../dashboard/pages/GoalsPage";
import { MENTORS } from "../../dashboard/pages/MentorsPage";
import { pickCuratedVideo } from "../curatedContent";
import { getAllEnrollments, type Enrollment } from "../pathProgress";
import { getConversations } from "../messages";
import { getUpcomingBookings, type Booking } from "../bookings";
import type { UserProfile } from "../../types";

export interface GroundedMentor {
  mentor: typeof MENTORS[0];
  reason: string;
  existingChat: boolean;
}

export interface GroundedVideo {
  title: string;
  creator: string;
  searchUrl: string;
  reason: string;
}

export function getGroundedPath(topicId: string): PathDef | null {
  const t = topicId.toLowerCase();
  return PATHS.find(p => p.id === t || p.mentorCategory.toLowerCase() === t || p.title.toLowerCase().includes(t)) || null;
}

export function getGroundedMentor(category: string, userProfile?: UserProfile | null): GroundedMentor | null {
  // STRICT CATEGORY MATCHING — find mentors matching the specific confirmed category
  const matchingMentors = MENTORS.filter(m => m.category.toLowerCase() === category.toLowerCase());
  
  if (matchingMentors.length === 0) {
    return null; // Return null rather than fabricating an unrelated mentor!
  }

  const userLevel = (userProfile?.skillLevel || "beginner").toLowerCase();

  // Pick best matching mentor based on user profile
  let bestMentor = matchingMentors[0];
  for (const m of matchingMentors) {
    if (userLevel === "beginner" && m.free) {
      bestMentor = m;
      break;
    }
  }

  const conversations = getConversations();
  const existingChat = Boolean(conversations[bestMentor.id]);

  const reason = bestMentor.free
    ? `${bestMentor.name} is a ${bestMentor.title} at ${bestMentor.company} offering free mentorship for ${bestMentor.category}.`
    : `${bestMentor.name} is a ${bestMentor.title} at ${bestMentor.company} rated ${bestMentor.rating}⭐.`;

  return {
    mentor: bestMentor,
    reason,
    existingChat,
  };
}

export function getGroundedVideo(topicId: string, milestoneTopic?: string, userProfile?: UserProfile | null): GroundedVideo | null {
  const path = getGroundedPath(topicId);
  if (!path) return null;

  const topic = milestoneTopic || path.modules[0];
  const country = userProfile?.country === "IN" ? "IN" : "Global";
  const language = userProfile?.learningLanguages?.[0] === "Hindi" ? "Hindi" : "English";

  const video = pickCuratedVideo(path.id, topic, country, language);
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${video.creator} ${topic}`)}`;

  return {
    title: `${topic} by ${video.creator}`,
    creator: video.creator,
    searchUrl,
    reason: `Hand-picked course by ${video.creator} tailored for ${country} learners.`,
  };
}

export function getGroundedEnrollmentContext(userProfile?: UserProfile | null) {
  const enrollments = getAllEnrollments();
  const activeEnrollment = enrollments.find(e => !e.completedAt) || enrollments[0] || null;
  const activePath = activeEnrollment ? getGroundedPath(activeEnrollment.pathId) : null;
  const upcomingBookings = getUpcomingBookings();
  const upcomingBooking = upcomingBookings[0] || null;

  return {
    activeEnrollment,
    activePath,
    upcomingBooking,
  };
}
