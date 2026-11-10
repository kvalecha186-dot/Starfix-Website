alter table public.user_progress
  add column focus text[] not null default '{}',
  add column video_stage text not null default 'start' check (video_stage in ('start','deeper','practice')),
  add column streak integer not null default 1,
  add column xp integer not null default 0,
  add column last_active_date date not null default current_date,
  add column current_challenge_text text,
  add column current_challenge_xp integer not null default 0,
  add column current_challenge_done boolean not null default false;
