import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'

import { DropAdminListCard } from '@/features/admin/drops/DropAdminListCard'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
    ...rest
  }: {
    to: string
    params?: { dropId?: string }
    children?: React.ReactNode
    [key: string]: unknown
  }) => {
    let href = to
    if (params?.dropId) href = `/admin/drops/${params.dropId}`
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    )
  },
}))

const BASE_ROW: AdminDropListItem = {
  id: 'drop-test',
  slug: 'oath-slug',
  title: 'The Oath',
  name: 'TEST',
  dropNumber: '60',
  status: 'active',
  isActive: true,
  productCount: 4,
  releaseDate: '2026-05-01T12:00:00.000Z',
  scheduledActivationAt: undefined,
  updatedAt: '2026-05-10T12:00:00.000Z',
  createdAt: '2026-04-01T10:00:00.000Z',
}

const noop = () => {}

function renderCard(row: AdminDropListItem) {
  return render(
    <DropAdminListCard
      row={row}
      busy={false}
      onActivate={noop}
      onSchedule={noop}
      onPreview={noop}
      onDelete={noop}
      onDuplicate={noop}
    />,
  )
}

describe('DropAdminListCard', () => {
  it('renders campaign title, slug line, live badge, and metadata', () => {
    renderCard(BASE_ROW)

    expect(screen.getByRole('heading', { name: /^TEST$/i })).toBeTruthy()
    expect(screen.getByText(/Drop 60/i)).toBeTruthy()
    expect(screen.getByText(/\/drop\/oath-slug/)).toBeTruthy()
    expect(screen.getByText(/4 pieces/i)).toBeTruthy()
    expect(screen.getByText(/^live$/i)).toBeTruthy()
    expect(screen.queryByText(/storefront drop/i)).toBeNull()
    expect(screen.getByText(/release/i)).toBeTruthy()
    expect(screen.getByText(/last edited/i)).toBeTruthy()
  })

  it('shows CMS status when the drop is not live on storefront', () => {
    renderCard({ ...BASE_ROW, isActive: false, status: 'inactive' })

    expect(screen.getByText(/^inactive$/i)).toBeTruthy()
    expect(screen.queryByText(/^live$/i)).toBeNull()
  })

  it('renders a decorative emblem watermark when emblemImageUrl is set', () => {
    const { container } = renderCard({
      ...BASE_ROW,
      emblemImageUrl: '/public/drops/oath-emblem.svg',
      themeAccent: '#c8ff4d',
    })

    const card = screen.getByTestId('drop-admin-list-card')
    const emblem = card.querySelector('img[src="/public/drops/oath-emblem.svg"]')
    expect(emblem).toBeTruthy()
    expect(emblem?.getAttribute('alt')).toBe('')
    expect(emblem?.closest('[aria-hidden="true"]')).toBeTruthy()
    expect(container.querySelector('section[data-drop-id="drop-test"]')).toBeTruthy()
  })

  it('omits the emblem image when emblemImageUrl is absent', () => {
    renderCard({ ...BASE_ROW, emblemImageUrl: undefined })

    const card = screen.getByTestId('drop-admin-list-card')
    expect(card.querySelector('img')).toBeNull()
  })
})
