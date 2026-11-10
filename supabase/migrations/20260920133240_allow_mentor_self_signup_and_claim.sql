-- A newly signed-up mentor can create their own fresh listing...
create policy "Users can create their own mentor listing" on public.mentors
  for insert with check (auth.uid() = profile_id);

-- ...or claim a pre-seeded, still-unclaimed catalog row, but only one
-- whose email matches their own authenticated email (never an arbitrary
-- unclaimed row), and only by setting profile_id to themselves.
create policy "Users can claim an unclaimed listing matching their email" on public.mentors
  for update
  using (profile_id is null and email = (auth.jwt() ->> 'email'))
  with check (auth.uid() = profile_id);
