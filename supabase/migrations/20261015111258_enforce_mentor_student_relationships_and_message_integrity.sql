
-- Enforce mentor/student relationship for private mentor artifacts.
create or replace function public.has_mentor_student_relationship(p_mentor_id uuid, p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.bookings b
    where b.mentor_id = p_mentor_id
      and b.student_id = p_student_id
      and lower(b.status) in ('confirmed','completed')
  );
$$;

alter table public.mentor_notes
  add column if not exists visible_to_student boolean not null default false;

drop policy if exists "Student views shared notes" on public.mentor_notes;
create policy "Student views shared notes"
on public.mentor_notes for select to authenticated
using (student_id = (select auth.uid()) and visible_to_student = true);

create or replace function public.guard_mentor_student_artifacts()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_mentor_id uuid;
  v_student_id uuid;
  v_booking_id uuid;
begin
  if public.is_admin() then return new; end if;

  if tg_table_name = 'mentor_notes' then
    v_mentor_id := new.mentor_id; v_student_id := new.student_id;
  elsif tg_table_name = 'mentor_goals' then
    v_mentor_id := new.mentor_id; v_student_id := new.student_id;
  elsif tg_table_name = 'mentor_feedback' then
    v_mentor_id := new.mentor_id; v_student_id := new.student_id;
  elsif tg_table_name = 'shared_resources' then
    v_mentor_id := new.mentor_id; v_student_id := new.student_id;
  elsif tg_table_name = 'session_followups' then
    v_mentor_id := new.mentor_id; v_student_id := new.student_id; v_booking_id := new.booking_id;
  else
    return new;
  end if;

  if auth.uid() is not null then
    if tg_op = 'UPDATE' then
      if tg_table_name = 'mentor_notes' and
         (new.mentor_id is distinct from old.mentor_id or new.student_id is distinct from old.student_id) then
        raise exception 'Mentor note ownership cannot be changed' using errcode = '42501';
      elsif tg_table_name <> 'mentor_notes' and
         (new.mentor_id is distinct from old.mentor_id or new.student_id is distinct from old.student_id) then
        raise exception 'Mentor/student relationship cannot be changed' using errcode = '42501';
      end if;
    end if;

    if not exists (select 1 from public.mentors m where m.id = v_mentor_id and m.profile_id = auth.uid()) then
      raise exception 'Only the owning mentor may manage this record' using errcode = '42501';
    end if;
    if not public.has_mentor_student_relationship(v_mentor_id, v_student_id) then
      raise exception 'A confirmed or completed booking with this student is required' using errcode = '42501';
    end if;
    if v_booking_id is not null and not exists (
      select 1 from public.bookings b
      where b.id = v_booking_id and b.mentor_id = v_mentor_id
        and b.student_id = v_student_id and lower(b.status) in ('confirmed','completed')
    ) then
      raise exception 'Follow-up must reference the same eligible booking' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_mentor_student_artifacts on public.mentor_notes;
create trigger guard_mentor_student_artifacts before insert or update on public.mentor_notes
for each row execute function public.guard_mentor_student_artifacts();
drop trigger if exists guard_mentor_student_artifacts on public.mentor_goals;
create trigger guard_mentor_student_artifacts before insert or update on public.mentor_goals
for each row execute function public.guard_mentor_student_artifacts();
drop trigger if exists guard_mentor_student_artifacts on public.mentor_feedback;
create trigger guard_mentor_student_artifacts before insert or update on public.mentor_feedback
for each row execute function public.guard_mentor_student_artifacts();
drop trigger if exists guard_mentor_student_artifacts on public.shared_resources;
create trigger guard_mentor_student_artifacts before insert or update on public.shared_resources
for each row execute function public.guard_mentor_student_artifacts();
drop trigger if exists guard_mentor_student_artifacts on public.session_followups;
create trigger guard_mentor_student_artifacts before insert or update on public.session_followups
for each row execute function public.guard_mentor_student_artifacts();

-- Conversation participants cannot reassign a conversation to another student or mentor.
create or replace function public.guard_conversation_identity()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
    new.student_id is distinct from old.student_id or
    new.mentor_id is distinct from old.mentor_id
  ) then
    raise exception 'Conversation participants cannot be changed' using errcode = '42501';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_conversation_identity on public.conversations;
create trigger guard_conversation_identity before update on public.conversations
for each row execute function public.guard_conversation_identity();

-- Message participants may update delivery/read status only, not rewrite authorship or content.
create or replace function public.guard_message_updates()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.conversation_id is distinct from old.conversation_id
      or new.sender is distinct from old.sender
      or new.body is distinct from old.body
      or new.created_at is distinct from old.created_at
      or new.external_id is distinct from old.external_id then
      raise exception 'Message content and authorship are immutable' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_message_updates on public.messages;
create trigger guard_message_updates before update on public.messages
for each row execute function public.guard_message_updates();

-- Blocked-date reasons are private to the mentor; public availability is sufficient.
drop policy if exists "Blocked dates are readable" on public.mentor_blocked_dates;

