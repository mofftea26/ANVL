import { useEffect, useState } from 'react'
import { AnvlOathShape } from '@/shared/assets/brand'
import { resolveThemedSvgMarkup } from '@/features/landingPages/landingEntryLoad'
import { OATH_LOGO_PLACEHOLDER } from '@/features/landingPages/pages/TheOathLanding/theOathAssets'
import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark'
import { isSvgEmblemUrl } from '@/shared/lib/themeSvgMarkup'
import { cn } from '@/shared/lib/cn'

type AdminDropLogoMarkProps = {
  src?: string
  className?: string
  size?: number
}

function isDefaultDropLogo(url: string): boolean {
  const trimmed = url.trim()
  return (
    !trimmed ||
    trimmed === OATH_LOGO_PLACEHOLDER ||
    trimmed.endsWith('/brand/the-oath-shape.svg')
  )
}

/** CMS drop logo mark — always rendered white on dark admin surfaces. */
export function AdminDropLogoMark({
  src,
  className,
  size = 48,
}: AdminDropLogoMarkProps) {
  const resolved = src?.trim() || OATH_LOGO_PLACEHOLDER
  const [themedMarkup, setThemedMarkup] = useState<string | null>(null)

  useEffect(() => {
    if (!isSvgEmblemUrl(resolved) || isDefaultDropLogo(resolved)) {
      setThemedMarkup(null)
      return
    }

    let cancelled = false
    void resolveThemedSvgMarkup(resolved).then((markup) => {
      if (!cancelled) setThemedMarkup(markup)
    })

    return () => {
      cancelled = true
    }
  }, [resolved])

  if (isDefaultDropLogo(resolved)) {
    return (
      <AnvlOathShape
        className={cn('h-full w-full text-white', className)}
        aria-hidden
      />
    )
  }

  if (!isSvgEmblemUrl(resolved)) {
    return (
      <img
        src={resolved}
        alt=""
        width={size}
        height={size}
        decoding="async"
        className={cn('h-full w-full object-contain', className)}
        style={{ filter: 'brightness(0) invert(1)' }}
      />
    )
  }

  return (
    <ThemeTintedMediaMark
      src={resolved}
      themedSvgMarkup={themedMarkup}
      tint="#ffffff"
      glow="transparent"
      width={size}
      height={size}
      className={cn('h-full w-full', className)}
    />
  )
}
