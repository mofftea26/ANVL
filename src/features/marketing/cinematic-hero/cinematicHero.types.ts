/** CMS cinematic scroll hero configuration (stored in hero act content.cinematicConfig). */

export type CinematicScrollLength = 'compact' | 'standard' | 'extended'

export type CinematicNavMode =
  | 'auto'
  | 'transparentTopbar'
  | 'sideRail'
  | 'cornerDock'
  | 'commandOverlay'

export type CinematicBackgroundMode = 'image' | 'video' | 'gradient' | 'forgeScene'

export type CinematicButtonVariant = 'primary' | 'secondary' | 'ghost' | 'outline'

export type CinematicHeroButton = {
  label: string
  href: string
  variant: CinematicButtonVariant
  icon?: string
  target?: '_blank' | '_self'
}

export type CinematicSectionMedia = {
  imageUrl?: string
  videoUrl?: string
  alt?: string
  overlayIntensity?: number
}

export type CinematicHeroSection = {
  id: string
  title?: string
  eyebrow?: string
  heading?: string
  body?: string
  background?: CinematicSectionMedia
  foreground?: CinematicSectionMedia
  emblemSrc?: string
  buttons?: CinematicHeroButton[]
  animationPreset?: string
  textPosition?: 'left' | 'center' | 'right'
  visualPosition?: 'left' | 'center' | 'right'
  mobileBehavior?: 'stack' | 'simplified' | 'hidden'
  isEnabled: boolean
  sortOrder: number
}

export type CinematicReducedMotionFallback = {
  mode: 'stack' | 'static'
  showAllSections?: boolean
}

export type CinematicConfig = {
  enabled: boolean
  scrollLength: CinematicScrollLength
  navMode: CinematicNavMode
  backgroundMode: CinematicBackgroundMode
  reducedMotionFallback: CinematicReducedMotionFallback
  sections: CinematicHeroSection[]
}

export const CINEMATIC_SCROLL_LENGTH_MAP: Record<CinematicScrollLength, string> = {
  compact: '+=250%',
  standard: '+=400%',
  extended: '+=550%',
}

export const CINEMATIC_SCROLL_HERO_PRESET = 'cinematicScrollHero' as const

export function isCinematicScrollHeroPreset(preset?: string): boolean {
  return preset === CINEMATIC_SCROLL_HERO_PRESET
}
