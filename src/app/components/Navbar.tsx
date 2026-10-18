import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";
import { StarfixLogo } from "./StarfixLogo";

const GOLD = "#D4AF37";
const GOLD_LIGHT = "#F4D67A";
const INK = "#FAF9F6";

const NAV_LINKS = [
  { label: "How It Works",         href: "#how-it-works", sectionId: "how-it-works" },
  { label: "Transformation Paths", href: "#pillars",       sectionId: "pillars"      },
  { label: "Mentors",              href: "#mentors",       sectionId: "mentors"      },
  { label: "Transformations",      href: "#stories",       sectionId: "stories"      },
  { label: "Pricing",              href: "#pricing",       sectionId: "pricing"      },
];

export function Navbar({
  loggedIn,
  userName,
  onLogin,
  onGetStarted,
  onProfileClick,
}: {
  loggedIn?: boolean;
  userName?: string;
  onLogin?: () => void;
  onGetStarted?: () => void;
  onProfileClick?: () => void;
} = {}) {
  const [scrolled,  setScrolled]  = useState(false);
  const [activeId,  setActiveId]  = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loginHover, setLoginHover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.sectionId);
    const lit: Record<string, boolean> = {};
    const pick = () => {
      const found = ids.find((id) => lit[id]);
      if (found) setActiveId(found);
    };
    const observers = ids.flatMap((id) => {
      const el = document.getElementById(id);
      if (!el) return [];
      const obs = new IntersectionObserver(
        ([entry]) => { lit[id] = entry.isIntersecting; pick(); },
        { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      return [obs];
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = useCallback((e: React.MouseEvent, href: string) => {
    e.preventDefault();
    document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background:    scrolled ? "rgba(10, 10, 16, 0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(160%)" : "none",
        borderBottom:  scrolled ? "1px solid rgba(255,255,255,0.07)" : "none",
        transition:    "background 0.45s, border-color 0.45s, backdrop-filter 0.45s",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[68px] flex items-center justify-between">

        {/* Logo */}
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ textDecoration: "none" }}
        >
          <StarfixLogo size={34} markColor="#D4AF37" textColor="#FAF9F6" />
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center" style={{ gap: 18 }}>
          {NAV_LINKS.map((link) => {
            const active  = activeId  === link.sectionId;
            const hovered = hoveredId === link.sectionId;
            const glow = active
              ? "0 0 14px rgba(212,175,55,0.45), 0 0 28px rgba(212,175,55,0.18)"
              : hovered
              ? "0 0 10px rgba(212,175,55,0.22)"
              : "none";
            return (
              <a
                key={link.sectionId}
                href={link.href}
                onClick={(e) => scrollTo(e, link.href)}
                onMouseEnter={() => setHoveredId(link.sectionId)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  fontFamily:    "'Inter', sans-serif",
                  fontSize:      "0.82rem",
                  fontWeight:    active ? 500 : 400,
                  color:         active ? "#F6D67A" : hovered ? "#FAF9F6" : "rgba(250,249,246,0.52)",
                  textDecoration: "none",
                  letterSpacing: "0.005em",
                  padding:       "0.45rem 0",
                  border:        "none",
                  outline:       "none",
                  boxShadow:     "none",
                  background:    "transparent",
                  textShadow:    glow,
                  transition:    "color 200ms ease, text-shadow 200ms ease",
                }}
              >
                {link.label}
              </a>
            );
          })}
        </div>

        {/* Right — auth actions */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {loggedIn ? (
            <>
              {/* Avatar */}
              <div
                title={userName || "Account"}
                style={{
                  width: 34, height: 34, borderRadius: "50%",
                  background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#0A0912", fontFamily: "'Playfair Display', serif",
                  fontSize: "0.82rem", fontWeight: 700, flexShrink: 0,
                  boxShadow: "0 0 0 2px rgba(212,175,55,0.18)",
                }}
              >
                {(userName || "S")[0].toUpperCase()}
              </div>

              {/* Small gold-outlined profile button */}
              <motion.button
                onClick={onProfileClick}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                style={{
                  height: 38, display: "flex", alignItems: "center",
                  padding: "0 16px", borderRadius: 999,
                  background: "transparent",
                  border: `1px solid ${GOLD}`,
                  color: GOLD_LIGHT,
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.8rem", fontWeight: 600,
                  cursor: "pointer",
                  transition: "box-shadow 200ms ease, background 200ms ease",
                }}
              >
                Profile
              </motion.button>
            </>
          ) : (
            <>
              {/* Log in — secondary text button */}
              <button
                onClick={onLogin}
                onMouseEnter={() => setLoginHover(true)}
                onMouseLeave={() => setLoginHover(false)}
                style={{
                  height: 38, display: "flex", alignItems: "center",
                  padding: "0 12px", borderRadius: 999,
                  background: "transparent", border: "none",
                  color: loginHover ? INK : "rgba(250,249,246,0.72)",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem", fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                Log in
              </button>

              {/* Get Started — primary gold button */}
              <motion.button
                onClick={onGetStarted}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  height: 38, display: "flex", alignItems: "center",
                  padding: "0 16px", borderRadius: 999, border: "none",
                  background: `linear-gradient(135deg, ${GOLD_LIGHT} 0%, ${GOLD} 100%)`,
                  color: "#0A0912",
                  fontFamily: "'Inter', sans-serif",
                  fontSize: "0.82rem", fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 0 16px rgba(212,175,55,0.25)",
                }}
              >
                Get Started
              </motion.button>
            </>
          )}

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex md:hidden items-center justify-center"
            aria-label="Toggle navigation menu"
            style={{
              width: 36, height: 36, borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.12)",
              background: mobileMenuOpen ? "rgba(255,255,255,0.08)" : "transparent",
              color: "#FAF9F6", cursor: "pointer", marginLeft: 4,
            }}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            className="md:hidden"
            style={{
              background: "rgba(10, 10, 16, 0.98)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 24px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link.sectionId}
                  href={link.href}
                  onClick={(e) => {
                    scrollTo(e, link.href);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: "0.92rem",
                    color: activeId === link.sectionId ? GOLD_LIGHT : "rgba(250,249,246,0.75)",
                    textDecoration: "none",
                    padding: "8px 0",
                    fontWeight: activeId === link.sectionId ? 600 : 400,
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}
