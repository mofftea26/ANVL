import { useCallback, useMemo } from 'react'
import type { CmsMediaAsset } from '@/features/admin/media/mediaAssets.types'
import { AdminWizard, type AdminWizardStep } from '@/features/admin/components/wizard/AdminWizard'
import type { PassportProductContent } from '@/features/cms/passportContent/passportContent.zod'
import {
  CareStep,
  DetailsStep,
  FitStep,
  ForgeNotesStep,
  HotspotsStep,
  IdentityStep,
  MaterialStep,
  OriginStep,
  PieceStep,
  SpecsStep,
  type PassportStepProps,
} from './passportWizardSteps'

type StepComponent = (props: PassportStepProps) => React.ReactNode

const STEP_DEFS: Array<{ key: string; title: string; blurb: string; body: StepComponent }> = [
  {
    key: 'identity',
    title: 'Identity',
    blurb: 'The plate — tagline under the product name and the authenticity note.',
    body: IdentityStep,
  },
  {
    key: 'piece',
    title: 'The piece',
    blurb:
      'Hero render (transparent PNG — feeds the ember particle silhouette) and the gallery.',
    body: PieceStep,
  },
  {
    key: 'material',
    title: 'Material',
    blurb: 'Fabric story + macro shot. Blank falls back to PDP content / product data.',
    body: MaterialStep,
  },
  {
    key: 'specs',
    title: 'Specifications',
    blurb: 'The technical panel — construction, fit type, compression, stretch, breathability, use.',
    body: SpecsStep,
  },
  {
    key: 'care',
    title: 'Care ritual',
    blurb: 'Care symbols, numbered steps, and the "why" note behind each step.',
    body: CareStep,
  },
  {
    key: 'fit',
    title: 'Fit & sizing',
    blurb:
      'Measurements, model fit, and the canonical size map that powers cross-product size advice.',
    body: FitStep,
  },
  {
    key: 'hotspots',
    title: 'Design details',
    blurb: 'Click the render to pin markers customers can tap to explore the garment.',
    body: HotspotsStep,
  },
  {
    key: 'forgeNotes',
    title: 'Forge notes',
    blurb: 'Development fact cards — revisions, testing, hidden details.',
    body: ForgeNotesStep,
  },
  {
    key: 'details',
    title: 'Details & story',
    blurb: 'Design facts, the story, and one forge fact.',
    body: DetailsStep,
  },
  { key: 'origin', title: 'Origin', blurb: 'Where and how this piece was forged.', body: OriginStep },
]

/**
 * Multi-step passport content wizard — one step per passport section (the
 * same sections the storefront console/dossier render), each with its own
 * copy and assets. Built on the generic {@link AdminWizard}: edits a local
 * draft; nothing persists until "Save".
 */
export function PassportContentWizard({
  open,
  onClose,
  productName,
  initial,
  mediaAssets,
  saving,
  onSave,
}: {
  open: boolean
  onClose: () => void
  productName: string
  initial: PassportProductContent
  mediaAssets: CmsMediaAsset[]
  saving: boolean
  onSave: (content: PassportProductContent) => void
}) {
  const makePatch = useCallback(
    (setDraft: React.Dispatch<React.SetStateAction<PassportProductContent>>) =>
      <K extends keyof PassportProductContent>(
        key: K,
        value: Partial<PassportProductContent[K]>,
      ) =>
        setDraft((prev) => ({ ...prev, [key]: { ...prev[key], ...value } })),
    [],
  )

  const steps = useMemo<Array<AdminWizardStep<PassportProductContent>>>(
    () =>
      STEP_DEFS.map((def) => ({
        key: def.key,
        title: def.title,
        blurb: def.blurb,
        render: (draft, setDraft) => (
          <def.body
            draft={draft}
            setDraft={setDraft}
            patch={makePatch(setDraft)}
            mediaAssets={mediaAssets}
          />
        ),
      })),
    [makePatch, mediaAssets],
  )

  return (
    <AdminWizard
      open={open}
      onClose={onClose}
      title={`Passport content — ${productName}`}
      steps={steps}
      initial={initial}
      saving={saving}
      saveLabel="Save passport"
      onSave={onSave}
    />
  )
}
