import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

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
})
