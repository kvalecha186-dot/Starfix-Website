
create table if not exists public.mentor_goals (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mentor_feedback (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  focus text not null default 'General',
  content text not null,
  rating integer check (rating between 1 and 5),
  created_at timestamptz not null default now()
);

create table if not exists public.mentor_earnings (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  gross_amount numeric not null default 0,
  platform_fee numeric not null default 0,
  net_amount numeric not null default 0,
  currency text not null default 'INR',
  status text not null default 'pending' check (status in ('pending','paid','refunded')),
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create unique index if not exists mentor_earnings_booking_uidx on public.mentor_earnings(booking_id) where booking_id is not null;
create unique index if not exists mentor_goals_active_uidx on public.mentor_goals(mentor_id, student_id, title);
create index if not exists mentor_goals_mentor_student_idx on public.mentor_goals(mentor_id, student_id);
create index if not exists mentor_feedback_mentor_student_idx on public.mentor_feedback(mentor_id, student_id, created_at desc);
create index if not exists mentor_earnings_mentor_status_idx on public.mentor_earnings(mentor_id, status, created_at desc);
create unique index if not exists conversations_student_mentor_uidx on public.conversations(student_id, mentor_id);

alter table public.mentor_goals enable row level security;
alter table public.mentor_feedback enable row level security;
alter table public.mentor_earnings enable row level security;

drop policy if exists "Mentor manages own goals" on public.mentor_goals;
create policy "Mentor manages own goals" on public.mentor_goals for all to authenticated
using (
  exists (select 1 from public.mentors m where m.id = mentor_goals.mentor_id and m.profile_id = auth.uid())
  or is_admin()
)
with check (
  exists (select 1 from public.mentors m where m.id = mentor_goals.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);

drop policy if exists "Student views assigned goals" on public.mentor_goals;
create policy "Student views assigned goals" on public.mentor_goals for select to authenticated
using (student_id = auth.uid() or is_admin());

drop policy if exists "Mentor manages own feedback" on public.mentor_feedback;
create policy "Mentor manages own feedback" on public.mentor_feedback for all to authenticated
using (
  exists (select 1 from public.mentors m where m.id = mentor_feedback.mentor_id and m.profile_id = auth.uid())
  or is_admin()
)
with check (
  exists (select 1 from public.mentors m where m.id = mentor_feedback.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);

drop policy if exists "Student views mentor feedback" on public.mentor_feedback;
create policy "Student views mentor feedback" on public.mentor_feedback for select to authenticated
using (student_id = auth.uid() or is_admin());

drop policy if exists "Mentor views own earnings" on public.mentor_earnings;
create policy "Mentor views own earnings" on public.mentor_earnings for select to authenticated
using (
  exists (select 1 from public.mentors m where m.id = mentor_earnings.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);

drop policy if exists "Admins manage earnings" on public.mentor_earnings;
create policy "Admins manage earnings" on public.mentor_earnings for all to authenticated
using (is_admin()) with check (is_admin());

-- Tighten previously-created sensitive policies from public to authenticated.
do $$
declare r record;
begin
  for r in
    select tablename, policyname
    from pg_policies
    where schemaname='public'
      and tablename in ('mentor_notes','shared_resources','session_followups','reviews')
      and 'public' = any(roles)
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

create policy "Mentor manages own notes" on public.mentor_notes for all to authenticated
using (
  exists (select 1 from public.mentors m where m.id = mentor_notes.mentor_id and m.profile_id = auth.uid())
  or is_admin()
)
with check (
  exists (select 1 from public.mentors m where m.id = mentor_notes.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);
create policy "Student views shared notes" on public.mentor_notes for select to authenticated
using (student_id = auth.uid() or is_admin());

create policy "Mentor manages shared resources" on public.shared_resources for all to authenticated
using (
  exists (select 1 from public.mentors m where m.id = shared_resources.mentor_id and m.profile_id = auth.uid())
  or is_admin()
)
with check (
  exists (select 1 from public.mentors m where m.id = shared_resources.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);
create policy "Student views shared resources" on public.shared_resources for select to authenticated
using (student_id = auth.uid() or is_admin());

create policy "Mentor manages followups" on public.session_followups for all to authenticated
using (
  exists (select 1 from public.mentors m where m.id = session_followups.mentor_id and m.profile_id = auth.uid())
  or is_admin()
)
with check (
  exists (select 1 from public.mentors m where m.id = session_followups.mentor_id and m.profile_id = auth.uid())
  or is_admin()
);
create policy "Student views followups" on public.session_followups for select to authenticated
using (student_id = auth.uid() or is_admin());

create policy "Reviews are readable" on public.reviews for select to authenticated
using (true);
create policy "Student manages own review" on public.reviews for insert to authenticated
with check (
  auth.uid() = student_id
  and exists (select 1 from public.bookings b where b.id = reviews.booking_id and b.student_id = auth.uid() and b.status = 'completed')
);
create policy "Student updates own review" on public.reviews for update to authenticated
using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "Student deletes own review" on public.reviews for delete to authenticated
using (auth.uid() = student_id);
create policy "Admins manage reviews" on public.reviews for all to authenticated
using (is_admin()) with check (is_admin());

-- Make message sender identity unambiguous for real two-way chat.
drop policy if exists "Authenticated participants send messages" on public.messages;
create policy "Authenticated participants send messages" on public.messages for insert to authenticated
with check (
  sender = auth.uid()::text
  and exists (
    select 1 from public.conversations c
    where c.id = messages.conversation_id
      and (
        c.student_id = auth.uid()
        or exists (select 1 from public.mentors m where m.id = c.mentor_id and m.profile_id = auth.uid())
        or is_admin()
      )
  )
);

-- Realtime for actual mentor/student chat.
alter table public.messages replica identity full;

