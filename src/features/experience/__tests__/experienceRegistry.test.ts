import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EXPERIENCE_KEY,
  EXPERIENCES,
  isExperienceKey,
  resolveExperience,
  resolveExperienceKey,
} from '../experienceRegistry'

describe('experienceRegistry', () => {
  it('exposes the single shipped experience', () => {
    expect(Object.keys(EXPERIENCES)).toEqual(['the-oath'])
  })

  it('keeps the classic Oath experience fully classic (no regression)', () => {
    const oath = EXPERIENCES['the-oath']
    expect(oath.header).toBe('classic')
    expect(oath.footer).toBe('classic')
    expect(oath.productCard).toBe('classic')
    expect(oath.button).toBe('classic')
  })

  it('resolves unknown / legacy / nullish keys to the default experience', () => {
    for (const key of [undefined, null, '', 'legacy-drop', 'nope']) {
      expect(resolveExperience(key).key).toBe(DEFAULT_EXPERIENCE_KEY)
      expect(resolveExperienceKey(key)).toBe(DEFAULT_EXPERIENCE_KEY)
    }
  })

  it('resolves the known key to itself', () => {
    expect(resolveExperienceKey('the-oath')).toBe('the-oath')
  })

  it('narrows experience keys', () => {
    expect(isExperienceKey('the-oath')).toBe(true)
    expect(isExperienceKey('theoath-modern')).toBe(false)
    expect(isExperienceKey('whatever')).toBe(false)
  })
})
