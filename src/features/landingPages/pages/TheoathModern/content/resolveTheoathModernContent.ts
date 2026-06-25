import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import { publicCmsMediaUrl } from '@/features/admin/cmsRemote/uploadCmsMedia'
import {
  theoathModernContentSchema,
  type TheoathModernContent,
  type TmCta,
  type TmBenefit,
  type TmCallout,
  type TmHotspot,
  type TmSpec,
} from './theoathModernContent.schema'
import {
  TM_DEFAULT_CONTENT,
  type TmResolvedBenefit,
  type TmResolvedCallout,
  type TmResolvedContent,
  type TmResolvedCta,
  type TmResolvedHotspot,
  type TmResolvedSpec,
} from './theoathModernContent.defaults'

/**
 * Merge the raw CMS slice over the code defaults into a fully-populated content
 * object. Blank/whitespace values count as "not set" so clearing a field in the
 * editor restores the designed default — identical contract to The Oath.
 */

function text(cms: string | undefined, fallback: string): string {
  const t = cms?.trim()
  return t && t.length > 0 ? t : fallback
}

function cta(cms: TmCta | undefined, fallback: TmResolvedCta): TmResolvedCta {
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

function resolveMediaUrl(
  mediaId: string | undefined,
  mediaIndex: MediaIndexEntry[] | undefined,
): string | undefined {
  if (!mediaId?.trim() || !mediaIndex?.length) return undefined
  const entry = mediaIndex.find((m) => m.id === mediaId.trim())
  const objectPath = entry?.path?.trim()
  if (!objectPath) return undefined
  return (
    publicCmsMediaUrl(objectPath) ??
    (objectPath.startsWith('/') ? objectPath : `/${objectPath}`)
  )
}

function hotspots(
  cms: TmHotspot[] | undefined,
  fallback: TmResolvedHotspot[],
): TmResolvedHotspot[] {
  if (!cms || cms.length === 0) return fallback
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    return {
      id: def?.id ?? `hotspot-${i + 1}`,
      label: text(o.label, def?.label ?? ''),
      line: text(o.line, def?.line ?? ''),
      x: num(o.x, def?.x ?? 50),
      y: num(o.y, def?.y ?? 50),
    }
  })
}

function benefits(
  cms: TmBenefit[] | undefined,
  fallback: TmResolvedBenefit[],
): TmResolvedBenefit[] {
  if (!cms || cms.length === 0) return fallback
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    const href = o.href?.trim()
    return {
      id: def?.id ?? `benefit-${i + 1}`,
      icon: text(o.icon, def?.icon ?? 'anvil'),
      heading: text(o.heading, def?.heading ?? ''),
      description: text(o.description, def?.description ?? ''),
      ...(href ? { href } : def?.href ? { href: def.href } : {}),
    }
  })
}

function specs(
  cms: TmSpec[] | undefined,
  fallback: TmResolvedSpec[],
): TmResolvedSpec[] {
  if (!cms || cms.length === 0) return fallback
  const kept = cms
    .map((o) => ({ label: o.label?.trim() ?? '', value: o.value?.trim() ?? '' }))
    .filter((o) => o.label.length > 0 || o.value.length > 0)
  return kept.length > 0 ? kept : fallback
}

function callouts(
  cms: TmCallout[] | undefined,
  fallback: TmResolvedCallout[],
  mediaIndex: MediaIndexEntry[] | undefined,
): TmResolvedCallout[] {
  if (!cms || cms.length === 0) return fallback
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    const mediaUrl = resolveMediaUrl(o.mediaId, mediaIndex)
    return {
      id: def?.id ?? `callout-${i + 1}`,
      label: text(o.label, def?.label ?? ''),
      line: text(o.line, def?.line ?? ''),
      ...(mediaUrl ? { mediaUrl } : def?.mediaUrl ? { mediaUrl: def.mediaUrl } : {}),
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

export type ResolveTheoathModernContentOptions = {
  mediaIndex?: MediaIndexEntry[]
}

export function resolveTheoathModernContent(
  raw: unknown,
  options: ResolveTheoathModernContentOptions = {},
): TmResolvedContent {
  const parsed = theoathModernContentSchema.safeParse(raw)
  const cms: TheoathModernContent = parsed.success ? parsed.data : {}
  const d = TM_DEFAULT_CONTENT
  const { mediaIndex } = options

  return {
    hero: {
      eyebrow: text(cms.hero?.eyebrow, d.hero.eyebrow),
      heading: text(cms.hero?.heading, d.hero.heading),
      highlightWords: strings(cms.hero?.highlightWords, d.hero.highlightWords),
      description: text(cms.hero?.description, d.hero.description),
      primaryCta: cta(cms.hero?.primaryCta, d.hero.primaryCta),
      secondaryCta: cta(cms.hero?.secondaryCta, d.hero.secondaryCta),
      scrollPrompt: text(cms.hero?.scrollPrompt, d.hero.scrollPrompt),
      heroProductSlug: text(cms.hero?.heroProductSlug, d.hero.heroProductSlug),
      sideIndex: strings(cms.hero?.sideIndex, d.hero.sideIndex),
      hotspots: hotspots(cms.hero?.hotspots, d.hero.hotspots),
      settings: {
        particleIntensity: num(
          cms.hero?.settings?.particleIntensity,
          d.hero.settings.particleIntensity,
        ),
        fogIntensity: num(cms.hero?.settings?.fogIntensity, d.hero.settings.fogIntensity),
        animationIntensity: num(
          cms.hero?.settings?.animationIntensity,
          d.hero.settings.animationIntensity,
        ),
        layoutAlign: cms.hero?.settings?.layoutAlign ?? d.hero.settings.layoutAlign,
        enable3d: cms.hero?.settings?.enable3d ?? d.hero.settings.enable3d,
      },
    },
    techKnit: {
      eyebrow: text(cms.techKnit?.eyebrow, d.techKnit.eyebrow),
      title: text(cms.techKnit?.title, d.techKnit.title),
      description: text(cms.techKnit?.description, d.techKnit.description),
      callouts: callouts(cms.techKnit?.callouts, d.techKnit.callouts, mediaIndex),
    },
    collection: {
      eyebrow: text(cms.collection?.eyebrow, d.collection.eyebrow),
      title: text(cms.collection?.title, d.collection.title),
      viewAllLabel: text(cms.collection?.viewAllLabel, d.collection.viewAllLabel),
      viewAllHref: d.collection.viewAllHref,
      heroProductSlug: text(cms.collection?.heroProductSlug, d.collection.heroProductSlug),
      taglines: taglines(cms.collection?.taglines, d.collection.taglines),
    },
    benefits: {
      eyebrow: text(cms.benefits?.eyebrow, d.benefits.eyebrow),
      title: text(cms.benefits?.title, d.benefits.title),
      items: benefits(cms.benefits?.items, d.benefits.items),
    },
    materials: {
      eyebrow: text(cms.materials?.eyebrow, d.materials.eyebrow),
      title: text(cms.materials?.title, d.materials.title),
      description: text(cms.materials?.description, d.materials.description),
      specs: specs(cms.materials?.specs, d.materials.specs),
      notes: strings(cms.materials?.notes, d.materials.notes),
    },
    conversion: {
      eyebrow: text(cms.conversion?.eyebrow, d.conversion.eyebrow),
      title: text(cms.conversion?.title, d.conversion.title),
      body: text(cms.conversion?.body, d.conversion.body),
      primaryCta: cta(cms.conversion?.primaryCta, d.conversion.primaryCta),
      secondaryCta: cta(cms.conversion?.secondaryCta, d.conversion.secondaryCta),
      tagline: text(cms.conversion?.tagline, d.conversion.tagline),
    },
  }
}
