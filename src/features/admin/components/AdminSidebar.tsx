import { Link, useRouterState } from '@tanstack/react-router'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { cn } from '@/shared/lib/cn'
import { adminNavGroups } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-8 border-r border-[var(--color-line)] bg-[var(--color-surface)] px-5 py-6',
        className,
      )}
    >
      <Link
        to="/admin"
        className="flex items-center gap-2 text-[var(--color-heading)] no-underline"
        onClick={onNavigate}
      >
        <AnvlCompactMark className="h-7 w-auto" aria-hidden="true" />
        <div>
          <p className="anvl-heading text-base font-normal leading-none">
            ANVL Admin
          </p>
          <p className="anvl-micro mt-1 text-[10px] text-[var(--color-text-muted)]">
            Content Workspace
          </p>
        </div>
      </Link>

      <nav className="flex flex-col gap-7 overflow-y-auto">
        {adminNavGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive =
                  item.href === '/admin'
                    ? pathname === '/admin'
                    : pathname === item.href ||
                      pathname.startsWith(`${item.href}/`)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'block rounded-md border px-3 py-2 text-sm no-underline transition',
                        isActive
                          ? 'border-[var(--color-accent)]/40 bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                          : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
                      )}
                    >
                      <span className="block font-medium">{item.label}</span>
                      {item.description ? (
                        <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
