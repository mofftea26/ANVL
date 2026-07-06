import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import { resolveMediaUrl } from '@/features/cms/assets/resolvePublishedAssets'
import {
  aboutLandingContentSchema,
  type AboutCta,
  type AboutLandingContent,
  type AboutOrb,
  type AboutPoint,
  type AboutStat,
} from './aboutContent.schema'
import {
  ABOUT_DEFAULT_CONTENT,
  ABOUT_ORB_FALLBACK_COLORS,
  type AboutResolvedContent,
  type AboutResolvedCta,
  type AboutResolvedOrb,
  type AboutResolvedPoint,
  type AboutResolvedStat,
} from './aboutContent.defaults'

/**
 * Merge the raw CMS slice over the code defaults into a fully-populated
 * content object — components never null-check. Blank/whitespace CMS values
 * count as "not set" so clearing a field in the editor restores the default.
 *
 * Orbs follow The Oath's tenets contract: no CMS orbs → the seven designed
 * defaults; a CMS array of the same length merges positionally (blank fields
 * fall back per orb); a different length means the CMS owns the list —
 * add/remove/reorder — with positional defaults filling what they can.
 */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/

function text(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && t.length > 0 ? t : fallback
}

function color(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && HEX_COLOR.test(t) ? t : fallback
}

function lines(cms: string[] | undefined, fallback: string[]): string[] {
  if (!cms) return fallback
  const kept = cms.map((l) => l.trim()).filter((l) => l.length > 0)
  return kept.length > 0 ? kept : fallback
}

function cta(
  cms: AboutCta | undefined,
  fallback: AboutResolvedCta | undefined,
): AboutResolvedCta | undefined {
  const label = text(cms?.label, fallback?.label ?? '')
  const href = text(cms?.href, fallback?.href ?? '')
  if (!label || !href) return fallback ? { ...fallback } : undefined
  return { label, href }
}

function points(cms: AboutPoint[] | undefined, fallback: AboutResolvedPoint[]): AboutResolvedPoint[] {
  if (!cms || cms.length === 0) return fallback.map((p) => ({ ...p }))
  return cms
    .map((o, i) => {
      const def = fallback[i]
      return {
        label: text(o.label, def?.label ?? ''),
        description: text(o.description, def?.description ?? ''),
      }
    })
    .filter((p) => p.label.length > 0 || p.description.length > 0)
}

function stats(cms: AboutStat[] | undefined, fallback: AboutResolvedStat[]): AboutResolvedStat[] {
  if (!cms || cms.length === 0) return fallback.map((s) => ({ ...s }))
  return cms
    .map((o, i) => {
      const def = fallback[i]
      return {
        id: def?.id ?? `stat-${i + 1}`,
        label: text(o.label, def?.label ?? ''),
        value: text(o.value, def?.value ?? ''),
        suffix: text(o.suffix, def?.suffix ?? ''),
      }
    })
    .filter((s) => s.value.length > 0 || s.label.length > 0)
}

function defaultOrbAt(index: number, fallback: AboutResolvedOrb[]): AboutResolvedOrb {
  const def = fallback[index]
  if (def) return def
  return {
    id: `orb-${index + 1}`,
    label: `Orb ${index + 1}`,
    color: ABOUT_ORB_FALLBACK_COLORS[index % ABOUT_ORB_FALLBACK_COLORS.length]!,
    eyebrow: '',
    title: `Orb ${index + 1}`,
    body: '',
    detail: '',
    lines: [],
    points: [],
    stats: [],
    tagline: '',
  }
}

function orbs(
  cms: AboutOrb[] | undefined,
  fallback: AboutResolvedOrb[],
  mediaIndex: MediaIndexEntry[] | undefined,
): AboutResolvedOrb[] {
  if (!cms || cms.length === 0) {
    return fallback.map((def) => ({
      ...def,
      lines: [...def.lines],
      points: def.points.map((p) => ({ ...p })),
      stats: def.stats.map((s) => ({ ...s })),
      ...(def.primaryCta ? { primaryCta: { ...def.primaryCta } } : {}),
      ...(def.secondaryCta ? { secondaryCta: { ...def.secondaryCta } } : {}),
    }))
  }

  return cms.map((o, i) => {
    const def = defaultOrbAt(i, fallback)
    const image = mediaIndex ? resolveMediaUrl(o.mediaId?.trim() || undefined, mediaIndex) : undefined
    const primaryCta = cta(o.primaryCta, def.primaryCta)
    const secondaryCta = cta(o.secondaryCta, def.secondaryCta)
    return {
      id: def.id,
      label: text(o.label, def.label),
      color: color(o.color, def.color),
      eyebrow: text(o.eyebrow, def.eyebrow),
      title: text(o.title, def.title),
      body: text(o.body, def.body),
      detail: text(o.detail, def.detail),
      lines: lines(o.lines, def.lines),
      points: points(o.points, def.points),
      stats: stats(o.stats, def.stats),
      ...(primaryCta ? { primaryCta } : {}),
      ...(secondaryCta ? { secondaryCta } : {}),
      tagline: text(o.tagline, def.tagline),
      ...(image ? { image } : {}),
      ...(def.imageSlot ? { imageSlot: def.imageSlot } : {}),
    }
  })
}

export interface ResolveAboutContentOptions {
  mediaIndex?: MediaIndexEntry[]
}

export function resolveAboutContent(
  raw: unknown,
  options: ResolveAboutContentOptions = {},
): AboutResolvedContent {
  const parsed = aboutLandingContentSchema.safeParse(raw)
  const cms: AboutLandingContent = parsed.success ? parsed.data : {}
  const d = ABOUT_DEFAULT_CONTENT

  return {
    hero: {
      eyebrow: text(cms.hero?.eyebrow, d.hero.eyebrow),
      headline: text(cms.hero?.headline, d.hero.headline),
      subhead: text(cms.hero?.subhead, d.hero.subhead),
      primaryCta: cta(cms.hero?.primaryCta, d.hero.primaryCta) ?? { ...d.hero.primaryCta },
      secondaryCta: cta(cms.hero?.secondaryCta, d.hero.secondaryCta) ?? { ...d.hero.secondaryCta },
      scrollCue: text(cms.hero?.scrollCue, d.hero.scrollCue),
    },
    orbs: orbs(cms.orbs, d.orbs, options.mediaIndex),
    marquee: {
      text: text(cms.marquee?.text, d.marquee.text),
    },
  }
}

/** An orb's display image: its own CMS upload wins, else its page-slot default. */
export function orbImage(
  orb: AboutResolvedOrb,
  assets: Record<string, string | undefined>,
): string | undefined {
  return orb.image ?? (orb.imageSlot ? assets[orb.imageSlot] : undefined)
}
