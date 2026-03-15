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

export function getCurrentPlayerName(state: GameState): string | null {
  const team = getCurrentTeam(state);
  if (!team) {
    return null;
  }

  const pointer = state.activePlayerByTeam[team.id] ?? 0;
  const playerId = team.playerIds[pointer];
  const player = state.players.find((candidate) => candidate.id === playerId);

  return player?.name ?? null;
}

export function getScoreboard(state: GameState): Record<string, number> {
  return Object.fromEntries(
    state.teams.map((team) => [team.name, team.totalScore]),
  );
}
