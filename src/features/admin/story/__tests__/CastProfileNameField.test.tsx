/**
 * @vitest-environment jsdom
 */
import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_GAMIFICATION_RULES } from '@/features/passport/schemas/gamification.schema'
import { CastProfileNameField } from '../CastProfileNameField'

const search = vi.fn()

vi.mock('@/features/admin/api/searchAdminProfiles', () => ({
  searchAdminProfiles: (...args: unknown[]) => search(...args),
}))

vi.mock('@/features/admin/gamification/gamification.service', () => ({
  loadGamificationRules: () => Promise.resolve(DEFAULT_GAMIFICATION_RULES),
}))

// The query key lives in AdminGamificationPage; mock the module so the test
// doesn't pull the whole admin gamification page (lazy tabs etc.) into jsdom.
vi.mock('@/features/admin/gamification/AdminGamificationPage', () => ({
  ADMIN_GAMIFICATION_RULES_QUERY_KEY: ['admin', 'gamification', 'rules'],
}))

function renderField(overrides?: {
  onProfileSelect?: (s: { name: string; rank: string }) => void
  onNameChange?: (n: string) => void
}) {
  const onProfileSelect = overrides?.onProfileSelect ?? vi.fn()
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  function Harness() {
    const [name, setName] = useState('')
    return (
      <CastProfileNameField
        name={name}
        onNameChange={(next) => {
          setName(next)
          overrides?.onNameChange?.(next)
        }}
        onProfileSelect={(snapshot) => {
          setName(snapshot.name)
          onProfileSelect(snapshot)
        }}
      />
    )
  }

  render(
    <QueryClientProvider client={queryClient}>
      <Harness />
    </QueryClientProvider>,
  )
  return { onProfileSelect }
}

describe('CastProfileNameField', () => {
  beforeEach(() => {
    search.mockReset()
  })

  it('searches profiles and snapshots name + derived rank on selection', async () => {
    search.mockResolvedValue({
      ok: true,
      hits: [
        {
          userId: 'u1',
          fullName: 'Jad Haddad',
          armoryHandle: 'jad',
          armoryPublic: true,
          avatarUrl: 'https://cdn.example.com/jad.jpg',
          claimCount: 6,
        },
      ],
    })
    const user = userEvent.setup()
    const { onProfileSelect } = renderField()

    await user.type(screen.getByRole('combobox'), 'jad')
    await waitFor(() => expect(search).toHaveBeenCalledWith('jad'))

    const option = await screen.findByText('Jad Haddad')
    // The search RPC exposes only `claim_count`, so XP is estimated from
    // registrations alone: 6 x 250 = 1500 XP, which lands in Forged II
    // (1250..1624) on the v2 ladder. Under-stating is intended here — a real
    // athlete's wears and feats would push them higher.
    expect(screen.getByText(/6 pieces registered · Forged II/)).toBeInTheDocument()

    await user.pointer({ keys: '[MouseLeft]', target: option })
    await waitFor(() =>
      expect(onProfileSelect).toHaveBeenCalledWith({
        name: 'Jad Haddad',
        rank: 'Forged II',
        userId: 'u1',
        avatarUrl: 'https://cdn.example.com/jad.jpg',
        armoryHandle: 'jad',
      }),
    )
  })

  it('keeps free text via the explicit escape option', async () => {
    search.mockResolvedValue({ ok: true, hits: [] })
    const user = userEvent.setup()
    const { onProfileSelect } = renderField()

    await user.type(screen.getByRole('combobox'), 'The Smith')
    await screen.findByText('No matching athletes.')

    await user.pointer({
      keys: '[MouseLeft]',
      target: screen.getByText(/Use “The Smith” as free text/),
    })
    expect(onProfileSelect).not.toHaveBeenCalled()
    expect(screen.getByRole('combobox')).toHaveValue('The Smith')
  })

  it('surfaces search errors inside the listbox', async () => {
    search.mockResolvedValue({ ok: false, error: 'Sign in to search athletes.' })
    const user = userEvent.setup()
    renderField()

    await user.type(screen.getByRole('combobox'), 'jad')
    expect(await screen.findByText('Sign in to search athletes.')).toBeInTheDocument()
  })
})
