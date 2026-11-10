
create or replace function public.on_booking_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare mentor_profile uuid;
begin
  select profile_id into mentor_profile from public.mentors where id = new.mentor_id;
  if mentor_profile is not null then
    insert into public.conversations(student_id, mentor_id, archived, external_id)
    values(new.student_id, new.mentor_id, false, 'booking:' || new.id::text)
    on conflict (student_id, mentor_id) do nothing;

    insert into public.notifications(user_id, type, title, message, read, external_id)
    values(
      mentor_profile,
      'new_booking',
      'New mentorship booking',
      coalesce(new.session_type, 'Mentorship session') || ' has been booked with you.',
      false,
      'mentor-booking:' || new.id::text
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_created_starfix on public.bookings;
create trigger trg_booking_created_starfix
after insert on public.bookings
for each row execute function public.on_booking_created();

create or replace function public.on_booking_completed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and (old.status is distinct from 'completed') then
    insert into public.mentor_earnings(mentor_id, booking_id, gross_amount, platform_fee, net_amount, currency, status)
    values(new.mentor_id, new.id, coalesce(new.amount,0), 0, coalesce(new.amount,0), coalesce(new.currency,'INR'), 'pending')
    on conflict (booking_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_booking_completed_starfix on public.bookings;
create trigger trg_booking_completed_starfix
after update of status on public.bookings
for each row execute function public.on_booking_completed();

revoke all on function public.on_booking_created() from public, anon, authenticated;
revoke all on function public.on_booking_completed() from public, anon, authenticated;

