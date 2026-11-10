-- Continue Watching — one row per distinct video a learner has started,
-- across every active Growth Path (not just the current milestone).
create table public.watch_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  path_id uuid not null references public.growth_paths(id) on delete cascade,
  video_title text not null,
  creator text not null,
  video_url text not null,
  pct integer not null default 0 check (pct between 0 and 100),
  elapsed_min integer not null default 0,
  total_min integer not null default 0,
  last_watched_at timestamptz not null default now(),
  unique (user_id, path_id, creator, video_title)
);
alter table public.watch_queue enable row level security;
create policy "Users manage their own watch queue" on public.watch_queue
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_type text not null,
  title text not null,
  description text,
  url text not null,
  saved_at timestamptz not null default now()
);
alter table public.saved_items enable row level security;
create policy "Users manage their own saved items" on public.saved_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
