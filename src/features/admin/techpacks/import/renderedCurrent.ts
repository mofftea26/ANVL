import type { PdpMaterial, PdpProductContent } from '@/features/cms/pdpContent/pdpContent.zod'
import type {
  CareItem,
  SizeProductEntry,
  SizeTable,
} from '@/features/cms/support/supportContent.zod'

/**
 * What the storefront renders TODAY for the fields an import wants to write.
 *
 * The import's whole safety story is "we only fill blanks", and since
 * assigning a product to a techpack runs the import UNATTENDED, that one
 * judgement is all that stands between a supplier pack and someone's authored
 * copy. Judging it on the raw stored key is not enough: three resolvers prefer
 * a STRUCTURED field and fall back to a legacy sibling — or to another blob
 * entirely — when it is unset. A field can therefore read empty while an
 * authored paragraph is live on the page, and filling it displaces that
 * paragraph with no warning and no trace.
 *
 * So "empty" has to mean "nothing is rendering there". These functions mirror
 * the resolvers' precedence, one for one:
 *
 * - `resolveSizeTable`       — features/cms/support/resolveSupportContent.ts
 * - `resolvePdpContent`      — features/products/pdp/resolvePdpContent.ts
 * - `resolvePassportContent` — features/passport/lib/resolvePassportContent.ts
 *
 * They are hand copies rather than calls into the resolvers, which each need a
 * `Product`, a media index and resolved asset slots — none of which an import
 * has. Hand copies drift, so every rule below has a test that fails if the
 * resolver it mirrors changes shape.
 *
 * They mirror the CMS half of each chain ONLY. Where a resolver falls further
 * back to the commerce product (`product.fabric`, `product.gsm`,
 * `product.careInstructions`, `product.designDetails`, `product.fit`), the
 * import cannot see it — `ImportDrafts` carries CMS blobs and nothing else.
 * That residual is narrow and of a different kind (catalogue data, not copy an
 * operator wrote), but it is real: closing it means threading the product
 * through `ImportDrafts`.
 *
 * Everything returned here is shown to a human as "what is there now". Where
 * the live shape cannot be compared with the techpack's — the legacy size
 * chart, the legacy material headline — it is summarised as text on purpose:
 * the row exists so someone can READ what they would be replacing.
 */

/**
 * A structured card counts only once it is named — both `resolvePdpContent`
 * and `resolvePassportContent` filter on a non-blank name before deciding the
 * structured list wins, so a list of blank rows renders the fallback.
 */
export function namedMaterials(materials: readonly PdpMaterial[]): PdpMaterial[] {
  return materials.filter((material) => material.name.trim().length > 0)
}

/** Same rule as {@link namedMaterials}, for the shared care-item vocabulary. */
export function namedCareItems(items: readonly CareItem[]): CareItem[] {
  return items.filter((item) => item.name.trim().length > 0)
}

/**
 * The structured size grid, but only when a cell is actually filled.
 *
 * `resolveSizeTable` requires at least one non-blank value before the
 * structured table wins; an all-blank grid is ignored and the legacy table
 * underneath it renders instead.
 */
export function structuredSizeTable(entry: SizeProductEntry): SizeTable | null {
  const filled = entry.table?.rows.some((row) => row.values.some((v) => v.trim().length > 0))
  return filled ? (entry.table ?? null) : null
}

/**
 * The legacy free-form chart, summarised one line per size.
 *
 * `rows` alone decides whether it renders (`resolveSizeTable` never consults
 * `columns` — those are its headings). Summarised rather than passed through
 * because its shape shares nothing with the fixed XS–XXL grid a techpack
 * produces: the two are not comparable field by field, only readable.
 */
export function legacySizeTable(entry: SizeProductEntry): string[] {
  return entry.rows.map((row) => {
    const values = row.values
      .map((value) => value.trim())
      .filter(Boolean)
      .join(' · ')
    return values ? `${row.size}: ${values}` : row.size
  })
}

/**
 * The legacy material headline the PDP renders as a single card when no
 * structured composition is authored (`resolvePdpContent`). The passport
 * inherits that same card through `pdpContent.materials`.
 */
export function pdpLegacyMaterialCopy(pdp: PdpProductContent): string[] {
  return [pdp.materialTitle, pdp.materialNote].map((line) => line.trim()).filter(Boolean)
}

/** The legacy free-text care lines the PDP renders when no care item is authored. */
export function pdpLegacyCareLines(pdp: PdpProductContent): string[] {
  return pdp.care.map((line) => line.trim()).filter(Boolean)
}

/**
 * The flat care text the PASSPORT inherits.
 *
 * `resolvePassportContent` takes `pdpContent.care` for its own `care.steps`
 * when the passport has none, and `resolvePdpContent` builds that view from
 * the structured items when they are authored (`name — value`) and from the
 * legacy lines otherwise.
 */
export function pdpRenderedCareText(pdp: PdpProductContent): string[] {
  const structured = namedCareItems(pdp.careItems)
  if (structured.length === 0) return pdpLegacyCareLines(pdp)
  return structured.map((item) => {
    const name = item.name.trim()
    const value = item.value.trim()
    return value ? `${name} — ${value}` : name
  })
}

/**
 * The flat detail text the PASSPORT inherits as `details.facts` — structured
 * detail titles when authored, else the legacy lines (`resolvePdpContent`
 * builds `designDetails`, `resolvePassportContent` falls back to it).
 */
export function pdpRenderedDetailText(pdp: PdpProductContent): string[] {
  const structured = pdp.details.filter((detail) => detail.title.trim().length > 0)
  if (structured.length > 0) return structured.map((detail) => detail.title.trim())
  return pdp.designDetails.map((line) => line.trim()).filter(Boolean)
}
