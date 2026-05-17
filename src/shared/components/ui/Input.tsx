import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Storefront/admin text input. Default size is text-base on mobile and
 * text-sm on md+ so iOS Safari doesn't zoom on focus (RESP-07). Callers
 * can still override via className.
 */
export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'focus-ring h-11 w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
