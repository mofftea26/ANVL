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
 * --------------------------------------------------------------------------- */
export const careProductEntrySchema = z
  .object({
    note: z.string().catch(''),
    lines: z.array(z.string()).catch([]),
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
 * --------------------------------------------------------------------------- */
export const sizeRowSchema = z
  .object({
    id: z.string().catch(''),
    size: z.string().catch(''),
    values: z.array(z.string()).catch([]),
  })
  .strict()
export type SizeRow = z.infer<typeof sizeRowSchema>

export const sizeProductEntrySchema = z
  .object({
    note: z.string().catch(''),
    columns: z.array(z.string()).catch([]),
    rows: z.array(sizeRowSchema).catch([]),
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

function pickCarePerProduct(raw: unknown): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const [slug, value] of Object.entries(r)) {
    if (!slug.trim()) continue
    const v = obj(value)
    out[slug] = {
      note: 'note' in v ? v.note : '',
      lines: pickStringArray(v.lines),
    }
  }
  return out
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
    out[slug] = {
      note: 'note' in v ? v.note : '',
      columns: pickStringArray(v.columns),
      rows,
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
