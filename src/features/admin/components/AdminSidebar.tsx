import { Link, useRouterState } from '@tanstack/react-router'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { cn } from '@/shared/lib/cn'
import { adminNavItemsByCluster } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
}

function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar({ onNavigate, className }: AdminSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const clusters = adminNavItemsByCluster()

  return (
    <aside
      className={cn(
        'flex h-full flex-col gap-8 border-r border-[var(--color-line)] bg-[var(--color-surface)] px-4 py-6 sm:px-5',
        className,
      )}
    >
      <Link
        to="/admin"
        className="focus-ring flex items-center gap-2 rounded-md text-[var(--color-heading)] no-underline"
        onClick={onNavigate}
      >
        <AnvlCompactMark className="h-7 w-auto" aria-hidden="true" />
        <div>
          <p className="anvl-heading text-base font-normal leading-none">
            ANVL Admin
          </p>
          <p className="anvl-micro mt-1 text-[10px] text-[var(--color-text-muted)]">
            CMS
          </p>
        </div>
      </Link>

      <nav className="flex flex-col gap-7 overflow-y-auto">
        {clusters.map(({ cluster, items }) => (
          <div key={cluster} className="space-y-3">
            <p className="anvl-micro text-[10px] text-[var(--color-text-muted)]">
              {cluster}
            </p>
            <ul className="space-y-1.5">
              {items.map((item) => {
                const isActive = pathIsActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'focus-ring block rounded-md border px-3 py-2.5 text-sm no-underline transition',
                        isActive
                          ? 'border-[var(--color-accent)]/40 bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                          : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
                      )}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="block font-medium leading-snug">{item.label}</span>
                        <span className="shrink-0 rounded-full border border-[var(--color-line)] px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                          {item.badge}
                        </span>
                      </span>
                      <span className="mt-1 block text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                        {item.description}
                      </span>
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
