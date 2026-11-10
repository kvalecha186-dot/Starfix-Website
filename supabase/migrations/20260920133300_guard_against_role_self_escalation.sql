-- The existing "Users can update their own profile" RLS policy is
-- row-scoped (auth.uid() = id), not column-scoped, so without this guard
-- a user could set their own role to 'admin' directly via a raw update.
-- A student self-upgrading to 'mentor' during onboarding is fine and
-- expected; anything ending in 'admin' must be blocked unless the actor
-- already is an admin.
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and new.role = 'admin' and not public.is_admin() then
    raise exception 'Only an existing admin can grant the admin role.';
  end if;
  return new;
end;
$$;

create trigger guard_profile_role_change_trigger
  before update on public.profiles
  for each row
  execute function public.guard_profile_role_change();
