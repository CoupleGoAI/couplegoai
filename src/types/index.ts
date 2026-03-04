/**
 * CoupleGoAI — Global Type Definitions
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

/** Minimal user object derived from Supabase auth + profiles table */
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  onboardingCompleted: boolean;
  coupleId: string | null;
  createdAt: string;
}

/** Session data from Supabase (access + refresh token pair) */
export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

/** Discriminated union for auth operation results */
export type AuthResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AuthError };

/** Typed auth error with discriminated `code` */
export type AuthError =
  | { code: 'INVALID_CREDENTIALS'; message: string }
  | { code: 'EMAIL_ALREADY_EXISTS'; message: string }
  | { code: 'WEAK_PASSWORD'; message: string }
  | { code: 'NETWORK_ERROR'; message: string }
  | { code: 'SESSION_EXPIRED'; message: string }
  | { code: 'UNKNOWN'; message: string };

/** Validation result for form fields */
export interface ValidationResult {
  valid: boolean;
  error: string | null;
}

// ─── User / Partner ───────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  avatar?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

export interface Couple {
  id: string;
  userA: User;
  userB: User;
  connectedAt: string;
  streakDays: number;
  lastActivityAt: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export type MessageRole = 'user' | 'partner' | 'ai';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  status: MessageStatus;
  isEdited?: boolean;
}

export interface ChatSession {
  id: string;
  coupleId: string;
  messages: Message[];
  startedAt: string;
}

// ─── Truth or Dare ────────────────────────────────────────────────────────────
export type TodCategory = 'romantic' | 'spicy' | 'fun';
export type TodType = 'truth' | 'dare';
export type TurnPlayer = 'user' | 'partner';

export interface TodCard {
  id: string;
  type: TodType;
  category: TodCategory;
  content: string;
}

export interface TodRound {
  id: string;
  cardId: string;
  player: TurnPlayer;
  completed: boolean;
  skipped: boolean;
  timestamp: string;
}

export interface TodSession {
  id: string;
  coupleId: string;
  category: TodCategory;
  currentTurn: TurnPlayer;
  rounds: TodRound[];
  startedAt: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────
export type OnboardingStep = 'welcome' | 'create-account' | 'generate-qr' | 'scan-qr' | 'confirmed';

// ─── App State ────────────────────────────────────────────────────────────────
export type AppScreen = 'onboarding' | 'main';

export interface AppState {
  onboardingCompleted: boolean;
  currentUser: User | null;
  partner: Partner | null;
  couple: Couple | null;
  colorScheme: 'light' | 'dark';
}
