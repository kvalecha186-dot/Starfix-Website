import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, Eye, EyeOff, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase, isGoogleOAuthEnabled } from "../lib/supabase";

export type SupabaseAuthMode = "login" | "signup";

type Props = {
  mode: SupabaseAuthMode | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchMode: (mode: SupabaseAuthMode) => void;
};

const GOLD = "#D4AF37";
const INK = "#FAF9F6";

export function SupabaseAuthModal({ mode, onClose, onSuccess, onSwitchMode }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  useEffect(() => {
    setMessage("");
    setError("");
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    if (!mode) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [mode, onClose]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (isSignup && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;

        if (!data.session) {
          setMessage("Account created. Check your email to confirm your account, then log in.");
          return;
        }
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (authError) throw authError;
      }

      onSuccess?.();
      onClose();
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setMessage("");
    setLoading(true);

    const googleReady = await isGoogleOAuthEnabled();
    if (!googleReady) {
      setLoading(false);
      setError("Google Sign-In is not enabled yet in your Supabase project (Authentication > Providers > Google). Please log in with Email & Password or use 1-Click Demo Login below.");
      toast.error("Google OAuth not enabled in Supabase yet", {
        description: "Please sign in with Email & Password, or click '1-Click Demo Student Access' below."
      });
      return;
    }

    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  }

  function handleDemoLogin() {
    const demoProfile = {
      name: "Alex Sterling (Demo)",
      email: "demo@starfix.vip",
      goalId: "coding",
      goalTitle: "Coding & Development",
      level: "intermediate" as const,
      dailyTime: "45min",
      preference: "roadmap",
      country: "United States",
      learningLanguage: "en" as const,
    };
    localStorage.setItem("userProfile", JSON.stringify(demoProfile));
    localStorage.setItem("loggedIn", "true");
    window.dispatchEvent(new Event("starfix:auth-changed"));
    toast.success("Signed in as Demo Student", { description: "Full platform access unlocked" });
    onSuccess?.();
    onClose();
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,12,.76)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: .98 }}
            onClick={(event) => event.stopPropagation()}
            style={{ width: "100%", maxWidth: 420, position: "relative", borderRadius: 26, padding: "38px 34px 30px", background: "#11101a", border: "1px solid rgba(212,175,55,.24)", boxShadow: "0 30px 90px rgba(0,0,0,.55)", color: INK, fontFamily: "Inter, sans-serif" }}
          >
            <button onClick={onClose} aria-label="Close" style={{ position: "absolute", top: 16, right: 16, background: "none", border: 0, color: "rgba(250,249,246,.35)", cursor: "pointer" }}><X size={17} /></button>
            <div style={{ color: GOLD, fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 18, marginBottom: 20 }}>Starfix</div>
            <h2 style={{ fontFamily: "Playfair Display, serif", margin: 0, fontSize: 27 }}>{isSignup ? "Create your account" : "Welcome back"}</h2>
            <p style={{ color: "rgba(250,249,246,.46)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 22px" }}>{isSignup ? "Your real Starfix account, synced across devices." : "Sign in to continue your journey."}</p>

            <button type="button" onClick={handleGoogle} disabled={loading} style={{ width: "100%", padding: "12px 14px", borderRadius: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.05)", color: INK, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: 10 }}>Continue with Google</button>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              style={{
                width: "100%",
                padding: "11px 14px",
                borderRadius: 12,
                border: "1px solid rgba(212,175,55,.35)",
                background: "rgba(212,175,55,.1)",
                color: GOLD,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                marginBottom: 18,
                fontFamily: "Inter, sans-serif",
              }}
            >
              <Sparkles size={14} color={GOLD} /> 1-Click Demo Student Access
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18, color: "rgba(250,249,246,.28)", fontSize: 11 }}><span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} /> OR <span style={{ flex: 1, height: 1, background: "rgba(255,255,255,.08)" }} /></div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 13 }}>
              {isSignup && <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" style={fieldStyle} />}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" style={fieldStyle} />
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)" style={{ ...fieldStyle, paddingRight: 42 }} />
                <button type="button" onClick={() => setShowPassword((value) => !value)} style={{ position: "absolute", right: 12, top: 11, background: "none", border: 0, color: "rgba(250,249,246,.4)", cursor: "pointer" }}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
              </div>
              {error && <div style={{ color: "#F87171", fontSize: 12, lineHeight: 1.5 }}>{error}</div>}
              {message && <div style={{ color: "#A7F3D0", fontSize: 12, lineHeight: 1.5 }}>{message}</div>}
              <button disabled={loading} type="submit" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, padding: "12px 16px", border: 0, borderRadius: 12, background: GOLD, color: "#15120a", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", marginTop: 4 }}>{loading ? "Please wait…" : isSignup ? "Create account" : "Log in"}<ArrowRight size={16} /></button>
            </form>

            <button type="button" onClick={() => onSwitchMode(isSignup ? "login" : "signup")} style={{ width: "100%", marginTop: 18, background: "none", border: 0, color: "rgba(250,249,246,.45)", cursor: "pointer", fontSize: 12 }}>{isSignup ? "Already have an account? Log in" : "New to Starfix? Create an account"}</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "12px 13px", borderRadius: 12,
  border: "1px solid rgba(255,255,255,.1)", background: "rgba(255,255,255,.045)",
  color: "#FAF9F6", outline: "none", fontFamily: "Inter, sans-serif", fontSize: 13,
};
