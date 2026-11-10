-- Reusable admin check — used to gate writes to catalog/reference tables.
-- SECURITY DEFINER + locked search_path so it can't be hijacked, and it
-- only ever inspects the calling user's own profile row.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

-- profiles: you see your own full row; mentor profiles are publicly
-- browsable (needed for the mentor directory); only the owner can edit.
alter table public.profiles enable row level security;
create policy "Own profile is visible" on public.profiles
  for select using (auth.uid() = id);
create policy "Mentor profiles are publicly visible" on public.profiles
  for select using (exists (select 1 from public.mentors m where m.profile_id = profiles.id));
create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Catalog data: readable by everyone (including logged-out visitors
-- browsing a path page), writable only by admins.
alter table public.growth_paths enable row level security;
create policy "Growth paths are publicly readable" on public.growth_paths for select using (true);
create policy "Admins manage growth paths" on public.growth_paths for all using (public.is_admin()) with check (public.is_admin());

alter table public.milestones enable row level security;
create policy "Milestones are publicly readable" on public.milestones for select using (true);
create policy "Admins manage milestones" on public.milestones for all using (public.is_admin()) with check (public.is_admin());

alter table public.resources enable row level security;
create policy "Resources are publicly readable" on public.resources for select using (true);
create policy "Admins manage resources" on public.resources for all using (public.is_admin()) with check (public.is_admin());
