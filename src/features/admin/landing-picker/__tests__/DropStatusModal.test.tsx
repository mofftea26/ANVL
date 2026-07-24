/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { DropStatusModal } from '@/features/admin/landing-picker/DropStatusModal'
import { ActiveDropTile } from '@/features/admin/setup/ActiveDropTile'

const { saveActiveLandingPageKeyAsync, afterLocalCmsMutation } = vi.hoisted(() => ({
  saveActiveLandingPageKeyAsync: vi.fn(async (key: string) => ({
    key,
    updatedAt: new Date().toISOString(),
  })),
  afterLocalCmsMutation: vi.fn(async () => ({ ok: true as const })),
}))

vi.mock('@/features/cms/landingPageActiveKey.settings', () => ({
  readActiveLandingPageFromStorage: () => ({
    key: 'the-oath',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }),
  subscribeActiveLandingPageChange: () => () => {},
  saveActiveLandingPageKeyAsync,
}))

// Banner + Coming Soon saves stay REAL (jsdom localStorage) — only the
// Supabase write-through is stubbed out.
vi.mock('@/features/admin/cmsRemote/cmsWriteThrough', () => ({
  afterLocalCmsMutation,
}))

// The customize modal's media library query needs a QueryClient + Supabase.
vi.mock('@/features/admin/media/useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({ data: [] }),
}))

vi.mock('@/features/admin/landing-picker/fetchLandingPagePickerOptions', () => ({
  fetchLandingPagePickerOptions: async () => [
    {
      key: 'the-oath',
      name: 'The Oath',
      description: 'Drop 01',
      previewImage: '',
      isAvailable: true,
    },
    {
      key: 'iron-hymn',
      name: 'Iron Hymn',
      description: 'Drop 02',
      previewImage: 'https://example.com/iron-hymn.jpg',
      isAvailable: true,
    },
  ],
}))

describe('ActiveDropTile → DropStatusModal', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveActiveLandingPageKeyAsync.mockClear()
    afterLocalCmsMutation.mockClear()
  })

  it('opens the drop status modal from the dashboard tile', async () => {
    const user = userEvent.setup()
    render(<ActiveDropTile />)

    await user.click(screen.getByRole('button', { name: /active drop/i }))

    expect(await screen.findByTestId('drop-status-modal')).toBeInTheDocument()
    expect(await screen.findByText('Iron Hymn')).toBeInTheDocument()
  })

  it('lists every drop with an ACTIVE badge on the live one', async () => {
    render(<DropStatusModal open onClose={() => {}} />)

    const oathCard = (await screen.findByText('The Oath')).closest('button')!
    expect(within(oathCard).getByText('Active')).toBeInTheDocument()

    const hymnCard = (await screen.findByText('Iron Hymn')).closest('button')!
    expect(within(hymnCard).queryByText('Active')).toBeNull()
  })

  it('activates a drop only after the confirm dialog', async () => {
    const user = userEvent.setup()
    const onActivated = vi.fn()
    render(<DropStatusModal open onClose={() => {}} onActivated={onActivated} />)

    await user.click((await screen.findByText('Iron Hymn')).closest('button')!)
    expect(saveActiveLandingPageKeyAsync).not.toHaveBeenCalled()

    // Confirm dialog announces publish-on-save.
    expect(screen.getByText(/save is\s+publish/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Activate' }))

    await waitFor(() => {
      expect(saveActiveLandingPageKeyAsync).toHaveBeenCalledWith('iron-hymn')
      expect(onActivated).toHaveBeenCalledTimes(1)
    })
  })

  it('cancelling the confirm dialog fires no save', async () => {
    const user = userEvent.setup()
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click((await screen.findByText('Iron Hymn')).closest('button')!)
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(saveActiveLandingPageKeyAsync).not.toHaveBeenCalled()
  })

  it('toggling Coming Soon writes the config blob only after the confirm dialog', async () => {
    const user = userEvent.setup()
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click(await screen.findByRole('switch', { name: /coming soon/i }))

    // Flipping the switch opens a confirm — nothing is written yet.
    expect(screen.getByText(/every visitor to the public storefront/i)).toBeInTheDocument()
    expect(window.localStorage.getItem('anvl.comingSoon.v1')).toBeNull()
    expect(afterLocalCmsMutation).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Turn on Coming Soon' }))

    await waitFor(() => {
      const raw = window.localStorage.getItem('anvl.comingSoon.v1')
      expect(raw).toBeTruthy()
      expect((JSON.parse(raw!) as { enabled: boolean }).enabled).toBe(true)
    })
    expect(afterLocalCmsMutation).toHaveBeenCalledWith(['coming_soon'])
  })

  it('cancelling the Coming Soon confirm writes nothing', async () => {
    const user = userEvent.setup()
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click(await screen.findByRole('switch', { name: /coming soon/i }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(window.localStorage.getItem('anvl.comingSoon.v1')).toBeNull()
    expect(afterLocalCmsMutation).not.toHaveBeenCalled()
  })

  it('switching the banner ON opens the customize modal with enabled pre-set — nothing persists yet', async () => {
    const user = userEvent.setup()
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click(
      await screen.findByRole('switch', { name: /announcement banner/i }),
    )

    // The (lazy) customize modal opens instead of a direct write.
    expect(await screen.findByTestId('banner-customize-modal')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /enable the banner/i }),
    ).toBeChecked()
    expect(window.localStorage.getItem('anvl.bannerConfig.v1')).toBeNull()
    expect(afterLocalCmsMutation).not.toHaveBeenCalled()

    // Saving in the modal is what persists the enable.
    await user.click(screen.getByRole('button', { name: 'Save banner' }))
    await waitFor(() => {
      const raw = window.localStorage.getItem('anvl.bannerConfig.v1')
      expect(raw).toBeTruthy()
      expect((JSON.parse(raw!) as { enabled: boolean }).enabled).toBe(true)
    })
    expect(afterLocalCmsMutation).toHaveBeenCalledWith(['banner_config'])
  })

  it('switching the banner OFF stays a quick direct toggle', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      'anvl.bannerConfig.v1',
      JSON.stringify({ enabled: true, message: 'Live now' }),
    )
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click(
      await screen.findByRole('switch', { name: /announcement banner/i }),
    )

    await waitFor(() => {
      const raw = window.localStorage.getItem('anvl.bannerConfig.v1')
      expect((JSON.parse(raw!) as { enabled: boolean }).enabled).toBe(false)
    })
    expect(afterLocalCmsMutation).toHaveBeenCalledWith(['banner_config'])
    expect(screen.queryByTestId('banner-customize-modal')).toBeNull()
  })

  it('the Customize button always opens the banner modal without forcing enabled', async () => {
    const user = userEvent.setup()
    render(<DropStatusModal open onClose={() => {}} />)

    await user.click(await screen.findByTestId('banner-customize-button'))

    expect(await screen.findByTestId('banner-customize-modal')).toBeInTheDocument()
    expect(
      screen.getByRole('checkbox', { name: /enable the banner/i }),
    ).not.toBeChecked()
  })
})
