-- Starfix booking, availability and Razorpay data model.
-- Additive migration: keeps existing mentor catalog and bookings intact.

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.current_starfix_role()
returns text
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = (select auth.uid()) limit 1
$$;
revoke all on function private.current_starfix_role() from public, anon;
grant execute on function private.current_starfix_role() to authenticated;

alter table public.mentors add column if not exists legacy_id integer;

create table if not exists public.session_types (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  title text not null,
  description text,
  duration_minutes integer not null default 60 check (duration_minutes between 10 and 480),
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (mentor_id, title)
);

-- Create verified session options from the existing mentor pricing catalog.
insert into public.session_types (mentor_id, title, duration_minutes, price, currency, active)
select
  m.id,
  p.item ->> 'label',
  greatest(10, least(480, coalesce(nullif(regexp_replace(p.item ->> 'label', '[^0-9]', '', 'g'), '')::integer, 45))),
  case
    when lower(coalesce(p.item ->> 'price', '')) like '%free%' then 0
    else coalesce(nullif(regexp_replace(p.item ->> 'price', '[^0-9.]', '', 'g'), '')::numeric, 0)
  end,
  'INR',
  true
from public.mentors m
cross join lateral jsonb_array_elements(coalesce(m.pricing, '[]'::jsonb)) as p(item)
where nullif(p.item ->> 'label', '') is not null
on conflict (mentor_id, title) do update
set duration_minutes = excluded.duration_minutes,
    price = excluded.price,
    currency = excluded.currency,
    active = true;

create table if not exists public.mentor_availability (
  id uuid primary key default gen_random_uuid(),
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'available' check (status in ('available','booked','blocked')),
  created_at timestamptz not null default now(),
  check (end_at > start_at),
  unique (mentor_id, start_at)
);

alter table public.bookings add column if not exists external_id text;
alter table public.bookings add column if not exists session_type_id uuid references public.session_types(id) on delete set null;
alter table public.bookings add column if not exists availability_id uuid references public.mentor_availability(id) on delete set null;
alter table public.bookings add column if not exists scheduled_start timestamptz;
alter table public.bookings add column if not exists scheduled_end timestamptz;
alter table public.bookings add column if not exists amount numeric(12,2);
alter table public.bookings add column if not exists currency text not null default 'INR';

create unique index if not exists bookings_student_external_id_uidx
  on public.bookings(student_id, external_id) where external_id is not null;
create index if not exists bookings_mentor_schedule_idx
  on public.bookings(mentor_id, scheduled_start, scheduled_end);
create index if not exists session_types_mentor_active_idx
  on public.session_types(mentor_id, active);
create index if not exists mentor_availability_mentor_start_idx
  on public.mentor_availability(mentor_id, start_at, status);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id text unique,
  provider_payment_id text unique,
  failure_reason text,
  paid_at timestamptz,
  refunded_at timestamptz,
  amount_paise bigint not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created' check (status in ('created','pending','paid','failed','refunded')),
  provider_signature_verified boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists payments_student_id_idx on public.payments(student_id);

create or replace view public.public_mentor_directory
with (security_invoker = true)
as
select id, legacy_id, profile_id, name, initials, color, title, company, category,
       rating, students_count, price, free, availability, skills, bio, about,
       experience, location, response_time, stats, pricing, availability_slots,
       roadmap, reviews, faq, related_paths, avatar_url, created_at
from public.mentors;

alter table public.session_types enable row level security;
alter table public.mentor_availability enable row level security;
alter table public.payments enable row level security;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Starfix profiles are private to owner and admin" on public.profiles;
create policy "Starfix profiles are private to owner and admin"
on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.current_starfix_role()) = 'admin');

drop policy if exists "Session types are publicly readable when active" on public.session_types;
create policy "Session types are publicly readable when active"
on public.session_types for select to anon, authenticated using (active = true);
drop policy if exists "Mentors manage their own session types" on public.session_types;
create policy "Mentors manage their own session types"
on public.session_types for all to authenticated
using (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())))
with check (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())));

drop policy if exists "Availability is publicly readable" on public.mentor_availability;
create policy "Availability is publicly readable"
on public.mentor_availability for select to anon, authenticated using (status = 'available');
drop policy if exists "Mentors manage their own availability" on public.mentor_availability;
create policy "Mentors manage their own availability"
on public.mentor_availability for all to authenticated
using (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())))
with check (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())));

-- Payment ledger is never directly accessible to browser roles; the Edge Function uses service_role.
revoke all on public.payments from public, anon, authenticated;
grant all on public.payments to service_role;

-- Replace permissive booking writes with owner/mentor-scoped access.
drop policy if exists "A student can create their own bookings" on public.bookings;
drop policy if exists "A student can update their own bookings" on public.bookings;
drop policy if exists "A mentor can update bookings made with them" on public.bookings;
drop policy if exists "A student can view their own bookings" on public.bookings;
drop policy if exists "A mentor can view bookings made with them" on public.bookings;

create policy "Bookings are visible to participants and admins"
on public.bookings for select to authenticated
using (
  student_id = (select auth.uid())
  or exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid()))
  or (select private.current_starfix_role()) = 'admin'
);
create policy "Students can cancel their own pending bookings"
on public.bookings for update to authenticated
using (student_id = (select auth.uid()) and status in ('pending','confirmed','Booked'))
with check (student_id = (select auth.uid()) and status = 'cancelled');
create policy "Mentors can update their own bookings"
on public.bookings for update to authenticated
using (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())))
with check (exists (select 1 from public.mentors m where m.id = mentor_id and m.profile_id = (select auth.uid())));

revoke all on public.bookings from public, anon, authenticated;
grant select on public.bookings to authenticated;
grant update (status, notes, meet_link) on public.bookings to authenticated;
revoke all on public.session_types, public.mentor_availability from public, anon, authenticated;
grant select on public.session_types, public.mentor_availability to anon, authenticated;
grant insert, update, delete on public.session_types, public.mentor_availability to authenticated;
revoke all on public.public_mentor_directory from public;
grant select on public.public_mentor_directory to anon, authenticated;
revoke all on public.profiles from anon;
grant select, insert on public.profiles to authenticated;
grant update (full_name, avatar_url, bio, country, learning_language, learning_languages, learning_style, career_goal, goal_id, goal_title, level, daily_time, preference, obstacle, xp, streak, updated_at) on public.profiles to authenticated;

-- Student booking creation is atomic and derives price/currency from the trusted session catalog.
create or replace function private.create_student_booking(
  p_mentor_id uuid,
  p_session_type_id uuid,
  p_availability_id uuid,
  p_scheduled_start timestamptz,
  p_scheduled_end timestamptz,
  p_amount numeric,
  p_currency text,
  p_external_id text,
  p_mentor_num integer,
  p_mentor_name text,
  p_mentor_title text,
  p_mentor_company text,
  p_mentor_color text,
  p_mentor_initials text,
  p_session_type text,
  p_duration text,
  p_price text,
  p_booking_date text,
  p_booking_time text
)
returns public.bookings
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.session_types%rowtype;
  v_slot public.mentor_availability%rowtype;
  v_booking public.bookings%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'Authentication required';
  end if;
  if p_scheduled_start is null or p_scheduled_end is null or p_scheduled_end <= p_scheduled_start then
    raise exception 'A valid session start and end time are required';
  end if;

  select * into v_session
  from public.session_types
  where id = p_session_type_id and mentor_id = p_mentor_id and active = true
  for share;
  if not found then raise exception 'Session type is unavailable'; end if;
  if round(coalesce(p_amount, -1), 2) <> round(v_session.price, 2)
     or upper(coalesce(p_currency, '')) <> v_session.currency then
    raise exception 'Booking price or currency does not match the active session type';
  end if;

  if p_availability_id is not null then
    select * into v_slot from public.mentor_availability
    where id = p_availability_id and mentor_id = p_mentor_id
    for update;
    if not found or v_slot.status <> 'available'
       or v_slot.start_at <> p_scheduled_start or v_slot.end_at <> p_scheduled_end then
      raise exception 'Selected availability slot is no longer available';
    end if;
    update public.mentor_availability set status = 'booked' where id = v_slot.id;
  elsif exists (
    select 1 from public.bookings b
    where b.mentor_id = p_mentor_id
      and b.status not in ('cancelled','Cancelled')
      and b.scheduled_start < p_scheduled_end
      and b.scheduled_end > p_scheduled_start
  ) then
    raise exception 'The mentor already has a booking at this time';
  end if;

  insert into public.bookings (
    student_id, mentor_id, external_id, session_type_id, availability_id,
    scheduled_start, scheduled_end, amount, currency, status,
    mentor_num, mentor_name, mentor_title, mentor_company, mentor_color, mentor_initials,
    session_type, duration, price, booking_date, booking_time
  ) values (
    (select auth.uid()), p_mentor_id, p_external_id, p_session_type_id, p_availability_id,
    p_scheduled_start, p_scheduled_end, v_session.price, v_session.currency, 'pending',
    p_mentor_num, p_mentor_name, p_mentor_title, p_mentor_company, p_mentor_color, p_mentor_initials,
    p_session_type, p_duration, p_price, p_booking_date, p_booking_time
  ) returning * into v_booking;
  return v_booking;
end;
$$;

revoke all on function private.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function private.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function public.create_student_booking(
  p_mentor_id uuid, p_session_type_id uuid, p_availability_id uuid,
  p_scheduled_start timestamptz, p_scheduled_end timestamptz, p_amount numeric,
  p_currency text, p_external_id text, p_mentor_num integer, p_mentor_name text,
  p_mentor_title text, p_mentor_company text, p_mentor_color text, p_mentor_initials text,
  p_session_type text, p_duration text, p_price text, p_booking_date text, p_booking_time text
)
returns public.bookings language sql security invoker set search_path = ''
as $ select private.create_student_booking($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19) $;
revoke all on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) from public, anon;
grant execute on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) to authenticated;

create or replace function private.update_student_booking_notes(p_booking_id text, p_notes text)
returns void language plpgsql security definer set search_path = ''
as $$
begin
  update public.bookings
  set notes = left(coalesce(p_notes, ''), 2000)
  where (id::text = p_booking_id or external_id = p_booking_id)
    and student_id = (select auth.uid())
    and status in ('pending','confirmed','Booked');
  if not found then raise exception 'Booking not found or no longer editable'; end if;
end;
$$;
revoke all on function private.update_student_booking_notes(text,text) from public, anon;
grant execute on function private.update_student_booking_notes(text,text) to authenticated;
create or replace function public.update_student_booking_notes(p_booking_id text, p_notes text)
returns void language sql security invoker set search_path = ''
as $ select private.update_student_booking_notes($1,$2) $;
revoke all on function public.update_student_booking_notes(text,text) from public, anon;
grant execute on function public.update_student_booking_notes(text,text) to authenticated;

-- Only a completed booking can receive a review from its own student.
drop policy if exists "A student can review their own completed booking" on public.reviews;
create policy "A student can review their own completed booking"
on public.reviews for insert to authenticated
with check (
  student_id = (select auth.uid())
  and exists (
    select 1 from public.bookings b
    where b.id = booking_id and b.student_id = (select auth.uid()) and b.status = 'completed'
  )
);

-- Keep anonymous users away from private account, booking and payment records.
revoke all on public.profiles, public.bookings, public.path_enrollments, public.xp_transactions,
  public.notifications, public.messages, public.watch_queue, public.reviews,
  public.mentor_notes, public.shared_resources, public.session_followups
from anon;
