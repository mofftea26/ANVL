import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Canonical button — the only button primitive storefront/admin surfaces
 * should reach for. Modern depth (soft inset highlight + ambient shadow),
 * smooth hover/press motion, and an `icon` size for icon-only circular
 * actions (e.g. the account header's Save control).
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
        /** Use with `data-active="true" | "false"` for selected vs idle segmented tabs. */
        adminTabList:
          'shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] border-[var(--color-line)] bg-[var(--color-surface)] text-[color:var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[color:var(--color-bg)] data-[active=false]:hover:bg-[var(--color-surface-elevated)] data-[active=false]:hover:text-[color:var(--color-text)]',
        adminTabEditor:
          'gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] border-[var(--color-line)] bg-[var(--color-surface)] text-[color:var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[color:var(--color-bg)] data-[active=false]:hover:bg-[var(--color-surface-elevated)] data-[active=false]:hover:text-[color:var(--color-text)]',
        adminTabProduct:
          'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] border-[var(--color-line)] text-[color:var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[color:var(--color-bg)] data-[active=false]:hover:border-[color-mix(in_oklab,var(--color-accent)_40%,transparent)]',
      },
      size: {
        none: '',
        sm: 'h-9 px-3.5',
        md: 'h-11 px-5',
        lg: 'h-12 px-7 text-[0.95rem]',
        /** Circular, icon-only (no label) — e.g. the account header's Save control. */
        icon: 'h-11 w-11 shrink-0 rounded-full p-0',
        compact:
          'h-auto min-h-8 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase leading-normal',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>['variant']>

const TAB_VARIANTS = [
  'adminTabList',
  'adminTabEditor',
  'adminTabProduct',
] as const satisfies readonly ButtonVariant[]

type TabVariant = (typeof TAB_VARIANTS)[number]

function isAdminTabVariant(v: ButtonVariant | null | undefined): v is TabVariant {
  return Boolean(v && (TAB_VARIANTS as readonly string[]).includes(v))
}

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
      type = 'button',
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) {
    const isTab = isAdminTabVariant(variant)
    const isIcon = size === 'icon'
    const resolvedSize = isTab ? 'none' : (size ?? 'md')
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          buttonVariants({ variant, size: resolvedSize }),
          loading && 'pointer-events-none opacity-90',
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2
            size={16}
            aria-hidden="true"
            className={cn('shrink-0 animate-spin', !isIcon && children ? 'mr-2' : '')}
          />
        ) : null}
        {children}
      </button>
    )
  },
)
