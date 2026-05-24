import { describe, expect, it, vi } from 'vitest'
import { SEED_DROP } from '@/features/cms/api/seedSnapshots'
import { ADMIN_STORAGE_KEYS } from '@/features/admin/storageKeys'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'

describe('storefront Supabase-only sync resolution', () => {
  it('ignores mutated admin localStorage when Supabase fallback is disabled', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv(
      'VITE_SUPABASE_PUBLISHABLE_KEY',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
    )

    const tampered = createDefaultTheOathDrop()
    tampered.title = 'LOCAL STORAGE TAMPERED TITLE'
    window.localStorage.setItem(
      ADMIN_STORAGE_KEYS.drops,
      JSON.stringify({ drops: [tampered] }),
    )

    const { shouldStorefrontUseLocalCmsFallback } = await import(
      '@/features/cms/api/cmsPersistenceMode'
    )
    expect(shouldStorefrontUseLocalCmsFallback()).toBe(false)

    const { getResolvedStorefrontLandingCmsSync } = await import(
      '@/features/cms/runtime/storefrontCmsSync'
    )
    const landing = getResolvedStorefrontLandingCmsSync()
    expect(landing.hero.title).not.toBe('LOCAL STORAGE TAMPERED TITLE')
    expect(landing.hero.title.length).toBeGreaterThan(0)

    const { resolveStorefrontActiveDrop } = await import(
      '@/features/cms/runtime/storefrontCmsSync'
    )
    expect(resolveStorefrontActiveDrop()?.id).toBe(SEED_DROP.id)

    vi.unstubAllEnvs()
    window.localStorage.clear()
  })
})
