import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import { CinematicHeroEditor } from '@/features/admin/drops/cinematic/CinematicHeroEditor'
import { mergeActAnimationConfig } from '@/features/admin/drops/acts/landingActs.types'
import { safeParseActContent } from '@/features/admin/drops/acts/landingActs.zod'
import { createDefaultTheOathDrop } from '@/features/admin/drops/drops.defaults'
import { CINEMATIC_SCROLL_HERO_PRESET } from '@/features/marketing/cinematic-hero/cinematicHero.types'

describe('CinematicHeroEditor', () => {
  it('renders section controls when preset is cinematicScrollHero', () => {
    const drop = createDefaultTheOathDrop()

    render(
      <CinematicHeroEditor
        act={{
          id: 'hero-cinematic',
          nature: 'hero',
          preset: CINEMATIC_SCROLL_HERO_PRESET,
          isEnabled: true,
          sortOrder: 0,
          title: 'Cinematic hero',
          content: safeParseActContent('hero', {}),
          animation: mergeActAnimationConfig(),
          media: {},
        }}
        landingContent={drop.landingContent}
        patchContent={vi.fn()}
      />,
    )

    expect(screen.getByText(/cinematic scroll hero/i)).toBeTruthy()
    expect(screen.getByText(/^sections$/i)).toBeTruthy()
    expect(screen.getByText(/scroll length/i)).toBeTruthy()
    expect(screen.getByRole('button', { name: /add section/i })).toBeTruthy()
    expect(screen.getByText(/hero intro/i)).toBeTruthy()
  })
})
