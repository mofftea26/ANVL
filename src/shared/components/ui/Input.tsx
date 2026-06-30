import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Modern text input. Soft translucent fill that solidifies on focus, accent
 * border + ring on focus, smooth transition. `text-base` on mobile / `text-sm`
 * on md+ so iOS Safari doesn't zoom on focus (RESP-07). API unchanged so every
 * existing usage upgrades automatically.
 */
export const inputBaseClass =
  'h-11 w-full rounded-xl border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_60%,transparent)] px-3.5 text-base text-[var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] outline-none transition-[border-color,background-color,box-shadow] duration-200 placeholder:text-[var(--color-text-muted)] hover:border-[color-mix(in_oklab,var(--color-accent)_35%,var(--color-line))] focus:border-[var(--color-accent)] focus:bg-[var(--color-surface)] focus:ring-2 focus:ring-[color-mix(in_oklab,var(--color-accent)_30%,transparent)] disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputBaseClass, className)} {...props} />
}
