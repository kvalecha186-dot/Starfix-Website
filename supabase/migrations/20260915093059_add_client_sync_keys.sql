alter table public.saved_items add column if not exists external_id text;
alter table public.watch_queue add column if not exists external_id text;
alter table public.notifications add column if not exists external_id text;
alter table public.xp_transactions add column if not exists external_id text;
create unique index if not exists saved_items_user_external_id_uidx on public.saved_items(user_id, external_id) where external_id is not null;
create unique index if not exists watch_queue_user_external_id_uidx on public.watch_queue(user_id, external_id) where external_id is not null;
create unique index if not exists notifications_user_external_id_uidx on public.notifications(user_id, external_id) where external_id is not null;
create unique index if not exists xp_transactions_user_external_id_uidx on public.xp_transactions(user_id, external_id) where external_id is not null;
