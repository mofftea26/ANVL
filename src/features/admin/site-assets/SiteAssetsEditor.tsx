import { Check, Save } from '@/shared/icons'
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSingletonCmsEditor } from '@/features/admin/hooks/useSingletonCmsEditor'
import { usePushPreviewDraft } from '@/features/admin/preview/usePushPreviewDraft'
import { MediaLibraryPage } from '@/features/admin/media/MediaLibraryPage'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import { collectAssignedMediaIds } from '@/features/cms/media/collectAssignedMediaIds'
import {
  readAssetConfigFromStorage,
  saveAssetConfigAsync,
  subscribeCmsSiteConfigChange,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import {
  DEFAULT_ASSET_CONFIG,
  type AssetConfig,
} from '@/features/cms/config/cmsSiteConfig.zod'
import {
  DROP_ASSET_SLOTS,
  GENERAL_ASSET_SLOTS,
} from '@/features/landingPages/assetSlots'
import {
  getStorefrontPageSlots,
  isStorefrontPageKey,
  listStorefrontPages,
} from '@/features/cms/assets/storefrontPageSlots'
import { fetchLandingPagePickerOptions } from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { listLandingPages } from '@/features/landingPages/registry'
import { Button } from '@/shared/components/ui/Button'
import { AssetSlotAssignmentPanel } from './AssetSlotAssignmentPanel'

function useAssetConfig(): AssetConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readAssetConfigFromStorage(),
    () => DEFAULT_ASSET_CONFIG,
  )
}

interface SiteAssetsEditorProps {
  /** Deep-link: slot scope to open ('general', landing key, or page key). */
  initialScope?: string
  /** Deep-link: slot key to scroll to + highlight in the assignment panel. */
  focusSlotKey?: string
  /** Deep-link: initial media-library search text. */
  initialSearch?: string
}

export function SiteAssetsEditor({
  initialScope,
  focusSlotKey,
  initialSearch,
}: SiteAssetsEditorProps = {}) {
  const setPageActions = useAdminPageActions()
  const stored = useAssetConfig()
  const { config, setConfig, saving, showSuccess, save } = useSingletonCmsEditor({
    id: 'assets',
    stored,
    saveAsync: saveAssetConfigAsync,
    successMessage: 'Asset assignments saved.',
    errorFallbackMessage: 'Could not save assets.',
  })
  const [scope, setScope] = useState<'general' | string>(initialScope ?? 'general')
  usePushPreviewDraft('assetConfig', config)
  const mediaQuery = useMediaAssetsQuery()
  const fallbackDrops = useMemo(() => listLandingPages(), [])
  const [drops, setDrops] = useState(fallbackDrops)
  const storefrontPages = useMemo(() => listStorefrontPages(), [])

  useEffect(() => {
    void fetchLandingPagePickerOptions()
      .then(setDrops)
      .catch(() => {
        setDrops(fallbackDrops)
      })
  }, [fallbackDrops])

  const toolbar = useMemo(
    () => (
      <Button
        type="button"
        disabled={saving}
        variant="primary"
        size="md"
        density="compact"
        loading={saving}
        onClick={save}
      >
        {showSuccess ? <Check size={ICON_SIZE.sm} /> : <Save size={ICON_SIZE.sm} />}
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save assignments'}
      </Button>
    ),
    [save, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const allSlots =
    scope === 'general'
      ? GENERAL_ASSET_SLOTS
      : isStorefrontPageKey(scope)
        ? getStorefrontPageSlots(scope)
        : (DROP_ASSET_SLOTS[scope] ?? [])

  const assignments =
    scope === 'general'
      ? config.general
      : isStorefrontPageKey(scope)
        ? (config.pages?.[scope] ?? {})
        : (config.drops[scope] ?? {})

  function assignmentValue(key: string): string {
    return assignments[key] ?? ''
  }

  function visibleSlot(slot: (typeof allSlots)[number]): boolean {
    if (!slot.visibleWhen) return true
    const current = assignmentValue(slot.visibleWhen.key) || 'video'
    return current === slot.visibleWhen.equals
  }

  const slots = allSlots.filter(visibleSlot)

  const slotSections = useMemo(() => {
    const sections: { title: string | null; slots: typeof slots }[] = []
    for (const slot of slots) {
      const title = slot.section ?? null
      const last = sections[sections.length - 1]
      if (last && last.title === title) {
        last.slots.push(slot)
      } else {
        sections.push({ title, slots: [slot] })
      }
    }
    return sections
  }, [slots])

  const scopeOptions = useMemo(
    () => [
      { value: 'general', label: 'General (site-wide)' },
      ...drops.map((d) => ({ value: d.key, label: `Landing — ${d.name}` })),
      ...storefrontPages.map((p) => ({
        value: p.key,
        label: `Page — ${p.name}`,
      })),
    ],
    [drops, storefrontPages],
  )

  const mediaAssets = useMemo(
    () =>
      (mediaQuery.data ?? []).map((asset) => ({
        id: asset.id,
        filename: asset.filename,
        mime: asset.mime,
      })),
    [mediaQuery.data],
  )

  // Assigned = referenced by ANY media-assigning editor (site-asset slots plus
  // landing/About, PDP, passport, shop, coming-soon content), not only the slot
  // map being edited here. The live `config` working copy is passed so in-panel
  // slot edits reflect at once; the other blobs are read from their persisted
  // stores (they only change on their own routes, so a mount-time read is current).
  const assignedIds = useMemo(() => collectAssignedMediaIds(config), [config])

  function setSlot(slotKey: string, mediaId: string) {
    setConfig((prev) => {
      if (scope === 'general') {
        return {
          ...prev,
          general: { ...prev.general, [slotKey]: mediaId },
        }
      }
      if (isStorefrontPageKey(scope)) {
        return {
          ...prev,
          pages: {
            ...(prev.pages ?? {}),
            [scope]: { ...(prev.pages?.[scope] ?? {}), [slotKey]: mediaId },
          },
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

  const slotAssignmentRail = (
    <AssetSlotAssignmentPanel
      scope={scope}
      onScopeChange={setScope}
      scopeOptions={scopeOptions}
      slotSections={slotSections}
      assignments={assignments}
      assignmentValue={assignmentValue}
      onSlotChange={setSlot}
      mediaAssets={mediaAssets}
      focusSlotKey={focusSlotKey}
    />
  )

  return (
    <AdminWorkspace
      asideLabel="Asset slot assignments"
      aside={slotAssignmentRail}
      asideKind="tools"
    >
      <div data-testid="site-assets-editor">
        <MediaLibraryPage assignedIds={assignedIds} initialSearch={initialSearch} />
      </div>
    </AdminWorkspace>
  )
}
