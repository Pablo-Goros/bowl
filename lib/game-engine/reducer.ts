import type { GameAction } from './actions';
import type {
  GameState,
  NewGameInput,
  Player,
  RoundState,
  SectionId,
  SectionScore,
  Team,
  WordEntry,
} from './types';
import {
  incrementIndex,
  nextSection,
  ROUND_DURATION_SEC,
  SECTION_ORDER,
  shuffle,
} from './utils';

function toKey(teamName: string, playerName: string): string {
  return `${teamName}::${playerName}`;
}

function createTeam(id: string, name: string): Team {
  return {
    id,
    name,
    playerIds: [],
    totalScore: 0,
  };
}

function createWordId(playerId: string, idx: number): string {
  return `${playerId}-w${idx + 1}`;
}

function drawNextWord(drawPile: string[]): {
  activeWordId: string | null;
  drawPile: string[];
} {
  if (drawPile.length === 0) {
    return { activeWordId: null, drawPile };
  }

  const [activeWordId, ...rest] = drawPile;
  return { activeWordId, drawPile: rest };
}

function getActiveRound(state: GameState): RoundState {
  const activeRound = state.rounds.find(
    (round) => round.id === state.activeRoundId,
  );
  if (!activeRound) {
    throw new Error('No active round');
  }

  return activeRound;
}

function withUpdatedRound(state: GameState, updated: RoundState): GameState {
  return {
    ...state,
    rounds: state.rounds.map((round) =>
      round.id === updated.id ? updated : round,
    ),
  };
}

function getTeamById(state: GameState, teamId: string): Team {
  const team = state.teams.find((candidate) => candidate.id === teamId);
  if (!team) {
    throw new Error(`Unknown team id: ${teamId}`);
  }

  return team;
}

function computeSectionScore(
  state: GameState,
  section: SectionId,
): SectionScore {
  const scoreByTeam = Object.fromEntries(
    state.teams.map((team) => [team.id, 0]),
  );

  state.rounds
    .filter((round) => round.section === section && round.endReason)
    .forEach((round) => {
      scoreByTeam[round.teamId] += round.guessedWordIds.length;
    });

  const teams = Object.keys(scoreByTeam);
  const [teamA, teamB] = teams;
  const a = scoreByTeam[teamA] ?? 0;
  const b = scoreByTeam[teamB] ?? 0;
  const winnerTeamId = a === b ? null : a > b ? teamA : teamB;

  return {
    section,
    teamScores: scoreByTeam,
    winnerTeamId,
  };
}

function incrementTeamScores(
  state: GameState,
  teamId: string,
  points: number,
): Team[] {
  return state.teams.map((team) =>
    team.id === teamId
      ? { ...team, totalScore: team.totalScore + points }
      : team,
  );
}

function getWinnerTeamByTotalScore(teams: Team[]): string | null {
  const sorted = [...teams].sort((a, b) => b.totalScore - a.totalScore);
  const leader = sorted[0];
  const second = sorted[1];

  if (!leader) {
    return null;
  }

  if (!second || leader.totalScore > second.totalScore) {
    return leader.id;
  }

  return null;
}

function createRound(state: GameState, nowMs: number): RoundState {
  const activeTeamId = state.activeTeamId;
  if (!activeTeamId) {
    throw new Error('No active team id');
  }

  const team = getTeamById(state, activeTeamId);
  const playerPointer = state.activePlayerByTeam[team.id] ?? 0;
  const clueGiverPlayerId = team.playerIds[playerPointer] ?? '';

  return {
    id: `r${state.rounds.length + 1}`,
    section: state.section,
    teamId: team.id,
    clueGiverPlayerId,
    startedAtMs: nowMs,
    durationSec: ROUND_DURATION_SEC,
    guessedWordIds: [],
    skippedWordIds: [],
  };
}

export function createInitialGameState(input: NewGameInput): GameState {
  const teamA = createTeam('team-a', input.teamAName.trim());
  const teamB = createTeam('team-b', input.teamBName.trim());

  const players: Player[] = [];

  input.teamAPlayers.forEach((name, seatIndex) => {
    const id = `team-a-p${seatIndex + 1}`;
    players.push({ id, name: name.trim(), teamId: teamA.id, seatIndex });
    teamA.playerIds.push(id);
  });

  input.teamBPlayers.forEach((name, seatIndex) => {
    const id = `team-b-p${seatIndex + 1}`;
    players.push({ id, name: name.trim(), teamId: teamB.id, seatIndex });
    teamB.playerIds.push(id);
  });

  const words: Record<string, WordEntry> = {};
  const allWordIds: string[] = [];

  players.forEach((player) => {
    const teamName = player.teamId === teamA.id ? teamA.name : teamB.name;
    const key = toKey(teamName, player.name);
    const playerWords = input.wordsByPlayer[key] ?? [];

    playerWords.forEach((text, idx) => {
      const id = createWordId(player.id, idx);
      words[id] = {
        id,
        text,
        createdByPlayerId: player.id,
      };
      allWordIds.push(id);
    });
  });

  const shuffled = shuffle(allWordIds);
  const firstDraw = drawNextWord(shuffled);

  return {
    phase: 'ready',
    section: SECTION_ORDER[0],
    teams: [teamA, teamB],
    players,
    words,
    bowl: {
      drawPile: firstDraw.drawPile,
      guessedPile: [],
      activeWordId: firstDraw.activeWordId,
    },
    rounds: [],
    sectionScores: [],
    activeRoundId: null,
    activeTeamId: teamA.id,
    activePlayerByTeam: {
      [teamA.id]: 0,
      [teamB.id]: 0,
    },
    winnerTeamId: null,
  };
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ROUND_START': {
      if (state.phase !== 'ready') {
        return state;
      }

      const round = createRound(state, action.nowMs);
      return {
        ...state,
        phase: 'round_active',
        activeRoundId: round.id,
        rounds: [...state.rounds, round],
      };
    }

    case 'WORD_GUESSED': {
      if (state.phase !== 'round_active' || !state.bowl.activeWordId) {
        return state;
      }

      const round = getActiveRound(state);
      const updatedRound: RoundState = {
        ...round,
        guessedWordIds: [...round.guessedWordIds, state.bowl.activeWordId],
      };

      const next = drawNextWord(state.bowl.drawPile);
      return withUpdatedRound(
        {
          ...state,
          bowl: {
            ...state.bowl,
            guessedPile: [...state.bowl.guessedPile, state.bowl.activeWordId],
            activeWordId: next.activeWordId,
            drawPile: next.drawPile,
          },
        },
        updatedRound,
      );
    }

    case 'WORD_SKIPPED': {
      if (state.phase !== 'round_active' || !state.bowl.activeWordId) {
        return state;
      }

      const round = getActiveRound(state);
      const skippedWordId = state.bowl.activeWordId;
      const updatedRound: RoundState = {
        ...round,
        skippedWordIds: [...round.skippedWordIds, skippedWordId],
      };

      // Immediate re-entry with at least one word in front, plus order randomization.
      const reentryTail = shuffle([...state.bowl.drawPile, skippedWordId]);
      const nextActive = reentryTail[0] ?? null;
      const rest = reentryTail.slice(1);

      return withUpdatedRound(
        {
          ...state,
          bowl: {
            ...state.bowl,
            activeWordId: nextActive,
            drawPile: rest,
          },
        },
        updatedRound,
      );
    }

    case 'ROUND_END': {
      if (state.phase !== 'round_active' || !state.activeTeamId) {
        return state;
      }

      const round = getActiveRound(state);
      const finalizedRound: RoundState = {
        ...round,
        endReason: action.reason,
      };

      const activeTeam = getTeamById(state, state.activeTeamId);
      const updatedTeams = incrementTeamScores(
        state,
        activeTeam.id,
        finalizedRound.guessedWordIds.length,
      );

      const nextTeamId =
        state.teams.find((team) => team.id !== activeTeam.id)?.id ??
        activeTeam.id;
      const nextPointer = incrementIndex(
        state.activePlayerByTeam[activeTeam.id] ?? 0,
        activeTeam.playerIds.length,
      );

      const randomizedRemaining = shuffle(
        state.bowl.activeWordId
          ? [state.bowl.activeWordId, ...state.bowl.drawPile]
          : state.bowl.drawPile,
      );
      const nextDraw = drawNextWord(randomizedRemaining);

      const base = withUpdatedRound(
        {
          ...state,
          phase: 'round_summary',
          activeTeamId: nextTeamId,
          activeRoundId: null,
          teams: updatedTeams,
          activePlayerByTeam: {
            ...state.activePlayerByTeam,
            [activeTeam.id]: nextPointer,
          },
          bowl: {
            ...state.bowl,
            activeWordId: nextDraw.activeWordId,
            drawPile: nextDraw.drawPile,
          },
        },
        finalizedRound,
      );

      if (base.bowl.activeWordId || base.bowl.drawPile.length > 0) {
        return base;
      }

      const sectionScore = computeSectionScore(base, base.section);
      const allSectionScores = [...base.sectionScores, sectionScore];
      const next = nextSection(base.section);

      if (!next) {
        return {
          ...base,
          phase: 'match_complete',
          sectionScores: allSectionScores,
          winnerTeamId: getWinnerTeamByTotalScore(base.teams),
        };
      }

      const refreshedWords = shuffle(Object.keys(base.words));
      const nextRoundDraw = drawNextWord(refreshedWords);
      return {
        ...base,
        phase: 'section_transition',
        section: next,
        sectionScores: allSectionScores,
        bowl: {
          drawPile: nextRoundDraw.drawPile,
          guessedPile: [],
          activeWordId: nextRoundDraw.activeWordId,
        },
      };
    }

    case 'NEXT_SECTION': {
      if (state.phase !== 'section_transition') {
        return state;
      }

      return {
        ...state,
        phase: 'ready',
      };
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'round_summary') {
        return state;
      }

      const round = createRound(state, action.nowMs);
      return {
        ...state,
        phase: 'round_active',
        activeRoundId: round.id,
        rounds: [...state.rounds, round],
      };
    }

    default:
      return state;
  }
}
