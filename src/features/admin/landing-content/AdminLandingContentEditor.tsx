import { Check, Info, ListOrdered, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { fetchLandingPagePickerOptions } from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
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
  readLandingContentFromStorage,
  saveLandingContentSliceAsync,
  subscribeLandingContentChange,
} from '@/features/cms/landingContent/landingContent.settings'
import { DEFAULT_LANDING_PAGE_KEY } from '@/features/landingPages/registry'
import {
  toOathContentSlice,
  toOathFormValues,
  type OathContentFormValues,
} from './landingContentForm'
import { OathHeroFields } from './sections/OathHeroFields'
import { OathManifestoFields } from './sections/OathManifestoFields'
import { OathTenetsFields } from './sections/OathTenetsFields'
import { OathProductsFields } from './sections/OathProductsFields'
import { OathFinaleFields } from './sections/OathFinaleFields'
import { OathLandingAssetFields } from './sections/OathLandingAssetFields'

const OATH_KEY = 'the-oath'

function useAssetConfig(): AssetConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readAssetConfigFromStorage(),
    () => DEFAULT_ASSET_CONFIG,
  )
}

/**
 * Landing Content editor — per-scene copy + tenet media + landing asset slots.
 *
 * Pick any registered landing page to edit (not only the active storefront page).
 * Tenet images are assigned here; all other landing slots sync bidirectionally
 * with the Assets admin page via `asset_config.drops`.
 */
export function AdminLandingContentEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [saving, setSaving] = useState(false)
  const [selectedKey, setSelectedKey] = useState(OATH_KEY)
  const [landingPages, setLandingPages] = useState<
    Awaited<ReturnType<typeof fetchLandingPagePickerOptions>>
  >([])

  const storedAssets = useAssetConfig()
  const [assetConfig, setAssetConfig] = useState<AssetConfig>(storedAssets)

  useEffect(() => {
    void fetchLandingPagePickerOptions()
      .then(setLandingPages)
      .catch(() => setLandingPages([]))
  }, [])

  useEffect(() => {
    setAssetConfig(storedAssets)
  }, [storedAssets])

  const form = useForm<OathContentFormValues>({
    defaultValues: toOathFormValues(readLandingContentFromStorage()[selectedKey]),
  })
  const { register, control, handleSubmit, reset, setValue } = form
  const taglineArray = useFieldArray({ control, name: 'products.taglines' })

  const reloadFormForKey = useCallback(
    (pageKey: string) => {
      reset(toOathFormValues(readLandingContentFromStorage()[pageKey]))
    },
    [reset],
  )

  useEffect(() => {
    const unsub = subscribeLandingContentChange(() => {
      reloadFormForKey(selectedKey)
    })
    return unsub
  }, [reloadFormForKey, selectedKey])

  useEffect(() => {
    reloadFormForKey(selectedKey)
  }, [selectedKey, reloadFormForKey])

  const pageOptions = useMemo(
    () =>
      landingPages.map((page) => ({
        value: page.key,
        label: page.name,
        description: page.description,
      })),
    [landingPages],
  )

  const dropAssignments = assetConfig.drops[selectedKey] ?? {}

  const setDropSlot = useCallback((slotKey: string, mediaId: string) => {
    setAssetConfig((prev) => ({
      ...prev,
      drops: {
        ...prev.drops,
        [selectedKey]: { ...(prev.drops[selectedKey] ?? {}), [slotKey]: mediaId },
      },
    }))
  }, [selectedKey])

  const save = useCallback(
    (values: OathContentFormValues) => {
      void (async () => {
        setSaving(true)
        try {
          if (selectedKey === OATH_KEY) {
            const slice = toOathContentSlice(
              values,
              readLandingContentFromStorage()[OATH_KEY],
            )
            await saveLandingContentSliceAsync(OATH_KEY, slice)
          }
          await saveAssetConfigAsync(assetConfig)
          toast.success('Landing content saved.')
          flashSuccess()
        } catch (e) {
          toast.error(
            e instanceof Error ? e.message : 'Could not save landing content.',
          )
        } finally {
          setSaving(false)
        }
      })()
    },
    [assetConfig, flashSuccess, selectedKey],
  )

  const submit = useMemo(() => handleSubmit(save), [handleSubmit, save])

  const toolbar = useMemo(
    () => (
      <AdminTopbarChipButton
        type="button"
        disabled={saving}
        icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
        variant="primary"
        loading={saving}
        onClick={() => void submit()}
      >
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save content'}
      </AdminTopbarChipButton>
    ),
    [submit, saving, showSuccess],
  )

  useEffect(() => {
    setPageActions(toolbar)
    return () => setPageActions(null)
  }, [toolbar, setPageActions])

  const selectedPage = landingPages.find((p) => p.key === selectedKey)
  const hasOathEditor = selectedKey === OATH_KEY

  const helpRail = (
    <>
      <AdminRailPanel
        title="How overrides work"
        icon={<Info size={15} />}
        description="Every field is optional — the storefront stays designed by default."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>Pick any landing page above — not only the active storefront page.</li>
          <li>Placeholders show the designed default copy.</li>
          <li>Type to override a scene; clear a field to restore the default.</li>
          <li>Tenet images are assigned per vow here; other media also lives in Assets.</li>
        </ul>
      </AdminRailPanel>
      {hasOathEditor ? (
        <AdminRailPanel title="Scenes" icon={<ListOrdered size={15} />}>
          <ol className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
            <li>1 — Hero</li>
            <li>2 — Manifesto</li>
            <li>3 — Tenets</li>
            <li>4 — Products</li>
            <li>5 — Finale</li>
          </ol>
        </AdminRailPanel>
      ) : null}
      <AdminWorkspaceStatusPanel />
    </>
  )

  return (
    <AdminWorkspace asideLabel="Landing content help" aside={helpRail}>
      <div className="space-y-8" data-testid="admin-landing-content-editor">
        <div className="max-w-2xl space-y-4">
          <AdminFieldSelect
            label="Landing page"
            value={selectedKey}
            onChange={setSelectedKey}
            options={
              pageOptions.length > 0
                ? pageOptions
                : [{ value: DEFAULT_LANDING_PAGE_KEY, label: 'Drop 01 — The Oath' }]
            }
            hint="Edit copy and media for any registered page. The storefront still uses whichever page is active on the Dashboard."
          />
          <p className="text-sm text-[var(--color-text-muted)]">
            {hasOathEditor ? (
              <>
                Override scene copy, flexible tenets, and media for{' '}
                <span className="text-[var(--color-heading)]">
                  {selectedPage?.name ?? 'Drop 01 — The Oath'}
                </span>
                . Blank fields fall back to designed defaults (shown as placeholders).
              </>
            ) : (
              <>
                A content editor for{' '}
                <span className="text-[var(--color-heading)]">
                  {selectedPage?.name ?? selectedKey}
                </span>{' '}
                is not registered yet. Asset slots below still sync with the Assets page.
              </>
            )}
          </p>
        </div>

        {hasOathEditor ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
            className="space-y-6"
          >
            <OathLandingAssetFields
              assignments={dropAssignments}
              onAssignmentChange={setDropSlot}
            />
            <OathHeroFields register={register} />
            <OathManifestoFields register={register} />
            <OathTenetsFields register={register} control={control} setValue={setValue} />
            <OathProductsFields register={register} taglines={taglineArray} />
            <OathFinaleFields register={register} />
          </form>
        ) : (
          <div className="space-y-6">
            <OathLandingAssetFields
              assignments={dropAssignments}
              onAssignmentChange={setDropSlot}
            />
            <p className="text-sm text-[var(--color-text-muted)]">
              Register a content schema and editor for this page in code to unlock
              per-scene copy fields.
            </p>
            <AdminTopbarChipButton
              type="button"
              disabled={saving}
              icon={showSuccess ? <Check size={14} /> : <Save size={14} />}
              variant="primary"
              loading={saving}
              onClick={() => void saveAssetConfigAsync(assetConfig).then(flashSuccess)}
            >
              Save asset assignments
            </AdminTopbarChipButton>
          </div>
        )}
      </div>
    </AdminWorkspace>
  )
}
