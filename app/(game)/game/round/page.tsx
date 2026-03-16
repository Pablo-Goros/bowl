'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  createInitialGameState,
  getActiveRound,
  getCurrentPlayerName,
  getCurrentTeam,
  getScoreboard,
  getSectionProgress,
  reduceGame,
  type GameAction,
  type GameState,
  type RoundEndReason,
} from '@/lib/game-engine';
import {
  clearStoredGameState,
  ensureWordsForGameInput,
  loadGameStateFromStorage,
  loadNewGameInputFromStorage,
  saveGameStateToStorage,
} from '@/lib/game-session';

type ActionOptions = {
  navigateToSummary?: boolean;
};

export default function RoundPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [autoEndedRoundId, setAutoEndedRoundId] = useState<string | null>(null);

  useEffect(() => {
    const storedState = loadGameStateFromStorage();
    if (storedState) {
      setState(storedState);
      setHydrated(true);
      return;
    }

    const input = loadNewGameInputFromStorage();
    if (!input) {
      setError('No session data found. Complete setup first.');
      setHydrated(true);
      return;
    }

    try {
      const initial = createInitialGameState(ensureWordsForGameInput(input));
      setState(initial);
      saveGameStateToStorage(initial);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to create a new game.',
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !state) {
      return;
    }

    if (
      state.phase === 'round_summary' ||
      state.phase === 'section_transition'
    ) {
      router.replace('/game/round-summary');
      return;
    }

    if (state.phase === 'match_complete') {
      router.replace('/game/game-summary');
    }
  }, [hydrated, router, state]);

  const applyAction = useCallback(
    (action: GameAction, options?: ActionOptions) => {
      setState((previous) => {
        if (!previous) {
          return previous;
        }

        try {
          const next = reduceGame(previous, action);
          saveGameStateToStorage(next);
          setError(null);

          if (options?.navigateToSummary) {
            router.push('/game/round-summary');
          }

          return next;
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Unable to update the round.',
          );
          return previous;
        }
      });
    },
    [router],
  );

  const handleRoundStart = useCallback(() => {
    applyAction({ type: 'ROUND_START', nowMs: Date.now() });
  }, [applyAction]);

  const handleWordGuessed = useCallback(() => {
    applyAction({ type: 'WORD_GUESSED' });
  }, [applyAction]);

  const handleWordSkipped = useCallback(() => {
    applyAction({ type: 'WORD_SKIPPED' });
  }, [applyAction]);

  const handleEndRound = useCallback(
    (reason: RoundEndReason) => {
      applyAction({ type: 'ROUND_END', reason }, { navigateToSummary: true });
    },
    [applyAction],
  );

  const activeRound = state ? getActiveRound(state) : null;
  const currentTeam = state ? getCurrentTeam(state) : null;
  const clueGiver = state ? getCurrentPlayerName(state) : null;
  const scoreboard = state ? getScoreboard(state) : null;
  const progress = state ? getSectionProgress(state) : null;
  const activeWord =
    state && state.bowl.activeWordId
      ? state.words[state.bowl.activeWordId]
      : null;

  const phase = state?.phase;
  const activeRoundId = state?.activeRoundId ?? null;

  useEffect(() => {
    if (!hydrated || phase !== 'round_active' || !activeRoundId) {
      return;
    }

    const id = window.setInterval(() => {
      setTick((value) => value + 1);
    }, 250);

    return () => window.clearInterval(id);
  }, [activeRoundId, hydrated, phase]);

  const remainingSeconds = useMemo(() => {
    void tick;

    if (!state || state.phase !== 'round_active' || !activeRound) {
      return activeRound?.durationSec ?? 60;
    }

    const elapsedMs = Date.now() - activeRound.startedAtMs;
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    return Math.max(0, activeRound.durationSec - elapsedSeconds);
  }, [activeRound, state, tick]);

  useEffect(() => {
    if (phase !== 'round_active') {
      setAutoEndedRoundId(null);
      return;
    }

    if (!activeRoundId || remainingSeconds > 0) {
      return;
    }

    if (autoEndedRoundId === activeRoundId) {
      return;
    }

    setAutoEndedRoundId(activeRoundId);
    handleEndRound('timer');
  }, [
    activeRoundId,
    autoEndedRoundId,
    handleEndRound,
    phase,
    remainingSeconds,
  ]);

  const guessedThisRound = activeRound?.guessedWordIds.length ?? 0;
  const skippedThisRound = activeRound?.skippedWordIds.length ?? 0;
  const cardClass = 'rounded-lg border p-4 space-y-3';

  function renderScoreboard() {
    if (!scoreboard) {
      return null;
    }

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="font-medium text-base">Scoreboard</p>
        <ul className="mt-3 space-y-1">
          {Object.entries(scoreboard).map(([teamName, score]) => (
            <li className="flex items-center justify-between" key={teamName}>
              <span>{teamName}</span>
              <span className="font-semibold">{score}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  function renderProgress() {
    if (!progress) {
      return null;
    }

    return (
      <section className="rounded-lg border p-4 text-sm">
        <p className="font-medium text-base">Section progress</p>
        <div className="mt-2 space-y-1">
          <p>
            Words remaining:{' '}
            <span className="font-semibold">
              {progress.remainingWordCount} / {progress.totalWordCount}
            </span>
          </p>
          <p>Guessed this round: {guessedThisRound}</p>
          <p>Skipped this round: {skippedThisRound}</p>
        </div>
      </section>
    );
  }

  function renderReadyState() {
    return (
      <section className={cardClass}>
        <p className="text-sm text-muted-foreground">
          Section {state?.section} • 60-second turns
        </p>
        <p className="text-xl font-semibold">
          {currentTeam?.name ?? 'Next team'} is up!
        </p>
        <p className="text-sm text-muted-foreground">
          Clue giver: <span className="font-medium">{clueGiver ?? 'TBD'}</span>
        </p>
        <Button className="mt-4 w-full" onClick={handleRoundStart}>
          Start round
        </Button>
      </section>
    );
  }

  function renderActiveState() {
    return (
      <>
        <section className={`${cardClass} text-center`}>
          <p className="text-sm text-muted-foreground">
            Team {currentTeam?.name ?? '??'}
          </p>
          <p className="text-5xl font-bold tabular-nums">{remainingSeconds}s</p>
          <p className="text-lg font-semibold">
            {activeWord?.text ?? 'No words remaining'}
          </p>
          <p className="text-sm text-muted-foreground">
            Clue giver:{' '}
            <span className="font-medium">{clueGiver ?? 'Unknown'}</span>
          </p>
        </section>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button onClick={handleWordGuessed} disabled={!activeWord}>
            Guessed
          </Button>
          <Button
            variant="secondary"
            onClick={handleWordSkipped}
            disabled={!activeWord}
          >
            Skip
          </Button>
          <Button variant="destructive" onClick={() => handleEndRound('foul')}>
            Foul
          </Button>
          <Button
            variant="outline"
            onClick={() => handleEndRound('manual_end')}
          >
            End round
          </Button>
        </div>
      </>
    );
  }

  function handleResetSession() {
    clearStoredGameState();
    setState(null);
    setError(null);
    router.push('/game/setup');
  }

  const showRoundUi =
    hydrated &&
    state &&
    (state.phase === 'ready' || state.phase === 'round_active');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Section 1 round flow</h1>
        <p className="text-sm text-muted-foreground">
          Track timer, words, and scoring for each 60-second turn.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!hydrated ? (
        <section className={cardClass}>
          <p>Loading session…</p>
        </section>
      ) : null}

      {showRoundUi ? (
        <>
          {renderScoreboard()}
          {renderProgress()}
          {state?.phase === 'ready' ? renderReadyState() : renderActiveState()}
        </>
      ) : null}

      {hydrated && !state ? (
        <section className={cardClass}>
          <p>No active game found.</p>
          <Button asChild className="mt-2 w-full">
            <Link href="/game/setup">Back to setup</Link>
          </Button>
        </section>
      ) : null}

      {hydrated &&
      state &&
      state.phase !== 'ready' &&
      state.phase !== 'round_active' ? (
        <section className={cardClass}>
          <p className="text-sm">
            Current phase: {state.phase}. Continue from the summary screen to
            keep playing.
          </p>
          <Button asChild className="mt-2 w-full">
            <Link href="/game/round-summary">Open summary</Link>
          </Button>
        </section>
      ) : null}

      <div className="mt-4 flex gap-2">
        <Button asChild variant="ghost" className="flex-1">
          <Link href="/game/word-entry">Review word entry</Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleResetSession}
        >
          Reset session
        </Button>
      </div>
    </main>
  );
}
