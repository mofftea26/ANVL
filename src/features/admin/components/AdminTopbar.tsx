import { ChevronRight, Menu } from '@/shared/icons'
import type { ReactNode } from 'react'
import { Link, useRouterState } from '@tanstack/react-router'
import { useAdminPageActionsSlot } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarSessionChip } from '@/features/admin/components/AdminTopbarSessionChip'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface AdminTopbarProps {
  title: string
  /** Shown under the title — dashboard only. */
  description?: ReactNode
  onOpenMenu: () => void
}

function useAdminBreadcrumbs(): { label: string; to?: string }[] {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const segments = pathname.split('/').filter(Boolean)

  if (segments[0] !== 'admin') return []

  const crumbs: { label: string; to?: string }[] = [
    { label: 'CMS', to: '/admin' },
  ]

  if (segments.length === 1) return crumbs

  const section = segments[1]
  const sectionLabels: Record<string, string> = {
    drops: 'Drops',
    products: 'Products',
    media: 'Media',
    theme: 'Theme',
    'site-layout': 'Website layout',
    seo: 'SEO',
  }

  if (section && sectionLabels[section]) {
    crumbs.push({
      label: sectionLabels[section],
      to: `/admin/${section}`,
    })
  }

  if (section === 'drops' && segments[2] === 'new') {
    crumbs.push({ label: 'New drop' })
  } else if (section === 'drops' && segments[2]) {
    crumbs.push({ label: 'Editor' })
  } else if (section === 'products' && segments[2]) {
    crumbs.push({ label: 'Editor' })
  }

  return crumbs
}

export function AdminTopbar({
  title,
  description,
  onOpenMenu,
}: AdminTopbarProps) {
  const pageActions = useAdminPageActionsSlot()
  const breadcrumbs = useAdminBreadcrumbs()
  const showDescription = Boolean(description) && breadcrumbs.length <= 1

  return (
    <header
      className={cn(
        'z-30 shrink-0 border-b border-[var(--color-line)]/90',
        'bg-[var(--color-bg)]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-bg)]/88',
      )}
    >
      <div className="flex min-h-[3.5rem] w-full items-center gap-2.5 px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open admin navigation"
          className={cn(
            'focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)]',
          )}
        >
          <Menu size={ICON_SIZE.md} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        </button>

        <div className="min-w-0 flex-1">
          {breadcrumbs.length > 1 ? (
            <nav
              aria-label="Breadcrumb"
              className="mb-0.5 flex min-w-0 items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
            >
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <span key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1">
                    {index > 0 ? (
                      <ChevronRight size={10} aria-hidden className="shrink-0 opacity-50" />
                    ) : null}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to}
                        className="truncate transition-colors hover:text-[var(--color-text)]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn('truncate', isLast && 'text-[var(--color-text)]')}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                )
              })}
            </nav>
          ) : null}

          <div className="flex min-w-0 items-baseline gap-3">
            <h1 className="anvl-heading min-w-0 truncate text-base font-normal leading-tight sm:text-lg lg:text-xl">
              {title}
            </h1>
          </div>

          {showDescription ? (
            <p className="mt-0.5 line-clamp-2 max-w-2xl text-xs text-[var(--color-text-muted)]">
              {description}
            </p>
          ) : null}
        </div>

        {pageActions ? (
          <div
            className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 sm:gap-2"
            data-testid="admin-page-actions"
          >
            {pageActions}
          </div>
        ) : null}

        <AdminTopbarSessionChip className="hidden shrink-0 sm:flex" />
      </div>
    </header>
  )
}
