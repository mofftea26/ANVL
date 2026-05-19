/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { LandingPageCmsContent } from '@/features/cms/landing/landingPageCms.types'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'
import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import { PublicLandingActs } from '@/features/marketing/public-landing/PublicLandingActs'

vi.mock('@/features/marketing/components/HeroForgeSequence', () => ({
  HeroForgeSequence: ({
    title,
    badgeText,
  }: {
    title: string
    badgeText: string
  }) => (
    <div data-testid="hero">
      {badgeText} — {title}
    </div>
  ),
}))

vi.mock('@/features/marketing/components/OathStampSequence', () => ({
  OathStampSequence: () => <div data-testid="manifesto" />,
}))
vi.mock('@/features/marketing/components/DropRevealSection', () => ({
  DropRevealSection: () => null,
}))
vi.mock('@/features/marketing/components/PiecesGrid', () => ({
  PiecesGrid: () => null,
}))
vi.mock('@/features/marketing/components/MaterialsMarquee', () => ({
  MaterialsMarquee: () => null,
}))
vi.mock('@/features/marketing/components/WaitlistSection', () => ({
  WaitlistSection: () => null,
}))

function minimalLanding(
  overrides: Partial<LandingPageCmsContent> = {},
): LandingPageCmsContent {
  return {
    ...landingCmsDefaults,
    landingActs: [
      {
        id: 'act-hero-1',
        nature: 'hero',
        preset: 'theOathCinematic',
        sortOrder: 0,
        enabled: true,
        slotKey: 'hero',
        animation: { enabled: true, desktopOnly: true, type: 'fade', intensity: 'standard' },
      },
    ],
    ...overrides,
  }
}

describe('PublicLandingActs', () => {
  it('overlays hero copy from landing.dropActs on the storefront', async () => {
    const dropActs: LandingAct[] = [
      {
        id: 'act-hero-1',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        eyebrow: 'Drop 02',
        title: 'FORGED HEADLINE',
        subtitle: 'From acts builder',
      },
    ]

    render(
      <PublicLandingActs
        landing={minimalLanding({ dropActs })}
        products={[]}
      />,
    )

    expect(await screen.findByTestId('hero')).toHaveTextContent(
      'Drop 02 — FORGED HEADLINE',
    )
  })
})
