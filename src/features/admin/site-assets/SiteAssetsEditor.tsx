import { Check, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import { AdminFormField } from '@/features/admin/components/AdminFormField'
import { Select } from '@/shared/components/ui/Select'
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
  const drops = useMemo(() => listLandingPages(), [])

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

        <AdminFormField label="Scope">
          <Select
            value={scope}
            onChange={(e) => setScope(e.target.value)}
          >
            <option value="general">General (site-wide)</option>
            {drops.map((d) => (
              <option key={d.key} value={d.key}>
                {d.name}
              </option>
            ))}
          </Select>
        </AdminFormField>

        <div className="grid gap-4 sm:grid-cols-2">
          {slots.map((slot) => (
            <AdminFormField key={slot.key} label={slot.label}>
              <Select
                value={assignments[slot.key] ?? ''}
                onChange={(e) => setSlot(slot.key, e.target.value)}
              >
                <option value="">— Not assigned —</option>
                {(mediaQuery.data ?? []).map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.filename}
                  </option>
                ))}
              </Select>
            </AdminFormField>
          ))}
        </div>
      </section>
    </div>
  )
}
