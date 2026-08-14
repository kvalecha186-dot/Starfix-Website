/* ─────────────────────────────────────────────────────────────────────────
   Semantic Matcher — semantic topic and intent classifier for Starfix AI Coach.
   Evaluates n-gram similarity, semantic concept vectors, and context matching
   to route user queries accurately without relying on rigid substring equality.
───────────────────────────────────────────────────────────────────────── */

export type CoachIntent =
  | "REQUEST_PLAN"
  | "QUESTION"
  | "FRUSTRATION_CONFUSION"
  | "MENTOR_REASONING"
  | "PROGRESS_CHECK"
  | "CLARIFICATION_RESPONSE";

export interface SemanticTopic {
  id: string;
  label: string;
  category: string; // Maps to MentorsPage MENTORS category
  concepts: string[];
  weeks: string;
  tasks: string[];
  today: string;
  resourceQuery: string;
}

export const SEMANTIC_TOPICS: SemanticTopic[] = [
  {
    id: "coding",
    label: "Coding & Development",
    category: "Coding",
    concepts: [
      "code", "coding", "developer", "software", "web dev", "javascript", "python",
      "react", "frontend", "backend", "fullstack", "dsa", "algorithms", "data structures",
      "debug", "programming", "git", "github", "syntax", "engineer", "build app"
    ],
    weeks: "6–8 weeks",
    tasks: [
      "30 min of daily coding practice",
      "Ship one small project this week",
      "Read through clean-code fundamentals",
      "Do one mock technical interview"
    ],
    today: "Solve 2 practice problems, then read one chapter of your current course.",
    resourceQuery: "learn to code full course for beginners",
  },
  {
    id: "ai-ml",
    label: "AI & Machine Learning",
    category: "AI/ML",
    concepts: [
      "ai", "machine learning", "ml", "deep learning", "neural network", "data science",
      "pytorch", "tensorflow", "model", "prompt engineering", "llm", "nlp", "computer vision",
      "artificial intelligence", "train model"
    ],
    weeks: "8–10 weeks",
    tasks: [
      "Linear algebra + Python practice (30 min)",
      "Train one small model this week",
      "Read one paper or explainer",
      "Log results in a simple experiment tracker"
    ],
    today: "Watch one ML fundamentals video and implement it from scratch.",
    resourceQuery: "machine learning for beginners full course",
  },
  {
    id: "uiux",
    label: "UI/UX Design",
    category: "UI/UX",
    concepts: [
      "design", "ui", "ux", "figma", "product design", "wireframe", "prototype",
      "user research", "typography", "color theory", "visual design", "user interface",
      "user experience", "case study", "portfolio design"
    ],
    weeks: "6–8 weeks",
    tasks: [
      "Recreate one real UI in Figma (30 min)",
      "Study one design principle in depth",
      "Critique 3 apps you use daily",
      "Get feedback on one screen"
    ],
    today: "Recreate a screen from an app you admire, then write down 3 decisions you made.",
    resourceQuery: "ui ux design for beginners",
  },
  {
    id: "finance",
    label: "Personal Finance",
    category: "Finance",
    concepts: [
      "finance", "invest", "investing", "money", "budget", "stocks", "saving",
      "taxes", "wealth", "portfolio", "crypto", "mutual funds", "financial independence",
      "expense tracking", "retirement"
    ],
    weeks: "6 weeks",
    tasks: [
      "Track spending for the week",
      "Read one investing concept",
      "Review your budget categories",
      "Set one savings goal"
    ],
    today: "Write down everything you spent yesterday and sort it into 3 categories.",
    resourceQuery: "personal finance basics for beginners",
  },
  {
    id: "communication",
    label: "Communication & Public Speaking",
    category: "Communication",
    concepts: [
      "communication", "public speaking", "speak", "presentation", "storytelling", "confidence",
      "freeze up", "meetings", "nervous", "talk", "articulate", "voice", "stage fright",
      "interpersonal", "social skills", "pitch", "conversation"
    ],
    weeks: "6–8 weeks",
    tasks: [
      "Practice speaking for 5 min daily",
      "Record yourself and review it",
      "Learn one body-language principle",
      "Do one mock conversation"
    ],
    today: "Introduce yourself out loud for 60 seconds, then listen back once.",
    resourceQuery: "public speaking for beginners",
  },
  {
    id: "entrepreneurship",
    label: "Entrepreneurship & Business",
    category: "Entrepreneurship",
    concepts: [
      "startup", "entrepreneur", "business", "founder", "growth", "gtm", "mvp",
      "venture", "product market fit", "fundraising", "pitch", "monetization",
      "saas", "client acquisition", "marketing"
    ],
    weeks: "Ongoing",
    tasks: [
      "Talk to 2 potential users",
      "Work on your MVP (30 min)",
      "Read one founder story",
      "Write your one-line pitch"
    ],
    today: "Message 2 people who fit your target user and ask one honest question.",
    resourceQuery: "startup growth fundamentals",
  },
  {
    id: "content",
    label: "Content Creation",
    category: "Content",
    concepts: [
      "content", "instagram", "youtube", "brand", "social media", "creator", "video editing",
      "audience", "tiktok", "posts", "personal brand", "copywriting", "hooks"
    ],
    weeks: "6 weeks",
    tasks: [
      "Batch 3 pieces of content",
      "Study one high-performing post",
      "Write 5 hooks",
      "Review last week's analytics"
    ],
    today: "Write 5 different hooks for one idea, then pick your favorite.",
    resourceQuery: "content strategy for beginners",
  },
  {
    id: "fitness",
    label: "Fitness & Strength",
    category: "Fitness",
    concepts: [
      "fitness", "gym", "workout", "strength", "weight loss", "exercise", "muscle",
      "fat loss", "cardio", "stamina", "training", "diet", "nutrition", "physique"
    ],
    weeks: "6 weeks",
    tasks: [
      "3 strength sessions this week",
      "Track meals loosely, no restriction",
      "Sleep 7+ hours",
      "Walk 20 min daily"
    ],
    today: "Do a 20-minute full-body session — squats, push-ups, rows, plank.",
    resourceQuery: "beginner strength training program",
  },
  {
    id: "meditation",
    label: "Meditation & Mindfulness",
    category: "Meditation",
    concepts: [
      "meditation", "mindfulness", "stress", "anxiety", "sleep", "calm", "mental health",
      "overwhelm", "burnout", "breathwork", "peace", "focus", "rest"
    ],
    weeks: "6 weeks",
    tasks: [
      "10 min of daily breathwork",
      "One evening wind-down routine",
      "Notice 3 stress triggers",
      "One screen-free hour before bed"
    ],
    today: "Sit for 5 minutes and just follow your breath — nothing else.",
    resourceQuery: "beginner guided meditation",
  },
  {
    id: "languages",
    label: "Languages & Fluency",
    category: "Languages",
    concepts: [
      "language", "ielts", "toefl", "english", "spoken english", "fluency", "accent",
      "vocabulary", "grammar", "spanish", "french", "german", "conversation practice"
    ],
    weeks: "6 weeks",
    tasks: [
      "15 min of speaking practice daily",
      "Learn 10 new words",
      "Watch one native-speaker video",
      "Record yourself once"
    ],
    today: "Speak out loud for 3 minutes about your day, no notes.",
    resourceQuery: "ielts speaking practice",
  },
  {
    id: "cloud",
    label: "Cloud Computing & DevOps",
    category: "Coding",
    concepts: [
      "cloud", "aws", "devops", "system design", "infrastructure", "docker", "kubernetes",
      "ci/cd", "deployment", "serverless", "architecture", "microservices"
    ],
    weeks: "8 weeks",
    tasks: [
      "Deploy one small project to the cloud",
      "Learn one core AWS service in depth",
      "Read a real system design case",
      "Review your architecture with someone"
    ],
    today: "Deploy a small app to the cloud end-to-end, start to finish.",
    resourceQuery: "cloud computing for beginners aws",
  },
];

/* ── N-gram & Semantic Similarity Engine ─────────────────────────────── */

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

function computeSimilarityScore(queryTokens: string[], conceptTokens: string[]): number {
  let score = 0;
  for (const q of queryTokens) {
    for (const c of conceptTokens) {
      if (q === c) {
        score += 3;
      } else if (q.includes(c) || c.includes(q)) {
        score += 1.5;
      }
    }
  }
  return score;
}

export function matchSemanticTopic(query: string, activeGoalId?: string): SemanticTopic | null {
  const qTokens = tokenize(query);
  if (qTokens.length === 0) return null;

  let bestTopic: SemanticTopic | null = null;
  let maxScore = 0;

  for (const topic of SEMANTIC_TOPICS) {
    const conceptTokens = topic.concepts.flatMap(tokenize);
    const score = computeSimilarityScore(qTokens, conceptTokens);

    if (score > maxScore) {
      maxScore = score;
      bestTopic = topic;
    }
  }

  // If score is thresholded, return best topic
  if (maxScore >= 2.5 && bestTopic) {
    return bestTopic;
  }

  // Fallback to active goal if query is generic
  if (activeGoalId) {
    const fallback = SEMANTIC_TOPICS.find((t) => t.id === activeGoalId || t.category.toLowerCase().includes(activeGoalId.toLowerCase()));
    if (fallback) return fallback;
  }

  return null;
}

export function detectIntent(query: string): CoachIntent {
  const q = query.toLowerCase();

  // Progress check
  if (/what should i do (today|next)|my progress|today's task/i.test(q)) {
    return "PROGRESS_CHECK";
  }

  // Frustration / Anxiety / Confusion
  if (
    /freeze|nervous|anxious|anxiety|stuck|struggling|scared|confused|overwhelmed|hard|difficult|fail|failing|scared|intimidated|can't understand|don't know where to start/i.test(
      q
    )
  ) {
    return "FRUSTRATION_CONFUSION";
  }

  // Direct Plan Request
  if (/plan|roadmap|schedule|curriculum|step by step|how long|build a plan|create a plan|path/i.test(q)) {
    return "REQUEST_PLAN";
  }

  // Mentor Reasoning
  if (/mentor|who can help|guidance|expert|coach|advisor|talk to someone/i.test(q)) {
    return "MENTOR_REASONING";
  }

  // Clarification answer (level indication)
  if (/beginner|intermediate|advanced|just starting|experienced|few months|year/i.test(q)) {
    return "CLARIFICATION_RESPONSE";
  }

  // Default to question
  return "QUESTION";
}
