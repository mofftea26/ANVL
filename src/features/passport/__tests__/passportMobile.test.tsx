import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

vi.mock('@/shared/lib/gsap', () => ({
  gsap: { fromTo: () => undefined, to: () => undefined, set: () => undefined, killTweensOf: () => undefined },
}))
vi.mock('@gsap/react', () => ({ useGSAP: () => undefined }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#shop">{children}</a>,
}))

import { PassportMobile } from '@/features/passport/components/PassportMobile'

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
}

const content: ResolvedPassportContent = {
  identity: { tagline: 'Forged for the off-day.', authenticityNote: '' },
  piece: { heroRenderUrl: undefined, gallery: [] },
  material: { title: 'Heavyweight cotton', note: '240 GSM', macroUrl: undefined },
  specs: {
    construction: 'Seamless knit',
    fitType: 'Relaxed',
    compression: '',
    stretch: '',
    breathability: '',
    intendedUse: '',
  },
  fit: {
    intendedFit: 'Relaxed',
    measurements: [],
    stretchRange: '',
    modelHeight: '',
    modelSize: '',
    sizeAdvice: '',
  },
  forgeNotes: [],
  hotspots: [{ x: 50, y: 30, title: 'Shoulder knit', body: 'Ribbed for load.' }],
  care: { intro: '', steps: ['Cold wash', 'Hang dry'], symbols: [], notes: [] },
  details: { heading: 'Forged details', story: 'A story.', facts: ['Fact'], funFact: '' },
  origin: {
    label: 'Forged in Lebanon',
    place: 'Beirut',
    story: '',
    assetUrl: undefined,
    madeIn: 'lebanon',
    designedIn: 'portugal',
  },
}

function renderMobile(variant: 'owner' | 'public' = 'owner') {
  return render(
    <PassportMobile
      variant={variant}
      view={view}
      product={null}
      content={content}
      storyChapter={null}
      sizeGuide={null}
      claimedDate="14 July 2026"
    />,
  )
}

describe('PassportMobile — same section behavior as the desktop console', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('leads with the title, then tabs over a small bento grid', () => {
    renderMobile()
    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /the craft/i })).toBeTruthy()
    expect(screen.getByRole('button', { name: /material dossier/i })).toBeTruthy()
    // Other groups' cards are not in the craft tab.
    expect(screen.queryByRole('button', { name: /origin/i })).toBeNull()
  })

  it('opens a bento detail and returns — no animation clock required', () => {
    renderMobile()
    fireEvent.click(screen.getByRole('button', { name: /material dossier/i }))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByRole('heading', { name: 'Material dossier' })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /back to the craft/i }))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByRole('button', { name: /material dossier/i })).toBeTruthy()
  })

  it('switches groups via tabs', () => {
    renderMobile()
    fireEvent.click(screen.getByRole('tab', { name: /the legacy/i }))
    act(() => {
      vi.advanceTimersByTime(400)
    })
    expect(screen.getByRole('button', { name: /origin/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /material dossier/i })).toBeNull()
  })

  it('the public view stops at the identity strip — no dossier for other people', () => {
    renderMobile('public')
    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
    expect(screen.queryByRole('tab')).toBeNull()
    expect(screen.getByText(/already registered to its owner/i)).toBeTruthy()
  })
})
