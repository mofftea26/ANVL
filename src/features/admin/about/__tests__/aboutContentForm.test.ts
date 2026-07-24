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
    values.orbs[1]!.lines = ['Line one', 'Line two']
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
    values.orbs[0]!.mapPins = [{ x: '', y: '', label: ' ' }]
    values.orbs[0]!.timeline = [{ marker: '', title: ' ', body: '' }]
    const slice = toAboutContentSlice(values)
    expect(slice).toEqual({})
  })

  it('round-trips the layout presets and their fields', () => {
    const values = toAboutFormValues(undefined)
    values.orbs[0]!.layout = 'text'
    values.orbs[0]!.subhead = 'A lead line.'
    values.orbs[1]!.layout = 'map'
    values.orbs[1]!.mapPins = [{ x: '35.5', y: '60', label: 'Beirut' }]
    values.orbs[2]!.layout = 'timeline'
    values.orbs[2]!.timeline = [{ marker: '2026', title: 'Drop 01', body: 'The Oath ships.' }]

    const slice = toAboutContentSlice(values)
    expect(slice.orbs?.[0]).toEqual({ layout: 'text', subhead: 'A lead line.' })
    expect(slice.orbs?.[1]).toEqual({
      layout: 'map',
      mapPins: [{ x: 35.5, y: 60, label: 'Beirut' }],
    })
    expect(slice.orbs?.[2]).toEqual({
      layout: 'timeline',
      timeline: [{ marker: '2026', title: 'Drop 01', body: 'The Oath ships.' }],
    })
    expect(toAboutFormValues(slice)).toEqual(values)
  })

  it('never stores classic as a layout override', () => {
    const values = toAboutFormValues(undefined)
    values.orbs[0]!.layout = 'classic'
    expect(toAboutContentSlice(values)).toEqual({})
  })

  it('clamps out-of-range pin percents and centres blank coords', () => {
    const values = toAboutFormValues(undefined)
    values.orbs[0]!.layout = 'map'
    values.orbs[0]!.mapPins = [
      { x: '140', y: '-3', label: '' },
      { x: '', y: '', label: 'Somewhere' },
    ]
    const slice = toAboutContentSlice(values)
    expect(slice.orbs?.[0]?.mapPins).toEqual([
      { x: 100, y: 0 },
      { x: 50, y: 50, label: 'Somewhere' },
    ])
  })
})
