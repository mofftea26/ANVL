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
  /** Recommended dimensions / format, shown under the slot in the CMS. */
  hint?: string
}

export function getPassthroughSlotKeys(dropKey: string): Set<string> {
  return new Set(
    getDropAssetSlots(dropKey)
      .filter((slot) => slot.passthrough)
      .map((slot) => slot.key),
  )
}

export const GENERAL_ASSET_SLOTS: AssetSlotDefinition[] = [
  {
    key: 'emblemFallback',
    label: 'Default emblem',
    kind: 'image',
    hint: 'SVG or transparent PNG, square ~512×512. < 30 KB.',
  },
  {
    key: 'loadingEmblem',
    label: 'Loading emblem',
    kind: 'image',
    hint: 'SVG or transparent PNG, square ~512×512. < 30 KB.',
  },
  {
    key: 'metalTexture',
    label: 'Metal texture (site-wide)',
    kind: 'image',
    hint: 'Seamless / tileable, ~1024×1024. WebP, < 200 KB.',
  },
  {
    key: 'noiseTexture',
    label: 'Noise texture (site-wide)',
    kind: 'image',
    hint: 'Grayscale grain tile, ~512×512. PNG/WebP, < 80 KB.',
  },
]

export { OATH_ASSET_SLOTS } from './pages/TheOathLanding/theOathAssetSlots'

import { OATH_ASSET_SLOTS } from './pages/TheOathLanding/theOathAssetSlots'

export const DROP_ASSET_SLOTS: Record<string, AssetSlotDefinition[]> = {
  'the-oath': OATH_ASSET_SLOTS,
}

export function getDropAssetSlots(dropKey: string): AssetSlotDefinition[] {
  return DROP_ASSET_SLOTS[dropKey] ?? []
}
