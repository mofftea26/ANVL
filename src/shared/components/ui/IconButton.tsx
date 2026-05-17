import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Square icon button. Hit area is 44 × 44 px to meet WCAG 2.5.5 Target
 * Size on touch surfaces (RESP-05).
 */
export function IconButton({
  className,
  type,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(
        'focus-ring inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] transition hover:bg-[var(--color-surface-elevated)]',
        className,
      )}
      {...props}
    />
  )
}
