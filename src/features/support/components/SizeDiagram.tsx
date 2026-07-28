import { cn } from '@/shared/lib/cn'
import type { ResolvedMeasurePoint } from '@/features/cms/support/resolveSupportContent'
import { GarmentSchematicSvg } from './GarmentSchematicSvg'
import { getGarmentSchematic } from './garments'

/**
 * The static schematic — the drawing on its own, with no list and no
 * interaction. Use it where space is tight (the PDP support bento). Where the
 * page has room, use `MeasurementFigure` instead: it pairs the same drawing
 * with the written list that makes it accessible.
 *
 * Because this renders standalone it carries a generated `aria-label` naming
 * every lettered point, so the drawing is never the only source of the
 * information.
 */

export interface SizeDiagramProps {
  /** Which schematic to draw. Unknown keys fall back to the tee. */
  garmentTypeKey: string
  /** Resolved points to letter — from `resolveMeasurePoints(config, key)`. */
  points: readonly ResolvedMeasurePoint[]
  className?: string
}

export function SizeDiagram({ garmentTypeKey, points, className }: SizeDiagramProps) {
  const schematic = getGarmentSchematic(garmentTypeKey)
  return (
    <GarmentSchematicSvg
      schematic={schematic}
      points={points}
      ariaLabel={buildDiagramLabel(schematic.label, points)}
      className={cn('max-w-md', className)}
    />
  )
}

function buildDiagramLabel(
  garmentLabel: string,
  points: readonly ResolvedMeasurePoint[],
): string {
  const listed = points.map((point) => `${point.letter} ${point.label.toLowerCase()}`).join(', ')
  const lead = `Flat measurement diagram of a ${garmentLabel.toLowerCase()}`
  if (!listed) return `${lead}.`
  return `${lead} with lettered dimension lines: ${listed}. Widths are measured with the garment laid flat.`
}
