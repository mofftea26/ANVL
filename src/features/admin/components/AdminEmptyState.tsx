import type { LinkProps } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { AdminButton } from '@/features/admin/components/AdminButton'
import { adminTopbarChipButtonClassName } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { cn } from '@/shared/lib/cn'

export type AdminEmptyStateProps = {
  title: string
  description?: ReactNode
  className?: string
  /** Primary CTA as router link. */
  actionTo?: LinkProps['to']
  actionLabel?: string
  /** Primary CTA as button (e.g. refetch). */
  onAction?: () => void
}

export function AdminEmptyState({
  title,
  description,
  className,
  actionTo,
  actionLabel,
  onAction,
}: AdminEmptyStateProps) {
  return (
    <AdminCard title={title} className={className}>
      {description ? (
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">{description}</p>
      ) : null}
      {actionTo && actionLabel ? (
        <AdminForgedLink to={actionTo} variant="cta" className="mt-4">
          {actionLabel}
        </AdminForgedLink>
      ) : null}
      {onAction && actionLabel && !actionTo ? (
        <AdminButton type="button" className="mt-4" onClick={onAction}>
          {actionLabel}
        </AdminButton>
      ) : null}
    </AdminCard>
  )
}

/** Compact inline empty hint (tables, rosters). */
export function AdminEmptyHint({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <p className={cn('text-sm text-[var(--color-text-muted)]', className)}>{children}</p>
  )
}

/** Product / media thumb placeholder. */
export function AdminMediaThumbPlaceholder({
  label = 'No image',
  className,
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center text-[10px] text-[var(--color-text-muted)]',
        className,
      )}
    >
      {label}
    </div>
  )
}

/** Forged secondary link using shared button tokens (View site). */
export function AdminSecondaryExternalLink({
  href,
  children,
  className,
}: {
  href: string
  children: ReactNode
  className?: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn(adminTopbarChipButtonClassName, 'shrink-0 gap-2 no-underline', className)}
    >
      {children}
    </a>
  )
}
