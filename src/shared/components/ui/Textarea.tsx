import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Modern textarea — matches {@link Input} chrome (translucent fill, accent
 * focus ring). `text-base` on mobile / `text-sm` on md+ (RESP-07).
 */
export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 py-2.5 text-base text-[var(--color-text)] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] md:text-sm',
        className,
      )}
      {...props}
    />
  )
}
