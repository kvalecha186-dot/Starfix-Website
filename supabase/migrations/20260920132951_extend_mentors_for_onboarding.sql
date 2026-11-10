-- Fields the 4-step mentor onboarding needs that don't exist yet.
-- email is used to "claim" a matching unclaimed catalog row on signup.
alter table public.mentors
  add column email text,
  add column phone text,
  add column linkedin_url text,
  add column education text,
  add column mentoring_approach text,
  add column offers_free_intro boolean not null default false,
  add column onboarding_completed boolean not null default false;

create index mentors_email_idx on public.mentors(email) where profile_id is null;
