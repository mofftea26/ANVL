import { ChevronRight, Eye, Menu } from '@/shared/icons'
import { Link, type LinkProps, useRouterState } from '@tanstack/react-router'
import { useAdminPageActionsSlot } from '@/features/admin/components/AdminPageActionsContext'
import { AdminTopbarSessionChip } from '@/features/admin/components/AdminTopbarSessionChip'
import {
  adminCategoryHref,
  findAdminCategoryForPathname,
  findAdminNavItem,
} from '@/features/admin/components/adminNav'
import { cn } from '@/shared/lib/cn'
import { ICON_SIZE } from '@/shared/lib/iconSize'

interface AdminTopbarProps {
  onOpenMenu: () => void
  previewOpen?: boolean
  onTogglePreview?: () => void
}

interface AdminCrumb {
  label: string
  to?: string
  /** Ancestor crumbs marked compact hide below `sm` — the current page always stays readable. */
  compact?: boolean
}

interface AdminPageMeta {
  title: string
  description?: string
  crumbs: AdminCrumb[]
}

/**
 * Title, description, and CMS → category → page breadcrumbs, resolved from
 * the nav registry (single source of IA) for the CURRENT pathname — the
 * topbar is mounted once in the persistent shell, so pages no longer pass
 * their own headings. Category landing pages (`/admin/category/*`) resolve
 * through the category groups.
 */
function useAdminPageMeta(): AdminPageMeta {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  const crumbs: AdminCrumb[] = [{ label: 'CMS', to: '/admin' }]
  if (!pathname.startsWith('/admin')) {
    return { title: 'ANVL Studio', crumbs: [] }
  }
  if (pathname === '/admin') {
    const dashboard = findAdminNavItem(pathname)
    return {
      title: dashboard?.label ?? 'Dashboard',
      description: dashboard?.description,
      crumbs,
    }
  }

  const item = findAdminNavItem(pathname)
  const group = findAdminCategoryForPathname(pathname)

  if (item) {
    if (item.category !== 'Dashboard' && item.category !== 'Settings') {
      // The category crumb links to its landing page when one exists
      // (multi-editor categories); single-editor categories stay a label.
      crumbs.push({
        label: item.category,
        to:
          group && group.items.length > 1
            ? adminCategoryHref(item.category)
            : undefined,
        compact: true,
      })
    }
    crumbs.push({ label: item.label, to: item.href })
    return { title: item.label, description: item.description, crumbs }
  }

  if (group) {
    // Category landing page — the category itself is the current page.
    crumbs.push({ label: group.category })
    return { title: group.category, crumbs }
  }

  return { title: 'ANVL Studio', crumbs }
}

export function AdminTopbar({
  onOpenMenu,
  previewOpen = false,
  onTogglePreview,
}: AdminTopbarProps) {
  const pageActions = useAdminPageActionsSlot()
  const { title, description, crumbs } = useAdminPageMeta()
  const showDescription = Boolean(description) && crumbs.length <= 1

  return (
    <header
      className={cn(
        'relative z-30 shrink-0',
        'bg-[var(--color-surface)]/95 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--color-surface)]/88',
        // Studio command bar: a molten-copper hairline instead of a plain border.
        'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-[linear-gradient(90deg,var(--color-accent)_0%,color-mix(in_srgb,var(--color-accent)_35%,transparent)_45%,var(--color-line)_100%)]',
      )}
    >
      <div className="flex min-h-[3.5rem] w-full items-center gap-2.5 px-4 sm:px-5 lg:px-6">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open admin navigation"
          className={cn(
            'focus-ring inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text)]',
            'lg:hidden',
          )}
        >
          <Menu size={ICON_SIZE.md} aria-hidden="true" className="text-[var(--color-text-muted)]" />
        </button>

        <div className="min-w-0 flex-1">
          {crumbs.length > 1 ? (
            <nav
              aria-label="Breadcrumb"
              className="mb-0.5 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
            >
              {crumbs.map((crumb, index) => {
                const isLast = index === crumbs.length - 1
                return (
                  <span
                    key={`${crumb.label}-${index}`}
                    className={cn(
                      'min-w-0 items-center gap-1',
                      // Ancestors between CMS and the page collapse away on
                      // narrow screens — the current page must stay readable.
                      crumb.compact && !isLast ? 'hidden sm:flex' : 'flex',
                    )}
                  >
                    {index > 0 ? (
                      // Lives inside the crumb's span, so a hidden compact
                      // ancestor takes its separator with it — mobile reads
                      // "CMS › Page" with a single chevron.
                      <ChevronRight size={12} aria-hidden className="shrink-0 opacity-50" />
                    ) : null}
                    {crumb.to && !isLast ? (
                      <Link
                        to={crumb.to as LinkProps['to']}
                        preload={false}
                        className="truncate transition-colors hover:text-[var(--color-text)]"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={isLast ? 'page' : undefined}
                        className={cn(
                          isLast
                            ? 'whitespace-normal text-[var(--color-text)]'
                            : 'truncate',
                        )}
                      >
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

        {onTogglePreview ? (
          <button
            type="button"
            onClick={onTogglePreview}
            aria-pressed={previewOpen}
            aria-label={previewOpen ? 'Close live preview' : 'Open live preview'}
            title={previewOpen ? 'Close live preview' : 'Open live preview'}
            className={cn(
              'focus-ring hidden h-9 shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-medium transition-colors lg:inline-flex',
              previewOpen
                ? 'border-[var(--color-accent)]/60 bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                : 'border-[var(--color-line)] bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] hover:text-[var(--color-text)]',
            )}
          >
            <Eye size={ICON_SIZE.sm} aria-hidden />
            Preview
          </button>
        ) : null}

        <AdminTopbarSessionChip className="hidden shrink-0 sm:flex" />
      </div>
    </header>
  )
}
