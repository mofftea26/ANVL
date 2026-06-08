/**
 * Asset registry + fallback system for The Oath landing.
 *
 * CMS-resolved assets override code defaults when set in the admin Assets editor.
 * Missing media falls back to a duotone gradient plane with the Drop 01 logo
 * placeholder (via {@link MediaPlane}) — the page never breaks on a missing file.
 */

import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import type { LandingPageThemedMarkups } from '@/features/landingPages/types'
import {
  criticalLandingAssetUrls,
  resolveLoadingEmblemUrl,
} from '@/features/landingPages/landingEntryLoad'

export interface OathAssetConfig {
  dropLogo?: string
  anvlWordmark?: string
  crestSvg?: string
  heroMedia?: string
  heroPoster?: string
  manifestoMedia?: string
  chapterMedia?: Record<string, string>
  metalTexture?: string
  noiseTexture?: string
  productImages?: Record<string, string>
}

export const OATH_LOGO_PLACEHOLDER = '/brand/the-oath-shape.svg'

export const OATH_ASSETS: OathAssetConfig = {
  dropLogo: '/brand/the-oath-shape.svg',
  anvlWordmark: '/brand/wordmark.svg',
  crestSvg: undefined,
  heroMedia: undefined,
  heroPoster: undefined,
  manifestoMedia: undefined,
  chapterMedia: {},
  metalTexture: undefined,
  noiseTexture: undefined,
  productImages: {},
}

let cmsResolvedAssets: ResolvedDropAssets = {}
let cmsThemedMarkups: LandingPageThemedMarkups = {}

export function bindOathCmsAssets(assets: ResolvedDropAssets): void {
  cmsResolvedAssets = assets
}

export function bindOathCmsThemedMarkups(markups: LandingPageThemedMarkups): void {
  cmsThemedMarkups = markups
}

export function oathThemedMarkup(
  key: keyof LandingPageThemedMarkups,
): string | null {
  return cmsThemedMarkups[key] ?? null
}

function cmsOrDefault(key: string, fallback?: string): string | undefined {
  const cms = cmsResolvedAssets[key]
  if (typeof cms === 'string' && cms.length > 0) return cms
  return fallback
}

export function oathAsset<K extends keyof OathAssetConfig>(
  key: K,
): OathAssetConfig[K] {
  if (key === 'chapterMedia' || key === 'productImages') {
    return OATH_ASSETS[key]
  }
  return cmsOrDefault(key, OATH_ASSETS[key] as string | undefined) as OathAssetConfig[K]
}

export function oathSceneMedia(
  key: 'heroMedia' | 'manifestoMedia',
): string | undefined {
  return cmsOrDefault(key, OATH_ASSETS[key])
}

export function oathChapterMedia(id: string): string | undefined {
  return OATH_ASSETS.chapterMedia?.[id]
}

export function oathProductImage(slug: string): string | undefined {
  return cmsOrDefault(`productImages.${slug}`, OATH_ASSETS.productImages?.[slug])
}

export function oathDropLogo(): string {
  return oathAsset('dropLogo') ?? OATH_LOGO_PLACEHOLDER
}

export function oathCrestEmblem(): string {
  return oathAsset('crestSvg') ?? oathDropLogo()
}

export function duotonePlaceholder(tone = '#1a1c1f'): string {
  return `linear-gradient(155deg, ${tone} 0%, #0b0b0c 80%)`
}

export function oathLoadingEmblem(): string {
  return resolveLoadingEmblemUrl(cmsResolvedAssets)
}

export function criticalOathAssets(): string[] {
  return criticalLandingAssetUrls(cmsResolvedAssets)
}
