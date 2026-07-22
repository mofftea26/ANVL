/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ABOUT_DEFAULT_CONTENT } from '@/features/about/content/aboutContent.defaults'
import type { AboutLandingContent } from '@/features/about/content/aboutContent.schema'
import {
  clearPreviewDraft,
  readPreviewDraftPayload,
} from '@/features/admin/preview/adminPreviewStore'
import { AboutSetupWizard } from '../AboutSetupWizard'

const saveSlice = vi.fn()
const saveAssets = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode; [k: string]: unknown }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/cms/landingContent/landingContent.settings', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    readLandingContentFromStorage: () => ({}),
    saveLandingContentSliceAsync: (...args: unknown[]) => saveSlice(...args),
  }
})

vi.mock('@/features/cms/config/cmsSiteConfig.settings', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    saveAssetConfigAsync: (...args: unknown[]) => saveAssets(...args),
  }
})

vi.mock('@/features/admin/media/useMediaAssetsQuery', () => ({
  useMediaAssetsQuery: () => ({ data: [] }),
}))

function renderWizard(onClose: () => void = () => {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <AboutSetupWizard open onClose={onClose} />
    </QueryClientProvider>,
  )
}

describe('AboutSetupWizard', () => {
  beforeEach(() => {
    saveSlice.mockReset()
    saveSlice.mockResolvedValue(undefined)
    saveAssets.mockReset()
    saveAssets.mockResolvedValue(undefined)
    clearPreviewDraft('landingContent')
    clearPreviewDraft('assetConfig')
  })

  it('appends an orb via Add orb and persists it to the about slice on save', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /2\. Orbs/i }))
    // New orb cards carry an explicit placeholder identity.
    await user.click(screen.getByRole('button', { name: /Add orb/i }))
    expect(screen.getAllByText(/New orb/).length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: /Save orbs/i }))

    await waitFor(() => expect(saveSlice).toHaveBeenCalledTimes(1))
    const [key, slice] = saveSlice.mock.calls[0] as [string, AboutLandingContent]
    expect(key).toBe('about')
    // Default orb count + the appended blank orb — the CMS now owns the list.
    expect(slice.orbs).toHaveLength(ABOUT_DEFAULT_CONTENT.orbs.length + 1)
  })

  it('guards a dirty close with Save / Discard / Continue editing and saves through', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWizard(onClose)

    // Dirty the hero step.
    await user.type(screen.getByPlaceholderText(ABOUT_DEFAULT_CONTENT.hero.headline), 'Reforged')

    // Close via the modal backdrop → choice dialog instead of closing.
    await user.click(screen.getAllByRole('button', { name: 'Close modal backdrop' })[0]!)
    expect(onClose).not.toHaveBeenCalled()
    // Heading role — the dirty step also shows an "Unsaved changes" hint text.
    expect(screen.getByRole('heading', { name: 'Unsaved changes' })).toBeInTheDocument()

    // Continue editing aborts.
    await user.click(screen.getByRole('button', { name: 'Continue editing' }))
    expect(screen.queryByRole('heading', { name: 'Unsaved changes' })).not.toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()

    // Close again → Save persists the step, then the close proceeds.
    await user.click(screen.getAllByRole('button', { name: 'Close modal backdrop' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(saveSlice).toHaveBeenCalledTimes(1)
  })

  it('discards dirty edits when asked and closes without saving', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWizard(onClose)

    await user.type(screen.getByPlaceholderText(ABOUT_DEFAULT_CONTENT.hero.headline), 'X')
    await user.click(screen.getAllByRole('button', { name: 'Close modal backdrop' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    expect(saveSlice).not.toHaveBeenCalled()
  })

  it('closes without a dialog when nothing is dirty', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderWizard(onClose)

    await user.click(screen.getAllByRole('button', { name: 'Close modal backdrop' })[0]!)
    expect(screen.queryByRole('heading', { name: 'Unsaved changes' })).not.toBeInTheDocument()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('pushes unsaved hero edits into the live-preview draft channel', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.type(
      screen.getByPlaceholderText(ABOUT_DEFAULT_CONTENT.hero.headline),
      'Live headline',
    )

    await waitFor(() => {
      const payload = readPreviewDraftPayload()
      const about = payload.landingContent?.about as AboutLandingContent | undefined
      expect(about?.hero?.headline).toBe('Live headline')
    })
  })
})
