import {
  aboutLandingContentSchema,
  type AboutCta,
  type AboutHotspot,
  type AboutLandingContent,
  type AboutProcessStep,
  type AboutStat,
} from './aboutContent.schema'
import {
  ABOUT_DEFAULT_CONTENT,
  type AboutResolvedContent,
  type AboutResolvedCta,
  type AboutResolvedHotspot,
  type AboutResolvedProcessStep,
  type AboutResolvedStat,
} from './aboutContent.defaults'

/**
 * Merge the raw CMS slice over the code defaults into a fully-populated content
 * object — scene components never null-check. Blank/whitespace CMS values count
 * as "not set" so clearing a field in the editor restores the default copy.
 * Imagery is not part of this schema — it is resolved separately via
 * `resolveStorefrontPageAssets(assets, 'about', mediaIndex)`.
 */

function text(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && t.length > 0 ? t : fallback
}

function cta(cms: AboutCta | undefined, fallback: AboutResolvedCta): AboutResolvedCta {
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

function num(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function resolveHotspots(
  cms: AboutHotspot[] | undefined,
  fallback: AboutResolvedHotspot[],
): AboutResolvedHotspot[] {
  if (!cms || cms.length === 0) return fallback.map((h) => ({ ...h }))
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    return {
      id: def?.id ?? `hotspot-${i + 1}`,
      label: text(o.label, def?.label ?? ''),
      description: text(o.description, def?.description ?? ''),
      x: num(o.x, def?.x ?? 50),
      y: num(o.y, def?.y ?? 50),
    }
  })
}

function defaultStepAt(index: number, fallback: AboutResolvedProcessStep[]): AboutResolvedProcessStep {
  return (
    fallback[index] ?? {
      id: `step-${index + 1}`,
      eyebrow: String(index + 1).padStart(2, '0'),
      title: '',
      body: '',
      hotspots: [],
    }
  )
}

function processSteps(
  cms: AboutProcessStep[] | undefined,
  fallback: AboutResolvedProcessStep[],
): AboutResolvedProcessStep[] {
  if (!cms || cms.length === 0) return fallback.map((def) => ({ ...def, hotspots: def.hotspots.map((h) => ({ ...h })) }))
  return cms.map((o, i) => {
    const def = defaultStepAt(i, fallback)
    return {
      id: def.id,
      eyebrow: text(o.eyebrow, def.eyebrow),
      title: text(o.title, def.title),
      body: text(o.body, def.body),
      hotspots: resolveHotspots(o.hotspots, def.hotspots),
    }
  })
}

function defaultStatAt(index: number, fallback: AboutResolvedStat[]): AboutResolvedStat {
  return fallback[index] ?? { id: `stat-${index + 1}`, label: '', value: '', suffix: '' }
}

function stats(cms: AboutStat[] | undefined, fallback: AboutResolvedStat[]): AboutResolvedStat[] {
  if (!cms || cms.length === 0) return fallback.map((def) => ({ ...def }))
  return cms.map((o, i) => {
    const def = defaultStatAt(i, fallback)
    return {
      id: def.id,
      label: text(o.label, def.label),
      value: text(o.value, def.value),
      suffix: text(o.suffix, def.suffix),
    }
  })
}

export function resolveAboutContent(raw: unknown): AboutResolvedContent {
  const parsed = aboutLandingContentSchema.safeParse(raw)
  const cms: AboutLandingContent = parsed.success ? parsed.data : {}
  const d = ABOUT_DEFAULT_CONTENT

  return {
    hero: {
      eyebrow: text(cms.hero?.eyebrow, d.hero.eyebrow),
      headline: text(cms.hero?.headline, d.hero.headline),
      subhead: text(cms.hero?.subhead, d.hero.subhead),
      primaryCta: cta(cms.hero?.primaryCta, d.hero.primaryCta),
      secondaryCta: cta(cms.hero?.secondaryCta, d.hero.secondaryCta),
      scrollCue: text(cms.hero?.scrollCue, d.hero.scrollCue),
    },
    philosophy: {
      eyebrow: text(cms.philosophy?.eyebrow, d.philosophy.eyebrow),
      lines: lines(cms.philosophy?.lines, d.philosophy.lines),
    },
    process: {
      eyebrow: text(cms.process?.eyebrow, d.process.eyebrow),
      title: text(cms.process?.title, d.process.title),
      steps: processSteps(cms.process?.steps, d.process.steps),
    },
    stats: {
      eyebrow: text(cms.stats?.eyebrow, d.stats.eyebrow),
      title: text(cms.stats?.title, d.stats.title),
      items: stats(cms.stats?.items, d.stats.items),
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
