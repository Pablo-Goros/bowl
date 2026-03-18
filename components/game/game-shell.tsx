import type { ComponentProps, ReactNode } from 'react';

import { cn } from '@/lib/utils';

type GameViewportProps = {
  children: ReactNode;
  className?: string;
};

type GameShellProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  center?: boolean;
};

type GamePanelProps = ComponentProps<'section'>;

type GameChipProps = ComponentProps<'span'>;

export function GameViewport({ children, className }: GameViewportProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden', className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(244,198,84,0.15),transparent_24%)]" />
        <div className="absolute -left-20 top-28 h-48 w-48 rounded-full bg-[#b88424]/14 blur-3xl" />
        <div className="absolute -right-16 top-10 h-56 w-56 rounded-full bg-[#e7bc4a]/12 blur-3xl" />
        <div className="absolute bottom-4 left-1/2 h-48 w-72 -translate-x-1/2 rounded-full bg-black/35 blur-3xl" />
      </div>
      {children}
    </div>
  );
}

export function GameShell({
  children,
  className,
  innerClassName,
  center = false,
}: GameShellProps) {
  return (
    <div
      className={cn(
        'relative mx-auto flex min-h-screen w-full max-w-[26rem] px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:py-8',
        center ? 'items-center' : 'items-stretch',
        className,
      )}
    >
      <div className="velvet-shell-outer flex w-full flex-1 rounded-[2rem] border p-[1px]">
        <div
          className={cn(
            'velvet-shell-inner flex w-full flex-1 flex-col rounded-[calc(2rem-1px)] border px-5 py-5 sm:px-6 sm:py-6',
            innerClassName,
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function GamePanel({ children, className, ...props }: GamePanelProps) {
  return (
    <section
      className={cn(
        'velvet-panel rounded-[1.75rem] border px-4 py-4 sm:px-5 sm:py-5',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function GameChip({ children, className, ...props }: GameChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full border border-[#dbad49]/22 bg-[#221d18] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-[#f0c661]',
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
