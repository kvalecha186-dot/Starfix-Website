-- Public mentor catalogue must contain only real, claimed, completed profiles.
drop policy if exists "Public can view onboarded mentor listings" on public.mentors;
create policy "Public can view onboarded mentor listings"
on public.mentors for select to anon, authenticated
using (profile_id is not null and onboarding_completed = true);

-- Keep direct table reads column-scoped; private email/phone fields are not public.
revoke select on public.mentors from anon, authenticated;
grant select (
  id, legacy_id, name, initials, color, headline, company, years_experience,
  rating, languages, location, bio, category, skills, price, free, availability,
  students_count, linkedin_url, education, mentoring_approach, offers_free_intro,
  onboarding_completed
) on public.mentors to anon;
grant select (
  id, legacy_id, profile_id, email, name, initials, color, headline, company,
  years_experience, rating, languages, location, bio, category, skills, price,
  free, availability, students_count, linkedin_url, education, mentoring_approach,
  offers_free_intro, onboarding_completed
) on public.mentors to authenticated;

create or replace view public.public_mentor_directory
with (security_invoker = true)
as
select
  id, legacy_id, name, initials, color, headline, company, years_experience,
  rating, languages, location, bio, category, skills, price, free, availability,
  students_count, linkedin_url, education, mentoring_approach, offers_free_intro,
  onboarding_completed
from public.mentors
where profile_id is not null and onboarding_completed = true;
grant select on public.public_mentor_directory to anon, authenticated;

drop policy if exists "Session types are publicly readable when active" on public.session_types;
create policy "Session types are publicly readable when active"
on public.session_types for select to anon, authenticated
using (
  active = true and exists (
    select 1 from public.mentors m
    where m.id = session_types.mentor_id
      and m.profile_id is not null
      and m.onboarding_completed = true
  )
);

drop policy if exists "Availability is publicly readable" on public.mentor_availability;
create policy "Availability is publicly readable"
on public.mentor_availability for select to anon, authenticated
using (
  status = 'available' and exists (
    select 1 from public.mentors m
    where m.id = mentor_availability.mentor_id
      and m.profile_id is not null
      and m.onboarding_completed = true
  )
);

-- Defence in depth: a booking cannot be created for an unclaimed/demo listing,
-- even if a client bypasses the public directory.
create or replace function private.require_approved_mentor_for_booking()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.mentors m
    where m.id = new.mentor_id
      and m.profile_id is not null
      and m.onboarding_completed = true
  ) then
    raise exception 'This mentor profile is not yet approved for bookings';
  end if;
  return new;
end;
$$;
revoke all on function private.require_approved_mentor_for_booking() from public, anon, authenticated;
drop trigger if exists trg_require_approved_mentor_for_booking on public.bookings;
create trigger trg_require_approved_mentor_for_booking
before insert or update of mentor_id on public.bookings
for each row execute function private.require_approved_mentor_for_booking();

-- Public dashboard counts represent live, claimable mentor listings only.
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
language plpgsql security invoker set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  return query
  select
    (select count(*) from public.profiles p where p.role = 'student')::bigint,
    (select count(*) from public.mentors m where m.profile_id is not null and m.onboarding_completed = true)::bigint,
    (select count(*) from public.mentors m where m.profile_id is not null and m.onboarding_completed = true)::bigint,
    (select count(distinct b.student_id) from public.bookings b where b.status = 'confirmed' and (b.scheduled_end is null or b.scheduled_end >= now()))::bigint,
    (select count(*) from public.bookings)::bigint,
    (select count(*) from public.bookings b where b.status = 'completed')::bigint,
    (select count(*) from public.reviews)::bigint,
    (select count(*) from public.growth_paths)::bigint,
    (select count(*) from public.user_progress)::bigint,
    (select count(*) from public.explore_content e where e.active = true)::bigint;
end;
$$;
revoke all on function public.get_admin_overview_metrics() from public, anon;
grant execute on function public.get_admin_overview_metrics() to authenticated;
alter function public.get_admin_overview_metrics() set search_path = '';
