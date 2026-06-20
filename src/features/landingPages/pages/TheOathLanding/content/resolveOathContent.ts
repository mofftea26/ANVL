import {
  oathLandingContentSchema,
  type OathCta,
  type OathLandingContent,
} from './oathContent.schema'
import {
  OATH_DEFAULT_CONTENT,
  type OathResolvedContent,
  type OathResolvedCta,
  type OathResolvedTenet,
} from './oathContent.defaults'

/**
 * Merge the raw CMS slice over the code defaults into a fully-populated content
 * object — scene components never null-check. Blank/whitespace CMS values count
 * as "not set" so clearing a field in the editor restores the default copy.
 */

function text(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && t.length > 0 ? t : fallback
}

function cta(cms: OathCta | undefined, fallback: OathResolvedCta): OathResolvedCta {
  return {
    label: text(cms?.label, fallback.label),
    href: text(cms?.href, fallback.href),
  }
}

function lines(cms: string[] | undefined, fallback: string[]): string[] {
  if (!cms) return fallback
  const kept = cms.map((l) => l.trim()).filter((l) => l.length > 0)
  return kept.length > 0 ? kept : fallback
}

function tenets(
  cms: OathLandingContent['tenets'],
  fallback: OathResolvedTenet[],
): OathResolvedTenet[] {
  const overrides = cms?.items ?? []
  return fallback.map((def, i) => {
    const o = overrides[i]
    return {
      ...def,
      title: text(o?.title, def.title),
      line: text(o?.line, def.line),
      marker: text(o?.marker, def.marker),
    }
  })
}

function taglines(
  cms: Record<string, string> | undefined,
  fallback: Record<string, string>,
): Record<string, string> {
  if (!cms) return fallback
  const merged: Record<string, string> = { ...fallback }
  for (const [slug, line] of Object.entries(cms)) {
    const t = line.trim()
    if (t.length > 0) merged[slug] = t
  }
  return merged
}

export function resolveOathContent(raw: unknown): OathResolvedContent {
  const parsed = oathLandingContentSchema.safeParse(raw)
  const cms: OathLandingContent = parsed.success ? parsed.data : {}
  const d = OATH_DEFAULT_CONTENT

  return {
    hero: {
      eyebrow: text(cms.hero?.eyebrow, d.hero.eyebrow),
      headline: text(cms.hero?.headline, d.hero.headline),
      subhead: text(cms.hero?.subhead, d.hero.subhead),
      primaryCta: cta(cms.hero?.primaryCta, d.hero.primaryCta),
      secondaryCta: cta(cms.hero?.secondaryCta, d.hero.secondaryCta),
      scrollCue: text(cms.hero?.scrollCue, d.hero.scrollCue),
    },
    manifesto: {
      eyebrow: text(cms.manifesto?.eyebrow, d.manifesto.eyebrow),
      lines: lines(cms.manifesto?.lines, d.manifesto.lines),
    },
    tenets: {
      eyebrow: text(cms.tenets?.eyebrow, d.tenets.eyebrow),
      items: tenets(cms.tenets, d.tenets.items),
    },
    products: {
      eyebrow: text(cms.products?.eyebrow, d.products.eyebrow),
      title: text(cms.products?.title, d.products.title),
      viewAllLabel: text(cms.products?.viewAllLabel, d.products.viewAllLabel),
      viewAllHref: d.products.viewAllHref,
      taglines: taglines(cms.products?.taglines, d.products.taglines),
    },
    finale: {
      eyebrow: text(cms.finale?.eyebrow, d.finale.eyebrow),
      title: text(cms.finale?.title, d.finale.title),
      body: text(cms.finale?.body, d.finale.body),
      primaryCta: cta(cms.finale?.primaryCta, d.finale.primaryCta),
      secondaryCta: cta(cms.finale?.secondaryCta, d.finale.secondaryCta),
      tagline: text(cms.finale?.tagline, d.finale.tagline),
    },
  }
}
