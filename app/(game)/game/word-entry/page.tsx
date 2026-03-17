'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { toPlayerWordKey, type NewGameInput } from '@/lib/game-engine';
import {
  MAX_WORDS_PER_PLAYER,
  MIN_WORDS_PER_PLAYER,
  loadGameStateFromStorage,
  loadNewGameInputFromStorage,
  normalizeWordsForGameInput,
  saveNewGameInputToStorage,
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
  const [input, setInput] = useState<NewGameInput | null>(() =>
    loadNewGameInputFromStorage(),
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [revealedFieldId, setRevealedFieldId] = useState<string | null>(null);
  const [roundsStarted] = useState(() => {
    const state = loadGameStateFromStorage();
    return Boolean(state && state.rounds.length > 0);
  });

  useEffect(() => {
    if (!input || roundsStarted) {
      return;
    }

    saveNewGameInputToStorage(input);
  }, [input, roundsStarted]);

  const playerCards = useMemo(
    () => (input ? buildPlayerCards(input) : []),
    [input],
  );
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
  const unmetRequirements = useMemo(() => {
    if (!input) {
      return ['No session data found. Complete setup first.'];
    }

    return validateWordsForGameInput(input);
  }, [input]);
  const canContinue =
    Boolean(input) && (roundsStarted || unmetRequirements.length === 0);

  function updateWord(playerKey: string, wordIndex: number, value: string) {
    setInput((previous) => {
      if (!previous) {
        return previous;
      }

      const nextWords = getWordSlots(
        previous.wordsByPlayer[playerKey],
        previous.wordsPerPlayer,
      );
      nextWords[wordIndex] = value;

      return {
        ...previous,
        wordsByPlayer: {
          ...previous.wordsByPlayer,
          [playerKey]: nextWords,
        },
      };
    });
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
      return;
    }

    saveNewGameInputToStorage(normalized);
    setErrors([]);
    router.push('/game/round');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-5 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Word entry</h1>
        <p className="text-sm text-muted-foreground">
          Each player adds exactly {input?.wordsPerPlayer ?? 0} entries for the
          shared bowl.
        </p>
      </header>

      {roundsStarted ? (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Rounds have already started, so word lists are locked for this game.
        </p>
      ) : (
        <section className="rounded-xl border bg-muted/30 p-4 text-sm">
          <p className="font-medium">Rule reminders</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              Players can enter any words or phrases they want to play with.
            </li>
            <li>
              Setup currently allows {MIN_WORDS_PER_PLAYER} to{' '}
              {MAX_WORDS_PER_PLAYER} words per player, with 4 recommended.
            </li>
            <li>More entries make the full match longer.</li>
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

      {input ? (
        <>
          <section className="rounded-xl border p-4 text-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-medium">Session roster</p>
                <p className="text-muted-foreground">
                  {input.teamAName} vs {input.teamBName}
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

          <div className="space-y-4">
            {playerCards.map((player) => {
              const filledWordCount = getFilledWordCount(
                input.wordsByPlayer[player.key],
              );
              const slots = getWordSlots(
                input.wordsByPlayer[player.key],
                input.wordsPerPlayer,
              );

              return (
                <section className="rounded-xl border p-4" key={player.key}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{player.playerName}</p>
                      <p className="text-sm text-muted-foreground">
                        {player.teamName}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {filledWordCount}/{input.wordsPerPlayer}
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
                    {slots.map((word, wordIndex) => {
                      const fieldId = `${player.key}-${wordIndex}`;
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
                              className="flex flex-1 items-center justify-between rounded-md border border-dashed px-3 py-2 text-left text-muted-foreground"
                              type="button"
                              onClick={() => setRevealedFieldId(fieldId)}
                              disabled={roundsStarted}
                            >
                              <span>
                                {'•'.repeat(Math.max(word.trim().length, 6))}
                              </span>
                              <span className="text-xs uppercase tracking-[0.2em]">
                                Reveal
                              </span>
                            </button>
                          ) : (
                            <input
                              autoFocus={isRevealed}
                              className="flex-1 rounded-md border px-3 py-2"
                              placeholder={`Word ${wordIndex + 1}`}
                              value={word}
                              onBlur={() => setRevealedFieldId(null)}
                              onChange={(event) =>
                                updateWord(
                                  player.key,
                                  wordIndex,
                                  event.target.value,
                                )
                              }
                              onFocus={() => setRevealedFieldId(fieldId)}
                              disabled={roundsStarted}
                            />
                          )}
                        </label>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground">
                    {filledWordCount < input.wordsPerPlayer
                      ? `${input.wordsPerPlayer - filledWordCount} more word${input.wordsPerPlayer - filledWordCount === 1 ? '' : 's'} needed before the game can start.`
                      : 'Ready for round play.'}
                  </p>
                </section>
              );
            })}
          </div>
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
        <Button type="button" onClick={handleContinue} disabled={!canContinue}>
          {roundsStarted ? 'Return to round flow' : 'Save words and continue'}
        </Button>
      </div>
    </main>
  );
}
