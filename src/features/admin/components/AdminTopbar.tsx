import { Link } from '@tanstack/react-router'
import { ExternalLink, LogOut, Menu } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/shared/components/ui/Button'
import { IconButton } from '@/shared/components/ui/IconButton'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

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
  const { logout } = useAdminAuth()

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

        <div className="flex items-center gap-2">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring hidden h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-3 text-xs font-semibold text-[var(--color-text)] no-underline transition hover:bg-[var(--color-surface-elevated)] sm:inline-flex"
          >
            View homepage
            <ExternalLink size={14} aria-hidden="true" />
          </Link>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={logout}
          >
            <LogOut size={14} aria-hidden="true" className="mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </header>
  )
}
