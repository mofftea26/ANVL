/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import type { PublicLandingAct } from '@/features/cms/landing/landingActs.types'
import { CinematicScrollHeroPreset } from '@/features/marketing/cinematic-hero/CinematicScrollHero'

vi.mock('@/shared/lib/gsap', () => ({
  gsap: {
    matchMedia: () => ({ add: vi.fn(), revert: vi.fn() }),
    context: (fn: () => void) => {
      fn()
      return { revert: vi.fn() }
    },
    set: vi.fn(),
    utils: { toArray: () => [] },
    timeline: () => ({ to: vi.fn() }),
  },
  useGSAP: vi.fn(),
}))

vi.mock('@/features/marketing/default-landing/useScrollVideo', () => ({
  bindScrollVideo: () => undefined,
}))

vi.mock('@/shared/components/ui/SafeLink', () => ({
  SafeLink: ({
    href,
    children,
    className,
  }: {
    href: string
    children: React.ReactNode
    className?: string
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}))

const act: PublicLandingAct = {
  id: 'act-hero-cinematic',
  nature: 'hero',
  preset: 'cinematicScrollHero',
  sortOrder: 0,
  enabled: true,
  slotKey: 'hero',
  animation: { enabled: true, desktopOnly: true, type: 'fade', intensity: 'standard' },
}

describe('CinematicScrollHeroPreset', () => {
  it('renders cinematic hero sections without window access (SSR-safe)', () => {
    render(
      <CinematicScrollHeroPreset act={act} landing={landingCmsDefaults} products={[]} />,
    )
    expect(screen.getByRole('region', { name: /cinematic hero/i })).toBeInTheDocument()
    expect(screen.getAllByText(landingCmsDefaults.hero.title).length).toBeGreaterThanOrEqual(1)
  })

  it('keeps the first desktop beat visible before GSAP (opacity-100)', () => {
    const { container } = render(
      <CinematicScrollHeroPreset act={act} landing={landingCmsDefaults} products={[]} />,
    )
    const firstBeat = container.querySelector('[data-cinematic-beat-first]')
    expect(firstBeat).not.toBeNull()
    expect(firstBeat?.className).toMatch(/opacity-100/)
    expect(firstBeat?.className).not.toMatch(/opacity-0/)
  })

  it('hides non-first desktop beats before GSAP hydrates', () => {
    const { container } = render(
      <CinematicScrollHeroPreset act={act} landing={landingCmsDefaults} products={[]} />,
    )
    const stage = container.querySelector('[data-cinematic-stage]')
    const beats = stage?.querySelectorAll('[data-cinematic-beat]') ?? []
    expect(beats.length).toBeGreaterThan(1)
    beats.forEach((beat, index) => {
      if (index === 0) return
      expect(beat.className).toMatch(/opacity-0/)
      expect(beat.className).toMatch(/invisible/)
    })
  })
})
