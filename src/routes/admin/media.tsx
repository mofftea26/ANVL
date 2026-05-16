import { Link, createFileRoute } from '@tanstack/react-router'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'

export const Route = createFileRoute('/admin/media')({
  component: AdminMediaRoute,
})

const destinations = [
  {
    title: 'Drops',
    href: '/admin/drops',
    body: 'Hero imagery, emblems, and drop-page visuals live on each drop.',
  },
  {
    title: 'Products',
    href: '/admin/products',
    body: 'Colorway galleries and primary images are edited per SKU in the catalog.',
  },
  {
    title: 'Website layout',
    href: '/admin/website-layout',
    body: 'Header logo stack, footer marks, and layout imagery are global.',
  },
  {
    title: 'SEO',
    href: '/admin/seo',
    body: 'Open Graph and Twitter image URLs are part of SEO documents.',
  },
] as const

function AdminMediaRoute() {
  return (
    <ProtectedAdminRoute>
      <AdminLayout
        title="Media"
        description="There is no standalone asset library yet — imagery is authored where it is used."
      >
        <AdminSectionHeader
          eyebrow="Guide"
          title="Where images live in the CMS"
          description="Use these editors to attach URLs or uploads. A centralized media library can replace this flow later without changing public routes."
        />

        <div className="grid gap-6 md:grid-cols-2">
          {destinations.map((d) => (
            <AdminCard key={d.href} title={d.title} description={d.body}>
              <Link
                to={d.href}
                className="inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline transition hover:-translate-y-0.5"
              >
                Open {d.title.toLowerCase()}
              </Link>
            </AdminCard>
          ))}
        </div>
      </AdminLayout>
    </ProtectedAdminRoute>
  )
}
