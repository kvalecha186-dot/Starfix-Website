-- The previous migration revoked from anon/authenticated directly, but the
-- actual grant was on the PUBLIC pseudo-role, which anon/authenticated
-- inherit from — so it had no effect. Revoking from PUBLIC is the fix.
revoke execute on function public.handle_new_user() from public;
