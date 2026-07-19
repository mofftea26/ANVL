/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseLegalContent } from '@/features/cms/legal/legalContent.zod'
import { LegalSetupWizard } from '../LegalSetupWizard'

const saveAsync = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

// The setup steps render TanStack Router <Link>s for their fine-tune deep links;
// stub Link so no router context is needed (mirrors the dashboard test).
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, ...rest }: { to: string; children?: React.ReactNode; [k: string]: unknown }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/features/cms/legal/legalContent.settings', () => ({
  readLegalContentFromStorage: () => parseLegalContent(undefined),
  saveLegalContentAsync: (...args: unknown[]) => saveAsync(...args),
}))

describe('LegalSetupWizard', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(undefined)
  })

  it('inline-saves the edited legal page through the blob', async () => {
    const user = userEvent.setup()
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <LegalSetupWizard open onClose={() => {}} />
      </QueryClientProvider>,
    )

    // Step 1 (Privacy) is active — edit the title, then save.
    const title = screen.getByPlaceholderText('Privacy Policy')
    await user.clear(title)
    await user.type(title, 'Our Privacy Promise')

    await user.click(screen.getByRole('button', { name: /Save Privacy Policy/i }))

    expect(saveAsync).toHaveBeenCalledTimes(1)
    const saved = saveAsync.mock.calls[0][0] as ReturnType<typeof parseLegalContent>
    expect(saved.pages.privacy.title).toBe('Our Privacy Promise')
  })
})
