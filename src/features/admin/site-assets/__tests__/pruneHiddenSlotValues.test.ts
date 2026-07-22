import { describe, expect, it } from 'vitest'
import type { AssetSlotDefinition } from '@/features/landingPages/assetSlots'
import { pruneHiddenSlotValues } from '../SiteAssetsEditor'

const slots: AssetSlotDefinition[] = [
  {
    key: 'heroMediaMode',
    label: 'Hero media',
    kind: 'select',
    options: [
      { value: 'video', label: 'Video' },
      { value: 'image', label: 'Image' },
      { value: 'products', label: 'Products' },
    ],
  },
  {
    key: 'heroImage',
    label: 'Hero image',
    kind: 'image',
    visibleWhen: { key: 'heroMediaMode', equals: 'image' },
  },
  {
    key: 'heroDesktopVideo',
    label: 'Hero video',
    kind: 'video',
    visibleWhen: { key: 'heroMediaMode', equals: 'video' },
  },
  { key: 'heroPoster', label: 'Poster', kind: 'image' },
]

describe('pruneHiddenSlotValues (G4)', () => {
  it('clears dependent slot values that become hidden when their controller changes', () => {
    const bucket = {
      heroMediaMode: 'image',
      heroImage: 'media-image',
      heroDesktopVideo: 'media-video',
      heroPoster: 'media-poster',
    }

    const next = pruneHiddenSlotValues(slots, bucket, 'heroMediaMode', 'products')

    // Both mode-gated slots are now hidden — their stale values are dropped so
    // the media library badge cannot keep reporting them as assigned.
    expect(next.heroImage).toBeUndefined()
    expect(next.heroDesktopVideo).toBeUndefined()
    // Unconditional slots survive.
    expect(next.heroPoster).toBe('media-poster')
    expect(next.heroMediaMode).toBe('products')
  })

  it('keeps the dependent slot that matches the new controller value', () => {
    const bucket = { heroMediaMode: 'video', heroDesktopVideo: 'media-video' }

    const next = pruneHiddenSlotValues(slots, bucket, 'heroMediaMode', 'image')
    expect(next.heroDesktopVideo).toBeUndefined()

    const back = pruneHiddenSlotValues(
      slots,
      { ...next, heroImage: 'media-image' },
      'heroMediaMode',
      'image',
    )
    expect(back.heroImage).toBe('media-image')
  })

  it('is a plain assignment for non-controller slots', () => {
    const next = pruneHiddenSlotValues(slots, { heroPoster: 'old' }, 'heroPoster', 'new')
    expect(next).toEqual({ heroPoster: 'new' })
  })
})
