
create or replace function public.ensure_default_mentor_session_types()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.session_types where mentor_id = new.id) then
    insert into public.session_types(mentor_id,title,description,duration_minutes,price,currency,active)
    values
      (new.id, '1:1 Mentorship Session', 'Focused guidance, progress review, and next-step planning.', 45, 0, 'INR', true),
      (new.id, 'Deep Dive / Review', 'Detailed review of a project, topic, portfolio, or interview preparation.', 60, 0, 'INR', true),
      (new.id, 'Career Strategy', 'Career direction, roadmap, positioning, and action plan.', 45, 0, 'INR', true);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_default_mentor_session_types on public.mentors;
create trigger trg_default_mentor_session_types
after insert or update of profile_id on public.mentors
for each row execute function public.ensure_default_mentor_session_types();

revoke all on function public.ensure_default_mentor_session_types() from public, anon, authenticated;

