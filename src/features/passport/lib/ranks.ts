import type { OwnedPassport } from '../schemas/passport.schema'

/**
 * Armory gamification — ranks, badges, and drop completion are derived
 * client-side from the owner's claimed passports plus the storefront catalog.
 * No server state: tamper-proofing is a future concern (see feature doc).
 */

export interface ArmoryRank {
  key: 'initiate' | 'forged' | 'oathbound' | 'warlord'
  title: string
  description: string
}

export interface ArmoryBadge {
  key: 'first-claim' | 'low-serial' | 'full-drop'
  title: string
  description: string
}

export interface DropCompletion {
  dropName: string
  /** Distinct products of this drop the user has claimed. */
  claimed: number
  /** Distinct products the drop contains in the catalog. */
  total: number
}

/** Catalog shape needed for completion math (subset of `Product`). */
export interface CatalogProductRef {
  slug: string
  dropName: string
}

export const LOW_SERIAL_THRESHOLD = 10

/**
 * Distinct-product completion per drop. Only drops present in the catalog
 * count; claimed passports for products no longer in the catalog are ignored
 * for completion (they still count toward rank thresholds).
 */
export function computeDropCompletion(
  owned: readonly Pick<OwnedPassport, 'productSlug'>[],
  catalog: readonly CatalogProductRef[],
): DropCompletion[] {
  const ownedSlugs = new Set(owned.map((p) => p.productSlug))
  const byDrop = new Map<string, { claimed: Set<string>; total: number }>()
  for (const product of catalog) {
    if (!product.dropName) continue
    const entry = byDrop.get(product.dropName) ?? { claimed: new Set<string>(), total: 0 }
    entry.total += 1
    if (ownedSlugs.has(product.slug)) entry.claimed.add(product.slug)
    byDrop.set(product.dropName, entry)
  }
  return [...byDrop.entries()].map(([dropName, { claimed, total }]) => ({
    dropName,
    claimed: claimed.size,
    total,
  }))
}

export function hasFullDrop(completion: readonly DropCompletion[]): boolean {
  return completion.some((d) => d.total > 0 && d.claimed >= d.total)
}

/** Rank ladder: 0 → Initiate, 1+ → Forged, 3+ → Oathbound, full drop → Warlord. */
export function deriveArmoryRank(
  claimCount: number,
  completion: readonly DropCompletion[],
): ArmoryRank {
  if (hasFullDrop(completion)) {
    return {
      key: 'warlord',
      title: 'Warlord',
      description: 'A full drop stands forged in your armory.',
    }
  }
  if (claimCount >= 3) {
    return {
      key: 'oathbound',
      title: 'Oathbound',
      description: 'Three pieces sworn. The oath holds.',
    }
  }
  if (claimCount >= 1) {
    return {
      key: 'forged',
      title: 'Forged',
      description: 'Your first piece bears your name.',
    }
  }
  return {
    key: 'initiate',
    title: 'Initiate',
    description: 'Scan your first passport to enter the forge.',
  }
}

export function deriveArmoryBadges(
  owned: readonly Pick<OwnedPassport, 'serialNumber'>[],
  completion: readonly DropCompletion[],
): ArmoryBadge[] {
  const badges: ArmoryBadge[] = []
  if (owned.length >= 1) {
    badges.push({
      key: 'first-claim',
      title: 'First Strike',
      description: 'Claimed your first passport.',
    })
  }
  if (owned.some((p) => p.serialNumber <= LOW_SERIAL_THRESHOLD)) {
    badges.push({
      key: 'low-serial',
      title: 'Early Steel',
      description: `Holds a forge number of ${LOW_SERIAL_THRESHOLD} or lower.`,
    })
  }
  if (hasFullDrop(completion)) {
    badges.push({
      key: 'full-drop',
      title: 'Drop Complete',
      description: 'Every piece of a drop, claimed.',
    })
  }
  return badges
}
