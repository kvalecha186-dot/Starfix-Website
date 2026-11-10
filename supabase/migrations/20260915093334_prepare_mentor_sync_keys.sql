alter table public.mentors add column if not exists legacy_id integer;
alter table public.bookings add column if not exists external_id text;
alter table public.conversations add column if not exists external_id text;
alter table public.messages add column if not exists external_id text;
create unique index if not exists mentors_legacy_id_uidx on public.mentors(legacy_id) where legacy_id is not null;
create unique index if not exists bookings_user_external_id_uidx on public.bookings(student_id, external_id) where external_id is not null;
create unique index if not exists conversations_user_mentor_uidx on public.conversations(student_id, mentor_id);
create unique index if not exists conversations_user_external_id_uidx on public.conversations(student_id, external_id) where external_id is not null;
create unique index if not exists messages_conversation_external_id_uidx on public.messages(conversation_id, external_id) where external_id is not null;
