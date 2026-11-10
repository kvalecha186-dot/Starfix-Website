create table if not exists public.explore_content (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  content_type text not null check (content_type in ('youtube','course','event','scholarship','challenge','article')),
  url text,
  metric_value text,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_explore_content_type on public.explore_content(content_type);
create index if not exists idx_explore_content_active on public.explore_content(active);

insert into public.explore_content(title,category,content_type,metric_value,url)
values
('Structuring APIs That Scale','Coding','youtube','12.4k',null),
('Deploying Your First Model','AI & ML','youtube','8.1k',null),
('Full-Stack Fundamentals','Coding','course','640',null),
('Public Speaking Foundations','Communication','course','410',null),
('Live Q&A: Breaking Into Tech','Coding','event','Aug 12',null),
('Women in Tech Scholarship','Coding','scholarship','Sep 1',null),
('7-Day Consistency Challenge','Mindset','challenge','320',null),
('Why Most ML Tutorials Fall Short','AI & ML','article','3.2k',null)
on conflict do nothing;

alter table public.explore_content enable row level security;
drop policy if exists "Explore content public read" on public.explore_content;
drop policy if exists "Admins manage explore content" on public.explore_content;
create policy "Explore content public read" on public.explore_content for select using (active = true or public.is_admin());
create policy "Admins manage explore content" on public.explore_content for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Ensure admin access exists for the operational tables without weakening student RLS.
drop policy if exists "Admins manage mentors" on public.mentors;
create policy "Admins manage mentors" on public.mentors for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage session types" on public.session_types;
create policy "Admins manage session types" on public.session_types for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage availability" on public.mentor_availability;
create policy "Admins manage availability" on public.mentor_availability for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage bookings" on public.bookings;
create policy "Admins manage bookings" on public.bookings for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage paths" on public.growth_paths;
create policy "Admins manage paths" on public.growth_paths for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage milestones" on public.milestones;
create policy "Admins manage milestones" on public.milestones for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage resources" on public.resources;
create policy "Admins manage resources" on public.resources for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage profiles" on public.profiles;
create policy "Admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage conversations" on public.conversations;
create policy "Admins manage conversations" on public.conversations for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins manage messages" on public.messages;
create policy "Admins manage messages" on public.messages for all to authenticated using (public.is_admin()) with check (public.is_admin());

