import { useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { Select } from '@/shared/components/ui/Select'
import { listLandingPages } from '@/features/landingPages/registry'
import {
  readActiveLandingPageFromStorage,
  saveActiveLandingPageKeyAsync,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'

function useStagedActiveKey(): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    () => readActiveLandingPageFromStorage().key,
    () => readActiveLandingPageFromStorage().key,
  )
}

/**
 * The new CMS landing control: pick which code-owned landing page is live.
 * Lists the in-code registry (metadata only), shows the current active page,
 * and requires explicit confirmation before activating.
 */
export function LandingPagePickerCard() {
  const pages = useMemo(() => listLandingPages(), [])
  const activeKey = useStagedActiveKey()
  const [selected, setSelected] = useState(activeKey)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const activePage = pages.find((p) => p.key === activeKey) ?? pages[0]
  const selectedPage = pages.find((p) => p.key === selected) ?? activePage
  const isDirty = selected !== activeKey

  async function activate() {
    setSaving(true)
    try {
      await saveActiveLandingPageKeyAsync(selected)
      toast.success(`Activated “${selectedPage?.name ?? selected}”`)
      setConfirmOpen(false)
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to activate landing page',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminCard
      title="Active landing page"
      description="The live homepage at / renders the selected code-owned landing experience."
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Currently live:{' '}
          <strong className="text-[var(--color-text)]">
            {activePage?.name ?? activeKey}
          </strong>
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="anvl-micro text-[var(--color-text-muted)]">
            Landing page
          </span>
          <Select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            {pages.map((page) => (
              <option key={page.key} value={page.key}>
                {page.name}
                {page.key === activeKey ? ' (live)' : ''}
              </option>
            ))}
          </Select>
        </label>

        {selectedPage ? (
          <div className="flex items-start gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-3">
            <img
              src={selectedPage.previewImage}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] object-contain p-2"
            />
            <div className="min-w-0">
              <p className="anvl-heading text-base font-normal">
                {selectedPage.name}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {selectedPage.description}
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-end">
          <Button
            variant="primary"
            size="sm"
            disabled={!isDirty}
            onClick={() => setConfirmOpen(true)}
          >
            Activate
          </Button>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => (saving ? undefined : setConfirmOpen(false))}
        title="Activate landing page?"
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Set{' '}
          <strong className="text-[var(--color-text)]">
            {selectedPage?.name ?? selected}
          </strong>{' '}
          as the live homepage. Visitors will see it on their next page load.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            onClick={() => void activate()}
          >
            Activate
          </Button>
        </div>
      </Modal>
    </AdminCard>
  )
}
