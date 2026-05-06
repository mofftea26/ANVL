import { useEffect, useState } from 'react'
import {
  type BrandLogoInk,
  type BrandLogoVariant,
  type SiteTheme,
  getBrandLogoSrc,
} from '@/shared/constants/brandLogos'
import { cn } from '@/shared/lib/cn'

export function AnvlLogoImage({
  variant,
  className,
  alt,
  fetchPriority,
  decorative,
  ink = 'theme',
}: {
  variant: BrandLogoVariant
  className?: string
  alt?: string
  fetchPriority?: 'high' | 'low' | 'auto'
  decorative?: boolean
  /** Override asset ink; nav can force `dark` on dark chrome to try marble wordmark. */
  ink?: BrandLogoInk
}) {
  const [theme, setTheme] = useState<SiteTheme>('oath-dark')

  useEffect(() => {
    const el = document.documentElement
    const read = () => setTheme((el.dataset.theme as SiteTheme) || 'oath-dark')
    read()
    const observer = new MutationObserver(read)
    observer.observe(el, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])

  const src = getBrandLogoSrc(variant, theme, ink)
  const resolvedAlt =
    decorative
      ? ''
      : (alt ?? (variant === 'mark' ? 'ANVL crest mark' : 'ANVL Athletics'))

  return (
    <img
      src={src}
      alt={resolvedAlt}
      className={cn(
        'block max-w-none shrink-0 object-contain object-left',
        className,
      )}
      decoding="async"
      fetchPriority={fetchPriority}
      aria-hidden={decorative ? true : undefined}
    />
  )
}
