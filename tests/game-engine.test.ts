import * as assert from 'node:assert/strict';

import {
  createInitialGameState,
  getActiveRound,
  getScoreboard,
  getSectionProgress,
  getSectionScoreByTeamName,
  reduceGame,
  sampleGameInput,
} from '../lib/game-engine';

function withDeterministicRandom(run: () => void) {
  const originalRandom = Math.random;
  Math.random = () => 0;

  try {
    run();
  } finally {
    Math.random = originalRandom;
  }
}

function testInitialState() {
  const state = createInitialGameState(sampleGameInput);
  assert.equal(state.phase, 'ready');
  assert.equal(state.section, 1);
  assert.equal(state.teams.length, 2);
  assert.equal(state.players.length, 4);
  assert.ok(Object.keys(state.words).length > 0);
  assert.ok(state.bowl.activeWordId);
}

function testRoundScoring() {
  withDeterministicRandom(() => {
    let state = createInitialGameState(sampleGameInput);
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'timer' });

    assert.equal(state.phase, 'ready');
    assert.equal(state.rounds.length, 1);
    assert.equal(state.rounds[0]?.guessedWordIds.length, 1);
    assert.equal(state.rounds[0]?.endReason, 'timer');

    const scoreboard = getScoreboard(state);
    assert.equal(scoreboard['Team A'], 1);

    const sectionScores = getSectionScoreByTeamName(state);
    assert.equal(sectionScores['Team A'], 1);
  });
}

function testSectionTransition() {
  withDeterministicRandom(() => {
    let state = createInitialGameState({
      ...sampleGameInput,
      wordsByPlayer: {
        'team-a-p1': ['Moon'],
        'team-a-p2': ['Pizza'],
        'team-b-p1': ['Garden'],
        'team-b-p2': ['Rocket'],
      },
    });

    state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
    while (state.phase === 'round_active') {
      state = reduceGame(state, { type: 'WORD_GUESSED' });
    }

    assert.equal(state.phase, 'section_transition');
    assert.equal(state.section, 2);
    assert.equal(state.sectionScores.length, 1);

    state = reduceGame(state, { type: 'NEXT_SECTION', nowMs: 2000 });
    assert.equal(state.phase, 'ready');
  });
}

function testInvariants() {
  const state = createInitialGameState(sampleGameInput);
  assert.throws(
    () => reduceGame(state, { type: 'WORD_GUESSED' }),
    /requires phase=round_active/,
  );
}

function testSelectors() {
  let state = createInitialGameState(sampleGameInput);
  state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });

  const progress = getSectionProgress(state);
  assert.equal(progress.totalWordCount, 12);
  assert.equal(progress.remainingWordCount, 12);
  assert.equal(progress.guessedWordCount, 0);
}

function testUndoLastGuessedWord() {
  withDeterministicRandom(() => {
    let state = createInitialGameState(sampleGameInput);
    const openingWordId = state.bowl.activeWordId;

    state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'UNDO_LAST_GUESSED_WORD' });

    assert.equal(state.rounds[0]?.guessedWordIds.length, 0);
    assert.equal(state.bowl.guessedPile.length, 0);
    assert.equal(state.bowl.activeWordId, openingWordId);
  });
}

function testSuddenDeathBreaksFinalTie() {
  withDeterministicRandom(() => {
    let state = createInitialGameState({
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAPlayers: ['Alex'],
      teamBPlayers: ['Riley'],
      wordsPerPlayer: 3,
      wordsByPlayer: {
        'team-a-p1': ['Moon', 'River', 'Lantern'],
        'team-b-p1': ['Forest', 'Bridge', 'Anchor'],
      },
    });

    for (let section = 1; section <= 3; section += 1) {
      for (let round = 0; round < 5; round += 1) {
        state = reduceGame(state, {
          type: 'ROUND_START',
          nowMs: section * 1000 + round,
        });
        state = reduceGame(state, { type: 'WORD_GUESSED' });
        state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });
      }

      state = reduceGame(state, {
        type: 'ROUND_START',
        nowMs: section * 1000 + 99,
      });
      while (state.phase === 'round_active') {
        state = reduceGame(state, { type: 'WORD_GUESSED' });
      }

      if (state.phase === 'section_transition' && !state.suddenDeath.active) {
        state = reduceGame(state, {
          type: 'NEXT_SECTION',
          nowMs: section * 2000,
        });
      }
    }

    assert.equal(state.phase, 'section_transition');
    assert.equal(state.suddenDeath.active, true);

    state = reduceGame(state, { type: 'NEXT_SECTION', nowMs: 9999 });
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 10000 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 10001 });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });

    assert.equal(state.phase, 'match_complete');
    assert.equal(state.winnerTeamId, 'team-a');
  });
}

function testUndoEdgeCases() {
  withDeterministicRandom(() => {
    let state = createInitialGameState(sampleGameInput);
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });

    assert.throws(
      () => reduceGame(state, { type: 'UNDO_LAST_GUESSED_WORD' }),
      /requires a guessed word/,
    );

    const openingWordId = state.bowl.activeWordId;
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'WORD_SKIPPED' });
    const activeWordBeforeUndo = state.bowl.activeWordId;
    state = reduceGame(state, { type: 'UNDO_LAST_GUESSED_WORD' });

    assert.equal(state.bowl.activeWordId, openingWordId);
    assert.ok(state.bowl.drawPile.includes(activeWordBeforeUndo ?? ''));
    assert.equal(getActiveRound(state)?.guessedWordIds.length, 0);
    assert.equal(getActiveRound(state)?.skippedWordIds.length, 1);
  });
}

function testAllRoundEndPaths() {
  withDeterministicRandom(() => {
    let timerState = createInitialGameState(sampleGameInput);
    timerState = reduceGame(timerState, { type: 'ROUND_START', nowMs: 1000 });
    timerState = reduceGame(timerState, { type: 'ROUND_END', reason: 'timer' });
    assert.equal(timerState.rounds[0]?.endReason, 'timer');

    let manualState = createInitialGameState(sampleGameInput);
    manualState = reduceGame(manualState, { type: 'ROUND_START', nowMs: 2000 });
    manualState = reduceGame(manualState, { type: 'WORD_GUESSED' });
    manualState = reduceGame(manualState, {
      type: 'ROUND_END',
      reason: 'manual_end',
    });
    assert.equal(manualState.rounds[0]?.endReason, 'manual_end');

    let allWordsState = createInitialGameState({
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAPlayers: ['Alex'],
      teamBPlayers: ['Riley'],
      wordsPerPlayer: 3,
      wordsByPlayer: {
        'team-a-p1': ['Moon', 'River', 'Lantern'],
        'team-b-p1': ['Forest', 'Bridge', 'Anchor'],
      },
    });

    allWordsState = reduceGame(allWordsState, {
      type: 'ROUND_START',
      nowMs: 3000,
    });
    while (allWordsState.phase === 'round_active') {
      allWordsState = reduceGame(allWordsState, { type: 'WORD_GUESSED' });
    }

    assert.equal(allWordsState.rounds[0]?.endReason, 'all_words');
    assert.equal(allWordsState.phase, 'section_transition');
  });
}

function testSuddenDeathRepeatedTieCyclesResetCleanly() {
  withDeterministicRandom(() => {
    let state = createInitialGameState({
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAPlayers: ['Alex'],
      teamBPlayers: ['Riley'],
      wordsPerPlayer: 3,
      wordsByPlayer: {
        'team-a-p1': ['Moon', 'River', 'Lantern'],
        'team-b-p1': ['Forest', 'Bridge', 'Anchor'],
      },
    });

    for (let section = 1; section <= 3; section += 1) {
      for (let round = 0; round < 5; round += 1) {
        state = reduceGame(state, {
          type: 'ROUND_START',
          nowMs: section * 1000 + round,
        });
        state = reduceGame(state, { type: 'WORD_GUESSED' });
        state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });
      }

      state = reduceGame(state, {
        type: 'ROUND_START',
        nowMs: section * 1000 + 99,
      });
      while (state.phase === 'round_active') {
        state = reduceGame(state, { type: 'WORD_GUESSED' });
      }

      if (state.phase === 'section_transition' && !state.suddenDeath.active) {
        state = reduceGame(state, {
          type: 'NEXT_SECTION',
          nowMs: section * 2000,
        });
      }
    }

    state = reduceGame(state, { type: 'NEXT_SECTION', nowMs: 9000 });
    const totalWordCount = Object.keys(state.words).length;

    state = reduceGame(state, { type: 'ROUND_START', nowMs: 9001 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 9002 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'manual_end' });

    assert.equal(state.phase, 'ready');
    assert.equal(state.suddenDeath.active, true);
    assert.equal(state.suddenDeath.roundsPlayedInCycle, 0);
    assert.deepEqual(state.suddenDeath.cycleScores, {
      'team-a': 0,
      'team-b': 0,
    });
    assert.equal(
      state.bowl.drawPile.length + Number(Boolean(state.bowl.activeWordId)),
      totalWordCount,
    );
    assert.equal(state.bowl.guessedPile.length, 0);
  });
}

function testScoreConsistencyAndBowlProgression() {
  withDeterministicRandom(() => {
    let state = createInitialGameState({
      teamAName: 'Team A',
      teamBName: 'Team B',
      teamAPlayers: ['Alex'],
      teamBPlayers: ['Riley'],
      wordsPerPlayer: 3,
      wordsByPlayer: {
        'team-a-p1': ['Moon', 'River', 'Lantern'],
        'team-b-p1': ['Forest', 'Bridge', 'Anchor'],
      },
    });

    state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
    state = reduceGame(state, { type: 'WORD_GUESSED' });
    state = reduceGame(state, { type: 'ROUND_END', reason: 'timer' });
    state = reduceGame(state, { type: 'ROUND_START', nowMs: 2000 });
    while (state.phase === 'round_active') {
      state = reduceGame(state, { type: 'WORD_GUESSED' });
    }

    const endedRounds = state.rounds.filter((round) => round.endReason);
    const totalGuessedAcrossRounds = endedRounds.reduce(
      (sum, round) => sum + round.guessedWordIds.length,
      0,
    );
    const scoreboard = getScoreboard(state);

    assert.equal(
      Object.values(scoreboard).reduce((sum, score) => sum + score, 0),
      totalGuessedAcrossRounds,
    );
    assert.equal(state.sectionScores[0]?.teamScores['team-a'], 1);
    assert.equal(state.sectionScores[0]?.teamScores['team-b'], 5);
    assert.equal(state.section, 2);
    assert.equal(state.bowl.guessedPile.length, 0);
    assert.equal(
      state.bowl.drawPile.length + Number(Boolean(state.bowl.activeWordId)),
      Object.keys(state.words).length,
    );
  });
}

function run() {
  testInitialState();
  testRoundScoring();
  testSectionTransition();
  testInvariants();
  testSelectors();
  testUndoLastGuessedWord();
  testUndoEdgeCases();
  testAllRoundEndPaths();
  testSuddenDeathRepeatedTieCyclesResetCleanly();
  testScoreConsistencyAndBowlProgression();
  testSuddenDeathBreaksFinalTie();
  console.log('game-engine tests passed');
}

run();
