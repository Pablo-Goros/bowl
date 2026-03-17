import Link from 'next/link';

import { siteNavLinks } from '@/lib/site-content';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fff8ee_0%,#f6efe1_42%,#eef3f8_100%)] text-slate-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top,#f4a261_0%,rgba(244,162,97,0.22)_28%,transparent_64%)]" />
      <div className="pointer-events-none absolute -left-24 top-72 size-72 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-36 size-80 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative">
        <header className="border-b border-slate-950/10 supports-[backdrop-filter]:bg-white/50 supports-[backdrop-filter]:backdrop-blur">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-semibold text-white shadow-lg shadow-slate-950/20">
                B
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Bowl
                </p>
                <p className="text-sm text-slate-700">
                  One phone. Two teams. Three sections.
                </p>
              </div>
            </Link>

            <nav
              aria-label="Primary"
              className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-slate-700"
            >
              {siteNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 transition hover:bg-white/70 hover:text-slate-950"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="border-t border-slate-950/10 bg-white/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-700 md:flex-row md:items-center md:justify-between md:px-6">
            <p>
              Built for fast, local game nights with shared-device session
              recovery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/rules" className="hover:text-slate-950">
                Full rules
              </Link>
              <Link href="/how-to-play" className="hover:text-slate-950">
                How to play
              </Link>
              <Link href="/game/setup" className="hover:text-slate-950">
                Start a game
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
