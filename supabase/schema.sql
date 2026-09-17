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
