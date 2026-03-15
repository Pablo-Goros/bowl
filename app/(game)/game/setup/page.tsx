import Link from 'next/link';

export default function SetupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Game setup</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder for team and player setup.
      </p>
      <Link className="rounded-lg border px-4 py-3" href="/game/word-entry">
        Continue to word entry
      </Link>
    </main>
  );
}
