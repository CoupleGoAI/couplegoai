-- =============================================================================
-- Enable Supabase Realtime on profiles
-- =============================================================================
-- Required so that GenerateQRScreen can subscribe to UPDATE events on the
-- current user's own profile row and detect when couple_id is set by the
-- pairing-connect edge function (i.e. when the partner scans the QR code).
--
-- REPLICA IDENTITY FULL ensures the full row (including couple_id) is
-- available in change-event payloads for UPDATE events, not only the PK.
-- =============================================================================

alter table public.profiles replica identity full;

-- Add profiles to the Supabase Realtime publication when it lists tables
-- explicitly (non-FOR-ALL-TABLES mode).  On Supabase Cloud the publication is
-- usually FOR ALL TABLES, so this block is intentionally a no-op there.
do $$
begin
  if exists (
    select 1
    from pg_publication
    where pubname = 'supabase_realtime'
      and puballtables = false
  ) then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'profiles'
    ) then
      execute 'alter publication supabase_realtime add table public.profiles';
    end if;
  end if;
end $$;
