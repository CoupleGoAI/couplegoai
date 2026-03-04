-- =============================================================================
-- CoupleGoAI — Couples
-- =============================================================================
-- Represents a partner connection. Only one active couple per user at a time.
-- Either partner can disconnect (is_active → false, disconnected_at set).
-- =============================================================================

create table public.couples (
  id              uuid        not null default gen_random_uuid(),
  partner1_id     uuid        not null references public.profiles(id) on delete cascade,
  partner2_id     uuid        not null references public.profiles(id) on delete cascade,
  is_active       boolean     not null default true,
  created_at      timestamptz not null default now(),
  disconnected_at timestamptz,

  primary key (id),
  constraint couples_partners_different check (partner1_id <> partner2_id)
);

-- Quickly find couples by either partner.
create index idx_couples_partner1 on public.couples (partner1_id) where is_active = true;
create index idx_couples_partner2 on public.couples (partner2_id) where is_active = true;

-- ── FK from profiles → couples (deferred to avoid circular dependency) ──────

alter table public.profiles
  add constraint profiles_couple_id_fkey
  foreign key (couple_id)
  references public.couples(id)
  on delete set null;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.couples enable row level security;

-- A user can view their own couple record.
create policy "Users can view own couple"
  on public.couples for select
  to authenticated
  using (
    (select auth.uid()) in (partner1_id, partner2_id)
  );

-- Couples are created by the backend (service role) during pairing flow.
-- No direct insert/update/delete from client.
