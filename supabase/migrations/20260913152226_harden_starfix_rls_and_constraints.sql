-- Prevent duplicate progress rows and duplicate conversations/booked slots.
create unique index if not exists user_progress_user_path_unique on public.user_progress(user_id, path_id);
create unique index if not exists milestone_progress_user_milestone_unique on public.milestone_progress(user_id, milestone_id);
create unique index if not exists conversations_student_mentor_unique on public.conversations(student_id, mentor_id);
create unique index if not exists bookings_availability_unique on public.bookings(availability_id) where availability_id is not null;

-- Never allow a normal learner to promote themselves to mentor/admin by editing profiles.role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is null or auth.uid() <> old.id then
      return new;
    end if;
    if not public.is_admin() then
      new.role := old.role;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute function public.protect_profile_role();

-- is_admin is called by RLS policies but must not be callable anonymously.
revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Password protection is configured in Auth settings rather than SQL; keep this migration focused on database safety.
