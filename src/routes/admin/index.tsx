import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { adminNavGroups } from '@/features/admin/components/adminNav'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

const dashboardCards = adminNavGroups.flatMap((group) =>
  group.items
    .filter((item) => item.href !== '/admin')
    .map((item) => ({
      label: item.label,
      href: item.href,
      description: item.description ?? '',
      badge: group.label,
      cta: `Open ${item.label}`,
    })),
)

function AdminDashboardPage() {
  return (
    <ProtectedAdminRoute>
      <DashboardContent />
    </ProtectedAdminRoute>
  )
}

function DashboardContent() {
  const { session } = useAdminAuth()

  return (
    <AdminLayout
      title="Dashboard"
      description="A calmer layout: pick a surface, go deep in the editor, and keep the storefront fast on mobile."
    >
      <AdminSectionHeader
        eyebrow="Signed in"
        title={`Welcome back, ${session?.username ?? 'admin'}`}
        description="Everything persists in this browser via localStorage until a backend arrives. Destructive resets live under Settings."
        actions={
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
          >
            View site
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        }
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {dashboardCards.map((card) => (
          <AdminCard key={card.href} title={card.label} description={card.description}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {card.badge}
              </span>
              <Link
                to={card.href}
                className="inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-bg)] no-underline transition hover:-translate-y-0.5"
              >
                {card.cta}
              </Link>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
