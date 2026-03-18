import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[1.35rem] border text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 disabled:saturate-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 aria-invalid:ring-destructive/20 aria-invalid:border-destructive shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_24px_rgba(0,0,0,0.18)]",
  {
    variants: {
      variant: {
        default:
          'border-[#dbad49]/22 bg-[linear-gradient(180deg,#e7bc4a_0%,#c89221_100%)] text-[#17120f] hover:brightness-105',
        destructive:
          'border-[#080706] bg-[#11100e] text-[#eadab9] hover:bg-[#191714] focus-visible:ring-[#11100e]/30',
        outline:
          'border-[#dbad49]/18 bg-[#1b1613] text-[#eadab9] hover:bg-[#241d18]',
        secondary:
          'border-[#dbad49]/18 bg-[#2b241e] text-[#eadab9] hover:bg-[#352c24]',
        ghost:
          'border-transparent bg-transparent text-[#cdb98f] shadow-none hover:bg-[#241f1a]/80 hover:text-[#eadab9]',
        link: 'border-transparent bg-transparent p-0 text-[#e7bc4a] shadow-none hover:text-[#eadab9] hover:underline',
      },
      size: {
        default: 'h-12 px-5 py-3 text-base has-[>svg]:px-4',
        xs: "h-7 gap-1 rounded-xl px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*='size-'])]:size-3",
        sm: 'h-10 gap-1.5 rounded-[1.15rem] px-4 text-sm has-[>svg]:px-3',
        lg: 'h-14 rounded-[1.5rem] px-6 text-base has-[>svg]:px-5',
        icon: 'size-12',
        'icon-xs': "size-7 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-10 rounded-[1.15rem]',
        'icon-lg': 'size-14 rounded-[1.5rem]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : 'button';

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
