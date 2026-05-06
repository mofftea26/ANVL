import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'focus-ring h-11 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)]',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
}
