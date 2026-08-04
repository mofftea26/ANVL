import { describe, expect, it, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { ArmoryFeat } from '@/features/passport/schemas/passport.schema'

const state: {
  feats: ArmoryFeat[]
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
} = { feats: [], create: vi.fn(), update: vi.fn(), remove: vi.fn() }

vi.mock('@/features/passport/hooks/useArmory', () => ({
  useArmoryFeatsQuery: () => ({ data: state.feats }),
  useFeatMutations: () => ({
    create: { mutate: state.create, isPending: false },
    update: { mutate: state.update, isPending: false },
    remove: { mutate: state.remove, isPending: false },
  }),
  // The rows carry a share button, so the launcher's share-state hooks are
  // part of this component's surface now.
  useArmoryShareQuery: () => ({ data: { isPublic: true, handle: 'george' } }),
  useSetArmoryShareMutation: () => ({ mutate: vi.fn(), isPending: false }),
}))

import { PieceFeats } from '@/features/storefront-account/account/panels/armory/PieceFeats'

function feat(overrides: Partial<ArmoryFeat> = {}): ArmoryFeat {
  return {
    id: 'f1',
    title: 'Squat PR',
    achievedOn: '2026-07-01',
    isPublic: false,
    productSlug: 'oversized-tee',
    ...overrides,
  }
}

describe('PieceFeats (embedded in the product card)', () => {
  beforeEach(() => {
    state.feats = []
    state.create = vi.fn()
    state.update = vi.fn()
    state.remove = vi.fn()
  })

  it('shows only THIS piece’s feats', () => {
    state.feats = [
      feat({ id: 'a', title: 'Tee feat', productSlug: 'oversized-tee' }),
      feat({ id: 'b', title: 'Stringer feat', productSlug: 'stringer' }),
      feat({ id: 'c', title: 'No-piece feat', productSlug: null }),
    ]
    render(<PieceFeats slug="oversized-tee" />)
    expect(screen.getByText('Tee feat')).toBeTruthy()
    expect(screen.queryByText('Stringer feat')).toBeNull()
    expect(screen.queryByText('No-piece feat')).toBeNull()
  })

  it('logs a new feat pre-assigned to the card’s piece (no picker)', () => {
    render(<PieceFeats slug="oversized-tee" />)
    expect(screen.getByText(/no feats in this piece yet/i)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: /log a feat in this piece/i }))
    fireEvent.change(screen.getByLabelText(/the feat/i), {
      target: { value: 'Deadlift PR — 240 kg' },
    })
    fireEvent.click(screen.getByRole('switch')) // private → public
    fireEvent.click(screen.getByRole('button', { name: /^add$/i }))

    expect(state.create).toHaveBeenCalledTimes(1)
    const [input] = state.create.mock.calls[0]!
    expect(input).toMatchObject({
      title: 'Deadlift PR — 240 kg',
      isPublic: true,
      productSlug: 'oversized-tee',
    })
    expect(input.achievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not submit a blank feat', () => {
    render(<PieceFeats slug="oversized-tee" />)
    fireEvent.click(screen.getByRole('button', { name: /log a feat in this piece/i }))
    const submit = screen.getByRole('button', { name: /^add$/i }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
    expect(state.create).not.toHaveBeenCalled()
  })

  it('edits keeping the piece assignment', () => {
    state.feats = [feat()]
    render(<PieceFeats slug="oversized-tee" />)
    fireEvent.click(screen.getByRole('button', { name: /edit feat: squat pr/i }))
    const input = screen.getByLabelText(/the feat/i) as HTMLInputElement
    expect(input.value).toBe('Squat PR')
    fireEvent.change(input, { target: { value: 'Squat PR — 200 kg' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))
    expect(state.update).toHaveBeenCalledTimes(1)
    expect(state.update.mock.calls[0]![0]).toMatchObject({
      id: 'f1',
      title: 'Squat PR — 200 kg',
      productSlug: 'oversized-tee',
    })
  })

  it('deletes a feat', () => {
    state.feats = [feat({ id: 'f2', title: 'Bench PR' })]
    render(<PieceFeats slug="oversized-tee" />)
    fireEvent.click(screen.getByRole('button', { name: /delete feat: bench pr/i }))
    expect(state.remove).toHaveBeenCalledWith('f2')
  })
})
