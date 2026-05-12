export type SiteTheme = 'oath-dark' | 'bone-light'
/** Horizontal ANVL text / wordmark for nav; stacked emblem + wordmark for footer; crest-only for decorative. */
export type BrandLogoVariant = 'wordmark' | 'stacked' | 'mark'

export type BrandLogoInk = 'theme' | 'light' | 'dark'

/**
 * Returns a public URL for the brand SVG. The active visual ink is driven
 * by CSS `currentColor` on the consuming surface (the SVGs render their
 * paths with `fill="currentColor"`), so the `theme` and `ink` parameters
 * are kept only for backwards-compatible call sites.
 */
export function getBrandLogoSrc(
  variant: BrandLogoVariant,
  _theme: SiteTheme,
  _ink: BrandLogoInk = 'theme',
): string {
  if (variant === 'wordmark') return '/brand/wordmark.svg'
  if (variant === 'stacked') return '/brand/stacked.svg'
  return '/brand/mark.svg'
}
