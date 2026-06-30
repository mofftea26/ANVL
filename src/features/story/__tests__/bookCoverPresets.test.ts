import { describe, expect, it } from 'vitest'
import { BOOK_COVER_PRESETS, bookCoverPresetColors } from '@/features/story/bookCoverPresets'
import { bookColorsSchema } from '@/features/story/schemas/story.schema'

const HEX = /^#[0-9a-fA-F]{6}$/

describe('book cover presets', () => {
  it('ships exactly 20 presets with unique ids', () => {
    expect(BOOK_COVER_PRESETS).toHaveLength(20)
    const ids = new Set(BOOK_COVER_PRESETS.map((p) => p.id))
    expect(ids.size).toBe(20)
  })

  it('every preset has valid 6-digit hex colours that pass the BookColors schema', () => {
    for (const p of BOOK_COVER_PRESETS) {
      for (const value of Object.values(p.colors)) {
        expect(value).toMatch(HEX)
      }
      expect(() => bookColorsSchema.parse(p.colors)).not.toThrow()
    }
  })

  it('bookCoverPresetColors resolves by id and is undefined for unknown ids', () => {
    expect(bookCoverPresetColors('forged')).toEqual(BOOK_COVER_PRESETS[0]!.colors)
    expect(bookCoverPresetColors('does-not-exist')).toBeUndefined()
  })
})
