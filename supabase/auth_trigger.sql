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
