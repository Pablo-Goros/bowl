'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ConfirmToast } from '@/components/ui/confirm-toast';
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
  loadGameStateFromStorage,
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

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

export default function SetupPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<SetupDraft>(() => {
    const stored = loadSetupDraftFromStorage();
    return stored ?? defaultDraft;
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const [existingGameState, setExistingGameState] = useState(() =>
    loadGameStateFromStorage(),
  );

  const balanceSuggestion = getBalanceSuggestion(draft);
  const hasRecoverableGame =
    existingGameState && existingGameState.phase !== 'match_complete';
  const resumeHref =
    existingGameState?.phase === 'match_complete'
      ? '/game/game-summary'
      : '/game/round';

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

  function continueToWordEntry(normalized: SetupDraft) {
    const sessionInput = toNewGameInputFromSetup(normalized);
    window.localStorage.setItem(
      SETUP_DRAFT_STORAGE_KEY,
      serializeSetupDraft(normalized),
    );
    saveNewGameInputToStorage(sessionInput);
    clearStoredGameState();
    setExistingGameState(null);

    setErrors([]);
    router.push('/game/word-entry');
  }

  function submitSetup() {
    const normalized = normalizeSetupDraft(draft);
    const validation = validateSetupDraft(normalized);

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    if (hasRecoverableGame) {
      setPendingConfirm({
        title: 'Replace saved game?',
        description:
          'A game is already in progress. Replacing it will clear the saved round and word-entry recovery state.',
        confirmLabel: 'Replace game',
        onConfirm: () => continueToWordEntry(normalized),
      });
      return;
    }

    continueToWordEntry(normalized);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Game setup</h1>
        <p className="text-sm text-muted-foreground">
          Add team names and players to create a session.
        </p>
      </header>

      {hasRecoverableGame ? (
        <section className="rounded-lg border border-sky-300 bg-sky-50 p-4 text-sm text-sky-950">
          <p className="font-medium">Saved game detected</p>
          <p className="mt-1 text-sky-900">
            Resume the current session instead of overwriting it from setup.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            <Button asChild>
              <Link href={resumeHref} data-testid="resume-saved-game">
                Resume saved game
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearStoredGameState();
                setExistingGameState(null);
                setPendingConfirm(null);
              }}
            >
              Clear saved game
            </Button>
          </div>
        </section>
      ) : null}

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
            data-testid="setup-team-a-name"
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
              data-testid={`setup-team-a-player-${index}`}
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
            data-testid="setup-team-b-name"
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
              data-testid={`setup-team-b-player-${index}`}
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

      <Button type="button" onClick={submitSetup} data-testid="setup-continue">
        Continue to word entry
      </Button>

      <ConfirmToast
        open={Boolean(pendingConfirm)}
        title={pendingConfirm?.title ?? ''}
        description={pendingConfirm?.description ?? ''}
        confirmLabel={pendingConfirm?.confirmLabel}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => {
          pendingConfirm?.onConfirm();
          setPendingConfirm(null);
        }}
      />
    </main>
  );
}
