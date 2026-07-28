import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import {
  GARMENT_TYPE_KEYS,
  SIZE_TABLE_SIZES,
  type CareIconKey,
  type CareProductEntry,
  type FaqItem,
  type GarmentTypeContent,
  type GarmentTypeKey,
  type MeasurePoint,
  type SizeProductEntry,
  type SizeRow,
  type SizeTableRow,
  type SizeTableRowKey,
  type SupportContentConfig,
  type SupportSection,
} from '@/features/cms/support/supportContent.zod'

/**
 * Render-ready support content: the CMS `support_content` blob merged over the
 * FULL designed defaults (blank string = "use the default"). Scalars fall back
 * per field; list blocks (FAQ items, section lists) fall back as a whole when
 * the CMS list is empty. Per-product care/size entries have no code default —
 * they surface only when authored, keyed by commerce product slug.
 *
 * Storefront-safe and pure — the page agent renders straight off this shape.
 */

export type ResolvedFaqItem = { id: string; question: string; answer: string }
export type ResolvedSupportSection = { id: string; heading: string; body: string }

export type ResolvedSupportContent = {
  faq: { intro: string; items: ResolvedFaqItem[] }
  contact: {
    intro: string
    email: string
    phone: string
    instagram: string
    address: string
    hours: string
  }
  shipping: { intro: string; sections: ResolvedSupportSection[] }
  returns: { intro: string; sections: ResolvedSupportSection[] }
  careGuide: {
    intro: string
    sections: ResolvedSupportSection[]
    perProduct: Record<string, CareProductEntry>
  }
  sizeGuide: {
    intro: string
    note: string
    perProduct: Record<string, SizeProductEntry>
  }
}

/* --------------------------------------------------------------------------- *
 * Per-product care/size resolution — structured-first, legacy fallback.
 * Pure read-time mapping: stored entries are NEVER mutated.
 * --------------------------------------------------------------------------- */

export type ResolvedCareItem = {
  id: string
  icon: CareIconKey
  name: string
  value: string
  note: string
}

/**
 * Render-ready care items for one product entry: structured `items` win when
 * any carry a name; otherwise legacy `lines` map to generic items (neutral
 * icon) at resolve time.
 */
export function resolveCareItems(entry: CareProductEntry): ResolvedCareItem[] {
  const structured = entry.items.filter((item) => item.name.trim().length > 0)
  if (structured.length > 0) {
    return structured.map((item, index) => ({
      id: item.id.trim() || `care-item-${index}`,
      icon: item.icon,
      name: item.name.trim(),
      value: item.value.trim(),
      note: item.note.trim(),
    }))
  }
  return entry.lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      id: `care-line-${index}`,
      icon: 'generic' as const,
      name: line,
      value: '',
      note: '',
    }))
}

export type ResolvedSizeTable =
  | {
      kind: 'structured'
      /** Fixed size columns, XS–XXL. */
      sizes: readonly string[]
      /** Only rows with at least one filled cell. */
      rows: SizeTableRow[]
      halfMeasurement: boolean
    }
  | { kind: 'legacy'; columns: string[]; rows: SizeRow[] }

/**
 * Render-ready size table for one product entry: the structured fixed grid
 * wins when any cell is filled; otherwise the legacy free-form table renders;
 * `null` when neither holds data.
 */
export function resolveSizeTable(entry: SizeProductEntry): ResolvedSizeTable | null {
  const structuredRows =
    entry.table?.rows.filter((row) => row.values.some((v) => v.trim().length > 0)) ?? []
  if (structuredRows.length > 0) {
    return {
      kind: 'structured',
      sizes: SIZE_TABLE_SIZES,
      rows: structuredRows,
      halfMeasurement: entry.table?.halfMeasurement ?? true,
    }
  }
  if (entry.rows.length > 0) {
    return { kind: 'legacy', columns: entry.columns, rows: entry.rows }
  }
  return null
}

const D = SUPPORT_CONTENT_DEFAULTS

function text(value: string, fallback: string): string {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : fallback
}

function resolveSections(
  cms: SupportSection[],
  fallback: SupportSection[],
): ResolvedSupportSection[] {
  const authored = cms.filter(
    (s) => s.heading.trim().length > 0 || s.body.trim().length > 0,
  )
  const source = authored.length > 0 ? authored : fallback
  return source.map((s, i) => ({
    id: s.id.trim() || `section-${i}`,
    heading: s.heading,
    body: s.body,
  }))
}

function resolveFaqItems(cms: FaqItem[], fallback: FaqItem[]): ResolvedFaqItem[] {
  const authored = cms.filter(
    (s) => s.question.trim().length > 0 || s.answer.trim().length > 0,
  )
  const source = authored.length > 0 ? authored : fallback
  return source.map((s, i) => ({
    id: s.id.trim() || `faq-${i}`,
    question: s.question,
    answer: s.answer,
  }))
}

/**
 * Merge the CMS support blob over the designed defaults.
 * `config` is the parsed `support_content`; the returned shape is render-ready.
 */
export function resolveSupportContent(
  config: SupportContentConfig,
): ResolvedSupportContent {
  return {
    faq: {
      intro: text(config.faq.intro, D.faq.intro),
      items: resolveFaqItems(config.faq.items, D.faq.items),
    },
    contact: {
      intro: text(config.contact.intro, D.contact.intro),
      email: text(config.contact.email, D.contact.email),
      phone: text(config.contact.phone, D.contact.phone),
      instagram: text(config.contact.instagram, D.contact.instagram),
      address: text(config.contact.address, D.contact.address),
      hours: text(config.contact.hours, D.contact.hours),
    },
    shipping: {
      intro: text(config.shipping.intro, D.shipping.intro),
      sections: resolveSections(config.shipping.sections, D.shipping.sections),
    },
    returns: {
      intro: text(config.returns.intro, D.returns.intro),
      sections: resolveSections(config.returns.sections, D.returns.sections),
    },
    careGuide: {
      intro: text(config.careGuide.intro, D.careGuide.intro),
      sections: resolveSections(config.careGuide.sections, D.careGuide.sections),
      // Per-product care notes have no code default — pass authored entries through.
      perProduct: config.careGuide.perProduct,
    },
    sizeGuide: {
      intro: text(config.sizeGuide.intro, D.sizeGuide.intro),
      note: text(config.sizeGuide.note, D.sizeGuide.note),
      // Per-product size tables have no code default — pass authored entries through.
      perProduct: config.sizeGuide.perProduct,
    },
  }
}

/* --------------------------------------------------------------------------- *
 * "Where we measure" — per-garment-type measurement points. Point GEOMETRY
 * (which keys exist for a garment type, their order, their letter) is always
 * the code default's; the CMS can only edit copy (letter/label/description)
 * for points that already exist there, never add or remove points.
 * --------------------------------------------------------------------------- */

export type ResolvedMeasurePoint = {
  key: SizeTableRowKey
  letter: string
  label: string
  description: string
}

export type ResolvedSizeMeasure = {
  heading: string
  intro: string
  footnote: string
  /** The garment type actually resolved to (after the unknown-key fallback). */
  garmentTypeKey: GarmentTypeKey
  garmentTypeLabel: string
  points: ResolvedMeasurePoint[]
}

function findGarmentType(
  list: readonly GarmentTypeContent[],
  key: GarmentTypeKey,
): GarmentTypeContent | undefined {
  return list.find((g) => g.key === key)
}

function resolveMeasurePoint(cms: MeasurePoint | undefined, fallback: MeasurePoint): ResolvedMeasurePoint {
  return {
    key: fallback.key,
    letter: text(cms?.letter ?? '', fallback.letter),
    label: text(cms?.label ?? '', fallback.label),
    description: text(cms?.description ?? '', fallback.description),
  }
}

/**
 * Render-ready "Where we measure" content for one garment type: the CMS
 * `sizeGuide.measure` blob merged over the designed per-garment-type point
 * defaults (blank field = use default), keyed field-by-field. An unknown or
 * blank `garmentTypeKey` falls back to `'tee'`.
 */
export function resolveMeasurePoints(
  config: SupportContentConfig,
  garmentTypeKey: string,
): ResolvedSizeMeasure {
  const key: GarmentTypeKey = (GARMENT_TYPE_KEYS as readonly string[]).includes(garmentTypeKey)
    ? (garmentTypeKey as GarmentTypeKey)
    : 'tee'
  const measure = config.sizeGuide.measure
  const defaultMeasure = D.sizeGuide.measure
  const fallbackGarment =
    findGarmentType(defaultMeasure.garmentTypes, key) ??
    findGarmentType(defaultMeasure.garmentTypes, 'tee')
  const cmsGarment = findGarmentType(measure.garmentTypes, key)

  const points = (fallbackGarment?.points ?? []).map((fallbackPoint) =>
    resolveMeasurePoint(
      cmsGarment?.points.find((p) => p.key === fallbackPoint.key),
      fallbackPoint,
    ),
  )

  return {
    heading: text(measure.heading, defaultMeasure.heading),
    intro: text(measure.intro, defaultMeasure.intro),
    footnote: text(measure.footnote, defaultMeasure.footnote),
    garmentTypeKey: key,
    garmentTypeLabel: text(cmsGarment?.label ?? '', fallbackGarment?.label ?? ''),
    points,
  }
}

/* --------------------------------------------------------------------------- *
 * Care legend — the 26 standard care-symbol meanings, CMS-overridable.
 * --------------------------------------------------------------------------- */

export type ResolvedCareLegendEntry = { label: string; meaning: string }

export type ResolvedCareLegend = {
  heading: string
  intro: string
  /** Exactly the keys present in the code defaults (the 26 legend symbols). */
  entries: Record<string, ResolvedCareLegendEntry>
}

/**
 * Render-ready care-symbol legend: `careGuide.legend.entries` overrides
 * merged over the 26 designed `{ label, meaning }` pairs, per field (a blank
 * override field falls back to that field's default, not the whole entry).
 * An override keyed to something outside the 26 defaults is inert — the
 * returned `entries` always has exactly the default's key set. Category
 * grouping for display is `CARE_SYMBOL_CATEGORIES` (`careSymbols.tsx`), not
 * this resolver's concern.
 */
export function resolveCareLegend(config: SupportContentConfig): ResolvedCareLegend {
  const legend = config.careGuide.legend
  const defaultLegend = D.careGuide.legend
  const entries: Record<string, ResolvedCareLegendEntry> = {}
  for (const [iconKey, fallback] of Object.entries(defaultLegend.entries)) {
    const override = legend.entries[iconKey]
    entries[iconKey] = {
      label: text(override?.label ?? '', fallback.label),
      meaning: text(override?.meaning ?? '', fallback.meaning),
    }
  }
  return {
    heading: text(legend.heading, defaultLegend.heading),
    intro: text(legend.intro, defaultLegend.intro),
    entries,
  }
}
