import * as assert from 'node:assert/strict';

import { createInitialGameState, sampleGameInput } from '../lib/game-engine';
import {
  clearStoredGameState,
  clearWordEntryProgressFromStorage,
  GAME_STATE_STORAGE_KEY,
  loadGameStateFromStorage,
  loadWordEntryProgressFromStorage,
  saveGameStateToStorage,
  saveWordEntryProgressToStorage,
  WORD_ENTRY_PROGRESS_STORAGE_KEY,
} from '../lib/game-session';

class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

function installWindow(storage: Storage) {
  Object.defineProperty(globalThis, 'window', {
    value: { localStorage: storage },
    configurable: true,
    writable: true,
  });
}

function uninstallWindow() {
  Reflect.deleteProperty(globalThis, 'window');
}

function testGameStateRoundTrip() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    const state = createInitialGameState(sampleGameInput);
    saveGameStateToStorage(state);

    assert.deepEqual(loadGameStateFromStorage(), state);
    assert.equal(storage.getItem(GAME_STATE_STORAGE_KEY) !== null, true);
  } finally {
    uninstallWindow();
  }
}

function testInvalidStoredGameStateReturnsNull() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    storage.setItem(GAME_STATE_STORAGE_KEY, '{bad json');
    assert.equal(loadGameStateFromStorage(), null);
  } finally {
    uninstallWindow();
  }
}

function testWordEntryProgressRoundTrip() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    saveWordEntryProgressToStorage({
      currentPlayerIndex: 3,
      updatedAtMs: 1234,
    });

    assert.deepEqual(loadWordEntryProgressFromStorage(), {
      currentPlayerIndex: 3,
      updatedAtMs: 1234,
    });
  } finally {
    uninstallWindow();
  }
}

function testInvalidWordEntryProgressReturnsNull() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    storage.setItem(
      WORD_ENTRY_PROGRESS_STORAGE_KEY,
      JSON.stringify({ currentPlayerIndex: -1 }),
    );
    assert.equal(loadWordEntryProgressFromStorage(), null);

    storage.setItem(WORD_ENTRY_PROGRESS_STORAGE_KEY, '{bad json');
    assert.equal(loadWordEntryProgressFromStorage(), null);
  } finally {
    uninstallWindow();
  }
}

function testClearStoredGameStateAlsoClearsWordEntryProgress() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    saveGameStateToStorage(createInitialGameState(sampleGameInput));
    saveWordEntryProgressToStorage({
      currentPlayerIndex: 1,
      updatedAtMs: 999,
    });

    clearStoredGameState();

    assert.equal(storage.getItem(GAME_STATE_STORAGE_KEY), null);
    assert.equal(storage.getItem(WORD_ENTRY_PROGRESS_STORAGE_KEY), null);
  } finally {
    uninstallWindow();
  }
}

function testClearWordEntryProgressOnlyClearsProgress() {
  const storage = new MemoryStorage();
  installWindow(storage);

  try {
    saveGameStateToStorage(createInitialGameState(sampleGameInput));
    saveWordEntryProgressToStorage({
      currentPlayerIndex: 2,
      updatedAtMs: 500,
    });

    clearWordEntryProgressFromStorage();

    assert.notEqual(storage.getItem(GAME_STATE_STORAGE_KEY), null);
    assert.equal(storage.getItem(WORD_ENTRY_PROGRESS_STORAGE_KEY), null);
  } finally {
    uninstallWindow();
  }
}

function run() {
  testGameStateRoundTrip();
  testInvalidStoredGameStateReturnsNull();
  testWordEntryProgressRoundTrip();
  testInvalidWordEntryProgressReturnsNull();
  testClearStoredGameStateAlsoClearsWordEntryProgress();
  testClearWordEntryProgressOnlyClearsProgress();
  console.log('game-session tests passed');
}

run();
