import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function SectionEyebrow({
  children,
  className,
  /** Warrior accent: ember color + a forged tick before the label. */
  ember = false,
}: {
  children: ReactNode
  className?: string
  ember?: boolean
}) {
  return (
    <p
      className={cn(
        'anvl-micro text-[10px] uppercase tracking-[0.22em]',
        ember
          ? 'inline-flex items-center gap-2 text-[var(--color-highlight-bright)] before:h-px before:w-6 before:bg-[var(--color-highlight)] before:content-[""]'
          : 'text-[var(--color-text-muted)]',
        className,
      )}
    >
      {children}
    </p>
  )
}
