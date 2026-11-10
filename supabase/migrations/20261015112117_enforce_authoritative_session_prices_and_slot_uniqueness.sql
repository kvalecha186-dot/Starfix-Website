
create or replace function public.guard_booking_insert()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_price numeric;
  v_currency text;
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.student_id is distinct from auth.uid() then
      raise exception 'Bookings must belong to the authenticated student' using errcode = '42501';
    end if;
    if new.session_type_id is null or new.mentor_id is null then
      raise exception 'A verified mentor session type is required for booking' using errcode = '42501';
    end if;
    select st.price, st.currency into v_price, v_currency
    from public.session_types st
    where st.id = new.session_type_id
      and st.mentor_id = new.mentor_id
      and st.active = true;
    if not found then
      raise exception 'Selected mentor session is unavailable' using errcode = '42501';
    end if;
    new.amount := v_price;
    new.currency := upper(coalesce(v_currency, 'INR'));
    new.status := 'pending';
  end if;
  return new;
end;
$$;

create unique index if not exists bookings_one_active_per_availability_uidx
on public.bookings(availability_id)
where availability_id is not null and lower(status) <> 'cancelled';

create or replace function public.has_mentor_student_relationship(p_mentor_id uuid, p_student_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    where b.mentor_id = p_mentor_id
      and b.student_id = p_student_id
      and lower(b.status) in ('confirmed','completed')
  );
$$;

