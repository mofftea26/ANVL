import { cva, type VariantProps } from 'class-variance-authority'

/** Pill chip tokens — shared by {@link AdminTopbarChipButton} and {@link AdminButton} aliases. */
export const adminChipButtonVariants = cva(
  'focus-ring inline-flex items-center justify-center gap-2 rounded-full border text-xs font-medium shrink-0 transition disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
        primary:
          'border-[var(--color-accent)]/55 bg-[var(--color-surface-soft)] text-[var(--color-heading)] hover:bg-[var(--color-accent)]/15',
        destructive:
          'border-red-500/40 bg-[var(--color-surface-soft)] text-red-100 hover:bg-red-500/10',
        ghost:
          'border-transparent bg-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
        success:
          'border-emerald-500/35 bg-[var(--color-surface-soft)] text-emerald-100 hover:bg-emerald-500/10',
      },
      size: {
        default: 'h-9 px-2.5',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export type AdminChipButtonVariant = NonNullable<
  VariantProps<typeof adminChipButtonVariants>['variant']
>

/** @deprecated Use `adminChipButtonVariants({ variant: 'default', size: 'default' })` — kept for link class merges. */
export const adminTopbarChipButtonClassName = adminChipButtonVariants({
  variant: 'default',
  size: 'default',
})
