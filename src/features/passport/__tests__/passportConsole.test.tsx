import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

// GSAP is decoration in the console — mock it away entirely. The regression
// this suite guards: the section swap must work WITHOUT any animation clock
// (it once hinged on a mid-timeline GSAP callback and content never appeared).
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
  isTransferPending: false,
  transferValid: false,
}

const content: ResolvedPassportContent = {
  identity: { tagline: 'Forged for the off-day.', authenticityNote: '' },
  piece: { heroRenderUrl: undefined, gallery: [] },
  material: { title: 'Heavyweight cotton', note: '240 GSM', macroUrl: undefined },
  care: { intro: '', steps: ['Cold wash', 'Hang dry'] },
  details: { heading: 'Forged details', story: 'A story.', facts: ['Fact'], funFact: '' },
  origin: { label: 'Forged in Lebanon', place: 'Beirut', story: '', assetUrl: undefined },
}

function renderConsole() {
  return render(
    <PassportConsole
      view={view}
      product={null}
      content={content}
      hasStoryBook={false}
      claimedDate="14 July 2026"
    />,
  )
}

describe('PassportConsole section swap (no animation clock required)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('opens a section detail after the swap timer and returns to the bento', () => {
    renderConsole()

    // Bento view: product heading + section cards.
    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
    const originCard = screen.getByRole('button', { name: /origin/i })

    fireEvent.click(originCard)
    // Content swaps via setTimeout — never a GSAP callback.
    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(screen.getByRole('heading', { name: 'Origin' })).toBeTruthy()
    expect(screen.getByText('Beirut')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /back to the passport/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })

    expect(screen.getByRole('heading', { name: 'Oversized Tee' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /material dossier/i })).toBeTruthy()
  })

  it('ignores re-clicks while a transition is in flight', () => {
    renderConsole()
    fireEvent.click(screen.getByRole('button', { name: /origin/i }))
    // Mid-flight: clicking another card must not double-swap.
    fireEvent.click(screen.getByRole('button', { name: /care ritual/i }))
    act(() => {
      vi.advanceTimersByTime(700)
    })
    expect(screen.getByRole('heading', { name: 'Origin' })).toBeTruthy()
  })
})
