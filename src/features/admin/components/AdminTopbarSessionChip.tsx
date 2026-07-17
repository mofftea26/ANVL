import { Link } from '@tanstack/react-router'
import { ChevronDown, ExternalLink, LogOut, Settings } from '@/shared/icons'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import {
  sessionInitial,
  sessionPrimaryLabel,
  sessionSecondaryLabel,
  sessionShortLabel,
} from '@/features/admin/components/adminSessionDisplay'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import {
  AdminPopover,
  AdminPopoverContent,
  AdminPopoverTrigger,
} from '@/features/admin/components/AdminPopover'
import { cn } from '@/shared/lib/cn'

function AccountMenuLink({
  to,
  icon: Icon,
  label,
  external,
}: {
  to: string
  icon: typeof Settings
  label: string
  external?: boolean
}) {
  return (
    <Link
      to={to}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
      className="focus-ring group flex items-center gap-3 rounded-xl px-2.5 py-2 text-[var(--color-text-muted)] no-underline transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)]/70 bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] transition group-hover:border-[var(--color-line)] group-hover:bg-[var(--color-surface-elevated)] group-hover:text-[var(--color-text)]">
        <Icon size={15} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-medium leading-tight text-[var(--color-heading)]">
          {label}
        </span>
      </span>
    </Link>
  )
}

export function AdminTopbarSessionChip({ className }: { className?: string }) {
  const { session, logout } = useAdminAuth()
  if (!session) return null

  const shortLabel = sessionShortLabel(session)
  const tooltip = sessionSecondaryLabel(session)

  return (
    <AdminPopover>
      <AdminPopoverTrigger asChild>
        <button
          type="button"
          title={tooltip}
          aria-label={`Account menu for ${tooltip}`}
          className={cn(
            'focus-ring inline-flex h-9 max-w-[12rem] items-center gap-2 rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-surface-soft)]/80 px-2 pl-1.5 text-left text-[var(--color-text)] transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] sm:max-w-[14rem]',
            className,
          )}
        >
          <span
            aria-hidden
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-[10px] font-semibold text-[var(--color-accent)]"
          >
            {sessionInitial(session)}
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-medium">{shortLabel}</span>
          <ChevronDown size={ICON_SIZE.sm} aria-hidden className="shrink-0 text-[var(--color-text-muted)]" />
        </button>
      </AdminPopoverTrigger>
      <AdminPopoverContent
        align="end"
        sideOffset={8}
        className="w-[min(18rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border-[var(--color-line)]/80 bg-[var(--color-surface)] p-0 shadow-[0_18px_48px_rgba(0,0,0,0.45)]"
      >
        <div className="border-b border-[var(--color-line)]/60 bg-[var(--color-surface-soft)]/50 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-sm font-semibold text-[var(--color-accent)]"
            >
              {sessionInitial(session)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--color-heading)]">
                {sessionPrimaryLabel(session)}
              </p>
              <p
                className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]"
                title={tooltip}
              >
                {tooltip}
              </p>
            </div>
          </div>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--color-text-muted)]/80">
            Signed in
          </p>
        </div>

        <div className="space-y-1 p-2">
          <AccountMenuLink to="/" icon={ExternalLink} label="View storefront" external />
          <AccountMenuLink to="/admin/settings" icon={Settings} label="Settings" />
        </div>

        <div className="border-t border-[var(--color-line)]/60 p-2">
          <button
            type="button"
            className="focus-ring inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl text-xs font-medium text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-heading)]"
            onClick={() => void logout()}
          >
            <LogOut size={ICON_SIZE.sm} aria-hidden />
            Sign out
          </button>
        </div>
      </AdminPopoverContent>
    </AdminPopover>
  )
}
