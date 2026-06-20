import { beforeEach, describe, expect, it } from 'vitest'
import {
  DEFAULT_LANDING_CONTENT,
  parseLandingContentConfig,
} from '@/features/cms/landingContent/landingContent.zod'
import {
  LANDING_CONTENT_STORAGE_KEY,
  readLandingContentFromStorage,
  setLandingContentSlice,
  writeLandingContentToStorage,
} from '@/features/cms/landingContent/landingContent.settings'

describe('parseLandingContentConfig', () => {
  it('returns the empty envelope for malformed input', () => {
    expect(parseLandingContentConfig(undefined)).toEqual({})
    expect(parseLandingContentConfig(null)).toEqual({})
    expect(parseLandingContentConfig('garbage')).toEqual({})
    expect(parseLandingContentConfig(42)).toEqual({})
    expect(parseLandingContentConfig(['a'])).toEqual({})
    expect(parseLandingContentConfig({ key: 'not-an-object' })).toEqual({})
  })

  it('keeps valid page slices as-is', () => {
    const input = {
      'the-oath': {
        hero: { headline: 'FORGED' },
        manifesto: { lines: ['Pressure.', 'Heat.'] },
      },
    }
    expect(parseLandingContentConfig(input)).toEqual(input)
  })

  it('strips prototype-pollution keys at both levels', () => {
    const raw = JSON.parse(
      '{"__proto__": {"polluted": true}, "the-oath": {"__proto__": {"x": 1}, "hero": {}}}',
    ) as unknown
    const out = parseLandingContentConfig(raw)
    expect(Object.keys(out)).toEqual(['the-oath'])
    expect(Object.keys(out['the-oath'])).toEqual(['hero'])
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })

  it('DEFAULT_LANDING_CONTENT is an empty envelope', () => {
    expect(DEFAULT_LANDING_CONTENT).toEqual({})
  })
})

describe('landingContent.settings storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('round-trips a written envelope', () => {
    writeLandingContentToStorage({ 'the-oath': { hero: { eyebrow: 'Drop 01' } } })
    expect(readLandingContentFromStorage()).toEqual({
      'the-oath': { hero: { eyebrow: 'Drop 01' } },
    })
  })

  it('returns the default envelope for missing or corrupt storage', () => {
    expect(readLandingContentFromStorage()).toEqual({})
    window.localStorage.setItem(LANDING_CONTENT_STORAGE_KEY, '{corrupt')
    expect(readLandingContentFromStorage()).toEqual({})
  })

  it('setLandingContentSlice replaces only the targeted page slice', () => {
    writeLandingContentToStorage({
      'the-oath': { hero: { headline: 'OLD' } },
      'other-page': { note: 'untouched' },
    })
    const next = setLandingContentSlice('the-oath', {
      hero: { headline: 'NEW' },
    })
    expect(next['the-oath']).toEqual({ hero: { headline: 'NEW' } })
    expect(next['other-page']).toEqual({ note: 'untouched' })
    expect(readLandingContentFromStorage()).toEqual(next)
  })
})
