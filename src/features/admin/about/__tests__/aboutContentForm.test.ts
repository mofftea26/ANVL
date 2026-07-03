import { describe, expect, it } from 'vitest'
import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import {
  createBlankOrbFormValues,
  toAboutContentSlice,
  toAboutFormValues,
} from '@/features/admin/about/aboutContentForm'

const DEFAULT_ORB_COUNT = ABOUT_DEFAULT_CONTENT.orbs.length

describe('aboutContentForm', () => {
  it('produces an empty slice from an untouched form', () => {
    const values = toAboutFormValues(undefined)
    expect(values.orbs).toHaveLength(DEFAULT_ORB_COUNT)
    expect(toAboutContentSlice(values)).toEqual({})
  })

  it('keeps only real overrides in the slice', () => {
    const values = toAboutFormValues(undefined)
    values.hero.headline = 'Custom Headline'
    values.orbs[0]!.title = 'Custom Orb Title'
    values.orbs[0]!.color = '#123ABC'
    const slice = toAboutContentSlice(values)
    expect(slice.hero).toEqual({ headline: 'Custom Headline' })
    expect(slice.orbs).toHaveLength(DEFAULT_ORB_COUNT)
    expect(slice.orbs?.[0]).toEqual({ title: 'Custom Orb Title', color: '#123ABC' })
    expect(slice.orbs?.[1]).toEqual({})
    expect(slice.marquee).toBeUndefined()
  })

  it('stores the orb list when the count differs (add/remove)', () => {
    const values = toAboutFormValues(undefined)
    values.orbs.push({ ...createBlankOrbFormValues(), label: 'Community' })
    const slice = toAboutContentSlice(values)
    expect(slice.orbs).toHaveLength(DEFAULT_ORB_COUNT + 1)
    expect(slice.orbs?.[DEFAULT_ORB_COUNT]).toEqual({ label: 'Community' })

    const fewer = toAboutFormValues(undefined)
    fewer.orbs = fewer.orbs.slice(0, 2)
    expect(toAboutContentSlice(fewer).orbs).toHaveLength(2)
  })

  it('round-trips a stored slice back into the same form values', () => {
    const values = toAboutFormValues(undefined)
    values.orbs[1]!.linesText = 'Line one\nLine two'
    values.orbs[1]!.points = [{ label: 'Seam', description: 'Flat against the skin.' }]
    values.orbs[1]!.stats = [{ label: 'Hours', value: '500', suffix: '+' }]
    values.orbs[1]!.primaryCtaLabel = 'Shop'
    values.orbs[1]!.primaryCtaHref = '/shop'
    values.orbs[1]!.mediaId = 'media-123'
    values.marquee.text = 'Custom Marquee'

    const slice = toAboutContentSlice(values)
    const roundTripped = toAboutFormValues(slice)
    expect(roundTripped).toEqual(values)
  })

  it('drops blank nested rows instead of storing empty objects', () => {
    const values = toAboutFormValues(undefined)
    values.orbs[0]!.points = [{ label: '  ', description: '' }]
    values.orbs[0]!.stats = [{ label: '', value: ' ', suffix: '' }]
    const slice = toAboutContentSlice(values)
    expect(slice).toEqual({})
  })
})
