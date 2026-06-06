/**
 * Asset registry + fallback system for The Oath landing.
 *
 * Every asset is OPTIONAL. Missing media falls back to a duotone gradient plane
 * with the Drop 01 logo placeholder (via {@link MediaPlane}) — the page never
 * breaks on a missing file. Drop real exports into `public/brand` or
 * `public/drops/oath/` and fill the keys; `TODO` markers list what each expects.
 *
 * See the "Required assets" checklist in `docs/landing-pages.md`.
 */

export interface OathAssetConfig {
  dropLogo?: string
  anvlWordmark?: string
  crestSvg?: string
  /** Per-scene background media (image or video URL). */
  heroMedia?: string
  heroPoster?: string
  manifestoMedia?: string
  /** Per-chapter media keyed by chapter id. */
  chapterMedia?: Record<string, string>
  metalTexture?: string
  noiseTexture?: string
  /** Per-piece product renders keyed by product slug. */
  productImages?: Record<string, string>
}

/** The Drop 01 logo SVG — guaranteed to exist; the universal visual fallback. */
export const OATH_LOGO_PLACEHOLDER = '/brand/the-oath-shape.svg'

/** Only files that actually exist are set; everything else resolves to a placeholder. */
export const OATH_ASSETS: OathAssetConfig = {
  dropLogo: '/brand/the-oath-shape.svg',
  anvlWordmark: '/brand/wordmark.svg',
  // TODO(assets): replace with real ANVL Drop 01 exports.
  crestSvg: undefined, //        forged crest/emblem SVG
  heroMedia: undefined, //       hero forge/athlete image or video
  heroPoster: undefined, //      hero video poster (mobile/first paint)
  manifestoMedia: undefined, //  manifesto backdrop
  chapterMedia: {}, //           per-chapter backdrops by id
  metalTexture: undefined,
  noiseTexture: undefined,
  productImages: {
    // 'the-oath-oversized-tee': '/drops/oath/oversized-tee-front.webp',
    // 'the-oath-stringer': '/drops/oath/stringer-front.webp',
    // 'the-oath-compression-tee': '/drops/oath/compression-tee-front.webp',
  },
}

export function oathAsset<K extends keyof OathAssetConfig>(
  key: K,
): OathAssetConfig[K] {
  return OATH_ASSETS[key]
}

/** Resolve a scene media URL, or `undefined` to let MediaPlane render a placeholder. */
export function oathSceneMedia(
  key: 'heroMedia' | 'manifestoMedia',
): string | undefined {
  return OATH_ASSETS[key]
}

export function oathChapterMedia(id: string): string | undefined {
  return OATH_ASSETS.chapterMedia?.[id]
}

export function oathProductImage(slug: string): string | undefined {
  return OATH_ASSETS.productImages?.[slug]
}

/** A premium duotone gradient for placeholder media planes. */
export function duotonePlaceholder(tone = '#1a1c1f'): string {
  return `linear-gradient(155deg, ${tone} 0%, #0b0b0c 80%)`
}

/** Critical, above-the-fold assets to warm (only ones that exist). */
export function criticalOathAssets(): string[] {
  return [OATH_ASSETS.dropLogo, OATH_ASSETS.heroPoster, OATH_ASSETS.heroMedia].filter(
    (v): v is string => Boolean(v),
  )
}
