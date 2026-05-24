import type { ElementType, PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

/** Uppercase sub-section label inside editor panels. */
export function AdminMicroHeading({
  children,
  className,
  as: Tag = 'p',
}: PropsWithChildren<{ className?: string; as?: ElementType }>) {
  return (
    <Tag
      className={cn(
        'text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
