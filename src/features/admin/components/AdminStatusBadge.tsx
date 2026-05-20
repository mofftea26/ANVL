import { cva, type VariantProps } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'
import type { DropStatus } from '@/features/drops/drop.types'
import { cn } from '@/shared/lib/cn'

export const adminStatusBadgeVariants = cva(
  'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em]',
  {
    variants: {
      tone: {
        neutral:
          'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)]',
        live: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100',
        scheduled: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
        archived: 'border-zinc-600 bg-zinc-900/40 text-zinc-400',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
        danger: 'border-red-500/40 bg-red-500/10 text-red-200',
        accent:
          'border-[color-mix(in_srgb,var(--color-line)_100%,transparent)] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface-elevated)_45%,transparent),transparent)] text-[var(--color-text-muted)]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
    },
  },
)

export type AdminStatusBadgeProps = PropsWithChildren<
  VariantProps<typeof adminStatusBadgeVariants> & { className?: string }
>

export function AdminStatusBadge({
  children,
  tone,
  className,
}: AdminStatusBadgeProps) {
  return (
    <span className={cn(adminStatusBadgeVariants({ tone }), className)}>{children}</span>
  )
}

/** Maps drop lifecycle to forged badge tones (drops list + editor). */
export function dropStatusBadgeTone(
  status: DropStatus,
  isActive: boolean,
): NonNullable<VariantProps<typeof adminStatusBadgeVariants>['tone']> {
  if (isActive) return 'live'
  switch (status) {
    case 'draft':
      return 'neutral'
    case 'scheduled':
      return 'scheduled'
    case 'archived':
      return 'archived'
    case 'inactive':
      return 'neutral'
    case 'active':
      return 'success'
    default:
      return 'neutral'
  }
}
