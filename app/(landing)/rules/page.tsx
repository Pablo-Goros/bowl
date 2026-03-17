import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  importantRules,
  preGameChecklist,
  roundModes,
  scoringRules,
} from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'Rules',
  description:
    'Full Bowl rules: setup, section restrictions, scoring, sudden death, and house rules.',
};

export default function RulesPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          Rules
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Bowl rules, cleaned up for quick reference.
        </h1>
        <p className="text-base leading-7 text-slate-700">
          Bowl is a two-team word game played across three sections. The app
          tracks the bowl, timer, turns, and score. Players still handle clue
          judgment socially.
        </p>
      </header>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.75rem] border border-slate-950/10 bg-white/75 p-6 shadow-sm shadow-slate-950/5">
          <h2 className="text-2xl font-semibold text-slate-950">
            Before you start
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {preGameChecklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-slate-950/10 bg-white/75 p-6 shadow-sm shadow-slate-950/5">
          <h2 className="text-2xl font-semibold text-slate-950">
            Scoring and winning
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
            {scoringRules.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="mt-10 space-y-5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Sections
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            The bowl stays the same. The clue rule changes.
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {roundModes.map((mode) => (
            <article
              key={mode.label}
              className="rounded-[1.75rem] border border-slate-950/10 bg-white/75 p-6 shadow-sm shadow-slate-950/5"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                {mode.label}
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                {mode.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                {mode.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 rounded-[1.75rem] border border-slate-950/10 bg-white/75 p-6 shadow-sm shadow-slate-950/5">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Important calls
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            House rules the app expects players to honor
          </h2>
        </div>
        <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
          {importantRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </section>

      <section className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="h-12 rounded-full px-6 text-base">
          <Link href="/game/setup">Start a game</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="h-12 rounded-full border-slate-300 bg-white/70 px-6 text-base"
        >
          <Link href="/how-to-play">How to play</Link>
        </Button>
      </section>
    </main>
  );
}
