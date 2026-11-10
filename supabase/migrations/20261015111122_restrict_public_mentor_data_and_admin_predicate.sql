
drop view if exists public.public_mentor_directory;
create view public.public_mentor_directory
with (security_invoker = false)
as
select
  m.id, m.legacy_id, m.name, m.initials, m.color, m.headline, m.company,
  m.years_experience, m.rating, m.languages, m.location, m.bio, m.category,
  m.skills, m.price, m.free, m.availability, m.students_count,
  m.linkedin_url, m.education, m.mentoring_approach,
  m.offers_free_intro, m.onboarding_completed
from public.mentors m;
grant select on public.public_mentor_directory to anon, authenticated;

drop policy if exists "Mentors are publicly readable" on public.mentors;
drop policy if exists "Mentor profiles are publicly visible" on public.profiles;
drop policy if exists "Users can create their own mentor listing" on public.mentors;

create policy "Authenticated users create own mentor listing"
on public.mentors for insert to authenticated
with check (profile_id = (select auth.uid()));

drop policy if exists "Mentors can view own or claimable listing" on public.mentors;
create policy "Mentors can view own or claimable listing"
on public.mentors for select to authenticated
using (
  profile_id = (select auth.uid())
  or (profile_id is null and lower(email) = lower((select auth.jwt())->>'email'))
  or public.is_admin()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

revoke all on public.mentors from anon;
grant select on public.mentors to authenticated;

