-- One conversation per (student, mentor) pair.
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid not null references public.mentors(id) on delete cascade,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (student_id, mentor_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender text not null check (sender in ('user','mentor')),
  body text not null,
  status text not null default 'sent' check (status in ('sent','delivered','seen')),
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- A conversation is visible to its student or its mentor, nobody else.
create policy "Student can view own conversations" on public.conversations
  for select using (auth.uid() = student_id);
create policy "Mentor can view own conversations" on public.conversations
  for select using (auth.uid() = (select profile_id from public.mentors where id = mentor_id));
create policy "Student can start a conversation" on public.conversations
  for insert with check (auth.uid() = student_id);
create policy "Participants can update conversation (e.g. archive)" on public.conversations
  for update using (
    auth.uid() = student_id
    or auth.uid() = (select profile_id from public.mentors where id = mentor_id)
  );

create policy "Participants can view messages" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.student_id or auth.uid() = (select profile_id from public.mentors where id = c.mentor_id))
    )
  );
create policy "Participants can send messages as themselves" on public.messages
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (
          (sender = 'user' and auth.uid() = c.student_id)
          or (sender = 'mentor' and auth.uid() = (select profile_id from public.mentors where id = c.mentor_id))
        )
    )
  );
create policy "Participants can update message status" on public.messages
  for update using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (auth.uid() = c.student_id or auth.uid() = (select profile_id from public.mentors where id = c.mentor_id))
    )
  );
