/* ─── Mentor Detail — category-adaptive extras ─────────────────────────
   Sits alongside mentorData.ts. Two things live here:
   1) CATEGORY_CONFIG — per-category labels/icons so the profile page reads
      like it was built for that field, not a generic template.
   2) MENTOR_EXTRA — per-mentor experience timeline + real outcome results,
      plus session-type cards (name/duration/includes/price/popular). */

export interface TimelineItem { role: string; org: string; duration: string; detail: string; }
export interface ResultCard { metric: string; label: string; detail: string; }
export interface SessionType { name: string; duration: string; includes: string[]; price: string; popular?: boolean; }

export interface MentorExtra {
  timeline: TimelineItem[];
  results: ResultCard[];
  sessions: SessionType[];
}

export interface CategoryConfig {
  helpWithLabel: string;
  resultsLabel: string;
  sessionLabel: string;
  fieldNote: string; // one line shown near the hero, category flavor
}

export const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  "AI/ML":           { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Model reviews, research reading, and interview prep" },
  "Entrepreneurship":{ helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Founder Outcomes", sessionLabel: "Session Types", fieldNote: "Growth strategy, fundraising, and go-to-market" },
  "UI/UX":           { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Portfolio reviews, design systems, and case studies" },
  "Finance":         { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Budgeting, investing, and long-term planning" },
  "Coding":          { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Code review, system design, and placement prep" },
  "Languages":       { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Speaking fluency, exam strategy, and confidence" },
  "Content":         { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Creator Outcomes", sessionLabel: "Session Types", fieldNote: "Content systems, strategy, and analytics" },
  "Communication":   { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Student Outcomes", sessionLabel: "Session Types", fieldNote: "Speaking practice, confidence, and storytelling" },
  "Fitness":         { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Transformation Results", sessionLabel: "Session Types", fieldNote: "Training, nutrition, and habit building" },
  "Meditation":      { helpWithLabel: "What This Mentor Can Help You With", resultsLabel: "Wellness Outcomes", sessionLabel: "Session Types", fieldNote: "Breathwork, stress reduction, and sleep" },
};

export const MENTOR_EXTRA: Record<number, MentorExtra> = {
  1: { // Aria Chen — AI/ML
    timeline: [
      { role: "ML Engineer", org: "Google Search", duration: "2021 — Present", detail: "Ranking and recommendation models serving billions of queries." },
      { role: "Applied ML Lead", org: "Series B startup", duration: "2019 — 2021", detail: "Built the first fraud-detection model from scratch." },
      { role: "Backend Engineer", org: "Freelance", duration: "2018 — 2019", detail: "Where the pull toward ML began, via a fraud-detection side project." },
    ],
    results: [
      { metric: "6 weeks", label: "Landed an ML internship", detail: "A self-taught engineer went from tutorials to a paid internship offer." },
      { metric: "3 papers", label: "Can now read research independently", detail: "Went from skimming abstracts to implementing papers from scratch." },
      { metric: "4 offers", label: "Passed ML system design rounds", detail: "Structured mock interviews turned a weak spot into a strength." },
    ],
    sessions: [
      { name: "Doubt Session", duration: "30 min", includes: ["Ask anything blocking you", "Quick code or math review"], price: "₹1,299" },
      { name: "Model Review", duration: "60 min", includes: ["Review your training run", "Debug convergence issues", "Next-step plan"], price: "₹2,500", popular: true },
      { name: "Mock ML Interview", duration: "60 min", includes: ["System design round", "Coding round", "Written feedback"], price: "₹2,800" },
      { name: "Full Roadmap", duration: "Monthly", includes: ["4 sessions", "Async support", "Portfolio review"], price: "₹8,999" },
    ],
  },
  2: { // Marcus Webb — Entrepreneurship
    timeline: [
      { role: "Growth Advisor", org: "a16z Portfolio", duration: "2020 — Present", detail: "Advises 40+ early-stage founders on distribution and growth." },
      { role: "Co-founder", org: "Acquired startup (2019)", duration: "2016 — 2019", detail: "Grew to acquisition through channel testing, not paid ads." },
      { role: "Co-founder", org: "First startup (2014)", duration: "2012 — 2015", detail: "First exit — where the growth obsession started." },
    ],
    results: [
      { metric: "+40%", label: "Activation lift from onboarding fix", detail: "Diagnosed the real bottleneck instead of chasing more ad spend." },
      { metric: "Seed round", label: "Closed after 2 deck sessions", detail: "Rebuilt narrative and traction slide from scratch." },
      { metric: "3x", label: "Signup rate after channel test", detail: "Found the one channel worth doubling down on." },
    ],
    sessions: [
      { name: "Quick Advice", duration: "30 min", includes: ["One focused problem", "Direct recommendation"], price: "₹1,899" },
      { name: "Growth Strategy", duration: "60 min", includes: ["Deep dive on your metrics", "Channel prioritization"], price: "₹3,200", popular: true },
      { name: "Deck Review", duration: "60 min", includes: ["Line-by-line deck feedback", "Narrative rebuild"], price: "₹3,200" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Plan review", "Async access"], price: "₹10,999" },
    ],
  },
  3: { // Priya Sharma — UI/UX
    timeline: [
      { role: "Design Lead", org: "Figma", duration: "2022 — Present", detail: "Leads design on Figma's own design tooling." },
      { role: "Senior Product Designer", org: "Fintech scale-up", duration: "2019 — 2022", detail: "Owned onboarding and payments flows end to end." },
  { role: "Print & Brand Designer", org: "Freelance", duration: "2016 — 2019", detail: "Where the eye for hierarchy and type was built." },
    ],
    results: [
      { metric: "1 month", label: "Portfolio started getting callbacks", detail: "Rebuilt case study structure from scratch." },
      { metric: "3 hires", label: "Students placed at design-led startups", detail: "Mock interviews plus targeted portfolio work." },
      { metric: "2x faster", label: "Component reuse after system rebuild", detail: "A real design system replaced one-off screens." },
    ],
    sessions: [
      { name: "Portfolio Quick-Look", duration: "30 min", includes: ["Fast feedback on your portfolio"], price: "Free" },
      { name: "Design Teaching Session", duration: "60 min", includes: ["Live Figma teaching", "Systems thinking"], price: "₹2,200", popular: true },
      { name: "Case Study Review", duration: "60 min", includes: ["Structure and storytelling pass", "Written notes"], price: "₹2,200" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Async critique"], price: "₹7,499" },
    ],
  },
  4: { // Daniel Park — Finance
    timeline: [
      { role: "Certified Financial Planner", org: "Fidelity", duration: "2016 — Present", detail: "Builds long-term financial plans for individual clients." },
      { role: "Institutional Analyst", org: "Regional bank", duration: "2012 — 2016", detail: "Moved to individual planning after finding institutional work impersonal." },
      { role: "Finance Trainee", org: "Local credit union", duration: "2010 — 2012", detail: "First exposure to how differently people relate to money." },
    ],
    results: [
      { metric: "2 cards", label: "Paid off using prioritization method", detail: "A simple order-of-attack plan replaced anxiety with a checklist." },
      { metric: "6 weeks", label: "Built a working monthly budget", detail: "From avoidance to a system that runs itself." },
      { metric: "18%", label: "Increase in monthly savings rate", detail: "Small automated changes, not drastic cuts." },
    ],
    sessions: [
      { name: "Single Question", duration: "30 min", includes: ["One focused topic"], price: "₹999" },
      { name: "Full Planning Session", duration: "60 min", includes: ["Budget review", "Goal setting"], price: "₹1,800", popular: true },
      { name: "Portfolio Review", duration: "60 min", includes: ["Asset allocation check", "Tax-efficiency review"], price: "₹1,800" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Plan review"], price: "₹5,999" },
    ],
  },
  5: { // Sofia Torres — Coding
    timeline: [
      { role: "Software Engineer", org: "Stripe", duration: "2022 — Present", detail: "Builds payments infrastructure used by millions of businesses." },
      { role: "Backend Engineer", org: "Mid-size startup", duration: "2020 — 2022", detail: "First engineering role after a coding bootcamp." },
      { role: "Bootcamp Graduate", org: "Self-taught → bootcamp", duration: "2019 — 2020", detail: "Career-switched from a non-technical background." },
    ],
    results: [
      { metric: "2 onsites", label: "Passed after system design coaching", detail: "Whiteboard practice turned a weak round into a strength." },
      { metric: "1 project", label: "Finally shipped, not abandoned", detail: "Right-sized scope made it finishable." },
      { metric: "4 weeks", label: "Fixed recurring production bugs", detail: "Testing habits replaced guess-and-check debugging." },
    ],
    sessions: [
      { name: "Quick Code Review", duration: "30 min", includes: ["Review one PR or file"], price: "Free" },
      { name: "Teaching Session", duration: "60 min", includes: ["Live coding + explanation", "Q&A"], price: "₹2,000", popular: true },
      { name: "Mock Interview", duration: "60 min", includes: ["Coding round", "System design basics", "Written feedback"], price: "₹2,000" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Async review"], price: "₹6,999" },
    ],
  },
  6: { // Rahul Gupta — Languages / IELTS
    timeline: [
      { role: "Senior IELTS Trainer", org: "British Council", duration: "2018 — Present", detail: "Trained thousands of candidates for IELTS and TOEFL." },
      { role: "Workplace English Coach", org: "Corporate clients", duration: "2015 — 2018", detail: "Expanded into business English for relocating professionals." },
      { role: "Classroom English Teacher", org: "Language institute", duration: "2012 — 2015", detail: "Where the focus on speaking practice over grammar drills began." },
    ],
    results: [
      { metric: "6.5 → 8", label: "IELTS band score improvement", detail: "Speaking drills made the biggest single difference." },
      { metric: "6 weeks", label: "Noticeably more confident in meetings", detail: "Business English coaching applied directly to real work calls." },
      { metric: "1 attempt", label: "Cleared TOEFL without a retake", detail: "Full mock test caught every weak area beforehand." },
    ],
    sessions: [
      { name: "Speaking Practice", duration: "30 min", includes: ["Focused speaking drill"], price: "₹599" },
      { name: "Full Lesson", duration: "60 min", includes: ["Speaking + writing feedback"], price: "₹1,200", popular: true },
      { name: "Mock Test", duration: "90 min", includes: ["Full exam simulation", "Score breakdown"], price: "₹1,500" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Daily feedback"], price: "₹4,299" },
    ],
  },
  7: { // Emma Walsh — Content
    timeline: [
      { role: "Content Strategy Lead", org: "HubSpot", duration: "2021 — Present", detail: "Oversees content strategy across multiple product lines." },
      { role: "Brand Marketer", org: "D2C startup", duration: "2018 — 2021", detail: "Grew three brand channels from zero to six figures." },
      { role: "Freelance Writer", org: "Self-employed", duration: "2016 — 2018", detail: "Where the interest in content systems started." },
    ],
    results: [
      { metric: "3 pillars", label: "Replaced random posting with a system", detail: "Growth followed within weeks of the pillar rebuild." },
      { metric: "2x reach", label: "After hook-writing overhaul", detail: "Same content, dramatically better opening lines." },
      { metric: "4 hrs", label: "A month of content, batched in one sitting", detail: "Systemized production instead of daily scrambling." },
    ],
    sessions: [
      { name: "Content Audit", duration: "30 min", includes: ["Quick review of your channel"], price: "₹1,100" },
      { name: "Strategy Session", duration: "60 min", includes: ["Full content system build"], price: "₹2,000", popular: true },
      { name: "Analytics Review", duration: "60 min", includes: ["What's working, what isn't"], price: "₹2,000" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Async review"], price: "₹6,499" },
    ],
  },
  8: { // Kenji Nakamura — Communication
    timeline: [
      { role: "Executive Communication Coach", org: "Independent / TEDx Speaker", duration: "2017 — Present", detail: "Coaches executives before major keynotes and talks." },
      { role: "Corporate Trainer", org: "Fortune 500 clients", duration: "2013 — 2017", detail: "Ran workshops on presentation skills for large teams." },
      { role: "Overcame a stutter", org: "Personal journey", duration: "Years of practice", detail: "The lived experience that shapes his patient coaching style." },
    ],
    results: [
      { metric: "1st talk", label: "Delivered first public speech, nerves and all", detail: "Breathing techniques made the biggest early difference." },
      { metric: "Board room", label: "Landed a high-stakes presentation", detail: "Kenji's structure made a board presentation land clearly." },
      { metric: "6 weeks", label: "From dreading talks to enjoying them", detail: "Structured practice replaced generic confidence advice." },
    ],
    sessions: [
      { name: "Practice Run", duration: "30 min", includes: ["Focused speaking practice"], price: "₹1,500" },
      { name: "Coaching Session", duration: "60 min", includes: ["Full talk coaching", "Recorded feedback"], price: "₹2,800", popular: true },
      { name: "Interview Simulation", duration: "60 min", includes: ["Mock interview", "Body language notes"], price: "₹2,800" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Talk prep"], price: "₹9,499" },
    ],
  },
  9: { // Jake Morrison — Fitness
    timeline: [
      { role: "Certified Personal Trainer", org: "Equinox", duration: "2019 — Present", detail: "Builds sustainable strength and fat-loss programs." },
      { role: "Sports Coach", org: "College athletics", duration: "2016 — 2019", detail: "Coached performance training before moving to general fitness." },
      { role: "Certification", org: "NASM-CPT", duration: "2015", detail: "Where the adherence-first philosophy started forming." },
    ],
    results: [
      { metric: "8 kg", label: "Lost in 3 months, sustainably", detail: "No crash dieting — still going strong months later." },
      { metric: "3 months", label: "First pull-up achieved", detail: "Progressive overload plan built around a busy schedule." },
      { metric: "Zero", label: "Missed weeks despite heavy travel", detail: "A program built around real life, not an ideal week." },
    ],
    sessions: [
      { name: "Form Check-In", duration: "30 min", includes: ["Quick form review"], price: "₹899" },
      { name: "Training Session", duration: "60 min", includes: ["Full session", "Program adjustment"], price: "₹1,500", popular: true },
      { name: "Nutrition Review", duration: "45 min", includes: ["Meal pattern review", "Simple targets"], price: "₹1,200" },
      { name: "Monthly Coaching", duration: "Monthly", includes: ["4 sessions", "Weekly plan"], price: "₹5,299" },
    ],
  },
  10: { // Leela Anand — Meditation
    timeline: [
      { role: "Mindfulness Teacher", org: "Headspace", duration: "2020 — Present", detail: "Teaches secular, practical mindfulness for busy professionals." },
      { role: "MBSR Practitioner", org: "Independent training", duration: "2018 — 2020", detail: "Trained in mindfulness-based stress reduction after burnout." },
      { role: "High-pressure career", org: "Corporate role", duration: "Pre-2018", detail: "The burnout that started her own practice." },
    ],
    results: [
      { metric: "6 weeks", label: "Noticeably reduced day-to-day anxiety", detail: "No incense, no jargon — just a repeatable practice." },
      { metric: "Faster", label: "Falling asleep with a wind-down routine", detail: "A short evening routine changed sleep onset time." },
      { metric: "Daily", label: "Practice that actually stuck", detail: "Small and repeatable beat long and occasional." },
    ],
    sessions: [
      { name: "Intro Practice", duration: "30 min", includes: ["A first guided session"], price: "Free" },
      { name: "Guided Session", duration: "60 min", includes: ["Full guided practice", "Personal notes"], price: "₹1,400", popular: true },
      { name: "Sleep Routine Build", duration: "45 min", includes: ["Evening wind-down plan"], price: "₹1,100" },
      { name: "Monthly Mentorship", duration: "Monthly", includes: ["4 sessions", "Daily audio"], price: "₹4,799" },
    ],
  },
};
