
drop policy if exists "Mentors manage assigned milestone progress" on public.milestone_progress;
create policy "Mentors manage assigned milestone progress" on public.milestone_progress for all to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.mentors m on m.id = b.mentor_id
    where b.student_id = milestone_progress.user_id
      and m.profile_id = auth.uid()
      and b.status in ('confirmed','completed')
  )
  or is_admin()
)
with check (
  exists (
    select 1 from public.bookings b
    join public.mentors m on m.id = b.mentor_id
    where b.student_id = milestone_progress.user_id
      and m.profile_id = auth.uid()
      and b.status in ('confirmed','completed')
  )
  or is_admin()
);

drop policy if exists "Mentors update assigned user progress" on public.user_progress;
create policy "Mentors update assigned user progress" on public.user_progress for update to authenticated
using (
  exists (
    select 1 from public.bookings b
    join public.mentors m on m.id = b.mentor_id
    where b.student_id = user_progress.user_id
      and m.profile_id = auth.uid()
      and b.status in ('confirmed','completed')
  )
  or is_admin()
)
with check (
  exists (
    select 1 from public.bookings b
    join public.mentors m on m.id = b.mentor_id
    where b.student_id = user_progress.user_id
      and m.profile_id = auth.uid()
      and b.status in ('confirmed','completed')
  )
  or is_admin()
);

