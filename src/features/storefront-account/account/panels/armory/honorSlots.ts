import type { ArmoryCatalogEntry } from '@/features/passport/lib/armory'
import type { OwnedPassport } from '@/features/passport/schemas/passport.schema'

/**
 * Hall of Honor shaping — the owner's three best pieces, pinned to slots 1-3.
 * Pure so it can be unit-tested and reused by the public armory (Phase G4).
 */

export interface HonorSlot {
  slot: 1 | 2 | 3
  passport: OwnedPassport | null
  image?: string
}

/**
 * The three shrine slots in order. A slot the owner hasn't pinned is returned
 * empty (a pedestal to fill), so the shrine always reads as three.
 */
export function buildHonorSlots(
  owned: readonly OwnedPassport[],
  catalog: readonly ArmoryCatalogEntry[],
): HonorSlot[] {
  const imageBySlug = new Map(catalog.map((p) => [p.slug, p.image]))
  const bySlot = new Map<number, OwnedPassport>()
  for (const passport of owned) {
    if (passport.featuredSlot && !bySlot.has(passport.featuredSlot)) {
      bySlot.set(passport.featuredSlot, passport)
    }
  }
  return ([1, 2, 3] as const).map((slot) => {
    const passport = bySlot.get(slot) ?? null
    return {
      slot,
      passport,
      image: passport ? imageBySlug.get(passport.productSlug) : undefined,
    }
  })
}

/** The next free slot (1-3), or null when the shrine is full. */
export function nextFreeHonorSlot(owned: readonly OwnedPassport[]): 1 | 2 | 3 | null {
  const taken = new Set(owned.map((p) => p.featuredSlot).filter(Boolean))
  return ([1, 2, 3] as const).find((s) => !taken.has(s)) ?? null
}

/** True once all three slots are filled (by pieces other than the given one). */
export function isHonorFull(owned: readonly OwnedPassport[]): boolean {
  return nextFreeHonorSlot(owned) === null
}
