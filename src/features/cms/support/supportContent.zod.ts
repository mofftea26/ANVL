import { z } from 'zod'

import { obj, pickKeys } from './parseUtils'
import { pickSectionArray, supportSectionSchema } from './supportContent.shared.zod'
import { pickCareGuide, supportCareGuideSchema } from './supportContent.care.zod'
import { pickSizeGuide, supportSizeGuideSchema } from './supportContent.size.zod'

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
 *
 * This is the ROOT of a small module family, all in this folder: the care
 * guide and size guide schemas + their deep-pick helpers live in
 * `supportContent.care.zod.ts` / `supportContent.size.zod.ts` (split out
 * purely to keep files under the size limits), the section shape they both
 * reuse lives in `supportContent.shared.zod.ts`, and the parsing primitives
 * (`obj`/`pickKeys`/`pickStringArray`) live in `parseUtils.ts`. This file
 * re-exports everything from those modules, so every existing import of
 * `@/features/cms/support/supportContent.zod` continues to work unchanged.
 */

export {
  supportSectionSchema,
  type SupportSection,
} from './supportContent.shared.zod'

export {
  CARE_ICON_KEYS,
  type CareIconKey,
  careItemSchema,
  type CareItem,
  careProductEntrySchema,
  type CareProductEntry,
  careLegendEntrySchema,
  type CareLegendEntry,
  careLegendSchema,
  type CareLegend,
  supportCareGuideSchema,
} from './supportContent.care.zod'

export {
  sizeRowSchema,
  type SizeRow,
  SIZE_TABLE_SIZES,
  type SizeTableSize,
  SIZE_TABLE_ROW_KEYS,
  type SizeTableRowKey,
  SIZE_TABLE_ROW_LABELS,
  GARMENT_TYPE_KEYS,
  type GarmentTypeKey,
  measurePointSchema,
  type MeasurePoint,
  garmentTypeContentSchema,
  type GarmentTypeContent,
  sizeMeasureSchema,
  type SizeMeasure,
  sizeTableRowSchema,
  type SizeTableRow,
  sizeTableSchema,
  type SizeTable,
  sizeProductEntrySchema,
  type SizeProductEntry,
  supportSizeGuideSchema,
} from './supportContent.size.zod'

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
  careGuide: {
    intro: '',
    updatedAt: '',
    sections: [],
    legend: { heading: '', intro: '', entries: {} },
    perProduct: {},
  },
  sizeGuide: {
    intro: '',
    updatedAt: '',
    note: '',
    measure: { heading: '', intro: '', footnote: '', garmentTypes: [] },
    perProduct: {},
  },
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
      ...pickCareGuide(r.careGuide),
    },
    sizeGuide: {
      ...B.sizeGuide,
      ...pickSizeGuide(r.sizeGuide),
    },
  })
}
