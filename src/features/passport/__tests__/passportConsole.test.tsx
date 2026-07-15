import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

// GSAP is decoration in the console — mock it away entirely. The regression
// this suite guards: tab/section swaps must work WITHOUT any animation clock
// (they once hinged on a mid-timeline GSAP callback and content never appeared).
vi.mock('@/shared/lib/gsap', () => {
  const chain: Record<string, unknown> = {}
  chain.fromTo = () => chain
  chain.to = () => chain
  chain.call = () => chain
  chain.kill = () => undefined
  return {
    gsap: {
      timeline: () => chain,
      fromTo: () => chain,
      to: () => chain,
      set: () => undefined,
      killTweensOf: () => undefined,
    },
  }
})
vi.mock('@gsap/react', () => ({
  useGSAP: () => undefined,
}))
vi.mock('@/features/passport/webgl/PassportForgeGate', () => ({
  PASSPORT_CONSOLE_MQ: '(min-width: 1280px) and (prefers-reduced-motion: no-preference)',
  PassportForgeGate: () => null,
}))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#story">{children}</a>,
}))

import { PassportConsole } from '@/features/passport/components/console/PassportConsole'

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
    stretch: 'Four-way',
    breathability: '',
    intendedUse: '',
  },
  fit: {
    intendedFit: 'Relaxed',
    measurements: [{ label: 'Chest', value: '52 cm' }],
    stretchRange: '',
    modelHeight: '183 cm',
    modelSize: 'M',
    sizeAdvice: '',
  },
  forgeNotes: [{ title: 'Eleven revisions', body: 'The collar alone took four.' }],
  care: { intro: '', steps: ['Cold wash', 'Hang dry'], symbols: ['no-bleach'], notes: [] },
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

function renderConsole() {
  return render(
    <PassportConsole
      view={view}
      product={null}
      content={content}
      storyChapter={null}
      sizeGuide={null}
      claimedDate="14 July 2026"
    />,
  )
}

describe('PassportConsole tabs + section swap (no animation clock required)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('defaults to THE CRAFT and opens a section detail after the swap timer', () => {
    renderConsole()

    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: /the craft/i })).toBeTruthy()
    // Craft group cards only.
    expect(screen.getByRole('button', { name: /material dossier/i })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /origin/i })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /material dossier/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('heading', { name: 'Material dossier' })).toBeTruthy()
    expect(screen.getByText('240 GSM')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /back to the craft/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
  })

  it('switches groups via tabs and shows the world-map origin section', () => {
    renderConsole()

    fireEvent.click(screen.getByRole('tab', { name: /the legacy/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('button', { name: /origin/i })).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /origin/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('heading', { name: 'Origin' })).toBeTruthy()
    // Two pins: designed in Portugal, made in Lebanon.
    expect(screen.getByText('Portugal')).toBeTruthy()
    expect(screen.getByText('Lebanon')).toBeTruthy()
  })

  it('ignores re-clicks while a transition is in flight', () => {
    renderConsole()
    fireEvent.click(screen.getByRole('button', { name: /material dossier/i }))
    fireEvent.click(screen.getByRole('button', { name: /forged details/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('heading', { name: 'Material dossier' })).toBeTruthy()
  })
})
