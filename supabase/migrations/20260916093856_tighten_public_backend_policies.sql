-- Remove broad public write policies from backend tables.
drop policy if exists "Admins manage growth paths" on public.growth_paths;
drop policy if exists "A mentor can update their own listing" on public.mentors;
drop policy if exists "Admins can delete mentors" on public.mentors;
drop policy if exists "A mentor manages their own availability" on public.mentor_availability;
drop policy if exists "A mentor manages their own session types" on public.session_types;
drop policy if exists "Mentor can view own conversations" on public.conversations;
drop policy if exists "Participants can update conversation (e.g. archive)" on public.conversations;
drop policy if exists "Student can start a conversation" on public.conversations;
drop policy if exists "Student can view own conversations" on public.conversations;
drop policy if exists "Participants can send messages as themselves" on public.messages;
drop policy if exists "Participants can update message status" on public.messages;
drop policy if exists "Participants can view messages" on public.messages;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Mentors can update own listing" on public.mentors for update to authenticated using (profile_id = auth.uid() or public.is_admin()) with check (profile_id = auth.uid() or public.is_admin());
create policy "Admins can delete mentors" on public.mentors for delete to authenticated using (public.is_admin());
create policy "Mentors manage own session types" on public.session_types for all to authenticated using (exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin()) with check (exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin());
create policy "Mentors manage own availability" on public.mentor_availability for all to authenticated using (exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin()) with check (exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin());

create policy "Authenticated participants view conversations" on public.conversations for select to authenticated using (student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin());
create policy "Authenticated students start conversations" on public.conversations for insert to authenticated with check (student_id = auth.uid() or public.is_admin());
create policy "Authenticated participants update conversations" on public.conversations for update to authenticated using (student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin()) with check (student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = mentor_id and m.profile_id = auth.uid()) or public.is_admin());
create policy "Authenticated participants view messages" on public.messages for select to authenticated using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = c.mentor_id and m.profile_id = auth.uid()))) or public.is_admin());
create policy "Authenticated participants send messages" on public.messages for insert to authenticated with check (sender = auth.uid()::text and exists(select 1 from public.conversations c where c.id = conversation_id and (c.student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = c.mentor_id and m.profile_id = auth.uid()))) or public.is_admin());
create policy "Authenticated participants update message status" on public.messages for update to authenticated using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = c.mentor_id and m.profile_id = auth.uid()))) or public.is_admin()) with check (exists(select 1 from public.conversations c where c.id = conversation_id and (c.student_id = auth.uid() or exists(select 1 from public.mentors m where m.id = c.mentor_id and m.profile_id = auth.uid()))) or public.is_admin());
create policy "Authenticated users update own profile" on public.profiles for update to authenticated using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());
