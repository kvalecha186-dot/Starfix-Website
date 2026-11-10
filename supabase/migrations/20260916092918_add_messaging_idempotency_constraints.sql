create unique index if not exists conversations_student_mentor_uidx on public.conversations (student_id, mentor_id);
create unique index if not exists messages_conversation_external_uidx on public.messages (conversation_id, external_id) where external_id is not null;
create unique index if not exists mentors_legacy_id_uidx on public.mentors (legacy_id) where legacy_id is not null;
create unique index if not exists session_types_mentor_title_uidx on public.session_types (mentor_id, title);
