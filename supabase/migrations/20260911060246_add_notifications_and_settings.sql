create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;
create policy "Users manage their own notifications" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- One row per user; matches the Settings page's Learning Experience,
-- Content Preferences, Mentor & Session, and Privacy sections.
create table public.app_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  autoplay_next_video boolean not null default true,
  show_subtitles boolean not null default true,
  daily_reminder_notifications boolean not null default true,
  weekly_progress_email boolean not null default false,
  focus_mode boolean not null default false,
  content_source text not null default 'both' check (content_source in ('indian','international','both')),
  content_level text not null default 'beginner' check (content_level in ('beginner','intermediate','advanced')),
  session_reminder_lead text not null default '10' check (session_reminder_lead in ('10','30','60')),
  time_zone text not null default 'UTC',
  profile_private boolean not null default false,
  show_completed_paths boolean not null default true,
  show_streak_publicly boolean not null default true,
  show_saved_items_publicly boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
create policy "Users manage their own settings" on public.app_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
