import { describe, expect, it } from 'vitest'

import {
  DEFAULT_LEGAL_CONTENT,
  LEGAL_PAGE_KEYS,
  legalContentSchema,
  parseLegalContent,
} from '@/features/cms/legal/legalContent.zod'

describe('parseLegalContent', () => {
  it('returns blank defaults for non-object input', () => {
    for (const raw of [undefined, null, 'junk', 42, ['not', 'an', 'object']]) {
      expect(parseLegalContent(raw)).toEqual(DEFAULT_LEGAL_CONTENT)
    }
  })

  it('exposes all four pages', () => {
    const parsed = parseLegalContent(undefined)
    expect(Object.keys(parsed.pages).sort()).toEqual([...LEGAL_PAGE_KEYS].sort())
  })

  it('round-trips a complete config unchanged', () => {
    const full = {
      pages: {
        privacy: {
          title: 'Privacy',
          updatedAt: '2026-07-19',
          intro: 'Intro.',
          sections: [{ id: 's1', heading: 'H', body: 'B' }],
        },
        terms: { title: '', updatedAt: '', intro: '', sections: [] },
        cookies: { title: '', updatedAt: '', intro: '', sections: [] },
        accessibility: { title: '', updatedAt: '', intro: '', sections: [] },
      },
    }
    const parsed = parseLegalContent(full)
    expect(parsed).toEqual(full)
    expect(legalContentSchema.parse(parsed)).toEqual(full)
  })

  it('fills missing pages and fields with blank defaults', () => {
    const parsed = parseLegalContent({ pages: { privacy: { title: 'Only privacy' } } })
    expect(parsed.pages.privacy.title).toBe('Only privacy')
    expect(parsed.pages.privacy.intro).toBe('')
    expect(parsed.pages.privacy.sections).toEqual([])
    expect(parsed.pages.terms).toEqual({ title: '', updatedAt: '', intro: '', sections: [] })
  })

  it('drops unknown keys on pages and sections (strict never throws)', () => {
    const parsed = parseLegalContent({
      legacyTop: true,
      pages: {
        privacy: {
          title: 'P',
          ghost: 'gone',
          sections: [{ id: 's', heading: 'H', body: 'B', extra: 1 }],
        },
      },
    })
    expect(parsed.pages.privacy.title).toBe('P')
    expect(parsed.pages.privacy.sections[0]).toEqual({ id: 's', heading: 'H', body: 'B' })
    expect(parsed).not.toHaveProperty('legacyTop')
  })

  it('degrades invalid field types to their defaults', () => {
    const parsed = parseLegalContent({
      pages: {
        privacy: { title: 7, intro: {}, updatedAt: false, sections: 'nope' },
      },
    })
    expect(parsed.pages.privacy.title).toBe('')
    expect(parsed.pages.privacy.intro).toBe('')
    expect(parsed.pages.privacy.updatedAt).toBe('')
    expect(parsed.pages.privacy.sections).toEqual([])
  })

  it('rejects prototype-pollution style keys', () => {
    const parsed = parseLegalContent(
      JSON.parse('{"__proto__": {"polluted": true}, "pages": {"privacy": {"title": "ok"}}}'),
    )
    expect(parsed.pages.privacy.title).toBe('ok')
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})
