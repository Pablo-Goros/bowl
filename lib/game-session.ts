import {
  toLegacyPlayerWordKey,
  toPlayerWordKey,
  type GameState,
  type NewGameInput,
  type TeamWordKey,
} from './game-engine';
import type { SetupDraft } from './game-engine/setup';

export const SETUP_DRAFT_STORAGE_KEY = 'bowl.setup-draft.v1';
export const NEW_GAME_INPUT_STORAGE_KEY = 'bowl.new-game-input.v1';
export const GAME_STATE_STORAGE_KEY = 'bowl.game-state.v1';

const AUTO_WORDS_PER_PLAYER = 3;
const DEFAULT_AUTO_WORDS = [
  'Moon',
  'River',
  'Piano',
  'Castle',
  'Pepper',
  'Comet',
  'Forest',
  'Bridge',
  'Lantern',
  'Anchor',
  'Cactus',
  'Falcon',
];

export function toNewGameInputFromSetup(draft: SetupDraft): NewGameInput {
  return {
    teamAName: draft.teamA.name,
    teamBName: draft.teamB.name,
    teamAPlayers: draft.teamA.players,
    teamBPlayers: draft.teamB.players,
    wordsByPlayer: {},
  };
}

export function serializeSetupDraft(draft: SetupDraft): string {
  return JSON.stringify(draft);
}

export function parseSetupDraft(raw: string): SetupDraft | null {
  try {
    const parsed = JSON.parse(raw) as SetupDraft;
    if (!parsed?.teamA || !parsed?.teamB) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function getSessionStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function loadSetupDraftFromStorage(): SetupDraft | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(SETUP_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return parseSetupDraft(raw);
}

export function saveNewGameInputToStorage(input: NewGameInput): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(NEW_GAME_INPUT_STORAGE_KEY, JSON.stringify(input));
}

export function loadNewGameInputFromStorage(): NewGameInput | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(NEW_GAME_INPUT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as NewGameInput;
  } catch {
    return null;
  }
}

export function saveGameStateToStorage(state: GameState): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.setItem(GAME_STATE_STORAGE_KEY, JSON.stringify(state));
}

export function loadGameStateFromStorage(): GameState | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(GAME_STATE_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as GameState;
  } catch {
    return null;
  }
}

export function clearStoredGameState(): void {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(GAME_STATE_STORAGE_KEY);
}

function normalizeWords(list: string[] | undefined): string[] {
  if (!list) {
    return [];
  }

  return list.map((word) => word.trim()).filter(Boolean);
}

function getAutoWords(teamKey: TeamWordKey, seatIndex: number): string[] {
  const teamOffset = teamKey === 'team-a' ? 0 : DEFAULT_AUTO_WORDS.length;

  return Array.from({ length: AUTO_WORDS_PER_PLAYER }, (_, wordIndex) => {
    const seed = teamOffset + seatIndex * AUTO_WORDS_PER_PLAYER + wordIndex;
    const baseWord = DEFAULT_AUTO_WORDS[seed % DEFAULT_AUTO_WORDS.length];
    const cycle = Math.floor(seed / DEFAULT_AUTO_WORDS.length);
    return cycle === 0 ? baseWord : `${baseWord} ${cycle + 1}`;
  });
}

function ensureWordsForTeam(
  wordsByPlayer: Record<string, string[]>,
  teamKey: TeamWordKey,
  teamName: string,
  players: string[],
): void {
  const trimmedTeamName = teamName.trim();

  players.forEach((rawPlayerName, seatIndex) => {
    const playerName = rawPlayerName.trim();
    if (!playerName) {
      return;
    }

    const key = toPlayerWordKey(teamKey, seatIndex);
    const legacyKey = toLegacyPlayerWordKey(trimmedTeamName, playerName);
    const existing = normalizeWords(
      wordsByPlayer[key] ?? wordsByPlayer[legacyKey],
    );

    if (existing.length === 0) {
      wordsByPlayer[key] = getAutoWords(teamKey, seatIndex);
      return;
    }

    wordsByPlayer[key] = existing;
  });
}

export function ensureWordsForGameInput(input: NewGameInput): NewGameInput {
  const wordsByPlayer: Record<string, string[]> = {
    ...input.wordsByPlayer,
  };

  ensureWordsForTeam(
    wordsByPlayer,
    'team-a',
    input.teamAName,
    input.teamAPlayers,
  );
  ensureWordsForTeam(
    wordsByPlayer,
    'team-b',
    input.teamBName,
    input.teamBPlayers,
  );

  return {
    ...input,
    wordsByPlayer,
  };
}
