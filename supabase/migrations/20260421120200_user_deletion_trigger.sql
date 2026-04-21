-- Right-to-erasure: a single RPC that removes every trace of a user across
-- every table, plus a trigger on auth.users deletion that mops up rows that
-- the cascade chain does not already own.
--
-- Why both an RPC and a trigger:
--   - `delete_user_data(uid)` is the user-facing path. It is invoked by the
--     `account-delete` edge function after JWT verification, runs with
--     SECURITY DEFINER privileges, and is atomic.
--   - `on_auth_user_deleted` handles back-door deletions (Supabase dashboard,
--     admin scripts, future auth migrations). It cannot assume any caller
--     context and only cleans up what cascades do not already cover.

-- ─── Cleanup helper: wipe couple-chat rows that a partner's delete would
--     orphan.  Today: `messages.user_id → profiles.id on delete cascade`
--     removes the deleted user's rows, but the PARTNER's couple_chat rows
--     remain — a one-sided conversation log is still sensitive. So when a
--     user is deleted we also scrub the partner-side couple_chat rows for
--     every couple that user was in. ─────────────────────────────────────

create or replace function public._wipe_couple_chat_for_user(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_couple record;
begin
    for v_couple in
        select id, partner1_id, partner2_id
        from public.couples
        where partner1_id = p_uid or partner2_id = p_uid
    loop
        -- Delete the *other* partner's couple_chat + couple_setup rows
        -- that were part of this shared conversation.
        delete from public.messages
        where conversation_type in ('couple_chat', 'couple_setup')
          and user_id in (v_couple.partner1_id, v_couple.partner2_id);
    end loop;
end;
$$;

revoke execute on function public._wipe_couple_chat_for_user(uuid) from public, anon, authenticated;

-- ─── Full erasure RPC ────────────────────────────────────────────────────────
create or replace function public.delete_user_data(p_uid uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Defensive: refuse to delete anything if caller is not the user or
    -- an elevated role. SECURITY DEFINER runs with function owner perms,
    -- so we must guard here.
    if auth.uid() is not null and auth.uid() <> p_uid then
        raise exception 'forbidden';
    end if;

    -- 1. Wipe partner-side couple_chat rows (done before deleting the
    --    user, so we can still read their couples rows).
    perform public._wipe_couple_chat_for_user(p_uid);

    -- 2. Remove memory corrections created by this user.
    delete from public.memory_corrections where created_by = p_uid;

    -- 3. Delete the auth user. This cascades via:
    --      auth.users → profiles → (messages, user_memory, couples, pairing_tokens)
    --      couples → couple_memory
    delete from auth.users where id = p_uid;
end;
$$;

-- Only authenticated users may invoke this RPC on themselves (guarded in
-- body by the auth.uid() check).
revoke execute on function public.delete_user_data(uuid) from public, anon;
grant execute on function public.delete_user_data(uuid) to authenticated;

-- ─── on_auth_user_deleted trigger ────────────────────────────────────────────
-- Fires after the auth row is removed (including admin-initiated deletes
-- that skip delete_user_data). Because the profile row is already gone by
-- then via cascade, we use the OLD.id from the auth trigger.

create or replace function public._on_auth_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    -- Scrub partner-side couple rows (may already be gone via cascade if
    -- delete_user_data ran, in which case this is a no-op).
    perform public._wipe_couple_chat_for_user(old.id);
    -- Nuke any memory corrections the user authored.
    delete from public.memory_corrections where created_by = old.id;
    return old;
end;
$$;

drop trigger if exists on_auth_user_deleted on auth.users;

create trigger on_auth_user_deleted
    after delete on auth.users
    for each row
    execute function public._on_auth_user_deleted();
