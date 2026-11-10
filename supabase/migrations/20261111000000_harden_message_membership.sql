-- Restrict mentor-side message access to an actual student/mentor booking relationship.
drop policy if exists "A mentor can view messages in their conversations" on public.messages;
drop policy if exists "A mentor can send messages in their conversations" on public.messages;

create policy "Mentors can view messages for their booked students"
on public.messages for select to authenticated
using (
  exists (
    select 1 from public.mentors m
    where m.id = messages.mentor_id and m.profile_id = (select auth.uid())
  )
  and exists (
    select 1 from public.bookings b
    where b.student_id = messages.user_id
      and b.mentor_id = messages.mentor_id
      and b.status not in ('cancelled','Cancelled')
  )
);

create policy "Mentors can send messages to their booked students"
on public.messages for insert to authenticated
with check (
  sender_type = 'mentor'
  and exists (
    select 1 from public.mentors m
    where m.id = messages.mentor_id and m.profile_id = (select auth.uid())
  )
  and exists (
    select 1 from public.bookings b
    where b.student_id = messages.user_id
      and b.mentor_id = messages.mentor_id
      and b.status not in ('cancelled','Cancelled')
  )
);

-- A student may only create a message as themselves, and must identify a real mentor.
drop policy if exists "Users can insert their messages" on public.messages;
create policy "Students can send messages in their own conversations"
on public.messages for insert to authenticated
with check (
  user_id = (select auth.uid())
  and sender_type = 'user'
  and mentor_id is not null
);
