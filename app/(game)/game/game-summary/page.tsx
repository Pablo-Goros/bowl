'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { getScoreboard } from '@/lib/game-engine';
import {
  clearStoredGameState,
  loadGameStateFromStorage,
} from '@/lib/game-session';

export default function GameSummaryPage() {
  const router = useRouter();
  const state = useMemo(() => loadGameStateFromStorage(), []);
  const scoreboard = state ? getScoreboard(state) : null;
  const sectionScores = state?.sectionScores ?? [];
  const winnerName =
    state && state.winnerTeamId
      ? (state.teams.find((team) => team.id === state.winnerTeamId)?.name ??
        state.winnerTeamId)
      : null;

  function handleNewGame() {
    clearStoredGameState();
    router.push('/game/setup');
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Game summary</h1>
        <p className="text-sm text-muted-foreground">
          Final totals for the completed match.
        </p>
      </header>

      {state ? (
        <>
          {winnerName ? (
            <section className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">Winner</p>
              <p className="text-2xl font-semibold">{winnerName}</p>
            </section>
          ) : null}

          {scoreboard ? (
            <section className="rounded-lg border p-4 text-sm">
              <p className="text-base font-medium">Total score</p>
              <ul className="mt-3 space-y-1">
                {Object.entries(scoreboard).map(([teamName, points]) => (
                  <li
                    className="flex items-center justify-between"
                    key={teamName}
                  >
                    <span>{teamName}</span>
                    <span className="font-semibold">{points}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {sectionScores.length > 0 ? (
            <section className="rounded-lg border p-4 text-sm">
              <p className="text-base font-medium">Section scores</p>
              <div className="mt-3 space-y-4">
                {sectionScores.map((sectionScore) => {
                  const sectionWinnerName = sectionScore.winnerTeamId
                    ? (state?.teams.find(
                        (team) => team.id === sectionScore.winnerTeamId,
                      )?.name ?? sectionScore.winnerTeamId)
                    : 'Tie';

                  return (
                    <div key={sectionScore.section} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          Section {sectionScore.section}
                        </span>
                        <span className="text-muted-foreground">
                          {sectionWinnerName}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {Object.entries(sectionScore.teamScores).map(
                          ([teamId, score]) => {
                            const teamName =
                              state?.teams.find((team) => team.id === teamId)
                                ?.name ?? teamId;
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
                  );
                })}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="rounded-lg border p-4">
          <p className="text-sm">
            No completed match detected. Finish a session to see results.
          </p>
        </section>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <Button className="w-full" onClick={handleNewGame}>
          Start new game
        </Button>
        <Button asChild variant="ghost" className="w-full">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </main>
  );
}
