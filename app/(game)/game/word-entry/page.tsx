'use client';

import Link from 'next/link';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { SetupDraft } from '@/lib/game-engine';
import { parseSetupDraft, SETUP_DRAFT_STORAGE_KEY } from '@/lib/game-session';

function getSetupDraftFromStorage(): SetupDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.sessionStorage.getItem(SETUP_DRAFT_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  return parseSetupDraft(raw);
}

export default function WordEntryPage() {
  const [draft] = useState<SetupDraft | null>(getSetupDraftFromStorage);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Word entry</h1>
      <p className="text-sm text-muted-foreground">
        Sprint 1.1 bridge complete. Setup is captured and passed into this step.
      </p>

      {draft ? (
        <section className="space-y-2 rounded-lg border p-4 text-sm">
          <p className="font-medium">Session ready</p>
          <p>
            {draft.teamA.name}: {draft.teamA.players.join(', ')}
          </p>
          <p>
            {draft.teamB.name}: {draft.teamB.players.join(', ')}
          </p>
        </section>
      ) : (
        <section className="rounded-lg border p-4 text-sm text-muted-foreground">
          No setup found. Start from setup to create a session.
        </section>
      )}

      <Button asChild variant="outline">
        <Link href="/game/setup">Back to setup</Link>
      </Button>
      <Button asChild>
        <Link href="/game/round">Continue to round placeholder</Link>
      </Button>
    </main>
  );
}
