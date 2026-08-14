import { useState, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router";
import "../styles/fonts.css";
import { Toaster } from "sonner";
import { PathMentorSelectionPage } from "./dashboard/pages/PathMentorSelectionPage";
import { PathMentorProfilePage }   from "./dashboard/pages/PathMentorProfilePage";
import { GrowthPathOverviewPage } from "./dashboard/pages/GrowthPathOverviewPage";
import { ActivationPage }        from "./dashboard/pages/ActivationPage";
import { MyPathWorkspace }       from "./dashboard/pages/MyPathWorkspace";
import { SplashScreen }          from "./components/SplashScreen";
import { Onboarding }            from "./components/Onboarding";
import { AuthModalPortal, type AuthMode } from "./components/AuthModal";
import { AnimatePresence, motion } from "motion/react";
import { Navbar }                from "./components/Navbar";
import { HeroSection }           from "./components/HeroSection";
import { StarJourney }           from "./components/StarJourney";
import { WhyStarfixWorks }       from "./components/WhyStarfixWorks";
import { HowItWorks }            from "./components/HowItWorks";
import { TransformationPillars } from "./components/TransformationPillars";
import { ConstellationProgress } from "./components/ConstellationProgress";
import { MentorSection }         from "./components/MentorSection";
import { DailyMissions }         from "./components/DailyMissions";
import { SuccessStories }        from "./components/SuccessStories";
import { PricingSection }        from "./components/PricingSection";
import { CTASection }            from "./components/CTASection";
import { Footer }                from "./components/Footer";
import { DashboardLayout }       from "./dashboard/DashboardLayout";
import { AdminLayout }           from "./admin/AdminLayout";
import type { UserProfile }      from "./types";
import { GOAL_META }             from "./types";

/* MARKER-MAKE-KIT-INVOKED */

/* Permanent redirects for retired route prefixes. If anyone lands on an
   old /paths/:id or /my-paths/:id URL — a stale bookmark, a leftover
   browser-history entry from before this migration, a stale link
   somewhere — they're bounced straight to the current /growth-paths/
   route via history REPLACE (never PUSH), so the old URL never lingers
   as a navigable history entry either. */
function RedirectToOverview() {
  const { pathId } = useParams<{ pathId: string }>();
  return <Navigate to={`/growth-paths/${pathId}`} replace />;
}
function RedirectToJourney() {
  const { pathId } = useParams<{ pathId: string }>();
  return <Navigate to={`/growth-paths/${pathId}/journey`} replace />;
}

/* Default profile for users who sign in without onboarding */
const DEFAULT_PROFILE: UserProfile = {
  name:       "Khushi Agarwal",
  email:      "khushi@example.com",
  goalId:     "coding",
  goalTitle:  GOAL_META["coding"].title,
  level:      "intermediate",
  dailyTime:  "30min",
  preference: "roadmap",
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Public, dynamic per-path pages — work identically for every Growth
           Path (Coding, Fitness, Meditation, Drawing, ...), never just Coding.
           /growth-paths/:pathId is the ONLY overview route in the app — the
           old /paths/:pathId page (PathOverviewPage.tsx) has been fully
           retired and nothing links to it anymore. */}
        <Route path="/growth-paths" element={<AppShell />} />
        <Route path="/growth-paths/:pathId" element={<GrowthPathOverviewPage />} />
        <Route path="/growth-paths/:pathId/journey" element={<MyPathWorkspace />} />
        <Route path="/growth-paths/:pathId/mentors" element={<PathMentorSelectionPage />} />
        <Route path="/growth-paths/:pathId/mentors/:mentorId" element={<PathMentorProfilePage />} />
        <Route path="/activate/:pathId" element={<ActivationPage />} />

        {/* Retired route prefixes — permanent redirect, not a live page. */}
        <Route path="/my-paths/:pathId" element={<RedirectToJourney />} />
        {/* Everything else — splash / onboarding / landing / dashboard / admin — 
           is handled by the existing app shell below. */}
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell() {
  // Standalone admin panel entry point — /admin bypasses the learner-facing
  // splash/onboarding/login flow entirely. Computed once; doesn't change
  // during this component's lifetime, so it's safe to branch on at render
  // time without affecting hook order below.
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  const [splashDone,     setSplashDone]     = useState(() => {
    return typeof window !== "undefined" && sessionStorage.getItem("splashDone") === "true";
  });
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authMode,       setAuthMode]       = useState<AuthMode | null>(null);
  const [loggedIn,       setLoggedIn]       = useState(() => {
    return localStorage.getItem("loggedIn") === "true";
  });
  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("userProfile");
    return saved ? JSON.parse(saved) : null;
  });

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("splashDone", "true");
    setSplashDone(true);
  }, []);

  const handleStartOnboarding = useCallback(() => {
    setAuthMode(null);
    setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = useCallback(() => setShowOnboarding(false), []);

  const handleOnboardingComplete = useCallback((profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem("userProfile", JSON.stringify(profile));
    localStorage.setItem("loggedIn", "true");
    setShowOnboarding(false);
    setLoggedIn(true);
  }, []);

  // Navbar "Log in" / "Get Started" — open the lightweight auth modal
  // (distinct from the full multi-step Onboarding flow used elsewhere).
  const handleOpenLogin = useCallback(() => {
    setShowOnboarding(false);
    setAuthMode("login");
  }, []);

  const handleOpenSignup = useCallback(() => {
    setShowOnboarding(false);
    setAuthMode("signup");
  }, []);

  const handleCloseAuth = useCallback(() => setAuthMode(null), []);

  const handleAuthSuccess = useCallback((profile: { name: string; email: string }) => {
    setAuthMode(null);
    const saved = localStorage.getItem("userProfile");
    const base: UserProfile = saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    const merged: UserProfile = { ...base, name: profile.name || base.name, email: profile.email || base.email };
    setUserProfile(merged);
    localStorage.setItem("userProfile", JSON.stringify(merged));
    localStorage.setItem("loggedIn", "true");
    setLoggedIn(true);
  }, []);

  const handleLogout = useCallback(() => {
    setLoggedIn(false);
    setUserProfile(null);
    localStorage.removeItem("userProfile");
    localStorage.removeItem("loggedIn");
  }, []);

  // Single source of truth for profile edits (e.g. Profile page "Save").
  // Merges into the global userProfile, persists to localStorage, and — since
  // every dashboard page reads this same userProfile prop — the change shows
  // up in Dashboard, Sidebar, Growth Paths, Mentors, and Explore immediately,
  // and survives route changes, refresh, and closing the browser.
  const handleUpdateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const base = prev ?? DEFAULT_PROFILE;
      const merged: UserProfile = { ...base, ...patch };
      localStorage.setItem("userProfile", JSON.stringify(merged));
      return merged;
    });
  }, []);


  return (
    <div style={{ minHeight: "100vh" }}>
      {isAdmin ? (
        <AdminLayout />
      ) : (
        <>
      {/* ── Splash ── */}
      {!splashDone && <SplashScreen onComplete={handleComplete} />}

      {/* ── Dashboard ── */}
      {splashDone && loggedIn && (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.45 }}
        >
          <DashboardLayout onLogout={handleLogout} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />
        </motion.div>
      )}

      {/* ── Landing page ── */}
      {splashDone && !loggedIn && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ background: "#050510", color: "#FAF9F6" }}
        >
          <Navbar
            loggedIn={loggedIn}
            userName={userProfile?.name}
            onLogin={handleOpenLogin}
            onGetStarted={handleOpenSignup}
            onProfileClick={() => setLoggedIn(true)}
          />
          <HeroSection />
          <div id="star-journey"><StarJourney /></div>
          <div id="how-it-works"><HowItWorks /></div>
          <WhyStarfixWorks />
          <div id="pillars"><TransformationPillars /></div>
          <ConstellationProgress />
          <div id="mentors"><MentorSection /></div>
          <DailyMissions />
          <div id="stories"><SuccessStories /></div>
          <div id="pricing"><PricingSection onStartOnboarding={handleStartOnboarding} /></div>
          <CTASection
            onStartOnboarding={handleStartOnboarding}
            onLogin={handleOpenLogin}
          />
          <Footer />
        </motion.div>
      )}

      {/* ── Onboarding overlay ── */}
      <AnimatePresence>
        {showOnboarding && (
          <Onboarding
            onClose={handleCloseOnboarding}
            onComplete={handleOnboardingComplete}
            onOpenLogin={handleOpenLogin}
          />
        )}
      </AnimatePresence>

      {/* ── Auth modal (Log in / Get Started) ── */}
      <AuthModalPortal
        mode={authMode}
        onClose={handleCloseAuth}
        onSuccess={handleAuthSuccess}
        onSwitchMode={setAuthMode}
      />
        </>
      )}
    </div>
  );
}
