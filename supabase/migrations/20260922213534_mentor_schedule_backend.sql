
create table if not exists public.mentor_schedule_rules (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  enabled boolean not null default true,
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(mentor_id, day_of_week)
);

create table if not exists public.mentor_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  blocked_date date not null,
  reason text not null default 'Unavailable',
  created_at timestamptz not null default now(),
  unique(mentor_id, blocked_date)
);

alter table public.mentor_schedule_rules enable row level security;
alter table public.mentor_blocked_dates enable row level security;

drop policy if exists "Mentors manage own schedule rules" on public.mentor_schedule_rules;
create policy "Mentors manage own schedule rules" on public.mentor_schedule_rules for all to authenticated
using (exists(select 1 from public.mentors m where m.id=mentor_schedule_rules.mentor_id and m.profile_id=auth.uid()) or is_admin())
with check (exists(select 1 from public.mentors m where m.id=mentor_schedule_rules.mentor_id and m.profile_id=auth.uid()) or is_admin());

drop policy if exists "Schedule rules are readable" on public.mentor_schedule_rules;
create policy "Schedule rules are readable" on public.mentor_schedule_rules for select to authenticated using (true);

drop policy if exists "Mentors manage own blocked dates" on public.mentor_blocked_dates;
create policy "Mentors manage own blocked dates" on public.mentor_blocked_dates for all to authenticated
using (exists(select 1 from public.mentors m where m.id=mentor_blocked_dates.mentor_id and m.profile_id=auth.uid()) or is_admin())
with check (exists(select 1 from public.mentors m where m.id=mentor_blocked_dates.mentor_id and m.profile_id=auth.uid()) or is_admin());

drop policy if exists "Blocked dates are readable" on public.mentor_blocked_dates;
create policy "Blocked dates are readable" on public.mentor_blocked_dates for select to authenticated using (true);

create index if not exists mentor_schedule_rules_mentor_idx on public.mentor_schedule_rules(mentor_id, day_of_week);
create index if not exists mentor_blocked_dates_mentor_idx on public.mentor_blocked_dates(mentor_id, blocked_date);

