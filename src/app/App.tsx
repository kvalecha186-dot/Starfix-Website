import { useState, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router";
import "../styles/fonts.css";
import { Toaster } from "sonner";
import { PathMentorSelectionPage } from "./dashboard/pages/PathMentorSelectionPage";
import { PathMentorProfilePage } from "./dashboard/pages/PathMentorProfilePage";
import { GrowthPathOverviewPage } from "./dashboard/pages/GrowthPathOverviewPage";
import { ActivationPage } from "./dashboard/pages/ActivationPage";
import { MyPathWorkspace } from "./dashboard/pages/MyPathWorkspace";
import { SplashScreen } from "./components/SplashScreen";
import { Onboarding } from "./components/Onboarding";
import { RoleChoice } from "./components/RoleChoice";
import { MentorOnboarding } from "./components/MentorOnboarding";
import { SupabaseAuthModal, type SupabaseAuthMode } from "./components/SupabaseAuthModal";
import { AnimatePresence, motion } from "motion/react";
import { Navbar } from "./components/Navbar";
import { HeroSection } from "./components/HeroSection";
import { StarJourney } from "./components/StarJourney";
import { WhyStarfixWorks } from "./components/WhyStarfixWorks";
import { HowItWorks } from "./components/HowItWorks";
import { TransformationPillars } from "./components/TransformationPillars";
import { ConstellationProgress } from "./components/ConstellationProgress";
import { MentorSection } from "./components/MentorSection";
import { DailyMissions } from "./components/DailyMissions";
import { SuccessStories } from "./components/SuccessStories";
import { PricingSection } from "./components/PricingSection";
import { CTASection } from "./components/CTASection";
import { Footer } from "./components/Footer";
import { DashboardLayout } from "./dashboard/DashboardLayout";
import { AdminLayout } from "./admin/AdminLayout";
import type { UserProfile } from "./types";
import { GOAL_META } from "./types";
import { getProfile, supabase, upsertProfile } from "./lib/supabase";
import { initializeBackendSync, clearAllUserData } from "./lib/backendSync";

function RedirectToOverview() {
  const { pathId } = useParams<{ pathId: string }>();
  return <Navigate to={`/growth-paths/${pathId}`} replace />;
}
function RedirectToJourney() {
  const { pathId } = useParams<{ pathId: string }>();
  return <Navigate to={`/growth-paths/${pathId}/journey`} replace />;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Starfix Learner",
  email: "",
  goalId: "coding",
  goalTitle: GOAL_META.coding.title,
  level: "beginner",
  dailyTime: "30min",
  preference: "roadmap",
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/growth-paths" element={<AppShell />} />
        <Route path="/growth-paths/:pathId" element={<GrowthPathOverviewPage />} />
        <Route path="/growth-paths/:pathId/journey" element={<MyPathWorkspace />} />
        <Route path="/growth-paths/:pathId/mentors" element={<PathMentorSelectionPage />} />
        <Route path="/growth-paths/:pathId/mentors/:mentorId" element={<PathMentorProfilePage />} />
        <Route path="/activate/:pathId" element={<ActivationPage />} />
        <Route path="/my-paths/:pathId" element={<RedirectToJourney />} />
        <Route path="*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppShell() {
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");
  const [splashDone, setSplashDone] = useState(() => typeof window !== "undefined" && sessionStorage.getItem("splashDone") === "true");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [roleChoiceOpen, setRoleChoiceOpen] = useState(false);
  const [mentorOnboardingOpen, setMentorOnboardingOpen] = useState(false);
  const [authMode, setAuthMode] = useState<SupabaseAuthMode | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    let alive = true;

    async function syncSession() {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      const session = data.session;
      setLoggedIn(!!session);
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (!alive) return;
        setUserProfile(profile || {
          ...DEFAULT_PROFILE,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || DEFAULT_PROFILE.name,
          email: session.user.email || "",
        });
        void initializeBackendSync();
      } else {
        const localLoggedIn = typeof window !== "undefined" && localStorage.getItem("loggedIn") === "true";
        if (localLoggedIn) {
          const raw = localStorage.getItem("userProfile");
          try {
            setUserProfile(raw ? JSON.parse(raw) : DEFAULT_PROFILE);
            setLoggedIn(true);
          } catch {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      }
      setAuthLoading(false);
    }

    void syncSession();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive) return;
      setLoggedIn(!!session);
      if (!session) {
        setUserProfile(null);
        setAuthLoading(false);
        return;
      }
      void initializeBackendSync();
      void getProfile(session.user.id).then((profile) => {
        if (!alive) return;
        setUserProfile(profile || {
          ...DEFAULT_PROFILE,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || DEFAULT_PROFILE.name,
          email: session.user.email || "",
        });
        setAuthLoading(false);
      });
      if (event === "SIGNED_IN") setAuthMode(null);
    });

    const onCustomAuth = () => void syncSession();
    window.addEventListener("starfix:auth-changed", onCustomAuth);

    return () => {
      alive = false;
      listener.subscription.unsubscribe();
      window.removeEventListener("starfix:auth-changed", onCustomAuth);
    };
  }, []);

  const handleComplete = useCallback(() => {
    sessionStorage.setItem("splashDone", "true");
    setSplashDone(true);
  }, []);

  // "Get Started" (Pricing / CTA sections) now opens the role gate first.
  // The existing student flow is untouched — picking Student below opens
  // the exact same Onboarding component this used to open directly.
  const handleStartOnboarding = useCallback(() => {
    setAuthMode(null);
    setRoleChoiceOpen(true);
  }, []);

  const handlePickStudent = useCallback(() => {
    setRoleChoiceOpen(false);
    setShowOnboarding(true);
  }, []);

  const handlePickMentor = useCallback(() => {
    setRoleChoiceOpen(false);
    setMentorOnboardingOpen(true);
  }, []);

  // MentorOnboarding handles its own supabase.auth.signUp() + profiles.role
  // update internally; once it calls back here, a real session already
  // exists and the onAuthStateChange listener above (already running)
  // picks up the new session/profile on its own — nothing else to do here.
  const handleMentorOnboardingComplete = useCallback(() => {
    setMentorOnboardingOpen(false);
  }, []);

  const handleCloseOnboarding = useCallback(() => setShowOnboarding(false), []);

  const handleOnboardingComplete = useCallback(async (profile: UserProfile) => {
    setUserProfile(profile);
    localStorage.setItem("userProfile", JSON.stringify(profile));
    setShowOnboarding(false);
    const { data } = await supabase.auth.getSession();
    if (data.session?.user) {
      await upsertProfile(data.session.user.id, profile);
      void initializeBackendSync();
    } else {
      localStorage.setItem("loggedIn", "true");
      setLoggedIn(true);
    }
  }, []);

  const handleOpenLogin = useCallback(() => {
    setShowOnboarding(false);
    setAuthMode("login");
  }, []);

  const handleOpenSignup = useCallback(() => {
    setShowOnboarding(false);
    setAuthMode("signup");
  }, []);

  const handleCloseAuth = useCallback(() => setAuthMode(null), []);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("userProfile");
    localStorage.removeItem("loggedIn");
    clearAllUserData();
    setUserProfile(null);
    setLoggedIn(false);
  }, []);

  const handleUpdateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const merged: UserProfile = { ...(prev ?? DEFAULT_PROFILE), ...patch };
      localStorage.setItem("userProfile", JSON.stringify(merged));
      void supabase.auth.getUser().then(({ data }) => {
        if (data.user) void upsertProfile(data.user.id, merged);
      });
      return merged;
    });
  }, []);

  if (isAdmin) return <AdminLayout />;
  if (authLoading) return <div style={{ minHeight: "100vh", background: "#050510" }} />;

  return (
    <div style={{ minHeight: "100vh" }}>
      {!splashDone && <SplashScreen onComplete={handleComplete} />}

      {splashDone && loggedIn && (
        <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.45 }}>
          <DashboardLayout onLogout={handleLogout} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} />
        </motion.div>
      )}

      {splashDone && !loggedIn && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} style={{ background: "#050510", color: "#FAF9F6" }}>
          <Navbar loggedIn={loggedIn} userName={userProfile?.name} onLogin={handleOpenLogin} onGetStarted={handleOpenSignup} onProfileClick={() => setAuthMode("login")} />
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
          <CTASection onStartOnboarding={handleStartOnboarding} onLogin={handleOpenLogin} />
          <Footer />
        </motion.div>
      )}

      <AnimatePresence>
        {showOnboarding && (
          <Onboarding onClose={handleCloseOnboarding} onComplete={handleOnboardingComplete} onOpenLogin={handleOpenLogin} />
        )}
      </AnimatePresence>

      <RoleChoice
        open={roleChoiceOpen}
        onClose={() => setRoleChoiceOpen(false)}
        onPickStudent={handlePickStudent}
        onPickMentor={handlePickMentor}
      />
      <MentorOnboarding
        open={mentorOnboardingOpen}
        onClose={() => setMentorOnboardingOpen(false)}
        onComplete={handleMentorOnboardingComplete}
      />

      <SupabaseAuthModal mode={authMode} onClose={handleCloseAuth} onSuccess={() => undefined} onSwitchMode={setAuthMode} />
    </div>
  );
}
