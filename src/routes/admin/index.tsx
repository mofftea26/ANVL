import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { useAdminAuth } from '@/features/admin/auth/useAdminAuth'
import { resetAllLocalCmsKeys } from '@/features/admin/drops/drops.service'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

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
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <AdminLayout
      title="Dashboard"
      description="A calmer surface for orchestrating cinematic drops without losing the forged ANVL aesthetic."
    >
      <AdminSectionHeader
        eyebrow="Signed in"
        title={`Welcome back, ${session?.username ?? 'admin'}`}
        description="Everything persists in this browser via localStorage until a backend arrives."
        actions={
          <>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] no-underline hover:bg-[var(--color-surface-elevated)]"
            >
              View site
              <ExternalLink size={14} aria-hidden="true" />
            </a>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} className="mr-1.5" aria-hidden="true" />
              Reset CMS data
            </Button>
          </>
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

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Reset all local CMS data?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Clears drops, products, layout keys, any leftover legacy landing JSON key, and re-seeds The Oath defaults. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetAllLocalCmsKeys()
                toast.success('Local CMS reset — defaults restored.')
                setConfirmReset(false)
              }}
            >
              Reset everything
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
