import {
  GARMENT_TYPE_KEYS,
  type GarmentTypeKey,
} from '@/features/cms/support/supportContent.zod'
import type { GarmentAnchor, GarmentSchematic, SchematicPoint } from './types'
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

/** Where an anchor's letter badge sits — explicit position, else the midpoint. */
export function anchorBadgePoint(anchor: GarmentAnchor): SchematicPoint {
  if (anchor.badge) return anchor.badge
  return {
    x: (anchor.from.x + anchor.to.x) / 2,
    y: (anchor.from.y + anchor.to.y) / 2,
  }
}
