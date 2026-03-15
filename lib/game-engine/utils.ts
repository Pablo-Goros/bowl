import type { SectionId } from './types';

export const ROUND_DURATION_SEC = 60;

export const SECTION_ORDER: SectionId[] = [1, 2, 3];

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export function nextSection(current: SectionId): SectionId | null {
  const idx = SECTION_ORDER.indexOf(current);
  if (idx === -1 || idx === SECTION_ORDER.length - 1) {
    return null;
  }

  return SECTION_ORDER[idx + 1] ?? null;
}

export function incrementIndex(current: number, length: number): number {
  if (length <= 0) {
    return 0;
  }

  return (current + 1) % length;
}
