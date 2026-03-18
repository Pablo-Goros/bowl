'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Check,
  Flag,
  Play,
  RotateCcw,
  SkipForward,
} from 'lucide-react';

import {
  GameChip,
  GamePanel,
  GameShell,
  GameViewport,
} from '@/components/game/game-shell';
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

type AudioContextConstructor = typeof AudioContext;

function getAudioContextConstructor(): AudioContextConstructor | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    window.AudioContext ??
    (window as Window & { webkitAudioContext?: AudioContextConstructor })
      .webkitAudioContext ??
    null
  );
}

function scheduleAlarmPulse(
  context: AudioContext,
  startTime: number,
  frequency: number,
  durationSec: number,
  peakGain: number,
) {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = 'square';
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.015);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + durationSec + 0.03);
}

export default function RoundPage() {
  const router = useRouter();
  const [state, setState] = useState<GameState | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [autoEndedRoundId, setAutoEndedRoundId] = useState<string | null>(null);
  const [revealedWordId, setRevealedWordId] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm>(null);
  const timerAudioContextRef = useRef<AudioContext | null>(null);

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

  const primeTimerAudio = useCallback(async () => {
    const AudioContextCtor = getAudioContextConstructor();

    if (!AudioContextCtor) {
      return;
    }

    try {
      if (!timerAudioContextRef.current) {
        timerAudioContextRef.current = new AudioContextCtor();
      }

      if (timerAudioContextRef.current.state === 'suspended') {
        await timerAudioContextRef.current.resume();
      }
    } catch {
      // Ignore audio setup failures and keep gameplay moving.
    }
  }, []);

  const playTimerExpiredSound = useCallback(async () => {
    const context = timerAudioContextRef.current;

    if (!context) {
      return;
    }

    try {
      if (context.state === 'suspended') {
        await context.resume();
      }

      const startTime = context.currentTime + 0.02;

      scheduleAlarmPulse(context, startTime, 880, 0.11, 0.08);
      scheduleAlarmPulse(context, startTime + 0.18, 880, 0.11, 0.08);
      scheduleAlarmPulse(context, startTime + 0.42, 660, 0.34, 0.12);
    } catch {
      // Ignore audio playback failures and keep gameplay moving.
    }
  }, []);

  const handleRoundStart = useCallback(() => {
    void primeTimerAudio();
    applyAction({ type: 'ROUND_START', nowMs: Date.now() });
  }, [applyAction, primeTimerAudio]);

  const handleWordGuessed = useCallback(() => {
    void primeTimerAudio();
    applyAction({ type: 'WORD_GUESSED' });
  }, [applyAction, primeTimerAudio]);

  const handleUndoLastGuessedWord = useCallback(() => {
    void primeTimerAudio();
    applyAction({ type: 'UNDO_LAST_GUESSED_WORD' });
  }, [applyAction, primeTimerAudio]);

  const handleWordSkipped = useCallback(() => {
    void primeTimerAudio();
    applyAction({ type: 'WORD_SKIPPED' });
  }, [applyAction, primeTimerAudio]);

  const handleEndRound = useCallback(() => {
    void primeTimerAudio();
    setPendingConfirm({
      title: 'End round?',
      description:
        'This will stop the current timer and pass play to the other team.',
      confirmLabel: 'End round',
      onConfirm: () => applyAction({ type: 'ROUND_END', reason: 'manual_end' }),
    });
  }, [applyAction, primeTimerAudio]);

  const handleNextSection = useCallback(() => {
    void primeTimerAudio();
    applyAction({ type: 'NEXT_SECTION', nowMs: Date.now() });
  }, [applyAction, primeTimerAudio]);

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
    void playTimerExpiredSound();
    applyAction({ type: 'ROUND_END', reason: 'timer' });
  }, [
    activeRoundId,
    autoEndedRoundId,
    applyAction,
    phase,
    playTimerExpiredSound,
    remainingSeconds,
  ]);

  useEffect(() => {
    if (phase !== 'round_active' || !activeRound || !activeWord) {
      setRevealedWordId(null);
      return;
    }

    const wordsSeenThisRound =
      activeRound.guessedWordIds.length + activeRound.skippedWordIds.length;

    setRevealedWordId(wordsSeenThisRound === 0 ? activeWord.id : null);
  }, [activeRound, activeWord, phase]);

  useEffect(() => {
    return () => {
      const context = timerAudioContextRef.current;

      if (!context) {
        return;
      }

      void context.close().catch(() => {});
      timerAudioContextRef.current = null;
    };
  }, []);

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
      <GamePanel className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
            Total score
          </p>
          <GameChip className="text-[0.6rem]">
            Section {getDisplaySection()}
          </GameChip>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {Object.entries(scoreboard).map(([teamName, score]) => (
            <div
              className="rounded-[1.35rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-3"
              key={teamName}
            >
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#d6b77f]/76">
                {teamName}
              </p>
              <p className="mt-2 text-3xl font-semibold text-[#f0e0bf]">
                {score}
              </p>
            </div>
          ))}
        </div>
      </GamePanel>
    );
  }

  function renderReadyState() {
    return (
      <>
        <section className="flex flex-1 flex-col justify-center gap-4">
          <div className="text-center">
            <GameChip>
              {state?.suddenDeath.active
                ? 'Section 4'
                : `Section ${state?.section}`}
            </GameChip>
          </div>

          <GamePanel className="space-y-5 text-center">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                Team up next
              </p>
              <p
                className="font-display text-4xl font-semibold text-[#f0e0bf]"
                data-testid="round-current-team"
              >
                {currentTeam?.name ?? 'Next team'}
              </p>
            </div>

            <p className="text-sm leading-7 text-[#cdb98f]/76">
              {state?.suddenDeath.active
                ? 'Section 4 rule: make a sound only. Each team gets one round per cycle. If the cycle stays tied, the bowl resets and sudden death continues.'
                : 'Players decide who holds the phone for this round. The timer keeps counting if the tab or phone is backgrounded.'}
            </p>

            <div className="rounded-[1.35rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-3">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#d6b77f]/76">
                Current rule
              </p>
              <p className="mt-2 text-lg font-semibold text-[#f0e0bf]">
                {getSectionRuleLabel(getDisplaySection())}
              </p>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleRoundStart}
              data-testid="round-start"
            >
              <Play className="size-5" />
              Begin round
            </Button>
          </GamePanel>
        </section>

        {renderScoreboard()}
      </>
    );
  }

  function renderActiveState() {
    const isWordVisible = activeWord && revealedWordId === activeWord.id;
    const guessedThisRound = activeRound?.guessedWordIds.length ?? 0;
    const canScoreActiveWord = Boolean(activeWord && isWordVisible);
    const timerPercent = activeRound
      ? Math.max(0, (remainingSeconds / activeRound.durationSec) * 100)
      : 100;

    return (
      <section className="flex flex-1 flex-col gap-4">
        <div className="text-center">
          <GameChip>Section {getDisplaySection()}</GameChip>
        </div>

        <section className="rounded-[1.75rem] border border-[#dbad49]/18 bg-[linear-gradient(180deg,#e7bc4a_0%,#c89221_100%)] px-5 py-5 text-center text-[#17120f] shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em]">
            Timer
          </p>
          <p
            className="mt-3 text-[5rem] font-bold leading-none tabular-nums"
            data-testid="round-timer"
          >
            {remainingSeconds}
          </p>
          <div className="mt-5 overflow-hidden rounded-full bg-[#fff0af]/38">
            <div
              className="h-2.5 rounded-full bg-[#fff0af] transition-[width] duration-300"
              style={{ width: `${timerPercent}%` }}
            />
          </div>
        </section>

        <p
          className="text-center text-[0.72rem] font-semibold uppercase tracking-[0.32em] text-[#e7bc4a]"
          data-testid="round-active-team"
        >
          Team {activeRoundTeam?.name ?? 'Unknown'}
        </p>

        <section className="rounded-[1.75rem] border border-[#dbad49]/18 bg-[#241f1a] px-5 py-6 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
            Current word
          </p>
          {activeWord ? (
            isWordVisible ? (
              <p
                className="mt-6 flex min-h-44 items-center justify-center font-display text-[3.4rem] font-semibold leading-[0.88] text-[#f0e0bf]"
                data-testid="round-active-word"
              >
                {activeWord.text}
              </p>
            ) : (
              <button
                className="mt-6 flex min-h-44 w-full items-center justify-center rounded-[1.5rem] border border-dashed border-[#dbad49]/22 bg-[#211c17] px-4 py-6 text-lg font-semibold text-[#eadab9] transition hover:bg-[#2a221c]"
                type="button"
                onClick={() => setRevealedWordId(activeWord.id)}
                data-testid="round-reveal-word"
              >
                Tap to reveal next word
              </button>
            )
          ) : (
            <p
              className="mt-6 flex min-h-44 items-center justify-center font-display text-4xl font-semibold leading-tight text-[#f0e0bf]"
              data-testid="round-active-word"
            >
              No words remaining
            </p>
          )}
        </section>

        <div className="grid grid-cols-3 gap-2">
          <Button
            className="h-14 px-3 text-sm"
            onClick={handleWordGuessed}
            disabled={!canScoreActiveWord}
            data-testid="round-guessed"
          >
            <Check className="size-4" />
            Guess
          </Button>
          <Button
            variant="secondary"
            className="h-14 px-3 text-sm"
            onClick={handleWordSkipped}
            disabled={!canScoreActiveWord}
            data-testid="round-skipped"
          >
            <SkipForward className="size-4" />
            Skip
          </Button>
          <Button
            variant="destructive"
            className="h-14 px-3 text-sm"
            onClick={handleEndRound}
            data-testid="round-end"
          >
            <Flag className="size-4" />
            End round
          </Button>
        </div>

        <Button
          variant="ghost"
          className="w-full"
          onClick={handleUndoLastGuessedWord}
          disabled={guessedThisRound === 0}
          data-testid="round-undo"
        >
          <RotateCcw className="size-4" />
          Undo last guessed word
        </Button>
      </section>
    );
  }

  function renderSectionTransition() {
    const completedSection = latestSectionScore?.section ?? '?';

    if (state?.suddenDeath.active) {
      return (
        <>
          <section className="flex flex-1 flex-col justify-center gap-4">
            <div className="text-center">
              <GameChip>Sudden Death</GameChip>
            </div>

            <GamePanel className="space-y-5 text-center">
              <div className="space-y-2">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                  Final score was tied
                </p>
                <p className="font-display text-4xl font-semibold text-[#f0e0bf]">
                  Section 4 begins
                </p>
              </div>

              <p className="text-sm leading-7 text-[#cdb98f]/76">
                Rule: make a sound only. Teams alternate one round each. If the
                cycle is still tied, the bowl resets and another cycle starts.
              </p>

              <Button className="w-full" size="lg" onClick={handleNextSection}>
                Continue to section 4
              </Button>
            </GamePanel>
          </section>

          {renderScoreboard()}
        </>
      );
    }

    return (
      <>
        <section className="flex flex-1 flex-col justify-center gap-4">
          <div className="text-center">
            <GameChip>Section {completedSection} complete</GameChip>
          </div>

          <GamePanel className="space-y-5 text-center">
            <div className="space-y-2">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                Section results
              </p>
              <p className="font-display text-4xl font-semibold text-[#f0e0bf]">
                Section {completedSection}
              </p>
            </div>

            {latestSectionScore ? (
              <div className="grid gap-2">
                {Object.entries(latestSectionScore.teamScores).map(
                  ([teamId, score]) => {
                    const teamName =
                      state?.teams.find((team) => team.id === teamId)?.name ??
                      teamId;

                    return (
                      <div
                        className="flex items-center justify-between rounded-[1.15rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-3 text-left"
                        key={teamId}
                      >
                        <span className="text-sm text-[#eadab9]">
                          {teamName}
                        </span>
                        <span className="text-lg font-semibold text-[#f0e0bf]">
                          {score}
                        </span>
                      </div>
                    );
                  },
                )}
              </div>
            ) : null}

            <div className="rounded-[1.35rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-4">
              <p className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-[#e7bc4a]">
                Up next
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#f0e0bf]">
                Section {state?.section}
              </p>
              <p className="mt-2 text-sm leading-7 text-[#cdb98f]/76">
                {getSectionRuleLabel(state?.section)}
              </p>
            </div>

            <Button className="w-full" size="lg" onClick={handleNextSection}>
              Continue to section {state?.section}
            </Button>
          </GamePanel>
        </section>

        {renderScoreboard()}
      </>
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
    <GameViewport>
      <GameShell innerClassName="gap-4">
        <header className="flex items-center justify-between">
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/">
              <ArrowLeft className="size-4" />
              <span className="sr-only">Return home</span>
            </Link>
          </Button>
          <GameChip>Round Flow</GameChip>
          <div className="size-10" />
        </header>

        <h1 className="sr-only">Section round flow</h1>

        {error ? (
          <div className="rounded-[1.5rem] border border-[#a35d3a]/30 bg-[#241411] px-4 py-3 text-sm text-[#f2c8b5]">
            {error}
          </div>
        ) : null}

        {!hydrated ? (
          <GamePanel className="text-sm text-[#cdb98f]/76">
            Loading session...
          </GamePanel>
        ) : null}

        {showRoundUi ? (
          <>
            {state?.phase === 'ready' ? renderReadyState() : null}
            {state?.phase === 'round_active' ? renderActiveState() : null}
            {state?.phase === 'section_transition'
              ? renderSectionTransition()
              : null}
          </>
        ) : null}

        {hydrated && !state ? (
          <GamePanel className="space-y-3 text-sm text-[#cdb98f]/76">
            <p>No active game found.</p>
            <Button asChild className="w-full">
              <Link href="/game/setup">Back to setup</Link>
            </Button>
          </GamePanel>
        ) : null}

        <div className="grid gap-2 pt-1">
          {canReviewWords ? (
            <Button asChild variant="secondary">
              <Link href="/game/word-entry">Review word entry</Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
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
      </GameShell>
    </GameViewport>
  );
}
