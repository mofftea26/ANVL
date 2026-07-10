import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

/**
 * Canonical button — the only button primitive storefront/admin surfaces
 * should reach for. `density="compact"` renders admin's dense pill-chip
 * proportions; `density="comfortable"` (default) renders the storefront's
 * gradient pill. Same variant colors/tokens either way — only shape/sizing
 * changes, so admin and storefront share one visual language.
 */
export const buttonVariants = cva(
  'focus-ring relative inline-flex select-none items-center justify-center gap-2 rounded-xl text-sm font-semibold uppercase tracking-[0.08em] transition-all duration-200 ease-out disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        // NOTE: text colors use the explicit `text-[color:var(...)]` form. A
        // bare `text-[var(--color-bg)]` is ambiguous to tailwind-merge, which
        // can classify it as a font-size, conflict with the base `text-sm`,
        // and drop the color — leaving a light inherited label on bone/light
        // backgrounds. The `color:` hint keeps it a color.
        primary:
          'border border-[color-mix(in_oklab,var(--color-highlight-bright)_45%,var(--color-highlight))] bg-gradient-to-b from-[var(--color-highlight-bright)] to-[var(--color-highlight)] text-[color:var(--color-on-highlight)] shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_26px_-10px_color-mix(in_oklab,var(--color-highlight)_75%,transparent)] hover:brightness-[1.05] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_16px_36px_-10px_color-mix(in_oklab,var(--color-highlight)_80%,transparent)]',
        secondary:
          'border border-[var(--color-line)] bg-[color-mix(in_oklab,var(--color-surface)_70%,transparent)] text-[color:var(--color-text)] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] backdrop-blur-sm hover:border-[color-mix(in_oklab,var(--color-highlight)_55%,var(--color-line))] hover:bg-[var(--color-surface-elevated)]',
        ghost:
          'border border-transparent text-[color:var(--color-text)] hover:bg-[var(--color-chip)]',
        destructive:
          'border border-[color-mix(in_oklab,var(--color-danger)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-danger)_10%,transparent)] text-[color:var(--color-danger)] hover:border-[var(--color-danger)] hover:bg-[color-mix(in_oklab,var(--color-danger)_16%,transparent)]',
        success:
          'border border-[color-mix(in_oklab,var(--color-success)_45%,transparent)] bg-[color-mix(in_oklab,var(--color-success)_10%,transparent)] text-[color:var(--color-success)] hover:border-[var(--color-success)] hover:bg-[color-mix(in_oklab,var(--color-success)_16%,transparent)]',
      },
      size: {
        sm: 'h-9 px-3.5',
        md: 'h-11 px-5',
        lg: 'h-12 px-7 text-[0.95rem]',
        /** Circular, icon-only (no label) — e.g. the account header's Save control. */
        icon: 'h-11 w-11 shrink-0 rounded-full p-0',
      },
      density: {
        comfortable: '',
        compact: '',
      },
    },
    compoundVariants: [
      // Admin's dense chip proportions: smaller, plain-case, no letter-spacing —
      // shape/typography change only, variant color logic is untouched.
      {
        density: 'compact',
        size: 'sm',
        class: 'h-8 rounded-full px-2.5 text-xs font-medium normal-case tracking-normal',
      },
      {
        density: 'compact',
        size: 'md',
        class: 'h-9 rounded-full px-3 text-xs font-medium normal-case tracking-normal',
      },
      {
        density: 'compact',
        size: 'lg',
        class: 'h-10 rounded-full px-3.5 text-xs font-medium normal-case tracking-normal',
      },
      { density: 'compact', size: 'icon', class: 'h-9 w-9' },
    ],
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      density: 'comfortable',
    },
  },
)

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    /** Shows an inline spinner and disables interaction. */
    loading?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      className,
      variant,
      size,
      density,
      type = 'button',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const isIcon = size === 'icon'
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size: size ?? 'md', density }),
          loading && 'pointer-events-none opacity-90',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            size={ICON_SIZE.md}
            aria-hidden="true"
            className={cn('shrink-0 animate-spin', !isIcon && children ? 'mr-2' : '')}
          />
        ) : null}
        {children}
      </button>
    )
  },
)
