-- Mentor directory is public; a mentor can maintain their own listing;
-- admins can manage any (e.g. onboarding a new mentor).
alter table public.mentors enable row level security;
create policy "Mentors are publicly readable" on public.mentors for select using (true);
create policy "A mentor can update their own listing" on public.mentors
  for update using (auth.uid() = profile_id) with check (auth.uid() = profile_id);
create policy "Admins manage mentors" on public.mentors for insert with check (public.is_admin());
create policy "Admins can delete mentors" on public.mentors for delete using (public.is_admin());

alter table public.session_types enable row level security;
create policy "Session types are publicly readable" on public.session_types for select using (true);
create policy "A mentor manages their own session types" on public.session_types
  for all using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

alter table public.mentor_availability enable row level security;
create policy "Availability is publicly readable" on public.mentor_availability for select using (true);
create policy "A mentor manages their own availability" on public.mentor_availability
  for all using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
