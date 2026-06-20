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
        live: 'border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] bg-[var(--color-surface-soft)] text-[color:var(--color-success)]',
        scheduled: 'border-[color-mix(in_oklab,var(--color-warning)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-warning)_10%,transparent)] text-[color:var(--color-warning)]',
        archived: 'border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-disabled)]',
        success: 'border-[color-mix(in_oklab,var(--color-success)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_12%,transparent)] text-[color:var(--color-success)]',
        danger: 'border-[color-mix(in_oklab,var(--color-danger)_40%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_12%,transparent)] text-[color:var(--color-danger)]',
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
