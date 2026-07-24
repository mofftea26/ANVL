import { z } from 'zod'

/**
 * Support content blob — the CMS-controlled copy for the customer-help pages
 * (FAQ, Contact, Shipping, Returns, Care guide, Size guide). Mirrors how
 * `banner_config` / `coming_soon` flow: edited locally → `adminCmsRemoteSync` →
 * `cms_settings.support_content` + `storefront_publication.support_content` →
 * SSR projection.
 *
 * PERSISTENCE DEFAULTS ARE BLANK. Every text field defaults to '' here; the
 * render-ready page comes from `resolveSupportContent`, which merges these CMS
 * values over the FULL designed defaults in `supportContent.defaults.ts` (blank
 * string = "use the default"). Per-product care/size entries are keyed by the
 * commerce product slug (same convention as `pdp_content`).
 *
 * Persistence schemas are `.strict()`; `parseSupportContent` deep-picks only
 * known keys first, so legacy/tampered blobs degrade to defaults instead of
 * throwing. `body`/`answer` are plain text; a blank line separates paragraphs.
 */

/* --------------------------------------------------------------------------- *
 * Shared section shape (heading + plain-text body), reused across pages.
 * --------------------------------------------------------------------------- */
export const supportSectionSchema = z
  .object({
    id: z.string().catch(''),
    heading: z.string().catch(''),
    body: z.string().catch(''),
  })
  .strict()
export type SupportSection = z.infer<typeof supportSectionSchema>

/* --------------------------------------------------------------------------- *
 * FAQ
 * --------------------------------------------------------------------------- */
export const faqItemSchema = z
  .object({
    id: z.string().catch(''),
    question: z.string().catch(''),
    answer: z.string().catch(''),
  })
  .strict()
export type FaqItem = z.infer<typeof faqItemSchema>

export const supportFaqSchema = z
  .object({
    intro: z.string().catch(''),
    items: z.array(faqItemSchema).catch([]),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Contact
 * --------------------------------------------------------------------------- */
export const supportContactSchema = z
  .object({
    intro: z.string().catch(''),
    email: z.string().catch(''),
    phone: z.string().catch(''),
    instagram: z.string().catch(''),
    address: z.string().catch(''),
    hours: z.string().catch(''),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Shipping / Returns — a simple section list each.
 * --------------------------------------------------------------------------- */
export const supportSectionListSchema = z
  .object({
    intro: z.string().catch(''),
    sections: z.array(supportSectionSchema).catch([]),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Care guide — global sections + per-product care notes (keyed by slug).
 *
 * Two authoring generations coexist (ADDITIVE — old blobs stay valid):
 * - legacy `lines: string[]` (free text, one instruction per line)
 * - structured `items: CareItem[]` (icon + name + optional value + note)
 * `resolveCareItems` in `resolveSupportContent.ts` prefers `items` when any
 * are authored and maps legacy lines to generic items at resolve time.
 * --------------------------------------------------------------------------- */

/** Icon vocabulary for structured care items — keys map to the real textile
 * care symbols in `@/features/support/components/careSymbols`. The list is
 * ADDITIVE: the original decorative keys stay valid (old stored items parse and
 * render), and the standard care marks are appended below. */
export const CARE_ICON_KEYS = [
  // Legacy decorative keys — kept forever for backward compatibility.
  'washing-machine',
  'hand-soap',
  'droplet',
  'snowflake',
  'thermometer',
  'sun',
  'wind',
  'flame',
  'prohibit',
  'spray-bottle',
  'coat-hanger',
  'sparkle',
  'shirt',
  'generic',
  // Standard textile care symbols.
  'wash',
  'wash-30',
  'wash-40',
  'wash-50',
  'wash-60',
  'wash-cold',
  'wash-gentle',
  'wash-hand',
  'wash-inside-out',
  'do-not-wash',
  'bleach',
  'do-not-bleach',
  'tumble-dry',
  'tumble-dry-low',
  'tumble-dry-high',
  'do-not-tumble-dry',
  'line-dry',
  'dry-flat',
  'drip-dry',
  'iron',
  'iron-low',
  'iron-medium',
  'iron-high',
  'do-not-iron',
  'dry-clean',
  'do-not-dry-clean',
] as const
export type CareIconKey = (typeof CARE_ICON_KEYS)[number]

export const careItemSchema = z
  .object({
    id: z.string().catch(''),
    icon: z.enum(CARE_ICON_KEYS).catch('generic'),
    name: z.string().catch(''),
    /** Optional contextual value (e.g. wash temperature "30", iron level "low"). */
    value: z.string().catch(''),
    note: z.string().catch(''),
  })
  .strict()
export type CareItem = z.infer<typeof careItemSchema>

export const careProductEntrySchema = z
  .object({
    note: z.string().catch(''),
    /** Legacy free-text instructions — kept forever for backward compat. */
    lines: z.array(z.string()).catch([]),
    /** Structured instructions — preferred at resolve time when non-empty. */
    items: z.array(careItemSchema).catch([]),
  })
  .strict()
export type CareProductEntry = z.infer<typeof careProductEntrySchema>

export const supportCareGuideSchema = z
  .object({
    intro: z.string().catch(''),
    sections: z.array(supportSectionSchema).catch([]),
    perProduct: z.record(z.string(), careProductEntrySchema).catch({}),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Size guide — global intro/note + per-product measurement tables (by slug).
 *
 * Two authoring generations coexist (ADDITIVE — old blobs stay valid):
 * - legacy free-form `columns` + `rows` (row = one size, values per column)
 * - structured `table` (fixed size columns XS–XXL, fixed measurement rows)
 * `resolveSizeTable` in `resolveSupportContent.ts` prefers `table` when any
 * cell is filled and falls back to the legacy shape otherwise.
 * --------------------------------------------------------------------------- */
export const sizeRowSchema = z
  .object({
    id: z.string().catch(''),
    size: z.string().catch(''),
    values: z.array(z.string()).catch([]),
  })
  .strict()
export type SizeRow = z.infer<typeof sizeRowSchema>

/** Fixed size columns of the structured table — one value slot per size. */
export const SIZE_TABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const
export type SizeTableSize = (typeof SIZE_TABLE_SIZES)[number]

/** Fixed measurement rows of the structured table, in display order. */
export const SIZE_TABLE_ROW_KEYS = [
  'length',
  'chest',
  'waist',
  'bottom',
  'collar',
  'sleeve',
  'cuff',
] as const
export type SizeTableRowKey = (typeof SIZE_TABLE_ROW_KEYS)[number]

export const SIZE_TABLE_ROW_LABELS: Record<SizeTableRowKey, string> = {
  length: 'Length',
  chest: 'Chest width',
  waist: 'Waist width',
  bottom: 'Bottom width',
  collar: 'Collar width',
  sleeve: 'Sleeve width',
  cuff: 'Cuff width',
}

export const sizeTableRowSchema = z
  .object({
    key: z.enum(SIZE_TABLE_ROW_KEYS),
    /** One value per size in {@link SIZE_TABLE_SIZES}; '' = size not offered. */
    values: z.array(z.string()).catch([]),
  })
  .strict()
export type SizeTableRow = z.infer<typeof sizeTableRowSchema>

export const sizeTableSchema = z
  .object({
    rows: z.array(sizeTableRowSchema).catch([]),
    /** Widths are HALF measurements (garment laid flat) when true. */
    halfMeasurement: z.boolean().catch(true),
  })
  .strict()
export type SizeTable = z.infer<typeof sizeTableSchema>

export const sizeProductEntrySchema = z
  .object({
    note: z.string().catch(''),
    /** Legacy free-form table — kept forever for backward compat. */
    columns: z.array(z.string()).catch([]),
    rows: z.array(sizeRowSchema).catch([]),
    /** Structured fixed-grid table — preferred at resolve time when filled. */
    table: sizeTableSchema.optional(),
  })
  .strict()
export type SizeProductEntry = z.infer<typeof sizeProductEntrySchema>

export const supportSizeGuideSchema = z
  .object({
    intro: z.string().catch(''),
    note: z.string().catch(''),
    perProduct: z.record(z.string(), sizeProductEntrySchema).catch({}),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Root
 * --------------------------------------------------------------------------- */
export const supportContentSchema = z
  .object({
    faq: supportFaqSchema,
    contact: supportContactSchema,
    shipping: supportSectionListSchema,
    returns: supportSectionListSchema,
    careGuide: supportCareGuideSchema,
    sizeGuide: supportSizeGuideSchema,
  })
  .strict()

export type SupportContentConfig = z.infer<typeof supportContentSchema>

/* --------------------------------------------------------------------------- *
 * Blank persistence defaults (real copy lives in the resolver).
 * --------------------------------------------------------------------------- */
export const DEFAULT_SUPPORT_CONTENT: SupportContentConfig = {
  faq: { intro: '', items: [] },
  contact: { intro: '', email: '', phone: '', instagram: '', address: '', hours: '' },
  shipping: { intro: '', sections: [] },
  returns: { intro: '', sections: [] },
  careGuide: { intro: '', sections: [], perProduct: {} },
  sizeGuide: { intro: '', note: '', perProduct: {} },
}

/* --------------------------------------------------------------------------- *
 * Tolerant deep-pick parse
 * --------------------------------------------------------------------------- */
function obj(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {}
}

function pickKeys(raw: unknown, keys: readonly string[]): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const key of keys) if (key in r) out[key] = r[key]
  return out
}

// Each row starts from a full blank so every key is present before parse
// (a `.catch` default only fires on a *wrong type*, not a *missing* key).
function pickSectionArray(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => ({ id: '', heading: '', body: '', ...pickKeys(s, ['id', 'heading', 'body']) }))
}

function pickFaqItems(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map((s) => ({
    id: '',
    question: '',
    answer: '',
    ...pickKeys(s, ['id', 'question', 'answer']),
  }))
}

function pickStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.map((v) => (typeof v === 'string' ? v : String(v ?? '')))
}

function pickCareItems(raw: unknown): Record<string, unknown>[] {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => ({
    id: '',
    icon: 'generic',
    name: '',
    value: '',
    note: '',
    ...pickKeys(item, ['id', 'icon', 'name', 'value', 'note']),
  }))
}

function pickCarePerProduct(raw: unknown): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const [slug, value] of Object.entries(r)) {
    if (!slug.trim()) continue
    const v = obj(value)
    out[slug] = {
      note: 'note' in v ? v.note : '',
      lines: pickStringArray(v.lines),
      items: pickCareItems(v.items),
    }
  }
  return out
}

const SIZE_ROW_KEY_SET: ReadonlySet<string> = new Set(SIZE_TABLE_ROW_KEYS)

/** Pick a structured size table (rows with invalid keys are dropped, values
 * padded/truncated to one slot per fixed size column). `undefined` when absent. */
function pickSizeTable(raw: unknown): Record<string, unknown> | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const v = raw as Record<string, unknown>
  const rows = Array.isArray(v.rows)
    ? v.rows
        .filter((row) => {
          const rowObj = obj(row)
          return typeof rowObj.key === 'string' && SIZE_ROW_KEY_SET.has(rowObj.key)
        })
        .map((row) => {
          const rowObj = obj(row)
          const values = pickStringArray(rowObj.values).slice(0, SIZE_TABLE_SIZES.length)
          while (values.length < SIZE_TABLE_SIZES.length) values.push('')
          return { key: rowObj.key, values }
        })
    : []
  return {
    rows,
    halfMeasurement: 'halfMeasurement' in v ? v.halfMeasurement : true,
  }
}

function pickSizePerProduct(raw: unknown): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const [slug, value] of Object.entries(r)) {
    if (!slug.trim()) continue
    const v = obj(value)
    const rows = Array.isArray(v.rows)
      ? v.rows.map((row) => {
          const rowObj = obj(row)
          return {
            id: 'id' in rowObj ? rowObj.id : '',
            size: 'size' in rowObj ? rowObj.size : '',
            values: pickStringArray(rowObj.values),
          }
        })
      : []
    const table = pickSizeTable(v.table)
    out[slug] = {
      note: 'note' in v ? v.note : '',
      columns: pickStringArray(v.columns),
      rows,
      ...(table ? { table } : {}),
    }
  }
  return out
}

/**
 * Parse any stored support blob into a complete, valid
 * {@link SupportContentConfig}. Non-object input → blank defaults. Object input
 * → known keys deep-picked (unknown dropped) then per-field `.catch` defaults
 * fill gaps, so partial/legacy blobs upgrade silently and never throw.
 */
export function parseSupportContent(raw: unknown): SupportContentConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return supportContentSchema.parse(structuredClone(DEFAULT_SUPPORT_CONTENT))
  }
  const r = raw as Record<string, unknown>
  const faqRaw = obj(r.faq)
  const shippingRaw = obj(r.shipping)
  const returnsRaw = obj(r.returns)
  const careRaw = obj(r.careGuide)
  const sizeRaw = obj(r.sizeGuide)

  // Spread the blank defaults under each picked sub-object so every scalar key
  // is present (a `.catch` default only fires on a *wrong type*, not a *missing*
  // key); a present-but-wrong-typed value is then degraded by the schema.
  const B = DEFAULT_SUPPORT_CONTENT
  return supportContentSchema.parse({
    faq: {
      ...B.faq,
      ...pickKeys(faqRaw, ['intro']),
      items: pickFaqItems(faqRaw.items),
    },
    contact: {
      ...B.contact,
      ...pickKeys(r.contact, ['intro', 'email', 'phone', 'instagram', 'address', 'hours']),
    },
    shipping: {
      ...B.shipping,
      ...pickKeys(shippingRaw, ['intro']),
      sections: pickSectionArray(shippingRaw.sections),
    },
    returns: {
      ...B.returns,
      ...pickKeys(returnsRaw, ['intro']),
      sections: pickSectionArray(returnsRaw.sections),
    },
    careGuide: {
      ...B.careGuide,
      ...pickKeys(careRaw, ['intro']),
      sections: pickSectionArray(careRaw.sections),
      perProduct: pickCarePerProduct(careRaw.perProduct),
    },
    sizeGuide: {
      ...B.sizeGuide,
      ...pickKeys(sizeRaw, ['intro', 'note']),
      perProduct: pickSizePerProduct(sizeRaw.perProduct),
    },
  })
}
