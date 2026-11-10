-- Replace synthetic admin metrics with live, permission-checked data.
-- All reporting RPCs run as the caller and are available only to authenticated admins.

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create or replace function public.get_admin_learner_metrics()
returns table(
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
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select
    p.id::text,
    coalesce(p.full_name, split_part(coalesce(p.email, ''), '@', 1)),
    coalesce(p.email, ''),
    p.country,
    p.career_goal,
    p.level,
    greatest(coalesce(p.streak, 0), coalesce((select max(up.streak) from public.user_progress up where up.user_id = p.id), 0))::integer,
    greatest(coalesce(p.xp, 0), coalesce((select sum(x.amount)::integer from public.xp_transactions x where x.user_id = p.id and x.settled = true), 0))::integer,
    coalesce((select round(avg(up.overall_progress))::integer from public.user_progress up where up.user_id = p.id), 0)::integer,
    coalesce(
      to_char(p.last_sign_in_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      to_char(p.last_active_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      to_char(p.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    ),
    case
      when p.last_sign_in_at >= now() - interval '7 days' then 'Active'
      when p.last_sign_in_at >= now() - interval '30 days' then 'At risk'
      else 'Inactive'
    end
  from public.profiles p
  where p.role = 'student'
  order by p.created_at desc;
end;
$$;

create or replace function public.get_admin_mentor_metrics()
returns table(
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
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select
    m.id::text,
    m.profile_id::text,
    coalesce(m.name, 'Unnamed mentor'),
    m.email,
    m.headline,
    m.company,
    m.category,
    m.rating,
    (select avg(r.rating)::numeric from public.reviews r where r.mentor_id = m.id),
    (select count(distinct b.student_id)::integer from public.bookings b where b.mentor_id = m.id and b.status = 'confirmed'),
    (select count(*)::integer from public.reviews r where r.mentor_id = m.id),
    (select count(*)::integer from public.bookings b where b.mentor_id = m.id),
    (select count(*)::integer from public.bookings b where b.mentor_id = m.id and b.status = 'completed'),
    (select count(*)::integer from public.mentor_availability a where a.mentor_id = m.id and a.status = 'available' and a.start_at > now()),
    coalesce(m.onboarding_completed, false),
    m.location,
    m.education,
    m.linkedin_url,
    case
      when m.profile_id is null then 'Unclaimed'
      when coalesce(m.onboarding_completed, false) then 'Active'
      else 'Onboarding'
    end,
    case
      when (select count(*) from public.bookings b where b.mentor_id = m.id and b.status = 'completed') = 0 then 'Not enough data'
      when (select avg(r.rating) from public.reviews r where r.mentor_id = m.id) >= 4.5
        and (select count(*) from public.bookings b where b.mentor_id = m.id and b.status = 'completed') >= 10 then 'Established'
      when (select avg(r.rating) from public.reviews r where r.mentor_id = m.id) < 4 then 'Needs attention'
      else 'Growing'
    end
  from public.mentors m
  order by m.name;
end;
$$;

create or replace function public.get_admin_overview_metrics()
returns table(
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
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  return query
  select
    (select count(*) from public.profiles p where p.role = 'student')::bigint,
    (select count(*) from public.mentors)::bigint,
    (select count(*) from public.mentors m where m.profile_id is not null)::bigint,
    (select count(distinct b.student_id) from public.bookings b where b.status = 'confirmed' and (b.scheduled_end is null or b.scheduled_end >= now()))::bigint,
    (select count(*) from public.bookings)::bigint,
    (select count(*) from public.bookings b where b.status = 'completed')::bigint,
    (select count(*) from public.reviews)::bigint,
    (select count(*) from public.growth_paths)::bigint,
    (select count(*) from public.user_progress)::bigint,
    (select count(*) from public.explore_content e where e.active = true)::bigint;
end;
$$;

revoke all on function public.get_admin_learner_metrics() from public, anon;
revoke all on function public.get_admin_mentor_metrics() from public, anon;
revoke all on function public.get_admin_overview_metrics() from public, anon;
grant execute on function public.get_admin_learner_metrics() to authenticated;
grant execute on function public.get_admin_mentor_metrics() to authenticated;
grant execute on function public.get_admin_overview_metrics() to authenticated;

-- The directory exposes only its selected catalog fields and now honours
-- the querying role's grants and RLS policies on public.mentors.
create or replace view public.public_mentor_directory
with (security_invoker = true)
as
select
  id, legacy_id, name, initials, color, headline, company, years_experience,
  rating, languages, location, bio, category, skills, price, free, availability,
  students_count, linkedin_url, education, mentoring_approach, offers_free_intro,
  onboarding_completed
from public.mentors;

grant select on public.public_mentor_directory to anon, authenticated;

-- Lock search paths for reporting helpers and existing admin predicate.
alter function public.get_admin_learner_metrics() set search_path = '';
alter function public.get_admin_mentor_metrics() set search_path = '';
alter function public.get_admin_overview_metrics() set search_path = '';
alter function public.is_admin() set search_path = '';

