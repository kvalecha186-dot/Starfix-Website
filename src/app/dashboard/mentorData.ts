/* ─── Mentor Detail Data ───────────────────────────
   Rich, per-mentor content for the Mentor Details page.
   Keyed by the numeric id used in MentorsPage's MENTORS list. */

export interface RoadmapWeek { week: string; title: string; }
export interface Review { name: string; initials: string; color: string; course: string; rating: number; text: string; date: string; }
export interface FaqItem { q: string; a: string; }
export interface PricingOption { label: string; price: string; sub: string; }
export interface ContentItem { type: "Article" | "Video" | "Guide"; title: string; }

export interface MentorDetail {
  id: number;
  bio: string;
  about: string;
  learn: string[];
  learningStyle: string[]; // rendered with a fixed icon set in the page
  roadmap: RoadmapWeek[];
  reviews: Review[];
  faq: FaqItem[];
  pricing: PricingOption[];
  availability: { date: string; slots: string[] }[];
  stats: { sessions: string; students: string; successRate: string; avgRating: string; years: string };
  relatedPaths: string[];
  content: ContentItem[];
  languages: string[];
  location: string;
  responseTime: string;
  experience: string;
}

export const MENTOR_DETAILS: Record<number, MentorDetail> = {
  1: {
    id: 1,
    bio: "Aria spent six years building recommendation systems at Google before turning to teaching full-time. She specializes in taking engineers from tutorial-following to research-reading, with a focus on the fundamentals that make everything else click.",
    about: "Aria began as a backend engineer, drifted into machine learning through a fraud-detection project, and never looked back. She's shipped models to production at Google Search and later led a small applied-ML team at a Series B startup. She now mentors part-time, splitting her attention between engineers switching into ML and existing ML engineers aiming for senior roles. Her sessions favor whiteboarding over slides — she wants you to be able to derive things, not just recite them.",
    learn: [
      "PyTorch fundamentals and training loops",
      "Reading and implementing research papers",
      "Model evaluation and debugging",
      "Production ML systems and deployment",
      "Interview preparation for ML roles",
      "Building an ML portfolio that gets noticed",
    ],
    learningStyle: ["Practical Projects", "Concept First", "Weekly Feedback", "Live Sessions", "Paper Reading", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Math & PyTorch foundations" },
      { week: "Week 2", title: "Training your first models" },
      { week: "Week 3", title: "Computer vision fundamentals" },
      { week: "Week 4", title: "NLP and transformers" },
      { week: "Week 5", title: "Deployment and MLOps basics" },
      { week: "Week 6", title: "Portfolio and mock interviews" },
    ],
    reviews: [
      { name: "Rohan Mehta", initials: "RM", color: "#6366F1", course: "Deep Learning Track", rating: 5, text: "Aria has a way of explaining backprop that finally made it click after three failed attempts elsewhere. Six weeks in and I can actually read papers now.", date: "2 weeks ago" },
      { name: "Wei Chen", initials: "WC", color: "#20B2AA", course: "ML Career Switch", rating: 5, text: "I came in as a web developer with zero ML background. Aria's structure meant I never felt lost, even when the material got hard.", date: "1 month ago" },
      { name: "Amara Okoye", initials: "AO", color: "#F4A261", course: "Interview Prep", rating: 4, text: "Great technical depth. Sessions occasionally ran long, but I never minded because the content was worth it.", date: "2 months ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Most students commit to a 6-week track, though many extend into a second cycle for interview prep." },
      { q: "Will I get assignments?", a: "Yes — a short project after every session, reviewed live at the start of the next one." },
      { q: "Can I message mentor?", a: "Aria offers async chat between sessions for quick unblocking questions." },
      { q: "Do sessions get recorded?", a: "Yes, every session is recorded and shared within 24 hours." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹1,299", sub: "Quick check-in or Q&A" },
      { label: "60 min Session", price: "₹2,500", sub: "Full teaching session" },
      { label: "Monthly Mentorship", price: "₹8,999", sub: "4 sessions + async support" },
    ],
    availability: [
      { date: "Today", slots: ["4:00 PM", "6:30 PM"] },
      { date: "Tomorrow", slots: ["10:00 AM", "2:00 PM", "5:00 PM"] },
      { date: "Thu, Feb 6", slots: ["11:00 AM", "3:00 PM"] },
    ],
    stats: { sessions: "1,860", students: "1,240", successRate: "94%", avgRating: "4.9", years: "6" },
    relatedPaths: ["AI & Machine Learning", "Career Growth", "Portfolio Building"],
    content: [
      { type: "Guide",  title: "A practical roadmap into ML from a software background" },
      { type: "Video",  title: "Debugging a model that won't converge" },
      { type: "Article", title: "What ML interviewers actually look for" },
    ],
    languages: ["English", "Mandarin"],
    location: "San Francisco, US",
    responseTime: "Under 2 hours",
    experience: "8 years",
  },

  2: {
    id: 2,
    bio: "Marcus has advised over forty early-stage startups on growth and go-to-market, with three exits under his belt. He teaches founders how to find their first hundred customers without burning their runway on ads.",
    about: "After co-founding and selling two companies, Marcus joined a16z's platform team advising portfolio founders on growth. He's obsessive about distribution — the idea that a mediocre product with great distribution beats a great product with none. His mentorship leans heavily on your actual business: expect homework tied directly to your numbers, not generic frameworks.",
    learn: [
      "Finding product-market fit signals",
      "Building a repeatable acquisition channel",
      "Fundraising narrative and pitch structure",
      "Pricing and monetization strategy",
      "Hiring your first growth hire",
      "Investor updates that build trust",
    ],
    learningStyle: ["Practical Projects", "Weekly Feedback", "Live Sessions", "Career Guidance", "Case Studies", "Direct Feedback"],
    roadmap: [
      { week: "Week 1", title: "Diagnosing your growth bottleneck" },
      { week: "Week 2", title: "Channel testing framework" },
      { week: "Week 3", title: "Positioning and messaging" },
      { week: "Week 4", title: "Pricing experiments" },
      { week: "Week 5", title: "Fundraising narrative" },
      { week: "Week 6", title: "90-day growth plan" },
    ],
    reviews: [
      { name: "Divya Rao", initials: "DR", color: "#E85D75", course: "Growth Strategy", rating: 5, text: "Marcus told me my onboarding was the actual problem, not my ads. He was right — activation went up 40% after we fixed it.", date: "3 weeks ago" },
      { name: "Tomas Silva", initials: "TS", color: "#38BDF8", course: "Fundraising Prep", rating: 5, text: "Blunt, direct, exactly what a founder needs. Our seed deck went from confusing to fundable in two sessions.", date: "1 month ago" },
      { name: "Grace Kim", initials: "GK", color: "#34D399", course: "Growth Strategy", rating: 4, text: "Very high signal advice, though he expects you to come prepared with real data each week.", date: "6 weeks ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks, structured around your current stage — pre-seed founders and Series A founders get different tracks." },
      { q: "Will I get assignments?", a: "Yes, tied directly to your metrics — expect to bring real numbers to every session." },
      { q: "Can I message mentor?", a: "Limited async access for urgent, time-sensitive decisions." },
      { q: "Do sessions get recorded?", a: "On request only, since conversations often cover confidential business details." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹1,899", sub: "Focused advice on one problem" },
      { label: "60 min Session", price: "₹3,200", sub: "Deep strategy session" },
      { label: "Monthly Mentorship", price: "₹10,999", sub: "4 sessions + deck/plan review" },
    ],
    availability: [
      { date: "Tomorrow", slots: ["9:00 AM", "1:00 PM"] },
      { date: "Fri, Feb 7", slots: ["11:00 AM", "4:00 PM"] },
      { date: "Mon, Feb 10", slots: ["10:00 AM"] },
    ],
    stats: { sessions: "980", students: "890", successRate: "91%", avgRating: "4.8", years: "10" },
    relatedPaths: ["Entrepreneurship", "Career Growth", "Communication"],
    content: [
      { type: "Article", title: "The distribution-first way to think about product" },
      { type: "Guide",   title: "Writing a seed deck investors actually read" },
      { type: "Video",   title: "How to run a channel test in a week" },
    ],
    languages: ["English", "Portuguese"],
    location: "Austin, US",
    responseTime: "Same day",
    experience: "10 years",
  },

  3: {
    id: 3,
    bio: "Priya leads design at Figma and has mentored over two hundred designers into their first product roles. She teaches design as a thinking process, not a tool — Figma fluency is a side effect, not the goal.",
    about: "Priya started in print design before moving to product, and has since worked across fintech, consumer social, and now design tooling itself at Figma. She believes most junior designers over-index on visual polish and under-index on reasoning — so her mentorship is built around defending your decisions, not just making them pretty. Portfolio review is a recurring part of every track she runs.",
    learn: [
      "UI design fundamentals and systems thinking",
      "Advanced Figma and component architecture",
      "Running lightweight user research",
      "Building and defending a design system",
      "Portfolio storytelling and case studies",
      "Interviewing and presenting your work",
    ],
    learningStyle: ["Practical Projects", "Weekly Feedback", "Live Sessions", "Portfolio Review", "Concept First", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Foundations of visual hierarchy" },
      { week: "Week 2", title: "Layout and composition systems" },
      { week: "Week 3", title: "Components and design systems" },
      { week: "Week 4", title: "Prototyping and interaction" },
      { week: "Week 5", title: "Portfolio case study writing" },
      { week: "Week 6", title: "Mock design interviews" },
    ],
    reviews: [
      { name: "Ishaan Kapoor", initials: "IK", color: "#A78BFA", course: "UI/UX Foundations", rating: 5, text: "Priya rebuilt how I think about layout from scratch. My portfolio went from 'fine' to getting callbacks within a month.", date: "1 week ago" },
      { name: "Naomi Clarke", initials: "NC", color: "#F87171", course: "Portfolio Review", rating: 5, text: "The most honest feedback I've ever gotten on my work — and exactly what I needed to hear.", date: "3 weeks ago" },
      { name: "Yusuf Demir", initials: "YD", color: "#FB923C", course: "Design Systems", rating: 5, text: "Learned more about component architecture in six weeks than in two years of self-teaching.", date: "2 months ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "A standard track runs six weeks; portfolio-only reviews can be booked as single sessions." },
      { q: "Will I get assignments?", a: "Yes — a design exercise each week, critiqued live at the start of the following session." },
      { q: "Can I message mentor?", a: "Yes, for quick feedback on iterations between sessions." },
      { q: "Do sessions get recorded?", a: "Yes, with your Figma file link included for later reference." },
    ],
    pricing: [
      { label: "30 min Session", price: "Free", sub: "Portfolio quick-look" },
      { label: "60 min Session", price: "₹2,200", sub: "Full teaching session" },
      { label: "Monthly Mentorship", price: "₹7,499", sub: "4 sessions + async critique" },
    ],
    availability: [
      { date: "Today", slots: ["12:00 PM", "3:30 PM", "7:00 PM"] },
      { date: "Wed, Feb 5", slots: ["10:00 AM", "1:00 PM"] },
      { date: "Sat, Feb 8", slots: ["11:00 AM"] },
    ],
    stats: { sessions: "3,240", students: "2,100", successRate: "97%", avgRating: "5.0", years: "8" },
    relatedPaths: ["UI Design", "Career Growth", "Portfolio", "Communication"],
    content: [
      { type: "Guide",  title: "Building a design system from zero" },
      { type: "Video",  title: "Live portfolio teardown: before & after" },
      { type: "Article", title: "Why your case studies aren't landing interviews" },
    ],
    languages: ["English", "Hindi"],
    location: "Bengaluru, India",
    responseTime: "Under 3 hours",
    experience: "8 years",
  },

  4: {
    id: 4,
    bio: "Daniel is a CFP with a decade at Fidelity helping individuals build long-term financial plans. He teaches personal finance the way he wishes someone had taught him — without jargon, without judgment.",
    about: "Daniel spent his early career in institutional finance before moving to individual planning, where he found the work more meaningful. He now splits his time between client work and mentoring people who want to understand their own money instead of outsourcing every decision. Expect spreadsheets, not motivational talk — his sessions are grounded in your actual numbers.",
    learn: [
      "Building a personal budget that sticks",
      "Investing fundamentals and asset allocation",
      "Tax-efficient saving strategies",
      "Understanding retirement accounts",
      "Reading and negotiating your first offer",
      "Debt payoff strategy and prioritization",
    ],
    learningStyle: ["Concept First", "Weekly Feedback", "Assignments", "Live Sessions", "Case Studies", "Direct Feedback"],
    roadmap: [
      { week: "Week 1", title: "Where your money actually goes" },
      { week: "Week 2", title: "Building your budget system" },
      { week: "Week 3", title: "Investing fundamentals" },
      { week: "Week 4", title: "Tax-advantaged accounts" },
      { week: "Week 5", title: "Debt strategy" },
      { week: "Week 6", title: "Your 12-month financial plan" },
    ],
    reviews: [
      { name: "Meera Iyer", initials: "MI", color: "#F4A261", course: "Personal Finance Basics", rating: 5, text: "I'd avoided looking at my finances for years out of anxiety. Daniel made it feel manageable, not scary.", date: "2 weeks ago" },
      { name: "Chris Bennett", initials: "CB", color: "#6366F1", course: "Investing Fundamentals", rating: 4, text: "Very thorough and patient. Would've liked slightly more focus on index investing specifically.", date: "1 month ago" },
      { name: "Fatima Noor", initials: "FN", color: "#20B2AA", course: "Debt Strategy", rating: 5, text: "Paid off two credit cards using his prioritization method. Simple, clear, effective.", date: "2 months ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks covers the core plan; some students book monthly check-ins after." },
      { q: "Will I get assignments?", a: "Yes — a small financial exercise each week using your own numbers." },
      { q: "Can I message mentor?", a: "Yes, for quick clarifying questions between sessions." },
      { q: "Do sessions get recorded?", a: "Yes, since financial details are often revisited later." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹999", sub: "Single-topic question" },
      { label: "60 min Session", price: "₹1,800", sub: "Full planning session" },
      { label: "Monthly Mentorship", price: "₹5,999", sub: "4 sessions + plan review" },
    ],
    availability: [
      { date: "This week", slots: ["Tue 5:00 PM", "Thu 6:00 PM"] },
      { date: "Next week", slots: ["Mon 4:00 PM", "Wed 5:30 PM"] },
    ],
    stats: { sessions: "640", students: "567", successRate: "89%", avgRating: "4.7", years: "10" },
    relatedPaths: ["Personal Finance", "Career Growth"],
    content: [
      { type: "Guide",  title: "A first-timer's guide to retirement accounts" },
      { type: "Article", title: "Why budgeting fails, and what to do instead" },
      { type: "Video",  title: "Building a net worth tracker from scratch" },
    ],
    languages: ["English"],
    location: "Boston, US",
    responseTime: "Within a day",
    experience: "10 years",
  },

  5: {
    id: 5,
    bio: "Sofia builds payments infrastructure at Stripe and mentors engineers on writing production-grade code, not just code that runs. She's especially known for demystifying system design interviews.",
    about: "Sofia moved from a bootcamp graduate to a Stripe engineer in four years, and remembers exactly how opaque the path felt from the outside. She now mentors self-taught and early-career engineers on the gap between 'my code works' and 'my code is ready for production' — testing, code review culture, and system design thinking.",
    learn: [
      "Writing clean, testable Python and React",
      "System design fundamentals",
      "Debugging and reading stack traces effectively",
      "Git workflows and code review etiquette",
      "Data structures for technical interviews",
      "Building a project worth putting on a resume",
    ],
    learningStyle: ["Practical Projects", "Live Sessions", "Weekly Feedback", "Assignments", "Concept First", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Clean code fundamentals" },
      { week: "Week 2", title: "Testing and debugging practice" },
      { week: "Week 3", title: "System design basics" },
      { week: "Week 4", title: "Data structures deep dive" },
      { week: "Week 5", title: "Building your portfolio project" },
      { week: "Week 6", title: "Mock technical interviews" },
    ],
    reviews: [
      { name: "Omar Farouk", initials: "OF", color: "#38BDF8", course: "System Design Prep", rating: 5, text: "Sofia's whiteboard sessions on system design got me through two onsite interviews I would've failed otherwise.", date: "1 week ago" },
      { name: "Lily Zhang", initials: "LZ", color: "#F87171", course: "Coding Fundamentals", rating: 5, text: "Patient and precise. She catches bad habits early before they become expensive to fix.", date: "3 weeks ago" },
      { name: "Ben Carter", initials: "BC", color: "#34D399", course: "Portfolio Project", rating: 5, text: "Helped me scope a project that was actually finishable instead of another abandoned side-project.", date: "5 weeks ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks, or shorter for focused interview prep sprints." },
      { q: "Will I get assignments?", a: "Yes — a coding exercise every session, reviewed together next time." },
      { q: "Can I message mentor?", a: "Yes, for quick debugging help between sessions." },
      { q: "Do sessions get recorded?", a: "Yes, including shared screen and code." },
    ],
    pricing: [
      { label: "30 min Session", price: "Free", sub: "Quick code review" },
      { label: "60 min Session", price: "₹2,000", sub: "Full teaching session" },
      { label: "Monthly Mentorship", price: "₹6,999", sub: "4 sessions + async review" },
    ],
    availability: [
      { date: "Today", slots: ["6:00 PM", "8:00 PM"] },
      { date: "Tomorrow", slots: ["9:00 AM", "12:00 PM"] },
      { date: "Fri, Feb 7", slots: ["4:00 PM"] },
    ],
    stats: { sessions: "2,410", students: "1,580", successRate: "95%", avgRating: "4.9", years: "7" },
    relatedPaths: ["Coding & Development", "AI & Machine Learning", "Career Growth"],
    content: [
      { type: "Guide",  title: "System design interviews, explained simply" },
      { type: "Article", title: "The habits that separate junior from senior code" },
      { type: "Video",  title: "Live debugging: finding a memory leak" },
    ],
    languages: ["English", "Spanish"],
    location: "Remote (EU)",
    responseTime: "Under 2 hours",
    experience: "7 years",
  },

  6: {
    id: 6,
    bio: "Rahul has trained thousands of students for IELTS and TOEFL through the British Council and teaches spoken English confidence for professional settings, not just exam scores.",
    about: "Rahul started as a classroom English teacher before specializing in exam coaching, and has since expanded into workplace communication training for professionals relocating abroad. He's big on speaking practice over grammar drilling — his belief is that fluency comes from talking, not from memorizing rules.",
    learn: [
      "IELTS speaking and writing strategy",
      "Building exam-day confidence",
      "Business English for meetings and email",
      "Pronunciation and accent clarity",
      "Structuring persuasive spoken answers",
      "Common mistakes that cost band scores",
    ],
    learningStyle: ["Live Sessions", "Weekly Feedback", "Practical Projects", "Assignments", "Direct Feedback", "Concept First"],
    roadmap: [
      { week: "Week 1", title: "Diagnostic and baseline assessment" },
      { week: "Week 2", title: "Speaking fluency drills" },
      { week: "Week 3", title: "Writing task strategy" },
      { week: "Week 4", title: "Listening and reading technique" },
      { week: "Week 5", title: "Full mock test" },
      { week: "Week 6", title: "Final polish and exam strategy" },
    ],
    reviews: [
      { name: "Anjali Bose", initials: "AB", color: "#34D399", course: "IELTS Prep", rating: 5, text: "Went from band 6.5 to 8 in six weeks. Rahul's speaking drills made the biggest difference.", date: "10 days ago" },
      { name: "Hassan Ali", initials: "HA", color: "#F4A261", course: "Business English", rating: 5, text: "My work emails and meeting confidence improved noticeably. Very practical approach.", date: "1 month ago" },
      { name: "Elena Popescu", initials: "EP", color: "#A78BFA", course: "TOEFL Prep", rating: 4, text: "Solid coaching, though I wish sessions were slightly longer for writing feedback.", date: "6 weeks ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks is standard before most exam dates; can be compressed to four if needed." },
      { q: "Will I get assignments?", a: "Yes — daily speaking and writing practice with weekly review." },
      { q: "Can I message mentor?", a: "Yes, for pronunciation audio clips and quick corrections." },
      { q: "Do sessions get recorded?", a: "Yes, useful for reviewing your own speaking progress." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹599", sub: "Speaking practice" },
      { label: "60 min Session", price: "₹1,200", sub: "Full lesson" },
      { label: "Monthly Mentorship", price: "₹4,299", sub: "4 sessions + daily feedback" },
    ],
    availability: [
      { date: "Today", slots: ["7:00 AM", "5:00 PM", "9:00 PM"] },
      { date: "Tomorrow", slots: ["8:00 AM", "6:00 PM"] },
    ],
    stats: { sessions: "5,120", students: "3,400", successRate: "92%", avgRating: "4.8", years: "9" },
    relatedPaths: ["Languages", "Communication", "Career Growth"],
    content: [
      { type: "Guide",  title: "IELTS speaking: the band 8 checklist" },
      { type: "Video",  title: "5 phrases that instantly sound more fluent" },
      { type: "Article", title: "Business English mistakes even fluent speakers make" },
    ],
    languages: ["English", "Hindi", "Bengali"],
    location: "Kolkata, India",
    responseTime: "Under 4 hours",
    experience: "9 years",
  },

  7: {
    id: 7,
    bio: "Emma leads content strategy at HubSpot and has grown three brand channels from zero to six figures in followers. She teaches content as a system, not a hustle.",
    about: "Emma started as a freelance writer before moving into brand marketing, where she discovered a knack for turning inconsistent posting into repeatable content systems. At HubSpot she oversees content strategy for multiple product lines. Her mentorship focuses on sustainable content operations — batching, repurposing, and analytics-driven iteration — rather than chasing individual viral posts.",
    learn: [
      "Building a content system that doesn't burn you out",
      "Instagram and short-form video strategy",
      "YouTube growth fundamentals",
      "Writing hooks that stop the scroll",
      "Brand voice and positioning",
      "Reading analytics to double down on what works",
    ],
    learningStyle: ["Practical Projects", "Weekly Feedback", "Live Sessions", "Case Studies", "Assignments", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Auditing your current content" },
      { week: "Week 2", title: "Defining your content pillars" },
      { week: "Week 3", title: "Hook writing and short-form video" },
      { week: "Week 4", title: "Batching and systemizing" },
      { week: "Week 5", title: "Analytics and iteration" },
      { week: "Week 6", title: "90-day content calendar" },
    ],
    reviews: [
      { name: "Julia Novak", initials: "JN", color: "#FB923C", course: "Content Strategy", rating: 5, text: "Emma helped me stop posting randomly and build an actual content pillar system. Growth followed within weeks.", date: "2 weeks ago" },
      { name: "Arjun Nair", initials: "AN", color: "#38BDF8", course: "YouTube Growth", rating: 4, text: "Great strategic thinking, though I wish there was more hands-on editing feedback.", date: "1 month ago" },
      { name: "Sara Haddad", initials: "SH", color: "#F87171", course: "Brand Voice", rating: 5, text: "Finally understand what my brand voice actually is instead of copying competitors.", date: "2 months ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks builds the full system; many extend for ongoing accountability." },
      { q: "Will I get assignments?", a: "Yes — a content batch and analytics review every week." },
      { q: "Can I message mentor?", a: "Yes, for quick feedback on drafts before posting." },
      { q: "Do sessions get recorded?", a: "Yes, plus shared templates from each session." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹1,100", sub: "Content audit" },
      { label: "60 min Session", price: "₹2,000", sub: "Full strategy session" },
      { label: "Monthly Mentorship", price: "₹6,499", sub: "4 sessions + async review" },
    ],
    availability: [
      { date: "Tomorrow", slots: ["11:00 AM", "3:00 PM"] },
      { date: "Thu, Feb 6", slots: ["10:00 AM", "2:00 PM"] },
    ],
    stats: { sessions: "710", students: "720", successRate: "90%", avgRating: "4.6", years: "8" },
    relatedPaths: ["Content", "Communication", "Entrepreneurship"],
    content: [
      { type: "Guide",  title: "The content pillar system, explained" },
      { type: "Article", title: "Why consistency beats virality" },
      { type: "Video",  title: "Batching a month of content in one afternoon" },
    ],
    languages: ["English", "Slovak"],
    location: "Berlin, Germany",
    responseTime: "Under a day",
    experience: "8 years",
  },

  8: {
    id: 8,
    bio: "Kenji is a TEDx speaker and communication coach who has trained executives and students alike on public speaking, storytelling, and building genuine confidence on stage.",
    about: "Kenji's own journey started with a stutter he worked to overcome through years of deliberate practice, which shapes how he coaches today — with patience and structure rather than generic 'just be confident' advice. He's coached corporate leaders before major keynotes and students before their first big presentations, and believes storytelling is a learnable skill, not a talent you're born with.",
    learn: [
      "Structuring a talk people remember",
      "Managing nerves before you speak",
      "Storytelling techniques for any audience",
      "Vocal variety and pacing",
      "Handling Q&A with confidence",
      "Building a personal speaking style",
    ],
    learningStyle: ["Live Sessions", "Practical Projects", "Direct Feedback", "Weekly Feedback", "Concept First", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Finding your core message" },
      { week: "Week 2", title: "Structuring your talk" },
      { week: "Week 3", title: "Storytelling techniques" },
      { week: "Week 4", title: "Vocal delivery and pacing" },
      { week: "Week 5", title: "Handling nerves and Q&A" },
      { week: "Week 6", title: "Full run-through and feedback" },
    ],
    reviews: [
      { name: "Nadia Farah", initials: "NF", color: "#F87171", course: "Public Speaking", rating: 5, text: "Kenji got me from dreading presentations to actually enjoying them. His breathing techniques alone changed everything.", date: "1 week ago" },
      { name: "Leo Fischer", initials: "LF", color: "#20B2AA", course: "Storytelling", rating: 5, text: "The most patient coach I've worked with. Never made me feel judged for being nervous.", date: "3 weeks ago" },
      { name: "Priyanka Das", initials: "PD", color: "#6366F1", course: "Executive Communication", rating: 5, text: "Used his structure for a board presentation and it landed better than anything I'd done before.", date: "1 month ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks is standard, timed around an upcoming talk or interview if you have one." },
      { q: "Will I get assignments?", a: "Yes — a recorded practice talk each week for review." },
      { q: "Can I message mentor?", a: "Yes, especially useful the night before a big talk." },
      { q: "Do sessions get recorded?", a: "Yes, so you can watch your own progress over time." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹1,500", sub: "Focused practice run" },
      { label: "60 min Session", price: "₹2,800", sub: "Full coaching session" },
      { label: "Monthly Mentorship", price: "₹9,499", sub: "4 sessions + talk prep" },
    ],
    availability: [
      { date: "Today", slots: ["1:00 PM", "5:00 PM"] },
      { date: "Wed, Feb 5", slots: ["9:00 AM", "4:00 PM"] },
    ],
    stats: { sessions: "1,340", students: "890", successRate: "93%", avgRating: "4.9", years: "11" },
    relatedPaths: ["Communication", "Career Growth", "Leadership"],
    content: [
      { type: "Video",  title: "The 3-part structure behind every great talk" },
      { type: "Guide",  title: "Breathing techniques to calm pre-talk nerves" },
      { type: "Article", title: "Why your Q&A answers feel weaker than your talk" },
    ],
    languages: ["English", "Japanese"],
    location: "Tokyo, Japan",
    responseTime: "Under 6 hours",
    experience: "11 years",
  },

  9: {
    id: 9,
    bio: "Jake is a certified personal trainer at Equinox who builds sustainable strength and fat-loss programs for people tired of restarting every January.",
    about: "Jake spent his first few years training clients on aesthetics alone before realizing most people quit not from lack of discipline, but from programs that didn't fit their actual life. He now designs training and nutrition plans around adherence first, results second — because a good plan you'll actually follow beats a perfect one you won't.",
    learn: [
      "Strength training fundamentals and form",
      "Building a program around your schedule",
      "Nutrition basics without extreme dieting",
      "Progressive overload and tracking progress",
      "Recovery and injury prevention",
      "Staying consistent long-term",
    ],
    learningStyle: ["Practical Projects", "Weekly Feedback", "Live Sessions", "Assignments", "Concept First", "Direct Feedback"],
    roadmap: [
      { week: "Week 1", title: "Assessment and goal setting" },
      { week: "Week 2", title: "Form fundamentals" },
      { week: "Week 3", title: "Building your program" },
      { week: "Week 4", title: "Nutrition basics" },
      { week: "Week 5", title: "Progressive overload" },
      { week: "Week 6", title: "Long-term consistency plan" },
    ],
    reviews: [
      { name: "Vikram Suri", initials: "VS", color: "#F87171", course: "Strength Fundamentals", rating: 5, text: "First trainer who actually built a plan around my travel schedule instead of ignoring it.", date: "2 weeks ago" },
      { name: "Hannah Kim", initials: "HK", color: "#34D399", course: "Fat Loss Program", rating: 5, text: "Sustainable, no crash dieting, and I'm still going three months later — that's the real win.", date: "1 month ago" },
      { name: "Diego Martins", initials: "DM", color: "#F4A261", course: "Strength Fundamentals", rating: 4, text: "Solid programming. Would've liked a bit more nutrition detail upfront.", date: "2 months ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks builds the habit; most continue with monthly check-ins after." },
      { q: "Will I get assignments?", a: "Yes — a weekly training plan and simple nutrition targets." },
      { q: "Can I message mentor?", a: "Yes, for form checks via video between sessions." },
      { q: "Do sessions get recorded?", a: "Yes, useful for reviewing form corrections." },
    ],
    pricing: [
      { label: "30 min Session", price: "₹899", sub: "Form check-in" },
      { label: "60 min Session", price: "₹1,500", sub: "Full training session" },
      { label: "Monthly Mentorship", price: "₹5,299", sub: "4 sessions + plan" },
    ],
    availability: [
      { date: "Today", slots: ["6:00 AM", "6:00 PM"] },
      { date: "Tomorrow", slots: ["7:00 AM", "5:00 PM"] },
    ],
    stats: { sessions: "1,920", students: "1,120", successRate: "88%", avgRating: "4.8", years: "9" },
    relatedPaths: ["Fitness", "Nutrition", "Consistency"],
    content: [
      { type: "Guide",  title: "A beginner strength program that actually fits your week" },
      { type: "Video",  title: "Fixing the 5 most common squat mistakes" },
      { type: "Article", title: "Why most fat-loss plans fail by week three" },
    ],
    languages: ["English", "Portuguese"],
    location: "Miami, US",
    responseTime: "Under 3 hours",
    experience: "9 years",
  },

  10: {
    id: 10,
    bio: "Leela teaches meditation and mindfulness with Headspace, helping people build a sustainable practice that fits real, busy lives — not a retreat-only ritual.",
    about: "Leela trained in mindfulness-based stress reduction after her own experience with burnout in a high-pressure job. She now teaches practical, secular meditation aimed at working professionals and students, focused on stress and focus rather than spiritual framing. Sessions are calm, unhurried, and grounded in small, repeatable habits.",
    learn: [
      "Building a daily meditation habit",
      "Breathwork for acute stress relief",
      "Mindfulness for focus and productivity",
      "Sleep and evening wind-down routines",
      "Handling anxious thoughts without suppressing them",
      "Making mindfulness stick long-term",
    ],
    learningStyle: ["Concept First", "Live Sessions", "Weekly Feedback", "Assignments", "Practical Projects", "Career Guidance"],
    roadmap: [
      { week: "Week 1", title: "Foundations of breath and attention" },
      { week: "Week 2", title: "Building a daily practice" },
      { week: "Week 3", title: "Stress and anxiety techniques" },
      { week: "Week 4", title: "Mindfulness for focus" },
      { week: "Week 5", title: "Sleep and wind-down routines" },
      { week: "Week 6", title: "Making it a lasting habit" },
    ],
    reviews: [
      { name: "Sana Malik", initials: "SM", color: "#14B8A6", course: "Mindfulness Basics", rating: 5, text: "Leela's approach is so unpretentious. No incense, no jargon — just a practice that actually reduced my anxiety.", date: "1 week ago" },
      { name: "Oliver James", initials: "OJ", color: "#A78BFA", course: "Stress Relief", rating: 5, text: "Six weeks in and I finally have a wind-down routine that gets me to sleep faster.", date: "3 weeks ago" },
      { name: "Chidi Okafor", initials: "CO", color: "#F4A261", course: "Focus & Productivity", rating: 4, text: "Genuinely helpful, especially the short breathing exercises for mid-day resets.", date: "1 month ago" },
    ],
    faq: [
      { q: "How long is mentorship?", a: "Six weeks builds the habit; many continue with biweekly check-ins." },
      { q: "Will I get assignments?", a: "Yes — a short daily practice with guided audio for the week." },
      { q: "Can I message mentor?", a: "Yes, especially helpful during a stressful week." },
      { q: "Do sessions get recorded?", a: "Yes, so you can revisit guided sessions anytime." },
    ],
    pricing: [
      { label: "30 min Session", price: "Free", sub: "Intro practice session" },
      { label: "60 min Session", price: "₹1,400", sub: "Full guided session" },
      { label: "Monthly Mentorship", price: "₹4,799", sub: "4 sessions + daily audio" },
    ],
    availability: [
      { date: "Tomorrow", slots: ["7:00 AM", "8:00 PM"] },
      { date: "Sat, Feb 8", slots: ["9:00 AM", "6:00 PM"] },
    ],
    stats: { sessions: "1,050", students: "640", successRate: "96%", avgRating: "4.9", years: "6" },
    relatedPaths: ["Meditation", "Consistency", "Communication"],
    content: [
      { type: "Guide",  title: "A 10-minute morning practice for busy people" },
      { type: "Video",  title: "Breathing techniques for sudden stress" },
      { type: "Article", title: "Why mindfulness apps alone don't build a habit" },
    ],
    languages: ["English", "Tamil"],
    location: "Chennai, India",
    responseTime: "Under 4 hours",
    experience: "6 years",
  },
};
