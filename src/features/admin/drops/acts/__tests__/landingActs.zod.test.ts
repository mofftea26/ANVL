import { describe, expect, it } from 'vitest'
import { heroContentSchema, safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'

describe('heroContentSchema', () => {
  it('accepts cinematic hero media fields', () => {
    const parsed = heroContentSchema.parse({
      backgroundImageUrl: '/brand/og-default.svg',
      backgroundVideoUrl: 'https://cdn.example.com/hero.mp4',
      playVideoOnMobile: false,
      metaItems: [{ id: 'm1', label: 'Drop', value: '01' }],
      primaryCta: { label: 'Shop', href: '/shop' },
    })
    expect(parsed.backgroundVideoUrl).toBe('https://cdn.example.com/hero.mp4')
    expect(parsed.metaItems).toHaveLength(1)
  })

  it('rejects more than six meta rows', () => {
    const items = Array.from({ length: 7 }, (_, i) => ({
      id: `m${i}`,
      label: 'L',
      value: 'V',
    }))
    expect(heroContentSchema.safeParse({ metaItems: items }).success).toBe(false)
  })

  it('strips invalid hero content via safeParseActContent', () => {
    const out = safeParseActContent('hero', {
      backgroundVideoUrl: 'https://x.test/v.mp4',
      notAllowed: true,
    })
    expect(out.backgroundVideoUrl).toBe('https://x.test/v.mp4')
    expect(out).not.toHaveProperty('notAllowed')
  })
})
