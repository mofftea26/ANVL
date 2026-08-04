import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import { FormField } from '@/shared/components/ui/FormField'
import { Input } from '@/shared/components/ui/Input'
import { SectionMarkersField } from './SectionMarkersField'
import { useHeroRenderUrl } from './useHeroRenderUrl'
import type { PassportStepProps } from './passportWizardSteps'

/**
 * The free-text spec fields only. `specs.points` is a list of placed markers
 * authored on the render, not a text input — excluding it here keeps this a
 * map over strings rather than widening every value to `string | Marker[]`.
 */
type SpecTextKey = {
  [K in keyof PassportProductContent['specs']]: PassportProductContent['specs'][K] extends string
    ? K
    : never
}[keyof PassportProductContent['specs']]

const SPEC_FIELDS: Array<{
  key: SpecTextKey
  label: string
  hint?: string
}> = [
  { key: 'construction', label: 'Construction' },
  { key: 'fitType', label: 'Fit type', hint: "Blank → the product's fit." },
  { key: 'compression', label: 'Compression' },
  { key: 'stretch', label: 'Stretch' },
  { key: 'breathability', label: 'Breathability' },
  { key: 'intendedUse', label: 'Intended use' },
]

/**
 * Specifications — the card's six text fields, then the analysis chips the
 * Specifications effect draws over the piece.
 *
 * The chips live here, not in some shared markers tab, because they are this
 * section's own data: `specs.points`, read only when Specifications is the
 * active section on the storefront.
 */
export function SpecsStep({ draft, patch, mediaAssets, onGoToTab }: PassportStepProps) {
  const heroRenderUrl = useHeroRenderUrl(draft, mediaAssets)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {SPEC_FIELDS.map((field) => (
          <FormField key={field.key} label={field.label} hint={field.hint} labelStyle="stacked">
            <Input
              density="compact"
              value={draft.specs[field.key]}
              onChange={(e) => patch('specs', { [field.key]: e.target.value })}
            />
          </FormField>
        ))}
      </div>

      <SectionMarkersField
        label="Analysis chips on the render"
        hint="Click the render where a spec applies, then name it. The Specifications effect draws these as instrument chips over the piece."
        imageUrl={heroRenderUrl}
        markers={draft.specs.points}
        onChange={(points) => patch('specs', { points })}
        onGoToPiece={onGoToTab ? () => onGoToTab('piece') : undefined}
        rowLabel="Chip"
        addLabel="Add chip"
        labelPlaceholder="Label (e.g. Weight)"
        valuePlaceholder="Value (e.g. 260 GSM)"
        emptyBody="Analysis chips are the readouts the Specifications effect pins to the garment."
      />
    </div>
  )
}
