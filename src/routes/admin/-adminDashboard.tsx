import { Link, type LinkProps } from '@tanstack/react-router'

import { ArrowUpRight, Hourglass } from '@/shared/icons'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { adminNavCategories } from '@/features/admin/components/adminNav'
import { ActiveDropTile } from '@/features/admin/setup/ActiveDropTile'
import { SetupWizardHub } from '@/features/admin/setup/SetupWizardHub'
import { useComingSoonEnabled } from '@/features/admin/setup/useSetupStatus'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { cn } from '@/shared/lib/cn'

/** Sidebar IA minus the dashboard itself — the launcher mirrors the nav. */
const launcherGroups = adminNavCategories()
  .map(({ category, items }) => ({
    category,
    items: items.filter((i) => i.href !== '/admin'),
  }))
  .filter((group) => group.items.length > 0)

/**
 * The Studio control room — a single non-scrolling screen (≥1280px): status
 * strip (the clickable active-drop tile + Coming Soon warning), a dense
 * category launcher covering every admin surface, and the guided setup-wizard
 * row. Below `xl` the same content stacks and scrolls gracefully.
 */
export function AdminDashboardPageRoute() {
  return (
    <AdminLayout layout="workspace">
      {/* Fixed height at xl = viewport minus topbar minus the workspace main
          padding (lg:py-10 + pb-8 = 4.5rem) — the no-scroll contract. */}
      <div className="flex min-h-0 flex-col gap-4 xl:h-[calc(100dvh-var(--admin-topbar-height)-4.5rem)]">
        <StatusStrip />
        <CategoryLauncher />
        <SetupWizardHub />
      </div>
    </AdminLayout>
  )
}

/** Compact top strip: the clickable live-drop tile + Coming Soon state. */
function StatusStrip() {
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-3">
      <ActiveDropTile />
      <ComingSoonLivePill />
    </div>
  )
}

/** Warm warning pill shown while Coming Soon mode hides the public site. */
function ComingSoonLivePill() {
  const comingSoonEnabled = useComingSoonEnabled()
  if (!comingSoonEnabled) return null
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-[color-mix(in_srgb,var(--color-warning)_45%,transparent)] bg-[color-mix(in_srgb,var(--color-warning)_10%,transparent)] px-4 py-2.5">
      <Hourglass
        size={ICON_SIZE.sm}
        aria-hidden="true"
        className="shrink-0 text-[var(--color-warning)]"
      />
      <p className="text-xs font-medium text-[var(--color-text)]">
        Coming Soon is LIVE — visitors see the reveal page.
      </p>
      <Link
        to={'/admin/coming-soon' as LinkProps['to']}
        className="focus-ring rounded text-xs font-semibold text-[var(--color-warning)] underline underline-offset-2"
      >
        Manage
      </Link>
    </div>
  )
}

/**
 * Bento launcher: every admin surface as a small icon+label tile, grouped by
 * the sidebar's categories. Each plate hugs its content (CSS multi-column
 * masonry — one-item categories stay small, Content's four rows grow), so the
 * board reads as bento cells rather than a uniform stretched grid.
 */
function CategoryLauncher() {
  return (
    <section
      aria-label="Studio surfaces"
      // overflow-y-auto at EVERY size: on tall screens nothing scrolls (the
      // board fits), on short desktops the launcher scrolls internally instead
      // of the tallest masonry column bleeding into the wizard row below.
      className="min-h-0 flex-1 gap-3 overflow-y-auto sm:columns-2 xl:columns-4"
    >
      {launcherGroups.map(({ category, items }) => (
        <div
          key={category}
          className={cn(
            'relative mb-3 break-inside-avoid overflow-hidden rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/70 p-2.5',
            'flex flex-col gap-1.5',
            'shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-1px_0_rgba(0,0,0,0.35)]',
          )}
        >
          {/* Copper hairline — the plate's forged seam. */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,color-mix(in_srgb,var(--color-accent)_60%,transparent),transparent)]"
          />
          <h2 className="anvl-display px-1 text-[10px] tracking-[0.3em] text-[var(--color-text-muted)]">
            {category}
          </h2>
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const IconComponent = item.icon
              return (
                <li key={item.href}>
                  <Link
                    to={item.href as LinkProps['to']}
                    className={cn(
                      'focus-ring group flex items-center gap-2.5 rounded-lg border border-transparent px-2 py-1',
                      'transition-colors hover:border-[color-mix(in_srgb,var(--color-accent)_40%,transparent)] hover:bg-[var(--color-surface-elevated)]',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-[var(--color-highlight)]"
                    >
                      <IconComponent size={ICON_SIZE.md} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-[var(--color-text)]">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--color-text-muted)]">
                        {item.description}
                      </span>
                    </span>
                    <ArrowUpRight
                      size={ICON_SIZE.xs}
                      aria-hidden="true"
                      className="shrink-0 text-[var(--color-text-muted)] opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </section>
  )
}
