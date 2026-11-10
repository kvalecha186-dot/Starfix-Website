
create or replace function public.refresh_mentor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare target_mentor uuid;
begin
  target_mentor := coalesce(new.mentor_id, old.mentor_id);
  update public.mentors m
  set rating = coalesce((select round(avg(r.rating)::numeric, 2) from public.reviews r where r.mentor_id = target_mentor), 0),
      total_reviews = (select count(*) from public.reviews r where r.mentor_id = target_mentor)
  where m.id = target_mentor;
  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_refresh_mentor_rating on public.reviews;
create trigger trg_refresh_mentor_rating
after insert or update or delete on public.reviews
for each row execute function public.refresh_mentor_rating();

revoke all on function public.refresh_mentor_rating() from public, anon, authenticated;

