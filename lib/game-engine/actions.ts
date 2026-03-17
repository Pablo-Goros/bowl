import type { RoundEndReason } from './types';

export type GameAction =
  | { type: 'ROUND_START'; nowMs: number }
  | { type: 'WORD_GUESSED' }
  | { type: 'WORD_SKIPPED' }
  | { type: 'ROUND_END'; reason: RoundEndReason }
  | { type: 'NEXT_SECTION'; nowMs: number };
