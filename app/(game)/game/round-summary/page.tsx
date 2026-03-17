'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';

export default function RoundSummaryPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/game/round');
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col gap-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Redirecting to round flow</h1>
      <p className="text-sm text-muted-foreground">
        Round recap lives in the existing round and game summary screens.
      </p>
      <Button asChild className="w-full">
        <Link href="/game/round">Go to round</Link>
      </Button>
    </main>
  );
}
