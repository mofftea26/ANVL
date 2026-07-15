import { describe, expect, it } from 'vitest'
import {
  claimPassportResultSchema,
  ownedPassportSchema,
  passportViewSchema,
} from '@/features/passport/schemas/passport.schema'

const rpcView = {
  product_slug: 'seamless-tee',
  product_name: 'Seamless Tee',
  serial_number: 17,
  edition_total: 100,
  is_claimed: true,
  is_owner: false,
  claimed_display_name: 'George M.',
  claimed_at: '2026-07-13T10:00:00Z',
  claimed_color: null,
  claimed_size: null,
}

describe('passportViewSchema', () => {
  it('parses the RPC jsonb into a camelCase view', () => {
    const view = passportViewSchema.parse(rpcView)
    expect(view.productSlug).toBe('seamless-tee')
    expect(view.serialNumber).toBe(17)
    expect(view.editionTotal).toBe(100)
    expect(view.isClaimed).toBe(true)
    expect(view.isOwner).toBe(false)
    expect(view.claimedDisplayName).toBe('George M.')
    expect(view.claimedColor).toBeNull()
  })

  it('keeps owner-only fields when present (owner projection)', () => {
    const view = passportViewSchema.parse({
      ...rpcView,
      is_owner: true,
      claimed_color: 'Iron',
      claimed_size: 'M',
    })
    expect(view.isOwner).toBe(true)
    expect(view.claimedColor).toBe('Iron')
    expect(view.claimedSize).toBe('M')
  })

  it('rejects a malformed projection', () => {
    expect(passportViewSchema.safeParse({ product_slug: '' }).success).toBe(false)
  })
})

describe('claimPassportResultSchema', () => {
  it('parses a successful claim', () => {
    const result = claimPassportResultSchema.parse({
      ok: true,
      passport: { ...rpcView, is_owner: true, claimed_color: 'Iron', claimed_size: 'M' },
    })
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.passport.serialNumber).toBe(17)
  })

  it('parses each failure discriminant', () => {
    for (const error of ['not_found', 'already_claimed', 'not_authenticated', 'invalid_input']) {
      const result = claimPassportResultSchema.parse({ ok: false, error })
      expect(result.ok).toBe(false)
    }
  })

  it('rejects unknown error codes', () => {
    expect(
      claimPassportResultSchema.safeParse({ ok: false, error: 'mystery' }).success,
    ).toBe(false)
  })
})

describe('ownedPassportSchema', () => {
  it('parses an owner row from the table select', () => {
    const owned = ownedPassportSchema.parse({
      id: 'abc',
      token: 'tok-123',
      product_slug: 'seamless-tee',
      product_name: 'Seamless Tee',
      serial_number: 3,
      edition_total: 100,
      claimed_at: '2026-07-13T10:00:00Z',
      claimed_color: 'Iron',
      claimed_size: 'L',
    })
    expect(owned.productSlug).toBe('seamless-tee')
    expect(owned.serialNumber).toBe(3)
    expect(owned.claimedSize).toBe('L')
  })
})

describe('serial privacy (final product decision: no serial display)', () => {
  it('keeps serial data internal — the view parses it but marks nothing for display', () => {
    const view = passportViewSchema.parse(rpcView)
    // Data-layer field exists (admin ledger, sorting) …
    expect(view.serialNumber).toBe(17)
    // … and there is deliberately no formatter exported for customer surfaces.
  })
})
