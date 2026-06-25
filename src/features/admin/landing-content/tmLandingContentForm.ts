import {
  theoathModernContentSchema,
  type TheoathModernContent,
} from '@/features/landingPages/pages/TheoathModern/content/theoathModernContent.schema'
import { TM_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheoathModern/content/theoathModernContent.defaults'

/**
 * Form model for the Theoath Modern landing content editor (key
 * `theoath-modern`). Flat strings (React Hook Form friendly); blank = "use the
 * code default" (shown as placeholders). Object-arrays are fixed-length to the
 * designed defaults; taglines are dynamic by product slug. Conversion helpers map
 * form values ⇄ the Zod-validated CMS slice.
 */

export interface TmHotspotFormValues {
  label: string
  line: string
  x: string
  y: string
}
export interface TmPairFormValues {
  label: string
  line: string
}
export interface TmBenefitFormValues {
  heading: string
  description: string
}
export interface TmSpecFormValues {
  label: string
  value: string
}
export interface TmTaglineFormValues {
  slug: string
  line: string
}

export interface TmContentFormValues {
  hero: {
    eyebrow: string
    heading: string
    highlightWordsText: string
    description: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    scrollPrompt: string
    sideIndexText: string
    hotspots: TmHotspotFormValues[]
  }
  techKnit: {
    eyebrow: string
    title: string
    description: string
    callouts: TmPairFormValues[]
  }
  collection: {
    eyebrow: string
    title: string
    viewAllLabel: string
    taglines: TmTaglineFormValues[]
  }
  benefits: {
    eyebrow: string
    title: string
    items: TmBenefitFormValues[]
  }
  materials: {
    eyebrow: string
    title: string
    description: string
    notesText: string
    specs: TmSpecFormValues[]
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
  }
}

const d = TM_DEFAULT_CONTENT

function s(value: string | undefined): string {
  return value ?? ''
}
function n(value: number | undefined): string {
  return typeof value === 'number' ? String(value) : ''
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toTmFormValues(raw: unknown): TmContentFormValues {
  const parsed = theoathModernContentSchema.safeParse(raw)
  const cms: TheoathModernContent = parsed.success ? parsed.data : {}

  return {
    hero: {
      eyebrow: s(cms.hero?.eyebrow),
      heading: s(cms.hero?.heading),
      highlightWordsText: (cms.hero?.highlightWords ?? []).join(', '),
      description: s(cms.hero?.description),
      primaryCtaLabel: s(cms.hero?.primaryCta?.label),
      primaryCtaHref: s(cms.hero?.primaryCta?.href),
      secondaryCtaLabel: s(cms.hero?.secondaryCta?.label),
      secondaryCtaHref: s(cms.hero?.secondaryCta?.href),
      scrollPrompt: s(cms.hero?.scrollPrompt),
      sideIndexText: (cms.hero?.sideIndex ?? []).join('\n'),
      hotspots: d.hero.hotspots.map((_, i) => ({
        label: s(cms.hero?.hotspots?.[i]?.label),
        line: s(cms.hero?.hotspots?.[i]?.line),
        x: n(cms.hero?.hotspots?.[i]?.x),
        y: n(cms.hero?.hotspots?.[i]?.y),
      })),
    },
    techKnit: {
      eyebrow: s(cms.techKnit?.eyebrow),
      title: s(cms.techKnit?.title),
      description: s(cms.techKnit?.description),
      callouts: d.techKnit.callouts.map((_, i) => ({
        label: s(cms.techKnit?.callouts?.[i]?.label),
        line: s(cms.techKnit?.callouts?.[i]?.line),
      })),
    },
    collection: {
      eyebrow: s(cms.collection?.eyebrow),
      title: s(cms.collection?.title),
      viewAllLabel: s(cms.collection?.viewAllLabel),
      taglines: Object.entries(cms.collection?.taglines ?? {}).map(
        ([slug, line]) => ({ slug, line }),
      ),
    },
    benefits: {
      eyebrow: s(cms.benefits?.eyebrow),
      title: s(cms.benefits?.title),
      items: d.benefits.items.map((_, i) => ({
        heading: s(cms.benefits?.items?.[i]?.heading),
        description: s(cms.benefits?.items?.[i]?.description),
      })),
    },
    materials: {
      eyebrow: s(cms.materials?.eyebrow),
      title: s(cms.materials?.title),
      description: s(cms.materials?.description),
      notesText: (cms.materials?.notes ?? []).join('\n'),
      specs: d.materials.specs.map((_, i) => ({
        label: s(cms.materials?.specs?.[i]?.label),
        value: s(cms.materials?.specs?.[i]?.value),
      })),
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
    },
  }
}

function keep(value: string): string | undefined {
  const t = value.trim()
  return t.length > 0 ? t : undefined
}
function keepNum(value: string): number | undefined {
  const t = value.trim()
  if (t.length === 0) return undefined
  const num = Number(t)
  return Number.isFinite(num) ? num : undefined
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

/** Form values → minimal CMS slice (blank fields dropped), schema-validated. */
export function toTmContentSlice(values: TmContentFormValues): TheoathModernContent {
  const highlightWords = values.hero.highlightWordsText
    .split(',')
    .map((w) => w.trim())
    .filter((w) => w.length > 0)
    .slice(0, 6)
  const sideIndex = splitLines(values.hero.sideIndexText, 8)
  const hotspots = values.hero.hotspots
    .map((h) =>
      prune({
        label: keep(h.label),
        line: keep(h.line),
        x: keepNum(h.x),
        y: keepNum(h.y),
      }),
    )
    .map((h) => h ?? {})
  const hasHotspotOverride = hotspots.some((h) => Object.keys(h).length > 0)

  const callouts = values.techKnit.callouts
    .map((c) => prune({ label: keep(c.label), line: keep(c.line) }) ?? {})
  const hasCalloutOverride = callouts.some((c) => Object.keys(c).length > 0)

  const taglines: Record<string, string> = {}
  for (const { slug, line } of values.collection.taglines) {
    const cleanSlug = keep(slug)
    const cleanLine = keep(line)
    if (cleanSlug && cleanLine) taglines[cleanSlug] = cleanLine
  }

  const items = values.benefits.items
    .map((b) => prune({ heading: keep(b.heading), description: keep(b.description) }) ?? {})
  const hasBenefitOverride = items.some((b) => Object.keys(b).length > 0)

  const notes = splitLines(values.materials.notesText, 6)
  const specs = values.materials.specs
    .map((sp) => prune({ label: keep(sp.label), value: keep(sp.value) }) ?? {})
  const hasSpecOverride = specs.some((sp) => Object.keys(sp).length > 0)

  const slice: TheoathModernContent = {
    hero: prune({
      eyebrow: keep(values.hero.eyebrow),
      heading: keep(values.hero.heading),
      highlightWords: highlightWords.length > 0 ? highlightWords : undefined,
      description: keep(values.hero.description),
      primaryCta: keepCta(values.hero.primaryCtaLabel, values.hero.primaryCtaHref),
      secondaryCta: keepCta(values.hero.secondaryCtaLabel, values.hero.secondaryCtaHref),
      scrollPrompt: keep(values.hero.scrollPrompt),
      sideIndex: sideIndex.length > 0 ? sideIndex : undefined,
      hotspots: hasHotspotOverride ? hotspots : undefined,
    }),
    techKnit: prune({
      eyebrow: keep(values.techKnit.eyebrow),
      title: keep(values.techKnit.title),
      description: keep(values.techKnit.description),
      callouts: hasCalloutOverride ? callouts : undefined,
    }),
    collection: prune({
      eyebrow: keep(values.collection.eyebrow),
      title: keep(values.collection.title),
      viewAllLabel: keep(values.collection.viewAllLabel),
      taglines: Object.keys(taglines).length > 0 ? taglines : undefined,
    }),
    benefits: prune({
      eyebrow: keep(values.benefits.eyebrow),
      title: keep(values.benefits.title),
      items: hasBenefitOverride ? items : undefined,
    }),
    materials: prune({
      eyebrow: keep(values.materials.eyebrow),
      title: keep(values.materials.title),
      description: keep(values.materials.description),
      notes: notes.length > 0 ? notes : undefined,
      specs: hasSpecOverride ? specs : undefined,
    }),
    conversion: prune({
      eyebrow: keep(values.conversion.eyebrow),
      title: keep(values.conversion.title),
      body: keep(values.conversion.body),
      primaryCta: keepCta(values.conversion.primaryCtaLabel, values.conversion.primaryCtaHref),
      secondaryCta: keepCta(
        values.conversion.secondaryCtaLabel,
        values.conversion.secondaryCtaHref,
      ),
      tagline: keep(values.conversion.tagline),
    }),
  }

  const pruned = prune(slice as Record<string, unknown>) ?? {}
  return theoathModernContentSchema.parse(pruned)
}
