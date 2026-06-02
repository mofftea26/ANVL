import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { DropActsBuilderPanel } from '@/features/admin/drops/DropActsBuilderPanel'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { defaultLandingActSequence } from '@/features/admin/drops/drops.actSequence'
import type { LandingAct } from '@/features/admin/drops/acts/landingActs.types'

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
      {
        id: 'act-fixture-c',
        nature: 'lookbook',
        preset: 'masonry',
        isEnabled: true,
        sortOrder: 2,
        title: 'Fixture lookbook',
        content: safeParseActContent('lookbook', {}),
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
      />,
    )

    const panel = screen.getByTestId('drop-acts-builder-panel')
    expect(panel.querySelector('select')).toBeNull()
  })

  it('uses icon toolbar buttons with disabled move controls at ends', () => {
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
      {
        id: 'act-fixture-c',
        nature: 'lookbook',
        preset: 'masonry',
        isEnabled: true,
        sortOrder: 2,
        title: 'Fixture lookbook',
        content: safeParseActContent('lookbook', {}),
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
      />,
    )

    const moveUp = screen.getAllByRole('button', { name: /Move act up/i })
    expect(moveUp).toHaveLength(3)
    expect((moveUp[0] as HTMLButtonElement).disabled).toBe(true)
    expect((moveUp[1] as HTMLButtonElement).disabled).toBe(false)
    expect((moveUp[2] as HTMLButtonElement).disabled).toBe(false)

    const moveDown = screen.getAllByRole('button', { name: /Move act down/i })
    expect(moveDown).toHaveLength(3)
    expect((moveDown[0] as HTMLButtonElement).disabled).toBe(false)
    expect((moveDown[1] as HTMLButtonElement).disabled).toBe(false)
    expect((moveDown[2] as HTMLButtonElement).disabled).toBe(true)

    expect(screen.getAllByRole('button', { name: /Remove act/i })).toHaveLength(
      3,
    )
  })

  it('disables both reorder icons when there is only one act', () => {
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
      />,
    )

    expect((screen.getByRole('button', { name: /^Move act up$/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /^Move act down$/ }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: /^Remove act$/ }) as HTMLButtonElement).disabled).toBe(false)
  })

  it('shows cinematic hero editor fields when theOathCinematic preset is selected', () => {
    const acts: LandingAct[] = [
      {
        id: 'cinematic-act',
        nature: 'hero',
        preset: 'theOathCinematic',
        isEnabled: true,
        sortOrder: 0,
        title: 'FORGED',
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
        dropSlug="the-oath"
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/Background video \(optional\)/i)).toBeTruthy()
    expect(screen.getByText(/Poster image/i)).toBeTruthy()
    expect(screen.queryByText(/Act video \(optional\)/i)).toBeNull()
  })
})
