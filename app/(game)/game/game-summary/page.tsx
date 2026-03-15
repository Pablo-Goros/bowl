import Link from 'next/link';

export default function GameSummaryPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Game summary</h1>
      <p className="text-sm text-muted-foreground">
        Placeholder for final totals and winner.
      </p>
      <Link className="rounded-lg border px-4 py-3" href="/">
        Return home
      </Link>
    </main>
  );
}
