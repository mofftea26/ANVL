import type {
  ActAnimationConfig,
  ActAnimationIntensity,
} from '@/features/cms/landing/landingActs.types'
import {
  DEFAULT_ACT_ANIMATION,
  mergeActAnimationConfig,
} from '@/features/cms/landing/landingActs.types'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

export type ActMotionTokens = {
  duration: number
  stagger: number
  enterY: number
  enterX: number
  scrub: number
  parallaxY: number
}

const INTENSITY_TOKENS: Record<ActAnimationIntensity, ActMotionTokens> = {
  subtle: {
    duration: 0.65,
    stagger: 0.06,
    enterY: 20,
    enterX: 16,
    scrub: 0.4,
    parallaxY: 6,
  },
  standard: {
    duration: 0.85,
    stagger: 0.1,
    enterY: 36,
    enterX: 28,
    scrub: 0.6,
    parallaxY: 12,
  },
  bold: {
    duration: 1.05,
    stagger: 0.14,
    enterY: 52,
    enterX: 40,
    scrub: 0.85,
    parallaxY: 18,
  },
}

export function resolveActAnimation(row?: LandingAct | null): ActAnimationConfig {
  return mergeActAnimationConfig(row?.animation ?? DEFAULT_ACT_ANIMATION)
}

export function getActMotionTokens(
  intensity: ActAnimationIntensity,
): ActMotionTokens {
  return INTENSITY_TOKENS[intensity] ?? INTENSITY_TOKENS.standard
}

/** Whether GSAP motion should run for this act on the current viewport. */
export function shouldRunActMotion(
  animation: ActAnimationConfig,
  viewport: 'desktop' | 'mobile' | 'reduced',
): boolean {
  if (!animation.enabled) return false
  if (normalizeActMotionType(animation.type) === 'none') return false
  if (viewport === 'reduced') return false
  if (animation.desktopOnly && viewport === 'mobile') return false
  return true
}

export function scaleEase(intensity: ActAnimationIntensity): string {
  if (intensity === 'subtle') return 'power2.out'
  if (intensity === 'bold') return 'expo.out'
  return 'power3.out'
}

/** CMS dropdown values — stored on `animation.type`. */
export const ACT_MOTION_TYPE_OPTIONS = [
  { value: 'none', label: 'None (static)' },
  { value: 'fadeUp', label: 'Fade up' },
  { value: 'wordReveal', label: 'Word reveal' },
  { value: 'parallax', label: 'Parallax scroll' },
  { value: 'calmIdle', label: 'Calm idle float' },
  { value: 'stagger', label: 'Staggered entrance' },
] as const

export type ActMotionType =
  | 'none'
  | 'fadeUp'
  | 'wordReveal'
  | 'parallax'
  | 'calmIdle'
  | 'stagger'

const MOTION_TYPE_ALIASES: Record<string, ActMotionType> = {
  none: 'none',
  default: 'wordReveal',
  fadeup: 'fadeUp',
  'fade-up': 'fadeUp',
  wordreveal: 'wordReveal',
  'word-reveal': 'wordReveal',
  parallax: 'parallax',
  calmidle: 'calmIdle',
  'calm-idle': 'calmIdle',
  stagger: 'stagger',
  pinreveal: 'parallax',
  videoscrub: 'parallax',
}

export function normalizeActMotionType(raw: string | undefined): ActMotionType {
  const key = (raw ?? 'default').trim().toLowerCase()
  const direct = MOTION_TYPE_ALIASES[key]
  if (direct) return direct
  const camel = (raw ?? '').trim() as ActMotionType
  if (
    camel === 'none' ||
    camel === 'fadeUp' ||
    camel === 'wordReveal' ||
    camel === 'parallax' ||
    camel === 'calmIdle' ||
    camel === 'stagger'
  ) {
    return camel
  }
  return 'wordReveal'
}
