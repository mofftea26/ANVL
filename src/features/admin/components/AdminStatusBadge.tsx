import { cva, type VariantProps } from 'class-variance-authority'
import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export const adminStatusBadgeVariants = cva(
  'inline-flex shrink-0 items-center rounded-full border font-semibold uppercase',
  {
    variants: {
      tone: {
        neutral:
          'border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)]',
        live: 'border-emerald-500/35 bg-[var(--color-surface-soft)] text-emerald-100',
        scheduled: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
        archived: 'border-zinc-600 bg-zinc-900/40 text-zinc-400',
        success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
        danger: 'border-red-500/40 bg-red-500/10 text-red-200',
        accent:
          'border-[color-mix(in_srgb,var(--color-line)_100%,transparent)] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface-elevated)_45%,transparent),transparent)] text-[var(--color-text-muted)]',
      },
      size: {
        default: 'px-2 py-0.5 text-[10px] tracking-[0.16em]',
        chip: 'h-9 px-2.5 text-xs tracking-[0.12em]',
      },
    },
    defaultVariants: {
      tone: 'neutral',
      size: 'default',
    },
  },
)

export type AdminStatusBadgeProps = PropsWithChildren<
  VariantProps<typeof adminStatusBadgeVariants> & { className?: string }
>

export function AdminStatusBadge({
  children,
  tone,
  size,
  className,
}: AdminStatusBadgeProps) {
  return (
    <span className={cn(adminStatusBadgeVariants({ tone, size }), className)}>
      {children}
    </span>
  )
}
