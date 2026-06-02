import type { LinkProps } from '@tanstack/react-router'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminForgedLink } from '@/features/admin/components/AdminForgedLink'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminStatusBadge } from '@/features/admin/components/AdminStatusBadge'
import { adminNavItems } from '@/features/admin/components/adminNav'

const dashboardCards = adminNavItems.filter((i) => i.href !== '/admin')

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
      description="Campaign drops, catalog, and site chrome."
    >
      <AdminCard
        title="Homepage"
        description="The live site at / is driven by the active drop’s act sequence."
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Configure the homepage in <strong>Drops</strong> → open the active drop →{' '}
          <strong>Acts</strong>. Use the <strong>Cinematic scroll hero</strong> preset for a
          pinned GSAP scroll intro; other acts render below in builder order. Publish the drop
          so changes reach the storefront.
        </p>
      </AdminCard>
      <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
          <AdminCard
            key={card.href}
            className="min-h-[15.5rem] sm:min-h-[16rem]"
            title={card.label}
            description={card.description}
          >
            <div className="mt-auto flex w-full flex-wrap items-end justify-between gap-4 pt-0.5">
              <AdminStatusBadge tone="accent" className="px-3 py-1.5 tracking-[0.22em]">
                {card.badge}
              </AdminStatusBadge>
              <AdminForgedLink to={card.href as LinkProps['to']}>
                <span className="relative z-10">{card.cta}</span>
              </AdminForgedLink>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
