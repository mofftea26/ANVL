import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { AdminDropListItem } from '@/features/cms/types/adminDrops.types'
import { DropRowOverflowMenu } from '@/features/admin/drops/DropRowOverflowMenu'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    to,
    params,
    children,
  }: {
    to: string
    params?: { dropId?: string }
    children?: React.ReactNode
  }) => {
    let href = to
    if (params?.dropId) href = `/admin/drops/${params.dropId}`
    return <a href={href}>{children}</a>
  },
}))

const ROW: AdminDropListItem = {
  id: 'drop_client-abc',
  slug: 'client-abc',
  title: 'Client ABC',
  name: 'ABC',
  dropNumber: '12',
  status: 'inactive',
  isActive: false,
  productCount: 0,
  releaseDate: undefined,
  scheduledActivationAt: undefined,
  updatedAt: '2026-05-01T00:00:00.000Z',
  createdAt: '2026-05-01T00:00:00.000Z',
}

describe('DropRowOverflowMenu', () => {
  it('links Edit to the admin editor using the list client drop id', async () => {
    const user = userEvent.setup()
    render(
      <DropRowOverflowMenu
        row={ROW}
        busy={false}
        onActivate={vi.fn()}
        onSchedule={vi.fn()}
        onDelete={vi.fn()}
        onDuplicate={vi.fn()}
        onPreview={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: /actions for client abc/i }))
    const edit = await screen.findByRole('link', { name: /edit/i })
    expect(edit.getAttribute('href')).toBe('/admin/drops/drop_client-abc')
  })
})
