/**
 * @vitest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BannerCustomizeModal } from '@/features/admin/banner/BannerCustomizeModal'
import {
  DEFAULT_BANNER_CONFIG,
  parseBannerConfig,
  type BannerConfig,
} from '@/features/cms/banner/bannerConfig.zod'

const { saveBannerConfigAsync } = vi.hoisted(() => ({
  saveBannerConfigAsync: vi.fn(async (_config: unknown) => {}),
}))

vi.mock('@/features/cms/banner/bannerConfig.settings', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('@/features/cms/banner/bannerConfig.settings')
    >()
  return { ...actual, saveBannerConfigAsync }
})

// The media library query needs a QueryClient + Supabase — irrelevant here.
vi.mock('@/features/admin/media/useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({ data: [] }),
}))

function seedStoredConfig(overrides: Partial<BannerConfig> = {}) {
  const config = parseBannerConfig({ ...DEFAULT_BANNER_CONFIG, ...overrides })
  window.localStorage.setItem('anvl.bannerConfig.v1', JSON.stringify(config))
  return config
}

describe('BannerCustomizeModal', () => {
  beforeEach(() => {
    window.localStorage.clear()
    saveBannerConfigAsync.mockClear()
  })

  it('pre-sets enabled from the switch-ON overrides without persisting anything', async () => {
    render(
      <BannerCustomizeModal
        open
        onClose={() => {}}
        initialOverrides={{ enabled: true }}
      />,
    )

    const enable = await screen.findByRole('checkbox', {
      name: /enable the banner/i,
    })
    expect(enable).toBeChecked()
    // Nothing persists until the explicit Save.
    expect(saveBannerConfigAsync).not.toHaveBeenCalled()
    expect(window.localStorage.getItem('anvl.bannerConfig.v1')).toBeNull()
  })

  it('edits a field and saves the full working copy through saveBannerConfigAsync', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(
      <BannerCustomizeModal
        open
        onClose={onClose}
        initialOverrides={{ enabled: true }}
      />,
    )

    await user.type(
      screen.getByRole('textbox', { name: /message/i }),
      'Forged Under Pressure',
    )
    await user.click(screen.getByRole('button', { name: 'Save banner' }))

    await waitFor(() => expect(saveBannerConfigAsync).toHaveBeenCalledTimes(1))
    const saved = saveBannerConfigAsync.mock.calls[0][0] as BannerConfig
    expect(saved.enabled).toBe(true)
    expect(saved.message).toBe('Forged Under Pressure')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('renders the live mini preview from the unsaved working copy', async () => {
    const user = userEvent.setup()
    render(<BannerCustomizeModal open onClose={() => {}} />)

    expect(
      screen.getByText(/add a message to preview the banner/i),
    ).toBeInTheDocument()

    await user.type(
      screen.getByRole('textbox', { name: /message/i }),
      'Preview me',
    )
    const strip = document.querySelector('[data-anvl-banner-strip]')
    expect(strip).not.toBeNull()
    expect(strip!.textContent).toContain('Preview me')
  })

  it('closing while dirty prompts, Stay keeps the modal, Leave discards', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    seedStoredConfig()
    render(
      <BannerCustomizeModal
        open
        onClose={onClose}
        initialOverrides={{ enabled: true }}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getByText('Discard banner changes?')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Stay' }))
    expect(screen.queryByText('Discard banner changes?')).toBeNull()
    expect(
      screen.getByRole('checkbox', { name: /enable the banner/i }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Leave' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(saveBannerConfigAsync).not.toHaveBeenCalled()
  })

  it('closes without prompting when nothing changed', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    seedStoredConfig()
    render(<BannerCustomizeModal open onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByText('Discard banner changes?')).toBeNull()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
