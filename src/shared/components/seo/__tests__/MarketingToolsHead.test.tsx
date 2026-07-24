import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render } from '@testing-library/react'
import { MarketingToolsHead } from '@/shared/components/seo/MarketingToolsHead'
import {
  defaultSiteSeoContent,
  type SiteSeoContent,
} from '@/features/cms/siteSeo.local'

function seo(overrides: Partial<SiteSeoContent>): SiteSeoContent {
  return { ...defaultSiteSeoContent(), ...overrides }
}

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.head.querySelectorAll('[id^="ga4-"],[id^="gtm-"],[id^="fbp-"]').forEach((n) => n.remove())
  document
    .querySelectorAll('meta[name="google-site-verification"], meta[name="robots"]')
    .forEach((n) => n.remove())
})

describe('MarketingToolsHead', () => {
  it('injects the SSR-published tags for a visitor with no stored blob', () => {
    // A real storefront visitor has an empty localStorage — the published prop
    // must still drive the injection (regression: local default was winning).
    render(
      <MarketingToolsHead
        siteSeo={seo({
          marketingTools: [{ id: 'a', provider: 'ga4', snippetId: 'G-TEST123', enabled: true }],
        })}
      />,
    )
    expect(document.getElementById('ga4-G-TEST123')).not.toBeNull()
  })

  it('does not inject a disabled tag or one with no id', () => {
    render(
      <MarketingToolsHead
        siteSeo={seo({
          marketingTools: [
            { id: 'a', provider: 'ga4', snippetId: 'G-OFF', enabled: false },
            { id: 'b', provider: 'gtm', snippetId: '', enabled: true },
          ],
        })}
      />,
    )
    expect(document.getElementById('ga4-G-OFF')).toBeNull()
    expect(document.querySelector('[id^="gtm-"]')).toBeNull()
  })

  it('adds a site-wide noindex when search visibility is off', () => {
    render(<MarketingToolsHead siteSeo={seo({ technical: { robotsIndex: false } })} />)
    expect(
      document.querySelector('meta[name="robots"]')?.getAttribute('content'),
    ).toBe('noindex,nofollow')
  })
})
