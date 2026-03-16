'use client';

import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  getScoreboard,
  getSectionProgress,
  reduceGame,
  type GameAction,
  type GameState,
} from '@/lib/game-engine';
import {
  loadGameStateFromStorage,
  saveGameStateToStorage,
} from '@/lib/game-session';

export default function RoundSummaryPage() {
  const router = useRouter();
  const initialGameState = useMemo(() => loadGameStateFromStorage(), []);
  const [state, setState] = useState<GameState | null>(initialGameState);
  const [error, setError] = useState<string | null>(
    initialGameState ? null : 'No round results available. Start from setup.',
  );

  const applyAction = useCallback(
    (action: GameAction, onSuccess?: () => void) => {
      setState((previous) => {
        if (!previous) {
          return previous;
        }

        try {
          const next = reduceGame(previous, action);
          saveGameStateToStorage(next);
          setError(null);
          onSuccess?.();
          return next;
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to advance to the next step.',
          );
          return previous;
        }
      });
    },
    [],
  );

  const handleNextRound = useCallback(() => {
    applyAction({ type: 'NEXT_ROUND', nowMs: Date.now() }, () => {
      router.push('/game/round');
    });
  }, [applyAction, router]);

  const handleNextSection = useCallback(() => {
    applyAction({ type: 'NEXT_SECTION', nowMs: Date.now() }, () => {
      router.push('/game/round');
    });
  }, [applyAction, router]);

  const lastRound = useMemo(() => {
    if (!state || state.rounds.length === 0) {
      return null;
    }
    return state.rounds[state.rounds.length - 1] ?? null;
  }, [state]);

  const guessedWords =
    lastRound?.guessedWordIds.map((wordId) => ({
      id: wordId,
      text: state?.words[wordId]?.text ?? 'Unknown word',
    })) ?? [];
  const skippedWords =
    lastRound?.skippedWordIds.map((wordId) => ({
      id: wordId,
      text: state?.words[wordId]?.text ?? 'Unknown word',
    })) ?? [];

  const scoreboard = state ? getScoreboard(state) : null;
  const progress = state ? getSectionProgress(state) : null;
  const latestSectionScore =
    state?.sectionScores[state.sectionScores.length - 1] ?? null;

  function renderRoundDetails() {
    if (!lastRound) {
      return null;
    }

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="text-base font-medium">Round recap</p>
        <p className="mt-1 text-muted-foreground">
          Team {state?.teams.find((team) => team.id === lastRound.teamId)?.name}{' '}
          • Clue giver{' '}
          {
            state?.players.find(
              (player) => player.id === lastRound.clueGiverPlayerId,
            )?.name
          }
        </p>
        <div className="mt-3 space-y-2">
          <div>
            <p className="font-semibold">
              Guessed words ({guessedWords.length})
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {guessedWords.length > 0 ? (
                guessedWords.map((word) => <li key={word.id}>{word.text}</li>)
              ) : (
                <li className="list-none text-muted-foreground">
                  No words guessed.
                </li>
              )}
            </ul>
          </div>
          <div>
            <p className="font-semibold">
              Skipped words ({skippedWords.length})
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {skippedWords.length > 0 ? (
                skippedWords.map((word) => <li key={word.id}>{word.text}</li>)
              ) : (
                <li className="list-none text-muted-foreground">
                  No skips recorded.
                </li>
              )}
            </ul>
          </div>
        </div>
      </section>
    );
  }

  function renderScoreboard() {
    if (!scoreboard) {
      return null;
    }

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="text-base font-medium">Scoreboard</p>
        <ul className="mt-3 space-y-1">
          {Object.entries(scoreboard).map(([teamName, points]) => (
            <li className="flex items-center justify-between" key={teamName}>
              <span>{teamName}</span>
              <span className="font-semibold">{points}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderSectionSummary() {
    if (!latestSectionScore) {
      return null;
    }

    const winner =
      state?.teams.find((team) => team.id === latestSectionScore.winnerTeamId)
        ?.name ?? 'Tie';

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="text-base font-medium">
          Section {latestSectionScore.section} totals
        </p>
        <ul className="mt-2 space-y-1">
          {Object.entries(latestSectionScore.teamScores).map(
            ([teamId, score]) => {
              const teamName =
                state?.teams.find((team) => team.id === teamId)?.name ?? teamId;
              return (
                <li className="flex items-center justify-between" key={teamId}>
                  <span>{teamName}</span>
                  <span className="font-semibold">{score}</span>
                </li>
              );
            },
          )}
        </ul>
        <p className="mt-2 text-sm text-muted-foreground">
          Winner: <span className="font-medium">{winner}</span>
        </p>
      </section>
    );
  }

  function renderProgress() {
    if (!progress) {
      return null;
    }

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="text-base font-medium">Words remaining</p>
        <p className="mt-1">
          {progress.remainingWordCount} of {progress.totalWordCount} words left
          in the bowl.
        </p>
      </section>
    );
  }

  function renderActions() {
    if (!state) {
      return null;
    }

    if (state.phase === 'round_summary') {
      return (
        <Button className="w-full" onClick={handleNextRound}>
          Start next round
        </Button>
      );
    }

    if (state.phase === 'section_transition') {
      return (
        <Button className="w-full" onClick={handleNextSection}>
          Continue to section {state.section}
        </Button>
      );
    }

    if (state.phase === 'match_complete') {
      return (
        <Button asChild className="w-full">
          <Link href="/game/game-summary">View final results</Link>
        </Button>
      );
    }

    return null;
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Round summary</h1>
        <p className="text-sm text-muted-foreground">
          Review guessed words, bowl progress, and section totals.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {state ? (
        <>
          {renderRoundDetails()}
          {renderScoreboard()}
          {renderSectionSummary()}
          {renderProgress()}
          {renderActions()}
        </>
      ) : (
        <section className="rounded-lg border p-4">
          <p className="text-sm">No round data available yet.</p>
          <Button asChild className="mt-3 w-full">
            <Link href="/game/setup">Back to setup</Link>
          </Button>
        </section>
      )}
    </main>
  );
}
