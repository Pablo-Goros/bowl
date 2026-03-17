export type SectionId = 1 | 2 | 3;

export type MatchPhase =
  | 'setup'
  | 'word_entry'
  | 'ready'
  | 'round_active'
  | 'section_transition'
  | 'match_complete';

export interface Player {
  id: string;
  name: string;
  teamId: string;
  seatIndex: number;
}

export interface Team {
  id: string;
  name: string;
  playerIds: string[];
  totalScore: number;
}

export interface WordEntry {
  id: string;
  text: string;
  createdByPlayerId: string;
}

export interface BowlState {
  drawPile: string[];
  guessedPile: string[];
  activeWordId: string | null;
}

export type RoundEndReason = 'timer' | 'manual_end' | 'all_words';

export interface RoundState {
  id: string;
  section: SectionId;
  teamId: string;
  startedAtMs: number;
  durationSec: number;
  guessedWordIds: string[];
  skippedWordIds: string[];
  endReason?: RoundEndReason;
}

export interface SectionScore {
  section: SectionId;
  teamScores: Record<string, number>;
  winnerTeamId: string | null;
}

export interface SuddenDeathState {
  active: boolean;
  cycleScores: Record<string, number>;
  roundsPlayedInCycle: number;
}

export interface GameState {
  phase: MatchPhase;
  section: SectionId;
  teams: Team[];
  players: Player[];
  words: Record<string, WordEntry>;
  bowl: BowlState;
  rounds: RoundState[];
  sectionScores: SectionScore[];
  activeRoundId: string | null;
  activeTeamId: string | null;
  winnerTeamId: string | null;
  suddenDeath: SuddenDeathState;
}

export interface NewGameInput {
  teamAName: string;
  teamBName: string;
  teamAPlayers: string[];
  teamBPlayers: string[];
  wordsPerPlayer: number;
  wordsByPlayer: Record<string, string[]>;
}
