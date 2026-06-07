export type AssetSlotKind = 'image' | 'video' | 'svg'

export type AssetSlotDefinition = {
  key: string
  label: string
  kind: AssetSlotKind
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
