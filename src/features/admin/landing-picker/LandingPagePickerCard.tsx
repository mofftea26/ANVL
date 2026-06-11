import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminCard } from '@/features/admin/components/AdminCard'
import { Button } from '@/shared/components/ui/Button'
import { Modal } from '@/shared/components/ui/Modal'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { buildMediaIndex } from '@/features/admin/media/mediaAssets.service'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { resolvePublishedAssets } from '@/features/cms/assets/resolvePublishedAssets'
import {
  readAssetConfigFromStorage,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  DEFAULT_ASSET_CONFIG,
  type AssetConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import { listLandingPages } from '@/features/landingPages/registry'
import {
  readActiveLandingPageFromStorage,
  saveActiveLandingPageKeyAsync,
  subscribeActiveLandingPageChange,
} from '@/features/cms/landingPageActiveKey.settings'
import { AdminDropLogoMark } from './AdminDropLogoMark'
import { fetchLandingPagePickerOptions } from './fetchLandingPagePickerOptions'
import type { LandingPagePickerOption } from './fetchLandingPagePickerOptions'

function useStagedActiveKey(): string {
  return useSyncExternalStore(
    subscribeActiveLandingPageChange,
    () => readActiveLandingPageFromStorage().key,
    () => readActiveLandingPageFromStorage().key,
  )
}

function useAssetConfig(): AssetConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readAssetConfigFromStorage(),
    () => DEFAULT_ASSET_CONFIG,
  )
}

export function LandingPagePickerCard() {
  const fallbackPages = useMemo(() => listLandingPages(), [])
  const [pages, setPages] = useState<LandingPagePickerOption[]>(fallbackPages)
  const activeKey = useStagedActiveKey()
  const assetConfig = useAssetConfig()
  const mediaQuery = useMediaAssetsQuery()
  const [pendingKey, setPendingKey] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const dropLogoSrc = useMemo(() => {
    const mediaIndex = buildMediaIndex(mediaQuery.data ?? [])
    const resolved = resolvePublishedAssets(assetConfig, activeKey, mediaIndex)
    return resolved.dropLogo
  }, [assetConfig, activeKey, mediaQuery.data])

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
            <div
              aria-hidden
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] p-2"
            >
              <AdminDropLogoMark src={dropLogoSrc} size={48} />
            </div>
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
