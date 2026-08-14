/* ─────────────────────────────────────────────────────────────────────────
   Curated content engine — replaces generic/random YouTube search results
   with a real, hand-picked roster of well-known, high-quality creators per
   subject, prioritized by the learner's country and preferred learning
   language, and matched to their exact current milestone.

   No backend in this project (static React app, no Supabase/DB — see
   package.json), so this file is the "equivalent structure" for the
   curated_videos + path_milestones tables: a manually-seeded, versioned
   library, never fetched dynamically. user_video_progress lives in
   pathProgress.ts (per-milestone watched/XP) and savedItems.ts (saved).

   Every entry links to that creator's own YouTube search results for the
   exact milestone topic (never a single fixed video id) — same
   "never a link that can rot" pattern as GoalsPage's CURATED_STACKS, now
   attributed to a specific, deliberately-chosen, high-quality creator.
───────────────────────────────────────────────────────────────────────── */

export type CuratedCategory =
  | "coding"
  | "ai-ml"
  | "data-science"
  | "cybersecurity"
  | "cloud-devops"
  | "public-speaking"
  | "english-fluency"
  | "leadership-productivity"
  | "fitness"
  | "meditation"
  | "writing";

export const CATEGORY_LABEL: Record<CuratedCategory, string> = {
  "coding": "Coding, Full-Stack & DSA",
  "ai-ml": "AI & Machine Learning",
  "data-science": "Data Science",
  "cybersecurity": "Cyber Security",
  "cloud-devops": "Cloud & DevOps",
  "public-speaking": "Public Speaking & Communication",
  "english-fluency": "English Fluency",
  "leadership-productivity": "Leadership & Productivity",
  "fitness": "Fitness",
  "meditation": "Meditation",
  "writing": "Writing & Storytelling",
};

interface Creator {
  name: string;
  region: "IN" | "Global";
  langs: Array<"English" | "Hindi">;
  style: string;          // one-line description of teaching style/strength
  typicalLength: string;  // representative lesson length for this creator
  priority: number;       // lower = shown first when other signals tie
}

/* Exactly the roster requested — the only creators Starfix will ever
   recommend for these subjects. No random channels, no clickbait, no
   shorts, no reaction content, no low-subscriber or unverified channels. */
const CREATORS: Record<CuratedCategory, Creator[]> = {
  "coding": [
    { name: "Hitesh Choudhary", region: "IN", langs: ["Hindi"], priority: 1, style: "Practical, project-based courses (Chai aur Code) that build real apps end to end", typicalLength: "45–70 min" },
    { name: "Love Babbar", region: "IN", langs: ["Hindi"], priority: 2, style: "The most widely-used, extremely structured DSA sheet and playlist in India", typicalLength: "40–60 min" },
    { name: "CodeWithHarry", region: "IN", langs: ["Hindi"], priority: 3, style: "Beginner-friendly, extremely popular full-course tutorials with a gentle learning curve", typicalLength: "45–90 min" },
    { name: "Striver", region: "IN", langs: ["Hindi", "English"], priority: 4, style: "The A2Z DSA course — the single most recommended structured DSA roadmap", typicalLength: "40–65 min" },
    { name: "Akshay Saini", region: "IN", langs: ["English"], priority: 5, style: "Deep, rigorous fundamentals (Namaste JavaScript) — teaches how things actually work under the hood", typicalLength: "35–55 min" },
    { name: "Kunal Kushwaha", region: "IN", langs: ["English"], priority: 6, style: "Community-driven, structured DSA and open-source bootcamps with strong peer accountability", typicalLength: "50–80 min" },
  ],
  "ai-ml": [
    { name: "Krish Naik", region: "IN", langs: ["Hindi", "English"], priority: 1, style: "End-to-end ML/AI playlists that go from math foundations to deployment", typicalLength: "45–70 min" },
    { name: "CampusX", region: "IN", langs: ["Hindi"], priority: 2, style: "100-day structured ML/AI series with a genuine beginner-to-advanced arc", typicalLength: "50–80 min" },
    { name: "Andrej Karpathy", region: "Global", langs: ["English"], priority: 3, style: "Builds neural networks from scratch, line by line — unmatched depth on how ML actually works", typicalLength: "60–120 min" },
    { name: "DeepLearningAI", region: "Global", langs: ["English"], priority: 4, style: "Andrew Ng's rigorous, industry-standard specializations on ML and deep learning", typicalLength: "40–60 min" },
  ],
  "data-science": [
    { name: "CampusX", region: "IN", langs: ["Hindi"], priority: 1, style: "Structured, project-driven data science curriculum from statistics to ML pipelines", typicalLength: "50–80 min" },
    { name: "Krish Naik", region: "IN", langs: ["Hindi", "English"], priority: 2, style: "Practical data science workflows covering the full pipeline end to end", typicalLength: "45–70 min" },
    { name: "StatQuest", region: "Global", langs: ["English"], priority: 3, style: "The clearest statistics and ML-math explanations available anywhere, with memorable visuals", typicalLength: "10–25 min" },
  ],
  "cybersecurity": [
    { name: "NetworkChuck", region: "Global", langs: ["English"], priority: 1, style: "Energetic, hands-on networking and security fundamentals with real lab walkthroughs", typicalLength: "20–40 min" },
    { name: "John Hammond", region: "Global", langs: ["English"], priority: 2, style: "In-depth CTF walkthroughs and malware analysis — real practical security skills", typicalLength: "25–45 min" },
    { name: "freeCodeCamp", region: "Global", langs: ["English"], priority: 3, style: "Complete, structured full-course certifications covering security from zero", typicalLength: "3–8 hr course" },
  ],
  "cloud-devops": [
    { name: "Abhishek Veeramalla", region: "IN", langs: ["English"], priority: 1, style: "Zero-to-hero DevOps and cloud playlists built specifically for job-ready skills", typicalLength: "30–60 min" },
    { name: "TechWorld with Nana", region: "Global", langs: ["English"], priority: 2, style: "Extremely clear, structured DevOps and Kubernetes courses used industry-wide", typicalLength: "20–45 min" },
    { name: "freeCodeCamp", region: "Global", langs: ["English"], priority: 3, style: "Complete, structured full-course certifications covering cloud and DevOps from zero", typicalLength: "3–8 hr course" },
  ],
  "public-speaking": [
    { name: "Josh Talks", region: "IN", langs: ["Hindi", "English"], priority: 1, style: "Real Indian speaker stories that model authentic, confident public speaking", typicalLength: "10–18 min" },
    { name: "Sandeep Maheshwari", region: "IN", langs: ["Hindi"], priority: 2, style: "India's most-watched motivational speaker, teaching confidence and clear communication", typicalLength: "15–30 min" },
    { name: "Vinh Giang", region: "Global", langs: ["English"], priority: 3, style: "Sharp, practical communication and stage-presence techniques", typicalLength: "10–20 min" },
    { name: "TED", region: "Global", langs: ["English"], priority: 4, style: "The world's benchmark for structured, high-impact public speaking", typicalLength: "10–18 min" },
  ],
  "english-fluency": [
    { name: "BBC Learning English", region: "Global", langs: ["English"], priority: 1, style: "The global gold standard for structured English lessons at every level", typicalLength: "10–20 min" },
    { name: "Speak English With Mr. Duncan", region: "Global", langs: ["English"], priority: 2, style: "Friendly, structured spoken-English lessons for real conversational fluency", typicalLength: "10–20 min" },
    { name: "English Adda", region: "IN", langs: ["Hindi", "English"], priority: 3, style: "Spoken English taught with Hindi explanations — built for Indian learners", typicalLength: "10–20 min" },
  ],
  "leadership-productivity": [
    { name: "Ali Abdaal", region: "Global", langs: ["English"], priority: 1, style: "Evidence-based productivity and study systems, clearly structured and practical", typicalLength: "12–22 min" },
    { name: "Thomas Frank", region: "Global", langs: ["English"], priority: 2, style: "Actionable, well-researched productivity and study techniques", typicalLength: "10–18 min" },
    { name: "Simon Sinek", region: "Global", langs: ["English"], priority: 3, style: "Foundational leadership thinking — clarity of purpose and how great leaders operate", typicalLength: "12–20 min" },
    { name: "Andrew Huberman", region: "Global", langs: ["English"], priority: 4, style: "Science-based protocols for focus, motivation, and performance", typicalLength: "40–90 min" },
  ],
  "fitness": [
    { name: "FitTuber", region: "IN", langs: ["Hindi"], priority: 1, style: "Science-backed fitness advice built specifically around Indian diets and lifestyles", typicalLength: "12–22 min" },
    { name: "BeerBiceps", region: "IN", langs: ["Hindi", "English"], priority: 2, style: "Practical, motivating fitness and lifestyle content for Indian beginners", typicalLength: "12–20 min" },
    { name: "Jeremy Ethier", region: "Global", langs: ["English"], priority: 3, style: "Rigorously science-based strength training and physique guidance", typicalLength: "10–18 min" },
  ],
  "meditation": [
    { name: "Sadhguru", region: "IN", langs: ["English", "Hindi"], priority: 1, style: "Deep, widely-trusted meditation and inner-wellbeing teaching for Indian audiences", typicalLength: "10–20 min" },
    { name: "Headspace", region: "Global", langs: ["English"], priority: 2, style: "The gold-standard guided meditation methodology, structured and beginner-friendly", typicalLength: "10–20 min" },
    { name: "HealthyGamerGG", region: "Global", langs: ["English"], priority: 3, style: "Mental-health-informed mindfulness grounded in real psychiatric expertise", typicalLength: "15–30 min" },
  ],
  "writing": [
    { name: "Write with Abhishek", region: "IN", langs: ["Hindi", "English"], priority: 1, style: "Writing and storytelling fundamentals explained with Hindi support", typicalLength: "10–18 min" },
    { name: "Ship 30 for 30", region: "Global", langs: ["English"], priority: 2, style: "Structured, habit-driven writing practice built around shipping daily", typicalLength: "8–15 min" },
    { name: "Shaan Puri", region: "Global", langs: ["English"], priority: 3, style: "Sharp storytelling and idea-generation frameworks from a working writer", typicalLength: "15–30 min" },
    { name: "Nicolas Cole", region: "Global", langs: ["English"], priority: 4, style: "Professional ghostwriting and online-writing craft, taught systematically", typicalLength: "12–22 min" },
  ],
};

/* Maps a Growth Path id (from GoalsPage's PATHS) to one of the curated
   categories above. Paths not listed here fall back to the pre-existing
   generic CURATED_STACKS resource stack — this roster only covers the
   subjects with an explicitly-vetted creator list. */
const PATH_CATEGORY_MAP: Record<string, CuratedCategory> = {
  coding: "coding", webdev: "coding", appdev: "coding", dsa: "coding",
  "system-design": "coding", "open-source": "coding", blockchain: "coding",
  "ai-ml": "ai-ml",
  "data-science": "data-science",
  cybersecurity: "cybersecurity",
  cloud: "cloud-devops", devops: "cloud-devops",
  "public-speaking": "public-speaking", "communication-skills": "public-speaking", eq: "public-speaking",
  ielts: "english-fluency", "language-learning": "english-fluency",
  "career-growth": "leadership-productivity", "interview-prep": "leadership-productivity",
  leadership: "leadership-productivity", productivity: "leadership-productivity",
  "time-mgmt": "leadership-productivity", "deep-work": "leadership-productivity",
  "self-discipline": "leadership-productivity",
  "weight-loss": "fitness", "muscle-building": "fitness", running: "fitness", yoga: "fitness",
  nutrition: "fitness", "healthy-eating": "fitness", "home-workout": "fitness", "gym-training": "fitness",
  cycling: "fitness", stretching: "fitness", sleep: "fitness",
  meditation: "meditation", mindfulness: "meditation", "stress-mgmt": "meditation",
  "habit-building": "meditation", "positive-thinking": "meditation", focus: "meditation", minimalism: "meditation",
  writing: "writing", "reading-habit": "writing", "personal-branding": "writing",
};

export function curatedCategoryForPath(pathId: string): CuratedCategory | undefined {
  return PATH_CATEGORY_MAP[pathId];
}

export type LearningLanguage = "English" | "Hindi" | "Both";

/* ── Phase 4 — country-aware recommendation engine ───────────────────────
   Deterministic, never random. Filters by category (path + milestone are
   applied by the caller via difficulty/query), then ranks every candidate
   creator by:
     1. region match   (learner's country vs creator's region)
     2. language match (learner's preferred language vs creator's langs)
     3. priority        (hand-set editorial ranking within the roster)
     4. shortest useful duration for beginners (ties only)
   Never changes on refresh for the same inputs — the caller persists the
   resulting pick per user + milestone (see pathProgress.ts). */
function regionScore(creator: Creator, isIndia: boolean): number {
  if (isIndia) return creator.region === "IN" ? 0 : 1;
  return creator.region === "Global" ? 0 : 1;
}
function languageScore(creator: Creator, language?: LearningLanguage): number {
  if (!language || language === "Both") return creator.langs.includes("Hindi") ? 0 : 1;
  return creator.langs.includes(language) ? 0 : 1;
}
function minutesFromRange(range: string): number {
  const match = range.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : 30;
}

function rankedCreators(category: CuratedCategory, country?: string, language?: LearningLanguage): Creator[] {
  const pool = [...CREATORS[category]];
  const isIndia = (country || "").trim().toLowerCase() === "india";
  return pool.sort((a, b) => {
    const region = regionScore(a, isIndia) - regionScore(b, isIndia);
    if (region !== 0) return region;
    const lang = languageScore(a, language) - languageScore(b, language);
    if (lang !== 0) return lang;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return minutesFromRange(a.typicalLength) - minutesFromRange(b.typicalLength);
  });
}

/* ── Phase 5 — the actual pick, matched to a specific milestone ──────────
   Never a random/fetched link: the "video" is this creator's own curated
   playlist/search page for the exact milestone topic, so it can never
   rot even though it's dynamically generated per path + milestone. */
export interface CuratedVideoPick {
  creator: string;
  title: string;
  url: string;
  duration: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  why: string;
  /* Present only when the learner's language is "Both" — the alternate
     -language creator to offer via the Hindi/English toggle (Phase 5). */
  alternate?: { creator: string; title: string; url: string; duration: string };
}

function difficultyForIndex(i: number): "Beginner" | "Intermediate" | "Advanced" {
  if (i <= 1) return "Beginner";
  if (i <= 3) return "Intermediate";
  return "Advanced";
}

function ytSearchUrl(creator: string, query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${creator} ${query}`)}`;
}

function reasonFor(creator: Creator, milestoneTitle: string, pathTitle: string): string {
  return `Chosen because ${creator.name} is a trusted, structured teacher for ${pathTitle.toLowerCase()} — ${creator.style.toLowerCase()}. This lesson maps directly to your current milestone: "${milestoneTitle}."`;
}

function pickFromRanked(
  ranked: Creator[],
  milestoneIndex: number,
  milestoneTitle: string,
  pathTitle: string,
  category: CuratedCategory
): CuratedVideoPick | undefined {
  if (!ranked.length) return undefined;
  const creator = ranked[milestoneIndex % ranked.length];
  return {
    creator: creator.name,
    title: `${milestoneTitle} — ${CATEGORY_LABEL[category]}`,
    url: ytSearchUrl(creator.name, milestoneTitle),
    duration: creator.typicalLength,
    difficulty: difficultyForIndex(milestoneIndex),
    why: reasonFor(creator, milestoneTitle, pathTitle),
  };
}

interface PickArgs {
  pathId: string;
  pathTitle: string;
  milestoneIndex: number;
  milestoneTitle: string;
  country?: string;
  language?: LearningLanguage;
}

/* The main entry point — picks the single best video for this learner's
   exact milestone, ranked per Phase 4's region → language → priority →
   duration order. When language is "Both", also attaches the alternate
   -language pick so the workspace can offer a Hindi/English toggle
   without a second lookup. */
export function pickCuratedVideo(args: PickArgs): CuratedVideoPick | undefined {
  const category = curatedCategoryForPath(args.pathId);
  if (!category) return undefined;
  const ranked = rankedCreators(category, args.country, args.language);
  const primary = pickFromRanked(ranked, args.milestoneIndex, args.milestoneTitle, args.pathTitle, category);
  if (!primary) return undefined;

  if (args.language === "Both") {
    const englishOnly = ranked.filter((c) => c.langs.includes("English") && c.name !== primary.creator);
    const alt = englishOnly[args.milestoneIndex % Math.max(englishOnly.length, 1)];
    if (alt) {
      primary.alternate = {
        creator: alt.name,
        title: `${args.milestoneTitle} — ${CATEGORY_LABEL[category]}`,
        url: ytSearchUrl(alt.name, args.milestoneTitle),
        duration: alt.typicalLength,
      };
    }
  }
  return primary;
}

interface NextPickArgs {
  pathId: string;
  pathTitle: string;
  nextMilestoneIndex: number;
  nextMilestoneTitle: string;
  country?: string;
  language?: LearningLanguage;
}

/* A lighter-weight lookup for the "up next" preview shown once the
   current milestone's video is marked watched — same ranking, no
   alternate-language pairing needed since it's just a preview. */
export function pickNextCuratedVideo(args: NextPickArgs): CuratedVideoPick | undefined {
  return pickCuratedVideo({
    pathId: args.pathId,
    pathTitle: args.pathTitle,
    milestoneIndex: args.nextMilestoneIndex,
    milestoneTitle: args.nextMilestoneTitle,
    country: args.country,
    language: args.language,
  });
}
