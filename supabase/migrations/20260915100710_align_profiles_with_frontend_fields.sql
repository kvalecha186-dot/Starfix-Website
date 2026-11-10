-- The frontend's UserProfile carries onboarding-quiz fields the original
-- schema never had columns for — every one of these was silently failing
-- to save. Table has 1 test row only, so this is a safe additive change.
alter table public.profiles
  add column goal_id text,
  add column goal_title text,
  add column level text,
  add column daily_time text,
  add column preference text,
  add column obstacle text,
  add column learning_languages text[],
  add column learning_style text,
  add column updated_at timestamptz not null default now();
