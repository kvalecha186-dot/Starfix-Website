create or replace function public.prevent_profile_role_self_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.uid() is not null
     and auth.uid() = old.id
     and new.role is distinct from old.role then
    raise exception 'Profile role changes must be performed by an authorized administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists prevent_profile_role_self_change on public.profiles;
create trigger prevent_profile_role_self_change
before update of role on public.profiles
for each row execute function public.prevent_profile_role_self_change();
