import * as assert from 'node:assert/strict';

import {
  DEFAULT_WORDS_PER_PLAYER,
  getBalanceSuggestion,
  normalizeSetupDraft,
  validateSetupDraft,
} from '../lib/game-engine';
import {
  normalizeWordsForGameInput,
  parseSetupDraft,
  toNewGameInputFromSetup,
  validateWordsForGameInput,
} from '../lib/game-session';

function testNormalizeAndValidate() {
  const draft = {
    teamA: { name: ' Team A ', players: [' Alex ', ''] },
    teamB: { name: ' Team B ', players: [' Riley '] },
    wordsPerPlayer: DEFAULT_WORDS_PER_PLAYER,
  };

  const normalized = normalizeSetupDraft(draft);
  assert.equal(normalized.teamA.name, 'Team A');
  assert.deepEqual(normalized.teamA.players, ['Alex']);

  const validation = validateSetupDraft(normalized);
  assert.equal(validation.valid, true);
  assert.deepEqual(validation.errors, []);
}

function testValidationErrors() {
  const validation = validateSetupDraft({
    teamA: { name: '', players: [] },
    teamB: { name: '', players: [] },
    wordsPerPlayer: 0,
  });

  assert.equal(validation.valid, false);
  assert.equal(validation.errors.length, 5);
}

function testDuplicateNameValidation() {
  const validation = validateSetupDraft({
    teamA: { name: 'Same', players: ['Alex', 'Alex'] },
    teamB: { name: 'same', players: ['Riley'] },
    wordsPerPlayer: DEFAULT_WORDS_PER_PLAYER,
  });

  assert.equal(validation.valid, false);
  assert.ok(validation.errors.includes('Team names must be different.'));
  assert.ok(
    validation.errors.includes(
      'Team A player names must be unique within the team.',
    ),
  );
}

function testBalanceSuggestion() {
  const suggestion = getBalanceSuggestion({
    teamA: { name: 'Lions', players: ['A', 'B', 'C'] },
    teamB: { name: 'Tigers', players: ['D'] },
    wordsPerPlayer: DEFAULT_WORDS_PER_PLAYER,
  });

  assert.match(suggestion ?? '', /move C from Lions to Tigers/);
}

function testSessionBridge() {
  const draft = {
    teamA: { name: 'Lions', players: ['A'] },
    teamB: { name: 'Tigers', players: ['B'] },
    wordsPerPlayer: DEFAULT_WORDS_PER_PLAYER,
  };

  const input = toNewGameInputFromSetup(draft);
  assert.equal(input.teamAName, 'Lions');
  assert.deepEqual(input.teamBPlayers, ['B']);
  assert.equal(input.wordsPerPlayer, DEFAULT_WORDS_PER_PLAYER);

  const parsed = parseSetupDraft(JSON.stringify(draft));
  assert.deepEqual(parsed, draft);
  assert.equal(parseSetupDraft('bad-json'), null);
}

function testWordEntryValidation() {
  const input = normalizeWordsForGameInput({
    teamAName: 'Lions',
    teamBName: 'Tigers',
    teamAPlayers: ['A'],
    teamBPlayers: ['B'],
    wordsPerPlayer: 4,
    wordsByPlayer: {
      'team-a-p1': [' moon ', '', 'Star Wars'],
      'team-b-p1': ['river', 'castle'],
    },
  });

  const errors = validateWordsForGameInput(input);

  assert.ok(errors.includes('2nd word by player A is missing.'));
  assert.ok(errors.includes('3rd word by player B is missing.'));
  assert.ok(errors.includes('4th word by player B is missing.'));

  const validErrors = validateWordsForGameInput({
    ...input,
    wordsByPlayer: {
      'team-a-p1': ['moon', 'river', 'Star Wars', 'lantern', 'anchor', 'extra'],
      'team-b-p1': ['run', 'swim', 'dance', 'jump'],
    },
  });

  assert.ok(validErrors.includes('Player A can only submit 4 words.'));
}

function run() {
  testNormalizeAndValidate();
  testValidationErrors();
  testDuplicateNameValidation();
  testBalanceSuggestion();
  testSessionBridge();
  testWordEntryValidation();
  console.log('setup tests passed');
}

run();
