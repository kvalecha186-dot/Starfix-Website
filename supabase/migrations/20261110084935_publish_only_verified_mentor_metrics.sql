create or replace view public.public_mentor_directory
with (security_invoker = true)
as
select
  m.id,
  m.legacy_id,
  m.name,
  m.initials,
  m.color,
  m.headline,
  m.company,
  m.years_experience,
  coalesce((select avg(r.rating)::numeric(3,2) from public.reviews r where r.mentor_id = m.id), 0::numeric(3,2)) as rating,
  m.languages,
  m.location,
  m.bio,
  m.category,
  m.skills,
  m.price,
  m.free,
  case when exists (
    select 1 from public.mentor_availability a
    where a.mentor_id = m.id and a.status = 'available' and a.start_at > now()
  ) then 'Available' else 'Not available' end as availability,
  0::integer as students_count,
  m.linkedin_url,
  m.education,
  m.mentoring_approach,
  m.offers_free_intro,
  m.onboarding_completed
from public.mentors m
where m.profile_id is not null and m.onboarding_completed = true;
grant select on public.public_mentor_directory to anon, authenticated;
