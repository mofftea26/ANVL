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

export interface OathTenetFormValues {
  title: string
  line: string
  marker: string
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

const TENET_COUNT = OATH_DEFAULT_CONTENT.tenets.items.length

function s(value: string | undefined): string {
  return value ?? ''
}

/** Stored CMS slice (raw) → editable form values ('' = not overridden). */
export function toOathFormValues(raw: unknown): OathContentFormValues {
  const parsed = oathLandingContentSchema.safeParse(raw)
  const cms: OathLandingContent = parsed.success ? parsed.data : {}

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
      items: Array.from({ length: TENET_COUNT }, (_, i) => ({
        title: s(cms.tenets?.items?.[i]?.title),
        line: s(cms.tenets?.items?.[i]?.line),
        marker: s(cms.tenets?.items?.[i]?.marker),
      })),
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

/**
 * Form values → minimal CMS slice (blank fields dropped so the stored blob only
 * carries real overrides). Validated against the page schema — throws on
 * structurally invalid content (never expected from this form).
 */
export function toOathContentSlice(
  values: OathContentFormValues,
): OathLandingContent {
  const lines = values.manifesto.linesText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
    .slice(0, 6)

  const tenets = values.tenets.items.map((t) =>
    prune({ title: keep(t.title), line: keep(t.line), marker: keep(t.marker) }),
  )
  const hasTenetOverride = tenets.some((t) => t !== undefined)

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
    tenets: prune({
      eyebrow: keep(values.tenets.eyebrow),
      items: hasTenetOverride
        ? values.tenets.items.map((t) => ({
            ...(keep(t.title) ? { title: keep(t.title) } : {}),
            ...(keep(t.line) ? { line: keep(t.line) } : {}),
            ...(keep(t.marker) ? { marker: keep(t.marker) } : {}),
          }))
        : undefined,
    }),
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
