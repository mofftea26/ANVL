import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Pill control shared by admin topbar actions and the session chip. */
export const adminTopbarChipButtonClassName =
  'focus-ring inline-flex h-9 items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-2.5 text-xs font-medium text-[var(--color-text)] shrink-0 transition hover:bg-[var(--color-surface-elevated)] disabled:pointer-events-none disabled:opacity-50'

export type AdminTopbarChipButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: ReactNode
}

export function AdminTopbarChipButton({
  className,
  children,
  icon,
  type = 'button',
  ...props
}: AdminTopbarChipButtonProps) {
  return (
    <button type={type} className={cn(adminTopbarChipButtonClassName, className)} {...props}>
      {icon ? (
        <span className="inline-flex shrink-0 text-[var(--color-text-muted)]" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      {children ? <span className="truncate">{children}</span> : null}
    </button>
  )
}
