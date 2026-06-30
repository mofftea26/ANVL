import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/** Modern checkbox — accent-filled, rounded, subtle focus ring. */
export function Checkbox({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn(
        'h-[1.15rem] w-[1.15rem] cursor-pointer rounded-md border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] accent-[var(--color-accent)] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklab,var(--color-accent)_35%,transparent)]',
        className,
      )}
      {...props}
    />
  )
}
