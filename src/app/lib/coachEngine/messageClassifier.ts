/* ─────────────────────────────────────────────────────────────────────────
   Message Classifier — single-pass 6-category classifier for Starfix AI Coach.
   Evaluates message intent and context to prevent misclassifications (such as
   treating "i am confused" as a goal statement or triggering a mentor card).
───────────────────────────────────────────────────────────────────────── */

import { SessionState, type SkillLevel, type ConfirmedTopic } from "./stateMachine";
import { PATHS } from "../../dashboard/pages/GoalsPage";

export type MessageCategory =
  | "EMOTIONAL_OR_CONFUSION_SIGNAL"
  | "LEVEL_OR_PREFERENCE_ANSWER"
  | "GOAL_STATEMENT"
  | "DIRECT_ACTION_REQUEST"
  | "FOLLOW_UP"
  | "OFF_TOPIC_OR_UNCLEAR";

export interface KnownTopic {
  id: string;
  label: string;
  category: string;
  keywords: string[];
}

// Dynamically construct KNOWN_TOPICS from PATHS + enriched semantic keywords
export const KNOWN_TOPICS: KnownTopic[] = PATHS.map((p) => {
  const baseKeywords = [
    p.id,
    p.title.toLowerCase(),
    ...p.title.toLowerCase().split(/\s+/),
    ...p.modules.flatMap((m) => m.toLowerCase().split(/\s+/)),
  ];

  // Specific domain extensions
  const extraMap: Record<string, string[]> = {
    coding: ["code", "developer", "software", "programming", "python", "javascript", "react", "fullstack", "backend", "frontend"],
    "ai-ml": ["ai", "machine learning", "ml", "deep learning", "neural network", "pytorch", "tensorflow", "model", "llm", "nlp"],
    "data-science": ["data science", "statistics", "pandas", "data wrangling", "data visualization", "datasets"],
    cybersecurity: ["cyber security", "ethical hacking", "security", "networking", "penetration testing"],
    cloud: ["cloud", "aws", "cloud computing", "ec2", "s3", "cloud architect"],
    devops: ["devops", "docker", "kubernetes", "ci/cd", "jenkins", "linux"],
    uiux: ["design", "ui", "ux", "figma", "product design", "wireframing", "prototyping", "user research"],
    webdev: ["web development", "web dev", "html", "css", "web building"],
    appdev: ["app development", "mobile app", "ios", "android", "flutter", "react native"],
    "system-design": ["system design", "scalability", "microservices", "load balancing", "caching"],
    dsa: ["dsa", "data structures", "algorithms", "leetcode", "dynamic programming", "trees", "graphs"],
    blockchain: ["blockchain", "web3", "crypto", "smart contracts", "solidity", "dapps"],
    "product-mgmt": ["product management", "product manager", "prd", "roadmapping"],
    "digital-marketing": ["digital marketing", "seo", "paid ads", "growth marketing"],
    "content-creation": ["content creation", "content creator", "youtube", "instagram", "tiktok", "editing"],
    "public-speaking": ["public speaking", "speak", "speech", "presentation", "stage fright", "vocal delivery"],
    entrepreneurship: ["entrepreneurship", "startup", "founder", "mvp", "pitch", "fundraising"],
    finance: ["finance", "money", "budget", "budgeting", "saving", "taxes"],
    investing: ["investing", "stocks", "mutual funds", "portfolio", "wealth"],
    freelancing: ["freelancing", "freelance", "clients", "pricing work", "consulting"],
    "interview-prep": ["interview preparation", "interviews", "mock interview", "behavioral questions", "resume"],
    "muscle-building": ["muscle building", "muscle", "gym", "bodybuilding", "hypertrophy"],
    "weight-loss": ["weight loss", "calorie deficit", "fat loss", "dieting"],
    yoga: ["yoga", "flexibility", "asanas", "flow"],
    nutrition: ["nutrition", "macros", "meal prep", "diet"],
    sleep: ["sleep", "insomnia", "sleep optimization", "sleep quality"],
    meditation: ["meditation", "mindfulness", "stress", "anxiety", "calm", "breathwork"],
    productivity: ["productivity", "time management", "deep work", "focus", "habits"],
    writing: ["writing", "copywriting", "storytelling", "author", "essays"],
  };

  const extra = extraMap[p.id] || [];
  const uniqueKeywords = Array.from(new Set([...baseKeywords, ...extra])).filter(
    (k) => k.length > 2 || k === "ai" || k === "ml" || k === "ui" || k === "ux"
  );

  return {
    id: p.id,
    label: p.title,
    category: p.mentorCategory,
    keywords: uniqueKeywords,
  };
});

export function findMatchingTopic(text: string): KnownTopic | null {
  const q = text.toLowerCase();

  // 1. Exact or keyword boundaries
  for (const topic of KNOWN_TOPICS) {
    for (const kw of topic.keywords) {
      if (kw.length <= 3) {
        const regex = new RegExp(`\\b${kw.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}\\b`, "i");
        if (regex.test(q)) return topic;
      } else if (q.includes(kw)) {
        return topic;
      }
    }
  }
  return null;
}

export function parseLevel(text: string): SkillLevel | null {
  const q = text.toLowerCase();
  if (/\b(beginner|basic|novice|start|starting|newbie|zero)\b/i.test(q)) return "Beginner";
  if (/\b(intermediate|medium|some experience|moderate)\b/i.test(q)) return "Intermediate";
  if (/\b(advanced|expert|proficient|senior)\b/i.test(q)) return "Advanced";
  return null;
}

export function classifyMessage(
  text: string,
  state: SessionState
): { category: MessageCategory; matchedTopic: KnownTopic | null; levelAnswer: SkillLevel | null } {
  const q = text.toLowerCase().trim();
  const matchedTopic = findMatchingTopic(q);
  const levelAnswer = parseLevel(q);

  // 1. Check if user is answering a pending level question
  if (state.openQuestion === "ASKED_LEVEL" && levelAnswer) {
    return {
      category: "LEVEL_OR_PREFERENCE_ANSWER",
      matchedTopic: state.confirmedTopic
        ? KNOWN_TOPICS.find((t) => t.id === state.confirmedTopic?.id) || null
        : matchedTopic,
      levelAnswer,
    };
  }

  // 2. Emotional / Confusion Signal (e.g. "i am confused", "i feel stuck") WITHOUT a topic
  const isEmotional = /\b(confused|stuck|overwhelmed|anxious|lost|scared|intimidated|don't know|dont know|unsure|help me)\b/i.test(
    q
  );
  if (isEmotional && !matchedTopic) {
    return { category: "EMOTIONAL_OR_CONFUSION_SIGNAL", matchedTopic: null, levelAnswer: null };
  }

  // 3. Goal Switch / Follow-up (e.g. "actually can you also help with interviews")
  if (/\b(actually|also|instead|what about|can you also|switch)\b/i.test(q) && matchedTopic) {
    return { category: "GOAL_STATEMENT", matchedTopic, levelAnswer };
  }

  // 4. Direct Action Request ("what should i do today", "give me a plan", "find me a mentor")
  if (/\b(what should i do|give me a plan|study plan|roadmap|find me a mentor|today's task)\b/i.test(q)) {
    return {
      category: "DIRECT_ACTION_REQUEST",
      matchedTopic:
        matchedTopic ||
        (state.confirmedTopic ? KNOWN_TOPICS.find((t) => t.id === state.confirmedTopic?.id) || null : null),
      levelAnswer,
    };
  }

  // 5. Goal Statement (user names a goal/topic like "cloud computing" or "i want to be fit")
  if (matchedTopic) {
    return { category: "GOAL_STATEMENT", matchedTopic, levelAnswer };
  }

  // 6. Follow-up to active conversation
  if (state.confirmedTopic && q.length > 0) {
    return {
      category: "FOLLOW_UP",
      matchedTopic: KNOWN_TOPICS.find((t) => t.id === state.confirmedTopic?.id) || null,
      levelAnswer,
    };
  }

  // 7. Off-topic or Unclear
  return { category: "OFF_TOPIC_OR_UNCLEAR", matchedTopic: null, levelAnswer: null };
}
