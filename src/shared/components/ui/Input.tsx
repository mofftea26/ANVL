import { cva, type VariantProps } from 'class-variance-authority'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Modern text input. `density="comfortable"` (default) is the soft
 * translucent, touch-friendly storefront/account chrome; `density="compact"`
 * is admin's dense pill-shaped utility chrome (many fields per screen).
 * `text-base` on mobile / `text-sm` on md+ at comfortable density so iOS
 * Safari doesn't zoom on focus (RESP-07).
 */
export const inputBaseClass = cva(
  'w-full text-[var(--color-text)] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      density: {
        comfortable:
          'h-11 rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 text-base shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] md:text-sm',
        compact:
          'focus-ring h-9 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-3 text-xs transition-colors hover:bg-[var(--color-surface-elevated)]',
      },
    },
    defaultVariants: { density: 'comfortable' },
  },
)

export type InputProps = InputHTMLAttributes<HTMLInputElement> &
  VariantProps<typeof inputBaseClass>

export function Input({ className, density, ...props }: InputProps) {
  return <input className={cn(inputBaseClass({ density }), className)} {...props} />
}
