import type { OwnedPassport } from '../schemas/passport.schema'

/**
 * "Complete the Loadout" — the passport's subtle related-products data. Two
 * groupings, both built from the catalog (user-independent, so the SSR loader
 * can produce them): the rest of THIS piece's drop, and other pieces in its
 * category. The owner's registrations filter these client-side (SSR is anon),
 * exactly like the size recommendation.
 *
 * Deliberately not a sales surface: it only ever mirrors the collection gap
 * the owner already sees in their Armory, and links to the shop PDP.
 */

export interface RelatedProductRef {
  slug: string
  name: string
  image?: string
}

/** Catalog subset needed to build related products. */
export interface RelatedCatalogEntry {
  slug: string
  name: string
  dropName: string
  category?: string
  image?: string
}

export interface PassportRelated {
  dropName: string
  /** Other pieces in the same drop (excludes the current piece). */
  dropMates: RelatedProductRef[]
  /** Other pieces in the same category (excludes the current piece). */
  categoryMates: RelatedProductRef[]
}

function toRef(entry: RelatedCatalogEntry): RelatedProductRef {
  return { slug: entry.slug, name: entry.name, image: entry.image }
}

export function buildPassportRelated(input: {
  productSlug: string
  dropName: string
  category?: string
  catalog: readonly RelatedCatalogEntry[]
}): PassportRelated {
  const { productSlug, dropName, category, catalog } = input
  const cat = category?.trim().toLowerCase()

  const dropMates = dropName
    ? catalog.filter((p) => p.slug !== productSlug && p.dropName === dropName).map(toRef)
    : []

  const categoryMates = cat
    ? catalog
        .filter((p) => p.slug !== productSlug && p.category?.trim().toLowerCase() === cat)
        .map(toRef)
    : []

  return { dropName, dropMates, categoryMates }
}

/** The refs the owner has NOT registered yet. */
export function unregistered(
  refs: readonly RelatedProductRef[],
  owned: readonly Pick<OwnedPassport, 'productSlug'>[],
): RelatedProductRef[] {
  const ownedSlugs = new Set(owned.map((p) => p.productSlug))
  return refs.filter((r) => !ownedSlugs.has(r.slug))
}

/** True when the drop has other pieces and the owner holds all of them. */
export function isDropComplete(
  related: PassportRelated,
  owned: readonly Pick<OwnedPassport, 'productSlug'>[],
): boolean {
  if (related.dropMates.length === 0) return false
  return unregistered(related.dropMates, owned).length === 0
}
