'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { ConfirmToast } from '@/components/ui/confirm-toast';
import {
  createInitialGameState,
  getActiveRound,
  getCurrentTeam,
  getScoreboard,
  reduceGame,
  type GameAction,
  type GameState,
} from '@/lib/game-engine';
import {
  clearStoredGameState,
  ensureWordsForGameInput,
  loadGameStateFromStorage,
  loadNewGameInputFromStorage,
  saveGameStateToStorage,
} from '@/lib/game-session';

function migrateLegacyState(
  state: GameState | Record<string, unknown>,
): GameState {
  const candidate = state as GameState & {
    phase?: string;
    suddenDeath?: GameState['suddenDeath'];
  };

  const phase = String(candidate.phase ?? 'ready');
  const withCurrentPhase = {
    ...candidate,
    phase: phase === 'round_summary' ? 'ready' : candidate.phase,
  };

  if (withCurrentPhase.suddenDeath) {
    return withCurrentPhase as GameState;
  }

  return {
    ...(withCurrentPhase as GameState),
    suddenDeath: {
      active: false,
      cycleScores: Object.fromEntries(
        withCurrentPhase.teams.map((team) => [team.id, 0]),
      ),
      roundsPlayedInCycle: 0,
    },
  };
}

type PendingConfirm = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
} | null;

export default function RoundPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [autoEndedRoundId, setAutoEndedRoundId] = useState<string | null>(null);
  const [revealedWordId, setRevealedWordId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);

  useEffect(() => {
    const storedState = loadGameStateFromStorage();
    if (storedState) {
      const migrated = migrateLegacyState(storedState);
      setState(migrated);

      if (migrated !== storedState) {
        saveGameStateToStorage(migrated);
      }

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

    if (state.phase === 'match_complete') {
      router.replace('/game/game-summary');
    }
  }, [hydrated, router, state]);

  const applyAction = useCallback((action: GameAction) => {
    setState((previous) => {
      if (!previous) {
        return previous;
      }

      try {
        const next = reduceGame(previous, action);
        saveGameStateToStorage(next);
        setError(null);
        return next;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Unable to update the round.',
        );
        return previous;
      }
    });
  }, []);

  const handleRoundStart = useCallback(() => {
    applyAction({ type: 'ROUND_START', nowMs: Date.now() });
  }, [applyAction]);

  const handleWordGuessed = useCallback(() => {
    applyAction({ type: 'WORD_GUESSED' });
  }, [applyAction]);

  const handleUndoLastGuessedWord = useCallback(() => {
    applyAction({ type: 'UNDO_LAST_GUESSED_WORD' });
  }, [applyAction]);

  const handleWordSkipped = useCallback(() => {
    applyAction({ type: 'WORD_SKIPPED' });
  }, [applyAction]);

  const handleEndRound = useCallback(() => {
    setPendingConfirm({
      title: 'End round?',
      description:
        'This will stop the current timer and pass play to the other team.',
      confirmLabel: 'End round',
      onConfirm: () => applyAction({ type: 'ROUND_END', reason: 'manual_end' }),
    });
  }, [applyAction]);

  const handleNextSection = useCallback(() => {
    applyAction({ type: 'NEXT_SECTION', nowMs: Date.now() });
  }, [applyAction]);

  const activeRound = state ? getActiveRound(state) : null;
  const currentTeam = state ? getCurrentTeam(state) : null;
  const activeRoundTeam =
    state && activeRound
      ? (state.teams.find((team) => team.id === activeRound.teamId) ?? null)
      : null;
  const scoreboard = state ? getScoreboard(state) : null;
  const latestSectionScore =
    state?.sectionScores[state.sectionScores.length - 1] ?? null;
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

  useEffect(() => {
    if (!hydrated || phase !== 'round_active') {
      return;
    }

    const refreshTimer = () => {
      setTick((value) => value + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshTimer();
      }
    };

    window.addEventListener('focus', refreshTimer);
    window.addEventListener('pageshow', refreshTimer);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', refreshTimer);
      window.removeEventListener('pageshow', refreshTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [hydrated, phase]);

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
      setRevealedWordId(null);
      return;
    }

    if (!activeRoundId || remainingSeconds > 0) {
      return;
    }

    if (autoEndedRoundId === activeRoundId) {
      return;
    }

    setAutoEndedRoundId(activeRoundId);
    applyAction({ type: 'ROUND_END', reason: 'timer' });
  }, [activeRoundId, autoEndedRoundId, applyAction, phase, remainingSeconds]);

  useEffect(() => {
    if (phase !== 'round_active' || !activeRound || !activeWord) {
      setRevealedWordId(null);
      return;
    }

    const wordsSeenThisRound =
      activeRound.guessedWordIds.length + activeRound.skippedWordIds.length;

    setRevealedWordId(wordsSeenThisRound === 0 ? activeWord.id : null);
  }, [activeRound, activeWord, phase]);

  const cardClass = 'rounded-lg border p-4 space-y-3';
  const activeWordCardClass =
    'mt-6 flex min-h-36 w-full items-center justify-center rounded-lg bg-muted px-4 py-8 text-center';

  function getDisplaySection(): number | undefined {
    if (state?.suddenDeath.active) {
      return 4;
    }

    return state?.section;
  }

  function getSectionRuleLabel(section: number | undefined): string {
    switch (section) {
      case 1:
        return 'Explain with words only.';
      case 2:
        return 'Give exactly one-word clues.';
      case 3:
        return 'Act it out with no speaking.';
      case 4:
        return 'Make a sound only.';
      default:
        return 'Follow the current section rules.';
    }
  }

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

  function renderReadyState() {
    return (
      <section className={cardClass}>
        <p className="text-sm text-muted-foreground">
          {state?.suddenDeath.active
            ? 'Section 4 - sudden death'
            : `Section ${state?.section} - 60-second turns`}
        </p>
        <p className="text-xl font-semibold" data-testid="round-current-team">
          {currentTeam?.name ?? 'Next team'} is up.
        </p>
        <p className="text-sm text-muted-foreground">
          {state?.suddenDeath.active
            ? 'Section 4 rule: make a sound only. Each team gets one round per cycle. If the cycle stays tied, the bowl resets and sudden death continues.'
            : 'Players decide who holds the phone for this round. The timer will keep counting if the tab or phone is backgrounded.'}
        </p>
        <Button
          className="mt-4 w-full"
          onClick={handleRoundStart}
          data-testid="round-start"
        >
          Start round
        </Button>
      </section>
    );
  }

  function renderActiveState() {
    const isWordVisible = activeWord && revealedWordId === activeWord.id;
    const guessedThisRound = activeRound?.guessedWordIds.length ?? 0;
    const canScoreActiveWord = Boolean(activeWord && isWordVisible);

    return (
      <>
        <section className="rounded-xl border p-6 text-center">
          <p
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground"
            data-testid="round-active-team"
          >
            Section {getDisplaySection()} - Team{' '}
            {activeRoundTeam?.name ?? 'Unknown'}
          </p>
          <p
            className="mt-4 text-7xl font-bold leading-none tabular-nums"
            data-testid="round-timer"
          >
            {remainingSeconds}s
          </p>
          {activeWord ? (
            isWordVisible ? (
              <p
                className={`${activeWordCardClass} text-4xl font-semibold leading-tight`}
                data-testid="round-active-word"
              >
                {activeWord.text}
              </p>
            ) : (
              <button
                className={`${activeWordCardClass} border border-dashed bg-muted/40 text-lg font-medium text-muted-foreground`}
                type="button"
                onClick={() => setRevealedWordId(activeWord.id)}
                data-testid="round-reveal-word"
              >
                Reveal next word
              </button>
            )
          ) : (
            <p
              className={`${activeWordCardClass} text-4xl font-semibold leading-tight`}
              data-testid="round-active-word"
            >
              No words remaining
            </p>
          )}
        </section>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button
            className="h-12 text-base"
            onClick={handleWordGuessed}
            disabled={!canScoreActiveWord}
            data-testid="round-guessed"
          >
            Guessed
          </Button>
          <Button
            variant="secondary"
            className="h-12 text-base"
            onClick={handleWordSkipped}
            disabled={!canScoreActiveWord}
            data-testid="round-skipped"
          >
            Skip
          </Button>
          <Button
            variant="outline"
            className="h-12 text-base sm:col-span-2"
            onClick={handleUndoLastGuessedWord}
            disabled={guessedThisRound === 0}
            data-testid="round-undo"
          >
            Undo last guessed word
          </Button>
          <Button
            variant="destructive"
            className="h-12 text-base sm:col-span-2"
            onClick={handleEndRound}
            data-testid="round-end"
          >
            End round
          </Button>
        </div>
      </>
    );
  }

  function renderSectionTransition() {
    if (state?.suddenDeath.active) {
      return (
        <section className={cardClass}>
          <p className="text-sm text-muted-foreground">Final score was tied.</p>
          <p className="text-xl font-semibold">Section 4: sudden death.</p>
          <p className="text-sm text-muted-foreground">
            Rule: make a sound only. Teams alternate one round each. If the
            cycle is still tied, the bowl resets and another cycle starts.
          </p>
          <Button className="w-full" onClick={handleNextSection}>
            Continue to section 4
          </Button>
        </section>
      );
    }

    return (
      <section className={cardClass}>
        <p className="text-sm text-muted-foreground">
          Section {latestSectionScore?.section ?? '?'} complete.
        </p>
        {latestSectionScore ? (
          <div className="space-y-2 text-sm">
            <p className="font-medium">Section totals</p>
            <ul className="space-y-1">
              {Object.entries(latestSectionScore.teamScores).map(
                ([teamId, score]) => {
                  const teamName =
                    state?.teams.find((team) => team.id === teamId)?.name ??
                    teamId;
                  return (
                    <li
                      className="flex items-center justify-between"
                      key={teamId}
                    >
                      <span>{teamName}</span>
                      <span className="font-semibold">{score}</span>
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        ) : null}
        <p className="text-sm text-muted-foreground">
          Next up: Section {state?.section}.{' '}
          {getSectionRuleLabel(state?.section)}
        </p>
        <Button className="w-full" onClick={handleNextSection}>
          Continue to section {state?.section}
        </Button>
      </section>
    );
  }

  function handleResetSession() {
    setPendingConfirm({
      title: 'Reset session?',
      description: 'This will clear the saved game and return to setup.',
      confirmLabel: 'Reset',
      onConfirm: () => {
        clearStoredGameState();
        setState(null);
        setError(null);
        router.push('/game/setup');
      },
    });
  }

  const canReviewWords = Boolean(state && state.rounds.length === 0);
  const showRoundUi =
    hydrated &&
    state &&
    (state.phase === 'ready' ||
      state.phase === 'round_active' ||
      state.phase === 'section_transition');

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Section round flow</h1>
        <p className="text-sm text-muted-foreground">
          Start each turn manually, then track guesses against the timer.
        </p>
      </header>

      {error ? (
        <p className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {!hydrated ? (
        <section className={cardClass}>
          <p>Loading session...</p>
        </section>
      ) : null}

      {showRoundUi ? (
        <>
          {state?.phase !== 'round_active' ? renderScoreboard() : null}
          {state?.phase === 'ready' ? renderReadyState() : null}
          {state?.phase === 'round_active' ? renderActiveState() : null}
          {state?.phase === 'section_transition'
            ? renderSectionTransition()
            : null}
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

      <div className="mt-4 flex gap-2">
        {canReviewWords ? (
          <Button asChild variant="ghost" className="flex-1">
            <Link href="/game/word-entry">Review word entry</Link>
          </Button>
        ) : null}
        <Button
          variant="outline"
          className={canReviewWords ? 'flex-1' : 'w-full'}
          onClick={handleResetSession}
          data-testid="round-reset-session"
        >
          Reset session
        </Button>
      </div>

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
