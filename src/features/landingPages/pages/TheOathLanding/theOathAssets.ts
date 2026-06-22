/**
 * Asset registry + fallback system for Drop 01 — The Oath (key `the-oath`).
 *
 * CMS-resolved assets override code defaults when set in the admin Assets
 * editor. Missing media falls back to a duotone gradient plane with the drop
 * mark (via {@link OathMediaFallback}) in the DOM and a procedural texture /
 * the void in WebGL — the page never breaks on a missing file. The 3D emblem
 * extrudes the `dropLogo` SVG; the cursor spotlight reveals `heroRevealMedia`.
 */

import type { ResolvedDropAssets } from '@/features/cms/assets/resolvePublishedAssets'
import type { LandingPageThemedMarkups } from '@/features/landingPages/types'
import {
  criticalLandingAssetUrls,
  resolveLoadingEmblemUrl,
} from '@/features/landingPages/landingEntryLoad'

export type OathHeroMediaMode = 'video' | 'image'

export const DEFAULT_HERO_VIDEO = '/videos/WarriorHero1.mp4'
export const OATH_LOGO_PLACEHOLDER = '/brand/the-oath-shape.svg'

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

function cmsAsset(key: string): string | undefined {
  const value = cmsResolvedAssets[key]
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed.length > 0 ? trimmed : undefined
}

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
}

/* — Brand marks ——————————————————————————————————————————————— */

export function oathDropLogo(): string {
  return cmsAsset('dropLogo') ?? OATH_LOGO_PLACEHOLDER
}

export function oathCrestEmblem(): string {
  return cmsAsset('crestSvg') ?? oathDropLogo()
}

/* — Hero media ————————————————————————————————————————————————— */

export function oathHeroMediaMode(): OathHeroMediaMode {
  const mode = cmsResolvedAssets.heroMediaMode
  if (mode === 'image' || mode === 'video') return mode

  const legacy = cmsResolvedAssets.heroMedia?.trim()
  if (legacy && !isVideoUrl(legacy)) return 'image'
  if (cmsResolvedAssets.heroImage?.trim()) return 'image'
  return 'video'
}

export function oathHeroImage(): string | undefined {
  const assigned = cmsResolvedAssets.heroImage?.trim()
  if (assigned) return assigned

  const legacy = cmsResolvedAssets.heroMedia?.trim()
  if (legacy && !isVideoUrl(legacy)) return legacy
  return undefined
}

export function oathHeroDesktopVideo(): string {
  return (
    cmsResolvedAssets.heroDesktopVideo?.trim() ||
    cmsResolvedAssets.heroMedia?.trim() ||
    DEFAULT_HERO_VIDEO
  )
}

export function oathHeroMobileVideo(): string {
  return (
    cmsResolvedAssets.heroMobileVideo?.trim() ||
    cmsResolvedAssets.heroDesktopVideo?.trim() ||
    cmsResolvedAssets.heroMedia?.trim() ||
    DEFAULT_HERO_VIDEO
  )
}

export function oathHeroPoster(): string | undefined {
  return cmsAsset('heroPoster')
}

/** The image revealed under the cursor spotlight; undefined → ember gradient. */
export function oathHeroRevealMedia(): string | undefined {
  return cmsAsset('heroRevealMedia')
}

/* — Scene media ———————————————————————————————————————————————— */

export function oathManifestoMedia(): string | undefined {
  return cmsAsset('manifestoMedia')
}

/** Tenet media by resolved URL from landing content; undefined → duotone placeholder. */
export function oathTenetMediaFromUrl(mediaUrl: string | undefined): string | undefined {
  const trimmed = mediaUrl?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : undefined
}

/** Product render by 1-based position; falls back to the live product image. */
export function oathProductImage(position: number): string | undefined {
  return cmsAsset(`productImage${position}`)
}

export function oathDuotone(tone = '#1a1c1f'): string {
  return `linear-gradient(155deg, ${tone} 0%, var(--color-bg) 80%)`
}

/* — Loading / preload (home entry overlay) ————————————————————— */

export function oathLoadingEmblem(): string {
  return resolveLoadingEmblemUrl(cmsResolvedAssets)
}

export function criticalOathAssets(): string[] {
  return criticalLandingAssetUrls(cmsResolvedAssets)
}
