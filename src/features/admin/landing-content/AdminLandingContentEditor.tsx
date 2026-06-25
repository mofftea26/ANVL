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
import {
  toTmContentSlice,
  toTmFormValues,
  type TmContentFormValues,
} from './tmLandingContentForm'
import { OathHeroFields } from './sections/OathHeroFields'
import { OathManifestoFields } from './sections/OathManifestoFields'
import { OathTenetsFields } from './sections/OathTenetsFields'
import { OathProductsFields } from './sections/OathProductsFields'
import { OathFinaleFields } from './sections/OathFinaleFields'
import { OathLandingAssetFields } from './sections/OathLandingAssetFields'
import { TmContentFields } from './sections/TmContentFields'

const OATH_KEY = 'the-oath'
const TM_KEY = 'theoath-modern'

function useAssetConfig(): AssetConfig {
  return useSyncExternalStore(
    subscribeCmsSiteConfigChange,
    () => readAssetConfigFromStorage(),
    () => DEFAULT_ASSET_CONFIG,
  )
}

/**
 * Landing Content editor — per-scene copy + landing asset slots.
 *
 * Page-aware: The Oath gets its scene editor (hero/manifesto/tenets/products/
 * finale + tenet media); Theoath Modern gets its own editor (hero + hotspots,
 * tech-knit, collection, benefits, materials, conversion). Both forms are always
 * mounted (Rules of Hooks) and the body + save switch by the selected page. Any
 * other registered page falls back to asset-slot assignment only.
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

  const oathForm = useForm<OathContentFormValues>({
    defaultValues: toOathFormValues(readLandingContentFromStorage()[OATH_KEY]),
  })
  const tmForm = useForm<TmContentFormValues>({
    defaultValues: toTmFormValues(readLandingContentFromStorage()[TM_KEY]),
  })
  const oathTaglines = useFieldArray({ control: oathForm.control, name: 'products.taglines' })
  const tmTaglines = useFieldArray({ control: tmForm.control, name: 'collection.taglines' })

  const reloadFormForKey = useCallback(
    (pageKey: string) => {
      const stored = readLandingContentFromStorage()
      if (pageKey === OATH_KEY) oathForm.reset(toOathFormValues(stored[OATH_KEY]))
      else if (pageKey === TM_KEY) tmForm.reset(toTmFormValues(stored[TM_KEY]))
    },
    [oathForm, tmForm],
  )

  useEffect(() => {
    const unsub = subscribeLandingContentChange(() => reloadFormForKey(selectedKey))
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

  const persist = useCallback(
    async (slice?: { key: string; value: Record<string, unknown> }) => {
      setSaving(true)
      try {
        if (slice) await saveLandingContentSliceAsync(slice.key, slice.value)
        await saveAssetConfigAsync(assetConfig)
        toast.success('Landing content saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save landing content.')
      } finally {
        setSaving(false)
      }
    },
    [assetConfig, flashSuccess],
  )

  const submit = useMemo(() => {
    if (selectedKey === OATH_KEY) {
      return oathForm.handleSubmit((values) =>
        void persist({
          key: OATH_KEY,
          value: toOathContentSlice(values, readLandingContentFromStorage()[OATH_KEY]),
        }),
      )
    }
    if (selectedKey === TM_KEY) {
      return tmForm.handleSubmit((values) =>
        void persist({ key: TM_KEY, value: toTmContentSlice(values) }),
      )
    }
    return () => void persist()
  }, [selectedKey, oathForm, tmForm, persist])

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
  const isOath = selectedKey === OATH_KEY
  const isTm = selectedKey === TM_KEY
  const hasEditor = isOath || isTm

  const scenes = isOath
    ? ['1 — Hero', '2 — Manifesto', '3 — Tenets', '4 — Products', '5 — Finale']
    : isTm
      ? ['1 — Hero', '2 — Tech Knit', '3 — Collection', '4 — Benefits', '5 — Materials', '6 — Conversion']
      : []

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
          <li>Imagery is assigned on the Assets page (the Theoath Modern drop is listed there).</li>
        </ul>
      </AdminRailPanel>
      {scenes.length > 0 ? (
        <AdminRailPanel title="Scenes" icon={<ListOrdered size={15} />}>
          <ol className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
            {scenes.map((s) => (
              <li key={s}>{s}</li>
            ))}
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
            {hasEditor ? (
              <>
                Override scene copy for{' '}
                <span className="text-[var(--color-heading)]">
                  {selectedPage?.name ?? selectedKey}
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

        {isOath ? (
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
            <OathHeroFields register={oathForm.register} />
            <OathManifestoFields register={oathForm.register} />
            <OathTenetsFields
              register={oathForm.register}
              control={oathForm.control}
              setValue={oathForm.setValue}
            />
            <OathProductsFields register={oathForm.register} taglines={oathTaglines} />
            <OathFinaleFields register={oathForm.register} />
          </form>
        ) : isTm ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
            className="space-y-6"
          >
            <TmContentFields register={tmForm.register} taglines={tmTaglines} />
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
