import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { helpTopics, howToPlaySteps } from '@/lib/site-content';

export const metadata: Metadata = {
  title: 'How To Play',
  description:
    'Quick-start guide for hosting a Bowl match, passing the phone, and handling common questions.',
};

export default function HowToPlayPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
          How to play
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-950">
          Run a full Bowl match without explaining the whole app first.
        </h1>
        <p className="text-base leading-7 text-slate-700">
          Use this page as the fast host briefing. It covers the order of play,
          what the phone is responsible for, and the few moments players usually
          ask about.
        </p>
      </header>

      <section className="mt-10 rounded-[2rem] border border-slate-950/10 bg-white/80 p-6 shadow-sm shadow-slate-950/5 md:p-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Quick start
          </p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">
            Six steps from setup to winner
          </h2>
        </div>

        <ol className="mt-6 grid gap-4">
          {howToPlaySteps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-4 rounded-[1.5rem] border border-slate-950/10 bg-[#fffaf2] p-5 md:grid-cols-[auto_1fr] md:items-start"
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-semibold text-white">
                {index + 1}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-slate-950">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-2">
        {helpTopics.map((topic) => (
          <article
            key={topic.title}
            className="rounded-[1.75rem] border border-slate-950/10 bg-white/75 p-6 shadow-sm shadow-slate-950/5"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Quick answer
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-950">
              {topic.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              {topic.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-10 rounded-[1.75rem] border border-slate-950/10 bg-slate-950 p-6 text-slate-50 shadow-2xl shadow-slate-950/15">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Install tip
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight">
          Use your browser menu and choose “Install app” or “Add to Home
          Screen”.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          The installable shell makes it easier to launch Bowl from a phone, but
          the app intentionally avoids aggressive offline behavior. Treat it as
          a polished web app first.
        </p>
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
          <Link href="/rules">Full rules</Link>
        </Button>
      </section>
    </main>
  );
}
