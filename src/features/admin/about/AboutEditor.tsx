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
  subscribeLandingContentChange,
} from '@/features/cms/landingContent/landingContent.settings'
import { toAboutContentSlice, toAboutFormValues, type AboutContentFormValues } from './aboutContentForm'
import { AboutHeroFields } from './sections/AboutHeroFields'
import { AboutPhilosophyFields } from './sections/AboutPhilosophyFields'
import { AboutProcessFields } from './sections/AboutProcessFields'
import { AboutStatsFields } from './sections/AboutStatsFields'
import { AboutFinaleFields } from './sections/AboutFinaleFields'

const ABOUT_KEY = 'about'

/**
 * About content editor — hero, philosophy, the forge process (materials /
 * construction / testing), fun facts, and finale. Every field is optional;
 * blank falls back to the designed default (shown as an input placeholder).
 * Imagery (hero backdrop, monolith GLB, process close-ups, etc.) is assigned
 * on the Assets page (`/admin/assets` → Page — About), same as every other
 * storefront page — this editor is copy-only.
 */
export function AboutEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [saving, setSaving] = useState(false)

  const form = useForm<AboutContentFormValues>({
    defaultValues: toAboutFormValues(readLandingContentFromStorage()[ABOUT_KEY]),
  })
  const statItems = useFieldArray({ control: form.control, name: 'stats.items' })

  const reloadForm = useCallback(() => {
    form.reset(toAboutFormValues(readLandingContentFromStorage()[ABOUT_KEY]))
  }, [form])

  useEffect(() => {
    const unsub = subscribeLandingContentChange(reloadForm)
    return unsub
  }, [reloadForm])

  const persist = useCallback(
    async (values: AboutContentFormValues) => {
      setSaving(true)
      try {
        await saveLandingContentSliceAsync(ABOUT_KEY, toAboutContentSlice(values))
        toast.success('About content saved.')
        flashSuccess()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Could not save About content.')
      } finally {
        setSaving(false)
      }
    },
    [flashSuccess],
  )

  const submit = useMemo(() => form.handleSubmit((values) => void persist(values)), [form, persist])

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
            Imagery (hero, monolith GLB, process close-ups, finale) is assigned on the{' '}
            <span className="text-[var(--color-heading)]">Assets</span> page — scope "Page — About".
          </li>
        </ul>
      </AdminRailPanel>
      <AdminRailPanel title="Scenes" icon={<ListOrdered size={15} />}>
        <ol className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
          <li>1 — Hero (Origin)</li>
          <li>2 — Philosophy</li>
          <li>3 — The Forge: Materials</li>
          <li>4 — The Forge: Construction</li>
          <li>5 — The Forge: Testing + Fun Facts</li>
          <li>6 — Finale</li>
        </ol>
      </AdminRailPanel>
      <AdminWorkspaceStatusPanel />
    </>
  )

  return (
    <AdminWorkspace asideLabel="About page help" aside={helpRail}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
        className="space-y-6"
        data-testid="admin-about-editor"
      >
        <AboutHeroFields register={form.register} />
        <AboutPhilosophyFields register={form.register} />
        <AboutProcessFields register={form.register} />
        <AboutStatsFields register={form.register} items={statItems} />
        <AboutFinaleFields register={form.register} />
      </form>
    </AdminWorkspace>
  )
}
