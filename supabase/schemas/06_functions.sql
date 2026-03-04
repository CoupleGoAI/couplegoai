-- =============================================================================
-- CoupleGoAI — Functions & Triggers
-- =============================================================================
-- Database functions that support the application logic.
-- =============================================================================

-- ── Auto-create profile on sign-up ──────────────────────────────────────────
-- When a new user registers via Supabase Auth, automatically insert a
-- corresponding row into public.profiles. This runs as security definer so it
-- has the necessary permissions regardless of RLS.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email)
  values (
    new.id,
    new.email
  );
  return new;
end;
$$;

-- Fire after every new auth.users row.
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- ── Helper: check if current user is in a couple ────────────────────────────
-- Useful in RLS policies and API logic. Returns the couple_id or NULL.

create or replace function public.get_my_couple_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select couple_id
  from public.profiles
  where id = auth.uid();
$$;

-- ── Helper: get partner's profile id ────────────────────────────────────────
-- Returns the partner's user id for the authenticated user, or NULL if unpaired.

create or replace function public.get_partner_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select
    case
      when c.partner1_id = auth.uid() then c.partner2_id
      when c.partner2_id = auth.uid() then c.partner1_id
      else null
    end
  from public.profiles p
  join public.couples c on c.id = p.couple_id and c.is_active = true
  where p.id = auth.uid();
$$;
