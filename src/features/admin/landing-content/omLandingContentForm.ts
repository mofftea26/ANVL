import {
  oathModernContentSchema,
  type OathModernContent,
} from '@/features/landingPages/pages/OathModern/content/oathModernContent.schema'
import { OM_DEFAULT_CONTENT } from '@/features/landingPages/pages/OathModern/content/oathModernContent.defaults'

/**
 * Form model for The Oath Modern landing content editor (key `theoath-modern`).
 * Flat strings (React Hook Form friendly); blank = "use the code default" (shown
 * as placeholders). Label/line pairs (vows, marks) are fixed-length to the
 * designed defaults; taglines are dynamic by product slug. Conversion helpers map
 * form values ⇄ the Zod-validated CMS slice.
 */

export interface OmPairFormValues {
  label: string
  line: string
}
export interface OmTaglineFormValues {
  slug: string
  line: string
}

export interface OmContentFormValues {
  threshold: {
    eyebrow: string
    heading: string
    highlightWordsText: string
    body: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    scrollPrompt: string
  }
  pressure: {
    eyebrow: string
    heading: string
    body: string
    vows: OmPairFormValues[]
  }
  formation: {
    eyebrow: string
    heading: string
    body: string
    marks: OmPairFormValues[]
  }
  oath: {
    eyebrow: string
    heading: string
    linesText: string
    attribution: string
  }
  collection: {
    eyebrow: string
    title: string
    viewAllLabel: string
    taglines: OmTaglineFormValues[]
  }
  conversion: {
    eyebrow: string
    title: string
    body: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    tagline: string
    reassurancesText: string
  }
}

const d = OM_DEFAULT_CONTENT

function s(value: string | undefined): string {
  return value ?? ''
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toOmFormValues(raw: unknown): OmContentFormValues {
  const parsed = oathModernContentSchema.safeParse(raw)
  const cms: OathModernContent = parsed.success ? parsed.data : {}

  return {
    threshold: {
      eyebrow: s(cms.threshold?.eyebrow),
      heading: s(cms.threshold?.heading),
      highlightWordsText: (cms.threshold?.highlightWords ?? []).join(', '),
      body: s(cms.threshold?.body),
      primaryCtaLabel: s(cms.threshold?.primaryCta?.label),
      primaryCtaHref: s(cms.threshold?.primaryCta?.href),
      secondaryCtaLabel: s(cms.threshold?.secondaryCta?.label),
      secondaryCtaHref: s(cms.threshold?.secondaryCta?.href),
      scrollPrompt: s(cms.threshold?.scrollPrompt),
    },
    pressure: {
      eyebrow: s(cms.pressure?.eyebrow),
      heading: s(cms.pressure?.heading),
      body: s(cms.pressure?.body),
      vows: d.pressure.vows.map((_, i) => ({
        label: s(cms.pressure?.vows?.[i]?.label),
        line: s(cms.pressure?.vows?.[i]?.line),
      })),
    },
    formation: {
      eyebrow: s(cms.formation?.eyebrow),
      heading: s(cms.formation?.heading),
      body: s(cms.formation?.body),
      marks: d.formation.marks.map((_, i) => ({
        label: s(cms.formation?.marks?.[i]?.label),
        line: s(cms.formation?.marks?.[i]?.line),
      })),
    },
    oath: {
      eyebrow: s(cms.oath?.eyebrow),
      heading: s(cms.oath?.heading),
      linesText: (cms.oath?.lines ?? []).join('\n'),
      attribution: s(cms.oath?.attribution),
    },
    collection: {
      eyebrow: s(cms.collection?.eyebrow),
      title: s(cms.collection?.title),
      viewAllLabel: s(cms.collection?.viewAllLabel),
      taglines: Object.entries(cms.collection?.taglines ?? {}).map(
        ([slug, line]) => ({ slug, line }),
      ),
    },
    conversion: {
      eyebrow: s(cms.conversion?.eyebrow),
      title: s(cms.conversion?.title),
      body: s(cms.conversion?.body),
      primaryCtaLabel: s(cms.conversion?.primaryCta?.label),
      primaryCtaHref: s(cms.conversion?.primaryCta?.href),
      secondaryCtaLabel: s(cms.conversion?.secondaryCta?.label),
      secondaryCtaHref: s(cms.conversion?.secondaryCta?.href),
      tagline: s(cms.conversion?.tagline),
      reassurancesText: (cms.conversion?.reassurances ?? []).join('\n'),
    },
  }
}

function keep(value: string): string | undefined {
  const t = value.trim()
  return t.length > 0 ? t : undefined
}
function keepCta(label: string, href: string) {
  const l = keep(label)
  const h = keep(href)
  if (!l && !h) return undefined
  return { ...(l ? { label: l } : {}), ...(h ? { href: h } : {}) }
}
function prune<T extends Record<string, unknown>>(obj: T): T | undefined {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) if (v !== undefined) out[k] = v
  return Object.keys(out).length > 0 ? (out as T) : undefined
}
function splitLines(text: string, max: number): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, max)
}
function pairs(values: OmPairFormValues[]): {
  list: Array<Record<string, string>>
  hasOverride: boolean
} {
  const list = values.map(
    (p) => prune({ label: keep(p.label), line: keep(p.line) }) ?? {},
  )
  return { list, hasOverride: list.some((p) => Object.keys(p).length > 0) }
}

/** Form values → minimal CMS slice (blank fields dropped), schema-validated. */
export function toOmContentSlice(values: OmContentFormValues): OathModernContent {
  const highlightWords = values.threshold.highlightWordsText
    .split(',')
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 6)

  const vows = pairs(values.pressure.vows)
  const marks = pairs(values.formation.marks)
  const oathLines = splitLines(values.oath.linesText, 8)
  const reassurances = splitLines(values.conversion.reassurancesText, 6)

  const taglines: Record<string, string> = {}
  for (const { slug, line } of values.collection.taglines) {
    const cleanSlug = keep(slug)
    const cleanLine = keep(line)
    if (cleanSlug && cleanLine) taglines[cleanSlug] = cleanLine
  }

  const slice: OathModernContent = {
    threshold: prune({
      eyebrow: keep(values.threshold.eyebrow),
      heading: keep(values.threshold.heading),
      highlightWords: highlightWords.length > 0 ? highlightWords : undefined,
      body: keep(values.threshold.body),
      primaryCta: keepCta(values.threshold.primaryCtaLabel, values.threshold.primaryCtaHref),
      secondaryCta: keepCta(values.threshold.secondaryCtaLabel, values.threshold.secondaryCtaHref),
      scrollPrompt: keep(values.threshold.scrollPrompt),
    }),
    pressure: prune({
      eyebrow: keep(values.pressure.eyebrow),
      heading: keep(values.pressure.heading),
      body: keep(values.pressure.body),
      vows: vows.hasOverride ? vows.list : undefined,
    }),
    formation: prune({
      eyebrow: keep(values.formation.eyebrow),
      heading: keep(values.formation.heading),
      body: keep(values.formation.body),
      marks: marks.hasOverride ? marks.list : undefined,
    }),
    oath: prune({
      eyebrow: keep(values.oath.eyebrow),
      heading: keep(values.oath.heading),
      lines: oathLines.length > 0 ? oathLines : undefined,
      attribution: keep(values.oath.attribution),
    }),
    collection: prune({
      eyebrow: keep(values.collection.eyebrow),
      title: keep(values.collection.title),
      viewAllLabel: keep(values.collection.viewAllLabel),
      taglines: Object.keys(taglines).length > 0 ? taglines : undefined,
    }),
    conversion: prune({
      eyebrow: keep(values.conversion.eyebrow),
      title: keep(values.conversion.title),
      body: keep(values.conversion.body),
      primaryCta: keepCta(values.conversion.primaryCtaLabel, values.conversion.primaryCtaHref),
      secondaryCta: keepCta(values.conversion.secondaryCtaLabel, values.conversion.secondaryCtaHref),
      tagline: keep(values.conversion.tagline),
      reassurances: reassurances.length > 0 ? reassurances : undefined,
    }),
  }

  const pruned = prune(slice as Record<string, unknown>) ?? {}
  return oathModernContentSchema.parse(pruned)
}
