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
}))

import { ArmoryFeats } from '@/features/storefront-account/account/panels/armory/ArmoryFeats'

describe('ArmoryFeats', () => {
  beforeEach(() => {
    state.feats = []
    state.create = vi.fn()
    state.update = vi.fn()
    state.remove = vi.fn()
  })

  it('shows the empty state until a feat is logged', () => {
    render(<ArmoryFeats />)
    expect(screen.getByText(/no feats logged yet/i)).toBeTruthy()
  })

  it('opens the form and submits a new feat with its visibility', () => {
    render(<ArmoryFeats />)
    fireEvent.click(screen.getByRole('button', { name: /log a feat/i }))

    fireEvent.change(screen.getByLabelText(/the feat/i), {
      target: { value: 'Deadlift PR — 240 kg' },
    })
    // Default private → flip to public.
    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(screen.getByRole('button', { name: /add feat/i }))

    expect(state.create).toHaveBeenCalledTimes(1)
    const [input] = state.create.mock.calls[0]!
    expect(input.title).toBe('Deadlift PR — 240 kg')
    expect(input.isPublic).toBe(true)
    expect(input.achievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('does not submit a blank feat', () => {
    render(<ArmoryFeats />)
    fireEvent.click(screen.getByRole('button', { name: /log a feat/i }))
    const submit = screen.getByRole('button', { name: /add feat/i }) as HTMLButtonElement
    expect(submit.disabled).toBe(true)
    fireEvent.click(submit)
    expect(state.create).not.toHaveBeenCalled()
  })

  it('edits an existing feat', () => {
    state.feats = [
      { id: 'f1', title: 'Squat PR', achievedOn: '2026-07-01', isPublic: false },
    ]
    render(<ArmoryFeats />)
    fireEvent.click(screen.getByRole('button', { name: /edit feat: squat pr/i }))

    const input = screen.getByLabelText(/the feat/i) as HTMLInputElement
    expect(input.value).toBe('Squat PR')
    fireEvent.change(input, { target: { value: 'Squat PR — 200 kg' } })
    fireEvent.click(screen.getByRole('button', { name: /^save$/i }))

    expect(state.update).toHaveBeenCalledTimes(1)
    const [payload] = state.update.mock.calls[0]!
    expect(payload).toMatchObject({ id: 'f1', title: 'Squat PR — 200 kg' })
  })

  it('deletes a feat', () => {
    state.feats = [{ id: 'f2', title: 'Bench PR', achievedOn: '2026-07-02', isPublic: true }]
    render(<ArmoryFeats />)
    fireEvent.click(screen.getByRole('button', { name: /delete feat: bench pr/i }))
    expect(state.remove).toHaveBeenCalledWith('f2')
  })
})
