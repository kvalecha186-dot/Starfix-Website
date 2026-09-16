import { supabase } from "./supabase";

export type DbMentor = {
  id: string; legacy_id: number | null; name: string; initials: string; color: string;
  headline: string | null; company: string | null; years_experience: number | null; rating: number | null;
  category: string | null; price: string | null; free: boolean | null; availability: string | null;
  students_count: number | null; location: string | null; languages: string[] | null;
};

export async function isCurrentUserAdmin() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  return data?.role === "admin";
}

export async function loadAdminMentors(): Promise<DbMentor[]> {
  const { data, error } = await supabase.from("mentors").select("*").order("name");
  if (error) throw error;
  return (data || []) as DbMentor[];
}

export async function updateMentor(id: string, patch: Partial<DbMentor>) {
  const allowed = (({ name, initials, color, headline, company, years_experience, rating, category, price, free, availability, students_count, location, languages }: any) =>
    ({ name, initials, color, headline, company, years_experience, rating, category, price, free, availability, students_count, location, languages }))(patch);
  const { error } = await supabase.from("mentors").update(allowed).eq("id", id);
  if (error) throw error;
}

export async function loadAdminSessions() {
  const { data, error } = await supabase.from("bookings")
    .select("id,student_id,mentor_id,mentor_name,session_type,scheduled_start,scheduled_end,status,created_at")
    .order("scheduled_start", { ascending: true });
  if (error) throw error;
  const studentIds = [...new Set((data || []).map((x: any) => x.student_id).filter(Boolean))];
  const profiles = studentIds.length ? await supabase.from("profiles").select("id,full_name,email").in("id", studentIds) : { data: [] as any[] };
  const map = new Map((profiles.data || []).map((p: any) => [p.id, p]));
  return (data || []).map((b: any) => ({
    id: b.id, learner: map.get(b.student_id)?.full_name || map.get(b.student_id)?.email || "Learner",
    mentor: b.mentor_name || "Mentor", topic: b.session_type || "Mentorship Session",
    start: b.scheduled_start, end: b.scheduled_end, status: b.status,
  }));
}

export async function loadAdminPaths() {
  const { data, error } = await supabase.from("growth_paths").select("*").order("title");
  if (error) throw error;
  return data || [];
}

export async function loadAdminContent() {
  const { data, error } = await supabase.from("explore_content").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function addExploreContent(input: { title: string; category: string; content_type: string; metric_value?: string; url?: string }) {
  const { error } = await supabase.from("explore_content").insert(input);
  if (error) throw error;
}

export async function loadAdminLearners() {
  const { data, error } = await supabase.from("profiles").select("id,full_name,email,role,country,career_goal,created_at").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
