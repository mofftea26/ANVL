import { describe, expect, it } from 'vitest'
import {
  toOmContentSlice,
  toOmFormValues,
  type OmContentFormValues,
} from '../omLandingContentForm'
import { oathModernContentSchema } from '@/features/landingPages/pages/OathModern/content/oathModernContent.schema'

function emptyForm(): OmContentFormValues {
  return toOmFormValues({})
}

describe('omLandingContentForm', () => {
  it('maps an empty blob to all-blank form values', () => {
    const f = emptyForm()
    expect(f.threshold.heading).toBe('')
    expect(f.threshold.highlightWordsText).toBe('')
    expect(f.pressure.vows.length).toBeGreaterThan(0)
    expect(f.pressure.vows.every((v) => v.label === '' && v.line === '')).toBe(true)
    expect(f.collection.taglines).toEqual([])
  })

  it('produces an empty (schema-valid) slice when nothing is overridden', () => {
    const slice = toOmContentSlice(emptyForm())
    expect(oathModernContentSchema.safeParse(slice).success).toBe(true)
    expect(Object.keys(slice)).toHaveLength(0)
  })

  it('keeps only overridden fields, schema-validated', () => {
    const f = emptyForm()
    f.threshold.heading = 'New Vow'
    f.threshold.highlightWordsText = 'Vow, Steel'
    f.pressure.vows[0].label = 'Load'
    f.oath.linesText = 'Line one\n\nLine two'
    f.collection.taglines = [{ slug: 'compression-tee', line: 'The second skin.' }]
    f.conversion.reassurancesText = 'Free returns\nShips worldwide'

    const slice = toOmContentSlice(f)
    expect(oathModernContentSchema.safeParse(slice).success).toBe(true)
    expect(slice.threshold?.heading).toBe('New Vow')
    expect(slice.threshold?.highlightWords).toEqual(['Vow', 'Steel'])
    expect(slice.pressure?.vows?.[0]).toEqual({ label: 'Load' })
    expect(slice.oath?.lines).toEqual(['Line one', 'Line two'])
    expect(slice.collection?.taglines).toEqual({ 'compression-tee': 'The second skin.' })
    expect(slice.conversion?.reassurances).toEqual(['Free returns', 'Ships worldwide'])
    // Untouched chapters are dropped entirely.
    expect(slice.formation).toBeUndefined()
  })

  it('round-trips overridden values back through the form', () => {
    const slice = toOmContentSlice({
      ...emptyForm(),
      threshold: { ...emptyForm().threshold, heading: 'Sworn' },
    })
    const f = toOmFormValues(slice)
    expect(f.threshold.heading).toBe('Sworn')
  })
})
