/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it } from 'vitest'
import {
  getGlobalBrandSettings,
} from '@/features/admin/global-brand/globalBrand.service'
import { createDefaultGlobalBrandSettings } from '@/features/admin/global-brand/globalBrand.defaults'
import { persistedGlobalBrandSchema } from '@/features/admin/global-brand/globalBrand.persistence.zod'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'

const KEY = ADMIN_STORAGE_KEYS.globalBrand

beforeEach(() => {
  window.localStorage.clear()
})

describe('persistedGlobalBrandSchema (SEC-07 / Phase C2)', () => {
  it('accepts the default global brand settings', () => {
    const result = persistedGlobalBrandSchema.safeParse(
      createDefaultGlobalBrandSettings(),
    )
    expect(result.success).toBe(true)
  })

  it('rejects non-string emblemFallbackUrl', () => {
    expect(
      persistedGlobalBrandSchema.safeParse({
        emblemFallbackUrl: 123,
        loadingEmblemFallbackUrl: '/x',
      }).success,
    ).toBe(false)
  })

  it('rejects when a required key is missing', () => {
    expect(
      persistedGlobalBrandSchema.safeParse({ emblemFallbackUrl: '/x' }).success,
    ).toBe(false)
  })
})

describe('getGlobalBrandSettings (Phase C2 tamper guard)', () => {
  it('returns defaults when storage is empty', () => {
    expect(getGlobalBrandSettings().emblemFallbackUrl.length).toBeGreaterThan(0)
  })

  it('returns defaults when JSON is malformed', () => {
    window.localStorage.setItem(KEY, '{not-json')
    expect(getGlobalBrandSettings().emblemFallbackUrl.length).toBeGreaterThan(0)
  })

  it('returns defaults when payload has the wrong shape', () => {
    window.localStorage.setItem(KEY, JSON.stringify({ banner: 'hello' }))
    expect(getGlobalBrandSettings().emblemFallbackUrl.length).toBeGreaterThan(0)
  })

  it('round-trips a valid persisted payload', () => {
    const payload = {
      emblemFallbackUrl: '/brand/alt-emblem.svg',
      loadingEmblemFallbackUrl: '/brand/alt-loading.svg',
    }
    window.localStorage.setItem(KEY, JSON.stringify(payload))
    expect(getGlobalBrandSettings()).toMatchObject(payload)
  })
})
