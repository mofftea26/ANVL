import type { PropsWithChildren } from 'react'
import { cn } from '@/shared/lib/cn'

export function Container({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[var(--anvl-content-max)] px-4 md:px-8 2xl:max-w-[var(--anvl-content-max-wide)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
