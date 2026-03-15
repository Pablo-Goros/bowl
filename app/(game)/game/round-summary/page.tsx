import Link from 'next/link';

export default function RoundSummaryPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Round summary</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder for guessed words and section score.
      </p>
      <Link className="rounded-lg border px-4 py-3" href="/game/game-summary">
        Continue to game summary
      </Link>
    </main>
  );
}
