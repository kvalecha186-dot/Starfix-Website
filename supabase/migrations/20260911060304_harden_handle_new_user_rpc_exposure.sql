-- The trigger itself doesn't need anon/authenticated EXECUTE grants to
-- fire (Postgres triggers run regardless of the invoking role's grants).
-- Revoking these just closes the direct /rest/v1/rpc/handle_new_user
-- entry point that shouldn't have existed.
revoke execute on function public.handle_new_user() from anon, authenticated;
