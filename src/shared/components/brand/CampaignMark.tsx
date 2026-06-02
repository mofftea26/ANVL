import type { ReactElement } from 'react'

import {

  AnvlCrest,

  AnvlOathShape,

  AnvlStacked,

  AnvlWordmark,

} from '@/shared/assets/brand'

import { BRAND_EMBLEM_ASSETS } from '@/features/marketing/default-landing/brandShowcaseAssets'

import type { BrandLogoVariant } from '@/shared/constants/brandLogos'

import { cn } from '@/shared/lib/cn'



function normalizeSrc(src: string): string {

  try {

    return new URL(src, 'http://local').pathname

  } catch {

    return src.split('?')[0] ?? src

  }

}



function variantFromSrc(src: string): BrandLogoVariant | 'oath' | null {

  const path = normalizeSrc(src)

  if (path.endsWith('/stacked.svg') || path === BRAND_EMBLEM_ASSETS.stacked) {

    return 'stacked'

  }

  if (

    path.endsWith('/wordmark.svg') ||

    path.endsWith('/wordmark-athletics.svg') ||

    path === BRAND_EMBLEM_ASSETS.wordmark ||

    path === BRAND_EMBLEM_ASSETS.wordmarkAthletic

  ) {

    return 'wordmark'

  }

  if (path.endsWith('/mark.svg') || path === BRAND_EMBLEM_ASSETS.mark) {

    return 'mark'

  }

  if (path.endsWith('/the-oath-shape.svg') || path === BRAND_EMBLEM_ASSETS.oath) {

    return 'oath'

  }

  return null

}



type CampaignMarkAttrs = Partial<{

  'data-act-emblem': boolean

  'data-act-float': boolean

  'data-oath-emblem': boolean

  id: string

}>



type CampaignMarkProps = {

  src?: string

  alt?: string

  decorative?: boolean

  className?: string

  /** Bone-tint raster/SVG assets on dark cinematic backgrounds. */

  onDark?: boolean

} & CampaignMarkAttrs



function wrapMarkShell(

  node: ReactElement,

  className: string | undefined,

  attrs: CampaignMarkAttrs,

) {

  const hasShellAttrs = Object.keys(attrs).length > 0

  if (!hasShellAttrs) return node

  return (

    <span {...attrs} className={cn('inline-flex', className)}>

      {node}

    </span>

  )

}



/**

 * Renders drop/brand marks with correct theme color (inline SVG) or safe fallback for custom URLs.

 */

export function CampaignMark({

  src,

  alt = '',

  decorative = true,

  className,

  onDark = false,

  ...markAttrs

}: CampaignMarkProps) {

  const trimmed = src?.trim()

  if (!trimmed) return null



  const kind = variantFromSrc(trimmed)

  const colorClass = 'text-[var(--color-heading)]'

  const hasShellAttrs = Object.keys(markAttrs).length > 0

  const svgClass = cn(colorClass, hasShellAttrs ? 'h-full w-full' : className)



  if (kind === 'stacked') {

    return wrapMarkShell(

      <AnvlStacked aria-hidden={decorative} className={svgClass} />,

      className,

      markAttrs,

    )

  }

  if (kind === 'wordmark') {

    return wrapMarkShell(

      <AnvlWordmark aria-hidden={decorative} className={svgClass} />,

      className,

      markAttrs,

    )

  }

  if (kind === 'mark') {

    return wrapMarkShell(

      <AnvlCrest aria-hidden={decorative} className={svgClass} />,

      className,

      markAttrs,

    )

  }

  if (kind === 'oath') {

    return wrapMarkShell(

      <AnvlOathShape aria-hidden={decorative} className={svgClass} />,

      className,

      markAttrs,

    )

  }



  return (

    <img

      {...markAttrs}

      src={trimmed}

      alt={decorative ? '' : alt}

      aria-hidden={decorative ? true : undefined}

      className={cn(

        'pointer-events-none select-none object-contain',

        onDark && 'opacity-90 brightness-0 invert',

        className,

      )}

    />

  )

}


