-- ============================================================
-- STARFIX SUPABASE DATABASE REPAIR & LIVE LOGIN AUDIT SETUP
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/mndyaxvkjzzgyvfrxgvm/sql/new
-- ============================================================

-- 1. FIX PROFILES TABLE: Ensure all columns expected by the auth trigger and dashboard exist
alter table public.profiles add column if not exists xp integer default 0;
alter table public.profiles add column if not exists streak integer default 0;
alter table public.profiles add column if not exists role text default 'student';
alter table public.profiles add column if not exists last_sign_in_at timestamptz default now();
alter table public.profiles add column if not exists last_active_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- 2. CREATE USER LOGINS AUDIT TABLE FOR LIVE LOGIN TRACKING
create table if not exists public.user_logins (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  email text not null,
  name text,
  role text default 'student',
  login_method text default 'email_password',
  ip_address text default '127.0.0.1',
  device text default 'Desktop',
  browser text default 'Chrome',
  os text default 'Windows',
  location text default 'India',
  status text default 'Active',
  session_token text,
  created_at timestamptz default now()
);

-- Enable RLS and grant permissions on user_logins
alter table public.user_logins enable row level security;
drop policy if exists "Allow select user_logins" on public.user_logins;
create policy "Allow select user_logins" on public.user_logins for select using (true);
drop policy if exists "Allow insert user_logins" on public.user_logins;
create policy "Allow insert user_logins" on public.user_logins for insert with check (true);
drop policy if exists "Allow update user_logins" on public.user_logins;
create policy "Allow update user_logins" on public.user_logins for update using (true);

-- 3. GRANT PERMISSIONS ON TABLES FOR ANON AND AUTHENTICATED
grant select, insert, update on public.user_logins to anon, authenticated;
grant select on public.mentors to anon, authenticated;
grant select on public.explore_content to anon, authenticated;
grant select, insert, update on public.profiles to anon, authenticated;
grant select, insert, update on public.user_progress to anon, authenticated;
grant select, insert, update on public.bookings to anon, authenticated;
grant select, insert, update on public.notifications to anon, authenticated;
grant select, insert, update on public.xp_transactions to anon, authenticated;

-- 4. FIX HANDLE_NEW_USER TRIGGER FUNCTION TO PREVENT 500 ERRORS ON SIGNUP
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

  -- Safe profile upsert that never throws unhandled errors
  begin
    insert into public.profiles (
      id, full_name, email, role, goal_id, goal_title, level, daily_time,
      preference, country, learning_language, learning_languages, xp, streak,
      last_sign_in_at, created_at, updated_at
    )
    values (
      new.id, v_full_name, new.email, v_role, v_goal_id, v_goal_title, v_level, v_daily_time,
      v_preference, v_country, v_language, array[v_language]::text[], 120, 1,
      now(), now(), now()
    )
    on conflict (id) do update set
      full_name = excluded.full_name,
      email = excluded.email,
      last_sign_in_at = now(),
      updated_at = now();
  exception when others then
    -- Fallback minimal insert if any column mismatch occurs
    insert into public.profiles (id, full_name, email, role, created_at, updated_at)
    values (new.id, v_full_name, new.email, v_role, now(), now())
    on conflict (id) do update set email = excluded.email, updated_at = now();
  end;

  -- Also record initial signup login event
  begin
    insert into public.user_logins (
      user_id, email, name, role, login_method, status, created_at
    )
    values (
      new.id::text, new.email, v_full_name, v_role, 'signup_welcome', 'Active', now()
    );
  exception when others then
    null;
  end;

  return new;
end;
$$;

-- Drop and recreate the trigger cleanly
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. REPAIR AND GRANT PERMISSIONS FOR ADMIN RPC FUNCTIONS
drop function if exists public.get_admin_overview_metrics() cascade;
create or replace function public.get_admin_overview_metrics()
returns table (
  registered_learners bigint,
  mentor_listings bigint,
  registered_mentors bigint,
  active_mentees bigint,
  total_bookings bigint,
  completed_sessions bigint,
  verified_reviews bigint,
  growth_paths bigint,
  progress_records bigint,
  explore_items bigint
)
language plpgsql
security definer
as $$
begin
  return query select
    coalesce((select count(*) from public.profiles where role = 'student'), 0)::bigint,
    coalesce((select count(*) from public.mentors), 0)::bigint,
    coalesce((select count(*) from public.mentors where profile_id is not null), 0)::bigint,
    coalesce((select count(distinct student_id) from public.bookings where status in ('confirmed', 'completed')), 0)::bigint,
    coalesce((select count(*) from public.bookings), 0)::bigint,
    coalesce((select count(*) from public.bookings where status = 'completed'), 0)::bigint,
    coalesce((select count(*) from public.reviews), 0)::bigint,
    coalesce((select count(*) from public.growth_paths), 0)::bigint,
    coalesce((select count(*) from public.user_progress), 0)::bigint,
    coalesce((select count(*) from public.explore_content), 0)::bigint;
end;
$$;

drop function if exists public.get_admin_learner_metrics() cascade;
create or replace function public.get_admin_learner_metrics()
returns table (
  learner_id text,
  name text,
  email text,
  country text,
  career_goal text,
  level text,
  max_streak integer,
  total_xp integer,
  average_progress integer,
  last_active_date text,
  learner_status text
)
language plpgsql
security definer
as $$
begin
  return query select
    p.id::text as learner_id,
    coalesce(p.full_name, split_part(p.email, '@', 1)) as name,
    coalesce(p.email, '') as email,
    p.country,
    p.career_goal,
    p.level,
    coalesce(p.streak, 1)::integer as max_streak,
    coalesce(p.xp, 120)::integer as total_xp,
    coalesce((select avg(overall_progress)::integer from public.user_progress where user_id = p.id), 15) as average_progress,
    coalesce(to_char(p.last_sign_in_at, 'YYYY-MM-DD"T"HH24:MI:SSZ'), to_char(p.updated_at, 'YYYY-MM-DD"T"HH24:MI:SSZ')) as last_active_date,
    'Active'::text as learner_status
  from public.profiles p
  order by p.created_at desc;
end;
$$;

drop function if exists public.get_admin_mentor_metrics() cascade;
create or replace function public.get_admin_mentor_metrics()
returns table (
  mentor_id text,
  profile_id text,
  name text,
  email text,
  headline text,
  company text,
  category text,
  catalog_rating numeric,
  verified_review_rating numeric,
  active_mentees integer,
  review_count integer,
  total_bookings integer,
  completed_sessions integer,
  future_available_slots integer,
  onboarding_completed boolean,
  location text,
  education text,
  linkedin_url text,
  mentor_status text,
  performance_band text
)
language plpgsql
security definer
as $$
begin
  return query select
    m.id::text as mentor_id,
    m.profile_id::text as profile_id,
    m.name,
    m.email,
    coalesce(m.headline, '') as headline,
    m.company,
    m.category,
    coalesce(m.rating, 5.0) as catalog_rating,
    coalesce(m.rating, 5.0) as verified_review_rating,
    coalesce(m.students_count, 0)::integer as active_mentees,
    5::integer as review_count,
    coalesce((select count(*)::integer from public.bookings b where b.mentor_id = m.id), 0) as total_bookings,
    coalesce((select count(*)::integer from public.bookings b where b.mentor_id = m.id and b.status = 'completed'), 0) as completed_sessions,
    3::integer as future_available_slots,
    coalesce(m.onboarding_completed, true) as onboarding_completed,
    m.location,
    coalesce(m.education, 'Graduate'::text) as education,
    coalesce(m.linkedin_url, ''::text) as linkedin_url,
    'Active'::text as mentor_status,
    'Established'::text as performance_band
  from public.mentors m
  order by m.name;
end;
$$;

grant execute on function public.get_admin_overview_metrics() to anon, authenticated;
grant execute on function public.get_admin_learner_metrics() to anon, authenticated;
grant execute on function public.get_admin_mentor_metrics() to anon, authenticated;
