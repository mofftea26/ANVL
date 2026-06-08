import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { listLandingPages } from '@/features/landingPages/registry'
import {
  readActiveLandingPageFromStorage,
  saveActiveLandingPageKeyAsync,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'
import { fetchLandingPagePickerOptions } from './fetchLandingPagePickerOptions'
import type { LandingPagePickerOption } from './fetchLandingPagePickerOptions'

function useStagedActiveKey(): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    () => readActiveLandingPageFromStorage().key,
    () => readActiveLandingPageFromStorage().key,
  )
}

export function LandingPagePickerCard() {
  const fallbackPages = useMemo(() => listLandingPages(), [])
  const [pages, setPages] = useState<LandingPagePickerOption[]>(fallbackPages)
  const activeKey = useStagedActiveKey()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void fetchLandingPagePickerOptions().then(setPages).catch(() => {
      setPages(fallbackPages)
    })
  }, [fallbackPages])

  const activePage = pages.find((p) => p.key === activeKey) ?? pages[0]
  const pendingPage = pages.find((p) => p.key === pendingKey) ?? activePage

  async function activate(key: string) {
    setSaving(true)
    try {
      await saveActiveLandingPageKeyAsync(key)
      toast.success(`Activated “${pages.find((p) => p.key === key)?.name ?? key}”`)
      setConfirmOpen(false)
      setPendingKey(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate drop')
    } finally {
      setSaving(false)
    }
  }

  function handlePick(nextKey: string) {
    if (nextKey === activeKey) return
    setPendingKey(nextKey)
    setConfirmOpen(true)
  }

  return (
    <AdminCard
      title="Active drop"
      description="The live homepage at / renders the selected code-owned landing experience."
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-text-muted)]">
          Currently live:{' '}
          <strong className="text-[var(--color-text)]">
            {activePage?.name ?? activeKey}
          </strong>
        </p>

        <AdminFieldSelect
          label="Drop"
          value={activeKey}
          onChange={handlePick}
          options={pages.map((page) => ({
            value: page.key,
            label: page.name,
            description: page.key === activeKey ? 'Live on storefront' : page.description,
          }))}
        />

        {activePage ? (
          <div className="flex items-start gap-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-elevated)] p-3">
            <img
              src={activePage.previewImage}
              alt=""
              width={64}
              height={64}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 shrink-0 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] object-contain p-2"
            />
            <div className="min-w-0">
              <p className="anvl-heading text-base font-normal">{activePage.name}</p>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
                {activePage.description}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => (saving ? undefined : setConfirmOpen(false))}
        title="Activate drop?"
      >
        <p className="text-sm leading-relaxed text-[var(--color-text-muted)]">
          Set{' '}
          <strong className="text-[var(--color-text)]">
            {pendingPage?.name ?? pendingKey}
          </strong>{' '}
          as the live homepage. Visitors will see it on their next page load.
        </p>
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={saving}
            onClick={() => {
              setConfirmOpen(false)
              setPendingKey(null)
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            disabled={!pendingKey}
            onClick={() => pendingKey && void activate(pendingKey)}
          >
            Activate
          </Button>
        </div>
      </Modal>
    </AdminCard>
  )
}
