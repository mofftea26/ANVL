import { describe, expect, it } from 'vitest'
import {
  toTmContentSlice,
  toTmFormValues,
} from '../tmLandingContentForm'

describe('tmLandingContentForm', () => {
  it('round-trips an empty slice to an empty override', () => {
    const values = toTmFormValues(undefined)
    // Form is fully populated for editing (placeholders are the defaults),
    // but blank values must serialize back to an empty CMS slice.
    const slice = toTmContentSlice(values)
    expect(slice).toEqual({})
  })

  it('keeps only real overrides and drops blanks', () => {
    const values = toTmFormValues(undefined)
    values.hero.heading = 'BUILT DIFFERENT'
    values.hero.highlightWordsText = 'DIFFERENT'
    values.collection.taglines = [{ slug: 'compression-tee', line: 'Dense.' }]
    const slice = toTmContentSlice(values)
    expect(slice.hero?.heading).toBe('BUILT DIFFERENT')
    expect(slice.hero?.highlightWords).toEqual(['DIFFERENT'])
    expect(slice.collection?.taglines).toEqual({ 'compression-tee': 'Dense.' })
    // Untouched sections are absent (not empty objects).
    expect(slice.materials).toBeUndefined()
    expect(slice.benefits).toBeUndefined()
  })

  it('parses a stored slice back into editable form values', () => {
    const stored = { hero: { heading: 'STORED', sideIndex: ['01 — A', '02 — B'] } }
    const values = toTmFormValues(stored)
    expect(values.hero.heading).toBe('STORED')
    expect(values.hero.sideIndexText).toBe('01 — A\n02 — B')
  })

  it('serializes hotspot coordinates as numbers', () => {
    const values = toTmFormValues(undefined)
    values.hero.hotspots[0].label = 'Seam'
    values.hero.hotspots[0].x = '40'
    values.hero.hotspots[0].y = '55'
    const slice = toTmContentSlice(values)
    expect(slice.hero?.hotspots?.[0]).toMatchObject({ label: 'Seam', x: 40, y: 55 })
  })
})
