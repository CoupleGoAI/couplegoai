-- =============================================================================
-- CoupleGoAI — Pairing Tokens
-- =============================================================================
-- Short-lived tokens for QR-based partner connection. A user generates a token
-- (displayed as QR), the partner scans it. Token expires after 5 minutes.
-- Managed by the backend service role; clients only read their own tokens.
-- =============================================================================

create table public.pairing_tokens (
  id          uuid        not null default gen_random_uuid(),
  creator_id  uuid        not null references public.profiles(id) on delete cascade,
  token       text        not null,
  expires_at  timestamptz not null,
  used        boolean     not null default false,
  used_by     uuid        references public.profiles(id) on delete set null,
  couple_id   uuid        references public.couples(id) on delete set null,
  created_at  timestamptz not null default now(),

  primary key (id),
  constraint pairing_tokens_token_unique unique (token)
);

-- Fast lookup when scanning a QR code.
create index idx_pairing_tokens_token on public.pairing_tokens (token)
  where used = false;

-- Find tokens created by a specific user.
create index idx_pairing_tokens_creator on public.pairing_tokens (creator_id);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.pairing_tokens enable row level security;

-- Users can view tokens they created (to display QR / check status).
create policy "Users can view own tokens"
  on public.pairing_tokens for select
  to authenticated
  using ( (select auth.uid()) = creator_id );

-- Token creation, usage, and validation happen server-side (service role).
-- No direct insert/update/delete from client.
