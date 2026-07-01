import {
  aboutLandingContentSchema,
  type AboutLandingContent,
} from '@/features/about/content/aboutContent.schema'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'

/**
 * Form model for the About content editor (key `about`).
 *
 * The form is all flat strings (React Hook Form friendly); blank means "use
 * the code default" — defaults render as input placeholders, never as values,
 * so editors always see what they actually overrode. Conversion helpers map
 * form values ⇄ the Zod-validated CMS slice. Mirrors `landingContentForm.ts`.
 */

export interface AboutHotspotFormValues {
  label: string
  description: string
  /** % position over the construction image, as text. */
  x: string
  y: string
}

export interface AboutProcessStepFormValues {
  eyebrow: string
  title: string
  body: string
  hotspots: AboutHotspotFormValues[]
}

export interface AboutStatFormValues {
  label: string
  value: string
  suffix: string
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
  philosophy: {
    eyebrow: string
    /** One philosophy line per row (max 6). */
    linesText: string
  }
  process: {
    eyebrow: string
    title: string
    /** Fixed three: materials, construction, testing. */
    steps: AboutProcessStepFormValues[]
  }
  stats: {
    eyebrow: string
    title: string
    items: AboutStatFormValues[]
  }
  finale: {
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

const STEP_COUNT = ABOUT_DEFAULT_CONTENT.process.steps.length
const HOTSPOTS_PER_STEP = 3

function s(value: string | undefined): string {
  return value ?? ''
}

function blankHotspot(): AboutHotspotFormValues {
  return { label: '', description: '', x: '', y: '' }
}

function blankStat(): AboutStatFormValues {
  return { label: '', value: '', suffix: '' }
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toAboutFormValues(raw: unknown): AboutContentFormValues {
  const parsed = aboutLandingContentSchema.safeParse(raw)
  const cms: AboutLandingContent = parsed.success ? parsed.data : {}
  const cmsSteps = cms.process?.steps
  const cmsStats = cms.stats?.items

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
    philosophy: {
      eyebrow: s(cms.philosophy?.eyebrow),
      linesText: (cms.philosophy?.lines ?? []).join('\n'),
    },
    process: {
      eyebrow: s(cms.process?.eyebrow),
      title: s(cms.process?.title),
      steps: Array.from({ length: STEP_COUNT }, (_, i) => {
        const step = cmsSteps?.[i]
        const hsCount = Math.max(step?.hotspots?.length ?? 0, HOTSPOTS_PER_STEP)
        return {
          eyebrow: s(step?.eyebrow),
          title: s(step?.title),
          body: s(step?.body),
          hotspots: Array.from({ length: hsCount }, (_, h) => {
            const hs = step?.hotspots?.[h]
            return {
              label: s(hs?.label),
              description: s(hs?.description),
              x: typeof hs?.x === 'number' ? String(hs.x) : '',
              y: typeof hs?.y === 'number' ? String(hs.y) : '',
            }
          }),
        }
      }),
    },
    stats: {
      eyebrow: s(cms.stats?.eyebrow),
      title: s(cms.stats?.title),
      items:
        cmsStats && cmsStats.length > 0
          ? cmsStats.map((item) => ({
              label: s(item.label),
              value: s(item.value),
              suffix: s(item.suffix),
            }))
          : ABOUT_DEFAULT_CONTENT.stats.items.map(() => blankStat()),
    },
    finale: {
      eyebrow: s(cms.finale?.eyebrow),
      title: s(cms.finale?.title),
      body: s(cms.finale?.body),
      primaryCtaLabel: s(cms.finale?.primaryCta?.label),
      primaryCtaHref: s(cms.finale?.primaryCta?.href),
      secondaryCtaLabel: s(cms.finale?.secondaryCta?.label),
      secondaryCtaHref: s(cms.finale?.secondaryCta?.href),
      tagline: s(cms.finale?.tagline),
    },
  }
}

export function createBlankHotspotFormValues(): AboutHotspotFormValues {
  return blankHotspot()
}

export function createBlankStatFormValues(): AboutStatFormValues {
  return blankStat()
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

function keepNum(value: string): number | undefined {
  const t = value.trim()
  if (t.length === 0) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
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

function hotspotSliceItems(hotspots: AboutHotspotFormValues[]) {
  const items = hotspots
    .map((h) =>
      prune({
        label: keep(h.label),
        description: keep(h.description),
        x: keepNum(h.x),
        y: keepNum(h.y),
      }),
    )
    .filter((h): h is NonNullable<typeof h> => h !== undefined)
  return items.length > 0 ? items : undefined
}

function stepSliceItem(step: AboutProcessStepFormValues) {
  return prune({
    eyebrow: keep(step.eyebrow),
    title: keep(step.title),
    body: keep(step.body),
    hotspots: hotspotSliceItems(step.hotspots),
  })
}

function statSliceItem(stat: AboutStatFormValues) {
  return prune({
    label: keep(stat.label),
    value: keep(stat.value),
    suffix: keep(stat.suffix),
  })
}

/**
 * Form values → minimal CMS slice (blank fields dropped so the stored blob
 * only carries real overrides). Validated against the page schema.
 */
export function toAboutContentSlice(values: AboutContentFormValues): AboutLandingContent {
  const lines = values.philosophy.linesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6)

  const stepItems = values.process.steps.map((step) => stepSliceItem(step))
  const hasStepOverride = stepItems.some((item) => item && Object.keys(item).length > 0)

  const statItems = values.stats.items
    .map((stat) => statSliceItem(stat))
    .filter((item): item is NonNullable<typeof item> => item !== undefined)

  const slice: AboutLandingContent = {
    hero: prune({
      eyebrow: keep(values.hero.eyebrow),
      headline: keep(values.hero.headline),
      subhead: keep(values.hero.subhead),
      primaryCta: keepCta(values.hero.primaryCtaLabel, values.hero.primaryCtaHref),
      secondaryCta: keepCta(values.hero.secondaryCtaLabel, values.hero.secondaryCtaHref),
      scrollCue: keep(values.hero.scrollCue),
    }),
    philosophy: prune({
      eyebrow: keep(values.philosophy.eyebrow),
      lines: lines.length > 0 ? lines : undefined,
    }),
    process: hasStepOverride || keep(values.process.eyebrow) || keep(values.process.title)
      ? prune({
          eyebrow: keep(values.process.eyebrow),
          title: keep(values.process.title),
          steps: stepItems.map((item) => item ?? {}),
        })
      : undefined,
    stats:
      statItems.length > 0 || keep(values.stats.eyebrow) || keep(values.stats.title)
        ? prune({
            eyebrow: keep(values.stats.eyebrow),
            title: keep(values.stats.title),
            items: statItems.length > 0 ? statItems : undefined,
          })
        : undefined,
    finale: prune({
      eyebrow: keep(values.finale.eyebrow),
      title: keep(values.finale.title),
      body: keep(values.finale.body),
      primaryCta: keepCta(values.finale.primaryCtaLabel, values.finale.primaryCtaHref),
      secondaryCta: keepCta(values.finale.secondaryCtaLabel, values.finale.secondaryCtaHref),
      tagline: keep(values.finale.tagline),
    }),
  }

  const pruned = prune(slice as Record<string, unknown>) ?? {}
  return aboutLandingContentSchema.parse(pruned)
}
