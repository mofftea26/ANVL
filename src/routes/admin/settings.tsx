import { createFileRoute } from '@tanstack/react-router'
import { RotateCcw } from 'lucide-react'
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

export const Route = createFileRoute('/admin/settings')({
  component: AdminSettingsRoute,
})

function formatSessionAt(iso: string | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

function AdminSettingsRoute() {
  return (
    <ProtectedAdminRoute>
      <SettingsPage />
    </ProtectedAdminRoute>
  )
}

function SettingsPage() {
  const { session } = useAdminAuth()
  const [confirmReset, setConfirmReset] = useState(false)

  return (
    <AdminLayout
      title="Settings"
      description="Workspace session and local-only CMS tools for this browser."
    >
      <div className="space-y-8">
        <AdminCard title="Session">
          <div className="space-y-1 text-sm text-[var(--color-text-muted)]">
            <p>
              <span className="text-[var(--color-text)]">User:</span>{' '}
              {session?.username ?? '—'}
            </p>
            <p>
              <span className="text-[var(--color-text)]">Signed in:</span>{' '}
              {formatSessionAt(session?.loggedInAt)}
            </p>
          </div>
        </AdminCard>

        <AdminCard title="Danger zone" description="Irreversible for this browser’s CMS storage.">
          <div className="space-y-4">
            <AdminSectionHeader
              eyebrow="Local dev"
              title="Reset all local CMS data"
              description="Clears drops, products, layout keys, legacy landing JSON, and re-seeds The Oath defaults."
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setConfirmReset(true)}
            >
              <RotateCcw size={14} className="mr-1.5" aria-hidden="true" />
              Reset CMS data…
            </Button>
          </div>
        </AdminCard>
      </div>

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Reset all local CMS data?"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-muted)]">
            Clears drops, products, layout keys, any leftover legacy landing JSON key, and re-seeds
            The Oath defaults. This cannot be undone.
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
