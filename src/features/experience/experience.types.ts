/**
 * Centralized experience system.
 *
 * An "experience" is the site-wide visual + interaction identity that a
 * code-owned landing page implies. It is keyed 1:1 to the active landing-page
 * key (from `storefront_publication.active_landing_page_key`) so there is no
 * parallel selector that can drift out of sync with the landing registry.
 *
 * Selecting an experience re-skins the whole storefront through a single seam:
 * `data-experience` on `<html>` (cosmetic CSS) + `useExperienceVariant` for
 * structural component swaps. There are NO scattered `if (key === '…')` checks.
 *
 * Theme (colors) is intentionally independent — see `themePresets.ts`. An
 * experience only *recommends* a theme; the `/admin/theme` selection always wins.
 */

/** Stable experience identifiers (mirror landing-page registry keys). */
export type ExperienceKey = 'the-oath' | 'theoath-modern'

/** Which coded variant a shared surface should render for this experience. */
export type HeaderVariant = 'classic' | 'techForge'
export type FooterVariant = 'classic' | 'techForge'
export type ProductCardVariant = 'classic' | 'techForge'
export type ButtonVariant = 'classic' | 'techForge'
export type AnimationPreset = 'oath' | 'techForge'
export type BackgroundPreset = 'oathVoid' | 'techLab'
export type PageTransition = 'fade' | 'forgeWipe'
export type TypographyPreset = 'oath' | 'techForge'

export interface ExperienceConfig {
  key: ExperienceKey
  /** Display label (mirrors the landing registry name; for admin previews). */
  label: string
  /**
   * Theme preset this experience was art-directed against. Advisory only — the
   * live `/admin/theme` selection is the source of truth for colors.
   */
  recommendedThemeKey: string
  header: HeaderVariant
  footer: FooterVariant
  productCard: ProductCardVariant
  button: ButtonVariant
  animationPreset: AnimationPreset
  background: BackgroundPreset
  pageTransition: PageTransition
  typography: TypographyPreset
}

/** Variant component map consumed by `useExperienceVariant`. */
export type ExperienceVariantMap<T> = {
  classic: T
  techForge: T
}
