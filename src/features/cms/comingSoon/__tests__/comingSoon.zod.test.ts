import { describe, expect, it } from 'vitest'
import {
  DEFAULT_COMING_SOON_CONFIG,
  parseComingSoonConfig,
} from '@/features/cms/comingSoon/comingSoon.zod'

describe('parseComingSoonConfig', () => {
  it('returns full defaults for non-object input', () => {
    expect(parseComingSoonConfig(undefined)).toEqual(DEFAULT_COMING_SOON_CONFIG)
    expect(parseComingSoonConfig(null)).toEqual(DEFAULT_COMING_SOON_CONFIG)
    expect(parseComingSoonConfig('nope')).toEqual(DEFAULT_COMING_SOON_CONFIG)
    expect(parseComingSoonConfig([1, 2])).toEqual(DEFAULT_COMING_SOON_CONFIG)
  })

  it('defaults to disabled', () => {
    expect(parseComingSoonConfig({}).enabled).toBe(false)
  })

  it('keeps provided values and fills missing keys with defaults', () => {
    const parsed = parseComingSoonConfig({
      enabled: true,
      headline: 'Custom headline',
    })
    expect(parsed.enabled).toBe(true)
    expect(parsed.headline).toBe('Custom headline')
    expect(parsed.tagline).toBe(DEFAULT_COMING_SOON_CONFIG.tagline)
    expect(parsed.countdownTimezone).toBe('Asia/Beirut')
  })

  it('replaces invalid field values with defaults instead of throwing', () => {
    const parsed = parseComingSoonConfig({
      enabled: 'yes',
      headline: 42,
      logoVariant: 'hologram',
      themeVariant: ['champagne'],
    })
    expect(parsed.enabled).toBe(false)
    expect(parsed.headline).toBe(DEFAULT_COMING_SOON_CONFIG.headline)
    expect(parsed.logoVariant).toBe('crest')
    expect(parsed.themeVariant).toBe('champagne')
  })

  it('strips unknown keys (no prototype pollution vector)', () => {
    const raw = JSON.parse('{"__proto__": {"polluted": true}, "extra": 1}')
    const parsed = parseComingSoonConfig(raw)
    expect(parsed).not.toHaveProperty('extra')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
