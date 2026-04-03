import type { GameType, GameCategoryKey, GamePrompt } from '@/types/games';
import { GAME_DEFINITIONS } from './catalog';

/**
 * Selects `count` prompts for a game session.
 * Uses a seeded shuffle for deterministic selection across both devices.
 * 'mixed' category selects from all prompts for balanced variety.
 */
export function selectPrompts(
  gameType: GameType,
  categoryKey: GameCategoryKey,
  count: number,
  seed: string,
): readonly GamePrompt[] {
  const def = GAME_DEFINITIONS[gameType];
  const pool =
    categoryKey === 'mixed'
      ? def.prompts
      : def.prompts.filter((p) => p.category === categoryKey);

  const shuffled = seededShuffle([...pool], seed);

  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function seededShuffle<T>(arr: T[], seed: string): T[] {
  let seedNum = hashSeed(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    seedNum = nextSeed(seedNum);
    const j = (seedNum >>> 0) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

function nextSeed(current: number): number {
  return (current * LCG_MULTIPLIER + LCG_INCREMENT) & 0xffffffff;
}

function hashSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) & 0xffffffff;
  }
  return Math.abs(hash);
}
