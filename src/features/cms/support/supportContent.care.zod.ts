import { z } from 'zod'

import { obj, pickKeys, pickStringArray } from './parseUtils'
import { pickSectionArray, supportSectionSchema } from './supportContent.shared.zod'

/**
 * Care guide schemas — global sections + the care-symbol legend + per-product
 * care notes (keyed by slug). Split out of `supportContent.zod.ts` (Task 4 of
 * the guides-cms-nav-particles plan) purely to keep that file under the
 * 300/500-line size limits; behavior is unchanged. Depends only on
 * `parseUtils` and `supportContent.shared.zod` — never on the size-guide
 * module or the root file, so the dependency graph stays acyclic.
 *
 * Two authoring generations coexist for per-product notes (ADDITIVE — old
 * blobs stay valid):
 * - legacy `lines: string[]` (free text, one instruction per line)
 * - structured `items: CareItem[]` (icon + name + optional value + note)
 * `resolveCareItems` in `resolveSupportContent.ts` prefers `items` when any
 * are authored and maps legacy lines to generic items at resolve time.
 */

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

/* --------------------------------------------------------------------------- *
 * Care legend — editable copy for the standard care-symbol meanings.
 * `entries` is OVERRIDES-ONLY, keyed by `CareIconKey`: absent = code default
 * (`supportContent.defaults.ts`); present-but-blank falls back per field —
 * see `resolveCareLegend`. Category grouping is code-owned (`careSymbols.tsx`).
 * --------------------------------------------------------------------------- */
export const careLegendEntrySchema = z
  .object({
    label: z.string().catch(''),
    meaning: z.string().catch(''),
  })
  .strict()
export type CareLegendEntry = z.infer<typeof careLegendEntrySchema>

export const careLegendSchema = z
  .object({
    heading: z.string().catch(''),
    intro: z.string().catch(''),
    entries: z.record(z.string(), careLegendEntrySchema).catch({}),
  })
  .strict()
export type CareLegend = z.infer<typeof careLegendSchema>

export const supportCareGuideSchema = z
  .object({
    intro: z.string().catch(''),
    /** ISO `YYYY-MM-DD`; blank falls back to the code-owned default stamp. */
    updatedAt: z.string().catch(''),
    sections: z.array(supportSectionSchema).catch([]),
    legend: careLegendSchema,
    perProduct: z.record(z.string(), careProductEntrySchema).catch({}),
  })
  .strict()

/* --------------------------------------------------------------------------- *
 * Tolerant deep-pick parse helpers for the care guide block.
 * --------------------------------------------------------------------------- */

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

/** One care-legend override entry, keyed by (nominally) `CareIconKey`. */
function pickCareLegendEntry(raw: unknown): Record<string, unknown> {
  return { label: '', meaning: '', ...pickKeys(raw, ['label', 'meaning']) }
}

function pickCareLegendEntries(raw: unknown): Record<string, unknown> {
  const r = obj(raw)
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(r)) {
    if (!key.trim()) continue
    out[key] = pickCareLegendEntry(value)
  }
  return out
}

function pickCareLegend(raw: unknown): Record<string, unknown> {
  const v = obj(raw)
  return {
    heading: '',
    intro: '',
    ...pickKeys(v, ['heading', 'intro']),
    entries: pickCareLegendEntries(v.entries),
  }
}

/**
 * Deep-pick a whole raw `careGuide` blob into a schema-ready shape. The
 * caller (`parseSupportContent`) still spreads the blank defaults underneath
 * — this only fills in keys that are actually present in `raw`, plus the
 * always-computed `sections`/`legend`/`perProduct` blocks.
 */
export function pickCareGuide(raw: unknown): Record<string, unknown> {
  const v = obj(raw)
  return {
    ...pickKeys(v, ['intro', 'updatedAt']),
    sections: pickSectionArray(v.sections),
    legend: pickCareLegend(v.legend),
    perProduct: pickCarePerProduct(v.perProduct),
  }
}
