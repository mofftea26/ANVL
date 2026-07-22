import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import {
  SIZE_TABLE_SIZES,
  type CareIconKey,
  type CareProductEntry,
  type FaqItem,
  type SizeProductEntry,
  type SizeRow,
  type SizeTableRow,
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
