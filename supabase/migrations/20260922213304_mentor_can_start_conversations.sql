
drop policy if exists "Authenticated mentors start conversations" on public.conversations;
create policy "Authenticated mentors start conversations" on public.conversations for insert to authenticated
with check (
  exists (select 1 from public.mentors m where m.id = conversations.mentor_id and m.profile_id = auth.uid())
  and exists (select 1 from public.bookings b where b.mentor_id = conversations.mentor_id and b.student_id = conversations.student_id and b.status in ('confirmed','completed'))
);

