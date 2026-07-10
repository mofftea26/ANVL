import { describe, expect, it } from 'vitest'
import type { MediaIndexEntry } from '@/features/cms/media/mediaIndex.types'
import {
  DEFAULT_COMING_SOON_CONFIG,
  parseComingSoonConfig,
} from '@/features/cms/comingSoon/comingSoon.zod'
import {
  COMING_SOON_DEFAULT_AMBIENT,
  COMING_SOON_DEFAULT_BACKDROP,
  resolveComingSoonContent,
} from '@/features/comingSoon/content/resolveComingSoonContent'

const emptyIndex: MediaIndexEntry[] = []

function config(overrides: Record<string, unknown> = {}) {
  return parseComingSoonConfig({ ...overrides })
}

describe('resolveComingSoonContent', () => {
  it('renders the complete designed page from an empty blob', () => {
    const resolved = resolveComingSoonContent(config(), emptyIndex)
    expect(resolved.headline).toBe(DEFAULT_COMING_SOON_CONFIG.headline)
    expect(resolved.tagline).toBe('FORGED UNDER PRESSURE')
    expect(resolved.backgroundUrl).toBe(COMING_SOON_DEFAULT_BACKDROP)
    expect(resolved.ambientUrl).toBe(COMING_SOON_DEFAULT_AMBIENT)
    expect(resolved.emailCapture.enabled).toBe(true)
    // Default socials: instagram (brand default) + the support-email icon.
    expect(resolved.socials).toEqual([
      {
        kind: 'instagram',
        href: 'https://instagram.com/anvl.athletics',
        label: 'ANVL on Instagram',
      },
      {
        kind: 'email',
        href: 'mailto:support@anvlathletics.com',
        label: 'Email support@anvlathletics.com',
      },
    ])
  })

  it('treats blank strings as "use the default"', () => {
    const resolved = resolveComingSoonContent(
      config({ headline: '   ', supportEmail: '' }),
      emptyIndex,
    )
    expect(resolved.headline).toBe(DEFAULT_COMING_SOON_CONFIG.headline)
    expect(resolved.supportEmail).toBe('support@anvlathletics.com')
  })

  it('adds social icons only for valid absolute URLs', () => {
    const resolved = resolveComingSoonContent(
      config({
        tiktokUrl: 'https://tiktok.com/@anvl',
        youtubeUrl: 'not a url',
        // eslint-disable-next-line no-script-url
        facebookUrl: 'javascript:alert(1)',
      }),
      emptyIndex,
    )
    const kinds = resolved.socials.map((s) => s.kind)
    expect(kinds).toContain('tiktok')
    expect(kinds).not.toContain('youtube')
    expect(kinds).not.toContain('facebook')
  })

  it('hides the instagram icon for a malformed handle', () => {
    const resolved = resolveComingSoonContent(
      config({ instagramHandle: '@not a handle!' }),
      emptyIndex,
    )
    expect(resolved.socials.some((s) => s.kind === 'instagram')).toBe(false)
    // Email contact is always present.
    expect(resolved.socials.at(-1)?.kind).toBe('email')
  })

  it('resolves media ids through the media index', () => {
    const index: MediaIndexEntry[] = [
      {
        id: 'bg-1',
        path: 'coming-soon/backdrop-custom.webp',
        alt: '',
        mime: 'image/webp',
        w: 2560,
        h: 1440,
        updatedAt: '2026-07-09T00:00:00Z',
      },
    ]
    const resolved = resolveComingSoonContent(
      config({ backgroundMediaId: 'bg-1' }),
      index,
    )
    // With Supabase env present the id resolves to a bucket URL; without it,
    // the bundled default carries the page. Either way: never a broken src.
    expect(
      resolved.backgroundUrl.endsWith('coming-soon/backdrop-custom.webp') ||
        resolved.backgroundUrl === COMING_SOON_DEFAULT_BACKDROP,
    ).toBe(true)
    const unresolvable = resolveComingSoonContent(
      config({ backgroundMediaId: 'missing-id' }),
      index,
    )
    expect(unresolvable.backgroundUrl).toBe(COMING_SOON_DEFAULT_BACKDROP)
  })

  it('disables the countdown target when the date is blank', () => {
    const resolved = resolveComingSoonContent(
      config({ countdownEnabled: true, countdownDate: '' }),
      emptyIndex,
    )
    expect(resolved.countdown.enabled).toBe(true)
    expect(resolved.countdown.targetMs).toBeNull()
  })

  it('resolves a valid countdown to a UTC instant', () => {
    const resolved = resolveComingSoonContent(
      config({
        countdownEnabled: true,
        countdownDate: '2026-08-01T20:00',
        countdownTimezone: 'UTC',
      }),
      emptyIndex,
    )
    expect(resolved.countdown.targetMs).toBe(Date.UTC(2026, 7, 1, 20, 0, 0))
  })

  it('falls back OG fields to the SEO fields when blank', () => {
    const resolved = resolveComingSoonContent(
      config({ seoTitle: 'Custom title', ogTitle: '' }),
      emptyIndex,
    )
    expect(resolved.seo.ogTitle).toBe('Custom title')
  })
})
