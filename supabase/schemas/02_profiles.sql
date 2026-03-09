-- =============================================================================
-- CoupleGoAI — Profiles
-- =============================================================================
-- Public user profile, linked 1:1 to auth.users. Auto-created by the
-- handle_new_user() trigger in 06_functions.sql.
--
-- Onboarding fields (name, birth_date, dating_start_date, help_focus) start
-- NULL and are populated step-by-step by the onboarding-chat edge function.
-- =============================================================================

create table public.profiles (
  id                    uuid        not null references auth.users(id) on delete cascade,
  email                 text        not null,
  name                  text,
  birth_date            date,
  dating_start_date     date,
  help_focus            text,
  avatar_url            text,
  onboarding_completed  boolean     not null default false,
  couple_id             uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  primary key (id)
);

-- Fast lookup by couple membership.
create index idx_profiles_couple_id on public.profiles (couple_id)
  where couple_id is not null;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read their own profile.
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- NOTE: "Users can view partner profile" policy lives in 03_couples.sql
-- because it references public.couples which does not exist yet.

-- Insert is intentionally omitted — profiles are created exclusively by the
-- handle_new_user() trigger (security definer), never directly from the client.

-- Users can update their own profile.
-- couple_id is excluded from client updates — pairing is managed server-side
-- via the pairing flow (service role), so we ensure it cannot be changed here.
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = id )
  with check (
    (select auth.uid()) = id
    and couple_id is not distinct from (
      select couple_id from public.profiles where id = (select auth.uid())
    )
  );

-- ── Auto-update updated_at ──────────────────────────────────────────────────

create trigger handle_updated_at
  before update on public.profiles
  for each row
  execute procedure extensions.moddatetime(updated_at);