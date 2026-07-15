import { describe, expect, it } from 'vitest'
import { resolvePassportStage } from '@/features/passport/lib/passportStage'
import type { PassportView } from '@/features/passport/schemas/passport.schema'

function view(overrides: Partial<PassportView>): PassportView {
  return {
    productSlug: 'seamless-tee',
    productName: 'Seamless Tee',
    serialNumber: 1,
    editionTotal: 100,
    isClaimed: false,
    isOwner: false,
    claimedDisplayName: null,
    claimedAt: null,
    claimedColor: null,
    claimedSize: null,
    isPublic: false,
    isTransferPending: false,
    transferValid: false,
    ...overrides,
  }
}

describe('resolvePassportStage', () => {
  it('unknown token → not_found', () => {
    expect(resolvePassportStage(null, null)).toBe('not_found')
    expect(resolvePassportStage(null, 'user-1')).toBe('not_found')
  })

  it('my claimed piece → owner (signed in or not — RPC decided ownership)', () => {
    expect(resolvePassportStage(view({ isClaimed: true, isOwner: true }), 'user-1')).toBe('owner')
  })

  it("someone else's piece → public authenticity view", () => {
    const claimed = view({ isClaimed: true, isOwner: false, claimedDisplayName: 'A' })
    expect(resolvePassportStage(claimed, null)).toBe('public')
    expect(resolvePassportStage(claimed, 'user-2')).toBe('public')
  })

  it('unclaimed + signed out → teaser', () => {
    expect(resolvePassportStage(view({}), null)).toBe('teaser')
  })

  it('unclaimed + signed in → onboarding', () => {
    expect(resolvePassportStage(view({}), 'user-1')).toBe('onboarding')
  })

  it('live transfer code on a claimed piece → offer (signed in) / teaser (signed out)', () => {
    const offered = view({ isClaimed: true, isOwner: false, transferValid: true })
    expect(resolvePassportStage(offered, 'user-2')).toBe('transfer_offer')
    expect(resolvePassportStage(offered, null)).toBe('transfer_teaser')
  })

  it('a dead transfer code falls back to the public view', () => {
    const claimed = view({ isClaimed: true, isOwner: false, transferValid: false })
    expect(resolvePassportStage(claimed, 'user-2')).toBe('public')
  })

  it('the owner stays owner even while a transfer is pending', () => {
    const mine = view({ isClaimed: true, isOwner: true, isTransferPending: true })
    expect(resolvePassportStage(mine, 'user-1')).toBe('owner')
  })
})
