import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EXPERIENCE_KEY,
  EXPERIENCES,
  isExperienceKey,
  resolveExperience,
  resolveExperienceKey,
} from '../experienceRegistry'

describe('experienceRegistry', () => {
  it('exposes both shipped experiences', () => {
    expect(Object.keys(EXPERIENCES).sort()).toEqual([
      'the-oath',
      'theoath-modern',
    ])
  })

  it('keeps the classic Oath experience fully classic (no regression)', () => {
    const oath = EXPERIENCES['the-oath']
    expect(oath.header).toBe('classic')
    expect(oath.footer).toBe('classic')
    expect(oath.productCard).toBe('classic')
    expect(oath.button).toBe('classic')
  })

  it('marks The Oath Modern as the techForge experience', () => {
    const modern = EXPERIENCES['theoath-modern']
    expect(modern.header).toBe('techForge')
    expect(modern.recommendedThemeKey).toBe('forged-ceremonial')
  })

  it('resolves unknown / legacy / nullish keys to the default experience', () => {
    for (const key of [undefined, null, '', 'legacy-drop', 'nope']) {
      expect(resolveExperience(key).key).toBe(DEFAULT_EXPERIENCE_KEY)
      expect(resolveExperienceKey(key)).toBe(DEFAULT_EXPERIENCE_KEY)
    }
  })

  it('resolves known keys to themselves', () => {
    expect(resolveExperienceKey('theoath-modern')).toBe('theoath-modern')
    expect(resolveExperienceKey('the-oath')).toBe('the-oath')
  })

  it('narrows experience keys', () => {
    expect(isExperienceKey('theoath-modern')).toBe(true)
    expect(isExperienceKey('whatever')).toBe(false)
  })
})
