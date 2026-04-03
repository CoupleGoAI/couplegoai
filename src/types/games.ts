// ─── Game Enums ─────────────────────────────────────────────

export type GameType = 'would_you_rather' | 'who_is_more_likely' | 'this_or_that' | 'never_have_i_ever';

export type GameCategoryKey = 'mixed' | 'fun' | 'romance' | 'home' | 'adventure' | 'values' | 'spicy';

export type GameInvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

export type GameSessionStatus = 'waiting' | 'active' | 'completed' | 'cancelled';

export type GamePlayerState = 'joined' | 'ready' | 'playing' | 'disconnected';

export type GameRoundStatus = 'pending' | 'open' | 'revealed';

// ─── Game Invitation ────────────────────────────────────────

export interface GameInvitation {
  readonly id: string;
  readonly coupleId: string;
  readonly fromUserId: string;
  readonly toUserId: string;
  readonly gameType: GameType;
  readonly categoryKey: GameCategoryKey;
  readonly status: GameInvitationStatus;
  readonly expiresAt: string;
  readonly createdAt: string;
  readonly respondedAt: string | null;
  readonly sessionId: string | null;
}

// ─── Game Session Snapshot ──────────────────────────────────

export interface GameSessionPlayer {
  readonly userId: string;
  readonly state: GamePlayerState;
  readonly joinedAt: string;
  readonly readyAt: string | null;
  readonly lastSeenAt: string;
  readonly disconnectedAt: string | null;
}

export interface GameRound {
  readonly id: string;
  readonly sessionId: string;
  readonly roundIndex: number;
  readonly status: GameRoundStatus;
  readonly promptId: string;
  readonly promptPayload: GamePromptPayload;
  readonly categoryKey: GameCategoryKey;
  readonly startedAt: string | null;
  readonly revealedAt: string | null;
}

export interface GameAnswer {
  readonly id: string;
  readonly sessionId: string;
  readonly roundId: string;
  readonly userId: string;
  readonly answerPayload: GameAnswerPayload;
  readonly answeredAt: string;
}

export interface GameSessionSnapshot {
  readonly id: string;
  readonly coupleId: string;
  readonly invitationId: string | null;
  readonly gameType: GameType;
  readonly categoryKey: GameCategoryKey;
  readonly status: GameSessionStatus;
  readonly createdBy: string;
  readonly startedAt: string | null;
  readonly completedAt: string | null;
  readonly cancelledAt: string | null;
  readonly lastActivityAt: string;
  readonly currentRoundIndex: number;
  readonly totalRounds: number;
  readonly version: number;
  readonly players: readonly GameSessionPlayer[];
  readonly rounds: readonly GameRound[];
  readonly answers: readonly GameAnswer[];
}

// ─── Answer Payloads (discriminated union) ──────────────────

export type GameAnswerPayload =
  | { readonly type: 'binary'; readonly choice: 'A' | 'B' }
  | { readonly type: 'target'; readonly targetUserId: string }
  | { readonly type: 'boolean'; readonly value: boolean };

// ─── Prompt Payloads ────────────────────────────────────────

export type GamePromptPayload =
  | { readonly type: 'would_you_rather'; readonly optionA: string; readonly optionB: string }
  | { readonly type: 'this_or_that'; readonly optionA: string; readonly optionB: string }
  | { readonly type: 'who_is_more_likely'; readonly prompt: string }
  | { readonly type: 'never_have_i_ever'; readonly statement: string };

// ─── Game Results ───────────────────────────────────────────

export interface GameResultSummary {
  readonly sessionId: string;
  readonly coupleId: string;
  readonly gameType: GameType;
  readonly categoryKey: GameCategoryKey;
  readonly summaryPayload: GameSummaryPayload;
  readonly compatibilityScore: number | null;
  readonly matchCount: number;
  readonly roundCount: number;
  readonly createdAt: string;
}

export interface GameSummaryPayload {
  readonly headline: string;
  readonly highlights: readonly string[];
  readonly matchDetails: readonly GameMatchDetail[];
}

export interface GameMatchDetail {
  readonly roundIndex: number;
  readonly promptId: string;
  readonly matched: boolean;
  readonly myAnswer: GameAnswerPayload;
  readonly partnerAnswer: GameAnswerPayload;
}

// ─── Game Definition Contract ───────────────────────────────

export interface GamePrompt {
  readonly id: string;
  readonly category: GameCategoryKey;
}

export interface WyrPrompt extends GamePrompt {
  readonly optionA: string;
  readonly optionB: string;
}

export interface TotPrompt extends GamePrompt {
  readonly optionA: string;
  readonly optionB: string;
}

export interface WimlPrompt extends GamePrompt {
  readonly prompt: string;
}

export interface NhiePrompt extends GamePrompt {
  readonly statement: string;
}

export interface GameDefinition<TPrompt extends GamePrompt = GamePrompt> {
  readonly type: GameType;
  readonly title: string;
  readonly shortTitle: string;
  readonly emoji: string;
  readonly description: string;
  readonly defaultRounds: number;
  readonly supportedCategories: readonly GameCategoryKey[];
  readonly prompts: readonly TPrompt[];
}

// ─── Game History ───────────────────────────────────────────

export interface GameHistoryEntry {
  readonly sessionId: string;
  readonly gameType: GameType;
  readonly categoryKey: GameCategoryKey;
  readonly compatibilityScore: number | null;
  readonly matchCount: number;
  readonly roundCount: number;
  readonly completedAt: string;
}

// ─── Navigation Params ──────────────────────────────────────

export interface GameLobbyParams {
  readonly invitationId?: string;
  readonly gameType?: GameType;
  readonly categoryKey?: GameCategoryKey;
}

export interface GameSessionParams {
  readonly sessionId: string;
}

export interface GameResultsParams {
  readonly sessionId: string;
}
