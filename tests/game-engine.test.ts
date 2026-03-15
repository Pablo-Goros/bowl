import * as assert from 'node:assert/strict';

import {
  createInitialGameState,
  getCurrentPlayerName,
  getScoreboard,
  getSectionProgress,
  getSectionScoreByTeamName,
  reduceGame,
  sampleGameInput,
} from '../lib/game-engine';

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
  const originalRandom = Math.random;
  Math.random = () => 0;

  let state = createInitialGameState(sampleGameInput);
  state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
  state = reduceGame(state, { type: 'WORD_GUESSED' });
  state = reduceGame(state, { type: 'ROUND_END', reason: 'timer' });

  assert.equal(state.phase, 'round_summary');
  assert.equal(state.rounds.length, 1);
  assert.equal(state.rounds[0]?.guessedWordIds.length, 1);

  const scoreboard = getScoreboard(state);
  assert.equal(scoreboard['Team A'], 1);

  const sectionScores = getSectionScoreByTeamName(state);
  assert.equal(sectionScores['Team A'], 1);

  Math.random = originalRandom;
}

function testSectionTransition() {
  const originalRandom = Math.random;
  Math.random = () => 0;

  let state = createInitialGameState({
    ...sampleGameInput,
    wordsByPlayer: {
      'Team A::Alex': ['Moon'],
      'Team A::Sam': ['Pizza'],
      'Team B::Riley': ['Garden'],
      'Team B::Jamie': ['Rocket'],
    },
  });

  state = reduceGame(state, { type: 'ROUND_START', nowMs: 1000 });
  while (state.bowl.activeWordId) {
    state = reduceGame(state, { type: 'WORD_GUESSED' });
  }
  state = reduceGame(state, { type: 'ROUND_END', reason: 'timer' });

  assert.equal(state.phase, 'section_transition');
  assert.equal(state.section, 2);
  assert.equal(state.sectionScores.length, 1);

  state = reduceGame(state, { type: 'NEXT_SECTION', nowMs: 2000 });
  assert.equal(state.phase, 'ready');

  Math.random = originalRandom;
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

  assert.equal(getCurrentPlayerName(state), 'Alex');

  const progress = getSectionProgress(state);
  assert.equal(progress.totalWordCount, 12);
  assert.equal(progress.remainingWordCount, 12);
  assert.equal(progress.guessedWordCount, 0);
}

function run() {
  testInitialState();
  testRoundScoring();
  testSectionTransition();
  testInvariants();
  testSelectors();
  console.log('game-engine tests passed');
}

run();
