import type { GarmentTypeKey, SizeTableRowKey } from '@/features/cms/support/supportContent.zod'

/**
 * Code-owned geometry for the "Where we measure" schematics.
 *
 * A schematic is DATA, not a component: the renderer walks the resolved
 * measurement points (which the CMS can re-label) and looks each one up in
 * {@link GarmentSchematic.anchors}. That indirection is the whole point —
 * a garment type carrying fewer points (a stringer has no sleeve or cuff,
 * bottoms have no chest or collar) simply has fewer anchors, and a point with
 * no anchor still renders in the accessible list, just without a drawn line.
 *
 * All units are viewBox units. Nothing here knows about colour or theme.
 */

/** A coordinate in schematic (viewBox) space. */
export interface SchematicPoint {
  x: number
  y: number
}

/**
 * One measurement's drawn geometry: the dimension line itself, the thin
 * witness (extension) leaders that tie it back to the garment edge, and where
 * the lettered badge disc sits.
 */
export interface GarmentAnchor {
  /** Dimension-line start. Gets a tick cap. */
  from: SchematicPoint
  /** Dimension-line end. Gets a tick cap. */
  to: SchematicPoint
  /**
   * Witness leaders, drawn at the lightest stroke weight. Each pair runs from
   * a point on the garment out past the dimension line, drafting-style.
   */
  witness?: readonly (readonly [SchematicPoint, SchematicPoint])[]
  /** Badge disc centre. Defaults to the dimension line's midpoint. */
  badge?: SchematicPoint
}

/** The drawing area, as SVG `viewBox` components. */
export interface SchematicViewBox {
  x: number
  y: number
  width: number
  height: number
}

/** One garment type's flat-lay technical drawing. */
export interface GarmentSchematic {
  key: GarmentTypeKey
  /** Fallback caption label. The CMS-resolved label wins when one is passed. */
  label: string
  viewBox: SchematicViewBox
  /** Closed silhouette path, drawn at the heaviest stroke weight. */
  outline: string
  /** Construction lines — seams, ribbing, fold lines. Lighter than the outline. */
  detail: readonly string[]
  /** Keyed by measurement. Partial by design — see the module docblock. */
  anchors: Partial<Record<SizeTableRowKey, GarmentAnchor>>
}
