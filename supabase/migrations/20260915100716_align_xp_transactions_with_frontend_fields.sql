alter table public.xp_transactions
  add column category text,
  add column task_key text,
  add column settled boolean not null default true;
