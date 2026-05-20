import { Link } from '@tanstack/react-router'
import { ExternalLink, LogOut, Settings, User } from 'lucide-react'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { AdminButton } from '@/features/admin/components/AdminButton'
import {
  AdminPopover,
  AdminPopoverContent,
  AdminPopoverTrigger,
} from '@/features/admin/components/AdminPopover'
import { cn } from '@/shared/lib/cn'

function sessionLabel(session: NonNullable<ReturnType<typeof useAdminAuth>['session']>): string {
  if (session.kind === 'supabase') {
    const email = session.email.trim()
    if (email) {
      const local = email.split('@')[0] ?? email
      return local.length > 18 ? `${local.slice(0, 16)}…` : local
    }
    return session.displayName.trim() || 'Admin'
  }
  return session.username
}

function sessionTooltip(session: NonNullable<ReturnType<typeof useAdminAuth>['session']>): string {
  if (session.kind === 'supabase') return session.email
  return session.username
}

export function AdminTopbarSessionChip({ className }: { className?: string }) {
  const { session, logout } = useAdminAuth()
  if (!session) return null

  const label = sessionLabel(session)
  const tooltip = sessionTooltip(session)

  return (
    <AdminPopover>
      <AdminPopoverTrigger asChild>
        <button
          type="button"
          title={tooltip}
          aria-label={`Account menu for ${tooltip}`}
          className={cn(
            'focus-ring inline-flex h-9 max-w-[9.5rem] items-center gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-surface-soft)] px-2.5 text-xs font-medium text-[var(--color-text)] sm:max-w-[11rem]',
            className,
          )}
        >
          <User size={14} aria-hidden="true" className="shrink-0 text-[var(--color-text-muted)]" />
          <span className="truncate">{label}</span>
        </button>
      </AdminPopoverTrigger>
      <AdminPopoverContent align="end" className="w-52 p-2">
        <p className="truncate px-2 py-1 text-[10px] text-[var(--color-text-muted)]" title={tooltip}>
          {tooltip}
        </p>
        <div className="mt-1 flex flex-col gap-1">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring flex h-9 items-center gap-2 rounded-md px-2 text-xs text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
          >
            <ExternalLink size={14} aria-hidden="true" />
            View storefront
          </Link>
          <Link
            to="/admin/settings"
            className="focus-ring flex h-9 items-center gap-2 rounded-md px-2 text-xs text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
          >
            <Settings size={14} aria-hidden="true" />
            Settings
          </Link>
          <AdminButton
            type="button"
            variant="secondary"
            size="sm"
            className="h-9 w-full justify-start gap-2 px-2 text-xs"
            onClick={() => void logout()}
          >
            <LogOut size={14} aria-hidden="true" />
            Log out
          </AdminButton>
        </div>
      </AdminPopoverContent>
    </AdminPopover>
  )
}
