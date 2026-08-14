import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { X, ArrowRight, Eye, EyeOff } from "lucide-react";

export function LoginModal({
  onLogin,
  onClose,
  onSignUp,
}: {
  onLogin: () => void;
  onClose: () => void;
  onSignUp?: () => void;
}) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);

  /* Close on ESC */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) { setError("Please enter a valid email."); return; }
    if (password.length < 1)  { setError("Please enter your password."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLogin();
    }, 900);
  };

  return (
    /* Backdrop */
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(5,5,16,0.88)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 24,
      }}
    >
      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0D0C1A",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 14,
          padding: "40px 36px",
          width: "100%", maxWidth: 400,
          fontFamily: "'Inter', sans-serif",
          position: "relative",
        }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          style={{
            position: "absolute", top: 16, right: 16,
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(250,249,246,0.2)", padding: 4,
            display: "flex", transition: "color 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.5)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(250,249,246,0.2)"; }}
        >
          <X size={16} />
        </button>

        {/* Logo */}
        <div style={{ marginBottom: 28 }}>
          <span style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "1.15rem", fontWeight: 700,
            color: "#D4AF37",
          }}>
            Starfix
          </span>
        </div>

        {/* Heading */}
        <h2 style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.7rem", fontWeight: 700,
          color: "#FAF9F6", margin: "0 0 6px",
          letterSpacing: "-0.02em",
        }}>
          Welcome back
        </h2>
        <p style={{ fontSize: "0.82rem", color: "rgba(250,249,246,0.4)", marginBottom: 28, lineHeight: 1.6 }}>
          Sign in to continue your learning journey.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{ display: "block", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(250,249,246,0.3)", marginBottom: 7, fontWeight: 600 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              placeholder="you@example.com"
              style={{
                width: "100%", padding: "11px 14px",
                background: "rgba(255,255,255,0.05)",
                border: `1px solid ${email.includes("@") ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
                borderRadius: 8, color: "#FAF9F6",
                fontSize: "0.88rem", outline: "none",
                fontFamily: "'Inter', sans-serif",
                boxSizing: "border-box", transition: "border-color 0.18s",
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = email.includes("@") ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"; }}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: "block", fontSize: "0.67rem", textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(250,249,246,0.3)", marginBottom: 7, fontWeight: 600 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                placeholder="••••••••"
                style={{
                  width: "100%", padding: "11px 40px 11px 14px",
                  background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${password.length > 0 ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 8, color: "#FAF9F6",
                  fontSize: "0.88rem", outline: "none",
                  fontFamily: "'Inter', sans-serif",
                  boxSizing: "border-box", transition: "border-color 0.18s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(212,175,55,0.6)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = password.length > 0 ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.1)"; }}
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
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

          {/* Error */}
          {error && (
            <p style={{ fontSize: "0.75rem", color: "#F87171", margin: 0, lineHeight: 1.5 }}>{error}</p>
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            initial={{ opacity: 1 }}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              background: loading ? "rgba(212,175,55,0.5)" : "linear-gradient(135deg, #F4D67A 0%, #D4AF37 100%)",
              color: "#07060f",
              border: "none", borderRadius: 99, marginTop: 6,
              padding: "12px 24px",
              fontSize: "0.9rem", fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "'Inter', sans-serif",
              transition: "all 0.2s",
              boxShadow: loading ? "none" : "0 0 24px rgba(212,175,55,0.28)",
            }}
          >
            {loading ? "Signing in…" : <><span>Sign In</span><ArrowRight size={15} /></>}
          </motion.button>
        </form>

        {/* Footer */}
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <span style={{ fontSize: "0.75rem", color: "rgba(250,249,246,0.3)" }}>
            {"Don't have an account? "}
          </span>
          <button
            onClick={() => { onClose(); onSignUp?.(); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#D4AF37", fontSize: "0.75rem", fontWeight: 600,
              fontFamily: "'Inter', sans-serif", textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            Start free →
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
