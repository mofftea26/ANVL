import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface AdminRailPanelProps {
  /** Section heading rendered as an `<h2>` for the rail landmark. */
  title: ReactNode
  /** Optional leading icon (decorative — kept `aria-hidden`). */
  icon?: ReactNode
  /** Optional supporting copy under the heading. */
  description?: ReactNode
  /** Optional trailing control (e.g. a toggle) aligned to the heading. */
  actions?: ReactNode
  className?: string
  testId?: string
}

/**
 * Lightweight titled panel used inside the {@link AdminWorkspace} side rail.
 * Lighter than {@link AdminCard} so stacked rail sections stay legible without
 * competing with the primary editing surface.
 */
export function AdminRailPanel({
  title,
  icon,
  description,
  actions,
  className,
  testId,
  children,
}: PropsWithChildren<AdminRailPanelProps>) {
  return (
    <section
      data-testid={testId}
      className={cn(
        'rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {icon ? (
            <span
              aria-hidden="true"
              className="inline-flex shrink-0 text-[var(--color-text-muted)]"
            >
              {icon}
            </span>
          ) : null}
          <h2 className="text-sm font-medium leading-tight text-[var(--color-heading)]">
            {title}
          </h2>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-1.5">{actions}</div> : null}
      </div>
      {description ? (
        <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-muted)]">
          {description}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </section>
  )
}
