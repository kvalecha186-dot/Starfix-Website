import { useEffect, useState } from "react";
import { CalendarDays, LogOut, MessageCircle, Users, Star, WalletCards } from "lucide-react";
import { supabase, fetchUserRole } from "../lib/supabase";
import type { UserProfile } from "../types";

type Props = { userProfile: UserProfile | null; onLogout: () => void };

export function MentorDashboard({ userProfile, onLogout }: Props) {
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      let mentorData = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id;

        if (userId) {
          const { data } = await supabase
            .from("mentors")
            .select("id,name,headline,company,category,years_experience,rating,total_reviews,onboarding_completed")
            .eq("profile_id", userId)
            .maybeSingle();
          if (data) mentorData = data;
        }

        const email = user?.email || userProfile?.email;
        if (!mentorData && email) {
          const { data } = await supabase
            .from("mentors")
            .select("id,name,headline,company,category,years_experience,rating,total_reviews,onboarding_completed")
            .eq("email", email)
            .maybeSingle();
          if (data) mentorData = data;
        }
      } catch (err) {
        console.warn("Error loading mentor profile:", err);
      }

      if (active) {
        setMentor(mentorData || (userProfile ? {
          name: userProfile.name,
          headline: userProfile.careerGoal || "Senior Tech Mentor",
          company: "Starfix Partner",
          rating: 5.0,
          total_reviews: 1,
        } : null));
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [userProfile]);

  const name = mentor?.name || userProfile?.name || "Mentor";

  return (
    <div style={{ minHeight: "100vh", background: "#050510", color: "#FAF9F6", fontFamily: "Inter, sans-serif", padding: 28 }}>
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 34 }}>
          <div>
            <div style={{ color: "#D4AF37", fontFamily: "Playfair Display, serif", fontWeight: 700, fontSize: 20 }}>Starfix</div>
            <div style={{ color: "rgba(250,249,246,.45)", fontSize: 12, marginTop: 4 }}>Mentor Mode</div>
          </div>
          <button onClick={onLogout} style={{ display: "flex", gap: 7, alignItems: "center", padding: "9px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,.12)", background: "rgba(255,255,255,.04)", color: "#FAF9F6", cursor: "pointer" }}>
            <LogOut size={15} /> Log out
          </button>
        </header>

        <section style={{ marginBottom: 30 }}>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 34, margin: 0 }}>Welcome, {name.split(" ")[0]}.</h1>
          <p style={{ color: "rgba(250,249,246,.52)", marginTop: 8 }}>
            {loading ? "Loading your mentor profile…" : mentor?.headline || "Your mentor workspace is ready."}
            {mentor?.company ? " · " + mentor.company : ""}
          </p>
        </section>

        {!loading && !mentor && (
          <div style={{ padding: 18, borderRadius: 16, border: "1px solid rgba(212,175,55,.25)", background: "rgba(212,175,55,.06)", color: "rgba(250,249,246,.75)", marginBottom: 24 }}>
            Your mentor account is authenticated, but the mentor profile could not be loaded. Please refresh once. If this persists, check the Supabase <code>mentors.profile_id</code> link.
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14 }}>
          {[
            [Users, "Students", "Your assigned learners"],
            [CalendarDays, "Sessions", "Upcoming mentorship sessions"],
            [MessageCircle, "Messages", "Chat with your students"],
            [WalletCards, "Earnings", "Track mentor earnings"],
            [Star, "Reviews", mentor?.rating ? String(mentor.rating) + " rating" : "Your mentor reviews"],
          ].map(([Icon, title, subtitle]: any) => (
            <div key={title} style={{ padding: 20, borderRadius: 18, border: "1px solid rgba(255,255,255,.09)", background: "rgba(255,255,255,.035)" }}>
              <Icon size={20} color="#D4AF37" />
              <div style={{ fontWeight: 700, marginTop: 16 }}>{title}</div>
              <div style={{ color: "rgba(250,249,246,.42)", fontSize: 12, marginTop: 5 }}>{subtitle}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
