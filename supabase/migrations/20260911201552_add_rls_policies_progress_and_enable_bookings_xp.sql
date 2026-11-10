-- A learner's own progress is private by default.
alter table public.user_progress enable row level security;
create policy "Users manage their own path progress" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter table public.milestone_progress enable row level security;
create policy "Users manage their own milestone progress" on public.milestone_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- These two already had correct, complete policies from before — just
-- switching RLS on now activates them.
alter table public.bookings enable row level security;
alter table public.xp_transactions enable row level security;
