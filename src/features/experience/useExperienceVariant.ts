import type { ExperienceConfig, ExperienceVariantMap } from './experience.types'
import { useExperience } from './ExperienceProvider'

/** Experience dimensions whose value is a `classic | techForge` variant token. */
type VariantDimension = {
  [K in keyof ExperienceConfig]: ExperienceConfig[K] extends 'classic' | 'techForge'
    ? K
    : never
}[keyof ExperienceConfig]

/**
 * The single approved place structural variant selection happens.
 *
 * ```ts
 * const Footer = useExperienceVariant('footer', {
 *   classic: SiteFooter,
 *   techForge: SiteFooterTechForge,
 * })
 * ```
 *
 * This keeps the "no scattered experience conditionals" rule: components never
 * read the experience key directly to branch markup — they declare a variant map
 * and let the resolved config pick. Cosmetic-only differences use
 * `[data-experience]` CSS instead and need no map at all.
 */
export function useExperienceVariant<T>(
  dimension: VariantDimension,
  map: ExperienceVariantMap<T>,
): T {
  const experience = useExperience()
  return map[experience[dimension]]
}
