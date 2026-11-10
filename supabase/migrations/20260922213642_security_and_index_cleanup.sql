
alter function public.auto_confirm_new_users() set search_path = public;
revoke all on function public.auto_confirm_new_users() from public, anon, authenticated;
drop index if exists public.conversations_student_mentor_uidx;
create index if not exists mentor_feedback_student_idx on public.mentor_feedback(student_id);
create index if not exists mentor_goals_student_idx on public.mentor_goals(student_id);

