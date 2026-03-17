import type { GameState, RoundState, Team } from './types';

export function getActiveRound(state: GameState): RoundState | null {
  if (!state.activeRoundId) {
    return null;
  }

  return state.rounds.find((round) => round.id === state.activeRoundId) ?? null;
}

export function getCurrentTeam(state: GameState): Team | null {
  if (!state.activeTeamId) {
    return null;
  }

  return state.teams.find((team) => team.id === state.activeTeamId) ?? null;
}

export function getScoreboard(state: GameState): Record<string, number> {
  return Object.fromEntries(
    state.teams.map((team) => [team.name, team.totalScore]),
  );
}

export function getSectionProgress(state: GameState): {
  remainingWordCount: number;
  guessedWordCount: number;
  totalWordCount: number;
} {
  return {
    remainingWordCount:
      state.bowl.drawPile.length + (state.bowl.activeWordId ? 1 : 0),
    guessedWordCount: state.bowl.guessedPile.length,
    totalWordCount: Object.keys(state.words).length,
  };
}

export function getSectionScoreByTeamName(
  state: GameState,
): Record<string, number> {
  const currentSection = state.section;
  const scoreByTeamId = Object.fromEntries(
    state.teams.map((team) => [team.id, 0]),
  );

  state.rounds
    .filter((round) => round.section === currentSection && round.endReason)
    .forEach((round) => {
      scoreByTeamId[round.teamId] += round.guessedWordIds.length;
    });

  return Object.fromEntries(
    state.teams.map((team) => [team.name, scoreByTeamId[team.id] ?? 0]),
  );
}
