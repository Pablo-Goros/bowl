export const MIN_WORDS_PER_PLAYER = 3;
export const MAX_WORDS_PER_PLAYER = 5;
export const DEFAULT_WORDS_PER_PLAYER = 4;

export interface SetupTeamDraft {
  name: string;
  players: string[];
}

export interface SetupDraft {
  teamA: SetupTeamDraft;
  teamB: SetupTeamDraft;
  wordsPerPlayer: number;
}

export interface SetupValidationResult {
  valid: boolean;
  errors: string[];
}

function normalizeNameForCompare(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function trimList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

function getDuplicateNames(names: string[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  names.forEach((name) => {
    const normalized = normalizeNameForCompare(name);
    if (seen.has(normalized)) {
      duplicates.add(name);
      return;
    }

    seen.add(normalized);
  });

  return [...duplicates];
}

export function normalizeSetupDraft(draft: SetupDraft): SetupDraft {
  const wordsPerPlayer = Number.isInteger(draft.wordsPerPlayer)
    ? draft.wordsPerPlayer
    : DEFAULT_WORDS_PER_PLAYER;

  return {
    teamA: {
      name: draft.teamA.name.trim(),
      players: trimList(draft.teamA.players),
    },
    teamB: {
      name: draft.teamB.name.trim(),
      players: trimList(draft.teamB.players),
    },
    wordsPerPlayer,
  };
}

export function validateSetupDraft(draft: SetupDraft): SetupValidationResult {
  const normalized = normalizeSetupDraft(draft);
  const errors: string[] = [];

  if (!normalized.teamA.name) {
    errors.push('Team A name is required.');
  }

  if (!normalized.teamB.name) {
    errors.push('Team B name is required.');
  }

  if (normalized.teamA.players.length === 0) {
    errors.push('Team A needs at least one player.');
  }

  if (normalized.teamB.players.length === 0) {
    errors.push('Team B needs at least one player.');
  }

  if (
    normalized.teamA.name &&
    normalized.teamB.name &&
    normalizeNameForCompare(normalized.teamA.name) ===
      normalizeNameForCompare(normalized.teamB.name)
  ) {
    errors.push('Team names must be different.');
  }

  if (getDuplicateNames(normalized.teamA.players).length > 0) {
    errors.push('Team A player names must be unique within the team.');
  }

  if (getDuplicateNames(normalized.teamB.players).length > 0) {
    errors.push('Team B player names must be unique within the team.');
  }

  if (
    normalized.wordsPerPlayer < MIN_WORDS_PER_PLAYER ||
    normalized.wordsPerPlayer > MAX_WORDS_PER_PLAYER
  ) {
    errors.push(
      `Words per player must be between ${MIN_WORDS_PER_PLAYER} and ${MAX_WORDS_PER_PLAYER}.`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function getBalanceSuggestion(draft: SetupDraft): string | null {
  const normalized = normalizeSetupDraft(draft);
  const aCount = normalized.teamA.players.length;
  const bCount = normalized.teamB.players.length;

  if (Math.abs(aCount - bCount) <= 1) {
    return null;
  }

  const sourceTeam = aCount > bCount ? normalized.teamA : normalized.teamB;
  const sourceLabel =
    aCount > bCount
      ? normalized.teamA.name || 'Team A'
      : normalized.teamB.name || 'Team B';
  const targetLabel =
    aCount > bCount
      ? normalized.teamB.name || 'Team B'
      : normalized.teamA.name || 'Team A';
  const suggestedPlayer = sourceTeam.players[sourceTeam.players.length - 1];

  if (!suggestedPlayer) {
    return null;
  }

  return `Suggestion: move ${suggestedPlayer} from ${sourceLabel} to ${targetLabel} for better balance.`;
}
