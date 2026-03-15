import * as assert from 'node:assert/strict';

import {
  getBalanceSuggestion,
  normalizeSetupDraft,
  validateSetupDraft,
} from '../lib/game-engine';
import { parseSetupDraft, toNewGameInputFromSetup } from '../lib/game-session';

function testNormalizeAndValidate() {
  const draft = {
    teamA: { name: ' Team A ', players: [' Alex ', ''] },
    teamB: { name: ' Team B ', players: [' Riley '] },
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
  });

  assert.equal(validation.valid, false);
  assert.equal(validation.errors.length, 4);
}

function testBalanceSuggestion() {
  const suggestion = getBalanceSuggestion({
    teamA: { name: 'Lions', players: ['A', 'B', 'C'] },
    teamB: { name: 'Tigers', players: ['D'] },
  });

  assert.match(suggestion ?? '', /move C from Lions to Tigers/);
}

function testSessionBridge() {
  const draft = {
    teamA: { name: 'Lions', players: ['A'] },
    teamB: { name: 'Tigers', players: ['B'] },
  };

  const input = toNewGameInputFromSetup(draft);
  assert.equal(input.teamAName, 'Lions');
  assert.deepEqual(input.teamBPlayers, ['B']);

  const parsed = parseSetupDraft(JSON.stringify(draft));
  assert.deepEqual(parsed, draft);
  assert.equal(parseSetupDraft('bad-json'), null);
}

function run() {
  testNormalizeAndValidate();
  testValidationErrors();
  testBalanceSuggestion();
  testSessionBridge();
  console.log('setup tests passed');
}

run();
