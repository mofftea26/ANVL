import type { ReactNode } from 'react'

interface AdminSectionHeaderProps {
  eyebrow?: string
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}

export function AdminSectionHeader({
  eyebrow,
  title,
  description,
  actions,
}: AdminSectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-line)] pb-5">
      <div
        className={
          description
            ? 'min-w-0 space-y-2'
            : 'min-w-0 space-y-1.5'
        }
      >
        {eyebrow ? (
          <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="anvl-heading text-2xl font-normal leading-tight tracking-tight text-[var(--color-heading)] sm:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--color-text-muted)] sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
