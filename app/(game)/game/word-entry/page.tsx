'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { toPlayerWordKey, type NewGameInput } from '@/lib/game-engine';
import {
  MAX_WORDS_PER_PLAYER,
  MIN_WORDS_PER_PLAYER,
  clearWordEntryProgressFromStorage,
  loadGameStateFromStorage,
  loadNewGameInputFromStorage,
  loadWordEntryProgressFromStorage,
  normalizeWordsForGameInput,
  saveNewGameInputToStorage,
  saveWordEntryProgressToStorage,
  validateWordsForGameInput,
} from '@/lib/game-session';

type PlayerCard = {
  key: string;
  playerName: string;
  teamName: string;
};

function buildPlayerCards(input: NewGameInput): PlayerCard[] {
  return [
    ...input.teamAPlayers.map((playerName, seatIndex) => ({
      key: toPlayerWordKey('team-a', seatIndex),
      playerName,
      teamName: input.teamAName,
    })),
    ...input.teamBPlayers.map((playerName, seatIndex) => ({
      key: toPlayerWordKey('team-b', seatIndex),
      playerName,
      teamName: input.teamBName,
    })),
  ];
}

function getWordSlots(
  words: string[] | undefined,
  wordsPerPlayer: number,
): string[] {
  return Array.from(
    { length: wordsPerPlayer },
    (_, index) => words?.[index] ?? '',
  );
}

function getFilledWordCount(words: string[] | undefined): number {
  return words?.map((word) => word.trim()).filter(Boolean).length ?? 0;
}

export default function WordEntryPage() {
  const router = useRouter();
  const [roundsStarted] = useState(() => {
    const state = loadGameStateFromStorage();
    return Boolean(state && state.rounds.length > 0);
  });
  const [input, setInput] = useState<NewGameInput | null>(() =>
    loadNewGameInputFromStorage(),
  );
  const [savedWordEntryProgress] = useState(() =>
    roundsStarted ? null : loadWordEntryProgressFromStorage(),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [revealedFieldId, setRevealedFieldId] = useState<string | null>(null);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(
    () => savedWordEntryProgress?.currentPlayerIndex ?? 0,
  );

  const playerCards = useMemo(
    () => (input ? buildPlayerCards(input) : []),
    [input],
  );

  useEffect(() => {
    if (!input || roundsStarted) {
      return;
    }

    saveNewGameInputToStorage(input);
  }, [input, roundsStarted]);

  const unmetRequirements = useMemo(() => {
    if (!input) {
      return ['No session data found. Complete setup first.'];
    }

    return validateWordsForGameInput(input);
  }, [input]);

  const totalWords = useMemo(
    () =>
      playerCards.reduce((sum, player) => {
        if (!input) {
          return sum;
        }

        return sum + getFilledWordCount(input.wordsByPlayer[player.key]);
      }, 0),
    [input, playerCards],
  );

  const safeCurrentPlayerIndex =
    playerCards.length === 0
      ? 0
      : Math.min(currentPlayerIndex, playerCards.length - 1);
  const currentPlayer = playerCards[safeCurrentPlayerIndex] ?? null;
  const currentWords =
    input && currentPlayer
      ? getWordSlots(
          input.wordsByPlayer[currentPlayer.key],
          input.wordsPerPlayer,
        )
      : [];
  const currentPlayerComplete =
    input && currentPlayer
      ? getFilledWordCount(input.wordsByPlayer[currentPlayer.key]) >=
        input.wordsPerPlayer
      : false;
  const restoredWordEntryProgress =
    !roundsStarted && Boolean(savedWordEntryProgress);
  const allPlayersComplete = unmetRequirements.length === 0;
  const canGoPrevious = safeCurrentPlayerIndex > 0;
  const isLastPlayer = safeCurrentPlayerIndex === playerCards.length - 1;
  const canGoNext =
    roundsStarted ||
    Boolean(
      currentPlayer &&
      currentPlayerComplete &&
      (!isLastPlayer || allPlayersComplete),
    );

  useEffect(() => {
    if (!input || roundsStarted || playerCards.length === 0) {
      return;
    }

    saveWordEntryProgressToStorage({
      currentPlayerIndex: safeCurrentPlayerIndex,
      updatedAtMs: Date.now(),
    });
  }, [input, playerCards.length, roundsStarted, safeCurrentPlayerIndex]);

  function updateWord(wordIndex: number, value: string) {
    setInput((previous) => {
      if (!previous || !currentPlayer) {
        return previous;
      }

      const nextWords = getWordSlots(
        previous.wordsByPlayer[currentPlayer.key],
        previous.wordsPerPlayer,
      );
      nextWords[wordIndex] = value;

      return {
        ...previous,
        wordsByPlayer: {
          ...previous.wordsByPlayer,
          [currentPlayer.key]: nextWords,
        },
      };
    });
  }

  function moveToNextPlayer() {
    if (!currentPlayer || !input) {
      return;
    }

    if (!currentPlayerComplete && !roundsStarted) {
      setErrors([
        `Finish all ${input.wordsPerPlayer} entries for ${currentPlayer.playerName} before continuing.`,
      ]);
      return;
    }

    setErrors([]);
    setRevealedFieldId(null);

    if (safeCurrentPlayerIndex < playerCards.length - 1) {
      setCurrentPlayerIndex((previous) => previous + 1);
      return;
    }

    handleContinue();
  }

  function handleContinue() {
    if (!input) {
      setErrors(['No session data found. Complete setup first.']);
      return;
    }

    const normalized = normalizeWordsForGameInput(input);
    const validationErrors = validateWordsForGameInput(normalized);

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      const firstIncompletePlayerIndex = Math.max(
        0,
        playerCards.findIndex(
          (player) =>
            getFilledWordCount(normalized.wordsByPlayer[player.key]) <
            normalized.wordsPerPlayer,
        ),
      );
      setCurrentPlayerIndex(firstIncompletePlayerIndex);
      return;
    }

    saveNewGameInputToStorage(normalized);
    clearWordEntryProgressFromStorage();
    setErrors([]);
    router.push('/game/round');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Word entry</h1>
        <p className="text-sm text-muted-foreground">
          Pass the phone player by player and collect exactly{' '}
          {input?.wordsPerPlayer ?? 0} entries from each person.
        </p>
      </header>

      {roundsStarted ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Rounds have already started, so word lists are locked for this game.
        </p>
      ) : restoredWordEntryProgress ? (
        <p
          className="rounded-lg border border-sky-300 bg-sky-50 px-3 py-2 text-sm text-sky-900"
          data-testid="word-entry-restored-progress"
        >
          Restored the last word-entry handoff so players can keep going where
          they left off.
        </p>
      ) : (
        <section className="rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Word entry notes</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              Players can enter any words or phrases they want to play with.
            </li>
            <li>
              Setup currently allows {MIN_WORDS_PER_PLAYER} to{' '}
              {MAX_WORDS_PER_PLAYER} words per player, with 4 recommended.
            </li>
            <li>
              Entries are covered after typing so the next player cannot see
              them.
            </li>
          </ul>
        </section>
      )}

      {errors.length > 0 ? (
        <ul className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      {input && currentPlayer ? (
        <>
          <section
            className="rounded-xl border p-4 text-sm"
            data-testid="word-entry-current-player-card"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  Player {safeCurrentPlayerIndex + 1} of {playerCards.length}
                </p>
                <p
                  className="text-muted-foreground"
                  data-testid="word-entry-current-player"
                >
                  {currentPlayer.playerName} - {currentPlayer.teamName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Bowl size
                </p>
                <p className="text-2xl font-semibold">{totalWords}</p>
                <p className="text-xs text-muted-foreground">
                  {input.wordsPerPlayer} each
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium">{currentPlayer.playerName}</p>
                <p className="text-sm text-muted-foreground">
                  Hand the phone to this player only.
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                {getFilledWordCount(input.wordsByPlayer[currentPlayer.key])}/
                {input.wordsPerPlayer}
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {currentWords.map((word, wordIndex) => {
                const fieldId = `${currentPlayer.key}-${wordIndex}`;
                const isRevealed = revealedFieldId === fieldId;

                return (
                  <label
                    className="flex items-center gap-3 text-sm"
                    key={fieldId}
                  >
                    <span className="w-5 text-right text-xs text-muted-foreground">
                      {wordIndex + 1}
                    </span>

                    {word && !isRevealed ? (
                      <button
                        className="flex h-11 flex-1 items-center justify-between rounded-md border border-dashed px-3 py-2 text-left text-muted-foreground"
                        type="button"
                        onClick={() => setRevealedFieldId(fieldId)}
                        disabled={roundsStarted}
                        data-testid={`word-entry-reveal-${wordIndex}`}
                      >
                        <span>
                          {'*'.repeat(Math.max(word.trim().length, 6))}
                        </span>
                        <span className="text-xs uppercase tracking-[0.2em]">
                          Reveal
                        </span>
                      </button>
                    ) : (
                      <input
                        autoFocus={isRevealed || wordIndex === 0}
                        className="h-11 flex-1 rounded-md border px-3 py-2"
                        placeholder={`Entry ${wordIndex + 1}`}
                        data-testid={`word-entry-input-${wordIndex}`}
                        value={word}
                        onBlur={() => setRevealedFieldId(null)}
                        onChange={(event) =>
                          updateWord(wordIndex, event.target.value)
                        }
                        onFocus={() => setRevealedFieldId(fieldId)}
                        disabled={roundsStarted}
                      />
                    )}
                  </label>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-lg border p-4 text-sm text-muted-foreground">
          No setup found. Start from setup to create a session.
        </section>
      )}

      <div className="flex flex-col gap-2 pb-4">
        <Button asChild variant="outline">
          <Link href="/game/setup">Back to setup</Link>
        </Button>

        {input && currentPlayer ? (
          <>
            <Button
              type="button"
              variant="secondary"
              data-testid="word-entry-previous"
              onClick={() => {
                setErrors([]);
                setRevealedFieldId(null);
                setCurrentPlayerIndex((previous) => previous - 1);
              }}
              disabled={!canGoPrevious}
            >
              Previous player
            </Button>
            <Button
              type="button"
              data-testid="word-entry-next"
              onClick={moveToNextPlayer}
              disabled={!canGoNext}
            >
              {isLastPlayer
                ? roundsStarted
                  ? 'Return to round flow'
                  : allPlayersComplete
                    ? 'Save words and continue'
                    : 'Finish final player'
                : 'Save and pass to next player'}
            </Button>
          </>
        ) : null}
      </div>
    </main>
  );
}
