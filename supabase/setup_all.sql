-- ============================================================
-- STARFIX COMPLETE DATABASE SETUP SCRIPT (ALL-IN-ONE)
-- Paste and run this ONE script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql/new
-- ============================================================

-- ============================================================
-- STARFIX DATABASE SCHEMA (COMPATIBLE WITH UUID PRIMARY KEYS)
-- Fully idempotent: safe to run repeatedly on your Supabase project.
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  email text,
  role text default 'student',
  avatar_url text,
  bio text,
  country text default 'India',
  learning_language text default 'English',
  learning_languages text[] default array['English']::text[],
  learning_style text default 'practice-first',
  career_goal text,
  goal_id text default 'coding',
  goal_title text default 'Coding & Development',
  level text default 'intermediate',
  daily_time text default '30min',
  preference text default 'roadmap',
  obstacle text,
  xp integer default 0,
  streak integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists role text default 'student';
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists country text default 'India';
alter table public.profiles add column if not exists learning_language text default 'English';
alter table public.profiles add column if not exists learning_languages text[] default array['English']::text[];
alter table public.profiles add column if not exists learning_style text default 'practice-first';
alter table public.profiles add column if not exists career_goal text;
alter table public.profiles add column if not exists goal_id text default 'coding';
alter table public.profiles add column if not exists goal_title text default 'Coding & Development';
alter table public.profiles add column if not exists level text default 'intermediate';
alter table public.profiles add column if not exists daily_time text default '30min';
alter table public.profiles add column if not exists preference text default 'roadmap';
alter table public.profiles add column if not exists obstacle text;
alter table public.profiles add column if not exists xp integer default 0;
alter table public.profiles add column if not exists streak integer default 0;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 2. GROWTH PATHS
create table if not exists public.growth_paths (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  category text not null,
  description text,
  timeline text default '3–6 months',
  level text default 'All Levels',
  color text default '#6366F1',
  milestones_count integer default 5,
  created_at timestamptz default now()
);

alter table public.growth_paths add column if not exists slug text;
alter table public.growth_paths add column if not exists title text;
alter table public.growth_paths add column if not exists category text;
alter table public.growth_paths add column if not exists description text;
alter table public.growth_paths add column if not exists timeline text default '3–6 months';
alter table public.growth_paths add column if not exists level text default 'All Levels';
alter table public.growth_paths add column if not exists color text default '#6366F1';
alter table public.growth_paths add column if not exists milestones_count integer default 5;
alter table public.growth_paths add column if not exists created_at timestamptz default now();

-- 3. MILESTONES
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  path_id uuid references public.growth_paths(id) on delete cascade,
  title text not null,
  description text,
  order_index integer default 0,
  xp_reward integer default 50,
  resources jsonb default '[]'::jsonb,
  created_at timestamptz default now()
);

alter table public.milestones add column if not exists path_id uuid references public.growth_paths(id) on delete cascade;
alter table public.milestones add column if not exists title text;
alter table public.milestones add column if not exists description text;
alter table public.milestones add column if not exists order_index integer default 0;
alter table public.milestones add column if not exists xp_reward integer default 50;
alter table public.milestones add column if not exists resources jsonb default '[]'::jsonb;
alter table public.milestones add column if not exists created_at timestamptz default now();

-- 4. MENTORS
create table if not exists public.mentors (
  id uuid primary key default gen_random_uuid(),
  mentor_num integer,
  profile_id uuid references public.profiles(id) on delete set null,
  name text not null,
  initials text,
  color text default '#6366F1',
  title text not null,
  company text not null,
  category text not null,
  rating numeric default 5.0,
  students_count integer default 0,
  price text default '₹2,500/hr',
  free boolean default false,
  availability text default 'Today',
  skills text[] default array[]::text[],
  bio text,
  about text,
  experience text,
  location text default 'Remote',
  response_time text default 'Within 2 hours',
  stats jsonb default '{}'::jsonb,
  pricing jsonb default '[]'::jsonb,
  availability_slots jsonb default '[]'::jsonb,
  roadmap jsonb default '[]'::jsonb,
  reviews jsonb default '[]'::jsonb,
  faq jsonb default '[]'::jsonb,
  related_paths text[] default array[]::text[],
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.mentors add column if not exists mentor_num integer;
alter table public.mentors add column if not exists profile_id uuid;
alter table public.mentors add column if not exists name text;
alter table public.mentors add column if not exists initials text;
alter table public.mentors add column if not exists color text default '#6366F1';
alter table public.mentors add column if not exists title text;
alter table public.mentors add column if not exists company text;
alter table public.mentors add column if not exists category text;
alter table public.mentors add column if not exists rating numeric default 5.0;
alter table public.mentors add column if not exists students_count integer default 0;
alter table public.mentors add column if not exists price text default '₹2,500/hr';
alter table public.mentors add column if not exists free boolean default false;
alter table public.mentors add column if not exists availability text default 'Today';
alter table public.mentors add column if not exists skills text[] default array[]::text[];
alter table public.mentors add column if not exists bio text;
alter table public.mentors add column if not exists about text;
alter table public.mentors add column if not exists experience text;
alter table public.mentors add column if not exists location text default 'Remote';
alter table public.mentors add column if not exists response_time text default 'Within 2 hours';
alter table public.mentors add column if not exists stats jsonb default '{}'::jsonb;
alter table public.mentors add column if not exists pricing jsonb default '[]'::jsonb;
alter table public.mentors add column if not exists availability_slots jsonb default '[]'::jsonb;
alter table public.mentors add column if not exists roadmap jsonb default '[]'::jsonb;
alter table public.mentors add column if not exists reviews jsonb default '[]'::jsonb;
alter table public.mentors add column if not exists faq jsonb default '[]'::jsonb;
alter table public.mentors add column if not exists related_paths text[] default array[]::text[];
alter table public.mentors add column if not exists avatar_url text;
alter table public.mentors add column if not exists created_at timestamptz default now();

-- 5. BOOKINGS
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.profiles(id) on delete cascade,
  mentor_id uuid references public.mentors(id) on delete cascade,
  mentor_num integer,
  mentor_name text,
  mentor_title text,
  mentor_company text,
  mentor_color text,
  mentor_initials text,
  session_type text default '1:1 Mentorship Session',
  duration text default '45 min',
  price text default 'Free',
  booking_date text not null,
  booking_time text not null,
  status text default 'Booked',
  notes text,
  meet_link text default 'https://meet.google.com/starfix-session',
  created_at timestamptz default now()
);

alter table public.bookings add column if not exists student_id uuid;
alter table public.bookings add column if not exists mentor_id uuid;
alter table public.bookings add column if not exists mentor_num integer;
alter table public.bookings add column if not exists mentor_name text;
alter table public.bookings add column if not exists mentor_title text;
alter table public.bookings add column if not exists mentor_company text;
alter table public.bookings add column if not exists mentor_color text;
alter table public.bookings add column if not exists mentor_initials text;
alter table public.bookings add column if not exists session_type text default '1:1 Mentorship Session';
alter table public.bookings add column if not exists duration text default '45 min';
alter table public.bookings add column if not exists price text default 'Free';
alter table public.bookings add column if not exists booking_date text;
alter table public.bookings add column if not exists booking_time text;
alter table public.bookings add column if not exists status text default 'Booked';
alter table public.bookings add column if not exists notes text;
alter table public.bookings add column if not exists meet_link text default 'https://meet.google.com/starfix-session';
alter table public.bookings add column if not exists created_at timestamptz default now();

-- 6. PATH ENROLLMENTS
create table if not exists public.path_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  path_id uuid references public.growth_paths(id) on delete cascade,
  path_slug text not null,
  mentor_id uuid references public.mentors(id) on delete set null,
  mentor_num integer,
  session_slot text,
  session_at timestamptz,
  session_duration_min integer default 45,
  session_joined boolean default false,
  focus text[] default array[]::text[],
  level text default 'intermediate',
  weekly_time text default '30min',
  week_index integer default 0,
  tasks jsonb default '[]'::jsonb,
  challenge jsonb default '{"label":"Complete week checkpoint","done":false}'::jsonb,
  video_stage text default 'start',
  video_progress jsonb default '{"pct":0,"elapsedMin":0,"totalMin":20}'::jsonb,
  milestone_video_watched boolean default false,
  notes text default '',
  xp integer default 0,
  streak integer default 0,
  started_at timestamptz default now(),
  last_active_at timestamptz default now(),
  completed_at timestamptz,
  created_at timestamptz default now(),
  unique(user_id, path_slug)
);

-- 7. XP TRANSACTIONS
create table if not exists public.xp_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  amount integer not null,
  reason text not null,
  category text default 'mission',
  task_key text,
  settled boolean default true,
  created_at timestamptz default now()
);

alter table public.xp_transactions add column if not exists user_id uuid;
alter table public.xp_transactions add column if not exists amount integer;
alter table public.xp_transactions add column if not exists reason text;
alter table public.xp_transactions add column if not exists category text default 'mission';
alter table public.xp_transactions add column if not exists task_key text;
alter table public.xp_transactions add column if not exists settled boolean default true;
alter table public.xp_transactions add column if not exists created_at timestamptz default now();

-- 8. NOTIFICATIONS
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  type text not null,
  category text default 'progress',
  read boolean default false,
  dismissed boolean default false,
  path_id text,
  link text,
  created_at timestamptz default now()
);

alter table public.notifications add column if not exists user_id uuid;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists type text;
alter table public.notifications add column if not exists category text default 'progress';
alter table public.notifications add column if not exists read boolean default false;
alter table public.notifications add column if not exists dismissed boolean default false;
alter table public.notifications add column if not exists path_id text;
alter table public.notifications add column if not exists link text;
alter table public.notifications add column if not exists created_at timestamptz default now();

-- 9. MESSAGES
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  user_id uuid references public.profiles(id) on delete cascade,
  mentor_id uuid references public.mentors(id) on delete set null,
  mentor_num integer,
  sender_type text check (sender_type in ('user', 'mentor')),
  text text not null,
  status text default 'sent',
  created_at timestamptz default now()
);

alter table public.messages add column if not exists conversation_id text;
alter table public.messages add column if not exists user_id uuid;
alter table public.messages add column if not exists mentor_id uuid;
alter table public.messages add column if not exists mentor_num integer;
alter table public.messages add column if not exists sender_type text;
alter table public.messages add column if not exists text text;
alter table public.messages add column if not exists status text default 'sent';
alter table public.messages add column if not exists created_at timestamptz default now();

-- 10. WATCH QUEUE
create table if not exists public.watch_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel text,
  thumbnail text,
  duration text,
  path_id uuid references public.growth_paths(id) on delete set null,
  progress_pct integer default 0,
  completed boolean default false,
  created_at timestamptz default now()
);

alter table public.watch_queue add column if not exists user_id uuid;
alter table public.watch_queue add column if not exists video_id text;
alter table public.watch_queue add column if not exists title text;
alter table public.watch_queue add column if not exists channel text;
alter table public.watch_queue add column if not exists thumbnail text;
alter table public.watch_queue add column if not exists duration text;
alter table public.watch_queue add column if not exists path_id uuid;
alter table public.watch_queue add column if not exists progress_pct integer default 0;
alter table public.watch_queue add column if not exists completed boolean default false;
alter table public.watch_queue add column if not exists created_at timestamptz default now();

-- 11. RESOURCES
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid references public.milestones(id) on delete cascade,
  path_id uuid references public.growth_paths(id) on delete cascade,
  title text not null,
  url text not null,
  category text,
  created_at timestamptz default now()
);

alter table public.resources add column if not exists milestone_id uuid;
alter table public.resources add column if not exists path_id uuid;
alter table public.resources add column if not exists title text;
alter table public.resources add column if not exists url text;
alter table public.resources add column if not exists category text;
alter table public.resources add column if not exists created_at timestamptz default now();

-- Create Indexes
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_mentors_category on public.mentors(category);
create index if not exists idx_mentors_mentor_num on public.mentors(mentor_num);
create index if not exists idx_bookings_student_id on public.bookings(student_id);
create index if not exists idx_bookings_mentor_id on public.bookings(mentor_id);
create index if not exists idx_path_enrollments_user_id on public.path_enrollments(user_id);
create index if not exists idx_xp_transactions_user_id on public.xp_transactions(user_id);
create index if not exists idx_notifications_user_id on public.notifications(user_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id);
create index if not exists idx_messages_user on public.messages(user_id);
create index if not exists idx_watch_queue_user on public.watch_queue(user_id);


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


-- ============================================================
-- STARFIX DATABASE — AUTO-CREATE PROFILE ON SIGNUP TRIGGER
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

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
begin
  -- Extract metadata supplied during signup / onboarding
  v_full_name  := coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  v_goal_id    := coalesce(new.raw_user_meta_data ->> 'goal_id', 'coding');
  v_goal_title := coalesce(new.raw_user_meta_data ->> 'goal_title', 'Coding & Development');
  v_level      := coalesce(new.raw_user_meta_data ->> 'level', 'intermediate');
  v_daily_time := coalesce(new.raw_user_meta_data ->> 'daily_time', '30min');
  v_preference := coalesce(new.raw_user_meta_data ->> 'preference', 'roadmap');
  v_country    := coalesce(new.raw_user_meta_data ->> 'country', 'India');
  v_language   := coalesce(new.raw_user_meta_data ->> 'learning_language', 'English');

  insert into public.profiles (
    id,
    full_name,
    email,
    role,
    goal_id,
    goal_title,
    level,
    daily_time,
    preference,
    country,
    learning_language,
    learning_languages,
    xp,
    streak
  )
  values (
    new.id,
    v_full_name,
    new.email,
    'student',
    v_goal_id,
    v_goal_title,
    v_level,
    v_daily_time,
    v_preference,
    v_country,
    v_language,
    array[v_language]::text[],
    120, -- Welcome bonus XP
    1    -- Initial day streak
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    updated_at = now();

  return new;
end;
$$;

-- Drop trigger if already exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- STARFIX DATABASE SEED DATA (COMPATIBLE WITH UUID PRIMARY KEYS)
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql
-- ============================================================

-- 1. SEED GROWTH PATHS
insert into public.growth_paths (id, slug, title, category, description, timeline, level, color, milestones_count)
values
  ('c0000000-0000-0000-0000-000000000001'::uuid, 'coding', 'Coding & Development', 'Career & Tech', 'Become a software developer from beginner to advanced with full-stack mastery.', '3–6 months', 'All Levels', '#6366F1', 5),
  ('c0000000-0000-0000-0000-000000000002'::uuid, 'ai-ml', 'AI & Machine Learning', 'Career & Tech', 'Learn to build and train intelligent machine learning models from scratch.', '4–8 months', 'Intermediate', '#8B5CF6', 5),
  ('c0000000-0000-0000-0000-000000000003'::uuid, 'uiux', 'UI/UX Design', 'Career & Tech', 'Design digital products people genuinely love to use.', '3–5 months', 'All Levels', '#EC4899', 5),
  ('c0000000-0000-0000-0000-000000000004'::uuid, 'finance', 'Finance & Investing', 'Career & Tech', 'Understand money, markets, and long-term portfolio building deeply.', '4–6 months', 'Beginner', '#059669', 5),
  ('c0000000-0000-0000-0000-000000000005'::uuid, 'communication', 'Communication & Leadership', 'Mindset', 'Speak with clarity, unshakeable confidence, and executive presence.', '2–4 months', 'All Levels', '#F59E0B', 5),
  ('c0000000-0000-0000-0000-000000000006'::uuid, 'entrepreneurship', 'Entrepreneurship & Startups', 'Career & Tech', 'Turn your idea into a venture-backed or bootstrapped real business.', 'Ongoing', 'All Levels', '#D97706', 5),
  ('c0000000-0000-0000-0000-000000000007'::uuid, 'meditation', 'Meditation & Mindfulness', 'Mindset', 'Build a calm, focused mind through daily meditation and breathwork.', '1–3 months', 'All Levels', '#8B5CF6', 5),
  ('c0000000-0000-0000-0000-000000000008'::uuid, 'fitness', 'Strength & Physical Longevity', 'Health & Fitness', 'Build strength, optimize nutrition, and develop sustainable physical habits.', '3–6 months', 'All Levels', '#EF4444', 5)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  category = excluded.category,
  description = excluded.description,
  timeline = excluded.timeline,
  color = excluded.color;

-- 2. SEED MILESTONES
insert into public.milestones (id, path_id, title, description, order_index, xp_reward)
values
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Python & Web Fundamentals', 'Core syntax, control flow, functions, and web basics', 1, 50),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Frontend & React Mastery', 'Component architectures, state management, modern CSS', 2, 75),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Backend APIs & Databases', 'RESTful services, PostgreSQL, auth, and schema design', 3, 100),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'System Design & Scalability', 'Caching, queues, microservices, and load balancing', 4, 125),
  ('d0000000-0000-0000-0000-000000000005'::uuid, 'c0000000-0000-0000-0000-000000000001'::uuid, 'Full-Stack Capstone Project', 'End-to-end production application deployment', 5, 200),

  ('d0000000-0000-0000-0000-000000000006'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Linear Algebra & Calculus for ML', 'Mathematical foundations behind gradient descent', 1, 50),
  ('d0000000-0000-0000-0000-000000000007'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'PyTorch Fundamentals', 'Tensors, autograd, and building basic networks', 2, 75),
  ('d0000000-0000-0000-0000-000000000008'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Computer Vision & CNNs', 'Convolutional layers, feature extraction, transfer learning', 3, 100),
  ('d0000000-0000-0000-0000-000000000009'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'NLP & Transformers', 'Attention mechanisms, tokenization, and LLM fine-tuning', 4, 125),
  ('d0000000-0000-0000-0000-000000000010'::uuid, 'c0000000-0000-0000-0000-000000000002'::uuid, 'Model Deployment & MLOps', 'Serving models with ONNX, FastAPI, and Docker', 5, 200),

  ('d0000000-0000-0000-0000-000000000011'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Design Systems & Figma Basics', 'Typography, color palettes, auto-layout, and components', 1, 50),
  ('d0000000-0000-0000-0000-000000000012'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Wireframing & Prototyping', 'Interactive prototypes and user journeys', 2, 75),
  ('d0000000-0000-0000-0000-000000000013'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'User Research & Testing', 'Usability testing, interviewing, and analytics synthesis', 3, 100),
  ('d0000000-0000-0000-0000-000000000014'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Mobile & Web Interaction Design', 'Micro-interactions, animations, and accessibility', 4, 125),
  ('d0000000-0000-0000-0000-000000000015'::uuid, 'c0000000-0000-0000-0000-000000000003'::uuid, 'Portfolio Case Study Launch', 'Comprehensive product case study for top design roles', 5, 200)
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  xp_reward = excluded.xp_reward;

-- 3. SEED MENTORS
insert into public.mentors (
  id, mentor_num, name, initials, color, title, company, category, rating, students_count,
  price, free, availability, skills, bio, about, location, response_time,
  pricing, availability_slots
)
values
  (
    '00000000-0000-0000-0000-000000000001'::uuid, 1, 'Aria Chen', 'AC', '#6366F1', 'Senior ML Engineer', 'Google', 'AI/ML', 4.9, 1240,
    '₹2,500/hr', false, 'Today',
    array['PyTorch', 'NLP', 'Computer Vision']::text[],
    'Aria spent six years building recommendation systems at Google before turning to teaching full-time.',
    'Aria began as a backend engineer, drifted into machine learning through a fraud-detection project, and never looked back.',
    'San Francisco, CA (Remote)', 'Within 2 hours',
    '[{"label":"30 min Session","price":"₹1,299","sub":"Quick check-in or Q&A"},{"label":"60 min Session","price":"₹2,500","sub":"Full teaching session"}]'::jsonb,
    '[{"date":"Today","slots":["4:00 PM","6:30 PM"]},{"date":"Tomorrow","slots":["10:00 AM","2:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000002'::uuid, 2, 'Marcus Webb', 'MW', '#E85D75', 'Growth Coach', 'a16z Portfolio', 'Entrepreneurship', 4.8, 890,
    '₹3,200/hr', false, 'Tomorrow',
    array['Startup Strategy', 'Fundraising', 'GTM']::text[],
    'Ex-founder with 2 exits. Mentored 40+ founders across YC and Techstars cohorts.',
    'Marcus helps founders find true product-market fit, design scalable GTM strategies, and pitch top-tier venture funds.',
    'New York, NY (Remote)', 'Within 4 hours',
    '[{"label":"45 min Strategy","price":"₹3,200","sub":"Pitch deck & GTM teardown"},{"label":"Monthly Retainer","price":"₹12,000","sub":"Bi-weekly sessions + Slack"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["11:00 AM","3:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000003'::uuid, 3, 'Priya Sharma', 'PS', '#20B2AA', 'Lead UX Designer', 'Figma', 'UI/UX', 5.0, 2100,
    'Free', true, 'Today',
    array['Figma', 'Design Systems', 'User Research']::text[],
    'Design systems architect at Figma. Passionate about helping aspiring designers break into tech.',
    'Priya designs the foundational design system primitives used by millions of designers around the world.',
    'Bengaluru, India (Remote)', 'Within 1 hour',
    '[{"label":"30 min Portfolio Review","price":"Free","sub":"Community mentorship slot"},{"label":"60 min Deep Dive","price":"₹1,800","sub":"Comprehensive case study audit"}]'::jsonb,
    '[{"date":"Today","slots":["2:00 PM","5:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000004'::uuid, 4, 'Daniel Park', 'DP', '#F4A261', 'Certified Financial Planner', 'Fidelity', 'Finance', 4.7, 567,
    '₹1,800/hr', false, 'This week',
    array['Investing', 'Tax Planning', 'Budgeting']::text[],
    'Helps high earners and young professionals build institutional-grade personal portfolios.',
    'Daniel breaks down complex asset allocation, risk mitigation, and retirement planning into crystal clear steps.',
    'Chicago, IL (Remote)', 'Within 6 hours',
    '[{"label":"45 min Planning Session","price":"₹1,800","sub":"Personal finance audit"}]'::jsonb,
    '[{"date":"Thursday","slots":["10:00 AM","4:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000005'::uuid, 5, 'Sofia Torres', 'ST', '#A78BFA', 'Software Engineer', 'Stripe', 'Coding', 4.9, 1580,
    'Free', true, 'Today',
    array['Python', 'React', 'System Design']::text[],
    'Building developer platforms at Stripe. Mentored 150+ engineers into FAANG and unicorn startups.',
    'Sofia focuses on clean code craftsmanship, distributed architectures, and preparing engineers for senior technical interviews.',
    'London, UK (Remote)', 'Within 2 hours',
    '[{"label":"30 min Intro Call","price":"Free","sub":"Career trajectory review"},{"label":"60 min Mock Interview","price":"₹2,200","sub":"System design or coding live"}]'::jsonb,
    '[{"date":"Today","slots":["3:00 PM","7:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000006'::uuid, 6, 'Rahul Gupta', 'RG', '#34D399', 'IELTS Trainer', 'British Council', 'Languages', 4.8, 3400,
    '₹1,200/hr', false, 'Today',
    array['IELTS', 'TOEFL', 'Business English']::text[],
    'Certified master trainer with over 10 years experience helping students score 8+ bands in IELTS.',
    'Rahul provides high-impact feedback on speaking, writing, and professional executive communication.',
    'New Delhi, India (Remote)', 'Within 1 hour',
    '[{"label":"45 min Mock Speaking","price":"₹1,200","sub":"Score feedback & diagnostics"}]'::jsonb,
    '[{"date":"Today","slots":["11:00 AM","1:00 PM","6:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000007'::uuid, 7, 'Emma Walsh', 'EW', '#FB923C', 'Content Strategist', 'HubSpot', 'Content', 4.6, 720,
    '₹2,000/hr', false, 'Tomorrow',
    array['Instagram', 'YouTube', 'Brand Building']::text[],
    'Grew social channels to over 500K followers. Advises tech brands on storytelling.',
    'Emma teaches creators and professionals how to build sustainable personal media channels.',
    'Austin, TX (Remote)', 'Within 3 hours',
    '[{"label":"45 min Channel Audit","price":"₹2,000","sub":"Content positioning review"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["2:00 PM","4:30 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000008'::uuid, 8, 'Kenji Nakamura', 'KN', '#38BDF8', 'Communication Coach', 'TEDx Speaker', 'Communication', 4.9, 890,
    '₹2,800/hr', false, 'Today',
    array['Public Speaking', 'Storytelling', 'Confidence']::text[],
    '2x TEDx speaker and executive coach for C-suite leaders and keynote presenters.',
    'Kenji uses proven storytelling frameworks to help professionals command the room with authentic confidence.',
    'Tokyo / Remote', 'Within 2 hours',
    '[{"label":"45 min Pitch & Speech Coaching","price":"₹2,800","sub":"Live performance critique"}]'::jsonb,
    '[{"date":"Today","slots":["5:00 PM","8:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000009'::uuid, 9, 'Jake Morrison', 'JM', '#F87171', 'Certified Personal Trainer', 'Equinox', 'Fitness', 4.8, 1120,
    '₹1,500/hr', false, 'Today',
    array['Strength Training', 'Nutrition', 'Fat Loss']::text[],
    '12 years coaching busy professionals to build aesthetic, healthy, and durable bodies.',
    'Jake designs evidence-based training routines that fit into 45-minute daily windows without burnout.',
    'Los Angeles, CA (Remote)', 'Within 3 hours',
    '[{"label":"45 min Fitness Assessment","price":"₹1,500","sub":"Form audit & nutrition targets"}]'::jsonb,
    '[{"date":"Today","slots":["9:00 AM","6:00 PM"]}]'::jsonb
  ),
  (
    '00000000-0000-0000-0000-000000000010'::uuid, 10, 'Leela Anand', 'LA', '#14B8A6', 'Meditation & Mindfulness Coach', 'Headspace', 'Meditation', 4.9, 640,
    'Free', true, 'Tomorrow',
    array['Meditation', 'Stress Relief', 'Breathwork']::text[],
    'Former monastery practitioner and meditation instructor at leading tech campuses.',
    'Leela guides high performers through modern somatic breathwork and mindfulness for mental clarity.',
    'Remote / Global', 'Within 2 hours',
    '[{"label":"30 min Guided Session","price":"Free","sub":"Community breathwork practice"}]'::jsonb,
    '[{"date":"Tomorrow","slots":["7:00 AM","7:00 PM"]}]'::jsonb
  )
on conflict (id) do update set
  name = excluded.name,
  mentor_num = excluded.mentor_num,
  title = excluded.title,
  company = excluded.company,
  category = excluded.category,
  rating = excluded.rating,
  price = excluded.price,
  free = excluded.free,
  availability = excluded.availability,
  skills = excluded.skills,
  bio = excluded.bio,
  about = excluded.about;


