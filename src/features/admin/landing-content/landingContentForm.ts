import {
  oathLandingContentSchema,
  type OathLandingContent,
} from '@/features/landingPages/pages/TheOathLanding/content/oathContent.schema'
import { OATH_DEFAULT_CONTENT } from '@/features/landingPages/pages/TheOathLanding/content/oathContent.defaults'

/**
 * Form model for the Oath landing content editor (key `the-oath`).
 *
 * The form is all flat strings (React Hook Form friendly); blank means "use the
 * code default" — defaults render as input placeholders, never as values, so
 * editors always see what they actually overrode. Conversion helpers map form
 * values ⇄ the Zod-validated CMS slice.
 */

export interface OathHotspotFormValues {
  label: string
  description: string
  bubbleId: string
  /** % position over the product viewer, as text. */
  x: string
  y: string
}

export interface OathTenetFormValues {
  title: string
  subtitle: string
  line: string
  marker: string
  mediaId: string
  /** Product 3D model (.glb) media id. */
  modelId: string
  /** Smokey background media id. */
  bgId: string
  hotspots: OathHotspotFormValues[]
}

export interface OathTaglineFormValues {
  slug: string
  line: string
}

export interface OathContentFormValues {
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
  manifesto: {
    eyebrow: string
    /** One manifesto line per row (max 6). */
    linesText: string
  }
  tenets: {
    eyebrow: string
    items: OathTenetFormValues[]
  }
  products: {
    eyebrow: string
    title: string
    viewAllLabel: string
    taglines: OathTaglineFormValues[]
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

const DEFAULT_TENET_COUNT = OATH_DEFAULT_CONTENT.tenets.items.length

function s(value: string | undefined): string {
  return value ?? ''
}

const HOTSPOTS_PER_PRODUCT = 3

function blankHotspot(): OathHotspotFormValues {
  return { label: '', description: '', bubbleId: '', x: '', y: '' }
}

function defaultTenetFormValues(): OathTenetFormValues {
  return {
    title: '',
    subtitle: '',
    line: '',
    marker: '',
    mediaId: '',
    modelId: '',
    bgId: '',
    hotspots: Array.from({ length: HOTSPOTS_PER_PRODUCT }, blankHotspot),
  }
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toOathFormValues(raw: unknown): OathContentFormValues {
  const parsed = oathLandingContentSchema.safeParse(raw)
  const cms: OathLandingContent = parsed.success ? parsed.data : {}
  const cmsItems = cms.tenets?.items
  const tenetCount =
    cmsItems && cmsItems.length > 0 ? cmsItems.length : DEFAULT_TENET_COUNT

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
    manifesto: {
      eyebrow: s(cms.manifesto?.eyebrow),
      linesText: (cms.manifesto?.lines ?? []).join('\n'),
    },
    tenets: {
      eyebrow: s(cms.tenets?.eyebrow),
      items: Array.from({ length: tenetCount }, (_, i) => {
        const item = cmsItems?.[i]
        const hsCount = Math.max(item?.hotspots?.length ?? 0, HOTSPOTS_PER_PRODUCT)
        return {
          title: s(item?.title),
          subtitle: s(item?.subtitle),
          line: s(item?.line),
          marker: s(item?.marker),
          mediaId: s(item?.mediaId),
          modelId: s(item?.modelId),
          bgId: s(item?.bgId),
          hotspots: Array.from({ length: hsCount }, (_, h) => {
            const hs = item?.hotspots?.[h]
            return {
              label: s(hs?.label),
              description: s(hs?.description),
              bubbleId: s(hs?.bubbleId),
              x: typeof hs?.x === 'number' ? String(hs.x) : '',
              y: typeof hs?.y === 'number' ? String(hs.y) : '',
            }
          }),
        }
      }),
    },
    products: {
      eyebrow: s(cms.products?.eyebrow),
      title: s(cms.products?.title),
      viewAllLabel: s(cms.products?.viewAllLabel),
      taglines: Object.entries(cms.products?.taglines ?? {}).map(
        ([slug, line]) => ({ slug, line }),
      ),
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

export function createBlankTenetFormValues(): OathTenetFormValues {
  return defaultTenetFormValues()
}

function keep(value: string): string | undefined {
  const t = value.trim()
  return t.length > 0 ? t : undefined
}

function keepCta(
  label: string,
  href: string,
): { label?: string; href?: string } | undefined {
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

function tenetMediaIdField(
  value: string,
  previousMediaId: string | undefined,
): string | undefined {
  const current = value.trim()
  if (current.length > 0) return current
  const hadMedia = (previousMediaId?.trim().length ?? 0) > 0
  // Persist explicit clears so hydration + storefront do not restore legacy slots.
  if (hadMedia) return ''
  return undefined
}

function keepNum(value: string): number | undefined {
  const t = value.trim()
  if (t.length === 0) return undefined
  const n = Number(t)
  return Number.isFinite(n) ? n : undefined
}

function hotspotSliceItems(hotspots: OathHotspotFormValues[]) {
  const items = hotspots
    .map((h) =>
      prune({
        label: keep(h.label),
        description: keep(h.description),
        bubbleId: keep(h.bubbleId),
        x: keepNum(h.x),
        y: keepNum(h.y),
      }),
    )
    .filter((h): h is NonNullable<typeof h> => h !== undefined)
  return items.length > 0 ? items : undefined
}

function tenetSliceItem(
  t: OathTenetFormValues,
  previousMediaId: string | undefined,
) {
  const mediaId = tenetMediaIdField(t.mediaId, previousMediaId)
  const item = prune({
    title: keep(t.title),
    subtitle: keep(t.subtitle),
    line: keep(t.line),
    marker: keep(t.marker),
    mediaId,
    modelId: keep(t.modelId),
    bgId: keep(t.bgId),
    hotspots: hotspotSliceItems(t.hotspots),
  })
  if (item) return item
  if (mediaId === '') return { mediaId: '' }
  return {}
}

/**
 * Form values → minimal CMS slice (blank fields dropped so the stored blob only
 * carries real overrides). Validated against the page schema — throws on
 * structurally invalid content (never expected from this form).
 */
export function toOathContentSlice(
  values: OathContentFormValues,
  previousRaw?: unknown,
): OathLandingContent {
  const previous = oathLandingContentSchema.safeParse(previousRaw)
  const previousItems = previous.success ? previous.data.tenets?.items : undefined

  const lines = values.manifesto.linesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6)

  const tenetItems = values.tenets.items.map((t, i) =>
    tenetSliceItem(t, previousItems?.[i]?.mediaId),
  )
  const hasTenetOverride =
    keep(values.tenets.eyebrow) !== undefined ||
    tenetItems.some((item) => Object.keys(item).length > 0) ||
    tenetItems.length !== DEFAULT_TENET_COUNT

  const taglines: Record<string, string> = {}
  for (const { slug, line } of values.products.taglines) {
    const cleanSlug = keep(slug)
    const cleanLine = keep(line)
    if (cleanSlug && cleanLine) taglines[cleanSlug] = cleanLine
  }

  const slice: OathLandingContent = {
    hero: prune({
      eyebrow: keep(values.hero.eyebrow),
      headline: keep(values.hero.headline),
      subhead: keep(values.hero.subhead),
      primaryCta: keepCta(values.hero.primaryCtaLabel, values.hero.primaryCtaHref),
      secondaryCta: keepCta(
        values.hero.secondaryCtaLabel,
        values.hero.secondaryCtaHref,
      ),
      scrollCue: keep(values.hero.scrollCue),
    }),
    manifesto: prune({
      eyebrow: keep(values.manifesto.eyebrow),
      lines: lines.length > 0 ? lines : undefined,
    }),
    tenets: hasTenetOverride
      ? prune({
          eyebrow: keep(values.tenets.eyebrow),
          items: tenetItems,
        })
      : undefined,
    products: prune({
      eyebrow: keep(values.products.eyebrow),
      title: keep(values.products.title),
      viewAllLabel: keep(values.products.viewAllLabel),
      taglines: Object.keys(taglines).length > 0 ? taglines : undefined,
    }),
    finale: prune({
      eyebrow: keep(values.finale.eyebrow),
      title: keep(values.finale.title),
      body: keep(values.finale.body),
      primaryCta: keepCta(values.finale.primaryCtaLabel, values.finale.primaryCtaHref),
      secondaryCta: keepCta(
        values.finale.secondaryCtaLabel,
        values.finale.secondaryCtaHref,
      ),
      tagline: keep(values.finale.tagline),
    }),
  }

  const pruned = prune(slice as Record<string, unknown>) ?? {}
  return oathLandingContentSchema.parse(pruned)
}
