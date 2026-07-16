import { describe, expect, it } from 'vitest'
import { buildCeremonyLines } from '@/features/passport/lib/ceremonyLines'
import type { ResolvedPassportContent } from '@/features/passport/lib/resolvePassportContent'
import type { PassportView } from '@/features/passport/schemas/passport.schema'
import type { Product } from '@/features/products/types/product.types'

const view: PassportView = {
  productSlug: 'oversized-tee',
  productName: 'Oversized Tee',
  serialNumber: 7,
  editionTotal: 100,
  isClaimed: true,
  isOwner: true,
  claimedDisplayName: 'Test Warrior',
  claimedAt: '2026-07-15T10:00:00Z',
  claimedColor: 'Onyx',
  claimedSize: 'M',
  isPublic: false,
  isTransferPending: false,
  transferValid: false,
}

function content(overrides: Partial<ResolvedPassportContent> = {}): ResolvedPassportContent {
  return {
    identity: { tagline: '', authenticityNote: '' },
    piece: { heroRenderUrl: undefined, gallery: [] },
    material: { title: 'Heavyweight cotton', note: '', macroUrl: undefined },
    specs: {
      construction: '',
      fitType: '',
      compression: '',
      stretch: '',
      breathability: '',
      intendedUse: '',
    },
    fit: {
      intendedFit: '',
      measurements: [],
      stretchRange: '',
      modelHeight: '',
      modelSize: '',
      sizeAdvice: '',
    },
    forgeNotes: [],
    hotspots: [],
    care: { intro: '', steps: [], symbols: [], notes: [] },
    details: { heading: '', story: '', facts: [], funFact: '' },
    origin: {
      label: 'Forged in Lebanon',
      place: '',
      story: '',
      assetUrl: undefined,
      madeIn: 'lebanon',
      designedIn: 'portugal',
    },
    ...overrides,
  }
}

const product = { dropName: 'The Oath', fabric: 'Fallback fabric' } as Product

describe('buildCeremonyLines', () => {
  it('states only true things from the record just written', () => {
    const lines = buildCeremonyLines({
      view,
      product,
      content: content(),
      claimedDate: '15 July 2026',
    })
    expect(lines).toEqual([
      { label: 'Piece', value: 'Oversized Tee' },
      { label: 'Drop', value: 'The Oath' },
      { label: 'Material', value: 'Heavyweight cotton' },
      { label: 'Origin', value: 'Lebanon' },
      { label: 'Colorway', value: 'Onyx' },
      { label: 'Size', value: 'M' },
      { label: 'Registered', value: '15 July 2026' },
    ])
  })

  it('never invents a line it cannot substantiate', () => {
    const lines = buildCeremonyLines({
      view: { ...view, claimedColor: null, claimedSize: null },
      product: null,
      content: content({
        material: { title: '', note: '', macroUrl: undefined },
        origin: {
          label: '',
          place: '',
          story: '',
          assetUrl: undefined,
          // An unknown country key must not produce a bogus origin line.
          madeIn: 'atlantis',
          designedIn: '',
        },
      }),
      claimedDate: null,
    })
    expect(lines).toEqual([{ label: 'Piece', value: 'Oversized Tee' }])
  })

  it('falls back to the product fabric when no material is authored', () => {
    const lines = buildCeremonyLines({
      view,
      product,
      content: content({ material: { title: '', note: '', macroUrl: undefined } }),
      claimedDate: null,
    })
    expect(lines).toContainEqual({ label: 'Material', value: 'Fallback fabric' })
  })

  it('resolves the origin country key to its real label', () => {
    const lines = buildCeremonyLines({
      view,
      product,
      content: content({
        origin: {
          label: '',
          place: '',
          story: '',
          assetUrl: undefined,
          madeIn: 'portugal',
          designedIn: '',
        },
      }),
      claimedDate: null,
    })
    expect(lines).toContainEqual({ label: 'Origin', value: 'Portugal' })
  })
})
