import type { ExperienceConfig, ExperienceKey } from './experience.types'

/**
 * The classic ANVL identity — the look every existing landing page (and any
 * unknown/legacy key) resolves to. Selecting `the-oath` must keep the storefront
 * pixel-for-pixel as it is today, so every variant here is `classic`.
 */
const THE_OATH_EXPERIENCE: ExperienceConfig = {
  key: 'the-oath',
  label: 'Drop 01 — The Oath',
  recommendedThemeKey: 'oath-obsidian',
  header: 'classic',
  footer: 'classic',
  productCard: 'classic',
  button: 'classic',
  animationPreset: 'oath',
  background: 'oathVoid',
  pageTransition: 'fade',
  typography: 'oath',
}

/**
 * The Oath Modern — the continuous-3D ceremonial flagship for Drop 01. Re-skins
 * structure site-wide via the `techForge` variant slots (the internal token is
 * renamed to `ceremonial` at M10, once the transitional components are replaced).
 * Colors come from the separately-selectable `forged-ceremonial` theme preset
 * (decision: theme stays independent of experience).
 */
const THEOATH_MODERN_EXPERIENCE: ExperienceConfig = {
  key: 'theoath-modern',
  label: 'The Oath Modern',
  recommendedThemeKey: 'forged-ceremonial',
  header: 'techForge',
  footer: 'techForge',
  productCard: 'techForge',
  button: 'techForge',
  animationPreset: 'techForge',
  background: 'techLab',
  pageTransition: 'forgeWipe',
  typography: 'techForge',
}

export const EXPERIENCES: Record<ExperienceKey, ExperienceConfig> = {
  'the-oath': THE_OATH_EXPERIENCE,
  'theoath-modern': THEOATH_MODERN_EXPERIENCE,
}

/** Experience used for any unknown/legacy landing key — never blank, never new. */
export const DEFAULT_EXPERIENCE_KEY: ExperienceKey = 'the-oath'

export function isExperienceKey(
  key: string | null | undefined,
): key is ExperienceKey {
  return typeof key === 'string' && key in EXPERIENCES
}

/**
 * Normalize an arbitrary active-landing-page key to a guaranteed experience.
 * Mirrors `resolveLandingPage` in `landingPages/registry.ts`: unknown keys
 * degrade to the classic Oath experience so legacy pages keep their exact look.
 */
export function resolveExperience(
  landingKey: string | null | undefined,
): ExperienceConfig {
  return isExperienceKey(landingKey)
    ? EXPERIENCES[landingKey]
    : EXPERIENCES[DEFAULT_EXPERIENCE_KEY]
}

/** Guaranteed-valid experience key for the `data-experience` attribute. */
export function resolveExperienceKey(
  landingKey: string | null | undefined,
): ExperienceKey {
  return resolveExperience(landingKey).key
}
