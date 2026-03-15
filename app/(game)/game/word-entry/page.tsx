import Link from 'next/link';

export default function WordEntryPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Word entry</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder for per-player word collection.
      </p>
      <Link className="rounded-lg border px-4 py-3" href="/game/round">
        Continue to round
      </Link>
    </main>
  );
}
