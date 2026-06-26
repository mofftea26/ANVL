import {
  oathModernContentSchema,
  type OathModernContent,
  type OmCta,
  type OmPair,
} from './oathModernContent.schema'
import {
  OM_DEFAULT_CONTENT,
  type OmResolvedContent,
  type OmResolvedCta,
  type OmResolvedPair,
} from './oathModernContent.defaults'

/**
 * Merge the raw CMS slice over the code defaults into a fully-populated content
 * object. Blank/whitespace values count as "not set" so clearing a field in the
 * editor restores the designed default — identical contract to every other
 * code-owned landing page.
 */

function text(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && t.length > 0 ? t : fallback
}

function cta(cms: OmCta | undefined, fallback: OmResolvedCta): OmResolvedCta {
  return {
    label: text(cms?.label, fallback.label),
    href: text(cms?.href, fallback.href),
  }
}

function strings(cms: string[] | undefined, fallback: string[]): string[] {
  if (!cms) return fallback
  const kept = cms.map((l) => l.trim()).filter((l) => l.length > 0)
  return kept.length > 0 ? kept : fallback
}

function num(cms: number | undefined, fallback: number): number {
  return typeof cms === 'number' && Number.isFinite(cms) ? cms : fallback
}

/** Index-wise merge of label/line pairs; CMS overrides keep the default id. */
function pairs(
  cms: OmPair[] | undefined,
  fallback: OmResolvedPair[],
): OmResolvedPair[] {
  if (!cms || cms.length === 0) return fallback
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    return {
      id: def?.id ?? `item-${i + 1}`,
      label: text(o.label, def?.label ?? ''),
      line: text(o.line, def?.line ?? ''),
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

export function resolveOathModernContent(raw: unknown): OmResolvedContent {
  const parsed = oathModernContentSchema.safeParse(raw)
  const cms: OathModernContent = parsed.success ? parsed.data : {}
  const d = OM_DEFAULT_CONTENT

  return {
    threshold: {
      eyebrow: text(cms.threshold?.eyebrow, d.threshold.eyebrow),
      heading: text(cms.threshold?.heading, d.threshold.heading),
      highlightWords: strings(cms.threshold?.highlightWords, d.threshold.highlightWords),
      body: text(cms.threshold?.body, d.threshold.body),
      primaryCta: cta(cms.threshold?.primaryCta, d.threshold.primaryCta),
      secondaryCta: cta(cms.threshold?.secondaryCta, d.threshold.secondaryCta),
      scrollPrompt: text(cms.threshold?.scrollPrompt, d.threshold.scrollPrompt),
      heroProductSlug: text(cms.threshold?.heroProductSlug, d.threshold.heroProductSlug),
      settings: {
        particleIntensity: num(
          cms.threshold?.settings?.particleIntensity,
          d.threshold.settings.particleIntensity,
        ),
        fogIntensity: num(
          cms.threshold?.settings?.fogIntensity,
          d.threshold.settings.fogIntensity,
        ),
        animationIntensity: num(
          cms.threshold?.settings?.animationIntensity,
          d.threshold.settings.animationIntensity,
        ),
        layoutAlign: cms.threshold?.settings?.layoutAlign ?? d.threshold.settings.layoutAlign,
        enable3d: cms.threshold?.settings?.enable3d ?? d.threshold.settings.enable3d,
      },
    },
    pressure: {
      eyebrow: text(cms.pressure?.eyebrow, d.pressure.eyebrow),
      heading: text(cms.pressure?.heading, d.pressure.heading),
      body: text(cms.pressure?.body, d.pressure.body),
      vows: pairs(cms.pressure?.vows, d.pressure.vows),
    },
    formation: {
      eyebrow: text(cms.formation?.eyebrow, d.formation.eyebrow),
      heading: text(cms.formation?.heading, d.formation.heading),
      body: text(cms.formation?.body, d.formation.body),
      marks: pairs(cms.formation?.marks, d.formation.marks),
    },
    oath: {
      eyebrow: text(cms.oath?.eyebrow, d.oath.eyebrow),
      heading: text(cms.oath?.heading, d.oath.heading),
      lines: strings(cms.oath?.lines, d.oath.lines),
      attribution: text(cms.oath?.attribution, d.oath.attribution),
    },
    collection: {
      eyebrow: text(cms.collection?.eyebrow, d.collection.eyebrow),
      title: text(cms.collection?.title, d.collection.title),
      viewAllLabel: text(cms.collection?.viewAllLabel, d.collection.viewAllLabel),
      viewAllHref: d.collection.viewAllHref,
      heroProductSlug: text(cms.collection?.heroProductSlug, d.collection.heroProductSlug),
      taglines: taglines(cms.collection?.taglines, d.collection.taglines),
    },
    conversion: {
      eyebrow: text(cms.conversion?.eyebrow, d.conversion.eyebrow),
      title: text(cms.conversion?.title, d.conversion.title),
      body: text(cms.conversion?.body, d.conversion.body),
      primaryCta: cta(cms.conversion?.primaryCta, d.conversion.primaryCta),
      secondaryCta: cta(cms.conversion?.secondaryCta, d.conversion.secondaryCta),
      tagline: text(cms.conversion?.tagline, d.conversion.tagline),
      reassurances: strings(cms.conversion?.reassurances, d.conversion.reassurances),
    },
  }
}
