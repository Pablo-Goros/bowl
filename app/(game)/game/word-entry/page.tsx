'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

import {
  GameChip,
  GamePanel,
  GameShell,
  GameViewport,
} from '@/components/game/game-shell';
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
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const [revealedFieldIds, setRevealedFieldIds] = useState<string[]>([]);
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
  const filledWordCount =
    input && currentPlayer
      ? getFilledWordCount(input.wordsByPlayer[currentPlayer.key])
      : 0;
  const progressPercent =
    input && input.wordsPerPlayer > 0
      ? (filledWordCount / input.wordsPerPlayer) * 100
      : 0;

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
    setFocusedFieldId(null);
    setRevealedFieldIds([]);

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
    <GameViewport>
      <GameShell innerClassName="gap-5">
        <header className="space-y-5">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href="/game/setup">
                <ArrowLeft className="size-4" />
                <span className="sr-only">Back to setup</span>
              </Link>
            </Button>
            <GameChip>Word Entry</GameChip>
            <div className="size-10" />
          </div>

          <div className="space-y-3 text-center">
            <h1 className="font-display text-4xl font-semibold text-[#f0e0bf]">
              Word entry
            </h1>
            <p className="text-sm leading-7 text-[#cdb98f]/76">
              Pass the phone player by player and collect exactly{' '}
              {input?.wordsPerPlayer ?? 0} entries from each person.
            </p>
          </div>
        </header>

        {roundsStarted ? (
          <div className="rounded-[1.5rem] border border-[#e7bc4a]/22 bg-[#261f18] px-4 py-3 text-sm text-[#eadab9]">
            Rounds have already started, so word lists are locked for this game.
          </div>
        ) : restoredWordEntryProgress ? (
          <div
            className="rounded-[1.5rem] border border-[#e7bc4a]/22 bg-[#261f18] px-4 py-3 text-sm text-[#eadab9]"
            data-testid="word-entry-restored-progress"
          >
            Restored the last word-entry handoff so players can keep going where
            they left off.
          </div>
        ) : (
          <GamePanel className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-[1rem] border border-[#dbad49]/22 bg-[#221d18] text-[#f0c661]">
                <Lock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#eadab9]">
                  Word entry notes
                </p>
                <ul className="mt-2 space-y-2 text-sm leading-6 text-[#cdb98f]/76">
                  <li>
                    Players can enter any words or phrases they want to play
                    with.
                  </li>
                  <li>
                    Setup currently allows {MIN_WORDS_PER_PLAYER} to{' '}
                    {MAX_WORDS_PER_PLAYER} words per player, with 4 recommended.
                  </li>
                  <li>
                    Entries are covered after typing so the next player cannot
                    see them.
                  </li>
                </ul>
              </div>
            </div>
          </GamePanel>
        )}

        {errors.length > 0 ? (
          <div className="rounded-[1.5rem] border border-[#a35d3a]/30 bg-[#241411] px-4 py-3 text-sm text-[#f2c8b5]">
            <ul className="space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {input && currentPlayer ? (
          <>
            <GamePanel
              className="space-y-4"
              data-testid="word-entry-current-player-card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                    Player {safeCurrentPlayerIndex + 1} of {playerCards.length}
                  </p>
                  <p className="text-2xl font-semibold text-[#f0e0bf]">
                    {currentPlayer.playerName}
                  </p>
                  <p
                    className="text-sm text-[#cdb98f]/76"
                    data-testid="word-entry-current-player"
                  >
                    {currentPlayer.playerName} - {currentPlayer.teamName}
                  </p>
                </div>

                <div className="rounded-[1.25rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-3 text-right">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#cdb98f]/76">
                    Bowl size
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f0e0bf]">
                    {totalWords}
                  </p>
                  <p className="text-xs text-[#cdb98f]/76">
                    {input.wordsPerPlayer} each
                  </p>
                </div>
              </div>
            </GamePanel>

            <GamePanel className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                    Private handoff
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[#f0e0bf]">
                    {currentPlayer.playerName}, enter your words
                  </p>
                  <p className="mt-1 text-sm text-[#cdb98f]/76">
                    Hand the phone to this player only.
                  </p>
                </div>
                <div className="rounded-[1.1rem] border border-[#dbad49]/18 bg-[#211c17] px-3 py-2 text-sm font-semibold text-[#eadab9]">
                  {filledWordCount}/{input.wordsPerPlayer}
                </div>
              </div>

              <div className="velvet-meter h-2 overflow-hidden rounded-full">
                <div
                  className="velvet-meter-fill h-full rounded-full transition-[width] duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-3">
                {currentWords.map((word, wordIndex) => {
                  const fieldId = `${currentPlayer.key}-${wordIndex}`;
                  const isRevealed = revealedFieldIds.includes(fieldId);
                  const showPlainText =
                    isRevealed ||
                    focusedFieldId === fieldId ||
                    word.length === 0;

                  return (
                    <label
                      className="flex items-center gap-3 text-sm"
                      key={fieldId}
                    >
                      <span className="flex size-10 items-center justify-center rounded-[1rem] border border-[#dbad49]/18 bg-[#211c17] text-xs font-semibold text-[#f0c661]">
                        {wordIndex + 1}
                      </span>

                      <div className="relative flex-1">
                        <input
                          autoFocus={wordIndex === 0}
                          className="velvet-input pr-13"
                          type={showPlainText ? 'text' : 'password'}
                          placeholder={`Entry ${wordIndex + 1}`}
                          data-testid={`word-entry-input-${wordIndex}`}
                          value={word}
                          autoComplete="off"
                          onBlur={() =>
                            setFocusedFieldId((previous) =>
                              previous === fieldId ? null : previous,
                            )
                          }
                          onChange={(event) =>
                            updateWord(wordIndex, event.target.value)
                          }
                          onFocus={() => setFocusedFieldId(fieldId)}
                          disabled={roundsStarted}
                        />
                        <button
                          className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#e7bc4a] transition hover:bg-[#2b241e]"
                          type="button"
                          onClick={() =>
                            setRevealedFieldIds((previous) =>
                              previous.includes(fieldId)
                                ? previous.filter(
                                    (candidate) => candidate !== fieldId,
                                  )
                                : [...previous, fieldId],
                            )
                          }
                          disabled={roundsStarted && word.length === 0}
                          data-testid={`word-entry-reveal-${wordIndex}`}
                          aria-label={
                            isRevealed ? 'Hide word entry' : 'Reveal word entry'
                          }
                        >
                          {isRevealed ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </label>
                  );
                })}
              </div>
            </GamePanel>
          </>
        ) : (
          <GamePanel className="text-sm text-[#cdb98f]/76">
            No setup found. Start from setup to create a session.
          </GamePanel>
        )}

        <div className="grid gap-2 pb-1">
          <Button asChild variant="outline">
            <Link href="/game/setup">
              <ArrowLeft className="size-4" />
              Back to setup
            </Link>
          </Button>

          {input && currentPlayer ? (
            <>
              <Button
                type="button"
                variant="secondary"
                data-testid="word-entry-previous"
                onClick={() => {
                  setErrors([]);
                  setFocusedFieldId(null);
                  setRevealedFieldIds([]);
                  setCurrentPlayerIndex((previous) => previous - 1);
                }}
                disabled={!canGoPrevious}
              >
                <ChevronLeft className="size-4" />
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
                <ChevronRight className="size-4" />
              </Button>
            </>
          ) : null}
        </div>
      </GameShell>
    </GameViewport>
  );
}
