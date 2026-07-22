/**
 * @vitest-environment jsdom
 */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { parseSupportContent } from '@/features/cms/support/supportContent.zod'
import { SupportSetupWizard } from '../SupportSetupWizard'

const saveAsync = vi.fn()

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

vi.mock('@/features/cms/support/supportContent.settings', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return {
    ...actual,
    readSupportContentFromStorage: () => parseSupportContent(undefined),
    saveSupportContentAsync: (...args: unknown[]) => saveAsync(...args),
  }
})

vi.mock('@/features/admin/hooks/useAdminProductCatalogQuery', () => ({
  useAdminProductCatalogQuery: () => ({
    data: { items: [{ slug: 'oath-tee', name: 'Oath Tee' }] },
    isLoading: false,
  }),
}))

function renderWizard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <SupportSetupWizard open onClose={() => {}} />
    </QueryClientProvider>,
  )
}

describe('SupportSetupWizard shared components', () => {
  beforeEach(() => {
    saveAsync.mockReset()
    saveAsync.mockResolvedValue(undefined)
  })

  it('renders the shared PhoneInput on the contact step', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /2\. Contact/i }))
    // PhoneInput = country-picker trigger + national-number field.
    expect(
      screen.getByRole('button', { name: /country/i }),
    ).toBeInTheDocument()
    expect(screen.getByPlaceholderText('71 123 456')).toBeInTheDocument()
  })

  it('renders the shared CareSelector on the care step (per-product)', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /5\. Care guide/i }))
    // PerProductCareField: pick the product, then the CareSelector appears.
    expect(screen.getByText('Pick a product to author its care notes.')).toBeInTheDocument()
  })

  it('renders the shared SizeGuideTable on the size step (per-product)', async () => {
    const user = userEvent.setup()
    renderWizard()

    await user.click(screen.getByRole('button', { name: /6\. Size guide/i }))
    expect(screen.getByText('Pick a product to build its size table.')).toBeInTheDocument()
  })
})
