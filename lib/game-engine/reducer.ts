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
  nextSection,
  ROUND_DURATION_SEC,
  SECTION_ORDER,
  shuffle,
} from './utils';
import { toLegacyPlayerWordKey, toPlayerWordKey } from './word-keys';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
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
  invariant(activeRound, 'No active round');

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
  invariant(team, `Unknown team id: ${teamId}`);

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

function finalizeRound(
  state: GameState,
  finalizedRound: RoundState,
): GameState {
  const activeTeamId = state.activeTeamId;
  invariant(activeTeamId, 'No active team when ending round');

  const activeTeam = getTeamById(state, activeTeamId);
  const updatedTeams = incrementTeamScores(
    state,
    activeTeam.id,
    finalizedRound.guessedWordIds.length,
  );

  const nextTeamId =
    state.teams.find((team) => team.id !== activeTeam.id)?.id ?? activeTeam.id;

  const randomizedRemaining = shuffle(
    state.bowl.activeWordId
      ? [state.bowl.activeWordId, ...state.bowl.drawPile]
      : state.bowl.drawPile,
  );
  const nextDraw = drawNextWord(randomizedRemaining);

  const base = withUpdatedRound(
    {
      ...state,
      phase: 'ready',
      activeTeamId: nextTeamId,
      activeRoundId: null,
      teams: updatedTeams,
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

function createRound(state: GameState, nowMs: number): RoundState {
  const activeTeamId = state.activeTeamId;
  invariant(activeTeamId, 'No active team id');

  const team = getTeamById(state, activeTeamId);

  return {
    id: `r${state.rounds.length + 1}`,
    section: state.section,
    teamId: team.id,
    startedAtMs: nowMs,
    durationSec: ROUND_DURATION_SEC,
    guessedWordIds: [],
    skippedWordIds: [],
  };
}

function validateInput(input: NewGameInput): void {
  invariant(input.teamAName.trim().length > 0, 'Team A name is required');
  invariant(input.teamBName.trim().length > 0, 'Team B name is required');
  invariant(
    input.teamAName.trim().toLocaleLowerCase() !==
      input.teamBName.trim().toLocaleLowerCase(),
    'Team names must be different',
  );
  invariant(input.teamAPlayers.length > 0, 'Team A needs at least one player');
  invariant(input.teamBPlayers.length > 0, 'Team B needs at least one player');

  const hasDuplicate = (players: string[]) =>
    new Set(players.map((name) => name.trim().toLocaleLowerCase())).size !==
    players.length;

  invariant(
    !hasDuplicate(input.teamAPlayers),
    'Team A player names must be unique within the team',
  );
  invariant(
    !hasDuplicate(input.teamBPlayers),
    'Team B player names must be unique within the team',
  );
}

function assertActionAllowed(state: GameState, action: GameAction): void {
  switch (action.type) {
    case 'ROUND_START':
      invariant(
        state.phase === 'ready',
        `ROUND_START requires phase=ready, received ${state.phase}`,
      );
      break;
    case 'WORD_GUESSED':
    case 'WORD_SKIPPED':
      invariant(
        state.phase === 'round_active',
        `${action.type} requires phase=round_active, received ${state.phase}`,
      );
      invariant(
        Boolean(state.bowl.activeWordId),
        `${action.type} requires an active word`,
      );
      break;
    case 'ROUND_END':
      invariant(
        state.phase === 'round_active',
        `ROUND_END requires phase=round_active, received ${state.phase}`,
      );
      invariant(
        Boolean(state.activeTeamId),
        'ROUND_END requires an active team',
      );
      break;
    case 'NEXT_SECTION':
      invariant(
        state.phase === 'section_transition',
        `NEXT_SECTION requires phase=section_transition, received ${state.phase}`,
      );
      break;
    default:
      break;
  }
}

export function createInitialGameState(input: NewGameInput): GameState {
  validateInput(input);

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
    const teamWordKey = player.teamId === teamA.id ? 'team-a' : 'team-b';
    const key = toPlayerWordKey(teamWordKey, player.seatIndex);
    const legacyKey = toLegacyPlayerWordKey(teamName, player.name);
    const playerWords =
      input.wordsByPlayer[key] ?? input.wordsByPlayer[legacyKey] ?? [];

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

  invariant(allWordIds.length > 0, 'Game requires at least one word');

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
    winnerTeamId: null,
  };
}

export function reduceGame(state: GameState, action: GameAction): GameState {
  assertActionAllowed(state, action);

  switch (action.type) {
    case 'ROUND_START': {
      const round = createRound(state, action.nowMs);
      return {
        ...state,
        phase: 'round_active',
        activeRoundId: round.id,
        rounds: [...state.rounds, round],
      };
    }

    case 'WORD_GUESSED': {
      const round = getActiveRound(state);
      const activeWordId = state.bowl.activeWordId;
      invariant(activeWordId, 'No active word to mark as guessed');

      const updatedRound: RoundState = {
        ...round,
        guessedWordIds: [...round.guessedWordIds, activeWordId],
      };

      const next = drawNextWord(state.bowl.drawPile);
      const progressedState = withUpdatedRound(
        {
          ...state,
          bowl: {
            ...state.bowl,
            guessedPile: [...state.bowl.guessedPile, activeWordId],
            activeWordId: next.activeWordId,
            drawPile: next.drawPile,
          },
        },
        updatedRound,
      );

      if (
        progressedState.bowl.activeWordId ||
        progressedState.bowl.drawPile.length > 0
      ) {
        return progressedState;
      }

      return finalizeRound(progressedState, {
        ...updatedRound,
        endReason: 'all_words',
      });
    }

    case 'WORD_SKIPPED': {
      const round = getActiveRound(state);
      const skippedWordId = state.bowl.activeWordId;
      invariant(skippedWordId, 'No active word to skip');

      const updatedRound: RoundState = {
        ...round,
        skippedWordIds: [...round.skippedWordIds, skippedWordId],
      };

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
      const round = getActiveRound(state);
      const finalizedRound: RoundState = {
        ...round,
        endReason: action.reason,
      };
      return finalizeRound(state, finalizedRound);
    }

    case 'NEXT_SECTION': {
      return {
        ...state,
        phase: 'ready',
      };
    }

    default:
      return state;
  }
}
