import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Square icon button. `size="md"` (default) is 44 × 44 px to meet WCAG 2.5.5
 * Target Size on touch surfaces (RESP-05) — always use it on the storefront
 * for any control that could be a primary touch target. `size="sm"` (36 × 36)
 * is for mouse-driven, densely packed chrome: admin topbars/toolbars, or
 * desktop-only hover-reveal overlay controls (gallery arrows, zoom) that
 * never appear as someone's only way to reach an action on touch.
 */
const iconButtonClass = cva('focus-ring inline-flex items-center justify-center transition', {
  variants: {
    size: {
      md: 'h-11 w-11 rounded-md',
      sm: 'h-9 w-9 rounded-md',
    },
    variant: {
      default:
        'border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
      ghost: 'border border-transparent text-[var(--color-text)] hover:bg-[var(--color-chip)]',
      /** Translucent circular chrome over media (PDP/gallery overlay controls). */
      overlay:
        'rounded-full border border-[var(--color-line)] bg-[var(--color-overlay)] text-[var(--color-text)] backdrop-blur-sm transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] disabled:opacity-40',
    },
  },
  defaultVariants: { size: 'md', variant: 'default' },
})

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonClass>

export function IconButton({ className, type, size, variant, ...props }: IconButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={cn(iconButtonClass({ size, variant }), className)}
      {...props}
    />
  )
}
