import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export function IconButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        'focus-ring inline-flex h-10 w-10 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)]',
        className,
      )}
      {...props}
    />
  )
}
