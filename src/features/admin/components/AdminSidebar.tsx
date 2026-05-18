import { Link, useRouterState } from '@tanstack/react-router'
import { ExternalLink, LogOut } from 'lucide-react'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { Button } from '@/shared/components/ui/Button'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { cn } from '@/shared/lib/cn'
import { adminNavItemsByCluster } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
  /** Compact, non-scrolling rail used inside the mobile `Drawer`. */
  density?: 'default' | 'drawer'
}

function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminSidebar({
  onNavigate,
  className,
  density = 'default',
}: AdminSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { logout } = useAdminAuth()

  const clusters = adminNavItemsByCluster()
  const isDrawer = density === 'drawer'

  return (
    <aside
      className={cn(
        'flex min-h-0 flex-col border-r border-[var(--color-line)] bg-[var(--color-surface)]',
        isDrawer
          ? 'h-full justify-between gap-3 overflow-hidden px-3 py-4'
          : 'gap-8 px-4 py-6 sm:px-5 lg:sticky lg:top-0 lg:self-start lg:h-[100dvh] lg:min-h-[100dvh] lg:max-h-[100dvh]',
        className,
      )}
    >
      <Link
        to="/admin"
        className={cn(
          'focus-ring flex shrink-0 items-center gap-2 rounded-md text-[var(--color-heading)] no-underline',
          isDrawer && 'min-h-0',
        )}
        onClick={onNavigate}
      >
        <AnvlCompactMark
          className={cn('w-auto', isDrawer ? 'h-6' : 'h-7')}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p
            className={cn(
              'anvl-heading font-normal leading-none',
              isDrawer ? 'truncate text-sm' : 'text-base',
            )}
          >
            ANVL Admin
          </p>
          <p
            className={cn(
              'anvl-micro text-[var(--color-text-muted)]',
              isDrawer ? 'mt-0.5 text-[9px]' : 'mt-1 text-[10px]',
            )}
          >
            CMS
          </p>
        </div>
      </Link>

      <nav
        className={cn(
          'flex min-h-0 flex-1 flex-col overflow-hidden',
          isDrawer ? 'justify-between gap-2 py-1' : 'gap-7 overflow-y-auto',
        )}
      >
        {clusters.map(({ cluster, items }) => (
          <div key={cluster} className={cn(isDrawer ? 'min-h-0 space-y-1.5' : 'space-y-3')}>
            <p
              className={cn(
                'anvl-micro text-[var(--color-text-muted)]',
                isDrawer ? 'text-[9px]' : 'text-[10px]',
              )}
            >
              {cluster}
            </p>
            <ul className={cn(isDrawer ? 'space-y-1' : 'space-y-1.5')}>
              {items.map((item) => {
                const isActive = pathIsActive(pathname, item.href)
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'focus-ring block rounded-md border no-underline transition',
                        isDrawer ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm',
                        isActive
                          ? 'border-[var(--color-accent)]/40 bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                          : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
                      )}
                    >
                      <span className="flex min-w-0 items-start justify-between gap-2">
                        <span
                          className={cn(
                            'min-w-0 font-medium leading-snug',
                            isDrawer ? 'truncate' : 'block',
                          )}
                        >
                          {item.label}
                        </span>
                        <span
                          className={cn(
                            'inline-flex shrink-0 rounded-full border border-[var(--color-line)] uppercase tracking-[0.14em] text-[var(--color-text-muted)]',
                            isDrawer
                              ? 'max-w-[5rem] truncate px-1 py-0.5 text-[7px]'
                              : 'px-1.5 py-0.5 text-[9px]',
                          )}
                        >
                          {item.badge}
                        </span>
                      </span>
                      {isDrawer ? null : (
                        <span className="mt-1 block text-[11px] leading-relaxed text-[var(--color-text-muted)]">
                          {item.description}
                        </span>
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <footer
        className={cn(
          'mt-auto shrink-0 space-y-2 border-t border-[var(--color-line)]',
          isDrawer ? 'space-y-1.5 pt-3' : 'pt-4',
        )}
      >
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring flex h-11 w-full items-center justify-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]/40 px-3 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text)] no-underline transition hover:bg-[var(--color-surface-elevated)]"
          onClick={onNavigate}
        >
          View storefront
          <ExternalLink size={14} aria-hidden="true" />
        </Link>
        <Button
          type="button"
          variant="secondary"
          className="h-11 w-full uppercase tracking-[0.14em]"
          onClick={logout}
        >
          <LogOut size={14} aria-hidden="true" className="mr-2" />
          Logout
        </Button>
      </footer>
    </aside>
  )
}
