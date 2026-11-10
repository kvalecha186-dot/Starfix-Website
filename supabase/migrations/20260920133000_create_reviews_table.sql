create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  review_text text,
  created_at timestamptz not null default now(),
  unique (booking_id)
);
create index reviews_mentor_id_idx on public.reviews(mentor_id);
create index reviews_student_id_idx on public.reviews(student_id);

alter table public.reviews enable row level security;

-- Reviews are shown on public mentor profiles, same pattern as mentors/session_types.
create policy "Reviews are publicly readable" on public.reviews for select using (true);

-- A student may only review a booking of their own that's actually completed —
-- this is the enforcement for "can only review sessions they actually completed."
create policy "Student can review their own completed booking" on public.reviews
  for insert with check (
    auth.uid() = student_id
    and exists (select 1 from public.bookings b where b.id = booking_id and b.student_id = auth.uid() and b.status = 'completed')
  );
create policy "Student can edit their own review" on public.reviews
  for update using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Student can delete their own review" on public.reviews
  for delete using (auth.uid() = student_id);
create policy "Admins manage reviews" on public.reviews for all using (public.is_admin()) with check (public.is_admin());
