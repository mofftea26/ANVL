import type { PdpMaterial } from '@/features/cms/pdpContent/pdpContent.zod'
import type { CareItem } from '@/features/cms/support/supportContent.zod'
import type {
  PassportBlueprintFeature,
  PassportProductContent,
} from '@/features/cms/passportContent/passportContent.zod'
import { titleCasePhrase } from '@/features/techpacks/parse/normalize'
import type { TechpackDocument } from '@/features/techpacks/schema/techpack.zod'

import { careIconFor, formatCareLine, isCompositionLine } from './careIconMap'

/**
 * Techpack → passport content.
 *
 * Every function here is a pure projection of already-extracted facts. Nothing
 * invents, infers or rephrases beyond formatting — the AI rewrite step is a
 * separate, optional overlay that an operator accepts field by field, so this
 * layer stays boring and checkable on purpose.
 */

/**
 * Fabric composition → the structured material cards the PDP and passport share.
 *
 * The GSM lands on the FIRST card only. It describes the finished fabric, not
 * each fibre, so repeating it across three cards would render "260 GSM" three
 * times and read as 780.
 */
export function techpackToMaterials(doc: TechpackDocument): PdpMaterial[] {
  const { composition, gsm } = doc.header.fabric
  if (composition.length === 0) return []

  return composition.map((part, index) => ({
    id: `tp-material-${index}`,
    name: titleCasePhrase(part.material),
    percentage: part.percentage,
    gsm: index === 0 ? gsm : null,
    image: '',
  }))
}

/** The knit construction, as a material note. */
export function techpackToMaterialNote(doc: TechpackDocument): string {
  return titleCasePhrase(doc.header.fabric.construction)
}

/**
 * Construction summary for the passport's specs section.
 *
 * Disclosable by decision: seam types, stitch classes, SPI and finishes are
 * the transparency story. The pattern dimensions on the same page are not, and
 * never reach here — they live behind `INTERNAL_ONLY_PATHS`.
 */
export function techpackToConstruction(doc: TechpackDocument, limit = 3): string {
  const seams = doc.technical?.seams ?? []
  if (seams.length === 0) return ''
  return seams
    .slice(0, limit)
    .map((seam) => {
      const spi = seam.spi ? ` at ${seam.spi} SPI` : ''
      return `${titleCasePhrase(seam.text)}${spi}`
    })
    .join(' · ')
}

/** `MENS OVERSIZED TEE` → `Oversized`. */
export function techpackToFitType(doc: TechpackDocument): string {
  const product = doc.header.product.toUpperCase()
  const cuts = ['OVERSIZED', 'COMPRESSION', 'SEAMLESS', 'RELAXED', 'SLIM', 'REGULAR', 'CROPPED']
  const found = cuts.filter((cut) => product.includes(cut))
  return found.length > 0 ? found.map((cut) => titleCasePhrase(cut)).join(' ') : ''
}

/**
 * Blueprint callouts — the construction facts, as passport cards.
 *
 * `supplierRef` is deliberately dropped: it points at another page of the pack
 * ("SEE TRIM A"), which means nothing to a customer and leaks the pack's
 * structure. It stays available to operators on the techpack record itself.
 *
 * The parsed `positions` are dropped too. They were percentages of a crop of
 * the supplier's drawing, and the passport no longer shows that drawing — so
 * carrying them across would import a precision the storefront cannot honour.
 */
export function techpackToBlueprintFeatures(doc: TechpackDocument): PassportBlueprintFeature[] {
  const page = doc.blueprint[0]
  if (!page) return []

  return page.features
    .filter((feature) => feature.label || feature.detail)
    .map((feature) => ({
      code: feature.code,
      title: titleCasePhrase(feature.label),
      body: titleCasePhrase(feature.detail),
    }))
}

/** Care instructions as plain steps, composition line excluded. */
export function techpackToCareSteps(doc: TechpackDocument): string[] {
  const lines = doc.packaging?.careLabel.lines ?? []
  return lines.filter((line) => !isCompositionLine(line)).map((line) => formatCareLine(line))
}

/**
 * Care instructions as structured items with symbols.
 *
 * A line whose meaning is not recognised gets NO symbol — it is simply left to
 * the plain-text steps. An icon is as authoritative as the words beside it, so
 * a guessed one is worse than none.
 */
export function techpackToCareItems(doc: TechpackDocument): {
  items: CareItem[]
  unmatched: string[]
} {
  const lines = doc.packaging?.careLabel.lines ?? []
  const items: CareItem[] = []
  const unmatched: string[] = []

  lines.forEach((line, index) => {
    if (isCompositionLine(line)) return
    const icon = careIconFor(line)
    if (!icon) {
      unmatched.push(formatCareLine(line))
      return
    }
    items.push({
      id: `tp-care-${index}`,
      icon,
      name: formatCareLine(line),
      value: '',
      note: '',
    })
  })

  return { items, unmatched }
}

/** Colorway facts for the passport's details section. */
export function techpackToColorwayFacts(doc: TechpackDocument): string[] {
  const facts: string[] = []
  const seen = new Set<string>()

  for (const colorway of doc.colorways) {
    for (const role of colorway.roles) {
      if (!role.colorName) continue
      const code = role.pantone || role.coloro
      const fact = code
        ? `${titleCasePhrase(role.colorName)} — ${code}`
        : titleCasePhrase(role.colorName)
      if (seen.has(fact)) continue
      seen.add(fact)
      facts.push(fact)
    }
  }

  return facts
}

/** `Designed in Lebanon` → the origin label the passport prints. */
export function techpackToOriginLabel(doc: TechpackDocument): string {
  const origin = doc.packaging?.careLabel.origin ?? ''
  return origin ? `Designed in ${titleCasePhrase(origin)}` : ''
}

/** Everything a blank passport section would take from this pack, for previewing. */
export function techpackPassportPreview(doc: TechpackDocument): Partial<PassportProductContent> {
  const { items } = techpackToCareItems(doc)
  return {
    material: {
      title: '',
      note: techpackToMaterialNote(doc),
      macroAsset: '',
      materials: techpackToMaterials(doc),
    },
    specs: {
      construction: techpackToConstruction(doc),
      fitType: techpackToFitType(doc),
      compression: '',
      stretch: '',
      breathability: '',
      intendedUse: '',
      // Effect markers are placed by hand on the render — a techpack has no
      // opinion about where a readout should sit on the photograph.
      points: [],
    },
    blueprint: {
      heading: '',
      intro: '',
      features: techpackToBlueprintFeatures(doc),
      points: [],
    },
    care: {
      intro: '',
      steps: techpackToCareSteps(doc),
      asset: '',
      symbols: [],
      notes: [],
      careItems: items,
    },
  }
}
