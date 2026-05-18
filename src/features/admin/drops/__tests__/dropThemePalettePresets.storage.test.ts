import { describe, expect, it } from 'vitest'

import { DROP_THEME_PRESETS } from '@/features/admin/drops/drops.presets'
import { mergeBuiltinAndSavedPalettePresetItems } from '@/features/admin/drops/dropThemePalettePresets.storage'
import type { SavedDropThemePalettePresetRow } from '@/features/admin/drops/dropThemePalettePresets.persistence.zod'
import { savedDropThemePalettePresetsSchema } from '@/features/admin/drops/dropThemePalettePresets.persistence.zod'

describe('dropThemePalettePresets.storage merge', () => {
  const oathRow: SavedDropThemePalettePresetRow = {
    id: 'user-test-1',
    label: 'Night run',
    tokens: structuredClone(DROP_THEME_PRESETS[0]!),
    createdAt: '2026-05-18T00:00:00.000Z',
  }

  it('parses saved preset payload with tokens', () => {
    const parsed = savedDropThemePalettePresetsSchema.safeParse([oathRow])
    expect(parsed.success).toBe(true)
  })

  it('merges built-ins first then user rows; drops user ids overlapping built-ins', () => {
    const collision = { ...oathRow, id: 'the-oath', label: 'Fake builtin' }
    const merged = mergeBuiltinAndSavedPalettePresetItems({
      builtin: DROP_THEME_PRESETS.slice(0, 2),
      saved: [oathRow, collision, { ...oathRow, id: 'not-user', label: 'bad' }],
    })
    expect(merged.slice(0, 2).every((m) => m.kind === 'builtin')).toBe(true)
    expect(merged.find((m) => m.id === 'the-oath' && m.kind === 'saved')).toBeUndefined()
    expect(merged.filter((m) => m.kind === 'saved').map((m) => m.id)).toEqual([
      'user-test-1',
    ])
  })
})
