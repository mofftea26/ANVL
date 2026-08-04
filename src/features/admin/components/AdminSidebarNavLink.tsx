import { Link, type LinkProps } from '@tanstack/react-router'
import type { AdminNavCategory, AdminNavItem } from '@/features/admin/components/adminNav'
import { ADMIN_NAV_CATEGORY_ICONS, adminCategoryHref } from '@/features/admin/components/adminNav'
import { categoryIsActive } from '@/features/admin/components/adminSidebarActive'
import { cn } from '@/shared/lib/cn'

/** A single expanded-rail nav link (default/drawer densities). */
export function SidebarNavLink({
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
      // Preload on hover. Every admin editor is a `lazyRouteComponent`, so
      // this fetches the target's JS chunk (19–74 KB) while the pointer is
      // still travelling — without it the chunk only starts downloading on
      // click, which is the whole of the perceived delay when switching
      // editors. The earlier `preload={false}` reasoned that there is "no
      // useful data to preload"; that conflates loader data with the route
      // MODULE, and it is the module that costs. The cost it was really
      // guarding against — hover re-running the `/admin` `beforeLoad` auth
      // chain — is absorbed by `getCachedAdminSession`'s 45s promise cache.
      preload="intent"
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
export function RailCategoryLink({
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
      // Same reasoning as SidebarNavLink above: preload the lazy editor chunk.
      preload="intent"
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
