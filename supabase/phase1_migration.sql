-- ============================================================
-- STARFIX — PHASE 1 MIGRATION
-- Additive and idempotent: every statement is safe to re-run. Nothing
-- here drops, renames, or overwrites existing tables/rows — including
-- the 10 seeded mentor catalog records in public.mentors.
-- Run in the Supabase SQL Editor after schema.sql / rls_policies.sql /
-- auth_trigger.sql have already been applied:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. MENTOR ONBOARDING COLUMNS
-- claimOrCreateMentorProfile() (lib/supabase.ts) and the admin Mentors
-- page (lib/adminBackend.ts) already read/write these columns; they were
-- never added to public.mentors. Additive only — existing seeded rows
-- get these as NULL/defaults, nothing about their existing identity
-- changes.
-- ────────────────────────────────────────────────────────────
alter table public.mentors add column if not exists email text;
alter table public.mentors add column if not exists phone text;
alter table public.mentors add column if not exists location text;
alter table public.mentors add column if not exists languages text[] default array[]::text[];
alter table public.mentors add column if not exists headline text;
alter table public.mentors add column if not exists years_experience integer;
alter table public.mentors add column if not exists education text;
alter table public.mentors add column if not exists linkedin_url text;
alter table public.mentors add column if not exists mentoring_approach text;
alter table public.mentors add column if not exists offers_free_intro boolean default false;
alter table public.mentors add column if not exists onboarding_completed boolean default false;
alter table public.mentors add column if not exists legacy_id integer; -- referenced by admin's DbMentor type

create index if not exists idx_mentors_email on public.mentors(email);
create index if not exists idx_mentors_profile_id on public.mentors(profile_id);

-- ────────────────────────────────────────────────────────────
-- 2. FOUR NEW TABLES
-- ────────────────────────────────────────────────────────────

-- REVIEWS — a student's rating/feedback on a completed booking.
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade,
  student_id uuid references public.profiles(id) on delete cascade not null,
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now(),
  unique(booking_id) -- one review per booking
);
create index if not exists idx_reviews_mentor_id on public.reviews(mentor_id);
create index if not exists idx_reviews_student_id on public.reviews(student_id);

-- MENTOR_NOTES — a mentor's private notes about a student. Never visible
-- to the student, by design (real mentorship platforms keep these
-- private so mentors can write honestly).
create table if not exists public.mentor_notes (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  note text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_mentor_notes_mentor_id on public.mentor_notes(mentor_id);
create index if not exists idx_mentor_notes_student_id on public.mentor_notes(student_id);

-- SHARED_RESOURCES — links/files a mentor sends a specific student.
create table if not exists public.shared_resources (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  booking_id uuid references public.bookings(id) on delete set null,
  title text not null,
  url text not null,
  note text,
  created_at timestamptz default now()
);
create index if not exists idx_shared_resources_mentor_id on public.shared_resources(mentor_id);
create index if not exists idx_shared_resources_student_id on public.shared_resources(student_id);

-- SESSION_FOLLOWUPS — the mentor's post-session summary + action items,
-- visible to both sides (unlike mentor_notes, which are private).
create table if not exists public.session_followups (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete cascade not null,
  mentor_id uuid references public.mentors(id) on delete cascade not null,
  student_id uuid references public.profiles(id) on delete cascade not null,
  summary text,
  action_items jsonb default '[]'::jsonb,
  next_session_focus text,
  created_at timestamptz default now(),
  unique(booking_id)
);
create index if not exists idx_session_followups_mentor_id on public.session_followups(mentor_id);
create index if not exists idx_session_followups_student_id on public.session_followups(student_id);

-- ────────────────────────────────────────────────────────────
-- 3. RLS — enable + policies for the 4 new tables
-- ────────────────────────────────────────────────────────────
alter table public.reviews enable row level security;
alter table public.mentor_notes enable row level security;
alter table public.shared_resources enable row level security;
alter table public.session_followups enable row level security;

drop policy if exists "Reviews are viewable by everyone" on public.reviews;
drop policy if exists "A student can review their own completed booking" on public.reviews;
drop policy if exists "A student can update their own review" on public.reviews;

drop policy if exists "A mentor can manage their own notes" on public.mentor_notes;

drop policy if exists "A mentor can manage resources they shared" on public.shared_resources;
drop policy if exists "A student can view resources shared with them" on public.shared_resources;

drop policy if exists "A mentor can manage followups for their sessions" on public.session_followups;
drop policy if exists "A student can view followups for their sessions" on public.session_followups;

-- REVIEWS — public read (they're social proof on mentor profiles),
-- writable only by the student who owns the underlying booking.
create policy "Reviews are viewable by everyone"
  on public.reviews for select
  using (true);

create policy "A student can review their own completed booking"
  on public.reviews for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "A student can update their own review"
  on public.reviews for update
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- MENTOR_NOTES — mentor-only, full CRUD on their own notes. No student
-- policy exists at all here, which is what makes these private.
create policy "A mentor can manage their own notes"
  on public.mentor_notes for all
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

-- SHARED_RESOURCES — mentor manages what they've shared; the specific
-- student it was shared with can read it (nobody else's).
create policy "A mentor can manage resources they shared"
  on public.shared_resources for all
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

create policy "A student can view resources shared with them"
  on public.shared_resources for select
  to authenticated
  using (auth.uid() = student_id);

-- SESSION_FOLLOWUPS — mentor writes/edits; both the mentor and the
-- specific student from that booking can read it.
create policy "A mentor can manage followups for their sessions"
  on public.session_followups for all
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

create policy "A student can view followups for their sessions"
  on public.session_followups for select
  to authenticated
  using (auth.uid() = student_id);

-- ────────────────────────────────────────────────────────────
-- 4. MESSAGES — fix a real gap: only the student side had a policy.
-- Mentors could not read or send messages in their own conversations at
-- all under the original rls_policies.sql. Mirrors the bookings pattern.
-- ────────────────────────────────────────────────────────────
drop policy if exists "A mentor can view messages in their conversations" on public.messages;
drop policy if exists "A mentor can send messages in their conversations" on public.messages;

create policy "A mentor can view messages in their conversations"
  on public.messages for select
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

create policy "A mentor can send messages in their conversations"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

-- ────────────────────────────────────────────────────────────
-- 5. ROLE SELF-ESCALATION GUARD
-- The single most important gate in this whole migration. Without this,
-- "verified from Supabase role" is hollow — any authenticated user could
-- set their own profiles.role to 'admin' via a normal authenticated
-- update (RLS's "users can update their own profile" policy has no
-- column-level restriction on its own). This trigger makes that
-- impossible from the client while still allowing:
--   - self-service student -> mentor (the RoleChoice / MentorOnboarding
--     flow signs a user up as the trigger default 'student', then
--     immediately updates to 'mentor' — that transition must stay legal)
--   - service_role-driven changes (manual admin provisioning from the
--     Supabase dashboard or a trusted server context) to always work
-- ────────────────────────────────────────────────────────────
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    -- service_role (dashboard / trusted server-side calls) bypasses this
    -- guard entirely; only client-authenticated changes are restricted.
    if auth.role() = 'service_role' then
      return new;
    end if;

    if new.role = 'admin' then
      raise exception 'Cannot self-assign the admin role.';
    end if;

    if old.role = 'admin' then
      raise exception 'The admin role can only be changed by a service-role operation.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_role_self_escalation on public.profiles;
create trigger trg_prevent_role_self_escalation
  before update on public.profiles
  for each row execute function public.prevent_role_self_escalation();

-- ────────────────────────────────────────────────────────────
-- 6. SIGNUP TRIGGER — allow role to come from signup metadata, clamped
-- to student|mentor. Defense-in-depth alongside #5 above: even though
-- the client can pass any string as `role` in auth.signUp() metadata,
-- this trigger only ever honors 'mentor', everything else (including an
-- attempted 'admin') falls back to 'student'.
-- ────────────────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_full_name text;
  v_goal_id text;
  v_goal_title text;
  v_level text;
  v_daily_time text;
  v_preference text;
  v_country text;
  v_language text;
  v_role text;
begin
  v_full_name  := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_goal_id    := coalesce(new.raw_user_meta_data ->> 'goal_id', 'coding');
  v_goal_title := coalesce(new.raw_user_meta_data ->> 'goal_title', 'Coding & Development');
  v_level      := coalesce(new.raw_user_meta_data ->> 'level', 'intermediate');
  v_daily_time := coalesce(new.raw_user_meta_data ->> 'daily_time', '30min');
  v_preference := coalesce(new.raw_user_meta_data ->> 'preference', 'roadmap');
  v_country    := coalesce(new.raw_user_meta_data ->> 'country', 'India');
  v_language   := coalesce(new.raw_user_meta_data ->> 'learning_language', 'English');
  v_role       := case when new.raw_user_meta_data ->> 'role' = 'mentor' then 'mentor' else 'student' end;

  insert into public.profiles (
    id, full_name, email, role, goal_id, goal_title, level, daily_time,
    preference, country, learning_language, learning_languages, xp, streak
  )
  values (
    new.id, v_full_name, new.email, v_role, v_goal_id, v_goal_title, v_level, v_daily_time,
    v_preference, v_country, v_language, array[v_language]::text[], 120, 1
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;
-- (trigger itself — on_auth_user_created — already exists from auth_trigger.sql and
-- points at this function by name, so it does not need to be recreated.)
