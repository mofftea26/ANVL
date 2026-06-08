import { ThemeTintedMediaMark } from '@/shared/components/ui/ThemeTintedMediaMark'
import type { LandingPageThemedMarkups } from '@/features/landingPages/types'
import { oathCrestEmblem, oathDropLogo, oathThemedMarkup } from '../theOathAssets'

type OathCmsMarkProps = {
  slot: keyof LandingPageThemedMarkups
  className?: string
  width?: number
  height?: number
  tint?: string
  glow?: string
}

export function OathCmsMark({
  slot,
  className,
  width = 96,
  height = 96,
  tint = 'var(--color-heading)',
  glow = 'var(--color-ember)',
}: OathCmsMarkProps) {
  const src = slot === 'dropLogo' ? oathDropLogo() : oathCrestEmblem()

  return (
    <ThemeTintedMediaMark
      src={src}
      themedSvgMarkup={oathThemedMarkup(slot)}
      className={className}
      width={width}
      height={height}
      tint={tint}
      glow={glow}
    />
  )
}
