import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface AdminCardProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function AdminCard({
  title,
  description,
  actions,
  className,
  children,
}: PropsWithChildren<AdminCardProps>) {
  const hasHeader = Boolean(title || description || actions)
  return (
    <section
      className={cn(
        'rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-5 shadow-[0_1px_0_rgba(255,255,255,0.02)_inset,0_8px_28px_-22px_rgba(0,0,0,0.6)] transition-colors sm:p-6',
        className,
      )}
    >
      {hasHeader ? (
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {title ? (
              <h2 className="anvl-heading text-lg font-normal leading-tight sm:text-xl">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex shrink-0 items-center gap-2">{actions}</div>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
