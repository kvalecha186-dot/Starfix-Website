do $$
declare
  r record;
  q text;
  c text;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname='public'
      and (coalesce(qual,'') like '%auth.uid()%'
        or coalesce(qual,'') like '%auth.jwt()%'
        or coalesce(with_check,'') like '%auth.uid()%'
        or coalesce(with_check,'') like '%auth.jwt()%')
  loop
    q := case when r.qual is null then null else regexp_replace(regexp_replace(r.qual, 'auth\.uid\(\)', '(select auth.uid())', 'g'), 'auth\.jwt\(\)', '(select auth.jwt())', 'g') end;
    c := case when r.with_check is null then null else regexp_replace(regexp_replace(r.with_check, 'auth\.uid\(\)', '(select auth.uid())', 'g'), 'auth\.jwt\(\)', '(select auth.jwt())', 'g') end;
    if q is not null and c is not null then
      execute format('alter policy %I on %I.%I using (%s) with check (%s)', r.policyname, r.schemaname, r.tablename, q, c);
    elsif q is not null then
      execute format('alter policy %I on %I.%I using (%s)', r.policyname, r.schemaname, r.tablename, q);
    elsif c is not null then
      execute format('alter policy %I on %I.%I with check (%s)', r.policyname, r.schemaname, r.tablename, c);
    end if;
  end loop;
end $$;
