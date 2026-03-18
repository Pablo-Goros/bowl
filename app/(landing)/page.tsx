import Link from 'next/link';
import { BookText, Crown, Play, Settings2 } from 'lucide-react';

import { GameShell, GameViewport } from '@/components/game/game-shell';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <GameViewport>
      <GameShell
        center
        innerClassName="items-center justify-center gap-6 text-center"
      >
        <div className="flex size-24 items-center justify-center rounded-[2rem] border border-[#dbad49]/22 bg-[#221d18] text-[#f0c661] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <Crown className="size-11" />
        </div>

        <div className="space-y-4">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.42em] text-[#e7bc4a]">
            Party Word Game
          </p>
          <h1 className="font-display text-5xl font-semibold tracking-[0.04em] text-[#f0e0bf]">
            BOWL
          </h1>
          <p className="mx-auto max-w-xs text-sm leading-7 text-[#cdb98f]/76">
            Pass the phone, beat the timer, and guess as many words as you can.
          </p>
        </div>

        <div className="mt-4 w-full space-y-3">
          <Button asChild size="lg" className="w-full text-lg">
            <Link href="/game/setup">
              <Play className="size-5" />
              Play Now
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/rules">
              <BookText className="size-5" />
              Rules
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="w-full" disabled>
            <Settings2 className="size-5" />
            Settings
          </Button>
        </div>
      </GameShell>
    </GameViewport>
  );
}
