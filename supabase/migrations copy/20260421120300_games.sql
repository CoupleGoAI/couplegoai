-- Games tables. These are referenced by game-* edge functions and the
-- client's gamesApi.ts / gameRealtime.ts / insightsApi.ts but had no
-- migration. Creating them now, with tight RLS scoped to couple membership.
--
-- Write policies: the authenticated role may only SELECT. All writes flow
-- through edge functions (service_role). This avoids any risk that a
-- client-side Supabase query bypasses the membership checks the functions
-- enforce.
--
-- Read policies: a user may read rows whose couple they belong to. For
-- rounds/answers/players, membership is derived via a join to
-- game_sessions.

-- Helper: does the current auth.uid() belong to the couple that owns a
-- given session?  Kept as a SECURITY DEFINER function so it can be used
-- inside policies without triggering recursive RLS.
create or replace function public._is_member_of_session_couple(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.game_sessions gs
        join public.couples c on c.id = gs.couple_id
        where gs.id = p_session_id
          and (c.partner1_id = auth.uid() or c.partner2_id = auth.uid())
    );
$$;

-- We reference this function inside policies; it must exist before the
-- policies are declared.  pg allows CREATE POLICY to reference a function
-- that does not yet exist at policy-creation time (resolved at query
-- time), but explicit ordering is safer.

-- ─── game_invitations ────────────────────────────────────────────────────────

create table if not exists public.game_invitations (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid not null references public.couples(id) on delete cascade,
    from_user_id uuid not null references public.profiles(id) on delete cascade,
    to_user_id uuid not null references public.profiles(id) on delete cascade,
    game_type text not null check (game_type in (
        'would_you_rather', 'who_is_more_likely', 'this_or_that', 'never_have_i_ever'
    )),
    category_key text not null check (length(category_key) between 1 and 64),
    status text not null default 'pending' check (status in (
        'pending', 'accepted', 'declined', 'cancelled', 'expired'
    )),
    session_id uuid,
    expires_at timestamp with time zone not null,
    responded_at timestamp with time zone,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_game_invitations_couple_status
    on public.game_invitations (couple_id, status);
create index if not exists idx_game_invitations_to_user
    on public.game_invitations (to_user_id, status);

alter table public.game_invitations enable row level security;

create policy "Couple members can read invitations"
    on public.game_invitations for select
    using (
        couple_id in (
            select id from public.couples
            where partner1_id = auth.uid() or partner2_id = auth.uid()
        )
    );

-- ─── game_sessions ───────────────────────────────────────────────────────────

create table if not exists public.game_sessions (
    id uuid primary key default gen_random_uuid(),
    couple_id uuid not null references public.couples(id) on delete cascade,
    invitation_id uuid references public.game_invitations(id) on delete set null,
    game_type text not null,
    category_key text not null,
    status text not null default 'waiting' check (status in (
        'waiting', 'active', 'completed', 'cancelled'
    )),
    created_by uuid not null references public.profiles(id) on delete cascade,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    last_activity_at timestamp with time zone not null default now(),
    current_round_index integer not null default 0,
    total_rounds integer not null default 0,
    session_seed text,
    created_at timestamp with time zone not null default now()
);

-- Point the invitation FK at the session now that the session table exists.
alter table public.game_invitations
    drop constraint if exists game_invitations_session_id_fkey;
alter table public.game_invitations
    add constraint game_invitations_session_id_fkey
    foreign key (session_id) references public.game_sessions(id) on delete set null;

create index if not exists idx_game_sessions_couple_status
    on public.game_sessions (couple_id, status);
create index if not exists idx_game_sessions_last_activity
    on public.game_sessions (last_activity_at desc);

alter table public.game_sessions enable row level security;

create policy "Couple members can read sessions"
    on public.game_sessions for select
    using (
        couple_id in (
            select id from public.couples
            where partner1_id = auth.uid() or partner2_id = auth.uid()
        )
    );

-- ─── game_session_players ────────────────────────────────────────────────────

create table if not exists public.game_session_players (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.game_sessions(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    state text not null default 'playing' check (state in (
        'playing', 'left', 'idle'
    )),
    last_seen_at timestamp with time zone not null default now(),
    created_at timestamp with time zone not null default now(),
    unique (session_id, user_id)
);

create index if not exists idx_game_session_players_session
    on public.game_session_players (session_id);

alter table public.game_session_players enable row level security;

create policy "Session members can read players"
    on public.game_session_players for select
    using (public._is_member_of_session_couple(session_id));

-- ─── game_rounds ─────────────────────────────────────────────────────────────

create table if not exists public.game_rounds (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.game_sessions(id) on delete cascade,
    round_index integer not null,
    status text not null default 'pending' check (status in (
        'pending', 'open', 'revealed', 'skipped'
    )),
    prompt_id text not null,
    prompt_payload jsonb not null default '{}'::jsonb,
    category_key text not null,
    started_at timestamp with time zone,
    revealed_at timestamp with time zone,
    created_at timestamp with time zone not null default now(),
    unique (session_id, round_index)
);

create index if not exists idx_game_rounds_session_index
    on public.game_rounds (session_id, round_index);

alter table public.game_rounds enable row level security;

create policy "Session members can read rounds"
    on public.game_rounds for select
    using (public._is_member_of_session_couple(session_id));

-- ─── game_answers ────────────────────────────────────────────────────────────

create table if not exists public.game_answers (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.game_sessions(id) on delete cascade,
    round_id uuid not null references public.game_rounds(id) on delete cascade,
    user_id uuid not null references public.profiles(id) on delete cascade,
    answer_payload jsonb not null default '{}'::jsonb,
    answered_at timestamp with time zone not null default now(),
    unique (round_id, user_id)
);

create index if not exists idx_game_answers_session
    on public.game_answers (session_id);
create index if not exists idx_game_answers_round
    on public.game_answers (round_id);

alter table public.game_answers enable row level security;

-- Read: either the user's own answer OR after the round is revealed, both
-- couple members can see both answers. This mirrors the gameplay rule: you
-- see the other person's answer only after the reveal.
create policy "Answers visible to session members (own always, others after reveal)"
    on public.game_answers for select
    using (
        public._is_member_of_session_couple(session_id)
        and (
            user_id = auth.uid()
            or exists (
                select 1 from public.game_rounds gr
                where gr.id = round_id and gr.status = 'revealed'
            )
        )
    );

-- ─── game_session_results ────────────────────────────────────────────────────

create table if not exists public.game_session_results (
    id uuid primary key default gen_random_uuid(),
    session_id uuid not null references public.game_sessions(id) on delete cascade unique,
    couple_id uuid not null references public.couples(id) on delete cascade,
    game_type text not null,
    category_key text not null,
    summary_payload jsonb not null default '{}'::jsonb,
    compatibility_score integer,
    match_count integer not null default 0,
    round_count integer not null default 0,
    created_at timestamp with time zone not null default now()
);

create index if not exists idx_game_session_results_couple
    on public.game_session_results (couple_id, created_at desc);

alter table public.game_session_results enable row level security;

create policy "Couple members can read results"
    on public.game_session_results for select
    using (
        couple_id in (
            select id from public.couples
            where partner1_id = auth.uid() or partner2_id = auth.uid()
        )
    );

-- ─── Grants ──────────────────────────────────────────────────────────────────
-- Writes exclusively through edge functions (service_role). The
-- authenticated role gets SELECT only; RLS filters per couple.

revoke all privileges on table public.game_invitations from anon;
revoke all privileges on table public.game_sessions from anon;
revoke all privileges on table public.game_session_players from anon;
revoke all privileges on table public.game_rounds from anon;
revoke all privileges on table public.game_answers from anon;
revoke all privileges on table public.game_session_results from anon;

revoke all privileges on table public.game_invitations from authenticated;
revoke all privileges on table public.game_sessions from authenticated;
revoke all privileges on table public.game_session_players from authenticated;
revoke all privileges on table public.game_rounds from authenticated;
revoke all privileges on table public.game_answers from authenticated;
revoke all privileges on table public.game_session_results from authenticated;

grant select on table public.game_invitations to authenticated;
grant select on table public.game_sessions to authenticated;
grant select on table public.game_session_players to authenticated;
grant select on table public.game_rounds to authenticated;
grant select on table public.game_answers to authenticated;
grant select on table public.game_session_results to authenticated;

revoke execute on function public._is_member_of_session_couple(uuid) from public, anon;
grant execute on function public._is_member_of_session_couple(uuid) to authenticated;
