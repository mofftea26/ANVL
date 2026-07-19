import { describe, expect, it } from 'vitest'

import {
  DEFAULT_BANNER_CONFIG,
  bannerConfigSchema,
  parseBannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'

describe('parseBannerConfig', () => {
  it('returns full defaults for non-object input', () => {
    for (const raw of [undefined, null, 'junk', 42, ['not', 'an', 'object']]) {
      expect(parseBannerConfig(raw)).toEqual(DEFAULT_BANNER_CONFIG)
    }
  })

  it('round-trips a complete config unchanged', () => {
    const full = {
      enabled: true,
      message: 'Drop 01 ships worldwide',
      href: '/shop',
      linkLabel: 'Shop now',
      imageMediaId: 'media-123',
      colors: { background: '#0B0B0C', text: '#E7E4DF' },
      schedule: { startAt: '2026-07-19T10:00', endAt: '2026-07-26T10:00' },
    }
    const parsed = parseBannerConfig(full)
    expect(parsed).toEqual(full)
    // Schema round-trip: a parsed config re-validates as-is (strict).
    expect(bannerConfigSchema.parse(parsed)).toEqual(full)
  })

  it('fills missing keys with defaults (partial blobs upgrade silently)', () => {
    const parsed = parseBannerConfig({ enabled: true, message: 'Hi' })
    expect(parsed.enabled).toBe(true)
    expect(parsed.message).toBe('Hi')
    expect(parsed.href).toBe('')
    expect(parsed.colors).toEqual({ background: '', text: '' })
    expect(parsed.schedule).toEqual({ startAt: '', endAt: '' })
  })

  it('fills missing nested keys without dropping the provided ones', () => {
    const parsed = parseBannerConfig({
      colors: { background: '#123456' },
      schedule: { endAt: '2026-08-01T00:00' },
    })
    expect(parsed.colors).toEqual({ background: '#123456', text: '' })
    expect(parsed.schedule).toEqual({ startAt: '', endAt: '2026-08-01T00:00' })
  })

  it('drops unknown keys (legacy blobs never throw despite strict schemas)', () => {
    const parsed = parseBannerConfig({
      enabled: true,
      legacyField: 'gone',
      colors: { background: '#111111', ancient: true },
    })
    expect(parsed.enabled).toBe(true)
    expect(parsed.colors.background).toBe('#111111')
    expect(parsed).not.toHaveProperty('legacyField')
  })

  it('degrades invalid field types to their defaults per-field', () => {
    const parsed = parseBannerConfig({
      enabled: 'yes',
      message: 7,
      colors: 'not-an-object',
      schedule: { startAt: 99 },
    })
    expect(parsed.enabled).toBe(DEFAULT_BANNER_CONFIG.enabled)
    expect(parsed.message).toBe('')
    expect(parsed.colors).toEqual({ background: '', text: '' })
    expect(parsed.schedule).toEqual({ startAt: '', endAt: '' })
  })

  it('rejects prototype-pollution style keys', () => {
    const parsed = parseBannerConfig(
      JSON.parse('{"__proto__": {"polluted": true}, "message": "ok"}'),
    )
    expect(parsed.message).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
