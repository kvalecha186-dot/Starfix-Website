-- ============================================================
-- FINAL DATABASE PATCH FOR STARFIX
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql/new
-- ============================================================

-- 1. Create path_enrollments with matching UUID foreign keys
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

alter table public.path_enrollments enable row level security;

drop policy if exists "Users can view their own enrollments" on public.path_enrollments;
drop policy if exists "Users can insert their own enrollments" on public.path_enrollments;
drop policy if exists "Users can update their own enrollments" on public.path_enrollments;

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

-- 2. Ensure is_admin() can be executed safely by authenticated & anon users
grant execute on function public.is_admin() to authenticated, anon;
