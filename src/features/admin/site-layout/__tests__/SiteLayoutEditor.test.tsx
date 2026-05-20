/**
 * @vitest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { SiteLayoutEditor } from '../SiteLayoutEditor'

const saveAsync = vi.fn()
const layout = createDefaultWebsiteLayout()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@/features/admin/drops/drops.service', () => ({
  ensureDropSystemHydrated: vi.fn(),
  getActiveDrop: () => ({ title: 'The Oath', slug: 'the-oath' }),
}))

vi.mock('@/features/admin/website-layout/websiteLayout.service', () => ({
  getWebsiteLayoutContent: () => layout,
  getWebsiteLayoutSaveError: () => null,
  saveWebsiteLayoutContentAsync: (...args: unknown[]) => saveAsync(...args),
}))

vi.mock('@/shared/components/ui/MediaPickerField', () => ({
  MediaPickerField: ({ label }: { label: string }) => (
    <div data-testid={`media-${label}`} />
  ),
}))

describe('SiteLayoutEditor', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(layout)
  })

  it('renders layout tabs and switches active panel', async () => {
    const user = userEvent.setup()
    render(<SiteLayoutEditor />)

    expect(screen.getByRole('tab', { name: 'Header' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Footer' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Announcement' })).toBeTruthy()

    expect(screen.getByText('Header & navigation')).toBeTruthy()

    await user.click(screen.getByRole('tab', { name: 'Footer' }))
    expect(screen.getByText('Footer groups')).toBeTruthy()
    expect(screen.queryByText('Header & navigation')).toBeNull()

    await user.click(screen.getByRole('tab', { name: 'Announcement' }))
    expect(screen.getByText('Announcement bar')).toBeTruthy()
  })

  it('shows preview nav labels and saves layout', async () => {
    const user = userEvent.setup()
    render(<SiteLayoutEditor />)

    const preview = screen.getByTestId('site-layout-preview')
    const nav = within(preview).getByTestId('site-layout-preview-nav')
    expect(within(nav).getByText('The Oath')).toBeTruthy()

    await user.click(screen.getByRole('button', { name: /save layout/i }))
    expect(saveAsync).toHaveBeenCalledWith(layout)
  })
})
