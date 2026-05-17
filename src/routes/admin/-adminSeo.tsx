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
    <AdminLayout
      title="SEO"
      description="Discovery copy lives beside the content that ships — drops, catalog SKUs, and shared defaults from the mock CMS."
    >
      <AdminSectionHeader
        eyebrow="Discovery"
        title="Where SEO is authored"
        description="Homepage meta follows the active drop. Product pages use per-SKU fields in the catalog. Site-wide defaults come from the CMS mock until a backend ships."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <AdminCard
          title="Active drop"
          description="Title, descriptions, OG image, and slug-level sharing for the live landing narrative."
        >
          <Link
            to="/admin/drops"
            className="inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-5 text-sm font-semibold text-[var(--color-bg)] no-underline"
          >
            Edit drops & SEO tabs
          </Link>
        </AdminCard>

        <AdminCard
          title="Products"
          description="OG image URLs, PDP titles, and meta descriptions sync with storefront mocks."
        >
          <Link
            to="/admin/products"
            className="inline-flex h-11 items-center rounded-md border border-[var(--color-line)] px-5 text-sm font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
          >
            Manage catalog SEO fields
          </Link>
        </AdminCard>
      </div>
    </AdminLayout>
  )
}
