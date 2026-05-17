import { Link } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import type { AdminNavItem } from '@/features/admin/components/adminNav'
import { adminNavItems } from '@/features/admin/components/adminNav'
import { cn } from '@/shared/lib/cn'

const dashboardCards = adminNavItems.filter((i) => i.href !== '/admin')

/** Primary card CTA — outline + forged inset highlight (avoids flat accent slab on dark chrome). */
function DashboardCardCtaLink({ item }: { item: AdminNavItem }) {
  return (
    <Link
      to={item.href}
      className={cn(
        'focus-ring relative inline-flex h-11 min-h-11 shrink-0 items-center justify-center overflow-hidden rounded-lg px-6 text-sm font-semibold tracking-wide no-underline',
        'border border-[color-mix(in_oklab,var(--color-accent)_48%,transparent)]',
        'bg-[var(--color-surface)] text-[var(--color-heading)]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.26),0_2px_8px_-2px_rgba(0,0,0,0.48)]',
        'transition-[border-color,background-color,box-shadow]',
        'hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-elevated)]',
        'hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.11),inset_0_-1px_0_rgba(0,0,0,0.26),0_12px_28px_-14px_rgba(0,0,0,0.6)]',
        'active:border-[color-mix(in_oklab,var(--color-accent)_65%,transparent)] active:bg-[var(--color-surface)]',
        'active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.38)]',
      )}
    >
      <span className="relative z-10">{item.cta}</span>
    </Link>
  )
}

export function AdminDashboardPageRoute() {
  return (
    <ProtectedAdminRoute>
      <DashboardContent />
    </ProtectedAdminRoute>
  )
}

function DashboardContent() {
  return (
    <AdminLayout
      title="Dashboard"
      description="A calmer surface for orchestrating cinematic drops without losing the forged ANVL aesthetic."
    >
      <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <AdminCard
            key={card.href}
            className="min-h-[15.5rem] sm:min-h-[16rem]"
            title={card.label}
            description={card.description}
          >
            <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-4 pt-0.5">
              <span className="rounded-full border border-[color:color-mix(in_srgb,var(--color-line)_100%,transparent)] bg-[linear-gradient(to_bottom,color-mix(in_srgb,var(--color-surface-elevated)_45%,transparent),transparent)] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {card.badge}
              </span>
              <DashboardCardCtaLink item={card} />
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
