import { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { C } from "../dashColors";
import { PATHS } from "./GoalsPage";
import { isEnrolled, assignMentor, scheduleMentorWelcomeReply } from "../../lib/pathProgress";
import { MentorDetailPage } from "./MentorDetailPage";

/**
 * Path-specific mentor profile.
 * Uses the same live, verified mentor record and session catalogue as the
 * general mentor detail page. No hard-coded sample bios or testimonials.
 */
export function PathMentorProfilePage() {
  const { pathId, mentorId } = useParams<{ pathId: string; mentorId: string }>();
  const navigate = useNavigate();
  const path = PATHS.find((item) => item.id === pathId);

  useEffect(() => {
    if (path && !isEnrolled(path.id)) {
      navigate(`/activate/${path.id}`, { replace: true });
    }
  }, [path?.id, navigate]);

  if (!path) {
    return (
      <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.4rem", color: C.text }}>Growth Path not found</span>
        <Link to="/growth-paths" style={{ color: C.gold, fontSize: "0.86rem", fontFamily: "'Inter', sans-serif" }}>← Back to Growth Paths</Link>
      </div>
    );
  }

  if (!isEnrolled(path.id)) return null;

  const handleChooseMentor = (selectedId: number, mentorName: string) => {
    assignMentor(path.id, selectedId, "To be scheduled", "To be scheduled");
    scheduleMentorWelcomeReply(mentorName, path.id);
    toast.success(`${mentorName} is now your mentor for ${path.title}`, {
      description: "Your first session can be scheduled from your workspace.",
    });
    navigate(`/growth-paths/${path.id}/journey`);
  };

  return (
    <MentorDetailPage
      mentorId={Number(mentorId)}
      onChooseMentor={handleChooseMentor}
    />
  );
}
