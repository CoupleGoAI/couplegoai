-- Defense-in-depth trigger for couple dissolution.
-- Fires AFTER UPDATE on couples when is_active transitions true → false.
-- Cleans up game state and couple_memory so no stale sensitive data lingers.
-- The pairing-disconnect edge function does the same cleanup; this trigger
-- handles admin-side or future code paths that set is_active directly.

create or replace function public._on_couple_deactivated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.is_active = true and new.is_active = false then
    -- Cancel pending game invitations.
    delete from public.game_invitations
      where couple_id = new.id and status = 'pending';

    -- Cancel active/waiting game sessions.
    update public.game_sessions
      set status = 'cancelled',
          cancelled_at = now()
      where couple_id = new.id
        and status in ('waiting', 'active');

    -- Wipe shared couple memory — no longer a couple.
    delete from public.couple_memory where couple_id = new.id;
  end if;
  return new;
end;
$$;

revoke execute on function public._on_couple_deactivated() from public, anon, authenticated;

drop trigger if exists on_couple_deactivated on public.couples;

create trigger on_couple_deactivated
  after update on public.couples
  for each row
  execute function public._on_couple_deactivated();
