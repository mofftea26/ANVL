import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-semibold transition',
  {
    variants: {
      variant: {
        primary: 'border-[var(--color-accent)] bg-[var(--color-accent)] text-[var(--color-bg)] hover:opacity-90',
        secondary:
          'border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-surface-elevated)]',
        ghost: 'border-transparent text-[var(--color-text)] hover:bg-[var(--color-chip)]',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
)

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>

export function Button({ className, variant, size, ...props }: Props) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
