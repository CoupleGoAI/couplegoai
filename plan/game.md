# Multiplayer Couple Games V1

## Summary
- Rebuild the Play experience around one shared multiplayer engine and four realtime games: `would_you_rather`, `who_is_more_likely`, `this_or_that`, and `never_have_i_ever`.
- Replace the current single-device “pass the phone” flows with server-authoritative invite, session, round, answer, reveal, and results states. Local UI must never be the source of truth for game progression.
- Keep question/category content as versioned typed seed data in the repo, not in Supabase tables for v1. Supabase stores durable invitations, sessions, player state, round manifests, answers, and results/history.
- Ship in-app invite delivery only for v1. Design the schema so push can be added later without changing core tables.
- Remove Love Check-In from the main lineup for this phase. Build the new engine so Love Check-In can be reintroduced later on top of the same system.

## Key Changes

**Product architecture**
- Replace the current game-specific phase machines with one shared multiplayer session model used by all four games.
- Use a generic flow: `hub -> outgoing invite or incoming invite -> lobby/waiting room -> round play -> reveal -> results -> history`.
- Allow only one active pending invite or one active session per couple at a time in v1. This keeps invitation UX, navigation, and conflict handling simple.
- Make the server snapshot authoritative. The client may optimistically lock an answer locally, but every mutation and every realtime event must reconcile from the latest session snapshot.

**Supabase data model**
- Add enums for `game_type`, `game_invitation_status`, `game_session_status`, `game_player_state`, and `game_round_status`.
- Add `game_invitations` with: `id`, `couple_id`, `from_user_id`, `to_user_id`, `game_type`, `category_key`, `status`, `expires_at`, `created_at`, `responded_at`, `session_id`.
- Add `game_sessions` with: `id`, `couple_id`, `invitation_id`, `game_type`, `category_key`, `status`, `created_by`, `started_at`, `completed_at`, `cancelled_at`, `last_activity_at`, `current_round_index`, `total_rounds`, `session_seed`, `version`.
- Add `game_session_players` with: `session_id`, `user_id`, `state`, `joined_at`, `ready_at`, `last_seen_at`, `disconnected_at`.
- Add `game_rounds` with: `id`, `session_id`, `round_index`, `status`, `prompt_id`, `prompt_payload jsonb`, `category_key`, `started_at`, `revealed_at`.
- Add `game_answers` with: `id`, `session_id`, `round_id`, `user_id`, `answer_payload jsonb`, `answered_at`, unique `(round_id, user_id)`.
- Add `game_session_results` with: `session_id`, `couple_id`, `game_type`, `category_key`, `summary_payload jsonb`, `compatibility_score`, `match_count`, `round_count`, `created_at`.
- Add partial unique indexes so a couple cannot have multiple pending invites or multiple active sessions simultaneously.
- Add RLS so only the two partners in the owning couple can read their invitation/session/result rows; all writes happen through server-side functions.

**Server-side mutation API**
- Add a small games service surface with server-owned mutations: `createGameInvitation`, `respondToGameInvitation`, `cancelGameInvitation`, `submitGameAnswer`, `leaveGameSession`, `resumeActiveGame`, `fetchGameHistory`.
- Implement invite/session/answer transitions in edge functions backed by service-role writes and guarded by DB constraints. Use idempotent semantics so repeated taps or duplicate retries do not corrupt state.
- On invite acceptance, generate the full round manifest server-side from the shared typed game catalog and persist it into `game_rounds.prompt_payload`. Persisting the full prompt snapshot avoids breaking old sessions when prompt content changes later.
- On answer submit, write or upsert the player’s answer, then atomically move the round from `open` to `revealed` when both answers exist, or advance the session to `completed` after the last reveal.
- Persist a final `game_session_results` row at completion rather than computing history only on the fly.

**Realtime syncing**
- Subscribe to `game_invitations` by `couple_id` to drive incoming invite banners and pending invite status changes.
- Subscribe to `game_sessions`, `game_session_players`, `game_rounds`, and `game_answers` by `session_id` during an active session.
- Do not patch complex local phase transitions directly from raw realtime payloads. On any relevant insert/update, refetch a single authoritative session snapshot and replace local state.
- Use realtime presence only inside an active session to show “partner is here”, “partner is choosing”, and reconnect hints. Do not build a global online/offline system in v1.
- If the partner is offline, keep the invitation pending for 24 hours or until declined/cancelled. Show it the next time the app is foregrounded.

**Frontend structure**
- Keep the Play tab as the hub, but rebuild it into a richer `GamesScreen` with featured game cards, category chips, partner status, pending invite strip, and recent results strip.
- Replace the three current game screens with a generic multiplayer stack: `GameLobby`, `GameSession`, and `GameResults`. The old routes can stay temporarily as dead-end wrappers during rollout, then be removed.
- Add a dedicated games feature module with a clear split: `domain` for game definitions/content, `data` for Supabase reads/writes, `hooks` for invite/session orchestration, `store` for ephemeral UI state, and `components` for reusable multiplayer surfaces.
- Add a single Zustand `gamesStore` for transient client state: `pendingInvite`, `activeSessionId`, `latestSnapshot`, `pendingAnswer`, `navigationIntent`, `error`. Do not duplicate round logic in the store.
- Mount a global `GameInviteHost` high enough in the authenticated app tree that the user can receive and accept/decline invites from any main-tab screen.

**Public interfaces and types**
- Add `GameType = 'would_you_rather' | 'who_is_more_likely' | 'this_or_that' | 'never_have_i_ever'`.
- Add `GameCategoryKey = 'mixed' | 'fun' | 'romance' | 'home' | 'adventure' | 'values' | 'spicy'`.
- Add `GameInvitation`, `GameSessionSnapshot`, `GameRound`, `GamePlayerState`, `GameAnswerPayload`, and `GameResultSummary` types.
- Change navigation to generic game routes with params: `GameLobby { invitationId?: string; gameType?: GameType; categoryKey?: GameCategoryKey }`, `GameSession { sessionId: string }`, `GameResults { sessionId: string }`.
- Define a shared `GameDefinition` contract per game: metadata, default round count, supported categories, prompt deck builder, answer schema, round resolver, result summarizer, and renderer hooks.

**Game rules and content**
- Use shared category keys across all four games so the hub filters and future analytics stay consistent.
- Use fixed 10-round sessions in v1. Do not add custom round counts yet.
- Use `mixed` as a balanced shuffle across all categories for that game.
- `Would You Rather` and `This or That` use binary answer payloads and compute match rate.
- `Who’s More Likely To` uses a target answer payload and computes agreement rate plus “most picked” patterns for future insights.
- `Never Have I Ever` uses boolean answer payloads and computes overlap counts plus a gentle summary without shamey wording.
- Keep prompt catalogs in shared typed seed files so both app and server can use the same IDs and metadata.

**Screen and UX plan**
- Games hub: richer card art, layered surfaces, category pills, “Start together” CTA, pending invite banner, partner availability hint, and recent game history chips.
- Invite received: slide-up sheet with game art, category, short explanation, inviter avatar, accept/decline, and expiry countdown.
- Lobby: host sees “invite sent” then “partner joined”; both see the selected category, round count, a short preview, and ready/join state. Starting the session is automatic when both are present.
- Session screen: one shared shell with per-game visual renderer. Always show round progress, partner avatar/status, answer lock state, waiting state, reveal animation, and next-round transition.
- Results screen: summary headline, compatibility metric, highlight cards, playful recap, and “Play again” / “Back to hub”.
- Resume behavior: if the app is reopened during an active session, the hub shows a resume card and deep-links back into the session.

**Visual and motion direction**
- Remove gradients from the new games UI. Use solid token-driven surfaces, darker elevated panels, soft borders, subtle texture/pattern layers, and strong typography.
- Extend tokens with a small set of game-specific semantic colors such as `surfaceElevated`, `surfaceDark`, `surfaceContrast`, `accentWarm`, `successSoft`, and `overlayScrim`. Add these to the design system first; do not hardcode colors in screens.
- Use Reanimated for: hub card stagger, invite sheet slide-in, round card entrance, answer lock pulse, partner-answered indicator, reveal flip/fade, and results tally.
- Avoid empty states by always showing supporting visual structure: framed cards, icon badges, progress rails, partner status, microcopy, and background detail.

## Implementation Order
1. Add schema, enums, RLS, constraints, and result tables.
2. Add shared game catalog/types plus server mutation endpoints and snapshot queries.
3. Build the global invite host and realtime subscription layer.
4. Rebuild the Play hub and wire pending invite/recent history data.
5. Ship the shared lobby/session/results shell.
6. Migrate `Would You Rather` and `This or That` first to validate the engine.
7. Add `Who’s More Likely To` and `Never Have I Ever` on the same engine.
8. Remove the old pass-the-phone flows from the main lineup and keep only the generic multiplayer routes.
9. Add polish, reconnect/resume handling, and history presentation.

## Test Plan
- Invitation creation creates exactly one pending invite row and blocks a second active invite for the same couple.
- Incoming invite appears on the partner device in realtime and survives app background/foreground within the expiry window.
- Accepting an invite creates one session, two player rows, a deterministic 10-round manifest, and navigates both devices into the same session id.
- Declining or cancelling an invite updates both devices immediately and returns both to the hub without stale UI.
- Two users answering the same round at nearly the same time produces exactly one reveal transition and no duplicate answers.
- Reopening the app mid-session restores the exact current round, locked answer state, and reveal state from the snapshot.
- Disconnecting one device during a session shows a waiting/reconnect state on the other device and allows clean resume.
- Completing a session writes `game_answers`, marks the session complete, and writes one `game_session_results` row with correct summary values.
- Hub history renders recent completed sessions correctly and never shows pending/abandoned sessions as results.
- Visual QA: no gradients in the new games UI, token usage only, dark surfaces remain readable, and animations feel intentional without blocking input.

## Assumptions and Defaults
- In-app invitations only for v1; push notifications are explicitly out of scope.
- Love Check-In is removed from the main lineup for this phase, not rebuilt as part of the multiplayer MVP.
- One active pending invite or one active session per couple is the v1 rule.
- Invitations expire after 24 hours; active sessions remain resumable until completed or manually cancelled.
- Fixed 10-round sessions for all four games in v1.
- This plan is not written to `plan/games.md` in this turn because Plan Mode forbids file mutations; save this content verbatim once execution mode is requested.
