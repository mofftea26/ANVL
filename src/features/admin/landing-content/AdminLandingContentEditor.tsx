import { Check, Info, ListOrdered, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminTopbarChipButton } from '@/features/admin/components/AdminTopbarChipButton'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  readLandingContentFromStorage,
  saveLandingContentSliceAsync,
} from '@/features/cms/landingContent/landingContent.settings'
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

const OATH_KEY = 'the-oath'

/**
 * Landing Content editor — per-scene copy overrides for Drop 01 — The Oath.
 *
 * Every field is optional: the code default shows as the input placeholder and
 * applies whenever the field is blank, so clearing a field restores the
 * designed copy. Saves write the local working copy, then flush to
 * `cms_settings` + `storefront_publication` (`landing_content`).
 */
export function AdminLandingContentEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [saving, setSaving] = useState(false)

  const form = useForm<OathContentFormValues>({
    defaultValues: toOathFormValues(readLandingContentFromStorage()[OATH_KEY]),
  })
  const { register, control, handleSubmit, reset } = form
  const taglineArray = useFieldArray({ control, name: 'products.taglines' })

  // Re-seed the form when remote hydration rewrites the local store.
  useEffect(() => {
    reset(toOathFormValues(readLandingContentFromStorage()[OATH_KEY]))
  }, [reset])

  const save = useCallback(
    (values: OathContentFormValues) => {
      void (async () => {
        setSaving(true)
        try {
          const slice = toOathContentSlice(values)
          await saveLandingContentSliceAsync(OATH_KEY, slice)
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
    [flashSuccess],
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

  const helpRail = (
    <>
      <AdminRailPanel
        title="How overrides work"
        icon={<Info size={15} />}
        description="Every field is optional — the storefront stays designed by default."
      >
        <ul className="space-y-2 text-xs text-[var(--color-text-muted)]">
          <li>Placeholders show the designed default copy.</li>
          <li>Type to override a scene; clear a field to restore the default.</li>
          <li>
            Images and video live in{' '}
            <span className="text-[var(--color-text)]">Assets</span>, not here.
          </li>
        </ul>
      </AdminRailPanel>
      <AdminRailPanel title="Scenes" icon={<ListOrdered size={15} />}>
        <ol className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
          <li>1 — Hero</li>
          <li>2 — Manifesto</li>
          <li>3 — Tenets</li>
          <li>4 — Products</li>
          <li>5 — Finale</li>
        </ol>
      </AdminRailPanel>
      <AdminWorkspaceStatusPanel />
    </>
  )

  return (
    <AdminWorkspace asideLabel="Landing content help" aside={helpRail}>
      <div className="space-y-8" data-testid="admin-landing-content-editor">
      <p className="max-w-2xl text-sm text-[var(--color-text-muted)]">
        Override the landing page copy per scene for{' '}
        <span className="text-[var(--color-heading)]">Drop 01 — The Oath</span>.
        Blank fields fall back to the designed defaults (shown as placeholders) —
        clear a field to restore them. Media is assigned in{' '}
        <span className="text-[var(--color-heading)]">Assets</span>.
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="space-y-6"
      >
        <OathHeroFields register={register} />
        <OathManifestoFields register={register} />
        <OathTenetsFields register={register} />
        <OathProductsFields register={register} taglines={taglineArray} />
        <OathFinaleFields register={register} />
      </form>
      </div>
    </AdminWorkspace>
  )
}
