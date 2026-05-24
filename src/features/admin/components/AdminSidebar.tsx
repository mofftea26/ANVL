import { Link, useRouterState } from '@tanstack/react-router'
import { ExternalLink, LogOut } from 'lucide-react'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { cn } from '@/shared/lib/cn'
import { adminNavItemsByCluster } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
  /** Compact rail used inside the mobile `Drawer`; nav chrome matches drawer density. */
  density?: 'default' | 'drawer'
}

function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

const footerActionBase =
  'focus-ring inline-flex h-9 w-full shrink-0 items-center justify-start gap-2 whitespace-nowrap rounded-md border px-3 text-xs font-medium transition'

const footerStorefrontClassName = cn(
  footerActionBase,
  'border-[var(--color-bone)]/35 bg-transparent text-[var(--color-bone)] no-underline hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)]',
)

const footerLogoutClassName = cn(
  footerActionBase,
  'border-red-500/35 bg-red-950/25 text-red-200 hover:bg-red-950/45 hover:text-red-100',
)

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
      <div className={cn('flex min-h-0 flex-col', isDrawer ? 'flex-1 gap-3 overflow-hidden' : 'gap-8')}>
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
            isDrawer ? 'justify-between gap-2 overflow-y-auto py-1' : 'gap-7 overflow-y-auto',
          )}
        >
          {clusters.map(({ cluster, items }) => (
            <div key={cluster} className={cn(isDrawer ? 'min-h-0 space-y-1.5' : 'space-y-3')}>
              <p
                className={cn(
                  'anvl-micro uppercase tracking-[0.14em] text-[var(--color-text-muted)]',
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
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'focus-ring block rounded-md border no-underline transition',
                          isDrawer ? 'px-2.5 py-2 text-xs' : 'px-3 py-2.5 text-sm',
                          isActive
                            ? 'border-[var(--color-accent)]/40 bg-[var(--color-surface-elevated)] text-[var(--color-heading)]'
                            : 'border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]',
                        )}
                      >
                        <span
                          className={cn(
                            'min-w-0 font-medium leading-snug',
                            isDrawer ? 'truncate' : 'block',
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <footer
        className={cn(
          'mt-auto shrink-0 space-y-1.5 border-t border-[var(--color-line)]',
          isDrawer ? 'pt-3' : 'pt-4',
        )}
      >
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className={footerStorefrontClassName}
          onClick={onNavigate}
        >
          <ExternalLink size={14} aria-hidden="true" className="shrink-0" />
          <span>View storefront</span>
        </Link>
        <button type="button" className={footerLogoutClassName} onClick={logout}>
          <LogOut size={14} aria-hidden="true" className="shrink-0" />
          <span>Logout</span>
        </button>
      </footer>
    </aside>
  )
}
