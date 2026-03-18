import Link from 'next/link';

import { siteNavLinks } from '@/lib/site-content';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden text-[#eadab9]">
      <div className="relative">
        <header className="hidden border-b border-[#cfa95a]/12 bg-black/15 supports-[backdrop-filter]:bg-black/10 supports-[backdrop-filter]:backdrop-blur md:block">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-2xl border border-[#dbad49]/22 bg-[#221d18] text-sm font-semibold text-[#f0c661] shadow-lg shadow-black/20">
                B
              </span>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#e7bc4a]">
                  Bowl
                </p>
                <p className="text-sm text-[#cdb98f]/76">
                  One phone. Two teams. Three sections.
                </p>
              </div>
            </Link>

            <nav
              aria-label="Primary"
              className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium text-[#cdb98f]/76"
            >
              {siteNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 transition hover:bg-[#241f1a] hover:text-[#eadab9]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        {children}

        <footer className="hidden border-t border-[#cfa95a]/12 bg-black/15 md:block">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-[#cdb98f]/76 md:flex-row md:items-center md:justify-between md:px-6">
            <p>
              Built for fast, local game nights with shared-device session
              recovery.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/rules" className="hover:text-[#eadab9]">
                Full rules
              </Link>
              <Link href="/how-to-play" className="hover:text-[#eadab9]">
                How to play
              </Link>
              <Link href="/game/setup" className="hover:text-[#eadab9]">
                Start a game
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
