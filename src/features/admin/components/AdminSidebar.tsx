import {
  ExternalLink,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Link, type LinkProps, useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { AnvlCompactMark } from '@/shared/assets/brand'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { AdminConfirmDialog } from '@/features/admin/components/AdminConfirmDialog'
import type { AdminNavCategory, AdminNavItem } from '@/features/admin/components/adminNav'
import {
  ADMIN_NAV_CATEGORIES,
  ADMIN_NAV_CATEGORY_ICONS,
  adminCategoryHref,
  adminNavCategories,
} from '@/features/admin/components/adminNav'
import {
  sessionInitial,
  sessionPrimaryLabel,
  sessionSecondaryLabel,
} from '@/features/admin/components/adminSessionDisplay'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import { cn } from '@/shared/lib/cn'

interface AdminSidebarProps {
  onNavigate?: () => void
  className?: string
  density?: 'default' | 'drawer' | 'rail'
  /** Rendered as a collapse/expand chevron in the header (persistent shell only). */
  onToggleCollapse?: () => void
}

const SIDEBAR_CATS_KEY = ADMIN_STORAGE_KEYS.sidebarCats

type ExpandedCats = Record<string, boolean>

/** All categories expanded — the server/first-paint default. */
function allExpanded(): ExpandedCats {
  return Object.fromEntries(ADMIN_NAV_CATEGORIES.map((c) => [c, true]))
}

/** Stored expanded set (JSON array of category names) — null when unset/invalid. */
function readExpandedCats(): ExpandedCats | null {
  try {
    const raw = window.localStorage.getItem(SIDEBAR_CATS_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return null
    const expanded: ExpandedCats = Object.fromEntries(
      ADMIN_NAV_CATEGORIES.map((c) => [c, false]),
    )
    for (const entry of parsed) {
      if (typeof entry === 'string' && entry in expanded) expanded[entry] = true
    }
    return expanded
  } catch {
    return null
  }
}

function persistExpandedCats(expanded: ExpandedCats) {
  try {
    window.localStorage.setItem(
      SIDEBAR_CATS_KEY,
      JSON.stringify(ADMIN_NAV_CATEGORIES.filter((c) => expanded[c])),
    )
  } catch {
    // Preference only — safe to drop when storage is unavailable.
  }
}

function pathIsActive(pathname: string, href: string) {
  return href === '/admin'
    ? pathname === '/admin'
    : pathname === href || pathname.startsWith(`${href}/`)
}

/** Whether the pathname belongs to a category (any of its editors or its landing page). */
function categoryIsActive(
  pathname: string,
  category: AdminNavCategory,
  items: AdminNavItem[],
) {
  if (pathIsActive(pathname, adminCategoryHref(category))) return true
  return items.some((item) => pathIsActive(pathname, item.href))
}

function SidebarNavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: AdminNavItem
  isActive: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon

  return (
    <Link
      to={item.href as LinkProps['to']}
      // Hovering any admin nav item fires the intent-preload machinery,
      // which re-runs the `/admin` `beforeLoad` auth chain. The shared
      // `getCachedAdminSession` cache absorbs that now, but there's still no
      // useful data to preload here (the target is another admin editor
      // behind the same already-mounted shell) — skip it outright.
      preload={false}
      onClick={onNavigate}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'focus-ring group relative flex items-center gap-3 rounded-lg px-2.5 py-2 no-underline transition-[background-color,box-shadow,color] duration-200',
        isActive
          ? // Studio active state: an ink plate stamped on the paper rail.
            'bg-[var(--color-heading)] text-[var(--color-bg)] shadow-[0_2px_8px_color-mix(in_srgb,var(--color-heading)_25%,transparent)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md transition-colors duration-200',
          isActive
            ? 'bg-transparent text-[var(--color-bg)]'
            : 'bg-[var(--color-surface-soft)] text-[var(--color-text-muted)] group-hover:bg-[var(--color-surface-elevated)] group-hover:text-[var(--color-text)]',
        )}
      >
        <Icon size={15} aria-hidden />
      </span>

      <span className="min-w-0 flex-1">
        <span className="truncate text-[13px] font-medium leading-tight">
          {item.label}
        </span>
      </span>

      {isActive ? (
        <span
          aria-hidden
          className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-[var(--color-accent)]"
        />
      ) : null}
    </Link>
  )
}

/** Icon rail: ONE button per category — single-editor categories deep-link, the rest land on `/admin/category/…`. */
function RailCategoryLink({
  category,
  items,
  pathname,
  onNavigate,
}: {
  category: AdminNavCategory
  items: AdminNavItem[]
  pathname: string
  onNavigate?: () => void
}) {
  const single = items.length === 1
  const href = single ? items[0].href : adminCategoryHref(category)
  const label = single ? items[0].label : category
  const Icon = ADMIN_NAV_CATEGORY_ICONS[category]
  const isActive = categoryIsActive(pathname, category, items)

  return (
    <Link
      to={href as LinkProps['to']}
      preload={false}
      onClick={onNavigate}
      aria-label={label}
      title={label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'focus-ring relative mx-auto flex h-11 w-11 items-center justify-center rounded-lg no-underline transition-[background-color,box-shadow,color] duration-200',
        isActive
          ? 'bg-[var(--color-heading)] text-[var(--color-bg)] shadow-[0_2px_8px_color-mix(in_srgb,var(--color-heading)_25%,transparent)]'
          : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-text)]',
      )}
    >
      <Icon size={18} aria-hidden />
      <span className="sr-only">{label}</span>
      {isActive ? (
        <span
          aria-hidden
          className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-[var(--color-accent)]"
        />
      ) : null}
    </Link>
  )
}

export function AdminSidebar({
  onNavigate,
  className,
  density = 'default',
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { logout, session } = useAdminAuth()
  const categories = adminNavCategories().filter(
    ({ category }) => category !== 'Settings',
  )
  const isDrawer = density === 'drawer'
  const isRail = density === 'rail'
  const compact = isRail

  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  // Collapsible category sections (expanded + drawer densities). Default all
  // expanded on server + first paint; the stored preference applies post-mount
  // with the active item's category force-expanded so it is never hidden.
  const [expandedCats, setExpandedCats] = useState<ExpandedCats>(allExpanded)
  useEffect(() => {
    const stored = readExpandedCats()
    if (!stored) return
    const activeGroup = adminNavCategories().find(({ category, items }) =>
      categoryIsActive(window.location.pathname, category, items),
    )
    if (activeGroup) stored[activeGroup.category] = true
    setExpandedCats(stored)
    // Mount-only (reads window.location directly): later navigation must not
    // re-open sections the user deliberately closed.
  }, [])

  const toggleCategory = (category: AdminNavCategory) => {
    setExpandedCats((prev) => {
      const next = { ...prev, [category]: !prev[category] }
      persistExpandedCats(next)
      return next
    })
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
    } finally {
      // Full navigation clears every in-memory admin surface and re-runs the
      // route guard (logout only cleared the cookie + React state — the admin
      // layout doesn't gate on the session, so without this the page lingered
      // and the button looked dead).
      window.location.assign('/admin/login')
    }
  }

  return (
    <aside
      className={cn(
        'relative flex min-h-0 flex-col overflow-hidden',
        'border-r border-[var(--color-line)]/70',
        'bg-[linear-gradient(180deg,var(--color-surface)_0%,color-mix(in_srgb,var(--color-surface)_92%,var(--color-bg))_100%)]',
        'h-full gap-0',
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top_left,color-mix(in_srgb,var(--color-accent)_12%,transparent),transparent_70%)]"
      />

      <header
        className={cn(
          'relative shrink-0 border-b border-[var(--color-line)]/60',
          compact ? 'px-2 py-3' : 'px-4 pb-4 pt-5',
        )}
      >
        <div
          className={cn(
            'flex items-start gap-2',
            compact ? 'flex-col items-center' : 'justify-between',
          )}
        >
          <Link
            to="/admin"
            preload={false}
            className="focus-ring flex min-w-0 items-center gap-3 rounded-xl no-underline"
            onClick={onNavigate}
          >
            <span
              className={cn(
                'flex shrink-0 items-center justify-center rounded-xl border border-[var(--color-line)]/80 bg-[var(--color-surface-soft)] shadow-[0_1px_0_color-mix(in_srgb,var(--color-text)_6%,transparent)]',
                compact ? 'h-9 w-9' : 'h-10 w-10',
              )}
            >
              <AnvlCompactMark className="h-5 w-auto" aria-hidden />
            </span>
            {!compact ? (
              <span className="min-w-0">
                <span className="anvl-heading block text-[15px] font-normal leading-none tracking-wide text-[var(--color-heading)]">
                  ANVL Studio
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  Forge control room
                </span>
              </span>
            ) : (
              <span className="sr-only">ANVL Studio</span>
            )}
          </Link>

          {isDrawer && onNavigate ? (
            <button
              type="button"
              onClick={onNavigate}
              aria-label="Close navigation"
              className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)]/70 bg-[var(--color-surface-soft)]/80 text-[var(--color-text-muted)] transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
            >
              <X size={17} aria-hidden />
            </button>
          ) : null}

          {onToggleCollapse ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-label={compact ? 'Expand navigation' : 'Collapse navigation'}
              title={compact ? 'Expand navigation' : 'Collapse navigation'}
              className="focus-ring inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--color-line)]/70 bg-[var(--color-surface-soft)]/80 text-[var(--color-text-muted)] transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text)]"
            >
              {compact ? (
                <ChevronRight size={ICON_SIZE.sm} aria-hidden />
              ) : (
                <ChevronLeft size={ICON_SIZE.sm} aria-hidden />
              )}
            </button>
          ) : null}
        </div>
      </header>

      <nav
        aria-label="Admin"
        className={cn(
          'relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain',
          compact ? 'gap-1.5 px-2 py-3' : 'gap-3 px-3 py-4',
        )}
      >
        {compact
          ? categories.map(({ category, items }) => (
              <RailCategoryLink
                key={category}
                category={category}
                items={items}
                pathname={pathname}
                onNavigate={onNavigate}
              />
            ))
          : categories.map(({ category, items }) => {
              const isDashboard = category === 'Dashboard'
              const isOpen = isDashboard || expandedCats[category] !== false
              const isActiveCategory = categoryIsActive(pathname, category, items)
              const sectionId = `admin-nav-${category.toLowerCase().replace(/\s+/g, '-')}`

              return (
                <section key={category} className="space-y-1">
                  {!isDashboard ? (
                    <button
                      type="button"
                      onClick={() => toggleCategory(category)}
                      aria-expanded={isOpen}
                      aria-controls={sectionId}
                      className="focus-ring group flex w-full items-center gap-2 rounded-md px-2 pt-1.5 pb-1 text-left"
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'h-1 w-1 rounded-full transition-colors',
                          isActiveCategory
                            ? 'bg-[var(--color-accent)]'
                            : 'bg-[var(--color-line)] group-hover:bg-[var(--color-accent)]/60',
                        )}
                      />
                      <span
                        className={cn(
                          'text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors',
                          isActiveCategory
                            ? 'text-[var(--color-accent)]'
                            : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text)]',
                        )}
                      >
                        {category}
                      </span>
                      <span aria-hidden className="h-px flex-1 bg-[var(--color-line)]/60" />
                      <ChevronDown
                        size={12}
                        aria-hidden
                        className={cn(
                          'shrink-0 text-[var(--color-text-muted)] transition-transform duration-200',
                          !isOpen && '-rotate-90',
                        )}
                      />
                    </button>
                  ) : null}

                  {isOpen ? (
                    <ul id={sectionId} className="space-y-1">
                      {items.map((item) => (
                        <li key={item.href}>
                          <SidebarNavLink
                            item={item}
                            isActive={pathIsActive(pathname, item.href)}
                            onNavigate={onNavigate}
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div id={sectionId} hidden />
                  )}
                </section>
              )
            })}
      </nav>

      <footer
        className={cn(
          'relative shrink-0 border-t border-[var(--color-line)]/60',
          compact ? 'space-y-1.5 px-2 py-3' : 'space-y-3 px-3 py-4',
        )}
      >
        {session && !compact ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-line)]/70 bg-[var(--color-surface-soft)]/60 px-3 py-2.5">
            <span
              aria-hidden
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/15 text-xs font-semibold text-[var(--color-accent)]"
            >
              {sessionInitial(session)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-[var(--color-heading)]">
                {sessionPrimaryLabel(session)}
              </span>
              <span
                className="mt-0.5 block truncate text-[10px] text-[var(--color-text-muted)]"
                title={sessionSecondaryLabel(session)}
              >
                {sessionSecondaryLabel(session)}
              </span>
            </span>
          </div>
        ) : null}

        <div className={cn('grid gap-1.5', compact ? 'grid-cols-1' : 'grid-cols-2')}>
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            title="View storefront"
            className={cn(
              'focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)]/75 bg-[var(--color-surface-soft)]/50 text-[var(--color-text-muted)] no-underline transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)]',
              compact ? 'h-8 px-2 text-[11px]' : 'h-9 px-2.5 text-xs font-medium',
            )}
            onClick={onNavigate}
          >
            <ExternalLink size={ICON_SIZE.sm} aria-hidden className="shrink-0" />
            {!compact ? <span>Storefront</span> : <span className="sr-only">View storefront</span>}
          </Link>

          <Link
            to="/admin/settings"
            preload={false}
            title="Settings"
            className={cn(
              'focus-ring inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-line)]/75 bg-[var(--color-surface-soft)]/50 text-[var(--color-text-muted)] no-underline transition hover:border-[var(--color-line)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-heading)]',
              compact ? 'h-8 px-2 text-[11px]' : 'h-9 px-2.5 text-xs font-medium',
            )}
            onClick={onNavigate}
          >
            <Settings size={ICON_SIZE.sm} aria-hidden className="shrink-0" />
            {!compact ? <span>Settings</span> : <span className="sr-only">Settings</span>}
          </Link>
        </div>

        <button
          type="button"
          className={cn(
            'focus-ring inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent text-[var(--color-text-muted)] transition hover:border-[var(--color-line)]/60 hover:bg-[var(--color-surface-soft)] hover:text-[var(--color-heading)]',
            compact ? 'h-8 px-2 text-[11px]' : 'h-9 px-2.5 text-xs font-medium',
          )}
          title="Sign out"
          onClick={() => setConfirmSignOut(true)}
        >
          <LogOut size={ICON_SIZE.sm} aria-hidden className="shrink-0" />
          {!compact ? <span>Sign out</span> : <span className="sr-only">Sign out</span>}
        </button>
      </footer>

      <AdminConfirmDialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        title="Sign out of ANVL Studio?"
        confirmLabel="Sign out"
        confirmVariant="destructive"
        confirmLoading={signingOut}
        onConfirm={() => void handleSignOut()}
      >
        You'll be returned to the sign-in screen. Unsaved edits in this browser
        are kept as local drafts.
      </AdminConfirmDialog>
    </aside>
  )
}
