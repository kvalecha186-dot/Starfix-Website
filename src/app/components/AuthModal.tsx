import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Eye, EyeOff, MailCheck } from "lucide-react";
import { supabase } from "../lib/supabase";

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
  const [codeMode, setCodeMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [codeSeconds, setCodeSeconds] = useState(0);
  const [codeRequests, setCodeRequests] = useState(0);

  /* Reset transient form state whenever the mode is switched */
  useEffect(() => { setError(""); setLoading(false); setAwaitingConfirm(false); setCodeMode(false); setVerificationCode(""); setCodeSeconds(0); setCodeRequests(0); }, [mode]);

  useEffect(() => {
    if (!codeMode || codeSeconds <= 0) return;
    const timer = window.setTimeout(() => setCodeSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [codeMode, codeSeconds]);

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

  const requestEmailCode = async (isResend = false) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@")) { setError("Enter your registered email address first."); return; }
    if (isResend && codeSeconds > 0) return;
    if (codeRequests >= 3) { setError("You’ve reached the limit of 3 code requests. Please try again later."); return; }
    setError("");
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: { shouldCreateUser: true },
      });
      if (otpError) throw otpError;
      setEmail(normalizedEmail);
      setCodeRequests((count) => count + 1);
      setVerificationCode("");
      setCodeSeconds(60);
      setCodeMode(true);
      setError("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not send a verification code.";
      setError(/rate limit/i.test(message) ? "Too many requests. Please wait before requesting another code." : message);
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(verificationCode)) { setError("Enter the 6-digit code from your email."); return; }
    setLoading(true);
    setError("");
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: verificationCode,
        type: "email",
      });
      if (verifyError) throw verifyError;
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : "That code could not be verified.";
      setError(/expired|invalid/i.test(message) ? "That code is invalid or expired. Request a new code and try again." : message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && name.trim().length < 2) { setError("Please enter your full name."); return; }
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (!isSignup) { await requestEmailCode(false); return; }
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

        {codeMode ? (
          <div style={{ position: "relative" }}>
            <button type="button" onClick={() => { setCodeMode(false); setVerificationCode(""); setError(""); }} style={{ background: "none", border: "none", padding: 0, marginBottom: 18, color: "rgba(250,249,246,0.55)", cursor: "pointer", fontFamily: "'Inter', sans-serif", fontSize: "0.82rem" }}>
              ← Back
            </button>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", fontWeight: 700, color: INK, margin: "0 0 6px" }}>Enter Verification Code</h2>
            <p style={{ fontSize: "0.82rem", color: "rgba(250,249,246,0.5)", margin: "0 0 22px", lineHeight: 1.6 }}>
              Enter the 6-digit code sent to <span style={{ color: GOLD, fontWeight: 700 }}>{email}</span>.
            </p>
            <form onSubmit={verifyEmailCode} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <input
                aria-label="6-digit verification code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => { setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setError(""); }}
                placeholder="123456"
                style={{ ...inputStyle(verificationCode.length > 0), textAlign: "center", letterSpacing: "0.45em", fontSize: "1.25rem", fontWeight: 700, padding: "16px 14px" }}
              />
              {error && <p style={{ fontSize: "0.75rem", color: "#F87171", margin: 0, lineHeight: 1.5 }}>{error}</p>}
              <motion.button type="submit" disabled={loading || verificationCode.length !== 6} whileTap={{ scale: 0.98 }} style={{ background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: "#0A0912", border: "none", borderRadius: 999, padding: "13px 24px", fontSize: "0.9rem", fontWeight: 700, cursor: loading || verificationCode.length !== 6 ? "not-allowed" : "pointer", opacity: loading || verificationCode.length !== 6 ? 0.65 : 1 }}>
                {loading ? "Verifying…" : "Verify Code & Sign In"}
              </motion.button>
            </form>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginTop: 22, fontSize: "0.78rem", color: "rgba(250,249,246,0.48)" }}>
              <span>{codeSeconds > 0 ? `Code expires in 0:${String(codeSeconds).padStart(2, "0")}` : "Code may have expired"}</span>
              <button type="button" disabled={loading || codeSeconds > 0 || codeRequests >= 3} onClick={() => requestEmailCode(true)} style={{ background: "none", border: "none", padding: 0, color: codeSeconds > 0 || codeRequests >= 3 ? "rgba(250,249,246,0.25)" : GOLD, cursor: loading || codeSeconds > 0 || codeRequests >= 3 ? "not-allowed" : "pointer", fontWeight: 600 }}>
                {codeRequests >= 3 ? "Request limit reached" : codeSeconds > 0 ? `Resend in 0:${String(codeSeconds).padStart(2, "0")}` : "Resend code"}
              </button>
            </div>
            <p style={{ fontSize: "0.7rem", color: "rgba(250,249,246,0.28)", marginTop: 12 }}>Requests allowed in this sign-in attempt: {codeRequests}/3</p>
          </div>
        ) : awaitingConfirm ? (
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

          {isSignup && <div>
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
          </div>}

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
              : <><span>{isSignup ? "Create my account" : "Send 6-digit code"}</span><ArrowRight size={15} /></>}
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
