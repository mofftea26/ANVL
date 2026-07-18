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
      feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01', product_slug: 'oversized-tee' }],
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
    feats: [{ title: 'Deadlift PR — 240 kg', achieved_on: '2026-07-01', product_slug: 'oversized-tee' }],
  })

  it('renders the athlete, pedestal Hall of Honor, and per-piece feats — read-only', () => {
    render(<PublicArmoryView armory={armory} images={{ 'oversized-tee': 'tee.png' }} />)
    expect(screen.getByRole('heading', { level: 1, name: 'Test Warrior' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Hall of Honor' })).toBeTruthy()
    expect(screen.getAllByText('Oversized Tee').length).toBeGreaterThan(0)
    // The record numbers strip (sr-only dt + visible label).
    expect(screen.getAllByText('Wears logged').length).toBeGreaterThan(0)
    // The feat renders on its piece's card back (it's tied to a shared slug).
    expect(screen.getByText(/Deadlift PR — 240 kg/)).toBeTruthy()
    expect(screen.queryByText(/more feats/i)).toBeNull()
    // Read-only: no wear button, no pin.
    expect(screen.queryByRole('button', { name: /wore it/i })).toBeNull()
    expect(screen.queryByRole('button', { name: /hall of honor/i })).toBeNull()
  })

  it('flips a collection card to its service record and back', async () => {
    const { fireEvent } = await import('@testing-library/react')
    const { container } = render(
      <PublicArmoryView armory={armory} images={{ 'oversized-tee': 'tee.png' }} />,
    )
    const back = container.querySelector('[inert]')
    // The record face starts hidden behind the art.
    expect(back?.getAttribute('aria-hidden')).toBe('true')
    fireEvent.click(
      screen.getByRole('button', { name: /flip to see the record of oversized tee/i }),
    )
    expect(back?.getAttribute('aria-hidden')).toBe('false')
    fireEvent.click(screen.getByRole('button', { name: /flip back to the card art/i }))
    expect(back?.getAttribute('aria-hidden')).toBe('true')
  })
})
