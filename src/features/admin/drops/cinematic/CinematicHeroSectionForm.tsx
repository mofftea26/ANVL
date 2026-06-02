import { createCmsId } from '@/features/admin/landing-cms/landingCms.ids'
import { AdminFieldLabel } from '@/features/admin/components/AdminFieldLabel'
import { AdminInput, AdminTextarea } from '@/features/admin/components/AdminInput'
import { AdminCheckbox } from '@/features/admin/components/AdminCheckbox'
import { MediaPickerField } from '@/shared/components/ui/MediaPickerField'
import type { CinematicHeroSection } from '@/features/marketing/cinematic-hero/cinematicHero.types'
import { ButtonEditor } from './ButtonEditor'

type CinematicHeroSectionFormProps = {
  section: CinematicHeroSection
  tab: 'content' | 'media' | 'buttons' | 'layout'
  onChange: (section: CinematicHeroSection) => void
}

export function CinematicHeroSectionForm({
  section,
  tab,
  onChange,
}: CinematicHeroSectionFormProps) {
  const patch = (p: Partial<CinematicHeroSection>) => onChange({ ...section, ...p })

  if (tab === 'content') {
    return (
      <div className="grid gap-3">
        <AdminFieldLabel labelStyle="stacked" className="block">
          Internal name
          <AdminInput
            value={section.title ?? ''}
            onChange={(e) => patch({ title: e.target.value })}
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Eyebrow
          <AdminInput
            value={section.eyebrow ?? ''}
            onChange={(e) => patch({ eyebrow: e.target.value })}
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Heading
          <AdminInput
            value={section.heading ?? ''}
            onChange={(e) => patch({ heading: e.target.value })}
          />
        </AdminFieldLabel>
        <AdminFieldLabel labelStyle="stacked" className="block">
          Body
          <AdminTextarea
            value={section.body ?? ''}
            onChange={(e) => patch({ body: e.target.value })}
            rows={3}
          />
        </AdminFieldLabel>
      </div>
    )
  }

  if (tab === 'media') {
    return (
      <div className="grid gap-3">
        <MediaPickerField
          label="Background image"
          kind="image"
          value={section.background?.imageUrl ?? ''}
          onChange={(v) =>
            patch({ background: { ...section.background, imageUrl: v || undefined } })
          }
          fallback="none"
        />
        <MediaPickerField
          label="Background video"
          kind="video"
          value={section.background?.videoUrl ?? ''}
          onChange={(v) =>
            patch({ background: { ...section.background, videoUrl: v || undefined } })
          }
          fallback="none"
        />
        <MediaPickerField
          label="Foreground image"
          kind="image"
          value={section.foreground?.imageUrl ?? ''}
          onChange={(v) =>
            patch({ foreground: { ...section.foreground, imageUrl: v || undefined } })
          }
          fallback="none"
        />
        <MediaPickerField
          label="Emblem / crest"
          kind="image"
          value={section.emblemSrc ?? ''}
          onChange={(v) => patch({ emblemSrc: v || undefined })}
        />
      </div>
    )
  }

  if (tab === 'buttons') {
    const buttons = section.buttons ?? []
    return (
      <div className="space-y-3">
        {buttons.map((btn, i) => (
          <ButtonEditor
            key={`${btn.label}-${i}`}
            value={btn}
            onChange={(next) => {
              const copy = [...buttons]
              copy[i] = next
              patch({ buttons: copy })
            }}
            onRemove={() => patch({ buttons: buttons.filter((_, j) => j !== i) })}
          />
        ))}
        <button
          type="button"
          className="text-xs underline"
          onClick={() =>
            patch({
              buttons: [
                ...buttons,
                { label: 'Shop drop', href: '/shop', variant: 'primary' },
              ],
            })
          }
        >
          Add button
        </button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <AdminFieldLabel labelStyle="stacked" className="block">
        Text position
        <AdminInput
          value={section.textPosition ?? 'center'}
          onChange={(e) =>
            patch({ textPosition: e.target.value as CinematicHeroSection['textPosition'] })
          }
          placeholder="left | center | right"
        />
      </AdminFieldLabel>
      <AdminFieldLabel labelStyle="stacked" className="block">
        Animation preset
        <AdminInput
          value={section.animationPreset ?? ''}
          onChange={(e) => patch({ animationPreset: e.target.value || undefined })}
          placeholder="fadeUp"
        />
      </AdminFieldLabel>
      <AdminCheckbox
        checked={section.isEnabled}
        onChange={(e) => patch({ isEnabled: e.target.checked })}
        label="Section enabled"
      />
    </div>
  )
}

export function createEmptyCinematicSection(sortOrder: number): CinematicHeroSection {
  return {
    id: createCmsId('csec'),
    title: `Section ${sortOrder + 1}`,
    eyebrow: '',
    heading: '',
    body: '',
    isEnabled: true,
    sortOrder,
    buttons: [],
    textPosition: 'center',
    visualPosition: 'center',
    mobileBehavior: 'stack',
  }
}
