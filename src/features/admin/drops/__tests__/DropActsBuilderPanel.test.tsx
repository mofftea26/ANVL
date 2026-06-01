import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { DropActsBuilderPanel } from '@/features/admin/drops/DropActsBuilderPanel'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { composeLandingPageFromDrop } from '@/features/cms/landing/composeLandingPageFromDrop'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'

function previewProps() {
  const drop = createDefaultTheOathDrop()
  return {
    previewLanding: composeLandingPageFromDrop(
      drop,
      createDefaultWebsiteLayout(),
      { editorActsPreview: true },
    ),
    previewProducts: [],
    palette: drop.theme,
    emblemUrl: drop.visuals.emblemImageUrl,
  }
}

describe('DropActsBuilderPanel', () => {
  it('does not mount native select elements inside the Acts admin card', () => {
    const acts: LandingAct[] = [
      {
        id: 'act-fixture-a',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'Fixture hero',
        content: safeParseActContent('hero', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
      {
        id: 'act-fixture-b',
        nature: 'productShowcase',
        preset: 'threeCardEditorial',
        isEnabled: true,
        sortOrder: 1,
        title: 'Fixture showcase',
        content: safeParseActContent('productShowcase', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    const panel = screen.getByTestId('drop-acts-builder-panel')
    expect(panel.querySelector('select')).toBeNull()
  })

  it('renders a horizontal draggable act sequence rail', () => {
    const acts: LandingAct[] = [
      {
        id: 'act-fixture-a',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'Fixture hero',
        content: safeParseActContent('hero', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
      {
        id: 'act-fixture-b',
        nature: 'productShowcase',
        preset: 'threeCardEditorial',
        isEnabled: true,
        sortOrder: 1,
        title: 'Fixture showcase',
        content: safeParseActContent('productShowcase', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    expect(screen.getByTestId('drop-act-list-rail')).toBeTruthy()
    expect(screen.getByRole('list', { name: 'Landing acts' })).toBeTruthy()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /Remove/i })).toHaveLength(2)
  })

  it('shows act preview on the left column label', () => {
    const acts: LandingAct[] = [
      {
        id: 'solo-act',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'Only',
        content: safeParseActContent('hero', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    expect(screen.getByRole('button', { name: /Play animation/i })).toBeTruthy()
  })

  it('shows user-friendly preset labels while keeping stored preset ids', async () => {
    const user = userEvent.setup()
    const acts: LandingAct[] = [
      {
        id: 'final-act',
        nature: 'finalCTA',
        preset: 'oathForgeClose',
        isEnabled: true,
        sortOrder: 0,
        title: 'Forge close',
        content: safeParseActContent('finalCTA', {}),
        animation: mergeActAnimationConfig(),
        media: {},
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    const presetTrigger = screen.getByRole('combobox', { name: /preset/i })
    expect(presetTrigger.textContent).toMatch(/oath forge close/i)
    expect(presetTrigger.textContent).not.toMatch(/oathForgeClose/i)

    await user.click(presetTrigger)
    expect(screen.getByRole('option', { name: 'Oath forge close' })).toBeTruthy()
  })

  it('hides body field for hero acts and shows hero stat fields', async () => {
    const user = userEvent.setup()
    const acts: LandingAct[] = [
      {
        id: 'hero-act',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'Hero',
        content: safeParseActContent('hero', { heroStatus: 'Soon' }),
        animation: mergeActAnimationConfig({ type: 'fadeUp' }),
        media: {},
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    expect(screen.queryByLabelText(/^body$/i)).toBeNull()
    expect(screen.getByText(/^drop$/i)).toBeTruthy()
    expect(screen.getByText(/^pieces$/i)).toBeTruthy()
    expect(screen.getByText(/^status$/i)).toBeTruthy()

    const motionTrigger = screen.getByRole('combobox', { name: /motion type/i })
    expect(motionTrigger.textContent).toMatch(/fade up/i)
    await user.click(motionTrigger)
    expect(screen.getByRole('option', { name: 'Word reveal' })).toBeTruthy()
  })

  it('shows act image and act video fields for hero media', () => {
    const acts: LandingAct[] = [
      {
        id: 'media-act',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'Hero',
        content: safeParseActContent('hero', {}),
        animation: mergeActAnimationConfig(),
        media: { videoUrl: 'https://example.com/clip.mp4' },
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    expect(screen.getByText(/act image \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/act video \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/clears video when set/i)).toBeTruthy()
  })

  it('shows background and foreground media fields for layered hero presets', () => {
    const acts: LandingAct[] = [
      {
        id: 'split-act',
        nature: 'hero',
        preset: 'splitProduct',
        isEnabled: true,
        sortOrder: 0,
        title: 'Split hero',
        content: safeParseActContent('hero', {
          foregroundImageUrl: 'https://example.com/product.png',
        }),
        animation: mergeActAnimationConfig(),
        media: { imageUrl: 'https://example.com/bg.jpg' },
      },
    ]

    render(
      <DropActsBuilderPanel
        landingContentJson="{}"
        acts={acts}
        landingActSequence={defaultLandingActSequence()}
        onChange={vi.fn()}
        {...previewProps()}
      />,
    )

    expect(screen.getByText(/background media/i)).toBeTruthy()
    expect(screen.getByText(/background image \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/background video \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/foreground media/i)).toBeTruthy()
    expect(screen.getByText(/foreground image \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/foreground video \(optional\)/i)).toBeTruthy()
    expect(screen.queryByText(/act image \(optional\)/i)).toBeNull()
  })
})
