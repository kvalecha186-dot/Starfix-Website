
-- Starfix authorization hardening and payment ledger (additive migration).
-- Keep existing application tables and workflows; tighten sensitive writes.

-- Never allow a normal authenticated user to self-assign a privileged role.
create or replace function public.guard_profile_security_fields()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and auth.uid() = old.id then
    if new.role is distinct from old.role then
      raise exception 'Role changes require an authorized administrator'
        using errcode = '42501';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email must be changed through the authentication account flow'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_profile_security_fields on public.profiles;
create trigger guard_profile_security_fields
before update of role, email on public.profiles
for each row execute function public.guard_profile_security_fields();

-- Public mentor listings are a narrow view; private email/phone stay behind RLS.
create or replace view public.public_mentor_directory
with (security_invoker = true)
as
select
  m.id, m.legacy_id, m.profile_id, m.name, m.initials, m.color,
  m.headline, m.company, m.years_experience, m.rating, m.languages,
  m.location, m.bio, m.category, m.skills, m.price, m.free,
  m.availability, m.students_count, m.linkedin_url, m.education,
  m.mentoring_approach, m.offers_free_intro, m.onboarding_completed
from public.mentors m;

grant select on public.public_mentor_directory to anon, authenticated;

-- Booking owners may cancel their own booking, but cannot edit price, amount,
-- participants, schedule, payment identifiers or mark it completed/confirmed.
create or replace function public.guard_booking_updates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_mentor_owner uuid;
begin
  if v_uid is null then
    return new;
  end if;

  if public.is_admin() then
    return new;
  end if;

  if old.student_id = v_uid then
    if new.student_id is distinct from old.student_id
      or new.mentor_id is distinct from old.mentor_id
      or new.session_type_id is distinct from old.session_type_id
      or new.availability_id is distinct from old.availability_id
      or new.scheduled_start is distinct from old.scheduled_start
      or new.scheduled_end is distinct from old.scheduled_end
      or new.amount is distinct from old.amount
      or new.currency is distinct from old.currency
      or new.external_id is distinct from old.external_id
      or new.mentor_num is distinct from old.mentor_num
      or new.mentor_name is distinct from old.mentor_name
      or new.mentor_title is distinct from old.mentor_title
      or new.mentor_company is distinct from old.mentor_company
      or new.mentor_color is distinct from old.mentor_color
      or new.mentor_initials is distinct from old.mentor_initials
      or new.session_type is distinct from old.session_type
      or new.duration is distinct from old.duration
      or new.price is distinct from old.price
      or new.booking_date is distinct from old.booking_date
      or new.booking_time is distinct from old.booking_time then
      raise exception 'Students cannot change booking price, identity, or schedule fields'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status
      and lower(new.status) not in ('cancelled','canceled') then
      raise exception 'Students may only cancel their own booking'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      new.status := 'cancelled';
    end if;
    return new;
  end if;

  select m.profile_id into v_mentor_owner
  from public.mentors m where m.id = old.mentor_id;

  if v_mentor_owner = v_uid then
    if new.student_id is distinct from old.student_id
      or new.mentor_id is distinct from old.mentor_id
      or new.session_type_id is distinct from old.session_type_id
      or new.availability_id is distinct from old.availability_id
      or new.scheduled_start is distinct from old.scheduled_start
      or new.scheduled_end is distinct from old.scheduled_end
      or new.amount is distinct from old.amount
      or new.currency is distinct from old.currency
      or new.external_id is distinct from old.external_id
      or new.mentor_num is distinct from old.mentor_num
      or new.mentor_name is distinct from old.mentor_name
      or new.mentor_title is distinct from old.mentor_title
      or new.mentor_company is distinct from old.mentor_company
      or new.mentor_color is distinct from old.mentor_color
      or new.mentor_initials is distinct from old.mentor_initials
      or new.session_type is distinct from old.session_type
      or new.duration is distinct from old.duration
      or new.price is distinct from old.price
      or new.booking_date is distinct from old.booking_date
      or new.booking_time is distinct from old.booking_time then
      raise exception 'Mentors cannot change booking price, identity, or schedule fields'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status
      and lower(new.status) not in ('completed','cancelled','canceled') then
      raise exception 'Mentors may only complete or cancel a booking'
        using errcode = '42501';
    end if;
    if new.status is distinct from old.status then
      new.status := lower(new.status);
    end if;
    return new;
  end if;

  raise exception 'Not authorized to update this booking' using errcode = '42501';
end;
$$;

drop trigger if exists guard_booking_updates on public.bookings;
create trigger guard_booking_updates
before update on public.bookings
for each row execute function public.guard_booking_updates();

-- Students cannot create a booking under another identity or set it confirmed/completed.
create or replace function public.guard_booking_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.student_id is distinct from auth.uid() then
      raise exception 'Bookings must belong to the authenticated student'
        using errcode = '42501';
    end if;
    if lower(coalesce(new.status, 'pending')) not in ('pending','cancelled','canceled') then
      new.status := 'pending';
    else
      new.status := lower(coalesce(new.status, 'pending'));
    end if;
    new.external_id := null;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_booking_insert on public.bookings;
create trigger guard_booking_insert
before insert on public.bookings
for each row execute function public.guard_booking_insert();

-- Reviews remain tied to the same completed booking and cannot be reassigned.
create or replace function public.guard_review_changes()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if tg_op = 'INSERT' then
      if new.student_id is distinct from auth.uid()
        or not exists (
          select 1 from public.bookings b
          where b.id = new.booking_id
            and b.student_id = auth.uid()
            and b.mentor_id = new.mentor_id
            and lower(b.status) = 'completed'
        ) then
        raise exception 'Reviews require your own completed booking with this mentor'
          using errcode = '42501';
      end if;
    elsif tg_op = 'UPDATE' then
      if old.student_id is distinct from auth.uid()
        or new.student_id is distinct from old.student_id
        or new.booking_id is distinct from old.booking_id
        or new.mentor_id is distinct from old.mentor_id
        or not exists (
          select 1 from public.bookings b
          where b.id = new.booking_id
            and b.student_id = auth.uid()
            and b.mentor_id = new.mentor_id
            and lower(b.status) = 'completed'
        ) then
        raise exception 'Review identity and eligible booking cannot be changed'
          using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_review_changes on public.reviews;
create trigger guard_review_changes
before insert or update on public.reviews
for each row execute function public.guard_review_changes();

-- Payment records are backend-owned. The browser can read only its own payments.
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete restrict,
  student_id uuid not null references auth.users(id) on delete restrict,
  provider text not null default 'razorpay' check (provider = 'razorpay'),
  provider_order_id text unique,
  provider_payment_id text unique,
  amount_paise bigint not null check (amount_paise >= 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'created'
    check (status in ('created','pending','paid','failed','refunded')),
  provider_signature_verified boolean not null default false,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  refunded_at timestamptz,
  constraint payments_one_active_record_per_booking unique (booking_id)
);

alter table public.payments enable row level security;
alter table public.payments force row level security;

drop policy if exists "Students view own payments" on public.payments;
create policy "Students view own payments"
on public.payments for select to authenticated
using (student_id = (select auth.uid()) or public.is_admin());

drop policy if exists "Admins view payments" on public.payments;
create policy "Admins view payments"
on public.payments for select to authenticated
using (public.is_admin());

revoke insert, update, delete on public.payments from anon, authenticated;
grant select on public.payments to authenticated;

create index if not exists payments_student_created_idx
on public.payments(student_id, created_at desc);
create index if not exists bookings_student_created_idx
on public.bookings(student_id, created_at desc);
create index if not exists bookings_mentor_start_idx
on public.bookings(mentor_id, scheduled_start);


