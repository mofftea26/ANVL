import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAdminPageActionsSlot } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarSessionChip } from '@/features/admin/components/AdminTopbarSessionChip'
import { cn } from '@/shared/lib/cn'

interface AdminTopbarProps {
  title: string
  /** Shown under the title — dashboard only. */
  description?: ReactNode
  onOpenMenu: () => void
}

export function AdminTopbar({
  title,
  description,
  onOpenMenu,
}: AdminTopbarProps) {
  const pageActions = useAdminPageActionsSlot()

  return (
    <header
      className={cn(
        'sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]',
        'lg:bg-[var(--color-bg)]/92 lg:backdrop-blur-sm',
      )}
    >
      <div className="flex min-h-[3.25rem] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open admin navigation"
          className={cn(
            'focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)]',
          )}
        >
          <Menu size={14} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="anvl-heading truncate text-lg font-normal leading-tight sm:text-xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 line-clamp-2 max-w-2xl text-xs text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {pageActions ? (
          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-2"
            data-testid="admin-page-actions"
          >
            {pageActions}
          </div>
        ) : null}

        <AdminTopbarSessionChip className="shrink-0" />
      </div>
    </header>
  )
}
