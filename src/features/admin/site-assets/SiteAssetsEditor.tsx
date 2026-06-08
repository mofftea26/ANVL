import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { MediaLibraryPage } from '@/features/admin/media/MediaLibraryPage'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  readAssetConfigFromStorage,
  saveAssetConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  DEFAULT_ASSET_CONFIG,
  type AssetConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  DROP_ASSET_SLOTS,
  GENERAL_ASSET_SLOTS,
} from '@/features/landingPages/assetSlots'
import { fetchLandingPagePickerOptions } from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { listLandingPages } from '@/features/landingPages/registry'

function useAssetConfig(): AssetConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readAssetConfigFromStorage(),
    () => DEFAULT_ASSET_CONFIG,
  )
}

export function SiteAssetsEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const stored = useAssetConfig()
  const [config, setConfig] = useState<AssetConfig>(stored)
  const [scope, setScope] = useState<'general' | string>('general')
  const [saving, setSaving] = useState(false)
  const mediaQuery = useMediaAssetsQuery()
  const fallbackDrops = useMemo(() => listLandingPages(), [])
  const [drops, setDrops] = useState(fallbackDrops)

  useEffect(() => {
    void fetchLandingPagePickerOptions()
      .then(setDrops)
      .catch(() => {
        setDrops(fallbackDrops)
      })
  }, [fallbackDrops])

  useEffect(() => {
    setConfig(stored)
  }, [stored])

  const save = useCallback(() => {
    void (async () => {
      setSaving(true)
      try {
        await saveAssetConfigAsync(config)
        toast.success('Asset assignments saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save assets.')
      } finally {
        setSaving(false)
      }
    })()
  }, [config, flashSuccess])

  const toolbar = useMemo(
    () => (
      <AdminTopbarChipButton
        type="button"
        disabled={saving}
        icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
        variant="primary"
        loading={saving}
        onClick={save}
      >
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save assignments'}
      </AdminTopbarChipButton>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const slots =
    scope === 'general'
      ? GENERAL_ASSET_SLOTS
      : (DROP_ASSET_SLOTS[scope] ?? [])

  const UNASSIGNED = '__unassigned__'

  const assignments =
    scope === 'general'
      ? config.general
      : (config.drops[scope] ?? {})

  function setSlot(slotKey: string, mediaId: string) {
    setConfig((prev) => {
      if (scope === 'general') {
        return {
          ...prev,
          general: { ...prev.general, [slotKey]: mediaId },
        }
      }
      return {
        ...prev,
        drops: {
          ...prev.drops,
          [scope]: { ...(prev.drops[scope] ?? {}), [slotKey]: mediaId },
        },
      }
    })
  }

  return (
    <div className="space-y-8" data-testid="site-assets-editor">
      <MediaLibraryPage />

      <section className="space-y-4 rounded-2xl border border-[var(--color-line)] p-4">
        <h2 className="anvl-heading text-lg font-normal">Slot assignments</h2>
        <p className="text-sm text-[var(--color-text-muted)]">
          Map uploaded media to code-defined slots. Unassigned slots use built-in fallbacks.
        </p>

        <AdminFieldSelect
          label="Scope"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'general', label: 'General (site-wide)' },
            ...drops.map((d) => ({ value: d.key, label: d.name })),
          ]}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map((slot) => (
            <AdminFieldSelect
              key={slot.key}
              label={slot.label}
              value={assignments[slot.key] ? assignments[slot.key] : UNASSIGNED}
              onChange={(value) =>
                setSlot(slot.key, value === UNASSIGNED ? '' : value)
              }
              options={[
                { value: UNASSIGNED, label: '— Not assigned —' },
                ...(mediaQuery.data ?? []).map((asset) => ({
                  value: asset.id,
                  label: asset.filename,
                })),
              ]}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
