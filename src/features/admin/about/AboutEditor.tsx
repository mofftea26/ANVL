import { Check, Info, ListOrdered, Save } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { AdminRailPanel } from '@/features/admin/components/AdminRailPanel'
import { AdminWorkspace } from '@/features/admin/components/AdminWorkspace'
import { AdminWorkspaceStatusPanel } from '@/features/admin/components/AdminWorkspaceStatusPanel'
import { useAdminPageActions } from '@/features/admin/components/AdminPageActionsContext'
import { useRegisterAdminDirty } from '@/features/admin/hooks/useRegisterAdminDirty'
import { useSaveSuccessFlash } from '@/features/admin/hooks/useSaveSuccessFlash'
import {
  readLandingContentFromStorage,
  saveLandingContentSliceAsync,
  subscribeLandingContentChange,
} from '@/features/cms/landingContent/landingContent.settings'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { Button } from '@/shared/components/ui/Button'
import { toAboutContentSlice, toAboutFormValues, type AboutContentFormValues } from './aboutContentForm'
import { AboutHeroFields } from './sections/AboutHeroFields'
import { AboutOrbsFields } from './sections/AboutOrbsFields'
import { AboutMarqueeFields } from './sections/AboutMarqueeFields'

const ABOUT_KEY = 'about'

/**
 * About content editor — the hero (mobile page), the **orbs** (each orb is a
 * section: it orbits the desktop Forge Altar and is struck open into a modal;
 * on mobile it renders as a stacked section — add/edit/remove freely), and the
 * marquee band. Every field is optional; blank falls back to the designed
 * default (shown as an input placeholder). Orb section images can be picked
 * per orb here; the anvil/hammer GLBs and page imagery are assigned on the
 * Assets page (`/admin/assets` → Page — About).
 */
export function AboutEditor() {
  const setPageActions = useAdminPageActions()
  const { showSuccess, flashSuccess } = useSaveSuccessFlash()
  const [saving, setSaving] = useState(false)

  const form = useForm<AboutContentFormValues>({
    defaultValues: toAboutFormValues(readLandingContentFromStorage()[ABOUT_KEY]),
  })
  useRegisterAdminDirty('about', form.formState.isDirty)

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
      <Button
        type="button"
        disabled={saving}
        variant="primary"
        size="md"
        density="compact"
        loading={saving}
        onClick={() => void submit()}
      >
        {showSuccess ? <Check size={ICON_SIZE.sm} /> : <Save size={ICON_SIZE.sm} />}
        {saving ? 'Saving…' : showSuccess ? 'Saved' : 'Save content'}
      </Button>
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
          <li>Type to override; clear a field to restore the default.</li>
          <li>Add, edit, or remove orbs — the page ships with seven designed ones.</li>
          <li>
            The anvil/hammer GLBs and page imagery are assigned on the{' '}
            <span className="text-[var(--color-heading)]">Assets</span> page — scope "Page — About".
          </li>
        </ul>
      </AdminRailPanel>
      <AdminRailPanel title="How orbs render" icon={<ListOrdered size={15} />}>
        <ol className="space-y-1.5 text-xs text-[var(--color-text-muted)]">
          <li>Desktop — each orb orbits the 3D anvil; the hammer strike opens its modal.</li>
          <li>Mobile — each orb is a stacked page section, in this order.</li>
          <li>An orb shows only the fields you fill (lines, body, points, stats, CTAs…).</li>
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
        <AboutOrbsFields register={form.register} control={form.control} setValue={form.setValue} />
        <AboutMarqueeFields register={form.register} />
      </form>
    </AdminWorkspace>
  )
}
