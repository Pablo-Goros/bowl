import type { NewGameInput } from './game-engine';
import type { SetupDraft } from './game-engine/setup';

export const SETUP_DRAFT_STORAGE_KEY = 'bowl.setup-draft.v1';

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
