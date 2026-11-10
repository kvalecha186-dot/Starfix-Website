create table public.mentor_notes (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mentor_notes_mentor_id_idx on public.mentor_notes(mentor_id);
create index mentor_notes_student_id_idx on public.mentor_notes(student_id);

alter table public.mentor_notes enable row level security;

-- Strictly private: only the owning mentor and admins get any policy at
-- all here. No student-facing policy exists on this table, on purpose —
-- students cannot read mentor notes under any circumstance.
create policy "Mentor manages their own notes" on public.mentor_notes
  for all using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Admins manage mentor notes" on public.mentor_notes for all using (public.is_admin()) with check (public.is_admin());
