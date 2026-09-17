-- ============================================================
-- STARFIX DATABASE — ROW LEVEL SECURITY (RLS) POLICIES
-- Run this in the Supabase SQL Editor after running schema.sql:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.growth_paths enable row level security;
alter table public.milestones enable row level security;
alter table public.mentors enable row level security;
alter table public.bookings enable row level security;
alter table public.path_enrollments enable row level security;
alter table public.xp_transactions enable row level security;
alter table public.notifications enable row level security;
alter table public.messages enable row level security;
alter table public.watch_queue enable row level security;
alter table public.resources enable row level security;

-- Drop existing policies if any to prevent duplicate policy errors
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "Growth paths are viewable by everyone" on public.growth_paths;
drop policy if exists "Milestones are viewable by everyone" on public.milestones;
drop policy if exists "Mentors are viewable by everyone" on public.mentors;
drop policy if exists "Resources are viewable by everyone" on public.resources;

drop policy if exists "A student can view their own bookings" on public.bookings;
drop policy if exists "A mentor can view bookings made with them" on public.bookings;
drop policy if exists "A student can create their own bookings" on public.bookings;
drop policy if exists "A student can update their own bookings" on public.bookings;
drop policy if exists "A mentor can update bookings made with them" on public.bookings;

drop policy if exists "Users can view their own enrollments" on public.path_enrollments;
drop policy if exists "Users can insert their own enrollments" on public.path_enrollments;
drop policy if exists "Users can update their own enrollments" on public.path_enrollments;

drop policy if exists "Users can view their own XP history" on public.xp_transactions;
drop policy if exists "Users can insert their own XP transactions" on public.xp_transactions;

drop policy if exists "Users can view their own notifications" on public.notifications;
drop policy if exists "Users can insert their own notifications" on public.notifications;
drop policy if exists "Users can update their own notifications" on public.notifications;

drop policy if exists "Users can view their messages" on public.messages;
drop policy if exists "Users can insert their messages" on public.messages;

drop policy if exists "Users can manage their watch queue" on public.watch_queue;

-- ============================================
-- 1. PROFILES
-- Anyone can view public profiles (needed for mentor avatars, peer interaction).
-- Users can only insert or update their own row.
-- ============================================
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================
-- 2. GROWTH PATHS & MILESTONES & RESOURCES
-- Publicly readable by all users and prospective students.
-- ============================================
create policy "Growth paths are viewable by everyone"
  on public.growth_paths for select
  using (true);

create policy "Milestones are viewable by everyone"
  on public.milestones for select
  using (true);

create policy "Resources are viewable by everyone"
  on public.resources for select
  using (true);

-- ============================================
-- 3. MENTORS
-- Mentor listings and profiles are public so students can explore them.
-- ============================================
create policy "Mentors are viewable by everyone"
  on public.mentors for select
  using (true);

create policy "Mentors can update their own profile"
  on public.mentors for update
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ============================================
-- 4. BOOKINGS
-- Visible to the student who booked it and the mentor.
-- ============================================
create policy "A student can view their own bookings"
  on public.bookings for select
  to authenticated
  using (auth.uid() = student_id);

create policy "A mentor can view bookings made with them"
  on public.bookings for select
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

create policy "A student can create their own bookings"
  on public.bookings for insert
  to authenticated
  with check (auth.uid() = student_id);

create policy "A student can update their own bookings"
  on public.bookings for update
  to authenticated
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

create policy "A mentor can update bookings made with them"
  on public.bookings for update
  to authenticated
  using (auth.uid() = (select profile_id from public.mentors where id = mentor_id))
  with check (auth.uid() = (select profile_id from public.mentors where id = mentor_id));

-- ============================================
-- 5. PATH ENROLLMENTS
-- User's personalized progress on any Growth Path.
-- ============================================
create policy "Users can view their own enrollments"
  on public.path_enrollments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own enrollments"
  on public.path_enrollments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own enrollments"
  on public.path_enrollments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- 6. XP TRANSACTIONS
-- ============================================
create policy "Users can view their own XP history"
  on public.xp_transactions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own XP transactions"
  on public.xp_transactions for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ============================================
-- 7. NOTIFICATIONS
-- ============================================
create policy "Users can view their own notifications"
  on public.notifications for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own notifications"
  on public.notifications for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own notifications"
  on public.notifications for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================
-- 8. MESSAGES
-- Learner-to-mentor messaging thread.
-- ============================================
create policy "Users can view their messages"
  on public.messages for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their messages"
  on public.messages for insert
  to authenticated
  with check (auth.uid() = user_id);

-- ============================================
-- 9. WATCH QUEUE
-- ============================================
create policy "Users can manage their watch queue"
  on public.watch_queue for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
