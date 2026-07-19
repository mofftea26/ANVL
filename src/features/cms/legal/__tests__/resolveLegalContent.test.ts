import { describe, expect, it } from 'vitest'

import { LEGAL_CONTENT_DEFAULTS } from '@/features/cms/legal/legalContent.defaults'
import { parseLegalContent } from '@/features/cms/legal/legalContent.zod'
import { resolveLegalContent } from '@/features/cms/legal/resolveLegalContent'

function config(overrides: Record<string, unknown> = {}) {
  return parseLegalContent(overrides)
}

describe('resolveLegalContent', () => {
  it('renders the full designed pages from an empty blob', () => {
    const resolved = resolveLegalContent(config())
    expect(resolved.privacy.title).toBe(LEGAL_CONTENT_DEFAULTS.privacy.title)
    expect(resolved.privacy.intro).toBe(LEGAL_CONTENT_DEFAULTS.privacy.intro)
    expect(resolved.privacy.sections).toEqual(LEGAL_CONTENT_DEFAULTS.privacy.sections)
    // Accessibility is net-new — it must have real default copy, not blanks.
    expect(resolved.accessibility.title).toBe('Accessibility Statement')
    expect(resolved.accessibility.sections.length).toBeGreaterThan(0)
  })

  it('treats blank strings as "use the default" per field', () => {
    const resolved = resolveLegalContent(
      config({ pages: { privacy: { title: '   ', intro: 'Custom intro.' } } }),
    )
    expect(resolved.privacy.title).toBe(LEGAL_CONTENT_DEFAULTS.privacy.title)
    expect(resolved.privacy.intro).toBe('Custom intro.')
  })

  it('replaces the default sections when the CMS supplies any', () => {
    const resolved = resolveLegalContent(
      config({
        pages: { terms: { sections: [{ id: 't1', heading: 'Custom', body: 'Body.' }] } },
      }),
    )
    expect(resolved.terms.sections).toEqual([{ id: 't1', heading: 'Custom', body: 'Body.' }])
  })

  it('falls back to default sections when all authored rows are empty', () => {
    const resolved = resolveLegalContent(
      config({ pages: { cookies: { sections: [{ id: 'x', heading: '', body: '' }] } } }),
    )
    expect(resolved.cookies.sections).toEqual(LEGAL_CONTENT_DEFAULTS.cookies.sections)
  })

  it('gives every resolved section a stable id', () => {
    const resolved = resolveLegalContent(
      config({ pages: { privacy: { sections: [{ id: '', heading: 'H', body: 'B' }] } } }),
    )
    expect(resolved.privacy.sections[0].id).toBe('section-0')
  })
})
