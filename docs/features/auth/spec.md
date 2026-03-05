# Feature: Authentication

## What

Email/password registration and login with persistent sessions. User registers once, logs in once, stays logged in until manual logout or token expiry. OAuth (Google/Apple) is a stretch goal — email/password first.

Supabase Auth manages the full token lifecycle (access + refresh). Tokens are stored in `expo-secure-store` via a custom storage adapter. On app launch, the Supabase client automatically restores the session from secure storage — no login screen needed. On expiry, Supabase silently refreshes; if that fails, redirect to login.

### Screens

- **LoginScreen** — email + password fields, "Log in" CTA, link to register
- **RegisterScreen** — email + password + confirm password, "Create account" CTA, link to login
- Both replace current `WelcomeScreen` + `CreateAccountScreen` in the onboarding stack
- After successful auth → navigate to AI onboarding (if `onboarding_completed === false`) or Main tabs

### Data access (Supabase-native — no REST endpoints)

Auth operations use the Supabase JS client directly (`supabase.auth.*`). No custom API endpoints are involved.

| Operation     | Supabase method                            | Notes                                          |
| ------------- | ------------------------------------------ | ---------------------------------------------- |
| Register      | `supabase.auth.signUp({ email, password })` | Returns session + user; triggers `handle_new_user` DB function to create profiles row |
| Login         | `supabase.auth.signInWithPassword({ email, password })` | Returns session + user                   |
| Token refresh | Automatic (`autoRefreshToken: true`)       | Handled internally by supabase-js              |
| Logout        | `supabase.auth.signOut()`                  | Invalidates session on server + clears secure store |
| Get session   | `supabase.auth.getSession()`               | Restores from expo-secure-store on app launch  |
| Get user      | `supabase.auth.getUser()`                  | Fetches current auth user from Supabase        |

Profile data (name, onboarding status, couple) is read/written directly via Supabase PostgREST:

| Operation       | Supabase query                                                          |
| --------------- | ----------------------------------------------------------------------- |
| Fetch profile   | `supabase.from('profiles').select(...).eq('id', userId).single()`       |
| Mark onboarded  | `supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId)` |

### State

- `authStore` (Zustand slice): `user`, `isAuthenticated`, `isInitialized`, `isLoading`, `error`
- No raw tokens in Zustand — tokens stay in Supabase's secure storage adapter
- On logout: `supabase.auth.signOut()` + reset all Zustand stores

## Done when

- [ ] User can register with email/password and land in the app
- [ ] User can log in with existing credentials
- [ ] Session persists across app restarts (no re-login needed)
- [ ] Expired token triggers re-login flow
- [ ] Logout clears all tokens and navigates to login
- [ ] Tokens stored in expo-secure-store, never AsyncStorage

## Notes

- Password min 8 chars, validated client-side before sending
- Show inline field errors (not alerts)
- Loading state on buttons during network calls
- No "forgot password" in MVP — add later
- Keyboard-aware scroll so fields aren't hidden behind keyboard
- All data access goes through typed wrappers in `src/data/` — `supabaseQuery()` for DB reads/writes, `invokeEdgeFunction()` for edge functions
