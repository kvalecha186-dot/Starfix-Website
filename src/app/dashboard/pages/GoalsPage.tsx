import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { isEnrolled } from "../../lib/pathProgress";
import {
  Search, ArrowRight, ArrowLeft, ArrowUpRight, Star, ChevronDown, ChevronRight,
  Check, Clock, Users, Flame, Target,
  Code2, Cpu, BarChart3, ShieldCheck, Cloud, GitBranch, Palette, Globe,
  Smartphone, Network, Binary, GitPullRequest, Link2, ClipboardList, Megaphone,
  Camera, Mic, Rocket, TrendingUp, LineChart, Briefcase, MessagesSquare,
  Scale, Dumbbell, Footprints, Flower2, Apple, Salad, Home, Bike, Activity, Moon,
  Brain, Sparkles, Anchor, Sun, MessageSquare, HeartHandshake, Wind, Zap,
  Focus, Repeat, Smile, Crosshair, Lightbulb, GitCommit, Puzzle,
  BookOpen, PenTool, Music, Pencil, Plane, Square, Fingerprint, Shirt, Users2,
  Heart, Languages, Wallet, LayoutGrid, GraduationCap, BookMarked, Award, FileText,
  Play, ExternalLink,
} from "lucide-react";
import { C } from "../dashColors";
import { useViewport } from "../../lib/useViewport";
import type { DashPage } from "../DashboardLayout";
import type { UserProfile } from "../../types";

/* ─────────────────────────────────────────────────────────────────────────
   Data — every path carries its own 5-module curriculum + mentor label, so
   nothing is ever templated from a single "Coding" example.
───────────────────────────────────────────────────────────────────────── */

type LucideIcon = React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

export interface PathDef {
  id: string;
  title: string;
  group: string;
  Icon: LucideIcon;
  color: string;
  desc: string;
  mentorCategory: string;   // maps to MentorsPage's internal category tabs
  mentorLabel: string;      // human-readable mentor type shown on the path page
  modules: string[];        // exactly 5 — doubles as roadmap phases, weekly plan, milestones
}

const GROUPS = ["Career & Tech", "Health & Fitness", "Mindset", "Personal Life", "Student Life"] as const;

const GROUP_COLOR: Record<string, string> = {
  "Career & Tech": "#6366F1",
  "Health & Fitness": "#EF4444",
  "Mindset": "#8B5CF6",
  "Personal Life": "#EC4899",
  "Student Life": "#10B981",
};

export const PATHS: PathDef[] = [
  // ── Career & Tech ──
  { id: "coding", title: "Coding", group: "Career & Tech", Icon: Code2, color: "#6366F1", desc: "Become a software developer from beginner to advanced.", mentorCategory: "Coding", mentorLabel: "Software Engineers", modules: ["Python Fundamentals", "JavaScript & Web Basics", "Real Projects", "Data Structures & Algorithms", "Git, GitHub & System Design"] },
  { id: "ai-ml", title: "AI & Machine Learning", group: "Career & Tech", Icon: Cpu, color: "#8B5CF6", desc: "Learn to build and train intelligent machine learning models.", mentorCategory: "AI/ML", mentorLabel: "AI/ML Engineers", modules: ["Math & Python for ML", "Core ML Algorithms", "Neural Networks", "Real-World Projects", "Deploying ML Models"] },
  { id: "data-science", title: "Data Science", group: "Career & Tech", Icon: BarChart3, color: "#6366F1", desc: "Turn raw data into insights that drive real decisions.", mentorCategory: "AI/ML", mentorLabel: "Data Scientists", modules: ["Statistics Foundations", "Data Wrangling with Pandas", "Data Visualization", "Machine Learning Basics", "Real Dataset Projects"] },
  { id: "cybersecurity", title: "Cyber Security", group: "Career & Tech", Icon: ShieldCheck, color: "#334155", desc: "Protect systems and data from real-world digital threats.", mentorCategory: "Coding", mentorLabel: "Security Engineers", modules: ["Networking Fundamentals", "Security Principles", "Ethical Hacking Basics", "Tools & Labs", "Certification Prep"] },
  { id: "cloud", title: "Cloud Computing", group: "Career & Tech", Icon: Cloud, color: "#0EA5E9", desc: "Deploy and scale applications on modern cloud platforms.", mentorCategory: "Coding", mentorLabel: "Cloud Architects", modules: ["Cloud Fundamentals", "Core Cloud Services", "Deployment Pipelines", "Scaling & Security", "Real Cloud Projects"] },
  { id: "devops", title: "DevOps", group: "Career & Tech", Icon: GitBranch, color: "#0F766E", desc: "Automate delivery pipelines and ship software faster.", mentorCategory: "Coding", mentorLabel: "DevOps Engineers", modules: ["Linux & CLI Basics", "CI/CD Pipelines", "Containers & Docker", "Kubernetes Basics", "Monitoring & Automation"] },
  { id: "uiux", title: "UI/UX Design", group: "Career & Tech", Icon: Palette, color: "#EC4899", desc: "Design digital products people genuinely love to use.", mentorCategory: "UI/UX", mentorLabel: "Product Designers", modules: ["Design Principles", "Figma Fundamentals", "Wireframing & Prototyping", "User Research", "Portfolio Case Study"] },
  { id: "webdev", title: "Web Development", group: "Career & Tech", Icon: Globe, color: "#3B82F6", desc: "Build fast, modern websites from the ground up.", mentorCategory: "Coding", mentorLabel: "Web Developers", modules: ["HTML & CSS", "JavaScript Essentials", "React Fundamentals", "Backend Basics", "Full-Stack Project"] },
  { id: "appdev", title: "App Development", group: "Career & Tech", Icon: Smartphone, color: "#6366F1", desc: "Create polished mobile apps for iOS and Android.", mentorCategory: "Coding", mentorLabel: "Mobile App Developers", modules: ["Mobile UI Basics", "App Framework Basics", "State & Navigation", "APIs & Storage", "Publishing Your App"] },
  { id: "system-design", title: "System Design", group: "Career & Tech", Icon: Network, color: "#0F766E", desc: "Design systems that scale to millions of users.", mentorCategory: "Coding", mentorLabel: "Senior Software Engineers", modules: ["Scalability Basics", "Databases & Caching", "Load Balancing", "Microservices", "Mock Design Interviews"] },
  { id: "dsa", title: "DSA", group: "Career & Tech", Icon: Binary, color: "#6366F1", desc: "Master data structures and algorithms for top interviews.", mentorCategory: "Coding", mentorLabel: "Interview Coaches", modules: ["Arrays & Strings", "Trees & Graphs", "Dynamic Programming", "Sorting & Searching", "Mock Interviews"] },
  { id: "open-source", title: "Open Source", group: "Career & Tech", Icon: GitPullRequest, color: "#0F766E", desc: "Contribute to real projects used by developers worldwide.", mentorCategory: "Coding", mentorLabel: "Open Source Maintainers", modules: ["Git & GitHub Basics", "Reading Codebases", "First Contributions", "Code Review Practice", "Maintaining a Project"] },
  { id: "blockchain", title: "Blockchain", group: "Career & Tech", Icon: Link2, color: "#7C3AED", desc: "Understand and build on decentralized blockchain networks.", mentorCategory: "Coding", mentorLabel: "Blockchain Developers", modules: ["Blockchain Fundamentals", "Smart Contracts", "Solidity Basics", "Building DApps", "Web3 Project"] },
  { id: "product-mgmt", title: "Product Management", group: "Career & Tech", Icon: ClipboardList, color: "#6366F1", desc: "Lead products from first idea to successful launch.", mentorCategory: "Entrepreneurship", mentorLabel: "Product Managers", modules: ["Product Thinking", "User Research", "Roadmapping", "Metrics & Analytics", "Launching a Mock Product"] },
  { id: "digital-marketing", title: "Digital Marketing", group: "Career & Tech", Icon: Megaphone, color: "#F97316", desc: "Grow brands with modern digital marketing strategy.", mentorCategory: "Content", mentorLabel: "Marketing Strategists", modules: ["Marketing Fundamentals", "SEO Basics", "Paid Ads", "Content Strategy", "Analytics & Growth"] },
  { id: "content-creation", title: "Content Creation", group: "Career & Tech", Icon: Camera, color: "#F97316", desc: "Create content that grows a genuinely engaged audience.", mentorCategory: "Content", mentorLabel: "Content Creators", modules: ["Finding Your Niche", "Scripting & Editing", "Platform Growth Tactics", "Consistency Systems", "Monetization Basics"] },
  { id: "public-speaking", title: "Public Speaking", group: "Career & Tech", Icon: Mic, color: "#B45309", desc: "Speak with clarity and confidence in any room.", mentorCategory: "Communication", mentorLabel: "Public Speaking Coaches", modules: ["Confidence Basics", "Structuring a Talk", "Body Language", "Handling Nerves", "Live Practice Sessions"] },
  { id: "entrepreneurship", title: "Entrepreneurship", group: "Career & Tech", Icon: Rocket, color: "#D97706", desc: "Turn your idea into a real, working business.", mentorCategory: "Entrepreneurship", mentorLabel: "Startup Founders", modules: ["Idea Validation", "Building an MVP", "Customer Discovery", "Fundraising Basics", "Launch & Growth"] },
  { id: "finance", title: "Finance", group: "Career & Tech", Icon: TrendingUp, color: "#059669", desc: "Understand money, markets, and personal finance deeply.", mentorCategory: "Finance", mentorLabel: "Financial Advisors", modules: ["Money Fundamentals", "Budgeting", "Saving & Investing Basics", "Debt & Credit", "Long-Term Planning"] },
  { id: "investing", title: "Investing", group: "Career & Tech", Icon: LineChart, color: "#059669", desc: "Learn to invest wisely and grow long-term wealth.", mentorCategory: "Finance", mentorLabel: "Investment Coaches", modules: ["Investing Basics", "Stocks & Funds", "Risk Management", "Portfolio Building", "Long-Term Strategy"] },
  { id: "freelancing", title: "Freelancing", group: "Career & Tech", Icon: Briefcase, color: "#D97706", desc: "Build a thriving freelance career on your own terms.", mentorCategory: "Entrepreneurship", mentorLabel: "Freelance Consultants", modules: ["Finding Clients", "Pricing Your Work", "Contracts & Proposals", "Delivering Projects", "Scaling Your Business"] },
  { id: "career-growth", title: "Career Growth", group: "Career & Tech", Icon: ArrowUpRight, color: "#6366F1", desc: "Advance faster in your career with a clear plan.", mentorCategory: "Communication", mentorLabel: "Career Coaches", modules: ["Self Assessment", "Skill Gap Planning", "Networking Strategy", "Personal Branding", "Promotion Roadmap"] },
  { id: "interview-prep", title: "Interview Preparation", group: "Career & Tech", Icon: MessagesSquare, color: "#6366F1", desc: "Prepare to confidently ace interviews at top companies.", mentorCategory: "Communication", mentorLabel: "Interview Coaches", modules: ["Resume & Profile", "Behavioral Questions", "Role-Specific Practice", "Mock Interviews", "Offer Negotiation"] },
  { id: "leadership", title: "Leadership", group: "Career & Tech", Icon: Users, color: "#0F766E", desc: "Lead teams with confidence, clarity, and empathy.", mentorCategory: "Communication", mentorLabel: "Leadership Coaches", modules: ["Leading Yourself", "Communication as a Leader", "Delegation & Trust", "Giving Feedback", "Leading Through Change"] },

  // ── Health & Fitness ──
  { id: "weight-loss", title: "Weight Loss", group: "Health & Fitness", Icon: Scale, color: "#EF4444", desc: "Lose weight sustainably with a structured, realistic plan.", mentorCategory: "Fitness", mentorLabel: "Fitness Coaches", modules: ["Calorie Deficit Basics", "Nutrition Fundamentals", "Walking & Cardio", "Strength Training", "Weekly Check-Ins & Measurements"] },
  { id: "muscle-building", title: "Muscle Building", group: "Health & Fitness", Icon: Dumbbell, color: "#EF4444", desc: "Build strength and muscle with proven training methods.", mentorCategory: "Fitness", mentorLabel: "Strength Coaches", modules: ["Training Fundamentals", "Progressive Overload", "Nutrition for Muscle", "Recovery & Sleep", "Tracking Strength Gains"] },
  { id: "running", title: "Running", group: "Health & Fitness", Icon: Footprints, color: "#F97316", desc: "Go from your first mile to your first race.", mentorCategory: "Fitness", mentorLabel: "Running Coaches", modules: ["Running Form Basics", "Building Base Mileage", "Speed & Interval Training", "Injury Prevention", "Race Day Prep"] },
  { id: "yoga", title: "Yoga", group: "Health & Fitness", Icon: Flower2, color: "#14B8A6", desc: "Build flexibility, strength, and calm through yoga.", mentorCategory: "Fitness", mentorLabel: "Yoga Teachers", modules: ["Foundational Poses", "Breath Control", "Flexibility & Flow", "Balance Poses", "Meditation Integration"] },
  { id: "nutrition", title: "Nutrition", group: "Health & Fitness", Icon: Apple, color: "#84CC16", desc: "Learn to eat well for lasting energy and health.", mentorCategory: "Fitness", mentorLabel: "Nutrition Coaches", modules: ["Macronutrient Basics", "Meal Planning", "Reading Labels", "Portion Control", "Building Sustainable Habits"] },
  { id: "healthy-eating", title: "Healthy Eating", group: "Health & Fitness", Icon: Salad, color: "#84CC16", desc: "Build sustainable healthy eating habits, one meal at a time.", mentorCategory: "Fitness", mentorLabel: "Nutrition Coaches", modules: ["Whole Foods Basics", "Meal Prep Systems", "Reducing Processed Foods", "Mindful Eating", "Sustainable Habits"] },
  { id: "home-workout", title: "Home Workout", group: "Health & Fitness", Icon: Home, color: "#EF4444", desc: "Get fit at home — no gym, no equipment, no excuses.", mentorCategory: "Fitness", mentorLabel: "Fitness Coaches", modules: ["Bodyweight Basics", "Building a Routine", "Progressive Difficulty", "Minimal Equipment Training", "Tracking Progress"] },
  { id: "gym-training", title: "Gym Training", group: "Health & Fitness", Icon: Dumbbell, color: "#EF4444", desc: "Train smarter with a structured, progressive gym program.", mentorCategory: "Fitness", mentorLabel: "Strength Coaches", modules: ["Gym Orientation", "Compound Lifts", "Progressive Programming", "Form & Safety", "Tracking & Deloads"] },
  { id: "cycling", title: "Cycling", group: "Health & Fitness", Icon: Bike, color: "#0EA5E9", desc: "Build endurance and explore the world on two wheels.", mentorCategory: "Fitness", mentorLabel: "Cycling Coaches", modules: ["Bike Fit & Basics", "Building Endurance", "Hill & Interval Training", "Nutrition for Cycling", "Long-Ride Prep"] },
  { id: "stretching", title: "Stretching", group: "Health & Fitness", Icon: Activity, color: "#14B8A6", desc: "Improve mobility and prevent injury with daily stretching.", mentorCategory: "Fitness", mentorLabel: "Mobility Coaches", modules: ["Mobility Basics", "Daily Stretch Routine", "Dynamic vs Static Stretching", "Injury Prevention", "Full-Body Flexibility"] },
  { id: "sleep", title: "Sleep Optimization", group: "Health & Fitness", Icon: Moon, color: "#6366F1", desc: "Sleep better and wake up with real, lasting energy.", mentorCategory: "Fitness", mentorLabel: "Sleep Coaches", modules: ["Sleep Fundamentals", "Wind-Down Routine", "Sleep Environment", "Tracking Sleep Quality", "Long-Term Sleep Habits"] },

  // ── Mindset ──
  { id: "meditation", title: "Meditation", group: "Mindset", Icon: Brain, color: "#8B5CF6", desc: "Build a calm, focused mind through daily meditation.", mentorCategory: "Meditation", mentorLabel: "Meditation Teachers", modules: ["Breathing Techniques", "Mindfulness Basics", "Morning Meditation", "Evening & Sleep Meditation", "Building a Meditation Streak"] },
  { id: "mindfulness", title: "Mindfulness", group: "Mindset", Icon: Sparkles, color: "#8B5CF6", desc: "Live more present, aware, and less reactive.", mentorCategory: "Meditation", mentorLabel: "Mindfulness Experts", modules: ["Present-Moment Awareness", "Mindful Breathing", "Noticing Thoughts", "Mindful Routines", "Daily Mindfulness Habit"] },
  { id: "self-discipline", title: "Self Discipline", group: "Mindset", Icon: Anchor, color: "#334155", desc: "Build the discipline to follow through, every single day.", mentorCategory: "Meditation", mentorLabel: "Life Coaches", modules: ["Understanding Motivation", "Removing Friction", "Building Micro-Habits", "Handling Setbacks", "Long-Term Consistency"] },
  { id: "confidence", title: "Confidence", group: "Mindset", Icon: Sun, color: "#F59E0B", desc: "Build unshakeable confidence in who you are.", mentorCategory: "Communication", mentorLabel: "Confidence Coaches", modules: ["Self-Talk & Mindset", "Body Language Basics", "Small Wins Practice", "Handling Criticism", "Real-World Confidence Reps"] },
  { id: "communication-skills", title: "Communication Skills", group: "Mindset", Icon: MessageSquare, color: "#F59E0B", desc: "Communicate clearly and connect with anyone.", mentorCategory: "Communication", mentorLabel: "Communication Coaches", modules: ["Active Listening", "Clear Speaking", "Storytelling Basics", "Body Language", "Real Conversation Practice"] },
  { id: "eq", title: "Emotional Intelligence", group: "Mindset", Icon: HeartHandshake, color: "#EC4899", desc: "Understand emotions — yours and others' — better.", mentorCategory: "Communication", mentorLabel: "Emotional Intelligence Coaches", modules: ["Understanding Emotions", "Self-Regulation", "Empathy Practice", "Reading Others", "Applying EQ at Work"] },
  { id: "stress-mgmt", title: "Stress Management", group: "Mindset", Icon: Wind, color: "#14B8A6", desc: "Manage stress and stay calm under real pressure.", mentorCategory: "Meditation", mentorLabel: "Stress Management Coaches", modules: ["Understanding Stress", "Breathing Techniques", "Time-Based Coping Tools", "Lifestyle Adjustments", "Long-Term Resilience"] },
  { id: "productivity", title: "Productivity", group: "Mindset", Icon: Zap, color: "#F59E0B", desc: "Get more of what matters done, with far less effort.", mentorCategory: "Communication", mentorLabel: "Productivity Coaches", modules: ["Prioritization Basics", "Deep Work Blocks", "Systems & Tools", "Reducing Distractions", "Weekly Review Habit"] },
  { id: "time-mgmt", title: "Time Management", group: "Mindset", Icon: Clock, color: "#8B5CF6", desc: "Take control of your time — and your days.", mentorCategory: "Communication", mentorLabel: "Productivity Coaches", modules: ["Time Audit", "Prioritization Frameworks", "Calendar Systems", "Saying No", "Weekly Planning Habit"] },
  { id: "deep-work", title: "Deep Work", group: "Mindset", Icon: Focus, color: "#334155", desc: "Do focused, distraction-free work that actually matters.", mentorCategory: "Communication", mentorLabel: "Focus Coaches", modules: ["Understanding Focus", "Removing Distractions", "Deep Work Blocks", "Rituals & Environment", "Tracking Deep Work Hours"] },
  { id: "habit-building", title: "Habit Building", group: "Mindset", Icon: Repeat, color: "#8B5CF6", desc: "Build habits that stick, one small step at a time.", mentorCategory: "Meditation", mentorLabel: "Behavior Change Coaches", modules: ["Habit Loop Basics", "Starting Small", "Habit Stacking", "Tracking Streaks", "Handling Slip-Ups"] },
  { id: "positive-thinking", title: "Positive Thinking", group: "Mindset", Icon: Smile, color: "#F59E0B", desc: "Train your mind toward a more positive outlook.", mentorCategory: "Meditation", mentorLabel: "Mindset Coaches", modules: ["Reframing Thoughts", "Gratitude Practice", "Self-Talk Basics", "Handling Negativity", "Daily Positivity Habit"] },
  { id: "focus", title: "Focus", group: "Mindset", Icon: Crosshair, color: "#334155", desc: "Sharpen your focus in a world full of distraction.", mentorCategory: "Meditation", mentorLabel: "Focus Coaches", modules: ["Understanding Attention", "Removing Distractions", "Single-Tasking Practice", "Focus Rituals", "Tracking Focus Sessions"] },
  { id: "creativity", title: "Creativity", group: "Mindset", Icon: Lightbulb, color: "#F59E0B", desc: "Unlock creative thinking you can use anywhere.", mentorCategory: "Content", mentorLabel: "Creative Mentors", modules: ["Idea Generation", "Creative Constraints", "Daily Creative Practice", "Cross-Domain Inspiration", "Sharing Your Work"] },
  { id: "decision-making", title: "Decision Making", group: "Mindset", Icon: GitCommit, color: "#8B5CF6", desc: "Make better decisions, faster and with more clarity.", mentorCategory: "Communication", mentorLabel: "Decision-Making Coaches", modules: ["Decision Frameworks", "Reducing Bias", "Weighing Trade-Offs", "Fast vs Slow Decisions", "Reviewing Past Decisions"] },
  { id: "critical-thinking", title: "Critical Thinking", group: "Mindset", Icon: Puzzle, color: "#334155", desc: "Think clearly, question assumptions, reason better.", mentorCategory: "Communication", mentorLabel: "Critical Thinking Mentors", modules: ["Questioning Assumptions", "Logical Reasoning", "Spotting Fallacies", "Evaluating Sources", "Applying Critical Thinking Daily"] },

  // ── Personal Life ──
  { id: "reading-habit", title: "Reading Habit", group: "Personal Life", Icon: BookOpen, color: "#EC4899", desc: "Build a reading habit that actually sticks.", mentorCategory: "Content", mentorLabel: "Reading Coaches", modules: ["Choosing the Right Books", "Building a Reading Routine", "Active Reading Techniques", "Note-Taking Systems", "Hitting a Reading Streak"] },
  { id: "writing", title: "Writing", group: "Personal Life", Icon: PenTool, color: "#EC4899", desc: "Write with more clarity, voice, and confidence.", mentorCategory: "Content", mentorLabel: "Professional Writers", modules: ["Writing Fundamentals", "Finding Your Voice", "Structuring Ideas", "Editing & Revision", "Publishing Your Work"] },
  { id: "photography", title: "Photography", group: "Personal Life", Icon: Camera, color: "#F97316", desc: "Learn to see and capture the world through a lens.", mentorCategory: "Content", mentorLabel: "Professional Photographers", modules: ["Camera & Exposure Basics", "Composition", "Lighting", "Editing Basics", "Building a Portfolio"] },
  { id: "music", title: "Music", group: "Personal Life", Icon: Music, color: "#7C3AED", desc: "Learn an instrument or the craft of music.", mentorCategory: "Content", mentorLabel: "Music Teachers", modules: ["Instrument Basics", "Ear Training", "Practice Routines", "Playing Simple Songs", "Performing"] },
  { id: "drawing", title: "Drawing", group: "Personal Life", Icon: Pencil, color: "#EC4899", desc: "Learn to draw, from the basics to your own style.", mentorCategory: "Content", mentorLabel: "Professional Artists", modules: ["Sketching Basics", "Perspective", "Shading & Light", "Anatomy Basics", "Portfolio Building"] },
  { id: "travel-planning", title: "Travel Planning", group: "Personal Life", Icon: Plane, color: "#0EA5E9", desc: "Plan trips like a pro — thoughtfully, and stress-free.", mentorCategory: "All", mentorLabel: "Travel Consultants", modules: ["Trip Research Basics", "Budgeting a Trip", "Itinerary Planning", "Booking Smart", "Packing & Logistics"] },
  { id: "minimalism", title: "Minimalism", group: "Personal Life", Icon: Square, color: "#334155", desc: "Simplify your life — your space, and your mind.", mentorCategory: "Meditation", mentorLabel: "Lifestyle Coaches", modules: ["Decluttering Basics", "Digital Minimalism", "Mindful Spending", "Simplifying Routines", "Maintaining a Minimal Life"] },
  { id: "personal-branding", title: "Personal Branding", group: "Personal Life", Icon: Fingerprint, color: "#6366F1", desc: "Build a personal brand people genuinely remember.", mentorCategory: "Content", mentorLabel: "Personal Branding Experts", modules: ["Defining Your Brand", "Online Presence Basics", "Content Consistency", "Networking Your Brand", "Growing Your Reputation"] },
  { id: "fashion", title: "Fashion", group: "Personal Life", Icon: Shirt, color: "#EC4899", desc: "Develop a personal style that feels authentically you.", mentorCategory: "Content", mentorLabel: "Stylists", modules: ["Style Fundamentals", "Building a Wardrobe", "Color & Fit Basics", "Mixing & Matching", "Developing Your Signature Look"] },
  { id: "networking", title: "Networking", group: "Personal Life", Icon: Users2, color: "#6366F1", desc: "Build real, valuable professional relationships.", mentorCategory: "Communication", mentorLabel: "Networking Coaches", modules: ["Networking Mindset", "Starting Conversations", "Building Real Relationships", "Following Up", "Growing Your Circle"] },
  { id: "relationship-skills", title: "Relationship Skills", group: "Personal Life", Icon: Heart, color: "#EC4899", desc: "Build healthier, stronger relationships that last.", mentorCategory: "Communication", mentorLabel: "Relationship Coaches", modules: ["Communication Basics", "Active Listening", "Conflict Resolution", "Building Trust", "Maintaining Long-Term Connection"] },
  { id: "language-learning", title: "Language Learning", group: "Personal Life", Icon: Languages, color: "#3B82F6", desc: "Learn a new language, one conversation at a time.", mentorCategory: "Languages", mentorLabel: "Language Tutors", modules: ["Core Vocabulary", "Basic Grammar", "Listening Practice", "Speaking Practice", "Real Conversation Immersion"] },
  { id: "financial-planning", title: "Financial Planning", group: "Personal Life", Icon: Wallet, color: "#059669", desc: "Plan your finances for a genuinely secure future.", mentorCategory: "Finance", mentorLabel: "Financial Advisors", modules: ["Budgeting Basics", "Emergency Fund", "Saving Systems", "Insurance Basics", "Long-Term Planning"] },
  { id: "life-organization", title: "Life Organization", group: "Personal Life", Icon: LayoutGrid, color: "#334155", desc: "Organize your life — tasks, time, and space.", mentorCategory: "Communication", mentorLabel: "Productivity Coaches", modules: ["Task Systems", "Time Blocking", "Digital Organization", "Physical Space Organization", "Weekly Review Habit"] },

  // ── Student Life ──
  { id: "exam-prep", title: "Exam Preparation", group: "Student Life", Icon: GraduationCap, color: "#10B981", desc: "Prepare for exams with a clear, structured plan.", mentorCategory: "All", mentorLabel: "Academic Tutors", modules: ["Study Planning", "Active Recall Techniques", "Practice Tests", "Time Management", "Final Review Sprint"] },
  { id: "study-techniques", title: "Study Techniques", group: "Student Life", Icon: BookMarked, color: "#10B981", desc: "Study smarter with proven, research-backed techniques.", mentorCategory: "All", mentorLabel: "Academic Coaches", modules: ["Note-Taking Systems", "Active Recall", "Spaced Repetition", "Focus Techniques", "Building a Study Routine"] },
  { id: "research-skills", title: "Research Skills", group: "Student Life", Icon: Search, color: "#10B981", desc: "Learn to research like a working professional.", mentorCategory: "All", mentorLabel: "Academic Mentors", modules: ["Finding Credible Sources", "Reading Academic Papers", "Note Organization", "Citing Sources", "Writing a Research Summary"] },
  { id: "scholarships", title: "Scholarships", group: "Student Life", Icon: Award, color: "#D97706", desc: "Find and win scholarships that fund your future.", mentorCategory: "All", mentorLabel: "Scholarship Advisors", modules: ["Finding Opportunities", "Eligibility Basics", "Essay Writing", "Application Strategy", "Interview Prep"] },
  { id: "study-abroad", title: "Study Abroad", group: "Student Life", Icon: Plane, color: "#0EA5E9", desc: "Plan your journey to study in another country.", mentorCategory: "Languages", mentorLabel: "Study Abroad Consultants", modules: ["Choosing a Destination", "Application Process", "Visa & Documentation", "Finances & Housing", "Pre-Departure Prep"] },
  { id: "ielts", title: "IELTS", group: "Student Life", Icon: Languages, color: "#3B82F6", desc: "Prepare for IELTS and hit your target band score.", mentorCategory: "Languages", mentorLabel: "IELTS Trainers", modules: ["Listening Practice", "Reading Strategies", "Writing Task Practice", "Speaking Practice", "Full Mock Tests"] },
  { id: "gre", title: "GRE", group: "Student Life", Icon: BookOpen, color: "#10B981", desc: "Prepare for the GRE with a focused study plan.", mentorCategory: "Languages", mentorLabel: "GRE Trainers", modules: ["Verbal Reasoning", "Quant Fundamentals", "Analytical Writing", "Practice Tests", "Final Review Sprint"] },
  { id: "resume-building", title: "Resume Building", group: "Student Life", Icon: FileText, color: "#334155", desc: "Build a resume that actually gets you noticed.", mentorCategory: "Communication", mentorLabel: "Career Coaches", modules: ["Resume Structure", "Writing Achievements", "Tailoring for Roles", "Design & Formatting", "Getting Feedback"] },
  { id: "college-success", title: "College Success", group: "Student Life", Icon: GraduationCap, color: "#10B981", desc: "Thrive academically and personally in college.", mentorCategory: "All", mentorLabel: "Academic Mentors", modules: ["Time Management", "Study Habits", "Campus Involvement", "Building Relationships", "Career Prep"] },
];

/* Deterministic per-path stats — consistent across renders without hand-authoring
   hundreds of numbers. */
export function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const DURATIONS = ["6 weeks", "2 months", "3 months", "3–6 months", "4–6 months", "4–8 months", "6–12 months", "Ongoing"];
const DIFFICULTIES = ["Beginner", "Beginner → Intermediate", "Beginner → Advanced", "Intermediate → Advanced", "All Levels"];

export function statsFor(p: PathDef) {
  const h = hashStr(p.id);
  return {
    duration: DURATIONS[h % DURATIONS.length],
    difficulty: DIFFICULTIES[(h >> 3) % DIFFICULTIES.length],
    rating: (4.5 + ((h >> 5) % 6) / 10).toFixed(1),
    learners: 300 + (h % 4700),
    mentorsN: 18 + ((h >> 7) % 140),
  };
}

const LABEL: React.CSSProperties = {
  fontSize: "0.68rem",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: C.textFaint,
  fontFamily: "'Inter', sans-serif",
};

/* ─────────────────────────────────────────────────────────────────────────
   Growth Path card (library grid)
───────────────────────────────────────────────────────────────────────── */

function PathCard({ p, delay, onOpen }: { p: PathDef; delay: number; onOpen: () => void }) {
  const s = statsFor(p);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay: Math.min(delay, 0.4) }}
      whileHover={{ y: -3 }}
      onClick={onOpen}
      style={{
        cursor: "pointer",
        padding: "20px 20px 18px",
        borderRadius: C.radius,
        background: C.surface,
        border: `1px solid ${C.border}`,
        transition: "border-color 0.18s ease, box-shadow 0.18s ease",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.goldBorder; e.currentTarget.style.boxShadow = C.shadowMd; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = "none"; }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: C.radiusSm, background: `${p.color}14`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <p.Icon size={17} color={p.color} />
        </div>
        <div style={{ fontSize: "0.94rem", fontWeight: 600, color: C.text, lineHeight: 1.25 }}>{p.title}</div>
      </div>

      <p style={{ fontSize: "0.78rem", color: C.textMuted, lineHeight: 1.5, margin: 0, minHeight: "2.25em" }}>{p.desc}</p>

      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", fontSize: "0.68rem", color: C.textFaint }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {s.duration}</span>
        <span>·</span>
        <span>{s.difficulty}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${C.borderMuted}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: "0.72rem", color: C.textMuted }}>
          <span style={{ display: "flex", alignItems: "center", gap: 3 }}><Star size={11} color={C.gold} fill={C.gold} /> {s.rating}</span>
          <span>{s.learners.toLocaleString()} learners</span>
          <span>{s.mentorsN} mentors</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: "0.76rem", fontWeight: 600, color: C.gold, flexShrink: 0 }}>
          View Path <ArrowRight size={12} />
        </span>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Path Detail view — every section below is driven entirely by p.modules,
   p.mentorLabel, p.group, etc. Nothing here references "Coding" specifically.
───────────────────────────────────────────────────────────────────────── */

export const WEEK_BANDS = ["Week 1–2", "Week 3–6", "Week 7–10", "Week 11–16", "Final week"];

/* ─────────────────────────────────────────────────────────────────────────
   Curated Resources — a hand-picked 4-item learning stack per Growth Path:
   Start Here → Go Deeper → Practice With This → Community. Video links deep-
   link to YouTube's own search for the named creator + topic (so they always
   resolve to live, current, genuinely-recommended content rather than a
   single video link that can rot); community links go to real, active
   subreddits for that field.
───────────────────────────────────────────────────────────────────────── */

interface CuratedResource {
  badge: "Video" | "Community";
  duration: string;
  title: string;
  source: string;
  description: string;
  url: string;
  cta: string;
}
export interface ResourceStack {
  start: CuratedResource;
  deeper: CuratedResource;
  practice: CuratedResource;
  community: CuratedResource;
}

const yt = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const reddit = (sub: string) => `https://www.reddit.com/r/${sub}/`;

function vid(duration: string, title: string, source: string, description: string, query: string): CuratedResource {
  return { badge: "Video", duration, title, source, description, url: yt(query), cta: "Watch" };
}
function community(sub: string, description: string): CuratedResource {
  return { badge: "Community", duration: "Community", title: `r/${sub}`, source: "Reddit", description, url: reddit(sub), cta: "Open" };
}

export const CURATED_STACKS: Record<string, ResourceStack> = {
  // ── Career & Tech ──
  coding: {
    start: vid("~4 hr", "Learn to Code — Full Beginner Course", "freeCodeCamp", "A complete, structured intro to programming fundamentals.", "freeCodeCamp full course for beginners"),
    deeper: vid("~15 min", "Programming Concepts, Explained Fast", "Fireship", "Quick, dense explainers that connect the bigger picture.", "Fireship 100 seconds of code"),
    practice: vid("~2 hr", "Build a Real Project From Scratch", "Traversy Media", "Follow along and ship something you can actually show.", "Traversy Media crash course project"),
    community: community("learnprogramming", "Ask questions and track your progress with other beginners."),
  },
  "ai-ml": {
    start: vid("~1 hr", "Machine Learning for Everybody", "freeCodeCamp", "A friendly, complete overview of core ML ideas.", "freeCodeCamp machine learning for everybody"),
    deeper: vid("~10 min", "ML Concepts, Explained Simply", "StatQuest with Josh Starmer", "The clearest explanations of the math behind ML.", "StatQuest machine learning explained"),
    practice: vid("~1 hr", "Build Your First ML Model", "freeCodeCamp", "A guided, hands-on model-building walkthrough.", "freeCodeCamp build first machine learning model"),
    community: community("MachineLearning", "Follow real discussion on ML research and practice."),
  },
  "data-science": {
    start: vid("~2 hr", "Data Analysis With Python", "freeCodeCamp", "Learn pandas and real analysis workflows from zero.", "freeCodeCamp data analysis with python"),
    deeper: vid("~10 min", "Statistics, Explained Simply", "StatQuest with Josh Starmer", "The statistical foundations data science is built on.", "StatQuest statistics fundamentals"),
    practice: vid("~30 min", "A Real Dataset Project, Start to Finish", "Alex The Analyst", "Watch a full project worked end to end.", "Alex The Analyst data project walkthrough"),
    community: community("datascience", "See how working data scientists solve real problems."),
  },
  cybersecurity: {
    start: vid("~3 hr", "Cyber Security Full Course for Beginners", "freeCodeCamp", "Covers the core concepts every security path starts with.", "freeCodeCamp cyber security full course"),
    deeper: vid("~15 min", "How Hacking Actually Works", "NetworkChuck", "Makes attacker techniques intuitive and memorable.", "NetworkChuck how hacking works"),
    practice: vid("~30 min", "A Hands-On Ethical Hacking Lab", "The Cyber Mentor", "Practice real techniques in a safe lab environment.", "The Cyber Mentor ethical hacking practice lab"),
    community: community("cybersecurity", "Learn from practitioners working in security today."),
  },
  cloud: {
    start: vid("~4 hr", "AWS Cloud Practitioner Course", "freeCodeCamp", "A full walkthrough of core cloud concepts and services.", "freeCodeCamp AWS cloud practitioner course"),
    deeper: vid("~20 min", "Cloud Computing, Explained Clearly", "TechWorld with Nana", "Connects cloud theory to real deployment practice.", "TechWorld with Nana cloud computing explained"),
    practice: vid("~1 hr", "Deploy a Real App to the Cloud", "freeCodeCamp", "A guided deployment you can follow step by step.", "freeCodeCamp deploy app to cloud tutorial"),
    community: community("aws", "See real deployment questions and architecture advice."),
  },
  devops: {
    start: vid("~20 min", "DevOps Roadmap for Beginners", "TechWorld with Nana", "Maps out exactly what to learn and in what order.", "TechWorld with Nana devops roadmap beginners"),
    deeper: vid("~30 min", "CI/CD Pipelines, Explained", "freeCodeCamp", "Understand automated delivery from first principles.", "freeCodeCamp CI CD pipelines explained"),
    practice: vid("~1 hr", "Hands-On Docker & Kubernetes Labs", "KodeKloud", "Practice with real containers and clusters.", "KodeKloud docker kubernetes hands on labs"),
    community: community("devops", "Real-world pipelines, tools, and lessons learned."),
  },
  uiux: {
    start: vid("~20 min", "UI/UX Design for Complete Beginners", "DesignCourse", "Covers the core principles before you touch a tool.", "DesignCourse UI UX design for beginners"),
    deeper: vid("~15 min", "How Top Teams Run Design Sprints", "AJ&Smart", "See a real product design process in action.", "AJ&Smart design sprint process"),
    practice: vid("~30 min", "Build a Real Interface in Figma", "Figma", "Follow along and design a real screen.", "Figma official tutorial for beginners"),
    community: community("UXDesign", "Get feedback on real portfolios and case studies."),
  },
  webdev: {
    start: vid("~4 hr", "Responsive Web Design Course", "freeCodeCamp", "HTML and CSS fundamentals from the ground up.", "freeCodeCamp responsive web design course"),
    deeper: vid("~15 min", "CSS, Explained the Right Way", "Kevin Powell", "Turns confusing CSS behavior into intuition.", "Kevin Powell CSS explained"),
    practice: vid("~2 hr", "Build a Full Website Project", "Traversy Media", "A complete, real project built from scratch.", "Traversy Media website build project"),
    community: community("webdev", "Real project feedback and day-to-day dev discussion."),
  },
  appdev: {
    start: vid("~3 hr", "React Native Full Course", "freeCodeCamp", "Build a real mobile app from your first screen.", "freeCodeCamp react native full course"),
    deeper: vid("~15 min", "Mobile App Fundamentals, Explained", "The Net Ninja", "Clear explanations of core mobile app concepts.", "The Net Ninja mobile app fundamentals"),
    practice: vid("~1 hr", "Build and Publish a Real App", "Traversy Media", "Follow a project from build through to publishing.", "Traversy Media build publish mobile app"),
    community: community("androiddev", "See how real apps get built and shipped."),
  },
  "system-design": {
    start: vid("~15 min", "System Design Fundamentals", "Gaurav Sen", "A clear starting point for scalable system thinking.", "Gaurav Sen system design fundamentals"),
    deeper: vid("~10 min", "How Big Tech Systems Are Actually Built", "ByteByteGo", "Real architecture patterns explained visually.", "ByteByteGo system design explained"),
    practice: vid("~30 min", "A Full Mock System Design Interview", "freeCodeCamp", "Watch a real design interview worked through.", "freeCodeCamp system design mock interview"),
    community: community("ExperiencedDevs", "Real architecture trade-offs from working engineers."),
  },
  dsa: {
    start: vid("~5 hr", "Data Structures & Algorithms Course", "freeCodeCamp", "A complete foundation before tackling interview problems.", "freeCodeCamp data structures algorithms course"),
    deeper: vid("~20 min", "Algorithms, Explained Visually", "Abdul Bari", "Turns abstract algorithms into clear mental models.", "Abdul Bari algorithms explained"),
    practice: vid("~20 min", "Solve a Real Interview Problem", "NeetCode", "Watch problems solved with real interview reasoning.", "NeetCode solve interview problem walkthrough"),
    community: community("leetcode", "Practice problems and interview prep alongside others."),
  },
  "open-source": {
    start: vid("~1 hr", "Git and GitHub for Beginners", "freeCodeCamp", "Everything you need before your first contribution.", "freeCodeCamp git and github for beginners"),
    deeper: vid("~15 min", "How Open Source Actually Works", "freeCodeCamp", "Demystifies contributing to a real codebase.", "freeCodeCamp how open source works"),
    practice: vid("~20 min", "Make Your First Pull Request", "freeCodeCamp", "A guided walkthrough of a real first contribution.", "freeCodeCamp first pull request tutorial"),
    community: community("opensource", "Find real beginner-friendly projects to contribute to."),
  },
  blockchain: {
    start: vid("~3 hr", "Blockchain Full Course", "freeCodeCamp", "Covers blockchain fundamentals from first principles.", "freeCodeCamp blockchain full course"),
    deeper: vid("~15 min", "How Smart Contracts Really Work", "Dapp University", "Clear explanation of contracts and dApps.", "Dapp University smart contracts explained"),
    practice: vid("~1 hr", "Build Your First Smart Contract", "Patrick Collins", "A hands-on Solidity build you can follow.", "Patrick Collins solidity smart contract tutorial"),
    community: community("ethdev", "Real developer discussion on Ethereum and Web3."),
  },
  "product-mgmt": {
    start: vid("~15 min", "Product Management for Beginners", "Product School", "A grounded intro to what PMs actually do.", "Product School product management for beginners"),
    deeper: vid("~40 min", "Lessons From Real PM Leaders", "Lenny's Podcast", "Conversations with practicing senior PMs.", "Lenny's Podcast product management interview"),
    practice: vid("~15 min", "Run a Real Product Sprint", "AJ&Smart", "See a full product sprint run start to finish.", "AJ&Smart product sprint process"),
    community: community("ProductManagement", "Real questions from practicing product managers."),
  },
  "digital-marketing": {
    start: vid("~20 min", "Digital Marketing Fundamentals", "HubSpot", "A clear map of the entire marketing landscape.", "HubSpot digital marketing fundamentals"),
    deeper: vid("~15 min", "SEO and Growth Strategy, Explained", "Neil Patel", "Practical growth tactics from a working marketer.", "Neil Patel SEO strategy explained"),
    practice: vid("~1 hr", "Hands-On Marketing Certification Course", "Google Digital Garage", "A guided, practical marketing certification track.", "Google Digital Garage marketing course"),
    community: community("marketing", "Real campaign discussion from working marketers."),
  },
  "content-creation": {
    start: vid("~15 min", "How to Start Creating Content", "Think Media", "A grounded starting point for new creators.", "Think Media how to start content creation"),
    deeper: vid("~15 min", "Editing and Storytelling Techniques", "Peter McKinnon", "Craft-level lessons on making content that hooks.", "Peter McKinnon editing storytelling tips"),
    practice: vid("~20 min", "Grow Your Channel From Zero", "Ali Abdaal", "Real, practical growth tactics you can apply now.", "Ali Abdaal grow youtube channel from zero"),
    community: community("NewTubers", "Feedback and support from other new creators."),
  },
  "public-speaking": {
    start: vid("~15 min", "Watch Great Speakers in Action", "TEDx Talks", "Study real, highly effective public speaking.", "TEDx best speeches for beginners"),
    deeper: vid("~15 min", "Speak With More Confidence and Clarity", "Vinh Giang", "Practical techniques for tone, pacing, and presence.", "Vinh Giang public speaking tips"),
    practice: vid("~15 min", "Practice Exercises for Real Speeches", "Charisma on Command", "Drills you can use before your next talk.", "Charisma on Command public speaking practice"),
    community: community("publicspeaking", "Get feedback before and after real talks."),
  },
  entrepreneurship: {
    start: vid("~10 min", "Startup School for First-Time Founders", "Y Combinator", "Foundational lessons from the top startup accelerator.", "Y Combinator startup school beginners"),
    deeper: vid("~20 min", "Lessons From Building a Real Business", "Ali Abdaal", "Honest, practical founder lessons.", "Ali Abdaal building a business lessons"),
    practice: vid("~15 min", "How to Validate Your First Idea", "Y Combinator", "A real, practical validation framework.", "Y Combinator validate startup idea"),
    community: community("startups", "Real founder discussion at every stage."),
  },
  finance: {
    start: vid("~2 hr", "Personal Finance Full Course", "freeCodeCamp", "Covers budgeting, saving, and investing basics.", "freeCodeCamp personal finance full course"),
    deeper: vid("~10 min", "Money Concepts, Explained Clearly", "The Plain Bagel", "Grounded, jargon-free financial explainers.", "The Plain Bagel personal finance explained"),
    practice: vid("~15 min", "Build Your First Real Budget", "Khan Academy", "A guided, practical budgeting walkthrough.", "Khan Academy build a budget tutorial"),
    community: community("personalfinance", "Real budgeting and saving questions, answered."),
  },
  investing: {
    start: vid("~15 min", "Common Sense Investing, Explained", "Ben Felix", "Evidence-based investing fundamentals.", "Ben Felix common sense investing"),
    deeper: vid("~10 min", "How Markets Actually Work", "The Plain Bagel", "Clear explanations without the hype.", "The Plain Bagel how markets work"),
    practice: vid("~15 min", "Build Your First Portfolio", "Khan Academy", "A guided, practical portfolio-building walkthrough.", "Khan Academy build first portfolio tutorial"),
    community: community("investing", "Real investing discussion and portfolio feedback."),
  },
  freelancing: {
    start: vid("~15 min", "How to Start Freelancing", "Thomas Frank", "A grounded, realistic starting playbook.", "Thomas Frank how to start freelancing"),
    deeper: vid("~15 min", "Pricing and Finding Real Clients", "Charlie Chang", "Practical pricing and client-acquisition tactics.", "Charlie Chang freelance pricing clients"),
    practice: vid("~10 min", "Write a Winning Proposal", "Charlie Chang", "A real proposal built and explained.", "Charlie Chang freelance proposal tutorial"),
    community: community("freelance", "Real client and pricing questions from freelancers."),
  },
  "career-growth": {
    start: vid("~15 min", "How to Grow Your Career Faster", "Linda Raynier", "A practical framework for career progression.", "Linda Raynier career growth tips"),
    deeper: vid("~15 min", "Building a Real Promotion Plan", "CareerVidz", "Concrete steps toward your next role.", "CareerVidz promotion plan tips"),
    practice: vid("~10 min", "Practice Your Career Story", "Linda Raynier", "Craft a story you can use in real conversations.", "Linda Raynier career story practice"),
    community: community("careerguidance", "Real career questions from people navigating growth."),
  },
  "interview-prep": {
    start: vid("~1 hr", "Coding Interview Prep Course", "freeCodeCamp", "A structured path through common interview topics.", "freeCodeCamp coding interview prep course"),
    deeper: vid("~20 min", "How to Think Through Interview Problems", "NeetCode", "Real problem-solving reasoning, not memorized answers.", "NeetCode interview problem reasoning"),
    practice: vid("~30 min", "A Full Mock Interview Walkthrough", "Exponent", "Watch a complete, realistic mock interview.", "Exponent mock interview walkthrough"),
    community: community("interviews", "Real interview experiences and feedback."),
  },
  leadership: {
    start: vid("~20 min", "What Makes a Great Leader", "Simon Sinek", "A foundational talk on real leadership.", "Simon Sinek what makes a great leader"),
    deeper: vid("~15 min", "Leadership Lessons From Real Managers", "Harvard Business Review", "Practical lessons pulled from real teams.", "Harvard Business Review leadership lessons"),
    practice: vid("~10 min", "Practice Giving Real Feedback", "Simon Sinek", "A concrete framework you can use this week.", "Simon Sinek how to give feedback"),
    community: community("Leadership", "Real leadership challenges from working managers."),
  },

  // ── Health & Fitness ──
  "weight-loss": {
    start: vid("~15 min", "Weight Loss, Explained Simply", "Jeremy Ethier", "Cuts through the noise with the real science.", "Jeremy Ethier weight loss explained"),
    deeper: vid("~20 min", "The Truth About Sustainable Fat Loss", "Mind Pump", "Why most diets fail and what actually works.", "Mind Pump sustainable fat loss"),
    practice: vid("~15 min", "Follow a Real Beginner Training Plan", "Jeff Nippard", "A structured plan you can start today.", "Jeff Nippard beginner training plan"),
    community: community("loseit", "Real progress logs and support from people losing weight."),
  },
  "muscle-building": {
    start: vid("~15 min", "Muscle Building Fundamentals", "Jeff Nippard", "The real, evidence-based basics of hypertrophy.", "Jeff Nippard muscle building fundamentals"),
    deeper: vid("~15 min", "How to Train With Proper Form", "Athlean-X", "Technique breakdowns that prevent injury.", "Athlean-X proper lifting form"),
    practice: vid("~15 min", "Follow a Real Beginner Program", "Jeremy Ethier", "A complete program structure to start with.", "Jeremy Ethier beginner muscle program"),
    community: community("Fitness", "Real training logs and programming advice."),
  },
  running: {
    start: vid("~15 min", "Running for Complete Beginners", "The Running Channel", "Everything you need for your first few runs.", "The Running Channel beginner running guide"),
    deeper: vid("~15 min", "How to Build Real Endurance", "GTN", "The training principles behind lasting stamina.", "GTN Global Triathlon Network endurance running"),
    practice: vid("~10 min", "Follow a Real Beginner Training Plan", "The Running Channel", "A structured plan for your first weeks.", "The Running Channel beginner training plan"),
    community: community("running", "Real training logs and race advice."),
  },
  yoga: {
    start: vid("~25 min", "Yoga for Complete Beginners", "Yoga With Adriene", "A gentle, guided introduction to the practice.", "Yoga With Adriene yoga for beginners"),
    deeper: vid("~30 min", "Building a Deeper Daily Practice", "Yoga With Adriene", "Moves past the basics into real consistency.", "Yoga With Adriene daily yoga practice"),
    practice: vid("~30 day", "Follow a Full 30-Day Journey", "Yoga With Adriene", "A guided month-long practice series.", "Yoga With Adriene 30 day yoga journey"),
    community: community("yoga", "Real practice questions and pose feedback."),
  },
  nutrition: {
    start: vid("~15 min", "Nutrition Basics, Explained Simply", "Abbey Sharp", "A myth-free introduction to real nutrition science.", "Abbey Sharp nutrition basics explained"),
    deeper: vid("~20 min", "How to Actually Build a Diet", "Mind Pump", "Turns nutrition science into a real, usable plan.", "Mind Pump how to build a diet"),
    practice: vid("~10 min", "Build Your Own Meal Plan", "Precision Nutrition", "A guided, practical meal-planning walkthrough.", "Precision Nutrition build a meal plan"),
    community: community("nutrition", "Real, evidence-based nutrition discussion."),
  },
  "healthy-eating": {
    start: vid("~15 min", "How to Eat Healthier Without a Diet", "Abbey Sharp", "Sustainable habits over restrictive rules.", "Abbey Sharp eat healthier no diet"),
    deeper: vid("~15 min", "Building Sustainable Eating Habits", "Mind Pump", "What actually makes healthy eating last.", "Mind Pump sustainable eating habits"),
    practice: vid("~15 min", "Follow a Real Weekly Meal Prep", "Pick Up Limes", "A complete, realistic meal prep session.", "Pick Up Limes weekly meal prep"),
    community: community("EatCheapAndHealthy", "Real meal ideas that are both healthy and practical."),
  },
  "home-workout": {
    start: vid("~20 min", "Home Workouts for Complete Beginners", "MadFit", "No equipment needed to get started today.", "MadFit home workout for beginners"),
    deeper: vid("~15 min", "How to Structure Your Own Routine", "Fitness Blender", "Build a routine that fits your real schedule.", "Fitness Blender build your own routine"),
    practice: vid("~20 min", "Follow a Real No-Equipment Program", "Athlean-X", "A complete bodyweight program to follow.", "Athlean-X no equipment home workout program"),
    community: community("bodyweightfitness", "Real bodyweight training routines and progress."),
  },
  "gym-training": {
    start: vid("~15 min", "Gym Training for Complete Beginners", "Jeff Nippard", "What to actually do on your first weeks in the gym.", "Jeff Nippard gym beginner guide"),
    deeper: vid("~15 min", "How to Train Each Lift Correctly", "Athlean-X", "Form breakdowns for the core compound lifts.", "Athlean-X compound lift form"),
    practice: vid("~15 min", "Follow a Real Beginner Program", "Jeff Nippard", "A structured lifting program to start with.", "Jeff Nippard beginner gym program"),
    community: community("weightroom", "Real programming and progression advice."),
  },
  cycling: {
    start: vid("~15 min", "Cycling for Complete Beginners", "GCN", "Bike setup and the basics of riding well.", "GCN Global Cycling Network beginner guide"),
    deeper: vid("~15 min", "How to Build Real Endurance on the Bike", "GCN", "Training principles for longer, stronger rides.", "GCN cycling endurance training"),
    practice: vid("~15 min", "Follow a Structured Training Plan", "GCN", "A real training plan you can follow week to week.", "GCN cycling training plan"),
    community: community("cycling", "Real route, gear, and training discussion."),
  },
  stretching: {
    start: vid("~15 min", "Stretching for Complete Beginners", "Yoga With Adriene", "A gentle intro to safe, effective stretching.", "Yoga With Adriene stretching for beginners"),
    deeper: vid("~15 min", "Building a Real Mobility Routine", "MadFit", "Turns isolated stretches into a real daily habit.", "MadFit mobility stretch routine"),
    practice: vid("~20 min", "Follow a Full-Body Flexibility Flow", "Yoga With Adriene", "A guided, full-body flexibility session.", "Yoga With Adriene full body flexibility"),
    community: community("flexibility", "Real mobility routines and progress stories."),
  },
  sleep: {
    start: vid("~20 min", "Why Sleep Matters So Much", "Matthew Walker", "The real science behind why sleep is non-negotiable.", "Matthew Walker sleep science talk"),
    deeper: vid("~30 min", "How to Actually Improve Sleep Quality", "Huberman Lab", "Practical, research-backed sleep protocols.", "Huberman Lab improve sleep quality"),
    practice: vid("~15 min", "Follow a Real Wind-Down Routine", "Headspace", "A guided routine to use tonight.", "Headspace wind down sleep routine"),
    community: community("sleep", "Real sleep struggles and what's worked for others."),
  },

  // ── Mindset ──
  meditation: {
    start: vid("~10 min", "Meditation for Complete Beginners", "Headspace", "A gentle, guided first meditation session.", "Headspace meditation for beginners"),
    deeper: vid("~20 min", "Building a Deeper Daily Practice", "The Honest Guys", "Moves past the basics into real consistency.", "The Honest Guys daily meditation practice"),
    practice: vid("~15 min", "Follow a Guided Daily Session", "Yoga With Adriene", "A real session you can do today.", "Yoga With Adriene guided meditation"),
    community: community("Meditation", "Real practice questions and encouragement."),
  },
  mindfulness: {
    start: vid("~10 min", "Mindfulness for Complete Beginners", "Headspace", "The core idea behind present-moment awareness.", "Headspace mindfulness for beginners"),
    deeper: vid("~15 min", "Living With More Present Awareness", "Mindful.org", "Practical ways to bring mindfulness into daily life.", "Mindful.org present awareness practice"),
    practice: vid("~10 min", "Follow a Real Daily Mindfulness Practice", "Headspace", "A short session to build the daily habit.", "Headspace daily mindfulness practice"),
    community: community("mindfulness", "Real experiences from a daily mindfulness practice."),
  },
  "self-discipline": {
    start: vid("~15 min", "Self Discipline, Explained Simply", "Improvement Pill", "Why discipline is a skill, not a personality trait.", "Improvement Pill self discipline explained"),
    deeper: vid("~15 min", "Building Habits That Actually Stick", "Matt D'Avella", "Real, tested strategies for lasting change.", "Matt D'Avella building habits that stick"),
    practice: vid("~10 min", "Follow a Real Discipline Challenge", "Improvement Pill", "A concrete challenge you can start this week.", "Improvement Pill discipline challenge"),
    community: community("selfimprovement", "Real accountability and progress from others."),
  },
  confidence: {
    start: vid("~15 min", "Building Real Confidence", "Charisma on Command", "Practical, non-cheesy confidence fundamentals.", "Charisma on Command building confidence"),
    deeper: vid("~15 min", "How Self-Talk Shapes Confidence", "Improvement Pill", "The mental patterns behind lasting confidence.", "Improvement Pill self talk confidence"),
    practice: vid("~10 min", "Practice Real Confidence Exercises", "Charisma on Command", "Drills you can use in real situations.", "Charisma on Command confidence exercises"),
    community: community("selfimprovement", "Real stories of building confidence over time."),
  },
  "communication-skills": {
    start: vid("~15 min", "Communication Basics, Explained", "Charisma on Command", "The fundamentals behind clear, natural conversation.", "Charisma on Command communication basics"),
    deeper: vid("~15 min", "How to Speak With More Clarity", "Vinh Giang", "Practical tools for tone and clarity.", "Vinh Giang speaking clarity tips"),
    practice: vid("~10 min", "Practice Real Conversation Exercises", "Improvement Pill", "Exercises for actual, real-world conversations.", "Improvement Pill conversation practice exercises"),
    community: community("socialskills", "Real conversation advice and shared experiences."),
  },
  eq: {
    start: vid("~10 min", "Emotional Intelligence, Explained Simply", "Psych2Go", "A clear, friendly intro to reading emotions.", "Psych2Go emotional intelligence explained"),
    deeper: vid("~10 min", "Understanding Emotions More Deeply", "TED-Ed", "The science behind why emotions work the way they do.", "TED-Ed understanding emotions"),
    practice: vid("~10 min", "Practice Reading Emotions in Others", "Psych2Go", "Real cues you can practice noticing.", "Psych2Go reading emotions practice"),
    community: community("emotionalintelligence", "Real discussion on applying EQ day to day."),
  },
  "stress-mgmt": {
    start: vid("~10 min", "Managing Stress for Complete Beginners", "Headspace", "A gentle first step toward real stress relief.", "Headspace managing stress for beginners"),
    deeper: vid("~20 min", "How Stress Actually Works in the Body", "Huberman Lab", "The science behind stress and recovery.", "Huberman Lab stress science explained"),
    practice: vid("~10 min", "Follow a Real Stress Relief Routine", "Headspace", "A guided routine you can use today.", "Headspace stress relief routine"),
    community: community("stressmanagement", "Real coping strategies from other people."),
  },
  productivity: {
    start: vid("~15 min", "Productivity for Complete Beginners", "Ali Abdaal", "A grounded starting framework, not more hacks.", "Ali Abdaal productivity for beginners"),
    deeper: vid("~15 min", "Building Real Productivity Systems", "Thomas Frank", "Systems that hold up under a real workload.", "Thomas Frank productivity systems"),
    practice: vid("~15 min", "Follow a Real Productivity Challenge", "Matt D'Avella", "A concrete challenge you can start today.", "Matt D'Avella productivity challenge"),
    community: community("productivity", "Real systems and tools that people actually use."),
  },
  "time-mgmt": {
    start: vid("~15 min", "Time Management for Complete Beginners", "Thomas Frank", "The fundamentals behind taking back your time.", "Thomas Frank time management basics"),
    deeper: vid("~15 min", "Building a Real Weekly Planning System", "Ali Abdaal", "A planning system that survives a busy week.", "Ali Abdaal weekly planning system"),
    practice: vid("~10 min", "Follow a Real Time Audit Exercise", "Thomas Frank", "See exactly where your time actually goes.", "Thomas Frank time audit exercise"),
    community: community("productivity", "Real time-management systems and lessons learned."),
  },
  "deep-work": {
    start: vid("~15 min", "Deep Work, Explained Simply", "Ali Abdaal", "Why focused work matters more than busy work.", "Ali Abdaal deep work explained"),
    deeper: vid("~20 min", "How to Actually Focus in a Distracted World", "Cal Newport", "The thinking behind sustained, deep focus.", "Cal Newport deep work talk"),
    practice: vid("~10 min", "Follow a Real Deep Work Challenge", "Ali Abdaal", "A concrete challenge to build the habit.", "Ali Abdaal deep work challenge"),
    community: community("getdisciplined", "Real focus and discipline strategies from others."),
  },
  "habit-building": {
    start: vid("~15 min", "Habit Building for Complete Beginners", "Matt D'Avella", "The real basics behind lasting habit change.", "Matt D'Avella habit building beginners"),
    deeper: vid("~20 min", "How Habits Actually Form and Stick", "James Clear", "The science behind Atomic Habits, explained in a talk.", "James Clear atomic habits talk"),
    practice: vid("~15 min", "Follow a Real 30-Day Habit Challenge", "Matt D'Avella", "A concrete 30-day challenge structure.", "Matt D'Avella 30 day habit challenge"),
    community: community("getdisciplined", "Real streaks, setbacks, and encouragement."),
  },
  "positive-thinking": {
    start: vid("~15 min", "The Science of Positive Thinking", "TED", "What the research actually says about optimism.", "TED talk science of positive thinking"),
    deeper: vid("~15 min", "Reframing Negative Thoughts", "Improvement Pill", "Practical tools for shifting your inner narrative.", "Improvement Pill reframing negative thoughts"),
    practice: vid("~10 min", "Practice a Real Gratitude Exercise", "TED-Ed", "A concrete exercise you can do today.", "TED-Ed gratitude exercise practice"),
    community: community("getmotivated", "Real encouragement and shared wins."),
  },
  focus: {
    start: vid("~15 min", "Focus for Complete Beginners", "Ali Abdaal", "The basics behind training sustained attention.", "Ali Abdaal how to focus better"),
    deeper: vid("~15 min", "How Attention Actually Works", "Thibaut Meurisse", "The mental mechanics behind distraction and focus.", "Thibaut Meurisse focus and attention"),
    practice: vid("~10 min", "Follow a Real Focus Challenge", "Ali Abdaal", "A concrete challenge to build focus daily.", "Ali Abdaal focus challenge"),
    community: community("getdisciplined", "Real strategies for staying focused day to day."),
  },
  creativity: {
    start: vid("~10 min", "Creativity, Explained Simply", "TED-Ed", "Where creative ideas actually come from.", "TED-Ed creativity explained"),
    deeper: vid("~15 min", "Where Real Ideas Actually Come From", "Austin Kleon", "A working artist's honest process.", "Austin Kleon steal like an artist talk"),
    practice: vid("~10 min", "Practice a Real Creative Exercise", "TED-Ed", "A concrete prompt to build the habit.", "TED-Ed creative exercise practice"),
    community: community("creativity", "Real creative work shared and discussed."),
  },
  "decision-making": {
    start: vid("~10 min", "How to Make Better Decisions", "TED-Ed", "A clear framework for everyday decisions.", "TED-Ed how to make better decisions"),
    deeper: vid("~15 min", "Reducing Bias in Real Decisions", "TED", "How cognitive bias quietly shapes choices.", "TED talk decision making bias"),
    practice: vid("~10 min", "Practice a Real Decision Framework", "TED-Ed", "A concrete framework to apply this week.", "TED-Ed decision framework practice"),
    community: community("DecisionMaking", "Real decision frameworks people actually use."),
  },
  "critical-thinking": {
    start: vid("~10 min", "Critical Thinking for Complete Beginners", "CrashCourse", "A clear, structured intro to reasoning well.", "CrashCourse critical thinking"),
    deeper: vid("~10 min", "How to Spot Logical Fallacies", "CrashCourse Philosophy", "Common reasoning traps, explained clearly.", "CrashCourse philosophy logical fallacies"),
    practice: vid("~10 min", "Practice Evaluating Real Sources", "CrashCourse", "A concrete exercise in judging credibility.", "CrashCourse evaluating sources practice"),
    community: community("philosophy", "Real arguments and reasoning discussed openly."),
  },

  // ── Personal Life ──
  "reading-habit": {
    start: vid("~15 min", "How to Build a Real Reading Habit", "Ali Abdaal", "A grounded system for reading consistently.", "Ali Abdaal build a reading habit"),
    deeper: vid("~15 min", "Reading More Without More Time", "Thomas Frank", "Practical ways to fit reading into a busy life.", "Thomas Frank read more books"),
    practice: vid("~10 min", "Follow a Real Reading Challenge", "Ali Abdaal", "A concrete challenge to build the habit.", "Ali Abdaal reading challenge"),
    community: community("books", "Real recommendations and reading discussion."),
  },
  writing: {
    start: vid("~15 min", "Writing for Complete Beginners", "Jenna Moreci", "The real fundamentals before you write a first draft.", "Jenna Moreci writing tips for beginners"),
    deeper: vid("~15 min", "Structuring Ideas That Actually Work", "Shaelin Writes", "Practical structure lessons for stronger writing.", "Shaelin Writes structure tips"),
    practice: vid("~10 min", "Practice a Real Writing Exercise", "Jenna Moreci", "A concrete prompt to build the habit.", "Jenna Moreci writing exercise practice"),
    community: community("writing", "Real feedback on real drafts."),
  },
  photography: {
    start: vid("~15 min", "Photography for Complete Beginners", "Peter McKinnon", "Camera and exposure basics explained clearly.", "Peter McKinnon photography for beginners"),
    deeper: vid("~15 min", "Composition, Explained Simply", "Mango Street", "What actually makes a photo work.", "Mango Street composition tips"),
    practice: vid("~10 min", "Follow a Real Shooting Challenge", "Peter McKinnon", "A concrete challenge to build your eye.", "Peter McKinnon photo challenge"),
    community: community("photography", "Real photo feedback and technique discussion."),
  },
  music: {
    start: vid("~15 min", "Music Theory for Complete Beginners", "Signals Music Studio", "The real basics behind how music works.", "Signals Music Studio music theory beginners"),
    deeper: vid("~20 min", "How Real Songs Are Actually Built", "Rick Beato", "Breaks down real songs to show what works.", "Rick Beato song breakdown analysis"),
    practice: vid("~10 min", "Practice a Real Ear Training Exercise", "Signals Music Studio", "A concrete exercise to train your ear.", "Signals Music Studio ear training practice"),
    community: community("WeAreTheMusicMakers", "Real feedback from other musicians."),
  },
  drawing: {
    start: vid("~20 min", "Drawing for Complete Beginners", "Proko", "The real fundamentals before you pick a style.", "Proko drawing fundamentals beginners"),
    deeper: vid("~15 min", "Building Your Own Art Style", "Draw with Jazza", "How real style develops from consistent practice.", "Draw with Jazza finding your art style"),
    practice: vid("~15 min", "Follow a Real Drawing Exercise", "Sinix Design", "A concrete exercise to build real skill.", "Sinix Design drawing exercise practice"),
    community: community("learnart", "Real critique and progress from other artists."),
  },
  "travel-planning": {
    start: vid("~15 min", "How to Plan a Real Trip", "Kara and Nate", "A grounded, practical trip-planning walkthrough.", "Kara and Nate trip planning tips"),
    deeper: vid("~15 min", "Budgeting a Trip Properly", "Nomadic Matt", "Real numbers behind planning trips on a budget.", "Nomadic Matt trip budgeting tips"),
    practice: vid("~10 min", "Practice Booking Smart Travel", "Wolters World", "Real tactics for booking flights and stays.", "Wolters World booking travel tips"),
    community: community("travel", "Real itineraries and advice from other travelers."),
  },
  minimalism: {
    start: vid("~15 min", "Minimalism for Complete Beginners", "Matt D'Avella", "A grounded starting point, not an aesthetic.", "Matt D'Avella minimalism for beginners"),
    deeper: vid("~15 min", "Simplifying Life That Actually Lasts", "The Minimalists", "What makes minimalism sustainable long-term.", "The Minimalists simplify life talk"),
    practice: vid("~15 min", "Follow a Real Decluttering Challenge", "Matt D'Avella", "A concrete challenge to start today.", "Matt D'Avella decluttering challenge"),
    community: community("minimalism", "Real before-and-afters and honest lessons."),
  },
  "personal-branding": {
    start: vid("~15 min", "Personal Branding for Complete Beginners", "Think Media", "The real basics behind building a presence.", "Think Media personal branding beginners"),
    deeper: vid("~15 min", "Building a Real Online Presence", "Gary Vaynerchuk", "Practical lessons on consistency and content.", "Gary Vaynerchuk personal brand advice"),
    practice: vid("~10 min", "Practice Consistent Content Creation", "Think Media", "A concrete system for staying consistent.", "Think Media content consistency tips"),
    community: community("Entrepreneur", "Real branding lessons from working founders."),
  },
  fashion: {
    start: vid("~15 min", "Style Basics for Complete Beginners", "Alex Costa", "The real fundamentals before building a wardrobe.", "Alex Costa style basics beginners"),
    deeper: vid("~15 min", "Building a Real Wardrobe", "Real Men Real Style", "How to build a wardrobe that actually works.", "Real Men Real Style wardrobe basics"),
    practice: vid("~10 min", "Practice Mixing and Matching Outfits", "Alex Costa", "A concrete exercise for building outfits.", "Alex Costa mix match outfits"),
    community: community("malefashionadvice", "Real outfit feedback from other members."),
  },
  networking: {
    start: vid("~15 min", "Networking for Complete Beginners", "Charisma on Command", "The real basics behind building connections.", "Charisma on Command networking tips"),
    deeper: vid("~15 min", "Building Real Professional Relationships", "Linda Raynier", "What actually makes networking work long-term.", "Linda Raynier professional networking"),
    practice: vid("~10 min", "Practice Starting Real Conversations", "Charisma on Command", "A concrete exercise you can use this week.", "Charisma on Command starting conversations"),
    community: community("careerguidance", "Real networking questions and advice."),
  },
  "relationship-skills": {
    start: vid("~10 min", "Relationship Basics, Explained", "The School of Life", "A grounded starting point for healthier relationships.", "The School of Life relationship basics"),
    deeper: vid("~15 min", "How to Actually Resolve Conflict", "The School of Life", "Practical tools for real disagreements.", "The School of Life conflict resolution"),
    practice: vid("~10 min", "Practice Real Active Listening", "Psych2Go", "A concrete exercise to build the skill.", "Psych2Go active listening practice"),
    community: community("relationship_advice", "Real relationship questions and honest advice."),
  },
  "language-learning": {
    start: vid("~15 min", "Language Learning for Complete Beginners", "Easy Languages", "Real conversations that ease you into a language.", "Easy Languages beginner conversations"),
    deeper: vid("~15 min", "How Real Fluency Actually Develops", "Langfocus", "What the science says about learning languages.", "Langfocus how fluency develops"),
    practice: vid("~10 min", "Practice a Real Conversation", "Easy Languages", "Follow along with real native speakers.", "Easy Languages practice conversation"),
    community: community("languagelearning", "Real progress logs and study tips."),
  },
  "financial-planning": {
    start: vid("~15 min", "Financial Planning for Complete Beginners", "Two Cents", "A grounded starting point for a real plan.", "Two Cents financial planning beginners"),
    deeper: vid("~15 min", "Building a Real Long-Term Plan", "The Plain Bagel", "What a real financial plan actually looks like.", "The Plain Bagel long term financial plan"),
    practice: vid("~15 min", "Practice Building a Real Budget", "Khan Academy", "A guided, practical budgeting walkthrough.", "Khan Academy build a budget"),
    community: community("personalfinance", "Real planning questions and honest answers."),
  },
  "life-organization": {
    start: vid("~15 min", "Life Organization for Complete Beginners", "Matt D'Avella", "A grounded starting point for a simpler system.", "Matt D'Avella life organization tips"),
    deeper: vid("~15 min", "Building Real Systems That Stick", "Thomas Frank", "Systems that hold up under a busy week.", "Thomas Frank organization systems"),
    practice: vid("~10 min", "Follow a Real Weekly Review Habit", "Matt D'Avella", "A concrete weekly review you can start.", "Matt D'Avella weekly review habit"),
    community: community("productivity", "Real organization systems people actually use."),
  },

  // ── Student Life ──
  "exam-prep": {
    start: vid("~15 min", "Exam Prep for Complete Beginners", "Ali Abdaal", "A grounded starting plan before exam season.", "Ali Abdaal exam prep tips"),
    deeper: vid("~15 min", "Building a Real Study Plan", "Thomas Frank", "A concrete plan you can follow week to week.", "Thomas Frank study plan tips"),
    practice: vid("~10 min", "Practice a Real Active Recall Session", "Ali Abdaal", "A concrete session to try today.", "Ali Abdaal active recall technique"),
    community: community("GetStudying", "Real study logs and accountability."),
  },
  "study-techniques": {
    start: vid("~15 min", "Study Techniques for Complete Beginners", "Ali Abdaal", "A grounded intro to techniques that actually work.", "Ali Abdaal study techniques beginners"),
    deeper: vid("~15 min", "The Real Science of Studying", "MedSchoolInsiders", "What research says actually improves retention.", "MedSchoolInsiders science of studying"),
    practice: vid("~10 min", "Practice a Real Spaced Repetition Session", "Ali Abdaal", "A concrete session to try today.", "Ali Abdaal spaced repetition practice"),
    community: community("GetStudying", "Real study techniques from other students."),
  },
  "research-skills": {
    start: vid("~10 min", "Research Skills for Complete Beginners", "Scribbr", "A grounded intro to finding credible sources.", "Scribbr research skills beginners"),
    deeper: vid("~10 min", "How to Actually Read Academic Papers", "Scribbr", "A real, practical approach to dense papers.", "Scribbr how to read academic papers"),
    practice: vid("~10 min", "Practice Citing Real Sources Correctly", "Scribbr", "A concrete citation walkthrough.", "Scribbr citation practice tutorial"),
    community: community("AskAcademia", "Real research questions from students and academics."),
  },
  scholarships: {
    start: vid("~15 min", "Finding Scholarships as a Complete Beginner", "Scholarships360", "Where to actually start looking.", "Scholarships360 finding scholarships beginners"),
    deeper: vid("~15 min", "Building a Real Winning Application", "Scholly", "What actually makes an application stand out.", "Scholly scholarship application tips"),
    practice: vid("~10 min", "Practice Writing a Real Scholarship Essay", "Scholly", "A concrete essay walkthrough.", "Scholly scholarship essay writing tips"),
    community: community("ApplyingToCollege", "Real application and essay feedback."),
  },
  "study-abroad": {
    start: vid("~15 min", "Study Abroad, Explained for Beginners", "International Student", "A grounded overview of the whole process.", "International Student study abroad guide beginners"),
    deeper: vid("~15 min", "How the Real Visa Process Works", "International Student", "What the visa process actually involves.", "International Student visa process explained"),
    practice: vid("~10 min", "Practice Planning a Real Study Abroad Budget", "International Student", "A concrete budgeting walkthrough.", "International Student study abroad budget"),
    community: community("studyabroad", "Real experiences from students who've done it."),
  },
  ielts: {
    start: vid("~15 min", "IELTS for Complete Beginners", "IELTS Liz", "A grounded overview of the whole test.", "IELTS Liz beginner guide"),
    deeper: vid("~15 min", "How Real Band Scores Are Calculated", "IELTS Liz", "What examiners are actually scoring.", "IELTS Liz band score explained"),
    practice: vid("~15 min", "Practice a Real Speaking Test", "E2 IELTS", "A full mock speaking test to follow along with.", "E2 IELTS speaking test practice"),
    community: community("IELTS", "Real prep tips and score experiences."),
  },
  gre: {
    start: vid("~15 min", "GRE for Complete Beginners", "Magoosh", "A grounded overview of the whole test.", "Magoosh GRE beginner guide"),
    deeper: vid("~15 min", "How the Real GRE Scoring Works", "Magoosh", "What the adaptive scoring actually means.", "Magoosh GRE scoring explained"),
    practice: vid("~15 min", "Practice a Real GRE Quant Section", "Magoosh", "A full quant section walkthrough.", "Magoosh GRE quant practice"),
    community: community("GRE", "Real study plans and score experiences."),
  },
  "resume-building": {
    start: vid("~15 min", "Resume Building for Complete Beginners", "Self Made Millennial", "A grounded starting structure for any resume.", "Self Made Millennial resume tips beginners"),
    deeper: vid("~15 min", "Writing Real Achievement-Based Bullets", "CareerVidz", "How to turn duties into real achievements.", "CareerVidz resume bullet points"),
    practice: vid("~10 min", "Practice Tailoring a Real Resume", "Self Made Millennial", "A concrete tailoring walkthrough.", "Self Made Millennial tailor resume"),
    community: community("resumes", "Real resume feedback from other job seekers."),
  },
  "college-success": {
    start: vid("~15 min", "College Success for Complete Beginners", "Ali Abdaal", "A grounded starting point for the first semester.", "Ali Abdaal college success tips"),
    deeper: vid("~15 min", "Building Real Study Habits in College", "Thomas Frank", "What actually works once classes get harder.", "Thomas Frank college study habits"),
    practice: vid("~10 min", "Practice a Real Weekly Planning Routine", "Ali Abdaal", "A concrete routine to start this week.", "Ali Abdaal weekly planning routine"),
    community: community("college", "Real advice from current and former students."),
  },
};

/* ─────────────────────────────────────────────────────────────────────────
   Focus options — the dynamic chips shown on the activation page. A few
   paths get hand-picked labels that read naturally; every other path (all
   60+ of them) derives 3 sensible chips straight from its own modules, so
   nothing here is ever templated from a single "Coding" example.
───────────────────────────────────────────────────────────────────────── */

const FOCUS_OVERRIDES: Record<string, string[]> = {
  coding: ["Full-Stack", "DSA", "AI & Python"],
  "weight-loss": ["Weight Loss", "Strength", "Mobility"],
  "public-speaking": ["Public Speaking", "Interviews", "Confidence"],
  "communication-skills": ["Public Speaking", "Interviews", "Confidence"],
  drawing: ["Sketching", "Portraits", "Digital Art"],
  meditation: ["Stress Relief", "Sleep", "Daily Practice"],
  "ai-ml": ["Deep Learning", "NLP", "Computer Vision"],
  finance: ["Budgeting", "Investing", "Long-Term Planning"],
  entrepreneurship: ["Idea Validation", "MVP Building", "Fundraising"],
};

function shortLabel(mod: string) {
  const words = mod.replace(/&/g, "and").split(" ");
  return words.slice(0, 2).join(" ");
}

export function focusOptionsFor(p: PathDef): string[] {
  if (FOCUS_OVERRIDES[p.id]) return FOCUS_OVERRIDES[p.id];
  const [a, , c] = p.modules;
  return [shortLabel(a), shortLabel(p.modules[2] || p.modules[1]), shortLabel(c || p.modules[1])];
}

export function fallbackStack(p: PathDef): ResourceStack {
  return {
    start: vid("~15 min", `${p.modules[0]} — A Beginner-Friendly Introduction`, "Curated Pick", `A clear starting point for ${p.title.toLowerCase()}.`, `${p.title} for beginners`),
    deeper: vid("~15 min", `${p.modules[1]} — Explained in Depth`, "Curated Pick", `Goes further into the ideas behind ${p.title.toLowerCase()}.`, `${p.title} explained in depth`),
    practice: vid("~15 min", `Follow a Real ${p.modules[2]} Exercise`, "Curated Pick", `Hands-on practice you can follow along with.`, `${p.title} hands on practice tutorial`),
    community: community("selfimprovement", `Real progress and advice from people learning ${p.title.toLowerCase()}.`),
  };
}

// (removed — the entire premium overview is now GrowthPathOverviewPage.tsx)

/* ─────────────────────────────────────────────────────────────────────────
   Library (main) view
───────────────────────────────────────────────────────────────────────── */

export function GoalsPage({
  onNavigate,
  userProfile,
  onViewMentorsForPath,
}: {
  onNavigate?: (p: DashPage) => void;
  userProfile?: UserProfile | null;
  onViewMentorsForPath?: (category: string) => void;
}) {
  const { isDesktop, isMobile } = useViewport();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);

  // Growth Paths list lives inside the dashboard's scrollable <main>. We keep
  // our own scroll position here so opening a path and hitting Back can
  // restore exactly where the learner left off, instead of the browser
  // resetting scrollTop when the grid unmounts in favor of the detail view.
  const listScrollRef = useRef(0);

  const navigate = useNavigate();

  // "View Path" always opens the single canonical overview route —
  // /growth-paths/:id (GrowthPathOverviewPage) — instead of an in-page
  // detail view. A real route is what lets "Back to Path Overview" from
  // the journey page, and browser Back generally, land somewhere
  // deterministic every time, rather than sometimes landing on a
  // different, older overview experience.
  const openPath = (id: string) => {
    setRecentlyViewed((prev) => [id, ...prev.filter((x) => x !== id)].slice(0, 5));
    navigate(`/growth-paths/${id}`);
  };
  const closePath = () => {
    setSelectedId(null);
  };

  // Scroll the dashboard's <main> to the top when opening a path, and back
  // to the saved position when returning to the Growth Paths grid.
  useEffect(() => {
    const mainEl = document.querySelector("main");
    if (!mainEl) return;
    if (selectedId) {
      mainEl.scrollTop = 0;
    } else {
      mainEl.scrollTop = listScrollRef.current;
    }
  }, [selectedId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PATHS.filter((p) => {
      const matchQ = !q || p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q);
      const matchCat = !activeCategory || p.group === activeCategory;
      return matchQ && matchCat;
    });
  }, [search, activeCategory]);

  const isFiltering = search.trim().length > 0 || !!activeCategory;

  const selected = selectedId ? PATHS.find((p) => p.id === selectedId) : undefined;

  if (selected) {
    return (
      <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.25 }}>
        <PathDetailView
          p={selected}
          onBack={closePath}
          onViewMentors={() => {
            window.history.pushState({}, "", `/mentors?category=${selected.id}`);
            onViewMentorsForPath?.(selected.mentorCategory);
          }}
        />
      </motion.div>
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ padding: isDesktop ? "40px 48px 28px" : "20px 16px 20px" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "2.1rem" : "1.7rem", fontWeight: 700, color: C.text, margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          Growth Paths
        </h1>
        <p style={{ fontSize: "0.86rem", color: C.textMuted, margin: "0 0 26px" }}>
          Choose any area of your life and start a structured transformation journey.
        </p>

        {/* Search */}
        <div style={{ position: "relative", maxWidth: 400, marginBottom: 20 }}>
          <Search size={13} color={C.textFaint} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search growth paths…"
            style={{
              width: "100%", padding: "10px 14px 10px 34px", borderRadius: 999, border: `1px solid ${C.border}`,
              background: C.surface, color: C.text, fontSize: "0.84rem", outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Popular categories — horizontally scrollable chips on tablet/mobile */}
        <div className={isDesktop ? undefined : "starfix-chip-scroll"} style={{ display: "flex", gap: 8, flexWrap: isDesktop ? "wrap" : "nowrap" }}>
          {GROUPS.map((g) => {
            const active = activeCategory === g;
            return (
              <button
                key={g}
                onClick={() => setActiveCategory(active ? null : g)}
                style={{
                  padding: "7px 15px", borderRadius: 999, fontSize: "0.78rem", cursor: "pointer",
                  border: `1px solid ${active ? C.gold : C.border}`,
                  background: active ? C.goldLight : "transparent",
                  color: active ? "#7A6010" : C.textMuted,
                  fontFamily: "'Inter', sans-serif", transition: "all 0.15s",
                }}
              >
                {g}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recently viewed */}
      {!isFiltering && recentlyViewed.length > 0 && (
        <div style={{ padding: isDesktop ? "0 48px 30px" : "0 16px 24px" }}>
          <span style={{ ...LABEL, display: "block", marginBottom: 14 }}>Recently viewed</span>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {recentlyViewed.map((id) => {
              const rp = PATHS.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  onClick={() => openPath(id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 14px 8px 8px", borderRadius: 999,
                    border: `1px solid ${C.border}`, background: C.surface, cursor: "pointer", fontFamily: "'Inter', sans-serif",
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${rp.color}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <rp.Icon size={11} color={rp.color} />
                  </div>
                  <span style={{ fontSize: "0.78rem", color: C.text }}>{rp.title}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid — auto-fill naturally degrades 3 cols desktop → 2 tablet → 1
           mobile as the viewport narrows; only the outer page padding and
           card gap need adjusting so a 280px card never overflows a phone. */}
      <div style={{ padding: isDesktop ? "0 48px 56px" : "0 16px 40px" }}>
        {isFiltering ? (
          filtered.length === 0 ? (
            <div style={{ padding: "48px 0", textAlign: "center", color: C.textMuted, fontSize: "0.86rem" }}>No growth paths match your search.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              {filtered.map((p, i) => <PathCard key={p.id} p={p} delay={i * 0.03} onOpen={() => openPath(p.id)} />)}
            </div>
          )
        ) : (
          GROUPS.map((g) => {
            const items = PATHS.filter((p) => p.group === g);
            return (
              <div key={g} style={{ marginBottom: isDesktop ? 40 : 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: GROUP_COLOR[g] }} />
                  <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: isDesktop ? "1.2rem" : "1.05rem", fontWeight: 700, color: C.text, margin: 0 }}>{g}</h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(auto-fill, minmax(280px, 1fr))" : isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
                  {items.map((p, i) => <PathCard key={p.id} p={p} delay={i * 0.03} onOpen={() => openPath(p.id)} />)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
