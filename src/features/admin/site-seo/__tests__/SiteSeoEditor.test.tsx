/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defaultSiteSeoContent } from '@/features/cms/siteSeo.local'
import { SiteSeoEditor } from '../SiteSeoEditor'

const saveAsync = vi.fn()
const siteSeo = defaultSiteSeoContent()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/cms/siteSeo.local', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/features/cms/siteSeo.local')>()
  return {
    ...actual,
    getSiteSeoContent: () => siteSeo,
    saveSiteSeoContentAsync: (...args: unknown[]) => saveAsync(...args),
  }
})

vi.mock('@/shared/components/ui/MediaPickerField', () => ({
  MediaPickerField: ({ label }: { label: string }) => (
    <div data-testid={`media-${label}`} />
  ),
}))

describe('SiteSeoEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(siteSeo)
  })

  it('renders SEO tabs and switches active panel', async () => {
    const user = userEvent.setup()
    render(<SiteSeoEditor />)

    expect(screen.getByRole('tab', { name: 'Defaults' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Pages' })).toBeTruthy()
    expect(screen.getByText('Global defaults')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Pages' }))
    expect(screen.getByText('Static pages')).toBeTruthy()
    expect(screen.queryByText('Global defaults')).toBeNull()
  })

  it('saves site SEO via saveSiteSeoContentAsync', async () => {
    const user = userEvent.setup()
    render(<SiteSeoEditor />)

    await user.click(screen.getByRole('button', { name: /save seo/i }))
    expect(saveAsync).toHaveBeenCalledWith(siteSeo)
  })
})
