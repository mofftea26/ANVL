import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export function ContentPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'prose-anvl space-y-4 text-sm leading-relaxed text-[var(--color-text-muted)] [&_h2]:anvl-heading [&_h2]:text-2xl [&_h2]:text-[var(--color-heading)] [&_h3]:anvl-micro [&_h3]:text-[var(--color-heading)] [&_li]:marker:text-[var(--color-accent)] [&_strong]:text-[var(--color-text)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
