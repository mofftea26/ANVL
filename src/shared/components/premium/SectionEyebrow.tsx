import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function SectionEyebrow({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('anvl-micro text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]', className)}>
      {children}
    </p>
  )
}
