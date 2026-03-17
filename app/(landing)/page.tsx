import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { quickStats, roundModes } from '@/lib/site-content';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-16">
      <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-6">
          <div className="inline-flex rounded-full border border-slate-950/10 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm shadow-slate-950/5">
            Shareable, local-first party game
          </div>

          <div className="space-y-4">
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 md:text-6xl">
              Set up teams, pass one phone, and play Bowl anywhere.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
              Bowl keeps setup, word entry, score, and round flow on one device
              so friends can focus on clues instead of bookkeeping.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full px-6 text-base"
            >
              <Link href="/game/setup">
                Start a game
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-slate-300 bg-white/70 px-6 text-base"
            >
              <Link href="/rules">Read the rules</Link>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-slate-700">
            <span className="rounded-full bg-white/75 px-3 py-1 shadow-sm shadow-slate-950/5">
              No accounts
            </span>
            <span className="rounded-full bg-white/75 px-3 py-1 shadow-sm shadow-slate-950/5">
              One shared phone
            </span>
            <span className="rounded-full bg-white/75 px-3 py-1 shadow-sm shadow-slate-950/5">
              Installable as a PWA
            </span>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-950/10 bg-slate-950 p-6 text-slate-50 shadow-2xl shadow-slate-950/15">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {quickStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-3xl border border-white/10 bg-white/8 p-5"
              >
                <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                  {stat.label}
                </p>
                <p className="mt-3 text-4xl font-semibold">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {stat.description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-3xl bg-white/8 p-5">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
              Why it works
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              <li>Round timing survives backgrounding and quick reloads.</li>
              <li>
                Word entry and active sessions restore on the same device.
              </li>
              <li>Rules and setup stay clear enough for first-time players.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-3">
        <article className="rounded-[1.75rem] border border-slate-950/10 bg-white/70 p-6 shadow-sm shadow-slate-950/5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            1. Setup
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Build two teams
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Add team names, enter players, and choose how many words each person
            will contribute.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-950/10 bg-white/70 p-6 shadow-sm shadow-slate-950/5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            2. Pass the phone
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Play timed rounds
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Each team gets a 60-second turn. Guess, skip, undo, and end rounds
            from one shared screen.
          </p>
        </article>
        <article className="rounded-[1.75rem] border border-slate-950/10 bg-white/70 p-6 shadow-sm shadow-slate-950/5">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            3. Repeat the bowl
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950">
            Tighten the clue rules
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            The same set of words cycles through three sections, getting harder
            each time until a winner emerges.
          </p>
        </article>
      </section>

      <section className="mt-14 space-y-6">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            The three sections
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Familiar rules, clearer flow
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {roundModes.slice(0, 3).map((mode) => (
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

      <section className="mt-14 rounded-[2rem] border border-slate-950/10 bg-slate-950 px-6 py-8 text-slate-50 shadow-2xl shadow-slate-950/15 md:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
              Ready to share
            </p>
            <h2 className="text-3xl font-semibold tracking-tight">
              Send the link, install it on your phone, and start the next round
              in minutes.
            </h2>
            <p className="text-sm leading-6 text-slate-300">
              Bowl stays intentionally conservative with offline behavior: the
              app is installable, but live play should still assume a normal
              browser connection.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-white px-6 text-base text-slate-950 hover:bg-slate-100"
            >
              <Link href="/game/setup">Open setup</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 rounded-full border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/10"
            >
              <Link href="/how-to-play">How to play</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
