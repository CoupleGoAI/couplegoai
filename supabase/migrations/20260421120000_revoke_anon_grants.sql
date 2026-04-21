-- Revoke all grants from the `anon` role on every sensitive table.
-- Rationale: the original migration granted full CRUD + TRUNCATE on these
-- tables to `anon`. RLS policies currently block reads in practice, but the
-- grants themselves are a defense-in-depth failure. With grants removed, a
-- future RLS regression cannot escalate into a data exposure.
--
-- `authenticated` keeps the permissions it needs; RLS still filters per-user.

revoke all privileges on table public.couples from anon;
revoke all privileges on table public.messages from anon;
revoke all privileges on table public.pairing_tokens from anon;
revoke all privileges on table public.profiles from anon;
revoke all privileges on table public.rate_limits from anon;
revoke all privileges on table public.user_memory from anon;
revoke all privileges on table public.couple_memory from anon;

-- Policy for all future tables: disallow anon by default. Any new table
-- that needs anon access must explicitly grant it. Note: this statement
-- only affects grants created by the role that runs this migration going
-- forward, not retroactively — the explicit revokes above still matter.
alter default privileges in schema public revoke all on tables from anon;
