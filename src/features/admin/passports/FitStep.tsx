import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { Textarea } from '@/shared/components/ui'
import { SectionMarkersField } from './SectionMarkersField'
import { useHeroRenderUrl } from './useHeroRenderUrl'
import { LabelValueRowsField, SizeMapRowsField } from './passportListFields'
import type { PassportStepProps } from './passportWizardSteps'

/**
 * Fit & sizing — the measurement table and size map, then the tape bands the
 * Fit effect lays across the piece.
 *
 * The bands are `fit.points`, deliberately independent of the `measurements`
 * table above: that list is the card's data, this one is what the tape says on
 * the garment, and an editor may well want three of eight measurements drawn.
 */
export function FitStep({ draft, patch, mediaAssets, productSlug, onGoToTab }: PassportStepProps) {
  const heroRenderUrl = useHeroRenderUrl(draft, mediaAssets)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Intended fit" labelStyle="stacked">
          <Input
            density="compact"
            value={draft.fit.intendedFit}
            onChange={(e) => patch('fit', { intendedFit: e.target.value })}
          />
        </FormField>
        <FormField label="Stretch range" labelStyle="stacked">
          <Input
            density="compact"
            value={draft.fit.stretchRange}
            onChange={(e) => patch('fit', { stretchRange: e.target.value })}
          />
        </FormField>
        <FormField label="Model height" labelStyle="stacked">
          <Input
            density="compact"
            value={draft.fit.modelHeight}
            onChange={(e) => patch('fit', { modelHeight: e.target.value })}
          />
        </FormField>
        <FormField label="Size worn by the model" labelStyle="stacked">
          <Input
            density="compact"
            value={draft.fit.modelSize}
            onChange={(e) => patch('fit', { modelSize: e.target.value })}
          />
        </FormField>
      </div>

      <FormField
        label="Measurements"
        hint="A label and value per row, e.g. Chest / 52 cm."
        labelStyle="stacked"
      >
        <LabelValueRowsField
          values={draft.fit.measurements}
          onChange={(measurements) => patch('fit', { measurements })}
          label="Measurement"
          addLabel="Add measurement"
          labelPlaceholder="Label (e.g. Chest)"
          valuePlaceholder="Value (e.g. 52 cm)"
        />
      </FormField>

      <FormField label="Sizing advice" labelStyle="stacked">
        <Textarea
          rows={2}
          value={draft.fit.sizeAdvice}
          onChange={(e) => patch('fit', { sizeAdvice: e.target.value })}
        />
      </FormField>

      <SectionMarkersField
        label="Tape bands on the render"
        hint="Click the render where each measurement is taken, then type its value. The Fit effect lays a tape band across the garment at that height."
        imageUrl={heroRenderUrl}
        markers={draft.fit.points}
        onChange={(points) => patch('fit', { points })}
        onGoToPiece={onGoToTab ? () => onGoToTab('piece') : undefined}
        rowLabel="Band"
        addLabel="Add band"
        labelPlaceholder="Label (e.g. Chest)"
        valuePlaceholder="Value (e.g. 52 cm)"
        emptyBody="Tape bands are the measurement readouts the Fit effect lays across the garment."
      />

      <FormField
        label="Size map"
        hint="Powers cross-product size advice: map each of THIS product's sizes to a canonical body size (e.g. an oversized cut's M → S). Products sharing a canonical fit the same body. Leave empty to keep this product out of size advice entirely."
        labelStyle="stacked"
      >
        <SizeMapRowsField
          value={draft.fit.sizeEquivalence}
          onChange={(sizeEquivalence) => patch('fit', { sizeEquivalence })}
          resetKey={productSlug ?? ''}
        />
      </FormField>
    </div>
  )
}
