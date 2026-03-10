## Summary

Implemented the deterministic onboarding chat feature. After first login (`onboarding_completed === false`), users enter a mandatory conversational flow that collects four profile fields (name, birth date, dating start date, help focus) through a chat UI. The "assistant" is a server-side state machine — no LLM.

## Files changed

### New

- `src/components/chat/HelpTypeChips.tsx` — Tappable chip row for the help-type question (question 4). Renders 6 options with emoji labels. Disabled while loading.

### Modified

- `supabase/functions/onboarding-chat/index.ts` — Full state-machine implementation replacing the minimal stub. Handles JWT verification via Auth REST API, derives current step from profile fields, validates/normalizes all user input server-side (name format, birth date via chrono-node, dating start date, help focus enum), persists messages and profile fields, returns varied prompt/re-ask responses.
- `src/data/onboardingApi.ts` — Added `getOnboardingStatus()` (reads profile to derive step) and `fetchOnboardingHistory()` (fetches onboarding messages ordered by time). Removed `console.log` of response data (MUST-7). Removed `console.error` calls that could leak PII.
- `src/screens/main/OnboardingChatScreen.tsx` — Added typing indicator delay (300–600ms) before first AI greeting. Conditionally renders `HelpTypeChips` when `currentQuestion === 3` instead of text input. Hides text input when chips are shown. Added `showTyping` state and cleanup.

## Security checklist

- [x] MUST-1 — Edge function verifies JWT via Auth REST API (`/auth/v1/user`), never `client.auth.getUser()`
- [x] MUST-2 — Current step derived from profile field nulls (`deriveStep()`), never from client input
- [x] MUST-3 — All validation server-side: name (2–50 chars, letters/spaces/apostrophe/hyphen), birth_date and dating_start_date via chrono-node (past dates, age 16–110, dating after birth), help_focus against canonical enum set
- [x] MUST-4 — `user_id` derived from Auth REST API response, never from request body
- [x] MUST-5 — User message and assistant reply persisted together; profile field updated after messages. If profile update fails, function returns error and step derivation from nulls makes it resumable.
- [x] MUST-6 — Client calls `sanitizeMessage()` (trim + 500-char limit) before every `sendOnboardingMessage()` call (in `useOnboarding.ts`)
- [x] MUST-7 — Removed `console.log('[onboarding] response:', ...)` and `console.error` calls from `onboardingApi.ts`

## How to test

1. Register a new user (or reset `onboarding_completed` to `false` in profiles table)
2. On login, verify you're routed to the OnboardingChatScreen (not Main)
3. Wait for typing indicator → first greeting appears asking for name
4. Type a valid name → assistant asks for birth date (progress dots update)
5. Type an invalid name (e.g. "123") → friendly re-ask with varied phrasing
6. Type a valid birth date (e.g. "March 12, 1997") → assistant asks for dating start date
7. Type an invalid date → friendly re-ask
8. Type a valid dating start date → tappable chips appear for help type
9. Tap a chip (e.g. "Communication") → completion message + "Let's Go!" button
10. Tap "Let's Go!" → profile refreshes → navigates to Main
11. Kill app mid-onboarding, reopen → resumes at correct step with history restored
