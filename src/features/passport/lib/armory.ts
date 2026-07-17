import type { OwnedPassport } from '../schemas/passport.schema'

/**
 * Shaping for the Armory's views. Pure functions over the owner's registered
 * passports + the storefront catalog — the views themselves stay presentational.
 */

/** Catalog subset the Armory needs (from `getShopListingCatalog`). */
export interface ArmoryCatalogEntry {
  slug: string
  name: string
  dropName: string
  image?: string
  category?: string
}

/** One slot in the vault wall: a registered piece, or an empty socket. */
export interface VaultSlot {
  slug: string
  name: string
  image?: string
  /** The registered passport, or null when the piece is still missing. */
  passport: OwnedPassport | null
}

export interface VaultDrop {
  dropName: string
  slots: VaultSlot[]
  owned: number
  total: number
}

/** Newest registration first; unregistered/undated fall to the end. */
function byNewestClaim(a: OwnedPassport, b: OwnedPassport): number {
  const at = a.claimedAt ? Date.parse(a.claimedAt) : 0
  const bt = b.claimedAt ? Date.parse(b.claimedAt) : 0
  return bt - at
}

/** First registered passport per product slug (a duplicate unit fills one slot). */
function firstBySlug(owned: readonly OwnedPassport[]): Map<string, OwnedPassport> {
  const map = new Map<string, OwnedPassport>()
  for (const passport of [...owned].sort(byNewestClaim)) {
    if (!map.has(passport.productSlug)) map.set(passport.productSlug, passport)
  }
  return map
}

/**
 * The vault wall — only drops the owner has actually STARTED, each showing
 * every piece of that drop: registered ones lit, the rest as empty sockets.
 * (Never every drop in the catalog: an armory is a record of what you own,
 * not a shop shelf.)
 */
export function buildVaultDrops(
  owned: readonly OwnedPassport[],
  catalog: readonly ArmoryCatalogEntry[],
): VaultDrop[] {
  const bySlug = firstBySlug(owned)
  const startedDrops = new Set(
    catalog.filter((p) => bySlug.has(p.slug) && p.dropName).map((p) => p.dropName),
  )

  const drops: VaultDrop[] = []
  for (const dropName of startedDrops) {
    const slots = catalog
      .filter((p) => p.dropName === dropName)
      .map((p) => ({
        slug: p.slug,
        name: p.name,
        image: p.image,
        passport: bySlug.get(p.slug) ?? null,
      }))
    drops.push({
      dropName,
      slots,
      owned: slots.filter((s) => s.passport).length,
      total: slots.length,
    })
  }
  return drops.sort((a, b) => b.owned - a.owned)
}

export interface CollectionDrop {
  dropName: string
  owned: VaultSlot[]
  missing: VaultSlot[]
  total: number
}

/**
 * The completionist view — EVERY drop in the catalog with what you hold and
 * what's still missing, so progress is honest about the whole collection.
 */
export function buildCollectionDrops(
  owned: readonly OwnedPassport[],
  catalog: readonly ArmoryCatalogEntry[],
): CollectionDrop[] {
  const bySlug = firstBySlug(owned)
  const byDrop = new Map<string, VaultSlot[]>()
  for (const product of catalog) {
    if (!product.dropName) continue
    const slots = byDrop.get(product.dropName) ?? []
    slots.push({
      slug: product.slug,
      name: product.name,
      image: product.image,
      passport: bySlug.get(product.slug) ?? null,
    })
    byDrop.set(product.dropName, slots)
  }

  return [...byDrop.entries()]
    .map(([dropName, slots]) => ({
      dropName,
      owned: slots.filter((s) => s.passport !== null),
      missing: slots.filter((s) => s.passport === null),
      total: slots.length,
    }))
    // Furthest-along drops first; untouched collections sink to the bottom.
    .sort((a, b) => b.owned.length - a.owned.length || a.dropName.localeCompare(b.dropName))
}

export interface TimelineEntry {
  passport: OwnedPassport
  image?: string
  dropName: string
  /** Registration date, or null when the row predates dating. */
  date: Date | null
}

/** Every registered unit (duplicates included), newest first — a service record. */
export function buildTimeline(
  owned: readonly OwnedPassport[],
  catalog: readonly ArmoryCatalogEntry[],
): TimelineEntry[] {
  const catalogBySlug = new Map(catalog.map((p) => [p.slug, p]))
  return [...owned].sort(byNewestClaim).map((passport) => {
    const product = catalogBySlug.get(passport.productSlug)
    const parsed = passport.claimedAt ? new Date(passport.claimedAt) : null
    return {
      passport,
      image: product?.image,
      dropName: product?.dropName ?? '',
      date: parsed && !Number.isNaN(parsed.getTime()) ? parsed : null,
    }
  })
}

// (The Loadout view was retired 2026-07-17 — Grid + Vault are the wall views;
// Collection and Timeline open as overlays from their bento cards.)
