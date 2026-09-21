import { useState } from "react";
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
} from "lucide-react";
import { M } from "../mentorColors";
import { useViewport } from "../../lib/useViewport";
import type {
  MentorProfileData,
  MentorReview,
  MentorEarnings,
} from "../lib/mentorDataService";
import { toast } from "sonner";

interface Props {
  mentor: MentorProfileData;
  reviews: MentorReview[];
  earnings: MentorEarnings;
  onUpdateProfile: (patch: Partial<MentorProfileData>) => Promise<boolean>;
  onToggleAvailability: () => void;
}

export function MentorProfilePage({
  mentor,
  reviews,
  earnings,
  onUpdateProfile,
  onToggleAvailability,
}: Props) {
  const { isCompact, isMobile } = useViewport();
  const [subTab, setSubTab] = useState<"profile" | "availability" | "earnings" | "reviews">("profile");

  // Local form state
  const [name, setName] = useState(mentor.name);
  const [headline, setHeadline] = useState(mentor.headline);
  const [company, setCompany] = useState(mentor.company);
  const [category, setCategory] = useState(mentor.category);
  const [yearsExperience, setYearsExperience] = useState(mentor.yearsExperience);
  const [bio, setBio] = useState(mentor.bio);
  const [price, setPrice] = useState(mentor.price);
  const [offersFreeIntro, setOffersFreeIntro] = useState(mentor.offersFreeIntro);
  const [skills, setSkills] = useState<string[]>(mentor.skills);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState(mentor.linkedinUrl || "");
  const [saving, setSaving] = useState(false);

  // Session offerings
  const [sessionTypes, setSessionTypes] = useState([
    { name: "1:1 Quick Sync & Unblocking", duration: "30 min", price: "₹1,299", includes: "Quick code/math review, specific blockers" },
    { name: "Deep Dive Architecture Review", duration: "45 min", price: "₹2,500", includes: "System design, microservice review, next-step plan" },
    { name: "Full Mock Interview & Feedback", duration: "60 min", price: "₹3,500", includes: "Live coding/system round, rubric evaluation" },
  ]);

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
      price,
      offersFreeIntro,
      skills,
      linkedinUrl,
    });
    setSaving(false);
    if (success) {
      toast.success("Mentor profile & availability updated successfully.");
    } else {
      toast.error("Failed to update profile. Please try again.");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* ── Page Header ── */}
      <div
        style={{
          display: "flex",
          flexDirection: isCompact ? "column" : "row",
          alignItems: isCompact ? "flex-start" : "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", color: M.gold, fontWeight: 700 }}>
              Mentor Settings
            </span>
          </div>
          <h1 style={{ fontFamily: M.serif, fontSize: "1.85rem", fontWeight: 700, color: M.text, margin: 0 }}>
            Profile & Availability
          </h1>
          <p style={{ color: M.textMuted, fontSize: "0.88rem", marginTop: 4, marginBottom: 0 }}>
            Manage your public mentor persona, session offerings, earnings, and mentee feedback.
          </p>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 22px",
            borderRadius: M.radiusSm,
            background: M.gold,
            color: "#11101a",
            border: "none",
            fontWeight: 700,
            fontSize: "0.86rem",
            cursor: saving ? "default" : "pointer",
            fontFamily: M.sans,
            opacity: saving ? 0.7 : 1,
            boxShadow: "0 2px 10px rgba(212,175,55,0.25)",
          }}
        >
          <Save size={15} /> {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${M.border}`, paddingBottom: 12, overflowX: "auto" }}>
        {[
          { id: "profile", label: "Profile Information", icon: User },
          { id: "availability", label: "Availability & Rates", icon: Clock },
          { id: "earnings", label: "Earnings & Payouts", icon: Wallet },
          { id: "reviews", label: "Reviews & Feedback", icon: Star },
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
                whiteSpace: "nowrap",
                transition: "all 0.16s ease",
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── SubTab 1: Profile Information ── */}
      {subTab === "profile" && (
        <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "26px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
              Basic Information
            </h3>

            {/* Name and Headline */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1.5fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
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

              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Headline / Title
                </label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Senior Machine Learning Engineer at Google"
                  required
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

            {/* Company, Category, Years Experience */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Current Company
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, Stripe, or Founder"
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

              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Professional Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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
                >
                  {["Coding", "AI/ML", "UI/UX", "Finance", "Entrepreneurship", "Languages", "Communication"].map((c) => (
                    <option key={c} value={c} style={{ background: "#11101a", color: "#FAF9F6" }}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Years of Experience
                </label>
                <input
                  type="number"
                  value={yearsExperience}
                  onChange={(e) => setYearsExperience(Number(e.target.value))}
                  min={1}
                  max={40}
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

            {/* Bio */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Mentor Bio / About
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Describe your background, areas of expertise, and how you guide students..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  padding: "12px 14px",
                  borderRadius: M.radiusSm,
                  background: M.surfaceAlt,
                  border: `1px solid ${M.border}`,
                  color: M.text,
                  fontSize: "0.88rem",
                  fontFamily: M.sans,
                  lineHeight: 1.5,
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Skills tags */}
            <div>
              <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                Expertise & Skills
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
                      background: M.goldBg,
                      border: `1px solid ${M.goldBorder}`,
                      color: M.goldLight,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                    }}
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      style={{ background: "none", border: "none", color: M.gold, cursor: "pointer", padding: 0, fontSize: "0.8rem" }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
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
                  placeholder="Add a skill (e.g. Distributed Systems)…"
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
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Add
                </button>
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
        </form>
      )}

      {/* ── SubTab 2: Availability & Rates ── */}
      {subTab === "availability" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
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
              Session Pricing & Policy
            </h3>

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <div>
                <label style={{ fontSize: "0.78rem", color: M.textMuted, fontWeight: 600, display: "block", marginBottom: 6 }}>
                  Default Session Rate (INR)
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

            {/* Session Offerings Cards */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: M.gold, marginBottom: 10 }}>
                Configured Session Offerings
              </div>
              <div style={{ display: "grid", gridTemplateColumns: isCompact ? "1fr" : "repeat(3, 1fr)", gap: 14 }}>
                {sessionTypes.map((st, i) => (
                  <div
                    key={i}
                    style={{
                      background: M.surfaceAlt,
                      border: `1px solid ${M.borderSubtle}`,
                      borderRadius: M.radius,
                      padding: "16px 18px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.92rem", color: M.text }}>{st.name}</span>
                      <span style={{ color: M.gold, fontWeight: 700, fontSize: "0.88rem" }}>{st.price}</span>
                    </div>
                    <div style={{ fontSize: "0.76rem", color: M.textFaint, marginTop: 4 }}>
                      Duration: {st.duration}
                    </div>
                    <p style={{ color: M.textMuted, fontSize: "0.8rem", marginTop: 8, lineHeight: 1.4 }}>
                      {st.includes}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SubTab 3: Earnings & Payouts (Secondary Area as requested) ── */}
      {subTab === "earnings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Earnings Overview Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : isCompact ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
              gap: 16,
            }}
          >
            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "18px 20px" }}>
              <div style={{ color: M.textMuted, fontSize: "0.78rem" }}>Total Revenue Earned</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: M.text, marginTop: 6 }}>
                ₹{earnings.totalEarned.toLocaleString()}
              </div>
              <div style={{ color: M.green, fontSize: "0.74rem", marginTop: 4 }}>All-time mentorship fees</div>
            </div>

            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "18px 20px" }}>
              <div style={{ color: M.textMuted, fontSize: "0.78rem" }}>Pending Next Payout</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: M.gold, marginTop: 6 }}>
                ₹{earnings.pendingPayout.toLocaleString()}
              </div>
              <div style={{ color: M.textFaint, fontSize: "0.74rem", marginTop: 4 }}>Processing for Sep 25</div>
            </div>

            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "18px 20px" }}>
              <div style={{ color: M.textMuted, fontSize: "0.78rem" }}>Completed Sessions</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: M.text, marginTop: 6 }}>
                {earnings.completedSessionsCount}
              </div>
              <div style={{ color: M.textFaint, fontSize: "0.74rem", marginTop: 4 }}>100% fulfillment rate</div>
            </div>

            <div style={{ background: M.surface, border: `1px solid ${M.border}`, borderRadius: M.radius, padding: "18px 20px" }}>
              <div style={{ color: M.textMuted, fontSize: "0.78rem" }}>Average Fee / Session</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 700, color: M.text, marginTop: 6 }}>
                ₹{earnings.avgPerSession.toLocaleString()}
              </div>
              <div style={{ color: M.textFaint, fontSize: "0.74rem", marginTop: 4 }}>Net mentor payout</div>
            </div>
          </div>

          {/* Payout Details & Transaction History */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: 0 }}>
                  Payout Activity History
                </h3>
                <p style={{ color: M.textMuted, fontSize: "0.82rem", margin: "4px 0 0" }}>
                  Destination: <strong style={{ color: M.goldLight }}>{earnings.payoutMethod}</strong>
                </p>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {earnings.history.map((tx) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: M.radiusSm,
                    background: M.surfaceAlt,
                    border: `1px solid ${M.borderSubtle}`,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: M.text }}>
                      {tx.sessionTitle}
                    </div>
                    <div style={{ color: M.textFaint, fontSize: "0.78rem", marginTop: 2 }}>
                      {tx.menteeName} · {tx.date}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, fontSize: "0.96rem", color: M.text }}>
                      +₹{tx.amount.toLocaleString()}
                    </div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        color: tx.status === "Paid" ? M.green : M.gold,
                      }}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SubTab 4: Reviews & Feedback (Secondary Area as requested) ── */}
      {subTab === "reviews" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Rating Summary Card */}
          <div
            style={{
              background: M.surface,
              border: `1px solid ${M.border}`,
              borderRadius: M.radiusLg,
              padding: "24px 28px",
              display: "flex",
              alignItems: "center",
              gap: 28,
            }}
          >
            <div style={{ textAlign: "center", paddingRight: 28, borderRight: `1px solid ${M.border}` }}>
              <div style={{ fontSize: "3rem", fontWeight: 700, fontFamily: M.sans, color: M.gold, lineHeight: 1 }}>
                {mentor.rating.toFixed(1)}
              </div>
              <div style={{ display: "flex", gap: 3, justifyContent: "center", margin: "8px 0" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={15} color={M.gold} fill={M.gold} />
                ))}
              </div>
              <div style={{ fontSize: "0.76rem", color: M.textFaint }}>
                {mentor.totalReviews} Total Reviews
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: M.text, margin: "0 0 6px" }}>
                Student Satisfaction
              </h3>
              <p style={{ color: M.textMuted, fontSize: "0.85rem", margin: 0, maxWidth: 500 }}>
                100% of mentees rated your 1:1 sessions as highly impactful. Ratings contribute directly to your search ranking in the mentor directory.
              </p>
            </div>
          </div>

          {/* Testimonial Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {reviews.map((rev) => (
              <div
                key={rev.id}
                style={{
                  background: M.surface,
                  border: `1px solid ${M.border}`,
                  borderRadius: M.radius,
                  padding: "20px 22px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        background: M.goldBg,
                        color: M.gold,
                        fontWeight: 700,
                        fontSize: "0.84rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {rev.menteeName[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem", color: M.text }}>
                        {rev.menteeName}
                      </div>
                      <div style={{ fontSize: "0.76rem", color: M.textFaint }}>
                        {rev.sessionType} · {rev.date}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 2 }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={14} color={M.gold} fill={M.gold} />
                    ))}
                  </div>
                </div>

                <p style={{ color: M.textMuted, fontSize: "0.86rem", lineHeight: 1.5, margin: 0 }}>
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
