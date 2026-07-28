import {
  GARMENT_TYPE_KEYS,
  type GarmentTypeKey,
} from '@/features/cms/support/supportContent.zod'
import type {
  GarmentAnchor,
  GarmentSchematic,
  SchematicPoint,
  SchematicViewBox,
} from './types'
import { computeOutlineViewBox } from './outlineBounds'
import { TEE_SCHEMATIC } from './tee'
import { STRINGER_SCHEMATIC } from './stringer'
import { HOODIE_SCHEMATIC } from './hoodie'
import { JOGGERS_SCHEMATIC } from './joggers'
import { SHORTS_SCHEMATIC } from './shorts'

/**
 * The code-owned schematic registry — one flat-lay drawing per garment type.
 * Adding a type means adding a file and one entry here; nothing in the
 * renderer changes.
 */
export const GARMENT_SCHEMATICS: Record<GarmentTypeKey, GarmentSchematic> = {
  tee: TEE_SCHEMATIC,
  stringer: STRINGER_SCHEMATIC,
  hoodie: HOODIE_SCHEMATIC,
  joggers: JOGGERS_SCHEMATIC,
  shorts: SHORTS_SCHEMATIC,
}

/**
 * Tight bounds around each garment's OUTLINE alone, derived from the path data
 * once at module load. `GARMENT_SCHEMATICS[key].viewBox` frames the whole spec
 * sheet including dimension lines and badges, which is the wrong box for any
 * surface drawing the silhouette on its own — it leaves each garment at a
 * different scale and a different centre.
 */
export const GARMENT_OUTLINE_VIEW_BOXES: Record<GarmentTypeKey, SchematicViewBox> = {
  tee: computeOutlineViewBox(TEE_SCHEMATIC.outline),
  stringer: computeOutlineViewBox(STRINGER_SCHEMATIC.outline),
  hoodie: computeOutlineViewBox(HOODIE_SCHEMATIC.outline),
  joggers: computeOutlineViewBox(JOGGERS_SCHEMATIC.outline),
  shorts: computeOutlineViewBox(SHORTS_SCHEMATIC.outline),
}

/** Narrowing guard for values arriving from the CMS or a URL segment. */
export function isGarmentTypeKey(value: string): value is GarmentTypeKey {
  return (GARMENT_TYPE_KEYS as readonly string[]).includes(value)
}

/**
 * Schematic lookup that never throws — an unknown key falls back to the tee,
 * matching `resolveMeasurePoints`' own fallback so the drawing and the copy
 * can never disagree about which garment is on screen.
 */
export function getGarmentSchematic(key: string): GarmentSchematic {
  return isGarmentTypeKey(key) ? GARMENT_SCHEMATICS[key] : TEE_SCHEMATIC
}

/** Outline-only bounds lookup, with the same tee fallback. */
export function getGarmentOutlineViewBox(key: string): SchematicViewBox {
  return isGarmentTypeKey(key)
    ? GARMENT_OUTLINE_VIEW_BOXES[key]
    : GARMENT_OUTLINE_VIEW_BOXES.tee
}

/** Where an anchor's letter badge sits — explicit position, else the midpoint. */
export function anchorBadgePoint(anchor: GarmentAnchor): SchematicPoint {
  if (anchor.badge) return anchor.badge
  return {
    x: (anchor.from.x + anchor.to.x) / 2,
    y: (anchor.from.y + anchor.to.y) / 2,
  }
}
