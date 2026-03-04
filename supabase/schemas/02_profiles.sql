-- =============================================================================
-- CoupleGoAI — Profiles
-- =============================================================================
-- Public profile for every authenticated user. References auth.users (Supabase
-- Auth) as the single source of identity. Created automatically via trigger on
-- auth.users insert (see 06_functions.sql).
--
-- couple_id FK is added in 03_couples.sql after the couples table exists.
-- =============================================================================

create table public.profiles (
  id                    uuid        not null references auth.users(id) on delete cascade,
  email                 text        not null,
  name                  text,
  age_range             text,
  avatar_url            text,
  onboarding_completed  boolean     not null default false,
  couple_id             uuid,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),

  primary key (id)
);

-- Index for looking up profiles by couple.
create index idx_profiles_couple_id on public.profiles (couple_id)
  where couple_id is not null;

-- Auto-update updated_at on every row change.
create trigger handle_profiles_updated_at
  before update on public.profiles
  for each row
  execute procedure extensions.moddatetime(updated_at);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;

-- Users can read their own profile.
create policy "Users can view own profile"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = id );

-- Users can read their partner's profile (same couple).
create policy "Users can view partner profile"
  on public.profiles for select
  to authenticated
  using (
    couple_id is not null
    and couple_id = (
      select p.couple_id
      from public.profiles p
      where p.id = (select auth.uid())
    )
  );

-- Users can insert their own profile (used by the trigger / edge-cases).
create policy "Users can insert own profile"
  on public.profiles for insert
  to authenticated
  with check ( (select auth.uid()) = id );

-- Users can update their own profile only.
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using  ( (select auth.uid()) = id )
  with check ( (select auth.uid()) = id );
