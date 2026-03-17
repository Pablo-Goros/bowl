import {
  toLegacyPlayerWordKey,
  toPlayerWordKey,
  type GameState,
  type NewGameInput,
  type TeamWordKey,
} from './game-engine';
import {
  DEFAULT_WORDS_PER_PLAYER,
  MAX_WORDS_PER_PLAYER,
  MIN_WORDS_PER_PLAYER,
  type SetupDraft,
} from './game-engine/setup';

export { DEFAULT_WORDS_PER_PLAYER, MAX_WORDS_PER_PLAYER, MIN_WORDS_PER_PLAYER };

export const SETUP_DRAFT_STORAGE_KEY = 'bowl.setup-draft.v1';
export const NEW_GAME_INPUT_STORAGE_KEY = 'bowl.new-game-input.v1';
export const GAME_STATE_STORAGE_KEY = 'bowl.game-state.v1';
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
    wordsPerPlayer: draft.wordsPerPlayer,
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
    return {
      ...parsed,
      wordsPerPlayer:
        typeof parsed.wordsPerPlayer === 'number'
          ? parsed.wordsPerPlayer
          : DEFAULT_WORDS_PER_PLAYER,
    };
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
    const parsed = JSON.parse(raw) as NewGameInput;
    return {
      ...parsed,
      wordsPerPlayer: normalizeRequestedWordsPerPlayer(parsed.wordsPerPlayer),
    };
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

  return list.map((word) => word.trim());
}

function normalizeRequestedWordsPerPlayer(wordsPerPlayer: number): number {
  return Number.isInteger(wordsPerPlayer)
    ? wordsPerPlayer
    : DEFAULT_WORDS_PER_PLAYER;
}

function getNormalizedPlayerWords(
  wordsByPlayer: Record<string, string[]>,
  teamKey: TeamWordKey,
  teamName: string,
  playerName: string,
  seatIndex: number,
  options?: {
    clampToMax?: boolean;
  },
): string[] {
  const key = toPlayerWordKey(teamKey, seatIndex);
  const legacyKey = toLegacyPlayerWordKey(teamName, playerName);
  const words = normalizeWords(wordsByPlayer[key] ?? wordsByPlayer[legacyKey]);

  if (options?.clampToMax === false) {
    return words;
  }

  return words.slice(0, MAX_WORDS_PER_PLAYER);
}

function normalizeWordsForTeam(
  wordsByPlayer: Record<string, string[]>,
  teamKey: TeamWordKey,
  teamName: string,
  players: string[],
  wordsPerPlayer: number,
): void {
  players.forEach((rawPlayerName, seatIndex) => {
    const playerName = rawPlayerName.trim();
    if (!playerName) {
      return;
    }

    wordsByPlayer[toPlayerWordKey(teamKey, seatIndex)] =
      getNormalizedPlayerWords(
        wordsByPlayer,
        teamKey,
        teamName,
        playerName,
        seatIndex,
        { clampToMax: false },
      ).slice(0, wordsPerPlayer);
  });
}

function getAutoWords(
  teamKey: TeamWordKey,
  seatIndex: number,
  wordsPerPlayer: number,
): string[] {
  const teamOffset = teamKey === 'team-a' ? 0 : DEFAULT_AUTO_WORDS.length;

  return Array.from({ length: wordsPerPlayer }, (_, wordIndex) => {
    const seed = teamOffset + seatIndex * wordsPerPlayer + wordIndex;
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
  wordsPerPlayer: number,
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

    if (existing.every((word) => !word)) {
      wordsByPlayer[key] = getAutoWords(teamKey, seatIndex, wordsPerPlayer);
      return;
    }

    wordsByPlayer[key] = existing.slice(0, wordsPerPlayer);
  });
}

export function ensureWordsForGameInput(input: NewGameInput): NewGameInput {
  const wordsPerPlayer = normalizeRequestedWordsPerPlayer(input.wordsPerPlayer);
  const wordsByPlayer: Record<string, string[]> = {
    ...input.wordsByPlayer,
  };

  ensureWordsForTeam(
    wordsByPlayer,
    'team-a',
    input.teamAName,
    input.teamAPlayers,
    wordsPerPlayer,
  );
  ensureWordsForTeam(
    wordsByPlayer,
    'team-b',
    input.teamBName,
    input.teamBPlayers,
    wordsPerPlayer,
  );

  return {
    ...input,
    wordsPerPlayer,
    wordsByPlayer,
  };
}

export function normalizeWordsForGameInput(input: NewGameInput): NewGameInput {
  const wordsPerPlayer = normalizeRequestedWordsPerPlayer(input.wordsPerPlayer);
  const wordsByPlayer: Record<string, string[]> = {
    ...input.wordsByPlayer,
  };

  normalizeWordsForTeam(
    wordsByPlayer,
    'team-a',
    input.teamAName,
    input.teamAPlayers,
    wordsPerPlayer,
  );
  normalizeWordsForTeam(
    wordsByPlayer,
    'team-b',
    input.teamBName,
    input.teamBPlayers,
    wordsPerPlayer,
  );

  return {
    ...input,
    wordsPerPlayer,
    wordsByPlayer,
  };
}

function validateWordsForTeam(
  errors: string[],
  wordsByPlayer: Record<string, string[]>,
  teamKey: TeamWordKey,
  teamName: string,
  players: string[],
  wordsPerPlayer: number,
): void {
  players.forEach((rawPlayerName, seatIndex) => {
    const playerName = rawPlayerName.trim();
    if (!playerName) {
      return;
    }

    const words = getNormalizedPlayerWords(
      wordsByPlayer,
      teamKey,
      teamName,
      playerName,
      seatIndex,
      { clampToMax: false },
    );

    for (let index = 0; index < wordsPerPlayer; index += 1) {
      if (words[index]?.trim()) {
        continue;
      }

      const ordinal = new Intl.PluralRules('en', { type: 'ordinal' });
      const suffixMap: Record<string, string> = {
        one: 'st',
        two: 'nd',
        few: 'rd',
        other: 'th',
      };
      const rule = ordinal.select(index + 1);
      errors.push(
        `${index + 1}${suffixMap[rule]} word by player ${playerName} is missing.`,
      );
    }

    if (words.length > wordsPerPlayer) {
      errors.push(
        `Player ${playerName} can only submit ${wordsPerPlayer} words.`,
      );
    }
  });
}

export function validateWordsForGameInput(input: NewGameInput): string[] {
  const normalizedInput = {
    ...input,
    teamAName: input.teamAName.trim(),
    teamBName: input.teamBName.trim(),
    teamAPlayers: input.teamAPlayers.map((player) => player.trim()),
    teamBPlayers: input.teamBPlayers.map((player) => player.trim()),
    wordsPerPlayer: normalizeRequestedWordsPerPlayer(input.wordsPerPlayer),
  };
  const errors: string[] = [];

  if (
    normalizedInput.wordsPerPlayer < MIN_WORDS_PER_PLAYER ||
    normalizedInput.wordsPerPlayer > MAX_WORDS_PER_PLAYER
  ) {
    errors.push(
      `Words per player must be between ${MIN_WORDS_PER_PLAYER} and ${MAX_WORDS_PER_PLAYER}.`,
    );
  }

  validateWordsForTeam(
    errors,
    normalizedInput.wordsByPlayer,
    'team-a',
    normalizedInput.teamAName,
    normalizedInput.teamAPlayers,
    normalizedInput.wordsPerPlayer,
  );
  validateWordsForTeam(
    errors,
    normalizedInput.wordsByPlayer,
    'team-b',
    normalizedInput.teamBName,
    normalizedInput.teamBPlayers,
    normalizedInput.wordsPerPlayer,
  );

  return errors;
}
