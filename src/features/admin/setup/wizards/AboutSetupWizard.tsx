import { Plus, Trash2 } from '@/shared/icons'
import { useState } from 'react'

import {
  createBlankOrbFormValues,
  toAboutContentSlice,
  toAboutFormValues,
  type AboutContentFormValues,
} from '@/features/admin/about/aboutContentForm'
import { cn } from '@/shared/lib/cn'
import { MediaLibrarySlotField } from '@/features/admin/media/MediaLibrarySlotField'
import { useMediaAssetsQuery } from '@/features/admin/media/useMediaAssetsQuery'
import {
  ABOUT_DEFAULT_CONTENT,
  ABOUT_ORB_FALLBACK_COLORS,
} from '@/features/about/content/aboutContent.defaults'
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
import { setupPreviewBinding, useSetupBlobStep } from '../useSetupBlobStep'

const ABOUT_KEY = 'about'

const ABOUT_EDITOR_LINK = [
  { label: 'Fine-tune every field in the About editor', to: '/admin/about' },
]

interface StepProps {
  onNavigate: () => void
}

/**
 * Unsaved About edits → live-preview draft: the full landing-content envelope
 * with the `about` slice replaced by the step's working copy, so the docked
 * preview panel renders pre-save edits (adding an orb shows up immediately).
 */
const aboutPreviewBinding = setupPreviewBinding(
  'landingContent',
  (values: AboutContentFormValues) => ({
    ...readLandingContentFromStorage(),
    [ABOUT_KEY]: toAboutContentSlice(values),
  }),
)

/** Unsaved asset-slot edits → live preview (identity — same blob shape). */
const assetPreviewBinding = setupPreviewBinding(
  'assetConfig',
  (value: ReturnType<typeof readAssetConfigFromStorage>) => value,
)

/** Working copy of the full About slice (hero + orbs + marquee preserved). */
function useAboutSliceEditor(messages: { success: string; error: string }) {
  return useSetupBlobStep<AboutContentFormValues>({
    read: () => toAboutFormValues(readLandingContentFromStorage()[ABOUT_KEY]),
    save: (values) =>
      saveLandingContentSliceAsync(ABOUT_KEY, toAboutContentSlice(values)),
    successMessage: messages.success,
    errorFallbackMessage: messages.error,
    preview: aboutPreviewBinding,
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

/** Wizard-side layout preset chips ('' = classic, nothing stored). */
const ORB_LAYOUT_OPTIONS = [
  { value: '', label: 'Classic' },
  { value: 'text', label: 'Text' },
  { value: 'stats', label: 'Stats' },
  { value: 'map', label: 'Map' },
  { value: 'timeline', label: 'Timeline' },
] as const

/**
 * Step 2 — the orbs, edited ONE AT A TIME behind a sideways-scrolling chip
 * row (parity with the full About editor's picker). The step keeps to the
 * essentials — label / title / body / image + the layout preset; the
 * preset-specific list editors (stats, map pins, timeline milestones) live in
 * the full editor. Switching chips never loses edits (one working copy).
 */
function OrbsStep({ onNavigate }: StepProps) {
  const orbCount = useAboutOrbCount()
  const editor = useAboutSliceEditor({
    success: 'About orbs saved.',
    error: 'Could not save the About orbs.',
  })
  const defaults = ABOUT_DEFAULT_CONTENT.orbs
  const mediaQuery = useMediaAssetsQuery()
  const [selected, setSelected] = useState(0)
  const orbsCount = editor.value.orbs.length
  const index = Math.min(selected, Math.max(0, orbsCount - 1))
  const orb = editor.value.orbs[index]
  const d = defaults[index]
  // Added orbs (beyond the designed defaults) get an explicit "New orb"
  // placeholder identity so a fresh card never looks blank/inert.
  const fallbackTitle = d?.title ?? `New orb ${index + 1}`
  const fallbackLabel = d?.label ?? `New orb ${index + 1}`
  const layout = orb?.layout?.trim() ?? ''

  const patchOrb = (patch: Partial<AboutContentFormValues['orbs'][number]>) =>
    editor.patch((prev) => ({
      ...prev,
      orbs: prev.orbs.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    }))

  const chipLabel = (i: number): string => {
    const label =
      editor.value.orbs[i]?.label.trim() || defaults[i]?.label || `New orb ${i + 1}`
    return `Orb ${String(i + 1).padStart(2, '0')} — ${label}`
  }
  const chipColor = (i: number): string =>
    editor.value.orbs[i]?.color.trim() ||
    defaults[i]?.color ||
    ABOUT_ORB_FALLBACK_COLORS[i % ABOUT_ORB_FALLBACK_COLORS.length]!

  return (
    <SetupStepBody
      intro="Orbs are the About page's sections: each orbits the desktop Forge Altar and stacks as a section on mobile. Edit the essentials here — colors, points, stats, map pins, and milestones live in the full editor."
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
      {/* Orb picker — one orb at a time (the full stack made the step long). */}
      <div role="tablist" aria-label="About orbs" className="flex gap-2 overflow-x-auto pb-1.5 [scrollbar-width:thin]">
        {editor.value.orbs.map((_, i) => {
          const active = i === index
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSelected(i)}
              className={cn(
                'focus-ring inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                active
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-heading)]'
                  : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
              )}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: chipColor(i) }}
              />
              {chipLabel(i)}
            </button>
          )
        })}
      </div>

      {orb ? (
        <div className="space-y-3 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)]/30 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              {chipLabel(index)}
            </p>
            {orbsCount > 1 ? (
              <IconButton
                type="button"
                size="sm"
                aria-label={`Remove orb ${index + 1}`}
                onClick={() => {
                  editor.patch((prev) => ({
                    ...prev,
                    orbs: prev.orbs.filter((_, i) => i !== index),
                  }))
                  setSelected(Math.max(0, Math.min(index, orbsCount - 2)))
                }}
              >
                <Trash2 size={ICON_SIZE.sm} aria-hidden="true" />
              </IconButton>
            ) : null}
          </div>

          {/* Layout preset — parity with the full editor's picker. */}
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
              Layout preset
            </p>
            <div role="radiogroup" aria-label={`Orb ${index + 1} layout preset`} className="flex flex-wrap gap-1.5">
              {ORB_LAYOUT_OPTIONS.map((opt) => {
                const active = layout === opt.value
                return (
                  <button
                    key={opt.value || 'classic'}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => patchOrb({ layout: opt.value })}
                    className={cn(
                      'focus-ring rounded-full border px-2.5 py-1 text-[11px] transition-colors',
                      active
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-heading)]'
                        : 'border-[var(--color-line)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)]/40 hover:text-[var(--color-text)]',
                    )}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            {layout === 'stats' || layout === 'map' || layout === 'timeline' ? (
              <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
                This preset's {layout === 'stats' ? 'stats grid' : layout === 'map' ? 'map pins' : 'milestones'} are authored in the full About editor.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Label" labelStyle="micro">
              <Input
                density="compact"
                placeholder={fallbackLabel}
                value={orb.label}
                onChange={(e) => patchOrb({ label: e.target.value })}
              />
            </FormField>
            <FormField label="Title" labelStyle="micro">
              <Input
                density="compact"
                placeholder={fallbackTitle}
                value={orb.title}
                onChange={(e) => patchOrb({ title: e.target.value })}
              />
            </FormField>
          </div>
          {layout === 'text' ? (
            <FormField label="Subhead" labelStyle="micro">
              <Input
                density="compact"
                placeholder="A larger lead sentence."
                value={orb.subhead}
                onChange={(e) => patchOrb({ subhead: e.target.value })}
              />
            </FormField>
          ) : null}
          <FormField label="Body" labelStyle="micro">
            <Textarea
              density="compact"
              rows={2}
              placeholder={d?.body}
              value={orb.body}
              onChange={(e) => patchOrb({ body: e.target.value })}
            />
          </FormField>
          <MediaLibrarySlotField
            label="Section image"
            hint="Shown as the orb modal's hero band and the mobile section image."
            kind="image"
            mediaId={orb.mediaId}
            onMediaIdChange={(mediaId) => patchOrb({ mediaId })}
            assets={mediaQuery.data ?? []}
            previewTarget={{ kind: 'content-field', id: `about:orb-${index + 1}` }}
          />
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          density="compact"
          disabled={orbsCount >= 10}
          onClick={() => {
            editor.patch((prev) => ({
              ...prev,
              orbs: [...prev.orbs, createBlankOrbFormValues()],
            }))
            setSelected(orbsCount)
          }}
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
    preview: assetPreviewBinding,
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
      intro="The marquee is the counter-scrolling type band — one line of oversized text. Shows on the tablet/mobile About page (the desktop Forge Altar has no marquee). Leave it blank to keep the designed default."
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
          preview: { route: '/about', target: { kind: 'content-field', id: 'about:hero' } },
          render: () => <HeroStep onNavigate={onClose} />,
        },
        {
          key: 'orbs',
          title: 'Orbs',
          blurb: 'The page’s sections — altar orbs on desktop.',
          preview: { route: '/about', target: { kind: 'content-field', id: 'about:orb-1' } },
          render: () => <OrbsStep onNavigate={onClose} />,
        },
        {
          key: 'assets',
          title: 'Assets',
          blurb: 'Anvil/hammer GLBs and page imagery.',
          preview: { route: '/about' },
          render: () => <AssetsStep onNavigate={onClose} />,
        },
        {
          key: 'marquee',
          title: 'Marquee',
          blurb: 'The counter-scrolling type band (tablet/mobile page).',
          preview: { route: '/about', target: { kind: 'content-field', id: 'about:marquee' } },
          render: () => <MarqueeStep onNavigate={onClose} />,
        },
      ]}
    />
  )
}
