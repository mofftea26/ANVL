/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MasonryLookbookPreset } from '@/features/marketing/act-presets/lookbook/MasonryLookbook'
import { EventCardPreset } from '@/features/marketing/act-presets/specialEvent/EventCard'
import { CenteredCtaPreset } from '@/features/marketing/act-presets/finalCTA/CenteredCta'
import { landingCmsDefaults } from '@/features/admin/landing-cms/landingCms.defaults'
import type { LandingAct } from '@/features/cms/landing/landingActs.types'

const actStub = {
  animation: { enabled: true, desktopOnly: true, type: 'fade' as const, intensity: 'standard' as const },
  slotKey: 'hero' as const,
}

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

vi.mock('@/shared/lib/gsap', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/gsap')>('@/shared/lib/gsap')
  return {
    ...actual,
    useGSAP: () => {},
  }
})

const baseAct: LandingAct = {
  id: 'act-1',
  nature: 'lookbook',
  preset: 'masonry',
  isEnabled: true,
  sortOrder: 0,
  eyebrow: 'Act label',
  title: 'Section title',
  body: 'Section intro',
}

describe('PR-9 act presets', () => {
  it('renders lookbook tiles from act content', () => {
    render(
      <MasonryLookbookPreset
        act={{
          id: 'a',
          nature: 'lookbook',
          preset: 'masonry',
          sortOrder: 0,
          enabled: true,
          ...actStub,
        }}
        landing={landingCmsDefaults}
        products={[]}
        row={{
          ...baseAct,
          content: {
            galleryItems: [{ src: '/brand/lookbook-1.webp', caption: 'Athlete tee' }],
          },
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Lookbook' })).toBeInTheDocument()
    expect(screen.getByText('Section title')).toBeInTheDocument()
    expect(screen.getByAltText('Athlete tee')).toBeInTheDocument()
  })

  it('renders special event card copy', () => {
    render(
      <EventCardPreset
        act={{
          id: 'a',
          nature: 'specialEvent',
          preset: 'eventCard',
          sortOrder: 0,
          enabled: true,
          ...actStub,
        }}
        landing={landingCmsDefaults}
        products={[]}
        row={{
          ...baseAct,
          nature: 'specialEvent',
          title: 'Pop-up lift',
          content: {
            location: 'Beirut',
            cta: { label: 'RSVP', href: '/events/oath' },
          },
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Special event' })).toBeInTheDocument()
    expect(screen.getByText('Pop-up lift')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'RSVP' })).toHaveAttribute('href', '/events/oath')
  })

  it('renders centered final CTA buttons', () => {
    render(
      <CenteredCtaPreset
        act={{
          id: 'a',
          nature: 'finalCTA',
          preset: 'centered',
          sortOrder: 0,
          enabled: true,
          ...actStub,
        }}
        landing={landingCmsDefaults}
        products={[]}
        row={{
          ...baseAct,
          nature: 'finalCTA',
          title: 'Join the oath',
          content: {
            primaryCta: { label: 'Shop now', href: '/shop' },
            secondaryCta: { label: 'Waitlist', href: '#waitlist' },
          },
        }}
      />,
    )

    expect(screen.getByRole('region', { name: 'Final call to action' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Shop now' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Waitlist' })).toBeInTheDocument()
  })
})
