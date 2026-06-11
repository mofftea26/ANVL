export type AssetSlotKind = 'image' | 'video' | 'svg' | 'select'

export type AssetSlotDefinition = {
  key: string
  label: string
  kind: AssetSlotKind
  /** Group heading in the assets editor (e.g. "Hero"). */
  section?: string
  /** Select options when `kind` is `select`. */
  options?: { value: string; label: string }[]
  /** Show this slot only when another assignment equals `equals`. */
  visibleWhen?: { key: string; equals: string }
  /** Stored as a raw string, not resolved through the media library. */
  passthrough?: boolean
}

export function getPassthroughSlotKeys(dropKey: string): Set<string> {
  return new Set(
    getDropAssetSlots(dropKey)
      .filter((slot) => slot.passthrough)
      .map((slot) => slot.key),
  )
}

export const GENERAL_ASSET_SLOTS: AssetSlotDefinition[] = [
  { key: 'emblemFallback', label: 'Default emblem', kind: 'image' },
  { key: 'loadingEmblem', label: 'Loading emblem', kind: 'image' },
  { key: 'metalTexture', label: 'Metal texture (site-wide)', kind: 'image' },
  { key: 'noiseTexture', label: 'Noise texture (site-wide)', kind: 'image' },
]

export { OATH_ASSET_SLOTS } from './pages/TheOathLanding/theOathAssetSlots'

import { OATH_ASSET_SLOTS } from './pages/TheOathLanding/theOathAssetSlots'

export const DROP_ASSET_SLOTS: Record<string, AssetSlotDefinition[]> = {
  'the-oath': OATH_ASSET_SLOTS,
}

export function getDropAssetSlots(dropKey: string): AssetSlotDefinition[] {
  return DROP_ASSET_SLOTS[dropKey] ?? []
}
