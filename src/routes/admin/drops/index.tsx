import { Link, createFileRoute } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminSectionHeader } from '@/features/admin/components/AdminSectionHeader'
import { ProtectedAdminRoute } from '@/features/admin/auth/ProtectedAdminRoute'
import { useDropsList } from '@/features/admin/drops/useDrops'
import { setActiveDrop } from '@/features/admin/drops/drops.service'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'

export const Route = createFileRoute('/admin/drops/')({
  component: DropsIndexPage,
})

function DropsIndexPage() {
  return (
    <ProtectedAdminRoute>
      <DropsIndex />
    </ProtectedAdminRoute>
  )
}

function DropsIndex() {
  const drops = useDropsList()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const productCountForDrop = (id: string) =>
    drops.find((d) => d.id === id)?.productIds.length ?? 0

  return (
    <AdminLayout title="Drops" description="Only one drop can be active at a time on the public site.">
      <AdminSectionHeader
        eyebrow="Drops"
        title="Landing chapters"
        description="Activate a drop to remap hero content, palettes, emblem placements, and Act IV inventory."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/drops/new"
              className="focus-ring inline-flex h-10 items-center rounded-md border border-[var(--color-accent)] bg-[var(--color-accent)] px-4 text-xs font-semibold text-[var(--color-bg)] no-underline"
            >
              New drop
            </Link>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text)] no-underline"
            >
              View site
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        }
      />

      <div className="grid gap-5">
        {drops.map((drop) => (
          <AdminCard
            key={drop.id}
            title={`${drop.dropNumber} · ${drop.name}`}
            description={`Slug /drop/${drop.slug} · ${productCountForDrop(drop.id)} linked products`}
          >
            <div className="flex flex-wrap gap-3">
              <span
                className={
                  drop.isActive
                    ? 'rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-100'
                    : 'rounded-full border border-[var(--color-line)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]'
                }
              >
                {drop.isActive ? 'Active' : drop.status}
              </span>
              <div className="ml-auto flex flex-wrap gap-2">
                <Link
                  to="/admin/drops/$dropId"
                  params={{ dropId: drop.id }}
                  className="inline-flex h-9 items-center rounded-md border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
                >
                  Edit
                </Link>
                <a
                  href={`/drop/${drop.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center rounded-md border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-heading)] no-underline hover:bg-[var(--color-surface-elevated)]"
                >
                  Preview
                </a>
                {!drop.isActive ? (
                  <Button type="button" size="sm" onClick={() => setConfirmId(drop.id)}>
                    Set active
                  </Button>
                ) : null}
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <Modal open={Boolean(confirmId)} onClose={() => setConfirmId(null)}>
        <div className="space-y-4">
          <h3 className="anvl-heading text-xl font-normal">Make this drop active?</h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Make this drop active? This will deactivate the currently active drop and update the public landing page.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setConfirmId(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (confirmId) {
                  setActiveDrop(confirmId)
                  toast.success('Active drop updated.')
                }
                setConfirmId(null)
              }}
            >
              Activate
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  )
}
