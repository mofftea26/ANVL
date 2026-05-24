import {
  LayoutDashboard,
  Layers,
  Package,
  Globe,
  Palette,
  Search,
  Image,
  Settings,
  ExternalLink,
  LogOut,
} from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { cn } from '@/shared/lib/cn'
import { adminNavItemsByCluster } from './adminNav'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
  density?: 'default' | 'drawer'
}

const NAV_ICONS: Record<string, typeof LayoutDashboard> = {
  '/admin': LayoutDashboard,
  '/admin/drops': Layers,
  '/admin/products': Package,
  '/admin/website-layout': Globe,
  '/admin/theme': Palette,
  '/admin/seo': Search,
  '/admin/media': Image,
  '/admin/settings': Settings,
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
          : 'gap-6 px-3 py-5 sm:px-4 lg:sticky lg:top-0 lg:self-start lg:h-[100dvh] lg:min-h-[100dvh] lg:max-h-[100dvh]',
        className,
      )}
    >
      <div className={cn('flex min-h-0 flex-col', isDrawer ? 'flex-1 gap-3 overflow-hidden' : 'gap-6')}>
        <Link
          to="/admin"
          className="focus-ring flex shrink-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-[var(--color-heading)] no-underline"
          onClick={onNavigate}
        >
          <AnvlCompactMark className={cn('w-auto', isDrawer ? 'h-6' : 'h-7')} aria-hidden />
          <div className="min-w-0">
            <p className={cn('anvl-heading font-normal leading-none', isDrawer ? 'text-sm' : 'text-base')}>
              ANVL Admin
            </p>
            <p className={cn('anvl-micro text-[var(--color-text-muted)]', isDrawer ? 'mt-0.5 text-[9px]' : 'mt-1 text-[10px]')}>
              CMS
            </p>
          </div>
        </Link>

        <nav className={cn('flex min-h-0 flex-1 flex-col overflow-y-auto', isDrawer ? 'gap-3' : 'gap-5')}>
          {clusters.map(({ cluster, items }) => (
            <div key={cluster} className="space-y-1">
              <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[var(--color-text-muted)]/80">
                {cluster}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const isActive = pathIsActive(pathname, item.href)
                  const Icon = NAV_ICONS[item.href] ?? LayoutDashboard
                  return (
                    <li key={item.href}>
                      <Link
                        to={item.href}
                        onClick={onNavigate}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'focus-ring group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm no-underline transition',
                          isActive
                            ? 'bg-[var(--color-surface-elevated)] text-[var(--color-heading)] shadow-[inset_2px_0_0_0_var(--color-accent)]'
                            : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-elevated)]/60 hover:text-[var(--color-text)]',
                        )}
                      >
                        <Icon
                          size={16}
                          aria-hidden
                          className={cn(
                            'shrink-0',
                            isActive ? 'text-[var(--color-accent)]' : 'opacity-70 group-hover:opacity-100',
                          )}
                        />
                        <span className="min-w-0 truncate font-medium">{item.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <footer className={cn('mt-auto shrink-0 space-y-1 border-t border-[var(--color-line)] pt-3')}>
        <Link
          to="/"
          target="_blank"
          rel="noreferrer"
          className="focus-ring inline-flex h-9 w-full items-center gap-2 rounded-lg border border-[var(--color-line)]/80 px-2.5 text-xs font-medium text-[var(--color-text-muted)] no-underline transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)]"
          onClick={onNavigate}
        >
          <ExternalLink size={14} aria-hidden className="shrink-0" />
          View storefront
        </Link>
        <button
          type="button"
          className="inline-flex h-9 w-full items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 px-2.5 text-xs font-medium text-red-200 transition hover:bg-red-950/40"
          onClick={logout}
        >
          <LogOut size={14} aria-hidden className="shrink-0" />
          Logout
        </button>
      </footer>
    </aside>
  )
}
