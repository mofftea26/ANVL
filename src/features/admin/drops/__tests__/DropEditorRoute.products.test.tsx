/**
 * @vitest-environment jsdom
 */
import type { ReactNode } from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Drop } from '@/features/admin/drops/drops.types'
import { DropEditorRoute } from '@/features/admin/drops/DropEditorRoute'
import {
  DEFAULT_OATH_DROP_ID,
  createDefaultTheOathDrop,
} from '@/features/admin/drops/drops.defaults'
import type { AdminProduct } from '@/features/admin/products/products.types'
import { createDefaultWebsiteLayout } from '@/features/admin/website-layout/websiteLayout.defaults'
import { AdminPageActionsProvider } from '@/features/admin/components/AdminPageActionsContext'

const mockDropsState = vi.hoisted(() => ({
  drops: [] as Drop[],
}))

const mockCatalogState = vi.hoisted(() => ({
  products: [] as AdminProduct[],
}))

vi.mock('@/features/admin/drops/useDrops', () => ({
  useDropsList: () => mockDropsState.drops,
}))

vi.mock('@/features/admin/drops/useDropLiveOnStorefront', () => ({
  useDropLiveOnStorefront: (
    _dropId: string | undefined,
    localIsActive: boolean,
  ) => localIsActive,
}))

vi.mock('@/features/admin/products/useAdminProducts', () => ({
  useAdminProductsList: () => mockCatalogState.products,
}))

vi.mock('@/features/admin/website-layout/useWebsiteLayout', () => ({
  useWebsiteLayout: () => createDefaultWebsiteLayout(),
}))

vi.mock('@/features/admin/hooks/useSaveSuccessFlash', () => ({
  useSaveSuccessFlash: () => ({ showSuccess: false, flashSuccess: vi.fn() }),
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
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string
    children?: ReactNode
    className?: string
    [key: string]: unknown
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  useNavigate: () => vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

function minimalCatalogProduct(overrides: Partial<AdminProduct> = {}): AdminProduct {
  const base = {
    id: 'prod-test-1',
    slug: 'test-piece',
    name: 'Forged compression sleeve long name for truncation smoke',
    shortDescription: '',
    description: '',
    price: 89,
    isOnSale: false,
    status: 'active' as const,
    isActive: true,
    currency: 'USD',
    sourceType: 'individual' as const,
    category: 'tops',
    tags: [],
    colors: [
      {
        id: 'c1',
        name: 'Black',
        hex: '#111111',
        images: [
          {
            id: 'i1',
            url: '/test-preview.svg',
            alt: '',
            isPrimary: true,
            sortOrder: 0,
          },
        ],
      },
    ],
    sizes: [{ id: 's1', label: 'M', sortOrder: 0 }],
    availability: [
      {
        colorId: 'c1',
        sizeId: 's1',
        stockQuantity: 10,
        reservedQuantity: 0,
        isAvailable: true,
      },
    ],
    dropIds: [],
    details: {},
    seo: {},
    createdAt: '2026-05-18T00:00:00.000Z',
    updatedAt: '2026-05-18T00:00:00.000Z',
  }
  return { ...base, ...overrides } as AdminProduct
}

function renderDropEditor(ui: ReactNode) {
  return render(<AdminPageActionsProvider>{ui}</AdminPageActionsProvider>)
}

describe('DropEditorRoute Products tab', () => {
  beforeEach(() => {
    mockDropsState.drops = [createDefaultTheOathDrop()]
    mockCatalogState.products = [minimalCatalogProduct()]
  })

  it('renders catalog roster with price and listing badges (smoke)', async () => {
    const user = userEvent.setup()
    renderDropEditor(<DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />)

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^products$/i })).toBeTruthy()
    })

    await user.click(screen.getByRole('tab', { name: /^products$/i }))

    const card = await screen.findByRole('heading', {
      name: /products in this drop/i,
    })
    const region = card.closest('section')
    expect(region).toBeTruthy()
    const roster = within(region!)

    expect(
      roster.getByRole('checkbox', {
        name: /forged compression sleeve long name for truncation smoke/i,
      }),
    ).toBeTruthy()
    expect(roster.getByText('$89')).toBeTruthy()
    expect(roster.getAllByText(/^active$/i).length).toBe(2)
    expect(
      roster.getByRole('img', {
        name: /forged compression sleeve long name for truncation smoke preview — black/i,
      }),
    ).toHaveAttribute('src', '/test-preview.svg')
  })

  it('RTL: roster checkbox stays usable (smoke)', async () => {
    const user = userEvent.setup()
    renderDropEditor(
      <div dir="rtl" lang="ar">
        <DropEditorRoute dropId={DEFAULT_OATH_DROP_ID} />
      </div>,
    )

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: /^products$/i })).toBeTruthy()
    })

    await user.click(screen.getByRole('tab', { name: /^products$/i }))

    const cb = (await screen.findByRole('checkbox', {
      name: /forged compression sleeve long name for truncation smoke/i,
    })) as HTMLInputElement
    expect(cb.checked).toBe(false)
    await user.click(cb)
    expect(cb.checked).toBe(true)
  })
})
