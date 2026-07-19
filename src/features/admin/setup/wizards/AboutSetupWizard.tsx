import { Plus, Trash2 } from '@/shared/icons'

import {
  createBlankOrbFormValues,
  toAboutContentSlice,
  toAboutFormValues,
  type AboutContentFormValues,
} from '@/features/admin/about/aboutContentForm'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import {
  readAssetConfigFromStorage,
  saveAssetConfigAsync,
} from '@/features/cms/config/cmsSiteConfig.settings'
import { getStorefrontPageSlots } from '@/features/cms/assets/storefrontPageSlots'
import {
  readLandingContentFromStorage,
  saveLandingContentSliceAsync,
} from '@/features/cms/landingContent/landingContent.settings'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { IconButton } from '@/shared/components/ui/IconButton'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui/Textarea'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { SetupAssetSlotFields } from '../SetupAssetSlotFields'
import { SetupSaveRow, SetupStepBody } from '../SetupStepParts'
import { SetupWizard } from '../SetupWizard'
import {
  aboutSlotTotal,
  useAboutOrbCount,
  useAboutSectionSaved,
  useAboutSlotAssignedCount,
} from '../useSetupStatus'
import { useSetupBlobStep } from '../useSetupBlobStep'

const ABOUT_KEY = 'about'

const ABOUT_EDITOR_LINK = [
  { label: 'Fine-tune every field in the About editor', to: '/admin/about' },
]

interface StepProps {
  onNavigate: () => void
}

/** Working copy of the full About slice (hero + orbs + marquee preserved). */
function useAboutSliceEditor(messages: { success: string; error: string }) {
  return useSetupBlobStep<AboutContentFormValues>({
    read: () => toAboutFormValues(readLandingContentFromStorage()[ABOUT_KEY]),
    save: (values) =>
      saveLandingContentSliceAsync(ABOUT_KEY, toAboutContentSlice(values)),
    successMessage: messages.success,
    errorFallbackMessage: messages.error,
  })
}

/** Step 1 — the mobile-page hero copy, edited inline. */
function HeroStep({ onNavigate }: StepProps) {
  const saved = useAboutSectionSaved('hero')
  const editor = useAboutSliceEditor({
    success: 'About hero saved.',
    error: 'Could not save the About hero.',
  })
  const d = ABOUT_DEFAULT_CONTENT.hero

  return (
    <SetupStepBody
      intro="The hero heads the mobile About page (the desktop Forge Altar carries no headline). Every blank field falls back to the designed default, shown as the placeholder."
      status={{
        state: saved ? 'done' : 'todo',
        label: saved ? 'Custom hero copy saved' : 'Running on designed defaults',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="Eyebrow" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={d.eyebrow}
            value={editor.value.hero.eyebrow}
            onChange={(e) =>
              editor.patch((prev) => ({
                ...prev,
                hero: { ...prev.hero, eyebrow: e.target.value },
              }))
            }
          />
        </FormField>
        <FormField label="Headline" labelStyle="stacked">
          <Input
            density="compact"
            placeholder={d.headline}
            value={editor.value.hero.headline}
            onChange={(e) =>
              editor.patch((prev) => ({
                ...prev,
                hero: { ...prev.hero, headline: e.target.value },
              }))
            }
          />
        </FormField>
      </div>
      <FormField label="Subhead" labelStyle="stacked">
        <Textarea
          density="compact"
          rows={3}
          placeholder={d.subhead}
          value={editor.value.hero.subhead}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              hero: { ...prev.hero, subhead: e.target.value },
            }))
          }
        />
      </FormField>
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save hero"
      />
    </SetupStepBody>
  )
}

/** Step 2 — compact orb list editor (label / title / body, add / remove). */
function OrbsStep({ onNavigate }: StepProps) {
  const orbCount = useAboutOrbCount()
  const editor = useAboutSliceEditor({
    success: 'About orbs saved.',
    error: 'Could not save the About orbs.',
  })
  const defaults = ABOUT_DEFAULT_CONTENT.orbs

  return (
    <SetupStepBody
      intro="Orbs are the About page's sections: each orbits the desktop Forge Altar and stacks as a section on mobile. Edit the essentials here — colors, points, stats, CTAs, and images live in the full editor."
      status={{
        state: orbCount > 0 ? 'done' : 'todo',
        label:
          orbCount > 0
            ? `${orbCount} custom orb${orbCount === 1 ? '' : 's'} saved`
            : 'Running on the seven designed orbs',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <div className="space-y-3">
        {editor.value.orbs.map((orb, index) => {
          const d = defaults[index]
          return (
            <div
              key={index}
              className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                  Orb {index + 1}
                </p>
                <IconButton
                  type="button"
                  size="sm"
                  aria-label={`Remove orb ${index + 1}`}
                  onClick={() =>
                    editor.patch((prev) => ({
                      ...prev,
                      orbs: prev.orbs.filter((_, i) => i !== index),
                    }))
                  }
                >
                  <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
                </IconButton>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <FormField label="Label" labelStyle="micro">
                  <Input
                    density="compact"
                    placeholder={d?.label}
                    value={orb.label}
                    onChange={(e) =>
                      editor.patch((prev) => ({
                        ...prev,
                        orbs: prev.orbs.map((o, i) =>
                          i === index ? { ...o, label: e.target.value } : o,
                        ),
                      }))
                    }
                  />
                </FormField>
                <FormField label="Title" labelStyle="micro">
                  <Input
                    density="compact"
                    placeholder={d?.title}
                    value={orb.title}
                    onChange={(e) =>
                      editor.patch((prev) => ({
                        ...prev,
                        orbs: prev.orbs.map((o, i) =>
                          i === index ? { ...o, title: e.target.value } : o,
                        ),
                      }))
                    }
                  />
                </FormField>
              </div>
              <FormField label="Body" labelStyle="micro">
                <Textarea
                  density="compact"
                  rows={2}
                  placeholder={d?.body}
                  value={orb.body}
                  onChange={(e) =>
                    editor.patch((prev) => ({
                      ...prev,
                      orbs: prev.orbs.map((o, i) =>
                        i === index ? { ...o, body: e.target.value } : o,
                      ),
                    }))
                  }
                />
              </FormField>
            </div>
          )
        })}
      </div>
      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          disabled={editor.value.orbs.length >= 10}
          onClick={() =>
            editor.patch((prev) => ({
              ...prev,
              orbs: [...prev.orbs, createBlankOrbFormValues()],
            }))
          }
        >
          <Plus size={ICON_SIZE.sm} aria-hidden="true" />
          Add orb
        </Button>
        <SetupSaveRow
          onSave={editor.save}
          saving={editor.saving}
          saved={editor.saved}
          dirty={editor.dirty}
          label="Save orbs"
        />
      </div>
    </SetupStepBody>
  )
}

/** Step 3 — the About page's asset slots (GLBs + imagery), edited inline. */
function AssetsStep({ onNavigate }: StepProps) {
  const assigned = useAboutSlotAssignedCount()
  const total = aboutSlotTotal()
  const slots = getStorefrontPageSlots(ABOUT_KEY)

  const editor = useSetupBlobStep({
    read: readAssetConfigFromStorage,
    save: saveAssetConfigAsync,
    successMessage: 'About assets saved.',
    errorFallbackMessage: 'Could not save About assets.',
  })

  const assignments = editor.value.pages?.[ABOUT_KEY] ?? {}
  const setSlot = (slotKey: string, mediaId: string) =>
    editor.patch((prev) => ({
      ...prev,
      pages: {
        ...(prev.pages ?? {}),
        [ABOUT_KEY]: { ...(prev.pages?.[ABOUT_KEY] ?? {}), [slotKey]: mediaId },
      },
    }))

  return (
    <SetupStepBody
      intro="Assign the altar's anvil and hammer GLBs plus the page imagery. Anything left blank falls back to the bundled defaults; orb section images are picked per orb in the About editor instead."
      status={{
        state: assigned > 0 ? 'done' : 'todo',
        label:
          assigned > 0
            ? `${assigned} of ${total} About slots assigned`
            : `0 of ${total} About slots assigned — running on built-in fallbacks`,
      }}
      links={[
        {
          label: 'Upload & manage the library in Assets',
          to: '/admin/assets',
          search: { page: 'about' },
        },
      ]}
      onNavigate={onNavigate}
    >
      <SetupAssetSlotFields slots={slots} assignments={assignments} onSlotChange={setSlot} />
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save About assets"
      />
    </SetupStepBody>
  )
}

/** Step 4 — the marquee band, edited inline. */
function MarqueeStep({ onNavigate }: StepProps) {
  const saved = useAboutSectionSaved('marquee')
  const editor = useAboutSliceEditor({
    success: 'Marquee saved.',
    error: 'Could not save the marquee.',
  })

  return (
    <SetupStepBody
      intro="The marquee is the counter-scrolling type band on the mobile About page — one line of oversized text. Leave it blank to keep the designed default."
      status={{
        state: saved ? 'done' : 'todo',
        label: saved ? 'Custom marquee saved' : 'Running on designed default',
      }}
      links={ABOUT_EDITOR_LINK}
      onNavigate={onNavigate}
    >
      <FormField label="Marquee text" labelStyle="stacked">
        <Input
          density="compact"
          placeholder={ABOUT_DEFAULT_CONTENT.marquee.text}
          value={editor.value.marquee.text}
          onChange={(e) =>
            editor.patch((prev) => ({
              ...prev,
              marquee: { text: e.target.value },
            }))
          }
        />
      </FormField>
      <SetupSaveRow
        onSave={editor.save}
        saving={editor.saving}
        saved={editor.saved}
        dirty={editor.dirty}
        label="Save marquee"
      />
    </SetupStepBody>
  )
}

/** About page — hero, orbs, assets, marquee. All inline. */
export function AboutSetupWizard({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <SetupWizard
      open={open}
      onClose={onClose}
      title="About page setup"
      steps={[
        {
          key: 'hero',
          title: 'Hero',
          blurb: 'Mobile-page headline block.',
          render: () => <HeroStep onNavigate={onClose} />,
        },
        {
          key: 'orbs',
          title: 'Orbs',
          blurb: 'The page’s sections — altar orbs on desktop.',
          render: () => <OrbsStep onNavigate={onClose} />,
        },
        {
          key: 'assets',
          title: 'Assets',
          blurb: 'Anvil/hammer GLBs and page imagery.',
          render: () => <AssetsStep onNavigate={onClose} />,
        },
        {
          key: 'marquee',
          title: 'Marquee',
          blurb: 'The counter-scrolling type band.',
          render: () => <MarqueeStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
