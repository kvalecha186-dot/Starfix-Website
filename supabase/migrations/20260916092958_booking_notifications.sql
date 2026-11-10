create or replace function public.create_student_booking(
  p_mentor_id uuid,
  p_session_type_id uuid default null,
  p_availability_id uuid default null,
  p_scheduled_start timestamptz default null,
  p_scheduled_end timestamptz default null,
  p_amount numeric default 0,
  p_currency text default 'INR',
  p_external_id text default null,
  p_mentor_num integer default null,
  p_mentor_name text default null,
  p_mentor_title text default null,
  p_mentor_company text default null,
  p_mentor_color text default null,
  p_mentor_initials text default null,
  p_session_type text default null,
  p_duration text default null,
  p_price text default null,
  p_booking_date text default null,
  p_booking_time text default null
)
returns public.bookings
language plpgsql security definer set search_path = public
as $$
declare v_booking public.bookings; v_user uuid := auth.uid(); v_availability public.mentor_availability;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_mentor_id is null then raise exception 'Mentor is required'; end if;
  if p_availability_id is not null then
    select * into v_availability from public.mentor_availability where id=p_availability_id and mentor_id=p_mentor_id for update;
    if not found then raise exception 'Availability slot not found'; end if;
    if v_availability.status <> 'available' then raise exception 'This slot is no longer available'; end if;
    p_scheduled_start := coalesce(p_scheduled_start,v_availability.start_at);
    p_scheduled_end := coalesce(p_scheduled_end,v_availability.end_at);
    update public.mentor_availability set status='booked' where id=p_availability_id;
  end if;
  if p_scheduled_start is not null and exists(select 1 from public.bookings where mentor_id=p_mentor_id and scheduled_start=p_scheduled_start and status in ('pending','confirmed')) then raise exception 'This mentor slot is already booked'; end if;
  insert into public.bookings(student_id,mentor_id,session_type_id,availability_id,scheduled_start,scheduled_end,amount,currency,status,external_id,mentor_num,mentor_name,mentor_title,mentor_company,mentor_color,mentor_initials,session_type,duration,price,booking_date,booking_time)
  values(v_user,p_mentor_id,p_session_type_id,p_availability_id,p_scheduled_start,p_scheduled_end,coalesce(p_amount,0),coalesce(p_currency,'INR'),'confirmed',p_external_id,p_mentor_num,p_mentor_name,p_mentor_title,p_mentor_company,p_mentor_color,p_mentor_initials,p_session_type,p_duration,p_price,p_booking_date,p_booking_time)
  returning * into v_booking;
  insert into public.notifications(user_id,type,title,message,read,external_id) values(v_user,'booking_confirmed','Session booked',coalesce(p_session_type,'Mentorship session') || ' with ' || coalesce(p_mentor_name,'your mentor') || ' is confirmed.',false,'booking:' || v_booking.id::text) on conflict do nothing;
  return v_booking;
exception when unique_violation then raise exception 'This mentor slot is already booked';
end;
$$;
revoke execute on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) from public,anon;
grant execute on function public.create_student_booking(uuid,uuid,uuid,timestamptz,timestamptz,numeric,text,text,integer,text,text,text,text,text,text,text,text,text,text) to authenticated;
