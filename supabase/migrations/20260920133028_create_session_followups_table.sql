create table public.session_followups (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  summary text,
  discussed text,
  strengths text,
  areas_to_improve text,
  next_steps text,
  recommended_resources text,
  follow_up_date date,
  created_at timestamptz not null default now(),
  unique (booking_id)
);
create index session_followups_mentor_id_idx on public.session_followups(mentor_id);
create index session_followups_student_id_idx on public.session_followups(student_id);

alter table public.session_followups enable row level security;

create policy "Mentor manages their session followups" on public.session_followups
  for all using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Student views their session followups" on public.session_followups
  for select using (auth.uid() = student_id);
create policy "Admins manage session followups" on public.session_followups for all using (public.is_admin()) with check (public.is_admin());
