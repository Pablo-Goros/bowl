'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Crown, RotateCcw } from 'lucide-react';

import {
  GameChip,
  GamePanel,
  GameShell,
  GameViewport,
} from '@/components/game/game-shell';
import { Button } from '@/components/ui/button';
import { getScoreboard } from '@/lib/game-engine';
import {
  clearStoredGameState,
  loadGameStateFromStorage,
} from '@/lib/game-session';

type DisplaySectionScore = {
  section: number;
  teamScores: Record<string, number>;
  winnerTeamId: string | null;
  title: string;
  subtitle?: string;
};

export default function GameSummaryPage() {
  const router = useRouter();
  const state = useMemo(() => loadGameStateFromStorage(), []);
  const scoreboard = state ? getScoreboard(state) : null;
  const winnerName =
    state && state.winnerTeamId
      ? (state.teams.find((team) => team.id === state.winnerTeamId)?.name ??
        state.winnerTeamId)
      : null;

  const displaySectionScores = useMemo<DisplaySectionScore[]>(() => {
    if (!state) {
      return [];
    }

    const scores: DisplaySectionScore[] = state.sectionScores.map(
      (sectionScore) => ({
        ...sectionScore,
        title: `Section ${sectionScore.section}`,
      }),
    );

    if (state.suddenDeath.active) {
      scores.push({
        section: 4,
        teamScores: state.suddenDeath.cycleScores,
        winnerTeamId: state.winnerTeamId,
        title: 'Section 4',
        subtitle: 'Sudden death',
      });
    }

    return scores;
  }, [state]);

  function handleNewGame() {
    clearStoredGameState();
    router.push('/game/setup');
  }

  return (
    <GameViewport>
      <GameShell innerClassName="gap-5">
        <header className="space-y-4 text-center">
          <GameChip>Match Complete</GameChip>
          <div className="space-y-3">
            <h1 className="font-display text-4xl font-semibold text-[#f0e0bf]">
              Game summary
            </h1>
            <p className="text-sm leading-7 text-[#cdb98f]/76">
              Final totals for the completed match.
            </p>
          </div>
        </header>

        {state ? (
          <>
            {winnerName ? (
              <GamePanel className="space-y-4 text-center">
                <div className="mx-auto flex size-16 items-center justify-center rounded-[1.4rem] border border-[#dbad49]/22 bg-[#221d18] text-[#f0c661]">
                  <Crown className="size-7" />
                </div>
                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                    Winner
                  </p>
                  <p className="mt-3 font-display text-4xl font-semibold text-[#f0e0bf]">
                    {winnerName}
                  </p>
                </div>
              </GamePanel>
            ) : null}

            {scoreboard ? (
              <GamePanel className="space-y-3">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                  Total score
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(scoreboard).map(([teamName, points]) => (
                    <div
                      key={teamName}
                      className="rounded-[1.35rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-3"
                    >
                      <p className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-[#cdb98f]/76">
                        {teamName}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-[#f0e0bf]">
                        {points}
                      </p>
                    </div>
                  ))}
                </div>
              </GamePanel>
            ) : null}

            {displaySectionScores.length > 0 ? (
              <GamePanel className="space-y-4">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#e7bc4a]">
                  Section scores
                </p>
                <div className="space-y-3">
                  {displaySectionScores.map((sectionScore) => {
                    const sectionWinnerName = sectionScore.winnerTeamId
                      ? (state.teams.find(
                          (team) => team.id === sectionScore.winnerTeamId,
                        )?.name ?? sectionScore.winnerTeamId)
                      : 'Tie';

                    return (
                      <div
                        key={sectionScore.title}
                        className="rounded-[1.4rem] border border-[#dbad49]/18 bg-[#211c17] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-[#f0e0bf]">
                              {sectionScore.title}
                            </p>
                            {sectionScore.subtitle ? (
                              <p className="mt-1 text-xs uppercase tracking-[0.24em] text-[#e7bc4a]">
                                {sectionScore.subtitle}
                              </p>
                            ) : null}
                          </div>
                          <p className="text-sm text-[#cdb98f]/76">
                            {sectionWinnerName}
                          </p>
                        </div>

                        <div className="mt-4 space-y-2">
                          {Object.entries(sectionScore.teamScores).map(
                            ([teamId, score]) => {
                              const teamName =
                                state.teams.find((team) => team.id === teamId)
                                  ?.name ?? teamId;

                              return (
                                <div
                                  className="flex items-center justify-between rounded-[1rem] border border-[#dbad49]/18 bg-[#1b1713] px-3 py-3"
                                  key={`${sectionScore.title}-${teamId}`}
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
                      </div>
                    );
                  })}
                </div>
              </GamePanel>
            ) : null}
          </>
        ) : (
          <GamePanel className="text-sm text-[#cdb98f]/76">
            No completed match detected. Finish a session to see results.
          </GamePanel>
        )}

        <div className="grid gap-2 pt-1">
          <Button className="w-full" onClick={handleNewGame}>
            <RotateCcw className="size-4" />
            Start new game
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </GameShell>
    </GameViewport>
  );
}
