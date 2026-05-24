import { Loader2 } from 'lucide-react'
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import {
  adminChipButtonVariants,
  type AdminChipButtonVariant,
} from '@/features/admin/components/adminChipButtonStyles'
import { cn } from '@/shared/lib/cn'

export {
  adminChipButtonVariants,
  adminTopbarChipButtonClassName,
} from '@/features/admin/components/adminChipButtonStyles'

export type AdminTopbarChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode
  variant?: AdminChipButtonVariant
  size?: 'default' | 'icon'
  /** Shows an inline spinner and disables interaction. */
  loading?: boolean
}

export const AdminTopbarChipButton = forwardRef<HTMLButtonElement, AdminTopbarChipButtonProps>(
  function AdminTopbarChipButton(
    {
      className,
      children,
      icon,
      variant = 'default',
      size = 'default',
      type = 'button',
      loading = false,
      disabled,
      ...props
    },
    ref,
  ) {
    const iconOnly = size === 'icon' && !children
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(adminChipButtonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <Loader2
            size={14}
            aria-hidden="true"
            className={cn('shrink-0 animate-spin text-[var(--color-text-muted)]')}
          />
        ) : icon ? (
          <span
            className={cn(
              'inline-flex shrink-0 text-[var(--color-text-muted)]',
              iconOnly && 'text-[var(--color-heading)]',
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        ) : null}
        {children ? <span className={cn('truncate', loading && icon && 'sr-only')}>{children}</span> : null}
      </button>
    )
  },
)
