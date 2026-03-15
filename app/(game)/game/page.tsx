import Link from 'next/link';

export default function GameHubPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Game flow hub</h1>
      <p className="text-sm text-muted-foreground">
        Choose a placeholder screen to simulate navigation.
      </p>
      <div className="space-y-2">
        <Link className="block rounded-lg border px-4 py-3" href="/game/setup">
          Start at setup
        </Link>
        <Link
          className="block rounded-lg border px-4 py-3"
          href="/game/game-summary"
        >
          Jump to game summary
        </Link>
      </div>
    </main>
  );
}
