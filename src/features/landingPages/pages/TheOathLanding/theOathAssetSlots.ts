import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

export const OATH_ASSET_SLOTS: AssetSlotDefinition[] = [
  { key: 'dropLogo', label: 'Drop logo', kind: 'image' },
  { key: 'anvlWordmark', label: 'ANVL wordmark', kind: 'svg' },
  { key: 'crestSvg', label: 'Crest / emblem', kind: 'svg' },
  { key: 'heroMedia', label: 'Hero video/image', kind: 'video' },
  { key: 'heroPoster', label: 'Hero poster', kind: 'image' },
  { key: 'manifestoMedia', label: 'Manifesto backdrop', kind: 'image' },
  { key: 'metalTexture', label: 'Metal texture', kind: 'image' },
  { key: 'noiseTexture', label: 'Noise texture', kind: 'image' },
]
