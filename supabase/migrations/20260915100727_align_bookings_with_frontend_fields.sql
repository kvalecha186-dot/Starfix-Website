-- The frontend's Booking is a flat, display-ready record (mentor name/
-- title/company/color already denormalized in, free-text session type/
-- duration/price/date/time) rather than the fully-relational shape this
-- table originally assumed. Loosening the FK/timestamp columns to
-- nullable (rather than dropping them) keeps the door open for a future
-- fully-relational booking flow, while making the flat shape the code
-- actually sends insertable today. Table is empty — zero data risk.
alter table public.bookings
  alter column mentor_id drop not null,
  alter column session_type_id drop not null,
  alter column scheduled_start drop not null,
  alter column scheduled_end drop not null,
  add column mentor_num integer,
  add column mentor_name text,
  add column mentor_title text,
  add column mentor_company text,
  add column mentor_color text,
  add column mentor_initials text,
  add column session_type text,
  add column duration text,
  add column price text,
  add column booking_date text,
  add column booking_time text,
  add column notes text;
