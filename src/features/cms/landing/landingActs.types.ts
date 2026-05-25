export type ActAnimationIntensity = 'subtle' | 'standard' | 'bold'

/** Optional hero / act backdrop references (paths or URLs). */
export type ActMedia = {
  imageUrl?: string
  videoUrl?: string
  alt?: string
}

export type ActAnimationConfig = {
  enabled: boolean
  desktopOnly: boolean
  type: string
  intensity: ActAnimationIntensity
}

export const DEFAULT_ACT_ANIMATION: ActAnimationConfig = {
  enabled: true,
  desktopOnly: true,
  type: 'default',
  intensity: 'standard',
}

export function mergeActAnimationConfig(
  partial?: Partial<ActAnimationConfig> | null,
): ActAnimationConfig {
  const intensity =
    partial?.intensity === 'subtle' ||
    partial?.intensity === 'standard' ||
    partial?.intensity === 'bold'
      ? partial.intensity
      : DEFAULT_ACT_ANIMATION.intensity
  return {
    ...DEFAULT_ACT_ANIMATION,
    ...partial,
    intensity,
  }
}

export type PublicLandingAct = {
  id: string
  nature: string
  preset: string
  sortOrder: number
  animation: ActAnimationConfig
  /** Homepage renderer key (legacy section id). */
  slotKey: string
  enabled: boolean
}

/** Serialized admin row for a landing act. */
export type LandingAct = {
  id: string
  nature: string
  preset: string
  isEnabled: boolean
  sortOrder: number
  title?: string
  subtitle?: string
  eyebrow?: string
  body?: string
  media?: ActMedia
  animation?: ActAnimationConfig
  content?: Record<string, unknown>
  productIds?: string[]
  /** When act media is empty, choose drop emblem vs wordmark for preset crests. */
  campaignMarkFallback?: 'emblem' | 'wordmark'
}
