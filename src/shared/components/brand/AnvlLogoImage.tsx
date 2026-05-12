import {
  AnvlCrest,
  AnvlStacked,
  AnvlWordmark,
} from '@/shared/assets/brand'
import type {
  BrandLogoInk,
  BrandLogoVariant,
} from '@/shared/constants/brandLogos'

/**
 * Theme-aware brand mark. The underlying SVGs use `currentColor`, so the
 * mark inherits its color from the surrounding CSS — no per-theme image
 * files are needed. `ink` and `fetchPriority` remain on the prop signature
 * for call-site compatibility but no longer drive a separate asset URL.
 */
export function AnvlLogoImage({
  variant,
  className,
  alt,
  decorative,
}: {
  variant: BrandLogoVariant
  className?: string
  alt?: string
  /** Kept for API compatibility; inline SVGs are not network-loaded. */
  fetchPriority?: 'high' | 'low' | 'auto'
  decorative?: boolean
  /** Kept for API compatibility; ink now follows `currentColor`. */
  ink?: BrandLogoInk
}) {
  const Component =
    variant === 'wordmark'
      ? AnvlWordmark
      : variant === 'stacked'
        ? AnvlStacked
        : AnvlCrest

  if (decorative) {
    return (
      <span aria-hidden="true" className="contents">
        <Component className={className} />
      </span>
    )
  }

  const label =
    alt ?? (variant === 'mark' ? 'ANVL crest mark' : 'ANVL Athletics')

  return (
    <span role="img" aria-label={label} className="contents">
      <Component className={className} />
    </span>
  )
}
