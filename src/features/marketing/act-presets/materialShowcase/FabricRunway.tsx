import { MaterialsMarquee } from '@/features/marketing/components/MaterialsMarquee'
import { previewMaterialsFields } from '@/features/cms/landing/landingActPreviewOverlay'
import type { ActPresetProps } from '../types'

/** Default materials — fabric runway mosaic. */
export function FabricRunwayPreset({ landing, row }: ActPresetProps) {
  const mat = previewMaterialsFields(landing.materials, row)
  return (
    <MaterialsMarquee
      actLabel={mat.actLabel}
      counterSuffix={mat.counterSuffix}
      heading={mat.heading}
      intro={mat.intro}
      materials={mat.materials}
    />
  )
}
