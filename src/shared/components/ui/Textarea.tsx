import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Storefront/admin textarea. Default size is text-base on mobile and
 * text-sm on md+ so iOS Safari doesn't zoom on focus (RESP-07).
 */
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'focus-ring w-full rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
