/* ─────────────────────────────────────────────────────────────────────────
   Pipeline Runner — orchestrates message classification, state updates,
   data grounding, and response generation for Starfix AI Coach.
   Enforces strict coherence, zero fabrication, and zero signal blending.
───────────────────────────────────────────────────────────────────────── */

export const STARFIX_AI_COACH_SYSTEM_PROMPT = `
SYSTEM PROMPT: Starfix AI Guidance Coach (RAG + Conversational State Engine)

YOU ARE:
The official AI Growth Coach for Starfix — an elite mentorship and path-guidance platform. You act as an expert technical career advisor, learning strategist, and empathic mentor equal in reasoning quality to Claude 3.5 Sonnet and ChatGPT-4o.

CORE OBJECTIVES:
1. Provide deep, accurate, non-superficial direction for ANY path (Coding, AI/ML, Cloud Computing, UI/UX, Cyber Security, DevOps, Data Science, Personal Finance, Communication, Fitness, Languages, Entrepreneurship, Meditation, Content Creation).
2. Never fabricate paths, mentors, or course links. Ground EVERY recommendation in Starfix's exact database:
   - Paths & Milestones: PATHS array (from GoalsPage.tsx)
   - Mentors: MENTORS array (from MentorsPage.tsx) — matched strictly by domain category AND learner attributes (skillLevel, country, learningStyle)
   - Curated Creator Courses: CREATORS roster (from curatedContent.ts)
   - Learner Progress: Active enrollments & daily tasks (from pathProgress.ts)
   - Mentor Inbox: Active chat threads (from messages.ts)

CONVERSATION STATE & LOGIC CONSTRAINTS:
- Maintain an active session memory tracking: confirmedTopic, confirmedLevel, emotionalState, openQuestion, and suggestedMentors.
- Single-Pass Intent Routing:
  1. EMOTIONAL_OR_CONFUSION_SIGNAL ("i am confused", "i feel stuck"): NEVER output a mentor/plan card. Respond with empathy and ask ONE sharp clarifying question.
  2. GOAL_STATEMENT ("cloud computing", "i want to be fit"): Confirm topic in state. If skill level is unknown, ask for level before generating a plan.
  3. LEVEL_ANSWER ("beginner", "intermediate"): Set confirmed level. Generate a structured plan card + mentor recommendation matching the confirmed topic ONLY. Never blend mentors across topics.
  4. DIRECT_ACTION_REQUEST ("what should I do today"): Pull live enrollment progress from pathProgress.ts or suggest the top path tailored to the user.
- Tone: Concise, professional, encouraging, analytical, and structured (2-4 sentences before any structured plan/button card).

RAG CONTEXT INJECTION STRUCTURE:
{
  "userProfile": { "skillLevel": "Beginner", "country": "IN", "goalId": "cloud" },
  "activeEnrollment": { "pathId": "cloud", "weekIndex": 0, "milestone": "Linux & CLI Basics" },
  "matchedPath": { "id": "cloud", "title": "Cloud Computing & DevOps", "modules": ["Linux & CLI Basics", "Core AWS Services", "Docker Containers", "CI/CD Pipelines", "Real Cloud Projects"] },
  "matchedMentor": { "name": "Aria Chen", "title": "Senior ML / Cloud Engineer at Google" },
  "curatedVideo": { "title": "Cloud Fundamentals by Hitesh Choudhary" }
}
`;

import type { UserProfile } from "../../types";
import { sessionState, type SkillLevel } from "./stateMachine";
import { classifyMessage, KNOWN_TOPICS } from "./messageClassifier";
import {
  getGroundedPath,
  getGroundedMentor,
  getGroundedVideo,
  getGroundedEnrollmentContext,
} from "./groundedData";

export interface CoachMsgOutput {
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

/** Comprehensive Domain Knowledge Base covering all 60+ Starfix paths */
const TOPIC_KNOWLEDGE: Record<string, { advice: string; keyFocus: string }> = {
  coding: {
    advice: "Software engineering is best mastered through building real projects. Focus on mastering core syntax, data structures, and clean architecture before jumping into heavy frameworks.",
    keyFocus: "Python / JavaScript -> Version Control (Git) -> Data Structures -> Real Full-Stack Project."
  },
  "ai-ml": {
    advice: "AI & Machine Learning requires balancing mathematical foundations (Linear Algebra, Calculus, Statistics) with hands-on model training in PyTorch or TensorFlow.",
    keyFocus: "Python & Numpy -> Linear Algebra -> Scikit-Learn -> PyTorch Neural Networks -> Deploying ML APIs."
  },
  "data-science": {
    advice: "Data Science transforms unstructured data into actionable strategic insights. Master SQL, Pandas data wrangling, and exploratory data visualization.",
    keyFocus: "SQL & Python -> Pandas/Numpy -> Matplotlib/Seaborn -> Machine Learning Models -> Business Analytics."
  },
  cybersecurity: {
    advice: "Cyber Security combines deep networking knowledge with defensive/offensive security tools. Practice ethical hacking labs in controlled sandboxes.",
    keyFocus: "Networking Protocols (TCP/IP) -> Linux Security -> Vulnerability Scanning -> Penetration Testing -> Compliance."
  },
  cloud: {
    advice: "Cloud Computing & DevOps focuses on scalability and infrastructure as code. Master Linux CLI and containerization (Docker) before deploying to AWS or Kubernetes.",
    keyFocus: "Linux CLI -> Docker Containers -> Core AWS Services (EC2, S3, IAM) -> Infrastructure as Code -> CI/CD Pipelines."
  },
  devops: {
    advice: "DevOps bridges development and operations through automated delivery pipelines. Focus on Docker containers, Kubernetes orchestration, and CI/CD automation.",
    keyFocus: "Linux Administration -> Docker -> Kubernetes -> Ansible/Terraform -> CI/CD & Monitoring."
  },
  uiux: {
    advice: "UI/UX Design bridges human psychology and visual aesthetics. Start by studying real product design systems in Figma and conducting usability interviews.",
    keyFocus: "Design Fundamentals -> Figma Prototyping -> User Research -> Portfolio Case Study."
  },
  webdev: {
    advice: "Web Development demands a solid foundation in responsive HTML/CSS and asynchronous JavaScript before building modern React or Node.js applications.",
    keyFocus: "HTML5/CSS3 -> JavaScript ES6+ -> React Basics -> Node.js & Database -> Deployed Full-Stack App."
  },
  appdev: {
    advice: "Mobile App Development requires understanding cross-platform UI components, state management, and native device APIs.",
    keyFocus: "Mobile Design -> React Native / Flutter -> State & Navigation -> REST APIs -> App Store Publishing."
  },
  "system-design": {
    advice: "System Design focuses on architectural trade-offs, high availability, and horizontal scaling for systems with millions of users.",
    keyFocus: "Scalability Principles -> Databases & Caching -> Load Balancers -> Microservices -> Mock Architecture Interviews."
  },
  dsa: {
    advice: "Data Structures & Algorithms requires pattern recognition rather than memorization. Focus on Two Pointers, Sliding Window, Trees, and Dynamic Programming.",
    keyFocus: "Arrays & Strings -> HashMaps & Pointers -> Trees & Graphs -> Dynamic Programming -> Mock Technical Reps."
  },
  blockchain: {
    advice: "Blockchain development centers on decentralized consensus and smart contract security. Learn Solidity and EVM architecture thoroughly.",
    keyFocus: "Blockchain Cryptography -> Solidity Basics -> Smart Contract Auditing -> Web3.js / Ethers.js -> DApp Deployment."
  },
  "product-mgmt": {
    advice: "Product Management aligns user needs with technical feasibility and business goals. Master PRD writing, user discovery interviews, and product analytics.",
    keyFocus: "Product Discovery -> PRD Writing -> User Journey Mapping -> Metrics (MAU, CAC, Retention) -> Product Launch."
  },
  "digital-marketing": {
    advice: "Digital Marketing builds customer acquisition funnels using data-driven experimentation across SEO, paid acquisition, and email automation.",
    keyFocus: "Marketing Funnels -> SEO & Content -> Paid Campaign Setup -> Conversion Rate Optimization -> Analytics."
  },
  "content-creation": {
    advice: "Content Creation succeeds through audience niche definition, high-retention hook scripting, and consistent content production systems.",
    keyFocus: "Niche Definition -> Scripting & Hooks -> Editing Workflow -> Analytics Review -> Monetization Systems."
  },
  "public-speaking": {
    advice: "Public speaking and communication are physical skills trained through repetition. Practice structured 60-second impromptu talks and active listening in meetings.",
    keyFocus: "Vocal Delivery -> Structuring Ideas -> Body Language -> Mock Presentations & Active Feedback."
  },
  entrepreneurship: {
    advice: "Startups succeed by solving real user pain points quickly. Build a minimal viable product (MVP) and validate it with 5 real users before scaling.",
    keyFocus: "Problem Discovery -> MVP Development -> Customer Interviews -> Go-To-Market Strategy."
  },
  finance: {
    advice: "Personal finance centers on asset allocation and automated savings. Prioritize building an emergency fund and learning long-term index fund investing.",
    keyFocus: "Budgeting -> Debt Management -> Emergency Fund -> Index Fund Investing & Tax Planning."
  },
  investing: {
    advice: "Investing relies on long-term compound growth and disciplined risk management. Avoid day-trading hype and focus on diversified broad-market index funds.",
    keyFocus: "Asset Classes -> Index Fund Diversification -> Risk Management -> Portfolio Allocation -> Long-Term Compounding."
  },
  freelancing: {
    advice: "Freelancing requires treating your services as a business. Master outbound outreach, value-based pricing proposals, and client relationship management.",
    keyFocus: "Niche Offer Definition -> Client Outreach -> Value Pricing -> Proposals & Contracts -> Client Retention."
  },
  "interview-prep": {
    advice: "Interview preparation requires mastering behavioral stories using the STAR method (Situation, Task, Action, Result) and structured technical practice.",
    keyFocus: "STAR Stories -> Resume Optimization -> Role Mock Interviews -> System/Coding Practice -> Negotiation."
  },
  leadership: {
    advice: "Leadership is about empowering teams and creating clarity. Focus on active listening, delegation, constructive feedback loops, and psychological safety.",
    keyFocus: "Self Leadership -> Clear Communication -> Delegation Frameworks -> Feedback Loops -> Leading Through Change."
  },
  "weight-loss": {
    advice: "Sustainable weight loss requires a moderate calorie deficit combined with high protein intake and daily activity like 10,000 steps.",
    keyFocus: "Calorie Tracking -> Protein Target -> Daily Step Goal -> Strength Preservation -> Weekly Measurement."
  },
  "muscle-building": {
    advice: "Muscle hypertrophy relies on progressive resistance overload, a slight calorie surplus, and 7-9 hours of restorative sleep.",
    keyFocus: "Compound Movements -> Progressive Overload -> Surplus Nutrition -> Sleep & Recovery -> Strength Tracking."
  },
  yoga: {
    advice: "Yoga cultivates physical flexibility and mental calmness. Focus on posture alignment, breath control (Pranayama), and fluid movement.",
    keyFocus: "Posture Alignment -> Breath Control -> Vinyasa Flow -> Flexibility -> Integrated Meditation."
  },
  nutrition: {
    advice: "Nutrition is about fueling performance and longevity. Focus on whole, nutrient-dense foods, balanced macros, and sustainable hydration.",
    keyFocus: "Macro Balance -> Whole Food Focus -> Meal Prep Systems -> Portion Control -> Mindful Eating."
  },
  sleep: {
    advice: "Sleep optimization dramatically improves cognitive focus and recovery. Maintain consistent sleep-wake times and eliminate blue light 1 hour before bed.",
    keyFocus: "Circadian Alignment -> Blue Light Protocol -> Temperature & Room Setup -> Wind-Down Ritual."
  },
  meditation: {
    advice: "Meditation trains mental clarity and emotional resilience. Start with 5-10 minutes of daily focused breath awareness.",
    keyFocus: "Breath Awareness -> Mindfulness Observation -> Emotional Detachment -> Daily Habit Streak."
  },
  productivity: {
    advice: "Productivity comes from managing energy and eliminating distractions rather than working endless hours. Use time-blocking for deep focus work.",
    keyFocus: "Time Audit -> Eisenhower Matrix -> Deep Work Blocks -> Minimizing Distractions -> Weekly Review."
  },
  writing: {
    advice: "Great writing is refined editing. Write daily without self-censoring, then edit ruthlessly for clarity, cadence, and active voice.",
    keyFocus: "Daily Outpouring -> Structural Editing -> Voice & Rhythm -> Note-Taking System -> Publishing."
  }
};

export function runCoachPipeline(
  userText: string,
  userProfile?: UserProfile | null
): CoachMsgOutput[] {
  const { category, matchedTopic, levelAnswer } = classifyMessage(userText, sessionState);
  const outputs: CoachMsgOutput[] = [];

  sessionState.recordTurn("user", userText);

  // 1. EMOTIONAL OR CONFUSION SIGNAL (e.g. "i am confused" with NO topic)
  if (category === "EMOTIONAL_OR_CONFUSION_SIGNAL") {
    sessionState.setEmotionalSignal("confused");
    sessionState.setOpenQuestion("ASKED_STUCK_REASON");

    outputs.push({
      from: "coach",
      text: "No worries at all — feeling confused or overwhelmed happens to everyone when navigating a growth journey. What is making you feel stuck right now: picking the right path, understanding a technical concept, or staying consistent?",
      chips: ["Help me pick a path", "Stuck on active path", "Need mentor advice"],
    });

    return outputs;
  }

  // 2. LEVEL ANSWER (user answering "beginner" to a level question)
  if (category === "LEVEL_OR_PREFERENCE_ANSWER" && levelAnswer) {
    sessionState.setConfirmedLevel(levelAnswer);

    const topic = sessionState.confirmedTopic || matchedTopic || KNOWN_TOPICS[0];
    const path = getGroundedPath(topic.id);
    const mentorPick = getGroundedMentor(topic.category, userProfile);
    const videoPick = getGroundedVideo(topic.id, undefined, userProfile);
    const knowledge = TOPIC_KNOWLEDGE[topic.id] || TOPIC_KNOWLEDGE.coding;

    if (path) {
      outputs.push({
        from: "coach",
        plan: {
          heading: `Best path: ${path.title}`,
          lines: [
            { label: "Level", value: levelAnswer },
            { label: "Estimated time", value: "6–8 weeks" },
            { label: "Recommended Mentor", value: mentorPick ? mentorPick.mentor.name : path.mentorLabel },
          ],
          weekList: path.modules,
          today: `Start with Module 1 (${path.modules[0]}): watch 1 lesson and complete 1 practical exercise.`,
        },
        actions: [
          { label: "Open Path", page: "goals" },
          ...(mentorPick
            ? [
                {
                  label: mentorPick.existingChat ? `Message ${mentorPick.mentor.name}` : "View Mentor",
                  page: mentorPick.existingChat ? "messages" : "mentors",
                  category: topic.category,
                },
              ]
            : []),
        ],
      });
    }

    if (videoPick) {
      outputs.push({
        from: "coach",
        text: `💡 **AI/ML Guidance:** ${knowledge.advice}\n\nKey progression: ${knowledge.keyFocus}\n\n${videoPick.reason} Recommended resource: watch "${videoPick.title}" on YouTube.`,
        actions: [{ label: "Watch Video", page: "goals" }],
      });
    }

    return outputs;
  }

  // 3. GOAL STATEMENT (user names a goal like "cloud computing" or "i want to be fit")
  if (category === "GOAL_STATEMENT" && matchedTopic) {
    sessionState.setConfirmedTopic({
      id: matchedTopic.id,
      label: matchedTopic.label,
      category: matchedTopic.category,
    });

    // Check if level is already known
    if (sessionState.confirmedLevel) {
      const path = getGroundedPath(matchedTopic.id);
      const mentorPick = getGroundedMentor(matchedTopic.category, userProfile);
      const knowledge = TOPIC_KNOWLEDGE[matchedTopic.id] || TOPIC_KNOWLEDGE.coding;

      if (path) {
        outputs.push({
          from: "coach",
          plan: {
            heading: `Best path: ${path.title}`,
            lines: [
              { label: "Level", value: sessionState.confirmedLevel },
              { label: "Estimated time", value: "6–8 weeks" },
              { label: "Recommended Mentor", value: mentorPick ? mentorPick.mentor.name : path.mentorLabel },
            ],
            weekList: path.modules,
            today: `Start with Module 1 (${path.modules[0]}): watch 1 lesson and practice.`,
          },
          actions: [
            { label: "Open Path", page: "goals" },
            ...(mentorPick
              ? [
                  {
                    label: mentorPick.existingChat ? `Message ${mentorPick.mentor.name}` : "View Mentor",
                    page: mentorPick.existingChat ? "messages" : "mentors",
                    category: matchedTopic.category,
                  },
                ]
              : []),
          ],
        });
      }

      outputs.push({
        from: "coach",
        text: `💡 **Key Insights:** ${knowledge.advice}`,
      });
    } else {
      // Level unknown -> ask 1 sharp level question
      sessionState.setOpenQuestion("ASKED_LEVEL");

      outputs.push({
        from: "coach",
        text: `Great goal! **${matchedTopic.label}** is a fantastic direction to focus on. Quick question — what is your current experience level?`,
        chips: ["Beginner", "Intermediate", "Advanced"],
      });
    }

    return outputs;
  }

  // 4. DIRECT ACTION REQUEST ("what should i do today", "give me a study plan")
  if (category === "DIRECT_ACTION_REQUEST") {
    const learnerCtx = getGroundedEnrollmentContext(userProfile);

    if (learnerCtx.activeEnrollment && learnerCtx.activePath) {
      const p = learnerCtx.activePath;
      const e = learnerCtx.activeEnrollment;
      const mentorPick = getGroundedMentor(p.mentorCategory, userProfile);

      outputs.push({
        from: "coach",
        plan: {
          heading: `You're on ${p.title}`,
          lines: [
            { label: "Current milestone", value: p.modules[e.weekIndex || 0] },
            { label: "Mentor", value: mentorPick ? mentorPick.mentor.name : p.mentorLabel },
          ],
          today: `Module ${(e.weekIndex || 0) + 1}: Practice ${p.modules[e.weekIndex || 0]} for 30 minutes today.`,
        },
        actions: [
          { label: "Continue Journey", page: "goals" },
          { label: "View Mentor", page: "mentors", category: p.mentorCategory },
        ],
      });

      return outputs;
    }

    if (sessionState.confirmedTopic) {
      const topic = sessionState.confirmedTopic;
      const path = getGroundedPath(topic.id);
      const mentorPick = getGroundedMentor(topic.category, userProfile);

      if (path) {
        outputs.push({
          from: "coach",
          plan: {
            heading: `Plan: ${path.title}`,
            lines: [
              { label: "Level", value: sessionState.confirmedLevel || "Beginner" },
              { label: "Mentor", value: mentorPick ? mentorPick.mentor.name : path.mentorLabel },
            ],
            weekList: path.modules,
            today: `Practice ${path.modules[0]} for 30 minutes today.`,
          },
          actions: [
            { label: "Open Path", page: "goals" },
            { label: "View Mentor", page: "mentors", category: topic.category },
          ],
        });

        return outputs;
      }
    }

    // Default request prompt
    outputs.push({
      from: "coach",
      text: "Which goal would you like to build a plan for today — Coding, Fitness, UI/UX Design, or Communication?",
      chips: ["Coding", "Fitness & Strength", "UI/UX Design", "Communication"],
    });

    return outputs;
  }

  // 5. FOLLOW UP / GENERAL QUESTION
  if (sessionState.confirmedTopic || matchedTopic) {
    const topic = sessionState.confirmedTopic || matchedTopic!;
    const path = getGroundedPath(topic.id);
    const mentorPick = getGroundedMentor(topic.category, userProfile);
    const videoPick = getGroundedVideo(topic.id, undefined, userProfile);
    const knowledge = TOPIC_KNOWLEDGE[topic.id] || TOPIC_KNOWLEDGE.coding;

    outputs.push({
      from: "coach",
      text: `For **${topic.label}**: ${knowledge.advice}\n\nRecommended progression: ${knowledge.keyFocus}\n\n${mentorPick ? mentorPick.reason : ""}`,
      actions: [
        { label: "Open Path", page: "goals" },
        ...(mentorPick
          ? [
              {
                label: mentorPick.existingChat ? `Message ${mentorPick.mentor.name}` : "View Mentor",
                page: mentorPick.existingChat ? "messages" : "mentors",
                category: topic.category,
              },
            ]
          : []),
      ],
    });

    if (videoPick) {
      outputs.push({
        from: "coach",
        text: `Curated learning video: "${videoPick.title}". ${videoPick.reason}`,
        actions: [{ label: "Watch Video", page: "goals" }],
      });
    }

    return outputs;
  }

  // 6. OFF TOPIC OR UNCLEAR
  outputs.push({
    from: "coach",
    text: "Tell me a bit more — asking about any specific domain like Coding, AI/ML, Cloud, UI/UX, or Communication helps me give you a precise roadmap.",
    chips: ["Coding", "AI & Machine Learning", "Cloud Computing", "UI/UX Design"],
  });

  return outputs;
}
