import type { CareIconKey } from '@/features/cms/support/supportContent.zod'
import {
  CARE_SYMBOL_COMPONENTS,
  CARE_SYMBOL_META,
  type CareGlyphComponent,
} from './careSymbols'

/**
 * Icon components for structured care items — the render side of the
 * `CareIconKey` vocabulary defined in `supportContent.zod.ts`. Every key now
 * resolves to a REAL textile care symbol (see `careSymbols.tsx`), shared by the
 * storefront (CareLines, PDP bento), the admin CareSelector, and the passport
 * care ritual so the editor preview always matches what customers see.
 */
export const CARE_ICON_COMPONENTS: Record<CareIconKey, CareGlyphComponent> = CARE_SYMBOL_COMPONENTS

export type { CareGlyphComponent }

/** Plain-language meaning for a care icon key, when it maps to a standard symbol. */
export function careIconMeaning(icon: CareIconKey): string | undefined {
  return CARE_SYMBOL_META[icon]?.meaning
}

/** Display text for a care value: bare numbers read as wash temperatures. */
export function formatCareValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed}°C` : trimmed
}
