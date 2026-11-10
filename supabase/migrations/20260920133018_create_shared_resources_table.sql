create table public.shared_resources (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  resource_type text not null default 'link',
  title text not null,
  url text,
  message text,
  created_at timestamptz not null default now()
);
create index shared_resources_mentor_id_idx on public.shared_resources(mentor_id);
create index shared_resources_student_id_idx on public.shared_resources(student_id);

alter table public.shared_resources enable row level security;

create policy "Mentor shares a resource" on public.shared_resources
  for insert with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Mentor views their shared resources" on public.shared_resources
  for select using (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Mentor deletes their shared resources" on public.shared_resources
  for delete using (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Student views resources shared with them" on public.shared_resources
  for select using (auth.uid() = student_id);
create policy "Admins manage shared resources" on public.shared_resources for all using (public.is_admin()) with check (public.is_admin());
