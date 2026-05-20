import { Link } from '@tanstack/react-router'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'

export function AdminSeoHubPageRoute() {
  return (
    <ProtectedAdminRoute>
      <SeoHubPage />
    </ProtectedAdminRoute>
  )
}

function SeoHubPage() {
  return (
    <AdminLayout title="SEO">
      <AdminSectionHeader eyebrow="Discovery" title="Where SEO is authored" />

      <div className="grid gap-5 md:grid-cols-2">
        <AdminCard title="Active drop">
          <Link
            to="/admin/drops"
            className="inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-bg)] no-underline"
          >
            Edit drop SEO
          </Link>
        </AdminCard>

        <AdminCard title="Products">
          <Link
            to="/admin/products"
            className="inline-flex h-11 items-center rounded-md border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
          >
            Catalog SEO
          </Link>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
