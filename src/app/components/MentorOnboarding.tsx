import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, ArrowLeft, X, Check, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { claimOrCreateMentorProfile } from "../lib/supabase";

const GOLD = "#D4AF37";
const INK = "#FAF9F6";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Spanish", "French", "German", "Mandarin"];
const CATEGORY_OPTIONS = ["Coding", "AI/ML", "UI/UX", "Finance", "Communication", "Entrepreneurship", "Fitness", "Meditation", "Languages", "Content"];

interface FormData {
  name: string; email: string; password: string; phone: string; location: string; languages: string[];
  currentRole: string; company: string; yearsExperience: string; category: string; skills: string;
  education: string; linkedinUrl: string; bio: string;
  mentoringApproach: string; offersFreeIntro: boolean;
  sessionDuration: string; sessionPrice: string;
}

const EMPTY_FORM: FormData = {
  name: "", email: "", password: "", phone: "", location: "", languages: [],
  currentRole: "", company: "", yearsExperience: "", category: "", skills: "",
  education: "", linkedinUrl: "", bio: "",
  mentoringApproach: "", offersFreeIntro: false,
  sessionDuration: "45", sessionPrice: "",
};

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.045)",
  color: "#FAF9F6", outline: "none", fontFamily: "Inter, sans-serif", fontSize: 13,
};
const labelStyle: React.CSSProperties = { fontSize: 12, color: "rgba(250,249,246,.55)", marginBottom: 6, display: "block", fontWeight: 600 };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><span style={labelStyle}>{label}</span>{children}</div>;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "7px 13px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer",
      border: `1px solid ${active ? GOLD : "rgba(255,255,255,.12)"}`,
      background: active ? "rgba(212,175,55,.14)" : "rgba(255,255,255,.04)",
      color: active ? GOLD : "rgba(250,249,246,.7)", fontFamily: "Inter, sans-serif",
    }}>
      {label}
    </button>
  );
}

export function MentorOnboarding({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setForm((f) => ({ ...f, [key]: value }));
  const toggleLang = (lang: string) => set("languages", form.languages.includes(lang) ? form.languages.filter((l) => l !== lang) : [...form.languages, lang]);

  const reset = () => { setStep(1); setForm(EMPTY_FORM); setError(""); setAwaitingConfirm(false); setDone(false); };
  const handleClose = () => { reset(); onClose(); };

  function validateStep(): string | null {
    if (step === 1) {
      if (form.name.trim().length < 2) return "Please enter your full name.";
      if (!form.email.includes("@")) return "Please enter a valid email.";
      if (form.password.length < 6) return "Password must be at least 6 characters.";
      if (form.languages.length === 0) return "Select at least one language.";
    }
    if (step === 2) {
      if (!form.currentRole.trim()) return "Please enter your current role.";
      if (!form.category) return "Please select a professional category.";
    }
    if (step === 4) {
      if (!form.sessionPrice.trim() && !form.offersFreeIntro) return "Set a session price, or mark your intro session as free.";
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setStep((s) => Math.min(4, s + 1));
  }
  function handleBack() { setError(""); setStep((s) => Math.max(1, s - 1)); }

  async function handleSubmit() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError("");
    setLoading(true);

    try {
      // 1. Real Supabase Auth account — same signUp call the student flow
      // uses, same "requires email confirmation" handling.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.name.trim() } },
      });
      if (authError) throw authError;

      if (!authData.session) {
        setAwaitingConfirm(true);
        setLoading(false);
        return;
      }

      const userId = authData.session.user.id;

      // 2. profiles.role = 'mentor' (the self-escalation guard trigger only
      // blocks a client-side jump to 'admin' — student <-> mentor stays
      // legal, which is exactly what this line does).
      await supabase.from("profiles").update({ role: "mentor", full_name: form.name.trim(), email: form.email.trim() }).eq("id", userId);

      // 3. Attach this account to a mentor row — claims a seeded catalog
      // row with a matching email + no owner yet, or creates a fresh one.
      const skillsList = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      const result = await claimOrCreateMentorProfile(userId, {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        location: form.location.trim() || undefined,
        languages: form.languages,
        headline: form.currentRole.trim() || undefined,
        company: form.company.trim() || undefined,
        yearsExperience: form.yearsExperience ? Number(form.yearsExperience) : undefined,
        category: form.category || undefined,
        skills: skillsList,
        education: form.education.trim() || undefined,
        linkedinUrl: form.linkedinUrl.trim() || undefined,
        bio: form.bio.trim() || undefined,
        mentoringApproach: form.mentoringApproach.trim() || undefined,
        offersFreeIntro: form.offersFreeIntro,
      });

      if (!result) {
        setError("Your account was created, but we couldn't save your mentor profile. You can complete it later from your dashboard.");
        setLoading(false);
        setDone(true);
        return;
      }

      setLoading(false);
      setDone(true);
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const stepLabels = ["About you", "Your background", "Your approach", "Sessions"];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,12,.8)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, overflowY: "auto" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 560, position: "relative", borderRadius: 26, padding: "40px 38px 34px", background: "#11101a", border: "1px solid rgba(212,175,55,.24)", boxShadow: "0 30px 90px rgba(0,0,0,.55)", color: INK, fontFamily: "Inter, sans-serif", margin: "auto" }}
          >
            <button onClick={handleClose} aria-label="Close" style={{ position: "absolute", top: 18, right: 18, background: "none", border: 0, color: "rgba(250,249,246,.35)", cursor: "pointer" }}><X size={18} /></button>

            {done ? (
              <div style={{ textAlign: "center", padding: "24px 8px" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(212,175,55,.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <Check size={24} color={GOLD} />
                </div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, margin: "0 0 10px" }}>You're in, {form.name.split(" ")[0]}.</h2>
                <p style={{ color: "rgba(250,249,246,.55)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 26px" }}>
                  {error || "Your mentor profile is live. Head to your dashboard to finish setting up your availability."}
                </p>
                <button
                  onClick={() => { reset(); onComplete(); }}
                  style={{ background: GOLD, color: "#11101a", border: 0, borderRadius: 12, padding: "12px 28px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                >
                  Go to my dashboard
                </button>
              </div>
            ) : awaitingConfirm ? (
              <div style={{ textAlign: "center", padding: "24px 8px" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(212,175,55,.14)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
                  <Sparkles size={22} color={GOLD} />
                </div>
                <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 20, margin: "0 0 10px" }}>Confirm your email</h2>
                <p style={{ color: "rgba(250,249,246,.55)", fontSize: 13.5, lineHeight: 1.6, margin: "0 0 26px" }}>
                  We've sent a confirmation link to <strong style={{ color: INK }}>{form.email}</strong>. Once confirmed, sign in and finish setting up your mentor profile from your dashboard.
                </p>
                <button
                  onClick={handleClose}
                  style={{ background: "rgba(255,255,255,.06)", color: INK, border: "1px solid rgba(255,255,255,.12)", borderRadius: 12, padding: "12px 28px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                >
                  Got it
                </button>
              </div>
            ) : (
              <>
                <div style={{ color: GOLD, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 6 }}>Starfix for Mentors</div>
                <h2 style={{ fontFamily: "Playfair Display, serif", margin: 0, fontSize: 24 }}>{stepLabels[step - 1]}</h2>

                {/* Step dots */}
                <div style={{ display: "flex", gap: 6, margin: "16px 0 26px" }}>
                  {stepLabels.map((_, i) => (
                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < step ? GOLD : "rgba(255,255,255,.1)" }} />
                  ))}
                </div>

                {error && (
                  <div style={{ background: "rgba(220,80,80,.1)", border: "1px solid rgba(220,80,80,.3)", borderRadius: 10, padding: "10px 13px", fontSize: 12.5, color: "#ff9d9d", marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {step === 1 && (
                    <>
                      <Field label="Full name"><input style={fieldStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Aria Chen" /></Field>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Email"><input style={fieldStyle} type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@email.com" /></Field>
                        <Field label="Password"><input style={fieldStyle} type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" /></Field>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Phone (optional)"><input style={fieldStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91…" /></Field>
                        <Field label="Location (optional)"><input style={fieldStyle} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="Bengaluru, India" /></Field>
                      </div>
                      <Field label="Languages you mentor in">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {LANGUAGE_OPTIONS.map((l) => <Chip key={l} label={l} active={form.languages.includes(l)} onClick={() => toggleLang(l)} />)}
                        </div>
                      </Field>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Current role"><input style={fieldStyle} value={form.currentRole} onChange={(e) => set("currentRole", e.target.value)} placeholder="Senior ML Engineer" /></Field>
                        <Field label="Company"><input style={fieldStyle} value={form.company} onChange={(e) => set("company", e.target.value)} placeholder="Google" /></Field>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Years of experience"><input style={fieldStyle} type="number" min={0} value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} placeholder="8" /></Field>
                        <Field label="Education (optional)"><input style={fieldStyle} value={form.education} onChange={(e) => set("education", e.target.value)} placeholder="IIT Bombay" /></Field>
                      </div>
                      <Field label="Category">
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {CATEGORY_OPTIONS.map((c) => <Chip key={c} label={c} active={form.category === c} onClick={() => set("category", c)} />)}
                        </div>
                      </Field>
                      <Field label="Skills (comma-separated)"><input style={fieldStyle} value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="PyTorch, NLP, Computer Vision" /></Field>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <Field label="LinkedIn (optional)"><input style={fieldStyle} value={form.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="linkedin.com/in/…" /></Field>
                      <Field label="Short bio"><textarea style={{ ...fieldStyle, minHeight: 84, resize: "vertical", fontFamily: "Inter, sans-serif" }} value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Who you are, what you specialize in, who should learn from you." /></Field>
                      <Field label="Your mentoring approach"><textarea style={{ ...fieldStyle, minHeight: 84, resize: "vertical", fontFamily: "Inter, sans-serif" }} value={form.mentoringApproach} onChange={(e) => set("mentoringApproach", e.target.value)} placeholder="Practical, project-based, weekly check-ins…" /></Field>
                    </>
                  )}

                  {step === 4 && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <Field label="Default session duration">
                          <select style={fieldStyle} value={form.sessionDuration} onChange={(e) => set("sessionDuration", e.target.value)}>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                          </select>
                        </Field>
                        <Field label="Session price (₹)"><input style={fieldStyle} value={form.sessionPrice} onChange={(e) => set("sessionPrice", e.target.value)} placeholder="2,500" disabled={form.offersFreeIntro} /></Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => set("offersFreeIntro", !form.offersFreeIntro)}
                        style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: "none", cursor: "pointer", padding: 0, textAlign: "left" }}
                      >
                        <div style={{ width: 18, height: 18, borderRadius: 5, border: `1.5px solid ${form.offersFreeIntro ? GOLD : "rgba(255,255,255,.25)"}`, background: form.offersFreeIntro ? GOLD : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {form.offersFreeIntro && <Check size={12} color="#11101a" />}
                        </div>
                        <span style={{ fontSize: 13, color: "rgba(250,249,246,.75)" }}>Offer a free intro session</span>
                      </button>
                    </>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
                  {step > 1 ? (
                    <button onClick={handleBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "rgba(250,249,246,.55)", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                  ) : <span />}

                  {step < 4 ? (
                    <button
                      onClick={handleNext}
                      style={{ display: "flex", alignItems: "center", gap: 7, background: GOLD, color: "#11101a", border: 0, borderRadius: 12, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={loading}
                      style={{ display: "flex", alignItems: "center", gap: 7, background: GOLD, color: "#11101a", border: 0, borderRadius: 12, padding: "11px 22px", fontSize: 13.5, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "Inter, sans-serif", opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? "Creating your profile…" : "Complete Setup"} {!loading && <ArrowRight size={14} />}
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
