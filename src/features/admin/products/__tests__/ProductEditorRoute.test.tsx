/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'
import { createEmptyAdminProduct } from '@/features/admin/products/products.defaults'
import { ProductEditorRoute } from '../ProductEditorRoute'

const sampleProduct = createEmptyAdminProduct('2026-01-01T00:00:00.000Z')
sampleProduct.id = 'prod-test-1'
sampleProduct.name = 'Compression tee'

const upsertMock = vi.fn()
const persistLinksMock = vi.fn()
const deleteMock = vi.fn()
const flashSuccessMock = vi.fn()

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: flashSuccessMock }),
}))

vi.mock('@/features/admin/products/useAdminProducts', () => ({
  useAdminProductById: (id: string) =>
    id === sampleProduct.id ? sampleProduct : undefined,
}))

vi.mock('@/features/admin/drops/useDrops', () => ({
  useDropsList: () => [],
}))

vi.mock('@/features/admin/products/products.service', () => ({
  deleteAdminProduct: (...args: unknown[]) => deleteMock(...args),
  deriveSourceType: () => 'individual',
  upsertAdminProduct: (...args: unknown[]) => upsertMock(...args),
}))

vi.mock('@/features/admin/drops/drops.service', () => ({
  detachProductFromAllDrops: vi.fn(),
  persistProductDropLinks: (...args: unknown[]) => persistLinksMock(...args),
}))

vi.mock('@/features/admin/components/AdminLayout', async () => {
  const { useAdminPageActionsSlot } = await import(
    '@/features/admin/components/AdminPageActionsContext'
  )
  function LayoutProbe({ title }: { title?: string }) {
    const actions = useAdminPageActionsSlot()
    return (
      <header data-testid="layout-header-probe">
        <h1>{title}</h1>
        <div data-testid="admin-page-actions">{actions}</div>
      </header>
    )
  }
  return {
    AdminLayout: ({
      children,
      title,
    }: {
      children?: ReactNode
      title?: string
    }) => (
      <div data-testid="admin-layout-stub">
        <LayoutProbe title={title} />
        {children}
      </div>
    ),
  }
})

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
}))

vi.mock('@/features/admin/components/AdminForgedLink', () => ({
  AdminForgedLink: ({
    to,
    children,
    className,
  }: {
    to: string
    children?: ReactNode
    className?: string
  }) => (
    <a href={to} className={className}>
      {children}
    </a>
  ),
}))

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

function renderProductEditor() {
  return render(
    <AdminPageActionsProvider>
      <ProductEditorRoute productId={sampleProduct.id} />
    </AdminPageActionsProvider>,
  )
}

describe('ProductEditorRoute topbar actions', () => {
  beforeEach(() => {
    upsertMock.mockReset()
    persistLinksMock.mockReset()
    deleteMock.mockReset()
  })

  it('registers Catalog, Save, and Delete in the admin topbar actions slot', async () => {
    const user = userEvent.setup()
    renderProductEditor()

    const actions = within(screen.getByTestId('admin-page-actions'))
    expect(actions.getByRole('link', { name: /catalog/i })).toHaveAttribute(
      'href',
      '/admin/products',
    )
    expect(actions.getByRole('button', { name: /save product/i })).toBeTruthy()
    expect(actions.getByRole('button', { name: /delete product/i })).toBeTruthy()

    await user.click(actions.getByRole('button', { name: /save product/i }))
    expect(upsertMock).toHaveBeenCalled()
    expect(persistLinksMock).toHaveBeenCalled()
  })

  it('does not duplicate save controls in the page body', () => {
    renderProductEditor()

    expect(screen.getAllByRole('button', { name: /save product/i })).toHaveLength(1)
    expect(screen.queryByRole('button', { name: /^save$/i })).toBeNull()
  })
})
