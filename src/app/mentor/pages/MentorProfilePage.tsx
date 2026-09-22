import { useState, useEffect, useMemo, useRef } from "react";
import {
  User,
  Clock,
  DollarSign,
  Star,
  Save,
  Plus,
  Trash2,
  Check,
  Building,
  Briefcase,
  Linkedin,
  ShieldCheck,
  Wallet,
  Sparkles,
  Calendar,
  CalendarX,
  X,
  Globe,
  Award,
  Camera,
  IdCard,
  Layers,
  Compass,
  BookOpen,
  Users,
  GraduationCap,
  Eye,
  AlertCircle,
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import { MentorAvatar } from "../MentorAvatar";
import type {
  MentorProfileData,
  MentorReview,
  MentorEarnings,
  Mentee,
  MentorSession,
  WeeklyScheduleDay,
  BlockedDate,
} from "../lib/mentorDataService";
import {
  getStoredWeeklySchedule,
  saveWeeklySchedule,
  getStoredBlockedDates,
  saveBlockedDates,
} from "../lib/mentorDataService";
import { toast } from "sonner";

interface Props {
  mentor: MentorProfileData;
  mentees: Mentee[];
  sessions: MentorSession[];
  reviews: MentorReview[];
  earnings: MentorEarnings;
  onUpdateProfile: (patch: Partial<MentorProfileData>) => Promise<boolean>;
  onToggleAvailability: () => void;
}

const MENTORING_STYLE_OPTIONS = ["Structured & Curriculum-led", "Socratic / Question-led", "Hands-on Pair Programming", "Mock Interview Drills", "Career Strategy & Advocacy"];
const SESSION_TYPE_OPTIONS = ["1:1 Deep Dive", "Code / Design Review", "Mock Interview", "Career Strategy", "Free Intro Call"];
const TARGET_LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

export function MentorProfilePage({
  mentor,
  mentees,
  sessions,
  reviews,
  earnings,
  onUpdateProfile,
  onToggleAvailability,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [subTab, setSubTab] = useState<"profile" | "availability" | "earnings" | "reviews">("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local form state for Profile
  const [name, setName] = useState(mentor.name);
  const [headline, setHeadline] = useState(mentor.headline);
  const [company, setCompany] = useState(mentor.company);
  const [category, setCategory] = useState(mentor.category);
  const [yearsExperience, setYearsExperience] = useState(mentor.yearsExperience);
  const [bio, setBio] = useState(mentor.bio);
  const [mentoringApproach, setMentoringApproach] = useState(
    mentor.mentoringApproach || "I focus on first-principles system thinking, pragmatic code reviews, and structured mock interviews with actionable written feedback."
  );
  const [languages, setLanguages] = useState<string[]>(mentor.languages || ["English", "Hindi"]);
  const [newLangInput, setNewLangInput] = useState("");
  const [price, setPrice] = useState(mentor.price);
  const [offersFreeIntro, setOffersFreeIntro] = useState(mentor.offersFreeIntro);
  const [skills, setSkills] = useState<string[]>(mentor.skills);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(mentor.linkedinUrl || "");
  const [areasCanHelp, setAreasCanHelp] = useState<string[]>(mentor.areasCanHelp || []);
  const [newAreaInput, setNewAreaInput] = useState("");
  const [mentoringStyle, setMentoringStyle] = useState<string[]>(mentor.mentoringStyle || []);
  const [sessionTypes, setSessionTypes] = useState<string[]>(mentor.sessionTypes || []);
  const [targetLevel, setTargetLevel] = useState(mentor.targetLevel || "");
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Weekly Schedule & Blocked Dates State
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklyScheduleDay[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    setWeeklySchedule(getStoredWeeklySchedule());
    setBlockedDates(getStoredBlockedDates());
  }, []);

  // Unsaved-changes detection — compares the live form state against the
  // last-persisted `mentor` prop, so the Save button and header status can
  // honestly reflect whether there's anything to protect.
  const isDirty = useMemo(() => {
    return (
      name !== mentor.name ||
      headline !== mentor.headline ||
      company !== mentor.company ||
      category !== mentor.category ||
      yearsExperience !== mentor.yearsExperience ||
      bio !== mentor.bio ||
      mentoringApproach !== (mentor.mentoringApproach || "") ||
      JSON.stringify(languages) !== JSON.stringify(mentor.languages || []) ||
      JSON.stringify(skills) !== JSON.stringify(mentor.skills) ||
      linkedinUrl !== (mentor.linkedinUrl || "") ||
      JSON.stringify(areasCanHelp) !== JSON.stringify(mentor.areasCanHelp || []) ||
      JSON.stringify(mentoringStyle) !== JSON.stringify(mentor.mentoringStyle || []) ||
      JSON.stringify(sessionTypes) !== JSON.stringify(mentor.sessionTypes || []) ||
      targetLevel !== (mentor.targetLevel || "")
    );
  }, [name, headline, company, category, yearsExperience, bio, mentoringApproach, languages, skills, linkedinUrl, areasCanHelp, mentoringStyle, sessionTypes, targetLevel, mentor]);

  const handleToggleDay = (dayName: string) => {
    const updated = weeklySchedule.map((d) =>
      d.day === dayName ? { ...d, enabled: !d.enabled } : d
    );
    setWeeklySchedule(updated);
    saveWeeklySchedule(updated);
  };

  const handleTimeChange = (dayName: string, field: "startTime" | "endTime", value: string) => {
    const updated = weeklySchedule.map((d) =>
      d.day === dayName ? { ...d, [field]: value } : d
    );
    setWeeklySchedule(updated);
    saveWeeklySchedule(updated);
  };

  const handleAddBlockedDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedDate.trim()) return;
    const newEntry: BlockedDate = {
      id: `b_${Date.now()}`,
      date: newBlockedDate.trim(),
      reason: newBlockedReason.trim() || "Out of office / Busy",
    };
    const updated = [...blockedDates, newEntry];
    setBlockedDates(updated);
    saveBlockedDates(updated);
    setNewBlockedDate("");
    setNewBlockedReason("");
    toast.success("Added blocked date.");
  };

  const handleRemoveBlockedDate = (id: string) => {
    const updated = blockedDates.filter((b) => b.id !== id);
    setBlockedDates(updated);
    saveBlockedDates(updated);
    toast.info("Removed blocked date.");
  };

  const handleAddSkill = () => {
    const trimmed = newSkillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddLanguage = () => {
    const trimmed = newLangInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setNewLangInput("");
    }
  };

  const handleRemoveLanguage = (lang: string) => {
    setLanguages(languages.filter((l) => l !== lang));
  };

  const handleAddArea = () => {
    const trimmed = newAreaInput.trim();
    if (trimmed && !areasCanHelp.includes(trimmed)) {
      setAreasCanHelp([...areasCanHelp, trimmed]);
      setNewAreaInput("");
    }
  };
  const handleRemoveArea = (area: string) => setAreasCanHelp(areasCanHelp.filter((a) => a !== area));

  const toggleMentoringStyle = (style: string) => {
    setMentoringStyle((prev) => (prev.includes(style) ? prev.filter((s) => s !== style) : [...prev, style]));
  };
  const toggleSessionType = (type: string) => {
    setSessionTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]));
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const ok = await onUpdateProfile({ avatarUrl: dataUrl });
      if (ok) toast.success("Profile photo updated.");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const success = await onUpdateProfile({
      name,
      headline,
      company,
      category,
      yearsExperience: Number(yearsExperience) || 5,
      bio,
      mentoringApproach,
      mentoringStyle,
      sessionTypes,
      targetLevel,
      areasCanHelp,
      languages,
      price,
      offersFreeIntro,
      skills,
      linkedinUrl,
    });
    setSaving(false);
    if (success) {
      setLastSavedAt(new Date());
      toast.success("Mentor profile & availability updated successfully.");
    } else {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  // Real, non-fabricated summary metrics — derived from the mentees and
  // sessions this mentor actually has, never invented placeholder numbers.
  const activeMenteesCount = mentees.filter((m) => m.status === "Active").length;
  const sessionsCompletedCount = sessions.filter((s) => s.status === "Completed").length;
  const mentoringSinceLabel = mentor.mentorSince
    ? new Date(mentor.mentorSince).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Identity Header — premium mentor profile hero ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${M.surface} 0%, rgba(20,19,36,0.75) 100%)`,
          border: `1px solid ${M.border}`,
          borderRadius: M.radiusLg,
          padding: isCompact ? "22px 20px" : "30px 32px",
          position: "relative",
          overflow: "hidden",
          boxShadow: M.shadow,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute", top: -50, right: -50, width: 220, height: 220, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(212,175,55,0.12) 0%, transparent 70%)", pointerEvents: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            flexDirection: isCompact ? "column" : "row",
            alignItems: isCompact ? "flex-start" : "center",
            justifyContent: "space-between",
            gap: 18,
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18, minWidth: 0 }}>
            {/* Avatar with upload affordance */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <MentorAvatar name={mentor.name} avatarUrl={mentor.avatarUrl} size={isCompact ? 64 : 76} glow />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Change profile photo"
                style={{
                  position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%",
                  background: M.gold, border: `2px solid ${M.surface}`, display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}
              >
                <Camera size={12} color="#11101a" />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarFileChange} style={{ display: "none" }} />
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.08em", color: M.gold, fontWeight: 700 }}>
                  Starfix Mentor
                </span>
                <span
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: M.radiusPill,
                    background: mentor.acceptingMentees ? M.greenBg : "rgba(255,255,255,0.06)",
                    border: `1px solid ${mentor.acceptingMentees ? M.greenBorder : M.border}`,
                    color: mentor.acceptingMentees ? M.green : M.textFaint, fontSize: "0.68rem", fontWeight: 700,
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: mentor.acceptingMentees ? M.green : M.textFaint }} />
                  {mentor.acceptingMentees ? "Available" : "Paused"}
                </span>
                {mentor.rating >= 4.5 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: "0.68rem", color: M.gold, fontWeight: 700 }}>
                    <ShieldCheck size={12} /> Verified Faculty
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: M.serif, fontSize: isCompact ? "1.5rem" : "1.85rem", fontWeight: 700, color: M.text, margin: 0, lineHeight: 1.15 }}>
                {mentor.name}
              </h1>
              <p style={{ color: M.textMuted, fontSize: "0.92rem", marginTop: 4, marginBottom: 0 }}>
                {mentor.headline}{mentor.company ? ` · ${mentor.company}` : ""}
              </p>
            </div>
          </div>

          {subTab === "profile" && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: isCompact ? "flex-start" : "flex-end", gap: 6, width: isCompact ? "100%" : "auto" }}>
              <button
                onClick={handleSaveProfile}
                disabled={saving || !isDirty}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", borderRadius: M.radiusSm,
                  background: isDirty ? M.gold : "rgba(255,255,255,0.06)",
                  color: isDirty ? "#11101a" : M.textFaint,
                  border: isDirty ? "none" : `1px solid ${M.border}`,
                  fontWeight: 700, fontSize: "0.86rem",
                  cursor: saving || !isDirty ? "default" : "pointer",
                  fontFamily: M.sans, opacity: saving ? 0.7 : 1, width: isCompact ? "100%" : "auto",
                  justifyContent: "center",
                  boxShadow: isDirty ? "0 2px 10px rgba(212,175,55,0.25)" : "none",
                }}
              >
                <Save size={15} /> {saving ? "Saving…" : isDirty ? "Save Profile" : "Saved"}
              </button>
              <span style={{ fontSize: "0.72rem", color: isDirty ? M.amber : M.textFaint, display: "flex", alignItems: "center", gap: 5 }}>
                {isDirty ? (
                  <><AlertCircle size={11} /> Unsaved changes</>
                ) : lastSavedAt ? (
                  <><Check size={11} color={M.green} /> Saved just now</>
                ) : (
                  "All changes saved"
                )}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Mentor Snapshot — what a student actually cares about ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr 1fr" : isCompact ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
          gap: 12,
        }}
      >
        {[
          { icon: Briefcase, label: "Expertise", value: mentor.category },
          { icon: Award, label: "Experience", value: `${mentor.yearsExperience}+ yrs` },
          { icon: Users, label: "Active Mentees", value: String(activeMenteesCount) },
          { icon: GraduationCap, label: "Sessions Done", value: String(sessionsCompletedCount) },
          { icon: Calendar, label: "Mentoring Since", value: mentoringSinceLabel },
          { icon: Star, label: "Rating", value: mentor.totalReviews > 0 ? `${mentor.rating.toFixed(1)} ★` : "New" },
        ].map((s) => (
          <div key={s.label} style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusSm, padding: "12px 14px" }}>
            <s.icon size={13} color={M.gold} />
            <div style={{ fontSize: "0.95rem", fontWeight: 700, color: M.text, marginTop: 6 }}>{s.value}</div>
            <div style={{ fontSize: "0.68rem", color: M.textFaint, marginTop: 1 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12, overflowX: "auto" }}>
        {[
          { id: "profile", label: "Public Profile", icon: User },
          { id: "availability", label: "Availability & Schedule", icon: Clock },
          { id: "earnings", label: "Earnings & Payouts", icon: DollarSign },
          { id: "reviews", label: "Mentee Reviews", icon: Star, count: reviews.length },
        ].map((tab) => {
          const active = subTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as any)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 16px",
                borderRadius: M.radiusPill,
                background: active ? M.goldBg : "transparent",
                border: `1px solid ${active ? M.goldBorder : "transparent"}`,
                color: active ? M.gold : M.textMuted,
                fontSize: "0.84rem",
                fontWeight: active ? 700 : 500,
                cursor: "pointer",
                fontFamily: M.sans,
                transition: "all 0.16s ease",
                whiteSpace: "nowrap",
              }}
            >
              <Icon size={14} color={active ? M.gold : M.textMuted} />
              {tab.label}
              {tab.count !== undefined && (
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "1px 6px",
                    borderRadius: 999,
                    background: active ? M.gold : "rgba(255,255,255,0.08)",
                    color: active ? "#11101a" : M.textFaint,
                    fontWeight: 700,
                  }}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── SubTab 1: Profile ── */}
      {subTab === "profile" && (
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── Group: Identity & Professional Information ── */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: isCompact ? "20px" : "28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <IdCard size={16} color={M.gold} />
              <div>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: M.text, margin: 0 }}>Identity & Professional Information</h3>
                <p style={{ fontSize: "0.78rem", color: M.textFaint, margin: "2px 0 0" }}>How you're identified across Starfix</p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 18 }}>
              {/* Full Name */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              {/* Company / Affiliation */}
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Current Company / Affiliation
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Microsoft, Starfix Faculty"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Professional Headline */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Distributed Systems Engineer & Career Coach"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>

            {/* Category & Years Experience */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.2fr 1fr", gap: 18 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Primary Discipline
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                >
                  <option value="Coding">Software Engineering & Architecture</option>
                  <option value="AI & ML">AI, Machine Learning & PyTorch</option>
                  <option value="Cloud">Cloud, DevOps & SRE</option>
                  <option value="Design">Product Design & Systems</option>
                  <option value="Career">Career Placement & Mock Interviews</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Years of Industry Experience
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                LinkedIn Profile URL
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "10px 14px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.88rem",
                  outline: "none",
                }}
              />
            </div>
          </div>

          {/* ── Group: Expertise & Specializations ── */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: isCompact ? "20px" : "28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Layers size={16} color={M.gold} />
              <div>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: M.text, margin: 0 }}>Expertise & Specializations</h3>
                <p style={{ fontSize: "0.78rem", color: M.textFaint, margin: "2px 0 0" }}>What you're known for, and who you can help</p>
              </div>
            </div>

            {/* Skills & Expertise Tags */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Technical Skills & Focus Areas
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {skills.map((skill) => (
                  <span
                    key={skill}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: M.radiusPill,
                      background: "rgba(255,255,255,0.06)",
                      border: `1px solid ${M.border}`,
                      color: M.text,
                      fontSize: "0.78rem",
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: 360 }}>
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  placeholder="Add a skill (e.g. Distributed Consensus)…"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.84rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  style={{
                    padding: "8px 14px",
                    borderRadius: M.radiusSm,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Areas I Can Help With — new */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Areas I Can Help With
              </label>
              <p style={{ fontSize: "0.76rem", color: M.textFaint, margin: "0 0 10px" }}>
                Concrete situations a student would recognize — e.g. "Resume & LinkedIn review", "System design interviews".
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {areasCanHelp.map((area) => (
                  <span
                    key={area}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: M.radiusPill,
                      background: M.blueBg, border: `1px solid ${M.blueBorder}`, color: M.blue, fontSize: "0.78rem",
                    }}
                  >
                    <Compass size={11} />
                    {area}
                    <button type="button" onClick={() => handleRemoveArea(area)} style={{ background: "none", border: "none", color: M.blue, cursor: "pointer", padding: 0, display: "flex" }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {areasCanHelp.length === 0 && (
                  <span style={{ fontSize: "0.78rem", color: M.textFaint, fontStyle: "italic" }}>None added yet — students see this as a quick-scan list.</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: 400 }}>
                <input
                  type="text"
                  value={newAreaInput}
                  onChange={(e) => setNewAreaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddArea(); } }}
                  placeholder="Add an area (e.g. Mock interviews)…"
                  style={{ flex: 1, padding: "8px 12px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.border}`, color: M.text, fontSize: "0.84rem", outline: "none" }}
                />
                <button type="button" onClick={handleAddArea} style={{ padding: "8px 14px", borderRadius: M.radiusSm, background: "rgba(255,255,255,0.06)", border: `1px solid ${M.border}`, color: M.text, fontSize: "0.82rem", cursor: "pointer" }}>
                  Add
                </button>
              </div>
            </div>

            {/* Languages Spoken */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Languages Spoken
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {languages.map((lang) => (
                  <span
                    key={lang}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "4px 10px",
                      borderRadius: M.radiusPill,
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      color: M.gold,
                      fontSize: "0.78rem",
                    }}
                  >
                    <Globe size={11} />
                    {lang}
                    <button
                      type="button"
                      onClick={() => handleRemoveLanguage(lang)}
                      style={{ background: "none", border: "none", color: M.gold, cursor: "pointer", padding: 0, display: "flex" }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, maxWidth: 360 }}>
                <input
                  type="text"
                  value={newLangInput}
                  onChange={(e) => setNewLangInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLanguage();
                    }
                  }}
                  placeholder="Add language (e.g. English, French)…"
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.84rem",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddLanguage}
                  style={{
                    padding: "8px 14px",
                    borderRadius: M.radiusSm,
                    background: "rgba(255,255,255,0.06)",
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* ── Group: Mentoring Approach ── */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: isCompact ? "20px" : "28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Compass size={16} color={M.gold} />
              <div>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: M.text, margin: 0 }}>Mentoring Approach</h3>
                <p style={{ fontSize: "0.78rem", color: M.textFaint, margin: "2px 0 0" }}>How you actually run a session, and who it's best suited for</p>
              </div>
            </div>

            {/* Mentoring Approach & Philosophy */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Mentoring Approach & Philosophy
              </label>
              <textarea
                rows={3}
                value={mentoringApproach}
                onChange={(e) => setMentoringApproach(e.target.value)}
                placeholder="Describe your pedagogical philosophy (e.g., first-principles thinking, live coding walkthroughs, mock interviews with rubric scoring)…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Mentoring Style — new, multi-select chips */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Mentoring Style
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {MENTORING_STYLE_OPTIONS.map((opt) => {
                  const active = mentoringStyle.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleMentoringStyle(opt)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: M.radiusPill,
                        background: active ? M.goldBg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? M.goldBorder : M.border}`,
                        color: active ? M.gold : M.textMuted, fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                        cursor: "pointer", fontFamily: M.sans,
                      }}
                    >
                      {active && <Check size={11} />} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Session Types — new, multi-select chips */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 8 }}>
                Session Types Offered
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SESSION_TYPE_OPTIONS.map((opt) => {
                  const active = sessionTypes.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => toggleSessionType(opt)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: M.radiusPill,
                        background: active ? M.purpleBg : "rgba(255,255,255,0.04)",
                        border: `1px solid ${active ? M.purpleBorder : M.border}`,
                        color: active ? M.purple : M.textMuted, fontSize: "0.8rem", fontWeight: active ? 700 : 500,
                        cursor: "pointer", fontFamily: M.sans,
                      }}
                    >
                      {active && <Check size={11} />} {opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Target Learner Level — new */}
            <div style={{ maxWidth: 320 }}>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Target Learner Level
              </label>
              <select
                value={targetLevel}
                onChange={(e) => setTargetLevel(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: M.radiusSm, background: M.surfaceAlt, border: `1px solid ${M.border}`, color: M.text, fontSize: "0.88rem", outline: "none" }}
              >
                <option value="">Not specified</option>
                {TARGET_LEVEL_OPTIONS.map((lvl) => <option key={lvl} value={lvl}>{lvl}</option>)}
              </select>
            </div>
          </div>

          {/* ── Group: Public Introduction ── */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: isCompact ? "20px" : "28px", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <BookOpen size={16} color={M.gold} />
              <div>
                <h3 style={{ fontSize: "0.98rem", fontWeight: 700, color: M.text, margin: 0 }}>Public Introduction</h3>
                <p style={{ fontSize: "0.78rem", color: M.textFaint, margin: "2px 0 0" }}>The first thing a student reads on your profile</p>
              </div>
            </div>

            {/* Public Bio */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Public Bio & Background
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Introduce your engineering background and what mentees can expect to gain from working with you…"
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.88rem",
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </form>
      )}

      {/* ── SubTab 2: Availability & Weekly Schedule ── */}
      {subTab === "availability" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          {/* Availability Status Card */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              alignItems: isMobile ? "flex-start" : "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Mentorship Availability
              </h3>
              <p style={{ color: M.textMuted, fontSize: "0.85rem", marginTop: 4, marginBottom: 0 }}>
                When active, your profile appears in the Starfix Mentors catalog and students can book slots.
              </p>
            </div>

            <button
              onClick={onToggleAvailability}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: M.radiusPill,
                background: mentor.acceptingMentees ? M.greenBg : "rgba(255,255,255,0.06)",
                border: `1px solid ${mentor.acceptingMentees ? M.greenBorder : M.border}`,
                color: mentor.acceptingMentees ? M.green : M.textFaint,
                fontWeight: 700,
                fontSize: "0.86rem",
                cursor: "pointer",
                fontFamily: M.sans,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: mentor.acceptingMentees ? M.green : M.textFaint,
                }}
              />
              {mentor.acceptingMentees ? "Accepting Mentees (Live)" : "Paused / Offline"}
            </button>
          </div>

          {/* Pricing & Free Intro Session */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
              Session Pricing & Intro Policy
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Default 45-Min Session Rate (INR)
                </label>
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="₹2,500"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.border}`,
                    color: M.text,
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Intro Session
                </label>
                <button
                  type="button"
                  onClick={() => setOffersFreeIntro(!offersFreeIntro)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 10,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "6px 0",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 6,
                      border: `1.5px solid ${offersFreeIntro ? M.gold : M.border}`,
                      background: offersFreeIntro ? M.gold : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {offersFreeIntro && <Check size={14} color="#11101a" />}
                  </div>
                  <span style={{ fontSize: "0.88rem", color: M.text }}>
                    Offer a 30-min free introductory alignment session
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* How students see your availability — preview */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.goldBorder}`,
              borderRadius: M.radiusLg,
              padding: "20px 24px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Eye size={15} color={M.gold} />
              <h3 style={{ fontSize: "0.92rem", fontWeight: 700, color: M.gold, margin: 0 }}>
                How Students See Your Availability
              </h3>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <MentorAvatar name={mentor.name} avatarUrl={mentor.avatarUrl} size={38} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: M.text }}>{mentor.name}</div>
                <div style={{ fontSize: "0.76rem", color: M.textMuted, marginTop: 2 }}>
                  {mentor.acceptingMentees
                    ? `Accepting mentees · ${weeklySchedule.filter((d) => d.enabled).length} days/week · ${mentor.sessionDuration} sessions`
                    : "Currently paused — not bookable"}
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {weeklySchedule.filter((d) => d.enabled).map((d) => (
                  <span key={d.day} style={{ fontSize: "0.7rem", padding: "3px 8px", borderRadius: M.radiusPill, background: M.goldBg, border: `1px solid ${M.goldBorder}`, color: M.gold, fontWeight: 600 }}>
                    {d.day.slice(0, 3)}
                  </span>
                ))}
                {weeklySchedule.filter((d) => d.enabled).length === 0 && (
                  <span style={{ fontSize: "0.76rem", color: M.textFaint, fontStyle: "italic" }}>No days enabled — students won't see any open slots.</span>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Weekly Schedule Manager */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                  Weekly Coaching Schedule
                </h3>
                <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                  Set your standard availability window for each day of the week.
                </p>
              </div>
              <span style={{ fontSize: "0.76rem", color: M.green, fontWeight: 600 }}>
                ● Auto-saved
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {weeklySchedule.map((dayItem) => (
                <div
                  key={dayItem.day}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 16px",
                    borderRadius: M.radiusSm,
                    background: dayItem.enabled ? M.surfaceAlt : "rgba(255,255,255,0.015)",
                    border: `1px solid ${dayItem.enabled ? M.borderSubtle : M.border}`,
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 140 }}>
                    <button
                      type="button"
                      onClick={() => handleToggleDay(dayItem.day)}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        border: `1.5px solid ${dayItem.enabled ? M.gold : M.border}`,
                        background: dayItem.enabled ? M.gold : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {dayItem.enabled && <Check size={13} color="#11101a" />}
                    </button>
                    <span style={{ fontWeight: 600, fontSize: "0.88rem", color: dayItem.enabled ? M.text : M.textFaint }}>
                      {dayItem.day}
                    </span>
                  </div>

                  {dayItem.enabled ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input
                        type="text"
                        value={dayItem.startTime}
                        onChange={(e) => handleTimeChange(dayItem.day, "startTime", e.target.value)}
                        style={{
                          width: 100,
                          padding: "6px 10px",
                          borderRadius: M.radiusSm,
                          background: M.surface,
                          border: `1px solid ${M.border}`,
                          color: M.text,
                          fontSize: "0.82rem",
                          textAlign: "center",
                        }}
                      />
                      <span style={{ color: M.textFaint, fontSize: "0.8rem" }}>to</span>
                      <input
                        type="text"
                        value={dayItem.endTime}
                        onChange={(e) => handleTimeChange(dayItem.day, "endTime", e.target.value)}
                        style={{
                          width: 100,
                          padding: "6px 10px",
                          borderRadius: M.radiusSm,
                          background: M.surface,
                          border: `1px solid ${M.border}`,
                          color: M.text,
                          fontSize: "0.82rem",
                          textAlign: "center",
                        }}
                      />
                    </div>
                  ) : (
                    <span style={{ fontSize: "0.8rem", color: M.textFaint, fontStyle: "italic" }}>
                      Unavailable
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Blocked Dates & Vacation Manager */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Blocked Dates & Vacations
              </h3>
              <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                Add specific dates when you will be unavailable for bookings.
              </p>
            </div>

            <form onSubmit={handleAddBlockedDate} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                type="text"
                value={newBlockedDate}
                onChange={(e) => setNewBlockedDate(e.target.value)}
                placeholder="Date (e.g. 2026-10-15 or Oct 15)…"
                style={{
                  width: 200,
                  padding: "8px 12px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.84rem",
                  outline: "none",
                }}
              />
              <input
                type="text"
                value={newBlockedReason}
                onChange={(e) => setNewBlockedReason(e.target.value)}
                placeholder="Reason (e.g. Conference, Out of Town)…"
                style={{
                  flex: 1,
                  minWidth: 220,
                  padding: "8px 12px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.84rem",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                disabled={!newBlockedDate.trim()}
                style={{
                  padding: "8px 16px",
                  borderRadius: M.radiusSm,
                  background: newBlockedDate.trim() ? M.gold : "rgba(255,255,255,0.06)",
                  border: "none",
                  color: newBlockedDate.trim() ? "#11101a" : M.textFaint,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: newBlockedDate.trim() ? "pointer" : "default",
                }}
              >
                Add Date
              </button>
            </form>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {blockedDates.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.borderSubtle}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <CalendarX size={14} color={M.gold} />
                    <span style={{ fontWeight: 600, fontSize: "0.86rem", color: M.text }}>
                      {entry.date}
                    </span>
                    <span style={{ color: M.textFaint, fontSize: "0.78rem" }}>
                      — {entry.reason}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveBlockedDate(entry.id)}
                    style={{ background: "none", border: "none", color: M.textFaint, cursor: "pointer" }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SubTab 3: Earnings & Payouts ── */}
      {subTab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Earnings Overview Cards */}
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16 }}>
            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "20px 22px" }}>
              <div style={{ fontSize: "0.78rem", color: M.textFaint, textTransform: "uppercase" }}>Total Earned</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, color: M.gold, marginTop: 6 }}>
                ₹{earnings.totalEarned.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.76rem", color: M.green, marginTop: 4 }}>
                19 Completed Sessions
              </div>
            </div>

            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "20px 22px" }}>
              <div style={{ fontSize: "0.78rem", color: M.textFaint, textTransform: "uppercase" }}>Pending Payout</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, color: M.text, marginTop: 6 }}>
                ₹{earnings.pendingPayout.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.76rem", color: M.textMuted, marginTop: 4 }}>
                Scheduled for Sep 25
              </div>
            </div>

            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "20px 22px" }}>
              <div style={{ fontSize: "0.78rem", color: M.textFaint, textTransform: "uppercase" }}>Avg per Session</div>
              <div style={{ fontSize: "1.9rem", fontWeight: 700, color: M.text, marginTop: 6 }}>
                ₹{earnings.avgPerSession.toLocaleString()}
              </div>
              <div style={{ fontSize: "0.76rem", color: M.goldLight, marginTop: 4 }}>
                Starfix Faculty Tier
              </div>
            </div>
          </div>

          {/* Payout Destination */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Wallet size={20} color={M.gold} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", color: M.text }}>
                  Payout Destination
                </div>
                <div style={{ color: M.textFaint, fontSize: "0.78rem", marginTop: 2 }}>
                  {earnings.payoutMethod}
                </div>
              </div>
            </div>
            <span style={{ fontSize: "0.74rem", padding: "3px 8px", borderRadius: M.radiusPill, background: M.greenBg, color: M.green, fontWeight: 700 }}>
              Verified
            </span>
          </div>

          {/* Transaction History */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: "24px 26px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: "0 0 16px" }}>
              Recent Payout History
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {earnings.history.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 14px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.borderSubtle}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: M.text }}>
                      {tx.sessionTitle}
                    </div>
                    <div style={{ fontSize: "0.74rem", color: M.textFaint, marginTop: 2 }}>
                      {tx.menteeName} · {tx.date}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: M.gold }}>
                      ₹{tx.amount.toLocaleString()}
                    </div>
                    <span style={{ fontSize: "0.7rem", color: tx.status === "Paid" ? M.green : M.amber }}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SubTab 4: Mentee Reviews ── */}
      {subTab === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Review Stats */}
          <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radiusLg, padding: "24px 28px", display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", borderRight: `1px solid ${M.borderSubtle}`, paddingRight: 24 }}>
              <span style={{ fontFamily: M.sans, fontSize: "2.8rem", fontWeight: 700, color: M.gold }}>
                {mentor.rating.toFixed(1)}
              </span>
              <div style={{ display: "flex", gap: 3, margin: "4px 0" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} color={M.gold} fill={M.gold} />
                ))}
              </div>
              <span style={{ fontSize: "0.76rem", color: M.textFaint }}>
                {mentor.totalReviews} verified reviews
              </span>
            </div>

            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: M.text, margin: 0 }}>
                Exceptional Faculty Standing
              </h3>
              <p style={{ color: M.textMuted, fontSize: "0.85rem", marginTop: 4, lineHeight: 1.5 }}>
                100% of your mentees rated their sessions 5 stars. Your detailed feedback and system architecture guidance are widely praised.
              </p>
            </div>
          </div>

          {/* Reviews List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: M.radius,
                  padding: "18px 22px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.92rem", color: M.text }}>
                      {rev.menteeName}
                    </span>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} color={M.gold} fill={M.gold} />
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize: "0.74rem", color: M.textFaint }}>{rev.date}</span>
                </div>

                <div style={{ fontSize: "0.74rem", color: M.goldLight, marginBottom: 8 }}>
                  {rev.sessionType}
                </div>

                <p style={{ color: M.textMuted, fontSize: "0.85rem", margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>
                  "{rev.comment}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
