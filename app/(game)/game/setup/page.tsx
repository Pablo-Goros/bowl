'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  Crown,
  Minus,
  Plus,
  Shield,
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
    <GameViewport>
      <GameShell innerClassName="gap-5">
        <header className="space-y-5">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="icon-sm">
              <Link href="/">
                <ArrowLeft className="size-4" />
                <span className="sr-only">Return home</span>
              </Link>
            </Button>
            <GameChip>Setup</GameChip>
            <div className="size-10" />
          </div>

          <div className="space-y-3 text-center">
            <h1 className="font-display text-4xl font-semibold text-[#f0e0bf]">
              Game setup
            </h1>
            <p className="text-sm leading-7 text-[#cdb98f]/76">
              Build two teams, choose the bowl size, and get the phone ready to
              pass.
            </p>
          </div>
        </header>

        {hasRecoverableGame ? (
          <GamePanel className="space-y-3 border-[#e7bc4a]/22 bg-[#261f18]/96">
            <div className="space-y-1">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#e7bc4a]">
                Saved game detected
              </p>
              <p className="text-sm leading-6 text-[#eadab9]">
                Resume the current session instead of overwriting it from setup.
              </p>
            </div>
            <div className="grid gap-2">
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
          </GamePanel>
        ) : null}

        <GamePanel id="match-settings" className="space-y-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
            Match settings
          </p>

          <label className="block space-y-2 text-sm">
            <span className="text-sm font-medium text-[#eadab9]">
              Words per player
            </span>
            <div className="relative">
              <select
                className="velvet-input appearance-none pr-10"
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
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-[#e7bc4a]" />
            </div>
          </label>
          <p className="text-xs leading-6 text-[#cdb98f]/76">
            Every player will enter exactly {draft.wordsPerPlayer} words before
            the game starts.
          </p>
        </GamePanel>

        {[
          {
            key: 'teamA' as const,
            label: 'First team',
            fallbackName: 'Team A',
            icon: Crown,
            testPrefix: 'team-a',
          },
          {
            key: 'teamB' as const,
            label: 'Second team',
            fallbackName: 'Team B',
            icon: Shield,
            testPrefix: 'team-b',
          },
        ].map(({ key, label, fallbackName, icon: Icon, testPrefix }) => {
          const team = draft[key];

          return (
            <GamePanel key={key} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex size-12 items-center justify-center rounded-[1.25rem] border border-[#dbad49]/22 bg-[#221d18] text-[#f0c661]">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                      {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-[#f0e0bf]">
                      {team.name.trim() || fallbackName}
                    </p>
                  </div>
                </div>

                <div className="rounded-[1.25rem] border border-[#dbad49]/18 bg-[#211c17] px-3 py-2 text-right">
                  <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#cdb98f]/76">
                    Players
                  </p>
                  <p className="mt-1 text-2xl font-semibold text-[#f0e0bf]">
                    {team.players.length}
                  </p>
                </div>
              </div>

              <label className="block space-y-2 text-sm">
                <span className="text-sm font-medium text-[#eadab9]">
                  Team name
                </span>
                <input
                  className="velvet-input"
                  placeholder={fallbackName}
                  value={team.name}
                  data-testid={`setup-${testPrefix}-name`}
                  onChange={(event) =>
                    setDraft((previous) => ({
                      ...previous,
                      [key]: {
                        ...previous[key],
                        name: event.target.value,
                      },
                    }))
                  }
                />
              </label>

              <div className="space-y-3">
                {team.players.map((player, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="flex items-center gap-3"
                  >
                    <div className="flex size-11 items-center justify-center rounded-[1rem] border border-[#dbad49]/18 bg-[#211c17] text-sm font-semibold text-[#f0c661]">
                      {index + 1}
                    </div>
                    <input
                      className="velvet-input flex-1"
                      placeholder={`Player ${index + 1}`}
                      value={player}
                      data-testid={`setup-${testPrefix}-player-${index}`}
                      onChange={(event) =>
                        setDraft((previous) =>
                          updatePlayer(
                            previous,
                            key,
                            index,
                            event.target.value,
                          ),
                        )
                      }
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      type="button"
                      onClick={() => removePlayer(key, index)}
                      aria-label={`Remove player ${index + 1} from ${fallbackName}`}
                    >
                      <Minus className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="secondary"
                type="button"
                className="w-full"
                onClick={() => addPlayer(key)}
              >
                <Plus className="size-4" />
                Add player
              </Button>
            </GamePanel>
          );
        })}

        {balanceSuggestion ? (
          <div className="rounded-[1.5rem] border border-[#e7bc4a]/20 bg-[#241d17] px-4 py-3 text-sm text-[#eadab9]">
            {balanceSuggestion}
          </div>
        ) : null}

        {errors.length > 0 ? (
          <div className="rounded-[1.5rem] border border-[#a35d3a]/30 bg-[#241411] px-4 py-3 text-sm text-[#f2c8b5]">
            <ul className="space-y-1">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          onClick={submitSetup}
          data-testid="setup-continue"
        >
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
      </GameShell>
    </GameViewport>
  );
}
