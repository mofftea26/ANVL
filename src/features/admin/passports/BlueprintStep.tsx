import { Plus } from '@/shared/icons'
import { ICON_SIZE } from '@/shared/lib/iconSize'
import { useSortableList } from '@/features/admin/hooks/useSortableList'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { Button } from '@/shared/components/ui/Button'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { SectionMarkersField } from './SectionMarkersField'
import { useHeroRenderUrl } from './useHeroRenderUrl'
import { SortableRow } from './passportListFields'
import type { PassportStepProps } from './passportWizardSteps'

type Blueprint = PassportProductContent['blueprint']
type BlueprintFeature = Blueprint['features'][number]

const NEW_FEATURE: BlueprintFeature = { code: '', title: '', body: '' }

/**
 * Blueprint — the techpack's BASIC SPECS page as CMS data: the lettered
 * construction callouts as text, plus the spec plates the Blueprint hologram
 * hangs beside the piece.
 *
 * The callouts carry no coordinates and never will. They used to be pinned to
 * an extracted supplier drawing; that drawing was a crop of the PDF, and a
 * coordinate measured against it was never better than the crop, so it was
 * removed on 2026-07-30 and the callouts became cards.
 *
 * The plates below are a different thing and are NOT that decision reversed:
 * they are placed on the passport's OWN product render — the same image the
 * storefront stages — so a percentage genuinely means a spot on the garment.
 */
export function BlueprintStep({ draft, patch, mediaAssets, onGoToTab }: PassportStepProps) {
  const features = draft.blueprint.features
  const heroRenderUrl = useHeroRenderUrl(draft, mediaAssets)

  const setFeatures = (next: BlueprintFeature[]) => patch('blueprint', { features: next })

  const patchFeature = (index: number, value: Partial<BlueprintFeature>) =>
    setFeatures(features.map((f, i) => (i === index ? { ...f, ...value } : f)))

  const { getHandleProps, getItemProps, moveUp, moveDown } = useSortableList({
    length: features.length,
    onMove: (from, to) => {
      if (from === to) return
      const next = [...features]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item!)
      setFeatures(next)
    },
  })

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Heading" hint="Blank → “Blueprint”." labelStyle="stacked">
          <Input
            density="compact"
            value={draft.blueprint.heading}
            onChange={(e) => patch('blueprint', { heading: e.target.value })}
          />
        </FormField>
        <FormField label="Intro" hint="One line above the callout cards." labelStyle="stacked">
          <Input
            density="compact"
            value={draft.blueprint.intro}
            onChange={(e) => patch('blueprint', { intro: e.target.value })}
          />
        </FormField>
      </div>

      <FormField
        label="Construction callouts"
        hint="One per lettered marker on the techpack. Each renders as a card: code, title, detail."
        labelStyle="stacked"
      >
        <div className="space-y-3">
          {features.map((feature, index) => (
            <SortableRow
              key={index}
              index={index}
              total={features.length}
              label="Callout"
              getHandleProps={getHandleProps}
              getItemProps={getItemProps}
              moveUp={moveUp}
              moveDown={moveDown}
              onRemove={(i) => setFeatures(features.filter((_, j) => j !== i))}
            >
              <div className="grid gap-2 sm:grid-cols-[5rem_1fr]">
                <Input
                  density="compact"
                  aria-label={`Callout ${index + 1} code`}
                  placeholder="a"
                  value={feature.code}
                  onChange={(e) => patchFeature(index, { code: e.target.value })}
                />
                <Input
                  density="compact"
                  aria-label={`Callout ${index + 1} title`}
                  placeholder="Title (e.g. High neck front neckline style)"
                  value={feature.title}
                  onChange={(e) => patchFeature(index, { title: e.target.value })}
                />
              </div>
              <Textarea
                rows={2}
                aria-label={`Callout ${index + 1} detail`}
                placeholder="What this construction detail is, and why it's there."
                value={feature.body}
                onChange={(e) => patchFeature(index, { body: e.target.value })}
              />
            </SortableRow>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            density="compact"
            onClick={() => setFeatures([...features, { ...NEW_FEATURE }])}
          >
            <Plus size={ICON_SIZE.sm} aria-hidden="true" />
            Add callout
          </Button>
        </div>
      </FormField>

      <SectionMarkersField
        label="Spec plates on the render"
        hint="Click the render where a construction fact lands, then name it. The Blueprint hologram hangs these as spec plates beside the piece."
        imageUrl={heroRenderUrl}
        markers={draft.blueprint.points}
        onChange={(points) => patch('blueprint', { points })}
        onGoToPiece={onGoToTab ? () => onGoToTab('piece') : undefined}
        rowLabel="Plate"
        addLabel="Add plate"
        labelPlaceholder="Label (e.g. Flatlock)"
        valuePlaceholder="Value (e.g. 6-thread)"
        emptyBody="Spec plates are the readouts the Blueprint hologram hangs beside the garment."
      />
    </div>
  )
}
