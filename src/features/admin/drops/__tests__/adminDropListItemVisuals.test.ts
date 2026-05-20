import { describe, expect, it } from 'vitest'

import {
  adminDropListVisualsFromDrop,
  emblemUrlFromDropVisuals,
  themeAccentFromDropTheme,
} from '@/features/admin/drops/adminDropListItemVisuals'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'

describe('adminDropListItemVisuals', () => {
  it('returns trimmed emblem URL and sanitized accent from a drop', () => {
    const drop = createDefaultTheOathDrop()
    drop.visuals.emblemImageUrl = '  /public/emblem.png  '
    drop.theme.colors.accent = '#c8ff4d'

    expect(emblemUrlFromDropVisuals('  ')).toBeUndefined()
    expect(emblemUrlFromDropVisuals(' /x.png ')).toBe('/x.png')
    expect(themeAccentFromDropTheme(drop.theme)).toBe('#c8ff4d')
    expect(adminDropListVisualsFromDrop(drop)).toEqual({
      emblemImageUrl: '/public/emblem.png',
      themeAccent: '#c8ff4d',
    })
  })

  it('rejects unsafe accent values', () => {
    const drop = createDefaultTheOathDrop()
    drop.theme.colors.accent = 'javascript:alert(1)'

    expect(themeAccentFromDropTheme(drop.theme)).toBeUndefined()
  })
})
