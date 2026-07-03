import {
  aboutLandingContentSchema,
  type AboutLandingContent,
  type AboutOrb,
} from '@/features/about/content/aboutContent.schema'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'

/**
 * Form model for the About content editor (key `about`).
 *
 * The form is all flat strings (React Hook Form friendly); blank means "use
 * the code default" — defaults render as input placeholders, never as values,
 * so editors always see what they actually overrode. Orbs are a dynamic list
 * (add / edit / remove — the same contract as The Oath's tenets): saving a
 * different orb count means the CMS owns the list. Conversion helpers map
 * form values ⇄ the Zod-validated CMS slice.
 */

export interface AboutOrbPointFormValues {
  label: string
  description: string
}

export interface AboutOrbStatFormValues {
  label: string
  value: string
  suffix: string
}

export interface AboutOrbFormValues {
  label: string
  /** #RRGGBB (blank = designed default tint). */
  color: string
  eyebrow: string
  title: string
  body: string
  detail: string
  /** One oversized line per row (max 8). */
  linesText: string
  points: AboutOrbPointFormValues[]
  stats: AboutOrbStatFormValues[]
  primaryCtaLabel: string
  primaryCtaHref: string
  secondaryCtaLabel: string
  secondaryCtaHref: string
  tagline: string
  /** Media library id of the orb's section image. */
  mediaId: string
}

export interface AboutContentFormValues {
  hero: {
    eyebrow: string
    headline: string
    subhead: string
    primaryCtaLabel: string
    primaryCtaHref: string
    secondaryCtaLabel: string
    secondaryCtaHref: string
    scrollCue: string
  }
  orbs: AboutOrbFormValues[]
  marquee: {
    text: string
  }
}

const DEFAULT_ORB_COUNT = ABOUT_DEFAULT_CONTENT.orbs.length

function s(value: string | undefined): string {
  return value ?? ''
}

export function createBlankOrbFormValues(): AboutOrbFormValues {
  return {
    label: '',
    color: '',
    eyebrow: '',
    title: '',
    body: '',
    detail: '',
    linesText: '',
    points: [],
    stats: [],
    primaryCtaLabel: '',
    primaryCtaHref: '',
    secondaryCtaLabel: '',
    secondaryCtaHref: '',
    tagline: '',
    mediaId: '',
  }
}

export function createBlankPointFormValues(): AboutOrbPointFormValues {
  return { label: '', description: '' }
}

export function createBlankStatFormValues(): AboutOrbStatFormValues {
  return { label: '', value: '', suffix: '' }
}

function orbToFormValues(orb: AboutOrb | undefined): AboutOrbFormValues {
  return {
    label: s(orb?.label),
    color: s(orb?.color),
    eyebrow: s(orb?.eyebrow),
    title: s(orb?.title),
    body: s(orb?.body),
    detail: s(orb?.detail),
    linesText: (orb?.lines ?? []).join('\n'),
    points: (orb?.points ?? []).map((p) => ({
      label: s(p.label),
      description: s(p.description),
    })),
    stats: (orb?.stats ?? []).map((st) => ({
      label: s(st.label),
      value: s(st.value),
      suffix: s(st.suffix),
    })),
    primaryCtaLabel: s(orb?.primaryCta?.label),
    primaryCtaHref: s(orb?.primaryCta?.href),
    secondaryCtaLabel: s(orb?.secondaryCta?.label),
    secondaryCtaHref: s(orb?.secondaryCta?.href),
    tagline: s(orb?.tagline),
    mediaId: s(orb?.mediaId),
  }
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toAboutFormValues(raw: unknown): AboutContentFormValues {
  const parsed = aboutLandingContentSchema.safeParse(raw)
  const cms: AboutLandingContent = parsed.success ? parsed.data : {}
  const cmsOrbs = cms.orbs
  const orbCount = cmsOrbs && cmsOrbs.length > 0 ? cmsOrbs.length : DEFAULT_ORB_COUNT

  return {
    hero: {
      eyebrow: s(cms.hero?.eyebrow),
      headline: s(cms.hero?.headline),
      subhead: s(cms.hero?.subhead),
      primaryCtaLabel: s(cms.hero?.primaryCta?.label),
      primaryCtaHref: s(cms.hero?.primaryCta?.href),
      secondaryCtaLabel: s(cms.hero?.secondaryCta?.label),
      secondaryCtaHref: s(cms.hero?.secondaryCta?.href),
      scrollCue: s(cms.hero?.scrollCue),
    },
    orbs: Array.from({ length: orbCount }, (_, i) => orbToFormValues(cmsOrbs?.[i])),
    marquee: {
      text: s(cms.marquee?.text),
    },
  }
}

function keep(value: string): string | undefined {
  const t = value.trim()
  return t.length > 0 ? t : undefined
}

function keepCta(label: string, href: string): { label?: string; href?: string } | undefined {
  const l = keep(label)
  const h = keep(href)
  if (!l && !h) return undefined
  return { ...(l ? { label: l } : {}), ...(h ? { href: h } : {}) }
}

function prune<T extends Record<string, unknown>>(obj: T): T | undefined {
  const hasValue = Object.values(obj).some((v) => v !== undefined)
  if (!hasValue) return undefined
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v
  }
  return out as T
}

function pointSliceItems(points: AboutOrbPointFormValues[]) {
  const items = points
    .map((p) => prune({ label: keep(p.label), description: keep(p.description) }))
    .filter((p): p is NonNullable<typeof p> => p !== undefined)
  return items.length > 0 ? items : undefined
}

function statSliceItems(stats: AboutOrbStatFormValues[]) {
  const items = stats
    .map((st) => prune({ label: keep(st.label), value: keep(st.value), suffix: keep(st.suffix) }))
    .filter((st): st is NonNullable<typeof st> => st !== undefined)
  return items.length > 0 ? items : undefined
}

function orbSliceItem(orb: AboutOrbFormValues): AboutOrb {
  const linesArr = orb.linesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 8)

  return (
    prune({
      label: keep(orb.label),
      color: keep(orb.color),
      eyebrow: keep(orb.eyebrow),
      title: keep(orb.title),
      body: keep(orb.body),
      detail: keep(orb.detail),
      lines: linesArr.length > 0 ? linesArr : undefined,
      points: pointSliceItems(orb.points),
      stats: statSliceItems(orb.stats),
      primaryCta: keepCta(orb.primaryCtaLabel, orb.primaryCtaHref),
      secondaryCta: keepCta(orb.secondaryCtaLabel, orb.secondaryCtaHref),
      tagline: keep(orb.tagline),
      mediaId: keep(orb.mediaId),
    }) ?? {}
  )
}

/**
 * Form values → minimal CMS slice (blank fields dropped so the stored blob
 * only carries real overrides). Orbs are stored whenever any orb carries an
 * override or the count differs from the designed default — the CMS then owns
 * the list (add/remove/reorder). Validated against the page schema.
 */
export function toAboutContentSlice(values: AboutContentFormValues): AboutLandingContent {
  const orbItems = values.orbs.map((orb) => orbSliceItem(orb))
  const hasOrbOverride =
    orbItems.some((item) => Object.keys(item).length > 0) ||
    orbItems.length !== DEFAULT_ORB_COUNT

  const slice: AboutLandingContent = {
    hero: prune({
      eyebrow: keep(values.hero.eyebrow),
      headline: keep(values.hero.headline),
      subhead: keep(values.hero.subhead),
      primaryCta: keepCta(values.hero.primaryCtaLabel, values.hero.primaryCtaHref),
      secondaryCta: keepCta(values.hero.secondaryCtaLabel, values.hero.secondaryCtaHref),
      scrollCue: keep(values.hero.scrollCue),
    }),
    orbs: hasOrbOverride ? orbItems : undefined,
    marquee: prune({
      text: keep(values.marquee.text),
    }),
  }

  const pruned = prune(slice as Record<string, unknown>) ?? {}
  return aboutLandingContentSchema.parse(pruned)
}
