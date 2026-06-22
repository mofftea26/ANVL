import type { MediaIndexEntry } from '@/features/admin/media/mediaAssets.types'
import { publicCmsMediaUrl } from '@/features/admin/cmsRemote/uploadCmsMedia'
import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import {
  oathLandingContentSchema,
  type OathCta,
  type OathLandingContent,
  type OathTenet,
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
    id: `tenet-${index + 1}`,
    index: String(index + 1).padStart(2, '0'),
    title: `Vow ${index + 1}`,
    line: '',
    marker: 'Vow',
    tone: tones[index % tones.length] ?? '#15171a',
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

  if (cmsItems.length === fallback.length) {
    return fallback.map((def, i) => {
      const o = cmsItems[i]
      const mediaUrl = resolveTenetMediaUrl(
        o,
        i + 1,
        mediaIndex,
        legacyAssets,
        cmsOwnsRows,
      )
      return {
        id: def.id,
        index: def.index,
        title: text(o?.title, def.title),
        line: text(o?.line, def.line),
        marker: text(o?.marker, def.marker),
        tone: def.tone,
        ...(mediaUrl ? { mediaUrl } : {}),
      }
    })
  }

  return cmsItems.map((o, i) => {
    const def = defaultTenetAt(i, fallback)
    const mediaUrl = resolveTenetMediaUrl(
      o,
      i + 1,
      mediaIndex,
      legacyAssets,
      cmsOwnsRows,
    )
    return {
      id: def.id,
      index: String(i + 1).padStart(2, '0'),
      title: text(o?.title, def.title),
      line: text(o?.line, def.line),
      marker: text(o?.marker, def.marker),
      tone: def.tone,
      ...(mediaUrl ? { mediaUrl } : {}),
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
