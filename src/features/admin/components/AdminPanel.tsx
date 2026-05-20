import type { PropsWithChildren } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/shared/lib/cn'

export const adminPanelVariants = cva('min-w-0 rounded-xl border border-[var(--color-line)]', {
  variants: {
    variant: {
      /** Drops list / products filter toolbar. */
      toolbar: 'bg-[var(--color-surface-soft)]/40 px-3 py-4 sm:px-5',
      /** Nested editor sections (acts, visuals sub-panels). */
      inset:
        'border-[color:color-mix(in_srgb,var(--color-line)_55%,transparent)] bg-[var(--color-bg)]/30 p-4 shadow-[inset_0_1px_0_color-mix(in_srgb,var(--anvl-bone)_8%,transparent)]',
      /** Filter grids on catalog pages. */
      filters: 'bg-[var(--color-surface)]/40 p-4',
    },
  },
  defaultVariants: {
    variant: 'toolbar',
  },
})

export type AdminPanelProps = PropsWithChildren<
  VariantProps<typeof adminPanelVariants> & { className?: string }
>

export function AdminPanel({ variant, className, children }: AdminPanelProps) {
  return <div className={cn(adminPanelVariants({ variant }), className)}>{children}</div>
}
