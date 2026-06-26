import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import { publicCmsMediaUrl } from '@/features/admin/cmsRemote/uploadCmsMedia'
import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import {
  oathLandingContentSchema,
  type OathCta,
  type OathHotspot,
  type OathLandingContent,
  type OathTenet,
} from './oathContent.schema'
import {
  OATH_DEFAULT_CONTENT,
  type OathResolvedContent,
  type OathResolvedCta,
  type OathResolvedHotspot,
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

function resolveMediaId(
  mediaId: string | undefined,
  mediaIndex: MediaIndexEntry[] | undefined,
): string | undefined {
  if (!mediaId?.trim() || !mediaIndex?.length) return undefined
  const entry = mediaIndex.find((m) => m.id === mediaId.trim())
  const objectPath = entry?.path?.trim()
  if (!objectPath) return undefined
  const url = publicCmsMediaUrl(objectPath)
  if (url) return url
  return objectPath.startsWith('/') ? objectPath : `/${objectPath}`
}

function num(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function resolveHotspots(
  cms: OathHotspot[] | undefined,
  fallback: OathResolvedHotspot[],
  mediaIndex: MediaIndexEntry[] | undefined,
): OathResolvedHotspot[] {
  if (!cms || cms.length === 0) return fallback.map((h) => ({ ...h }))
  return cms.map((o, i) => {
    const def = fallback[i] ?? fallback[fallback.length - 1]
    const bubbleUrl = resolveMediaId(o.bubbleId, mediaIndex) ?? def?.bubbleUrl
    return {
      id: def?.id ?? `hotspot-${i + 1}`,
      label: text(o.label, def?.label ?? ''),
      description: text(o.description, def?.description ?? ''),
      x: num(o.x, def?.x ?? 50),
      y: num(o.y, def?.y ?? 50),
      ...(bubbleUrl ? { bubbleUrl } : {}),
    }
  })
}

function legacyTenetMediaUrl(
  position: number,
  legacyAssets: ResolvedDropAssets | undefined,
): string | undefined {
  const key = `chapterMedia${position}`
  const value = legacyAssets?.[key]
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

function defaultTenetAt(index: number, fallback: OathResolvedTenet[]): OathResolvedTenet {
  const def = fallback[index]
  if (def) return def
  const tones = fallback.map((t) => t.tone)
  return {
    id: `product-${index + 1}`,
    index: String(index + 1).padStart(2, '0'),
    title: `Piece ${index + 1}`,
    subtitle: '',
    line: '',
    marker: 'Piece',
    tone: tones[index % tones.length] ?? '#15171a',
    hotspots: [],
  }
}

function resolveTenetMediaUrl(
  cmsItem: OathTenet | undefined,
  position: number,
  mediaIndex: MediaIndexEntry[] | undefined,
  legacyAssets: ResolvedDropAssets | undefined,
  cmsOwnsRow: boolean,
): string | undefined {
  if (cmsOwnsRow) {
    if (cmsItem && 'mediaId' in cmsItem) {
      return resolveMediaId(cmsItem.mediaId, mediaIndex)
    }
    return undefined
  }
  return (
    resolveMediaId(cmsItem?.mediaId, mediaIndex) ??
    legacyTenetMediaUrl(position, legacyAssets)
  )
}

function tenets(
  cms: OathLandingContent['tenets'],
  fallback: OathResolvedTenet[],
  mediaIndex: MediaIndexEntry[] | undefined,
  legacyAssets: ResolvedDropAssets | undefined,
): OathResolvedTenet[] {
  const cmsItems = cms?.items
  if (!cmsItems || cmsItems.length === 0) {
    return fallback.map((def, i) => {
      const mediaUrl = legacyTenetMediaUrl(i + 1, legacyAssets)
      return mediaUrl ? { ...def, mediaUrl } : def
    })
  }

  const cmsOwnsRows = true

  const build = (
    o: OathTenet | undefined,
    def: OathResolvedTenet,
    position: number,
    indexLabel: string,
  ): OathResolvedTenet => {
    const mediaUrl = resolveTenetMediaUrl(o, position, mediaIndex, legacyAssets, cmsOwnsRows)
    const modelUrl = resolveMediaId(o?.modelId, mediaIndex) ?? def.modelUrl
    const bgUrl = resolveMediaId(o?.bgId, mediaIndex) ?? def.bgUrl
    return {
      id: def.id,
      index: indexLabel,
      title: text(o?.title, def.title),
      subtitle: text(o?.subtitle, def.subtitle),
      line: text(o?.line, def.line),
      marker: text(o?.marker, def.marker),
      tone: def.tone,
      hotspots: resolveHotspots(o?.hotspots, def.hotspots, mediaIndex),
      ...(mediaUrl ? { mediaUrl } : {}),
      ...(modelUrl ? { modelUrl } : {}),
      ...(bgUrl ? { bgUrl } : {}),
    }
  }

  if (cmsItems.length === fallback.length) {
    return fallback.map((def, i) => build(cmsItems[i], def, i + 1, def.index))
  }

  return cmsItems.map((o, i) =>
    build(o, defaultTenetAt(i, fallback), i + 1, String(i + 1).padStart(2, '0')),
  )
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

export type ResolveOathContentOptions = {
  mediaIndex?: MediaIndexEntry[]
  /** Pre-migration fallback for `chapterMedia*` slot assignments. */
  legacyAssets?: ResolvedDropAssets
}

export function resolveOathContent(
  raw: unknown,
  options: ResolveOathContentOptions = {},
): OathResolvedContent {
  const parsed = oathLandingContentSchema.safeParse(raw)
  const cms: OathLandingContent = parsed.success ? parsed.data : {}
  const d = OATH_DEFAULT_CONTENT
  const { mediaIndex, legacyAssets } = options

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
      items: tenets(cms.tenets, d.tenets.items, mediaIndex, legacyAssets),
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
