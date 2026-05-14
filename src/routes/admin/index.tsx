import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'

export const Route = createFileRoute('/admin/')({
  component: AdminDashboardPage,
})

const hubCards = [
  {
    title: 'Drops',
    description:
      'Each drop is a full-screen landing configuration with its own palette, emblem, acts, and catalog slice.',
    href: '/admin/drops',
    action: 'Manage drops',
    status: 'Central',
  },
  {
    title: 'Products',
    description:
      'Global inventory with variants, pricing, availability, and assignments into one or many drops.',
    href: '/admin/products',
    action: 'Open catalog',
    status: 'Catalog',
  },
  {
    title: 'Website layout',
    description:
      'Header navigation, footer groups, newsletter copy, cart visibility, and announcement bar.',
    href: '/admin/website-layout',
    action: 'Edit layout',
    status: 'Global',
  },
  {
    title: 'Theme & brand',
    description:
      'Fallback emblem paths and loader styling before an active drop hydrates.',
    href: '/admin/theme',
    action: 'Brand settings',
    status: 'Fallback',
  },
  {
    title: 'SEO hub',
    description:
      'Homepage SEO flows from the active drop; deep pages inherit commerce defaults.',
    href: '/admin/seo',
    action: 'SEO overview',
    status: 'Discovery',
  },
  {
    title: 'Media',
    description:
      'Shortcuts into drop visuals, product galleries, layout logos, and SEO image fields — no separate asset CDN yet.',
    href: '/admin/media',
    action: 'Open media hub',
    status: 'Guidance',
  },
  {
    title: 'Settings',
    description:
      'Session details and the destructive “reset local CMS” control — kept off this grid until you intentionally open it.',
    href: '/admin/settings',
    action: 'Workspace settings',
    status: 'System',
  },
]

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
      description="A calmer surface for orchestrating cinematic drops without losing the forged ANVL aesthetic."
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
        {hubCards.map((card) => (
          <AdminCard key={card.href} title={card.title} description={card.description}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <span className="rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-[var(--color-text-muted)]">
                {card.status}
              </span>
              <Link
                to={card.href}
                className="inline-flex h-11 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-6 text-sm font-semibold text-[var(--color-bg)] no-underline transition hover:-translate-y-0.5"
              >
                {card.action}
              </Link>
            </div>
          </AdminCard>
        ))}
      </div>
    </AdminLayout>
  )
}
