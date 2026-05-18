import type { PropsWithChildren, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

interface AdminCardProps {
  title?: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
  /** Optional hook for targeted tests (`data-testid` on the outer section). */
  testId?: string
}

export function AdminCard({
  title,
  description,
  actions,
  className,
  testId,
  children,
}: PropsWithChildren<AdminCardProps>) {
  const hasHeader = Boolean(title || description || actions)
  return (
    <section
      data-testid={testId}
      className={cn(
        'group/card relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl',
        'border border-[var(--color-line)] bg-[var(--color-surface)]',
        /* Forged plate: inward specular rim + ambient shadow */
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.07),inset_0_-1px_0_rgba(0,0,0,0.42),0_1px_0_rgba(255,255,255,0.04),0_20px_56px_-36px_rgba(0,0,0,0.82)]',
        'motion-safe:transition-[box-shadow,border-color] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]',
        'motion-reduce:transition-none',
        /* Hover affordance — border/shadow only (no shell translate) */
        'hover:border-[color:color-mix(in_srgb,var(--anvl-bone)_28%,transparent)]',
        'motion-safe:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.095),inset_0_-1px_0_rgba(0,0,0,0.38),0_1px_0_rgba(255,255,255,0.07),0_26px_64px_-34px_rgba(0,0,0,0.88)]',
        'p-5 sm:p-6',
        className,
      )}
    >
      {/* Gradient hairline + cool edge wash (non-interactive) */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 rounded-[inherit]',
          'ring-1 ring-inset ring-[color:color-mix(in_srgb,var(--anvl-bone)_10%,transparent)]',
          'bg-[linear-gradient(145deg,color-mix(in_srgb,var(--anvl-bone)_14%,transparent)_0%,transparent_42%),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface-elevated)_38%,transparent)_0%,transparent_55%)]',
          'opacity-90',
          'motion-safe:transition-opacity motion-safe:duration-300',
          'group-hover/card:opacity-100 motion-reduce:group-hover/card:opacity-90',
        )}
      />
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
        {hasHeader ? (
          <header className="mb-4 flex shrink-0 flex-wrap items-start justify-between gap-x-4 gap-y-3 sm:mb-5">
            <div className="min-w-0 space-y-0.5">
              {title ? (
                <h2 className="anvl-heading text-base font-normal leading-snug tracking-[0.04em] text-[var(--color-heading)] sm:text-lg">
                  {title}
                </h2>
              ) : null}
              {description ? (
                <p className="max-w-2xl text-[13px] leading-relaxed text-[var(--color-text-muted)] sm:text-sm sm:leading-relaxed">
                  {description}
                </p>
              ) : null}
            </div>
            {actions ? (
              <div className="flex shrink-0 items-center gap-2">{actions}</div>
            ) : null}
          </header>
        ) : null}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </section>
  )
}
