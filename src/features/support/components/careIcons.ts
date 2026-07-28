import type { CareIconKey } from '@/features/cms/support/supportContent.zod'
import { SUPPORT_CONTENT_DEFAULTS } from '@/features/cms/support/supportContent.defaults'
import { CARE_SYMBOL_COMPONENTS, type CareGlyphComponent } from './careSymbols'

/**
 * Icon components for structured care items — the render side of the
 * `CareIconKey` vocabulary defined in `supportContent.zod.ts`. Every key now
 * resolves to a REAL textile care symbol (see `careSymbols.tsx`), shared by the
 * storefront (CareLines, PDP bento), the admin CareSelector, and the passport
 * care ritual so the editor preview always matches what customers see.
 */
export const CARE_ICON_COMPONENTS: Record<CareIconKey, CareGlyphComponent> = CARE_SYMBOL_COMPONENTS

export type { CareGlyphComponent }

/**
 * Plain-language meaning for a care icon key, when it maps to a standard
 * symbol. Sourced from `SUPPORT_CONTENT_DEFAULTS.careGuide.legend.entries` —
 * the same code-owned copy `resolveCareLegend` merges CMS overrides over for
 * the storefront `/care-guide` legend — so this (the admin `CareSelector`
 * preview, and the passport `CareGuide`) never quotes different wording than
 * the guide's designed defaults. Legacy/decorative keys have no entry.
 */
export function careIconMeaning(icon: CareIconKey): string | undefined {
  return SUPPORT_CONTENT_DEFAULTS.careGuide.legend.entries[icon]?.meaning
}

/** Display text for a care value: bare numbers read as wash temperatures. */
export function formatCareValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed}°C` : trimmed
}
