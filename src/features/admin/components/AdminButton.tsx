/**
 * Admin feature entrypoint for pressable controls.
 * Tab variants delegate to shared {@link Button}; primary/secondary/ghost/destructive
 * render as pill chips via {@link AdminTopbarChipButton}.
 */
import { forwardRef, type ReactNode } from 'react'
import { Button, type ButtonProps } from '@/shared/components/ui/Button'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import type { AdminChipButtonVariant } from '@/features/admin/components/adminChipButtonStyles'

export {
  buttonVariants as adminButtonVariants,
  type ButtonProps as AdminButtonProps,
} from '@/shared/components/ui/Button'

const TAB_VARIANTS = new Set<NonNullable<ButtonProps['variant']>>([
  'adminTabList',
  'adminTabEditor',
  'adminTabProduct',
])

const CHIP_ALIAS_VARIANTS = new Set<NonNullable<ButtonProps['variant']>>([
  'primary',
  'secondary',
  'ghost',
  'destructive',
])

const CHIP_VARIANT_MAP = {
  primary: 'primary',
  secondary: 'default',
  ghost: 'ghost',
  destructive: 'destructive',
} as const satisfies Record<
  'primary' | 'secondary' | 'ghost' | 'destructive',
  AdminChipButtonVariant
>

function resolveChipSize(
  size: ButtonProps['size'],
  className: string | undefined,
  children: ReactNode,
): 'default' | 'icon' {
  if (size === 'compact') return 'icon'
  if (
    className?.includes('w-9') ||
    className?.includes('w-10') ||
    className?.includes('px-0')
  ) {
    return 'icon'
  }
  if (size === 'sm' && !children) return 'icon'
  return 'default'
}

export const AdminButton = forwardRef<HTMLButtonElement, ButtonProps>(function AdminButton(
  { variant = 'primary', size, loading, className, children, ...props },
  ref,
) {
  if (variant && TAB_VARIANTS.has(variant)) {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        loading={loading}
        className={className}
        {...props}
      >
        {children}
      </Button>
    )
  }

  if (variant && CHIP_ALIAS_VARIANTS.has(variant)) {
    const chipVariant = CHIP_VARIANT_MAP[variant as keyof typeof CHIP_VARIANT_MAP]
    const chipSize = resolveChipSize(size, className, children)
    return (
      <AdminTopbarChipButton
        ref={ref}
        variant={chipVariant}
        size={chipSize}
        loading={loading}
        className={className}
        {...props}
      >
        {children}
      </AdminTopbarChipButton>
    )
  }

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      loading={loading}
      className={className}
      {...props}
    >
      {children}
    </Button>
  )
})
