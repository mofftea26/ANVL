import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PassportBlueprint } from '@/features/passport/components/PassportBlueprint'
import {
  PASSPORT_SECTIONS,
  type PassportSectionContext,
} from '@/features/passport/components/console/passportSections'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

const blueprint: ResolvedPassportContent['blueprint'] = {
  heading: 'Blueprint',
  intro: 'Every seam, named.',
  features: [
    {
      code: 'a',
      title: 'High neck front neckline style',
      body: 'Cut higher so the collar sits on the throat.',
    },
    {
      code: 'j',
      title: 'Hem wrapped jacquard damask weave brand label',
      body: 'Woven, not printed.',
    },
  ],
  points: [],
}

describe('PassportBlueprint', () => {
  it('renders one card per callout, as an ordered list', () => {
    render(<PassportBlueprint blueprint={blueprint} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(screen.getByText('Every seam, named.')).toBeTruthy()
  })

  it('carries the title and body of every callout as real text', () => {
    // The construction facts are the whole surface now — nothing is hidden
    // behind a hover, a marker or a coordinate.
    render(<PassportBlueprint blueprint={blueprint} />)
    for (const feature of blueprint.features) {
      expect(screen.getByRole('heading', { name: feature.title })).toBeTruthy()
      expect(screen.getByText(feature.body)).toBeTruthy()
    }
  })

  it('shows no drawing and no markers', () => {
    // THE pivot: the extracted supplier flat was never accurate enough to pin
    // anything to, so neither it nor its markers may come back.
    const { container } = render(<PassportBlueprint blueprint={blueprint} />)
    expect(container.querySelector('img')).toBeNull()
    expect(container.querySelector('[data-blueprint-marker]')).toBeNull()
    expect(container.querySelector('button')).toBeNull()
  })

  it('keeps the techpack letter out of the accessible name', () => {
    // "a" and "j" only meant something beside the drawing they were printed
    // on; read before every title they are noise.
    render(<PassportBlueprint blueprint={blueprint} />)
    const heading = screen.getByRole('heading', {
      name: 'Hem wrapped jacquard damask weave brand label',
    })
    expect(heading.textContent).toBe('Hem wrapped jacquard damask weave brand label')
  })

  it('renders nothing when a product has no callouts', () => {
    const { container } = render(
      <PassportBlueprint blueprint={{ ...blueprint, features: [] }} />,
    )
    expect(container.firstChild).toBeNull()
  })
})

const view: PassportView = {
  productSlug: 'oversized-tee',
  productName: 'Oversized Tee',
  serialNumber: 7,
  editionTotal: 100,
  isClaimed: true,
  isOwner: true,
  claimedDisplayName: 'Test Warrior',
  claimedAt: '2026-07-14T10:00:00Z',
  claimedColor: 'Onyx',
  claimedSize: 'M',
  isPublic: false,
  isTransferPending: false,
  transferValid: false,
  ownerArmoryHandle: null,
}

const emptyContent: ResolvedPassportContent = {
  identity: { tagline: '', authenticityNote: '' },
  piece: { gallery: [] },
  material: { title: '', note: '', materials: [] },
  specs: {
    construction: '',
    fitType: '',
    compression: '',
    stretch: '',
    breathability: '',
    intendedUse: '',
    points: [],
  },
  fit: {
    intendedFit: '',
    measurements: [],
    stretchRange: '',
    modelHeight: '',
    modelSize: '',
    sizeAdvice: '',
    points: [],
  },
  forgeNotes: [],
  hotspots: [],
  blueprint: { heading: 'Blueprint', intro: '', features: [], points: [] },
  care: { intro: '', steps: [], symbols: [], careItems: [], notes: [] },
  details: { heading: '', story: '', facts: [], funFact: '' },
  origin: { label: '', place: '', story: '', madeIn: '', designedIn: '' },
}

function ctxWith(content: ResolvedPassportContent): PassportSectionContext {
  return {
    view,
    product: null,
    content,
    claimedDate: null,
    storyChapter: null,
    sizeGuide: null,
    related: null,
    token: null,
  }
}

describe('blueprint passport section', () => {
  const section = PASSPORT_SECTIONS.find((s) => s.key === 'blueprint')!

  it('is a Craft section that stays hidden until callouts are authored', () => {
    expect(section.group).toBe('craft')
    expect(section.available(ctxWith(emptyContent))).toBe(false)
    expect(section.available(ctxWith({ ...emptyContent, blueprint }))).toBe(true)
  })

  it('carries no card image — the product render is its visual', () => {
    const ctx = ctxWith({ ...emptyContent, blueprint: { ...blueprint, intro: '' } })
    expect(section.cardImage).toBeUndefined()
    expect(section.teaser(ctx)).toContain('2 construction callouts')
  })
})
