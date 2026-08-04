import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

vi.mock('@/shared/lib/gsap', () => ({
  gsap: { fromTo: () => undefined, to: () => undefined, set: () => undefined, killTweensOf: () => undefined },
}))
vi.mock('@gsap/react', () => ({ useGSAP: () => undefined }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    params,
  }: {
    children: React.ReactNode
    params?: Record<string, string>
  }) => <a href="#link" data-params={JSON.stringify(params ?? {})}>{children}</a>,
}))
// The console never renders for public views; keep its WebGL graph out of jsdom.
vi.mock('@/features/passport/components/console/PassportConsole', () => ({
  PassportConsole: () => null,
}))

import { PassportPage } from '@/features/passport/components/PassportPage'

const view: PassportView = {
  productSlug: 'oversized-tee',
  productName: 'Oversized Tee',
  serialNumber: 7,
  editionTotal: 100,
  isClaimed: true,
  isOwner: false,
  claimedDisplayName: 'Test Warrior',
  claimedAt: '2026-07-14T10:00:00Z',
  claimedColor: null,
  claimedSize: null,
  isPublic: true,
  isTransferPending: false,
  transferValid: false,
  ownerArmoryHandle: null,
}

const content: ResolvedPassportContent = {
  identity: { tagline: '', authenticityNote: '' },
  piece: { heroRenderUrl: undefined, gallery: [] },
  material: { title: '', note: '', macroUrl: undefined, materials: [] },
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
  blueprint: { heading: '', intro: '', features: [], points: [] },
  care: { intro: '', steps: [], symbols: [], careItems: [], notes: [] },
  details: { heading: '', story: '', facts: [], funFact: '' },
  origin: {
    label: '',
    place: '',
    story: '',
    assetUrl: undefined,
    madeIn: 'lebanon',
    designedIn: 'portugal',
  },
}

function renderPage(overrides: Partial<PassportView> = {}, variant: 'owner' | 'public' = 'public') {
  return render(
    <PassportPage
      variant={variant}
      token={null}
      view={{ ...view, ...overrides }}
      product={null}
      content={content}
      storyChapter={null}
      sizeGuide={null}
      related={null}
      claimedDate="14 July 2026"
    />,
  )
}

/**
 * The public authenticity view's second action: a link to the owner's public
 * armory, shown ONLY when `get_passport_by_token` released the handle. The
 * handle is the RPC's decision alone — the UI never invents one.
 */
describe('public authenticity view — owner armory link', () => {
  it('renders the armory link when the RPC released a handle', () => {
    renderPage({ ownerArmoryHandle: 'iron-warrior' })
    expect(screen.getByText(/already registered to its owner/i)).toBeTruthy()
    const link = screen.getByText(/view the owner.s armory/i).closest('a')
    expect(link).toBeTruthy()
    expect(link?.getAttribute('data-params')).toBe(JSON.stringify({ handle: 'iron-warrior' }))
  })

  it('renders no armory link when the handle was withheld', () => {
    renderPage({ ownerArmoryHandle: null })
    expect(screen.getByText(/already registered to its owner/i)).toBeTruthy()
    expect(screen.queryByText(/view the owner.s armory/i)).toBeNull()
  })

  it('never renders the armory link on the owner surface', () => {
    renderPage({ isOwner: true, ownerArmoryHandle: 'iron-warrior' }, 'owner')
    expect(screen.queryByText(/view the owner.s armory/i)).toBeNull()
  })
})
