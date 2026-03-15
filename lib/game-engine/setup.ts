export interface SetupTeamDraft {
  name: string;
  players: string[];
}

export interface SetupDraft {
  teamA: SetupTeamDraft;
  teamB: SetupTeamDraft;
}

export interface SetupValidationResult {
  valid: boolean;
  errors: string[];
}

function trimList(items: string[]): string[] {
  return items.map((item) => item.trim()).filter(Boolean);
}

export function normalizeSetupDraft(draft: SetupDraft): SetupDraft {
  return {
    teamA: {
      name: draft.teamA.name.trim(),
      players: trimList(draft.teamA.players),
    },
    teamB: {
      name: draft.teamB.name.trim(),
      players: trimList(draft.teamB.players),
    },
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
