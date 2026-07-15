import {
  getPassportProductContent,
  type PassportContentConfig,
} from '@/features/cms/passportContent/passportContent.zod'

/**
 * Cross-product size advice.
 *
 * Every product's passport content maps ITS sizes to a **canonical** body size
 * (`fit.sizeEquivalence`, e.g. an oversized cut's "M" → canonical "S"). The
 * registered size on a passport therefore translates: this product's size →
 * canonical → the size another product uses for that same canonical.
 *
 * The map is CMS-authored per product on purpose — a cut that runs big can be
 * mapped honestly, and a product with no map simply never appears in the
 * advice rather than guessing.
 */

export interface SizeGuideProduct {
  slug: string
  name: string
  /** canonical body size → this product's size label. */
  sizeByCanonical: Record<string, string>
}

export interface PassportSizeGuide {
  /** This product's size label → canonical body size. */
  canonicalBySize: Record<string, string>
  /** Every OTHER product that has published a size map. */
  others: SizeGuideProduct[]
}

export interface SizeRecommendation {
  slug: string
  name: string
  size: string
}

/** Catalog subset needed to name the other products. */
export interface SizeGuideCatalogRef {
  slug: string
  name: string
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

/** Invert `size → canonical` into `canonical → size` (first mapping wins). */
function invert(equivalence: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [size, canonical] of Object.entries(equivalence)) {
    const key = normalize(canonical)
    if (!key || !size.trim()) continue
    if (!(key in out)) out[key] = size
  }
  return out
}

/**
 * Build the (user-independent, serializable) guide for one product — safe to
 * compute in the SSR loader, since it never touches the viewer's own size.
 */
export function buildPassportSizeGuide(input: {
  productSlug: string
  passportContent: PassportContentConfig
  catalog: readonly SizeGuideCatalogRef[]
}): PassportSizeGuide {
  const { productSlug, passportContent, catalog } = input
  const own = getPassportProductContent(passportContent, productSlug).fit.sizeEquivalence

  const canonicalBySize: Record<string, string> = {}
  for (const [size, canonical] of Object.entries(own)) {
    if (size.trim() && canonical.trim()) canonicalBySize[normalize(size)] = normalize(canonical)
  }

  const others: SizeGuideProduct[] = []
  for (const product of catalog) {
    if (product.slug === productSlug) continue
    const equivalence = getPassportProductContent(passportContent, product.slug).fit
      .sizeEquivalence
    const sizeByCanonical = invert(equivalence)
    if (Object.keys(sizeByCanonical).length === 0) continue
    others.push({ slug: product.slug, name: product.name, sizeByCanonical })
  }

  return { canonicalBySize, others }
}

/**
 * The viewer's registered size → what they'd wear in the other pieces.
 * Returns `[]` whenever the answer would be a guess (no registered size, no
 * map for this product, or the size isn't mapped).
 */
export function recommendSizes(
  guide: PassportSizeGuide | null,
  claimedSize: string | null,
): SizeRecommendation[] {
  if (!guide || !claimedSize?.trim()) return []
  const canonical = guide.canonicalBySize[normalize(claimedSize)]
  if (!canonical) return []
  const out: SizeRecommendation[] = []
  for (const other of guide.others) {
    const size = other.sizeByCanonical[canonical]
    if (size) out.push({ slug: other.slug, name: other.name, size })
  }
  return out
}
