import {
  Link,
  Navigate,
  useParams,
  type LinkProps,
} from '@tanstack/react-router'

import { ArrowUpRight } from '@/shared/icons'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import {
  ADMIN_NAV_CATEGORY_ICONS,
  findAdminCategoryBySlug,
} from '@/features/admin/components/adminNav'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

/**
 * Category landing page — the icon rail's target for multi-editor categories.
 * Every tile derives from `adminNavCategories()` (label, description, icon),
 * so the page never duplicates IA. Unknown slugs bounce back to the dashboard.
 */
export function AdminCategoryPageRoute() {
  const { categoryKey } = useParams({ from: '/admin/category/$categoryKey' })
  const group = findAdminCategoryBySlug(categoryKey)

  if (!group) return <Navigate to="/admin" replace />

  const CategoryIcon = ADMIN_NAV_CATEGORY_ICONS[group.category]

  return (
    <AdminLayout layout="workspace">
      <section aria-label={`${group.category} editors`} className="space-y-5">
        <header className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-highlight)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]"
          >
            <CategoryIcon size={ICON_SIZE.lg} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="anvl-heading text-lg font-normal leading-tight text-[var(--color-heading)]">
              {group.category}
            </h2>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
              {group.items.length === 1
                ? 'One editor in this area.'
                : `${group.items.length} editors in this area.`}
            </p>
          </div>
        </header>

        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {group.items.map((item) => {
            const ItemIcon = item.icon
            return (
              <li key={item.href}>
                <Link
                  to={item.href as LinkProps['to']}
                  className={cn(
                    'focus-ring group relative flex h-full items-start gap-3 overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-4 no-underline',
                    'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]',
                    'transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] hover:bg-[var(--color-surface-elevated)]',
                  )}
                >
                  {/* Copper hairline — the plate's forged seam. */}
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-accent)_60%,transparent),transparent)]"
                  />
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-highlight)]"
                  >
                    <ItemIcon size={ICON_SIZE.md} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--color-text)]">
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-muted)]">
                      {item.description}
                    </span>
                  </span>
                  <ArrowUpRight
                    size={ICON_SIZE.sm}
                    aria-hidden="true"
                    className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </AdminLayout>
  )
}
