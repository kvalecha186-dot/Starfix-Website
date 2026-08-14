/* ─────────────────────────────────────────────────────────────────────────
   Response Generator — constructs intelligent, context-aware, data-grounded
   response messages for the Starfix AI Coach.
───────────────────────────────────────────────────────────────────────── */

import type { UserProfile } from "../../types";
import { matchSemanticTopic, detectIntent, type SemanticTopic } from "./semanticMatcher";
import {
  getMatchedPath,
  getPersonalizedMentor,
  getCuratedResource,
  getLearnerContext,
} from "./retrievalLayer";
import { CoachMemory } from "./conversationalMemory";

export interface CoachResponseMsg {
  from: "coach";
  text?: string;
  plan?: {
    heading: string;
    lines: { label: string; value: string }[];
    weekList?: string[];
    today?: string;
  };
  chips?: string[];
  actions?: { label: string; page: any; category?: string }[];
}

export function generateCoachResponse(
  userText: string,
  userProfile?: UserProfile | null,
  memory?: CoachMemory
): CoachResponseMsg[] {
  const intent = detectIntent(userText);
  const activeGoalId = userProfile?.goalId || "coding";
  const matchedTopic = matchSemanticTopic(userText, activeGoalId);

  const responses: CoachResponseMsg[] = [];

  // Handle Clarification Response (e.g. user answered "Beginner", "Intermediate")
  if (intent === "CLARIFICATION_RESPONSE" && memory?.pendingClarificationTopicId) {
    const topicId = memory.pendingClarificationTopicId;
    memory.pendingClarificationTopicId = null;

    const level = userText;
    memory.setLevel(level);

    const path = getMatchedPath(topicId);
    const mentorPick = getPersonalizedMentor(path.mentorCategory, userProfile);
    const videoPick = getCuratedResource(path.mentorCategory, path.modules[0], userProfile);

    responses.push({
      from: "coach",
      plan: {
        heading: `Best path: ${path.title}`,
        lines: [
          { label: "Level", value: level },
          { label: "Estimated time", value: "6–8 weeks" },
          { label: "Recommended Mentor", value: mentorPick.mentor.name },
        ],
        weekList: path.modules,
        today: `Start with ${path.modules[0]}: watch 1 lesson and complete 1 practical exercise.`,
      },
      actions: [
        { label: "Open Path", page: "goals" },
        { label: "View Mentor", page: "mentors", category: path.mentorCategory },
      ],
    });

    responses.push({
      from: "coach",
      text: `${videoPick.reason} Free resource: watch "${videoPick.title}" on YouTube.`,
      actions: [{ label: "Watch Video", page: "goals" }],
    });

    return responses;
  }

  // Intent: FRUSTRATION_CONFUSION (e.g., "I freeze up in meetings", "DSA is too hard")
  if (intent === "FRUSTRATION_CONFUSION") {
    memory?.setConcern(userText);
    const topic = matchedTopic || matchSemanticTopic("communication", activeGoalId)!;
    const path = getMatchedPath(topic.category);
    const mentorPick = getPersonalizedMentor(topic.category, userProfile);

    let empathicOpener = "Feeling stuck or anxious is completely natural when pushing your boundaries.";
    if (/meeting|presentation|speak|freeze/i.test(userText)) {
      empathicOpener = "Speaking up in meetings or under pressure can feel intimidating, but it is a muscle you can train step by step.";
    } else if (/code|dsa|bug|debug|algorithm/i.test(userText)) {
      empathicOpener = "Coding fundamentals and algorithms can feel overwhelming at first, but breaking them into small daily exercises makes them manageable.";
    }

    responses.push({
      from: "coach",
      text: `${empathicOpener} ${mentorPick.reason} Would you like a structured 6-week plan or a 1-on-1 session?`,
      chips: ["Beginner", "Intermediate", "Advanced"],
      actions: [
        { label: "Open Path", page: "goals" },
        {
          label: mentorPick.existingChat ? `Message ${mentorPick.mentor.name}` : "View Mentor",
          page: mentorPick.existingChat ? "messages" : "mentors",
          category: topic.category,
        },
      ],
    });

    if (memory) {
      memory.pendingClarificationTopicId = topic.id;
    }

    return responses;
  }

  // Intent: PROGRESS_CHECK ("what should i do today")
  if (intent === "PROGRESS_CHECK") {
    const learnerCtx = getLearnerContext(userProfile);
    if (learnerCtx.activeEnrollment && learnerCtx.activePath) {
      const p = learnerCtx.activePath;
      const e = learnerCtx.activeEnrollment;
      const mentorPick = getPersonalizedMentor(p.mentorCategory, userProfile);

      responses.push({
        from: "coach",
        plan: {
          heading: `You're on ${p.title}`,
          lines: [
            { label: "Current milestone", value: p.modules[e.weekIndex || 0] },
            { label: "Mentor", value: mentorPick.mentor.name },
          ],
          today: `Module ${ (e.weekIndex || 0) + 1 }: Practice ${p.modules[e.weekIndex || 0]} for 30 minutes today.`,
        },
        actions: [
          { label: "Continue Journey", page: "goals" },
          { label: "View Mentor", page: "mentors", category: p.mentorCategory },
        ],
      });
      return responses;
    }
  }

  // Intent: MENTOR_REASONING ("who can help me")
  if (intent === "MENTOR_REASONING") {
    const topic = matchedTopic || matchSemanticTopic("coding", activeGoalId)!;
    const mentorPick = getPersonalizedMentor(topic.category, userProfile);

    const memoryNote = memory?.getConcern()
      ? `Addressing your earlier concern about "${memory.getConcern()}": `
      : "";

    responses.push({
      from: "coach",
      text: `${memoryNote}I recommend **${mentorPick.mentor.name}** (${mentorPick.mentor.title} at ${mentorPick.mentor.company}). ${mentorPick.reason}`,
      actions: [
        {
          label: mentorPick.existingChat ? `Message ${mentorPick.mentor.name}` : "View Mentor",
          page: mentorPick.existingChat ? "messages" : "mentors",
          category: topic.category,
        },
      ],
    });
    return responses;
  }

  // Intent: REQUEST_PLAN ("build a plan", "roadmap")
  if (intent === "REQUEST_PLAN" || (matchedTopic && !memory?.getLevel())) {
    const topic = matchedTopic || matchSemanticTopic("coding", activeGoalId)!;

    if (memory) {
      memory.pendingClarificationTopicId = topic.id;
    }

    const contextPrefix = memory?.getConcern()
      ? `Based on your concern ("${memory.getConcern()}"), `
      : "";

    responses.push({
      from: "coach",
      text: `${contextPrefix}I can build you a personalized roadmap for **${topic.label}**. Quick question — what's your current experience level?`,
      chips: ["Beginner", "Intermediate", "Advanced"],
    });

    return responses;
  }

  // Intent: QUESTION or General Query
  const topic = matchedTopic || matchSemanticTopic("coding", activeGoalId)!;
  const path = getMatchedPath(topic.category);
  const videoPick = getCuratedResource(topic.category, path.modules[0], userProfile);
  const mentorPick = getPersonalizedMentor(topic.category, userProfile);

  const contextNote = memory?.getContextSummary()
    ? `Taking into account your profile (${memory.getContextSummary()}): `
    : "";

  responses.push({
    from: "coach",
    text: `${contextNote}For **${topic.label}**, I recommend building hands-on projects alongside mentor guidance. ${videoPick.reason} Check out "${videoPick.title}".`,
    actions: [
      { label: "Open Path", page: "goals" },
      { label: "View Mentor", page: "mentors", category: topic.category },
    ],
  });

  return responses;
}

/**
 * Optional Serverless LLM Routing Bridge
 * Demonstrates how final text generation can be sent to a real API endpoint
 * while using retrieved Starfix context as grounding data.
 */
export async function generateServerlessLLMResponse(
  userPrompt: string,
  groundingContext: Record<string, any>
): Promise<string | null> {
  try {
    const response = await fetch("/api/coach-generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt, context: groundingContext }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.reply || null;
  } catch {
    return null; // Fallback to client-side responseGenerator
  }
}
