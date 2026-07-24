import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { AdminFieldSelect } from '@/features/admin/components/AdminFieldSelect'
import {
  fetchLandingPagePickerOptions,
  type LandingPagePickerOption,
} from '@/features/admin/landing-picker/fetchLandingPagePickerOptions'
import {
  toOathContentSlice,
  toOathFormValues,
  type OathContentFormValues,
} from '@/features/admin/landing-content/landingContentForm'
import {
  readAssetConfigFromStorage,
  saveAssetConfigAsync,
} from '@/features/cms/config/cmsSiteConfig.settings'
import {
  readLandingContentFromStorage,
  saveLandingContentSliceAsync,
} from '@/features/cms/landingContent/landingContent.settings'
import { saveActiveLandingPageKeyAsync } from '@/features/cms/landingPageActiveKey.settings'
import { getDropAssetSlots } from '@/features/landingPages/assetSlots'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'
import { listLandingPages } from '@/features/landingPages/registry'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { StringListField } from '@/features/admin/components/StringListField'
import { SetupAssetSlotFields } from '../SetupAssetSlotFields'
import { SetupSaveRow, SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import {
  dropSlotTotal,
  useActiveLandingKey,
  useDropSlotAssignedCount,
  useHasLandingContent,
} from '../useSetupStatus'
import { setupPreviewBinding, useSetupBlobStep } from '../useSetupBlobStep'

const OATH_KEY = 'the-oath'

/** Unsaved slot assignments → live preview (identity — same blob shape). */
const dropAssetPreviewBinding = setupPreviewBinding(
  'assetConfig',
  (value: ReturnType<typeof readAssetConfigFromStorage>) => value,
)

/** Unsaved Oath copy → live preview: envelope with the oath slice replaced. */
const oathCopyPreviewBinding = setupPreviewBinding(
  'landingContent',
  (values: OathContentFormValues) => ({
    ...readLandingContentFromStorage(),
    [OATH_KEY]: toOathContentSlice(values, readLandingContentFromStorage()[OATH_KEY]),
  }),
)

interface StepProps {
  onNavigate: () => void
}

/** Step 1 — pick the live landing page (the one CMS switch, inlined). */
function ActivePageStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const [pages, setPages] = useState<LandingPagePickerOption[]>(() => listLandingPages())
  const [stagedKey, setStagedKey] = useState(activeKey)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    void fetchLandingPagePickerOptions()
      .then((options) => {
        if (mounted) setPages(options)
      })
      .catch(() => {
        /* registry fallback already staged */
      })
    return () => {
      mounted = false
    }
  }, [])

  const activeName = pages.find((p) => p.key === activeKey)?.name ?? activeKey

  async function activate() {
    setSaving(true)
    try {
      await saveActiveLandingPageKeyAsync(stagedKey)
      toast.success(`Activated “${pages.find((p) => p.key === stagedKey)?.name ?? stagedKey}”`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to activate drop')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SetupStepBody
      intro="Choose which code-owned landing page is live at /. Everything else in this wizard dresses the page you pick here."
      status={{ state: 'info', label: `Live now: ${activeName}` }}
      onNavigate={onNavigate}
    >
      <AdminFieldSelect
        label="Active landing page"
        value={stagedKey}
        onChange={setStagedKey}
        options={pages.map((page) => ({
          value: page.key,
          label: page.name,
          description: page.key === activeKey ? 'Live on storefront' : page.description,
        }))}
      />
      <Button
        type="button"
        variant="primary"
        size="sm"
        density="compact"
        loading={saving}
        disabled={stagedKey === activeKey}
        onClick={() => void activate()}
      >
        Activate
      </Button>
    </SetupStepBody>
  )
}

/** Step 2 — assign the drop's code-defined asset slots inline. */
function DropMediaStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const assigned = useDropSlotAssignedCount(activeKey)
  const total = dropSlotTotal(activeKey)
  const slots = getDropAssetSlots(activeKey)

  const editor = useSetupBlobStep({
    read: readAssetConfigFromStorage,
    save: saveAssetConfigAsync,
    successMessage: 'Drop media saved.',
    errorFallbackMessage: 'Could not save drop media.',
    preview: dropAssetPreviewBinding,
  })

  const assignments = editor.value.drops[activeKey] ?? {}
  const setSlot = (slotKey: string, mediaId: string) =>
    editor.patch((prev) => ({
      ...prev,
      drops: {
        ...prev.drops,
        [activeKey]: { ...(prev.drops[activeKey] ?? {}), [slotKey]: mediaId },
      },
    }))

  return (
    <SetupStepBody
      intro="Assign library media to the drop's code-defined slots right here — anything left blank falls back to the built-in designed asset. Drag media in or use the picker."
      status={{
        state: assigned > 0 ? 'done' : 'todo',
        label:
          assigned > 0
            ? `${assigned} of ${total} slots assigned`
            : `0 of ${total} slots assigned — running on built-in fallbacks`,
      }}
      links={[
        {
          label: 'Upload & manage the library in Assets',
          to: '/admin/assets',
          search: { page: activeKey },
        },
      ]}
      onNavigate={onNavigate}
    >
      {slots.length === 0 ? (
        <p className="text-sm text-[var(--color-text-muted)]">
          This landing page defines no asset slots.
        </p>
      ) : (
        <>
          <SetupAssetSlotFields
            slots={slots}
            assignments={assignments}
            onSlotChange={setSlot}
          />
          <SetupSaveRow
            onSave={editor.save}
            saving={editor.saving}
            saved={editor.saved}
            dirty={editor.dirty}
            label="Save drop media"
          />
        </>
      )}
    </SetupStepBody>
  )
}

/** Step 3 — the essential landing copy, edited inline (Oath schema). */
function LandingCopyStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const hasContent = useHasLandingContent(activeKey)

  const editor = useSetupBlobStep<OathContentFormValues>({
    read: () => toOathFormValues(readLandingContentFromStorage()[OATH_KEY]),
    save: (values) =>
      saveLandingContentSliceAsync(
        OATH_KEY,
        toOathContentSlice(values, readLandingContentFromStorage()[OATH_KEY]),
      ),
    successMessage: 'Landing copy saved.',
    errorFallbackMessage: 'Could not save landing copy.',
    preview: oathCopyPreviewBinding,
  })

  const supportsInlineCopy = activeKey === OATH_KEY
  const d = OATH_DEFAULT_CONTENT

  return (
    <SetupStepBody
      intro="Write the essential landing copy — hero, creed, and finale. Every blank field falls back to the designed default (shown as the placeholder); the full editor covers the tenets, product taglines, and CTAs."
      status={{
        state: hasContent ? 'done' : 'todo',
        label: hasContent ? 'Copy overrides saved' : 'Running on designed defaults',
      }}
      links={[{ label: 'Fine-tune every scene in Landing Content', to: '/admin/content' }]}
      onNavigate={onNavigate}
    >
      {supportsInlineCopy ? (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Hero headline" labelStyle="stacked">
              <Input
                density="compact"
                placeholder={d.hero.headline}
                value={editor.value.hero.headline}
                onChange={(e) =>
                  editor.patch((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, headline: e.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Hero subline" labelStyle="stacked">
              <Input
                density="compact"
                placeholder={d.hero.subhead}
                value={editor.value.hero.subhead}
                onChange={(e) =>
                  editor.patch((prev) => ({
                    ...prev,
                    hero: { ...prev.hero, subhead: e.target.value },
                  }))
                }
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Creed heading (eyebrow)" labelStyle="stacked">
              <Input
                density="compact"
                placeholder={d.manifesto.eyebrow}
                value={editor.value.manifesto.eyebrow}
                onChange={(e) =>
                  editor.patch((prev) => ({
                    ...prev,
                    manifesto: { ...prev.manifesto, eyebrow: e.target.value },
                  }))
                }
              />
            </FormField>
            <FormField
              label="Creed lines"
              labelStyle="stacked"
              hint="Add, edit, and reorder the manifesto lines (max 6)."
            >
              <StringListField
                items={editor.value.manifesto.lines}
                onChange={(lines) =>
                  editor.patch((prev) => ({
                    ...prev,
                    manifesto: { ...prev.manifesto, lines },
                  }))
                }
                addLabel="Add line"
                itemLabel="line"
                placeholder={d.manifesto.lines[0] ?? 'A manifesto line'}
                maxItems={6}
              />
            </FormField>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Finale heading" labelStyle="stacked">
              <Input
                density="compact"
                placeholder={d.finale.title}
                value={editor.value.finale.title}
                onChange={(e) =>
                  editor.patch((prev) => ({
                    ...prev,
                    finale: { ...prev.finale, title: e.target.value },
                  }))
                }
              />
            </FormField>
            <FormField label="Finale CTA label" labelStyle="stacked">
              <Input
                density="compact"
                placeholder={d.finale.primaryCta.label}
                value={editor.value.finale.primaryCtaLabel}
                onChange={(e) =>
                  editor.patch((prev) => ({
                    ...prev,
                    finale: { ...prev.finale, primaryCtaLabel: e.target.value },
                  }))
                }
              />
            </FormField>
          </div>
          <SetupSaveRow
            onSave={editor.save}
            saving={editor.saving}
            saved={editor.saved}
            dirty={editor.dirty}
            label="Save landing copy"
          />
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">
          The active landing page has no editable content schema — copy is fully
          code-owned for this page.
        </p>
      )}
    </SetupStepBody>
  )
}

/** Step 4 — how publishing works + where to verify. */
function ReviewPublishStep({ onNavigate }: StepProps) {
  const activeKey = useActiveLandingKey()
  const assigned = useDropSlotAssignedCount(activeKey)
  const total = dropSlotTotal(activeKey)
  const hasContent = useHasLandingContent(activeKey)

  return (
    <SetupStepBody
      intro="Saving in any step publishes immediately — the working copy syncs to cms_settings and the anon-readable storefront_publication mirror. Use the topbar Preview to inspect unsaved edits inside the real storefront, then verify live."
      status={{
        state: 'info',
        label: `Media ${assigned}/${total} · copy ${hasContent ? 'overridden' : 'defaults'} — save = publish`,
      }}
      links={[
        { label: 'Tune theme & fonts', to: '/admin/theme' },
        { label: 'View storefront', to: '/' },
      ]}
      onNavigate={onNavigate}
    />
  )
}

/** Drop setup — pick the page, dress it, write it, publish. */
export function DropSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="Drop setup"
      steps={[
        {
          key: 'page',
          title: 'Active page',
          blurb: 'Pick the code-owned landing page the homepage renders.',
          preview: { route: '/' },
          render: () => <ActivePageStep onNavigate={onClose} />,
        },
        {
          key: 'media',
          title: 'Drop media',
          blurb: 'Fill the drop’s code-defined asset slots from the media library.',
          preview: { route: '/' },
          render: () => <DropMediaStep onNavigate={onClose} />,
        },
        {
          key: 'copy',
          title: 'Landing copy',
          blurb: 'The essential per-scene copy, with designed defaults.',
          preview: { route: '/' },
          render: () => <LandingCopyStep onNavigate={onClose} />,
        },
        {
          key: 'publish',
          title: 'Review',
          blurb: 'Preview unsaved edits, then verify the live storefront.',
          preview: { route: '/' },
          render: () => <ReviewPublishStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
