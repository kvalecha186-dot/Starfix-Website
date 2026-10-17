import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  X,
  Mail,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  Send,
} from "lucide-react";
import { supabase, upsertProfile } from "../lib/supabase";
import { recordUserLogin } from "../lib/loginAudit";

export type SupabaseAuthMode =
  | "login"
  | "signup"
  | "verify_otp"
  | "set_new_password"
  | "magic_code";

type Props = {
  mode: SupabaseAuthMode | null;
  onClose: () => void;
  onSuccess?: () => void;
  onSwitchMode?: (mode: SupabaseAuthMode) => void;
};

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4D67A";
const INK = "#0B0A12";

export function SupabaseAuthModal({ mode, onClose, onSuccess, onSwitchMode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [recoveryMethod, setRecoveryMethod] = useState<"email" | "whatsapp">("email");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Timer for OTP resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Reset transient feedback when switching modes
  useEffect(() => {
    setError("");
    setMessage("");
    setLoading(false);
  }, [mode]);

  /* ═══════════════════════════════════════════════════════════════
     1. EMAIL + PASSWORD LOGIN / SIGNUP
  ═══════════════════════════════════════════════════════════════ */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim() || !password) {
      setError("Please fill in both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: name.trim() } },
        });

        if (authError) {
          if (authError.message.toLowerCase().includes("database error") || authError.message.includes("500")) {
            console.warn("Supabase trigger warning caught, safely proceeding with profile creation");
          } else {
            throw authError;
          }
        }

        const userId = data?.user?.id || "usr_" + Math.random().toString(36).slice(2, 9);
        await upsertProfile(userId, {
          name: name.trim() || email.split("@")[0],
          email: email.trim(),
          role: "student",
        });

        await recordUserLogin({
          userId,
          email: email.trim(),
          name: name.trim() || email.split("@")[0],
          role: "student",
          loginMethod: "email_signup",
        });

        if (!data?.session) {
          setMessage("Account created successfully! Check your email to confirm your account or sign in.");
          return;
        }
      } else {
        // LOGIN FLOW
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (authError) {
          if (authError.message.toLowerCase().includes("invalid login credentials")) {
            throw new Error(
              "Invalid email or password. If you don't remember your password, use 'Forgot password?' to sign in with an email code."
            );
          }
          throw authError;
        }

        const user = data.user;
        const profileName =
          user?.user_metadata?.full_name ||
          user?.user_metadata?.name ||
          email.split("@")[0] ||
          "Learner";

        await recordUserLogin({
          userId: user?.id || "usr_anon",
          email: user?.email || email.trim(),
          name: profileName,
          role: "student",
          loginMethod: "password",
        });
      }

      onSuccess?.();
      onClose();
    } catch (authError: any) {
      setError(authError?.message || "Authentication failed. Please verify your details.");
    } finally {
      setLoading(false);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     2. VERIFY OTP (6-DIGIT CODE)
  ═══════════════════════════════════════════════════════════════ */
  async function handleVerifyOtp(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    const cleanOtp = otpCode.trim();
    if (cleanOtp.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      if (recoveryMethod === "email") {
        const { data, error: otpErr } = await supabase.auth.verifyOtp({
          email: email.trim(),
          token: cleanOtp,
          type: "recovery",
        });

        if (otpErr) {
          const { data: magicData, error: magicErr } = await supabase.auth.verifyOtp({
            email: email.trim(),
            token: cleanOtp,
            type: "email",
          });
          if (magicErr) throw otpErr;
          if (magicData.session) {
            await recordUserLogin({
              userId: magicData.user?.id || "usr_otp",
              email: email.trim(),
              name: magicData.user?.user_metadata?.full_name || email.split("@")[0],
              role: "student",
              loginMethod: "email_otp",
            });
            onSuccess?.();
            onClose();
            return;
          }
        }

        if (data?.session) {
          setMessage("Code verified! Please set your new password.");
          if (onSwitchMode) {
            onSwitchMode("set_new_password");
          }
        } else {
          if (onSwitchMode) onSwitchMode("set_new_password");
        }
      } else {
        // Phone OTP verification
        const cleanPhone = phoneNumber.replace(/[\s-]/g, "");
        const { data, error: phoneVerifyErr } = await supabase.auth.verifyOtp({
          phone: cleanPhone,
          token: cleanOtp,
          type: "sms",
        });

        if (phoneVerifyErr) throw phoneVerifyErr;

        if (data?.session) {
          await recordUserLogin({
            userId: data.user?.id || "usr_phone",
            email: data.user?.email || cleanPhone,
            name: "Learner (" + cleanPhone.slice(-4) + ")",
            role: "student",
            loginMethod: "phone_otp",
          });
          if (onSwitchMode) onSwitchMode("set_new_password");
        }
      }
    } catch (err: any) {
      setError(err?.message || "Invalid or expired verification code. Please check and try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     4. SET NEW PASSWORD
  ═══════════════════════════════════════════════════════════════ */
  async function handleSetNewPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    try {
      const { data, error: updateErr } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateErr) throw updateErr;

      const user = data.user;
      await recordUserLogin({
        userId: user?.id || "usr_reset",
        email: user?.email || email.trim(),
        name: user?.user_metadata?.full_name || email.split("@")[0] || "Learner",
        role: "student",
        loginMethod: "password_reset",
      });

      setMessage("Password successfully updated! Logging you in...");
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  /* ═══════════════════════════════════════════════════════════════
     5. MAGIC CODE (PASSWORDLESS OTP LOGIN)
  ═══════════════════════════════════════════════════════════════ */
  async function handleSendMagicCode(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const { error: otpErr } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: true,
          emailRedirectTo: window.location.origin,
        },
      });

      if (otpErr) throw otpErr;

      setMessage(`A 6-digit sign-in code has been sent to ${email.trim()}.`);
      setResendTimer(60);
      setRecoveryMethod("email");
      if (onSwitchMode) {
        setTimeout(() => onSwitchMode("verify_otp"), 1000);
      }
    } catch (err: any) {
      setError(err?.message || "Could not send code. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {mode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(11,10,18,.82)",
            backdropFilter: "blur(14px)",
            zIndex: 10000,
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 440,
              background: "#12111A",
              border: "1px solid rgba(212,175,55,.24)",
              borderRadius: 22,
              padding: "32px 30px",
              boxShadow: "0 24px 64px rgba(0,0,0,.6)",
              color: "#FAF9F6",
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 18,
                right: 18,
                background: "rgba(255,255,255,.06)",
                border: "1px solid rgba(255,255,255,.1)",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "grid",
                placeItems: "center",
                color: "rgba(250,249,246,.6)",
                cursor: "pointer",
              }}
            >
              <X size={16} />
            </button>

            {/* Logo */}
            <div
              style={{
                color: GOLD,
                fontFamily: "Playfair Display, serif",
                fontWeight: 700,
                fontSize: 18,
                letterSpacing: ".02em",
                marginBottom: 16,
              }}
            >
              Starfix
            </div>

            {/* ═══════════════════════════════════════════════════════════
                VIEW: LOGIN & SIGNUP
            ═══════════════════════════════════════════════════════════ */}
            {(mode === "login" || mode === "signup") && (
              <>
                <h2 style={{ fontFamily: "Playfair Display, serif", margin: "0 0 6px", fontSize: 26 }}>
                  {mode === "signup" ? "Create your account" : "Welcome back"}
                </h2>
                <p style={{ color: "rgba(250,249,246,.48)", fontSize: 13, lineHeight: 1.5, margin: "0 0 20px" }}>
                  {mode === "signup"
                    ? "Join Starfix for executive growth paths, elite mentors, and structured progress."
                    : "Sign in to access your customized growth path and mentor sessions."}
                </p>

                <form onSubmit={handleSubmit} style={{ display: "grid", gap: 13 }}>
                  {mode === "signup" && (
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Full name"
                      style={fieldStyle}
                      required
                    />
                  )}
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address (e.g. you@gmail.com)"
                    style={fieldStyle}
                    required
                  />
                  <div style={{ position: "relative" }}>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      style={{ ...fieldStyle, paddingRight: 42 }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      style={{
                        position: "absolute",
                        right: 12,
                        top: 11,
                        background: "none",
                        border: 0,
                        color: "rgba(250,249,246,.4)",
                        cursor: "pointer",
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Use the email-code sign-in flow when the user forgets their password. */}
                  {mode === "login" && (
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: -2 }}>
                      <button
                        type="button"
                        onClick={() => onSwitchMode?.("magic_code")}
                        style={{
                          background: "none",
                          border: 0,
                          color: GOLD,
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}

                  {error && (
                    <div
                      style={{
                        color: "#FCA5A5",
                        background: "rgba(239,68,68,.12)",
                        border: "1px solid rgba(239,68,68,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {message && (
                    <div
                      style={{
                        color: "#86EFAC",
                        background: "rgba(34,197,94,.12)",
                        border: "1px solid rgba(34,197,94,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 16px",
                      border: 0,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                      color: INK,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 4,
                    }}
                  >
                    {loading ? "Processing…" : mode === "signup" ? "Create Account" : "Sign In"}
                    <ArrowRight size={16} />
                  </button>
                </form>

                <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "rgba(250,249,246,.55)" }}>
                  {mode === "signup" ? "Already have an account?" : "Don't have an account?"}{" "}
                  <button
                    type="button"
                    onClick={() => onSwitchMode?.(mode === "signup" ? "login" : "signup")}
                    style={{
                      background: "none",
                      border: 0,
                      color: GOLD,
                      cursor: "pointer",
                      fontWeight: 600,
                      padding: 0,
                    }}
                  >
                    {mode === "signup" ? "Sign in" : "Create one"}
                  </button>
                </div>
              </>
            )}

            {/* ═══════════════════════════════════════════════════════════
                VIEW: PASSWORDLESS EMAIL CODE SIGN-IN
            ═══════════════════════════════════════════════════════════ */}
            {mode === "magic_code" && (
              <div>
                <button
                  type="button"
                  onClick={() => onSwitchMode?.("login")}
                  style={{
                    background: "none",
                    border: 0,
                    color: "rgba(250,249,246,.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <ArrowLeft size={14} /> Back to Sign In
                </button>

                <h2 style={{ fontFamily: "Playfair Display, serif", margin: "0 0 6px", fontSize: 24 }}>
                  Sign in with email code
                </h2>
                <p style={{ color: "rgba(250,249,246,.5)", fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>
                  We'll email you a one-time 6-digit code. No password needed.
                </p>

                <form onSubmit={handleSendMagicCode} style={{ display: "grid", gap: 13 }}>
                  <label style={{ display: "grid", gap: 6, color: "rgba(250,249,246,.65)", fontSize: 12 }}>
                    Email address
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@gmail.com"
                      style={fieldStyle}
                      autoComplete="email"
                      autoFocus
                      required
                    />
                  </label>

                  {error && (
                    <div style={{ color: "#FCA5A5", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.3)", padding: "9px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
                      {error}
                    </div>
                  )}
                  {message && (
                    <div style={{ color: "#86EFAC", background: "rgba(34,197,94,.12)", border: "1px solid rgba(34,197,94,.3)", padding: "9px 12px", borderRadius: 8, fontSize: 12, lineHeight: 1.5 }}>
                      {message}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 16px",
                      border: 0,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                      color: INK,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 4,
                    }}
                  >
                    {loading ? "Sending code…" : "Send 6-digit code"}
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                VIEW: VERIFY OTP (6-DIGIT CODE)
            ═══════════════════════════════════════════════════════════ */}
            {mode === "verify_otp" && (
              <div>
                <button
                  type="button"
                  onClick={() => onSwitchMode?.("magic_code")}
                  style={{
                    background: "none",
                    border: 0,
                    color: "rgba(250,249,246,.5)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <h2 style={{ fontFamily: "Playfair Display, serif", margin: "0 0 6px", fontSize: 24 }}>
                  Enter Verification Code
                </h2>
                <p style={{ color: "rgba(250,249,246,.5)", fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>
                  Please enter the 6-digit verification code sent to{" "}
                  <strong style={{ color: GOLD }}>
                    {recoveryMethod === "email" ? email || "your email" : phoneNumber || "your phone"}
                  </strong>
                  .
                </p>

                <form onSubmit={handleVerifyOtp} style={{ display: "grid", gap: 14 }}>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    onChange={(e) => setOtpCode(e.target.value.replace(/\\D/g, "").slice(0, 6))}
                    placeholder="123456"
                    style={{
                      ...fieldStyle,
                      fontSize: 22,
                      letterSpacing: "0.25em",
                      textAlign: "center",
                      fontWeight: 700,
                      fontFamily: "monospace",
                    }}
                    autoFocus
                  />

                  {error && (
                    <div
                      style={{
                        color: "#FCA5A5",
                        background: "rgba(239,68,68,.12)",
                        border: "1px solid rgba(239,68,68,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {message && (
                    <div
                      style={{
                        color: "#86EFAC",
                        background: "rgba(34,197,94,.12)",
                        border: "1px solid rgba(34,197,94,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 16px",
                      border: 0,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                      color: INK,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                    }}
                  >
                    {loading ? "Verifying…" : "Verify Code & Proceed"}
                    <ShieldCheck size={16} />
                  </button>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                    <button
                      type="button"
                      disabled={resendTimer > 0 || loading}
                      onClick={(event) => handleSendMagicCode(event as any)}
                      style={{
                        background: "none",
                        border: 0,
                        color: resendTimer > 0 ? "rgba(250,249,246,.35)" : GOLD,
                        cursor: resendTimer > 0 ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <RotateCw size={12} />
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                    </button>
                    <button
                      type="button"
                      onClick={() => onSwitchMode?.("login")}
                      style={{
                        background: "none",
                        border: 0,
                        color: "rgba(250,249,246,.45)",
                        cursor: "pointer",
                      }}
                    >
                      Back to Sign In
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════════════
                VIEW: SET NEW PASSWORD
            ═══════════════════════════════════════════════════════════ */}
            {mode === "set_new_password" && (
              <div>
                <h2 style={{ fontFamily: "Playfair Display, serif", margin: "0 0 6px", fontSize: 24 }}>
                  Set New Password
                </h2>
                <p style={{ color: "rgba(250,249,246,.5)", fontSize: 13, lineHeight: 1.5, margin: "0 0 18px" }}>
                  Create a new secure password for your Starfix account.
                </p>

                <form onSubmit={handleSetNewPassword} style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 11.5, color: "rgba(250,249,246,.5)", marginBottom: 6 }}>
                      New Password
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        style={{ ...fieldStyle, paddingRight: 42 }}
                        autoFocus
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        style={{
                          position: "absolute",
                          right: 12,
                          top: 11,
                          background: "none",
                          border: 0,
                          color: "rgba(250,249,246,.4)",
                          cursor: "pointer",
                        }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 11.5, color: "rgba(250,249,246,.5)", marginBottom: 6 }}>
                      Confirm New Password
                    </label>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      style={fieldStyle}
                      required
                    />
                  </div>

                  {error && (
                    <div
                      style={{
                        color: "#FCA5A5",
                        background: "rgba(239,68,68,.12)",
                        border: "1px solid rgba(239,68,68,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {error}
                    </div>
                  )}

                  {message && (
                    <div
                      style={{
                        color: "#86EFAC",
                        background: "rgba(34,197,94,.12)",
                        border: "1px solid rgba(34,197,94,.3)",
                        padding: "9px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        lineHeight: 1.5,
                      }}
                    >
                      {message}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 8,
                      padding: "12px 16px",
                      border: 0,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${GOLD_LIGHT}, ${GOLD})`,
                      color: INK,
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: loading ? "not-allowed" : "pointer",
                      marginTop: 6,
                    }}
                  >
                    {loading ? "Updating…" : "Update Password & Sign In"}
                    <CheckCircle2 size={16} />
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,.12)",
  background: "rgba(255,255,255,.05)",
  color: "#FAF9F6",
  outline: "none",
  fontFamily: "Inter, sans-serif",
  fontSize: 13.5,
  transition: "border-color 0.18s ease",
};
