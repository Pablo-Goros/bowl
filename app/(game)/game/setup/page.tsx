'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DEFAULT_WORDS_PER_PLAYER,
  MAX_WORDS_PER_PLAYER,
  MIN_WORDS_PER_PLAYER,
  getBalanceSuggestion,
  normalizeSetupDraft,
  validateSetupDraft,
  type SetupDraft,
} from '@/lib/game-engine';
import {
  serializeSetupDraft,
  SETUP_DRAFT_STORAGE_KEY,
  clearStoredGameState,
  loadSetupDraftFromStorage,
  saveNewGameInputToStorage,
  toNewGameInputFromSetup,
} from '@/lib/game-session';

const defaultDraft: SetupDraft = {
  teamA: {
    name: '',
    players: [''],
  },
  teamB: {
    name: '',
    players: [''],
  },
  wordsPerPlayer: DEFAULT_WORDS_PER_PLAYER,
};

function updatePlayer(
  draft: SetupDraft,
  teamKey: 'teamA' | 'teamB',
  index: number,
  name: string,
): SetupDraft {
  return {
    ...draft,
    [teamKey]: {
      ...draft[teamKey],
      players: draft[teamKey].players.map((player, playerIndex) =>
        playerIndex === index ? name : player,
      ),
    },
  };
}

export default function SetupPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>(() => {
    const stored = loadSetupDraftFromStorage();
    return stored ?? defaultDraft;
  });
  const [errors, setErrors] = useState<string[]>([]);

  const balanceSuggestion = useMemo(() => getBalanceSuggestion(draft), [draft]);

  function addPlayer(teamKey: 'teamA' | 'teamB') {
    setDraft((previous) => ({
      ...previous,
      [teamKey]: {
        ...previous[teamKey],
        players: [...previous[teamKey].players, ''],
      },
    }));
  }

  function removePlayer(teamKey: 'teamA' | 'teamB', index: number) {
    setDraft((previous) => {
      const players = previous[teamKey].players.filter((_, i) => i !== index);
      return {
        ...previous,
        [teamKey]: {
          ...previous[teamKey],
          players: players.length > 0 ? players : [''],
        },
      };
    });
  }

  function submitSetup() {
    const normalized = normalizeSetupDraft(draft);
    const validation = validateSetupDraft(normalized);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    const sessionInput = toNewGameInputFromSetup(normalized);
    window.sessionStorage.setItem(
      SETUP_DRAFT_STORAGE_KEY,
      serializeSetupDraft(normalized),
    );
    saveNewGameInputToStorage(sessionInput);
    clearStoredGameState();

    setErrors([]);
    router.push('/game/word-entry');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Game setup</h1>
        <p className="text-sm text-muted-foreground">
          Add team names and players to create a session.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <label className="flex flex-col gap-2 text-sm">
          Words per player
          <select
            className="rounded-md border px-3 py-2"
            value={draft.wordsPerPlayer}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                wordsPerPlayer: Number(event.target.value),
              }))
            }
          >
            {Array.from(
              { length: MAX_WORDS_PER_PLAYER - MIN_WORDS_PER_PLAYER + 1 },
              (_, index) => MIN_WORDS_PER_PLAYER + index,
            ).map((count) => (
              <option key={count} value={count}>
                {count} words
                {count === DEFAULT_WORDS_PER_PLAYER ? ' (recommended)' : ''}
              </option>
            ))}
          </select>
        </label>
        <p className="text-xs text-muted-foreground">
          Every player will enter exactly {draft.wordsPerPlayer} words before
          the game starts.
        </p>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <label className="flex flex-col gap-2 text-sm">
          First team
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Team A"
            value={draft.teamA.name}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                teamA: { ...previous.teamA, name: event.target.value },
              }))
            }
          />
        </label>
        {draft.teamA.players.map((player, index) => (
          <div key={`team-a-${index}`} className="flex items-center gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder={`Player ${index + 1}`}
              value={player}
              onChange={(event) =>
                setDraft((previous) =>
                  updatePlayer(previous, 'teamA', index, event.target.value),
                )
              }
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => removePlayer('teamA', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          type="button"
          onClick={() => addPlayer('teamA')}
        >
          Add Team A player
        </Button>
      </section>

      <section className="space-y-4 rounded-lg border p-4">
        <label className="flex flex-col gap-2 text-sm">
          Second team
          <input
            className="rounded-md border px-3 py-2"
            placeholder="Team B"
            value={draft.teamB.name}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                teamB: { ...previous.teamB, name: event.target.value },
              }))
            }
          />
        </label>
        {draft.teamB.players.map((player, index) => (
          <div key={`team-b-${index}`} className="flex items-center gap-2">
            <input
              className="flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder={`Player ${index + 1}`}
              value={player}
              onChange={(event) =>
                setDraft((previous) =>
                  updatePlayer(previous, 'teamB', index, event.target.value),
                )
              }
            />
            <Button
              variant="outline"
              type="button"
              onClick={() => removePlayer('teamB', index)}
            >
              Remove
            </Button>
          </div>
        ))}
        <Button
          variant="secondary"
          type="button"
          onClick={() => addPlayer('teamB')}
        >
          Add Team B player
        </Button>
      </section>

      {balanceSuggestion ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {balanceSuggestion}
        </p>
      ) : null}

      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <Button type="button" onClick={submitSetup}>
        Continue to word entry
      </Button>
    </main>
  );
}
