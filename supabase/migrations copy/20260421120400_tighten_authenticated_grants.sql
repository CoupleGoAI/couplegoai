-- Tighten write grants for the `authenticated` role on tables where clients
-- have no legitimate write path.
--
-- Why this is needed:
--   20260421120000 revoked all grants from `anon`, but left `authenticated`
--   with full CRUD + TRUNCATE on the memory tables and rate_limits. RLS
--   blocks row-level SELECT/UPDATE/DELETE for the wrong user, but TRUNCATE
--   bypasses row-level security entirely in PostgreSQL — any authenticated
--   client can wipe the whole table.
--
--   rate_limits has RLS enabled with NO policies, making it an open read/
--   write surface for all authenticated clients. The table is accessed
--   exclusively via the check_rate_limit() SECURITY DEFINER function, so
--   clients need no direct grants.

-- user_memory: keep SELECT (users read their own memory via RLS);
-- remove all write paths — edge functions use service_role which bypasses
-- RLS and is unaffected by this revoke.
revoke insert, update, delete, truncate
    on table public.user_memory
    from authenticated;

-- couple_memory: same rationale.
revoke insert, update, delete, truncate
    on table public.couple_memory
    from authenticated;

-- rate_limits: fully client-opaque; accessed only by SECURITY DEFINER RPCs.
-- Remove all client access.
revoke all privileges
    on table public.rate_limits
    from authenticated;
