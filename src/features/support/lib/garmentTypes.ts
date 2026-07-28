import {
  GARMENT_TYPE_KEYS,
  type GarmentTypeKey,
  type SizeProductEntry,
} from '@/features/cms/support/supportContent.zod'

/**
 * Which garment-type tabs the size guide shows.
 *
 * A tab earns its place by having at least one authored product behind it, so
 * the strip describes the actual catalogue rather than every silhouette we can
 * draw. The tee is always present: it is the fallback every unassigned product
 * resolves to, so hiding it would leave those products with no schematic.
 *
 * Returned in `GARMENT_TYPE_KEYS` order (tops before bottoms), never empty.
 */
export function resolveGarmentTypeKeys(
  perProduct: Record<string, SizeProductEntry>,
): GarmentTypeKey[] {
  const used = new Set<GarmentTypeKey>(['tee'])
  for (const entry of Object.values(perProduct)) {
    // An absent garmentType means "not yet chosen" — it resolves to the tee,
    // which is already in the set.
    if (entry.garmentType) used.add(entry.garmentType)
  }
  return GARMENT_TYPE_KEYS.filter((key) => used.has(key))
}
