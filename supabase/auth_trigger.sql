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
  v_role text;
  v_mentor_id uuid;
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
    role = case
      when public.profiles.role = 'admin' then public.profiles.role
      else excluded.role
    end,
    updated_at = now();

  if v_role = 'mentor' then
    select id into v_mentor_id
    from public.mentors
    where profile_id is null and lower(coalesce(email, '')) = lower(new.email)
    limit 1;

    if v_mentor_id is not null then
      update public.mentors
      set profile_id = new.id,
          name = v_full_name,
          email = new.email,
          phone = nullif(new.raw_user_meta_data ->> 'mentor_phone', ''),
          location = nullif(new.raw_user_meta_data ->> 'mentor_location', ''),
          languages = coalesce(
            array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'mentor_languages', '[]'::jsonb))),
            array[]::text[]
          ),
          headline = nullif(new.raw_user_meta_data ->> 'mentor_headline', ''),
          company = nullif(new.raw_user_meta_data ->> 'mentor_company', ''),
          years_experience = nullif(new.raw_user_meta_data ->> 'mentor_years_experience', '')::integer,
          category = nullif(new.raw_user_meta_data ->> 'mentor_category', ''),
          skills = case
            when nullif(new.raw_user_meta_data ->> 'mentor_skills', '') is null then array[]::text[]
            else regexp_split_to_array(new.raw_user_meta_data ->> 'mentor_skills', '\\s*,\\s*')
          end,
          education = nullif(new.raw_user_meta_data ->> 'mentor_education', ''),
          linkedin_url = nullif(new.raw_user_meta_data ->> 'mentor_linkedin_url', ''),
          bio = nullif(new.raw_user_meta_data ->> 'mentor_bio', ''),
          mentoring_approach = nullif(new.raw_user_meta_data ->> 'mentor_mentoring_approach', ''),
          offers_free_intro = coalesce((new.raw_user_meta_data ->> 'mentor_offers_free_intro')::boolean, false),
          onboarding_completed = true
      where id = v_mentor_id;
    else
      insert into public.mentors (
        profile_id, name, email, phone, location, languages, headline, company,
        years_experience, category, skills, education, linkedin_url, bio,
        mentoring_approach, offers_free_intro, onboarding_completed
      )
      values (
        new.id,
        v_full_name,
        new.email,
        nullif(new.raw_user_meta_data ->> 'mentor_phone', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_location', ''),
        coalesce(
          array(select jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'mentor_languages', '[]'::jsonb))),
          array[]::text[]
        ),
        nullif(new.raw_user_meta_data ->> 'mentor_headline', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_company', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_years_experience', '')::integer,
        nullif(new.raw_user_meta_data ->> 'mentor_category', ''),
        case
          when nullif(new.raw_user_meta_data ->> 'mentor_skills', '') is null then array[]::text[]
          else regexp_split_to_array(new.raw_user_meta_data ->> 'mentor_skills', '\\s*,\\s*')
        end,
        nullif(new.raw_user_meta_data ->> 'mentor_education', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_linkedin_url', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_bio', ''),
        nullif(new.raw_user_meta_data ->> 'mentor_mentoring_approach', ''),
        coalesce((new.raw_user_meta_data ->> 'mentor_offers_free_intro')::boolean, false),
        true
      );
    end if;
  end if;

  return new;
end;
$$;

-- Drop trigger if already exists
drop trigger if exists on_auth_user_created on auth.users;

-- Create the trigger on auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
