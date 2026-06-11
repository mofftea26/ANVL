import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'

export const OATH_ASSET_SLOTS: AssetSlotDefinition[] = [
  { key: 'dropLogo', label: 'Drop logo', kind: 'image' },
  { key: 'anvlWordmark', label: 'ANVL wordmark', kind: 'svg' },
  { key: 'crestSvg', label: 'Crest / emblem', kind: 'svg' },
  {
    key: 'heroMediaMode',
    label: 'Hero media type',
    kind: 'select',
    section: 'Hero',
    passthrough: true,
    options: [
      { value: 'video', label: 'Video' },
      { value: 'image', label: 'Image' },
    ],
  },
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'image' },
  },
  {
    key: 'heroDesktopVideo',
    label: 'Hero video (desktop / tablet)',
    kind: 'video',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
  },
  {
    key: 'heroMobileVideo',
    label: 'Hero video (mobile)',
    kind: 'video',
    section: 'Hero',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
  },
  { key: 'manifestoMedia', label: 'Manifesto backdrop', kind: 'image' },
  { key: 'metalTexture', label: 'Metal texture', kind: 'image' },
  { key: 'noiseTexture', label: 'Noise texture', kind: 'image' },
]
