import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4D67A";
const INK = "#FAF9F6";

export type AuthMode = "login" | "signup";

type ProfileResult = { name: string; email: string };

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

function labelStyle(): React.CSSProperties {
  return { display: "block", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(250,249,246,0.32)", marginBottom: 7, fontWeight: 600 };
}

function inputStyle(filled: boolean): React.CSSProperties {
  return { width: "100%", padding: "12px 14px", background: "rgba(255,255,255,0.04)", border: `1px solid ${filled ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.09)"}`, borderRadius: 12, color: INK, fontSize: "0.88rem", outline: "none", fontFamily: "'Inter', sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" };
}

async function currentProfile(): Promise<ProfileResult | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle();
  return {
    name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Starfix User",
    email: profile?.email || user.email || "",
  };
}

export function AuthModal({ mode, onClose, onSuccess, onSwitchMode }: {
  mode: AuthMode;
  onClose: () => void;
  onSuccess: (profile: ProfileResult) => void;
  onSwitchMode: (mode: AuthMode) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  useEffect(() => { setError(""); setInfo(""); setLoading(false); }, [mode]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (isSignup && name.trim().length < 2) return setError("Please enter your full name.");
    if (!email.includes("@")) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);

    if (isSignup) {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: name.trim(), name: name.trim() } },
      });
      if (authError) setError(authError.message);
      else if (data.user && data.session) {
        const profile = await currentProfile();
        onSuccess(profile ?? { name: name.trim(), email: email.trim() });
      } else {
        setInfo("Account created. Check your email to confirm your account, then log in.");
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (authError) setError(authError.message);
      else {
        const profile = await currentProfile();
        onSuccess(profile ?? { name: name.trim() || email.split("@")[0], email: email.trim() });
      }
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setInfo(""); setLoading(true);
    localStorage.setItem("starfix_pending_google_auth", "true");
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      localStorage.removeItem("starfix_pending_google_auth");
      setError(authError.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.includes("@")) return setError("Enter your email first.");
    setError(""); setInfo(""); setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}` });
    if (authError) setError(authError.message);
    else setInfo("Password reset email sent. Check your inbox.");
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(4,4,12,0.72)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <motion.div initial={{ opacity: 0, y: 22, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 14, scale: 0.97 }} transition={{ duration: 0.3 }} onClick={(e) => e.stopPropagation()} style={{ position: "relative", background: "rgba(16,15,28,0.92)", backdropFilter: "blur(28px) saturate(160%)", border: "1px solid rgba(212,175,55,0.22)", boxShadow: "0 30px 90px rgba(0,0,0,0.55), 0 0 60px rgba(212,175,55,0.08)", borderRadius: 28, padding: "42px 38px 34px", width: "100%", maxWidth: 408, fontFamily: "'Inter', sans-serif", overflow: "hidden" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 18, right: 18, background: "none", border: "none", cursor: "pointer", color: "rgba(250,249,246,0.35)", padding: 4 }}><X size={16} /></button>
        <div style={{ marginBottom: 26 }}><span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: GOLD }}>Starfix</span></div>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.65rem", color: INK, margin: "0 0 6px" }}>{isSignup ? "Create your Starfix account" : "Welcome back"}</h2>
        <p style={{ fontSize: "0.82rem", color: "rgba(250,249,246,0.38)", marginBottom: 26, lineHeight: 1.6 }}>{isSignup ? "Begin your transformation, guided by real mentors." : "Sign in to continue your journey."}</p>

        <motion.button type="button" onClick={handleGoogle} disabled={loading} whileTap={{ scale: 0.98 }} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "11px 14px", borderRadius: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: INK, fontSize: "0.85rem", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", marginBottom: 20 }}><GoogleMark /> Continue with Google</motion.button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} /><span style={{ fontSize: "0.68rem", color: "rgba(250,249,246,0.28)", textTransform: "uppercase" }}>or</span><div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} /></div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {isSignup && <div><label style={labelStyle()}>Full name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={inputStyle(name.trim().length > 1)} /></div>}
          <div><label style={labelStyle()}>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle(email.includes("@"))} /></div>
          <div><label style={labelStyle()}>Password</label><div style={{ position: "relative" }}><input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={{ ...inputStyle(password.length > 0), paddingRight: 42 }} /><button type="button" onClick={() => setShowPw((v) => !v)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "rgba(250,249,246,0.3)", cursor: "pointer" }}>{showPw ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
          {!isSignup && <div style={{ display: "flex", justifyContent: "flex-end" }}><button type="button" onClick={handleForgotPassword} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(250,249,246,0.36)", fontSize: "0.73rem" }}>Forgot password?</button></div>}
          {error && <p style={{ fontSize: "0.75rem", color: "#F87171", margin: 0, lineHeight: 1.5 }}>{error}</p>}
          {info && <p style={{ fontSize: "0.75rem", color: GOLD_LIGHT, margin: 0, lineHeight: 1.5 }}>{info}</p>}
          <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: loading ? "rgba(212,175,55,0.45)" : `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`, color: "#0A0912", border: "none", borderRadius: 999, marginTop: 4, padding: "13px 24px", fontSize: "0.9rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>{loading ? (isSignup ? "Creating your account…" : "Signing in…") : <><span>{isSignup ? "Create my account" : "Continue"}</span><ArrowRight size={15} /></>}</motion.button>
        </form>

        <div style={{ marginTop: 24, textAlign: "center" }}><span style={{ fontSize: "0.75rem", color: "rgba(250,249,246,0.32)" }}>{isSignup ? "Already have an account? " : "Don't have an account? "}</span><button onClick={() => onSwitchMode(isSignup ? "login" : "signup")} style={{ background: "none", border: "none", cursor: "pointer", color: GOLD, fontSize: "0.75rem", fontWeight: 600 }}>{isSignup ? "Log in" : "Get started →"}</button></div>
      </motion.div>
    </motion.div>
  );
}

function SessionBootstrap() {
  useEffect(() => {
    let active = true;
    const sync = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) {
        const profile = await currentProfile();
        if (profile) localStorage.setItem("userProfile", JSON.stringify({ name: profile.name, email: profile.email }));
        if (localStorage.getItem("loggedIn") !== "true") {
          localStorage.setItem("loggedIn", "true");
          localStorage.removeItem("starfix_pending_google_auth");
          window.location.reload();
        }
      }
    };
    sync();
    const { data: listener } = supabase.auth.onAuthStateChange(() => { sync(); });
    const timer = window.setInterval(async () => {
      if (localStorage.getItem("loggedIn") !== "true") {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) await supabase.auth.signOut();
      }
    }, 1000);
    return () => { active = false; listener.subscription.unsubscribe(); window.clearInterval(timer); };
  }, []);
  return null;
}

export function AuthModalPortal(props: { mode: AuthMode | null; onClose: () => void; onSuccess: (profile: ProfileResult) => void; onSwitchMode: (mode: AuthMode) => void; }) {
  return <><SessionBootstrap /><AnimatePresence>{props.mode && <AuthModal mode={props.mode} onClose={props.onClose} onSuccess={props.onSuccess} onSwitchMode={props.onSwitchMode} />}</AnimatePresence></>;
}
