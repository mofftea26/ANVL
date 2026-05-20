import { Link } from '@tanstack/react-router'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'

const destinations = [
  { title: 'Drops', href: '/admin/drops' },
  { title: 'Products', href: '/admin/products' },
  { title: 'Website layout', href: '/admin/website-layout' },
  { title: 'SEO', href: '/admin/seo' },
] as const

export function AdminMediaPageRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout title="Media">
        <AdminSectionHeader eyebrow="Guide" title="Where images live" />

        <div className="grid gap-6 md:grid-cols-2">
          {destinations.map((d) => (
            <AdminCard key={d.href} title={d.title}>
              <Link
                to={d.href}
                className="inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline"
              >
                Open
              </Link>
            </AdminCard>
          ))}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
