import Link from 'next/link';

const flowLinks = [
  { href: '/game/setup', label: 'Game setup' },
  { href: '/game/word-entry', label: 'Word entry' },
  { href: '/game/round', label: 'Round screen' },
  { href: '/game/round-summary', label: 'Round summary' },
  { href: '/game/game-summary', label: 'Game summary' },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-6 bg-background px-4 py-8 text-foreground">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Bowl
        </p>
        <h1 className="text-3xl font-semibold">Home</h1>
        <p className="text-sm text-muted-foreground">
          Sprint 0.3 clickable route skeleton for the full local game flow.
        </p>
      </header>

      <nav aria-label="App flow" className="space-y-3">
        {flowLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block rounded-lg border bg-card px-4 py-3 text-base font-medium hover:bg-accent"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </main>
  );
}
