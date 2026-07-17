import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { publicArmorySchema } from '@/features/passport/schemas/passport.schema'

vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a href="#">{children}</a>,
}))

import { PublicArmoryView } from '@/features/passport/components/PublicArmoryView'

describe('publicArmorySchema', () => {
  it('parses the RPC projection and ignores fields it does not expose', () => {
    // The RPC only ever returns safe fields; even if extra keys appeared, the
    // schema keeps just the public projection (no token/serial/user_id).
    const parsed = publicArmorySchema.parse({
      owner_name: 'Test Warrior',
      total_pieces: 3,
      pieces: [
        {
          product_slug: 'oversized-tee',
          product_name: 'Oversized Tee',
          claimed_at: '2026-07-10T10:00:00Z',
          claimed_color: 'Onyx',
          claimed_size: 'M',
          wear_count: 12,
          featured_slot: 1,
        },
      ],
      feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01' }],
    })
    expect(parsed.ownerName).toBe('Test Warrior')
    expect(parsed.totalPieces).toBe(3)
    expect(parsed.pieces[0]).toMatchObject({ productName: 'Oversized Tee', wearCount: 12 })
    expect(parsed.pieces[0]).not.toHaveProperty('token')
    expect(parsed.feats[0]!.title).toBe('Deadlift PR — 240 kg')
  })

  it('defaults empty pieces/feats', () => {
    const parsed = publicArmorySchema.parse({ owner_name: 'A', total_pieces: 0 })
    expect(parsed.pieces).toEqual([])
    expect(parsed.feats).toEqual([])
  })
})

describe('PublicArmoryView (read-only)', () => {
  const armory = publicArmorySchema.parse({
    owner_name: 'Test Warrior',
    total_pieces: 2,
    pieces: [
      {
        product_slug: 'oversized-tee',
        product_name: 'Oversized Tee',
        claimed_at: '2026-07-10T10:00:00Z',
        claimed_color: 'Onyx',
        claimed_size: 'M',
        wear_count: 12,
        featured_slot: 1,
      },
    ],
    feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01' }],
  })

  it('renders the owner, honored piece, and the War Record — with no interactive controls', () => {
    render(<PublicArmoryView armory={armory} images={{ 'oversized-tee': 'tee.png' }} />)
    // h1 = the page header; the War Record card repeats the name as an h2.
    expect(screen.getByRole('heading', { level: 1, name: 'Test Warrior' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hall of Honor' })).toBeTruthy()
    expect(screen.getAllByText('Oversized Tee').length).toBeGreaterThan(0)
    // War Record card: stats + the feat tied to its piece.
    expect(screen.getByText(/war record/i)).toBeTruthy()
    expect(screen.getByText('Wears logged')).toBeTruthy()
    expect(screen.getByText('Deadlift PR — 240 kg')).toBeTruthy()
    // Read-only: no wear button, no pin.
    expect(screen.queryByRole('button', { name: /wore it/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /hall of honor/i })).toBeNull()
  })
})
