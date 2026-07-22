import {
  Ban,
  Check,
  CoatHanger,
  Droplet,
  Flame,
  HandSoap,
  Shirt,
  Snowflake,
  Sparkles,
  SprayBottle,
  Sun,
  Thermometer,
  WashingMachine,
  Wind,
  type LucideIcon,
} from '@/shared/icons'
import type { CareIconKey } from '@/features/cms/support/supportContent.zod'

/**
 * Icon components for structured care items — the render side of the
 * `CareIconKey` vocabulary defined in `supportContent.zod.ts`. Shared by the
 * storefront (CareLines, PDP) and the admin CareSelector so the editor
 * preview always matches what customers see.
 */
export const CARE_ICON_COMPONENTS: Record<CareIconKey, LucideIcon> = {
  'washing-machine': WashingMachine,
  'hand-soap': HandSoap,
  droplet: Droplet,
  snowflake: Snowflake,
  thermometer: Thermometer,
  sun: Sun,
  wind: Wind,
  flame: Flame,
  prohibit: Ban,
  'spray-bottle': SprayBottle,
  'coat-hanger': CoatHanger,
  sparkle: Sparkles,
  shirt: Shirt,
  generic: Check,
}

/** Display text for a care value: bare numbers read as wash temperatures. */
export function formatCareValue(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^\d+(?:[.,]\d+)?$/.test(trimmed) ? `${trimmed}°C` : trimmed
}
