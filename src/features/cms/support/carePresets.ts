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
  // Wash — the tub. `machine-wash` keeps its free temperature input; discrete
  // temperature presets give the recognisable numbered-tub symbols to pick.
  { key: 'machine-wash', icon: 'wash', name: 'Machine wash', needsValue: 'temperature', defaultValue: '30' },
  { key: 'machine-wash-30', icon: 'wash-30', name: 'Machine wash 30°C' },
  { key: 'machine-wash-40', icon: 'wash-40', name: 'Machine wash 40°C' },
  { key: 'machine-wash-50', icon: 'wash-50', name: 'Machine wash 50°C' },
  { key: 'machine-wash-60', icon: 'wash-60', name: 'Machine wash 60°C' },
  { key: 'machine-wash-cold', icon: 'wash-cold', name: 'Machine wash cold' },
  { key: 'gentle-cycle', icon: 'wash-gentle', name: 'Gentle cycle' },
  { key: 'hand-wash', icon: 'wash-hand', name: 'Hand wash' },
  { key: 'wash-inside-out', icon: 'wash-inside-out', name: 'Wash inside out' },
  { key: 'wash-like-colors', icon: 'droplet', name: 'Wash with like colors' },
  { key: 'do-not-wash', icon: 'do-not-wash', name: 'Do not wash' },
  // Bleach — the triangle.
  { key: 'bleach-when-needed', icon: 'bleach', name: 'Bleach when needed' },
  { key: 'do-not-bleach', icon: 'do-not-bleach', name: 'Do not bleach' },
  { key: 'no-fabric-softener', icon: 'spray-bottle', name: 'No fabric softener' },
  // Tumble dry — the circle in the square.
  { key: 'tumble-dry', icon: 'tumble-dry', name: 'Tumble dry' },
  { key: 'tumble-dry-low', icon: 'tumble-dry-low', name: 'Tumble dry low' },
  { key: 'tumble-dry-high', icon: 'tumble-dry-high', name: 'Tumble dry high' },
  { key: 'do-not-tumble-dry', icon: 'do-not-tumble-dry', name: 'Do not tumble dry' },
  // Natural dry — the square.
  { key: 'hang-dry', icon: 'line-dry', name: 'Line dry' },
  { key: 'dry-flat', icon: 'dry-flat', name: 'Lay flat to dry' },
  { key: 'drip-dry', icon: 'drip-dry', name: 'Drip dry' },
  { key: 'dry-in-shade', icon: 'sun', name: 'Dry away from direct sun' },
  // Iron — the iron. `iron` keeps its free level input; discrete heat presets
  // give the recognisable one/two/three-dot symbols.
  { key: 'iron', icon: 'iron', name: 'Iron', needsValue: 'level', defaultValue: 'low' },
  { key: 'iron-low', icon: 'iron-low', name: 'Iron low' },
  { key: 'iron-medium', icon: 'iron-medium', name: 'Iron medium' },
  { key: 'iron-high', icon: 'iron-high', name: 'Iron high' },
  { key: 'do-not-iron', icon: 'do-not-iron', name: 'Do not iron' },
  { key: 'avoid-high-heat', icon: 'flame', name: 'Keep away from high heat' },
  // Dry clean — the circle.
  { key: 'dry-clean', icon: 'dry-clean', name: 'Dry clean' },
  { key: 'do-not-dry-clean', icon: 'do-not-dry-clean', name: 'Do not dry clean' },
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
