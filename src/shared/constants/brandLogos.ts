export type SiteTheme = 'oath-dark' | 'bone-light'
/** Horizontal ANVL text / wordmark for nav; stacked emblem + wordmark for footer; crest-only for decorative. */
export type BrandLogoVariant = 'wordmark' | 'stacked' | 'mark'

export type BrandLogoInk = 'theme' | 'light' | 'dark'

/** Theme-driven paths by default: dark UI uses light ink; light UI uses dark ink. Override with `ink`. */
export function getBrandLogoSrc(
  variant: BrandLogoVariant,
  theme: SiteTheme,
  ink: BrandLogoInk = 'theme',
): string {
  let useLightInk: boolean
  if (ink === 'light') useLightInk = true
  else if (ink === 'dark') useLightInk = false
  else useLightInk = theme === 'oath-dark'

  if (variant === 'wordmark') {
    return useLightInk ? '/brand/logo-wordmark-light.png' : '/brand/logo-wordmark-dark.png'
  }
  if (variant === 'stacked') {
    return useLightInk ? '/brand/logo-stacked-light.png' : '/brand/logo-stacked-dark.png'
  }
  return useLightInk ? '/brand/mark-light.png' : '/brand/mark-dark.png'
}
