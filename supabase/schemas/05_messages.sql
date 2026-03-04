-- =============================================================================
-- CoupleGoAI — Messages
-- =============================================================================
-- Stores all AI conversation messages: both the main "AI Chat" feature and the
-- onboarding conversational flow. Differentiated by conversation_type.
--
-- Each message belongs to a single user. Partners cannot see each other's chats.
-- The AI (assistant) replies are stored alongside user messages.
-- =============================================================================

create table public.messages (
  id                uuid                    not null default gen_random_uuid(),
  user_id           uuid                    not null references public.profiles(id) on delete cascade,
  role              public.message_role     not null,
  content           text                    not null,
  conversation_type public.conversation_type not null default 'chat',
  created_at        timestamptz             not null default now(),

  primary key (id)
);

-- Primary query pattern: paginated messages per user, newest first.
create index idx_messages_user_created on public.messages (user_id, created_at desc);

-- Filter by conversation type for onboarding vs. regular chat.
create index idx_messages_user_type on public.messages (user_id, conversation_type, created_at desc);

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table public.messages enable row level security;

-- Users can read only their own messages (chat is private).
create policy "Users can view own messages"
  on public.messages for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- Users can insert messages attributed to themselves.
create policy "Users can insert own messages"
  on public.messages for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- No update or delete in MVP — messages are immutable once created.
