import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { OwnedPassport, ProductReview } from '@/features/passport/schemas/passport.schema'

const state: {
  reviews: ProductReview[]
  owned: OwnedPassport[]
  submit: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
} = { reviews: [], owned: [], submit: vi.fn(), remove: vi.fn() }

vi.mock('@/features/passport/hooks/usePassport', () => ({
  useOwnedPassportsQuery: () => ({ data: state.owned }),
}))
vi.mock('@/features/passport/hooks/useArmory', () => ({
  useProductReviewsQuery: () => ({ data: state.reviews, isLoading: false }),
  useSubmitReviewMutation: () => ({ mutate: state.submit, isPending: false, data: undefined }),
  useDeleteReviewMutation: () => ({ mutate: state.remove, isPending: false }),
}))

import { PdpReviews } from '@/features/products/pdp/PdpReviews'

function review(overrides: Partial<ProductReview> = {}): ProductReview {
  return {
    displayName: 'Test Warrior',
    rating: 5,
    title: 'Holds up',
    body: 'Survived every session.',
    createdAt: '2026-07-10T10:00:00Z',
    isMine: false,
    ...overrides,
  }
}

function ownedPiece(slug: string): OwnedPassport {
  return {
    id: slug,
    token: `t-${slug}`,
    productSlug: slug,
    productName: slug,
    serialNumber: 1,
    editionTotal: 100,
    claimedAt: null,
    claimedColor: null,
    claimedSize: null,
    wearCount: 0,
    lastWornAt: null,
    featuredSlot: null,
    isPublic: false,
  }
}

describe('PdpReviews', () => {
  beforeEach(() => {
    state.reviews = []
    state.owned = []
    state.submit = vi.fn()
    state.remove = vi.fn()
  })

  it('renders nothing when there are no reviews and the viewer is not an owner', () => {
    const { container } = render(<PdpReviews slug="oversized-tee" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows reviews with a Verified owner badge, but no write form for non-owners', () => {
    state.reviews = [review()]
    render(<PdpReviews slug="oversized-tee" />)
    expect(screen.getByText('Survived every session.')).toBeTruthy()
    expect(screen.getByText(/verified owner/i)).toBeTruthy()
    expect(screen.queryByRole('button', { name: /write a review/i })).toBeNull()
  })

  it('offers a write form only to a verified owner of this product', () => {
    state.owned = [ownedPiece('oversized-tee')]
    render(<PdpReviews slug="oversized-tee" />)
    fireEvent.click(screen.getByRole('button', { name: /write a review/i }))
    fireEvent.change(screen.getByLabelText('Display name'), { target: { value: 'Me' } })
    fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Great.' } })
    fireEvent.click(screen.getByRole('button', { name: /post review/i }))
    expect(state.submit).toHaveBeenCalledTimes(1)
    expect(state.submit.mock.calls[0]![0]).toMatchObject({ body: 'Great.', displayName: 'Me' })
  })

  it("prefills and can delete the owner's own review", () => {
    state.owned = [ownedPiece('oversized-tee')]
    state.reviews = [review({ isMine: true, body: 'My take.' })]
    render(<PdpReviews slug="oversized-tee" />)
    fireEvent.click(screen.getByRole('button', { name: /edit your review/i }))
    expect((screen.getByLabelText('Review') as HTMLTextAreaElement).value).toBe('My take.')
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(state.remove).toHaveBeenCalledTimes(1)
  })
})
