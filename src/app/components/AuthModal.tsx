import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Eye, EyeOff, MailCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase, isGoogleOAuthEnabled } from "../lib/supabase";

/* Small multi-color "G" mark — kept as inline SVG so no external asset/
   network request is needed for the Google continue button. */
function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 35.1 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.8l6.6 5.6C41.5 36.6 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"/>
    </svg>
  );
}

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4D67A";
const INK = "#FAF9F6";

function fieldLabelStyle(): React.CSSProperties {
  return {
    display: "block", fontSize: "0.67rem", textTransform: "uppercase",
    letterSpacing: "0.1em", color: "rgba(250,249,246,0.32)",
    marginBottom: 7, fontWeight: 600,
  };
}

function inputStyle(filled: boolean): React.CSSProperties {
  return {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.04)",
    border: `1px solid ${filled ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.09)"}`,
    borderRadius: 12, color: INK,
    fontSize: "0.88rem", outline: "none",
    fontFamily: "'Inter', sans-serif",
    boxSizing: "border-box", transition: "border-color 0.2s",
  };
}

export type AuthMode = "login" | "signup";

export function AuthModal({
  mode,
  onClose,
  onSuccess,
  onSwitchMode,
}: {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (profile?: { name: string; email: string }) => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  // True once signUp() succeeds but Supabase requires email confirmation
  // before a session exists — there's nothing more this modal can do until
  // the learner clicks the link in their inbox.
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  /* Reset transient form state whenever the mode is switched */
  useEffect(() => { setError(""); setLoading(false); setAwaitingConfirm(false); }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isSignup = mode === "signup";

  const friendlyError = (message: string): string => {
    if (/already registered|already exists/i.test(message)) return "An account with this email already exists — try logging in instead.";
    if (/invalid login credentials/i.test(message)) return "That email or password doesn't match our records.";
    if (/password.*(least|characters)/i.test(message)) return message; // Supabase's own message is already clear here
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 1)  { setError("Please enter a password."); return; }
    setError("");
    setLoading(true);

    if (isSignup) {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name.trim() } },
      });
      setLoading(false);
      if (err) { setError(friendlyError(err.message)); return; }
      if (data.session) { onSuccess(); }
      else { setAwaitingConfirm(true); } // email confirmation is required before a session exists
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) { setError(friendlyError(err.message)); return; }
      onSuccess();
    }
  };

  const handleGoogle = async () => {
    setError("");
    setLoading(true);

    const googleReady = await isGoogleOAuthEnabled();
    if (!googleReady) {
      setLoading(false);
      setError("Google Sign-In is not enabled yet in your Supabase project (Authentication > Providers > Google). Use Email & Password or 1-Click Demo Login below.");
      toast.error("Google OAuth not enabled in Supabase yet", {
        description: "Please sign in with Email & Password, or click '1-Click Demo Student Access' below."
      });
      return;
    }

    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (err) { setLoading(false); setError(friendlyError(err.message)); }
  };

  const handleDemoLogin = () => {
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
    onSuccess();
    onClose();
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: "rgba(4,4,12,0.72)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          background: "rgba(16,15,28,0.72)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(212,175,55,0.22)",
          boxShadow: "0 0 0 1px rgba(212,175,55,0.05), 0 30px 90px rgba(0,0,0,0.55), 0 0 60px rgba(212,175,55,0.08)",
          borderRadius: 28,
          padding: "42px 38px 34px",
          width: "100%", maxWidth: 408,
          fontFamily: "'Inter', sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Ambient gold glow, purely decorative */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", top: -80, right: -60, width: 220, height: 220,
            background: "radial-gradient(circle, rgba(212,175,55,0.16) 0%, rgba(212,175,55,0) 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 18, right: 18,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(250,249,246,0.22)", padding: 4,
            display: "flex", transition: "color 0.2s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.55)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.22)"; }}
        >
          <X size={16} />
        </button>

        {/* Wordmark */}
        <div style={{ marginBottom: 26, position: "relative" }}>
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: GOLD, letterSpacing: "-0.01em" }}>
            Starfix
          </span>
        </div>

        {/* Heading */}
        <div style={{ position: "relative" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.65rem", fontWeight: 700,
            color: INK, margin: "0 0 6px",
            letterSpacing: "-0.02em",
          }}>
            {isSignup ? "Create your Starfix account" : "Welcome back"}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "rgba(250,249,246,0.38)", marginBottom: 26, lineHeight: 1.6 }}>
            {isSignup ? "Begin your transformation, guided by real mentors." : "Sign in to continue your journey."}
          </p>
        </div>

        {awaitingConfirm ? (
          /* Signup succeeded but Supabase requires email confirmation
             before a session exists — nothing more to do here except
             tell the learner clearly, instead of leaving the modal
             looking like nothing happened. */
          <div style={{ textAlign: "center", padding: "8px 0 4px" }}>
            <div style={{
              width: 48, height: 48, margin: "0 auto 18px", borderRadius: "50%",
              background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.28)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MailCheck size={20} color={GOLD} />
            </div>
            <p style={{ fontSize: "0.86rem", color: INK, margin: "0 0 8px", fontWeight: 600 }}>
              Check your inbox
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(250,249,246,0.42)", lineHeight: 1.6, margin: "0 0 24px" }}>
              We sent a confirmation link to <span style={{ color: INK }}>{email}</span>. Click it to activate your account, then come back and log in.
            </p>
            <button
              onClick={() => onSwitchMode("login")}
              style={{
                width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 999, padding: "12px 24px", color: INK, fontSize: "0.85rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "'Inter', sans-serif",
              }}
            >
              Back to login
            </button>
          </div>
        ) : (
        <>
        {/* Google */}
        <motion.button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          whileHover={{ y: loading ? 0 : -1 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "11px 14px", borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: INK, fontSize: "0.85rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "background 0.2s, border-color 0.2s",
            marginBottom: 20,
          }}
          onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
        >
          <GoogleMark /> Continue with Google
        </motion.button>

        <motion.button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          whileHover={{ y: loading ? 0 : -1 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            padding: "11px 14px", borderRadius: 12,
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.35)",
            color: GOLD, fontSize: "0.85rem", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "'Inter', sans-serif",
            transition: "background 0.2s, border-color 0.2s",
            marginBottom: 20,
          }}
        >
          <Sparkles size={14} color={GOLD} /> 1-Click Demo Student Access
        </motion.button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          <span style={{ fontSize: "0.68rem", color: "rgba(250,249,246,0.28)", letterSpacing: "0.05em", textTransform: "uppercase" }}>or</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isSignup && (
            <div>
              <label style={fieldLabelStyle()}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(""); }}
                placeholder="Your name"
                style={inputStyle(name.trim().length > 1)}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = name.trim().length > 1 ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.09)"; }}
              />
            </div>
          )}

          <div>
            <label style={fieldLabelStyle()}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              style={inputStyle(email.includes("@"))}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = email.includes("@") ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.09)"; }}
            />
          </div>

          <div>
            <label style={fieldLabelStyle()}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                style={{ ...inputStyle(password.length > 0), padding: "12px 42px 12px 14px" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = password.length > 0 ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.09)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(250,249,246,0.3)", padding: 0, display: "flex",
                }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {!isSignup && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -4 }}>
              <button
                type="button"
                onClick={() => setError("")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "rgba(250,249,246,0.36)", fontSize: "0.73rem",
                  fontFamily: "'Inter', sans-serif", transition: "color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = GOLD_LIGHT; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.36)"; }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <p style={{ fontSize: "0.75rem", color: "#F87171", margin: 0, lineHeight: 1.5 }}>{error}</p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ y: loading ? 0 : -1 }}
            whileTap={{ scale: loading ? 1 : 0.97 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: loading ? "rgba(212,175,55,0.45)" : `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
              color: "#0A0912",
              border: "none", borderRadius: 999, marginTop: 4,
              padding: "13px 24px",
              fontSize: "0.9rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "box-shadow 0.2s, transform 0.2s",
              boxShadow: loading ? "none" : "0 0 26px rgba(212,175,55,0.32)",
            }}
          >
            {loading
              ? (isSignup ? "Creating your account…" : "Signing in…")
              : <><span>{isSignup ? "Create my account" : "Continue"}</span><ArrowRight size={15} /></>}
          </motion.button>
        </form>

        {/* Switch mode */}
        <div style={{ marginTop: 24, textAlign: "center", position: "relative" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(250,249,246,0.32)" }}>
            {isSignup ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            onClick={() => onSwitchMode(isSignup ? "login" : "signup")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: GOLD, fontSize: "0.75rem", fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {isSignup ? "Log in" : "Get started →"}
          </button>
        </div>
        </>
        )}
      </motion.div>
    </motion.div>
  );
}

export function AuthModalPortal(props: {
  mode: AuthMode | null;
  onClose: () => void;
  onSuccess: (profile?: { name: string; email: string }) => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  return (
    <AnimatePresence>
      {props.mode && (
        <AuthModal
          mode={props.mode}
          onClose={props.onClose}
          onSuccess={props.onSuccess}
          onSwitchMode={props.onSwitchMode}
        />
      )}
    </AnimatePresence>
  );
}
