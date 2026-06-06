import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold uppercase tracking-[0.1em] transition',
  {
    variants: {
      variant: {
        primary:
          'border-[var(--color-ember)] bg-[var(--color-ember)] text-[var(--color-bg)] hover:opacity-90',
        secondary:
          'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[color-mix(in_oklab,var(--color-ember)_55%,var(--color-line))] hover:bg-[var(--color-surface-elevated)]',
        ghost: 'border-transparent text-[var(--color-text)] hover:bg-[var(--color-chip)]',
        destructive:
          'border-red-500/40 bg-transparent text-red-300 hover:border-red-400/60 hover:bg-red-500/10',
        /** Use with `data-active="true" | "false"` for selected vs idle segmented tabs. */
        adminTabList:
          'shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[var(--color-bg)] data-[active=false]:hover:bg-[var(--color-surface-elevated)] data-[active=false]:hover:text-[var(--color-text)]',
        adminTabEditor:
          'gap-1.5 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[var(--color-bg)] data-[active=false]:hover:bg-[var(--color-surface-elevated)] data-[active=false]:hover:text-[var(--color-text)]',
        adminTabProduct:
          'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] border-[var(--color-line)] text-[var(--color-text-muted)] data-[active=true]:border-[var(--color-accent)] data-[active=true]:bg-[var(--color-accent)] data-[active=true]:text-[var(--color-bg)] data-[active=false]:hover:border-[color-mix(in_oklab,var(--color-accent)_40%,transparent)]',
      },
      size: {
        none: '',
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
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
            className={cn('shrink-0 animate-spin', children ? 'mr-2' : '')}
          />
        ) : null}
        {children}
      </button>
    )
  },
)
