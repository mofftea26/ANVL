import { Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { IconButton } from '@/shared/components/ui/IconButton'
import { useAdminPageActionsSlot } from '@/features/admin/components/AdminPageActionsContext'

interface AdminTopbarProps {
  title: string
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
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <IconButton
          className="lg:hidden"
          onClick={onOpenMenu}
          aria-label="Open admin navigation"
        >
          <Menu size={16} />
        </IconButton>

        <div className="min-w-0 flex-1">
          <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
            ANVL Admin
          </p>
          <h1 className="anvl-heading mt-0.5 truncate text-xl font-normal leading-tight sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 line-clamp-2 max-w-2xl text-xs text-[var(--color-text-muted)] sm:text-sm">
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
      </div>
    </header>
  )
}
