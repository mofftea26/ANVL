import { Link, useRouterState } from '@tanstack/react-router'
import { ExternalLink, LogOut } from 'lucide-react'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { adminChipButtonVariants } from '@/features/admin/components/adminChipButtonStyles'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { cn } from '@/shared/lib/cn'
import { adminNavItemsByCluster } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
  /** Compact rail used inside the mobile `Drawer`; nav chrome matches desktop. */
  density?: 'default' | 'drawer'
}

function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

const footerActionClassName =
  'focus-ring inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap'

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
        'flex min-h-0 flex-col justify-between gap-3 overflow-hidden border-r border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-4',
        !isDrawer &&
          'lg:sticky lg:top-0 lg:self-start lg:h-[100dvh] lg:min-h-[100dvh] lg:max-h-[100dvh]',
        className,
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <Link
          to="/admin"
          className="focus-ring flex shrink-0 items-center gap-2 rounded-md text-[var(--color-heading)] no-underline"
          onClick={onNavigate}
        >
          <AnvlCompactMark className="h-6 w-auto" aria-hidden="true" />
          <div className="min-w-0">
            <p className="anvl-heading truncate text-sm font-normal leading-none">
              ANVL Admin
            </p>
            <p className="anvl-micro mt-0.5 text-[9px] text-[var(--color-text-muted)]">
              CMS
            </p>
          </div>
        </Link>

        <nav className="flex min-h-0 flex-1 flex-col justify-between gap-2 overflow-y-auto py-1">
          {clusters.map(({ cluster, items }) => (
            <div key={cluster} className="min-h-0 space-y-1.5">
              <p className="anvl-micro text-[9px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                {cluster}
              </p>
              <ul className="space-y-1">
                {items.map((item) => {
                  const isActive = pathIsActive(pathname, item.href)
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          adminChipButtonVariants({
                            variant: isActive ? 'primary' : 'default',
                          }),
                          'focus-ring flex h-9 w-full min-w-0 justify-start px-3 no-underline',
                        )}
                      >
                        <span className="truncate font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <footer className="mt-auto shrink-0 space-y-1.5 border-t border-[var(--color-line)] pt-3">
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className={cn(
            adminChipButtonVariants({ variant: 'default' }),
            footerActionClassName,
            'no-underline',
          )}
          onClick={onNavigate}
        >
          <span className="whitespace-nowrap">View storefront</span>
          <ExternalLink size={14} aria-hidden="true" className="shrink-0" />
        </Link>
        <AdminTopbarChipButton
          type="button"
          variant="default"
          className={footerActionClassName}
          onClick={logout}
        >
          <LogOut size={14} aria-hidden="true" />
          Logout
        </AdminTopbarChipButton>
      </footer>
    </aside>
  )
}
