import { describe, expect, it } from 'vitest'
import {
  buildStaticWebsiteNavigation,
  staticFooterNavLinks,
  staticHeaderNavLinks,
} from '@/features/cms/navigation/staticWebsiteNavigation'

describe('staticWebsiteNavigation', () => {
  it('uses code-owned links only — no /drop/the-oath', () => {
    const nav = buildStaticWebsiteNavigation()
    const hrefs = [
      ...nav.headerLinks.map((l) => l.href),
      ...nav.footerLinks.map((l) => l.href),
      ...(nav.mobileExtraLinks ?? []).map((l) => l.href),
    ]
    expect(hrefs).not.toContain('/drop/the-oath')
    expect(hrefs.some((h) => h.startsWith('/drop/'))).toBe(false)
  })

  it('includes Story in the header, keeps Care/Size Guide out of the topbar', () => {
    const header = staticHeaderNavLinks()
    const footer = staticFooterNavLinks()

    expect(header.some((l) => l.href === '/story' && l.label === 'Story')).toBe(
      true,
    )
    expect(header.some((l) => l.href === '/care-guide')).toBe(false)
    expect(header.some((l) => l.href === '/size-guide')).toBe(false)
    expect(footer.some((l) => l.href === '/story')).toBe(true)
    expect(footer.some((l) => l.href === '/care-guide')).toBe(true)
    expect(footer.some((l) => l.href === '/size-guide')).toBe(true)
  })

  it('includes core storefront routes', () => {
    const headerHrefs = staticHeaderNavLinks().map((l) => l.href)
    expect(headerHrefs).toEqual(expect.arrayContaining(['/shop', '/about', '/story']))

    const footerHrefs = staticFooterNavLinks().map((l) => l.href)
    expect(footerHrefs).toEqual(
      expect.arrayContaining([
        '/size-guide',
        '/care-guide',
        '/faq',
        '/contact',
        '/returns',
        '/privacy',
        '/terms',
        '/cookie-policy',
      ]),
    )
  })

  it('does not link Account in the header — the avatar menu owns account access', () => {
    const headerHrefs = staticHeaderNavLinks().map((l) => l.href)
    expect(headerHrefs).not.toContain('/account')
  })
})
