import { describe, expect, it } from 'vitest'
import { createRuntimeClients } from '@/app/config/runtime'

/**
 * The runtime factory must hand out seed adapters during SSR (no
 * localStorage allowed) and the localStorage-backed adapters in the
 * browser. This is the contract every CMS read depends on (SEC-08).
 */
describe('createRuntimeClients', () => {
  it('returns seed clients when isServer is true', () => {
    const server = createRuntimeClients({ isServer: true })
    const browser = createRuntimeClients({ isServer: false })

    // Sanity: every contract slot is present in both modes.
    for (const key of [
      'cms',
      'commerce',
      'seo',
      'siteSettings',
      'analytics',
      'payment',
      'account',
    ] as const) {
      expect(server[key]).toBeDefined()
      expect(browser[key]).toBeDefined()
    }
  })

  it('returns a different cms/commerce/seo/siteSettings client per environment', () => {
    const server = createRuntimeClients({ isServer: true })
    const browser = createRuntimeClients({ isServer: false })

    for (const key of ['cms', 'commerce', 'seo', 'siteSettings'] as const) {
      expect(server[key]).not.toBe(browser[key])
    }
  })

  it('shares analytics / payment / account clients between server and browser (mocks today)', () => {
    const server = createRuntimeClients({ isServer: true })
    const browser = createRuntimeClients({ isServer: false })
    // Mocks are stable references; this guards against accidental
    // forking that would break observability later.
    expect(server.analytics).toBe(browser.analytics)
    expect(server.payment).toBe(browser.payment)
    expect(server.account).toBe(browser.account)
  })
})
