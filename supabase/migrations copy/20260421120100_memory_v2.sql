-- Memory v2 — evolve user_memory and couple_memory from naive "single blob"
-- rows into a richer structure that supports rolling episodic summaries,
-- scheduled (out-of-band) summarisation with a message watermark, and
-- auditable corrections.
--
-- What we do NOT add in this migration (deferred; see plan §Further
-- Considerations #1):
--   - pgvector / embeddings. We ship structured summary + rolling episodes
--     first. Retrieval stays deterministic (always inject summary + recent
--     episodes) until corpus size justifies vector search.
--
-- All new columns are nullable or have defaults, so existing rows remain
-- valid without a data migration.

-- ─── user_memory ─────────────────────────────────────────────────────────────

alter table public.user_memory
    add column if not exists recent_episodes jsonb not null default '[]'::jsonb,
    add column if not exists version integer not null default 1,
    add column if not exists updated_by text not null default 'inline',
    add column if not exists last_summarized_message_id uuid;

-- Constrain updated_by to a small enum of known writers.
do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'user_memory_updated_by_check'
    ) then
        alter table public.user_memory
            add constraint user_memory_updated_by_check
            check (updated_by in ('inline', 'scheduled', 'manual_correction'));
    end if;
end $$;

-- ─── couple_memory ───────────────────────────────────────────────────────────

alter table public.couple_memory
    add column if not exists recent_episodes jsonb not null default '[]'::jsonb,
    add column if not exists version integer not null default 1,
    add column if not exists updated_by text not null default 'inline',
    add column if not exists last_summarized_message_id uuid;

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'couple_memory_updated_by_check'
    ) then
        alter table public.couple_memory
            add constraint couple_memory_updated_by_check
            check (updated_by in ('inline', 'scheduled', 'manual_correction'));
    end if;
end $$;

-- ─── memory_corrections ──────────────────────────────────────────────────────
-- User-authored corrections to their own memory. Applied by the
-- memory-summarize function on next run: it reads unapplied corrections,
-- merges their intent into the summary/traits, and sets applied_at.

create table if not exists public.memory_corrections (
    id uuid primary key default gen_random_uuid(),
    scope text not null check (scope in ('user', 'couple')),
    owner_id uuid not null,
    -- Optional pointer to the specific episode or trait being corrected.
    target_kind text check (target_kind in ('summary', 'trait', 'episode')),
    target_key text,
    -- User-authored natural language instruction, e.g. "I'm not single anymore".
    instruction text not null check (length(instruction) between 1 and 500),
    created_by uuid not null references public.profiles(id) on delete cascade,
    created_at timestamp with time zone not null default now(),
    applied_at timestamp with time zone
);

create index if not exists idx_memory_corrections_pending
    on public.memory_corrections (scope, owner_id)
    where applied_at is null;

alter table public.memory_corrections enable row level security;

-- User may read / insert corrections for their own memory.
create policy "Users can read own corrections"
    on public.memory_corrections
    for select
    using (
        (scope = 'user' and owner_id = auth.uid() and created_by = auth.uid())
        or (
            scope = 'couple'
            and created_by = auth.uid()
            and owner_id in (
                select id from public.couples
                where (partner1_id = auth.uid() or partner2_id = auth.uid())
                  and is_active = true
            )
        )
    );

create policy "Users can insert own corrections"
    on public.memory_corrections
    for insert
    with check (
        created_by = auth.uid()
        and (
            (scope = 'user' and owner_id = auth.uid())
            or (
                scope = 'couple'
                and owner_id in (
                    select id from public.couples
                    where (partner1_id = auth.uid() or partner2_id = auth.uid())
                      and is_active = true
                )
            )
        )
    );

-- Lock out anon explicitly.
revoke all privileges on table public.memory_corrections from anon;
