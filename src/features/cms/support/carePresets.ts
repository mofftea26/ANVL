import type { CareIconKey } from './supportContent.zod'

/**
 * Catalog of common garment-care instructions the admin CareSelector offers.
 * Each preset pairs display copy with an icon key from {@link CareIconKey};
 * presets with `needsValue` reveal a contextual value input in the editor
 * (temperature in °C, or a free-text level like "low"). Pure data — safe for
 * both storefront and admin bundles.
 */

export type CareValueKind = 'temperature' | 'level'

export interface CareInstructionPreset {
  key: string
  icon: CareIconKey
  name: string
  needsValue?: CareValueKind
  defaultValue?: string
}

export const CARE_INSTRUCTION_PRESETS: readonly CareInstructionPreset[] = [
  { key: 'machine-wash', icon: 'washing-machine', name: 'Machine wash', needsValue: 'temperature', defaultValue: '30' },
  { key: 'machine-wash-cold', icon: 'snowflake', name: 'Machine wash cold' },
  { key: 'gentle-cycle', icon: 'washing-machine', name: 'Gentle cycle' },
  { key: 'hand-wash', icon: 'hand-soap', name: 'Hand wash' },
  { key: 'wash-inside-out', icon: 'shirt', name: 'Wash inside out' },
  { key: 'wash-like-colors', icon: 'droplet', name: 'Wash with like colors' },
  { key: 'do-not-bleach', icon: 'prohibit', name: 'Do not bleach' },
  { key: 'no-fabric-softener', icon: 'spray-bottle', name: 'No fabric softener' },
  { key: 'tumble-dry-low', icon: 'wind', name: 'Tumble dry low' },
  { key: 'do-not-tumble-dry', icon: 'prohibit', name: 'Do not tumble dry' },
  { key: 'hang-dry', icon: 'coat-hanger', name: 'Hang dry' },
  { key: 'dry-flat', icon: 'shirt', name: 'Lay flat to dry' },
  { key: 'dry-in-shade', icon: 'sun', name: 'Dry away from direct sun' },
  { key: 'iron', icon: 'thermometer', name: 'Iron', needsValue: 'level', defaultValue: 'low' },
  { key: 'do-not-iron', icon: 'prohibit', name: 'Do not iron' },
  { key: 'avoid-high-heat', icon: 'flame', name: 'Keep away from high heat' },
  { key: 'dry-clean', icon: 'sparkle', name: 'Dry clean' },
  { key: 'do-not-dry-clean', icon: 'prohibit', name: 'Do not dry clean' },
]

/** Look up a preset by its stable key. */
export function getCarePreset(key: string): CareInstructionPreset | undefined {
  return CARE_INSTRUCTION_PRESETS.find((preset) => preset.key === key)
}

/** Match a stored care item back to a preset by display name (case-insensitive)
 * so converted/legacy items re-open in the editor as their preset when possible. */
export function findCarePresetByName(name: string): CareInstructionPreset | undefined {
  const needle = name.trim().toLowerCase()
  if (!needle) return undefined
  return CARE_INSTRUCTION_PRESETS.find((preset) => preset.name.toLowerCase() === needle)
}
